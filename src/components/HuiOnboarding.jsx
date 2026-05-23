/**
 * HUI ONBOARDING JOURNEY
 * 8-Screen emotionale User Journey
 * Mobile-first, Safari-safe, kein Desktop-Container
 */

import React, { useState, useEffect, useRef } from 'react';
import { HUI } from "../design/hui.design.js";

// ══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════
const T = {
  teal:    HUI.COLOR.teal,
  tealDim: 'rgba(22,215,197,0.15)',
  coral:   HUI.COLOR.coral,
  gold:    HUI.COLOR.gold,
  white:   HUI.COLOR.white,
  offwhite:'rgba(255,255,255,0.88)',
  muted:   'rgba(255,255,255,0.52)',
  dim:     'rgba(255,255,255,0.28)',
  bg:      '#0A0E1A',
  card:    'rgba(255,255,255,0.06)',
  border:  'rgba(255,255,255,0.10)',
  glass:   'rgba(255,255,255,0.08)',
};

// ══════════════════════════════════════════════════════════════════
// HUI LOGO — exakt nach Referenzbild
// Türkis-Coral Gradient, abgerundetes Quadrat, "hui" Buchstaben
// ══════════════════════════════════════════════════════════════════
function HuiLogo({ size = 56, glow = false }) {
  const id = `logo-grad-${size}`;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      background: `linear-gradient(135deg, #4ECDC4 0%, #16D7C5 40%, #FF8A6B 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      boxShadow: glow
        ? `0 0 ${size * 0.6}px rgba(22,215,197,0.5), 0 0 ${size * 1.2}px rgba(22,215,197,0.2)`
        : `0 4px 20px rgba(22,215,197,0.3)`,
      flexShrink: 0,
    }}>
      {/* Weißes Innen-Oval */}
      <div style={{
        width: size * 0.82, height: size * 0.82,
        borderRadius: size * 0.18,
        background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <svg width={size * 0.68} height={size * 0.58} viewBox="0 0 68 58" fill="none">
          {/* H — drei vertikale Balken mit Bogen */}
          <rect x="2" y="4" width="9" height="50" rx="4.5" fill="url(#lg1)" opacity="0.7"/>
          <rect x="14" y="4" width="9" height="50" rx="4.5" fill="url(#lg1)" opacity="0.85"/>
          <rect x="26" y="4" width="9" height="50" rx="4.5" fill="url(#lg1)"/>
          {/* Bogen des U unter H */}
          <path d="M2 38 Q17.5 58 33 38" stroke="url(#lg1)" strokeWidth="9" fill="none" strokeLinecap="round"/>
          {/* i — Punkt oben */}
          <circle cx="54" cy="8" r="6" fill="url(#lg1)"/>
          {/* i — Schaft schräg */}
          <rect x="47" y="18" width="9" height="36" rx="4.5" fill="url(#lg1)" transform="rotate(-8 47 18)"/>
          {/* Coral-Kurve unten rechts */}
          <path d="M38 52 Q52 62 64 48" stroke={HUI.COLOR.coral} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.9"/>
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="68" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4ECDC4"/>
              <stop offset="100%" stopColor={HUI.COLOR.teal}/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════════════════════════
function ProgressBar({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, width: '100%' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < current
            ? `linear-gradient(90deg, ${T.teal}, ${T.coral})`
            : 'rgba(255,255,255,0.18)',
          transition: 'background 0.5s ease',
        }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP LABEL
// ══════════════════════════════════════════════════════════════════
function StepLabel({ step, total, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: T.tealDim,
        border: `1px solid ${T.teal}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: T.teal,
      }}>{step}</div>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.teal,
        letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>
        {step}/{total}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HERO IMAGE mit Glow-Overlay
