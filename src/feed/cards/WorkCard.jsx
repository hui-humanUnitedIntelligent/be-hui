// src/feed/cards/WorkCard.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — WORK CARD
// Gefühl: Galerie · Portfolio · Ausdruck · editorial
//
// Design-DNA:
// - Bild / Werk dominiert — wenig UI-Chrome
// - Minimalistisch, hochwertig
// - Kategorie-Label dezent
// - Caption optional, kurz
// - Medium/Full-width — stärker als Moment, ruhiger als Experience
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { HUI } from "../../design/hui.design.js";

/* ── Tokens ──────────────────────────────────────────────────── */
const W = {
  coral:   HUI.COLOR.coral,
  coralL:  "rgba(255,138,107,0.09)",
  coralB:  "rgba(255,138,107,0.20)",
  ink:     HUI.COLOR.ink,
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.36)",
  bg:      "#FFFFFF",
};

const CATEGORY_COLORS = {
  Fotografie:     { color:"#0891B2",  bg:"rgba(56,189,248,0.09)" },
  Kunst:          { color:"#7C3AED",  bg:"rgba(139,92,246,0.09)" },
  Design:         { color:"#0ABFB8",  bg:"rgba(10,191,184,0.09)" },
  Keramik:        { color:"#B45309",  bg:"rgba(217,119,6,0.09)"  },
  Schmuck:        { color:"#D97706",  bg:"rgba(245,158,11,0.09)" },
  Illustration:   { color:"#7C3AED",  bg:"rgba(139,92,246,0.09)" },
  "Digital Art":  { color:"#0ABFB8",  bg:"rgba(10,191,184,0.09)" },
  Handwerk:       { color:"#B45309",  bg:"rgba(180,83,9,0.09)"   },
  Mode:           { color:"#DB2777",  bg:"rgba(219,39,119,0.09)" },
  Musik:          { color:"#059669",  bg:"rgba(5,150,105,0.09)"  },
  Video:          { color:"#DC2626",  bg:"rgba(220,38,38,0.09)"  },
  default:        { color:"#FB923C",  bg:"rgba(255,138,107,0.09)"},
};

const CSS = `
  @keyframes work-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  .work-card {
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.05);
    overflow: hidden;
    position: relative;
    animation: work-in 0.44s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04),
                inset 0 1px 0 rgba(255,255,255,1);
    transition: box-shadow 220ms ease, border-color 220ms ease;
  }
  .work-card:active {
    box-shadow: 0 1px 6px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.04);
    opacity: 0.92;
  }
  .work-tap {
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    background:none; border:none; padding:0;
  }
`;

function useWorkCreator(item) {
  return useMemo(() => createProfileItem({
    id:           item?.creatorId || item?.userId || item?.id,
    display_name: item?.name || item?.creator?.name || item?.profile?.name,
    avatar_url:   item?.avatar || item?.creator?.avatar || item?.profile?.avatar_url,
    talent:       item?.talent || item?.category,
    is_wirker:    item?.isVerified || item?.creator?.isVerified || false,
  }), [item?.id, item?.creatorId, item?.name, item?.avatar]);
}

