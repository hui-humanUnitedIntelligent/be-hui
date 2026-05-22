import { createTabItem, filterValidPages } from "../../lib/factories/createTabPage.js";
// connection-create/StepProgressBar.jsx
// 3-Step Fortschrittsanzeige — subtil, ruhig, keine Zahlen-Technik-Optik

import React from "react";

const STEPS = filterValidPages([
  createTabItem({ key:"1", label:"Inspiration" }),
  createTabItem({ key:"2", label:"Ausdruck"    }),
  createTabItem({ key:"3", label:"Realität"    }),
]);

const C = { violet:"#8B5CF6", muted:"rgba(80,80,80,0.35)", cream:"rgba(139,92,246,0.12)" };

const CSS = `
  @keyframes spb-glow {
    0%,100%{ box-shadow: 0 0 0 0 rgba(139,92,246,0); }
    50%    { box-shadow: 0 0 0 6px rgba(139,92,246,0.15); }
  }
`;

export default function StepProgressBar({ step }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      gap:0, padding:"0 32px",
    }}>
      <style>{CSS}</style>
      {STEPS.map((s, i) => {
        const done    = step > s.key;
        const active  = step === s.key;
        const isLast  = i === STEPS.length - 1;

        return (
          <React.Fragment key={s.key}>
            {/* Step dot */}
            <div style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:7, position:"relative",
            }}>
              <div style={{
                width:  active ? 12 : done ? 10 : 8,
                height: active ? 12 : done ? 10 : 8,
                borderRadius:"50%",
                background: done || active
                  ? "linear-gradient(135deg,#8B5CF6,#7C3AED)"
                  : C.cream,
                border: done || active
                  ? "none"
                  : "1.5px solid rgba(139,92,246,0.25)",
                transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                animation: active ? "spb-glow 2.5s ease-in-out infinite" : "none",
              }}/>
              <span style={{
                fontSize:11, fontWeight: active ? 700 : 500,
                color: active ? C.violet : C.muted,
                letterSpacing:0.1,
                transition:"color 0.3s",
                whiteSpace:"nowrap",
              }}>{s.label}</span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                height:1.5, flex:1, minWidth:40, maxWidth:80,
                margin:"0 10px", marginBottom:20,
                background: done
                  ? "linear-gradient(90deg,#8B5CF6,#7C3AED)"
                  : "rgba(139,92,246,0.15)",
                borderRadius:2,
                transition:"background 0.4s ease",
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
