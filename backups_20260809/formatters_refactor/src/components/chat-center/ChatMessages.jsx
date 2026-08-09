// chat-center/ChatMessages.jsx

import React, { useRef, useEffect } from "react";
import MessageBubble, { TypingBubble } from "./MessageBubble.jsx";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.45)" };

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

function DateDivider({ label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"16px 20px 8px",
    }}>
      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.07)" }}/>
      <span style={{
        fontSize:11.5, color:C.muted, fontWeight:600,
        letterSpacing:0.5,
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.07)" }}/>
    </div>
  );
}

function EventPreviewCard({ event }) {
  if (!event) return null;
  return (
    <div style={{
      margin:"16px 16px 8px",
      borderRadius:18,
      background:"rgba(255,255,255,0.72)",
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      border:"1px solid rgba(22,215,197,0.14)",
      boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
      overflow:"hidden",
    }}>
      {event.cover_url && (
        <div style={{
          height:100,
          background:`url(${event.cover_url}) center/cover no-repeat`,
        }}/>
      )}
      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ fontSize:10.5, color:C.teal, fontWeight:700,
          letterSpacing:0.5, textTransform:"uppercase", marginBottom:4 }}>
          N\u00e4chstes Erlebnis
        </div>
        <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:4 }}>
          {event.title}
        </div>
        <div style={{ fontSize:12.5, color:C.muted }}>
          {event.when_full} &nbsp;·&nbsp; {event.location_label}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, typing, event, onDelete, onEdit }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const groups = [];
  let currentDate = null;
  (messages||[]).forEach(msg => {
    const date = msg.created_at
      ? new Date(msg.created_at).toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})
      : null;
    const label = date === new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})
      ? "Heute" : date;
    if (label && label !== currentDate) {
      groups.push({ type:"date", label });
      currentDate = label;
    }
    groups.push({ type:"msg", msg });
  });

  return (
    <div ref={rootRef} className="hui-scroll" style={{
      // SCROLL-FIX (2026-08-08): "flex:1, minHeight:0, overflowY:auto" +
      // "justifyContent:flex-end" ist ein bekannter WebKit-Bug (iOS Safari /
      // Capacitor-WebView) -- sobald der Inhalt den Container ueberragt,
      // berechnet WebKit den scrollbaren Bereich falsch und der Chat laesst
      // sich NICHT mehr nach oben scrollen (aeltere Nachrichten bleiben
      // unerreichbar abgeschnitten). Nutzer-Feedback (2026-08-08, Screenshot):
      // "chat lässt sich nicht scrollen" bei einer laengeren Konversation mit
      // hohen Bild-Bubbles. Standard-Workaround: justifyContent NICHT auf
      // flex-end setzen (bricht Overflow-Scroll in WebKit), sondern stattdessen
      // einen wachsenden Spacer als ERSTES Kind einfuegen (siehe unten) -- der
      // uebernimmt den "am unteren Rand ausgerichtet, wenn Inhalt kurz ist"-
      // Effekt ohne den Overflow-Bug. Der bestehende Auto-Scroll-zum-Ende-
      // Mechanismus (scrollTop=scrollHeight oben) bleibt unveraendert bestehen
      // und funktioniert unabhaengig vom Spacer weiterhin normal.
      flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden",
      display:"flex", flexDirection:"column",
      overscrollBehavior:"contain",
      paddingBottom:8,
    }}>
      <style>{CSS}</style>

      {/* Wachsender Spacer statt justifyContent:flex-end -- siehe Kommentar
          oben. flex:"1 0 auto" nimmt den kompletten Leerraum auf, wenn die
          Nachrichten kuerzer als der sichtbare Bereich sind (Chat wirkt am
          unteren Rand "angedockt"), verschwindet aber vollstaendig sobald
          der Inhalt ueberlaeuft -- dann verhaelt sich overflowY:auto exakt
          wie ein normaler, ungebrochener Scroll-Container. */}
      <div style={{ flex:"1 0 auto" }} aria-hidden="true" />

      <EventPreviewCard event={event}/>

      {groups.map((g, i) =>
        g.type === "date"
          ? <DateDivider key={`d-${i}`} label={g.label}/>
          : <MessageBubble key={g.msg.id || i} msg={g.msg} onDelete={onDelete} onEdit={onEdit}/>
      )}

      {typing && <TypingBubble/>}
    </div>
  );
}
