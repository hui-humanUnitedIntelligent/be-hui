/**
 * HUI Interaction Language v1.0
 * ──────────────────────────────────────────────────────────────────────────
 * Single Source of Truth für die vier universellen HUI-Interaktionen.
 * 1:1 aus der von Lars freigegebenen Referenzgrafik übernommen
 * (2026-07-05) — keine eigene Interpretation, keine Farb-/Proportions-
 * änderungen.
 *
 *   🌱 Resonanz    — "Das hat etwas in mir bewegt."     → Wertschätzung zeigen.
 *   🤝 Austauschen — "Ich möchte darüber sprechen."     → Verbindung schaffen.
 *   🔖 Merken      — "Ich komme später darauf zurück."  → Wissen bewahren.
 *   🔄 Empfehlen   — "Das könnte auch anderen guttun."  → Gutes weitergeben.
 *
 * Diese vier Komponenten sind die EINZIGE erlaubte Icon-Quelle für alle
 * Interaktions-Oberflächen (Feed, Werke, Erlebnisse, Beiträge, Detailseiten,
 * Mein HUI, Sammlungen, Empfehlungen, Suchergebnisse, Listen, Karten,
 * Benachrichtigungen). Keine zweite Icon-Sprache, keine lokalen Kopien.
 *
 * Jede Komponente:
 *   - reine SVG-Ausgabe (kein PNG/Canvas/Sprite)
 *   - Props: size (px, Default 24), className, style
 *   - eigene, kollisionsfreie Gradient-IDs via React.useId()
 *   - dünne, weiche Linien + sanfte Gradient-Füllungen, keine harten Ecken
 */
import React from "react";

/* ── 1. Resonanz ── Sprössling mit schwebendem Licht-Punkt ─────────────── */
export function ResonanceIcon({ size = 24, className, style }) {
  const id = React.useId();
  const leaf = `hui-res-leaf-${id}`;
  const dot = `hui-res-dot-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={leaf} x1="4" y1="20" x2="20" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FB39B" />
          <stop offset="100%" stopColor="#0DC4B5" />
        </linearGradient>
        <radialGradient id={dot} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD873" />
          <stop offset="100%" stopColor="#F0A93C" />
        </radialGradient>
      </defs>
      <path d="M12 21V12.5" stroke={`url(#${leaf})`} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 13.5C12 13.5 6.2 12.6 6.2 7.6C6.2 7.6 12 8 12 13.5Z"
        fill={`url(#${leaf})`} opacity="0.92"
      />
      <path
        d="M12 13.5C12 13.5 17.8 12.6 17.8 7.6C17.8 7.6 12 8 12 13.5Z"
        fill={`url(#${leaf})`}
      />
      <circle cx="12" cy="4.6" r="1.9" fill={`url(#${dot})`} />
    </svg>
  );
}

