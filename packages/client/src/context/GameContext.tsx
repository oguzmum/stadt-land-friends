import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, ClientToServerEvents, ServerToClientEvents, GameSettings, GamePhase } from '@stadt-land-fluss/shared';

export type AppScreen = 'home' | 'create' | 'join' | 'lobby' | 'reveal' | 'game' | 'voting' | 'scoreboard';

function parseInitialScreen(): { screen: AppScreen; roomCode: string } {
  const match = window.location.pathname.match(/^\/join\/([A-Z0-9]{4,8})$/i);
  if (match) {
    history.replaceState(null, '', '/');
    return { screen: 'join', roomCode: match[1].toUpperCase() };
  }
  return { screen: 'home', roomCode: '' };
}

// Evaluated once at module load — avoids React StrictMode double-invocation bug
const INITIAL = parseInitialScreen();

// ── Persistent player identity ──────────────────────────────

const PLAYER_ID_KEY = 'slf-pid';

function loadPlayerId(): string {
  return localStorage.getItem(PLAYER_ID_KEY) ?? '';
}

function savePlayerId(id: string) {
  localStorage.setItem(PLAYER_ID_KEY, id);
}

function clearPlayerId() {
  localStorage.removeItem(PLAYER_ID_KEY);
}

function phaseToScreen(phase: GamePhase): AppScreen {
  switch (phase) {
    case 'lobby':      return 'lobby';
    case 'playing':    return 'game';
    case 'voting':     return 'voting';
    case 'scoreboard':
    case 'finished':   return 'scoreboard';
    default:           return 'game';
  }
}

// ── Context type ────────────────────────────────────────────

interface GameContextType {
  screen: AppScreen;
  gameState: GameState | null;
  myPlayerId: string | null;
  initialRoomCode: string;
  error: string | null;
  isConnected: boolean;
  // actions
  goTo: (screen: AppScreen) => void;
  leaveGame: () => void;
  createGame: (nickname: string, settings: GameSettings) => void;
  joinGame: (roomCode: string, nickname: string) => void;
  updateSettings: (data: Partial<GameSettings>) => void;
  startGame: () => void;
  skipLetter: () => void;
  submitAnswers: (answers: Record<string, string>) => void;
  markDone: () => void;
  submitVote: (targetPlayerId: string, categoryId: string, accepted: boolean) => void;
  nextCategory: () => void;
  nextRound: () => void;
  playAgain: () => void;
  clearError: () => void;
  finishedNotification: { playerId: string; newEndTime: number; ts: number } | null;
}

