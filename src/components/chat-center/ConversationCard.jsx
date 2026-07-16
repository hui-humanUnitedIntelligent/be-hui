// chat-center/ConversationCard.jsx v2
// Screenshot-exact nach HUI Chat Design
// Glass cards, warme Atmosphäre, Mood-Status

import React from "react";
import { HUI } from "../../design/hui.design.js";
import { chatOtherUserId, presenceDisplayFromRow } from "../../lib/usePresence.jsx";

const C = { teal:HUI.COLOR.teal, coral:HUI.COLOR.coral, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.52)" };

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 3600)  return d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  if (diff < 86400) return d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  return "Gestern";
}

const MOODS = [
  { icon:"🎵", label:"Musik & Klang" },
  { icon:"🏺", label:"Keramik & Handwerk" },
  { icon:"📸", label:"Fotografie & Film" },
  { icon:"🧘", label:"Yoga & Bewegung" },
  { icon:"✦",  label:"Im kreativen Fluss" },
];

export default function ConversationCard({ conv, onPress, isActive, presenceMap, currentUserId }) {
  const name       = conv.name || conv.other_profile?.display_name || "?";
  const avatar     = conv.avatar_url || conv.other_profile?.avatar_url;
  const lastMsg    = conv.last_message || "Eine Verbindung entsteht ✦";
  const unread     = conv.unread || 0;
  const otherId    = chatOtherUserId(conv, currentUserId);
  const presence   = presenceDisplayFromRow(otherId ? presenceMap?.[otherId] : null);
  const moodIndex =
    Math.abs(
      String(conv.id)
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % MOODS.length;
  const mood = MOODS[moodIndex] ?? { icon: "✦", label: "Im kreativen Fluss" };
  const initials   = name[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={() => onPress?.(conv)}
      style={{
        width:"100%", textAlign:"left",
        padding:"15px 14px",
        background: isActive
          ? "rgba(22,215,197,0.06)"
          : "rgba(255,255,255,0.68)",
        backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
        border: isActive
          ? "1px solid rgba(22,215,197,0.22)"
          : "1px solid rgba(255,255,255,0.55)",
        borderRadius:16,
        boxShadow: unread > 0
          ? "0 2px 12px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        display:"flex", alignItems:"center", gap:12,
        cursor:"pointer", marginBottom:8,
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        transition:"transform 0.28s ease, background 0.30s, box-shadow 0.30s",
      }}
      onTouchStart={e => e.currentTarget.style.transform="scale(0.992)"}
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
        {/* Kein Online-Status-Dot — kein Presence-Druck */}
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
        {/* Presence / Talent-Mood */}
        <div style={{
          fontSize:11.5, fontWeight:500, marginBottom:3,
          display:"flex", alignItems:"center", gap:4,
          color: presence?.online ? "#22c55e" : C.teal,
        }}>
          {presence ? (
            <>
              <span style={{
                display:"inline-block", width:7, height:7, borderRadius:"50%",
                background: presence.dot, flexShrink:0,
              }}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                color: presence.online ? "#22c55e" : "rgba(80,80,80,0.60)",
                fontWeight: presence.online ? 600 : 400,
              }}>
                {presence.label}
              </span>
            </>
          ) : (
            <>
              <span>{mood.icon}</span>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {mood.label}
              </span>
            </>
          )}
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
