import React, { useState } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { Badge } from '../components/Badge';
import { useGame } from '../context/GameContext';
import { POINTS_UNIQUE, POINTS_SHARED, answersMatch, isAnswerValid } from '@stadt-land-fluss/shared';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = [T.primary, 'rgba(255,255,255,0.6)', '#cd7f32'];

function computePoints(
  answer: string,
  playerId: string,
  allAnswers: { playerId: string; answer: string }[],
  catVotes: Record<string, boolean>,
  letter: string,
): number {
  if (!answer.trim() || !isAnswerValid(answer, letter)) return 0;
  if (catVotes[playerId] === false) return 0;
  const others = allAnswers.filter(e => e.playerId !== playerId && e.answer.trim() && isAnswerValid(e.answer, letter));
  return others.some(e => answersMatch(e.answer, answer)) ? POINTS_SHARED : POINTS_UNIQUE;
}

export function Scoreboard() {
  const { gameState, myPlayerId, playAgain, leaveGame, nextRound } = useGame();
  const [tab, setTab] = useState<'scores' | 'answers'>('scores');

  if (!gameState) return null;

  const isFinished = gameState.phase === 'finished';
  const isAdmin = gameState.players.find(p => p.id === myPlayerId)?.isAdmin ?? false;
  const sorted = [...gameState.players].sort(
    (a, b) => (gameState.scores[b.id] ?? 0) - (gameState.scores[a.id] ?? 0)
  );

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 0', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontFamily: T.head, fontWeight: 700, fontSize: 14,
    background: active ? T.primary : T.surfaceHigh,
    color: active ? T.bg : T.muted,
    transition: 'all 0.2s',
  });

  return (
    <Screen onLeave={leaveGame}>
      <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 30, textAlign: 'center', marginBottom: 4 }}>
        {isFinished ? '🏆 Endstand' : `Runde ${gameState.currentRound} beendet`}
      </div>
      <div style={{ color: T.muted, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
        {isFinished ? 'Glückwunsch an alle!' : `Noch ${gameState.settings.totalRounds - gameState.currentRound} Runde(n) übrig`}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: T.surfaceHigh, borderRadius: 12, padding: 4 }}>
        <button style={tabStyle(tab === 'scores')} onClick={() => setTab('scores')}>📊 Punkte</button>
        <button style={tabStyle(tab === 'answers')} onClick={() => setTab('answers')}>📋 Antworten</button>
      </div>

      {tab === 'scores' && (
        <>
          {/* Round scores summary */}
          {gameState.roundScores && !isFinished && (
            <div style={{ background: T.surface, borderRadius: 16, padding: '12px 16px', marginBottom: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8 }}>DIESE RUNDE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sorted.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: T.text }}>{p.emoji} {p.name}</span>
                    <span style={{ fontFamily: T.head, fontWeight: 700, color: T.primary, fontSize: 16 }}>
                      +{gameState.roundScores![p.id] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total ranking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                background: i === 0 ? `${T.primary}18` : T.surface,
                border: `1.5px solid ${i === 0 ? T.primary + '55' : T.border}`,
                borderRadius: 20, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                transform: i === 0 ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.3s',
              }}>
                <div style={{ fontSize: 28 }}>{MEDALS[i] || `${i + 1}.`}</div>
                <div style={{ flex: 1 }}>
                  <Badge
                    emoji={p.emoji}
                    name={p.name + (p.id === myPlayerId ? ' (Du)' : '')}
                    big={i === 0}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: i === 0 ? 32 : 24, color: PODIUM_COLORS[i] || T.text }}>
                    {gameState.scores[p.id] ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>Punkte</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'answers' && gameState.answers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {gameState.settings.categories.map(cat => {
            const catVotes = gameState.votes[cat.id] ?? {};
            const allAnswers = gameState.answers!.map(pa => ({
              playerId: pa.playerId,
              answer: pa.answers[cat.id] ?? '',
            }));
            return (
              <div key={cat.id} style={{ background: T.surface, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, fontFamily: T.head, fontWeight: 800, fontSize: 16 }}>
                  {cat.icon} {cat.label}
                  <span style={{ marginLeft: 8, fontSize: 13, color: T.muted, fontWeight: 500 }}>
                    — Buchstabe {gameState.letter}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {gameState.answers!.map((pa, idx) => {
                    const answer = pa.answers[cat.id] ?? '';
                    const pts = computePoints(answer, pa.playerId, allAnswers, catVotes, gameState.letter ?? '');
                    const rejected = catVotes[pa.playerId] === false;
                    const hasAnswer = answer.trim().length > 0;
                    const ptColor = pts === 0 ? T.red : pts === POINTS_SHARED ? '#f97316' : T.green;
                    return (
                      <div key={pa.playerId} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px',
                        borderTop: idx === 0 ? 'none' : `1px solid ${T.border}`,
                        opacity: (!hasAnswer || rejected) ? 0.55 : 1,
                      }}>
                        <span style={{ fontSize: 18 }}>{pa.playerEmoji}</span>
                        <span style={{ fontSize: 13, color: T.muted, minWidth: 70, flexShrink: 0 }}>{pa.playerName}</span>
                        <span style={{
                          flex: 1, fontFamily: T.head, fontWeight: 700, fontSize: 17,
                          color: hasAnswer ? T.text : T.muted,
                          textDecoration: rejected ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {hasAnswer ? answer : '—'}
                        </span>
                        <span style={{
                          fontFamily: T.head, fontWeight: 800, fontSize: 13, color: ptColor,
                          flexShrink: 0,
                        }}>
                          +{pts}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          {isFinished ? (
            <>
              <Btn onClick={playAgain} size="lg" full>🔄 Nochmal spielen</Btn>
              <Btn onClick={() => leaveGame()} variant="ghost" size="md" full>🏠 Zur Startseite</Btn>
            </>
          ) : (
            <Btn onClick={nextRound} size="lg" full>🚀 Nächste Runde starten</Btn>
          )}
        </div>
      )}
      {!isAdmin && (
        <div style={{ paddingTop: 24, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          {isFinished ? (
            <Btn onClick={() => leaveGame()} variant="ghost" size="md" full>🏠 Zur Startseite</Btn>
          ) : (
            'Warte auf den Admin…'
          )}
        </div>
      )}
    </Screen>
  );
}