export default function WorkCard({ item, onProfile, onReaction, onDetail, itemReactions = {} }) {
  const creator = useWorkCreator(item);
  const [imgErr, setImgErr] = useState(false);

  if (!item) return null;

  const image    = (!imgErr && (
    item.images?.[0] || item.media?.[0] || item.cover_url || item.expImg
  )) || null;
  const title    = item.title || item.expTitle || "";
  const caption  = item.caption || item.description || "";
  const category = item._raw?.category || item.category || item.talent || "";

  const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const isMulti  = Array.isArray(item.images) && item.images.length > 1;

  return (
    <>
      <style>{CSS}</style>
      <div className="work-card" style={{ margin:"0 14px" }}>

        {/* Werk-Bild — dominiert */}
        <div
          style={{ position:"relative", cursor:"pointer" }}
          onClick={() => onDetail?.(item)}
        >
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              onError={() => setImgErr(true)}
              style={{
                width:"100%", display:"block",
                maxHeight:320, objectFit:"cover",
                aspectRatio:"4/3",
              }}
            />
          ) : (
            /* Kein Bild: eleganter Gradient-Placeholder */
            <div style={{
              width:"100%", height:200,
              background:`linear-gradient(135deg, ${W.coralL} 0%, rgba(139,92,246,0.06) 50%, rgba(56,189,248,0.06) 100%)`,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:12,
            }}>
              <div style={{ fontSize:40, opacity:0.35 }}>🎨</div>
              {title && (
                <div style={{
                  fontSize:16, fontWeight:700, color:W.ink,
                  textAlign:"center", padding:"0 24px", lineHeight:1.3,
                }}>{title}</div>
              )}
            </div>
          )}

          {/* Kategorie Badge — top left */}
          {category && (
            <div style={{
              position:"absolute", top:10, left:10, zIndex:2,
              padding:"4px 10px", borderRadius:50,
              background:"rgba(255,255,255,0.92)",
              border:`1px solid ${catStyle.color}30`,
              fontSize:11, fontWeight:700, color:catStyle.color,
              backdropFilter:"blur(8px)",
              WebkitBackdropFilter:"blur(8px)",
              letterSpacing:"0.01em",
            }}>{category}</div>
          )}

          {/* Multi-Image Indicator */}
          {isMulti && (
            <div style={{
              position:"absolute", top:10, right:10, zIndex:2,
              padding:"3px 8px", borderRadius:50,
              background:"rgba(0,0,0,0.45)",
              fontSize:10, color:"white", fontWeight:600,
            }}>1/{item.images.length}</div>
          )}
        </div>

        {/* Footer — minimal */}
        <div style={{ padding:"11px 14px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>

            {/* Creator */}
            <button className="work-tap" onClick={onProfile} style={{ flexShrink:0 }}>
              <div style={{
                width:30, height:30, borderRadius:9,
                overflow:"hidden", background:catStyle.bg,
                border:`1px solid ${catStyle.color}25`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:catStyle.color,
              }}>
                {creator.avatar
                  ? <img src={creator.avatar} alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : (creator.displayName || "?")[0]?.toUpperCase()
                }
              </div>
            </button>

            <div style={{ flex:1, minWidth:0 }}>
              {title && (
                <div style={{
                  fontSize:13.5, fontWeight:700, color:W.ink,
                  letterSpacing:-0.25, lineHeight:1.2,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{title}</div>
              )}
              <div style={{ fontSize:11, color:W.ink3, letterSpacing:-0.05 }}>
                {creator.displayName}
              </div>
            </div>

            {/* Reactions — gallery-stil, mini */}
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <button
                className="work-tap"
                onClick={() => onReaction?.("resonanz")}
                style={{
                  display:"flex", alignItems:"center", gap:3,
                  padding:"5px 9px", borderRadius:50,
                  background: itemReactions.resonanz ? W.coralL : "transparent",
                  border:`1px solid ${itemReactions.resonanz ? W.coralB : "rgba(0,0,0,0.08)"}`,
                  cursor:"pointer",
                  fontSize:12, color: itemReactions.resonanz ? W.coral : W.ink3,
                  fontWeight: itemReactions.resonanz ? 700 : 400,
                  transition:"all .14s ease",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.176 1.75-5.191
                       4.438-5.191 1.787 0 3.481.926 4.562 2.354C11.081 2.926 12.775 2
                       14.562 2 17.25 2 19 4.015 19 7.191c0 4.105-5.37 8.863-11 14.402z"
                    fill={itemReactions.resonanz ? W.coral : "none"}
                    stroke={itemReactions.resonanz ? W.coral : "rgba(26,26,26,0.32)"}
                    strokeWidth="1.8"
                  />
                </svg>
                {(item.resonanz || 0) > 0 && (
                  <span>{item.resonanz}</span>
                )}
              </button>
            </div>
          </div>

          {/* Caption — kurz, editorial */}
          {caption && (
            <p style={{
              margin:"8px 0 0",
              fontSize:12.5, color:W.ink2,
              lineHeight:1.52, letterSpacing:-0.1,
            }}>
              {caption.length > 90 ? caption.slice(0,90) + "…" : caption}
            </p>
          )}
        </div>
      </div>
    </>
  );
}