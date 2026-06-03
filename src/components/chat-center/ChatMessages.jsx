// chat-center/ChatMessages.jsx
// Scrollbarer Nachrichtenraum
// Screenshot: Datum-Divider, Event-Preview-Card, Nachrichten-Bubbles

import React, { useRef, useEffect } from "react";
import MessageBubble, { TypingBubble } from "./MessageBubble.jsx";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.45)" };

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

/* ── Datum-Divider ── */
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

/* ── Event Preview Card (Screenshot: Nächstes Erlebnis) ── */
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
      {/* Cover */}
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
        <button style={{
          marginTop:10, border:"none", background:"none",
          color:C.teal, fontSize:13, fontWeight:700, cursor:"pointer", padding:0,
          display:"flex", alignItems:"center", gap:4,
        }}>Details ansehen <span style={{fontSize:12}}>→</span></button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ChatMessages({ messages, typing, event }) {
  const endRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // CM selbst: blaue Outline + Label
    el.style.outline = "4px solid blue";
    const existing = el.querySelector(".__cm_label");
    if (!existing) {
      const lbl = document.createElement("div");
      lbl.className = "__cm_label";
      lbl.textContent =
        `CM_h=${el.offsetHeight} CM_client=${el.clientHeight} ` +
        `CM_scroll=${el.scrollHeight} CM_scrollTop=${el.scrollTop}`;
      Object.assign(lbl.style, {
        position:"sticky", top:"8px", left:"4px",
        background:"blue", color:"white",
        fontSize:"10px", fontWeight:"700", fontFamily:"monospace",
        padding:"2px 6px", zIndex:"999999", pointerEvents:"none",
        display:"block", width:"fit-content",
      });
      el.insertBefore(lbl, el.firstChild);
    }
    // PARENT: grüne Outline + Label
    const parent = el.parentElement;
    if (parent && !parent.querySelector(".__parent_label")) {
      parent.style.outline = "4px solid green";
      const pl = document.createElement("div");
      pl.className = "__parent_label";
      pl.textContent = `PARENT_h=${parent.offsetHeight} PARENT_client=${parent.clientHeight}`;
      Object.assign(pl.style, {
        position:"absolute", top:"0", right:"0",
        background:"green", color:"white",
        fontSize:"10px", fontWeight:"700", fontFamily:"monospace",
        padding:"2px 6px", zIndex:"999999", pointerEvents:"none",
      });
      parent.style.position = parent.style.position || "relative";
      parent.appendChild(pl);
    }
    console.log("[CM_DIAG]", {
      CM_h: el.offsetHeight, CM_client: el.clientHeight,
      CM_scroll: el.scrollHeight, CM_scrollTop: el.scrollTop,
      PARENT_h: el.parentElement?.offsetHeight,
    });
  }, [messages]);


  // Gruppiere Nachrichten nach Datum
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
      flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden",
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
      paddingBottom:8,
    }}>
      <style>{CSS}</style>
      {/* DIAG: sticky rote Linie — zeigt wo ChatMessages wirklich beginnt */}
      <div style={{ position:"sticky", top:0, height:4,
        background:"red", zIndex:99999, flexShrink:0 }}/>

      {/* Event Preview — oben im Chat */}
      <EventPreviewCard event={event}/>

      {/* Nachrichten */}
      {groups.length === 0 && (
        <div style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          flexDirection:"column", gap:14, padding:"40px 32px",
        }}>
          {/* Atmosphärischer Einstieg — kein leerer weißer Screen */}
          <div style={{
            width:56, height:56, borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24,
          }}>✦</div>
          <div style={{
            fontSize:14, textAlign:"center", lineHeight:1.7,
            color:"rgba(80,80,80,0.42)",
            maxWidth:220,
          }}>
            Erste Worte.<br/>
            <span style={{ color:"rgba(22,215,197,0.65)", fontWeight:600 }}>
              Schreib etwas Echtes.
            </span>
          </div>
          <div style={{
            fontSize:12, color:"rgba(80,80,80,0.28)",
            textAlign:"center", marginTop:4,
          }}>
            Deine Nachricht wird sofort zugestellt.
          </div>
        </div>
      )}

      {groups.map((g, i) =>
        g.type === "date"
          ? <DateDivider key={`d-${i}`} label={g.label}/>
          : <MessageBubble key={g.msg.id || i} msg={g.msg}/>
      )}

      {typing && <TypingBubble/>}
    </div>
  );
}
