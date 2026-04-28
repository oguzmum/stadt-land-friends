import React, { useState, useEffect, useRef } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';
import { isAnswerValid } from '@stadt-land-friends/shared';

export function Round() {
  const { gameState, myPlayerId, submitAnswers, leaveGame, skipLetter, finishedNotification } = useGame();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const endTimeRef = useRef<number>(0);
  const [banner, setBanner] = useState<{ player: { emoji: string; name: string }; timeLeft: number } | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const letter = gameState?.letter ?? '?';
  const cats = gameState?.settings.categories ?? [];
  const roundTime = gameState?.settings.roundTime ?? 120;
  const me = gameState?.players.find(player => player.id === myPlayerId);
  const isAdmin = me?.isAdmin ?? false;

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

  useEffect(() => {
    if (!finishedNotification || !gameState) return;
    const player = gameState.players.find(p => p.id === finishedNotification.playerId);
    if (!player) return;
    const secs = Math.max(0, Math.ceil((finishedNotification.newEndTime - Date.now()) / 1000));
    setBanner({ player: { emoji: player.emoji, name: player.name }, timeLeft: secs });
    setBannerVisible(false);
    // next tick: fade in
    const fadeIn = setTimeout(() => setBannerVisible(true), 10);
    // fade out
    if (bannerHideRef.current) clearTimeout(bannerHideRef.current);
    bannerHideRef.current = setTimeout(() => {
      setBannerVisible(false);
      setTimeout(() => setBanner(null), 300);
    }, 3500);
    return () => clearTimeout(fadeIn);
  }, [finishedNotification]);

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
        <button onClick={leaveGame} style={{ position: 'absolute', top: 16, left: 20, background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 14, cursor: 'pointer', padding: 0 }}>
          ← Verlassen
        </button>
        {isAdmin && !submitted && (
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

      {banner && (
        <div style={{
          position: 'fixed', bottom: 96, left: 20, right: 20, zIndex: 50,
          background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: 16, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          opacity: bannerVisible ? 1 : 0,
          transform: bannerVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.25s, transform 0.25s',
        }}>
          <div style={{ fontSize: 28 }}>✋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 15, color: T.text }}>
              {banner.player.emoji} {banner.player.name} ist fertig!
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
              Noch ~{banner.timeLeft}s verbleibend
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
