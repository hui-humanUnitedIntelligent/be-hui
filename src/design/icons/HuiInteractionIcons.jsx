/**
 * HUI Interaction Icon Library v1.0 (2026-07-08) — "Eine Designer-Hand"
 * ──────────────────────────────────────────────────────────────────────────
 * Single Source of Truth für alle vier universellen HUI-Interaktionen.
 * Ersetzt v3.0 vollständig (siehe Block weiter unten für die neue DNA
 * und Icon-Symbolik im Detail).
 *
 *   ❤️ Resonanz    — "Das hat etwas in mir bewegt."        → HUIHeartIcon (Referenz)
 *   💬 Austauschen — "Ich trete mit dir in den Austausch." → ExchangeIcon
 *   🔖 Merken      — "Ich komme später darauf zurück."     → BookmarkKeepIcon
 *   ➤ Weitergeben  — "Ich gebe diese Inspiration weiter."  → RecommendIcon
 *
 * Diese vier Komponenten sind die EINZIGE erlaubte Icon-Quelle für alle
 * Interaktions-Oberflächen (Feed, Werke, Erlebnisse, Beiträge, Detailseiten,
 * Mein HUI, Sammlungen, Empfehlungen, Suchergebnisse, Listen, Karten,
 * Benachrichtigungen). Keine zweite Icon-Sprache, keine lokalen Kopien.
 *
 * API (rein visueller Pass, keine Call-Site-Änderungen nötig):
 * HUIHeartIcon / ExchangeIcon / BookmarkKeepIcon / RecommendIcon,
 * jeweils Props { size = 24, active = false, className, style }.
 * `active` steuert ausschließlich die eingebaute Aktivierungs-Animation
 * (transform/opacity, ~300ms, GPU) — Farbe/Opacity je Zustand bleiben
 * Aufgabe der aufrufenden Button-Komponente über CSS `color` (currentColor).
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

/* ══════════════════════════════════════════════════════════════════════
 * HUI Interaction Icon Library v1.0 (2026-07-08) — EINE Designer-Hand
 * ──────────────────────────────────────────────────────────────────────
 * Ersetzt v3.0 (Zwei-Personen-Silhouetten, Blitz, Gradient-Lesezeichen)
 * vollstaendig. Ab sofort teilen sich ALLE VIER Icons dieselbe DNA:
 *
 *   - Reines Outline-Stroke-SVG, KEIN Fill, KEIN Gradient mehr
 *   - currentColor (Farbe kommt ausschliesslich vom umschliessenden
 *     Element -- Design Tokens, siehe ActionBtn/IconBtn "color"-Prop)
 *   - Round Line Cap + Round Line Join
 *   - Strichstaerke pro Groessen-Bucket identisch fuer alle 4 Icons
 *     (ICON_STROKE_BY_SIZE, exakt dieselbe Tabelle wie beim HUIHeart-
 *     Master) -- das ist der zentrale Hebel fuer "Optical Sizing":
 *     kleine Groessen bekommen dickere Striche (bessere Lesbarkeit auf
 *     16-20px), grosse Groessen duennere, feinere Striche.
 *   - Referenz-Icon ist das HUIHeart (unveraendert) -- alle drei
 *     folgenden Icons sind an dessen Bounding-Box (~17x16 im 24x24-Raster)
 *     und Rundungs-Charakter angelehnt.
 *
 * Symbolik (verbindlich):
 *   Resonanz    -- HUIHeart, unveraendert, Referenz-Icon.
 *   Austauschen -- EINE einzelne, weiche Sprechblase (Stadium-Form,
 *     keine Ecken, kleiner Schweif) -- "Ich trete mit dir in den
 *     Austausch." Bewusst KEINE zwei Personen, keine Avatare, keine
 *     Punkte/Ellipsen (waere zu nah an Material/Messenger-Ikonografie).
 *   Weitergeben -- ein organischer Schwung-Pfeil (keine harte Gerade,
 *     leichte Kurve) mit offenem Chevron-Pfeilkopf -- "Ich gebe diese
 *     Inspiration weiter." Bewusst kein Blitz, kein Papierflieger, kein
 *     Upload-Tray-Symbol.
 *   Merken -- Lesezeichen/Tag-Silhouette mit weich geschwungener Kerbe
 *     (Bezier-Kurven statt spitzem V) -- "der Bruder des HUIHeart".
 *
 * Animationen (alle: nur transform/opacity, ~300ms, ease-out, GPU):
 *   Resonanz    -- Puls + auslaufender Lichtring (bereits vorhanden)
 *   Austauschen -- Sprechblase "oeffnet" sich minimal (scaleX/Y-Bounce)
 *   Weitergeben -- leichte Vorwaerts-Bewegung (translate laengs der
 *     Pfeilrichtung, mit sanftem Rueckfedern)
 *   Merken -- weiches "Einrasten" (Skalierung ueberschwingt leicht nach
 *     unten dann zurueck, wie ein Clip der einrastet)
 * ══════════════════════════════════════════════════════════════════════ */

