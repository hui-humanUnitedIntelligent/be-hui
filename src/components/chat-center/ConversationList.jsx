// chat-center/ConversationList.jsx v2
// Screenshot-exact: Sektionen — Aktive Gespräche, Buchungen, Verbindungen, Impact-Card

import React, { useState } from "react";
import ConversationCard from "./ConversationCard.jsx";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, coral:HUI.COLOR.coral, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.50)" };

const MOCK_ACTIVE = [
  { id:1, name:"Leon Brandt",  last_message:"Ich freue mich auf unser Treffen!", last_at:new Date(Date.now()-240000).toISOString(), unread:2, online:true  },
  { id:2, name:"Mia Kern",     last_message:"Die neuen Workshop-Termine sind online ✨", last_at:new Date(Date.now()-3000000).toISOString(), unread:1, online:true  },
  { id:3, name:"Jonas Weber",  last_message:"Danke dir! Das Bild ist wunderschön.", last_at:new Date(Date.now()-7200000).toISOString(), unread:0, online:true  },
  { id:4, name:"Hanna Vogt",   last_message:"Bis morgen im Studio! 🤸", last_at:new Date(Date.now()-86400000).toISOString(), unread:0, online:false },
];

const MOCK_BOOKINGS = [
  { id:5, name:"Tim Schmid",  last_message:"Hi! Ich hätte eine Frage zum Workshop.", last_at:new Date(Date.now()-1800000).toISOString(), unread:0, pending:true, online:false },
  { id:6, name:"Anna Keller", last_message:"Wann ist der nächste Termin?", last_at:new Date(Date.now()-86400000).toISOString(), unread:0, pending:true, online:false },
];

const MOCK_CONNECTIONS = [
  { id:7, name:"Klara M.",  avatar_url:null },
  { id:8, name:"Paul L.",   avatar_url:null },
  { id:9, name:"Sophie B.", avatar_url:null },
];

const SECTION_LABELS = [
  { key:"alle",       label:"Alle"               },
  { key:"buchungen",  label:"Buchungen"           },
  { key:"kreativ",    label:"Kreative Gespr\u00e4che" },
  { key:"community",  label:"Community"           },
];

/* ── Section Header ── */
function SectionHead({ title, onMore }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"18px 0 10px",
    }}>
      <span style={{ fontSize:15, fontWeight:800, color:C.ink }}>{title}</span>
      {onMore && (
        <button onClick={onMore} style={{
          border:"none", background:"none", color:C.teal,
          fontSize:12, fontWeight:600, cursor:"pointer", padding:0,
          display:"flex", alignItems:"center", gap:3,
        }}>Alle <span style={{fontSize:11}}>›</span></button>
      )}
    </div>
  );
}

