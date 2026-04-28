import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@stadt-land-friends/shared';
import { DEFAULT_CATEGORIES, DEFAULT_ROUND_TIME, DEFAULT_TOTAL_ROUNDS, isAnswerValid } from '@stadt-land-friends/shared';
import * as gameManager from './gameManager';
import {
  pickLetter,
  accelerateTimer,
  calculateRoundScores,
  toGameState,
  resetForNewRound,
  resetForPlayAgain,
} from './gameLogic';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerHandlers(io: GameServer, socket: GameSocket): void {
  // ── Create Game ────────────────────────────────────────────
  socket.on('create-game', ({ nickname, settings }) => {
    const finalSettings = {
      categories: settings.categories?.length ? settings.categories : DEFAULT_CATEGORIES,
      roundTime: settings.roundTime || DEFAULT_ROUND_TIME,
      totalRounds: settings.totalRounds || DEFAULT_TOTAL_ROUNDS,
    };
    const game = gameManager.createGame(socket.id, nickname, finalSettings);
    socket.join(game.roomCode);
    socket.emit('game-created', {
      roomCode: game.roomCode,
      gameState: toGameState(game),
      myPlayerId: game.players[0].id,
    });
  });

  // ── Join Game ──────────────────────────────────────────────
  socket.on('join-game', ({ roomCode, nickname }) => {
    const result = gameManager.joinGame(roomCode.toUpperCase(), socket.id, nickname);
    if (!result) {
      socket.emit('error', { message: 'Raum nicht gefunden oder Spiel läuft bereits.' });
      return;
    }
    socket.join(roomCode.toUpperCase());
    socket.emit('game-joined', {
      gameState: toGameState(result.game),
      myPlayerId: result.player.id,
    });
    socket.to(roomCode.toUpperCase()).emit('player-joined', {
      players: result.game.players.map(p => ({
        id: p.id, name: p.name, emoji: p.emoji,
        isAdmin: p.isAdmin, isConnected: p.isConnected,
      })),
    });
  });

  // ── Leave Game ─────────────────────────────────────────────
  socket.on('leave-game', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;

    const roomCode = game.roomCode;
    gameManager.removePlayer(game, socket.id);
    socket.leave(roomCode);

    if (game.players.length === 0) return;

    io.to(roomCode).emit('player-left', {
      players: game.players.map(p => ({
        id: p.id, name: p.name, emoji: p.emoji,
        isAdmin: p.isAdmin, isConnected: p.isConnected,
      })),
    });

    if (game.phase === 'playing' && game.players.every(p => p.hasSubmitted)) {
      endRound(io, game);
    }
  });

  // ── Update Settings ────────────────────────────────────────
  socket.on('update-settings', (data) => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    if (data.categories !== undefined) game.settings.categories = data.categories;
    if (data.roundTime !== undefined) game.settings.roundTime = data.roundTime;
    if (data.totalRounds !== undefined) game.settings.totalRounds = data.totalRounds;
    io.to(game.roomCode).emit('settings-updated', { settings: game.settings });
  });

  // ── Start Game ─────────────────────────────────────────────
  socket.on('start-game', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    if (game.players.length < 2) {
      socket.emit('error', { message: 'Mindestens 2 Spieler benötigt.' });
      return;
    }
    startRound(io, game);
  });

  // ── Skip Letter ────────────────────────────────────────────
  socket.on('skip-letter', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game || game.phase !== 'playing') return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    restartCurrentRound(io, game);
  });

  // ── Submit Answers ─────────────────────────────────────────
  socket.on('submit-answers', ({ answers }) => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game || game.phase !== 'playing') return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player || player.hasSubmitted) return;

    player.hasSubmitted = true;
    const trimmedAnswers: Record<string, string> = {};
    for (const [catId, answer] of Object.entries(answers)) {
      trimmedAnswers[catId] = isAnswerValid(answer.trim(), game.currentLetter) ? answer.trim() : '';
    }
    game.answers.set(player.id, trimmedAnswers);

    const allSubmitted = game.players.every(p => p.hasSubmitted);
    if (allSubmitted) endRound(io, game);
  });

  // ── Player Done ────────────────────────────────────────────
  socket.on('player-done', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game || game.phase !== 'playing') return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player || player.hasDone) return;
    player.hasDone = true;

    const newEndTime = accelerateTimer(game);
    io.to(game.roomCode).emit('player-finished', { playerId: player.id, newEndTime });
  });

  // ── Submit Vote ────────────────────────────────────────────
  socket.on('submit-vote', ({ targetPlayerId, categoryId, accepted }) => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game || game.phase !== 'voting') return;
    game.votes.set(`${categoryId}_${targetPlayerId}`, accepted);
    const votesObj: Record<string, Record<string, boolean>> = {};
    for (const [key, val] of game.votes.entries()) {
      const [cat, pid] = key.split('_');
      if (!votesObj[cat]) votesObj[cat] = {};
      votesObj[cat][pid] = val;
    }
    io.to(game.roomCode).emit('vote-update', { votes: votesObj });
  });

  // ── Next Category ──────────────────────────────────────────
  socket.on('next-category', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game || game.phase !== 'voting') return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    if (game.votingCategoryIndex < game.settings.categories.length - 1) {
      game.votingCategoryIndex++;
      io.to(game.roomCode).emit('category-advanced', { votingCategoryIndex: game.votingCategoryIndex });
    }
  });

  // ── Next Round ─────────────────────────────────────────────
  socket.on('next-round', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;

    if (game.phase === 'voting') {
      const { roundScores, totalScores } = calculateRoundScores(game);

      if (game.currentRound >= game.settings.totalRounds) {
        game.phase = 'finished';
        io.to(game.roomCode).emit('game-over', {
          finalScores: totalScores,
          gameState: toGameState(game),
        });
      } else {
        game.phase = 'scoreboard';
        io.to(game.roomCode).emit('round-scores', {
          scores: totalScores,
          roundScores,
          gameState: toGameState(game),
        });
      }
    } else if (game.phase === 'scoreboard') {
      startRound(io, game);
    }
  });

  // ── Play Again (same lobby) ────────────────────────────────
  socket.on('play-again', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;
    resetForPlayAgain(game);
    io.to(game.roomCode).emit('lobby-reset', { gameState: toGameState(game) });
  });

  // ── Disconnect ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) return;

    gameManager.markDisconnected(game, socket.id);
    socket.to(game.roomCode).emit('player-joined', {
      players: game.players.map(p => ({
        id: p.id, name: p.name, emoji: p.emoji,
        isAdmin: p.isAdmin, isConnected: p.isConnected,
      })),
    });

    if (game.phase === 'lobby') {
      // Give disconnected players 30 s to reconnect before removing them
      const player = game.players.find(p => p.socketId === socket.id);
      if (player) {
        const oldSocketId = socket.id;
        player.disconnectTimer = setTimeout(() => {
          if (game.phase !== 'lobby') return;
          gameManager.removePlayer(game, oldSocketId);
          if (game.players.length > 0) {
            io.to(game.roomCode).emit('player-left', {
              players: game.players.map(p => ({
                id: p.id, name: p.name, emoji: p.emoji,
                isAdmin: p.isAdmin, isConnected: p.isConnected,
              })),
            });
          }
        }, 30_000);
      }
    }
  });
}

