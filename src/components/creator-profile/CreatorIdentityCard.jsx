import { createProfileItem } from "../../lib/factories/createProfileItem.js";
// components/creator-profile/CreatorIdentityCard.jsx
// Name, Identity, Location, Mood pill, Edit button

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = {
  teal:   HUI.COLOR.teal,
  coral:  HUI.COLOR.coral,
  ink:    HUI.COLOR.ink,
  ink2:   HUI.COLOR.ink2,
  muted:  "rgba(80,80,80,0.6)",
  cream:  HUI.COLOR.cream,
};

const MOODS = [
  "Gerade im Atelier",
  "Im kreativen Flow",
  "Arbeitet an neuen Werken",
  "Zwischen Projekten",
  "Offen für Begegnungen",
];

export default function CreatorIdentityCard({ profile, onEdit }) {
  const p = (profile && profile.displayName) ? profile : createProfileItem(profile || {});
  const name    = p?.displayName || "Du";
  const talent  = p?.talent || "Kreative:r";
  const location= p?.location || "München, Deutschland";
  const mood    = p?.currentMood || MOODS[0];
  const isVerified = p?.isVerified;

  return (
    <div style={{ padding:"58px 20px 0", background:"transparent" }}>

      {/* Name row */}
      <div style={{
        display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            marginBottom:2,
          }}>
            <span style={{
              fontSize:26, fontWeight:800, color:C.ink,
              letterSpacing:-0.5, lineHeight:1.15,
              fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
            }}>Du</span>
            {isVerified && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill={C.teal}/>
                <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize:15, color:C.ink2, fontWeight:500, marginBottom:4 }}>{talent}</div>
          {location && (
            <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:10 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill={C.muted}/>
              </svg>
              <span style={{ fontSize:13, color:C.muted }}>{location}</span>
            </div>
          )}

          {/* Mood Pill */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"5px 12px", borderRadius:99,
            background:`rgba(22,215,197,0.10)`,
            border:`1px solid rgba(22,215,197,0.25)`,
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", background:C.teal,
              boxShadow:`0 0 6px ${C.teal}`,
              animation:"pulse-dot 2s ease-in-out infinite",
            }}/>
            <span style={{ fontSize:12, fontWeight:600, color:C.teal }}>{mood}</span>
          </div>
        </div>

        {/* Edit Button */}
        <button onClick={onEdit} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"8px 16px", borderRadius:20,
          background:"rgba(22,215,197,0.07)",
          border:"1px solid rgba(22,215,197,0.22)",
          boxShadow:"none",
          cursor:"pointer",
          fontSize:13, fontWeight:600, color:C.teal,
          whiteSpace:"nowrap",
          transition:"all 0.22s ease",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              stroke={C.teal} strokeWidth="2" strokeLinecap="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Raum gestalten
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 6px #16D7C5; }
          50%      { opacity:0.6; box-shadow:0 0 12px #16D7C5; }
        }
      `}</style>
    </div>
  );
}
