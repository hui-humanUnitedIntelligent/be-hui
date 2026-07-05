/**
 * HUI Interaction Language v3.0 — Symbolik vor Formfeinschliff (2026-07-05)
 * ──────────────────────────────────────────────────────────────────────────
 * Single Source of Truth für die vier universellen HUI-Interaktionen.
 *
 *   🌱 Resonanz    — "Das hat etwas in mir bewegt."     → Wertschätzung zeigen.
 *   🤝 Austauschen — "Ich möchte darüber sprechen."     → Verbindung schaffen.
 *   🔖 Merken      — "Ich komme später darauf zurück."  → Wissen bewahren.
 *   🔄 Empfehlen   — "Das könnte auch anderen guttun."  → Gutes weitergeben.
 *
 * v3 korrigiert einen Symbolik-Fehler aus v2: dort waren "Austauschen"
 * (abstrakte Pinwheel-Blobs) und "Empfehlen" (Rundbogen-Pfeil) zwar formal
 * sauber, aber NICHT sofort ohne Text verständlich — Austauschen wirkte wie
 * eine beliebige abstrakte Form statt "Begegnung zwischen Menschen", und
 * Empfehlen las sich wie "Aktualisieren/Sync" statt "etwas Wertvolles
 * weitergeben". v3 zeichnet beide Icons anhand der Symbolik neu, nach dem
 * Vergleich mehrerer Varianten direkt im Feed-Mockup:
 *
 *   - Austauschen: zwei klar erkennbare Personen-Silhouetten (Kopf +
 *     Schulter), einander zugewandt, mit einem kleinen Funken dazwischen —
 *     zeigt explizit "zwei Menschen im Kontakt", nicht nur eine abstrakte
 *     Form. Bewusst kein Herz (kein Herz-Einschnitt oben), keine klassische
 *     Sprechblase (keine Bubble-Kontur/kein Schwänzchen).
 *   - Empfehlen: offene Schale mit einem darüber schwebenden Glanz-Samen —
 *     knüpft an HUIs bestehende Schalen-/Gefäß-Metapher an (WerkeKorb:
 *     "handgefertigte Schale" als Sinnbild fürs Geben) und liest sich
 *     eindeutig als "ich biete dir etwas Kostbares an". Keine Kreisform,
 *     kein Pfeil-im-Kreis → keine Verwechslungsgefahr mit Reload/Sync.
 *   - Resonanz und Merken bleiben unverändert aus v2 (Symbolik dort bereits
 *     eindeutig: Spross = Wachstum/Bewegtsein, Lesezeichen = Aufbewahren).
 *
 * Diese vier Komponenten sind die EINZIGE erlaubte Icon-Quelle für alle
 * Interaktions-Oberflächen (Feed, Werke, Erlebnisse, Beiträge, Detailseiten,
 * Mein HUI, Sammlungen, Empfehlungen, Suchergebnisse, Listen, Karten,
 * Benachrichtigungen). Keine zweite Icon-Sprache, keine lokalen Kopien.
 *
 * API (unverändert seit v1 — reiner visueller Pass, keine Call-Site-
 * Änderungen nötig): ResonanceIcon / ExchangeIcon / BookmarkKeepIcon /
 * RecommendIcon, jeweils Props { size = 24, className, style }.
 *
 * Zustände (Default/Hover/Pressed/Active/Disabled) werden bewusst NICHT in
 * der Icon-Geometrie selbst codiert (Form bleibt immer identisch), sondern
 * ausschließlich über die aufrufenden Button-Komponenten (ActionBtn in
 * BaseFeedCard.jsx, IconBtn in WorkDetailPage.jsx) via Opacity/Scale/
 * Disabled-Handling gesteuert.
 */
import React from "react";
import resonanzIconAsset from "../../assets/icons/resonanz-icon.png";

/* ── 1. Resonanz ── Offizieller HUI-Vektor (Lars, 2026-07-05) ────────────
   WICHTIG: Dies ist ab sofort das offizielle Resonanz-Icon, 1:1 aus dem von
   Lars bereitgestellten Vektor übernommen — NICHT neu gezeichnet, NICHT
   stilisiert, KEINE anderen Farben/Rundungen. Es ersetzt vollständig das
   frühere Like-/Herz-System sowie die zuvor selbst gezeichnete SVG-Version
   (Spross+Stamm+Punkt). Einziger Eingriff: leeres transparentes Randmaß
   der PNG wurde weggeschnitten (kein Pixel der Grafik selbst verändert),
   damit die optische Größe zu den übrigen drei HUI-Icons passt. */
export function ResonanceIcon({ size = 24, className, style }) {
  return (
    <img
      src={resonanzIconAsset}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ display: "block", objectFit: "contain", ...style }}
      aria-hidden="true"
      draggable={false}
    />
  );
}

/* ── 2. Austauschen ── Zwei Menschen + Funke der Begegnung ───────────────
   v3 (Symbolik-Korrektur): zwei eindeutig als Personen lesbare Silhouetten
   (Kopf + Schulter/Körper), einander zugewandt, mit einem kleinen warmen
   Funken im Zwischenraum, der den Moment des Austauschs markiert. Zeigt
   sofort "zwei Menschen im Kontakt" — bewusst kein Herz (kein Herz-
   Einschnitt oben in der Mitte) und keine klassische Sprechblase (keine
   Bubble-Kontur, kein Schwänzchen). */
