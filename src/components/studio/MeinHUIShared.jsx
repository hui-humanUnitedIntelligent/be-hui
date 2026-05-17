// src/components/studio/MeinHUIShared.jsx
// HUI — MeinHUI Shared Primitive Components — Phase 5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Pure UI-Primitives die von allen MeinHUI SubPages genutzt werden.
// Kein State. Kein Supabase. Reine Komposition.
//
// INHALTE:
//   PageShell — Standard-Layout für alle SubPages
//   Spinner   — Lade-Indikator
//   EmptyMsg  — Leerer Zustand mit Icon
//   Tabs      — Horizontale Tab-Navigation
//   Card      — Standard-Karten-Container
// ═══════════════════════════════════════════════════════════════

import React from 'react';

function PageShell({ title, onBack, children, noPad=false }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="sp-scroll" style={{
        position:"fixed", inset:0, zIndex:200,
        background:C.cream, overflowY:"auto",
        animation:"subPageIn .25s ease both",
      }}>
        {/* Header */}
        <div style={{
          background:C.card, borderBottom:`1px solid ${C.border}`,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
          display:"flex", alignItems:"center", gap:14,
          position:"sticky", top:0, zIndex:10,
        }}>
          <button className="sp-tap" onClick={onBack}
            style={{ width:36,height:36,borderRadius:10,
              background:C.cream, border:`1px solid ${C.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,color:C.ink2, flexShrink:0 }}>
            ←
          </button>
          <span style={{ fontSize:17,fontWeight:800,color:C.ink,letterSpacing:-.3 }}>
            {title}
          </span>
        </div>
        <div style={noPad ? {} : { padding:"16px 16px max(100px,env(safe-area-inset-bottom,100px))" }}>
          {children}
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return <div style={{ width:20,height:20,borderRadius:"50%",
    border:`2px solid ${C.teal}`,borderTopColor:"transparent",
    animation:"subSpin .7s linear infinite",margin:"40px auto",display:"block" }}/>;
}

function EmptyMsg({ icon, text }) {
  return (
    <div style={{ textAlign:"center",padding:"48px 24px",color:C.muted }}>
      <div style={{ fontSize:32,marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14 }}>{text}</div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex",gap:4,background:"rgba(0,0,0,0.05)",
      borderRadius:50,padding:3,marginBottom:16 }}>
      {tabs.map(t => (
        <button key={t.key} className="sp-tap"
          onClick={() => onChange(t.key)}
          style={{ flex:1,padding:"8px 4px",borderRadius:50,
            background: active===t.key ? `linear-gradient(135deg,${C.teal},${C.coral})` : "transparent",
            color: active===t.key ? "white" : C.muted,
            fontSize:13,fontWeight:700 }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:C.card,borderRadius:16,
      boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
      border:`1px solid ${C.border}`,
      marginBottom:10, ...style }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 1. BESTELLUNGEN & BUCHUNGEN
// ══════════════════════════════════════════════════════════════════════
