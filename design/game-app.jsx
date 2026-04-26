// game-app.jsx — Stadt Land Fluss Friends: all screens + logic

const T = {
  bg: '#0e0e1a', surface: '#181828', surfaceHigh: '#22223a',
  border: 'rgba(255,255,255,0.08)', primary: '#f7c948',
  secondary: '#ff5e7e', green: '#4ade80', red: '#ff6b6b',
  text: '#ffffff', muted: 'rgba(255,255,255,0.45)',
  head: "'Syne', sans-serif", body: "'DM Sans', sans-serif",
};

const ALL_CATS = [
  { id: 'stadt',   icon: '🏙', label: 'Stadt'       },
  { id: 'land',    icon: '🌍', label: 'Land'        },
  { id: 'name',    icon: '👤', label: 'Name'        },
  { id: 'tier',    icon: '🐾', label: 'Tier'        },
  { id: 'beruf',   icon: '💼', label: 'Beruf'       },
  { id: 'film',    icon: '🎬', label: 'Film / Serie' },
  { id: 'auto',    icon: '🚗', label: 'Automarke'   },
  { id: 'rapper',  icon: '🎤', label: 'Rapper'      },
  { id: 'game',    icon: '🎮', label: 'Videospiel'  },
];

const FAKE_PLAYERS = [
  { id: 2, name: 'Lena', emoji: '🌸' },
  { id: 3, name: 'Tom',  emoji: '🎸' },
  { id: 4, name: 'Max',  emoji: '🦄' },
];

const FAKE_ANSWERS = {
  B: { stadt: ['Bremen','Budapest','Brüssel'], land: ['Brasilien','Bulgarien','Belgien'], name: ['Ben','Bianca','Boris'], tier: ['Bär','Biber','Büffel'], beruf: ['Bäcker','Buchhalter','Biologe'], film: ['Barbie','Blade Runner','Batman'], auto: ['BMW','Bugatti','Bentley'], rapper: ['Bushido','B-Real','Big L'], game: ['Battlefront','Bayonetta','Bioshock'] },
  A: { stadt: ['Amsterdam','Athen','Ankara'], land: ['Australien','Argentinien','Albanien'], name: ['Anna','Anton','Axel'], tier: ['Adler','Ameise','Affe'], beruf: ['Arzt','Anwalt','Architekt'], film: ['Alien','Avatar','Amadeus'], auto: ['Audi','Alfa Romeo','Aston Martin'], rapper: ['Apache 207','ASAP Rocky','Action Bronson'], game: ['Assassins Creed','Among Us','Anno 1800'] },
};

// ── Shared UI ────────────────────────────────────────────────

