// chat-center/ChatMessages.jsx

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useKeyboardInset, getKeyboardDebugInfo } from "../../hooks/useKeyboardInset.js";
import MessageBubble, { TypingBubble } from "./MessageBubble.jsx";
import { HUI } from "../../design/hui.design.js";
import { formatDateDE } from "../../lib/formatters.js";

const C = { teal:HUI.COLOR.teal, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.45)" };

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

function DateDivider({ label = "" }) {
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

function EventPreviewCard({ event = {} }) {
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
        <div style={{ fontSize:10.5, color:C.teal, fontWeight: 600,
          letterSpacing:0.5, textTransform:"uppercase", marginBottom:4 }}>
          N\u00e4chstes Erlebnis
        </div>
        <div style={{ fontSize:15, fontWeight: 600, color:C.ink, marginBottom:4 }}>
          {event.title}
        </div>
        <div style={{ fontSize:12.5, color:C.muted }}>
          {event.when_full} &nbsp;·&nbsp; {event.location_label}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages = [], typing = false, event = null, onDelete = () => {}, onEdit = () => {} }) {
  const rootRef    = useRef(null);
  const contentRef = useRef(null); // Wrapper um alle Bubbles -- fuer ResizeObserver
  // "Angedockt"-Zustand: solange true, wird der Chat automatisch am unteren
  // Rand gehalten -- auch wenn nachträglich Bild-Bubbles nachladen und die
  // Gesamthöhe des Inhalts noch wachsen lassen. Wird false, sobald der Nutzer
  // aktiv nach oben scrollt (Verlauf lesen), damit er dabei nicht ständig
  // ans Ende zurückgerissen wird.
  const stickRef = useRef(true);
  const kbdInset  = useKeyboardInset();

  // DIAGNOSE-FIX (2026-08-17): temporäres Debug-Overlay direkt am
  // Scroll-Container (rootRef) — zeigt scrollTop/scrollHeight/clientHeight
  // + die BoundingClientRect von ConversationRoom (via rootRef.parentElement)
  // damit wir sehen, WO genau das Layout kollabiert, statt zu raten.
  // TODO nach Diagnose wieder entfernen.
  const [dbg, setDbg] = useState(null);
  useEffect(() => {
    const id = setInterval(() => {
      const el = rootRef.current;
      const room = el?.closest('[data-hui-conv-room]');
      setDbg({
        kbd: getKeyboardDebugInfo(),
        scrollTop: el?.scrollTop ?? null,
        scrollHeight: el?.scrollHeight ?? null,
        clientHeight: el?.clientHeight ?? null,
        rectTop: el?.getBoundingClientRect()?.top ?? null,
        rectBottom: el?.getBoundingClientRect()?.bottom ?? null,
        roomRectTop: room?.getBoundingClientRect()?.top ?? null,
        roomRectBottom: room?.getBoundingClientRect()?.bottom ?? null,
      });
    }, 300);
    return () => clearInterval(id);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = rootRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // KEYBOARD-SCROLL-FIX (2026-08-17): Wenn die Tastatur aufgeht, schrumpft
  // der Container (bottom: var(--hui-keyboard-inset) in ConversationRoom).
  // Ohne diesen Effekt bleibt die Scroll-Position stehen → die letzte
  // Nachricht rutscht weit nach oben, große Lücke zum Eingabefeld.
  useEffect(() => {
    if (kbdInset === 0) return;
    if (!stickRef.current) return;
    const raf = requestAnimationFrame(scrollToBottom);
    const t = setTimeout(scrollToBottom, 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [kbdInset, scrollToBottom]);

  // SCROLL-FIX (2026-08-10): Beim Öffnen eines Chats landete der Verlauf oft
  // "irgendwo in der Mitte" statt am Ende (Nutzer-Feedback, Screenshot).
  // Root Cause: das reine `el.scrollTop = el.scrollHeight` direkt im Effekt
  // lief, BEVOR der Browser das finale Layout aller Bubbles (insb. Bild-
  // Nachrichten, deren <img> zu diesem Zeitpunkt oft noch keine geladene
  // Höhe hat) berechnet hatte -- scrollHeight war zu diesem Zeitpunkt also
  // noch zu klein, und der spätere Layout-Sprung (wenn Bilder/Fonts nachladen)
  // wurde NICHT mehr nachgeholt. Fix: doppelter requestAnimationFrame stellt
  // sicher, dass der erste Layout-Pass abgeschlossen ist, bevor gescrollt
  // wird -- UND ein ResizeObserver (siehe unten) hält den Chat danach
  // weiterhin am unteren Rand "angedockt", falls der Inhalt noch weiter wächst
  // (z.B. weil ein Bild erst Sekunden später fertig geladen ist).
  useEffect(() => {
    stickRef.current = true;
    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    // CHAT-SCROLL-FIX (2026-08-11): zusaetzliches Sicherheitsnetz -- ein
    // verzoegerter Korrektur-Scroll nach 350ms faengt Faelle ab, in denen
    // Bilder/Fonts erst nach den zwei rAF-Passes fertig laden UND der
    // ResizeObserver aus irgendeinem Grund nicht zuverlaessig feuert
    // (z.B. sehr alte WebViews). Nur wirksam, solange stickRef.current
    // true ist -- reisst den Nutzer also nicht zurueck, wenn er zwischen-
    // zeitlich aktiv nach oben gescrollt hat.
    const t1 = setTimeout(() => { if (stickRef.current) scrollToBottom(); }, 350);
    return () => { cancelAnimationFrame(raf1); clearTimeout(t1); };
  }, [messages, typing, scrollToBottom]);

  // CHAT-SCROLL-FIX (2026-08-11): globaler Listener auf das
  // "hui:chat:media-loaded"-Event (dispatched von MessageBubble.jsx,
  // ImageThumb onLoad/onError) -- explizite Absicherung zusaetzlich zum
  // ResizeObserver unten, damit ein spaet ladendes Bild garantiert eine
  // finale Scroll-Korrektur ans Ende ausloest, solange "angedockt".
  useEffect(() => {
    const onMediaLoaded = () => { if (stickRef.current) scrollToBottom(); };
    window.addEventListener("hui:chat:media-loaded", onMediaLoaded);
    return () => window.removeEventListener("hui:chat:media-loaded", onMediaLoaded);
  }, [scrollToBottom]);

  // Hält den Chat am unteren Rand "angedockt", solange stickRef.current
  // true ist -- fängt insbesondere nachträglich ladende Bild-Bubbles ab,
  // die die Gesamthöhe des Inhalts NACH dem obigen Scroll noch verändern
  // (Bild-<img> ohne width/height-Attribut hat vor dem Laden 0px Höhe und
  // "springt" beim Laden auf seine finale Größe -- klassischer Layout-Shift,
  // siehe MessageBubble/ImageThumb). Beobachtet wird contentRef (der
  // Wrapper um ALLE Nachrichten-Bubbles), NICHT rootRef selbst -- der
  // Scroll-Container hat eine vom Flex-Parent vorgegebene, unveränderliche
  // Größe; nur sein INHALT wächst, wenn ein Bild nachlädt.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (stickRef.current) scrollToBottom();
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  // Verlässt den "Angedockt"-Modus, wenn der Nutzer aktiv im Verlauf nach
  // oben scrollt -- sonst würde jedes Nachladen ihn zurück ans Ende reissen,
  // während er ältere Nachrichten lesen möchte.
  const handleScroll = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distanceFromBottom < 60;
  }, []);

  const groups = [];
  let currentDate = null;
  (messages||[]).forEach(msg => {
    const date = msg.created_at
      ?formatDateDE(new Date(msg.created_at), {weekday:"long",day:"numeric",month:"long"})
      : null;
    const label = date ===formatDateDE(new Date(), {weekday:"long",day:"numeric",month:"long"})
      ? "Heute" : date;
    if (label && label !== currentDate) {
      groups.push({ type:"date", label });
      currentDate = label;
    }
    groups.push({ type:"msg", msg });
  });

  return (
    <>
    {/* DIAGNOSE-FIX (2026-08-17): Debug-Overlay als GESCHWISTER-Element
        ausserhalb des scrollbaren Containers gerendert -- vorher war es
        ein Kind von rootRef (overflowY:auto), wodurch es trotz
        position:fixed beim Scrollen mitwanderte (siehe SCROLL-DRAG-FIX
        in globalKeyboardHandler.js -- dieselbe WebView-Eigenart). */}
    {dbg && (
      <div style={{
        position:"fixed", top:110, left:6, zIndex:99999,
        background:"rgba(0,0,0,0.85)", color:"#0f0",
        fontFamily:"monospace", fontSize:9.5, lineHeight:1.45,
        padding:"6px 8px", borderRadius:6, pointerEvents:"none",
        whiteSpace:"pre",
      }}>
{`kbd:${kbdInset} vv:${dbg.kbd.vvInset} nat:${dbg.kbd.nativeInset}
winH:${dbg.kbd.windowInnerHeight}
room top:${Math.round(dbg.roomRectTop)} bot:${Math.round(dbg.roomRectBottom)}
msgs top:${Math.round(dbg.rectTop)} bot:${Math.round(dbg.rectBottom)}
scrollTop:${dbg.scrollTop} scrollH:${dbg.scrollHeight}
clientH:${dbg.clientHeight}`}
      </div>
    )}
    <div ref={rootRef} className="hui-scroll" onScroll={handleScroll} style={{
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
      // Mechanismus (siehe useEffect oben) bleibt unveraendert bestehen
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
      <div style={{ flex:"1 1 0px" }} aria-hidden="true" />

      <div ref={contentRef}>
        <EventPreviewCard event={event}/>

        {groups.map((g, i) =>
          g.type === "date"
            ? <DateDivider key={`d-${i}`} label={g.label}/>
            : <MessageBubble key={g.msg.id || i} msg={g.msg} onDelete={onDelete} onEdit={onEdit}/>
        )}

        {typing && <TypingBubble/>}
      </div>
    </div>
    </>
  );
}
