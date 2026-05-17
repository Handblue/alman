// WortKrieg — Hi-Fi Prototype Components
// Screens: Dashboard, Explore, Speaking, Leaderboard, Profile

const { useState, useEffect, useRef, useCallback } = React;

// ─── Design Tokens ────────────────────────────────────────────────
const T = {
  // Light surfaces
  bgLight:    '#F6F7FB',
  card:       '#FFFFFF',
  tint:       '#EEF2FF',
  border:     '#D9E1EC',
  text:       '#101828',
  muted:      '#5B6577',
  // Dark surfaces
  bgDark:     '#0D1B2A',
  cardDark:   '#1A2A3A',
  cardDark2:  '#243447',
  textDark:   '#F8FAFC',
  mutedDark:  '#7A93A8',
  // Primary
  violet:     '#7C6CFF',
  violetDeep: '#5A4BCC',
  violetSoft: '#E9E2FF',
  // Accents
  mint:       '#BFEFD8',
  mintDark:   '#0E3A26',
  mintMid:    '#2F6B4F',
  sky:        '#B8D8FF',
  butter:     '#E7F28B',
  peach:      '#FFC7AE',
  blush:      '#F7CDD9',
  gold:       '#FFD700',
  // Status
  success:    '#22C55E',
  error:      '#EF4444',
  purple:     '#7C4DFF',
  // Radius
  sm: 8, md: 16, lg: 24, pill: 9999,
};

// ─── Shared UI Atoms ──────────────────────────────────────────────
const Txt = ({ children, style, ...p }) => (
  <span style={{ fontFamily: "'Inter', sans-serif", ...style }} {...p}>{children}</span>
);
const Serif = ({ children, style, ...p }) => (
  <span style={{ fontFamily: "'DM Serif Display', serif", ...style }} {...p}>{children}</span>
);

function Pill({ children, bg = T.violetSoft, color = T.violetDeep, style }) {
  return (
    <span style={{
      background: bg, color, borderRadius: T.pill,
      fontSize: 11, fontWeight: 600, padding: '3px 10px',
      fontFamily: 'Inter', display: 'inline-block', ...style
    }}>{children}</span>
  );
}

function Card({ children, style, dark }) {
  return (
    <div style={{
      background: dark ? T.cardDark : T.card,
      borderRadius: T.md,
      border: dark ? `1px solid rgba(255,255,255,0.08)` : `1px solid ${T.border}`,
      boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      padding: 16,
      ...style
    }}>{children}</div>
  );
}

