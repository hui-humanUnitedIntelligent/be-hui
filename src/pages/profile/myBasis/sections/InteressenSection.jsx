import React, { useState } from "react";
import { T, ALL_INTERESTS } from "../tokens.js";
import { a } from "../utils.js";
import { SectionRow, Sheet, InterestPill } from "../components/primitives.jsx";
export function InteressenSection({ interests, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(interests);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  const displayTags = current.length
    ? ALL_INTERESTS.filter(t=>current.includes(t.label))
    : ALL_INTERESTS.slice(0,6);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Interessen & Werte" onEdit={()=>setShowEdit(true)}/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {displayTags.map((t,i)=>(
          <div key={i} className="mbp-in" style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13.5, fontWeight:600, color:T.ink,
            boxShadow:T.card }}>
            <span style={{fontSize:15}}>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Interessen & Werte</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Wähle, was dich bewegt.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {ALL_INTERESTS.map((t,i)=>(
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={()=>toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}