// Gemeinsame Strichstaerken-Tabelle -- IDENTISCH fuer alle 4 Icons, exakt
// dieselben Bucket-Grenzen wie beim HUIHeart-Master (siehe HEART_VARIANTS).
// Das ist die zentrale "gleiche Linienfuehrung ueber alle Groessen"-Regel.
const ICON_STROKE_BY_SIZE = [
  { max: 17, stroke: 2.4  },
  { max: 21, stroke: 2.25 },
  { max: 26, stroke: 2.1  },
  { max: 36, stroke: 2.0  },
  { max: 56, stroke: 2.0  },
  { max: Infinity, stroke: 1.9 },
];
function pickIconStroke(size) {
  for (const v of ICON_STROKE_BY_SIZE) if (size <= v.max) return v.stroke;
  return ICON_STROKE_BY_SIZE[ICON_STROKE_BY_SIZE.length - 1].stroke;
}

let _iconCSSInjected = false;
function injectIconFamilyCSS() {
  if (_iconCSSInjected || typeof document === "undefined") return;
  _iconCSSInjected = true;
  const s = document.createElement("style");
  s.textContent = `
@keyframes hui-chat-open-in   { 0%{transform:scale(1,1);} 45%{transform:scale(1.08,0.92);} 100%{transform:scale(1,1);} }
@keyframes hui-chat-open-out  { 0%{transform:scale(1,1);} 50%{transform:scale(0.95,1.03);} 100%{transform:scale(1,1);} }
@keyframes hui-share-forward-in  { 0%{transform:translate(0,0);} 40%{transform:translate(2px,-2px);} 100%{transform:translate(0,0);} }
@keyframes hui-share-forward-out { 0%{transform:translate(0,0);} 50%{transform:translate(-1px,1px);} 100%{transform:translate(0,0);} }
@keyframes hui-bookmark-snap-in  { 0%{transform:scale(1);} 40%{transform:scale(0.9);} 70%{transform:scale(1.06);} 100%{transform:scale(1);} }
@keyframes hui-bookmark-snap-out { 0%{transform:scale(1);} 50%{transform:scale(0.94);} 100%{transform:scale(1);} }
@keyframes hui-icon-spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
  `;
  document.head.appendChild(s);
}

// Gemeinsamer Aktivierungs-Puls-Hook -- steuert nur WELCHE Animation
// (in/out) gerade laeuft, jedes Icon bringt seinen eigenen Keyframe-Namen mit.
function useActivationPulse(active) {
  const prevActive = useRef(active);
  const [pulse, setPulse] = useState(null);
  useEffect(() => {
    if (prevActive.current !== active) {
      const dir = active ? "in" : "out";
      setPulse(dir);
      prevActive.current = active;
      const t = setTimeout(() => setPulse(null), dir === "in" ? 320 : 280);
      return () => clearTimeout(t);
    }
  }, [active]);
  return pulse;
}

/* ── 2. Austauschen ── Einzelne weiche Sprechblase (Stadium + Schweif) ── */
export function ExchangeIcon({ size = 24, active = false, className, style }) {
  injectIconFamilyCSS();
  const stroke = pickIconStroke(size);
  const pulse = useActivationPulse(active);
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      style={{
        transformOrigin: "12px 11px",
        animation:
          pulse === "in"  ? "hui-chat-open-in 320ms ease-out"  :
          pulse === "out" ? "hui-chat-open-out 280ms ease-out" : "none",
        ...style,
      }}
    >
      <path d="M8.5,4.5 L13.5,4.5 A5.5,5.5 0 0 1 13.5,15.5 L11.3,15.5 L9.4,19.5 L9,15.5 L8.5,15.5 A5.5,5.5 0 0 1 8.5,4.5 Z" />
    </svg>
  );
}

/* ── 3. Merken ── Lesezeichen/Tag mit weich geschwungener Kerbe ────────
   "Bruder des HUIHeart": gleiche Strichstaerken-Logik, gleiche organische
   Kurvenfuehrung (Bezier statt spitzem V) fuer die untere Kerbe. */
export function BookmarkKeepIcon({ size = 24, active = false, className, style }) {
  injectIconFamilyCSS();
  const stroke = pickIconStroke(size);
  const pulse = useActivationPulse(active);
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      style={{
        transformOrigin: "12px 12px",
        animation:
          pulse === "in"  ? "hui-bookmark-snap-in 340ms ease-out"  :
          pulse === "out" ? "hui-bookmark-snap-out 280ms ease-out" : "none",
        ...style,
      }}
    >
      <path d="M8.8,4 L15.2,4 A1.8,1.8 0 0 1 17,5.8 L17,17.8 C17,18.6 16.6,18.9 16.1,18.4 L12,14.6 L7.9,18.4 C7.4,18.9 7,18.6 7,17.8 L7,5.8 A1.8,1.8 0 0 1 8.8,4 Z" />
    </svg>
  );
}

/* ── 4. Weitergeben ── organischer Schwung-Pfeil + offener Chevron ─────
   "Ich gebe diese Inspiration weiter." Bewusst kein Blitz/Papierflieger/
   Upload-Tray -- ein universell lesbarer Vorwaerts-Pfeil mit weichem,
   leicht geschwungenem Schaft statt einer harten Geraden. */
export function RecommendIcon({ size = 24, active = false, className, style }) {
  injectIconFamilyCSS();
  const stroke = pickIconStroke(size);
  const pulse = useActivationPulse(active);
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      style={{
        animation:
          pulse === "in"  ? "hui-share-forward-in 320ms ease-out"  :
          pulse === "out" ? "hui-share-forward-out 280ms ease-out" : "none",
        ...style,
      }}
    >
      <path d="M5.5,18.5 C7.5,15.5 10,12.8 13,10.8 S15.7,8.6 17,7.5" />
      <path d="M12.8,6.8 L17,7.5 L16,12.2" />
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
