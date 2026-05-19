// components/chat-center/ConversationCard.jsx
// Einzelne Conversation — floating glass card

import React from "react";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"rgba(80,80,80,0.52)", cream:"#F9F7F4",
};

const PRESENCE = [
  "Im Atelier", "Gerade kreativ", "Arbeitet an einem Werk",
  "In Gedanken", "Gerade verfügbar",
];

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60)  return "gerade";
  if (diff < 3600) return Math.round(diff/60) + " Min";
  if (diff < 86400) return Math.round(diff/3600) + " Std";
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

export default function ConversationCard({ conv, onPress, isActive }) {
  const presence = PRESENCE[conv.id % PRESENCE.length];

  return (
    <button
      onClick={() => onPress?.(conv)}
      style={{
        width:"100%", textAlign:"left",
        padding:"14px 16px",
        background: isActive
          ? "rgba(22,215,197,0.07)"
          : "rgba(255,255,255,0.72)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        border: isActive
          ? "1px solid rgba(22,215,197,0.22)"
          : "1px solid rgba(255,255,255,0.55)",
        borderRadius:18,
        boxShadow:"0 2px 12px rgba(0,0,0,0.055)",
        display:"flex", alignItems:"center", gap:13,
        cursor:"pointer", marginBottom:10,
        transition:"transform 0.15s ease, background 0.2s",
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
      onTouchStart={e => e.currentTarget.style.transform="scale(0.98)"}
      onTouchEnd={e   => e.currentTarget.style.transform="scale(1)"}
    >
      {/* Avatar */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{
          width:52, height:52, borderRadius:"50%",
          background: conv.avatar_url
            ? `url(${conv.avatar_url}) center/cover no-repeat`
            : `linear-gradient(135deg,${C.teal}80,${C.coral}60)`,
          border:"2px solid rgba(255,255,255,0.9)",
          boxShadow:"0 2px 8px rgba(0,0,0,0.10)",
        }}>
          {!conv.avatar_url && (
            <div style={{
              width:"100%", height:"100%", borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, color:"white", fontWeight:700,
            }}>
              {(conv.name||"?")[0].toUpperCase()}
            </div>
          )}
        </div>
        {/* Online dot */}
        {conv.online && (
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:11, height:11, borderRadius:"50%",
            background:C.teal,
            border:"2px solid rgba(249,247,244,0.96)",
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
            fontSize:15, fontWeight: conv.unread ? 800 : 600,
            color:C.ink, whiteSpace:"nowrap", overflow:"hidden",
            textOverflow:"ellipsis", maxWidth:160,
          }}>{conv.name}</span>
          <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:6 }}>
            {timeAgo(conv.last_at)}
          </span>
        </div>

        {/* Presence status statt "Online" */}
        <div style={{
          fontSize:11.5, color:C.teal, fontWeight:500, marginBottom:2,
        }}>{presence}</div>

        <div style={{
          fontSize:13, color: conv.unread ? C.ink2 : C.muted,
          fontWeight: conv.unread ? 600 : 400,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{conv.last_message || "Neue Verbindung"}</div>
      </div>

      {/* Unread badge */}
      {conv.unread > 0 && (
        <div style={{
          flexShrink:0,
          minWidth:20, height:20, borderRadius:10,
          background:`linear-gradient(135deg,${C.teal},#11C5B7)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10.5, fontWeight:800, color:"white",
          padding:"0 5px",
          boxShadow:`0 2px 6px ${C.teal}55`,
        }}>{conv.unread > 9 ? "9+" : conv.unread}</div>
      )}
    </button>
  );
}
