import React from "react";
import { T, S } from "../tokens.js";

export function HerzensprojektEmotional({ onPropose }) {
  return (
    <div style={{ padding:"20px 16px 0" }}>
      <div style={{
        background:`linear-gradient(145deg,${T.teal}14,${T.teal}04)`,
        border:`1.5px solid ${T.teal}28`,
        borderRadius:28, padding:"32px 24px", textAlign:"center",
        position:"relative", overflow:"hidden",
      }}>
        {/* Dekorative Emojis */}
        <div style={{ position:"absolute", top:18, left:18, fontSize:22,
          animation:"ipFloat 7s ease-in-out 0s infinite", opacity:0.5 }}>🌱</div>
        <div style={{ position:"absolute", top:22, right:22, fontSize:20,
          animation:"ipFloat 9s ease-in-out 1.5s infinite", opacity:0.4 }}>✨</div>

        <div style={{ fontSize:44, marginBottom:16,
          filter:"drop-shadow(0 4px 16px rgba(13,196,181,0.3))",
          animation:"ipBreath 5s ease-in-out infinite" }}>💚</div>

        <h2 style={{ margin:"0 0 10px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em" }}>Hast du ein Herzensprojekt?</h2>

        <p style={{ fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 8px" }}>
          Kennst du etwas, das unsere Welt besser machen könnte?
        </p>
        <p style={{ fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 24px" }}>
          Reiche dein Projekt ein und lass die Community mitentscheiden.
        </p>

        <button onClick={onPropose} className="ip-p" style={{
          background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
          border:"none", borderRadius:20, padding:"15px 32px",
          fontSize:15, fontWeight:750, color:"white",
          cursor:"pointer", boxShadow:S.btn(T.teal),
          display:"inline-flex", alignItems:"center", gap:9,
          letterSpacing:"-0.01em",
        }}>
          <HUIImpactIcon size={18} style={{color:"rgba(14,196,184,0.6)"}} />
          Herzensprojekt einreichen
        </button>

        {/* Vertrauenselemente */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center",
          gap:8, marginTop:18 }}>
          {[
            "✓ Bewerbung kostenlos",
            "✓ Dauer ~5 Minuten",
            "✓ Kein Projekt geht leer aus",
            "✓ Prüfung durch HUI-Team",
          ].map((item, i) => (
            <div key={i} style={{
              display:"inline-flex", alignItems:"center",
              background:"rgba(255,255,255,0.6)", backdropFilter:"blur(8px)",
              border:`1px solid ${T.teal}22`, borderRadius:99,
              padding:"5px 11px", fontSize:10, fontWeight:600, color:T.ink2,
            }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. LIVE-TICKER (kompakt)
// ════════════════════════════════════════════════════════════════
