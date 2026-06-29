// src/components/orb/OrbLeaf.jsx
// ═══════════════════════════════════════════════════════════════════════
// HUI ORB — Das persönliche Blatt
// Phase 3: Integration in Tabbar · eigenes Profil · öffentliches Profil
//
// PHILOSOPHIE (gemäß HUI_CONSTITUTION.md)
//
//   Der Orb ist von Anfang an vollständig.
//   Das Blatt erzählt mit der Zeit die Geschichte des Weges eines Menschen.
//   Es verändert sich langsam — organisch, über Monate und Jahre.
//   Keine Animationen bei Interaktion. Kein "Level Up". Keine Belohnung.
//
//   ☀️  Die Sonne — identisch für alle Menschen.
//       Sie symbolisiert die gemeinsame Menschlichkeit.
//
//   🍃  Das Blatt — individuell und persönlich.
//       Es erzählt den Weg. Nicht den Wert.
//
// NUTZUNG:
//   // In der Tabbar (klein, dezent)
//   <OrbLeaf userId={userId} size={24} variant="tab" />
//
//   // Im eigenen Profil (mittel)
//   <OrbLeaf userId={userId} size={48} variant="profile" />
//
//   // Im öffentlichen Profil (groß, mit Grundpfeilern)
//   <OrbLeaf userId={userId} size={64} variant="public" showPillars />
//
// ═══════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState, memo } from 'react';
import { useOrbParams } from '../../hooks/useCoreEngine.js';
import { OrbEngine }    from '../../core/orbEngine.js';

