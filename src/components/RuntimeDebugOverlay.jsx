import React from "react";
import {
  clearRuntimeDebug,
  subscribeRuntimeDebug,
} from "../lib/runtimeDebug.js";

const PANEL_MAX = 6;

function shortTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function persistLabel(value) {
  if (value === true) return "Persistenz: fehlgeschlagen";
  if (value === false) return "Persistenz: nicht betroffen";
  return "Persistenz: unbekannt";
}

function EventRow({ event }) {
  if (!event) return null;
  return (
    <div style={{
      padding: "10px 0",
      borderTop: "1px solid rgba(255,255,255,0.10)",
    }}>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.48)", minWidth:54 }}>
          {shortTime(event.ts)}
        </span>
        <span style={{
          fontSize:10,
          textTransform:"uppercase",
          letterSpacing:".08em",
          color:"#FFB199",
          fontWeight:800,
        }}>
          {event.category}
        </span>
      </div>
      <div style={{ fontSize:12.5, fontWeight:800, color:"white", lineHeight:1.35 }}>
        {event.flow} / {event.step}
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.76)", marginTop:3, lineHeight:1.45 }}>
        Entity: {event.entity} · {persistLabel(event.persistFailed)}
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.86)", marginTop:5, lineHeight:1.45 }}>
        {event.message}
      </div>
      {event.details && (
        <details style={{ marginTop:6 }}>
          <summary style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>Details</summary>
          <pre style={{
            margin:"6px 0 0",
            padding:8,
            borderRadius:8,
            background:"rgba(0,0,0,0.24)",
            color:"rgba(255,255,255,0.70)",
            whiteSpace:"pre-wrap",
            wordBreak:"break-word",
            fontSize:10,
            lineHeight:1.45,
          }}>
            {JSON.stringify(event.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function Section({ title, items }) {
  return (
    <section style={{ marginTop:14 }}>
      <div style={{
        fontSize:11,
        color:"rgba(255,255,255,0.52)",
        fontWeight:800,
        letterSpacing:".08em",
        textTransform:"uppercase",
      }}>
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)", padding:"8px 0" }}>
          Keine Einträge
        </div>
      ) : items.slice(0, PANEL_MAX).map(event => <EventRow key={event.id} event={event} />)}
    </section>
  );
}

export default function RuntimeDebugOverlay() {
  const [debugState, setDebugState] = React.useState({
    events: [],
    runtimeErrors: [],
    failedActions: [],
    failedInserts: [],
    failedRealtime: [],
  });
  const [open, setOpen] = React.useState(false);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => subscribeRuntimeDebug(setDebugState), []);

  const latest = debugState.events[0];
  const count = debugState.events.length;

  if (!latest || muted) {
    return (
      <button
        type="button"
        onClick={() => setMuted(false)}
        style={{
          position:"fixed",
          right:"max(12px, env(safe-area-inset-right, 12px))",
          bottom:"max(12px, env(safe-area-inset-bottom, 12px))",
          zIndex:2147483000,
          display: muted && count ? "block" : "none",
          border:"1px solid rgba(0,0,0,0.12)",
          background:"rgba(255,255,255,0.86)",
          color:"#3A2A24",
          borderRadius:999,
          padding:"8px 11px",
          fontSize:11,
          fontWeight:800,
          boxShadow:"0 8px 24px rgba(0,0,0,0.14)",
        }}
      >
        Debug ({count})
      </button>
    );
  }

  return (
    <div style={{
      position:"fixed",
      right:"max(12px, env(safe-area-inset-right, 12px))",
      bottom:"max(12px, env(safe-area-inset-bottom, 12px))",
      width:"min(420px, calc(100vw - 24px))",
      zIndex:2147483000,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      pointerEvents:"auto",
    }}>
      <div style={{
        borderRadius:18,
        background:"rgba(34,21,19,0.94)",
        color:"white",
        boxShadow:"0 18px 60px rgba(0,0,0,0.32)",
        border:"1px solid rgba(255,255,255,0.14)",
        overflow:"hidden",
        backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
      }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            width:"100%",
            border:"none",
            background:"transparent",
            color:"inherit",
            padding:"12px 14px",
            textAlign:"left",
            display:"flex",
            gap:10,
            alignItems:"flex-start",
          }}
        >
          <div style={{
            width:28,
            height:28,
            borderRadius:999,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            background:"rgba(255,122,92,0.18)",
            color:"#FFB199",
            fontSize:15,
            flexShrink:0,
          }}>
            !
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:12, fontWeight:900, letterSpacing:".03em" }}>
              Runtime Debug · {latest.flow}
            </div>
            <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.82)", lineHeight:1.35, marginTop:2 }}>
              {latest.step} · {latest.entity}
            </div>
            <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.62)", lineHeight:1.35, marginTop:3 }}>
              {latest.message}
            </div>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.50)", paddingTop:2 }}>
            {open ? "Schließen" : `${count} Fehler`}
          </div>
        </button>

        {open && (
          <div style={{ padding:"0 14px 14px", maxHeight:"62vh", overflowY:"auto" }}>
            <div style={{ display:"flex", gap:8, margin:"2px 0 8px" }}>
              <button type="button" onClick={clearRuntimeDebug} style={smallButtonStyle}>
                Leeren
              </button>
              <button type="button" onClick={() => setMuted(true)} style={smallButtonStyle}>
                Ausblenden
              </button>
            </div>
            <Section title="Runtime Errors" items={debugState.runtimeErrors} />
            <Section title="Failed Actions" items={debugState.failedActions} />
            <Section title="Failed Inserts" items={debugState.failedInserts} />
            <Section title="Failed Realtime" items={debugState.failedRealtime} />
          </div>
        )}
      </div>
    </div>
  );
}

const smallButtonStyle = {
  border:"1px solid rgba(255,255,255,0.16)",
  background:"rgba(255,255,255,0.08)",
  color:"rgba(255,255,255,0.78)",
  borderRadius:999,
  padding:"7px 10px",
  fontSize:11,
  fontWeight:800,
};