export function ExchangeIcon({ size = 24, className, style }) {
  const id = React.useId();
  const left = `hui-exc-left-${id}`;
  const right = `hui-exc-right-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={left} x1="3" y1="7" x2="10" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0E8C82" />
          <stop offset="100%" stopColor="#1BB5A5" />
        </linearGradient>
        <linearGradient id={right} x1="14" y1="7" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#17B9AC" />
          <stop offset="100%" stopColor="#57DDC9" />
        </linearGradient>
      </defs>
      {/* Linke Person: Kopf + Körper, dem Zentrum zugewandt */}
      <circle cx="6.4" cy="7" r="2.1" fill={`url(#${left})`} />
      <path
        d="M3.6 19C3.6 14.3 4.9 10.4 6.4 10.4C7.9 10.4 9.2 14.3 9.2 19
           C9.2 19.9 8.5 20.4 7.5 20.4H5.3C4.3 20.4 3.6 19.9 3.6 19Z"
        fill={`url(#${left})`}
      />
      {/* Rechte Person: gespiegelt */}
      <circle cx="17.6" cy="7" r="2.1" fill={`url(#${right})`} />
      <path
        d="M20.4 19C20.4 14.3 19.1 10.4 17.6 10.4C16.1 10.4 14.8 14.3 14.8 19
           C14.8 19.9 15.5 20.4 16.5 20.4H18.7C19.7 20.4 20.4 19.9 20.4 19Z"
        fill={`url(#${right})`}
      />
      {/* Funke der Begegnung — markiert den Moment des Austauschs */}
      <path
        d="M12 11.6L12.9 13.7L15 14.6L12.9 15.5L12 17.6L11.1 15.5L9 14.6L11.1 13.7Z"
        fill="#F0A93C"
      />
    </svg>
  );
}

/* ── 3. Merken ── Lesezeichen, ruhiger & voller als v1 ───────────────────
   Notch weicher/flacher (kein spitzes "V"), Ribbon leicht breiter für
   mehr visuelle Präsenz, Licht-Punkt beibehalten. */
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
        <linearGradient id={ribbon} x1="7" y1="2.6" x2="17.4" y2="21.4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D6A6E" />
          <stop offset="100%" stopColor="#103A4A" />
        </linearGradient>
        <radialGradient id={dot} cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFC875" />
          <stop offset="100%" stopColor="#F0803F" />
        </radialGradient>
      </defs>
      <path
        d="M7.3 4.2C7.3 3.32 8.02 2.6 8.9 2.6H15.1C15.98 2.6 16.7 3.32 16.7 4.2V20.3
           C16.7 20.98 15.9 21.36 15.36 20.94L12.32 18.55
           C12.13 18.4 11.87 18.4 11.68 18.55L8.64 20.94
           C8.1 21.36 7.3 20.98 7.3 20.3V4.2Z"
        fill={`url(#${ribbon})`} strokeLinejoin="round"
      />
      <circle cx="12" cy="8.9" r="2.05" fill={`url(#${dot})`} />
    </svg>
  );
}

/* ── 4. Empfehlen ── Offene Schale mit schwebendem Glanz-Samen ───────────
   v3 (Symbolik-Korrektur): v2's Rundbogen-Pfeil las sich wie "Aktualisieren
   /Sync/Laden" — genau das Gegenteil der gewünschten Bedeutung. v3 knüpft
   stattdessen an HUIs bereits etablierte Schalen-/Gefäß-Metapher an
   (WerkeKorb: "handgefertigte Schale" als Sinnbild fürs Geben): eine
   offene Schale, darüber ein leuchtender Samen, der angeboten wird —
   liest sich sofort als "ich biete dir etwas Kostbares an, das auch dir
   guttun könnte". Keine Kreisform, kein Pfeil-im-Kreis. */
export function RecommendIcon({ size = 24, className, style }) {
  const id = React.useId();
  const bowl = `hui-rec-bowl-${id}`;
  const seed = `hui-rec-seed-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={bowl} x1="4" y1="12" x2="20" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8AA" />
          <stop offset="100%" stopColor="#0E8C82" />
        </linearGradient>
        <radialGradient id={seed} cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFDD8C" />
          <stop offset="100%" stopColor="#F0A93C" />
        </radialGradient>
      </defs>
      {/* Offene Schale — Sinnbild des Anbietens/Gebens */}
      <path
        d="M3.6 12.3C3.6 12.3 4.7 19.4 12 19.4C19.3 19.4 20.4 12.3 20.4 12.3
           C20.4 16.2 16.8 21 12 21C7.2 21 3.6 16.2 3.6 12.3Z"
        fill={`url(#${bowl})`}
      />
      {/* Schwebender Glanz-Samen — das Kostbare, das weitergegeben wird */}
      <circle cx="12" cy="7.6" r="2.3" fill={`url(#${seed})`} />
    </svg>
  );
}

/* ── Größenvarianten (technische Vorgabe: 20 / 22 / 24 / 28 / 32 px) ────── */
export const HUI_ICON_SIZES = { sm: 20, base: 22, md: 24, lg: 28, xl: 32 };

/* ── Interaktions-Copy (verbindlich) ─────────────────────────────────────── */
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
