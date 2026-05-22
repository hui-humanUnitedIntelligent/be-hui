// CreatorPresence.jsx — HUI Creator Presence System v1
// Philosophy: presence should be FELT, not aggressively shown.
// "soft human atmosphere in a shared creative space"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  selectAnimationSpeed,
  selectAmbientGlow,
  selectGlassOpacity,
  selectMotionScale,
  selectAtmosphereLabel,
  isFallbackIdentity,
} from "../lib/intelligence/emotionalIdentity.js";

/* ─── Presence Token System ──────────────────────────────────────────────
   5 emotional presence states. No hard badges, no gamification icons.
   Colors: ultra-soft, never saturated.
   ─────────────────────────────────────────────────────────────────────── */
export const PRESENCE_STATES = {
  creating: {
    id:        "creating",
    color:     "#C4973A",           // warm gold
    colorFaint:"rgba(196,151,58,0.08)",
    colorGlow: "rgba(196,151,58,0.18)",
    label:     "erschafft gerade",
    auraSpeed: "6s",
    ringOpacity: 0.38,
  },
  resonating: {
    id:        "resonating",
    color:     "#16D7C5",           // calm teal
    colorFaint:"rgba(22,215,197,0.07)",
    colorGlow: "rgba(22,215,197,0.16)",
    label:     "inspiriert gerade andere",
    auraSpeed: "8s",
    ringOpacity: 0.32,
  },
  gathering: {
    id:        "gathering",
    color:     "#E8836A",           // soft coral (desaturated)
    colorFaint:"rgba(232,131,106,0.07)",
    colorGlow: "rgba(232,131,106,0.15)",
    label:     "verbindet Menschen",
    auraSpeed: "7s",
    ringOpacity: 0.30,
  },
  reflecting: {
    id:        "reflecting",
    color:     "#8A8AAA",           // soft muted lavender
    colorFaint:"rgba(138,138,170,0.07)",
    colorGlow: "rgba(138,138,170,0.13)",
    label:     "ist stille aktiv",
    auraSpeed: "12s",
    ringOpacity: 0.24,
  },
  welcoming: {
    id:        "welcoming",
    color:     "#7CC8A0",           // gentle sage green
    colorFaint:"rgba(124,200,160,0.07)",
    colorGlow: "rgba(124,200,160,0.13)",
    label:     "heisst Neues willkommen",
    auraSpeed: "10s",
    ringOpacity: 0.28,
  },
};

/* ─── Presence Micro-Moments ─────────────────────────────────────────────
   Rare, soft contextual lines. Not notifications.
   ─────────────────────────────────────────────────────────────────────── */
export const MICRO_MOMENTS = [
  (name) => `${name} bewegt gerade viele Menschen.`,
  (name) => `Dieser Gedanke wird gerade geteilt.`,
  (count) => `${count} Menschen fühlen diesen Moment gerade.`,
  (name) => `${name} inspiriert heute etwas Besonderes.`,
  ()     => `Dieser Moment bewegt die Gemeinschaft.`,
  (name) => `${name} schafft gerade etwas Neues.`,
  ()     => `Etwas entsteht hier gerade.`,
];

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const PRESENCE_CSS = `
  /* ── Aura ring around avatar ───── */
  @keyframes cp-aura-breathe {
    0%,100% { transform:scale(1.00); opacity:0.40; }
    50%     { transform:scale(1.08); opacity:0.72; }
  }
  @keyframes cp-aura-slow {
    0%,100% { transform:scale(1.00) rotate(0deg);   opacity:0.35; }
    33%     { transform:scale(1.06) rotate(120deg);  opacity:0.55; }
    66%     { transform:scale(0.97) rotate(240deg);  opacity:0.42; }
  }
  @keyframes cp-shimmer-ring {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes cp-label-fade {
    from { opacity:0; transform:translateY(3px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cp-micro-appear {
    from { opacity:0; transform:translateY(5px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)   scale(1.00); }
  }
  @keyframes cp-glow-float {
    0%,100% { opacity:0.45; transform:scale(1.00) translateY(0px);   }
    50%     { opacity:0.70; transform:scale(1.10) translateY(-3px);  }
  }
  @keyframes cp-dot-pulse {
    0%,100% { opacity:1;    transform:scale(1.0); }
    50%     { opacity:0.30; transform:scale(0.7); }
  }
  @keyframes cp-card-alive {
    0%,100% { box-shadow: var(--cp-shadow-base); }
    50%     { box-shadow: var(--cp-shadow-glow); }
  }

  /* ── Presence ring (outer) ──────── */
  .cp-ring {
    position:absolute;
    border-radius:50%;
    pointer-events:none;
    border:1.5px solid transparent;
    background-clip:padding-box;
  }
  .cp-ring--aura {
    animation: cp-aura-breathe var(--cp-speed, 8s) ease-in-out infinite;
  }
  .cp-ring--slow {
    animation: cp-aura-slow var(--cp-speed, 12s) ease-in-out infinite;
  }

  /* ── Presence label ─────────────── */
  .cp-presence-label {
    animation: cp-label-fade 0.5s cubic-bezier(0.22,1,0.36,1) both;
    display:inline-flex;
    align-items:center;
    gap:4px;
  }

  /* ── Micro-moment ───────────────── */
  .cp-micro-moment {
    animation: cp-micro-appear 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }

  /* ── Presence indicator dot ─────── */
  .cp-dot {
    border-radius:50%;
    flex-shrink:0;
    animation: cp-dot-pulse var(--cp-speed, 2.8s) ease-in-out infinite;
  }

  /* ── Card alive ─────────────────── */
  .cp-card-alive {
    animation: cp-card-alive var(--cp-speed, 10s) ease-in-out infinite;
  }

  /* ── Ambient glow behind avatar ─── */
  .cp-avatar-glow {
    position:absolute;
    border-radius:50%;
    pointer-events:none;
    filter:blur(10px);
    animation: cp-glow-float var(--cp-speed, 8s) ease-in-out infinite;
  }
`;

