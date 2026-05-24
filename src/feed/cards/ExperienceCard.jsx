// src/feed/cards/ExperienceCard.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — EXPERIENCE CARD
// Gefühl: wertvoll · lebendig · einladend · echtes Ereignis
//
// Design-DNA:
// - Dominantes Hero-Bild (200px+)
// - Klare CTA — Datum, Ort, Preis sichtbar
// - Tiefe durch Gradient-Overlay auf Bild
// - Größte Card im Feed — zieht Aufmerksamkeit
// - Cinematic reveal animation
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { HUI } from "../../design/hui.design.js";

/* ── Tokens ──────────────────────────────────────────────────── */
const E = {
  teal:    HUI.COLOR.teal,
  coral:   HUI.COLOR.coral,
  coralL:  "rgba(255,138,107,0.12)",
  coralB:  "rgba(255,138,107,0.22)",
  blue:    "#38BDF8",
  blueL:   "rgba(56,189,248,0.10)",
  blueB:   "rgba(56,189,248,0.22)",
  ink:     HUI.COLOR.ink,
  ink2:    "rgba(26,26,46,0.68)",
  ink3:    "rgba(26,26,46,0.40)",
  bg:      "#FFFFFF",
  bgWarm:  "rgba(255,252,249,0.98)",
};

const CSS = `
  @keyframes exp-reveal {
    from { opacity:0; transform:translateY(16px) scale(.98); }
    to   { opacity:1; transform:none; }
  }
  @keyframes exp-glow {
    0%,100% { box-shadow: 0 6px 28px rgba(255,138,107,0.10), 0 2px 8px rgba(0,0,0,0.05); }
    50%     { box-shadow: 0 8px 36px rgba(255,138,107,0.16), 0 3px 10px rgba(0,0,0,0.06); }
  }
  .exp-card {
    background: ${E.bgWarm};
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,0.70);
    overflow: hidden;
    position: relative;
    animation: exp-reveal 0.52s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 6px 28px rgba(255,138,107,0.10), 0 2px 8px rgba(0,0,0,0.05),
                inset 0 1px 0 rgba(255,255,255,0.90);
    transition: transform 0.42s cubic-bezier(0.22,1,0.36,1), box-shadow 0.42s ease;
  }
  .exp-card:active {
    transform: scale(0.984) translateY(1.5px);
    box-shadow: 0 10px 40px rgba(255,138,107,0.14), 0 3px 10px rgba(0,0,0,0.07);
  }
  .exp-tap {
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    background:none; border:none; padding:0;
    transition: transform .14s, opacity .14s;
  }
  .exp-tap:active { transform:scale(.93); opacity:.72; }
  .exp-cta-btn {
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .exp-cta-btn:active { transform:scale(.95); }
`;

function useExpCreator(item) {
  return useMemo(() => createProfileItem({
    id:           item?.creatorId || item?.userId || item?.id,
    display_name: item?.name || item?.creator?.name || item?.profile?.name,
    avatar_url:   item?.avatar || item?.creator?.avatar || item?.profile?.avatar_url,
    talent:       item?.talent || item?.category,
    is_wirker:    item?.isVerified || item?.creator?.isVerified || false,
  }), [item?.id, item?.creatorId, item?.name, item?.avatar, item?.isVerified]);
}

