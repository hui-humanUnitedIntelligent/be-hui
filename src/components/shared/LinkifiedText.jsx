// src/components/shared/LinkifiedText.jsx
// BROADCAST-LINKIFY-001 (2026-09-11): Rendert einen Text mit klickbaren Links.
// Zweck: System-Broadcast-Posts (moment_source='system_broadcast', z.B. die
// neuen Video-Broadcasts mit "🎬 Ganzer Film: <YouTube-URL>") enthaalten einen
// YouTube-Link, der im Feed und im Post-Fullscreen ANKLICKBAR sein muss
// (oeffnet neuen Tab). Normale Nutzer-Texte bleiben unveraendert — die
// Komponente wird NUR fuer System-Broadcast-Posts verwendet (Gate beim Caller),
// da Nutzer-Content bewusst NICHT linkifiziert wird (Kommentar-/Chat-Regel:
// Links in Nutzerbereichen sind blockiert; hier: vertrauenswuerdiger Admin-
// Content).
//
// Implementierung: String-Split an URLs (https?://...) — die Segmente werden
// als Text bzw. <a target="_blank" rel="noopener noreferrer"> gerendert.
// Kein DOMPurify/noetig: React escaped alle Text-Segmente automatisch, nur
// <a href> wird mit dem gematchten URL-String gesetzt (kein HTML-Injection
// moeglich — href ist ein JS-String-Prop, kein dangerouslySetInnerHTML).

import React from "react";

const URL_SPLIT = /(https?:\/\/[^\s]+)/g;

// Prueft ob ein Segment eine URL ist (nach Split ist jedes zweite Segment URL)
const isUrl = (s) => /^https?:\/\//.test(s);

export default function LinkifiedText({ text, linkColor = "#0DC4B5", style }) {
  if (!text) return null;
  const segments = String(text).split(URL_SPLIT);
  return (
    <span style={style}>
      {segments.map((seg, i) =>
        isUrl(seg) ? (
          <a
            key={`lnk-${i}`}
            href={seg}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: linkColor,
              textDecoration: "underline",
              wordBreak: "break-all",
            }}
          >
            {seg}
          </a>
        ) : (
          <React.Fragment key={`txt-${i}`}>{seg}</React.Fragment>
        )
      )}
    </span>
  );
}
