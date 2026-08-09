// src/components/shared/CanvasAmount.jsx
// ══════════════════════════════════════════════════════════════════════
// ROOT CAUSE #6 (2026-08-09, mit Beweis): Auf mind. einem realen Geraet
// (Xiaomi HyperOS 3.0 / Android 16) misst/rendert die DOM-Text-Layout-
// Engine der WebView Zahlen-Strings ~72% ZU BREIT, obwohl die echte
// Inter-Schriftdatei nachweislich geladen ist (document.fonts.check=true)
// und Canvas.measureText() fuer denselben String/Font/Weight/Size die
// KORREKTE Breite liefert.
// FIX: Geldbetraege per <canvas> gezeichnet statt HTML-Text.
// ══════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState } from "react";

export default function CanvasAmount({
  value,
  fontSize = 15,
  fontWeight = 800,
  color = "#1A1A18",
  fontFamily = "Inter, sans-serif",
  style = {},
}) {
  const canvasRef = useRef(null);
  const [fontsReady, setFontsReady] = useState(false);

  // Warte bis Fonts definitiv geladen sind — Canvas braucht das,
  // document.fonts.check() prueft nur DOM-Verfuegbarkeit.
  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setFontsReady(true));
    } else {
      setFontsReady(true);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || value == null) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const text = String(value);

    // Messung
    ctx.font = fontSpec;
    const metrics = ctx.measureText(text);
    const cssWidth = Math.max(Math.ceil(metrics.width) + 4, 10);
    const cssHeight = Math.ceil(fontSize * 1.4);

    // Canvas-Dimensionen setzen (ACHTUNG: setzt Context-State zurueck!)
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.ceil(cssWidth * dpr);
    canvas.height = Math.ceil(cssHeight * dpr);

    // Nach Reset: Scale + Font + Farbe neu setzen
    ctx.scale(dpr, dpr);
    ctx.font = fontSpec;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, 1, cssHeight / 2);
  }, [value, fontSize, fontWeight, color, fontFamily, fontsReady]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={value == null ? "" : String(value)}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        // DEBUG: roter Rahmen damit man sieht ob der Canvas da ist
        border: "1px solid red",
        ...style,
      }}
    />
  );
}
