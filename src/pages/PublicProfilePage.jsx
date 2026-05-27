// src/pages/PublicProfilePage.jsx — HUI Phase 1.5
// "A calm digital aura of a meaningful person."
// ══════════════════════════════════════════════
// ARCHITECTURE: Fully independent. No owner mode. No dashboard logic.
// USAGE: <PublicProfilePage profileId="uuid" onClose={() => {}} />
// ══════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useConnectionEngine, useFollow } from "../core/HuiConnectionEngine.jsx";

// ── Design tokens ───────────────────────────────────────────────
const T = {
  // Colors
  bg:         "#F7F6F3",       // warm off-white
  bgCard:     "#FFFFFF",
  teal:       "#0EC4B8",
  tealSoft:   "rgba(14,196,184,0.12)",
  tealMid:    "rgba(14,196,184,0.22)",
  coral:      "#FF6B52",
  coralSoft:  "rgba(255,107,82,0.10)",
  ink:        "#0F1117",
  inkSoft:    "rgba(15,17,23,0.55)",
  inkFaint:   "rgba(15,17,23,0.28)",
  border:     "rgba(15,17,23,0.07)",
  borderMid:  "rgba(15,17,23,0.11)",

  // Spacing
  px: 20,

  // Radius
  r4:  4, r8: 8, r12: 12, r16: 16, r20: 20, r99: 99,

  // Shadows
  cardShadow: "0 2px 12px rgba(15,17,23,0.06), 0 1px 3px rgba(15,17,23,0.04)",
  floatShadow:"0 8px 32px rgba(15,17,23,0.10), 0 2px 8px rgba(15,17,23,0.06)",
  glowTeal:   "0 4px 20px rgba(14,196,184,0.28)",
  glowCoral:  "0 4px 20px rgba(255,107,82,0.22)",
};

// ── CSS ─────────────────────────────────────────────────────────
const CSS = `
  .ppp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif; }
  .ppp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ppp-scroll::-webkit-scrollbar { display:none; }
  @keyframes ppp-breathe { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.012) translateY(-2px)} }
  @keyframes ppp-pulse-ring { 0%{transform:scale(1);opacity:.6} 70%{transform:scale(1.32);opacity:0} 100%{transform:scale(1.32);opacity:0} }
  @keyframes ppp-fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ppp-blob-drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-8px) scale(1.05)} }
  @keyframes ppp-shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
  .ppp-avatar-ring { animation: ppp-breathe 4.8s ease-in-out infinite; }
  .ppp-blob { animation: ppp-blob-drift 12s ease-in-out infinite; }
  .ppp-blob-slow { animation: ppp-blob-drift 18s ease-in-out infinite reverse; }
  .ppp-skeleton {
    background: linear-gradient(90deg,rgba(15,17,23,.06) 25%,rgba(15,17,23,.10) 50%,rgba(15,17,23,.06) 75%);
    background-size: 200% 100%;
    animation: ppp-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  .ppp-btn-press { transition: transform .12s cubic-bezier(.22,1,.36,1), opacity .12s ease; }
  .ppp-btn-press:active { transform:scale(0.93); opacity:0.78; }
  .ppp-section-in { animation: ppp-fade-up .55s ease both; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const safeStr = (v, fb = "") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb = 0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)           => (Array.isArray(v) ? v : []);
const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1).replace(".0","")}K` : String(n);

function useEntry(delay = 0, threshold = 0.05) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const style = {
    opacity: vis ? 1 : 0,
    transform: vis ? "none" : "translateY(14px)",
    transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
  };
  return { ref, style };
}

// ── Supabase profile load ────────────────────────────────────────
async function loadPublicProfile(profileId) {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, header_img, location, verified, is_member, role, impact_eur, followers, bookings, interests, current_work, has_talent_profile, membership_type")
      .eq("id", profileId)
      .single();
    if (error) {
      // Try by username
      const { data: d2 } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, header_img, location, verified, is_member, role, impact_eur, followers, bookings, interests, current_work, has_talent_profile, membership_type")
        .eq("username", profileId)
        .single();
      return d2 || null;
    }
    return data;
  } catch { return null; }
}

