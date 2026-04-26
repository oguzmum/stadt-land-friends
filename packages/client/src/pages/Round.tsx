import React, { useState, useEffect, useRef } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';
import { isAnswerValid } from '@stadt-land-fluss/shared';

export function Round() {
  const { gameState, submitAnswers } = useGame();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const endTimeRef = useRef<number>(0);

  const letter = gameState?.letter ?? '?';
  const cats = gameState?.settings.categories ?? [];
  const roundTime = gameState?.settings.roundTime ?? 120;

  useEffect(() => {
    if (!gameState?.endTime) return;
    endTimeRef.current = gameState.endTime;
  }, [gameState?.endTime]);

  useEffect(() => {
    if (!gameState?.endTime) return;
    endTimeRef.current = gameState.endTime;
    setTimeLeft(Math.max(0, Math.ceil((gameState.endTime - Date.now()) / 1000)));

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (!submitted) handleSubmit();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState?.endTime]);

  // Update endTime when server accelerates
  useEffect(() => {
    if (gameState?.endTime) {
      endTimeRef.current = gameState.endTime;
    }
  }, [gameState?.endTime]);

  const pct = Math.min(100, (timeLeft / roundTime) * 100);
  const barColor = timeLeft < 20 ? T.red : timeLeft < 45 ? T.secondary : T.green;

  const set = (id: string, val: string) => setAnswers(prev => ({ ...prev, [id]: val }));

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const trimmed: Record<string, string> = {};
    for (const [catId, val] of Object.entries(answers)) {
      trimmed[catId] = val.trim();
    }
    submitAnswers(trimmed);
  };

  return (
    <Screen pad={false}>
      {/* Sticky header */}
      <div style={{ padding: '56px 20px 0', background: T.bg, position: 'sticky', top: 0, zIndex: 10, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 52, color: T.primary, lineHeight: 1 }}>
            {letter}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 28, color: timeLeft < 20 ? T.red : T.text }}>
              {timeLeft}s
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>verbleibend</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: T.surface, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.5s linear, background 0.5s' }} />
        </div>
      </div>

      {/* Input fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16, color: T.muted }}>
            <div style={{ fontSize: 48 }}>✋</div>
            <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 20, color: T.text }}>Fertig!</div>
            <div style={{ fontSize: 15 }}>Warte auf andere Spieler…</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cats.map(cat => {
              const val = answers[cat.id] || '';
              const invalid = val.trim().length > 0 && !isAnswerValid(val, letter);
              return (
                <div key={cat.id} style={{ background: T.surface, borderRadius: 16, border: `1.5px solid ${invalid ? T.red : T.border}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div style={{ padding: '10px 16px 0', fontSize: 13, fontWeight: 600, color: invalid ? T.red : T.muted, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{cat.icon}</span><span>{cat.label}</span>
                    </div>
                    {invalid && <span style={{ fontSize: 12 }}>muss mit „{letter}" beginnen</span>}
                  </div>
                  <input
                    value={val}
                    onChange={e => set(cat.id, e.target.value)}
                    placeholder={`${letter}…`}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '8px 16px 14px', color: invalid ? T.red : T.text, fontFamily: T.body, fontSize: 18, fontWeight: 600, outline: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!submitted && (
        <div style={{ padding: '0 20px 20px' }}>
          <Btn onClick={handleSubmit} size="lg" full variant="secondary">
            ✋ Stopp! Fertig
          </Btn>
        </div>
      )}
    </Screen>
  );
}
