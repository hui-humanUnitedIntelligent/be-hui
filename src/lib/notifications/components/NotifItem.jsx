import React, { useState } from "react";
import { T, getMeta } from "../notificationTypes.js";
import { fmtTime } from "../notificationUtils.js";
import { isRejectionType } from "../notificationHelpers.js";
import { RejectionDetailModal } from "./RejectionDetailModal.jsx";

export function NotifItem({ n, onRead, onDelete }) {
  const meta = getMeta(n.type);
  const [hov, setHov] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isRejection = isRejectionType(n.type);

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    if (isRejection) setShowRejection(true);
  };

  const handleGrundBtn = (e) => {
    e.stopPropagation();
    if (!n.is_read) onRead(n.id);
    setShowRejection(true);
  };

  return (
    <>
      {showRejection && <RejectionDetailModal n={n} onClose={() => setShowRejection(false)} />}
      <button
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:"flex", alignItems:"flex-start", gap:12,
          padding:"13px 16px",
          background: hov
            ? "rgba(26,26,24,0.025)"
            : n.is_read ? "transparent" : "rgba(22,215,197,0.05)",
          border:"none",
          borderBottom:`1px solid ${T.border}`,
          cursor:"pointer", width:"100%", textAlign:"left",
          transition:"background 0.15s",
          touchAction:"manipulation",
        }}
      >
        <div style={{
          width:42, height:42, borderRadius:14, flexShrink:0,
          background:`linear-gradient(135deg,${meta.color}22,${meta.color}11)`,
          border:`1.5px solid ${meta.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:19,
        }}>
          {n.icon || meta.icon}
        </div>

        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize:13.5, fontWeight: n.is_read ? 500 : 700,
            color: n.is_read ? T.inkSoft : T.ink,
            lineHeight:1.4, marginBottom:2,
          }}>
            {n.title || meta.label}
          </div>
          {n.body && (
            <div style={{
              fontSize:12.5, color:T.inkFaint, lineHeight:1.5,
              overflow:"hidden", display:"-webkit-box",
              WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            }}>
              {n.body}
            </div>
          )}

          {isRejection && (
            <button
              onClick={handleGrundBtn}
              style={{
                marginTop:7, padding:"4px 11px",
                borderRadius:99,
                border:"1.5px solid rgba(239,68,68,0.35)",
                background:"rgba(239,68,68,0.07)",
                color:"#DC2626",
                fontSize:11, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                display:"inline-flex", alignItems:"center", gap:4,
              }}
            >
              📋 Grund lesen
            </button>
          )}

          <div style={{ fontSize:11, color:"rgba(26,26,24,0.28)", marginTop:4 }}>
            {fmtTime(n.created_at)}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
          {!n.is_read && (
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background:T.teal, marginTop:4,
            }}/>
          )}
          <span style={{fontSize:14, color:"rgba(26,26,24,0.20)", marginTop: n.is_read ? 8 : 0}}>›</span>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              title="Nachricht löschen"
              style={{
                marginTop:4, width:22, height:22, borderRadius:6,
                background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.20)",
                color:"#DC2626", fontSize:12, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", flexShrink:0,
                fontFamily:"inherit", padding:0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </button>

      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position:"fixed", inset:0, zIndex:99999,
            background:"rgba(10,26,26,0.60)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:16, padding:"22px 20px 18px",
              maxWidth:300, width:"100%",
              boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{fontSize:16, fontWeight:800, color:"#1a1a18", marginBottom:8}}>Nachricht löschen?</div>
            <div style={{fontSize:13, color:"#888", marginBottom:20, lineHeight:1.5}}>
              Diese Benachrichtigung wird dauerhaft entfernt.
            </div>
            <div style={{display:"flex", gap:10}}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex:1, padding:"12px", borderRadius:99,
                  background:"rgba(26,26,24,0.07)", border:"none",
                  color:"#1a1a18", fontSize:13, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete?.(n.id); }}
                style={{
                  flex:1, padding:"12px", borderRadius:99,
                  background:"#DC2626", border:"none",
                  color:"#fff", fontSize:13, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