// ── Fallback data ────────────────────────────────────────────────
const FALLBACK_IMG = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FALLBACK_AVT = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const DEFAULT_VALUES = [
  { icon:"🌿", label:"Natur",         color:"rgba(34,197,94,0.10)" },
  { icon:"✨", label:"Kreativität",   color:"rgba(14,196,184,0.10)" },
  { icon:"👥", label:"Gemeinschaft",  color:"rgba(99,102,241,0.10)" },
  { icon:"🤍", label:"Achtsamkeit",   color:T.coralSoft },
  { icon:"🐾", label:"Tiere",         color:"rgba(245,158,11,0.10)" },
  { icon:"🎵", label:"Musik",         color:"rgba(139,92,246,0.10)" },
];

const SEED_MOMENTS = [
  { id:"m1", caption:"Neues Werk entsteht", time:"Vor 2 Std.",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=75" },
  { id:"m2", caption:"Heute am See", time:"Vor 1 Tag",
    img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=75" },
  { id:"m3", caption:"Abendlicht", time:"Vor 2 Tagen",
    img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75" },
  { id:"m4", caption:"Atelier Session", time:"Vor 3 Tagen",
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=75" },
];

const SEED_ENCOUNTERS = [
  { id:"e1", title:"Kreativer Waldrundgang", type:"Natur", participants:8,
    img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"e2", title:"Stille Meditation", type:"Heilung", participants:12,
    img:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=75" },
  { id:"e3", title:"Community Dinner", type:"Verbindung", participants:20,
    img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75" },
];

const SEED_PROJECTS = [
  { id:"p1", title:"Stadtgarten Projekt", emoji:"🌱", tag:"Lokal", tagColor:"rgba(34,197,94,0.18)", tagText:"#16A34A", desc:"Gemeinsam grüne Oasen schaffen" },
  { id:"p2", title:"Tierheim Support",    emoji:"🐾", tag:"Tiere", tagColor:"rgba(245,158,11,0.15)", tagText:"#D97706", desc:"Monatliche Unterstützung für 3 Tierheime" },
  { id:"p3", title:"Kunst im Kiez",       emoji:"🎨", tag:"Kultur", tagColor:"rgba(99,102,241,0.15)", tagText:"#6366F1", desc:"Kreativprojekte für alle Altersgruppen" },
];

// ══════════════════════════════════════════════════════════════
// ATOMS
// ══════════════════════════════════════════════════════════════

function PillButton({ icon, label, variant = "ghost", onClick, style: sx }) {
  return (
    <button
      className="ppp-btn-press"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "10px 18px", borderRadius: T.r99,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        touchAction: "manipulation", fontFamily: "inherit",
        border: "none",
        ...(variant === "primary" ? {
          background: `linear-gradient(135deg, ${T.teal} 0%, #0DBBAF 100%)`,
          color: "white", boxShadow: T.glowTeal,
        } : variant === "soft" ? {
          background: T.tealSoft,
          color: T.teal, border: `1px solid ${T.tealMid}`,
        } : variant === "coral" ? {
          background: T.coralSoft,
          color: T.coral, border: `1px solid rgba(255,107,82,0.22)`,
        } : {
          background: "rgba(15,17,23,0.05)",
          color: T.inkSoft, border: `1px solid ${T.border}`,
        }),
        ...sx,
      }}
    >
      {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
      {label}
    </button>
  );
}

function Skeleton({ w = "100%", h = 16, r = 8, style: sx }) {
  return <div className="ppp-skeleton" style={{ width: w, height: h, borderRadius: r, ...sx }} />;
}

// ══════════════════════════════════════════════════════════════
// 1. HERO — Emotional identity header
// ══════════════════════════════════════════════════════════════
function ProfileHero({ profile, loading, onClose, onFollow, followed }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const heroImg  = safeStr(profile?.header_img, FALLBACK_IMG);
  const avatar   = safeStr(profile?.avatar_url, FALLBACK_AVT);
  const name     = safeStr(profile?.display_name || profile?.name || profile?.username, "Unbekannt");
  const username = safeStr(profile?.username, "");
  const bio      = safeStr(profile?.bio, "");
  const location = safeStr(profile?.location, "");
  const verified = !!profile?.verified;
  const isTalent = !!(profile?.has_talent_profile || profile?.is_member ||
    profile?.role === "talent" || profile?.role === "wirker" ||
    profile?.membership_type === "talent");

  return (
    <div style={{ width: "100%", position: "relative" }}>

      {/* ── COVER IMAGE ─────────────────────────────── */}
      <div style={{
        width: "100%", height: 220, position: "relative",
        overflow: "hidden", background: `linear-gradient(135deg, #0A1A1A 0%, #1A1A2E 100%)`,
      }}>
        {/* Background image */}
        <img
          src={heroImg} alt=""
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover",
            opacity: imgLoaded ? 0.45 : 0,
            transition: "opacity .8s ease",
          }}
        />

        {/* Soft gradient overlay — pulls bottom toward white */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(
            180deg,
            rgba(247,246,243,0.0) 0%,
            rgba(247,246,243,0.0) 50%,
            rgba(247,246,243,0.85) 85%,
            rgba(247,246,243,1.0) 100%
          )`,
        }} />

        {/* Ambient teal blob top-right */}
        <div className="ppp-blob" style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,196,184,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Ambient coral blob bottom-left */}
        <div className="ppp-blob-slow" style={{
          position: "absolute", bottom: 20, left: -30,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,82,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Back button */}
        <button
          className="ppp-btn-press"
          onClick={onClose}
          style={{
            position: "absolute", top: 16, left: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid rgba(255,255,255,0.6)`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            cursor: "pointer", touchAction: "manipulation",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.ink,
          }}
        >←</button>

        {/* Share button */}
        <button
          className="ppp-btn-press"
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid rgba(255,255,255,0.6)`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            cursor: "pointer", touchAction: "manipulation",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: T.inkSoft,
          }}
        >⬆</button>
      </div>

      {/* ── AVATAR + IDENTITY ───────────────────────── */}
      <div style={{
        width: "100%",
        padding: `0 ${T.px}px 24px`,
        marginTop: -52,
        position: "relative", zIndex: 2,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(10px)",
        transition: "opacity .6s ease, transform .6s ease",
      }}>

        {/* Avatar */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <div className="ppp-avatar-ring" style={{ position: "relative", flexShrink: 0 }}>
            {/* Glow ring */}
            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: isTalent
                ? `conic-gradient(from 0deg, ${T.teal}, ${T.coral}, ${T.teal})`
                : `conic-gradient(from 0deg, rgba(14,196,184,0.6), rgba(14,196,184,0.2), rgba(14,196,184,0.6))`,
              opacity: 0.85,
            }} />
            {/* Pulse ring (talent only) */}
            {isTalent && (
              <div style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                border: `2px solid rgba(14,196,184,0.30)`,
                animation: "ppp-pulse-ring 2.8s ease-out infinite",
              }} />
            )}
            <div style={{
              position: "relative", width: 88, height: 88, borderRadius: "50%",
              border: "3px solid white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              overflow: "hidden",
              background: T.bg,
            }}>
              <img
                src={avatar} alt={name}
                onLoad={() => setAvatarLoaded(true)}
                onError={() => setAvatarLoaded(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: avatarLoaded ? 1 : 0,
                  transition: "opacity .4s ease",
                }}
              />
            </div>
            {/* Verified badge */}
            {verified && (
              <div style={{
                position: "absolute", bottom: 3, right: 3,
                width: 22, height: 22, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.teal}, #0DBBAF)`,
                border: "2.5px solid white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "white", fontWeight: 800,
                boxShadow: T.glowTeal,
              }}>✓</div>
            )}
          </div>

          {/* Follow button — top right of identity row */}
          <button
            className="ppp-btn-press"
            onClick={onFollow}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: T.r99,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              touchAction: "manipulation", fontFamily: "inherit",
              border: "none",
              background: followed
                ? "rgba(15,17,23,0.07)"
                : `linear-gradient(135deg, ${T.teal} 0%, #0DBBAF 100%)`,
              color: followed ? T.inkSoft : "white",
              boxShadow: followed ? "none" : T.glowTeal,
              transition: "all .22s ease",
              alignSelf: "flex-start",
              marginTop: 58,
            }}
          >
            {followed ? "✓ Gefolgt" : "+ Folgen"}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton w="55%" h={26} />
            <Skeleton w="35%" h={14} />
            <Skeleton w="85%" h={14} r={6} style={{ marginTop: 4 }} />
            <Skeleton w="70%" h={14} r={6} />
          </div>
        )}

        {/* Identity text */}
        {!loading && profile && (
          <div>
            {/* Name + talent badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{
                fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 800,
                color: T.ink, letterSpacing: "-0.03em", lineHeight: 1.1,
                margin: 0,
              }}>{name}</h1>
              {isTalent && (
                <span style={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em",
                  color: T.teal, background: T.tealSoft,
                  border: `1px solid ${T.tealMid}`,
                  padding: "3px 9px", borderRadius: T.r99,
                  textTransform: "uppercase",
                }}>Creator</span>
              )}
            </div>

            {/* @username + location */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              fontSize: 12.5, color: T.inkFaint, fontWeight: 500,
              marginBottom: 12,
            }}>
              {username && <span>@{username}</span>}
              {location && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: T.inkFaint, flexShrink: 0 }} />
                  <span>📍 {location}</span>
                </>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p style={{
                fontSize: 14, lineHeight: 1.65, color: T.inkSoft,
                margin: "0 0 18px",
                fontFamily: "-apple-system, 'Georgia', serif",
                maxWidth: 340,
              }}>{bio}</p>
            )}

            {/* Action buttons row */}
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap",
            }}>
              <PillButton icon="✦" label="Verbinden"  variant="primary" />
              <PillButton icon="💬" label="Nachricht"  variant="soft" />
              <PillButton icon="🌱" label="Unterstützen" variant="coral" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. IMPACT ENERGY — Not vanity metrics
