// src/feed/cards/MomentCard.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — MOMENT CARD
// Gefühl: ruhig · intim · menschlich · diary-artig
//
// Design-DNA:
// - Kompakt, kein großes Hero-Bild
// - Viel Weißraum, sanfter Hintergrund
// - Schrift im Fokus, emotional, luftig
// - Kein harter Rahmen — fast wie ein Notizbuch-Eintrag
// ═══════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { HUI } from "../../design/hui.design.js";

/* ── Design Tokens ───────────────────────────────────────────── */
const M = {
  ink:      HUI.COLOR.ink,
  ink2:     "rgba(26,26,46,0.58)",
  ink3:     "rgba(26,26,46,0.36)",
  teal:     HUI.COLOR.teal,
  tealSoft: "rgba(10,191,184,0.09)",
  tealLine: "rgba(10,191,184,0.22)",
  bg:       "rgba(252,251,249,0.95)",   // warm off-white — nicht kalt
  border:   "rgba(10,191,184,0.08)",
};

const MOODS = {
  ruhig:       { e:"🌿", color:"rgba(10,191,184,0.70)"  },
  kreativ:     { e:"🎨", color:"rgba(255,138,107,0.70)" },
  gluecklich:  { e:"☀️", color:"rgba(245,166,35,0.70)"  },
  abenteuer:   { e:"🚀", color:"rgba(139,92,246,0.70)"  },
  tief:        { e:"🌊", color:"rgba(56,189,248,0.70)"  },
  default:     { e:"✦",  color:"rgba(10,191,184,0.55)"  },
};

const CSS = `
  @keyframes moment-in {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:none; }
  }
  .moment-card {
    background: ${M.bg};
    border-radius: 18px;
    border: 1px solid ${M.border};
    box-shadow: 0 1px 4px rgba(0,0,0,0.032), 0 3px 12px rgba(0,0,0,0.038);
    position: relative;
    overflow: hidden;
    animation: moment-in 0.48s cubic-bezier(0.22,1,0.36,1) both;
    transition: box-shadow 220ms ease, border-color 220ms ease, opacity 160ms ease;
  }
  .moment-card:active {
    opacity: 0.88;
  }
  .moment-tap {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    background: none;
    border: none;
    padding: 0;
  }
`;

const EMPTY_CREATOR = Object.freeze({
  id: "", displayName: "Creative Human", avatar: null, talent: "", username: "",
  location: "", verified: false, stats: {}, memberType: "basis",
});

function useMomentCreator(item) {
  return useMemo(() => {
    const profile = createProfileItem({
      id:           item?.creatorId || item?.userId || item?.creator?.id || item?.id,
      display_name: item?.name || item?.creator?.name || item?.creator?.displayName || item?.profile?.name,
      avatar_url:   item?.avatar || item?.creator?.avatar || item?.profile?.avatar_url,
      talent:       item?.talent || item?.creator?.talent || item?.category,
    });
    return profile ?? EMPTY_CREATOR;
  }, [item?.id, item?.creatorId, item?.name, item?.avatar, item?.creator?.id]);
}

