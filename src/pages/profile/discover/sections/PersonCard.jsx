import React, { useState } from "react";
import { T } from "../tokens.js";
import { HUIProfilIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { HUIHeartIcon, HUIChatIcon } from "../../../../design/icons/HuiInteractionIcons.jsx";
import { formatPresence } from "../../../../lib/usePresence.js";
import { personTags } from "../utils.js";
import { fmtImpact } from "../utils.js";

export function PersonCard({ person, onPress, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && person.avatar) ? person.avatar : null;
  const presence = formatPresence(person.last_seen_at);
  const tags = personTags(person, 2);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(person)} style={{
      width:135, flexShrink:0,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"14px 10px 12px",
      background:T.white,
      borderRadius:20,
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      position:"relative",
    }}>
      {/* Avatar + Online-Dot */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%", overflow:"hidden",
          border:`2.5px solid ${T.white}`,
          boxShadow:`0 0 0 2.5px rgba(14,196,184,0.30), 0 4px 14px rgba(26,53,48,0.12)`,
          background:av ? "transparent" : T.tealSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {av ? (
            <img loading="lazy" decoding="async" src={av} alt={person.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <HUIProfilIcon size={26} style={{opacity:0.4, color:"rgba(14,196,184,0.6)"}} />
          )}
        </div>
        {/* Online-Status Dot */}
        <div style={{
          position:"absolute", bottom:2, right:2,
          width:14, height:14, borderRadius:"50%",
          background: presence?.online ? "#22c55e" : presence ? "rgba(200,200,200,0.9)" : "rgba(200,200,200,0.9)",
          border:"2px solid white",
          boxShadow: presence?.online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
        }} className={presence?.online ? "dp-online-pulse" : ""}/>
      </div>

      {/* Name */}
      <div style={{
        fontSize:12.5, fontWeight:700, color:T.ink, textAlign:"center",
        letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:3,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.name}
      </div>

      {/* Bio */}
      <div style={{
        fontSize:10.5, color:T.inkSoft, textAlign:"center", lineHeight:1.4,
        marginBottom:6, fontWeight:400,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.bio}
      </div>

      {/* Online-Status Text */}
      {presence && (
        <div style={{
          fontSize:10, fontWeight:600, marginBottom:6,
          color: presence.online ? "#22c55e" : "rgba(26,53,48,0.42)",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span style={{
            display:"inline-block", width:6, height:6, borderRadius:"50%",
            background:presence.dot, flexShrink:0,
          }}/>
          {presence.label}
        </div>
      )}

      {/* Interesse-Tags */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center", marginBottom:8 }}>
        {tags.map(t => (
          <span key={t} className="dp-tag" style={{ background:"rgba(14,196,184,0.09)", color:T.teal }}>
            {t}
          </span>
        ))}
      </div>

      {/* Location */}
      {person.location && (
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          fontSize:10, color:T.inkFaint, marginBottom:8,
        }}>
          <HUILocationIcon size={9} style={{flexShrink:0}} />
          <span style={{ fontWeight:500 }}>{person.location}</span>
        </div>
      )}

      {/* Impact — stärker hervorgehoben */}
      <div style={{
        display:"flex", alignItems:"center", gap:4,
        background:`linear-gradient(135deg,rgba(14,196,184,0.12),rgba(14,196,184,0.06))`,
        borderRadius:99, padding:"4px 10px",
        border:"1px solid rgba(14,196,184,0.18)",
      }}>
        <span style={{ fontSize:11 }}>⚡</span>
        <span style={{ fontSize:11.5, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
          {fmtImpact(person.impact)} Wirkung
        </span>
      </div>
    </div>
  );
}