const GameContext = createContext<GameContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_SERVER_URL ?? '';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>(INITIAL.screen);
  const [initialRoomCode] = useState(INITIAL.roomCode);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [finishedNotification, setFinishedNotification] = useState<{ playerId: string; newEndTime: number; ts: number } | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const hasLeftRef = useRef(false);

  useEffect(() => {
    // auth callback is invoked on every connection attempt — reads the latest stored ID
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: (cb) => cb({ playerId: loadPlayerId() }),
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('error', ({ message }) => setError(message));

    // Server auto-rejoined us via auth handshake
    socket.on('game-rejoined', ({ gameState, myPlayerId }) => {
      if (hasLeftRef.current) return;
      setGameState(gameState);
      setMyPlayerId(myPlayerId);
      setScreen(phaseToScreen(gameState.phase));
    });

    socket.on('game-created', ({ gameState, myPlayerId }) => {
      hasLeftRef.current = false;
      savePlayerId(myPlayerId);
      setGameState(gameState);
      setMyPlayerId(myPlayerId);
      setScreen('lobby');
    });

    socket.on('game-joined', ({ gameState, myPlayerId }) => {
      hasLeftRef.current = false;
      savePlayerId(myPlayerId);
      setGameState(gameState);
      setMyPlayerId(myPlayerId);
      setScreen('lobby');
    });

    socket.on('player-joined', ({ players }) => {
      setGameState(prev => prev ? { ...prev, players } : prev);
    });

    socket.on('player-left', ({ players }) => {
      setGameState(prev => prev ? { ...prev, players } : prev);
    });

    socket.on('settings-updated', ({ settings }) => {
      if (hasLeftRef.current) return;
      setGameState(prev => prev ? { ...prev, settings } : prev);
    });

    socket.on('round-started', ({ gameState }) => {
      if (hasLeftRef.current) return;
      setGameState(gameState);
      setScreen('reveal');
    });

    socket.on('player-finished', ({ playerId, newEndTime }) => {
      if (hasLeftRef.current) return;
      setGameState(prev => prev ? { ...prev, endTime: newEndTime } : prev);
      setFinishedNotification({ playerId, newEndTime, ts: Date.now() });
    });

    socket.on('round-ended', ({ gameState }) => {
      if (hasLeftRef.current) return;
      setGameState(gameState);
      setScreen('voting');
    });

    socket.on('vote-update', ({ votes }) => {
      if (hasLeftRef.current) return;
      setGameState(prev => prev ? { ...prev, votes } : prev);
    });

    socket.on('category-advanced', ({ votingCategoryIndex }) => {
      if (hasLeftRef.current) return;
      setGameState(prev => prev ? { ...prev, votingCategoryIndex } : prev);
    });

    socket.on('round-scores', ({ scores, roundScores, gameState }) => {
      if (hasLeftRef.current) return;
      setGameState({ ...gameState, roundScores, scores });
      setScreen('scoreboard');
    });

    socket.on('game-over', ({ finalScores, gameState }) => {
      if (hasLeftRef.current) return;
      clearPlayerId();
      setGameState({ ...gameState, scores: finalScores });
      setScreen('scoreboard');
    });

    socket.on('lobby-reset', ({ gameState }) => {
      if (hasLeftRef.current) return;
      setGameState(gameState);
      setScreen('lobby');
    });

    // Force-reconnect when the tab becomes visible again (covers phone wake-up)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      socket.disconnect();
    };
  }, []);

  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const createGame = useCallback((nickname: string, settings: GameSettings) => {
    emit('create-game', { nickname, settings });
  }, [emit]);

  const joinGame = useCallback((roomCode: string, nickname: string) => {
    emit('join-game', { roomCode, nickname });
  }, [emit]);

  const updateSettings = useCallback((data: Partial<GameSettings>) => {
    emit('update-settings', data);
  }, [emit]);

  const startGame = useCallback(() => {
    emit('start-game');
  }, [emit]);

  const submitAnswers = useCallback((answers: Record<string, string>) => {
    emit('submit-answers', { answers });
    emit('player-done');
  }, [emit]);

  const skipLetter = useCallback(() => {
    emit('skip-letter');
  }, [emit]);

  const markDone = useCallback(() => {
    emit('player-done');
  }, [emit]);

  const submitVote = useCallback((targetPlayerId: string, categoryId: string, accepted: boolean) => {
    emit('submit-vote', { targetPlayerId, categoryId, accepted });
  }, [emit]);

  const nextCategory = useCallback(() => {
    emit('next-category');
  }, [emit]);

  const nextRound = useCallback(() => {
    emit('next-round');
  }, [emit]);

  const playAgain = useCallback(() => {
    emit('play-again');
  }, [emit]);

  const leaveGame = useCallback(() => {
    if (!window.confirm('Spiel wirklich verlassen?')) return;
    hasLeftRef.current = true;
    emit('leave-game');
    clearPlayerId();
    setFinishedNotification(null);
    setGameState(null);
    setMyPlayerId(null);
    setScreen('home');
  }, [emit]);

  return (
    <GameContext.Provider value={{
      screen, gameState, myPlayerId, initialRoomCode, error, isConnected,
      goTo: setScreen,
      leaveGame,
      createGame, joinGame, updateSettings, startGame,
      skipLetter, submitAnswers, markDone, submitVote, nextCategory, nextRound, playAgain,
      clearError: () => setError(null),
      finishedNotification,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
