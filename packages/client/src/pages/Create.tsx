import React, { useState, useRef, useEffect } from 'react';
import { T } from '../theme';
import { Btn } from '../components/Btn';
import { Screen } from '../components/Screen';
import { useGame } from '../context/GameContext';
import { DEFAULT_CATEGORIES } from '@stadt-land-friends/shared';
import type { Category } from '@stadt-land-friends/shared';

const CAT_EMOJIS = ['⭐', '🎵', '🎨', '🍕', '🏆', '💡', '🌈', '🔥', '💎', '🎭', '📚', '🌊', '🎯', '🚀', '🍀'];
const TIMER_OPTS = [60, 90, 120, 180];
const ROUND_OPTS = [3, 5, 7, 10];

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: T.surface, border: `1.5px solid ${T.border}`,
  borderRadius: 14, padding: '15px 16px',
  color: T.text, fontFamily: T.body, fontSize: 16, outline: 'none',
};

export function Create() {
  const { goTo, createGame } = useGame();
  const [nickname, setNickname] = useState('');
  const [allCats, setAllCats] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeCatIds, setActiveCatIds] = useState<string[]>(DEFAULT_CATEGORIES.slice(0, 6).map(c => c.id));
  const [timer, setTimer] = useState(120);
  const [totalRounds, setTotalRounds] = useState(3);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const toggle = (id: string) =>
    setActiveCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddCat = () => {
    const label = newLabel.trim();
    if (!label) return;
    const cat: Category = { id: `custom_${Date.now()}`, icon: newEmoji, label };
    setAllCats(prev => [...prev, cat]);
    setActiveCatIds(prev => [...prev, cat.id]);
    setNewLabel(''); setNewEmoji('⭐'); setAdding(false); setShowEmojiPicker(false);
  };

  const handleCreate = () => {
    if (!nickname.trim() || activeCatIds.length === 0) return;
    const cats = allCats.filter(c => activeCatIds.includes(c.id));
    createGame(nickname.trim(), { categories: cats, roundTime: timer, totalRounds });
  };

  return (
    <Screen>
      <button onClick={() => goTo('home')} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 15, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 20 }}>
        ← Zurück
      </button>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 6 }}>Spiel erstellen</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>Lege deinen Namen und die Spieloptionen fest</div>

      {/* Nickname */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dein Name</div>
        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="z.B. Max" maxLength={20} style={inputStyle} />
      </div>

      {/* Categories */}
      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📋 Kategorien</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {allCats.map(cat => {
          const on = activeCatIds.includes(cat.id);
          const isCustom = cat.id.startsWith('custom_');
          return (
            <div key={cat.id} style={{ position: 'relative', display: 'flex' }}>
              <button onClick={() => toggle(cat.id)} style={{
                padding: '10px 16px', borderRadius: 50,
                border: `1.5px solid ${on ? T.primary : T.border}`,
                background: on ? `${T.primary}18` : T.surface,
                color: on ? T.primary : T.muted,
                fontFamily: T.body, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                paddingRight: isCustom ? 10 : 16,
              }}>{cat.icon} {cat.label}</button>
              {isCustom && (
                <button onClick={() => {
                  setAllCats(prev => prev.filter(c => c.id !== cat.id));
                  setActiveCatIds(prev => prev.filter(x => x !== cat.id));
                }} style={{
                  position: 'absolute', right: -6, top: -6, width: 20, height: 20,
                  borderRadius: '50%', background: T.red, border: 'none', color: '#fff',
                  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700,
                }}>×</button>
              )}
            </div>
          );
        })}
        {!adding && (
          <button onClick={() => setAdding(true)} style={{
            padding: '10px 16px', borderRadius: 50,
            border: `1.5px dashed ${T.border}`, background: 'transparent',
            color: T.muted, fontFamily: T.body, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>+ Eigene</button>
        )}
      </div>

      {adding && (
        <div style={{ background: T.surface, border: `1.5px solid ${T.primary}55`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.primary, marginBottom: 12, fontFamily: T.head }}>Neue Kategorie</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => setShowEmojiPicker(p => !p)} style={{
              width: 48, height: 48, borderRadius: 12,
              border: `1.5px solid ${showEmojiPicker ? T.primary : T.border}`,
              background: T.surfaceHigh, fontSize: 22, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{newEmoji}</button>
            <input
              ref={inputRef}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); if (e.key === 'Escape') { setAdding(false); setNewLabel(''); } }}
              placeholder="Kategorie-Name…"
              maxLength={24}
              style={{ flex: 1, background: T.surfaceHigh, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '12px 14px', color: T.text, fontFamily: T.body, fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {showEmojiPicker && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: 10, background: T.surfaceHigh, borderRadius: 12 }}>
              {CAT_EMOJIS.map(e => (
                <button key={e} onClick={() => { setNewEmoji(e); setShowEmojiPicker(false); }} style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1.5px solid ${newEmoji === e ? T.primary : 'transparent'}`,
                  background: newEmoji === e ? `${T.primary}22` : 'transparent',
                  fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{e}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => { setAdding(false); setNewLabel(''); setShowEmojiPicker(false); }} variant="ghost" size="sm" full>Abbrechen</Btn>
            <Btn onClick={handleAddCat} size="sm" full disabled={!newLabel.trim()}>Hinzufügen ✓</Btn>
          </div>
        </div>
      )}

      {/* Timer */}
      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>⏱ Rundenzeit</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {TIMER_OPTS.map(t => (
          <button key={t} onClick={() => setTimer(t)} style={{
            flex: 1, padding: '12px 0', borderRadius: 14,
            border: `1.5px solid ${timer === t ? T.primary : T.border}`,
            background: timer === t ? `${T.primary}18` : T.surface,
            color: timer === t ? T.primary : T.muted,
            fontFamily: T.head, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s',
          }}>{t}s</button>
        ))}
      </div>

      {/* Rounds */}
      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🔄 Runden</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {ROUND_OPTS.map(r => (
          <button key={r} onClick={() => setTotalRounds(r)} style={{
            flex: 1, padding: '12px 0', borderRadius: 14,
            border: `1.5px solid ${totalRounds === r ? T.primary : T.border}`,
            background: totalRounds === r ? `${T.primary}18` : T.surface,
            color: totalRounds === r ? T.primary : T.muted,
            fontFamily: T.head, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s',
          }}>{r}</button>
        ))}
      </div>

      <Btn onClick={handleCreate} size="lg" full disabled={!nickname.trim() || activeCatIds.length === 0}>
        Raum erstellen →
      </Btn>
    </Screen>
  );
}
