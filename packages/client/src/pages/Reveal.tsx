import { useEffect, useState } from 'react';
import { T } from '../theme';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Cycling delays: starts fast, slows down — total ~1250ms
const CYCLE_DELAYS = [45, 50, 55, 65, 80, 100, 130, 170, 225, 290, 270];

export function Reveal() {
  const { gameState, myPlayerId, goTo, skipLetter } = useGame();
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [count, setCount] = useState(3);
  const [display, setDisplay] = useState('?');
  const letter = gameState?.letter ?? '?';
  const me = gameState?.players.find(player => player.id === myPlayerId);
  const isAdmin = me?.isAdmin ?? false;

  // Cycling + phase transitions (runs once on mount)
  useEffect(() => {
    setPhase(0);
    setCount(3);
    setDisplay('?');

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let acc = 350; // pause before cycling begins

    CYCLE_DELAYS.forEach((dur, i) => {
      acc += dur;
      const isLast = i === CYCLE_DELAYS.length - 1;
      timeouts.push(setTimeout(() => {
        setDisplay(isLast ? letter : ALPHABET[Math.floor(Math.random() * 26)]);
        if (isLast) setPhase(1);
      }, acc));
    });
    // acc ≈ 350 + 1535 = ~1885ms when letter settles

    // Countdown phase ~1200ms after letter settles
    timeouts.push(setTimeout(() => setPhase(2), acc + 1200));

    return () => timeouts.forEach(clearTimeout);
  }, [letter]);

  // Countdown tick
  useEffect(() => {
    if (phase !== 2) return;
    if (count === 0) { goTo('game'); return; }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, count]);

  const phaseLabel =
    phase === 0 ? '⏳ Buchstabe wird gewählt…'
    : phase === 1 ? '🎲 Der Buchstabe ist…'
    : count > 0 ? '🏃 Los geht\'s in…'
    : '';

  const letterDisplay = phase < 2 ? display : count === 0 ? '🔥' : String(count);
  const fontSize = phase === 0 ? 96 : phase === 1 ? 148 : 108;
  const color = phase === 0 ? T.muted : T.primary;

  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
      {isAdmin && (
        <button
          onClick={skipLetter}
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            background: T.surfaceHigh,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            color: T.text,
            fontFamily: T.body,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '8px 12px',
          }}
        >
          Buchstabe skippen
        </button>
      )}
      <div style={{ color: T.muted, fontSize: 18, fontFamily: T.head, fontWeight: 600, minHeight: 28 }}>
        {phaseLabel}
      </div>
      <div style={{
        fontFamily: T.head,
        fontWeight: 900,
        fontSize,
        color,
        lineHeight: 1,
        transition: 'font-size 0.45s cubic-bezier(.34,1.56,.64,1), color 0.25s',
        textShadow: phase === 1 ? `0 0 60px ${T.primary}88` : 'none',
        letterSpacing: -4,
        minWidth: 120,
      }}>
        {letterDisplay}
      </div>
      <div style={{ color: T.muted, fontSize: 15, minHeight: 24 }}>
        {phase === 2 && count > 0 ? 'Macht euch bereit!' : phase === 2 ? 'LOS!' : ''}
      </div>
    </Screen>
  );
}