// ══════════════════════════════════════════════════════════════════
function HeroImage({ src, gradient, height = '52vmax', maxH = 340 }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: `min(${height}, ${maxH}px)`,
      overflow: 'hidden',
    }}>
      <img src={src} alt="" style={{
        width: '100%', height: '100%', objectFit: 'cover',
        display: 'block',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: gradient || `linear-gradient(to bottom,
          rgba(10,14,26,0.15) 0%,
          rgba(10,14,26,0.4) 60%,
          rgba(10,14,26,0.92) 85%,
          rgba(10,14,26,1) 100%)`,
      }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PRIMARY BUTTON
// ══════════════════════════════════════════════════════════════════
function PrimaryBtn({ onClick, children, disabled = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', padding: '18px 24px',
        borderRadius: 16,
        background: disabled
          ? 'rgba(255,255,255,0.12)'
          : `linear-gradient(135deg, ${T.teal} 0%, #0AB9AE 100%)`,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? T.muted : '#0A0E1A',
        fontFamily: 'inherit',
        fontSize: 16, fontWeight: 700, letterSpacing: -0.2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s ease, opacity 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? 'none' : `0 8px 32px rgba(22,215,197,0.35)`,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// SELECTION CARD (für Screen 1)
// ══════════════════════════════════════════════════════════════════
function SelectCard({ icon, title, subtitle, selected, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', padding: '16px 18px',
        borderRadius: 16,
        background: selected ? 'rgba(22,215,197,0.12)' : T.glass,
        border: `1px solid ${selected ? T.teal : T.border}`,
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 14,
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 1px ${T.teal}, 0 8px 24px rgba(22,215,197,0.15)` : 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        fontFamily: 'inherit',
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: selected ? 'rgba(22,215,197,0.2)' : 'rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
        transition: 'background 0.2s ease',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.white, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: `2px solid ${selected ? T.teal : 'rgba(255,255,255,0.25)'}`,
        background: selected ? T.teal : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.2s ease',
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1.5" stroke="#0A0E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// VALUE ROW (für Screen 5)
// ══════════════════════════════════════════════════════════════════
function ValueRow({ icon, title, subtitle, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(22,215,197,0.12)',
        border: '1px solid rgba(22,215,197,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.white, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SAFETY ROW (für Screen 6)
// ══════════════════════════════════════════════════════════════════
function SafetyRow({ icon, text, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(22,215,197,0.08)',
        border: '1px solid rgba(22,215,197,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ fontSize: 15, color: T.offwhite, lineHeight: 1.6, paddingTop: 10 }}>{text}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// LEGAL ROW (für Screen 7)
// ══════════════════════════════════════════════════════════════════
function LegalRow({ label, onPress }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', padding: '15px 18px',
        borderRadius: 14,
        background: pressed ? 'rgba(255,255,255,0.08)' : T.glass,
        border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        fontFamily: 'inherit',
      }}>
      <span style={{ fontSize: 15, color: T.offwhite, fontWeight: 500 }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND (dunkel, atmosphärisch)
// ══════════════════════════════════════════════════════════════════
function AtmoBg({ children, style = {} }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: T.bg,
      overflow: 'hidden',
      ...style,
    }}>
      {/* Blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '70%', height: '70%',
        background: 'radial-gradient(circle, rgba(22,215,197,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'hui-blob1 12s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '0%', right: '-15%',
        width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(255,138,107,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'hui-blob2 15s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <style>{`
        @keyframes hui-blob1 {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(8%, 8%) scale(1.15); }
        }
        @keyframes hui-blob2 {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-8%,-6%) scale(1.12); }
        }
        @keyframes hui-fadein {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hui-glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes hui-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN WRAPPER — sichert safe-area, kein overflow
// ══════════════════════════════════════════════════════════════════
function Screen({ children, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      animation: 'hui-fadein 0.4s ease both',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 1 — Dein Fokus
// ══════════════════════════════════════════════════════════════════
function Screen1({ onNext, data, setData }) {
  const choices = [
    {
      key: 'werke',
      icon: '🎨',
      title: 'Ich bringe Werke in die Welt',
      subtitle: 'Gemälde, Musik, Fotos, Objekte …',
    },
    {
      key: 'menschen',
      icon: '✨',
      title: 'Ich begleite Menschen',
      subtitle: 'Kurse, Events, Sessions, Reisen …',
    },
    {
      key: 'beides',
      icon: '🌿',
      title: 'Ich tue beides',
      subtitle: 'Werke schaffen und Menschen verbinden',
    },
  ];

  return (
    <Screen>
      {/* Hero-Bild: Hände mit Pflanze / Licht */}
      <div style={{
        width: '100%', height: 'min(52vmax, 300px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg,
            #0A2A1A 0%, #0D3A20 30%, #1A4A2A 60%, #0A1A28 100%)`,
        }} />
        {/* Glow-Licht wie im Referenzbild */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(245,166,35,0.7) 0%, rgba(22,215,197,0.4) 40%, transparent 75%)',
          borderRadius: '50%',
          animation: 'hui-glow-pulse 4s ease-in-out infinite',
        }} />
        {/* Dein Fokus Pill */}
        <div style={{
          position: 'absolute', bottom: 24, left: 24,
          background: 'rgba(22,215,197,0.18)',
          border: '1px solid rgba(22,215,197,0.4)',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 600, color: T.teal,
          backdropFilter: 'blur(8px)',
        }}>● Dein Fokus</div>
        {/* Gradient fade to bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: `linear-gradient(to bottom, transparent, ${T.bg})`,
        }} />
      </div>

      <div style={{ padding: '0 24px 32px' }}>
        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <StepLabel step={1} total={7} label="Dein Fokus" />
          <ProgressBar current={1} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 30, color: T.white,
          letterSpacing: -1, lineHeight: 1.15, marginBottom: 8,
        }}>
          Was beschreibt<br/>dich mehr?
        </h1>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
          Wähle deinen Weg — du kannst ihn später anpassen.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {(choices || []).filter(c => c && c.key).map(c => (
            <SelectCard
              key={c.key}
              icon={c.icon}
              title={c.title}
              subtitle={c.subtitle}
              selected={data.focus === c.key}
              onClick={() => setData(d => ({ ...d, focus: c.key }))}
            />
          ))}
        </div>

        <PrimaryBtn onClick={onNext} disabled={!data.focus}>
          Weiter →
        </PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 2 — Dein Talent
// ══════════════════════════════════════════════════════════════════
function Screen2({ onNext }) {
  return (
    <Screen>
      {/* Hero: Frau im Atelier */}
      <div style={{
        width: '100%', height: 'min(60vmax, 360px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1A1208 0%, #2A1E10 50%, #1A1A28 100%)',
        }} />
        {/* Warmes Licht Atelier-Stimmung */}
        <div style={{
          position: 'absolute', top: '20%', right: '20%',
          width: 160, height: 200,
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.5) 0%, rgba(255,138,107,0.3) 40%, transparent 75%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(26,18,8,0.2) 0%, rgba(26,18,8,0.5) 60%, rgba(10,14,26,0.95) 90%, rgba(10,14,26,1) 100%)',
        }} />
        {/* Dein Talent Pill */}
        <div style={{
          position: 'absolute', bottom: 28, left: 24,
          background: 'rgba(245,166,35,0.18)',
          border: '1px solid rgba(245,166,35,0.4)',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 600, color: HUI.COLOR.gold,
          backdropFilter: 'blur(8px)',
        }}>● Dein Talent</div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: `linear-gradient(to bottom, transparent, ${T.bg})`,
        }} />
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ marginBottom: 20 }}>
          <StepLabel step={2} total={7} label="Dein Talent" />
          <ProgressBar current={2} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 30, color: T.white,
          letterSpacing: -1, lineHeight: 1.15, marginBottom: 12,
        }}>
          Zeige, was<br/>in dir steckt
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 36 }}>
          Teile Werke, Ideen, Erlebnisse und Momente.<br/>
          Dein Talent verdient eine Bühne.
        </p>

        {/* Drei Feature-Punkte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {[
            { icon: '🎭', text: 'Werke & Kreationen teilen' },
            { icon: '💫', text: 'Deine eigene kreative Bühne' },
            { icon: '🤝', text: 'Mit echten Menschen verbinden' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: 1,
              animation: `hui-fadein 0.5s ease ${i * 0.15}s both`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{item.icon}</div>
              <span style={{ fontSize: 15, color: T.offwhite, fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 3 — Gemeinschaft
// ══════════════════════════════════════════════════════════════════
function Screen3({ onNext }) {
  return (
    <Screen>
      {/* Hero: Menschen zusammen, lachend */}
      <div style={{
        width: '100%', height: 'min(60vmax, 360px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1A2A1A 0%, #2A3520 50%, #1A2A30 100%)',
        }} />
        {/* Warmes Gemeinschafts-Licht */}
        <div style={{
          position: 'absolute', top: '30%', left: '30%',
          width: 200, height: 180,
          background: 'radial-gradient(ellipse, rgba(22,215,197,0.3) 0%, rgba(100,200,150,0.2) 50%, transparent 80%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(26,42,26,0.1) 0%, rgba(26,42,26,0.5) 60%, rgba(10,14,26,0.95) 88%, rgba(10,14,26,1) 100%)',
        }} />
        {/* Gemeinschaft Pill */}
        <div style={{
          position: 'absolute', bottom: 28, left: 24,
          background: 'rgba(22,215,197,0.15)',
          border: '1px solid rgba(22,215,197,0.35)',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 600, color: T.teal,
          backdropFilter: 'blur(8px)',
        }}>● Gemeinschaft</div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: `linear-gradient(to bottom, transparent, ${T.bg})`,
        }} />
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ marginBottom: 20 }}>
          <StepLabel step={3} total={7} label="Gemeinschaft" />
          <ProgressBar current={3} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 30, color: T.white,
          letterSpacing: -1, lineHeight: 1.15, marginBottom: 12,
        }}>
          Willkommen<br/>bei HUI
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 32 }}>
          Eine Gemeinschaft für Menschen, Talente<br/>
          und echte Herzensprojekte.<br/>
          Hier zählt, wer du bist.
        </p>

        {/* Community-Punkte */}
        <div style={{
          background: 'rgba(22,215,197,0.06)',
          border: '1px solid rgba(22,215,197,0.12)',
          borderRadius: 20, padding: '20px 20px',
          marginBottom: 36,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {[
            { emoji: '🌱', text: 'Echte Menschen, echte Begegnungen' },
            { emoji: '💡', text: 'Kreativität ohne Wettbewerb' },
            { emoji: '🌍', text: 'Gemeinsam etwas bewegen' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              animation: `hui-fadein 0.5s ease ${i * 0.12}s both`,
            }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 15, color: T.offwhite }}>{item.text}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 4 — Deine Wirkung
// ══════════════════════════════════════════════════════════════════
function Screen4({ onNext }) {
  return (
    <Screen>
      {/* Hero: Sonnenuntergang / episch */}
      <div style={{
        width: '100%', height: 'min(60vmax, 360px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(175deg, #0A1A2A 0%, #1A1A0A 30%, #2A1208 60%, #1A0A18 100%)',
        }} />
        {/* Sonnenuntergang-Glow */}
        <div style={{
          position: 'absolute', bottom: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 250, height: 150,
          background: 'radial-gradient(ellipse, rgba(245,100,35,0.8) 0%, rgba(245,166,35,0.5) 30%, rgba(255,50,100,0.2) 60%, transparent 80%)',
          borderRadius: '50%',
        }} />
        {/* Horizont */}
        <div style={{
          position: 'absolute', bottom: '18%', left: 0, right: 0,
          height: '1px',
          background: 'rgba(245,166,35,0.3)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(10,26,42,0.2) 0%, transparent 40%, rgba(10,14,26,0.9) 80%, rgba(10,14,26,1) 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
          background: `linear-gradient(to bottom, transparent, ${T.bg})`,
        }} />
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ marginBottom: 20 }}>
          <StepLabel step={4} total={7} label="Deine Wirkung" />
          <ProgressBar current={4} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 28, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 32,
        }}>
          Bereit, deine Wirkung<br/>zu entfalten?
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
          {[
            { icon: '🌿', color: '#4ECDC4', title: 'Teile dein Talent mit der Welt' },
            { icon: '❤️', color: '#FF6B6B', title: 'Verbinde dich mit echten Menschen' },
            { icon: '✦',  color: HUI.COLOR.gold, title: 'Bewirke gemeinsam Großes' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              animation: `hui-fadein 0.5s ease ${i * 0.15}s both`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${item.color}18`,
                border: `1px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{item.icon}</div>
              <span style={{ fontSize: 16, color: T.offwhite, fontWeight: 500 }}>{item.title}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onNext}>Los geht's →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 5 — Unsere Werte
// ══════════════════════════════════════════════════════════════════
function Screen5({ onNext }) {
  return (
    <Screen>
      <div style={{
        padding: 'max(52px, env(safe-area-inset-top,52px)) 24px 40px',
      }}>
        <div style={{ marginBottom: 24 }}>
          <StepLabel step={5} total={7} label="Unsere Werte" />
          <ProgressBar current={5} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 32, color: T.white,
          letterSpacing: -1, lineHeight: 1.15, marginBottom: 8,
        }}>
          Wofür wir stehen
        </h1>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 36, lineHeight: 1.6 }}>
          Diese Werte tragen uns gemeinsam.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 44 }}>
          <ValueRow icon="🤍" title="Echtheit"  subtitle="Sei du selbst. Immer."        delay={100} />
          <ValueRow icon="🤝" title="Respekt"   subtitle="Wir begegnen uns auf Augenhöhe." delay={220} />
          <ValueRow icon="🌱" title="Wachstum"  subtitle="Wir inspirieren und entwickeln uns." delay={340} />
          <ValueRow icon="🎯" title="Wirkung"   subtitle="Wir schaffen echten Mehrwert."  delay={460} />
        </div>

        {/* Glow Divider */}
        <div style={{
          height: 1, marginBottom: 32,
          background: `linear-gradient(90deg, transparent, ${T.teal}40, transparent)`,
        }} />

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 6 — Fairness & Sicherheit
// ══════════════════════════════════════════════════════════════════
function Screen6({ onNext }) {
  return (
    <Screen>
      <div style={{
        padding: 'max(52px, env(safe-area-inset-top,52px)) 24px 40px',
      }}>
        <div style={{ marginBottom: 24 }}>
          <StepLabel step={6} total={7} label="Fairness & Sicherheit" />
          <ProgressBar current={6} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 30, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 12,
        }}>
          Ein sicherer Raum<br/>für alle
        </h1>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 36, lineHeight: 1.6 }}>
          HUI ist ein Ort des Vertrauens.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 44 }}>
          <SafetyRow icon="🛡️" text="Wir schützen deine Daten und deine Privatsphäre." delay={80} />
          <SafetyRow icon="🔒" text="Wir dulden keine Diskriminierung, Hass oder Belästigung." delay={200} />
          <SafetyRow icon="⚙️" text="Du hast die Kontrolle über deine Inhalte und Sichtbarkeit." delay={320} />
        </div>

        {/* Trust Badge */}
        <div style={{
          background: 'rgba(22,215,197,0.06)',
          border: '1px solid rgba(22,215,197,0.15)',
          borderRadius: 16, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 36,
        }}>
          <div style={{ fontSize: 24 }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.teal }}>Community-Versprechen</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
              Wir bauen HUI gemeinsam auf Vertrauen und Respekt.
            </div>
          </div>
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 7 — Zustimmung / AGB
// ══════════════════════════════════════════════════════════════════
function Screen7({ onNext, data, setData }) {
  const allChecked = data.agb && data.datenschutz && data.community;

  return (
    <Screen>
      <div style={{
        padding: 'max(52px, env(safe-area-inset-top,52px)) 24px 40px',
      }}>
        <div style={{ marginBottom: 24 }}>
          <StepLabel step={7} total={7} label="Deine Zustimmung" />
          <ProgressBar current={7} total={7} />
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 28, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 10,
        }}>
          Gemeinsam gestalten<br/>wir HUI
        </h1>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>
          Bitte lies unsere Bedingungen sorgfältig durch
          und stimm zu, um Teil der HUI-Gemeinschaft zu werden.
        </p>

        {/* Dokumente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <LegalRow label="AGBs (Allgemeine Geschäftsbedingungen)" onPress={() => {}} />
          <LegalRow label="Datenschutzerklärung" onPress={() => {}} />
          <LegalRow label="Community-Richtlinien" onPress={() => {}} />
        </div>

        {/* Emotionale Checkbox */}
        <button
          onClick={() => setData(d => ({ ...d, agb: !d.agb, datenschutz: !d.agb, community: !d.agb }))}
          style={{
            width: '100%', padding: '18px 18px',
            borderRadius: 16,
            background: allChecked ? 'rgba(22,215,197,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${allChecked ? T.teal : T.border}`,
            display: 'flex', alignItems: 'flex-start', gap: 14,
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.25s ease',
            boxShadow: allChecked ? `0 0 0 1px ${T.teal}30, 0 8px 24px rgba(22,215,197,0.12)` : 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            fontFamily: 'inherit', marginBottom: 28,
          }}>
          {/* Custom Checkbox */}
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            border: `2px solid ${allChecked ? T.teal : 'rgba(255,255,255,0.3)'}`,
            background: allChecked ? T.teal : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1,
            transition: 'all 0.2s ease',
          }}>
            {allChecked && (
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#0A0E1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 15, color: allChecked ? T.offwhite : T.muted, lineHeight: 1.5 }}>
            Ich habe die Bedingungen gelesen und stimme zu.
          </span>
        </button>

        {/* CTA — emotional */}
        <PrimaryBtn onClick={onNext} disabled={!allChecked}>
          Zustimmen & Mitglied werden
        </PrimaryBtn>

        {allChecked && (
          <p style={{
            textAlign: 'center', fontSize: 12, color: T.muted,
            marginTop: 12, lineHeight: 1.5,
            animation: 'hui-fadein 0.4s ease both',
          }}>
            Du wirst Teil einer besonderen Gemeinschaft. 🌿
          </p>
        )}
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 8 — Willkommen in der HUI-Gemeinschaft
// ══════════════════════════════════════════════════════════════════
function Screen8({ onDone }) {
  const [phase, setPhase] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Stufenweise Reveal
    timerRef.current = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Screen style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', textAlign: 'center',
      padding: '0 28px max(40px, env(safe-area-inset-bottom,40px))',
    }}>
      {/* Logo mit Glow-Aura */}
      <div style={{
        position: 'relative', marginBottom: 40,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.7)',
        transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Äußerer Glow-Ring */}
        <div style={{
          position: 'absolute', inset: -30,
          background: 'radial-gradient(circle, rgba(22,215,197,0.25) 0%, rgba(255,138,107,0.15) 50%, transparent 75%)',
          borderRadius: '50%',
          animation: 'hui-glow-pulse 3s ease-in-out infinite',
        }} />
        {/* Mittlerer Ring */}
        <div style={{
          position: 'absolute', inset: -10,
          border: '1px solid rgba(22,215,197,0.2)',
          borderRadius: '50%',
          animation: 'hui-spin-slow 20s linear infinite',
        }} />
        <HuiLogo size={96} glow />
      </div>

      {/* Willkommens-Text */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.7s ease 0.3s',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <h1 style={{
          fontWeight: 900, fontSize: 30, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 16,
        }}>
          Willkommen in der<br/>HUI-Gemeinschaft!
        </h1>
        <p style={{
          fontSize: 16, color: T.muted, lineHeight: 1.7, marginBottom: 48,
          maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Schön, dass du da bist. Gemeinsam schaffen wir etwas Besonderes.
        </p>
      </div>

      {/* Stats Punkte */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 48,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease 0.5s',
      }}>
        {[
          { num: '1.000+', label: 'Kreative' },
          { num: '∞',      label: 'Möglichkeiten' },
          { num: '1',      label: 'Gemeinschaft' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: T.teal }}>{s.num}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        width: '100%', maxWidth: 340,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease 0.7s',
      }}>
        <PrimaryBtn onClick={onDone}>
          Los geht's →
        </PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN EXPORT — HuiOnboarding
// ══════════════════════════════════════════════════════════════════
export default function HuiOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    focus: null,
    agb: false,
    datenschutz: false,
    community: false,
  });

  const next = () => setStep(s => Math.min(s + 1, 8));
  const done = () => onComplete?.(data);

  return (
    <AtmoBg>
      {/* Screen Router */}
      {step === 1 && <Screen1 onNext={next} data={data} setData={setData} />}
      {step === 2 && <Screen2 onNext={next} />}
      {step === 3 && <Screen3 onNext={next} />}
      {step === 4 && <Screen4 onNext={next} />}
      {step === 5 && <Screen5 onNext={next} />}
      {step === 6 && <Screen6 onNext={next} />}
      {step === 7 && <Screen7 onNext={next} data={data} setData={setData} />}
      {step === 8 && <Screen8 onDone={done} />}
    </AtmoBg>
  );
}
