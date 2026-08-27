// src/components/profile/my-basis/ProfileSections.jsx
// InteressenSection, MomentThumb, OffenFuerSection — extracted from MyBasisProfile.
// No logic changes. Note: these are currently NOT rendered in the active layout
// (commented out in MyBasisProfile), but kept for potential reactivation.
import React, { useState } from "react";
import { T, a, ALL_INTERESTS, OPEN_FOR_ALL } from "./constants.js";
import { SectionRow, Sheet, InterestPill } from "./atoms.jsx";
import { HUILogo } from "../../brand/HUILogo.jsx";
import { useTranslation } from "../../../hooks/useTranslation.js";

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
          <div style={{ fontSize:16, fontWeight: 600, color:T.ink, marginBottom:4 }}>Interessen & Werte</div>
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
            color:"white", fontSize:15, fontWeight: 600,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MOMENTE — Editable cinematic thumbnails
// ══════════════════════════════════════════════════════════════

export function MomentThumb({ m, onRemove }) {
  const { t } = useTranslation();
  const [loaded,  setLoaded]  = useState(false);
  const [broken,  setBroken]  = useState(false);
  return (
    <div style={{ position:"relative", width:116, height:116, borderRadius:T.r12,
      overflow:"hidden", background:"rgba(26,26,24,0.07)", flexShrink:0 }}>
      {!loaded && !broken && <div className="mbp-skeleton" style={{position:"absolute",inset:0}}/>}
      {broken ? (
        /* Broken-State: graue Box, isoliert — andere Momente unberührt */
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(26,26,24,0.06)", gap:4 }}>
          <HUILogo size={32} style={{opacity:0.55}} />
          <span style={{fontSize:9, color:"rgba(26,26,24,0.35)", textAlign:"center",
            padding:"0 6px", lineHeight:1.4}}>{t("ps.imageUnavailable")}</span>
        </div>
      ) : (
        <img loading="lazy" decoding="async" src={m.img} alt="" onLoad={()=>setLoaded(true)} onError={()=>{ setLoaded(true); setBroken(true); }}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
            opacity:loaded?1:0, transition:"opacity .5s ease" }}/>
      )}
      {/* × remove */}
      <button className="mbp-press" onClick={onRemove} style={{
        position:"absolute", top:5, right:5,
        width:20, height:20, borderRadius:"50%",
        background:"rgba(26,26,24,0.65)", backdropFilter:"blur(6px)",
        border:"none", color:"white", fontSize:11,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", touchAction:"manipulation", lineHeight:1,
      }}>×</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OFFEN FÜR BEGEGNUNGEN — Editable open-for capsules
// ══════════════════════════════════════════════════════════════
export function OffenFuerSection({ openFor, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(openFor);
  const display = current.length ? OPEN_FOR_ALL.filter(t=>current.includes(t.label)) : OPEN_FOR_ALL.slice(0,4);

  const toggle = (label) => {
    const { t } = useTranslation();
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title={t("ps.openForEncounters")} sub={t("ps.openForWhat")}/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {display.map((t,i)=>(
          <div key={i} style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13, fontWeight:600, color:T.ink,
            boxShadow:T.card,
          }}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
          </div>
        ))}
        <button className="mbp-press-light" onClick={()=>setShowEdit(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"9px 16px", borderRadius:T.r99,
          background:"transparent", border:`1px dashed ${T.borderMid}`,
          fontSize:13, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        }}>
          <span style={{fontSize:14}}>+</span> {t("common.addMore")}
        </button>
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight: 600, color:T.ink, marginBottom:4 }}>{t("ps.openForEncounters")}</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Was interessiert dich gerade?</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {OPEN_FOR_ALL.map((t,i)=>(
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={()=>toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight: 600,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SICHTBARKEIT — 3-option toggle
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// BIO EDIT MODAL — "Über mich" bearbeiten
// ══════════════════════════════════════════════════════════════
const MAX_BIO = 500;

