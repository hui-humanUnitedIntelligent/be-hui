// chat-center/ConversationCard.jsx v2
// Screenshot-exact nach HUI Chat Design
// Glass cards, warme Atmosphäre, Mood-Status

import React from "react";
import { HUI } from "../../design/hui.design.js";
import { formatTimeDE } from "../../lib/formatters.js";
import { getFullDisplayName } from "../../lib/profileUtils.js";

const C = { teal:HUI.COLOR.teal, coral:HUI.COLOR.coral, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.52)" };

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 3600)  return formatTimeDE(d, {hour:"2-digit",minute:"2-digit"});
  if (diff < 86400) return formatTimeDE(d, {hour:"2-digit",minute:"2-digit"});
  return "Gestern";
}

export default function ConversationCard({ conv, onPress, isActive }) {
  // NAME-DISPLAY-FIX (2026-08-17): ConversationCard griff bisher direkt auf
  // other_profile?.display_name zu (frei wählbarer Spitzname, z.B. "Linda",
  // "Michèle", "Meyer") statt auf die SSOT-Funktion getFullDisplayName()
  // (full_name → display_name → username → fallback), die in ChatHeader.jsx
  // und den "Neueste Verbindungen"-Bubbles bereits korrekt genutzt wird.
  // Ergebnis: In der Chatliste fehlten Nachnamen komplett bei Nutzern mit
  // gepflegtem full_name. Fix: gleiche SSOT-Funktion wie überall sonst im Chat.
  const name       = conv.name || getFullDisplayName(conv.other_profile, "?");
  const avatar     = conv.avatar_url || conv.other_profile?.avatar_url;
  const lastMsg    = conv.last_message || "Eine Verbindung ist entstanden";
  const unread     = conv.unread || 0;
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
          fontSize:18, color:"white", fontWeight: 600,
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
            fontSize:14.5, fontWeight: unread ? 600 : 600, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, minWidth:0,
          }}>{name}</span>
          <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:6 }}>
            {timeAgo(conv.last_message_at || conv.last_at)}
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
          fontSize:10.5, fontWeight: 600, color:"white", padding:"0 5px",
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
