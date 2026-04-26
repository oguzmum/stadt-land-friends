import React from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';

export function Home() {
  const { goTo } = useGame();
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🎮</div>
        <div>
          <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 30, lineHeight: 1.1, letterSpacing: -1 }}>
            Stadt Land Fluss<br />
            <span style={{ color: T.primary }}>Friends</span>
          </div>
          <div style={{ color: T.muted, fontSize: 15, marginTop: 10, fontWeight: 400 }}>
            
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {['🏙', '🌍', '🌊', '👤', '🐾'].map((e, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.surface, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, border: `1px solid ${T.border}`,
            }}>{e}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn onClick={() => goTo('create')} size="lg" full>✨ Spiel erstellen</Btn>
        <Btn onClick={() => goTo('join')} variant="ghost" size="lg" full>🔗 Raum beitreten</Btn>
        <div style={{ textAlign: 'center', fontSize: 13, color: T.muted, marginTop: 4 }}>
          Kein Account nötig
        </div>
      </div>
    </Screen>
  );
}
