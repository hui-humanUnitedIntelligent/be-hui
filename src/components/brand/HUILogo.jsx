// src/components/brand/HUILogo.jsx
// ══════════════════════════════════════════════════════════════════════════════
// HUI Logo — Zentrale Markenkomponente
// @domain    COMPONENTS
// @owner     brand
// @responsibility Einzige autoritative Logo-Quelle für die gesamte App.
//
// CONSTITUTION: Das Logo darf unter keinen Umständen verändert werden.
//   - Keine Neuzeichnung, keine Vereinfachung
//   - Keine Farbänderungen, keine Effekte, keine Schatten
//   - Keine Rotation, keine Verzerrung, keine Animation des Logos selbst
//   - Die SVG-Dateien unter /assets/brand/ sind die einzige gültige Version
//
// VERWENDUNG:
//   <HUILogo />                  → Standard (48px, automatische Variante)
//   <HUILogo size={32} />        → Kleine Größe (Header, Nav)
//   <HUILogo size={80} />        → Große Größe (Splash, Onboarding)
//   <HUILogo variant="dark" />   → Dunkler Hintergrund
//   <HUILogoSmall />             → Header / Navigation (28px)
//   <HUILogoWordmark />          → Mit Wortmarke "HUI Human United Intelligence"
//
// SCHUTZRAUM: Das Parent-Element muss genügend Padding/Margin gewährleisten.
//   Empfehlung: min. 0.5 × logo-height auf allen Seiten.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

// ── Asset-Pfade ────────────────────────────────────────────────────────────
const LOGO_LIGHT    = '/assets/brand/hui-logo-light.svg';
const LOGO_DARK     = '/assets/brand/hui-logo-dark.svg';
const LOGO_WORDMARK = '/assets/brand/hui-logo-wordmark.svg';

// ── Haupt-Komponente ──────────────────────────────────────────────────────

/**
 * HUILogo — Logo-Symbol (Sonne + Blatt).
 *
 * @param {object} props
 * @param {number}  [props.size=48]         — Größe in px (width = height)
 * @param {'light'|'dark'|'auto'} [props.variant='auto'] — Farbvariante
 * @param {string}  [props.className]       — Optionale CSS-Klasse
 * @param {object}  [props.style]           — Optionale Inline-Styles (NUR für Position/Margin)
 * @param {string}  [props.alt='HUI']       — Alt-Text
 */
export function HUILogo({
  size     = 48,
  variant  = 'auto',
  className,
  style,
  alt      = 'HUI',
}) {
  const src = variant === 'dark'
    ? LOGO_DARK
    : LOGO_LIGHT;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        width:       size,
        height:      size,
        objectFit:   'contain',
        display:     'block',
        flexShrink:  0,
        userSelect:  'none',
        // CONSTITUTION: Keine filter, transform, animation auf dem Logo selbst
        ...style,
      }}
    />
  );
}

// ── Preset: Header / Navigation (klein) ────────────────────────────────────

/**
 * HUILogoSmall — Für Header, Tabbar, dezente Markenidentität.
 * Standard: 28px
 */
export function HUILogoSmall({
  size    = 28,
  variant = 'auto',
  style,
  className,
}) {
  return (
    <HUILogo
      size={size}
      variant={variant}
      style={style}
      className={className}
      alt="HUI"
    />
  );
}

// ── Preset: Header Logo ──────────────────────────────────────────────────

/**
 * HUILogoHeader — Dezenter Header-Bereich (36px).
 */
export function HUILogoHeader({
  size    = 36,
  variant = 'auto',
  style,
  className,
}) {
  return (
    <HUILogo
      size={size}
      variant={variant}
      style={style}
      className={className}
      alt="HUI"
    />
  );
}

// ── Preset: Wordmark (Symbol + Schriftzug) ────────────────────────────────

/**
 * HUILogoWordmark — Logo + "HUI / Human United Intelligence" Schriftzug.
 * Für Onboarding, Login, Einstellungen, Über HUI.
 *
 * @param {number}  [props.height=56] — Höhe des Wordmark-Bildes
 * @param {string}  [props.className]
 * @param {object}  [props.style]
 */
export function HUILogoWordmark({
  height    = 56,
  className,
  style,
}) {
  return (
    <img
      src={LOGO_WORDMARK}
      alt="HUI – Human United Intelligence"
      height={height}
      draggable={false}
      className={className}
      style={{
        height:      height,
        width:       'auto',
        objectFit:   'contain',
        display:     'block',
        flexShrink:  0,
        userSelect:  'none',
        ...style,
      }}
    />
  );
}

// ── Preset: Splash / Fullscreen ───────────────────────────────────────────

/**
 * HUILogoSplash — Für Splash Screen, Fullscreen-Loader.
 * Ruhig. Kein Effekt. Kein Breathe-Animation auf dem Logo.
 * Übergeordnete Komponente darf fade-in haben.
 *
 * @param {number}  [props.size=80]
 * @param {string}  [props.variant='light']
 */
export function HUILogoSplash({
  size    = 80,
  variant = 'light',
  style,
}) {
  return (
    <HUILogo
      size={size}
      variant={variant}
      style={style}
      alt="HUI"
    />
  );
}

// ── Default Export (für einfachen Import) ─────────────────────────────────
export default HUILogo;