function startRound(io: GameServer, game: ReturnType<typeof gameManager.getGameBySocketId> & {}): void {
  resetForNewRound(game);
  game.currentRound++;
  game.phase = 'playing';
  launchRound(io, game);
}

function restartCurrentRound(io: GameServer, game: ReturnType<typeof gameManager.getGameBySocketId> & {}): void {
  resetForNewRound(game);
  launchRound(io, game);
}

function launchRound(io: GameServer, game: ReturnType<typeof gameManager.getGameBySocketId> & {}): void {
  const letter = pickLetter(game);
  game.currentLetter = letter;
  game.usedLetters.push(letter);
  game.phase = 'playing';
  game.endTime = Date.now() + game.settings.roundTime * 1000;

  if (game.roundTimer) clearTimeout(game.roundTimer);
  game.roundTimer = setTimeout(() => endRound(io, game), game.settings.roundTime * 1000);

  io.to(game.roomCode).emit('round-started', {
    letter,
    roundNumber: game.currentRound,
    endTime: game.endTime,
    gameState: toGameState(game),
  });
}

function endRound(io: GameServer, game: ReturnType<typeof gameManager.getGameBySocketId> & {}): void {
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }
  if (game.phase !== 'playing') return;
  game.phase = 'voting';

  io.to(game.roomCode).emit('round-ended', {
    answers: game.players.map(p => ({
      playerId: p.id,
      playerName: p.name,
      playerEmoji: p.emoji,
      answers: game.answers.get(p.id) || {},
    })),
    gameState: toGameState(game),
  });
}