let cpStyleInjected = false;
function injectPresenceCSS() {
  if (cpStyleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = PRESENCE_CSS;
  document.head.appendChild(el);
  cpStyleInjected = true;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: PresenceAvatar
   Wraps an avatar image with subtle atmospheric presence rings.
   Used in CreatorHeader and PersonCard.
   ═══════════════════════════════════════════════════════════════════════════ */
export function PresenceAvatar({
  src,
  name,
  size = 50,
  presenceState = null,   // null | "creating" | "resonating" | "gathering" | "reflecting" | "welcoming"
  isVerified = false,
  isLive = false,
  emotionalIdentity = null,   // optional — enriches ring speed + glow
  className = "",
}) {
  useEffect(() => { injectPresenceCSS(); }, []);

  const ps = presenceState ? PRESENCE_STATES[presenceState] : null;

  // Identity-aware visual overrides (only applied if identity present + not fallback)
  const hasIdentity  = emotionalIdentity && !isFallbackIdentity(emotionalIdentity);
  const auraSpeed    = hasIdentity ? selectAnimationSpeed(emotionalIdentity) : ps?.auraSpeed;
  const glowColor    = hasIdentity ? selectAmbientGlow(emotionalIdentity)    : ps?.colorGlow;
  const ringOpacity  = hasIdentity
    ? (emotionalIdentity.ringOpacity ?? ps?.ringOpacity ?? 0.28)
    : (ps?.ringOpacity ?? 0.28);

  return (
    <div style={{ position:"relative", flexShrink:0, width:size, height:size }}>

      {/* ── Ambient glow layer (behind avatar) */}
      {ps && (
        <div className="cp-avatar-glow" style={{
          width: size + 16, height: size + 16,
          top: -8, left: -8,
          background: ps.colorGlow,
          "--cp-speed": ps.auraSpeed,
        }}/>
      )}

      {/* ── Outer atmospheric ring (largest) */}
      {ps && (
        <div className="cp-ring cp-ring--slow" style={{
          inset: -6, zIndex: 0,
          border: `1.5px solid ${ps.color}`,
          opacity: ringOpacity * 0.6,
          "--cp-speed": auraSpeed || ps.auraSpeed,
        }}/>
      )}

      {/* ── Inner presence ring */}
      {ps && (
        <div className="cp-ring cp-ring--aura" style={{
          inset: -3, zIndex: 0,
          border: `1.5px solid ${ps.color}`,
          opacity: ringOpacity,
          "--cp-speed": auraSpeed || ps.auraSpeed,
        }}/>
      )}

      {/* ── Avatar itself */}
      <div style={{
        width:  size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        background: `linear-gradient(135deg, #16D7C5, #FF8A6B)`,
        boxShadow: ps
          ? `0 0 0 2px rgba(255,255,255,0.92), 0 2px 12px ${glowColor || ps.colorGlow}`
          : "0 0 0 2px rgba(255,255,255,0.92), 0 2px 10px rgba(22,215,197,0.14)",
        flexShrink: 0,
        transition: "box-shadow 0.6s ease",
      }}>
        {src
          ? <img src={src} alt={name || ""}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              loading="lazy"/>
          : <div style={{
              width:"100%", height:"100%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: Math.round(size * 0.38), fontWeight:700, color:"white",
            }}>
              {(name || "?")[0].toUpperCase()}
            </div>
        }
      </div>

      {/* ── Live indicator (always red, tiny dot) */}
      {isLive && (
        <div style={{
          position:"absolute", bottom:1, right:1, zIndex:2,
          width:11, height:11, borderRadius:"50%",
          background:"#FF4D4D", border:"2px solid white",
          boxShadow:"0 0 5px rgba(255,77,77,0.45)",
        }}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: PresenceLabel
   The emotional state label shown under creator identity.
   Subtle, small, cinematic.
   ═══════════════════════════════════════════════════════════════════════════ */
export function PresenceLabel({ presenceState, className = "" }) {
  useEffect(() => { injectPresenceCSS(); }, []);
  if (!presenceState) return null;

  const ps = PRESENCE_STATES[presenceState];
  if (!ps) return null;

  return (
    <div className={`cp-presence-label ${className}`} style={{
      marginTop: 3,
      fontSize: 10.5,
      color: ps.color,
      fontWeight: 500,
      letterSpacing: "-0.05px",
      lineHeight: 1.2,
      opacity: 0.82,
    }}>
      {/* Tiny breathing dot */}
      <div className="cp-dot" style={{
        width: 4, height: 4,
        background: ps.color,
        "--cp-speed": ps.auraSpeed,
      }}/>
      <span style={{ fontStyle:"italic" }}>{ps.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: CreatorPresenceHeader
   Full upgraded creator identity block with presence atmosphere.
   Replaces the plain CreatorHeader in cards.
   ═══════════════════════════════════════════════════════════════════════════ */
export function CreatorPresenceHeader({
  item,
  creator,
  onProfile,
  compact   = false,
  microMoment = null,  // optional string shown below header
}) {
  useEffect(() => { injectPresenceCSS(); }, []);

  const ps = item.presenceState ? PRESENCE_STATES[item.presenceState] : null;
  const avatarSize = compact ? 44 : 50;

  return (
    <div style={{ position:"relative" }}>
      {/* ── Card atmosphere tint when presence active */}
      {ps && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"100%",
          background: `linear-gradient(180deg, ${ps.colorFaint} 0%, transparent 100%)`,
          pointerEvents:"none", borderRadius:"inherit", zIndex:0,
        }}/>
      )}

      <button onClick={onProfile} className="hf-tap" style={{
        background:"none", border:"none", cursor:"pointer", padding:0,
        width:"100%", display:"block", textAlign:"left",
        position:"relative", zIndex:1,
      }}>
        <div style={{
          display:"flex", alignItems:"flex-start",
          padding: compact ? "11px 14px 9px" : "13px 14px 11px",
          gap: 11,
        }}>

          {/* Avatar with presence rings */}
          <PresenceAvatar
            src={creator.avatar}
            name={creator.displayName}
            size={avatarSize}
            presenceState={item.presenceState || null}
            isVerified={creator.isVerified}
            isLive={item.isLive}
          />

          {/* Identity block */}
          <div style={{ flex:1, minWidth:0, paddingTop:2 }}>

            {/* Name + verified */}
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:1 }}>
              <span style={{
                fontSize: compact ? 13.5 : 15,
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: -0.28,
                lineHeight: 1.18,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {creator.displayName}
              </span>
              {creator.isVerified && (
                <span style={{
                  fontSize: 10.5, color:"#16D7C5", fontWeight:700, flexShrink:0,
                }}>{"✦"}</span>
              )}
            </div>

            {/* Talent · location */}
            <div style={{
              fontSize: 11.5,
              color: "rgba(26,26,26,0.40)",
              lineHeight: 1.28,
              display:"flex", alignItems:"center", gap:4,
              overflow:"hidden",
            }}>
              {creator.talent && (
                <span style={{
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  maxWidth: 90,
                }}>{creator.talent}</span>
              )}
              {creator.talent && creator.location && (
                <span style={{ color:"rgba(26,26,26,0.20)", flexShrink:0 }}>{"·"}</span>
              )}
              {creator.location && (
                <span style={{
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  color:"rgba(26,26,26,0.28)",
                }}>{creator.location}</span>
              )}
            </div>

            {/* Presence label — only if presenceState set */}
            {item.presenceState && (
              <PresenceLabel presenceState={item.presenceState} />
            )}
          </div>

          {/* Time + menu */}
          <div style={{
            display:"flex", flexDirection:"column",
            alignItems:"flex-end", gap:4, flexShrink:0, paddingTop:1,
          }}>
            <span style={{ fontSize:10.5, color:"rgba(26,26,26,0.22)" }}>
              {item.time || ""}
            </span>
            <button className="hf-tap" onClick={e => e.stopPropagation()} style={{
              background:"none", border:"none", cursor:"pointer",
              padding:"2px 3px", color:"rgba(26,26,26,0.22)",
              fontSize:15, letterSpacing:1.5, lineHeight:1,
            }}>{"···"}</button>
          </div>
        </div>
      </button>

      {/* ── Micro-moment — rare and soft */}
      {microMoment && (
        <MicroMoment text={microMoment} presenceState={item.presenceState} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: MicroMoment
   A soft ambient line that appears rarely below creator headers.
   "3 Menschen fühlen diesen Gedanken gerade."
   NOT a notification. NOT a counter. Just atmosphere.
   ═══════════════════════════════════════════════════════════════════════════ */
export function MicroMoment({ text, presenceState = null }) {
  useEffect(() => { injectPresenceCSS(); }, []);

  const ps = presenceState ? PRESENCE_STATES[presenceState] : null;
  const color = ps?.color || "rgba(22,215,197,0.85)";
  const bg    = ps?.colorFaint || "rgba(22,215,197,0.05)";

  return (
    <div className="cp-micro-moment" style={{
      margin: "0 14px 10px",
      padding: "7px 12px",
      borderRadius: 10,
      background: bg,
      border: `1px solid ${ps?.colorGlow || "rgba(22,215,197,0.10)"}`,
      display: "flex",
      alignItems: "center",
      gap: 7,
    }}>
      {/* Soft ambient glow dot */}
      <div style={{
        width:5, height:5, borderRadius:"50%",
        background: color,
        flexShrink:0, opacity:0.65,
        animation: "cp-dot-pulse 3s ease-in-out infinite",
      }}/>
      <span style={{
        fontSize: 11.5,
        color: "rgba(26,26,26,0.48)",
        fontStyle: "italic",
        lineHeight: 1.4,
        letterSpacing: -0.08,
      }}>
        {text}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: PresencePersonCard
   Upgraded PersonCard for MenschenSection.
   Atmospheric creator energy tint + living card feeling.
   ═══════════════════════════════════════════════════════════════════════════ */
export function PresencePersonCard({ person, onPress }) {
  useEffect(() => { injectPresenceCSS(); }, []);
  const [following, setFollowing] = useState(false);

  const ps = person.presenceState ? PRESENCE_STATES[person.presenceState] : null;

  return (
    <div
      className={ps ? "cp-card-alive" : ""}
      style={{
        width:148, flexShrink:0,
        background:"rgba(255,255,255,0.80)",
        backdropFilter:"blur(18px) saturate(1.35)",
        WebkitBackdropFilter:"blur(18px) saturate(1.35)",
        borderRadius:16,
        boxShadow: ps
          ? `0 2px 14px ${ps.colorGlow}, 0 1px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.88)`
          : "0 2px 14px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.028), inset 0 1px 0 rgba(255,255,255,0.88)",
        border: ps
          ? `1px solid ${ps.colorFaint}`
          : "1px solid rgba(255,255,255,0.58)",
        overflow:"hidden",
        position:"relative",
        "--cp-shadow-base": ps
          ? `0 2px 14px ${ps.colorGlow}, 0 1px 4px rgba(0,0,0,0.03)`
          : "0 2px 14px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.028)",
        "--cp-shadow-glow": ps
          ? `0 4px 22px ${ps.colorGlow}, 0 1px 4px rgba(0,0,0,0.04)`
          : "0 2px 14px rgba(0,0,0,0.055)",
        "--cp-speed": "10s",
        transition:"box-shadow 0.5s ease",
      }}>

      {/* Presence atmosphere tint */}
      {ps && (
        <div style={{
          position:"absolute", inset:0, zIndex:0,
          background:`linear-gradient(135deg, ${ps.colorFaint} 0%, transparent 60%)`,
          pointerEvents:"none",
        }}/>
      )}

      {/* Image area */}
      <button onClick={onPress} className="hf-tap" style={{
        background:"none", border:"none", cursor:"pointer",
        padding:0, width:"100%", display:"block", position:"relative", zIndex:1,
      }}>
        <div style={{ height:108, position:"relative", overflow:"hidden" }}>
          <img src={person.avatar} alt={person.name} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>

          {/* Gradient overlay */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.52) 100%)",
          }}/>

          {/* Presence state pill — emotional, not technical */}
          {ps ? (
            <div style={{
              position:"absolute", bottom:7, left:7,
              background:"rgba(255,255,255,0.14)",
              backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
              border:`1px solid ${ps.colorGlow}`,
              borderRadius:99, padding:"2.5px 8px",
              fontSize:9, fontWeight:600, color:ps.color,
              display:"flex", alignItems:"center", gap:3,
            }}>
              <div className="cp-dot" style={{
                width:4.5, height:4.5, background:ps.color,
                "--cp-speed": ps.auraSpeed,
              }}/>
              {ps.label}
            </div>
          ) : person.status ? (
            <div style={{
              position:"absolute", bottom:7, left:7,
              background:"rgba(255,255,255,0.14)",
              backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.20)",
              borderRadius:99, padding:"2.5px 7px",
              fontSize:9, fontWeight:600, color:"white",
              display:"flex", alignItems:"center", gap:3,
            }}>
              <div style={{
                width:4.5, height:4.5, borderRadius:"50%",
                background: person.status === "Verfügbar" ? "#4ADE80" : "#FF8A6B",
              }}/>
              {person.status}
            </div>
          ) : null}
        </div>
      </button>

      {/* Info */}
      <div style={{ padding:"9px 10px 11px", position:"relative", zIndex:1 }}>
        <div style={{
          fontSize:12.5, fontWeight:700, color:"#1A1A1A",
          letterSpacing:-0.2, marginBottom:1,
        }}>{person.name}</div>
        <div style={{ fontSize:11, color:"rgba(26,26,26,0.42)", marginBottom:7, lineHeight:1.3 }}>
          {person.role}
          {person.location && (
            <span style={{ color:"rgba(26,26,26,0.24)" }}> {"·"} {person.location}</span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
          {(person.tags || []).slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize:9.5, fontWeight:600,
              color: ps ? ps.color : "#16D7C5",
              background: ps ? ps.colorFaint : "rgba(22,215,197,0.07)",
              borderRadius:99, padding:"2px 6px",
            }}>{tag}</span>
          ))}
        </div>

        {/* Follow button */}
        <button
          onClick={() => setFollowing(f => !f)}
          className="hf-tap"
          style={{
            width:"100%",
            background: following
              ? (ps ? ps.colorFaint : "rgba(22,215,197,0.08)")
              : ps
                ? `linear-gradient(135deg, ${ps.color}CC, ${ps.color}99)`
                : "linear-gradient(135deg, #16D7C5, #11C5B7)",
            color: following ? (ps ? ps.color : "#16D7C5") : "white",
            border: following ? `1.5px solid ${ps ? ps.colorGlow : "rgba(22,215,197,0.13)"}` : "none",
            borderRadius:99, padding:"6px 0",
            fontSize:11, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            letterSpacing:-0.05,
            transition:"all 0.28s ease",
          }}>
          {following ? "Begleite ich ✦" : "Begleiten"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY: derivePresenceState
   Maps item metadata to a presence state intelligently.
   Pure function — no side effects.
   ═══════════════════════════════════════════════════════════════════════════ */
export function derivePresenceState(item) {
  // Explicit override
  if (item.presenceState && PRESENCE_STATES[item.presenceState]) {
    return item.presenceState;
  }
  // Derive from type
  if (item.type === "work_upload" || item.type === "werk")    return "creating";
  if (item.type === "note"        || item.type === "thought") return "reflecting";
  if (item.type === "experience"  || item.type === "event")   return "gathering";
  if (item.type === "impact")                                  return "welcoming";
  if ((item.resonanz || 0) > 20)                              return "resonating";
  // No state — let card breathe without presence
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY: deriveMicroMoment
   Returns an optional soft micro-moment text for a card.
   Only triggers for high-resonance or specific types.
   Rarity: only ~30% of eligible cards get a moment.
   ═══════════════════════════════════════════════════════════════════════════ */
export function deriveMicroMoment(item, idx) {
  // Rarity gate: deterministic but sparse
  const hash = (item.id || "").split("").reduce((a,c) => a + c.charCodeAt(0), idx * 7);
  if (hash % 3 !== 0) return null;   // ~33% trigger rate

  const name    = item.name || "Jemand";
  const viewers = (item.viewerExtra || 0) + (item.viewers?.length || 0);

  const pool = [
    viewers > 5  ? `${viewers} Menschen erleben diesen Moment gerade.` : null,
    (item.resonanz || 0) > 25 ? `${name} inspiriert heute viele Menschen.` : null,
    item.type === "experience" ? "Dieser Ort verbindet Menschen gerade." : null,
    item.type === "note"       ? "Dieser Gedanke findet gerade Resonanz." : null,
    "Etwas Echtes entsteht hier gerade.",
  ].filter(Boolean);

  if (pool.length === 0) return null;
  return pool[hash % pool.length];
}
