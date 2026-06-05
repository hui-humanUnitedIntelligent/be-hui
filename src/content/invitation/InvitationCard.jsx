// src/content/invitation/InvitationCard.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Invitation Feed Card  (Phase 4E)
// Echte soziale Räume — kurzlebig, warm, menschlich.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { HUI } from "../../design/hui.design.js";
import { useInvitationResponse } from "./useInvitationResponse.js";

/* ── Design-Tokens ───────────────────────────────────────────── */
const V = {
  violet:  HUI.COLOR.violet  ?? "#8B5CF6",
  violetL: "rgba(139,92,246,0.10)",
  violetB: "rgba(139,92,246,0.18)",
  teal:    HUI.COLOR.teal    ?? "#16D7C5",
  coral:   HUI.COLOR.coral   ?? "#FF8A6B",
  ink:     HUI.COLOR.ink     ?? "#1A1A2E",
  ink2:    "rgba(26,26,46,0.60)",
  ink3:    "rgba(26,26,46,0.38)",
  cream:   "#F9F7F4",
};

/* ── Vibe-Mapping ─────────────────────────────────────────────── */
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

/* ── Responsive Response-Button ────────────────────────────────── */
function ResponseBtn({ label, emoji, type, current, onRespond, count }) {
  const active = current === type;
  return (
    <button
      onClick={() => onRespond(type)}
      style={{
        flex:         1,
        padding:      "9px 6px",
        borderRadius: 12,
        border:       `1.5px solid ${active ? V.violet : "rgba(139,92,246,0.15)"}`,
        background:   active ? V.violetL : "rgba(248,247,255,0.70)",
        cursor:       "pointer",
        fontSize:     12,
        fontWeight:   active ? 700 : 500,
        color:        active ? V.violet : V.ink2,
        transition:   "all .16s ease",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        gap:          4,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize:14 }}>{emoji}</span>
      <span>{label}</span>
      {count > 0 && (
        <span style={{
          background:   active ? `${V.violet}22` : "rgba(139,92,246,0.08)",
          color:        active ? V.violet : V.ink3,
          fontSize:     10,
          fontWeight:   700,
          padding:      "1px 5px",
          borderRadius: 50,
          minWidth:     16,
          textAlign:    "center",
        }}>{count}</span>
      )}
    </button>
  );
}

