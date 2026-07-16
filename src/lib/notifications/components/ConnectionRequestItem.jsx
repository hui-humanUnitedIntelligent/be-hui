import React, { useState } from "react";
import { HUIImpactIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { T } from "../notificationTypes.js";
import { fmtTime } from "../notificationUtils.js";
import { INTENTIONS_MAP } from "../notificationHelpers.js";

export function ConnectionRequestItem({ req, onRespond }) {
  const [state, setState] = useState("idle"); // idle | accepted | declined | later
  const name = req.requester_name || "Jemand";

  if (state === "accepted") return (
    <div style={{padding:"14px 16px", borderBottom:`1px solid ${T.border}`}}>
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"12px 16px", borderRadius:12,
        background:"rgba(22,215,197,0.08)",
        border:`1px solid rgba(22,215,197,0.20)`,
      }}>
        <HUIImpactIcon size={20} style={{opacity:0.5, color:"rgba(14,196,184,0.6)"}} />
        <span style={{fontSize:13.5, fontWeight:600, color:T.teal}}>
          Ihr seid jetzt verbunden.
        </span>
      </div>
    </div>
  );

  if (state === "declined") return null;

  return (
    <div style={{
      padding:"14px 16px",
      borderBottom:`1px solid ${T.border}`,
      background:"rgba(22,215,197,0.03)",
    }}>
      <div style={{display:"flex", gap:12, marginBottom:12}}>
        <div style={{
          width:42, height:42, borderRadius:14, flexShrink:0,
          background:`linear-gradient(135deg,rgba(22,215,197,0.20),rgba(22,215,197,0.10))`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:19,
        }}>
          🤝
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13.5, fontWeight:700, color:T.ink, lineHeight:1.4}}>
            {name} möchte sich verbinden
          </div>
          {req.intention && (
            <div style={{fontSize:12, color:T.inkFaint, marginTop:2}}>
              {INTENTIONS_MAP[req.intention] || req.intention}
            </div>
          )}
          {req.message && (
            <div style={{
              fontSize:12.5, color:T.inkSoft, marginTop:6,
              fontStyle:"italic", lineHeight:1.5,
              padding:"8px 10px",
              background:"rgba(26,26,24,0.04)",
              borderRadius:8, borderLeft:`2px solid ${T.teal}`,
            }}>
              „{req.message}"
            </div>
          )}
          <div style={{fontSize:11, color:"rgba(26,26,24,0.28)", marginTop:6}}>
            {fmtTime(req.created_at)}
          </div>
        </div>
      </div>

      <div style={{display:"flex", gap:8}}>
        <button
          onClick={async () => { await onRespond(req.id, "accept"); setState("accepted"); }}
          style={{
            flex:1, padding:"10px 0",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color:"#fff", border:"none", borderRadius:10,
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Annehmen
        </button>
        <button
          onClick={() => { onRespond(req.id, "later"); setState("later"); }}
          style={{
            flex:1, padding:"10px 0",
            background:"rgba(26,26,24,0.06)", color:T.inkSoft,
            border:"none", borderRadius:10,
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Später
        </button>
        <button
          onClick={() => { onRespond(req.id, "decline"); setState("declined"); }}
          style={{
            flex:1, padding:"10px 0",
            background:"rgba(239,68,68,0.08)", color:"#EF4444",
            border:"none", borderRadius:10,
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
          Ablehnen
        </button>
      </div>
    </div>
  );
}
