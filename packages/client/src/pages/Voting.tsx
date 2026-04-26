import React from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { useGame } from '../context/GameContext';
import { POINTS_UNIQUE, POINTS_SHARED, answersMatch, isAnswerValid } from '@stadt-land-fluss/shared';

function predictPoints(
  answer: string,
  playerId: string,
  allAnswers: { playerId: string; answer: string }[],
  votes: Record<string, boolean>,
  letter: string,
): number {
  if (!answer.trim()) return 0;
  if (!isAnswerValid(answer, letter)) return 0;
  if (votes[playerId] === false) return 0;

  const others = allAnswers.filter(e => e.playerId !== playerId && e.answer.trim() && isAnswerValid(e.answer, letter));
  const isDuplicate = others.some(e => answersMatch(e.answer, answer));
  return isDuplicate ? POINTS_SHARED : POINTS_UNIQUE;
}

function PointsBadge({ points }: { points: number }) {
  const color = points === 0 ? T.red : points === POINTS_SHARED ? '#f97316' : T.green;
  return (
    <div style={{
      minWidth: 36, height: 28, borderRadius: 8, paddingInline: 8,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.head, fontWeight: 800, fontSize: 13, color, flexShrink: 0,
    }}>
      +{points}
    </div>
  );
}

export function Voting() {
  const { gameState, myPlayerId, submitVote, nextCategory, nextRound } = useGame();

  if (!gameState || !gameState.answers) return null;

  const cats = gameState.settings.categories;
  const idx = gameState.votingCategoryIndex;
  const cat = cats[idx];
  const me = gameState.players.find(p => p.id === myPlayerId);
  const isAdmin = me?.isAdmin ?? false;
  const isLastCat = idx >= cats.length - 1;
  const catVotes = gameState.votes[cat?.id] ?? {};

  const allAnswers = gameState.answers.map(pa => ({
    playerId: pa.playerId,
    answer: pa.answers[cat?.id] ?? '',
  }));

  const handleVote = (targetPlayerId: string, accepted: boolean) => {
    if (!cat) return;
    submitVote(targetPlayerId, cat.id, accepted);
  };

  if (!cat) return null;

  return (
    <Screen>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Abstimmung {idx + 1} / {cats.length}
      </div>
      <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 28, marginBottom: 4, letterSpacing: -0.5 }}>
        {cat.icon} {cat.label}
      </div>
      <div style={{ color: T.primary, fontFamily: T.head, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
        Buchstabe: {gameState.letter}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {cats.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= idx ? T.primary : T.border,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {gameState.answers.map(pa => {
          const answer = pa.answers[cat.id] || '';
          const v = catVotes[pa.playerId];
          const isMe = pa.playerId === myPlayerId;
          const points = predictPoints(answer, pa.playerId, allAnswers, catVotes, gameState.letter ?? '');
          const borderColor = v === true ? `${T.green}55` : v === false ? `${T.red}55` : T.border;
          const bgColor = v === true ? `${T.green}0a` : v === false ? `${T.red}0a` : T.surface;

          return (
            <Card key={pa.playerId} style={{ border: `1.5px solid ${borderColor}`, background: bgColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 2 }}>
                    {pa.playerEmoji} {pa.playerName}{isMe ? ' (Du)' : ''}
                  </div>
                  <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 20, color: answer ? T.text : T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {answer || '(leer)'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PointsBadge points={points} />
                  {!isMe && (
                    <>
                      <button onClick={() => handleVote(pa.playerId, false)} style={{
                        width: 42, height: 42, borderRadius: 12,
                        border: `1.5px solid ${v === false ? T.red : T.border}`,
                        background: v === false ? `${T.red}22` : T.surfaceHigh,
                        fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>✗</button>
                      <button onClick={() => handleVote(pa.playerId, true)} style={{
                        width: 42, height: 42, borderRadius: 12,
                        border: `1.5px solid ${v === true ? T.green : T.border}`,
                        background: v === true ? `${T.green}22` : T.surfaceHigh,
                        fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>✓</button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingTop: 16, paddingBottom: 4 }}>
        {[
          { color: T.green,   label: `Einzigartig +${POINTS_UNIQUE}` },
          { color: '#f97316', label: `Doppelt +${POINTS_SHARED}` },
          { color: T.red,     label: 'Leer / Ungültig / Abgelehnt +0' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div style={{ paddingTop: 12 }}>
          {!isLastCat ? (
            <Btn onClick={nextCategory} size="lg" full>Nächste Kategorie →</Btn>
          ) : (
            <Btn onClick={nextRound} size="lg" full>🏆 Ergebnis anzeigen</Btn>
          )}
        </div>
      )}
      {!isAdmin && (
        <div style={{ paddingTop: 20, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          Warte auf den Admin…
        </div>
      )}
    </Screen>
  );
}