export default function MomentCard({ item, onProfile, onReaction, itemReactions = {} }) {
  const creator = useMomentCreator(item);

  if (!item || !item.id) return null;
  console.log("FEED_ITEM_RENDER", { id: item.id, type: item.type, renderPath: "MomentCard" });
  const text    = item.caption || item.text || item.title || "";
  const image   = item.images?.[0] || item.expImg || item.coverUrl || item.media?.[0] || item.cover_url || item._raw?.src || null;
  const mood    = item._raw?.mood ? (MOODS[item._raw.mood] || MOODS.default) : null;
  const timeStr = item.time || "";

  return (
    <>
      <style>{CSS}</style>
      <div className="moment-card" style={{ margin:"0 16px" }}>

        {/* Soft teal breathing line — top */}
        <div style={{
          position: "absolute", top:0, left:28, right:28, height:1,
          background:`linear-gradient(90deg, transparent 0%, ${M.tealLine} 50%, transparent 100%)`,
        }}/>

        {/* Creator row — minimal */}
        <div style={{
          display:"flex", alignItems:"center", gap:9,
          padding:"12px 14px 8px",
        }}>
          <button className="moment-tap" onClick={onProfile} style={{ flexShrink:0 }}>
            <div style={{
              width:  34, height:34, borderRadius:11,
              overflow:"hidden",
              background: M.tealSoft,
              border:`1px solid ${M.tealLine}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:M.teal,
            }}>
              {creator?.avatar
                ? <img src={creator.avatar} alt=""
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : ((creator?.displayName || "?")[0] ?? "?").toUpperCase()
              }
            </div>
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:M.ink, letterSpacing:-0.2 }}>
              {creator?.displayName ?? "Creative Human"}
            </div>
            {creator?.talent && (
              <div style={{ fontSize:11, color:M.ink3, letterSpacing:-0.05 }}>
                {creator.talent}
              </div>
            )}
          </div>

          {/* Stimmung pill — wenn vorhanden */}
          {mood && (
            <div style={{
              fontSize:11, color:mood.color,
              display:"flex", alignItems:"center", gap:3,
              padding:"2px 8px", borderRadius:50,
              background:`${mood.color}12`,
              border:`1px solid ${mood.color}30`,
              fontWeight:600, letterSpacing:"0.01em",
            }}>
              <span style={{ fontSize:13 }}>{mood.e}</span>
            </div>
          )}

          <div style={{ fontSize:10.5, color:M.ink3, flexShrink:0, marginLeft:4 }}>
            {timeStr}
          </div>
        </div>

        {/* Text — emotional, luftig */}
        {text ? (
          <div style={{ padding:"2px 16px 10px" }}>
            <p style={{
              margin:       0,
              fontSize:     15.5,
              fontWeight:   400,
              color:        M.ink2,
              lineHeight:   1.68,
              letterSpacing:"-0.18px",
              fontStyle:    "italic",
            }}>
              {text}
            </p>
          </div>
        ) : null}

        {/* Bild — klein, eingebettet, kein Fullscreen-Hero */}
        {image && (
          <div style={{
            margin:       "0 14px 12px",
            borderRadius: 13,
            overflow:     "hidden",
            height:       140,
          }}>
            <img
              src={image}
              alt=""
              loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            />
          </div>
        )}

        {/* Micro-Reactions — minimal, subtil */}
        <div style={{
          display:     "flex",
          alignItems:  "center",
          gap:         4,
          padding:     "6px 14px 11px",
          borderTop:   `1px solid rgba(10,191,184,0.06)`,
        }}>
          {[
            { key:"resonanz", icon:"◎", label:"berührt" },
            { key:"inspiriert", icon:"✧", label:"inspiriert" },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => onReaction?.(btn.key)}
              className="moment-tap"
              style={{
                display:    "flex", alignItems:"center", gap:4,
                padding:    "5px 9px", borderRadius:50,
                background: itemReactions[btn.key] ? M.tealSoft : "transparent",
                border:     `1px solid ${itemReactions[btn.key] ? M.tealLine : "transparent"}`,
                fontSize:   11.5, color: itemReactions[btn.key] ? M.teal : M.ink3,
                fontWeight: itemReactions[btn.key] ? 600 : 400,
                cursor:     "pointer", transition:"all .15s ease",
              }}
            >
              <span style={{ fontSize:12 }}>{btn.icon}</span>
              <span>{(item[btn.key] || 0) > 0 ? item[btn.key] : btn.label}</span>
            </button>
          ))}

          <div style={{ flex:1 }}/>
          {/* Decorative — kein Like-Counter-Druck */}
          <div style={{ fontSize:10.5, color:`${M.teal}60`, letterSpacing:"0.04em" }}>✦</div>
        </div>
      </div>
    </>
  );
}