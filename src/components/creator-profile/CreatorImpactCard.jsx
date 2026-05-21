// components/creator-profile/CreatorImpactCard.jsx
// "Deine Resonanz & Wirkung" — emotional impact section

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", ink2:"#3A3A3A", muted:"rgba(80,80,80,0.6)" };

const MOCK_SUPPORTERS = [
  { id:1, avatar:null, name:"Anna" },
  { id:2, avatar:null, name:"Ben"  },
  { id:3, avatar:null, name:"Mia"  },
];

function AvatarBubble({ person, offset }) {
  const initials = (person.name || "?")[0].toUpperCase();
  const colors   = ["#16D7C5","#FF8A6B","#A78BFA"];
  const bg       = colors[offset % colors.length];
  return (
    <div style={{
      width:34, height:34, borderRadius:"50%",
      background: person.avatar ? `url(${person.avatar}) center/cover` : bg,
      border:"2.5px solid white",
      marginLeft: offset > 0 ? -10 : 0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:12, fontWeight:700, color:"white",
      boxShadow:"0 2px 6px rgba(0,0,0,0.12)",
      flexShrink:0,
    }}>
      {!person.avatar && initials}
    </div>
  );
}

export default function CreatorImpactCard({ profile }) {
  const impactEur    = profile?.impact_eur || 8950;
  const projectCount = 3;
  const impactDisplay = typeof impactEur === "number"
    ? `€${impactEur.toLocaleString("de-DE")}`
    : String(impactEur);

  return (
    <div style={{
      margin:"16px 20px 0",
      background:"white",
      borderRadius:20,
      padding:"18px 18px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{
          width:28, height:28, borderRadius:"50%",
          background:`rgba(22,215,197,0.12)`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 21V10" stroke={C.teal} strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 14Q8 12 7 8Q10 8 12 11" fill={`${C.teal}30`} stroke={C.teal} strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M12 17Q16 15 17 11Q14 11 12 14" fill={`${C.teal}20`} stroke={C.teal} strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize:14, fontWeight:700, color:C.ink }}>Deine Wirkung</span>
      </div>

      {/* Body */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div style={{ flex:1 }}>
          <p style={{ margin:"0 0 12px", fontSize:13.5, color:C.ink2, lineHeight:1.5 }}>
            Durch deine Workshops und Projekte konnten bereits{" "}
            <strong style={{ color:C.teal }}>{projectCount} kreative Projekte</strong>{" "}
            unterstützt werden.
          </p>
          {/* Supporter Avatars */}
          <div style={{ display:"flex", alignItems:"center" }}>
            {MOCK_SUPPORTERS.map((p, i) => (
              <AvatarBubble key={p.id} person={p} offset={i}/>
            ))}
          </div>
        </div>

        {/* Impact Value */}
        <div style={{
          textAlign:"center", padding:"10px 14px",
          background:`linear-gradient(135deg,rgba(22,215,197,0.08),rgba(22,215,197,0.03))`,
          borderRadius:16, marginLeft:16,
          border:`1px solid rgba(22,215,197,0.15)`,
        }}>
          <div style={{ fontSize:20, fontWeight:900, color:C.teal, letterSpacing:-0.5 }}>
            {impactDisplay}
          </div>
          <div style={{ fontSize:10.5, color:C.muted, fontWeight:500, marginTop:2 }}>
            Gesamte Wirkung
          </div>
        </div>
      </div>
    </div>
  );
}
