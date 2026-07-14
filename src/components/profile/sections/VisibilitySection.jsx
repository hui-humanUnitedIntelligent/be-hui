// src/components/profile/sections/VisibilitySection.jsx
// ══════════════════════════════════════════════════════════════════════
// VISIBILITY SECTION — Sichtbarkeit
// Owner: Optionen auswählbar (public / connections / private)
// Visitor: Info-Text + "Mehr erfahren" Sheet
// ══════════════════════════════════════════════════════════════════════
import {
  HUIGemeinschaftIcon, HUISicherheitIcon, HUIGlobeIcon,
  HUIPrivatIcon,
} from '../../../design/icons/HuiSystemIcons.jsx';
import React, { useState } from "react";
import { createPortal } from "react-dom";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", bgSheet:"#FDFCFB",
  ink:"#1A1A18", inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", tealSoft:"rgba(14,196,184,0.08)",
  border:"rgba(26,26,24,0.08)", borderMid:"rgba(26,26,24,0.14)",
  r16:16, r20:20, r24:24, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
  sheet:"0 -4px 40px rgba(0,0,0,0.12)",
};

const OPTIONS = [
  { key:"public",      icon:"🌍", label:"Öffentlich",   sub:"Für alle sichtbar" },
  { key:"connections", icon:<HUIGemeinschaftIcon size={16}/>, label:"Verbindungen", sub:"Nur für deine Verbindungen" },
  { key:"private",     icon:<HUIPrivatIcon size={16}/>, label:"Privat",       sub:"Nur für dich" },
];

export function VisibilitySection({
  profile    = null,
  isOwner    = false,
  loading    = false,
  onSave     = null,   // (visibility: string) => void
}) {
  const [showSheet, setShowSheet] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const current = profile?.visibility || profile?.focus_type || "connections";

  const handleSelect = async (key) => {
    setSaving(true);
    await onSave?.(key);
    setSaving(false);
    setShowSheet(false);
  };

  if (loading) return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ height:56, borderRadius:T.r16, border:`1px solid ${T.border}`,
        background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
        backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  const currentOpt = OPTIONS.find(o => o.key === current) || OPTIONS[1];

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.vs-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.vs-press:active{opacity:.65}`}</style>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, padding:"14px 16px", boxShadow:T.card }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{currentOpt.icon}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{currentOpt.label}</div>
            <div style={{ fontSize:11, color:T.inkFaint }}>{currentOpt.sub}</div>
          </div>
        </div>
        <button className="vs-press" onClick={() => setShowSheet(true)} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"8px 12px", borderRadius:T.r99, border:`1px solid ${T.border}`,
          background:T.bg, fontSize:12, fontWeight:600, color:T.ink,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          flexShrink:0, boxShadow:T.card,
        }}>
          <HUIGemeinschaftIcon size={12} style={{flexShrink:0}} />
          {isOwner ? "Ändern" : "Mehr erfahren"}
        </button>
      </div>

      {showSheet && createPortal(
        <div onClick={() => setShowSheet(false)} style={{
          position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
          background:"rgba(26,26,24,0.4)", display:"flex", alignItems:"flex-end",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", background:T.bgSheet,
            borderRadius:`${T.r24}px ${T.r24}px 0 0`,
            padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
            boxShadow:T.sheet,
          }}>
            <div style={{ width:36, height:4, borderRadius:99,
              background:"rgba(26,26,24,0.12)", margin:"0 auto 20px" }}/>
            <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:6 }}>
              
            </div>
            {isOwner ? (
              <>
                <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>
                  Wer kann dein Profil sehen?
                </div>
                {OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => handleSelect(opt.key)} disabled={saving}
                    style={{ display:"flex", alignItems:"center", gap:14, width:"100%",
                      padding:"14px 16px", marginBottom:8, borderRadius:T.r16,
                      background: current === opt.key ? T.tealSoft : T.bgCard,
                      border:`1.5px solid ${current === opt.key ? T.tealMid : T.border}`,
                      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                      textAlign:"left",
                    }}>
                    <span style={{ fontSize:20 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>{opt.label}</div>
                      <div style={{ fontSize:12, color:T.inkFaint }}>{opt.sub}</div>
                    </div>
                    {current === opt.key && (
                      <span style={{ marginLeft:"auto", fontSize:14, color:T.teal }}>✓</span>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <p style={{ fontSize:14, lineHeight:1.68, color:T.inkSoft, margin:"0 0 16px", fontStyle:"italic" }}>
                Dieses Profil ist für {currentOpt.label.toLowerCase()} sichtbar.
                Du kannst die Sichtbarkeit in deinen Einstellungen anpassen.
              </p>
            )}
            <button onClick={() => setShowSheet(false)} style={{
              width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
              background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
              color:"white", fontSize:15, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              boxShadow:"0 4px 18px rgba(14,196,184,0.26)", marginTop:8,
            }}>
              {isOwner ? "Fertig" : "Verstanden"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default VisibilitySection;
