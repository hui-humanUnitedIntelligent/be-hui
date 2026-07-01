// src/components/brand/HUILogo.jsx
// ══════════════════════════════════════════════════════════════════════════════
// HUI Logo — Einzige autoritative Markenkomponente
// @domain    COMPONENTS
// @owner     brand
//
// CONSTITUTION:
//   - Einzige Logo-Datei: /assets/brand/hui-logo.png (RGBA, transparenter Hintergrund)
//   - Keine Hintergründe, keine Container, keine Umrandungen
//   - Das Logo liegt freistehend auf der App-Oberfläche
//   - Keine Rotation, kein Pulsieren, keine Morphing-Effekte auf dem Logo selbst
//   - Animationen NUR am Container (sanfte Skalierung, Elevation, Transition)
//
// VERWENDUNG:
//   <HUILogo />                  → Standard (48px)
//   <HUILogo size={32} />        → Klein (Header, Nav)
//   <HUILogo size={80} />        → Groß (Splash, Onboarding)
//   <HUILogoNav />               → Bottom Navigation (elegant, leicht größer)
//   <HUILogoSplash />            → Splash Screen / Loader (80px)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

// ── Einzige offizielle Logo-Datei ─────────────────────────────────────────
const LOGO = '/assets/brand/hui-logo.png';

// ── Basis-Komponente ──────────────────────────────────────────────────────

/**
 * HUILogo — Das offizielle HUI-Logo.
 * Freistehend, transparenter Hintergrund, kein Container.
 *
 * @param {number}  [size=48]     — Breite & Höhe in px
 * @param {string}  [className]   — Optionale CSS-Klasse
 * @param {object}  [style]       — Nur für Position/Margin (KEIN background, border, shadow)
 * @param {string}  [alt='HUI']
 */
export function HUILogo({ size = 48, className, style, alt = 'HUI' }) {
  return (
    <img
      src={LOGO}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        width:      size,
        height:     size,
        objectFit:  'contain',
        display:    'block',
        flexShrink: 0,
        userSelect: 'none',
        // CONSTITUTION: kein background, border, borderRadius, boxShadow, filter, transform
        ...style,
      }}
    />
  );
}

// ── Bottom Navigation — eleganter Mittelpunkt der Tabbar ─────────────────

/**
 * HUILogoNav — Logo als zentraler "Mein HUI"-Button in der Bottom Navigation.
 *
 * Etwas größer als die übrigen Tabs.
 * Leicht über der Tabbar schwebend — organisch, nicht gamifiziert.
 * Animationen NUR am Container (scale, translateY) — niemals am Logo.
 *
 * @param {boolean} [active=false] — Ob der Tab aktiv ist
 * @param {number}  [size=46]      — Logo-Größe
 * @param {object}  [style]        — Container-Style-Overrides
 */
/** @deprecated Orb nutzt jetzt direktes img in HUIBottomNavigation */
export function HUILogoNav({ active = false, size = 46, style }) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        // Schwebt leicht über der Tabbar
        marginTop:      -12,
        padding:        0,
        // Sanfte Skalierung bei aktivem Zustand (am Container, nicht am Logo)
        transform:      active ? 'scale(1.08) translateY(-2px)' : 'scale(1) translateY(0)',
        transition:     'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        willChange:     'transform',
        ...style,
      }}
    >
      <HUILogo size={size} alt="Mein HUI" />
    </div>
  );
}

// ── Splash Screen ─────────────────────────────────────────────────────────

/**
 * HUILogoSplash — Für Splash Screen & Ladebildschirme.
 * Kein Breathe, kein Pulsieren auf dem Logo.
 * Übergeordneter Container darf fade-in haben.
 *
 * @param {number} [size=80]
 * @param {object} [style]
 */
export function HUILogoSplash({ size = 80, style }) {
  return <HUILogo size={size} style={style} alt="HUI" />;
}

// ── Wordmark-Variante (Logo + Text nebeneinander) ─────────────────────────

/**
 * HUILogoWordmark — Logo + "HUI" Schriftzug.
 * Für Login, Einstellungen, Onboarding.
 *
 * @param {number} [logoSize=44]  — Logo-Größe
 * @param {object} [style]        — Container-Style
 */
export function HUILogoWordmark({ logoSize = 44, style }) {
  return (
    <div
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         12,
        ...style,
      }}
    >
      <HUILogo size={logoSize} />
      <div>
        <div style={{
          fontWeight:    800,
          fontSize:      Math.round(logoSize * 0.52),
          color:         '#1C4A3E',
          letterSpacing: '-0.02em',
          lineHeight:    1.1,
        }}>
          HUI
        </div>
        <div style={{
          fontWeight:    400,
          fontSize:      Math.round(logoSize * 0.26),
          color:         '#1C4A3E',
          opacity:       0.65,
          letterSpacing: '0.02em',
          lineHeight:    1.3,
        }}>
          Human United Intelligence
        </div>
      </div>
    </div>
  );
}

// ── Small / Header ────────────────────────────────────────────────────────

/** HUILogoSmall — Navigation, Header (28px) */
export function HUILogoSmall({ size = 28, style, className }) {
  return <HUILogo size={size} style={style} className={className} />;
}

/** HUILogoHeader — Header-Bereich (36px) */
export function HUILogoHeader({ size = 36, style, className }) {
  return <HUILogo size={size} style={style} className={className} />;
}

// ── Default ───────────────────────────────────────────────────────────────
export default HUILogo;