function Btn({ children, onClick, variant = 'primary', size = 'md', full = false, disabled = false, style = {} }) {
  const sizes = { sm: { padding: '10px 18px', fontSize: 14 }, md: { padding: '15px 24px', fontSize: 16 }, lg: { padding: '18px 0', fontSize: 18 } };
  const variants = {
    primary:   { background: T.primary,   color: '#0e0e1a'          },
    secondary: { background: T.secondary, color: '#fff'             },
    ghost:     { background: T.surfaceHigh, color: T.text, border: `1px solid ${T.border}` },
    green:     { background: T.green,     color: '#0e0e1a'          },
    red:       { background: T.red,       color: '#fff'             },
    outline:   { background: 'transparent', color: T.primary, border: `2px solid ${T.primary}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: 'none', cursor: disabled ? 'default' : 'pointer', fontFamily: T.head,
      fontWeight: 700, borderRadius: 16, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, width: full ? '100%' : undefined,
      opacity: disabled ? 0.4 : 1, transition: 'opacity 0.2s, transform 0.1s',
      ...sizes[size], ...variants[variant], ...style,
    }}>{children}</button>
  );
}

function Screen({ children, pad = true, style = {} }) {
  return (
    <div style={{
      minHeight: '100%', background: T.bg, color: T.text, fontFamily: T.body,
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      padding: pad ? '56px 20px 32px' : 0, ...style,
    }}>{children}</div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.surface, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, ...style }}>
      {children}
    </div>
  );
}

function Badge({ emoji, name, score, big = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: big ? 48 : 36, height: big ? 48 : 36, borderRadius: '50%', background: T.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: big ? 24 : 18, border: `1px solid ${T.border}` }}>{emoji}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: big ? 17 : 15 }}>{name}</div>
        {score !== undefined && <div style={{ fontSize: 13, color: T.muted }}>{score} Punkte</div>}
      </div>
    </div>
  );
}

function QRCode({ size = 148 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 148 148" style={{ borderRadius: 12, background: '#fff', display: 'block' }}>
      {/* TL finder */}
      <rect x="8" y="8" width="40" height="40" rx="4" fill="#111"/>
      <rect x="14" y="14" width="28" height="28" rx="2" fill="#fff"/>
      <rect x="20" y="20" width="16" height="16" rx="1" fill="#111"/>
      {/* TR finder */}
      <rect x="100" y="8" width="40" height="40" rx="4" fill="#111"/>
      <rect x="106" y="14" width="28" height="28" rx="2" fill="#fff"/>
      <rect x="112" y="20" width="16" height="16" rx="1" fill="#111"/>
      {/* BL finder */}
      <rect x="8" y="100" width="40" height="40" rx="4" fill="#111"/>
      <rect x="14" y="106" width="28" height="28" rx="2" fill="#fff"/>
      <rect x="20" y="112" width="16" height="16" rx="1" fill="#111"/>
      {/* data dots */}
      {[0,1,2,3,4,5,6,7].map(r => [0,1,2,3,4,5,6,7].map(c => {
        const x = 56 + c * 11, y = 8 + r * 11;
        return ((r + c * 2 + r * c) % 3 !== 1) && <rect key={`${r}-${c}`} x={x} y={y} width="7" height="7" rx="1" fill="#111"/>;
      }))}
      {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5].map(c => {
        const x = 8 + c * 11, y = 56 + r * 11;
        return ((r * 3 + c + r + c * r) % 4 !== 2) && <rect key={`bl-${r}-${c}`} x={x} y={y} width="7" height="7" rx="1" fill="#111"/>;
      }))}
      {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5].map(c => {
        const x = 100 + c * 8, y = 56 + r * 9;
        return ((r + c * r + c) % 3 === 0) && <rect key={`br-${r}-${c}`} x={x} y={y} width="5" height="5" rx="1" fill="#111"/>;
      }))}
    </svg>
  );
}

// ── HomeScreen ──────────────────────────────────────────────

function HomeScreen({ onCreate, onJoin }) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🎮</div>
        <div>
          <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 30, lineHeight: 1.1, letterSpacing: -1 }}>
            Stadt Land<br />
            <span style={{ color: T.primary }}>Fluss Friends</span>
          </div>
          <div style={{ color: T.muted, fontSize: 15, marginTop: 10, fontWeight: 400 }}>Das Klassiker-Spiel – jetzt online mit Freunden</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {['🏙', '🌍', '👤', '🐾', '🎮'].map((e, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${T.border}` }}>{e}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn onClick={onCreate} size="lg" full>✨ Spiel erstellen</Btn>
        <Btn onClick={onJoin} variant="ghost" size="lg" full>🔗 Raum beitreten</Btn>
        <div style={{ textAlign: 'center', fontSize: 13, color: T.muted, marginTop: 4 }}>Kein Account nötig</div>
      </div>
    </Screen>
  );
}

// ── CreateScreen ────────────────────────────────────────────

const CAT_EMOJIS = ['⭐','🎵','🎨','🍕','🏆','💡','🌈','🔥','💎','🎭','📚','🌊','🎯','🚀','🍀'];