/* ── 2. Austauschen ── Zwei Köpfe, die gemeinsam ein Herz formen ─────────── */
export function ExchangeIcon({ size = 24, className, style }) {
  const id = React.useId();
  const grad = `hui-exc-grad-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={grad} x1="3" y1="6" x2="21" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#159E92" />
          <stop offset="100%" stopColor="#0DC4B5" />
        </linearGradient>
      </defs>
      <circle cx="8.4" cy="6.4" r="2.15" fill={`url(#${grad})`} />
      <circle cx="15.6" cy="6.4" r="2.15" fill={`url(#${grad})`} />
      <path
        d="M12 20.2C12 20.2 4.6 15.9 4.6 11.05C4.6 8.85 6.35 7.35 8.3 7.35
           C9.85 7.35 11.1 8.25 12 9.6C12.9 8.25 14.15 7.35 15.7 7.35
           C17.65 7.35 19.4 8.85 19.4 11.05C19.4 15.9 12 20.2 12 20.2Z"
        fill="none" stroke={`url(#${grad})`} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

/* ── 3. Merken ── Lesezeichen mit warmem Licht-Punkt ─────────────────────── */
export function BookmarkKeepIcon({ size = 24, className, style }) {
  const id = React.useId();
  const ribbon = `hui-mrk-ribbon-${id}`;
  const dot = `hui-mrk-dot-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={ribbon} x1="7" y1="3" x2="17" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E6F72" />
          <stop offset="100%" stopColor="#123B4D" />
        </linearGradient>
        <radialGradient id={dot} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFC069" />
          <stop offset="100%" stopColor="#F2793F" />
        </radialGradient>
      </defs>
      <path
        d="M7.6 4.4C7.6 3.63 8.23 3 9 3H15C15.77 3 16.4 3.63 16.4 4.4V20.1
           C16.4 20.72 15.68 21.06 15.2 20.68L12.28 18.36
           C12.12 18.23 11.88 18.23 11.72 18.36L8.8 20.68
           C8.32 21.06 7.6 20.72 7.6 20.1V4.4Z"
        fill={`url(#${ribbon})`} strokeLinejoin="round"
      />
      <circle cx="12" cy="9.4" r="2" fill={`url(#${dot})`} />
    </svg>
  );
}

/* ── 4. Empfehlen ── Drei weiche Pfeile im Kreislauf ─────────────────────── */
export function RecommendIcon({ size = 24, className, style }) {
  const id = React.useId();
  const a = `hui-rec-a-${id}`;
  const b = `hui-rec-b-${id}`;
  const c = `hui-rec-c-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={a} x1="4" y1="16" x2="12" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FB39B" />
          <stop offset="100%" stopColor="#0DC4B5" />
        </linearGradient>
        <linearGradient id={b} x1="20" y1="16" x2="12" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F2793F" />
          <stop offset="100%" stopColor="#F4A65B" />
        </linearGradient>
        <linearGradient id={c} x1="6" y1="19" x2="18" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4A65B" />
          <stop offset="100%" stopColor="#FFC978" />
        </linearGradient>
      </defs>
      <path
        d="M8.9 6.4C10.9 5.2 13.4 5.15 15.45 6.35"
        stroke={`url(#${a})`} strokeWidth="1.9" strokeLinecap="round" fill="none"
      />
      <path d="M14.6 4.9L15.8 6.6L13.85 7.15Z" fill={`url(#${a})`} />

      <path
        d="M16.9 8.1C18.05 10.05 18.05 12.5 16.85 14.5"
        stroke={`url(#${b})`} strokeWidth="1.9" strokeLinecap="round" fill="none"
      />
      <path d="M18.55 8.9L17.35 7.15L16.15 9.05Z" fill={`url(#${b})`} />

      <path
        d="M15.05 16.55C13 17.75 10.5 17.75 8.5 16.5"
        stroke={`url(#${c})`} strokeWidth="1.9" strokeLinecap="round" fill="none"
      />
      <path d="M9.35 18.1L8.15 16.4L10.15 15.9Z" fill={`url(#${c})`} />
    </svg>
  );
}

/* ── Größenvarianten (technische Vorgabe: 20 / 24 / 28 / 32 px) ─────────── */
export const HUI_ICON_SIZES = { sm: 20, md: 24, lg: 28, xl: 32 };

/* ── Interaktions-Copy (verbindlich, aus Referenzgrafik) ─────────────────── */
export const HUI_INTERACTIONS = {
  resonanz: {
    label: "Resonanz",
    text: "Das hat etwas in mir bewegt.",
    sub: "Wertschätzung zeigen.",
    Icon: ResonanceIcon,
  },
  austauschen: {
    label: "Austauschen",
    text: "Ich möchte darüber sprechen.",
    sub: "Verbindung schaffen.",
    Icon: ExchangeIcon,
  },
  merken: {
    label: "Merken",
    text: "Ich komme später darauf zurück.",
    sub: "Wissen bewahren.",
    Icon: BookmarkKeepIcon,
  },
  empfehlen: {
    label: "Empfehlen",
    text: "Das könnte auch anderen guttun.",
    sub: "Gutes weitergeben.",
    Icon: RecommendIcon,
  },
};

export default {
  ResonanceIcon,
  ExchangeIcon,
  BookmarkKeepIcon,
  RecommendIcon,
  HUI_ICON_SIZES,
  HUI_INTERACTIONS,
};
