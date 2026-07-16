import React from "react";
import { HUIStatistikIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { T } from "../notificationTypes.js";
import { useWeekStats } from "../useWeekStats.js";

export function WeekStats({ userId }) {
  const stats = useWeekStats(userId);

  const items = [
    { emoji:"🌱", value: stats?.connections ?? "–", label:"Neue\nVerbindungen", color:"#22C55E" },
    { emoji:"❤️", value: stats?.reached     ?? "–", label:"Menschen\nerreicht",  color:"#EF4444" },
    { emoji:"⭐", value: stats?.saved       ?? "–", label:"Werke\ngespeichert", color:"#F59E0B" },
    { emoji:"📅", value: stats?.booked      ?? "–", label:"Erlebnisse\ngebucht", color:"#8B5CF6" },
  ];

  return (
    <div style={{padding:"4px 16px 24px"}}>
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"14px 0 12px",
        borderTop:`1px solid ${T.border}`,
      }}>
        <div style={{
          width:22, height:22, borderRadius:6,
          background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"rgba(14,196,184,0.5)",
        }}><HUIStatistikIcon size={24}/></div>
        <span style={{
          fontSize:11, fontWeight:800,
          color:"rgba(26,26,24,0.40)",
          letterSpacing:"0.07em", textTransform:"uppercase",
        }}>
          Diese Woche
        </span>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8}}>
        {items.map((it, i) => (
          <div key={i} style={{
            background:T.card,
            borderRadius:14, padding:"12px 8px",
            border:`1px solid ${T.border}`,
            textAlign:"center",
            boxShadow:"0 1px 4px rgba(26,26,24,0.05)",
          }}>
            <div style={{fontSize:20, marginBottom:4}}>{it.emoji}</div>
            <div style={{
              fontSize:22, fontWeight:900,
              color: stats ? it.color : "rgba(26,26,24,0.20)",
              letterSpacing:"-0.04em", lineHeight:1,
            }}>
              {it.value}
            </div>
            <div style={{
              fontSize:10, color:T.inkFaint,
              whiteSpace:"pre-line", lineHeight:1.3, marginTop:4,
            }}>
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