// ══════════════════════════════════════════════════════════════
function ImpactEnergy({ profile, loading }) {
  const { ref, style: entryStyle } = useEntry(0);

  const impact  = safeNum(profile?.impact_eur,  8950);
  const follows = safeNum(profile?.followers,   189);
  const meets   = safeNum(profile?.bookings,    24);

  const items = [
    { emoji: "🌱", value: fmt(meets),   label: "Begegnungen", sublabel: "Echte Momente", color: T.teal, bgColor: T.tealSoft },
    { emoji: "👥", value: fmt(follows), label: "Resonanz",    sublabel: "Menschen die folgen", color: "#6366F1", bgColor: "rgba(99,102,241,0.10)" },
    { emoji: "€",  value: `${fmt(impact)}`, label: "Wirkung", sublabel: "Gemeinsam erzeugt", color: T.coral, bgColor: T.coralSoft },
  ];

  return (
    <div ref={ref} style={{
      ...entryStyle,
      width: "100%", padding: `0 ${T.px}px 24px`,
    }}>
      <div style={{
        background: T.bgCard,
        borderRadius: T.r20,
        border: `1px solid ${T.border}`,
        boxShadow: T.cardShadow,
        padding: "20px 16px",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0,
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "0 8px",
            borderRight: i < 2 ? `1px solid ${T.border}` : "none",
          }}>
            {loading ? (
              <>
                <Skeleton w={40} h={40} r={99} style={{ marginBottom: 8 }} />
                <Skeleton w={48} h={20} style={{ marginBottom: 4 }} />
                <Skeleton w={56} h={11} />
              </>
            ) : (
              <>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: item.bgColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, marginBottom: 8,
                }}>{item.emoji}</div>
                <div style={{
                  fontSize: 20, fontWeight: 800,
                  color: T.ink, letterSpacing: "-0.04em", lineHeight: 1,
                  marginBottom: 4,
                }}>{item.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 9.5, color: T.inkFaint, lineHeight: 1.3 }}>{item.sublabel}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. MOMENTS — Cinematic human moments
// ══════════════════════════════════════════════════════════════
function MomentCard({ m, delay }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-btn-press ppp-section-in" style={{
      flexShrink: 0, width: 155, height: 205,
      borderRadius: T.r16, overflow: "hidden",
      position: "relative", cursor: "pointer",
      touchAction: "manipulation",
      boxShadow: T.cardShadow,
      background: "rgba(15,17,23,0.08)",
      animationDelay: `${delay}ms`,
    }}>
      <img
        src={m.img} alt={m.caption}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          opacity: loaded ? 1 : 0, transition: "opacity .5s ease",
          display: "block",
        }}
      />
      {/* Bottom gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(15,17,23,0.78) 0%, rgba(15,17,23,0.04) 55%)",
      }} />
      {/* Caption */}
      <div style={{
        position: "absolute", bottom: 14, left: 12, right: 12,
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "white", lineHeight: 1.4, marginBottom: 3 }}>
          {m.caption}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
          {m.time}
        </div>
      </div>
    </div>
  );
}

