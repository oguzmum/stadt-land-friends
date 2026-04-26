import React from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { Badge } from '../components/Badge';
import { useGame } from '../context/GameContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = [T.primary, 'rgba(255,255,255,0.6)', '#cd7f32'];

export function Scoreboard() {
  const { gameState, myPlayerId, playAgain, goTo, nextRound } = useGame();

  if (!gameState) return null;

  const isFinished = gameState.phase === 'finished';
  const isAdmin = gameState.players.find(p => p.id === myPlayerId)?.isAdmin ?? false;
  const sorted = [...gameState.players].sort(
    (a, b) => (gameState.scores[b.id] ?? 0) - (gameState.scores[a.id] ?? 0)
  );

  return (
    <Screen>
      <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 30, textAlign: 'center', marginBottom: 4 }}>
        {isFinished ? '🏆 Endstand' : `Runde ${gameState.currentRound} beendet`}
      </div>
      <div style={{ color: T.muted, fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
        {isFinished ? 'Glückwunsch an alle!' : `Noch ${gameState.settings.totalRounds - gameState.currentRound} Runde(n) übrig`}
      </div>

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

      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          {isFinished ? (
            <>
              <Btn onClick={playAgain} size="lg" full>🔄 Nochmal spielen</Btn>
              <Btn onClick={() => goTo('home')} variant="ghost" size="md" full>🏠 Zur Startseite</Btn>
            </>
          ) : (
            <Btn onClick={nextRound} size="lg" full>🚀 Nächste Runde starten</Btn>
          )}
        </div>
      )}
      {!isAdmin && (
        <div style={{ paddingTop: 24, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          {isFinished ? (
            <Btn onClick={() => goTo('home')} variant="ghost" size="md" full>🏠 Zur Startseite</Btn>
          ) : (
            'Warte auf den Admin…'
          )}
        </div>
      )}
    </Screen>
  );
}