// ─────────────────────────────────────────────────────────────────────
// CSS INJECTION (einmalig)
// ─────────────────────────────────────────────────────────────────────
let _cssInjected = false;
function injectOrbLeafCSS() {
  if (_cssInjected || typeof document === 'undefined') return;
  _cssInjected = true;

  const style = document.createElement('style');
  style.id = '__hui_orb_leaf_css__';
  style.textContent = `
    /* HUI Orb Leaf — Basis-Animationen */

    @keyframes hui-leaf-breathe {
      0%,100% { transform: scale(1) translateY(0); }
      50%      { transform: scale(1.018) translateY(-2px); }
    }

    @keyframes hui-leaf-float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }

    @keyframes hui-leaf-shimmer {
      0%,100% { opacity: 0.6; }
      50%      { opacity: 1.0; }
    }

    @keyframes hui-leaf-entry {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }

    .hui-orb-leaf {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hui-orb-leaf svg {
      overflow: visible;   /* Glow darf über Grenzen hinausgehen */
    }

    .hui-orb-leaf-tap {
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────
// ORBLEAF KOMPONENTE
// ─────────────────────────────────────────────────────────────────────

/**
 * Das HUI-Orb-Blatt — individuell und organisch.
 *
 * @param {object} props
 * @param {string}  props.userId      — Nutzer-UUID
 * @param {number}  [props.size=40]   — Größe in px
 * @param {'tab'|'profile'|'public'} [props.variant='profile']
 * @param {boolean} [props.showPillars=false] — Zeigt Grundpfeiler-Labels
 * @param {boolean} [props.animate=true]      — Sanfte Float-Animation
 * @param {function} [props.onClick]          — Optional: Tap-Handler
 * @param {object}  [props.style]             — Zusätzliche Styles
 */
export const OrbLeaf = memo(function OrbLeaf({
  userId,
  size       = 40,
  variant    = 'profile',
  showPillars = false,
  animate    = true,
  onClick,
  style,
}) {
  injectOrbLeafCSS();

  const { params, ready }   = useOrbParams(userId);
  const [entered, setEntered] = useState(false);

  // Verzögerter Entry-State für sanften Erscheinungseffekt
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, [ready]);

  const { leaf, color, glow, animation, details, dominantPillars } = params;

  // Pillar Labels (nur bei showPillars)
  const pillarLabels = showPillars ? OrbEngine.pillarLabels(dominantPillars) : [];

  // Animation-Styles
  const leafAnimation = animate && entered
    ? `hui-leaf-breathe ${animation.breathDuration} ${animation.breathEasing} infinite`
    : 'none';

  // Glow-Intensität nach Variant
  const glowOpacity = {
    tab:     0.0,   // Kein Glow in der Tabbar — zu dominant
    profile: 0.7,   // Subtiler Glow im eigenen Profil
    public:  0.85,  // Etwas stärker im öffentlichen Profil
  }[variant] ?? 0.7;

  const isClickable = !!onClick;

  return (
    <div
      className={`hui-orb-leaf${isClickable ? ' hui-orb-leaf-tap' : ''}`}
      onClick={onClick}
      style={{
        opacity: entered ? 1 : 0,
        transition: `opacity ${animation.transitionDuration} ease`,
        animation: animate && entered
          ? `hui-leaf-float ${animation.floatDuration} ${animation.floatEasing} infinite`
          : 'none',
        ...style,
      }}
    >
      {/* Das Blatt — SVG */}
      <svg
        width={size}
        height={Math.round(size * 1.33)}   // Blatt-Proportionen 3:4
        viewBox={leaf.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          animation: leafAnimation,
          filter: glowOpacity > 0
            ? `drop-shadow(0 0 ${glow.radius * 0.4}px ${color.warm})`
            : 'none',
          transition: `all ${animation.transitionDuration} ease`,
          willChange: animate ? 'transform' : 'auto',
        }}
      >
        <defs>
          {/* Sanfter Verlauf von innen nach außen */}
          <linearGradient
            id={`hui-leaf-grad-${userId?.slice(0,8) ?? 'default'}`}
            x1="20" y1="5" x2="40" y2="75"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor={color.warm} />
            <stop offset="60%"  stopColor={color.primary} />
            <stop offset="100%" stopColor={color.deep} />
          </linearGradient>

          {/* Optionaler Schimmer-Overlay */}
          {details.some(d => d.type === 'shimmer') && (
            <linearGradient
              id={`hui-leaf-shimmer-${userId?.slice(0,8) ?? 'default'}`}
              x1="10" y1="0" x2="50" y2="80"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
              <stop offset="50%"  stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </linearGradient>
          )}
        </defs>

        {/* Haupt-Blattform */}
        <path
          d={leaf.path}
          fill={`url(#hui-leaf-grad-${userId?.slice(0,8) ?? 'default'})`}
          style={{
            transition: `fill ${animation.transitionDuration} ease, d 3s ease`,
          }}
        />

        {/* Äderung — erscheint bei tieferer Wirkung */}
        {details.some(d => d.type === 'veins') && (
          <LeafVeins
            path={leaf.path}
            color={color.deep}
            opacity={details.find(d => d.type === 'veins')?.opacity ?? 0.2}
          />
        )}

        {/* Schimmer-Overlay */}
        {details.some(d => d.type === 'shimmer') && (
          <path
            d={leaf.path}
            fill={`url(#hui-leaf-shimmer-${userId?.slice(0,8) ?? 'default'})`}
            opacity={details.find(d => d.type === 'shimmer')?.opacity ?? 0.3}
            style={{ animation: `hui-leaf-shimmer 4s ease-in-out infinite` }}
          />
        )}

        {/* Zweites kleines Blatt (bei breiter Wirkung) */}
        {details.some(d => d.type === 'secondary_leaf') && (
          <SecondaryLeaf
            color={color.warm}
            opacity={details.find(d => d.type === 'secondary_leaf')?.opacity ?? 0.4}
          />
        )}
      </svg>

      {/* Grundpfeiler-Labels (nur bei showPillars) */}
      {showPillars && pillarLabels.length > 0 && (
        <PillarDisplay labels={pillarLabels} color={color.primary} />
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────
// SUB-KOMPONENTEN
// ─────────────────────────────────────────────────────────────────────

/** Dezente Blatt-Äderung */
function LeafVeins({ path, color, opacity }) {
  // Vereinfachte Äderung — Mittellinie + 2 Seitenäste
  return (
    <g opacity={opacity} stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round">
      {/* Mittellinie */}
      <path d="M30,70 C30,50 30,30 30,8" opacity="0.7" />
      {/* Linke Äste */}
      <path d="M30,50 C25,44 18,42 14,40" opacity="0.5" />
      <path d="M30,35 C26,30 20,28 17,26" opacity="0.4" />
      {/* Rechte Äste */}
      <path d="M30,50 C35,44 42,42 46,40" opacity="0.5" />
      <path d="M30,35 C34,30 40,28 43,26" opacity="0.4" />
    </g>
  );
}

/** Kleines zweites Blatt bei breiter Wirkung */
function SecondaryLeaf({ color, opacity }) {
  return (
    <path
      d="M42,68 C36,58 34,48 36,38 C38,30 44,26 48,24 C50,30 50,42 46,52 C44,58 42,64 42,68 Z"
      fill={color}
      opacity={opacity * 0.6}
      transform="rotate(-20, 45, 48)"
    />
  );
}

/** Grundpfeiler-Labels im öffentlichen Profil */
function PillarDisplay({ labels, color }) {
  return (
    <div style={{
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}>
      <p style={{
        fontSize: 11,
        color: 'rgba(20,20,34,0.45)',
        fontWeight: 500,
        letterSpacing: '0.04em',
        margin: 0,
        textTransform: 'uppercase',
      }}>
        Wirkt besonders durch
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {labels.map(({ label, icon }) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 99,
              background: 'rgba(13,196,181,0.08)',
              border: '1px solid rgba(13,196,181,0.16)',
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(20,20,34,0.75)',
            }}
          >
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HUI LOGO KOMPOSITION
// ☀️ Sonne (identisch für alle) + 🍃 Blatt (individuell)
// Wird in der Tabbar verwendet.
// ─────────────────────────────────────────────────────────────────────

/**
 * HUI-Logo mit persönlichem Blatt.
 * Sonne ist für alle identisch. Nur das Blatt ist individuell.
 *
 * @param {object} props
 * @param {string} props.userId
 * @param {number} [props.size=32] — Gesamtgröße des Logos
 */
export const HuiOrbLogo = memo(function HuiOrbLogo({ userId, size = 32, animate = false }) {
  const sunSize  = Math.round(size * 0.65);
  const leafSize = Math.round(size * 0.45);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: Math.round(size * 0.08),
      flexShrink: 0,
    }}>
      {/* Sonne — identisch für alle Menschen */}
      <HuiSun size={sunSize} />

      {/* Blatt — individuell */}
      <OrbLeaf
        userId={userId}
        size={leafSize}
        variant="tab"
        animate={animate}
      />
    </div>
  );
});

/**
 * Die HUI-Sonne — identisch für alle.
 * Warmes Teal-Gold mit sanften Strahlen.
 */
export function HuiSun({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      {/* Äußere Strahlen */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        const x1  = 20 + Math.cos(rad) * 14;
        const y1  = 20 + Math.sin(rad) * 14;
        const x2  = 20 + Math.cos(rad) * 19;
        const y2  = 20 + Math.sin(rad) * 19;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#0DC4B5"
            strokeWidth={i % 2 === 0 ? 1.8 : 1.2}
            strokeLinecap="round"
            opacity={i % 2 === 0 ? 0.9 : 0.55}
          />
        );
      })}
      {/* Sonnenkern */}
      <circle cx="20" cy="20" r="9" fill="url(#hui-sun-grad)" />
      <defs>
        <radialGradient id="hui-sun-grad" cx="40%" cy="35%">
          <stop offset="0%"   stopColor="#22DDD0" />
          <stop offset="100%" stopColor="#0DC4B5" />
        </radialGradient>
      </defs>
    </svg>
  );
}
