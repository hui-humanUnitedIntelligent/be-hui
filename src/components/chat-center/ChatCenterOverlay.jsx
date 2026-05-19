// components/chat-center/ChatCenterOverlay.jsx v2
// HUI Resonanz Center — Single Chat Entry Point
// Öffnet sich via globalen Header-Chat-Button (showChat State)
//
// zIndex: 9400 — über allem außer Profile (9500) und Debug (99999)
// REGEL: Einziges aktives Chat-System. ChatPage.jsx ist deaktiviert.

import React, { useState } from "react";
import { useChatList, formatChatTime } from "../../lib/chatContext.js";
import ConversationCard from "./ConversationCard.jsx";
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
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
`;

const CATEGORIES = [
  { key:"alle",       label:"Alle"       },
  { key:"booking",    label:"Buchungen"  },
  { key:"direct",     label:"Direkt"     },
  { key:"community",  label:"Community"  },
];

/* ── Ambient Atmosphere ── */
function Atmosphere() {
  return (
    <>
      <div style={{
        position:"absolute", top:-80, left:-40, width:280, height:280,
        borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(22,215,197,0.06) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>
      <div style={{
        position:"absolute", bottom:-60, right:-40, width:220, height:220,
        borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(255,138,107,0.04) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>
    </>
  );
}

/* ── Unread Badge ── */
function UnreadPill({ count }) {
  if (!count) return null;
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      minWidth:20, height:20, borderRadius:10,
      background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
      color:"white", fontSize:11, fontWeight:800, padding:"0 5px",
      marginLeft:8, boxShadow:`0 2px 6px rgba(22,215,197,0.35)`,
    }}>{count > 9 ? "9+" : count}</div>
  );
}

/* ── Conversation Card für echte Supabase-Chats ── */
function LiveConvCard({ chat, onPress }) {
  const other = chat.other_profile || {};
  const name  = other.display_name || "Unbekannt";
  const initials = name[0]?.toUpperCase() || "?";
  const avatarBg = other.avatar_url
    ? `url(${other.avatar_url}) center/cover no-repeat`
    : `linear-gradient(135deg,${C.teal}80,${C.coral}60)`;

  return (
    <button
      onClick={() => onPress?.(chat)}
      style={{
        width:"100%", textAlign:"left",
        padding:"14px 16px",
        background:"rgba(255,255,255,0.72)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        border:"1px solid rgba(255,255,255,0.55)",
        borderRadius:18,
        boxShadow:"0 2px 12px rgba(0,0,0,0.055)",
        display:"flex", alignItems:"center", gap:13,
        cursor:"pointer", marginBottom:10,
        transition:"transform 0.15s",
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
      onTouchStart={e => e.currentTarget.style.transform="scale(0.98)"}
      onTouchEnd={e   => e.currentTarget.style.transform="scale(1)"}
    >
      {/* Avatar */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{
          width:52, height:52, borderRadius:"50%", background:avatarBg,
          border:"2px solid rgba(255,255,255,0.9)",
          boxShadow:"0 2px 8px rgba(0,0,0,0.10)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, color:"white", fontWeight:700,
        }}>{!other.avatar_url && initials}</div>
        {chat.unread > 0 && (
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:12, height:12, borderRadius:"50%",
            background:C.teal, border:"2px solid rgba(249,247,244,0.96)",
            boxShadow:`0 0 6px ${C.teal}80`,
          }}/>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          display:"flex", justifyContent:"space-between",
          alignItems:"baseline", marginBottom:3,
        }}>
          <span style={{
            fontSize:15, fontWeight: chat.unread ? 800 : 600,
            color:C.ink, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:160,
          }}>{name}</span>
          <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:6 }}>
            {formatChatTime(chat.last_message_at)}
          </span>
        </div>
        <div style={{ fontSize:11.5, color:C.teal, fontWeight:500, marginBottom:2 }}>
          {other.availability === "busy" ? "Gerade kreativ" : "Im Atelier"}
        </div>
        <div style={{
          fontSize:13,
          color: chat.unread ? C.ink : C.muted,
          fontWeight: chat.unread ? 600 : 400,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{chat.last_message || "Neue Verbindung"}</div>
      </div>

      {chat.unread > 0 && (
        <div style={{
          flexShrink:0, minWidth:20, height:20, borderRadius:10,
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10.5, fontWeight:800, color:"white", padding:"0 5px",
          boxShadow:`0 2px 6px ${C.teal}55`,
        }}>{chat.unread > 9 ? "9+" : chat.unread}</div>
      )}
    </button>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div style={{
      textAlign:"center", padding:"64px 24px",
      color:"rgba(80,80,80,0.30)",
    }}>
      <div style={{ fontSize:38, marginBottom:12 }}>✦</div>
      <div style={{ fontSize:15, fontWeight:600, marginBottom:6, color:"rgba(80,80,80,0.45)" }}>
        Noch keine Gespr\u00e4che
      </div>
      <div style={{ fontSize:13, lineHeight:1.6 }}>
        Verbinde dich mit Kreativen —<br/>
        deine Resonanz-R\u00e4ume erscheinen hier.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HAUPT-OVERLAY
══════════════════════════════════════════════════════════════ */
export default function ChatCenterOverlay({ onClose }) {
  const [activeConv,     setActiveConv]     = useState(null);
  const [activeCategory, setActiveCategory] = useState("alle");
  const [searchVal,      setSearchVal]      = useState("");

  // Echte Supabase-Daten via chatContext
  const { chats, loading, unreadTotal } = useChatList();

  // Filter: Kategorie + Suche
  const filtered = chats.filter(c => {
    const matchCat = activeCategory === "alle" || c.chat_type === activeCategory;
    const searchLow = searchVal.toLowerCase();
    const matchSearch = !searchVal
      || (c.other_profile?.display_name || "").toLowerCase().includes(searchLow)
      || (c.last_message || "").toLowerCase().includes(searchLow);
    return matchCat && matchSearch;
  });

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     9400,
      background: C.cream,
      display:    "flex",
      flexDirection: "column",
      overflow:   "hidden",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:  "cc-slideUp 0.24s ease both",
    }}>
      <style>{CSS}</style>
      <Atmosphere/>

      {/* ── Header ── */}
      <div style={{
        position:"relative", zIndex:1, flexShrink:0,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
        background:"rgba(249,247,244,0.94)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        borderBottom:"1px solid rgba(0,0,0,0.06)",
      }}>
        {/* Top Row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={onClose} style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(22,215,197,0.09)",
            border:"1.5px solid rgba(22,215,197,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:C.teal, fontSize:18,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
            transition:"transform 0.14s",
          }}
          onTouchStart={e => e.currentTarget.style.transform="scale(0.90)"}
          onTouchEnd={e   => e.currentTarget.style.transform="scale(1)"}
          >←</button>

          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{ fontSize:20, fontWeight:800, color:C.ink, letterSpacing:-0.4 }}>
                Resonanz
              </span>
              <UnreadPill count={unreadTotal}/>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              Deine Verbindungen &amp; Gespr\u00e4che
            </div>
          </div>

          {/* Compose */}
          <button style={{
            width:38, height:38, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 12px rgba(22,215,197,0.28)`,
            WebkitTapHighlightColor:"transparent",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          background:"rgba(255,255,255,0.70)",
          border:"1px solid rgba(0,0,0,0.08)",
          borderRadius:14, padding:"9px 14px", marginBottom:14,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Gespr\u00e4ch suchen\u2026"
            style={{
              flex:1, border:"none", background:"none", outline:"none",
              fontSize:14, color:C.ink, fontFamily:"inherit",
            }}
          />
          {searchVal && (
            <button onClick={() => setSearchVal("")} style={{
              border:"none", background:"none", cursor:"pointer",
              color:C.muted, fontSize:16, padding:0, lineHeight:1,
            }}>×</button>
          )}
        </div>

        {/* Category Pills */}
        <div className="hui-scroll" style={{
          display:"flex", gap:8, overflowX:"auto",
          paddingBottom:14, WebkitOverflowScrolling:"touch",
        }}>
          {CATEGORIES.map(cat => {
            const on = activeCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                flexShrink:0, padding:"7px 15px", borderRadius:99,
                background: on ? `linear-gradient(135deg,${C.teal},${C.teal2})` : "rgba(255,255,255,0.7)",
                border: on ? "none" : "1px solid rgba(0,0,0,0.09)",
                boxShadow: on ? "0 3px 10px rgba(22,215,197,0.25)" : "none",
                color: on ? "white" : C.muted,
                fontSize:12.5, fontWeight: on ? 700 : 500, cursor:"pointer",
                WebkitTapHighlightColor:"transparent",
                transition:"all 0.16s ease",
              }}>{cat.label}</button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        position:"relative", zIndex:1, padding:"18px 16px 32px",
      }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px", color:C.muted, fontSize:13 }}>
            Laden\u2026
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState/>
        ) : (
          filtered.map(chat => (
            <LiveConvCard key={chat.id} chat={chat} onPress={setActiveConv}/>
          ))
        )}
      </div>

      {/* ── ConversationRoom ── */}
      {activeConv && (
        <ConversationRoom
          conv={{
            id:           activeConv.id,
            name:         activeConv.other_profile?.display_name || "Gespräch",
            avatar_url:   activeConv.other_profile?.avatar_url || null,
            last_message: activeConv.last_message,
          }}
          onBack={() => setActiveConv(null)}
        />
      )}
    </div>
  );
}