export default function ExperienceCard({ item, onProfile, onReaction, onBook, itemReactions = {} }) {
  if (!item) return null;
  const creator = useExpCreator(item);
  const [imgErr, setImgErr] = useState(false);

  // Bild-Extraktion
  const image = (!imgErr && (
    item.expImg || item.images?.[0] || item.media?.[0] || item.cover_url
  )) || null;

  // Meta
  const title    = item.expTitle || item.title || "Erlebnis";
  const desc     = item.expMeta  || item.description || item.caption || "";
  const price    = item._raw?.price || item.price;
  const date     = item._raw?.date  || item._raw?.event_date || item.date;
  const location = item._raw?.location || item.location;
  const maxP     = item._raw?.max_participants || item._raw?.capacity;

  const hasCtaMeta = price || date || location || maxP;

  // Preis-Formatierung
  const priceStr = price
    ? (parseFloat(price) === 0 ? "Kostenlos" : `€${parseFloat(price).toFixed(0)}`)
    : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="exp-card" style={{ margin:"0 12px" }}>

        {/* Coral-Teal accent oben */}
        <div style={{
          height:2, position:"absolute", top:0, left:0, right:0, zIndex:2,
          background:`linear-gradient(90deg, transparent 0%, ${E.coral}55 35%, ${E.teal}40 70%, transparent 100%)`,
        }}/>

        {/* Hero Image — dominant */}
        <div style={{ position:"relative", height:200 }}>
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            />
          ) : (
            /* Gradient-Fallback mit Titel */
            <div style={{
              width:"100%", height:"100%",
              background:`linear-gradient(135deg, ${E.teal}30 0%, ${E.coral}22 50%, #38BDF822 100%)`,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:10,
            }}>
              <div style={{ fontSize:44, opacity:0.45 }}>📅</div>
              <div style={{
                fontSize:16, fontWeight:700, color:E.ink,
                textAlign:"center", padding:"0 28px", lineHeight:1.3,
              }}>{title}</div>
            </div>
          )}

          {/* Gradient Overlay — Tiefe */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:"55%",
            background:"linear-gradient(to top, rgba(20,20,34,0.72) 0%, transparent 100%)",
            pointerEvents:"none",
          }}/>

          {/* Preis-Badge — oben rechts */}
          {priceStr && (
            <div style={{
              position:"absolute", top:12, right:12, zIndex:3,
              padding:"5px 11px", borderRadius:50,
              background:"rgba(255,252,249,0.94)",
              border:`1px solid ${E.coralB}`,
              fontSize:12, fontWeight:800, color:E.coral,
              backdropFilter:"blur(8px)",
              WebkitBackdropFilter:"blur(8px)",
            }}>
              {priceStr}
            </div>
          )}

          {/* Creator avatar — über Hero */}
          <button className="exp-tap" onClick={onProfile} style={{
            position:"absolute", bottom:12, left:13, zIndex:3,
            display:"flex", alignItems:"center", gap:7,
          }}>
            <div style={{
              width:34, height:34, borderRadius:10,
              overflow:"hidden",
              border:"2px solid rgba(255,255,255,0.85)",
              background:"rgba(255,255,255,0.20)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"white",
              flexShrink:0,
            }}>
              {creator.avatar
                ? <img src={creator.avatar} alt=""
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : (creator.displayName || "?")[0]?.toUpperCase()
              }
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.96)", letterSpacing:-0.1 }}>
                {creator.displayName}
              </div>
              {creator.isVerified && (
                <div style={{ fontSize:10, color:`${E.teal}`, fontWeight:700 }}>✦ Wirker</div>
              )}
            </div>
          </button>

          {/* Datum-Badge — unten rechts */}
          {date && (
            <div style={{
              position:"absolute", bottom:12, right:13, zIndex:3,
              padding:"4px 9px", borderRadius:50,
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(8px)",
              WebkitBackdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,0.28)",
              fontSize:11, color:"rgba(255,255,255,0.92)", fontWeight:600,
            }}>
              📅 {typeof date === "string" ? date.slice(0,10) : date}
            </div>
          )}
        </div>

        {/* Content Block */}
        <div style={{ padding:"14px 16px 0" }}>
          <div style={{
            fontSize:17, fontWeight:800, color:E.ink, letterSpacing:-0.4, lineHeight:1.22,
            marginBottom:5,
          }}>{title}</div>

          {desc && (
            <p style={{
              margin:"0 0 10px", fontSize:13.5, color:E.ink2,
              lineHeight:1.55, letterSpacing:-0.12,
            }}>{desc.length > 120 ? desc.slice(0,120) + "…" : desc}</p>
          )}

          {/* Meta-Pills */}
          {hasCtaMeta && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
              {location && (
                <span style={{
                  padding:"4px 10px", borderRadius:50,
                  background:"rgba(56,189,248,0.08)",
                  border:`1px solid ${E.blueB}`,
                  fontSize:11.5, color:"#0891B2", fontWeight:600,
                }}>📍 {location}</span>
              )}
              {maxP && (
                <span style={{
                  padding:"4px 10px", borderRadius:50,
                  background:"rgba(10,191,184,0.08)",
                  border:`1px solid rgba(10,191,184,0.20)`,
                  fontSize:11.5, color:E.teal, fontWeight:600,
                }}>👥 Max. {maxP}</span>
              )}
            </div>
          )}
        </div>

        {/* CTA + Reactions */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"8px 14px 14px",
          borderTop:`1px solid rgba(255,138,107,0.08)`,
        }}>
          {/* Jetzt anmelden */}
          <button
            className="exp-cta-btn exp-tap"
            onClick={() => onBook?.(item)}
            style={{
              flex:1, padding:"11px",
              borderRadius:13, border:"none",
              background:`linear-gradient(135deg, ${E.coral} 0%, #FB923C 100%)`,
              color:"white", fontSize:14, fontWeight:700,
              cursor:"pointer", letterSpacing:-0.25,
            }}
          >
            Erlebnis buchen ›
          </button>

          {/* Resonanz */}
          <button
            onClick={() => onReaction?.("resonanz")}
            className="exp-tap"
            style={{
              padding:"11px 13px", borderRadius:13,
              border:`1.5px solid ${itemReactions.resonanz ? E.coral+"66" : E.coralB}`,
              background: itemReactions.resonanz ? E.coralL : "transparent",
              cursor:"pointer",
              display:"flex", alignItems:"center", gap:4,
              fontSize:12.5, color: itemReactions.resonanz ? E.coral : E.ink3, fontWeight:600,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.176 1.75-5.191
                   4.438-5.191 1.787 0 3.481.926 4.562 2.354C11.081 2.926 12.775 2
                   14.562 2 17.25 2 19 4.015 19 7.191c0 4.105-5.37 8.863-11 14.402z"
                fill={itemReactions.resonanz ? E.coral : "none"}
                stroke={itemReactions.resonanz ? E.coral : "rgba(26,26,26,0.35)"}
                strokeWidth="1.6"
              />
            </svg>
            <span>{(item.resonanz || 0) > 0 ? item.resonanz : ""}</span>
          </button>
        </div>
      </div>
    </>
  );
}
