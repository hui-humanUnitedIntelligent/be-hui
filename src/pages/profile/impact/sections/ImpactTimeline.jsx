import React from "react";
import { T, S } from "../tokens.js";
import { fmtEur, safeNum } from "../utils.js";

export function ImpactTimeline({ transp }) {
  // Immer rendern — auch wenn DB leer (zeigt 0er Counts als "noch ausstehend")

  const steps = [
    {
      icon: "📬",
      count: transp.loading ? null : transp.eingereicht,
      label: "Eingereicht",
      sub: "Letzte 30 Tage",
      color: "#9CA3AF",
    },
    {
      icon: "🔍",
      count: transp.pruefung,
      label: "In Prüfung",
      sub: "Aktuell",
      color: "#D97706",
    },
    {
      icon: "🌱",
      count: transp.nominiert,
      label: "Nominiert",
      sub: "Diesen Monat",
      color: T.teal,
    },
    {
      icon: "💚",
      count: transp.finanziert_count,
      label: "Finanziert",
      sub: "Insgesamt",
      color: "#16A34A",
    },
    {
      icon: "🚀",
      count: transp.umsetzung,
      label: "In Umsetzung",
      sub: "Aktuell",
      color: "#7264D6",
    },
  ];

  return (
    <div style={{ margin:"24px 16px 0" }}>
      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <h2 style={{ margin:"0 0 3px", fontSize:20, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em" }}>Impact auf einen Blick</h2>
        <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.5 }}>
          Wie Projekte durch HUI wachsen und wirken.
        </p>
      </div>

      {/* Timeline — horizontal scroll auf mobil */}
      <div style={{
        background:T.surfaceHi, borderRadius:20,
        boxShadow:S.card, border:`1px solid ${T.line}`,
        padding:"18px 12px",
        overflowX:"auto",
        WebkitOverflowScrolling:"touch",
      }}>
        <div style={{
          display:"flex", alignItems:"center",
          gap:0, minWidth:"min-content",
        }}>
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {/* Schritt */}
              <div style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                minWidth:62, textAlign:"center", flexShrink:0,
              }}>
                {/* Icon-Kreis */}
                <div style={{
                  width:44, height:44, borderRadius:"50%",
                  background:`${step.color}14`,
                  border:`1.5px solid ${step.color}35`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:20,
                  marginBottom:8,
                  boxShadow: step.count > 0 ? `0 2px 12px ${step.color}28` : "none",
                }}>
                  {step.icon}
                </div>
                {/* Zahl */}
                <div style={{
                  fontSize:20, fontWeight:900,
                  color: step.count === null ? T.muted : step.count > 0 ? step.color : T.muted,
                  letterSpacing:"-0.03em", lineHeight:1, marginBottom:3,
                  minWidth:24, textAlign:"center",
                }}>
                  {step.count === null ? "·" : step.count}
                </div>
                {/* Label */}
                <div style={{
                  fontSize:9, fontWeight:700, color:T.ink2, lineHeight:1.35,
                }}>
                  {step.label}
                </div>
                {/* Sub */}
                <div style={{ fontSize:8, color:T.muted, marginTop:2 }}>
                  {step.sub}
                </div>
              </div>

              {/* Pfeil zwischen Schritten */}
              {i < steps.length - 1 && (
                <div style={{
                  fontSize:12, color:`${T.teal}55`, flexShrink:0,
                  padding:"0 4px", marginBottom:18,
                }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Hinweis-Zeile */}
        <div style={{
          marginTop:12, fontSize:11, color:T.muted,
          textAlign:"center", lineHeight:1.5,
        }}>
          {transp.loading
            ? "Projektdaten werden geladen…"
            : steps.every(s => s.count === 0 || s.count === null)
              ? "Der Impact Pool startet — die ersten Projekte kommen bald. 🌱"
              : "Der Impact Pool lebt und wächst — gemeinsam bewegen wir mehr. 💚"
          }
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
