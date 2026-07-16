import React from "react";
import { T } from "../tokens.js";
export function AmbassadorBanner({ profile, ambState, onApply }) {
  const isAmb     = profile?.is_ambassador === true;
  const isPending = ambState?.isPending || ambState?.applicationStatus === "offen"
                    || ambState?.applicationStatus === "pending";
  if (isAmb) return null; // Aktive Ambassadors brauchen keinen CTA

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        background:T.bgCard,
        borderRadius:T.r20,
        border:`1px solid ${T.border}`,
        boxShadow:T.card,
        padding:"16px 18px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        {/* Münz-Icon */}
        <div style={{
          width:44, height:44, borderRadius:T.r12, flexShrink:0,
          background:"linear-gradient(135deg,rgba(255,193,7,0.15),rgba(255,193,7,0.08))",
          border:"1.5px solid rgba(255,193,7,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>
          🏅
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:2 }}>
            Ambassador werden
          </div>
          <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45 }}>
            Teile HUI mit anderen und unterstütze das Wachstum der Gemeinschaft.
          </div>
          {isPending && (
            <div style={{
              marginTop:6, fontSize:11.5, fontWeight:600,
              color:"#B8860B",
            }}>
              ⏳ Bewerbung wird geprüft
            </div>
          )}
        </div>

        {/* Button */}
        {!isPending && (
          <button
            onClick={onApply}
            className="mbp-press"
            style={{
              flexShrink:0,
              padding:"10px 16px", borderRadius:T.r99,
              background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
              border:"none", color:"white",
              fontSize:12.5, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation",
              fontFamily:"inherit",
              whiteSpace:"nowrap",
              boxShadow:T.glowTeal,
            }}
          >
            Jetzt anmelden ›
          </button>
        )}
      </div>
    </div>
  );
}
