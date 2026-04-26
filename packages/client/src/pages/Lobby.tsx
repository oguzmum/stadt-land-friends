import React, { useState } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { QRCode } from '../components/QRCode';
import { useGame } from '../context/GameContext';

export function Lobby() {
  const { gameState, myPlayerId, leaveGame, startGame } = useGame();
  const [copied, setCopied] = useState(false);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === myPlayerId);
  const isAdmin = me?.isAdmin ?? false;
  const code = gameState.roomCode;
  const joinUrl = `${window.location.origin}/join/${code}`;

  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen onLeave={leaveGame}>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Warteraum</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
        {gameState.players.length} von bis zu 10 Spieler:innen
      </div>

      {/* Code + QR */}
      <Card style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: T.primary }}>
            {code}
          </div>
          <button onClick={copy} style={{
            background: T.surfaceHigh, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '8px 12px',
            color: copied ? T.green : T.muted,
            fontFamily: T.body, fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}>
            {copied ? '✓ Kopiert' : '📋 Kopieren'}
          </button>
        </div>
        <QRCode size={140} value={joinUrl} />
        <div style={{ fontSize: 13, color: T.muted }}>Freunde scannen oder Code eingeben</div>
      </Card>

      {/* Players */}
      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Spieler:innen</div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {gameState.players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge emoji={p.emoji} name={p.name + (p.id === myPlayerId ? ' (Du)' : '') + (!p.isConnected ? ' 🔴' : '')} />
              <div style={{ display: 'flex', gap: 6 }}>
                {p.isAdmin && (
                  <div style={{ fontSize: 12, background: `${T.primary}22`, color: T.primary, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>Admin</div>
                )}
              </div>
            </div>
          ))}
          {gameState.players.length < 10 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.3 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 20 }}>+</div>
              <div style={{ color: T.muted, fontSize: 14 }}>Warte auf weitere Spieler…</div>
            </div>
          )}
        </div>
      </Card>

      {/* Settings */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 8, fontWeight: 600 }}>
          KATEGORIEN ({gameState.settings.categories.length}) · {gameState.settings.roundTime}s · {gameState.settings.totalRounds} Runden
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {gameState.settings.categories.map(c => (
            <div key={c.id} style={{
              padding: '6px 12px', borderRadius: 20,
              background: T.surface, border: `1px solid ${T.border}`,
              fontSize: 13, color: T.text,
            }}>{c.icon} {c.label}</div>
          ))}
        </div>
      </div>

      {isAdmin ? (
        <Btn onClick={startGame} size="lg" full disabled={gameState.players.length < 2}>
          🚀 Spiel starten
        </Btn>
      ) : (
        <div style={{ textAlign: 'center', color: T.muted, fontSize: 15, padding: '18px 0', background: T.surface, borderRadius: 16, border: `1px solid ${T.border}` }}>
          Warte auf den Admin…
        </div>
      )}
      {isAdmin && gameState.players.length < 2 && (
        <div style={{ textAlign: 'center', fontSize: 13, color: T.muted, marginTop: 8 }}>
          Mindestens 2 Spieler:innen benötigt
        </div>
      )}
    </Screen>
  );
}
