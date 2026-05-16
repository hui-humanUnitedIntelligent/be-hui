// WirkerProfilePage.jsx — HUI v3
// Mobile-First Cinematic Profile
// Dieselbe Premium-DNA wie Desktop — nur kompakter

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import LazyImage from "./LazyImage";
import { safeQuery, batchQueries, FIELDS, PROFILE_FIELDS, normalizeProfileInput, optimizeImg, cachedQuery } from "../lib/perfUtils";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
// MeinHUI_SubPages: nur VerfuegbarkeitPage + KontoPage — die anderen sind inline
import { VerfuegbarkeitPage, KontoPage } from "./MeinHUI_SubPages";
import EditProfile from "../pages/EditProfile";

/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7",
  tealGlow:"rgba(22,215,197,0.28)", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.22)", coralPale:"#FFF2EE",
  gold:"#F5A623",  goldGlow:"rgba(245,166,35,0.22)",   goldPale:"#FFFBEB",
  green:"#10B981", greenGlow:"rgba(16,185,129,0.22)",
  violet:"#9B72CF",
  cream:"#F9F6F2", warm:"#FFF9F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{transform:scale(.90);opacity:0}65%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes breathe{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
  @keyframes shimmer{0%{transform:translateX(-130%)}55%{transform:translateX(130%)}100%{transform:translateX(130%)}}
  @keyframes tabSlide{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
  .wp-scroll::-webkit-scrollbar{display:none}
  .wp-scroll{-ms-overflow-style:none;scrollbar-width:none;overflow-x:auto}
  .wp-tap{
    -webkit-tap-highlight-color:transparent;
    transition:transform .22s cubic-bezier(.34,1.3,.64,1),opacity .18s ease;
    cursor:pointer;
  }
  .wp-tap:active{transform:scale(.95)!important;opacity:.80}
  .wp-card:hover .wp-card-img{transform:scale(1.03)}
  .wp-card-img{transition:transform .50s cubic-bezier(.25,.46,.45,.94)}
  .wp-sticky-tabs{
    position:sticky; top:0; z-index:50;
    backdrop-filter:blur(28px) saturate(1.9);
    -webkit-backdrop-filter:blur(28px) saturate(1.9);
  }
`;

/* ─── Skeleton ──────────────────────────────────────────────────── */
function Skel({ w="100%", h=16, r=10, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"rgba(0,0,0,0.08)",
    animation:"pulse 1.5s ease-in-out infinite", ...style }}/>;
}

function ProfileSkeleton() {
  return (
    <div style={{ background:C.cream, minHeight:"100vh" }}>
      {/* Hero skeleton */}
      <div style={{ height:280, background:"rgba(0,0,0,0.09)",
        animation:"pulse 1.5s ease-in-out infinite" }}/>
      <div style={{ padding:"0 20px", marginTop:-40 }}>
        <Skel w={80} h={80} r={40} style={{ marginBottom:14, border:"3px solid white" }}/>
        <Skel w="55%" h={24} r={8} style={{ marginBottom:8 }}/>
        <Skel w="38%" h={14} r={6} style={{ marginBottom:16 }}/>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <Skel h={42} r={999} style={{ flex:1 }}/>
          <Skel h={42} r={999} style={{ flex:1 }}/>
          <Skel h={42} r={999} style={{ flex:1 }}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Focus Config ──────────────────────────────────────────────── */
const FOCUS = {
  works:       { label:"Werk-Schaffender",   icon:"🎨", accent:C.gold,   bg:C.goldPale },
  experiences: { label:"Erlebnis-Begleiter", icon:"✨", accent:C.teal,   bg:C.tealPale },
  hybrid:      { label:"Kreativ & Präsent",  icon:"⚡", accent:C.coral,  bg:C.coralPale },
};

/* ─── Work Card ─────────────────────────────────────────────────── */
const WorkCard = React.memo(function WorkCard({ work, fullWidth=false, onTap }) {
  const img = work.cover_url || work.media_url
    || (Array.isArray(work.images) && work.images[0])
    || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80";
  const h = fullWidth ? 240 : 180;

  return (
    <div className="wp-tap wp-card" onClick={() => onTap?.(work)}
      style={{ background:C.card, borderRadius:20, overflow:"hidden",
        boxShadow:"0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        border:`1px solid ${C.border}`,
        animation:"slideUp .38s ease both" }}>
      {/* Image */}
      <div style={{ width:"100%", height:h, overflow:"hidden", position:"relative" }}>
        <LazyImage src={img} alt={work.title} className="wp-card-img"
          width={600} quality={75}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            display:"block", filter:"brightness(.92)saturate(1.08)" }}/>
        {/* Gradient overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%",
          background:"linear-gradient(transparent,rgba(0,0,0,0.62))",
          pointerEvents:"none" }}/>
        {/* Price badge */}
        {work.price != null && (
          <div style={{ position:"absolute", bottom:12, right:12,
            background:"rgba(255,255,255,0.92)", backdropFilter:"blur(8px)",
            borderRadius:999, padding:"4px 12px",
            fontSize:13, fontWeight:900, color:C.ink }}>
            € {Number(work.price).toFixed(0)}
          </div>
        )}
        {/* Category badge */}
        {work.category && (
          <div style={{ position:"absolute", top:12, left:12,
            background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
            borderRadius:999, padding:"3px 10px",
            fontSize:10, fontWeight:700, color:"white", letterSpacing:.5 }}>
            {work.category.toUpperCase()}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:"12px 16px 14px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.ink,
          marginBottom:4, lineHeight:1.3,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {work.title || "Werk"}
        </div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div style={{ fontSize:12, color:C.muted, fontWeight:500 }}>
            {work.medium || work.type || ""}
          </div>
          <button className="wp-tap"
            style={{ width:30, height:30, borderRadius:"50%",
              background:C.tealPale, border:`1px solid ${C.teal}30`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14 }}>
            ♡
          </button>
        </div>
      </div>
    </div>
  );
});


/* ─── Experience Card ───────────────────────────────────────────── */
const ExpCard = React.memo(function ExpCard({ exp, fullWidth=false, onTap }) {
  const img = exp.cover_url || exp.media_url
    || "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=600&q=80";

  return (
    <div className="wp-tap wp-card" onClick={() => onTap?.(exp)}
      style={{ background:C.card, borderRadius:20, overflow:"hidden",
        boxShadow:"0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        border:`1px solid ${C.border}`,
        animation:"slideUp .38s .05s ease both" }}>
      {/* Image */}
      <div style={{ width:"100%", height: fullWidth ? 200 : 160,
        overflow:"hidden", position:"relative" }}>
        <LazyImage src={img} alt={exp.title} className="wp-card-img"
          width={600} quality={75}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            display:"block", filter:"brightness(.9)saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,${C.violet}18 0%,rgba(0,0,0,0.55) 100%)`,
          pointerEvents:"none" }}/>
        {/* Duration */}
        {exp.duration && (
          <div style={{ position:"absolute", top:12, left:12,
            background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
            borderRadius:999, padding:"3px 10px",
            fontSize:10, fontWeight:700, color:"white" }}>
            ⏱ {exp.duration}
          </div>
        )}
        {/* Price */}
        {exp.price != null && (
          <div style={{ position:"absolute", bottom:12, right:12,
            background:`linear-gradient(135deg,${C.coral},${C.coral}CC)`,
            borderRadius:999, padding:"4px 12px",
            fontSize:13, fontWeight:900, color:"white",
            boxShadow:`0 2px 10px ${C.coralGlow}` }}>
            ab € {Number(exp.price).toFixed(0)}
          </div>
        )}
        {/* Spots */}
        {exp.spots_available > 0 && (
          <div style={{ position:"absolute", bottom:12, left:12,
            background:"rgba(16,185,129,0.22)", backdropFilter:"blur(8px)",
            border:`1px solid ${C.green}55`,
            borderRadius:999, padding:"3px 10px",
            fontSize:10, fontWeight:700, color:C.green }}>
            ✓ {exp.spots_available} Plätze
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:"12px 16px 14px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.ink,
          marginBottom:4, lineHeight:1.3 }}>
          {exp.title || "Erlebnis"}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>
          {exp.location_label || exp.city || ""}
        </div>
      </div>
    </div>
  );
});


