import type { GameSettings, GamePhase, PlayerAnswers } from '@stadt-land-friends/shared';

export interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  emoji: string;
  isAdmin: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  hasDone: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export interface ServerGame {
  roomCode: string;
  players: ServerPlayer[];
  settings: GameSettings;
  phase: GamePhase;
  currentRound: number;
  usedLetters: string[];
  currentLetter: string;
  endTime: number;
  roundTimer: ReturnType<typeof setTimeout> | null;
  timerAccelerated: boolean;
  answers: Map<string, Record<string, string>>;
  votes: Map<string, boolean>;
  scores: Map<string, number>;
  roundScores: Map<string, number>;
  votingCategoryIndex: number;
}
