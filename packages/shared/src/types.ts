export interface Category {
  id: string;
  icon: string;
  label: string;
}

export interface GameSettings {
  categories: Category[];
  roundTime: number;
  totalRounds: number;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  isAdmin: boolean;
  isConnected: boolean;
}

export interface PlayerAnswers {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  answers: Record<string, string>;
}

export interface Vote {
  voterId: string;
  targetPlayerId: string;
  categoryId: string;
  accepted: boolean;
}

export interface CategoryResult {
  categoryId: string;
  entries: {
    playerId: string;
    playerName: string;
    playerEmoji: string;
    answer: string;
    accepted: boolean;
    points: number;
  }[];
}

export type GamePhase = 'lobby' | 'reveal' | 'playing' | 'voting' | 'scoreboard' | 'finished';

export interface GameState {
  roomCode: string;
  players: Player[];
  settings: GameSettings;
  phase: GamePhase;
  currentRound: number;
  letter?: string;
  endTime?: number;
  answers?: PlayerAnswers[];
  votingCategoryIndex: number;
  votes: Record<string, Record<string, boolean>>;
  scores: Record<string, number>;
  roundScores?: Record<string, number>;
}

// ── Socket Events ─────────────────────────────────────────────

export interface ClientToServerEvents {
  'create-game': (data: { nickname: string; settings: GameSettings }) => void;
  'join-game': (data: { roomCode: string; nickname: string }) => void;
  'leave-game': () => void;
  'update-settings': (data: Partial<GameSettings>) => void;
  'start-game': () => void;
  'skip-letter': () => void;
  'submit-answers': (data: { answers: Record<string, string> }) => void;
  'player-done': () => void;
  'submit-vote': (data: { targetPlayerId: string; categoryId: string; accepted: boolean }) => void;
  'next-category': () => void;
  'next-round': () => void;
  'play-again': () => void;
}

export interface ServerToClientEvents {
  'game-created': (data: { roomCode: string; gameState: GameState; myPlayerId: string }) => void;
  'game-joined': (data: { gameState: GameState; myPlayerId: string }) => void;
  'game-rejoined': (data: { gameState: GameState; myPlayerId: string }) => void;
  'error': (data: { message: string }) => void;
  'player-joined': (data: { players: Player[] }) => void;
  'player-left': (data: { players: Player[] }) => void;
  'settings-updated': (data: { settings: GameSettings }) => void;
  'round-started': (data: { letter: string; roundNumber: number; endTime: number; gameState: GameState }) => void;
  'player-finished': (data: { playerId: string; newEndTime: number }) => void;
  'round-ended': (data: { answers: PlayerAnswers[]; gameState: GameState }) => void;
  'vote-update': (data: { votes: GameState['votes'] }) => void;
  'category-advanced': (data: { votingCategoryIndex: number }) => void;
  'round-scores': (data: { scores: Record<string, number>; roundScores: Record<string, number>; gameState: GameState }) => void;
  'game-over': (data: { finalScores: Record<string, number>; gameState: GameState }) => void;
  'lobby-reset': (data: { gameState: GameState }) => void;
}