/* ─── Rec Card ──────────────────────────────────────────────────── */
function RecCard({ rec }) {
  return (
    <div style={{ background:C.card, borderRadius:18, padding:"16px 18px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      border:`1px solid ${C.border}`, marginBottom:10,
      animation:"slideUp .32s ease both" }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal}40,${C.coral}40)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:800, color:C.teal, flexShrink:0 }}>
            {(rec.reviewer_name||"?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:C.ink }}>
              {rec.reviewer_name || "Kunde"}
            </div>
            {rec.work_title && (
              <div style={{ fontSize:11, color:C.muted }}>zu: {rec.work_title}</div>
            )}
          </div>
        </div>
        <div style={{ fontSize:13, color:C.gold, letterSpacing:1 }}>
          {"★".repeat(rec.rating||5)}
        </div>
      </div>
      {rec.text && (
        <p style={{ margin:0, fontSize:14, color:C.ink2,
          lineHeight:1.7, fontStyle:"italic" }}>
          „{rec.text}"
        </p>
      )}
    </div>
  );
}

/* ─── Profile normalization ─────────────────────────────────────── */
// buildMock nutzt jetzt normalizeProfileInput — einheitlicher Feldname-Ausgleich
// für alle Quellen: Mock-Daten, DiscoveryFeed, HomeFeed, FeedCards, etc.
function buildMock(rawWirker) {
  const normalized = normalizeProfileInput(rawWirker) || {};
  return {
    ...normalized,
    // Fallbacks für Display wenn keine DB-Daten vorhanden
    id:           normalized.id        || "mock",
    display_name: normalized.display_name || "Unbekannt",
    username:     normalized.username   || null,
    header_img:   normalized.header_img
      || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=85",
    bio:          normalized.bio        || "Kreativ. Präsent. Hier.",
    talent:       normalized.talent || normalized.has_talent_profile && 'Talent' || "Kreativität",
    location_label: normalized.location_label || "Deutschland",
    focus_type:   normalized.focus_type || "hybrid",
    dna_tags:     normalized.dna_tags?.length ? normalized.dna_tags
      : ["Kreativität","Handwerk","Visuell","Nachhaltig"],
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function WirkerProfilePage({ wirker: rawWirker, onClose, onBook, onMessage, onEdit }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [profile,        setProfile]       = useState(null);
  const [works,          setWorks]         = useState([]);
  const [exps,           setExps]          = useState([]);
  const [recs,           setRecs]          = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [followed,       setFollowed]      = useState(false);
  const [activeTab,      setActiveTab]     = useState("werke");
  const [heroLoaded,     setHeroLoaded]    = useState(false);
  const [ownerToolsOpen, setOwnerToolsOpen]= useState(false); // Creator-Tools Drawer
  const [activeTool,     setActiveTool]    = useState(null);  // "edit"|"analytics"|"earnings"|"insights"|"availability"|"settings"|"drafts"
  const tabsRef    = useRef(null);
  const contentRef = useRef(null);

  // Owner Mode: Nutzer schaut sein eigenes öffentliches Profil
  const isOwner = !!(
    user?.id &&
    profile &&
    (profile.id === user.id || profile.user_id === user.id)
  );

  const identifier = rawWirker?.user_id || rawWirker?.id || rawWirker?.username;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setProfile(null);
    setWorks([]); setExps([]); setRecs([]);
    load(mounted);
    return () => { mounted = false; };
  }, [identifier]);

  async function load(mounted = true) {
    try {
      // Normalisiere rawWirker: gleicht alle historischen Feldnamen an
      const norm    = normalizeProfileInput(rawWirker) || {};
      const uid     = norm.user_id || norm.id;
      const username = norm.username
        || (typeof rawWirker === "string" ? null : rawWirker?.username);
      // display_name-Suche als letzter Fallback (für FeedCards die creator=string übergeben)
      const nameStr = norm.display_name
        || (typeof rawWirker === "string" ? rawWirker : null);

      // Single profile query with field selection (no select *)
      let prof = null;
      if (uid) {
        const cacheKey = `profile-${uid}`;
        const res = await cachedQuery(cacheKey, () =>
          safeQuery(supabase.from("profiles").select(PROFILE_FIELDS).eq("id", uid).single()), 60000);
        prof = res.data;
      }
      if (!prof && username) {
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS).eq("username", username).single());
        prof = res.data;
      }
      // Fallback: Suche nach display_name (ungenau aber besser als nichts)
      if (!prof && nameStr && !uid && !username) {
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS)
            .ilike("display_name", nameStr).limit(1).single());
        prof = res.data;
        if (prof) console.log("[WirkerProfile] name-based lookup für:", nameStr);
      }

      const targetId = prof?.id || uid;
      if (mounted) setProfile(prof ? { ...buildMock(rawWirker), ...prof } : buildMock(rawWirker));

      // Batch all content queries in parallel
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
        if (mounted && worksRes.data?.length) setWorks(worksRes.data);
        if (mounted && expsRes.data?.length)  setExps(expsRes.data);
        if (mounted && recsRes.data?.length)  setRecs(recsRes.data);
      }
    } catch(e) {
      console.warn("[WirkerProfile] load:", e.message);
      if (mounted) setProfile(buildMock(rawWirker));
    } finally {
      if (mounted) setLoading(false);
    }
  }

  const focus = FOCUS[profile?.focus_type] || FOCUS.hybrid;
  const dna   = profile?.dna_tags || [];
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear() : null;

  // Auto-Tab basierend auf focus_type
  useEffect(() => {
    if (!profile) return;
    if (profile.focus_type === "experiences") setActiveTab("erlebnisse");
    else setActiveTab("werke");
  }, [profile?.focus_type]);

  if (loading) return <ProfileSkeleton />;
  if (!profile) {
    // Kein silent null — zeige Retry-Option
    return (
      <div style={{
        minHeight:"100vh", background:C.cream,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:16, padding:"0 32px",
        fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            position:"absolute", top:"max(52px,env(safe-area-inset-top,52px))", left:16,
            background:"rgba(0,0,0,0.08)", border:"none", borderRadius:12,
            padding:"8px 14px", fontSize:14, fontWeight:600,
            cursor:"pointer", color:C.ink2,
          }}>← Zurück</button>
        )}
        <div style={{ fontSize:40 }}>👤</div>
        <div style={{ fontSize:16, fontWeight:700, color:C.ink, textAlign:"center" }}>
          Profil konnte nicht geladen werden
        </div>
        <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>
          Bitte prüfe deine Verbindung und versuche es erneut.
        </div>
        <button onClick={() => { setLoading(true); setProfile(null); load(); }}
          style={{
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            color:"white", border:"none", borderRadius:999,
            padding:"12px 28px", fontSize:15, fontWeight:700,
            cursor:"pointer", marginTop:8,
            boxShadow:`0 4px 16px ${C.tealGlow}`,
          }}>
          Erneut laden
        </button>
      </div>
    );
  }

  const heroImg = profile.header_img
    || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=85";
  const avatarImg = profile.avatar_url || null;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background:C.cream, minHeight:"100vh", minHeight:"100dvh",
        fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
        overflowX:"hidden" }}>

        {/* ═══ HERO ═════════════════════════════════════════════════ */}
        <div style={{ position:"relative", height:"clamp(300px,52vw,420px)",
          overflow:"hidden", flexShrink:0 }}>
          {/* Cover image */}
          <LazyImage src={heroImg} alt=""
            onLoad={() => setHeroLoaded(true)}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"center",
              filter:"brightness(.75) saturate(1.08)",
              transition:"opacity .6s ease",
              opacity: heroLoaded ? 1 : 0 }}/>

          {/* Cinematic gradient layers */}
          <div style={{ position:"absolute", inset:0, background:
            `linear-gradient(175deg,
              ${focus.accent}28 0%,
              transparent 35%,
              rgba(0,0,0,0.15) 55%,
              rgba(15,12,8,0.75) 100%)`,
            pointerEvents:"none" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to right,rgba(0,0,0,0.18),transparent 60%)",
            pointerEvents:"none" }}/>

          {/* Top bar — back + actions */}
          <div style={{ position:"absolute", top:0, left:0, right:0,
            padding:"max(52px,env(safe-area-inset-top,52px)) 16px 0",
            display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            {onClose && (
              <button className="wp-tap" onClick={onClose}
                style={{ width:38, height:38, borderRadius:12,
                  background:"rgba(0,0,0,0.38)", backdropFilter:"blur(12px)",
                  border:"1px solid rgba(255,255,255,0.20)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontSize:15 }}>
                ←
              </button>
            )}
            <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
              {isOwner ? (
                /* Owner: kleiner "⚙" Chip — diskret, kein dominantes Dashboard-Feeling */
                <button className="wp-tap"
                  onClick={() => setOwnerToolsOpen(o => !o)}
                  style={{ height:34, padding:"0 12px", borderRadius:20,
                    background:"rgba(255,255,255,0.18)", backdropFilter:"blur(14px)",
                    border:"1px solid rgba(255,255,255,0.28)",
                    display:"flex", alignItems:"center", gap:5,
                    color:"rgba(255,255,255,0.92)", fontSize:12,
                    fontWeight:600, fontFamily:"inherit",
                    letterSpacing:0.1 }}>
                  <span style={{ fontSize:13 }}>⚙</span>
                  <span>Tools</span>
                </button>
              ) : (
                <button className="wp-tap"
                  style={{ width:38, height:38, borderRadius:12,
                    background:"rgba(0,0,0,0.38)", backdropFilter:"blur(12px)",
                    border:"1px solid rgba(255,255,255,0.20)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"white", fontSize:15 }}>
                  ⋯
                </button>
              )}
            </div>
          </div>

          {/* Hero bottom text — name + dna */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            padding:"0 20px 20px",
            animation:"fadeIn .5s .15s ease both" }}>
            {/* Focus badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.25)",
              borderRadius:50, padding:"4px 12px", marginBottom:10,
              fontSize:11, fontWeight:700, color:"white", letterSpacing:.3 }}>
              <span>{focus.icon}</span>
              <span>{focus.label}</span>
            </div>
            <h1 style={{ margin:0, fontSize:"clamp(26px,7vw,34px)", fontWeight:900,
              color:"white", letterSpacing:-1, lineHeight:1.1, marginBottom:4,
              textShadow:"0 2px 16px rgba(0,0,0,0.4)" }}>
              {profile.display_name}
            </h1>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)",
              fontWeight:500 }}>
              {profile.talent || profile.focus_type || 'Kreativität'}
              {profile.location_label && ` · ${profile.location_label}`}
            </div>
          </div>
        </div>

        {/* ── Atmospheric Fade Bridge ── */}
        <div aria-hidden="true" style={{
          height:52, marginTop:-52, position:"relative", zIndex:2,
          background:`linear-gradient(to bottom,transparent 0%,${C.warm}C0 55%,${C.warm} 100%)`,
          pointerEvents:"none",
        }}/> {/* hero-fade-bridge */}

        {/* ═══ PROFILE INFO BAND ════════════════════════════════════ */}
        <div style={{ background:C.warm, padding:"0 20px 14px",
          borderBottom:`1px solid ${C.border}`,
          animation:"slideUp .42s ease both" }}>

          {/* Avatar row — overlaps hero */}
          <div style={{ display:"flex", alignItems:"flex-end",
            justifyContent:"space-between", marginTop:-32, marginBottom:10 }}>
            {/* Avatar */}
            <div style={{ position:"relative" }}>
              <div style={{ width:78, height:78, borderRadius:"50%",
                border:"4px solid white",
                boxShadow:"0 4px 20px rgba(0,0,0,0.20)",
                overflow:"hidden", background:`linear-gradient(135deg,${C.teal}50,${C.coral}50)` }}>
                {avatarImg
                  ? <LazyImage src={avatarImg} alt={profile.display_name}
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                        objectPosition:"top" }}/>
                  : <div style={{ width:"100%", height:"100%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:26, fontWeight:900, color:"white" }}>
                      {profile.display_name?.charAt(0)||"?"}
                    </div>
                }
              </div>
              {/* Available dot */}
              {profile.is_available && (
                <div style={{ position:"absolute", bottom:2, right:2,
                  width:14, height:14, borderRadius:"50%",
                  background:C.green, border:"2.5px solid white",
                  boxShadow:`0 0 8px ${C.greenGlow}` }}/>
              )}
            </div>

            {/* Quick stats beside avatar */}
            <div style={{ display:"flex", gap:18, paddingBottom:4 }}>
              {[
                { v: profile.works_count||works.length||0,      l:"Werke" },
                { v: profile.recommendations_count||recs.length||0, l:"Empf." },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:17, fontWeight:900, color:C.ink,
                    lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2,
                    fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Username + since */}
          <div style={{ display:"flex", alignItems:"center", gap:8,
            marginBottom:6, flexWrap:"wrap" }}>
            {profile.username && (
              <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>
                @{profile.username.replace("@","")}
              </span>
            )}
            {memberSince && (
              <span style={{ fontSize:11, color:C.muted2,
                background:C.cream, borderRadius:50, padding:"2px 8px",
                border:`1px solid ${C.border}` }}>
                Dabei seit {memberSince}
              </span>
            )}
            {profile.is_available && (
              <span style={{ fontSize:11, color:C.green, fontWeight:700,
                background:C.greenPale||"#ECFDF5",
                borderRadius:50, padding:"2px 8px",
                border:`1px solid ${C.green}30`,
                display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:"50%",
                  background:C.green, display:"inline-block",
                  animation:"breathe 2s ease-in-out infinite" }}/>
                Verfügbar
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ margin:"0 0 10px", fontSize:14, color:C.ink2,
              lineHeight:1.65, fontStyle:"italic" }}>
              „{profile.bio}"
            </p>
          )}

          {/* DNA Tags */}
          {dna.length > 0 && (
            <div className="wp-scroll"
              style={{ display:"flex", gap:7, marginBottom:18,
                paddingBottom:2 }}>
              {dna.map((tag,i) => (
                <div key={i} style={{
                  display:"inline-flex", alignItems:"center",
                  background:`${focus.accent}14`,
                  border:`1px solid ${focus.accent}33`,
                  borderRadius:50, padding:"5px 13px", flexShrink:0,
                  fontSize:12, fontWeight:600, color:focus.accent,
                  whiteSpace:"nowrap" }}>
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons — Owner vs. Visitor */}
          {isOwner ? (
            /* ── OWNER MODE: Instagram-Style — wie eigenes Profil bei Insta ── */
            <div style={{ display:"flex", gap:8 }}>
              {/* "Profil bearbeiten" — primärer Button wie bei Instagram */}
              <button className="wp-tap"
                onClick={() => setActiveTool('edit')}
                style={{ flex:1, padding:"11px 12px",
                  background:"rgba(0,0,0,0.06)",
                  border:"1.5px solid rgba(0,0,0,0.10)",
                  borderRadius:14, fontSize:13.5, fontWeight:700,
                  color:"#1A1A1A", fontFamily:"inherit",
                  letterSpacing:-0.1 }}>
                Profil bearbeiten
              </button>
              {/* "Creator Tools" — sekundär, diskret */}
              <button className="wp-tap"
                onClick={() => setOwnerToolsOpen(o => !o)}
                style={{ flex:1, padding:"11px 12px",
                  background: ownerToolsOpen
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : "rgba(0,0,0,0.06)",
                  border: ownerToolsOpen ? "none" : "1.5px solid rgba(0,0,0,0.10)",
                  borderRadius:14, fontSize:13.5, fontWeight:700,
                  color: ownerToolsOpen ? "white" : "#1A1A1A",
                  fontFamily:"inherit", letterSpacing:-0.1,
                  boxShadow: ownerToolsOpen ? `0 4px 14px ${C.tealGlow}` : "none",
                  transition:"all .18s ease" }}>
                {ownerToolsOpen ? "✕ Schließen" : "Creator Tools"}
              </button>
            </div>
          ) : (
            /* ── VISITOR MODE: Standard CTAs ── */
            <div style={{ display:"flex", gap:9 }}>
              {/* Folgen */}
              <button className="wp-tap" onClick={() => setFollowed(f=>!f)}
                style={{ flex:1, padding:"12px 8px",
                  background: followed
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : "rgba(0,0,0,0.05)",
                  border: followed ? "none" : `1.5px solid ${C.border}`,
                  borderRadius:16, fontSize:13, fontWeight:800,
                  color: followed ? "white" : C.ink2,
                  fontFamily:"inherit",
                  boxShadow: followed ? `0 4px 16px ${C.tealGlow}` : "none",
                  transition:"all .22s cubic-bezier(.34,1.4,.64,1)",
                  position:"relative", overflow:"hidden" }}>
                {followed && (
                  <div style={{ position:"absolute", inset:0,
                    background:"linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)",
                    animation:"shimmer 3s ease-in-out infinite" }}/>
                )}
                <span style={{ position:"relative" }}>
                  {followed ? "✓ Folge ich" : "Folgen"}
                </span>
              </button>
              {/* Nachricht */}
              <button className="wp-tap"
                onClick={() => onMessage?.(profile)}
                style={{ flex:1, padding:"12px 8px",
                  background:"rgba(22,215,197,0.09)",
                  border:`1.5px solid ${C.teal}30`,
                  borderRadius:16, fontSize:13, fontWeight:700,
                  color:C.teal, fontFamily:"inherit" }}>
                Nachricht
              </button>
              {/* Anfrage */}
              <button className="wp-tap"
                onClick={() => onBook?.(profile)}
                style={{ flex:1, padding:"12px 8px",
                  background:`linear-gradient(135deg,${C.coral},${C.coral}CC)`,
                  border:"none", borderRadius:16, fontSize:13, fontWeight:800,
                  color:"white", fontFamily:"inherit",
                  boxShadow:`0 4px 14px ${C.coralGlow}` }}>
                Anfrage
              </button>
            </div>
          )}
        </div>

        {/* ═══ OWNER TOOLS DRAWER — slide-down, kein Modal ════════ */}
        {isOwner && ownerToolsOpen && (
          <div style={{
            background:"#FFFFFF",
            borderBottom:`1px solid ${C.border}`,
            overflow:"hidden",
            animation:"slideDown .22s cubic-bezier(.34,1.2,.64,1) both",
          }}>
            <div style={{ padding:"16px 20px 20px" }}>
              {/* Titre */}
              <div style={{ fontSize:11, fontWeight:700, color:C.muted,
                letterSpacing:1.2, textTransform:"uppercase", marginBottom:14 }}>
                Creator Tools
              </div>
              {/* Tool Grid — 2 Spalten, genau wie TikTok Creator Center */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { icon:"📊", label:"Analytics",     sub:"Views & Reichweite",      key:"analytics" },
                  { icon:"💰", label:"Einnahmen",     sub:"Buchungen & Umsatz",      key:"earnings" },
                  { icon:"📝", label:"Entwürfe",      sub:"Unveröff. Inhalte",       key:"drafts" },
                  { icon:"⚡", label:"Insights",      sub:"KI-Tipps für dich",       key:"insights" },
                  { icon:"🗓", label:"Verfügbarkeit", sub:"Kalender & Slots",        key:"availability" },
                  { icon:"⚙", label:"Einstellungen", sub:"Konto & Sichtbarkeit",    key:"settings" },
                ].map((tool) => (
                  <button key={tool.label} className="wp-tap"
                    onClick={() => { setOwnerToolsOpen(false); setActiveTool(tool.key); }}
                    style={{
                      padding:"12px 14px", borderRadius:14,
                      background:"rgba(0,0,0,0.03)",
                      border:`1px solid ${C.border}`,
                      textAlign:"left", cursor:"pointer",
                      fontFamily:"inherit",
                      transition:"background .12s ease",
                    }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{tool.icon}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:C.ink, letterSpacing:-.1 }}>
                      {tool.label}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:1, lineHeight:1.3 }}>
                      {tool.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STATS ROW ════════════════════════════════════════════ */}
        <div style={{ background:C.warm, padding:"14px 20px 16px",
          borderBottom:`1px solid ${C.border}`,
          display:"flex", gap:0 }}>
          {[
            { v: works.length || profile.works_count || 0,
              l:"Werke", accent:C.gold },
            { v: exps.length || profile.experience_count || 0,
              l:"Erlebnisse", accent:C.coral },
            { v: recs.length || profile.recommendations_count || 0,
              l:"Empfehlungen", accent:C.teal },
            { v: profile.impact_eur
                ? `€${Math.round(profile.impact_eur/100)*100}`
                : "—",
              l:"Impact", accent:C.green },
          ].map((s,i,arr) => (
            <div key={i} style={{ flex:1, textAlign:"center",
              borderRight: i < arr.length-1 ? `1px solid ${C.border}` : "none",
              padding:"4px 0" }}>
              <div style={{ fontSize:17, fontWeight:900, color:s.accent,
                lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:3,
                fontWeight:500, letterSpacing:.2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ═══ STICKY TABS ══════════════════════════════════════════ */}
        <div ref={tabsRef} className="wp-sticky-tabs"
          style={{ background:"rgba(249,246,242,0.92)",
            borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", padding:"10px 16px 0", gap:4 }}>
            {[
              { key:"werke",      label:"Werke",        accent:C.gold },
              { key:"erlebnisse", label:"Erlebnisse",   accent:C.coral },
              { key:"empf",       label:"Empfehlungen", accent:C.teal },
            ].map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} className="wp-tap"
                  onClick={() => setActiveTab(tab.key)}
                  style={{ flex:1, padding:"10px 4px 10px",
                    background:"none", border:"none",
                    borderBottom: active
                      ? `2.5px solid ${tab.accent}`
                      : "2.5px solid transparent",
                    fontSize:12, fontWeight: active ? 800 : 500,
                    color: active ? tab.accent : C.muted,
                    transition:"all .2s ease",
                    letterSpacing:.2,
                    fontFamily:"inherit" }}>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ TAB CONTENT ══════════════════════════════════════════ */}
        <div ref={contentRef} style={{ padding:"20px 16px 40px",
          animation:"tabSlide .28s ease both" }}>

          {/* ── WERKE ── */}
          {activeTab === "werke" && (
            <div>
              {works.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 24px",
                  color:C.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🎨</div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.ink,
                    marginBottom:6 }}>Noch keine Werke</div>
                  <div style={{ fontSize:13, lineHeight:1.6 }}>
                    Hier entstehen bald kreative Werke.
                  </div>
                </div>
              ) : (
                <div style={{ display:"grid",
                  gridTemplateColumns: works.length === 1
                    ? "1fr"
                    : "repeat(2,1fr)",
                  gap:12 }}>
                  {/* Erstes Werk full-width wenn ungerade Anzahl */}
                  {works.length % 2 !== 0 && (
                    <div style={{ gridColumn:"1/-1" }}>
                      <WorkCard work={works[0]} fullWidth onTap={w=>onBook?.(w)}/>
                    </div>
                  )}
                  {works.slice(works.length % 2 !== 0 ? 1 : 0).map((w,i) => (
                    <WorkCard key={w.id||i} work={w} onTap={w=>onBook?.(w)}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ERLEBNISSE ── */}
          {activeTab === "erlebnisse" && (
            <div>
              {exps.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 24px",
                  color:C.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.ink,
                    marginBottom:6 }}>Noch keine Erlebnisse</div>
                  <div style={{ fontSize:13, lineHeight:1.6 }}>
                    Erlebnisse entstehen bald.
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {exps.map((exp,i) => (
                    <ExpCard key={exp.id||i} exp={exp} fullWidth onTap={e=>onBook?.(e)}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EMPFEHLUNGEN ── */}
          {activeTab === "empf" && (
            <div>
              {recs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 24px",
                  color:C.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>💬</div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.ink,
                    marginBottom:6 }}>Noch keine Empfehlungen</div>
                  <div style={{ fontSize:13, lineHeight:1.6 }}>
                    Empfehlungen erscheinen nach abgeschlossenen Buchungen.
                  </div>
                </div>
              ) : (
                <div>
                  {recs.map((rec,i) => (
                    <RecCard key={rec.id||i} rec={rec}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ FLOATING BOOK CTA ════════════════════════════════════ */}
        <div style={{ position:"sticky", bottom:0, left:0, right:0,
          padding:"12px 16px max(20px,env(safe-area-inset-bottom,20px))",
          background:"rgba(249,246,242,0.92)",
          backdropFilter:"blur(20px) saturate(1.6)",
          borderTop:`1px solid ${C.border}`,
          boxShadow:"0 -4px 20px rgba(0,0,0,0.07)" }}>
          <button className="wp-tap" onClick={() => onBook?.(profile)}
            style={{ width:"100%", padding:"15px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:18,
              fontSize:15, fontWeight:900, color:"white",
              fontFamily:"inherit", position:"relative", overflow:"hidden",
              boxShadow:`0 6px 24px ${C.tealGlow},0 2px 8px rgba(0,0,0,0.12)` }}>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)",
              animation:"shimmer 3.5s ease-in-out infinite",
              pointerEvents:"none" }}/>
            <span style={{ position:"relative" }}>
              ✨ Anfrage stellen
            </span>
          </button>
        </div>

      </div>

      {/* ═══ CREATOR TOOL OVERLAYS — nur sichtbar wenn isOwner ══════ */}
      {isOwner && activeTool && (
        <OwnerToolOverlay
          activeTool={activeTool}
          user={user}
          profile={profile}
          onClose={() => setActiveTool(null)}
          onSave={(updated) => { setProfile(p => ({...p, ...updated})); setActiveTool(null); }}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// OwnerToolOverlay — crashsicherer zentraler Wrapper für alle Tools
// Kein externe Component-Import-Crash kann die App killen
// ══════════════════════════════════════════════════════════════════
class ToolErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError:false, errMsg:'' }; }
  static getDerivedStateFromError(e) { return { hasError:true, errMsg:e.message }; }
  componentDidCatch(e) { console.error('[OwnerTool crash]', e); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding:"40px 24px", textAlign:"center",
          fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⚡</div>
          <div style={{ fontWeight:800, fontSize:16, color:"#1A1A1A", marginBottom:8 }}>
            Kurzer Aussetzer
          </div>
          <div style={{ fontSize:13, color:"rgba(60,60,60,0.55)", marginBottom:20, lineHeight:1.6 }}>
            {this.state.errMsg || "Dieser Bereich konnte nicht geladen werden."}
          </div>
          <button onClick={this.props.onClose}
            style={{ padding:"12px 24px", borderRadius:50, background:"#16D7C5",
              color:"white", border:"none", fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>
            Zurück zum Profil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function OwnerToolOverlay({ activeTool, user, profile, onClose, onSave }) {
  const OL = {
    position:"fixed", inset:0, zIndex:950,
    background:"#F9F7F4", overflowY:"auto",
    fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",
    animation:"fadeIn .18s ease both",
  };

  return (
    <div style={OL}>
      <ToolErrorBoundary onClose={onClose}>
        {activeTool === "edit" && (
          <EditProfile user={user} profile={profile} onClose={onClose} onSave={onSave} />
        )}
        {activeTool === "analytics" && <InlineAnalytics user={user} onBack={onClose} />}
        {activeTool === "earnings"  && <InlineEarnings  user={user} onBack={onClose} />}
        {activeTool === "availability" && <InlineAvailability user={user} onBack={onClose} />}
        {activeTool === "settings" && <InlineSettings user={user} profile={profile} onBack={onClose} onLogout={onClose} />}
        {(activeTool === "insights" || activeTool === "drafts") && (
          <ToolPlaceholder toolKey={activeTool} onBack={onClose} />
        )}
      </ToolErrorBoundary>
    </div>
  );
}

// ── Shared Tool UI Helpers ────────────────────────────────────────
const TC = {
  bg:"#F9F7F4", card:"#FFFFFF", teal:"#16D7C5", teal2:"#12B8A8",
  coral:"#FF8A6B", gold:"#F5A623", green:"#10B981",
  ink:"#1A1A1A", ink2:"#3D3D3D", muted:"rgba(60,60,60,0.48)",
  border:"rgba(0,0,0,0.07)", tealGlow:"rgba(22,215,197,0.25)",
};

function ToolHeader({ title, onBack, emoji }) {
  return (
    <div style={{
      position:"sticky", top:0, zIndex:10,
      background:"rgba(249,246,242,0.95)", backdropFilter:"blur(20px)",
      borderBottom:`1px solid ${TC.border}`,
      padding:"max(52px,env(safe-area-inset-top,52px)) 20px 14px",
      display:"flex", alignItems:"center", gap:12,
    }}>
      <button onClick={onBack}
        style={{ width:36, height:36, borderRadius:12, background:"rgba(0,0,0,0.05)",
          border:`1.5px solid ${TC.border}`, fontSize:16, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", color:TC.ink }}>
        ←
      </button>
      <div style={{ fontSize:18, fontWeight:900, color:TC.ink, letterSpacing:-.4, flex:1 }}>
        {emoji && <span style={{ marginRight:8 }}>{emoji}</span>}{title}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:TC.card, borderRadius:16, padding:"18px 16px",
      border:`1px solid ${TC.border}`, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:900, color:color||TC.teal, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, color:TC.muted, fontWeight:500 }}>{label}</div>
    </div>
  );
}

// ── ANALYTICS (crashsicher — nur existierende Felder) ─────────────
function InlineAnalytics({ user, onBack }) {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    Promise.all([
      supabase.from("bookings")
        .select("id,amount,status", { count:"exact", head:false })
        .eq("wirker_id", user.id)
        .limit(500),
      supabase.from("follows")
        .select("follower_id", { count:"exact", head:true })
        .eq("followed_id", user.id),
      supabase.from("works")
        .select("id", { count:"exact", head:true })
        .eq("user_id", user.id),
    ]).then(([bookRes, followRes, worksRes]) => {
      const allBookings = bookRes.data || [];
      const completed   = allBookings.filter(b => b.status === "completed");
      const revenue     = completed.reduce((s,b) => s + (+b.amount||0), 0) * 0.85;
      setStats({
        bookings:  bookRes.count  || allBookings.length || 0,
        followers: followRes.count || 0,
        works:     worksRes.count  || 0,
        revenue:   revenue.toFixed(2),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  return (
    <>
      <ToolHeader title="Analytics" emoji="📊" onBack={onBack} />
      <div style={{ padding:"20px 20px 60px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:TC.muted }}>Lade…</div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <StatCard icon="👥" label="Follower"        value={stats.followers} color={TC.coral} />
              <StatCard icon="📅" label="Buchungen"       value={stats.bookings}  color={TC.teal} />
              <StatCard icon="🎨" label="Werke"           value={stats.works}     color={TC.gold} />
              <StatCard icon="💰" label="Einnahmen (netto)" value={`€ ${stats.revenue}`} color={TC.green} />
            </div>
            <div style={{ background:TC.card, borderRadius:16, padding:"16px 18px",
              border:`1px solid ${TC.border}`, fontSize:13, color:TC.muted, lineHeight:1.6 }}>
              📈 Detaillierte Charts & Wachstums-Tracking kommen bald.
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── EINNAHMEN (crashsicher) ───────────────────────────────────────
function InlineEarnings({ user, onBack }) {
  const [bookings, setBookings] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [requested, setReq]     = React.useState(false);

  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    supabase.from("bookings")
      .select("id,amount,status,created_at,service,service_title,work_title")
      .eq("wirker_id", user.id)
      .order("created_at", { ascending:false })
      .limit(50)
      .then(({ data }) => { setBookings(data||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const completed = bookings.filter(b => ["completed","released"].includes(b.status));
  const pending   = bookings.filter(b => ["confirmed","in_progress","accepted"].includes(b.status));
  const netTotal  = completed.reduce((s,b) => s + (+b.amount||0), 0) * 0.85;
  const pendingTotal = pending.reduce((s,b) => s + (+b.amount||0), 0) * 0.85;

  return (
    <>
      <ToolHeader title="Einnahmen" emoji="💰" onBack={onBack} />
      <div style={{ padding:"20px 20px 60px" }}>
        {/* Summary Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          <StatCard icon="✅" label="Verfügbar"  value={`€ ${netTotal.toFixed(2)}`}     color={TC.green} />
          <StatCard icon="⏳" label="Ausstehend" value={`€ ${pendingTotal.toFixed(2)}`} color={TC.gold} />
        </div>
        {/* Impact Anteil */}
        <div style={{ background:"linear-gradient(135deg,rgba(22,215,197,0.08),rgba(22,215,197,0.03))",
          borderRadius:16, padding:"14px 18px", border:"1.5px solid rgba(22,215,197,0.15)",
          marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🌱</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:TC.teal }}>
              Impact bewirkt: € {(netTotal * 0.025 / 0.85).toFixed(2)}
            </div>
            <div style={{ fontSize:11.5, color:TC.muted, marginTop:1 }}>
              2,5% jeder Buchung fließt in soziale Projekte.
            </div>
          </div>
        </div>
        {/* Auszahlung */}
        {netTotal > 0 && (
          <button disabled={requested} onClick={() => setReq(true)}
            style={{ width:"100%", padding:"14px", borderRadius:50, marginBottom:20, cursor:"pointer",
              background: requested ? "rgba(16,185,129,0.1)" : `linear-gradient(135deg,${TC.green},#0ea070)`,
              border: requested ? `1.5px solid ${TC.green}44` : "none",
              color: requested ? TC.green : "white",
              fontWeight:800, fontSize:14, fontFamily:"inherit",
              boxShadow: requested ? "none" : "0 4px 16px rgba(16,185,129,0.3)" }}>
            {requested ? "✓ Auszahlung angefordert" : "Auszahlung anfordern"}
          </button>
        )}
        {/* Transaktionen */}
        <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
          letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>
          Transaktionen
        </div>
        {loading ? (
          <div style={{ textAlign:"center", padding:32, color:TC.muted }}>Lade…</div>
        ) : completed.length === 0 ? (
          <div style={{ background:TC.card, borderRadius:16, padding:24, textAlign:"center",
            border:`1px solid ${TC.border}` }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
            <div style={{ fontSize:14, color:TC.muted }}>Noch keine abgeschlossenen Buchungen</div>
          </div>
        ) : completed.map(b => {
          const title = b.work_title || b.service_title || b.service || "Buchung";
          const net   = ((+b.amount||0) * 0.85).toFixed(2);
          const date  = new Date(b.created_at).toLocaleDateString("de-DE",
            { day:"numeric", month:"short" });
          return (
            <div key={b.id} style={{ background:TC.card, borderRadius:14, marginBottom:8,
              border:`1px solid ${TC.border}`, padding:"14px 16px",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:TC.ink }}>{title}</div>
                <div style={{ fontSize:12, color:TC.muted, marginTop:2 }}>{date}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800, fontSize:15, color:TC.green }}>€ {net}</div>
                <div style={{ fontSize:11, color:TC.muted }}>nach Provision</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── VERFÜGBARKEIT (crashsicher) ───────────────────────────────────
function InlineAvailability({ user, onBack }) {
  const [slots,   setSlots]  = React.useState([]);
  const [loading, setLoading]= React.useState(true);
  const [adding,  setAdding] = React.useState(false);
  const [newDate, setNewDate]= React.useState("");

  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    supabase.from("availability_slots")
      .select("id,date,time_from,time_to,blocked,note")
      .eq("user_id", user.id)
      .order("date", { ascending:true })
      .limit(60)
      .then(({ data }) => { setSlots(data||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  async function addSlot() {
    if (!newDate || !user?.id) return;
    const { data } = await supabase.from("availability_slots")
      .insert({ user_id:user.id, date:newDate, blocked:false })
      .select().single();
    if (data) setSlots(s => [...s, data]);
    setAdding(false); setNewDate("");
  }

  async function removeSlot(id) {
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots(s => s.filter(x => x.id !== id));
  }

  return (
    <>
      <ToolHeader title="Verfügbarkeit" emoji="🗓" onBack={onBack} />
      <div style={{ padding:"20px 20px 60px" }}>
        <button onClick={() => setAdding(a => !a)}
          style={{ width:"100%", padding:"13px", borderRadius:50, marginBottom:16, cursor:"pointer",
            background: adding ? "rgba(0,0,0,0.05)" : `linear-gradient(135deg,${TC.teal},${TC.teal2})`,
            border: adding ? `1.5px solid ${TC.border}` : "none",
            color: adding ? TC.ink : "white", fontWeight:700, fontSize:14, fontFamily:"inherit",
            boxShadow: adding ? "none" : `0 4px 14px ${TC.tealGlow}` }}>
          {adding ? "Abbrechen" : "+ Verfügbaren Tag hinzufügen"}
        </button>
        {adding && (
          <div style={{ background:TC.card, borderRadius:16, padding:"16px", marginBottom:16,
            border:`1px solid ${TC.border}` }}>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              style={{ width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${TC.border}`,
                fontSize:14, fontFamily:"inherit", marginBottom:10, boxSizing:"border-box" }} />
            <button onClick={addSlot}
              style={{ width:"100%", padding:"12px", borderRadius:50, cursor:"pointer",
                background:TC.green, color:"white", border:"none", fontWeight:700, fontFamily:"inherit" }}>
              Hinzufügen
            </button>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign:"center", padding:32, color:TC.muted }}>Lade…</div>
        ) : slots.length === 0 ? (
          <div style={{ background:TC.card, borderRadius:16, padding:24, textAlign:"center",
            border:`1px solid ${TC.border}` }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🗓</div>
            <div style={{ fontSize:14, color:TC.muted }}>Noch keine Slots eingetragen</div>
          </div>
        ) : slots.map(s => (
          <div key={s.id} style={{ background:TC.card, borderRadius:14, marginBottom:8,
            border:`1px solid ${TC.border}`, padding:"13px 16px",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:TC.ink }}>
                {new Date(s.date).toLocaleDateString("de-DE", { weekday:"short", day:"numeric", month:"short" })}
              </div>
              {s.blocked && <div style={{ fontSize:11, color:TC.coral, marginTop:2 }}>Blockiert</div>}
            </div>
            <button onClick={() => removeSlot(s.id)}
              style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:TC.muted }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── EINSTELLUNGEN (crashsicher) ───────────────────────────────────
function InlineSettings({ user, profile, onBack, onLogout }) {
  const [section, setSection] = React.useState("konto");
  const [displayName, setDisplayName] = React.useState(profile?.display_name || "");
  const [email] = React.useState(user?.email || "");
  const [saving, setSaving] = React.useState(false);
  const [saved,  setSaved]  = React.useState(false);
  const [isAvail, setIsAvail] = React.useState(profile?.is_available ?? true);

  async function saveKonto() {
    if (!user?.id || saving) return;
    setSaving(true);
    await supabase.from("profiles").update({
      display_name: displayName, is_available: isAvail,
      updated_at: new Date().toISOString()
    }).eq("id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const SECTIONS = [
    { key:"konto",   label:"Konto" },
    { key:"sicht",   label:"Sichtbarkeit" },
    { key:"zahlung", label:"Zahlungen" },
  ];

  return (
    <>
      <ToolHeader title="Einstellungen" emoji="⚙" onBack={onBack} />
      {/* Section Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${TC.border}`,
        background:TC.card, overflowX:"auto" }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            style={{ padding:"12px 18px", border:"none", background:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, whiteSpace:"nowrap",
              fontWeight: section===s.key ? 800 : 500,
              color: section===s.key ? TC.teal : TC.muted,
              borderBottom: section===s.key ? `2.5px solid ${TC.teal}` : "2.5px solid transparent" }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ padding:"20px 20px 80px" }}>
        {section === "konto" && (<>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted, letterSpacing:1.1,
              textTransform:"uppercase", marginBottom:6 }}>Anzeigename</div>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              style={{ width:"100%", padding:"13px 16px", borderRadius:14,
                border:`1.5px solid ${TC.border}`, background:"rgba(0,0,0,0.03)",
                fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted, letterSpacing:1.1,
              textTransform:"uppercase", marginBottom:6 }}>E-Mail</div>
            <div style={{ padding:"13px 16px", borderRadius:14, background:"rgba(0,0,0,0.03)",
              border:`1.5px solid ${TC.border}`, fontSize:14, color:TC.muted }}>{email}</div>
          </div>
          <button onClick={saveKonto} disabled={saving}
            style={{ width:"100%", padding:"14px", borderRadius:50, cursor:"pointer",
              background: saved ? TC.green : `linear-gradient(135deg,${TC.teal},${TC.teal2})`,
              border:"none", color:"white", fontWeight:700, fontSize:14, fontFamily:"inherit",
              boxShadow:`0 4px 14px ${TC.tealGlow}`, marginBottom:20 }}>
            {saved ? "✓ Gespeichert" : saving ? "..." : "Speichern"}
          </button>
          <button onClick={onLogout}
            style={{ width:"100%", padding:"13px", borderRadius:50, cursor:"pointer",
              background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)",
              color:"#EF4444", fontWeight:700, fontSize:14, fontFamily:"inherit" }}>
            Abmelden
          </button>
        </>)}
        {section === "sicht" && (
          <div style={{ background:TC.card, borderRadius:16, padding:"16px 18px",
            border:`1px solid ${TC.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:TC.ink }}>
                  {isAvail ? "✅ Nimmt Anfragen an" : "⏸ Nicht verfügbar"}
                </div>
                <div style={{ fontSize:12, color:TC.muted, marginTop:2 }}>
                  Steuert ob du buchbar bist
                </div>
              </div>
              <div onClick={() => setIsAvail(v => !v)}
                style={{ width:48, height:28, borderRadius:50, cursor:"pointer",
                  background: isAvail ? TC.teal : "rgba(0,0,0,0.15)",
                  position:"relative", transition:"background .2s", flexShrink:0 }}>
                <div style={{ position:"absolute", top:3, transition:"left .2s",
                  left: isAvail ? 23 : 3, width:22, height:22, borderRadius:"50%",
                  background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>
        )}
        {section === "zahlung" && (
          <div style={{ background:TC.card, borderRadius:16, padding:24, textAlign:"center",
            border:`1px solid ${TC.border}` }}>
            <div style={{ fontSize:32, marginBottom:10 }}>💳</div>
            <div style={{ fontWeight:700, color:TC.ink, marginBottom:6 }}>Zahlungsinfos</div>
            <div style={{ fontSize:13, color:TC.muted, lineHeight:1.6 }}>
              Stripe-Konto & Bankverbindung werden über den sicheren Auszahlungs-Flow eingerichtet.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Tool Placeholder für Insights + Entwürfe ──────────────────────
function ToolPlaceholder({ toolKey, onBack }) {
  const isInsights = toolKey === "insights";
  const C2 = { bg:"#F9F7F4", ink:"#1A1A1A", muted:"rgba(60,60,60,0.50)",
    teal:"#16D7C5", card:"#FFFFFF", border:"rgba(0,0,0,0.07)" };

  const INSIGHTS = [
    { icon:"🌅", tip:"Deine Inhalte performen abends am besten — 19–21 Uhr." },
    { icon:"🌿", tip:"Naturbilder erhalten 2× mehr Saves als Studio-Fotos." },
    { icon:"✨", tip:"Community-Erlebnisse wachsen gerade besonders stark." },
    { icon:"🎯", tip:"Dein Profil wirkt ruhig & kreativ — das trifft einen Nerv." },
    { icon:"💬", tip:"Antworte auf die ersten 3 Kommentare — steigert Reichweite." },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:C2.bg, overflowY:"auto",
      fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 40px" }}>

        {/* Back */}
        <button onClick={onBack}
          style={{ background:"none", border:"none", fontSize:20, cursor:"pointer",
            color:C2.ink, marginBottom:24, display:"flex", alignItems:"center", gap:8,
            fontWeight:600, fontSize:14 }}>
          ← {isInsights ? "Insights" : "Entwürfe"}
        </button>

        {/* Hero */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>
            {isInsights ? "⚡" : "📝"}
          </div>
          <div style={{ fontSize:24, fontWeight:900, color:C2.ink, marginBottom:6, letterSpacing:-0.5 }}>
            {isInsights ? "Deine Insights" : "Deine Entwürfe"}
          </div>
          <div style={{ fontSize:14, color:C2.muted, lineHeight:1.6 }}>
            {isInsights
              ? "Personalisierte Tipps basierend auf deinen Inhalten."
              : "Inhalte die du begonnen, aber noch nicht veröffentlicht hast."}
          </div>
        </div>

        {/* Content */}
        {isInsights ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {INSIGHTS.map((ins, idx) => (
              <div key={idx} style={{
                background:C2.card, borderRadius:16, padding:"16px 18px",
                border:`1px solid ${C2.border}`,
                boxShadow:"0 1px 8px rgba(0,0,0,0.04)",
                display:"flex", alignItems:"flex-start", gap:14,
                animation:"fadeIn .3s ease both",
                animationDelay:`${idx * 0.07}s`,
              }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{ins.icon}</span>
                <span style={{ fontSize:14, color:C2.ink, lineHeight:1.55, fontWeight:500 }}>
                  {ins.tip}
                </span>
              </div>
            ))}
            <div style={{ marginTop:8, padding:"14px 18px", borderRadius:16,
              background:`linear-gradient(135deg,rgba(22,215,197,0.08),rgba(22,215,197,0.03))`,
              border:"1.5px solid rgba(22,215,197,0.18)",
              fontSize:13, color:"rgba(22,215,197,0.85)", fontWeight:600, textAlign:"center" }}>
              🔮 KI-Insights werden personalisierter, je mehr du postest.
            </div>
          </div>
        ) : (
          <div style={{ background:C2.card, borderRadius:20, padding:28,
            border:`1px solid ${C2.border}`, textAlign:"center",
            boxShadow:"0 2px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:42, marginBottom:14 }}>📄</div>
            <div style={{ fontSize:16, fontWeight:700, color:C2.ink, marginBottom:8 }}>
              Keine Entwürfe vorhanden
            </div>
            <div style={{ fontSize:13, color:C2.muted, lineHeight:1.6 }}>
              Wenn du einen Inhalt anfängst und nicht sofort veröffentlichst, wird er hier gespeichert.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}