import React from "react";
import {
  REJECTION_TYPE_MAP,
  parseNotificationMeta,
} from "../notificationHelpers.js";

export function RejectionDetailModal({ n, onClose }) {
  const meta = parseNotificationMeta(n);
  const tm = REJECTION_TYPE_MAP[n.type] || {
    label:"Eintrag", emoji:"📋",
    hint:"Du kannst den Eintrag überarbeiten und erneut einreichen.",
  };
  const entryTitle = meta.entry_title || meta.project_name || meta.content_title || meta.werk_title || meta.title || n.title || `Dein ${tm.label}`;
  const reason     = meta.rejection_reason || meta.reason || meta.admin_comment || meta.review_note || n.body || "(Kein Grund angegeben)";
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:99999,
        background:"rgba(10,26,26,0.72)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:20, padding:28,
          maxWidth:360, width:"100%",
          boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{fontSize:28, textAlign:"center", marginBottom:8}}>{tm.emoji}</div>
        <div style={{
          fontSize:16, fontWeight:700, color:"#1a1a18",
          textAlign:"center", marginBottom:4,
        }}>{entryTitle}</div>
        <div style={{
          fontSize:11, fontWeight:700, letterSpacing:1,
          color:"rgba(26,26,24,0.35)", textAlign:"center",
          marginBottom:16, textTransform:"uppercase",
        }}>NACHRICHT VOM ADMIN — {tm.label} ABGELEHNT</div>
        <div style={{
          background:"rgba(239,68,68,0.06)",
          border:"1.5px solid rgba(239,68,68,0.18)",
          borderRadius:12, padding:"14px 16px",
          fontSize:13.5, color:"#1a1a18", lineHeight:1.6,
          marginBottom:16,
        }}>{reason}</div>
        <div style={{
          fontSize:12, color:"rgba(26,26,24,0.45)",
          textAlign:"center", marginBottom:20, lineHeight:1.5,
        }}>
          {tm.hint}
        </div>
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"12px 0", borderRadius:99,
            background:"#0DC4B5", border:"none", color:"#fff",
            fontWeight:700, fontSize:14, cursor:"pointer",
            fontFamily:"inherit",
          }}
        >Verstanden</button>
      </div>
    </div>
  );
}
