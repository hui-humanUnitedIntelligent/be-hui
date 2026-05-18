// @deprecated — LEGACY WirkerProfilePage
// Aktive Version: src/pages/wirker-profile/index.jsx
// Dieser Import wird im Bundle nicht mehr geladen.
// Nicht löschen — historische Referenz.
//
/* eslint-disable */

// WirkerProfilePage.jsx — HUI Creative Presence Profile v4
// Screenshot-exact: Mia Kern Design
// DNA: soft white, mint/teal, warm coral, cinematic, Apple×Airbnb×Calm
// Alle bestehenden Props + Data-Hooks bleiben identisch

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import LazyImage from "./LazyImage";
import { safeQuery, batchQueries, FIELDS, PROFILE_FIELDS, normalizeProfileInput, buildMock, cachedQuery } from "../lib/perfUtils";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFollowStatus } from "../lib/AppStateContext";
import { usePresence, resonanceSignature } from "../lib/presence";
import { useReputation } from "../lib/trustContext";
import { VerfuegbarkeitPage, KontoPage } from "./MeinHUI_SubPages";
import EditProfile from "../pages/EditProfile";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS — exakt HUI-DNA
───────────────────────────────────────────────────────── */
const C = {
  teal:       "#16D7C5",
  teal2:      "#11C5B7",
  tealGlow:   "rgba(22,215,197,0.22)",
  tealPale:   "#E8FAF8",
  coral:      "#FF8A6B",
  coralPale:  "#FFF2EE",
  gold:       "#F5A623",
  cream:      "#F9F7F4",
  warm:       "#FFFCF9",
  white:      "#FFFFFF",
  card:       "#FFFFFF",
  ink:        "#1A1A1A",
  ink2:       "#3D3D3D",
  muted:      "#8A8A8A",
  muted2:     "#C0C0C0",
  border:     "rgba(0,0,0,0.06)",
  shadow:     "rgba(0,0,0,0.08)",
  shadowMd:   "rgba(0,0,0,0.12)",
};

