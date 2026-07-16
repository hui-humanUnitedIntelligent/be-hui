import React from "react";
import { T, S, POOL_SLICES } from "../tokens.js";
import { fmtEur } from "../utils.js";

export function FondsAufteilungKompakt({ pool }) {
  return (
    <div style={{ padding:"28px 16px 0" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:800, color:T.ink,
        letterSpacing:"-0.015em" }}>So wird der Pool genutzt</h3>

      <div style={{ background:T.surfaceHi, borderRadius:20, overflow:"hidden",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {POOL_SLICES.map((sl, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
            borderBottom: i < POOL_SLICES.length-1 ? `1px solid ${T.line}` : "none",
          }}>
            <div style={{ width:8, height:8, borderRadius:2,
              background:sl.color, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>
                {sl.pct}% {sl.label}
              </span>
            </div>
            {!pool.loading && (
              <span style={{ fontSize:13, fontWeight:900, color:sl.color,
                letterSpacing:"-0.01em" }}>
                {fmtEur([pool.community,pool.wirkung,pool.innovation,pool.kuration][i])}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