/* ── Haupt-Card ───────────────────────────────────────────────── */
export default function InvitationCard({ item, onProfile }) {
  const invId    = item?._raw?.id || item?.id;
  const { myResponse, counts, respond, withdraw } = useInvitationResponse(invId);

  // Primary CTA: "Ich komme gerne mit" → "coming"
  const handlePrimaryJoin = useCallback(() => {
    if (myResponse === "coming") withdraw();
    else respond("coming");
  }, [myResponse, respond, withdraw]);

  if (!item) return null;

  const creator  = item.creator || {};
  const text     = item.caption || item.text || item.title || "";
  const vibe     = item.vibe ? (VIBES[item.vibe] || { e:"✨", l: item.vibe }) : null;
  const location = item.location || item._raw?.location;
  const timeLabel = item._raw?.time_label || item.time || "";

  let expiryHint = "";
  if (item._raw?.expires_at) {
    try {
      const rem = Math.max(0, (new Date(item._raw.expires_at) - Date.now()) / 3600000);
      if (rem < 1)        expiryHint = "Läuft bald ab";
      else if (rem < 6)   expiryHint = `Noch ${Math.floor(rem)}h`;
      else if (rem < 24)  expiryHint = `Noch ${Math.floor(rem)}h`;
      else                expiryHint = `Noch ${Math.floor(rem / 24)}d`;
    } catch { /* noop */ }
  }

  const joined = myResponse === "coming";
  const totalResponses = (counts.coming || 0) + (counts.interested || 0) + (counts.maybe || 0);

  return (
    <div style={{
      background:    "rgba(255,255,255,0.92)",
      borderRadius:  20,
      border:        `1.5px solid ${V.violetB}`,
      margin:        "0 14px",
      overflow:      "hidden",
      boxShadow:     "0 2px 16px rgba(139,92,246,0.08)",
    }}>

      {/* Violet top-line */}
      <div style={{
        height:     2,
        background: `linear-gradient(90deg, transparent 0%, ${V.violet}66 35%, ${V.teal}44 75%, transparent 100%)`,
      }}/>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px 8px" }}>
        <button
          onClick={onProfile}
          style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}
        >
          <div style={{
            width:40, height:40, borderRadius:14,
            background:  creator.avatar ? "transparent" : V.violetL,
            border:      `1.5px solid ${V.violetB}`,
            overflow:    "hidden",
            display:     "flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:700, color:V.violet,
          }}>
            {creator.avatar
              ? <img src={creator.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : (creator.displayName || creator.name || "?")[0]?.toUpperCase()
            }
          </div>
        </button>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:V.ink, lineHeight:1.2 }}>
            {creator.displayName || creator.name || "Jemand"}
          </div>
          <div style={{ fontSize:11.5, color:V.ink3, marginTop:1 }}>
            {item.time || "gerade eben"}
          </div>
        </div>

        {/* Vibe-Pill */}
        {vibe && (
          <div style={{
            padding:      "4px 10px",
            borderRadius: 50,
            background:   V.violetL,
            border:       `1px solid ${V.violetB}`,
            fontSize:     12,
            fontWeight:   600,
            color:        V.violet,
            display:      "flex", alignItems:"center", gap:4,
          }}>
            {vibe.e} {vibe.l}
          </div>
        )}
      </div>

      {/* ── Text ─────────────────────────────────────────────── */}
      <div style={{ padding:"4px 14px 12px" }}>
        <p style={{
          fontSize:   15,
          fontWeight: 500,
          color:      V.ink,
          lineHeight: 1.55,
          margin:     0,
        }}>{text}</p>
      </div>

      {/* ── Meta: Ort + Zeit ────────────────────────────────── */}
      {(location || timeLabel) && (
        <div style={{
          display:    "flex",
          flexWrap:   "wrap",
          gap:        8,
          padding:    "0 14px 12px",
        }}>
          {location && (
            <span style={{
              fontSize:12.5, color:V.ink2,
              display:"flex", alignItems:"center", gap:4,
            }}>
              <span style={{ color:V.violet, fontSize:13 }}>📍</span>
              {location}
            </span>
          )}
          {timeLabel && (
            <span style={{
              fontSize:12.5, color:V.ink2,
              display:"flex", alignItems:"center", gap:4,
            }}>
              <span style={{ color:V.violet, fontSize:13 }}>🕐</span>
              {timeLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Social-Signals ──────────────────────────────────── */}
      {totalResponses > 0 && (
        <div style={{
          padding:    "0 14px 10px",
          fontSize:   12,
          color:      V.ink3,
          display:    "flex", alignItems:"center", gap:6,
        }}>
          <div style={{ display:"flex" }}>
            {/* Kleine Avatare-Reihe (Placeholder-Kreise) */}
            {Array.from({ length: Math.min(3, totalResponses) }).map((_, i) => (
              <div key={i} style={{
                width:20, height:20, borderRadius:"50%",
                background: i === 0 ? `${V.violet}33` : i === 1 ? `${V.teal}33` : `${V.coral}33`,
                border:     "1.5px solid #fff",
                marginLeft: i > 0 ? -6 : 0,
              }}/>
            ))}
          </div>
          <span>
            {counts.coming > 0 && `${counts.coming} ${counts.coming === 1 ? "kommt mit" : "kommen mit"}`}
            {counts.coming > 0 && counts.interested > 0 && " · "}
            {counts.interested > 0 && `${counts.interested} interessiert`}
          </span>
        </div>
      )}

      {/* ── Separator ───────────────────────────────────────── */}
      <div style={{ height:1, background:"rgba(139,92,246,0.06)", margin:"0 14px" }}/>

      {/* ── Response-Buttons ─────────────────────────────────── */}
      <div style={{ padding:"10px 14px" }}>
        {/* Primary CTA */}
        <button
          onClick={handlePrimaryJoin}
          style={{
            width:        "100%",
            padding:      "13px",
            borderRadius: 14,
            border:       "none",
            background:   joined
              ? `linear-gradient(135deg, ${V.teal} 0%, #0EA5E9 100%)`
              : `linear-gradient(135deg, ${V.violet} 0%, #6D28D9 100%)`,
            color:        "white",
            fontSize:     14.5,
            fontWeight:   700,
            cursor:       "pointer",
            letterSpacing: -0.2,
            transition:   "all .2s ease",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            gap:          6,
          }}
        >
          {joined ? "✓ Ich bin dabei!" : "✦ Ich komme gerne mit"}
        </button>

        {/* Secondary: interested + maybe */}
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <ResponseBtn
            label="Interessiert"
            emoji="👀"
            type="interested"
            current={myResponse}
            onRespond={respond}
            count={counts.interested}
          />
          <ResponseBtn
            label="Vielleicht"
            emoji="🤔"
            type="maybe"
            current={myResponse}
            onRespond={respond}
            count={counts.maybe}
          />
        </div>
      </div>

      {/* ── Footer: Ablauf ──────────────────────────────────── */}
      {expiryHint && (
        <div style={{
          padding:    "8px 14px 12px",
          fontSize:   11,
          color:      expiryHint.startsWith("Läuft") ? "#F59E0B" : V.ink3,
          textAlign:  "center",
          letterSpacing: "0.02em",
        }}>
          ⏱ {expiryHint}
        </div>
      )}

    </div>
  );
}