function CreateScreen({ cats, active, setActive, timer, setTimer, onCreate, onBack, onAddCat, onRemoveCat }) {
  const toggle = (id) => setActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const timerOpts = [60, 90, 120, 180];

  const [adding, setAdding] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');
  const [newEmoji, setNewEmoji] = React.useState('⭐');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const inputRef = React.useRef();

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = 'custom_' + Date.now();
    onAddCat({ id, icon: newEmoji, label });
    setActive(prev => [...prev, id]);
    setNewLabel('');
    setNewEmoji('⭐');
    setAdding(false);
    setShowEmojiPicker(false);
  };

  React.useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  return (
    <Screen>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 15, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 20 }}>← Zurück</button>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 6 }}>Spiel erstellen</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>Wähle deine Kategorien</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {cats.map(cat => {
          const on = active.includes(cat.id);
          const isCustom = cat.id.startsWith('custom_');
          return (
            <div key={cat.id} style={{ position: 'relative', display: 'flex' }}>
              <button onClick={() => toggle(cat.id)} style={{
                padding: '10px 16px', borderRadius: 50, border: `1.5px solid ${on ? T.primary : T.border}`,
                background: on ? `${T.primary}18` : T.surface, color: on ? T.primary : T.muted,
                fontFamily: T.body, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                paddingRight: isCustom ? 10 : 16,
              }}>{cat.icon} {cat.label}</button>
              {isCustom && (
                <button onClick={() => { onRemoveCat(cat.id); setActive(prev => prev.filter(x => x !== cat.id)); }} style={{
                  position: 'absolute', right: -6, top: -6, width: 20, height: 20, borderRadius: '50%',
                  background: T.red, border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontWeight: 700,
                }}>×</button>
              )}
            </div>
          );
        })}

        {/* + Eigene Kategorie Button */}
        {!adding && (
          <button onClick={() => setAdding(true)} style={{
            padding: '10px 16px', borderRadius: 50, border: `1.5px dashed ${T.border}`,
            background: 'transparent', color: T.muted,
            fontFamily: T.body, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}>+ Eigene</button>
        )}
      </div>

      {/* Inline add form */}
      {adding && (
        <div style={{ background: T.surface, border: `1.5px solid ${T.primary}55`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.primary, marginBottom: 12, fontFamily: T.head }}>Neue Kategorie</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            {/* Emoji picker toggle */}
            <button onClick={() => setShowEmojiPicker(p => !p)} style={{
              width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${showEmojiPicker ? T.primary : T.border}`,
              background: T.surfaceHigh, fontSize: 22, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{newEmoji}</button>
            <input
              ref={inputRef}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewLabel(''); } }}
              placeholder="Kategorie-Name…"
              maxLength={24}
              style={{
                flex: 1, background: T.surfaceHigh, border: `1.5px solid ${T.border}`, borderRadius: 12,
                padding: '12px 14px', color: T.text, fontFamily: T.body, fontSize: 16, outline: 'none',
              }}
            />
          </div>
          {showEmojiPicker && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '10px', background: T.surfaceHigh, borderRadius: 12 }}>
              {CAT_EMOJIS.map(e => (
                <button key={e} onClick={() => { setNewEmoji(e); setShowEmojiPicker(false); }} style={{
                  width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${newEmoji === e ? T.primary : 'transparent'}`,
                  background: newEmoji === e ? `${T.primary}22` : 'transparent', fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{e}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => { setAdding(false); setNewLabel(''); setShowEmojiPicker(false); }} variant="ghost" size="sm" full>Abbrechen</Btn>
            <Btn onClick={handleAdd} size="sm" full disabled={!newLabel.trim()}>Hinzufügen ✓</Btn>
          </div>
        </div>
      )}

      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>⏱ Timer</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {timerOpts.map(t => (
          <button key={t} onClick={() => setTimer(t)} style={{
            flex: 1, padding: '12px 0', borderRadius: 14, border: `1.5px solid ${timer === t ? T.primary : T.border}`,
            background: timer === t ? `${T.primary}18` : T.surface, color: timer === t ? T.primary : T.muted,
            fontFamily: T.head, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s',
          }}>{t}s</button>
        ))}
      </div>

      <Btn onClick={onCreate} size="lg" full disabled={active.length === 0}>Raum erstellen →</Btn>
    </Screen>
  );
}

// ── JoinScreen ──────────────────────────────────────────────

