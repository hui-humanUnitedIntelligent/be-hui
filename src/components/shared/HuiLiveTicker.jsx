// src/components/shared/HuiLiveTicker.jsx — LIVETICKER.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// EIN Liveticker, appweit geteilt zwischen Home- und Entdecken-Tab
// (siehe LiveTickerContext.jsx). Ersetzt ersatzlos:
//   - AmbientWorldBar.jsx (Entdecken-Tab, war Fake-ACTIVITY_POOL)
//   - LiveActivityBar/ActivityCard in DiscoverPage.jsx (Home-Tab, war
//     Fake-LIVE_ACTIVITIES mit Unsplash-Bildern)
// Datenquelle: ausschliesslich useLiveTicker() (echte DB-Inhalte).
//
// Animation (wie beauftragt):
//   - Wechsel alle 8-12s (randomisiert)
//   - sanfter Crossfade + leichter horizontaler Versatz (kein hektisches
//     Durchlaufen, kein Blinken)
//   - keine Motion-Library, reines CSS transition (Projekt-Konvention)
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from "react";
import { useLiveTickerContext } from "../../context/LiveTickerContext.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx"; // OPEN.1 2026-07-08
import { useTabLifecycle } from "../../lib/world/tabLifecycle.js";

const T = {
  teal:     "#0EC4B8",
  ink:      "#1A3530",
  inkFaint: "rgba(26,53,48,0.42)",
  bg:       "rgba(250,250,248,0.92)",
  border:   "rgba(14,196,184,0.10)",
};

const CSS = `
  @keyframes hui-live-dot-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.45; transform:scale(.78); }
  }
  .hui-live-dot { animation: hui-live-dot-pulse 2.8s ease-in-out infinite; }
`;

function nextDelay() {
  return 8000 + Math.random() * 4000; // 8–12s
}

export default function HuiLiveTicker({ tabId = "feed" }) {
  const { items, loading } = useLiveTickerContext();
  const { openRef } = useContentPreview(); // OPEN.1 2026-07-08
  const { paused } = useTabLifecycle(tabId);
  const [idx, setIdx]         = useState(0);
  const [entering, setEntering] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (idx >= items.length) setIdx(0);
  }, [items.length, idx]);

  useEffect(() => {
    if (paused || items.length < 2) return undefined; // nichts zu rotieren / pausiert

    function schedule() {
      timerRef.current = setTimeout(() => {
        setEntering(false); // fade+slide out
        setTimeout(() => {
          setIdx(i => (i + 1) % items.length);
          setEntering(true); // fade+slide in
          schedule();
        }, 380);
      }, nextDelay());
    }
    schedule();
    return () => clearTimeout(timerRef.current);
  }, [items.length, paused]);

  // Keine Demo-Fallbacks: solange keine echten Daten da sind, lieber
  // unsichtbar bleiben als Platzhaltertext zu zeigen.
  if (!loading && items.length === 0) return null;
  if (loading && items.length === 0) return null;

  const current = items[idx] || items[0];
  if (!current) return null;

  return (
    <div style={{ width:"100%", overflow:"hidden" }}>
      <style>{CSS}</style>
      <div style={{
        background:T.bg,
        backdropFilter:"blur(10px)",
        WebkitBackdropFilter:"blur(10px)",
        borderBottom:`1px solid ${T.border}`,
        padding:"7px 16px",
        display:"flex", alignItems:"center", gap:8,
        overflow:"hidden",
      }}>
        <div style={{
          flexShrink:0, display:"flex", alignItems:"center", gap:5,
        }}>
          <div className="hui-live-dot" style={{ width:6, height:6, borderRadius:"50%", background:T.teal }}/>
          <span style={{ fontSize:9.5, fontWeight:700, color:T.teal, letterSpacing:".05em" }}>LIVE</span>
        </div>
        <div style={{ flex:1, overflow:"hidden", position:"relative", height:16 }}>
          <span
            key={current.id}
            onClick={current.openRef ? () => openRef(current.openRef) : undefined}
            style={{
              display:"block", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              fontSize:12.5, fontWeight:600, color:T.ink, letterSpacing:"-0.005em",
              opacity: entering ? 1 : 0,
              transform: entering ? "translateX(0)" : "translateX(-10px)",
              transition:"opacity 380ms ease, transform 380ms ease",
              cursor: current.openRef ? "pointer" : "default",
            }}
          >
            {current.text}
          </span>
        </div>
      </div>
    </div>
  );
}
