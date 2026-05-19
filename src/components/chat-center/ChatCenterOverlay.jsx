// components/chat-center/ChatCenterOverlay.jsx
// HUI Resonanz Center — Haupt-Overlay
// Öffnet sich via globalen Header-Chat-Button
// zIndex: 9400 (unter Profil-Overlay 9500, über allem anderen)
//
// REGEL: Kein alter ChatPage-Code. Kein Legacy-Messenger.

import React, { useState } from "react";
import ConversationList from "./ConversationList.jsx";
import ConversationRoom from "./ConversationRoom.jsx";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", coral:"#FF8A6B",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.50)", cream:"#F9F7F4",
};

const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  @keyframes cc-slideUp {
    from { opacity:0; transform:translateY(24px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
`;

/* ── Ambient Hintergrund ── */
function Atmosphere() {
  return (
    <>
      {/* Sehr subtile Teal-Aura oben links */}
      <div style={{
        position:"absolute", top:-80, left:-40,
        width:300, height:300, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(22,215,197,0.07) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>
      {/* Coral-Aura unten rechts */}
      <div style={{
        position:"absolute", bottom:-60, right:-40,
        width:240, height:240, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(255,138,107,0.05) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>
    </>
  );
}

/* ── Unread Count ── */
function UnreadPill({ count }) {
  if (!count) return null;
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      minWidth:22, height:22, borderRadius:11,
      background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
      color:"white", fontSize:11, fontWeight:800,
      padding:"0 6px", marginLeft:8,
      boxShadow:`0 2px 6px rgba(22,215,197,0.40)`,
    }}>{count > 9 ? "9+" : count}</div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ChatCenterOverlay — Haupt-Komponente
══════════════════════════════════════════════════════════════ */
export default function ChatCenterOverlay({ onClose }) {
  const [activeConv, setActiveConv] = useState(null);

  // Unread total (mock)
  const totalUnread = 6;

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     9400,
      background: C.cream,
      display:    "flex",
      flexDirection: "column",
      overflow:   "hidden",
      animation:  "cc-slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>
      <Atmosphere/>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        position:"relative", zIndex:1, flexShrink:0,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background:"rgba(249,247,244,0.92)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        borderBottom:"1px solid rgba(0,0,0,0.06)",
      }}>
        {/* Top Row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <button onClick={onClose} style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(22,215,197,0.09)",
            border:"1.5px solid rgba(22,215,197,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:C.teal, fontSize:17, fontWeight:600,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.15s",
          }}
          onTouchStart={e => e.currentTarget.style.transform="scale(0.9)"}
          onTouchEnd={e   => e.currentTarget.style.transform="scale(1)"}
          >←</button>

          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{
                fontSize:20, fontWeight:800, color:C.ink, letterSpacing:-0.4,
              }}>Resonanz</span>
              <UnreadPill count={totalUnread}/>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              Deine Verbindungen &amp; Gespr\u00e4che
            </div>
          </div>

          {/* Compose Button */}
          <button style={{
            width:38, height:38, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 12px rgba(22,215,197,0.28)`,
            WebkitTapHighlightColor:"transparent",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2"
                strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          background:"rgba(255,255,255,0.70)",
          backdropFilter:"blur(12px)",
          border:"1px solid rgba(0,0,0,0.08)",
          borderRadius:14, padding:"9px 14px",
          marginBottom:16,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Gespr\u00e4ch suchen\u2026"
            style={{
              flex:1, border:"none", background:"none", outline:"none",
              fontSize:14, color:C.ink, fontFamily:"inherit",
            }}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        position:"relative", zIndex:1,
        paddingTop:18,
      }}>
        <ConversationList onOpen={conv => setActiveConv(conv)}/>
        <div style={{ height:32 }}/>
      </div>

      {/* ── ConversationRoom (slides in) ────────────────────────── */}
      {activeConv && (
        <ConversationRoom
          conv={activeConv}
          onBack={() => setActiveConv(null)}
        />
      )}
    </div>
  );
}
