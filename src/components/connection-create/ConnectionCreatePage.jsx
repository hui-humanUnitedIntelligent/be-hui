// connection-create/ConnectionCreatePage.jsx
// HUI "Neue Verbindung erstellen" — Screenshot-exact 3-Spalten Layout
// Links: Typ-Auswahl | Mitte: Formular | Rechts: Live-Preview
//
// zIndex: 9450 — über HuiPlusSheet (9000) unter Profil (9500)

import React, { useState, useCallback } from "react";
import ConnectionTypeSidebar from "./ConnectionTypeSidebar.jsx";
import ConnectionForm        from "./ConnectionForm.jsx";
import ConnectionPreviewCard from "./ConnectionPreviewCard.jsx";
import { useAuth }           from "../../lib/AuthContext.jsx";

const C = {
  violet:"#8B5CF6", violet2:"#7C3AED",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.50)",
  cream:"#F2F1EF",
};

const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  html { scroll-behavior:smooth; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  @keyframes cc-page-in {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes atm-drift {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(12px,-8px) scale(1.04);}
  }
`;

/* ── Cinematic Atmosphere ── */
function Atmosphere() {
  return (
    <>
      <div style={{
        position:"fixed", top:"-20%", right:"-10%",
        width:"50vw", height:"50vw", borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(139,92,246,0.07) 0%,transparent 68%)",
        filter:"blur(40px)", pointerEvents:"none", zIndex:0,
        animation:"atm-drift 18s ease-in-out infinite",
      }}/>
      <div style={{
        position:"fixed", bottom:"-15%", left:"-8%",
        width:"40vw", height:"40vw", borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(22,215,197,0.06) 0%,transparent 68%)",
        filter:"blur(35px)", pointerEvents:"none", zIndex:0,
        animation:"atm-drift 22s ease-in-out infinite reverse",
      }}/>
    </>
  );
}

/* ── Glass Card Wrapper ── */
function GlassPanel({ children, style }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.82)",
      backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
      border:"1px solid rgba(255,255,255,0.72)",
      borderRadius:24,
      boxShadow:"0 6px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HAUPT-KOMPONENTE
══════════════════════════════════════════════════════════════════ */
export default function ConnectionCreatePage({ onClose, onPublish }) {
  const { user } = useAuth();

  const [activeType, setActiveType] = useState("treffen");
  const [formData,   setFormData]   = useState({
    title:"",
    description:"",
    date:"",
    time:"20:00",
    location:"",
    participants: 30,
    cost:"free",
    costAmount:"",
    mood:"gesellig",
    visibility:"public",
    openness:"open",
    extras:"",
  });

  const handlePublish = useCallback(async () => {
    if (!formData.title.trim()) return;
    try {
      onPublish?.({ ...formData, type: activeType, creator_id: user?.id });
      onClose?.();
    } catch(e) {
      console.error("[ConnectionCreate] publish error:", e);
    }
  }, [formData, activeType, user?.id, onPublish, onClose]);

  const previewData = { ...formData, type: activeType };
  const canPublish  = formData.title.trim().length > 2;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9450,
      background:C.cream,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:"cc-page-in 0.24s ease both",
    }}>
      <style>{CSS}</style>
      <Atmosphere/>

      {/* ── Sticky Top Bar ── */}
      <div style={{
        position:"relative", zIndex:10, flexShrink:0,
        padding:"max(48px,env(safe-area-inset-top,48px)) 20px 14px",
        background:"rgba(242,241,239,0.90)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(139,92,246,0.08)",
        display:"flex", alignItems:"center", gap:12,
      }}>
        {/* × Schließen */}
        <button onClick={onClose} style={{
          width:36, height:36, borderRadius:"50%",
          background:"rgba(0,0,0,0.06)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:17, color:C.muted, flexShrink:0,
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}>×</button>

        {/* Title Center */}
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{
            fontSize:18, fontWeight:800, color:C.ink, letterSpacing:-0.4,
          }}>Neue Verbindung erstellen</div>
          <div style={{ fontSize:12.5, color:C.muted, marginTop:1 }}>
            Teile, was du vorhast und lade andere ein.
          </div>
        </div>

        {/* Posten Button */}
        <button
          onClick={handlePublish}
          disabled={!canPublish}
          style={{
            padding:"9px 18px", borderRadius:99,
            background: canPublish
              ? `linear-gradient(135deg,${C.violet},${C.violet2})`
              : "rgba(0,0,0,0.08)",
            border:"none",
            color: canPublish ? "white" : C.muted,
            fontSize:13.5, fontWeight:700, cursor: canPublish ? "pointer" : "default",
            display:"flex", alignItems:"center", gap:6,
            boxShadow: canPublish ? "0 4px 14px rgba(139,92,246,0.32)" : "none",
            transition:"all 0.18s", flexShrink:0,
            WebkitTapHighlightColor:"transparent",
          }}
        >
          Verbindung posten
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── 3-Spalten Body ── */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        position:"relative", zIndex:1,
        padding:"20px 16px max(24px,env(safe-area-inset-bottom,24px))",
      }}>
        <div style={{
          display:"grid",
          gridTemplateColumns:"minmax(200px,260px) 1fr minmax(240px,320px)",
          gap:16, alignItems:"start",
          maxWidth:1100, margin:"0 auto",
          // Mobile: single column
        }}>

          {/* ── LINKS: Typ-Sidebar ── */}
          <GlassPanel style={{ padding:"20px 16px", gridColumn:"1" }}>
            <ConnectionTypeSidebar
              active={activeType}
              onChange={setActiveType}
            />
          </GlassPanel>

          {/* ── MITTE: Formular ── */}
          <GlassPanel style={{ padding:"22px 20px", gridColumn:"2" }}>
            <ConnectionForm
              data={formData}
              onChange={setFormData}
            />
          </GlassPanel>

          {/* ── RECHTS: Live Preview ── */}
          <div style={{ gridColumn:"3" }}>
            <div style={{
              fontSize:12, fontWeight:700, color:C.muted,
              marginBottom:10, letterSpacing:0.1,
            }}>Vorschau</div>
            <ConnectionPreviewCard data={previewData}/>
          </div>

        </div>

        {/* Mobile responsive: bei kleinen Screens stack */}
        <style>{`
          @media (max-width: 900px) {
            .cc-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 600px) {
            .cc-grid > div { grid-column: 1 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
