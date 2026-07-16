import React from "react";
import { T } from "../tokens.js";

// ── Atoms ────────────────────────────────────────────────────────
export function Gap({ h=16 }) { return <div style={{height:h}}/>; }
export function Divider() { return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>; }

export function SectionRow({ title, sub, onEdit }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`0 ${T.px}px 10px` }}>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>{sub}</div>}
      </div>
      {onEdit && (
        <button className="mbp-press-light" onClick={onEdit} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Bearbeiten ›</button>
      )}
    </div>
  );
}

export function Sheet({ onClose, children, zIndex=9800 }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex,
      background:"rgba(26,26,24,0.4)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="mbp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"80vh", overflowY:"auto",
      }}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HEADER — "Mein Profil 🌿" + cinematic cover + floating avatar
// ══════════════════════════════════════════════════════════════
// ── Upload Helper ────────────────────────────────────────────────
// uploadProfileImage(), FB_COVER, FB_AVATAR, handleAvatarUpload, handleCoverUpload aus ../lib/profileMedia.js


// ══════════════════════════════════════════════════════════════
// ÜBER DICH — Inline text editor with char counter
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// INTERESSEN & WERTE — Tappable pills + edit sheet
// ══════════════════════════════════════════════════════════════
export function InterestPill({ icon, label, active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"9px 16px", borderRadius:T.r99,
      background: active ? T.tealSoft : T.bgCard,
      border:`1px solid ${active ? T.tealMid : T.border}`,
      fontSize:13.5, fontWeight:600,
      color: active ? T.teal : T.ink,
      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
      transition:"all .18s cubic-bezier(.22,1,.36,1)",
      boxShadow: active ? T.glowTeal : T.card,
    }}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );
}
