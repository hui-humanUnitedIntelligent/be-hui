import React from "react";
import { T, S } from "../tokens.js";
import { fmtEur } from "../utils.js";
import { WirkungsChips } from "./WirkungsChips.jsx";

export function PoolCard({ pool, stats, userImpact }) {
  const MINI_STATS = [
    { emoji:"📦", val:stats.werke,      label:"Werke verkauft"          },
    { emoji:"📅", val:stats.erlebnisse, label:"Erlebnisse gebucht"      },
    { emoji:"👥", val:stats.buchungen,  label:"Buchungen diesen Monat"  },
  ];

  return (
    <div style={{ padding:"24px 16px 0" }}>
      {/* Haupt-Pool-Karte */}
      <div style={{
        background:`linear-gradient(135deg,${T.teal}18,${T.teal}06)`,
        border:`1.5px solid ${T.teal}35`,
        borderRadius:24, padding:"24px 22px",
        boxShadow:`0 4px 28px ${T.teal}18, 0 1px 6px rgba(0,0,0,0.04)`,
        marginBottom:14,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>❤️</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.teal,
                letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Diesen Monat im Impact Pool
              </span>
            </div>
            <div style={{ fontSize:36, fontWeight:900, color:T.teal,
              letterSpacing:"-0.035em", lineHeight:1 }}>
              {pool.loading ? "—" : fmtEur(pool.pool)}
            </div>
            <div style={{ fontSize:11, color:T.ink2, marginTop:5 }}>
              Live berechnet aus HUI-Buchungen
            </div>
          </div>
          <div style={{ fontSize:38,
            filter:"drop-shadow(0 4px 14px rgba(13,196,181,0.32))",
            animation:"ipBreath 6s ease-in-out infinite",
          }}>💚</div>
        </div>

        {/* Wirkungs-Chips mit Popover */}
        <WirkungsChips pool={pool} />

        {/* Deine Wirkung — dezent, nur wenn User eingeloggt */}
        {userImpact && !userImpact.loading && (
          <div style={{
            marginTop:14, paddingTop:12,
            borderTop:"1px solid rgba(255,255,255,0.20)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13 }}>💚</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.teal }}>Deine Wirkung</span>
            </div>
            <div style={{ display:"flex", gap:18 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:900, color:T.teal, lineHeight:1 }}>
                  {userImpact.eur > 0 ? fmtEur(userImpact.eur) : "0 €"}
                </div>
                <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>eingebracht</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:900, color:T.teal, lineHeight:1 }}>
                  {userImpact.projekte}
                </div>
                <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>
                  Projekt{userImpact.projekte !== 1 ? "e" : ""} unterstützt
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3 Mini-Stat-Karten */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {MINI_STATS.map((st, i) => (
          <div key={i} style={{
            background:T.surfaceHi, borderRadius:16, padding:"14px 12px",
            boxShadow:S.card, border:`1px solid ${T.line}`,
            textAlign:"center",
            animation:"ipFade 0.3s ease both", animationDelay:`${i*0.06}s`,
          }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{st.emoji}</div>
            <div style={{ fontSize:18, fontWeight:900, color:T.ink, letterSpacing:"-0.02em" }}>
              {stats.loading ? "—" : st.val}
            </div>
            <div style={{ fontSize:9, color:T.muted, marginTop:3, lineHeight:1.35 }}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
