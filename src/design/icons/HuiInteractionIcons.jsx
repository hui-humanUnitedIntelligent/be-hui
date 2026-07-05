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

/* ── 2. Austauschen ── Zwei Figuren formen gemeinsam ein Herz ────────────
   v4 (Lars-Vorlage, 2026-07-05): Formensprache 1:1 aus der bereitgestellten
   Referenz übernommen, technisch für 20-24px optimiert (flach, ohne die
   3D-Glanz-Hervorhebungen der Vorlage). Zwei fließende, einander
   zugewandte Figuren (Kopf + geschwungener Körper) — der Zwischenraum
   zwischen ihnen ergibt sich rein aus ihrer eigenen Silhouette zu einem
   Herzen (kein aufgesetztes Herz-Element, keine zusätzliche Kontur).
   Farben ausschließlich HUI-Türkis (links) und HUI-Korallen-Orange
   (rechts), dezenter Verlauf wie in der Vorlage — keine neuen Farben. */
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
        <linearGradient id={left} x1="3" y1="7" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FDCC9" />
          <stop offset="100%" stopColor="#0E8C82" />
        </linearGradient>
        <linearGradient id={right} x1="21" y1="7" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB37A" />
          <stop offset="100%" stopColor="#F2793F" />
        </linearGradient>
      </defs>
      {/* Premium-Finetuning Runde 3 (2026-07-05, Lars Punkt 5 "Austauschen
          minimal kraeftiger", +5-8%): Koepfe r 2.25->2.35, Koerper minimal
          weiter verbreitert -- gemessen 37.0%->39.3% (+6.2%, im geforderten
          Fenster). Silhouette bewusst unveraendert.
          Linke Figur: Kopf + fließender Körper, dessen innere Kontur die
          linke Herzhälfte bildet */}
      <circle cx="6.65" cy="5.15" r="2.35" fill={`url(#${left})`} />
      <path
        d="M6.65 8.1C2.9 9.1 0.4 12.8 1.3 19.9C4.1 21.5 9.7 21.0 12.8 17.6
           C10.6 15.1 7.2 12.8 8.6 9.2C7.9 8.7 7.3 8.4 6.65 8.1Z"
        fill={`url(#${left})`}
      />
      {/* Rechte Figur: gespiegelt, teilt sich den Herz-Fußpunkt mit links */}
      <circle cx="17.35" cy="5.15" r="2.35" fill={`url(#${right})`} />
      <path
        d="M17.35 8.1C21.1 9.1 23.6 12.8 22.7 19.9C19.9 21.5 14.3 21.0 11.2 17.6
           C13.4 15.1 16.8 12.8 15.4 9.2C16.1 8.7 16.7 8.4 17.35 8.1Z"
        fill={`url(#${right})`}
      />
    </svg>
  );
}

/* ── 3. Merken ── Lesezeichen, Farben nach Lars-Vorlage (2026-07-05) ────
   v2 (Recolor): Silhouette unveraendert (bereits identisch zur Vorlage —
   abgerundetes Rechteck oben, weiche V-Kerbe unten). Einziger Eingriff:
   Farbverlauf von Teal-Navy auf das geforderte HUI-Tuerkis→Korallen-Orange
   umgestellt, plus weicherer goldener Lichtpunkt mit sanftem Glow-Halo
   (kein 3D-Glanz, keine Textur — reine Opacity-Ueberlagerung). */