/* ─────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────── */
const CSS = `
  @keyframes cpFadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cpFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes cpSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cpPulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes cpSkeleton {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  .cp-root * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  .cp-root   { font-family:-apple-system,"SF Pro Display",system-ui,sans-serif; }
  .cp-tap    { cursor:pointer; transition:opacity 0.18s ease, transform 0.18s ease; }
  .cp-tap:active { opacity:0.72; transform:scale(0.96); }

  /* Tab underline */
  .cp-tab-line {
    position:absolute; bottom:0; left:50%; transform:translateX(-50%);
    width:70%; height:2px; border-radius:2px;
    background:${C.teal};
  }

  /* Skeleton shimmer */
  .cp-skeleton {
    background: linear-gradient(90deg,
      rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.06) 75%);
    background-size:400% 100%;
    animation:cpSkeleton 1.6s ease-in-out infinite;
    border-radius:12px;
  }

  /* Scrollbar hide */
  .cp-scroll::-webkit-scrollbar { display:none; }
  .cp-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ─────────────────────────────────────────────────────────
   PRESENCE STATUS (lebendig)
───────────────────────────────────────────────────────── */
const PRESENCE_LABELS = [
  "Gerade im Atelier",
  "In kreativer Phase",
  "Offen für Begegnungen",
  "Arbeitet an neuer Serie",
  "Im Studio",
  "In der Natur",
  "Tief in einem Projekt",
  "Für Ideen offen",
];

function presenceLabel(profile) {
  if (profile?.presence_status) return profile.presence_status;
  const idx = (profile?.id?.charCodeAt(0) || 0) % PRESENCE_LABELS.length;
  return PRESENCE_LABELS[idx];
}

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div style={{ background:C.cream, minHeight:"100vh" }}>
      <div style={{ height:240, background:"rgba(0,0,0,0.08)" }}/>
      <div style={{ padding:"0 20px", marginTop:-32 }}>
        <div style={{ width:84, height:84, borderRadius:"50%",
          border:`4px solid ${C.white}`, background:"rgba(0,0,0,0.10)" }}/>
        <div style={{ marginTop:14 }}>
          <div className="cp-skeleton" style={{ width:160, height:22, marginBottom:8 }}/>
          <div className="cp-skeleton" style={{ width:120, height:14, marginBottom:6 }}/>
          <div className="cp-skeleton" style={{ width:90,  height:14 }}/>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT ITEM
───────────────────────────────────────────────────────── */
function StatItem({ value, label }) {
  return (
    <div style={{ textAlign:"center", flex:1 }}>
      <div style={{ fontSize:17, fontWeight:800, color:C.ink,
        letterSpacing:-0.5, lineHeight:1.2 }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2,
        fontWeight:500, letterSpacing:0.1 }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CREATIVE WORLD BUBBLE
───────────────────────────────────────────────────────── */
function WorldBubble({ label, img, idx }) {
  const fallbackEmojis = ["🏺","🌿","🎨","☀️","👥","🎵","✨","📸"];
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
      animation:`cpFadeUp 0.5s ${0.1 + idx*0.06}s both`,
      flexShrink:0,
    }}>
      <div style={{
        width:64, height:64, borderRadius:"50%",
        overflow:"hidden", flexShrink:0,
        boxShadow:`0 4px 14px ${C.shadowMd}, 0 1px 3px ${C.shadow}`,
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
        border:`2px solid ${C.white}`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {img
          ? <img src={img} alt={label} loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <span style={{ fontSize:24 }}>
              {fallbackEmojis[idx % fallbackEmojis.length]}
            </span>
        }
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:C.ink2,
        textAlign:"center", letterSpacing:0.1 }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ACTIVITY CARD (Bewegungs-Feed)
───────────────────────────────────────────────────────── */
function ActivityCard({ item, idx }) {
  const typeLabel = {
    experience:"Erlebnis", work:"Werk",
    inspiration:"Inspiration", community:"Begegnung",
  }[item.type] || "Neu";

  const typeColor = {
    experience: C.teal,
    work:       C.coral,
    inspiration: C.gold,
    community:  "#A78BFA",
  }[item.type] || C.teal;

  return (
    <div style={{
      borderRadius:20,
      overflow:"hidden",
      background:C.card,
      boxShadow:`0 2px 8px ${C.shadow}, 0 8px 24px rgba(0,0,0,0.06)`,
      animation:`cpFadeUp 0.5s ${idx*0.08}s both`,
      border:`1px solid ${C.border}`,
    }}>
      {/* Bild */}
      {item.img && (
        <div style={{ height:190, overflow:"hidden", position:"relative" }}>
          <img src={item.img} alt={item.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover",
              transform:"scale(1.02)", transition:"transform 0.6s ease" }}/>
          {/* Gradient overlay */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:80,
            background:"linear-gradient(transparent, rgba(0,0,0,0.38))",
          }}/>
          {/* Type badge */}
          <div style={{
            position:"absolute", top:14, left:14,
            background:`${typeColor}EE`,
            backdropFilter:"blur(8px)",
            borderRadius:20, padding:"4px 11px",
            fontSize:11.5, fontWeight:700, color:C.white,
            letterSpacing:0.2,
          }}>
            {typeLabel}
          </div>
        </div>
      )}
      {/* Content */}
      <div style={{ padding:"14px 16px 16px" }}>
        <div style={{ fontSize:16.5, fontWeight:800, color:C.ink,
          letterSpacing:-0.4, marginBottom:4, lineHeight:1.3 }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={{ fontSize:12.5, color:C.muted, marginBottom:8,
            lineHeight:1.4 }}>
            {item.subtitle}
          </div>
        )}
        {item.cta && (
          <div style={{ fontSize:13, fontWeight:700, color:typeColor }}>
            {item.cta}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WERK CARD (kompakter)
───────────────────────────────────────────────────────── */
function WorkCard({ work, idx }) {
  return (
    <div style={{
      borderRadius:16, overflow:"hidden",
      background:C.card,
      boxShadow:`0 2px 8px ${C.shadow}`,
      border:`1px solid ${C.border}`,
      animation:`cpFadeUp 0.4s ${idx*0.06}s both`,
    }}>
      <div style={{ height:140, overflow:"hidden",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})` }}>
        {work.image_url && (
          <img src={work.image_url} alt={work.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        )}
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.ink,
          letterSpacing:-0.2, marginBottom:2, lineHeight:1.3 }}>
          {work.title || "Werk"}
        </div>
        {work.price_eur && (
          <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>
            {"€" + work.price_eur}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   IMPACT CARD (zeremoniell)
───────────────────────────────────────────────────────── */
function ImpactCard({ profile }) {
  const impact = profile?.impact_eur || 0;
  return (
    <div style={{
      borderRadius:20,
      background:`linear-gradient(135deg, #F0FBF9 0%, ${C.white} 100%)`,
      border:`1.5px solid ${C.teal}28`,
      padding:"20px",
      boxShadow:`0 4px 20px ${C.tealGlow}`,
      animation:"cpFadeUp 0.5s both",
    }}>
      <div style={{ fontSize:13, fontWeight:700, color:C.teal,
        letterSpacing:0.3, marginBottom:12, textTransform:"uppercase" }}>
        Wirkung, die entsteht
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { icon:"🌱", label:"Unterstützte Projekte",    value: Math.round((impact/1000)*2.4) || 3 },
          { icon:"✨", label:"Inspirierte Menschen",      value: (profile?.followers || 120) + "+" },
          { icon:"🤝", label:"Geschaffene Begegnungen",   value: profile?.bookings || 48 },
          { icon:"❤️", label:"Impact Pool Beitrag",       value: "€" + (impact*0.15).toFixed(0) || "€240" },
        ].map((row, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:36, height:36, borderRadius:12, flexShrink:0,
              background:`${C.teal}15`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17,
            }}>{row.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:C.muted }}>{row.label}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:C.ink,
              letterSpacing:-0.3 }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ERLEBNIS CARD
───────────────────────────────────────────────────────── */
function ExpCard({ exp, idx }) {
  const date = exp.date_from
    ? new Date(exp.date_from).toLocaleDateString("de-DE",{day:"numeric",month:"short"})
    : null;
  return (
    <div style={{
      borderRadius:20, overflow:"hidden",
      background:C.card,
      boxShadow:`0 2px 8px ${C.shadow}, 0 8px 24px rgba(0,0,0,0.05)`,
      border:`1px solid ${C.border}`,
      animation:`cpFadeUp 0.5s ${idx*0.07}s both`,
    }}>
      <div style={{ height:170, overflow:"hidden", position:"relative",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})` }}>
        {exp.cover_url && (
          <img src={exp.cover_url} alt={exp.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        )}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(transparent 40%, rgba(0,0,0,0.32))",
        }}/>
        {exp.spots_left > 0 && (
          <div style={{
            position:"absolute", bottom:12, left:14,
            fontSize:12, fontWeight:700, color:C.white,
          }}>
            Noch {exp.spots_left} {exp.spots_left === 1 ? "Platz" : "Plätze"} frei
          </div>
        )}
      </div>
      <div style={{ padding:"12px 16px 14px" }}>
        {date && (
          <div style={{ fontSize:11.5, color:C.muted, marginBottom:4,
            fontWeight:500 }}>
            {date}{exp.location ? " · " + exp.location : ""}
          </div>
        )}
        <div style={{ fontSize:15, fontWeight:800, color:C.ink,
          letterSpacing:-0.3, marginBottom:6, lineHeight:1.3 }}>
          {exp.title || "Erlebnis"}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.teal }}>
          {exp.spots_left > 0 ? "Noch Plätze frei" : "Ausgebucht"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────── */
const TABS = [
  { key:"bewegung",   label:"Bewegung"   },
  { key:"werke",      label:"Werke"      },
  { key:"erlebnisse", label:"Erlebnisse" },
  { key:"wirkung",    label:"Wirkung"    },
  { key:"verbindung", label:"Verbindung" },
  { key:"raum",       label:"Raum"       },
];

/* ─────────────────────────────────────────────────────────
   WORLD CATEGORIES — Default
───────────────────────────────────────────────────────── */
const DEFAULT_WORLDS = [
  { label:"Atelier",    img:null },
  { label:"Projekte",   img:null },
  { label:"Natur",      img:null },
  { label:"Momente",    img:null },
  { label:"Community",  img:null },
  { label:"Musik",      img:null },
  { label:"Inspiration",img:null },
];

/* ─────────────────────────────────────────────────────────
   HAUPTKOMPONENTE
───────────────────────────────────────────────────────── */
export default function WirkerProfilePage({
  wirker: rawWirker,
  onClose,
  onBook,
  onMessage,
  onEdit,
}) {
  // ── Auth ─────────────────────────────────────────────
  const { user }  = useAuth();
  const navigate  = useNavigate();

  // ── State ────────────────────────────────────────────
  const [profile,      setProfile]     = useState(null);
  const [works,        setWorks]       = useState([]);
  const [exps,         setExps]        = useState([]);
  const [recs,         setRecs]        = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [activeTab,    setActiveTab]   = useState("bewegung");
  const [followed,     setFollowed]    = useState(false);
  const [followLoading,setFollowLoad]  = useState(false);
  const [liked,        setLiked]       = useState(false);
  const [showMore,     setShowMore]    = useState(false);
  const [editOpen,     setEditOpen]    = useState(false);
  const [verfOpen,     setVerfOpen]    = useState(false);
  const [kontoOpen,    setKontoOpen]   = useState(false);

  const scrollRef = useRef(null);
  const isMounted = useRef(true);

  // ── isOwner ──────────────────────────────────────────
  const isOwner = Boolean(
    user?.id && profile?.id && user.id === profile.id
  );

  // ── Load ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    loadProfile();
    return () => { isMounted.current = false; };
  }, [rawWirker]);

  async function loadProfile() {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const norm     = normalizeProfileInput(rawWirker) || {};
      const uid      = norm.user_id || norm.id;
      const username = norm.username
        || (typeof rawWirker === "string" ? null : rawWirker?.username);
      const nameStr  = norm.display_name
        || (typeof rawWirker === "string" ? rawWirker : null);

      let prof = null;
      if (uid) {
        const res = await cachedQuery(`profile-${uid}`, () =>
          safeQuery(supabase.from("profiles").select(PROFILE_FIELDS).eq("id", uid))
        );
        prof = res.data;
      }
      if (!prof && username) {
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS).eq("username", username)
        );
        prof = res.data;
      }
      if (!prof && nameStr && !uid && !username) {
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS)
            .ilike("display_name", nameStr).limit(1).single()
        );
        prof = res.data;
      }

      const targetId = prof?.id || uid;
      if (isMounted.current) {
        setProfile(prof ? { ...buildMock(rawWirker), ...prof } : buildMock(rawWirker));
      }

      if (user?.id && targetId && user.id !== targetId) {
        supabase.from("follows")
          .select("follower_id", { count:"exact", head:true })
          .eq("follower_id", user.id)
          .eq("followed_id", targetId)
          .then(({ count }) => { if (isMounted.current) setFollowed((count||0)>0); });
      }

      if (targetId) {
        const [worksRes, expsRes, recsRes] = await Promise.all([
          safeQuery(supabase.from("works")
            .select(FIELDS.work)
            .eq("user_id", targetId).eq("status","published")
            .order("created_at",{ascending:false}).limit(12)),
          safeQuery(supabase.from("experiences")
            .select(FIELDS.experience)
            .eq("user_id", targetId).eq("status","published")
            .order("created_at",{ascending:false}).limit(8)),
          safeQuery(supabase.from("recommendations")
            .select("id,reviewer_name,rating,text,work_title,created_at")
            .eq("wirker_id", targetId)
            .order("created_at",{ascending:false}).limit(10)),
        ]);
        if (isMounted.current) {
          if (worksRes.data?.length) setWorks(worksRes.data);
          if (expsRes.data?.length)  setExps(expsRes.data);
          if (recsRes.data?.length)  setRecs(recsRes.data);
        }
      }
    } catch(e) {
      console.warn("[WirkerProfile] load:", e?.message);
      if (isMounted.current) setProfile(buildMock(rawWirker));
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // ── Follow ───────────────────────────────────────────
  const _followStatus  = useFollowStatus(profile?.id ?? null);
  const _globalFollowed = _followStatus?.isFollowing ?? false;
  const _toggleFollow   = _followStatus?.toggle ?? (() => Promise.resolve());

  useEffect(() => {
    if (profile?.id) setFollowed(_globalFollowed);
  }, [_globalFollowed, profile?.id]);

  async function handleFollow() {
    if (!user?.id || !profile?.id || followLoading) return;
    setFollowLoad(true);
    try { await _toggleFollow(); }
    finally { setFollowLoad(false); }
  }

  // ── Derived ──────────────────────────────────────────
  const displayName = profile?.display_name || profile?.full_name
    || (typeof rawWirker === "string" ? rawWirker : "Kreative Person");
  const category  = profile?.talent_type || profile?.category
    || "Kreatives Schaffen";
  const location  = profile?.location || profile?.city || "Deutschland";
  const bio       = profile?.bio || profile?.short_bio
    || "Ich erschaffe Dinge, die berühren.";
  const avatar    = profile?.avatar_url || profile?.img;
  const header    = profile?.header_img || profile?.cover_url;
  const verified  = profile?.verified ?? false;
  const impact    = profile?.impact_eur || profile?.wirkung || 0;
  const followers = profile?.followers || profile?.follower_count || 0;
  const bookings  = profile?.bookings  || 0;
  const conns     = profile?.connections || 312;

  const presence  = presenceLabel(profile);

  // Bewegungs-Feed — Mischung aus echten Daten + Profil-Aktivitäten
  const bewegungFeed = [
    ...(exps.slice(0,2).map(e => ({
      type:"experience", title:e.title,
      subtitle: e.date_from
        ? new Date(e.date_from).toLocaleDateString("de-DE",{day:"numeric",month:"long"})
          + (e.location ? " · " + e.location : "")
        : e.location,
      cta: (e.spots_left||0) > 0 ? `Noch ${e.spots_left} Plätze frei` : null,
      img: e.cover_url,
    }))),
    ...(works.slice(0,2).map(w => ({
      type:"work", title:w.title,
      subtitle: w.price_eur ? "€" + w.price_eur : null,
      img: w.image_url,
    }))),
  ];

  // ── Skeleton / Error ─────────────────────────────────
  if (loading) return <ProfileSkeleton />;
  if (!profile && !loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.cream,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:16, padding:"0 32px",
        fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif" }}>
        <div style={{ fontSize:40 }}>🌿</div>
        <div style={{ fontSize:17, fontWeight:700, color:C.ink, textAlign:"center" }}>
          Profil nicht gefunden
        </div>
        <div style={{ fontSize:14, color:C.muted, textAlign:"center", lineHeight:1.6 }}>
          Dieser kreative Raum ist gerade nicht erreichbar.
        </div>
        <button onClick={() => onClose?.()}
          style={{ marginTop:8, padding:"12px 28px", borderRadius:20,
            background:C.teal, color:C.white, border:"none",
            fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Zurück
        </button>
      </div>
    );
  }

  // ── Sub-Pages (Owner-only) ───────────────────────────
  if (editOpen  && isOwner) return <EditProfile onClose={() => setEditOpen(false)}/>;
  if (verfOpen  && isOwner) return <VerfuegbarkeitPage onBack={() => setVerfOpen(false)}/>;
  if (kontoOpen && isOwner) return <KontoPage onBack={() => setKontoOpen(false)}/>;

  // ════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className="cp-root" style={{
      position:"fixed", inset:0, zIndex:800,
      background:C.cream,
      overflowY:"auto",
      overflowX:"hidden",
      WebkitOverflowScrolling:"touch",
      animation:"cpFadeIn 0.30s ease both",
    }}
    ref={scrollRef}
    >
      <style>{CSS}</style>

      {/* ══════════════════════════════════════════════
          1. HERO HEADER
      ══════════════════════════════════════════════ */}
      <div style={{ position:"relative", height:240, flexShrink:0 }}>
        {/* Cover-Bild */}
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(135deg, ${C.tealPale} 0%, #E8EDF2 100%)`,
          overflow:"hidden" }}>
          {header && (
            <img src={header} alt="Cover" loading="eager"
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.92) saturate(1.08)" }}/>
          )}
          {/* Gradient nach unten */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:80,
            background:"linear-gradient(transparent, rgba(249,247,244,0.80))",
          }}/>
        </div>

        {/* Top Navigation */}
        <div style={{
          position:"absolute", top:0, left:0, right:0,
          padding:"max(52px,env(safe-area-inset-top,52px)) 18px 0",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          zIndex:10,
        }}>
          {/* Zurück */}
          <button className="cp-tap" onClick={() => onClose?.()}
            style={{
              width:38, height:38, borderRadius:"50%",
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(12px)",
              border:`1px solid rgba(255,255,255,0.60)`,
              boxShadow:`0 2px 10px ${C.shadowMd}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:C.ink2, cursor:"pointer",
            }}>
            {"←"}
          </button>

          {/* Mehr */}
          <button className="cp-tap" onClick={() => setShowMore(m => !m)}
            style={{
              width:38, height:38, borderRadius:"50%",
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(12px)",
              border:`1px solid rgba(255,255,255,0.60)`,
              boxShadow:`0 2px 10px ${C.shadowMd}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:C.ink2, cursor:"pointer", letterSpacing:1,
            }}>
            {"···"}
          </button>
        </div>

        {/* Mehr-Menü */}
        {showMore && (
          <div style={{
            position:"absolute", top:96, right:18, zIndex:200,
            background:C.white, borderRadius:18,
            boxShadow:`0 8px 32px ${C.shadowMd}`,
            border:`1px solid ${C.border}`,
            overflow:"hidden",
            animation:"cpFadeUp 0.2s ease both",
          }}>
            {[
              { label:"Teilen",           icon:"🔗", action:()=>setShowMore(false) },
              { label:"Melden",           icon:"⚠️", action:()=>setShowMore(false) },
              ...(isOwner ? [
                { label:"Profil bearbeiten", icon:"✏️", action:()=>{ setShowMore(false); setEditOpen(true); } },
                { label:"Verfügbarkeit",     icon:"📅", action:()=>{ setShowMore(false); setVerfOpen(true); } },
                { label:"Konto",             icon:"⚙️", action:()=>{ setShowMore(false); setKontoOpen(true); } },
              ] : []),
            ].map((item, i) => (
              <button key={i} className="cp-tap" onClick={item.action}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"13px 20px", background:"transparent", border:"none",
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  cursor:"pointer", textAlign:"left",
                }}>
                <span style={{ fontSize:17 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:600, color:C.ink }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CONTENT BODY
      ══════════════════════════════════════════════ */}
      <div style={{ background:C.cream, position:"relative" }}>

        {/* ── Avatar — schwebt über Hero ── */}
        <div style={{ padding:"0 20px", marginTop:-48, position:"relative", zIndex:10 }}>
          <div style={{
            width:88, height:88, borderRadius:"50%",
            border:`4px solid ${C.white}`,
            boxShadow:`0 6px 24px ${C.shadowMd}, 0 2px 8px ${C.shadow}`,
            overflow:"hidden", flexShrink:0,
            background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {avatar
              ? <img src={avatar} alt={displayName} loading="eager"
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:32 }}>🌿</span>
            }
          </div>
        </div>

        {/* ── Identität ── */}
        <div style={{
          padding:"12px 20px 0",
          animation:"cpFadeUp 0.4s 0.1s both",
        }}>
          {/* Name + Verified */}
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <h1 style={{ fontSize:24, fontWeight:900, color:C.ink,
              letterSpacing:-0.6, margin:0, lineHeight:1.2 }}>
              {displayName}
            </h1>
            {verified && (
              <div style={{
                width:22, height:22, borderRadius:"50%",
                background:`linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          {/* Kategorie */}
          <div style={{ fontSize:14, fontWeight:600, color:C.ink2, marginBottom:4 }}>
            {category}
          </div>

          {/* Standort */}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            fontSize:13.5, color:C.muted, marginBottom:12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={C.muted} strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {location}
          </div>

          {/* ── Presence Status ── */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:7,
            background:`${C.teal}14`,
            border:`1.5px solid ${C.teal}30`,
            borderRadius:20, padding:"5px 13px",
            marginBottom:18,
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background:C.teal,
              animation:"cpPulse 2.2s ease-in-out infinite",
              flexShrink:0,
            }}/>
            <span style={{ fontSize:13, fontWeight:600, color:C.teal,
              letterSpacing:0.1 }}>
              {presence}
            </span>
          </div>

          {/* ── Stats (4 Spalten) ── */}
          <div style={{
            display:"flex", alignItems:"flex-start",
            borderTop:`1px solid ${C.border}`,
            borderBottom:`1px solid ${C.border}`,
            padding:"14px 0", marginBottom:16,
            gap:4,
          }}>
            <StatItem value={bookings || 128}      label="Erlebnisse" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={followers >= 1000
              ? (followers/1000).toFixed(1)+"K"
              : followers || "2,4K"}               label="Gefolgt" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={"€"+(impact||"8.950")} label="Wirkung" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={conns || 312}           label="Verbindungen" />
          </div>

          {/* ── Bio ── */}
          <p style={{
            fontSize:14.5, color:C.ink2, lineHeight:1.65,
            margin:"0 0 18px", fontWeight:450,
            letterSpacing:0.05,
          }}>
            {bio}
          </p>

          {/* ── Haupt-Aktionen ── */}
          <div style={{ display:"flex", gap:10, marginBottom:22 }}>
            {/* Nachricht — Haupt-CTA */}
            <button className="cp-tap"
              onClick={() => onMessage?.(profile)}
              style={{
                flex:1, height:50, borderRadius:25,
                background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
                color:C.white, fontSize:15, fontWeight:800,
                border:"none", cursor:"pointer",
                boxShadow:`0 6px 20px ${C.tealGlow}`,
                letterSpacing:-0.2,
              }}>
              Nachricht senden
            </button>

            {/* Favorit */}
            <button className="cp-tap"
              onClick={() => setLiked(l => !l)}
              style={{
                width:50, height:50, borderRadius:"50%",
                background:liked ? `${C.coral}15` : C.white,
                border:`1.5px solid ${liked ? C.coral+"60" : C.border}`,
                boxShadow:`0 2px 10px ${C.shadow}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", flexShrink:0,
                transition:"all 0.25s ease",
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={liked ? C.coral : C.muted2} strokeWidth="2"
                strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill={liked ? C.coral+"40" : "none"}/>
              </svg>
            </button>

            {/* Folgen (nicht-Owner) */}
            {!isOwner && (
              <button className="cp-tap"
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  height:50, padding:"0 20px", borderRadius:25,
                  background: followed ? `${C.teal}12` : C.white,
                  color: followed ? C.teal : C.ink2,
                  border:`1.5px solid ${followed ? C.teal+"40" : C.border}`,
                  fontSize:13.5, fontWeight:700,
                  cursor:"pointer", flexShrink:0,
                  boxShadow:`0 2px 10px ${C.shadow}`,
                  transition:"all 0.25s ease",
                }}>
                {followed ? "Gefolgt ✓" : "Folgen"}
              </button>
            )}
          </div>
        </div>

        {/* ── Creative Worlds ── */}
        <div style={{ paddingLeft:20, marginBottom:22 }}>
          <div className="cp-scroll" style={{
            display:"flex", gap:18, overflowX:"auto",
            paddingRight:20,
          }}>
            {DEFAULT_WORLDS.map((w, i) => (
              <WorldBubble key={w.label} label={w.label} img={w.img} idx={i}/>
            ))}
          </div>
        </div>

        {/* ── Tab System ── */}
        <div style={{
          position:"sticky", top:0, zIndex:50,
          background:C.cream,
          borderBottom:`1px solid ${C.border}`,
          boxShadow:`0 1px 0 ${C.border}`,
        }}>
          <div className="cp-scroll" style={{
            display:"flex", overflowX:"auto",
            padding:"0 20px",
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} className="cp-tap"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding:"14px 14px 13px",
                    border:"none", background:"transparent",
                    cursor:"pointer", position:"relative",
                    whiteSpace:"nowrap", flexShrink:0,
                    fontSize:13.5,
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? C.ink : C.muted,
                    transition:"color 0.22s ease",
                    letterSpacing: isActive ? -0.2 : 0.05,
                  }}>
                  {tab.label}
                  {isActive && <div className="cp-tab-line"/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            TAB CONTENT
        ══════════════════════════════════════════════ */}
        <div style={{ padding:"18px 20px 120px" }}>

          {/* BEWEGUNG */}
          {activeTab === "bewegung" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {bewegungFeed.length > 0
                ? bewegungFeed.map((item, i) => (
                    <ActivityCard key={i} item={item} idx={i}/>
                  ))
                : (
                  // Fallback Cards
                  [
                    { type:"experience", title:"Sommer Retreat",
                      subtitle:"16. – 18. Juni · Schwarzwald",
                      cta:"Noch 5 Plätze frei", img:null },
                    { type:"work", title:"Neue Keramik-Serie",
                      subtitle:"Handgefertigt · Limitiert", img:null },
                    { type:"community", title:"Gemeinschafts-Workshop",
                      subtitle:"Letzten Samstag · 12 Teilnehmer", img:null },
                  ].map((item, i) => (
                    <ActivityCard key={i} item={item} idx={i}/>
                  ))
                )
              }
            </div>
          )}

          {/* WERKE */}
          {activeTab === "werke" && (
            <div>
              {works.length > 0 ? (
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"1fr 1fr",
                  gap:12,
                }}>
                  {works.map((w, i) => (
                    <WorkCard key={w.id || i} work={w} idx={i}/>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"48px 0",
                  color:C.muted, fontSize:14 }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🎨</div>
                  Noch keine Werke veröffentlicht.
                </div>
              )}
            </div>
          )}

          {/* ERLEBNISSE */}
          {activeTab === "erlebnisse" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {exps.length > 0
                ? exps.map((e, i) => <ExpCard key={e.id||i} exp={e} idx={i}/>)
                : (
                  <div style={{ textAlign:"center", padding:"48px 0",
                    color:C.muted, fontSize:14 }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                    Noch keine Erlebnisse geplant.
                  </div>
                )
              }
            </div>
          )}

          {/* WIRKUNG */}
          {activeTab === "wirkung" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <ImpactCard profile={profile}/>
              {/* Empfehlungen */}
              {recs.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.muted,
                    letterSpacing:0.3, marginBottom:12, textTransform:"uppercase" }}>
                    Stimmen
                  </div>
                  {recs.map((rec, i) => (
                    <div key={rec.id||i} style={{
                      background:C.white,
                      borderRadius:18, padding:"14px 16px",
                      marginBottom:10,
                      boxShadow:`0 2px 8px ${C.shadow}`,
                      border:`1px solid ${C.border}`,
                      animation:`cpFadeUp 0.4s ${i*0.06}s both`,
                    }}>
                      <div style={{ fontSize:13.5, color:C.ink2,
                        lineHeight:1.6, fontStyle:"italic", marginBottom:8 }}>
                        "{rec.text}"
                      </div>
                      <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>
                        — {rec.reviewer_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VERBINDUNG */}
          {activeTab === "verbindung" && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.ink,
                marginBottom:8 }}>
                Kreative Verbindungen
              </div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.6,
                padding:"0 24px" }}>
                Menschen, mit denen {displayName.split(" ")[0]} kreativ resoniert.
              </div>
            </div>
          )}

          {/* RAUM */}
          {activeTab === "raum" && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🌿</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.ink,
                marginBottom:8 }}>
                Kreativer Raum
              </div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.6,
                padding:"0 24px" }}>
                Eine Atmosphäre entsteht.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop für Mehr-Menü */}
      {showMore && (
        <div style={{ position:"fixed", inset:0, zIndex:190 }}
          onClick={() => setShowMore(false)}/>
      )}
    </div>
  );
}