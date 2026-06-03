// ChatPage.jsx — HUI Chat Premium v3
// Screenshot-exact: Sidebar + Split-View + Premium Bubbles + Rich Features
// Props: ChatPage({ onClose }) — rückwärtskompatibel
// REGEL: Alle Hooks top-level. Kein Supabase direkt in UI-Komponenten.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth }    from "../lib/AuthContext";
import { AMBIENT_CSS, getSoftStatus } from "../lib/journeyContext";
import { HUI } from "../design/hui.design.js";
import {
  useDraftPersist, useScrollMemory,
  usePresence, getPresenceLabel,
} from "../lib/sessionHooks";
import { findOrCreateChat } from "../lib/chatContext";
import {
  useChatList, useChatThread, useChatContext,
  CHAT_TYPES, MSG_TYPES, formatChatTime, formatMsgDate,
} from "../lib/chatContext";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const C = {
  teal:      HUI.COLOR.teal,
  teal2:     HUI.COLOR.tealDeep,
  tealPale:  HUI.COLOR.tealPale,
  tealGlow:  "rgba(32,211,194,0.22)",
  coral:     HUI.COLOR.coral,
  coralGlow: "rgba(255,138,122,0.18)",
  gold:      HUI.COLOR.goldLight,
  green:     "#4CAF85",
  greenDot:  "#22C55E",
  cream:     HUI.COLOR.cream,
  warm:      HUI.COLOR.creamSoft,
  card:      "rgba(255,255,255,0.96)",
  ink:       "#1E1E1E",
  ink2:      HUI.COLOR.ink2,
  muted:     "#8A8A8A",
  muted2:    "#C5C5C5",
  border:    "rgba(0,0,0,0.07)",
  borderL:   "rgba(0,0,0,0.04)",
};

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
  ${AMBIENT_CSS || ""}
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes msgIn    { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes slideR   { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes waveBar  { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes shimmer  {
    0%   { background-position:200% center; }
    100% { background-position:-200% center; }
  }
  .cp-scroll::-webkit-scrollbar { display:none; }
  .cp-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .cp-tap {
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.15s ease, opacity 0.15s ease;
  }
  .cp-tap:active { transform:scale(0.965) translateY(1px); opacity:0.8; }
  .cp-card-hover {
    transition:background 0.18s ease, box-shadow 0.18s ease;
  }
  .cp-card-hover:active { background:rgba(32,211,194,0.06) !important; }
  .cp-skel {
    background: linear-gradient(90deg, #f0ede8 0%, #e8e4df 50%, #f0ede8 100%);
    background-size:200% 100%;
    animation:shimmer 1.6s infinite;
    border-radius:10px;
  }
  .cp-input-send:active { transform:scale(0.930) translateY(0.5px); }
`;

/* ══════════════════════════════════════════════════════════════
   MOCK DATA (Fallback wenn DB leer)
══════════════════════════════════════════════════════════════ */
const CREATIVE_PRESENCE = [
  "Gerade kreativ im Studio",
  "Im Atelier",
  "Arbeitet an neuen Werken",
  "Nimmt sich Zeit",
  "In der Werkstatt",
  "Auf Reisen",
];

// MOCK_CHATS entfernt — kein Fallback auf Fake-Daten.
// Während chatsLoading: Skeleton-UI. Danach: nur echte DB-Daten.
const MOCK_CHATS = [];
const MOCK_BOOKING_CHATS = [];

const MOCK_CONNECTIONS = [
  { id:"x1", name:"Klara M.", img:"https://i.pravatar.cc/56?img=21" },
  { id:"x2", name:"Paul L.",  img:"https://i.pravatar.cc/56?img=36" },
  { id:"x3", name:"Sophie B.",img:"https://i.pravatar.cc/56?img=5"  },
  { id:"x4", name:"Marc T.",  img:"https://i.pravatar.cc/56?img=44" },
];

const MOCK_MESSAGES = [
  { id:"m1", sender:"other", type:"text",
    text:"Hey! Schon von dir zu horen 😊\nDanke fur dein Interesse an meinem Workshop.",
    created_at: new Date(Date.now()-55*60000).toISOString() },
  { id:"m2", sender:"me", type:"text",
    text:"Hallo Leon! Ich freue mich schon sehr darauf. Kannst du mir noch sagen, was ich mitbringen sollte?",
    created_at: new Date(Date.now()-50*60000).toISOString() },
  { id:"m3", sender:"other", type:"text",
    text:"Gerne! Alles, was dich inspiriert - und wenn du ein Instrument hast, bring es mit. Ansonsten ist alles da im Atelier.",
    created_at: new Date(Date.now()-46*60000).toISOString(), reaction:"❤️", reactionCount:1 },
  { id:"m4", sender:"me", type:"text",
    text:"Perfekt, danke dir! 🎶 😊",
    created_at: new Date(Date.now()-40*60000).toISOString() },
  { id:"m5", sender:"other", type:"voice",
    duration:"0:28",
    created_at: new Date(Date.now()-36*60000).toISOString() },
  { id:"m6", sender:"other", type:"image",
    imgUrl:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
    caption:"Dein Studio sieht so inspirierend aus! ✨",
    created_at: new Date(Date.now()-30*60000).toISOString(), reaction:"❤️", reactionCount:1 },
  { id:"m7", sender:"other", type:"text",
    text:"Ich freue mich auf unser Treffen! 🌿 🎶",
    created_at: new Date(Date.now()-5*60000).toISOString() },
  { id:"m8", sender:"other", type:"typing",
    created_at: new Date().toISOString() },
];


/* ══════════════════════════════════════════════════════════════
   HELPER
══════════════════════════════════════════════════════════════ */
function timeFmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMin = (now - d) / 60000;
  if (diffMin < 60) {
    const h = d.getHours().toString().padStart(2,"0");
    const m = d.getMinutes().toString().padStart(2,"0");
    return `${h}:${m}`;
  }
  if (diffMin < 60*24) {
    const h = d.getHours().toString().padStart(2,"0");
    const m = d.getMinutes().toString().padStart(2,"0");
    return `${h}:${m}`;
  }
  return "Gestern";
}

/* ══════════════════════════════════════════════════════════════
   PRESENCE BADGE
══════════════════════════════════════════════════════════════ */
function PresenceBadge({ status, label, size = "sm" }) {
  const color = status === "online" ? C.greenDot : C.muted2;
  if (size === "dot") return (
    <div style={{
      width:10, height:10, borderRadius:"50%",
      background: color,
      border:"1.5px solid #fff",
      boxShadow: status === "online" ? `0 0 0 2px rgba(34,197,94,0.25)` : "none",
      flexShrink:0,
    }}/>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <div style={{
        width:7, height:7, borderRadius:"50%", flexShrink:0,
        background: color,
        animation: status === "online" ? "pulse 3.2s ease-in-out infinite" : "none",
      }}/>
      <span style={{ fontSize:11.5, color:C.teal, fontWeight:600, letterSpacing:0.1 }}>
        {label || (status === "online" ? "Aktiv" : "Offline")}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHAT CONVERSATION CARD
══════════════════════════════════════════════════════════════ */
function ChatConversationCard({ chat, active, onOpen }) {
  const isOnline = chat.presence === "online";
  return (
    <div
      className="cp-card-hover cp-tap"
      onClick={() => onOpen(chat)}
      style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"13px 16px",
        background: active
          ? `linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.08) 100%)`
          : "transparent",
        borderRadius: active ? 18 : 0,
        borderLeft: active ? `3px solid ${C.teal}` : "3px solid transparent",
        cursor:"pointer",
        transition:"all 0.18s ease",
      }}
    >
      {/* Avatar + Presence Dot */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <img
          src={chat.other_profile?.avatar_url || `https://i.pravatar.cc/56?img=1`}
          alt={chat.other_profile?.display_name}
          style={{
            width:52, height:52, borderRadius:"50%", objectFit:"cover",
            border: active ? `2px solid ${C.teal}` : "2px solid transparent",
            transition:"border 0.2s ease",
          }}
        />
        {isOnline && (
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:12, height:12, borderRadius:"50%",
            background:C.greenDot, border:"2px solid #fff",
          }}/>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
          <span style={{ fontSize:14, fontWeight:700, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>
            {chat.other_profile?.display_name}
          </span>
          <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:4 }}>
            {timeFmt(chat.last_message_at)}
          </span>
        </div>
        {/* Kategorie */}
        <div style={{ fontSize:11.5, color:C.teal, fontWeight:600, marginBottom:3 }}>
          {chat.categoryIcon || "✦"} {chat.category || chat.booking_title || chat.other_profile?.talent || ""}
        </div>
        {/* Letzte Nachricht + Unread */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
          <span style={{
            fontSize:12.5, color: chat.unread > 0 ? C.ink2 : C.muted,
            fontWeight: chat.unread > 0 ? 600 : 400,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
          }}>
            {chat.last_message}
          </span>
          {chat.unread > 0 && (
            <div style={{
              minWidth:20, height:20, borderRadius:10,
              background: chat.chat_type === "booking" ? C.coral : C.teal,
              color:"#fff", fontSize:11, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:"0 5px", flexShrink:0,
            }}>
              {chat.unread}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BOOKING PREVIEW CARD
══════════════════════════════════════════════════════════════ */
function BookingPreviewCard({ chat }) {
  return (
    <div style={{
      margin:"0 16px 16px",
      background:"rgba(255,255,255,0.80)",
      backdropFilter:"blur(12px)",
      borderRadius:18,
      overflow:"hidden",
      boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
      border:`1px solid ${C.borderL}`,
    }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        {/* Bild */}
        <div style={{ width:80, flexShrink:0 }}>
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=75"
            alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
          />
        </div>
        {/* Info */}
        <div style={{ flex:1, padding:"11px 13px" }}>
          <div style={{ fontSize:10, color:C.teal, fontWeight:700, marginBottom:3, letterSpacing:0.4 }}>
            NACHSTES ERLEBNIS
          </div>
          <div style={{ fontSize:13.5, fontWeight:800, color:C.ink, lineHeight:1.25, marginBottom:5 }}>
            {chat.booking_title || "Klangreise - Live im Atelier"}
          </div>
          <div style={{ fontSize:11.5, color:C.muted, marginBottom:6 }}>
            24. Mai · 18:00 · Berlin
          </div>
          <button style={{
            background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:700, color:C.teal, cursor:"pointer",
          }}>
            Details ansehen →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VOICE MESSAGE CARD
══════════════════════════════════════════════════════════════ */
function VoiceMessageCard({ msg, isOwn }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 14px",
      background: isOwn
        ? `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`
        : "rgba(255,255,255,0.92)",
      borderRadius:18,
      minWidth:180, maxWidth:240,
      boxShadow: isOwn
        ? `0 4px 16px ${C.tealGlow}`
        : "0 2px 10px rgba(0,0,0,0.08)",
    }}>
      {/* Play Button */}
      <button
        className="cp-tap"
        onClick={() => setPlaying(p => !p)}
        style={{
          width:34, height:34, borderRadius:"50%", flexShrink:0,
          background: isOwn ? "rgba(255,255,255,0.25)" : C.teal,
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, color:"#fff",
        }}
      >
        {playing ? "⏸" : "▶"}
      </button>

      {/* Waveform */}
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:2, height:24 }}>
        {Array.from({length:22}).map((_, i) => (
          <div key={i} style={{
            width:2.5, borderRadius:2,
            background: isOwn ? "rgba(255,255,255,0.65)" : C.teal,
            height: `${25 + Math.sin(i * 0.8) * 18 + Math.cos(i * 1.4) * 10}%`,
            animation: playing ? `waveBar ${0.4 + (i % 4) * 0.1}s ease infinite` : "none",
          }}/>
        ))}
      </div>

      {/* Duration */}
      <span style={{ fontSize:11, fontWeight:600,
        color: isOwn ? "rgba(255,255,255,0.80)" : C.muted, flexShrink:0 }}>
        {msg.duration || "0:28"}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, isOwn, otherAvatar }) {
  if (msg.type === "typing") {
    return (
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:10,
        animation:"fadeIn 0.3s ease" }}>
        <img src={otherAvatar || "https://i.pravatar.cc/32?img=1"} alt=""
          style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
        <div style={{
          background:"rgba(255,255,255,0.92)", borderRadius:"18px 18px 18px 4px",
          padding:"12px 16px",
          boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
          display:"flex", alignItems:"center", gap:4,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:6, height:6, borderRadius:"50%",
              background:C.teal,
              animation:`pulse 1.2s ease ${i*0.2}s infinite`,
            }}/>
          ))}
        </div>
      </div>
    );
  }

  if (msg.type === "date_divider") {
    return (
      <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
        <span style={{
          fontSize:11.5, color:C.muted, fontWeight:600,
          background:C.cream, padding:"4px 12px", borderRadius:999,
        }}>
          {msg.text}
        </span>
      </div>
    );
  }

  const bubbleStyle = isOwn ? {
    background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
    color:"#fff",
    borderRadius:"18px 18px 4px 18px",
    boxShadow:`0 4px 16px ${C.tealGlow}`,
  } : {
    background:"rgba(255,255,255,0.92)",
    color:C.ink,
    borderRadius:"18px 18px 18px 4px",
    boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div style={{
      display:"flex",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems:"flex-end", gap:8,
      marginBottom:8,
      animation:"msgIn 0.3s ease both",
    }}>
      {!isOwn && (
        <img src={otherAvatar || "https://i.pravatar.cc/32?img=1"} alt=""
          style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover",
            flexShrink:0, alignSelf:"flex-end" }}/>
      )}

      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column",
        alignItems: isOwn ? "flex-end" : "flex-start" }}>
        {/* Bubble */}
        {msg.type === "voice" ? (
          <VoiceMessageCard msg={msg} isOwn={isOwn} />
        ) : msg.type === "image" ? (
          <div style={{ borderRadius:18, overflow:"hidden", position:"relative",
            boxShadow:"0 4px 16px rgba(0,0,0,0.14)" }}>
            <img src={msg.imgUrl} alt="" loading="lazy"
              style={{ width:"100%", maxWidth:240, display:"block", objectFit:"cover" }}/>
            {msg.caption && (
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
                padding:"16px 12px 10px",
                fontSize:12.5, color:"#fff", fontWeight:600,
              }}>
                {msg.caption}
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...bubbleStyle, padding:"11px 15px",
            fontSize:14, lineHeight:1.55, whiteSpace:"pre-wrap",
            backdropFilter: isOwn ? "none" : "blur(8px)" }}>
            {msg.text}
          </div>
        )}

        {/* Reaction + Time */}
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3,
          flexDirection: isOwn ? "row-reverse" : "row" }}>
          {msg.reaction && (
            <div style={{
              fontSize:11, background:"rgba(255,255,255,0.90)",
              borderRadius:999, padding:"2px 7px",
              boxShadow:"0 1px 6px rgba(0,0,0,0.10)",
              display:"flex", alignItems:"center", gap:3,
            }}>
              {msg.reaction}
              {msg.reactionCount > 1 && (
                <span style={{ fontSize:10, color:C.muted }}>{msg.reactionCount}</span>
              )}
            </div>
          )}
          <span style={{ fontSize:10.5, color:C.muted }}>
            {timeFmt(msg.created_at)}
          </span>
          {isOwn && (
            <span style={{ fontSize:10, color: C.teal }}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPTY CHAT STATE
══════════════════════════════════════════════════════════════ */
function EmptyChatState({ onDiscover }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 32px", textAlign:"center",
      animation:"fadeUp 0.5s ease both",
    }}>
      {/* Illustration */}
      <div style={{
        width:100, height:100, borderRadius:"50%",
        background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.15) 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:44, marginBottom:20,
        boxShadow:`0 8px 32px ${C.tealGlow}`,
      }}>
        💬
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:C.ink,
        letterSpacing:-0.4, marginBottom:8, lineHeight:1.3 }}>
        Hier entstehen echte Begegnungen.
      </div>
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.7,
        maxWidth:260, marginBottom:28 }}>
        Buche Erlebnisse, stelle Anfragen oder tausche dich mit kreativen Menschen aus.
      </div>
      <button
        onClick={onDiscover}
        style={{
          background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          color:"#fff", border:"none", borderRadius:16,
          padding:"13px 28px", fontSize:14, fontWeight:700,
          cursor:"pointer",
          boxShadow:`0 6px 20px ${C.tealGlow}`,
        }}
      >
        Entdecken
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHAT SIDEBAR
══════════════════════════════════════════════════════════════ */
function ChatSidebar({ chats, bookingChats, connections, networkPeople = [], activeId, onOpen, onClose, isWide, loading = false }) {
  const [search, setSearch]   = useState("");
  const [focused,  setFocused] = useState(false);
  const searchRef = useRef(null);

  // ── Suche: nur im eigenen Netzwerk ──────────────────────────────
  const q = search.trim().toLowerCase();

  // Menschen: aus Chats + DB-Netzwerk (follows/followers) dedupliziert
  const allNetworkPeople = React.useMemo(() => {
    const seen = new Set();
    const people = [];

    // Prio 1: bestehende Chat-Partner
    [...chats, ...bookingChats].forEach(c => {
      const p = c.other_profile;
      if (!p?.id || seen.has(p.id)) return;
      seen.add(p.id);
      people.push({ ...p, _chatId: c.id, _source: "chat",
        relation: "Chat vorhanden", relationIcon: "💬" });
    });

    // Prio 2: DB-Netzwerk (follows/followers) — mit relation-Label
    (networkPeople || []).forEach(p => {
      if (!p?.id || seen.has(p.id)) return;
      seen.add(p.id);
      // _chatId suchen falls Chat existiert
      const chat = [...chats, ...bookingChats].find(c =>
        c.other_profile?.id === p.id);
      people.push({ ...p, _chatId: chat?.id ?? null });
    });

    // Prio 3: Mock-Verbindungen
    (connections || []).forEach(conn => {
      if (!conn?.id || seen.has(conn.id)) return;
      seen.add(conn.id);
      people.push({ id: conn.id, display_name: conn.name, avatar_url: conn.img,
        _source: "connection", relation: "Verbindung", relationIcon: "🤝" });
    });
    return people;
  }, [chats, bookingChats, connections, networkPeople]);

  // Gefilterte Ergebnisse
  const filteredPeople    = q ? allNetworkPeople.filter(p =>
    p.display_name?.toLowerCase().includes(q) ||
    p.username?.toLowerCase().includes(q)
  ) : [];
  const filteredChats     = q ? [...chats, ...bookingChats].filter(c =>
    c.other_profile?.display_name?.toLowerCase().includes(q) ||
    c.other_profile?.username?.toLowerCase().includes(q) ||
    c.booking_title?.toLowerCase().includes(q)
  ) : [];
  const filteredBookings  = q ? bookingChats.filter(c =>
    c.booking_title?.toLowerCase().includes(q) ||
    c.other_profile?.display_name?.toLowerCase().includes(q)
  ) : [];
  const hasResults = filteredPeople.length > 0 || filteredChats.length > 0;

  // Ohne Suche: normale Chat-Liste
  const allActive = !q ? chats : [];

  return (
    <div style={{
      width: isWide ? 320 : "100%",
      flexShrink:0,
      background:C.cream,
      borderRight: isWide ? `1px solid ${C.border}` : "none",
      display:"flex", flexDirection:"column",
      height:"100%",
    }}>
      {/* ── SIDEBAR MARKER ── */}
      <div style={{
        background:"#001a00", color:"#00ff88", fontFamily:"monospace",
        fontSize:10, padding:"3px 10px", flexShrink:0,
      }}>[CHATSIDEBAR] loading={String(loading)} chats={chats.length} booking={bookingChats.length}</div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 12px",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.borderL}`,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:C.ink, letterSpacing:-0.8, lineHeight:1.1 }}>
              Nachrichten<span style={{ color:C.teal }}>·</span>
            </div>
            <div style={{ fontSize:12.5, color:C.muted, marginTop:2 }}>
              Echte Gespraeche. Echte Verbindung.
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Compose */}
            <button className="cp-tap" onClick={() => setShowSearch(s => !s)} style={{
              width:40, height:40, borderRadius:"50%",
              background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:"#fff",
              boxShadow:`0 4px 14px ${C.tealGlow}`,
            }}>✏</button>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(8px)",
          borderRadius:16, padding:"0 14px", height:42,
          border: focused ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
          boxShadow: focused ? `0 0 0 3px ${C.tealGlow}` : "none",
          transition:"all 0.2s ease",
        }}>
          <span style={{ fontSize:15, opacity:0.45 }}>🔍</span>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="In meinem Netzwerk suchen …"
            style={{
              flex:1, border:"none", background:"none",
              fontSize:13.5, color:C.ink, outline:"none",
            }}
          />
          {search && (
            <button className="cp-tap" onClick={() => setSearch("")} style={{
              background:"none", border:"none", fontSize:14,
              color:C.muted, cursor:"pointer", padding:0,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Chat Liste ──────────────────────────────────────────── */}
      <div className="cp-scroll" style={{ flex:1, overflowY:"auto" }}>

        {/* ═══ SUCHMODUS ════════════════════════════════════════════ */}
        {q ? (
          <div style={{ padding:"8px 0" }}>
            {!hasResults && (
              <div style={{ padding:"32px 24px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:6 }}>
                  Keine Treffer in deinem Netzwerk
                </div>
                <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.6 }}>
                  HUI sucht nur in deinen bestehenden<br/>Verbindungen und Gesprächen.
                </div>
              </div>
            )}

            {/* Gruppe: Menschen */}
            {filteredPeople.length > 0 && (
              <>
                <div style={{ padding:"10px 16px 4px",
                  fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5 }}>
                  👤 MENSCHEN
                </div>
                {filteredPeople.map(p => (
                  <div key={p.id} className="cp-card-hover cp-tap"
                    onClick={() => {
                      const chat = [...chats, ...bookingChats].find(c => c.id === p._chatId);
                      if (chat) onOpen(chat);
                    }}
                    style={{ display:"flex", alignItems:"center", gap:12,
                      padding:"11px 16px", cursor:"pointer" }}>
                    <img src={p.avatar_url || "https://i.pravatar.cc/40?img=5"} alt={p.display_name}
                      style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover",
                        border:`1.5px solid ${C.teal}22` }}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>
                        {p.display_name}
                      </div>
                      <div style={{ fontSize:11.5, color:C.muted, display:"flex", gap:4, alignItems:"center" }}>
                        {p.relationIcon && <span>{p.relationIcon}</span>}
                        <span>{p.relation || (p.username ? `@${p.username}` : "")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Gruppe: Gespräche */}
            {filteredChats.length > 0 && (
              <>
                <div style={{ padding:"10px 16px 4px",
                  fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5 }}>
                  💬 GESPRÄCHE
                </div>
                {filteredChats.map(chat => (
                  <ChatConversationCard key={chat.id} chat={chat}
                    active={chat.id === activeId} onOpen={onOpen} />
                ))}
              </>
            )}

            {/* Gruppe: Buchungen */}
            {filteredBookings.length > 0 && (
              <>
                <div style={{ padding:"10px 16px 4px",
                  fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5 }}>
                  🎟️ BUCHUNGEN
                </div>
                {filteredBookings.map(chat => (
                  <ChatConversationCard key={chat.id} chat={chat}
                    active={chat.id === activeId} onOpen={onOpen} />
                ))}
              </>
            )}
          </div>

        ) : (
          /* ═══ NORMAL-MODUS (kein Suchbegriff) ═══════════════════ */
          <>
            {/* Laden: Skeleton */}
            {loading ? (
              <>
                <div style={{ padding:"8px 16px 4px",
                  fontSize:12, fontWeight:700, color:C.muted, letterSpacing:0.4 }}>
                  AKTIVE GESPRÄCHE
                </div>
                {[1,2,3].map(k => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"13px 16px", opacity: 0.5 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%",
                      background:"rgba(0,0,0,0.07)" }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ height:13, borderRadius:6, background:"rgba(0,0,0,0.07)",
                        width:"60%", marginBottom:7 }}/>
                      <div style={{ height:11, borderRadius:6, background:"rgba(0,0,0,0.05)",
                        width:"80%" }}/>
                    </div>
                  </div>
                ))}
              </>
            ) : allActive.length > 0 ? (
              <>
                <div style={{ padding:"8px 16px 4px",
                  fontSize:12, fontWeight:700, color:C.muted, letterSpacing:0.4 }}>
                  AKTIVE GESPRÄCHE
                </div>
                {allActive.map(chat => (
                  <ChatConversationCard key={chat.id} chat={chat}
                    active={chat.id === activeId} onOpen={onOpen} />
                ))}
              </>
            ) : null}

            {/* Buchungsanfragen */}
            {bookingChats.length > 0 && (
              <>
                <div style={{ padding:"12px 16px 4px",
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:0.4 }}>
                    BUCHUNGEN
                  </span>
                </div>
                {bookingChats.map(chat => (
                  <ChatConversationCard key={chat.id} chat={chat}
                    active={chat.id === activeId} onOpen={onOpen} />
                ))}
              </>
            )}
        </>)}

        {/* Neueste Verbindungen */}
        <div style={{ padding:"12px 16px 6px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:0.4 }}>
            NEUESTE VERBINDUNGEN
          </span>
          <span style={{ fontSize:11.5, color:C.teal, fontWeight:700, cursor:"pointer" }}>›</span>
        </div>
        <div className="cp-scroll" style={{ display:"flex", gap:14,
          overflowX:"auto", padding:"4px 16px 12px" }}>
          {/* Entdecken */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <div style={{
              width:52, height:52, borderRadius:"50%",
              background:C.cream, border:`1.5px dashed ${C.teal}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, cursor:"pointer",
            }}>🔍</div>
            <span style={{ fontSize:10.5, color:C.muted }}>Entdecken</span>
          </div>
          {(connections || []).filter(Boolean).map(conn => (
            <div key={conn.id} style={{ display:"flex", flexDirection:"column",
              alignItems:"center", gap:5 }}>
              <img src={conn.img} alt={conn.name}
                style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover",
                  border:`2px solid rgba(255,255,255,0.80)`,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.10)" }}/>
              <span style={{ fontSize:10.5, color:C.muted, whiteSpace:"nowrap" }}>
                {conn.name}
              </span>
            </div>
          ))}
        </div>

        {/* Impact Banner */}
        <div style={{
          margin:"8px 16px 20px",
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(10px)",
          borderRadius:20, padding:"16px 18px",
          border:`1px solid rgba(32,211,194,0.15)`,
          boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
                marginBottom:5, lineHeight:1.3, letterSpacing:-0.2 }}>
                Gemeinsam Wirkung schaffen
              </div>
              <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.5, marginBottom:12 }}>
                Jedes Gespraech kann der Anfang von etwas Grossem sein.
              </div>
              <button className="cp-tap" style={{
                background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
                color:"#fff", border:"none", borderRadius:12,
                padding:"9px 16px", fontSize:12, fontWeight:700,
                cursor:"pointer",
                boxShadow:`0 4px 12px ${C.tealGlow}`,
              }}>
                Impact Projekte entdecken
              </button>
            </div>
            <div style={{ fontSize:36, opacity:0.7, flexShrink:0 }}>🌿</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHAT DETAIL VIEW
══════════════════════════════════════════════════════════════ */
function ChatDetailView({ chat, messages, onBack, onSend, isWide }) {
  const { user } = useAuth();
  const [input, setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try { await onSend?.(text); }
    finally { setSending(false); }
  }, [input, sending, onSend]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const other = chat.other_profile || {};
  const msgList = messages.length > 0 ? messages : MOCK_MESSAGES;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      background:C.warm, height:"100%",
      animation: isWide ? "slideR 0.3s ease both" : "none",
    }}>
      {/* ── Creator Header ───────────────────────────────────────── */}
      <div style={{
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 12px",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.borderL}`,
        display:"flex", alignItems:"center", gap:12,
      }}>
        {/* Back (nur mobile) */}
        {!isWide && (
          <button className="cp-tap" onClick={onBack} style={{
            width:36, height:36, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, color:C.ink2, flexShrink:0,
          }}>‹</button>
        )}

        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <img src={other.avatar_url || "https://i.pravatar.cc/50?img=1"} alt={other.display_name}
            style={{ width:46, height:46, borderRadius:"50%", objectFit:"cover",
              border:`2px solid ${C.teal}22` }}/>
          {chat.presence === "online" && (
            <div style={{
              position:"absolute", bottom:1, right:1,
              width:11, height:11, borderRadius:"50%",
              background:C.greenDot, border:"2px solid #fff",
            }}/>
          )}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15.5, fontWeight:800, color:C.ink,
            letterSpacing:-0.3, lineHeight:1.2 }}>
            {other.display_name || chat.name || "—"}
          </div>
          <div style={{ fontSize:11.5, color:C.muted, display:"flex", alignItems:"center", gap:4 }}>
            <span>{chat.category || other.talent || other.username || ""}</span>
            {other.location && (
              <>
                <span>·</span>
                <span>📍 {other.location}</span>
              </>
            )}
          </div>
          <PresenceBadge status={chat.presence} label={chat.presenceLabel} />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button className="cp-tap" style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:C.ink2,
          }}>···</button>
          <button className="cp-tap" style={{
            width:38, height:38, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:C.ink2,
          }}>📞</button>
        </div>
      </div>

      {/* ── Booking Preview ──────────────────────────────────────── */}
      <div style={{ padding:"12px 0 0" }}>
        <BookingPreviewCard chat={chat} />
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="cp-scroll" style={{ flex:1, overflowY:"auto", padding:"8px 16px" }}>
        {/* Datum Divider */}
        <div style={{ textAlign:"center", padding:"8px 0 12px" }}>
          <span style={{ fontSize:11.5, color:C.muted, fontWeight:600,
            background:"rgba(0,0,0,0.05)", padding:"4px 12px", borderRadius:999 }}>
            Heute
          </span>
        </div>

        {(msgList || []).filter(Boolean).map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            msg={msg}
            isOwn={msg.sender_id === user?.id}
            otherAvatar={other.avatar_url}
          />
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ── Impact Hinweis ────────────────────────────────────────── */}
      <div style={{
        margin:"0 16px 8px",
        background:C.tealPale,
        borderRadius:12, padding:"7px 12px",
        display:"flex", alignItems:"center", gap:6,
        border:`1px solid rgba(32,211,194,0.20)`,
      }}>
        <span style={{ fontSize:13 }}>🌿</span>
        <span style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
          Durch diese Buchung unterstuetzt du automatisch kreative Projekte.
        </span>
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────── */}
      <div style={{
        padding:"8px 16px max(72px,calc(env(safe-area-inset-bottom,0px) + 64px))",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderTop:`1px solid ${C.borderL}`,
        display:"flex", alignItems:"center", gap:10,
      }}>
        {/* Plus */}
        <button className="cp-tap" style={{
          width:36, height:36, borderRadius:"50%",
          background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, color:C.muted, flexShrink:0,
        }}>+</button>

        {/* Input */}
        <div style={{
          flex:1,
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(8px)",
          borderRadius:20, border:`1px solid ${C.border}`,
          display:"flex", alignItems:"center",
          padding:"0 14px", height:42,
          transition:"border 0.2s ease",
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nachricht schreiben..."
            style={{
              flex:1, border:"none", background:"none",
              fontSize:14, color:C.ink, outline:"none",
            }}
          />
          <button className="cp-tap" style={{
            background:"none", border:"none",
            fontSize:18, color:C.muted, cursor:"pointer",
          }}>😊</button>
        </div>

        {/* Send / Voice */}
        {input.trim() ? (
          <button
            className="cp-tap cp-input-send"
            onClick={handleSend}
            disabled={sending}
            style={{
              width:42, height:42, borderRadius:"50%", flexShrink:0,
              background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:"#fff",
              boxShadow:`0 4px 14px ${C.tealGlow}`,
              opacity: sending ? 0.6 : 1,
            }}
          >
            ➤
          </button>
        ) : (
          <button className="cp-tap" style={{
            width:42, height:42, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, color:"#fff",
            boxShadow:`0 4px 14px ${C.tealGlow}`,
          }}>🎤</button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN: ChatPage
══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   useNetworkPeople — lädt alle Personen mit Netzwerk-Beziehung:
   - follows (ich folge jemand)
   - followers (jemand folgt mir)
   Gibt dedupliziertes Array mit relation-Label zurück.
══════════════════════════════════════════════════════════════ */
function useNetworkPeople() {
  const { user } = useAuth();
  const [people, setPeople] = React.useState([]);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function load() {
      try {
        // Ich folge wem?
        const { data: following } = await supabase
          .from("follows")
          .select("following_id, profiles!follows_following_id_fkey(id, display_name, avatar_url, username)")
          .eq("follower_id", user.id)
          .limit(200);

        // Wer folgt mir?
        const { data: followers } = await supabase
          .from("follows")
          .select("follower_id, profiles!follows_follower_id_fkey(id, display_name, avatar_url, username)")
          .eq("following_id", user.id)
          .limit(200);

        if (cancelled) return;

        const map = new Map(); // id → person

        // Ich folge
        (following || []).forEach(row => {
          const p = row.profiles;
          if (!p?.id) return;
          map.set(p.id, { ...p, _relations: new Set(["following"]) });
        });

        // Folgt mir
        (followers || []).forEach(row => {
          const p = row.profiles;
          if (!p?.id) return;
          if (map.has(p.id)) {
            map.get(p.id)._relations.add("follower");
          } else {
            map.set(p.id, { ...p, _relations: new Set(["follower"]) });
          }
        });

        // Relation-Label berechnen
        const result = [...map.values()].map(p => {
          const r = p._relations;
          let relation, relationIcon;
          if (r.has("following") && r.has("follower")) {
            relation = "Verbindung"; relationIcon = "🤝";
          } else if (r.has("following")) {
            relation = "Du folgst"; relationIcon = "➡️";
          } else {
            relation = "Folgt dir"; relationIcon = "➕";
          }
          return { ...p, _relations: undefined, relation, relationIcon, _source: "network" };
        });

        setPeople(result);
      } catch(e) {
        console.warn("[useNetworkPeople]", e.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return people;
}

export default function ChatPage({ onClose, initialRecipient = null }) {
  // ── Hooks (stabile Reihenfolge) ───────────────────────────────────
  const { user } = useAuth();
  const { chats: dbChats, loading: chatsLoading, markChatRead } = useChatList();
  const networkPeopleDB = useNetworkPeople();
  const [activeChat, setActiveChat] = useState(null);

  // initialRecipient → direkt Chat öffnen (von Profil / Kompass)
  React.useEffect(() => {
    if (!initialRecipient?.id || !user?.id || activeChat) return;
    findOrCreateChat({ userId: user.id, otherUserId: initialRecipient.id, chatType: "direct" })
      .then(chatRecord => {
        if (!chatRecord?.id) return;
        setActiveChat({
          id:          chatRecord.id,
          name:        initialRecipient.display_name || "Creator",
          avatar_url:  initialRecipient.avatar_url   || null,
          talent:      initialRecipient.talent       || null,
          participant_ids: chatRecord.participant_ids || [],
          other_profile: { display_name: initialRecipient.display_name, avatar_url: initialRecipient.avatar_url },
        });
      })
      .catch(err => console.error("[ChatPage] findOrCreateChat:", err?.message));
  }, [initialRecipient?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desktop >= 1200px: 2-Spalten Chat.
  // Mobile + Tablet (< 1200px): Mobile-UI, kein Split-View.
  const [isWide, setIsWide] = React.useState(window.innerWidth >= 1200);
  React.useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 1200);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Chat-Thread für aktiven Chat ──────────────────────────────────
  const { messages, sendMessage } = useChatThread(activeChat?.id ?? null);

  // ── Daten: immer DB — kein Mock-Fallback ─────────────────────────
  // Während chatsLoading zeigt ChatSidebar ein Skeleton (keine Fake-Namen).
  const activeChats  = dbChats.filter(c => c.chat_type !== "booking");
  const bookingChats = dbChats.filter(c => c.chat_type === "booking");

  // ── Handler ────────────────────────────────────────────────────────
  const handleOpen = useCallback((chat) => {
    markChatRead?.(chat.id);
    setActiveChat(chat);
  }, [markChatRead]);

  const handleBack = useCallback(() => {
    setActiveChat(null);
  }, []);

  const handleSend = useCallback(async (text) => {
    if (!activeChat?.id || !text) return;
    await sendMessage?.({ text, type:"text" });
  }, [activeChat?.id, sendMessage]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"row",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      overflow:"hidden",
    }}>
      <style>{CSS}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      {(isWide || !activeChat) && (
        <>
          <div style={{
            background:"#000", color:"#0f0", fontFamily:"monospace",
            fontSize:11, padding:"8px 12px", zIndex:99999, flexShrink:0,
            borderBottom:"2px solid #0f0",
          }}>
            <div style={{fontWeight:900, marginBottom:4}}>DEBUG CHAT SOURCE</div>
            <div>[CHATPAGE]</div>
            <div>Component: ChatPage</div>
            <div>Loading: {String(chatsLoading)}</div>
            <div>activeChats.length: {activeChats.length}</div>
            <div>bookingChats.length: {bookingChats.length}</div>
            <div>First: {activeChats[0]?.other_profile?.display_name ?? bookingChats[0]?.other_profile?.display_name ?? "—"}</div>
            <div>dbChats.length: {dbChats.length}</div>
          </div>
          <ChatSidebar
            chats={activeChats}
            bookingChats={bookingChats}
            connections={MOCK_CONNECTIONS}
            networkPeople={networkPeopleDB}
            loading={chatsLoading}
            activeId={activeChat?.id}
            onOpen={handleOpen}
            onClose={onClose}
            isWide={isWide}
          />
        </>
      )}

      {/* ── DETAIL VIEW ──────────────────────────────────────────── */}
      {(isWide || activeChat) && (
        activeChat ? (
          <ChatDetailView
            chat={activeChat}
            messages={messages}
            onBack={handleBack}
            onSend={handleSend}
            isWide={isWide}
          />
        ) : isWide ? (
          /* Empty State auf iPad wenn kein Chat selektiert */
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            background:C.warm, alignItems:"center", justifyContent:"center" }}>
            <EmptyChatState onDiscover={onClose} />
          </div>
        ) : null
      )}
    </div>
  );
}