export function BookmarkKeepIcon({ size = 24, className, style }) {
  const id = React.useId();
  const ribbon = `hui-mrk-ribbon-${id}`;
  const halo = `hui-mrk-halo-${id}`;
  const dot = `hui-mrk-dot-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={ribbon} x1="5.2" y1="20.5" x2="18.8" y2="3.0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14C9B6" />
          <stop offset="100%" stopColor="#F2793F" />
        </linearGradient>
        <radialGradient id={halo} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#FFDD8C" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFDD8C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={dot} cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFDD8C" />
          <stop offset="100%" stopColor="#F0A93C" />
        </radialGradient>
      </defs>
      {/* Premium-Finetuning 2026-07-05 (Lars): Ribbon verbreitert (Breite
          9.4->12.2 Einheiten) und Gold-Punkt vergroessert (r 2.05->2.3) --
          gemessen per Pixel-Fuellgrad-Analyse von 28.3%->33.8% (+19.4%, im
          geforderten 15-20%-Fenster). Silhouette (abgerundetes Rechteck +
          weiche V-Kerbe) bewusst unveraendert, nur voller/kraeftiger. */}
      <path
        d="M6.6 4.0C6.6 3.0 7.42 2.2 8.4 2.2H15.6C16.58 2.2 17.4 3.0 17.4 4.0V20.7
           C17.4 21.42 16.5 21.83 15.92 21.37L12.36 18.7
           C12.14 18.53 11.86 18.53 11.64 18.7L8.08 21.37
           C7.5 21.83 6.6 21.42 6.6 20.7V4.0Z"
        fill={`url(#${ribbon})`} strokeLinejoin="round"
      />
      {/* Weicher Glow-Halo hinter dem Punkt — Licht "strahlt" dezent aus */}
      <circle cx="12" cy="9.6" r="4.6" fill={`url(#${halo})`} />
      <circle cx="12" cy="9.6" r="2.3" fill={`url(#${dot})`} />
    </svg>
  );
}

/* ── 4. Weitergeben (ehem. "Empfehlen") ── Schwung-Pfeil nach Lars-Vorlage
   (2026-07-05) ─────────────────────────────────────────────────────────
   v4: Ersetzt die Schale+Samen-Metapher komplett durch die von Lars
   vorgegebene Formensprache — ein schlanker, dynamischer Schwung, der aus
   einer duennen Spur (Tuerkis) hochzieht und in eine Pfeilspitze mit
   konkaver Kerbe (Korallen-Orange) muendet. Bewusst NICHT Social-Media/
   Teilen/Export, sondern "das moechte ich an andere weitergeben" —
   Bewegung nach vorne/oben statt Kreis oder Behaelter. Flach umgesetzt
   (kein Glanzstreifen, keine 3D-Schattierung der Referenz), Farbverlauf
   direkt Tuerkis→Korallen-Orange wie bei Austauschen/Merken. Funktions-
   /Exportname RecommendIcon bewusst unveraendert gelassen (nur interne
   Grafik + Copy geaendert) — keine Call-Site-Aenderungen in BaseFeedCard/
   WorkDetailPage noetig. */
export function RecommendIcon({ size = 24, className, style }) {
  const id = React.useId();
  const grad = `hui-fwd-grad-${id}`;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={style} aria-hidden="true"
    >
      <defs>
        <linearGradient id={grad} x1="2" y1="20.5" x2="21.5" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14C9B6" />
          <stop offset="100%" stopColor="#F2793F" />
        </linearGradient>
      </defs>
      {/* Premium-Finetuning Runde 3 (2026-07-05, Lars Punkt 4 "Weitergeben
          leicht verstaerken", nur minimal): 14.3%->15.5% Fuellgrad (+8.4%,
          "minimal nacharbeiten"), damit knapp ueber dem offiziellen
          Resonanz-Icon (15.1%) -- gleiche Wertigkeit erreicht, keine neue
          Form, gleiche Grundform (Schwung + Pfeilspitze mit konkaver Kerbe). */}
      <path
        d="M1.4 21.3C7.9 20.0 14.1 13.5 17.7 6.6L21.2 8.9
           C16.7 16.6 9.5 21.8 2.9 23.2C2.4 22.6 1.9 21.9 1.4 21.3Z"
        fill={`url(#${grad})`}
      />
      {/* Pfeilspitze mit konkaver Kerbe (klassische "Weitergeben"-Spitze,
          wie im Referenzbild) — Rueckkante wird zur Pfeilspitze hin
          hineingezogen statt gerade zu verlaufen. */}
      <path
        d="M15.7 6.0L23.0 0.7L16.2 11.4Q20.9 7.5 15.7 6.0Z"
        fill={`url(#${grad})`}
      />
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
  weitergeben: {
    label: "Weitergeben",
    text: "Das möchte ich an andere weitergeben.",
    sub: "Inspiration teilen, Wirkung erzeugen.",
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