function Btn({ label, onPress, variant = 'primary', style, small }) {
  const h = small ? 36 : 48;
  const fs = small ? 13 : 14;
  const px = small ? 16 : 24;
  const configs = {
    primary: { bg: T.text, color: '#fff' },
    violet:  { bg: T.violet, color: '#fff' },
    ghost:   { bg: 'transparent', color: T.muted, border: `1.5px solid ${T.border}` },
    tint:    { bg: T.tint, color: T.violet },
    dark:    { bg: T.cardDark2, color: T.textDark, border: `1px solid rgba(255,255,255,0.12)` },
  };
  const c = configs[variant] || configs.primary;
  return (
    <button onClick={onPress} style={{
      height: h, padding: `0 ${px}px`, borderRadius: T.pill,
      background: c.bg, color: c.color, border: c.border || 'none',
      fontSize: fs, fontWeight: 600, fontFamily: 'Inter',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, transition: 'opacity .15s, transform .1s',
      ...style
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{label}</button>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: '⌂' },
  { id: 'explore',   label: 'Keşfet',    icon: '◎' },
  { id: 'speak',     label: 'Konuş',     icon: '●', primary: true },
  { id: 'leaderboard', label: 'Sıralama', icon: '▲' },
  { id: 'profile',   label: 'Profil',    icon: '◉' },
];

function BottomNav({ active, onNav }) {
  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 0, right: 0,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
      padding: '0 4px', zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id;
        if (item.primary) return (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            width: 56, height: 56, borderRadius: T.pill,
            background: T.violet,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${T.violet}66`,
            marginBottom: 4, flexShrink: 0,
          }}>
            <span style={{ fontSize: 24, color: '#fff' }}>🎙</span>
          </button>
        );
        return (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 10px',
          }}>
            {isActive && (
              <div style={{
                width: 32, height: 3, borderRadius: 2,
                background: T.violet, position: 'absolute',
                top: 0, transform: 'translateY(-14px)',
              }} />
            )}
            <span style={{ fontSize: 18, color: isActive ? T.violet : T.mutedDark, lineHeight: 1 }}>
              {item.icon}
            </span>
            <Txt style={{ fontSize: 10, color: isActive ? T.violet : T.mutedDark, fontWeight: isActive ? 600 : 400 }}>
              {item.label}
            </Txt>
          </button>
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ value, max, color = T.violet, style }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 6, background: T.border, borderRadius: T.pill, overflow: 'hidden', ...style }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: T.pill, transition: 'width .4s' }} />
    </div>
  );
}

// ─── SCREEN: Dashboard ────────────────────────────────────────────
function DashboardScreen({ onNav }) {
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ flex: 1, background: T.bgLight, overflowY: 'auto', paddingBottom: 90 }}>
      {/* Achievement Toast */}
      {showToast && (
        <div style={{
          position: 'absolute', top: 52, left: 16, right: 16,
          background: T.text, color: '#fff', borderRadius: T.md, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'slideDown .3s ease',
        }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <Txt style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'block' }}>Yeni Rozet!</Txt>
            <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', display: 'block' }}>7 günlük seri</Txt>
          </div>
          <button onClick={() => setShowToast(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Serif style={{ fontSize: 28, color: T.text, display: 'block', lineHeight: 1.15 }}>WortKrieg</Serif>
          <Txt style={{ fontSize: 13, color: T.muted, display: 'block', marginTop: 2 }}>Bugün ne öğreniyoruz?</Txt>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ background: T.text, borderRadius: T.pill, padding: '4px 10px' }}>
            <Txt style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>Seviye 7</Txt>
          </div>
          <Txt style={{ fontSize: 13, color: T.text }}>🔥 14</Txt>
          <Txt style={{ fontSize: 12, color: T.peach }}>1 240 XP</Txt>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hero Continue Card */}
        <div style={{
          background: T.violet, borderRadius: T.lg, padding: '22px 22px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -24, top: -32, width: 140, height: 140,
            borderRadius: '50%', background: 'rgba(255,255,255,0.10)',
          }} />
          <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Kaldığın yerden devam et
          </Txt>
          <Serif style={{ fontSize: 24, color: '#fff', display: 'block', lineHeight: 1.2, marginBottom: 4 }}>
            Seyahat Kelimeleri
          </Serif>
          <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 16 }}>
            Ders 6 · 12 dk kaldı
          </Txt>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => onNav('speak')} style={{
              background: '#fff', border: 'none', borderRadius: T.pill,
              padding: '9px 18px', fontSize: 13, fontWeight: 600, color: T.text,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ▶ Devam Et
            </button>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: T.pill, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '67%', background: '#fff', borderRadius: T.pill }} />
            </div>
          </div>
        </div>

        {/* Stat Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🔥', val: '14', label: 'Streak · gün', bg: T.peach },
            { icon: '⚡', val: '320', label: 'XP · bugün', bg: T.butter },
            { icon: '🏆', val: '#42', label: 'Sıralama · haftalık', bg: T.violetSoft },
            { icon: '🎯', val: '86%', label: 'Doğruluk · son', bg: T.sky },
          ].map((s, i) => (
            <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {s.icon}
              </div>
              <div>
                <Txt style={{ fontSize: 26, fontWeight: 700, color: T.text, display: 'block', lineHeight: 1 }}>{s.val}</Txt>
                <Txt style={{ fontSize: 11, color: T.muted, display: 'block', marginTop: 4 }}>{s.label}</Txt>
              </div>
            </Card>
          ))}
        </div>

        {/* Daily Challenge */}
        <Card style={{ background: T.mintDark, border: 'none', borderRadius: T.lg, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <Txt style={{ fontSize: 11, color: T.mint, display: 'block', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>GÜNLÜK GÖREV</Txt>
              <Serif style={{ fontSize: 20, color: '#fff', display: 'block' }}>B1 Kelime Savaşı</Serif>
              <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: 4 }}>⏱ 3:42 kaldı · +50 XP</Txt>
            </div>
            <Pill bg="rgba(191,239,216,0.2)" color={T.mint}>YENİ</Pill>
          </div>
          <ProgressBar value={3} max={10} color={T.mint} />
          <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginTop: 6 }}>3 / 10 tamamlandı</Txt>
        </Card>

        {/* Review Due */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div style={{ flex: 1 }}>
            <Txt style={{ fontSize: 14, fontWeight: 600, color: T.text, display: 'block' }}>Tekrar Zamanı!</Txt>
            <Txt style={{ fontSize: 12, color: T.muted, display: 'block' }}>28 kelime seni bekliyor</Txt>
          </div>
          <div style={{ background: T.violet, borderRadius: 20, minWidth: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
            <Txt style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>28</Txt>
          </div>
        </Card>

        {/* Battle Promo */}
        <div
          onClick={() => onNav('leaderboard')}
          style={{
            background: 'linear-gradient(135deg, #7C4DFF, #1A73E8)',
            borderRadius: T.md, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
          <span style={{ fontSize: 28 }}>⚔️</span>
          <div style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'block' }}>WortKampf</Txt>
            <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block' }}>Canlı savaş · ELO kazan!</Txt>
          </div>
          <Txt style={{ color: '#fff', fontSize: 20 }}>→</Txt>
        </div>

        {/* Son Çalışılan */}
        <div>
          <Txt style={{ fontSize: 15, fontWeight: 700, color: T.text, display: 'block', marginBottom: 10 }}>Son Çalışılan</Txt>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { title: 'Seyahat', sub: '45 kelime', prog: 67, color: T.sky },
              { title: 'Günlük Hayat', sub: '62 kelime', prog: 32, color: T.mint },
              { title: 'Goethe B1', sub: '120 kelime', prog: 18, color: T.violetSoft },
            ].map((u, i) => (
              <div key={i} onClick={() => onNav('explore')} style={{
                minWidth: 130, background: T.card, borderRadius: T.md,
                border: `1px solid ${T.border}`, padding: 14, cursor: 'pointer',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: u.color, marginBottom: 10 }} />
                <Txt style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block' }}>{u.title}</Txt>
                <Txt style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 8 }}>{u.sub}</Txt>
                <ProgressBar value={u.prog} max={100} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Explore ──────────────────────────────────────────────
function ExploreScreen({ onNav }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const filters = ['Tümü', 'A1-A2', 'B1-B2', 'Gramer', 'Konuşma'];

  const playlists = [
    { title: 'Goethe B1 Paketi', desc: 'Sınava hazırlık · 30 gün', emoji: '🎓', grad: 'linear-gradient(135deg,#512DA8,#7C4DFF)' },
    { title: 'Günlük Almanca', desc: 'Market, doktor, ulaşım', emoji: '🏪', grad: 'linear-gradient(135deg,#1A73E8,#00BCD4)' },
    { title: 'Deyimler', desc: 'Almanlar gibi konuş', emoji: '💬', grad: 'linear-gradient(135deg,#FF6D00,#FFCA28)' },
    { title: 'Gramer Ustası', desc: 'A1\'den C1\'e', emoji: '📚', grad: 'linear-gradient(135deg,#7C4DFF,#00BCD4)' },
  ];

  const categories = [
    { name: 'Seyahat', icon: '✈️', color: T.sky, count: 45 },
    { name: 'İş Hayatı', icon: '💼', color: T.violetSoft, count: 82 },
    { name: 'Yiyecek', icon: '🍽️', color: T.peach, count: 36 },
    { name: 'Sağlık', icon: '❤️', color: T.blush, count: 54 },
    { name: 'Eğitim', icon: '📖', color: T.mint, count: 68 },
    { name: 'Teknoloji', icon: '💻', color: T.butter, count: 41 },
  ];

  return (
    <div style={{ flex: 1, background: T.bgLight, overflowY: 'auto', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <Serif style={{ fontSize: 28, color: T.text, display: 'block' }}>Keşfet</Serif>
        <Txt style={{ fontSize: 13, color: T.muted, display: 'block', marginTop: 2, marginBottom: 14 }}>
          Öğrenmek istediğin her şey burada
        </Txt>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.card, borderRadius: T.md, border: `1px solid ${T.border}`,
          padding: '11px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 15, color: T.muted }}>🔍</span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Kelime ara… (Almanca veya Türkçe)"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              color: T.text, background: 'transparent', fontFamily: 'Inter',
            }}
          />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13 }}>✕</button>}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              borderRadius: T.pill, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              fontFamily: 'Inter', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeFilter === f ? T.violet : T.card,
              color: activeFilter === f ? '#fff' : T.muted,
              border: activeFilter === f ? 'none' : `1px solid ${T.border}`,
              transition: 'all .15s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Featured Playlists */}
        <div>
          <Txt style={{ fontSize: 15, fontWeight: 700, color: T.text, display: 'block', marginBottom: 12 }}>✨ Öne Çıkanlar</Txt>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {playlists.map((p, i) => (
              <div key={i} style={{
                minWidth: 160, borderRadius: T.lg, padding: '16px 14px',
                background: p.grad, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <span style={{ fontSize: 26 }}>{p.emoji}</span>
                <Txt style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{p.title}</Txt>
                <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', display: 'block' }}>{p.desc}</Txt>
              </div>
            ))}
          </div>
        </div>

        {/* Battle Promo */}
        <div onClick={() => onNav('leaderboard')} style={{
          background: 'linear-gradient(90deg, #7C4DFF, #00BCD4)',
          borderRadius: T.md, padding: '16px 18px',
          display: 'flex', alignItems: 'center', cursor: 'pointer',
        }}>
          <div style={{ flex: 1 }}>
            <Txt style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'block' }}>⚔️ WortKampf</Txt>
            <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'block', marginTop: 2 }}>Canlı 1v1 savaşa katıl · ELO kazan!</Txt>
          </div>
          <Txt style={{ color: '#fff', fontSize: 24 }}>›</Txt>
        </div>

        {/* Categories */}
        <div>
          <Txt style={{ fontSize: 15, fontWeight: 700, color: T.text, display: 'block', marginBottom: 12 }}>📂 Kategoriler</Txt>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((c, i) => (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 14, fontWeight: 600, color: T.text, display: 'block' }}>{c.name}</Txt>
                  <Txt style={{ fontSize: 12, color: T.muted }}>{c.count} kelime</Txt>
                </div>
                <Txt style={{ color: T.muted, fontSize: 20 }}>›</Txt>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['1 240', 'Kelime'], ['48', 'Ünite'], ['12', 'Kategori']].map(([n, l], i) => (
            <Card key={i} style={{ textAlign: 'center', padding: '14px 8px' }}>
              <Txt style={{ fontSize: 22, fontWeight: 900, color: T.violet, display: 'block' }}>{n}</Txt>
              <Txt style={{ fontSize: 11, color: T.muted }}>{l}</Txt>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Speaking ─────────────────────────────────────────────
function SpeakScreen() {
  const [recState, setRecState] = useState('idle'); // idle | recording | processing | result | done
  const [wordIdx, setWordIdx] = useState(0);
  const [score, setScore] = useState(null);
  const [sessionScores, setSessionScores] = useState([]);
  const [pulse, setPulse] = useState(false);

  const words = [
    { german: 'Reisepass', turkish: 'Pasaport', phonetic: '≈ "Raysepas"', example: 'Ich brauche meinen Reisepass.', exampleTr: 'Pasaportuma ihtiyacım var.' },
    { german: 'Flughafen', turkish: 'Havalimanı', phonetic: '≈ "Flughafen"', example: 'Der Flughafen ist weit.', exampleTr: 'Havalimanı uzak.' },
    { german: 'Gepäck', turkish: 'Bagaj', phonetic: '≈ "Gepek"', example: 'Mein Gepäck ist schwer.', exampleTr: 'Bagajım ağır.' },
  ];

  const word = words[wordIdx];
  const total = words.length;

  useEffect(() => { setScore(null); setRecState('idle'); }, [wordIdx]);
  useEffect(() => {
    if (recState === 'recording') {
      const id = setInterval(() => setPulse(p => !p), 600);
      return () => clearInterval(id);
    }
  }, [recState]);

  function handleMic() {
    if (recState === 'idle') { setRecState('recording'); return; }
    if (recState === 'recording') {
      setRecState('processing');
      setTimeout(() => {
        const s = Math.floor(Math.random() * 2) + 3; // 3-4 for demo
        setScore(s);
        setRecState('result');
      }, 1400);
    }
  }

  function handleNext() {
    if (score) setSessionScores(p => [...p, score]);
    if (wordIdx + 1 < total) { setWordIdx(i => i + 1); setScore(null); }
    else setRecState('done');
  }

  const scoreLabels = ['', 'Zayıf', 'Gelişmeli', 'Fena Değil', 'İyi!', 'Mükemmel! ★'];
  const scoreColors = ['', '#EF4444', '#FF8C00', '#F59E0B', '#22C55E', T.gold];

  if (recState === 'done') {
    const allScores = [...sessionScores, score].filter(Boolean);
    const avg = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : 0;
    const perfect = allScores.filter(s => s === 5).length;
    return (
      <div style={{ flex: 1, background: T.bgDark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 20 }}>
        <span style={{ fontSize: 56 }}>{avg >= 4 ? '🎤' : '💪'}</span>
        <Serif style={{ fontSize: 28, color: T.textDark, textAlign: 'center', display: 'block' }}>Telaffuz Tamamlandı!</Serif>
        <Card dark style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['Ortalama Skor', `${avg} / 5`, scoreColors[Math.round(avg)] || T.violet],
            ['Mükemmel', `${perfect} kelime ★`, T.gold],
            ['XP Kazanıldı', `+${total * 8}`, T.violet],
          ].map(([l, v, c], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt style={{ fontSize: 13, color: T.mutedDark }}>{l}</Txt>
              <Txt style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</Txt>
            </div>
          ))}
        </Card>
        <Btn label="Geri Dön" variant="dark" onPress={() => { setWordIdx(0); setScore(null); setSessionScores([]); setRecState('idle'); }} style={{ width: '100%' }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: T.bgDark, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'hidden' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Txt style={{ fontSize: 12, color: T.mutedDark, whiteSpace: 'nowrap' }}>{wordIdx + 1} / {total}</Txt>
        <ProgressBar value={wordIdx + 1} max={total} color={T.violet} style={{ flex: 1 }} />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.mutedDark, fontSize: 18 }}>✕</button>
      </div>

      {/* Word Card */}
      <Card dark style={{ alignItems: 'center', textAlign: 'center', padding: '24px 20px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Pill bg={T.violetSoft} color={T.violet}>A2 · Seyahat</Pill>
        <Serif style={{ fontSize: 36, color: T.textDark, display: 'block', lineHeight: 1.15, marginTop: 4 }}>{word.german}</Serif>
        <Txt style={{ fontSize: 13, color: T.mutedDark, fontStyle: 'italic', display: 'block' }}>{word.phonetic}</Txt>
        <Txt style={{ fontSize: 14, color: T.mutedDark, display: 'block' }}>{word.turkish}</Txt>
        <button style={{ marginTop: 6, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: T.pill, padding: '7px 16px', fontSize: 12, color: T.mutedDark, cursor: 'pointer', fontFamily: 'Inter' }}>
          🔈 Tekrar Dinle
        </button>
      </Card>

      {/* Example */}
      <Card dark style={{ padding: '12px 16px', marginBottom: 20 }}>
        <Txt style={{ fontSize: 13, color: T.mutedDark, display: 'block' }}>{word.example}</Txt>
        <Txt style={{ fontSize: 11, color: 'rgba(122,147,168,0.6)', display: 'block', marginTop: 3 }}>{word.exampleTr}</Txt>
      </Card>

      {/* Mic Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {recState === 'idle' && !score && (
          <Txt style={{ fontSize: 13, color: T.mutedDark, textAlign: 'center' }}>Butona bas ve kelimeyi söyle</Txt>
        )}
        {recState === 'recording' && (
          <Txt style={{ fontSize: 13, color: '#EF4444', textAlign: 'center' }}>Dinliyorum… durdurmak için tekrar bas</Txt>
        )}
        {recState === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 4, height: 12 + Math.sin(i * 1.2) * 8,
                  background: T.violet, borderRadius: 2, opacity: 0.6 + i * 0.08,
                  animation: 'wave .8s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
            <Txt style={{ fontSize: 12, color: T.mutedDark }}>Telaffuz analiz ediliyor…</Txt>
          </div>
        )}

        <button
          onClick={handleMic}
          disabled={recState === 'processing'}
          style={{
            width: 80, height: 80, borderRadius: '50%', fontSize: 32,
            border: `2px solid ${recState === 'recording' ? '#EF4444' : recState === 'processing' ? T.cardDark2 : T.violet}`,
            background: recState === 'recording' ? 'rgba(239,68,68,0.15)' : recState === 'processing' ? T.cardDark2 : `rgba(124,108,255,0.15)`,
            cursor: recState === 'processing' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: recState === 'recording' && pulse ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform .25s, border-color .2s, background .2s',
            boxShadow: recState === 'recording' ? `0 0 0 12px rgba(239,68,68,0.12)` : recState === 'idle' ? `0 0 0 12px rgba(124,108,255,0.10)` : 'none',
          }}>
          <span>{recState === 'recording' ? '⏹' : recState === 'processing' ? '⏳' : '🎙️'}</span>
        </button>
      </div>

      {/* Result Card */}
      {recState === 'result' && score && (
        <Card dark style={{ alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, padding: 20, borderColor: scoreColors[score] + '50', border: `1px solid ${scoreColors[score]}50` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <Txt key={i} style={{ fontSize: 22, color: T.gold, opacity: i <= score ? 1 : 0.2 }}>★</Txt>
            ))}
          </div>
          <Txt style={{ fontSize: 18, fontWeight: 700, color: scoreColors[score], display: 'block' }}>{scoreLabels[score]}</Txt>
          <Txt style={{ fontSize: 12, color: T.mutedDark, display: 'block' }}>
            {score >= 4 ? 'Harika! Son hece biraz daha kısa olabilir.' : 'İlk sesi güzel söyledin. Son heceyi kısalt.'}
          </Txt>
          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
            <button onClick={handleMic} style={{ flex: 1, background: 'none', border: `1px solid ${T.cardDark2}`, borderRadius: T.pill, padding: '10px', fontSize: 12, color: T.mutedDark, cursor: 'pointer', fontFamily: 'Inter' }}>
              Tekrar Dene
            </button>
            <Btn label={wordIdx + 1 < total ? 'Sonraki →' : 'Bitir'} onPress={handleNext} variant="violet" style={{ flex: 1 }} />
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SCREEN: Leaderboard ──────────────────────────────────────────
function LeaderboardScreen() {
  const [tab, setTab] = useState('weekly');

  const users = [
    { rank: 1, name: 'Elif K.', xp: 4820, avatar: '👩', change: '+3' },
    { rank: 2, name: 'Mehmet A.', xp: 4215, avatar: '👨', change: '-1' },
    { rank: 3, name: 'Zeynep T.', xp: 3970, avatar: '👩‍🦱', change: '+1' },
    { rank: 4, name: 'Ali R.', xp: 3640, avatar: '🧑', change: '0' },
    { rank: 5, name: 'Selin B.', xp: 3210, avatar: '👩‍🦳', change: '+2' },
    { rank: 42, name: 'Sen', xp: 1240, avatar: '🙂', change: '+5', isMe: true },
  ];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ flex: 1, background: T.bgDark, overflowY: 'auto', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '22px 20px 16px' }}>
        <Serif style={{ fontSize: 28, color: T.textDark, display: 'block' }}>Sıralama</Serif>
        <Txt style={{ fontSize: 13, color: T.mutedDark, display: 'block', marginTop: 2 }}>Haftanın en iyileri</Txt>
      </div>

      {/* My Rank Card */}
      <div style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg, #512DA8, #7C4DFF)', borderRadius: T.lg, padding: '18px 20px' }}>
        <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>SENIN SIRALAMAN</Txt>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🙂</div>
          <div style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'block' }}>Sen</Txt>
            <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'block' }}>1 240 XP bu hafta</Txt>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Serif style={{ fontSize: 32, color: '#fff', display: 'block', lineHeight: 1 }}>#42</Serif>
            <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>↑ +5 bu hafta</Txt>
          </div>
        </div>
        <ProgressBar value={1240} max={4820} color="rgba(255,255,255,0.9)" style={{ marginTop: 14, background: 'rgba(255,255,255,0.15)' }} />
        <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 6 }}>3 580 XP sonra #1 olursun</Txt>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', margin: '0 16px 16px', background: T.cardDark2, borderRadius: T.pill, padding: 3 }}>
        {['weekly', 'alltime'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', borderRadius: T.pill,
            background: tab === t ? T.violet : 'transparent',
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
            color: tab === t ? '#fff' : T.mutedDark, transition: 'all .2s',
          }}>
            {t === 'weekly' ? 'Bu Hafta' : 'Tüm Zamanlar'}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map((u, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: u.isMe ? `${T.violet}22` : T.cardDark,
            border: u.isMe ? `1.5px solid ${T.violet}60` : `1px solid rgba(255,255,255,0.06)`,
            borderRadius: T.md, padding: '12px 14px',
          }}>
            <Txt style={{ fontSize: 16, width: 28, textAlign: 'center', color: u.rank <= 3 ? '#fff' : T.mutedDark, fontWeight: 700 }}>
              {u.rank <= 3 ? medals[u.rank - 1] : `#${u.rank}`}
            </Txt>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.cardDark2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {u.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <Txt style={{ fontSize: 14, fontWeight: u.isMe ? 700 : 500, color: T.textDark, display: 'block' }}>{u.name}</Txt>
              <Txt style={{ fontSize: 11, color: T.mutedDark }}>{u.xp.toLocaleString()} XP</Txt>
            </div>
            <Txt style={{ fontSize: 12, color: u.change.startsWith('+') ? '#22C55E' : u.change === '0' ? T.mutedDark : '#EF4444', fontWeight: 600 }}>
              {u.change !== '0' ? u.change : '—'}
            </Txt>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN: Profile ──────────────────────────────────────────────
function ProfileScreen() {
  const [tab, setTab] = useState('progress');

  const badges = [
    { icon: '🔥', label: '7 Gün Seri', color: T.peach },
    { icon: '🎤', label: 'İlk Kayıt', color: T.mint },
    { icon: '⚔️', label: 'İlk Savaş', color: T.violetSoft },
    { icon: '📚', label: 'B1 Bitirildi', color: T.sky },
    { icon: '🏆', label: 'Top 50', color: T.butter },
    { icon: '🌟', label: '1000 XP', color: T.blush },
  ];

  return (
    <div style={{ flex: 1, background: T.bgLight, overflowY: 'auto', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: T.text, padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🙂</div>
        <div style={{ textAlign: 'center' }}>
          <Serif style={{ fontSize: 22, color: '#fff', display: 'block' }}>Ahmet Yılmaz</Serif>
          <Txt style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 2 }}>@ahmetyilmaz · B1 Seviyesi</Txt>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
          {[['1 240', 'XP'], ['14', 'Streak'], ['#42', 'Sıralama']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <Txt style={{ fontSize: 20, fontWeight: 700, color: '#fff', display: 'block' }}>{v}</Txt>
              <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{l}</Txt>
            </div>
          ))}
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.card }}>
        {['progress', 'badges', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
            color: tab === t ? T.violet : T.muted,
            borderBottom: tab === t ? `2px solid ${T.violet}` : '2px solid transparent',
            transition: 'all .15s',
          }}>
            {t === 'progress' ? 'İlerleme' : t === 'badges' ? 'Rozetler' : 'İstatistik'}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'progress' && (
          <>
            {[
              { label: 'Seyahat', prog: 67, color: T.sky, words: '45/67' },
              { label: 'İş Hayatı', prog: 42, color: T.violet, words: '35/82' },
              { label: 'Günlük Hayat', prog: 88, color: T.mint, words: '55/62' },
              { label: 'Gramer', prog: 25, color: T.butter, words: '30/120' },
            ].map((c, i) => (
              <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.label}</Txt>
                  <Txt style={{ fontSize: 11, color: T.muted }}>{c.words} kelime</Txt>
                </div>
                <ProgressBar value={c.prog} max={100} color={c.color} />
                <Txt style={{ fontSize: 11, color: T.muted }}>%{c.prog} tamamlandı</Txt>
              </Card>
            ))}
          </>
        )}

        {tab === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {badges.map((b, i) => (
              <Card key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {b.icon}
                </div>
                <Txt style={{ fontSize: 10, color: T.muted, textAlign: 'center', lineHeight: 1.3 }}>{b.label}</Txt>
              </Card>
            ))}
          </div>
        )}

        {tab === 'stats' && (
          <>
            {[
              ['📅', 'Toplam Gün', '42 gün'],
              ['🎤', 'Telaffuz Oturumu', '87'],
              ['📖', 'Öğrenilen Kelime', '312'],
              ['⚔️', 'Savaş Kazanılan', '14 / 20'],
              ['🎯', 'Doğruluk Ort.', '%82.4'],
              ['🔥', 'En Uzun Seri', '21 gün'],
            ].map(([icon, l, v], i) => (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{icon}</span>
                <Txt style={{ flex: 1, fontSize: 13, color: T.text }}>{l}</Txt>
                <Txt style={{ fontSize: 14, fontWeight: 700, color: T.violet }}>{v}</Txt>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────
function WortKriegApp() {
  const [screen, setScreen] = useState('dashboard');

  const screenComponents = {
    dashboard: <DashboardScreen onNav={setScreen} />,
    explore:   <ExploreScreen onNav={setScreen} />,
    speak:     <SpeakScreen />,
    leaderboard: <LeaderboardScreen />,
    profile:   <ProfileScreen />,
  };

  const isDark = ['speak', 'leaderboard'].includes(screen);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: isDark ? T.bgDark : T.bgLight,
      position: 'relative', overflow: 'hidden',
      borderRadius: 40,
    }}>
      {screenComponents[screen]}
      {screen !== 'speak' && <BottomNav active={screen} onNav={setScreen} />}
      {screen === 'speak' && (
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <button onClick={() => setScreen('dashboard')} style={{
            background: T.cardDark2, border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: T.pill, padding: '10px 24px', fontSize: 12,
            color: T.mutedDark, cursor: 'pointer', fontFamily: 'Inter',
          }}>← Geri</button>
        </div>
      )}
    </div>
  );
}

// Export
Object.assign(window, { WortKriegApp });
