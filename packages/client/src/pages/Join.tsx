import React, { useState } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: T.surface,
  border: `1.5px solid ${T.border}`,
  borderRadius: 14,
  padding: '15px 16px',
  color: T.text,
  fontFamily: T.body,
  fontSize: 16,
  outline: 'none',
};

export function Join() {
  const { goTo, joinGame, initialRoomCode } = useGame();
  const [code, setCode] = useState(initialRoomCode);
  const [name, setName] = useState('');

  const handleJoin = () => {
    if (code.length < 6 || name.length < 1) return;
    joinGame(code, name);
  };

  return (
    <Screen>
      <button onClick={() => goTo('home')} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 15, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 20 }}>
        ← Zurück
      </button>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 6 }}>Beitreten</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>Gib den Raum-Code ein</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dein Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Lena"
            maxLength={20}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Raum-Code</div>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            maxLength={6}
            style={{ ...inputStyle, fontSize: 26, fontFamily: T.head, fontWeight: 800, letterSpacing: 6, textAlign: 'center' }}
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
        </div>
      </div>

      <Btn onClick={handleJoin} size="lg" full disabled={code.length < 6 || name.length < 1} style={{ marginTop: 24 }}>
        Beitreten →
      </Btn>
    </Screen>
  );
}
