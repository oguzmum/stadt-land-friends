import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, ClientToServerEvents, ServerToClientEvents, GameSettings } from '@stadt-land-fluss/shared';

export type AppScreen = 'home' | 'create' | 'join' | 'lobby' | 'reveal' | 'game' | 'voting' | 'scoreboard';

function parseInitialScreen(): { screen: AppScreen; roomCode: string } {
  const match = window.location.pathname.match(/^\/join\/([A-Z0-9]{4,8})$/i);
  if (match) {
    history.replaceState(null, '', '/');
    return { screen: 'join', roomCode: match[1].toUpperCase() };
  }
  return { screen: 'home', roomCode: '' };
}

interface GameContextType {
  screen: AppScreen;
  gameState: GameState | null;
  myPlayerId: string | null;
  initialRoomCode: string;
  error: string | null;
  isConnected: boolean;
  // actions
  goTo: (screen: AppScreen) => void;
  createGame: (nickname: string, settings: GameSettings) => void;
  joinGame: (roomCode: string, nickname: string) => void;
  updateSettings: (data: Partial<GameSettings>) => void;
  startGame: () => void;
  submitAnswers: (answers: Record<string, string>) => void;
  markDone: () => void;
  submitVote: (targetPlayerId: string, categoryId: string, accepted: boolean) => void;
  nextCategory: () => void;
  nextRound: () => void;
  playAgain: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || '';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const initial = parseInitialScreen();
  const [screen, setScreen] = useState<AppScreen>(initial.screen);
  const [initialRoomCode] = useState(initial.roomCode);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('error', ({ message }) => setError(message));

    socket.on('game-created', ({ roomCode, gameState, myPlayerId }) => {
      setGameState(gameState);
      setMyPlayerId(myPlayerId);
      setScreen('lobby');
    });

    socket.on('game-joined', ({ gameState, myPlayerId }) => {
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
      setGameState(prev => prev ? { ...prev, settings } : prev);
    });

    socket.on('round-started', ({ letter, roundNumber, endTime, gameState }) => {
      setGameState(gameState);
      setScreen('reveal');
      // Reveal component handles transition to 'game' via goTo
    });

    socket.on('player-finished', ({ playerId, newEndTime }) => {
      setGameState(prev => prev ? { ...prev, endTime: newEndTime } : prev);
    });

    socket.on('round-ended', ({ answers, gameState }) => {
      setGameState(gameState);
      setScreen('voting');
    });

    socket.on('vote-update', ({ votes }) => {
      setGameState(prev => prev ? { ...prev, votes } : prev);
    });

    socket.on('category-advanced', ({ votingCategoryIndex }) => {
      setGameState(prev => prev ? { ...prev, votingCategoryIndex } : prev);
    });

    socket.on('round-scores', ({ scores, roundScores, gameState }) => {
      setGameState({ ...gameState, roundScores, scores });
      setScreen('scoreboard');
    });

    socket.on('game-over', ({ finalScores, gameState }) => {
      setGameState({ ...gameState, scores: finalScores });
      setScreen('scoreboard');
    });

    socket.on('lobby-reset', ({ gameState }) => {
      setGameState(gameState);
      setScreen('lobby');
    });

    return () => { socket.disconnect(); };
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

  return (
    <GameContext.Provider value={{
      screen, gameState, myPlayerId, initialRoomCode, error, isConnected,
      goTo: setScreen,
      createGame, joinGame, updateSettings, startGame,
      submitAnswers, markDone, submitVote, nextCategory, nextRound, playAgain,
      clearError: () => setError(null),
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
