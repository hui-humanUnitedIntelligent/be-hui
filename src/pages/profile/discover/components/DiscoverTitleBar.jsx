import React from "react";
import { T } from "../tokens.js";
import { ViewToggle } from "./ViewToggle.jsx";
export function DiscoverTitleBar({ view, onViewChange }) {
  return (
    <div style={{
      padding:`12px ${T.px}px 14px`,
      background:T.bg,
    }}>
      {/* Title Row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>Dein Zuhause auf HUI</span>
        </div>
        {/* View Toggle — oben rechts */}
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
      <div style={{ fontSize:12.5, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
        Der Ort, an dem deine Ideen, Begegnungen und Wirkung zusammenkommen.
      </div>
    </div>
  );
}