function MomentsSection({ moments }) {
  const { ref, style: entryStyle } = useEntry(60);
  const items = safeArr(moments).length ? safeArr(moments) : SEED_MOMENTS;

  return (
    <div ref={ref} style={{ ...entryStyle, width: "100%", paddingBottom: 8 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: `0 ${T.px}px 14px`,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em" }}>
            Momente
          </div>
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Echte Augenblicke</div>
        </div>
        <button style={{
          background: "none", border: "none", padding: 0,
          fontSize: 12, color: T.teal, fontWeight: 700,
          cursor: "pointer", touchAction: "manipulation", fontFamily: "inherit",
        }}>Alle ansehen</button>
      </div>

      <div style={{
        display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none",
        padding: `3px ${T.px}px 6px`,
        WebkitOverflowScrolling: "touch",
      }}>
        {items.map((m, i) => <MomentCard key={m.id} m={m} delay={i * 60} />)}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. PROJECTS / INITIATIVES
// ══════════════════════════════════════════════════════════════
function ProjectCard({ p, delay }) {
  return (
    <div className="ppp-btn-press ppp-section-in" style={{
      background: T.bgCard,
      borderRadius: T.r16,
      border: `1px solid ${T.border}`,
      boxShadow: T.cardShadow,
      padding: "16px",
      cursor: "pointer", touchAction: "manipulation",
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: T.r12,
          background: p.tagColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>{p.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
              {p.title}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: ".04em",
              color: p.tagText, background: p.tagColor,
              padding: "2px 7px", borderRadius: T.r99,
            }}>{p.tag}</span>
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45 }}>{p.desc}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ projects }) {
  const { ref, style: entryStyle } = useEntry(80);
  const items = safeArr(projects).length ? safeArr(projects) : SEED_PROJECTS;

  return (
    <div ref={ref} style={{ ...entryStyle, width: "100%", padding: `0 ${T.px}px` }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em" }}>
            Initiativen
          </div>
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Wirkung im echten Leben</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((p, i) => <ProjectCard key={p.id} p={p} delay={i * 80} />)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. ENCOUNTERS — HUI-native concept
// ══════════════════════════════════════════════════════════════
function EncounterCard({ e, delay }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-btn-press ppp-section-in" style={{
      flexShrink: 0, width: 200,
      borderRadius: T.r16, overflow: "hidden",
      background: T.bgCard, cursor: "pointer",
      touchAction: "manipulation",
      boxShadow: T.floatShadow,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ height: 128, position: "relative", background: "rgba(15,17,23,0.06)" }}>
        <img
          src={e.img} alt={e.title}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: loaded ? 1 : 0, transition: "opacity .5s ease",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(15,17,23,0.45) 0%, transparent 60%)",
        }} />
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)",
          padding: "3px 9px", borderRadius: T.r99,
          fontSize: 9.5, fontWeight: 700, color: T.ink,
        }}>{e.type}</div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 5, letterSpacing: "-0.01em" }}>
          {e.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.inkSoft }}>
          <span>👥</span>
          <span>{e.participants} Begegnungen</span>
        </div>
      </div>
    </div>
  );
}

