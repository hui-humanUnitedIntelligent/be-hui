// src/components/ui/HuiLogo.jsx
// ═══════════════════════════════════════════════════════════════
// ZENTRALER HUI LOGO COMPONENT — Single Source of Truth
// Basiert auf dem neuen Brand-Logo: organisch, warm, fließend.
// Teal-Gradient oben + Coral-Glow unten + weiße HUI-Schrift
//
// Varianten:
//   <HuiLogo size={64} />               — Standard quadratisch
//   <HuiLogo size={40} variant="nav" /> — Kompakt für Navbar
//   <HuiLogo size={96} glow />          — Hero mit Glow-Aura
//   <HuiLogo size={48} animate />       — Mit Breathing Animation
//   <HuiLogoFull size={44} />           — Logo + Wortmarke
// ═══════════════════════════════════════════════════════════════
import React from 'react';

/**
 * Das neue HUI-Logo:
 * Rounded Square, Teal-zu-Coral Gradient, weiße HUI-Letterform
 * mit organisch fließenden Bögen — wie im Brand-Bild definiert.
 */
export function HuiLogo({
  size      = 64,
  glow      = false,
  animate   = false,
  variant   = 'default',  // 'default' | 'nav' | 'hero' | 'icon'
  className = '',
  style     = {},
}) {
  const radius = Math.round(size * 0.26);  // ~26% = Apple-style Rounding
  const glowSize = Math.round(size * 0.45);

  return (
    <div
      className={className}
      style={{
        width:    size,
        height:   size,
        position: 'relative',
        flexShrink: 0,
        ...(animate && { animation: 'hui-logo-breathe 3.5s ease-in-out infinite' }),
        ...(glow && {
          filter: [
            `drop-shadow(0 0 ${Math.round(size*0.22)}px rgba(22,215,197,0.55))`,
            `drop-shadow(0 0 ${Math.round(size*0.45)}px rgba(22,215,197,0.22))`,
            `drop-shadow(0 ${Math.round(size*0.06)}px ${Math.round(size*0.18)}px rgba(0,0,0,0.35))`,
          ].join(' '),
        }),
        ...style,
      }}
    >
      {animate && (
        <style>{`
          @keyframes hui-logo-breathe {
            0%,100% { transform: scale(1);      filter: brightness(1); }
            50%      { transform: scale(1.035);  filter: brightness(1.06); }
          }
        `}</style>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="HUI Logo"
        role="img"
      >
        <defs>
          {/* Haupt-Gradient: Teal oben-links → Coral unten-rechts */}
          <linearGradient id="hui-bg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#1ED8C8"/>
            <stop offset="45%"  stopColor="#22D4C4"/>
            <stop offset="100%" stopColor="#FF7A5C"/>
          </linearGradient>

          {/* Schimmer oben — Apple-Look */}
          <linearGradient id="hui-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
            <stop offset="60%"  stopColor="white" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>

          {/* Coral Glow unten-rechts */}
          <radialGradient id="hui-coral-glow" cx="80%" cy="80%" r="50%">
            <stop offset="0%"   stopColor="#FF8A6B" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
          </radialGradient>

          {/* Teal Glow oben-links */}
          <radialGradient id="hui-teal-glow" cx="20%" cy="20%" r="50%">
            <stop offset="0%"   stopColor="#22EDD8" stopOpacity="0.40"/>
            <stop offset="100%" stopColor="#22EDD8" stopOpacity="0"/>
          </radialGradient>

          {/* Weiche Innenrand-Schattierung */}
          <filter id="hui-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
            <feOffset dx="0" dy="2" result="offsetBlur"/>
            <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
          </filter>
        </defs>

        {/* ── Hintergrund: Rounded Square ── */}
        <rect x="3" y="3" width="114" height="114" rx="30" ry="30"
          fill="url(#hui-bg-grad)"/>

        {/* Coral Glow Layer */}
        <rect x="3" y="3" width="114" height="114" rx="30" ry="30"
          fill="url(#hui-coral-glow)"/>

        {/* Teal Glow Layer */}
        <rect x="3" y="3" width="114" height="114" rx="30" ry="30"
          fill="url(#hui-teal-glow)"/>

        {/* Glanz-Schimmer oben */}
        <rect x="3" y="3" width="114" height="62" rx="30" ry="30"
          fill="url(#hui-sheen)"/>

        {/* ── HUI Letterform — organisch, fließend ── */}
        {/* Weißer Kreis-Hintergrund für Buchstaben */}
        <circle cx="60" cy="62" r="38"
          fill="white" fillOpacity="0.92"/>

        {/* Subtiler Teal-Glow auf dem weißen Kreis */}
        <circle cx="60" cy="62" r="38"
          fill="url(#hui-teal-glow)" fillOpacity="0.3"/>

        {/* H — linker Bogen */}
        <path d="M30 42 C30 42 28 50 28 62 C28 74 30 82 30 82"
          stroke="url(#hui-bg-grad)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        {/* H — rechter Bogen */}
        <path d="M50 42 C50 42 52 50 52 62 C52 74 50 82 50 82"
          stroke="url(#hui-bg-grad)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        {/* H — Querbalken */}
        <path d="M29 62 L51 62"
          stroke="url(#hui-bg-grad)" strokeWidth="8" strokeLinecap="round" fill="none"/>

        {/* U — Bogen */}
        <path d="M56 42 L56 68 C56 76 65 83 70 76 C74 69 72 42 72 42"
          stroke="url(#hui-bg-grad)" strokeWidth="9" strokeLinecap="round"
          strokeLinejoin="round" fill="none"/>

        {/* i — Punkt */}
        <circle cx="82" cy="44" r="5.5" fill="url(#hui-bg-grad)"/>
        {/* i — Strich */}
        <path d="M82 54 L82 82"
          stroke="url(#hui-bg-grad)" strokeWidth="9" strokeLinecap="round" fill="none"/>

        {/* ── Organische Verbindungs-Bögen (Brand-Merkmal) ── */}
        {/* Teal-Bogen oben-rechts — fließende Bewegung */}
        <path d="M72 18 C85 14 100 20 108 32 C114 42 112 55 105 62"
          stroke="#22EDD8" strokeWidth="7" strokeLinecap="round" fill="none"
          strokeOpacity="0.75"/>

        {/* Coral-Bogen unten-links — Gegenbewegung */}
        <path d="M48 104 C38 108 22 104 14 92 C8 82 10 68 17 60"
          stroke="#FF8A6B" strokeWidth="7" strokeLinecap="round" fill="none"
          strokeOpacity="0.75"/>

        {/* Dezenter Außenrand */}
        <rect x="3" y="3" width="114" height="114" rx="30" ry="30"
          fill="none"
          stroke="white" strokeOpacity="0.18" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

/**
 * Logo + Wortmarke — für Header, Splash, etc.
 */
export function HuiLogoFull({
  size       = 44,
  glow       = false,
  dark       = false,      // dark=true → weiße Schrift (auf dunklem BG)
  animate    = false,
  style      = {},
}) {
  const textColor = dark ? 'rgba(255,255,255,0.95)' : '#1A1A1A';
  const subColor  = dark ? 'rgba(255,255,255,0.50)' : '#888888';

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        Math.round(size * 0.25),
      flexShrink: 0,
      ...style,
    }}>
      <HuiLogo size={size} glow={glow} animate={animate} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{
          fontWeight:    900,
          fontSize:      Math.round(size * 0.45),
          color:         textColor,
          letterSpacing: '-0.04em',
          lineHeight:    1,
          fontFamily:    'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          HUI
        </div>
        <div style={{
          fontSize:      Math.round(size * 0.22),
          color:         subColor,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight:    500,
          lineHeight:    1,
          fontFamily:    'Inter, -apple-system, sans-serif',
        }}>
          Human United Intelligent
        </div>
      </div>
    </div>
  );
}

// Default Export
export default HuiLogo;
