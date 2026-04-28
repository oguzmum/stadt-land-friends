import type { ServerGame } from './types';
import type { GameState, PlayerAnswers, CategoryResult } from '@stadt-land-friends/shared';
import {
  LETTER_POOL,
  ACCELERATED_TIMER_SECS,
  POINTS_UNIQUE,
  POINTS_SHARED,
  POINTS_EMPTY,
  answersMatch,
  isAnswerEmpty,
  isAnswerValid,
} from '@stadt-land-friends/shared';

export function pickLetter(game: ServerGame): string {
  const available = LETTER_POOL.split('').filter(l => !game.usedLetters.includes(l));
  if (available.length === 0) return LETTER_POOL[0];
  return available[Math.floor(Math.random() * available.length)];
}

export function accelerateTimer(game: ServerGame): number {
  const now = Date.now();
  const remaining = game.endTime - now;
  const accelerated = ACCELERATED_TIMER_SECS * 1000;
  if (remaining > accelerated) {
    game.endTime = now + accelerated;
    game.timerAccelerated = true;
  }
  return game.endTime;
}

export function collectAnswers(game: ServerGame): PlayerAnswers[] {
  return game.players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    playerEmoji: p.emoji,
    answers: game.answers.get(p.id) || {},
  }));
}

export function calculateRoundScores(game: ServerGame): {
  roundScores: Record<string, number>;
  totalScores: Record<string, number>;
} {
  const roundScores: Record<string, number> = {};
  game.players.forEach(p => { roundScores[p.id] = 0; });

  const answersArr = collectAnswers(game);

  for (const cat of game.settings.categories) {
    const catId = cat.id;

    for (const pa of answersArr) {
      const answer = pa.answers[catId] || '';
      if (isAnswerEmpty(answer) || !isAnswerValid(answer, game.currentLetter)) continue;

      const voteKey = `${catId}_${pa.playerId}`;
      const accepted = game.votes.get(voteKey) !== false;

      if (!accepted) {
        roundScores[pa.playerId] = (roundScores[pa.playerId] || 0) + POINTS_EMPTY;
        continue;
      }

      const others = answersArr.filter(
        other => other.playerId !== pa.playerId && !isAnswerEmpty(other.answers[catId] || '')
      );
      const hasDuplicate = others.some(other => answersMatch(answer, other.answers[catId] || ''));

      roundScores[pa.playerId] = (roundScores[pa.playerId] || 0) + (hasDuplicate ? POINTS_SHARED : POINTS_UNIQUE);
    }
  }

  const totalScores: Record<string, number> = {};
  game.players.forEach(p => {
    const prev = game.scores.get(p.id) || 0;
    const round = roundScores[p.id] || 0;
    totalScores[p.id] = prev + round;
    game.scores.set(p.id, totalScores[p.id]);
    game.roundScores.set(p.id, round);
  });

  return { roundScores, totalScores };
}

export function toGameState(game: ServerGame): GameState {
  const votesObj: GameState['votes'] = {};
  for (const [key, accepted] of game.votes.entries()) {
    const [catId, playerId] = key.split('_');
    if (!votesObj[catId]) votesObj[catId] = {};
    votesObj[catId][playerId] = accepted;
  }

  const scoresObj: Record<string, number> = {};
  for (const [id, score] of game.scores.entries()) scoresObj[id] = score;

  return {
    roomCode: game.roomCode,
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
    })),
    settings: game.settings,
    phase: game.phase,
    currentRound: game.currentRound,
    letter: game.currentLetter || undefined,
    endTime: game.endTime || undefined,
    answers: game.phase === 'voting' || game.phase === 'scoreboard'
      ? collectAnswers(game)
      : undefined,
    votingCategoryIndex: game.votingCategoryIndex,
    votes: votesObj,
    scores: scoresObj,
  };
}

export function resetForNewRound(game: ServerGame): void {
  game.answers.clear();
  game.votes.clear();
  game.roundScores.clear();
  game.votingCategoryIndex = 0;
  game.timerAccelerated = false;
  game.players.forEach(p => {
    p.hasSubmitted = false;
    p.hasDone = false;
  });
}

export function resetForPlayAgain(game: ServerGame): void {
  resetForNewRound(game);
  game.currentRound = 0;
  game.usedLetters = [];
  game.phase = 'lobby';
  game.scores.clear();
  game.players.forEach(p => {
    game.scores.set(p.id, 0);
  });
}
