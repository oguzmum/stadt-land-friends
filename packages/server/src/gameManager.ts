import { randomUUID } from 'crypto';
import type { ServerGame, ServerPlayer } from './types';
import { ROOM_CODE_LENGTH, PLAYER_EMOJIS, DEFAULT_CATEGORIES, DEFAULT_ROUND_TIME, DEFAULT_TOTAL_ROUNDS } from '@stadt-land-friends/shared';

const games = new Map<string, ServerGame>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (games.has(code));
  return code;
}

function pickEmoji(usedEmojis: string[]): string {
  const available = PLAYER_EMOJIS.filter(e => !usedEmojis.includes(e));
  const pool = available.length > 0 ? available : PLAYER_EMOJIS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createGame(socketId: string, nickname: string, settings: ServerGame['settings']): ServerGame {
  const roomCode = generateRoomCode();
  const stableId = randomUUID();
  const player: ServerPlayer = {
    id: stableId,
    socketId,
    name: nickname,
    emoji: pickEmoji([]),
    isAdmin: true,
    isConnected: true,
    hasSubmitted: false,
    hasDone: false,
  };
  const game: ServerGame = {
    roomCode,
    players: [player],
    settings,
    phase: 'lobby',
    currentRound: 0,
    usedLetters: [],
    currentLetter: '',
    endTime: 0,
    roundTimer: null,
    timerAccelerated: false,
    answers: new Map(),
    votes: new Map(),
    scores: new Map([[stableId, 0]]),
    roundScores: new Map(),
    votingCategoryIndex: 0,
  };
  games.set(roomCode, game);
  return game;
}

export function joinGame(roomCode: string, socketId: string, nickname: string): { game: ServerGame; player: ServerPlayer } | null {
  const game = games.get(roomCode);
  if (!game) return null;
  if (game.phase !== 'lobby') return null;
  if (game.players.length >= 10) return null;

  const usedEmojis = game.players.map(p => p.emoji);
  const stableId = randomUUID();
  const player: ServerPlayer = {
    id: stableId,
    socketId,
    name: nickname,
    emoji: pickEmoji(usedEmojis),
    isAdmin: false,
    isConnected: true,
    hasSubmitted: false,
    hasDone: false,
  };
  game.players.push(player);
  game.scores.set(stableId, 0);
  return { game, player };
}

export function getGame(roomCode: string): ServerGame | undefined {
  return games.get(roomCode);
}

export function getGameBySocketId(socketId: string): ServerGame | undefined {
  for (const game of games.values()) {
    if (game.players.some(p => p.socketId === socketId)) return game;
  }
  return undefined;
}

export function findPlayerByStableId(playerId: string): { game: ServerGame; player: ServerPlayer } | undefined {
  for (const game of games.values()) {
    const player = game.players.find(p => p.id === playerId);
    if (player) return { game, player };
  }
  return undefined;
}

export function removePlayer(game: ServerGame, socketId: string): void {
  const idx = game.players.findIndex(p => p.socketId === socketId);
  if (idx === -1) return;

  const player = game.players[idx];

  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
  }

  game.answers.delete(player.id);
  game.scores.delete(player.id);
  game.roundScores.delete(player.id);
  for (const key of Array.from(game.votes.keys())) {
    if (key.endsWith(`_${player.id}`)) game.votes.delete(key);
  }

  const wasAdmin = player.isAdmin;
  game.players.splice(idx, 1);

  if (wasAdmin && game.players.length > 0) {
    game.players[0].isAdmin = true;
  }

  if (game.players.length === 0) {
    if (game.roundTimer) clearTimeout(game.roundTimer);
    games.delete(game.roomCode);
  }
}

export function markDisconnected(game: ServerGame, socketId: string): void {
  const player = game.players.find(p => p.socketId === socketId);
  if (player) player.isConnected = false;
}

export function rejoinGame(
  roomCode: string,
  playerId: string,
  newSocketId: string,
): { game: ServerGame; player: ServerPlayer } | null {
  const game = games.get(roomCode);
  if (!game) return null;

  const player = game.players.find(p => p.id === playerId);
  if (!player) return null;

  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = undefined;
  }

  player.socketId = newSocketId;
  player.isConnected = true;
  return { game, player };
}

export function deleteGame(roomCode: string): void {
  const game = games.get(roomCode);
  if (game?.roundTimer) clearTimeout(game.roundTimer);
  games.delete(roomCode);
}
