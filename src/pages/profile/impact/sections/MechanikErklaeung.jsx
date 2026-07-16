import React from "react";
import { T, S, CYCLE_STEPS } from "../tokens.js";

export function MechanikErklaeung({ onInfo }) {
  return (
    <div style={{ padding:"20px 16px 0" }}>
      <div style={{ display:"flex", alignItems:"baseline",
        justifyContent:"space-between", marginBottom:14 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em" }}>So funktioniert der Impact Pool</h2>
        <button onClick={onInfo} className="ip-p" style={{
          background:"none", border:`1px solid ${T.teal}28`,
          borderRadius:99, padding:"5px 13px", fontSize:11, fontWeight:700,
          color:T.teal, cursor:"pointer", flexShrink:0,
        }}>Mehr erfahren</button>
      </div>

      <div style={{ background:T.surfaceHi, borderRadius:20, padding:"16px 14px",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {/* 2×3 Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {CYCLE_STEPS.map((step, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:10,
              background:`${T.teal}07`, border:`1px solid ${T.teal}18`,
              borderRadius:14, padding:"11px 13px",
            }}>
              {/* Schritt-Nummer + Icon */}
              <div style={{ flexShrink:0, position:"relative" }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.teal}22,${T.teal}08)`,
                  border:`1.5px solid ${T.teal}35`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
                }}>{step.icon}</div>
                <div style={{
                  position:"absolute", top:-4, left:-4,
                  width:16, height:16, borderRadius:"50%",
                  background:T.teal, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontSize:9, fontWeight:900, color:"white",
                  boxShadow:`0 1px 4px ${T.teal}44`,
                }}>{i+1}</div>
              </div>
              {/* Label */}
              <div style={{ fontSize:12, fontWeight:700, color:T.ink, lineHeight:1.35 }}>
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Schluss-Hinweis */}
        <div style={{ marginTop:12, padding:"8px 12px",
          background:`${T.teal}06`, borderRadius:10,
          fontSize:11, color:T.ink2, lineHeight:1.5, textAlign:"center" }}>
          Einmal im Monat. Immer gemeinsam.{" "}
          <b style={{ color:T.teal }}>Kein Projekt geht leer aus.</b>
        </div>
      </div>
    </div>
  );
}
