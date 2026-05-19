// chat-center/ConversationCard.jsx v2
// Screenshot-exact nach HUI Chat Design
// Glass cards, warme Atmosphäre, Mood-Status

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", muted:"rgba(80,80,80,0.52)" };

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 3600)  return d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  if (diff < 86400) return d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  return "Gestern";
}

const MOODS = [
  { icon:"\uD83C\uDFB5", label:"Musik & Klang" },
  { icon:"\uD83C\uDFA8", label:"Keramik & Handwerk" },
  { icon:"\uD83D\uDCF8", label:"Fotografie & Film" },
  { icon:"\uD83E\uDDD8", label:"Yoga & Bewegung" },
  { icon:"\u2728",       label:"Kreative:r" },
];

export default function ConversationCard({ conv, onPress, isActive }) {
  const name       = conv.name || conv.other_profile?.display_name || "?";
  const avatar     = conv.avatar_url || conv.other_profile?.avatar_url;
  const lastMsg    = conv.last_message || "Neue Verbindung";
  const unread     = conv.unread || 0;
  const online     = conv.online ?? (conv.other_profile?.last_seen
    ? (Date.now() - new Date(conv.other_profile.last_seen)) < 300000 : false);
  const mood       = MOODS[conv.id % MOODS.length];
  const initials   = name[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={() => onPress?.(conv)}
      style={{
        width:"100%", textAlign:"left",
        padding:"13px 14px",
        background: isActive
          ? "rgba(22,215,197,0.06)"
          : "rgba(255,255,255,0.68)",
        backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
        border: isActive
          ? "1px solid rgba(22,215,197,0.22)"
          : "1px solid rgba(255,255,255,0.55)",
        borderRadius:16,
        boxShadow: unread > 0
          ? "0 4px 18px rgba(0,0,0,0.08)"
          : "0 2px 10px rgba(0,0,0,0.05)",
        display:"flex", alignItems:"center", gap:12,
        cursor:"pointer", marginBottom:8,
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        transition:"transform 0.14s ease, background 0.18s",
      }}
      onTouchStart={e => e.currentTarget.style.transform="scale(0.985)"}
      onTouchEnd={e   => e.currentTarget.style.transform="scale(1)"}
    >
      {/* Avatar */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{
          width:50, height:50, borderRadius:"50%",
          background: avatar
            ? `url(${avatar}) center/cover no-repeat`
            : `linear-gradient(135deg,${C.teal}80,${C.coral}60)`,
          border:"2px solid rgba(255,255,255,0.90)",
          boxShadow:"0 3px 10px rgba(0,0,0,0.10)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, color:"white", fontWeight:700,
        }}>{!avatar && initials}</div>
        {online && (
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:11, height:11, borderRadius:"50%",
            background:"#22C55E", border:"2px solid #F2F4F8",
            boxShadow:"0 0 5px rgba(34,197,94,0.7)",
          }}/>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Name + Zeit */}
        <div style={{
          display:"flex", justifyContent:"space-between",
          alignItems:"baseline", marginBottom:3,
        }}>
          <span style={{
            fontSize:14.5, fontWeight: unread ? 800 : 600, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:155,
          }}>{name}</span>
          <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:6 }}>
            {timeAgo(conv.last_message_at || conv.last_at)}
          </span>
        </div>
        {/* Talent/Mood */}
        <div style={{
          fontSize:11.5, color:C.teal, fontWeight:500, marginBottom:3,
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span>{mood.icon}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {mood.label}
          </span>
        </div>
        {/* Letzte Nachricht */}
        <div style={{
          fontSize:13, color: unread ? C.ink : C.muted,
          fontWeight: unread ? 600 : 400,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{lastMsg}</div>
      </div>

      {/* Unread indicator */}
      {unread > 0 ? (
        <div style={{
          flexShrink:0, minWidth:20, height:20, borderRadius:10,
          background:`linear-gradient(135deg,${C.teal},#11C5B7)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10.5, fontWeight:800, color:"white", padding:"0 5px",
          boxShadow:`0 2px 6px rgba(22,215,197,0.45)`,
        }}>{unread > 9 ? "9+" : unread}</div>
      ) : conv.pending ? (
        <div style={{
          flexShrink:0, width:9, height:9, borderRadius:"50%",
          background:C.coral,
          boxShadow:`0 0 6px ${C.coral}80`,
        }}/>
      ) : null}
    </button>
  );
}