/* ── Neue Verbindungen Bubbles ── */
function ConnectionBubbles({ people }) {
  return (
    <div className="hui-scroll" style={{
      display:"flex", gap:14, overflowX:"auto",
      padding:"4px 0 18px", WebkitOverflowScrolling:"touch",
    }}>
      {console.log('[HUI MAP DEBUG] ConversationList.people', people) || null}
          {(people||[]).filter(p=>p&&(p.id||p.user_id)).map(p => (
        <div key={p.id} style={{ display:"flex", flexDirection:"column",
          alignItems:"center", gap:6, flexShrink:0 }}>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            background: p.avatar_url
              ? `url(${p.avatar_url}) center/cover no-repeat`
              : `linear-gradient(135deg,${C.teal}70,${C.coral}50)`,
            border:"2px solid rgba(255,255,255,0.9)",
            boxShadow:"0 3px 10px rgba(0,0,0,0.09)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, color:"white", fontWeight:700,
          }}>{!p.avatar_url && p.name[0]}</div>
          <span style={{ fontSize:11.5, color:C.ink, fontWeight:500,
            whiteSpace:"nowrap" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Impact Card (Screenshot: Gemeinsam Wirkung schaffen) ── */
function ImpactCard() {
  return (
    <div style={{
      borderRadius:20, overflow:"hidden",
      background:"rgba(255,255,255,0.72)",
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      border:"1px solid rgba(22,215,197,0.12)",
      boxShadow:"0 4px 18px rgba(0,0,0,0.07)",
      padding:"20px 20px 20px",
      display:"flex", alignItems:"center", gap:16,
      marginBottom:24,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.ink, marginBottom:6 }}>
          Gemeinsam Wirkung schaffen
        </div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
          Jedes Gespr\u00e4ch kann der Anfang von etwas Gro\u00dfem sein.
        </div>
        <button style={{
          padding:"9px 18px", borderRadius:99,
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", color:"white", fontSize:13, fontWeight:700,
          cursor:"pointer",
          boxShadow:`0 4px 12px rgba(22,215,197,0.30)`,
          WebkitTapHighlightColor:"transparent",
        }}>Impact Projekte entdecken</button>
      </div>
      <div style={{ fontSize:48, flexShrink:0 }}>🌱</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ConversationList({ chats, loading, onOpen, onDiscover }) {
  const [activeFilter, setActiveFilter] = useState("alle");

  // Nur echte Daten — kein Mock-Fallback
  const activeConvs  = (chats || []).filter(c => c?.id && c.chat_type !== "booking");
  const bookingConvs = (chats || []).filter(c => c?.id && c.chat_type === "booking");

  return (
    <div style={{ padding:"0 16px" }}>
      {/* Category Filter Pills */}
      <div className="hui-scroll" style={{
        display:"flex", gap:8, overflowX:"auto",
        padding:"4px 0 16px", WebkitOverflowScrolling:"touch",
      }}>
        {(SECTION_LABELS||[]).filter(s=>s&&s.key).map(s => {
          const on = activeFilter === s.key;
          return (
            <button key={s.key} onClick={() => setActiveFilter(s.key)} style={{
              flexShrink:0, padding:"7px 16px", borderRadius:99,
              background: on ? `linear-gradient(135deg,${C.teal},${C.teal2})` : "rgba(255,255,255,0.75)",
              border: on ? "none" : "1.5px solid rgba(0,0,0,0.08)",
              color: on ? "white" : C.muted,
              fontSize:13, fontWeight: on ? 700 : 500,
              cursor:"pointer", boxShadow: on ? "0 3px 10px rgba(22,215,197,0.25)" : "none",
              transition:"all 0.16s ease",
              WebkitTapHighlightColor:"transparent",
            }}>{s.label}</button>
          );
        })}
      </div>

      {/* Aktive Gespräche */}
      <SectionHead title="Aktive Gespr\u00e4che"/>
      {loading ? (
        <div style={{ padding:"24px 0", textAlign:"center", color:C.muted, fontSize:13 }}>
          Laden\u2026
        </div>
      ) : chats?.length === 0 ? (
        /* Phase 23: Echter Empty State — keine Mock-Gespräche */
        <div style={{
          padding:"32px 0 16px", textAlign:"center",
          display:"flex", flexDirection:"column", alignItems:"center", gap:12,
        }}>
          <div style={{
            width:48, height:48, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal}30,${C.coral}20)`,
            border:`1.5px solid ${C.teal}40`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20,
          }}>💬</div>
          <p style={{ margin:0, fontSize:15, fontWeight:600, color:C.ink, letterSpacing:-0.2 }}>
            Dieser Raum sammelt noch Resonanz.
          </p>
          <p style={{ margin:0, fontSize:13, color:C.muted, maxWidth:220, lineHeight:1.6 }}>
            Entdecke Menschen, deren Werk dich berührt — und beginne ein Gespräch.
          </p>
          {onDiscover && (
            <button
              onClick={onDiscover}
              style={{
                marginTop:4, padding:"10px 22px", borderRadius:24,
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"none", color:"#fff", fontSize:13, fontWeight:600,
                cursor:"pointer", boxShadow:"0 4px 14px rgba(22,215,197,0.28)",
                WebkitTapHighlightColor:"transparent",
              }}
            >
              Menschen entdecken →
            </button>
          )}
        </div>
      ) : (
        (activeConvs || []).filter(c => c && c.id).map(c => (
          <ConversationCard key={c.id} conv={c} onPress={onOpen}/>
        ))
      )}

      {/* Buchungsanfragen */}
      {bookingConvs.length > 0 && (
        <>
          <SectionHead title="Buchungsanfragen" onMore={() => {}}/>
          {(bookingConvs || []).filter(c => c && c.id).map(c => (
            <ConversationCard key={c.id} conv={c} onPress={onOpen}/>
          ))}
        </>
      )}

      {/* Neueste Verbindungen — wird geladen wenn follows-Daten verfügbar */}

      {/* Impact Card */}
      <ImpactCard/>
    </div>
  );
}