function JoinScreen({ onJoin, onBack }) {
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const inputStyle = { width: '100%', boxSizing: 'border-box', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: '15px 16px', color: T.text, fontFamily: T.body, fontSize: 16, outline: 'none' };
  return (
    <Screen>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 15, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 20 }}>← Zurück</button>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 6 }}>Beitreten</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>Gib den Raum-Code ein oder scanne den QR-Code</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dein Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Lena" style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Raum-Code</div>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))} placeholder="BZKТ" style={{ ...inputStyle, fontSize: 28, fontFamily: T.head, fontWeight: 800, letterSpacing: 6, textAlign: 'center' }} maxLength={4} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <div style={{ color: T.muted, fontSize: 13 }}>oder</div>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <Btn variant="ghost" full size="md">📷 QR-Code scannen</Btn>
      </div>

      <Btn onClick={onJoin} size="lg" full disabled={code.length < 4 || name.length < 1} style={{ marginTop: 24 }}>Beitreten →</Btn>
    </Screen>
  );
}

// ── LobbyScreen ─────────────────────────────────────────────

function LobbyScreen({ isAdmin, players, cats, onStart, onBack }) {
  const [copied, setCopied] = React.useState(false);
  const code = 'BZKТ';
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Screen>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.body, fontSize: 15, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 16 }}>← Verlassen</button>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Warteraum</div>
      <div style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>{players.length} von bis zu 8 Spieler:innen</div>

      <Card style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 38, letterSpacing: 8, color: T.primary }}>{code}</div>
          <button onClick={copy} style={{ background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: copied ? T.green : T.muted, fontFamily: T.body, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {copied ? '✓ Kopiert' : '📋 Kopieren'}
          </button>
        </div>
        <QRCode size={140} />
        <div style={{ fontSize: 13, color: T.muted }}>Freunde scannen oder Code eingeben</div>
      </Card>

      <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Spieler:innen</div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge emoji={p.emoji} name={p.name + (i === 0 ? ' (Du)' : '')} />
              {i === 0 && <div style={{ fontSize: 12, background: `${T.primary}22`, color: T.primary, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>Admin</div>}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.3 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 20 }}>+</div>
            <div style={{ color: T.muted, fontSize: 14 }}>Warte auf weitere Spieler…</div>
          </div>
        </div>
      </Card>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 8, fontWeight: 600 }}>KATEGORIEN ({cats.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cats.map(c => (
            <div key={c.id} style={{ padding: '6px 12px', borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>{c.icon} {c.label}</div>
          ))}
        </div>
      </div>

      {isAdmin
        ? <Btn onClick={onStart} size="lg" full>🚀 Spiel starten</Btn>
        : <div style={{ textAlign: 'center', color: T.muted, fontSize: 15, padding: '18px 0', background: T.surface, borderRadius: 16, border: `1px solid ${T.border}` }}>Warte auf den Admin…</div>
      }
    </Screen>
  );
}

// ── RevealScreen ─────────────────────────────────────────────

function RevealScreen({ letter, onDone }) {
  const [phase, setPhase] = React.useState(0); // 0=suspense, 1=reveal, 2=countdown
  const [count, setCount] = React.useState(3);
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  React.useEffect(() => {
    if (phase !== 2) return;
    if (count === 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, count]);

  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
      <div style={{ color: T.muted, fontSize: 18, fontFamily: T.head, fontWeight: 600 }}>
        {phase === 0 ? '⏳ Buchstabe wird gewählt…' : phase === 1 ? '🎲 Der Buchstabe ist…' : '🏃 Los geht\'s in…'}
      </div>
      <div style={{
        fontFamily: T.head, fontWeight: 900, fontSize: phase === 1 ? 140 : phase === 2 ? 100 : 0,
        color: T.primary, lineHeight: 1, transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
        textShadow: `0 0 60px ${T.primary}88`,
        letterSpacing: -4,
      }}>
        {phase === 0 ? '?' : phase === 1 ? letter : count === 0 ? '🔥' : count}
      </div>
      <div style={{ color: T.muted, fontSize: 15 }}>
        {phase === 2 && count > 0 ? 'Macht euch bereit!' : phase === 2 ? 'LOS!' : ''}
      </div>
    </Screen>
  );
}

// ── GameScreen ───────────────────────────────────────────────

function GameScreen({ letter, cats, answers, setAnswers, timer, onDone }) {
  const [timeLeft, setTimeLeft] = React.useState(timer);
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(t); onDone(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [done]);
  const pct = (timeLeft / timer) * 100;
  const barColor = timeLeft < 20 ? T.red : timeLeft < 45 ? T.secondary : T.green;
  const set = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));
  const handleDone = () => { setDone(true); onDone(); };
  return (
    <Screen pad={false}>
      {/* sticky header */}
      <div style={{ padding: '56px 20px 0', background: T.bg, position: 'sticky', top: 0, zIndex: 10, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 52, color: T.primary, lineHeight: 1 }}>{letter}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 28, color: timeLeft < 20 ? T.red : T.text }}>{timeLeft}s</div>
            <div style={{ fontSize: 12, color: T.muted }}>verbleibend</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: T.surface, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 1s linear, background 0.5s' }} />
        </div>
      </div>

      {/* inputs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cats.map(cat => (
            <div key={cat.id} style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px 0', fontSize: 13, fontWeight: 600, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{cat.icon}</span><span>{cat.label}</span>
              </div>
              <input
                value={answers[cat.id] || ''}
                onChange={e => set(cat.id, e.target.value)}
                placeholder={`${letter}…`}
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '8px 16px 14px', color: T.text, fontFamily: T.body, fontSize: 18, fontWeight: 600, outline: 'none' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Btn onClick={handleDone} size="lg" full variant="secondary">✋ Stopp! Fertig</Btn>
      </div>
    </Screen>
  );
}

// ── VotingScreen ─────────────────────────────────────────────

function VotingScreen({ cats, letter, answers, players, votingIdx, setVotingIdx, votes, setVotes, onDone }) {
  const cat = cats[votingIdx];
  const fakeAns = (FAKE_ANSWERS[letter] || FAKE_ANSWERS['B'])[cat?.id] || [];
  const allEntries = [
    { player: { id: 1, name: 'Du', emoji: '🦊' }, answer: answers[cat?.id] || '' },
    ...players.map((p, i) => ({ player: p, answer: fakeAns[i] || '–' })),
  ];
  const catVotes = votes[cat?.id] || {};
  const setVote = (pid, val) => setVotes(prev => ({ ...prev, [cat.id]: { ...(prev[cat.id] || {}), [pid]: val } }));
  const next = () => { if (votingIdx < cats.length - 1) setVotingIdx(votingIdx + 1); else onDone(); };
  if (!cat) return null;
  return (
    <Screen>
      <div style={{ fontFamily: T.head, fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Abstimmung {votingIdx + 1} / {cats.length}
      </div>
      <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 28, marginBottom: 4, letterSpacing: -0.5 }}>
        {cat.icon} {cat.label}
      </div>
      <div style={{ color: T.primary, fontFamily: T.head, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Buchstabe: {letter}</div>

      {/* progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {cats.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= votingIdx ? T.primary : T.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {allEntries.map(({ player, answer }) => {
          const v = catVotes[player.id];
          return (
            <Card key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: `1.5px solid ${v === true ? T.green + '55' : v === false ? T.red + '55' : T.border}`, background: v === true ? `${T.green}0a` : v === false ? `${T.red}0a` : T.surface }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 2 }}>{player.emoji} {player.name}</div>
                <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 20, color: answer ? T.text : T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{answer || '(leer)'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setVote(player.id, false)} style={{ width: 42, height: 42, borderRadius: 12, border: `1.5px solid ${v === false ? T.red : T.border}`, background: v === false ? `${T.red}22` : T.surfaceHigh, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✗</button>
                <button onClick={() => setVote(player.id, true)} style={{ width: 42, height: 42, borderRadius: 12, border: `1.5px solid ${v === true ? T.green : T.border}`, background: v === true ? `${T.green}22` : T.surfaceHigh, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✓</button>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ paddingTop: 20 }}>
        <Btn onClick={next} size="lg" full>{votingIdx < cats.length - 1 ? 'Nächste Kategorie →' : '🏆 Ergebnis anzeigen'}</Btn>
      </div>
    </Screen>
  );
}

// ── ResultsScreen ────────────────────────────────────────────

function ResultsScreen({ players, scores, onNewRound, onHome }) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [T.primary, 'rgba(255,255,255,0.5)', '#cd7f32'];
  return (
    <Screen>
      <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: 30, textAlign: 'center', marginBottom: 4 }}>Ergebnis</div>
      <div style={{ color: T.muted, fontSize: 14, textAlign: 'center', marginBottom: 32 }}>Glückwunsch an alle!</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            background: i === 0 ? `${T.primary}18` : T.surface,
            border: `1.5px solid ${i === 0 ? T.primary + '55' : T.border}`,
            borderRadius: 20, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            transform: i === 0 ? 'scale(1.02)' : 'scale(1)',
          }}>
            <div style={{ fontSize: 28 }}>{medals[i] || `${i + 1}.`}</div>
            <div style={{ flex: 1 }}>
              <Badge emoji={p.emoji} name={p.name + (p.id === 1 ? ' (Du)' : '')} big={i === 0} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.head, fontWeight: 900, fontSize: i === 0 ? 32 : 24, color: podiumColors[i] || T.text }}>{scores[p.id] || 0}</div>
              <div style={{ fontSize: 12, color: T.muted }}>Punkte</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
        <Btn onClick={onNewRound} size="lg" full>🔄 Neue Runde</Btn>
        <Btn onClick={onHome} variant="ghost" size="md" full>🏠 Zur Startseite</Btn>
      </div>
    </Screen>
  );
}

// ── Main App ─────────────────────────────────────────────────

function StadtLandFluss() {
  const [screen, setScreen] = React.useState('home');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [allCats, setAllCats] = React.useState(ALL_CATS);
  const [activeCats, setActiveCats] = React.useState(ALL_CATS.map(c => c.id));
  const [timer, setTimer] = React.useState(120);
  const addCat = (cat) => setAllCats(prev => [...prev, cat]);
  const removeCat = (id) => setAllCats(prev => prev.filter(c => c.id !== id));
  const [letter, setLetter] = React.useState('B');
  const [answers, setAnswers] = React.useState({});
  const [votingIdx, setVotingIdx] = React.useState(0);
  const [votes, setVotes] = React.useState({});
  const [scores, setScores] = React.useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const cats = allCats.filter(c => activeCats.includes(c.id));
  const allPlayers = [{ id: 1, name: 'Du', emoji: '🦊' }, ...FAKE_PLAYERS];
  const go = (s) => setScreen(s);

  const startGame = () => {
    const abc = 'ABCBDEFGHIKLMNOPRSTW';
    setLetter(abc[Math.floor(Math.random() * abc.length)]);
    setAnswers({}); setVotingIdx(0); setVotes({});
    go('reveal');
  };

  const finishVoting = () => {
    const s = { 1: 0, 2: 0, 3: 0, 4: 0 };
    cats.forEach(cat => {
      if (answers[cat.id]?.trim()) s[1] += 10;
      FAKE_PLAYERS.forEach(p => { if (votes[cat.id]?.[p.id] === true) s[p.id] += 10; });
    });
    setScores(s); go('results');
  };

  const props = {
    home:    { onCreate: () => { setIsAdmin(true); go('create'); }, onJoin: () => go('join') },
    create:  { cats: allCats, active: activeCats, setActive: setActiveCats, timer, setTimer, onCreate: () => go('lobby'), onBack: () => go('home'), onAddCat: addCat, onRemoveCat: removeCat },
    join:    { onJoin: () => { setIsAdmin(false); go('lobby'); }, onBack: () => go('home') },
    lobby:   { isAdmin, players: allPlayers, cats, onStart: startGame, onBack: () => go('home') },
    reveal:  { letter, onDone: () => go('game') },
    game:    { letter, cats, answers, setAnswers, timer, onDone: () => go('voting') },
    voting:  { cats, letter, answers, players: FAKE_PLAYERS, votingIdx, setVotingIdx, votes, setVotes, onDone: finishVoting },
    results: { players: allPlayers, scores, onNewRound: () => go('lobby'), onHome: () => go('home') },
  };

  const screens = { home: HomeScreen, create: CreateScreen, join: JoinScreen, lobby: LobbyScreen, reveal: RevealScreen, game: GameScreen, voting: VotingScreen, results: ResultsScreen };
  const Comp = screens[screen] || HomeScreen;
  return <Comp {...(props[screen] || {})} />;
}

Object.assign(window, { StadtLandFluss });
