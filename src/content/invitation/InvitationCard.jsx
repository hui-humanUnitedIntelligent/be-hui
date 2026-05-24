// src/content/invitation/InvitationCard.jsx
// HUI — Feed Card für Einladungen
// Kurzlebig, spontan, Community-orientiert.

import React, { useState } from "react";
import { HUI } from "../../design/hui.design.js";

const V = {
  violet:  HUI.COLOR.violet,
  violetL: "rgba(139,92,246,0.10)",
  violetB: "rgba(139,92,246,0.18)",
  ink:     HUI.COLOR.ink,
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  teal:    HUI.COLOR.teal,
};

const VIBES = {
  spaziergang: { e:"🌿", l:"Spaziergang"  },
  kaffee:      { e:"☕", l:"Kaffee"        },
  sport:       { e:"🏃", l:"Sport"         },
  jam:         { e:"🎸", l:"Jam Session"   },
  kunst:       { e:"🎨", l:"Kreativ"       },
  essen:       { e:"🍜", l:"Essen"         },
  natur:       { e:"🌲", l:"Natur"         },
  sonstiges:   { e:"✨", l:"Sonstiges"     },
};

export default function InvitationCard({ item, onProfile, onReaction }) {
  if (!item) return null;
  const [joined, setJoined] = useState(false);

  const vibe = item.vibe ? (VIBES[item.vibe] || { e:"✨", l:item.vibe }) : null;
  const creator = item.creator || {};
  const text = item.caption || item.text || item.title || "";

  // Zeit bis Ablauf
  let expiryHint = "";
  if (item._raw?.expires_at) {
    try {
      const rem = Math.max(0, (new Date(item._raw.expires_at) - Date.now()) / 3600000);
      expiryHint = rem < 1 ? "Läuft bald ab" : `Noch ${Math.floor(rem)}h`;
    } catch { expiryHint = ""; }
  }

  return (
    <div style={{
      background:   "rgba(255,255,255,0.92)",
      borderRadius: 20,
      border:       `1.5px solid ${V.violetB}`,
      margin:       "0 14px",
      overflow:     "hidden",
      boxShadow:    "0 2px 16px rgba(139,92,246,0.08)",
    }}>
      {/* Violet top accent */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${V.violet}66 40%, ${V.teal}44 80%, transparent 100%)`,
      }}/>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px 8px" }}>
        <button onClick={onProfile} style={{
          background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0,
        }}>
          <div style={{
            width:40, height:40, borderRadius:14,
            background: creator.avatar ? "transparent" : V.violetL,
            border:`1.5px solid ${V.violetB}`,
            overflow:"hidden",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:700, color:V.violet,
          }}>
            {creator.avatar
              ? <img src={creator.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : (creator.displayName || creator.name || "?")[0]?.toUpperCase()
            }
          </div>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:V.ink, letterSpacing:-0.25 }}>
            {creator.displayName || creator.name || "Creator"}
          </div>
          <div style={{ fontSize:11, color:V.ink3 }}>
            {item.time}{expiryHint ? ` · ${expiryHint}` : ""}
          </div>
        </div>
        {/* Vibe badge */}
        {vibe && (
          <div style={{
            padding:"4px 10px", borderRadius:50,
            background:V.violetL, border:`1px solid ${V.violetB}`,
            fontSize:12, color:V.violet, fontWeight:600,
          }}>
            {vibe.e} {vibe.l}
          </div>
        )}
      </div>

      {/* Einladungstext */}
      <div style={{ padding:"4px 16px 12px" }}>
        <p style={{
          margin:0, fontSize:15.5, color:V.ink, lineHeight:1.55,
          letterSpacing:-0.2, fontWeight:500,
          fontStyle:"italic",
        }}>
          „{text}"
        </p>
      </div>

      {/* Meta: Ort + Zeit + Teilnehmer */}
      {(item._raw?.location || item._raw?.time_label || item._raw?.max_participants || item.location) && (
        <div style={{
          display:"flex", flexWrap:"wrap", gap:10,
          padding:"0 16px 12px",
          fontSize:12.5, color:V.ink3,
        }}>
          {(item._raw?.location || item.location) && (
            <span>📍 {item._raw?.location || item.location}</span>
          )}
          {item._raw?.time_label && (
            <span>🕐 {item._raw.time_label}</span>
          )}
          {item._raw?.max_participants && (
            <span>👥 Max. {item._raw.max_participants}</span>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding:"0 14px 14px" }}>
        <button
          onClick={() => setJoined(j => !j)}
          style={{
            width:      "100%",
            padding:    "12px",
            borderRadius: 14,
            border:     "none",
            background: joined
              ? `linear-gradient(135deg, ${V.teal} 0%, #0891B2 100%)`
              : `linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`,
            color:      "white",
            fontSize:   14.5,
            fontWeight: 700,
            cursor:     "pointer",
            letterSpacing: -0.25,
            transition: "background .2s ease",
          }}
        >
          {joined ? "✓ Ich bin dabei!" : "✦ Ich komme gerne mit"}
        </button>
      </div>
    </div>
  );
}
