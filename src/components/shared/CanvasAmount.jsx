// src/components/shared/CanvasAmount.jsx
// ══════════════════════════════════════════════════════════════════════
// ROOT CAUSE #6 (2026-08-09, mit Beweis): Auf mind. einem realen Geraet
// (Xiaomi HyperOS 3.0 / Android 16) misst/rendert die DOM-Text-Layout-
// Engine der WebView Zahlen-Strings ~72% ZU BREIT, obwohl die echte
// Inter-Schriftdatei nachweislich geladen ist (document.fonts.check=true)
// und Canvas.measureText() fuer denselben String/Font/Weight/Size die
// KORREKTE Breite liefert. Beweis (Live-Diagnose, FinanzuebersichtModal):
//   Canvas measureText: 90.21px  vs.  DOM rect.width: 154.97px
//   (identischer String "22.745,50 €", identische Inter/800/15px-Config)
// Das ist ein DOM-Text-Layout-Engine-Bug dieser konkreten WebView-Version,
// unabhaengig von Font-Datei, CSS letter-spacing/word-spacing (beide
// nachweislich normal/0px) und Zeilenumbruch (white-space:nowrap aktiv).
// KEINE CSS-Eigenschaft kann einen internen Layout-Engine-Bug fixen.
//
// FIX: Geldbetraege werden NICHT mehr als HTML-Text gerendert, sondern
// per <canvas> gezeichnet -- exakt die Pipeline, die nachweislich korrekt
// misst. devicePixelRatio-skaliert fuer scharfe Darstellung auf allen
// Displays. Fuer Screenreader/Bedienhilfen: aria-label mit Klartext.
// ══════════════════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";

/**
 * Rendert einen Text (v.a. Geldbetraege) per Canvas statt per DOM-Text,
 * um den bewiesenen DOM-Text-Layout-Bug auf betroffenen Android-WebViews
 * zu umgehen. API bewusst nah an einem <span> gehalten.
 *
 * @param {string} value       - Anzuzeigender Text, z.B. "22.745,50 €"
 * @param {number} fontSize    - in px (CSS-Pixel)
 * @param {number} fontWeight  - z.B. 800
 * @param {string} color       - CSS-Farbe (hex/rgb/etc.)
 * @param {string} fontFamily  - Default "Inter, sans-serif"
 * @param {object} style       - zusaetzliche Styles fuer den Wrapper-Span
 */
export default function CanvasAmount({
  value,
  fontSize = 15,
  fontWeight = 800,
  color = "#1A1A18",
  fontFamily = "Inter, sans-serif",
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || value == null) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Erste Messung um die benoetigte CSS-Breite zu bestimmen (bewiesen
    // korrekt -- siehe Kommentar oben).
    ctx.font = fontSpec;
    const text = String(value);
    const metrics = ctx.measureText(text);
    // Etwas Sicherheitsabstand (Overshoot bei Akzenten/Deszendern) + Rundung
    const cssWidth = Math.ceil(metrics.width) + 2;
    const cssHeight = Math.ceil(fontSize * 1.35);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.ceil(cssWidth * dpr);
    canvas.height = Math.ceil(cssHeight * dpr);

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.font = fontSpec;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, 0, cssHeight / 2);
  }, [value, fontSize, fontWeight, color, fontFamily]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={value == null ? "" : String(value)}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    />
  );
}
