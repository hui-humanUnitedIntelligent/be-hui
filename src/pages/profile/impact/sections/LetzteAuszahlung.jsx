import React from "react";
import { T, S } from "../tokens.js";
import { fmtEur, fmtMonth } from "../utils.js";
import { HUIAwardIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function LetzteAuszahlung({ payout, others }) {
  if (!payout?.project) return null;

  return (
    <div style={{ padding:"28px 16px 0" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:800, color:T.ink,
        letterSpacing:"-0.015em" }}>Letzte Auszahlung</h3>

      <div style={{ background:T.surfaceHi, borderRadius:20, padding:"16px 16px",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {/* Gewinner */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12,
          padding:"12px 14px", background:`${T.gold}10`,
          borderRadius:14, border:`1px solid ${T.gold}22` }}>
          <HUIAwardIcon size={22} style={{color:"rgba(245,158,11,0.8)"}} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:T.gold, fontWeight:700,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>
              GEWINNER {fmtMonth(payout.month)}
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:T.ink,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {payout.project.name}
            </div>
            <div style={{ fontSize:13, color:T.teal, fontWeight:700 }}>
              {fmtEur(payout.winnerAmount)} wurden ausgezahlt
            </div>
          </div>
        </div>

        {/* Weitere Verteilungen */}
        {others.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:T.muted,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
              Zusätzlich verteilt
            </div>
            {others.slice(0,4).map((o,i) => (
              <div key={o.id} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"6px 0",
                borderBottom: i < Math.min(others.length,4)-1 ? `1px solid ${T.line}` : "none" }}>
                <span style={{ fontSize:12, color:T.ink2 }}>{o.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.teal }}>
                  +{fmtEur(o.awarded_eur)}
                </span>
              </div>
            ))}
            {others.length > 4 && (
              <div style={{ fontSize:10, color:T.muted, marginTop:6 }}>
                … und {others.length-4} weitere Projekte
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