function EncountersSection({ encounters }) {
  const { ref, style: entryStyle } = useEntry(100);
  const items = safeArr(encounters).length ? safeArr(encounters) : SEED_ENCOUNTERS;

  return (
    <div ref={ref} style={{ ...entryStyle, width: "100%" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: `0 ${T.px}px 14px`,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em" }}>
            Begegnungen
          </div>
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Echte menschliche Verbindung</div>
        </div>
      </div>
      <div style={{
        display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none",
        padding: `3px ${T.px}px 6px`,
        WebkitOverflowScrolling: "touch",
      }}>
        {items.map((e, i) => <EncounterCard key={e.id} e={e} delay={i * 80} />)}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. VALUES / INTERESTS
// ══════════════════════════════════════════════════════════════
function ValuesSection({ interests }) {
  const { ref, style: entryStyle } = useEntry(60);
  const raw = safeArr(interests);
  const items = raw.length > 0
    ? raw.slice(0, 9).map((v, i) => ({
        icon: DEFAULT_VALUES[i % DEFAULT_VALUES.length]?.icon || "✦",
        label: typeof v === "string" ? v : v?.label || "–",
        color: DEFAULT_VALUES[i % DEFAULT_VALUES.length]?.color || T.tealSoft,
      }))
    : DEFAULT_VALUES;

  return (
    <div ref={ref} style={{
      ...entryStyle, width: "100%", padding: `0 ${T.px}px`,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em" }}>
          Werte & Interessen
        </div>
        <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Was diese Person bewegt</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: T.r99,
            background: item.color,
            border: `1px solid rgba(15,17,23,0.07)`,
            fontSize: 13, fontWeight: 600, color: T.inkSoft,
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 7. HUMAN QUOTE / BIO DEEP-DIVE
// ══════════════════════════════════════════════════════════════
function HumanQuote({ profile }) {
  const { ref, style: entryStyle } = useEntry(40);
  const name = safeStr(profile?.display_name || profile?.username, "");
  const bio  = safeStr(profile?.bio, "");
  if (!bio) return null;

  return (
    <div ref={ref} style={{
      ...entryStyle,
      margin: `0 ${T.px}px`,
      background: `linear-gradient(135deg, ${T.tealSoft} 0%, rgba(247,246,243,0.4) 100%)`,
      border: `1px solid ${T.tealMid}`,
      borderRadius: T.r20,
      padding: "22px 20px",
    }}>
      <div style={{
        fontSize: 28, color: T.teal, fontWeight: 800,
        lineHeight: 1, marginBottom: 10, opacity: 0.5,
      }}>"</div>
      <p style={{
        fontSize: 15, lineHeight: 1.7, color: T.inkSoft,
        margin: "0 0 14px",
        fontFamily: "-apple-system, 'Georgia', serif",
        fontStyle: "italic",
      }}>{bio}</p>
      {name && (
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>— {name}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. CONNECT CTA — Floating bottom bar
// ══════════════════════════════════════════════════════════════
function ConnectCTA({ name, onConnect, connected }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: "max(88px, calc(80px + env(safe-area-inset-bottom,0px)))",
      left: T.px, right: T.px, zIndex: 9200,
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(12px)",
      transition: "opacity .5s ease .6s, transform .5s ease .6s",
      pointerEvents: visible ? "auto" : "none",
    }}>
      <button
        className="ppp-btn-press"
        onClick={onConnect}
        style={{
          width: "100%",
          background: connected
            ? "rgba(15,17,23,0.07)"
            : `linear-gradient(135deg, ${T.teal} 0%, #0DBBAF 100%)`,
          border: connected ? `1px solid rgba(15,17,23,0.12)` : "none",
          borderRadius: T.r99,
          padding: "15px 28px",
          color: connected ? "rgba(15,17,23,0.55)" : "white",
          fontSize: 15, fontWeight: 700,
          cursor: "pointer", touchAction: "manipulation",
          boxShadow: connected ? "none" : `${T.glowTeal}, 0 4px 24px rgba(0,0,0,0.15)`,
          fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .25s ease",
        }}
      >
        <span>{connected ? "✓" : "✦"}</span>
        {connected ? "Verbindung gesendet" : `Mit ${name || "diesem Menschen"} verbinden`}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION DIVIDER
// ══════════════════════════════════════════════════════════════
function Divider() {
  return <div style={{ height: 1, margin: `4px ${T.px}px`, background: T.border }} />;
}

function SectionGap({ size = 28 }) {
  return <div style={{ height: size }} />;
}

// ══════════════════════════════════════════════════════════════
// ROOT — PublicProfilePage
// ══════════════════════════════════════════════════════════════
export default function PublicProfilePage({ profileId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Phase 2.5: Connection Engine — global shared state
  const engine = useConnectionEngine();
  const followed    = engine.isFollowed(profileId);
  const isConnected = engine.isConnected(profileId);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    loadPublicProfile(profileId).then(data => {
      setProfile(data);
      setLoading(false);
    });
  }, [profileId]);

  const name = safeStr(profile?.display_name || profile?.username, "Unbekannt");

  const handleClose = useCallback(() => {
    if (typeof onClose === "function") onClose();
  }, [onClose]);

  const handleFollow = useCallback(() => {
    if (followed) {
      engine.unfollow(profileId);
    } else {
      engine.follow(profileId);
    }
  }, [followed, profileId, engine]);

  const handleConnect = useCallback(() => {
    engine.connect(profileId, profile);
  }, [profileId, profile, engine]);

  return (
    <div
      className="ppp-root"
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        display: "flex", flexDirection: "column",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(20px)",
        transition: "opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1)",
        background: T.bg,
      }}
    >
      <style>{CSS}</style>

      {/* Scrollable content */}
      <div
        className="ppp-scroll"
        style={{
          flex: 1, overflowY: "auto",
          paddingBottom: 160, // space for floating CTA + nav
        }}
      >
        {/* 1. Hero — emotional identity */}
        <ProfileHero
          profile={profile}
          loading={loading}
          onClose={handleClose}
          onFollow={handleFollow}
          followed={followed}
        />

        <SectionGap size={4} />

        {/* 2. Impact energy */}
        <ImpactEnergy profile={profile} loading={loading} />

        <SectionGap size={4} />

        {/* 3. Human quote */}
        {!loading && <HumanQuote profile={profile} />}

        <SectionGap size={28} />

        {/* 4. Moments */}
        <MomentsSection moments={profile?.moments} />

        <SectionGap size={28} />

        <Divider />
        <SectionGap size={24} />

        {/* 5. Projects / Initiatives */}
        <ProjectsSection projects={profile?.projects} />

        <SectionGap size={28} />

        <Divider />
        <SectionGap size={24} />

        {/* 6. Encounters */}
        <EncountersSection encounters={profile?.encounters} />

        <SectionGap size={28} />

        <Divider />
        <SectionGap size={24} />

        {/* 7. Values & Interests */}
        <ValuesSection interests={profile?.interests} />

        <SectionGap size={40} />
      </div>

      {/* 8. Floating connect CTA */}
      <ConnectCTA name={name} onConnect={handleConnect} connected={isConnected} />
    </div>
  );
}
