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
import React, { useState, useEffect, useRef } from "react";

/* ── 1. Resonanz ── HUIHeartIcon, offizielles HUI-Herz (Lars, 2026-07-08) ──
   WICHTIG: Ab sofort das einzige Resonanz-Icon der Plattform. Ersetzt das
   vorherige PNG-Asset vollstaendig durch ein reines SVG (Performance: kein
   Bild-Request mehr, currentColor-faehig, responsive). Eigenstaendiges,
   ruhiges Herz -- kein Kopf, keine Wellen, keine Instagram-/Apple-/Material-
   Kopie. Bedeutung bewusst NICHT "Like", sondern "Das spricht mich an."

   Optical Sizing (2026-07-08): jede der 6 Zielgroessen (16/20/24/32/48/64)
   ist EIGENSTAENDIG optisch korrigiert (Strichstaerke, Kerbentiefe,
   Spitzenwinkel, Weissraum) statt linear skaliert -- 48px ist die
   bestaetigte geometrische Referenz. Siehe Kommentar bei HEART_VARIANTS.

   API: HUIHeartIcon({ size=24, active=false, className, style }).
   active steuert NUR die eingebaute Aktivierungs-Animation (Puls + sich
   ausbreitender Lichtring, ~300ms, ease-out, ausschliesslich transform/
   opacity -- GPU-beschleunigt, kein filter/drop-shadow). Farbe/Opacity je
   Zustand (Default/Hover/Pressed/Active/Disabled) bleiben wie bisher
   Aufgabe der aufrufenden Button-Komponente (ActionBtn/IconBtn) ueber
   CSS color auf dem umschliessenden Element (currentColor). */
let _heartCSSInjected = false;
function injectHeartCSS() {
  if (_heartCSSInjected || typeof document === "undefined") return;
  _heartCSSInjected = true;
  const s = document.createElement("style");
  s.textContent = `
@keyframes hui-heart-pulse-in  { 0%{transform:scale(1);} 40%{transform:scale(1.16);} 100%{transform:scale(1);} }
@keyframes hui-heart-pulse-out { 0%{transform:scale(1);} 50%{transform:scale(0.92);} 100%{transform:scale(1);} }
@keyframes hui-heart-ring      { 0%{opacity:0.55; transform:scale(0.4);} 100%{opacity:0; transform:scale(1.9);} }
  `;
  document.head.appendChild(s);
}

// Optical-Sizing-Tabelle -- 48px ist der von Lars bestaetigte Master;
// 16-32px eigenstaendig etwas kraeftiger/robuster, 64px etwas verfeinerter
// (siehe Herleitung: dickerer Strich + flachere Kerbe + weichere Spitze +
// mehr Weissraum bei kleinen Groessen; Umkehrung bei 64px).
const HEART_VARIANTS = [
  { max: 17, stroke: 2.4,  d: "M12,20.445 C12,20.445 3.12,15.171 4.005,9.922 C4.005,7.291 6.078,5.114 8.348,5.295 C10.444,5.456 11.408,6.43 12,7.308 C12.592,6.43 13.556,5.456 15.652,5.295 C17.922,5.114 19.995,7.291 19.995,9.922 C20.88,15.171 12,20.445 12,20.445 Z" },
  { max: 21, stroke: 2.25, d: "M12,20.606 C12,20.606 3.125,14.907 3.835,9.859 C3.835,7.172 5.952,4.949 8.27,5.134 C10.411,5.298 11.395,6.293 12,7.311 C12.605,6.293 13.589,5.298 15.73,5.134 C18.048,4.949 20.165,7.172 20.165,9.859 C20.875,14.907 12,20.606 12,20.606 Z" },
  { max: 26, stroke: 2.1,  d: "M12,20.767 C12,20.767 3.043,14.792 3.665,9.797 C3.665,7.054 5.826,4.784 8.193,4.973 C10.378,5.141 11.383,6.156 12,7.318 C12.617,6.156 13.622,5.141 15.807,4.973 C18.174,4.784 20.335,7.054 20.335,9.797 C20.957,14.792 12,20.767 12,20.767 Z" },
  { max: 36, stroke: 2.0,  d: "M12,20.928 C12,20.928 2.968,14.673 3.495,9.734 C3.495,6.935 5.7,4.619 8.115,4.812 C10.345,4.983 11.37,6.019 12,7.331 C12.63,6.019 13.655,4.983 15.885,4.812 C18.3,4.619 20.505,6.935 20.505,9.734 C21.032,14.673 12,20.928 12,20.928 Z" },
  { max: 56, stroke: 2.0,  d: "M12,20.928 C12,20.928 2.968,14.673 3.495,9.734 C3.495,6.935 5.7,4.619 8.115,4.812 C10.345,4.983 11.37,6.019 12,7.331 C12.63,6.019 13.655,4.983 15.885,4.812 C18.3,4.619 20.505,6.935 20.505,9.734 C21.032,14.673 12,20.928 12,20.928 Z" }, // 48px Master
  { max: Infinity, stroke: 1.9, d: "M12,21.089 C12,21.089 2.9,14.549 3.325,9.671 C3.325,6.816 5.574,4.454 8.037,4.651 C10.312,4.825 11.357,5.882 12,7.349 C12.643,5.882 13.688,4.825 15.963,4.651 C18.426,4.454 20.675,6.816 20.675,9.671 C21.1,14.549 12,21.089 12,21.089 Z" },
];
function pickHeartVariant(size) {
  for (const v of HEART_VARIANTS) if (size <= v.max) return v;
  return HEART_VARIANTS[HEART_VARIANTS.length - 1];
}

export function HUIHeartIcon({ size = 24, active = false, className, style }) {
  injectHeartCSS();
  const variant = pickHeartVariant(size);
  const prevActive = useRef(active);
  const [pulse, setPulse] = useState(null); // "in" | "out" | null

  useEffect(() => {
    if (prevActive.current !== active) {
      const dir = active ? "in" : "out";
      setPulse(dir);
      prevActive.current = active;
      const t = setTimeout(() => setPulse(null), dir === "in" ? 320 : 280);
      return () => clearTimeout(t);
    }
  }, [active]);

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-flex", width: size, height: size, ...style }}
    >
      {pulse === "in" && (
        <svg
          width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <circle
            cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ transformOrigin: "12px 12px", animation: "hui-heart-ring 320ms ease-out forwards" }}
          />
        </svg>
      )}
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={variant.stroke}
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
        style={{
          position: "relative", zIndex: 1, transformOrigin: "12px 13px",
          animation:
            pulse === "in"  ? "hui-heart-pulse-in 300ms ease-out" :
            pulse === "out" ? "hui-heart-pulse-out 260ms ease-out" : "none",
        }}
      >
        <path d={variant.d} />
      </svg>
    </span>
  );
}

// Rueckwaerts-kompatibler Alias -- KEINE zweite Komponente, nur ein Name
// der auf HUIHeartIcon zeigt, damit alter Code (falls irgendwo vergessen)
// nicht bricht. Neue Call-Sites verwenden HUIHeartIcon direkt.
export const ResonanceIcon = HUIHeartIcon;

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
    Icon: HUIHeartIcon,
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
  HUIHeartIcon,
  ResonanceIcon,
  ExchangeIcon,
  BookmarkKeepIcon,
  RecommendIcon,
  HUI_ICON_SIZES,
  HUI_INTERACTIONS,
};
