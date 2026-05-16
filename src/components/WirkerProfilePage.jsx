// WirkerProfilePage.jsx — HUI v3
// Mobile-First Cinematic Profile
// Dieselbe Premium-DNA wie Desktop — nur kompakter

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import LazyImage from "./LazyImage";
import { safeQuery, batchQueries, FIELDS, PROFILE_FIELDS, normalizeProfileInput, optimizeImg, cachedQuery, clearQueryCache } from "../lib/perfUtils";
import { useAuth } from "../lib/AuthContext";
import { fetchCreatorInsights } from "../lib/InsightsEngine";
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
const WorkCard = React.memo(function WorkCard({ work, fullWidth=false, onTap, onLike, onSave, liked, saved }) {
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
  // Mood aus Text ableiten
  const txt  = (rec.text||"").toLowerCase();
  const mood = txt.includes("kreativ") ? { label:"kreativ", color:"#8B5CF6", bg:"rgba(139,92,246,0.08)" }
    : txt.includes("ruhig")||txt.includes("angenehm") ? { label:"ruhig", color:C.teal, bg:"rgba(22,215,197,0.08)" }
    : txt.includes("warm")||txt.includes("herzlich")  ? { label:"warm",  color:C.coral,bg:"rgba(255,138,107,0.08)" }
    : txt.includes("professionell")||txt.includes("präzise") ? { label:"profi", color:C.gold, bg:"rgba(245,166,35,0.08)" }
    : txt.includes("authentisch")||txt.includes("echt") ? { label:"echt", color:C.green, bg:"rgba(16,185,129,0.08)" }
    : { label:"inspirierend", color:C.teal, bg:"rgba(22,215,197,0.08)" };
  const date = rec.created_at
    ? new Date(rec.created_at).toLocaleDateString("de-DE",{month:"long",year:"numeric"}) : "";
  return (
    <div style={{ background:C.card, borderRadius:20, marginBottom:12,
      border:`1px solid ${C.border}`,
      boxShadow:"0 1px 12px rgba(0,0,0,0.05)", overflow:"hidden",
      animation:"slideUp .32s ease both" }}>
      <div style={{ height:3, background:mood.color }} />
      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:900, color:"white" }}>
            {(rec.reviewer_name||"?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:13.5, color:C.ink }}>
              {rec.reviewer_name || "HUI-Mitglied"}
            </div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>
              {rec.work_title ? `Zu: ${rec.work_title}` : "Persönliche Erfahrung"}
              {date && ` · ${date}`}
            </div>
          </div>
          <div style={{ padding:"4px 10px", borderRadius:50, flexShrink:0,
            background:mood.bg, border:`1px solid ${mood.color}33`,
            fontSize:11, fontWeight:700, color:mood.color }}>
            {mood.label}
          </div>
        </div>
        {rec.text && (
          <p style={{ margin:"0 0 10px", fontSize:14, color:C.ink2,
            lineHeight:1.7, fontStyle:"italic" }}>
            „{rec.text}"
          </p>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.green }} />
          <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>
            Verifizierte Empfehlung nach Buchungsabschluss
          </span>
        </div>
      </div>
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
  const [profile,        setProfile]       = useState(null);
  const [works,          setWorks]         = useState([]);
  const [exps,           setExps]          = useState([]);
  const [recs,           setRecs]          = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [followed,       setFollowed]      = useState(false);
  const [followLoading,  setFollowLoading] = useState(false);
  const [showChat,       setShowChat]      = useState(false);
  const [showRequest,    setShowRequest]   = useState(false);
  const [showMore,       setShowMore]      = useState(false);
  const [workLikes,      setWorkLikes]     = useState({});
  const [workSaved,      setWorkSaved]     = useState({});
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

      // Follow-Status aus DB laden
      if (user?.id && targetId && user.id !== targetId) {
        supabase.from("follows")
          .select("follower_id", { count:"exact", head:true })
          .eq("follower_id", user.id)
          .eq("followed_id", targetId)
          .then(({ count }) => { if (mounted) setFollowed((count||0) > 0); });
      }

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

  // ── Follow/Unfollow ──────────────────────────────────────────────
  async function handleFollow() {
    if (!user?.id || !profile?.id || followLoading) return;
    setFollowLoading(true);
    const targetId = profile.id;
    if (followed) {
      await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", targetId);
      setFollowed(false);
    } else {
      await supabase.from("follows")
        .upsert({ follower_id: user.id, followed_id: targetId },
                 { onConflict: "follower_id,followed_id" });
      setFollowed(true);
    }
    setFollowLoading(false);
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
      {/* position:fixed isoliert WirkerProfilePage vollständig vom Home-Tree.
          Ohne das schlagen Home-Event-Handler durch und navigate() killt den State. */}
      <div style={{
        position:"fixed", inset:0, zIndex:200,
        background:C.cream, overflowY:"auto", overflowX:"hidden",
        fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
        WebkitOverflowScrolling:"touch",
      }}
        onClick={e => e.stopPropagation()}
      >

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

          {/* Hero bottom text — Name + Identität */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            padding:"0 20px 20px",
            animation:"fadeIn .5s .15s ease both" }}>
            {/* Focus + Location Chips */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)",
                border:"1px solid rgba(255,255,255,0.25)",
                borderRadius:50, padding:"4px 12px",
                fontSize:11, fontWeight:700, color:"white", letterSpacing:.3 }}>
                <span>{focus.icon}</span>
                <span>{focus.label}</span>
              </div>
              {(profile.location || profile.location_label) && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(0,0,0,0.28)", backdropFilter:"blur(10px)",
                  border:"1px solid rgba(255,255,255,0.15)",
                  borderRadius:50, padding:"4px 10px",
                  fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.88)" }}>
                  📍 {profile.location || profile.location_label}
                </div>
              )}
              {profile.is_available && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(16,185,129,0.28)", backdropFilter:"blur(10px)",
                  border:"1px solid rgba(16,185,129,0.45)",
                  borderRadius:50, padding:"4px 10px",
                  fontSize:11, fontWeight:700, color:"#6EE7B7" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%",
                    background:"#6EE7B7", display:"inline-block",
                    animation:"breathe 2s ease-in-out infinite" }}/>
                  Verfügbar
                </div>
              )}
            </div>
            {/* Name */}
            <h1 style={{ margin:0, fontSize:"clamp(26px,7vw,34px)", fontWeight:900,
              color:"white", letterSpacing:-1, lineHeight:1.1, marginBottom:5,
              textShadow:"0 2px 16px rgba(0,0,0,0.4)" }}>
              {profile.display_name}
            </h1>
            {/* Talent + kreative Richtung */}
            <div style={{ fontSize:13.5, color:"rgba(255,255,255,0.80)",
              fontWeight:500, lineHeight:1.5 }}>
              {profile.talent || profile.focus_type || "Creator"}
              {(profile.mood_tags?.length > 0) && (
                <span style={{ color:"rgba(255,255,255,0.55)" }}>
                  {" · "}{profile.mood_tags.slice(0,2).join(" · ")}
                </span>
              )}
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

          {/* Identity row — Username + Meta */}
          <div style={{ display:"flex", alignItems:"center", gap:7,
            marginBottom:8, flexWrap:"wrap" }}>
            {profile.username && (
              <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>
                @{profile.username.replace("@","")}
              </span>
            )}
            {memberSince && (
              <span style={{ fontSize:11, color:C.muted2,
                background:C.cream, borderRadius:50, padding:"2px 8px",
                border:`1px solid ${C.border}` }}>
                seit {memberSince}
              </span>
            )}
            {profile.is_available && (
              <span style={{ fontSize:11, color:C.green, fontWeight:700,
                background:"rgba(16,185,129,0.09)",
                borderRadius:50, padding:"3px 9px",
                border:`1px solid rgba(16,185,129,0.22)`,
                display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:"50%",
                  background:C.green, display:"inline-block",
                  animation:"breathe 2s ease-in-out infinite" }}/>
                Verfügbar
              </span>
            )}
          </div>
          {/* Antwortzeit + Fokus — menschliches Signal */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            {profile.is_available && (
              <div style={{ fontSize:11.5, color:C.muted,
                display:"flex", alignItems:"center", gap:4 }}>
                <span>💬</span>
                <span>Antwortet schnell</span>
              </div>
            )}
            {(profile.location || profile.location_label) && (
              <div style={{ fontSize:11.5, color:C.muted,
                display:"flex", alignItems:"center", gap:4 }}>
                <span>📍</span>
                <span>{profile.location || profile.location_label}</span>
              </div>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer"
                style={{ fontSize:11.5, color:C.teal, fontWeight:600,
                  textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                <span>🔗</span>
                <span>Website</span>
              </a>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ margin:"0 0 10px", fontSize:14, color:C.ink2,
              lineHeight:1.65, fontStyle:"italic" }}>
              „{profile.bio}"
            </p>
          )}

          {/* Mood-Tags + Kategorien — live nach EditProfile */}
          {((profile.mood_tags?.length > 0) || (profile.categories?.length > 0)) && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
              {(profile.mood_tags || []).slice(0,3).map(tag => (
                <span key={tag} style={{
                  padding:"4px 10px", borderRadius:50,
                  background:"rgba(255,138,107,0.10)",
                  border:"1px solid rgba(255,138,107,0.22)",
                  fontSize:11.5, fontWeight:600, color:C.coral,
                }}>
                  {tag}
                </span>
              ))}
              {(profile.categories || []).slice(0,2).map(cat => (
                <span key={cat} style={{
                  padding:"4px 10px", borderRadius:50,
                  background:"rgba(22,215,197,0.09)",
                  border:"1px solid rgba(22,215,197,0.22)",
                  fontSize:11.5, fontWeight:600, color:C.teal,
                }}>
                  {cat}
                </span>
              ))}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  style={{
                    padding:"4px 10px", borderRadius:50,
                    background:"rgba(0,0,0,0.04)",
                    border:"1px solid rgba(0,0,0,0.08)",
                    fontSize:11.5, fontWeight:600, color:C.ink2,
                    textDecoration:"none",
                  }}>
                  🔗 Website
                </a>
              )}
            </div>
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
            <>
              <div style={{ display:"flex", gap:8 }}>
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
              <div style={{ textAlign:"center", marginTop:5,
                fontSize:10.5, color:"rgba(60,60,60,0.38)", letterSpacing:0.1 }}>
                Änderungen sind sofort für alle sichtbar
              </div>
            </>
          ) : (
            /* ── VISITOR MODE: HUI CTAs ── */
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Haupt-Aktionen */}
              <div style={{ display:"flex", gap:8 }}>
                {/* FOLGEN */}
                <button className="wp-tap" onClick={handleFollow}
                  disabled={followLoading}
                  style={{ flex:1, padding:"12px 8px",
                    background: followed
                      ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                      : "rgba(0,0,0,0.05)",
                    border: followed ? "none" : `1.5px solid ${C.border}`,
                    borderRadius:16, fontSize:13, fontWeight:800,
                    color: followed ? "white" : C.ink2, fontFamily:"inherit",
                    boxShadow: followed ? `0 4px 16px ${C.tealGlow}` : "none",
                    transition:"all .22s cubic-bezier(.34,1.4,.64,1)",
                    opacity: followLoading ? 0.6 : 1,
                    position:"relative", overflow:"hidden" }}>
                  {followed && (
                    <div style={{ position:"absolute", inset:0,
                      background:"linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)",
                      animation:"shimmer 3s ease-in-out infinite" }}/>
                  )}
                  <span style={{ position:"relative" }}>
                    {followLoading ? "…" : followed ? "✓ Folge ich" : "Folgen"}
                  </span>
                </button>
                {/* NACHRICHT */}
                <button className="wp-tap"
                  onClick={() => setShowChat(true)}
                  style={{ flex:1, padding:"12px 8px",
                    background:"rgba(22,215,197,0.08)",
                    border:`1.5px solid rgba(22,215,197,0.22)`,
                    borderRadius:16, fontSize:13, fontWeight:700,
                    color:C.teal, fontFamily:"inherit",
                    transition:"all .15s ease" }}>
                  💬 Nachricht
                </button>
                {/* MEHR (...) */}
                <button className="wp-tap"
                  onClick={() => setShowMore(true)}
                  style={{ width:44, height:44, padding:0,
                    background:"rgba(0,0,0,0.05)",
                    border:`1.5px solid ${C.border}`,
                    borderRadius:16, fontSize:18, fontWeight:700,
                    color:C.muted, fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0 }}>
                  ···
                </button>
              </div>
              {/* ANFRAGE CTA — prominent */}
              <button className="wp-tap"
                onClick={() => setShowRequest(true)}
                style={{ width:"100%", padding:"13px",
                  background:`linear-gradient(135deg,${C.coral},${C.coral}CC)`,
                  border:"none", borderRadius:16, fontSize:14, fontWeight:900,
                  color:"white", fontFamily:"inherit", position:"relative", overflow:"hidden",
                  boxShadow:`0 4px 18px ${C.coralGlow}` }}>
                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.15) 50%,transparent 65%)",
                  animation:"shimmer 3.5s ease-in-out infinite", pointerEvents:"none" }}/>
                <span style={{ position:"relative" }}>✨ Anfrage stellen</span>
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


        {/* ═══ STORY HIGHLIGHTS ════════════════════════════════════ */}
        {works.length > 0 || exps.length > 0 ? (
          <div style={{ background:C.warm, padding:"16px 0 16px",
            borderBottom:`1px solid ${C.border}` }}>
            <div style={{ overflowX:"auto", scrollbarWidth:"none",
              display:"flex", gap:14, padding:"0 20px" }}>
              {/* Highlights aus Werke-Kategorien + Erlebnissen */}
              {[
                ...(works.slice(0,4).map((w,i) => ({
                  img: w.cover_url || w.media_url,
                  label: w.category || w.title?.slice(0,10) || "Werk",
                  accent: C.gold,
                }))),
                ...(exps.slice(0,2).map(e => ({
                  img: e.cover_url || e.media_url,
                  label: e.title?.slice(0,10) || "Event",
                  accent: C.coral,
                }))),
                // Fallback-Highlights wenn wenig Content
                ...(works.length + exps.length < 3 ? [
                  { img:null, label:"Kreativität", accent:C.teal, emoji:"🌿" },
                  { img:null, label:"Community",   accent:C.violet||"#8B5CF6", emoji:"🤝" },
                  { img:null, label:"Inspiration", accent:C.gold, emoji:"✨" },
                ] : []),
              ].slice(0,6).map((h, i) => (
                <div key={i} onClick={() => setActiveTab("werke")}
                  style={{ display:"flex", flexDirection:"column",
                    alignItems:"center", gap:6, flexShrink:0,
                    cursor:"pointer" }}>
                  {/* Ring + Avatar */}
                  <div style={{
                    width:60, height:60, borderRadius:"50%", padding:2.5,
                    background:`linear-gradient(135deg,${h.accent},${h.accent}88)`,
                    boxShadow:`0 2px 12px ${h.accent}44`,
                  }}>
                    <div style={{ width:"100%", height:"100%", borderRadius:"50%",
                      border:"2.5px solid white", overflow:"hidden",
                      background: h.img ? "transparent"
                        : `linear-gradient(135deg,${h.accent}22,${h.accent}11)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:20 }}>
                      {h.img
                        ? <img src={h.img} alt={h.label}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        : h.emoji || "✦"
                      }
                    </div>
                  </div>
                  <span style={{ fontSize:10.5, color:C.ink2, fontWeight:600,
                    textAlign:"center", maxWidth:60,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {h.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
              { key:"werke",      label:"Werke",   icon:"🎨", accent:C.gold,
                count: works.length || 0 },
              { key:"erlebnisse", label:"Events",  icon:"✨", accent:C.coral,
                count: exps.length || 0 },
              { key:"empf",       label:"Empf.",   icon:"💬", accent:C.teal,
                count: recs.length || 0 },
              { key:"impact",     label:"Impact",  icon:"🌱", accent:C.green,
                count: null },
            ].map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} className="wp-tap"
                  onClick={() => setActiveTab(tab.key)}
                  style={{ flex:1, padding:"10px 2px 10px",
                    background:"none", border:"none",
                    borderBottom: active
                      ? `2.5px solid ${tab.accent}`
                      : "2.5px solid transparent",
                    fontFamily:"inherit",
                    transition:"all .2s ease",
                    display:"flex", flexDirection:"column",
                    alignItems:"center", gap:2 }}>
                  <span style={{ fontSize:15,
                    filter: active ? "none" : "grayscale(0.6) opacity(0.55)",
                    transition:"filter .2s" }}>
                    {tab.icon}
                  </span>
                  <span style={{ fontSize:10.5, fontWeight: active ? 800 : 500,
                    color: active ? tab.accent : C.muted,
                    letterSpacing:.2, lineHeight:1 }}>
                    {tab.label}
                    {tab.count > 0 && (
                      <span style={{ marginLeft:3, fontSize:9, fontWeight:700,
                        color: active ? tab.accent : C.muted2,
                        opacity:0.8 }}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ TAB CONTENT ══════════════════════════════════════════ */}
        <div ref={contentRef} style={{ padding:"16px 16px 120px",
          animation:"tabSlide .28s ease both" }}>

          {/* Kreative Intro-Zeile — lebendiger Context */}
          {activeTab === "werke" && works.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              marginBottom:14, padding:"10px 14px",
              background:"rgba(245,166,35,0.07)",
              borderRadius:14, border:"1px solid rgba(245,166,35,0.14)" }}>
              <span style={{ fontSize:16 }}>🎨</span>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:C.ink }}>
                  {works.length} {works.length === 1 ? "Werk" : "Werke"}
                </span>
                <span style={{ fontSize:12, color:C.muted, marginLeft:6 }}>
                  · Tippe um mehr zu sehen
                </span>
              </div>
              {profile.hourly_rate > 0 && (
                <div style={{ fontSize:12, fontWeight:800, color:C.gold,
                  background:"rgba(245,166,35,0.12)", borderRadius:50,
                  padding:"3px 10px", flexShrink:0 }}>
                  ab € {profile.hourly_rate}/h
                </div>
              )}
            </div>
          )}
          {activeTab === "erlebnisse" && exps.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              marginBottom:14, padding:"10px 14px",
              background:"rgba(255,138,107,0.07)",
              borderRadius:14, border:"1px solid rgba(255,138,107,0.14)" }}>
              <span style={{ fontSize:16 }}>✨</span>
              <div>
                <span style={{ fontSize:12.5, fontWeight:700, color:C.ink }}>
                  {exps.length} {exps.length === 1 ? "Erlebnis" : "Erlebnisse"}
                </span>
                <span style={{ fontSize:12, color:C.muted, marginLeft:6 }}>
                  · live & buchbar
                </span>
              </div>
            </div>
          )}

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
                      <WorkCard work={works[0]} fullWidth onTap={w=>onBook?.(w)}
                         liked={workLikes[works[0]?.id]} saved={workSaved[works[0]?.id]}
                         onLike={id=>setWorkLikes(l=>({...l,[id]:!l[id]}))}
                         onSave={id=>setWorkSaved(s=>({...s,[id]:!s[id]}))}/>
                    </div>
                  )}
                  {works.slice(works.length % 2 !== 0 ? 1 : 0).map((w,i) => (
                    <WorkCard key={w.id||i} work={w} onTap={w=>onBook?.(w)}
                      liked={workLikes[w.id]} saved={workSaved[w.id]}
                      onLike={id=>setWorkLikes(l=>({...l,[id]:!l[id]}))}
                      onSave={id=>setWorkSaved(s=>({...s,[id]:!s[id]}))}/>
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
                    <ExpCard key={exp.id||i} exp={exp} fullWidth onBook={onBook} onTap={e=>setShowRequest(true)}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EMPFEHLUNGEN ── */}
          {activeTab === "impact" && (
            <div style={{ padding:"4px 0 16px" }}>
              {/* Impact Header */}
              <div style={{ background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(22,215,197,0.05))",
                borderRadius:20, padding:"20px 20px", marginBottom:16,
                border:"1.5px solid rgba(16,185,129,0.14)" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🌱</div>
                <div style={{ fontSize:18, fontWeight:900, color:C.ink,
                  letterSpacing:-.3, marginBottom:6 }}>
                  {profile.display_name?.split(" ")[0]}s Wirkung
                </div>
                <div style={{ fontSize:13.5, color:"rgba(30,30,30,0.58)", lineHeight:1.65 }}>
                  Jede Buchung trägt automatisch zu sozialen Projekten bei.
                  {profile.impact_eur > 0
                    ? ` Bisher wurden € ${Math.round(profile.impact_eur)} weitergegeben.`
                    : " Die ersten Einnahmen fließen bald weiter."}
                </div>
              </div>

              {/* Impact Zahlen */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { icon:"🌿", label:"Impact bewirkt",
                    value: profile.impact_eur > 0 ? `€ ${Math.round(profile.impact_eur)}` : "—",
                    color: C.green, bg:"rgba(16,185,129,0.08)" },
                  { icon:"❤️", label:"Empfehlungen",
                    value: recs.length || profile.recommendations_count || 0,
                    color: C.coral, bg:"rgba(255,138,107,0.08)" },
                  { icon:"🎨", label:"Werke geteilt",
                    value: works.length || 0,
                    color: C.gold, bg:"rgba(245,166,35,0.08)" },
                  { icon:"✨", label:"Erlebnisse",
                    value: exps.length || 0,
                    color: C.teal, bg:"rgba(22,215,197,0.08)" },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, borderRadius:18,
                    padding:"18px 16px", border:`1px solid ${s.color}22` }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                    <div style={{ fontSize:20, fontWeight:900, color:s.color,
                      marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:11.5, color:C.muted,
                      fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* HUI Impact Erklärung */}
              <div style={{ background:C.card, borderRadius:18, padding:"18px 20px",
                border:`1px solid ${C.border}`,
                boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontWeight:800, fontSize:14, color:C.ink, marginBottom:8 }}>
                  Wie funktioniert das?
                </div>
                <div style={{ fontSize:13, color:"rgba(30,30,30,0.58)", lineHeight:1.7 }}>
                  Bei jeder Buchung fließen{" "}
                  <strong style={{ color:C.teal }}>2,5%</strong> automatisch
                  in echte soziale Projekte — ausgewählt durch die HUI-Community.
                  <br/><br/>
                  Kreativität und Wirkung gehen Hand in Hand.
                </div>
              </div>
            </div>
          )}

          {activeTab === "empf" && (
            <div>
              {recs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px",
                  color:C.muted }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.ink,
                    marginBottom:8 }}>Noch keine Empfehlungen</div>
                  <div style={{ fontSize:13, lineHeight:1.65, marginBottom:18 }}>
                    Empfehlungen entstehen nach echten Buchungen und<br/>
                    werden persönlich und emotional formuliert.
                  </div>
                  {!isOwner && (
                    <button onClick={() => setShowRequest(true)}
                      style={{ padding:"11px 24px", borderRadius:50,
                        background:`linear-gradient(135deg,${C.coral},${C.coral}CC)`,
                        border:"none", color:"white", fontWeight:700, fontSize:13,
                        cursor:"pointer", fontFamily:"inherit" }}>
                      ✨ Erste Anfrage stellen
                    </button>
                  )}
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
          {!isOwner && (
            <button className="wp-tap" onClick={() => setShowRequest(true)}
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
              <span style={{ position:"relative" }}>✨ Anfrage stellen</span>
            </button>
          )}
        </div>

      </div>

      {/* ═══ CREATOR TOOL OVERLAYS — nur sichtbar wenn isOwner ══════ */}
      {/* ═══ CHAT SHEET ═══════════════════════════════════════════ */}
      {showChat && (
        <ChatSheet
          profile={profile}
          user={user}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* ═══ ANFRAGE SHEET ══════════════════════════════════════════ */}
      {showRequest && (
        <RequestSheet
          profile={profile}
          user={user}
          onClose={() => setShowRequest(false)}
        />
      )}

      {/* ═══ MEHR MENÜ ══════════════════════════════════════════════ */}
      {showMore && (
        <MoreMenu
          profile={profile}
          isOwner={isOwner}
          onClose={() => setShowMore(false)}
          onEdit={() => { setShowMore(false); setActiveTool("edit"); }}
        />
      )}

      {isOwner && activeTool && (
        <OwnerToolOverlay
          activeTool={activeTool}
          user={user}
          profile={profile}
          onClose={() => setActiveTool(null)}
          onSave={(updated) => {
            // 1. Cache sofort invalidieren — nächste load() holt frische Daten
            if (user?.id) clearQueryCache(`profile-${user.id}`);
            // 2. Profil optimistisch sofort updaten (kein Reload nötig)
            setProfile(p => ({
              ...p, ...updated,
              // Felder-Normalisierung: EditProfile schreibt location, WirkerProfilePage zeigt location_label
              location_label: updated.location || updated.location_label || p?.location_label,
              display_name:   updated.display_name || p?.display_name,
              avatar_url:     updated.avatar_url   || p?.avatar_url,
              header_img:     updated.header_img   || p?.header_img,
              bio:            updated.bio           ?? p?.bio,
              talent:         updated.talent        || p?.talent,
              focus_type:     updated.focus_type    || p?.focus_type,
              is_available:   updated.is_available  ?? p?.is_available,
              categories:     updated.categories    || p?.categories || [],
              mood_tags:      updated.mood_tags     || p?.mood_tags  || [],
              languages:      updated.languages     || p?.languages  || [],
              website:        updated.website       || p?.website,
              hourly_rate:    updated.hourly_rate   || p?.hourly_rate,
            }));
            // 3. Tool schließen
            setActiveTool(null);
          }}
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
        {activeTool === "settings" && (
          <InlineSettings
            user={user}
            profile={profile}
            onBack={onClose}
            onLogout={onClose}
            onSave={onSave}
          />
        )}
        {(activeTool === "insights" || activeTool === "drafts") && (
          <ToolPlaceholder
            toolKey={activeTool}
            onBack={onClose}
            user={user}
            profile={profile}
          />
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

// ══════════════════════════════════════════════════════════════════
// AVAILABILITY SYSTEM — Airbnb + Calendly + Apple Calendar Vibes
// Echter Monatskalender, Zeitslots, Status-System, Tag-Detail
// ══════════════════════════════════════════════════════════════════

// Hilfsfunktionen
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function firstDayOfMonth(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; } // Mo=0

const WEEKDAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni",
                   "Juli","August","September","Oktober","November","Dezember"];

const SLOT_TYPES = [
  { key:"free",      label:"Verfügbar",   color:"#16D7C5", bg:"rgba(22,215,197,0.09)",  dot:"#16D7C5" },
  { key:"workshop",  label:"Workshop",    color:"#8B5CF6", bg:"rgba(139,92,246,0.09)", dot:"#8B5CF6" },
  { key:"shooting",  label:"Shooting",    color:"#F5A623", bg:"rgba(245,166,35,0.09)", dot:"#F5A623" },
  { key:"session",   label:"Session",     color:"#FF8A6B", bg:"rgba(255,138,107,0.09)",dot:"#FF8A6B" },
  { key:"blocked",   label:"Blockiert",   color:"#EF4444", bg:"rgba(239,68,68,0.08)",  dot:"#EF4444" },
  { key:"focus",     label:"Fokuszeit",   color:"#10B981", bg:"rgba(16,185,129,0.09)", dot:"#10B981" },
];

function getSlotType(t) {
  return SLOT_TYPES.find(s => s.key === t) || SLOT_TYPES[0];
}

function getDayStatus(dateStr, slots, bookings) {
  const daySlots    = slots.filter(s => s.date === dateStr);
  const dayBookings = bookings.filter(b => {
    if (!b.scheduled_at) return false;
    return b.scheduled_at.startsWith(dateStr);
  });
  const blockedAll  = daySlots.length > 0 && daySlots.every(s => s.blocked);
  const hasBooking  = dayBookings.length > 0;
  const hasFree     = daySlots.some(s => !s.blocked);

  if (hasBooking && hasFree) return "partial";  // 🟡
  if (hasBooking || blockedAll) return "busy";   // 🔴
  if (hasFree) return "free";                    // 🟢
  return "none";                                 // ⚪
}

const STATUS_DOT = {
  free:    { color:"#16D7C5", label:"Verfügbar" },
  partial: { color:"#F5A623", label:"Teilweise" },
  busy:    { color:"#EF4444", label:"Ausgebucht" },
  none:    { color:"rgba(0,0,0,0.12)", label:"" },
};

// ── Zeitslot-Karte ────────────────────────────────────────────────
function SlotCard({ slot, onDelete, onToggle }) {
  const st = getSlotType(slot.slot_type || (slot.blocked ? "blocked" : "free"));
  const fmt = t => t ? t.slice(0,5) : "—";

  return (
    <div style={{
      borderRadius:16, overflow:"hidden",
      border:`1px solid ${TC.border}`,
      boxShadow:"0 1px 8px rgba(0,0,0,0.04)",
      background:TC.card, marginBottom:8,
    }}>
      <div style={{ height:3, background:st.color }} />
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
        {/* Typ-Badge */}
        <div style={{ width:36, height:36, borderRadius:12, background:st.bg,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:st.color }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13.5, color:TC.ink }}>{st.label}</div>
          <div style={{ fontSize:12, color:TC.muted, marginTop:1 }}>
            {fmt(slot.time_from)} – {fmt(slot.time_to)}
            {slot.note && ` · ${slot.note}`}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onToggle?.(slot)}
            style={{ width:30, height:30, borderRadius:10, background:"rgba(0,0,0,0.04)",
              border:`1px solid ${TC.border}`, fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✏️
          </button>
          <button onClick={() => onDelete?.(slot.id)}
            style={{ width:30, height:30, borderRadius:10, background:"rgba(239,68,68,0.07)",
              border:"1px solid rgba(239,68,68,0.15)", fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tag-Detail Sheet (slide-up) ───────────────────────────────────
function DayDetailSheet({ dateStr, slots, bookings, onClose, onAddSlot, onDeleteSlot }) {
  const [addOpen, setAddOpen]    = React.useState(false);
  const [form, setForm]          = React.useState({
    time_from:"09:00", time_to:"12:00",
    slot_type:"free", note:"", blocked:false,
  });

  const d = new Date(dateStr + "T12:00:00");
  const label = d.toLocaleDateString("de-DE",
    { weekday:"long", day:"numeric", month:"long" });

  const daySlots    = slots.filter(s => s.date === dateStr);
  const dayBookings = bookings.filter(b =>
    b.scheduled_at && b.scheduled_at.startsWith(dateStr)
  );

  async function saveSlot() {
    await onAddSlot({ ...form, date:dateStr });
    setAddOpen(false);
    setForm({ time_from:"09:00", time_to:"12:00", slot_type:"free", note:"", blocked:false });
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:980, display:"flex",
      flexDirection:"column", justifyContent:"flex-end" }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position:"absolute", inset:0,
        background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)" }} />
      {/* Sheet */}
      <div onClick={e => e.stopPropagation()}
        style={{
          position:"relative", zIndex:1,
          background:TC.bg, borderRadius:"24px 24px 0 0",
          maxHeight:"82vh", overflowY:"auto",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",
          animation:"slideUp .28s cubic-bezier(.34,1.1,.64,1) both",
        }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }} />
        </div>
        {/* Header */}
        <div style={{ padding:"4px 20px 16px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:TC.ink,
              letterSpacing:-.4, textTransform:"capitalize" }}>{label}</div>
            <div style={{ fontSize:12, color:TC.muted, marginTop:2 }}>
              {daySlots.length} Slot{daySlots.length !== 1 ? "s" : ""}
              {dayBookings.length > 0 && ` · ${dayBookings.length} Buchung${dayBookings.length !== 1 ? "en" : ""}`}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:10, background:"rgba(0,0,0,0.06)",
              border:`1px solid ${TC.border}`, fontSize:15, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>

        <div style={{ padding:"0 20px 40px" }}>
          {/* Buchungen des Tages */}
          {dayBookings.length > 0 && (<>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
              letterSpacing:1.1, textTransform:"uppercase", marginBottom:8 }}>
              Buchungen
            </div>
            {dayBookings.map(b => (
              <div key={b.id} style={{ background:"rgba(239,68,68,0.06)", borderRadius:14,
                padding:"12px 16px", marginBottom:8, border:"1px solid rgba(239,68,68,0.12)" }}>
                <div style={{ fontWeight:700, fontSize:13.5, color:TC.ink }}>
                  {b.service_title || b.work_title || "Buchung"}
                </div>
                <div style={{ fontSize:12, color:TC.muted, marginTop:2 }}>
                  {b.scheduled_at
                    ? new Date(b.scheduled_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})
                    : "Ganztag"}
                  {b.amount && ` · € ${(+b.amount * 0.85).toFixed(0)} netto`}
                </div>
              </div>
            ))}
          </>)}

          {/* Slots */}
          {daySlots.length > 0 && (<>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
              letterSpacing:1.1, textTransform:"uppercase", marginBottom:8,
              marginTop: dayBookings.length > 0 ? 16 : 0 }}>
              Zeitfenster
            </div>
            {daySlots.map(s => (
              <SlotCard key={s.id} slot={s} onDelete={onDeleteSlot} />
            ))}
          </>)}

          {/* Leer */}
          {daySlots.length === 0 && dayBookings.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px 0 8px" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🌿</div>
              <div style={{ fontSize:14, color:TC.muted }}>Dieser Tag ist noch frei.</div>
            </div>
          )}

          {/* Slot hinzufügen */}
          {!addOpen ? (
            <button onClick={() => setAddOpen(true)}
              style={{ width:"100%", marginTop:16, padding:"13px", borderRadius:50,
                background:`linear-gradient(135deg,${TC.teal},${TC.teal2})`,
                border:"none", color:"white", fontWeight:700, fontSize:14,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:`0 4px 14px ${TC.tealGlow}` }}>
              + Zeitfenster hinzufügen
            </button>
          ) : (
            <div style={{ background:TC.card, borderRadius:20, padding:20,
              border:`1px solid ${TC.border}`, marginTop:16,
              boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight:800, fontSize:14, color:TC.ink, marginBottom:14 }}>
                Zeitfenster erstellen
              </div>

              {/* Typ */}
              <div style={{ fontSize:11, fontWeight:700, color:TC.muted,
                letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Art</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                {SLOT_TYPES.map(st => (
                  <button key={st.key} onClick={() => setForm(f => ({
                    ...f, slot_type:st.key, blocked:st.key==="blocked"
                  }))}
                    style={{
                      padding:"6px 12px", borderRadius:50, fontFamily:"inherit",
                      background: form.slot_type===st.key ? st.color : "rgba(0,0,0,0.04)",
                      border: form.slot_type===st.key ? "none" : `1.5px solid ${TC.border}`,
                      color: form.slot_type===st.key ? "white" : TC.ink2,
                      fontSize:12, fontWeight: form.slot_type===st.key ? 700 : 500,
                      cursor:"pointer",
                    }}>
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Zeiten */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:TC.muted,
                    letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Von</div>
                  <input type="time" value={form.time_from}
                    onChange={e => setForm(f => ({...f, time_from:e.target.value}))}
                    style={{ width:"100%", padding:"11px 12px", borderRadius:12,
                      border:`1.5px solid ${TC.border}`, background:"rgba(0,0,0,0.03)",
                      fontSize:14, fontFamily:"inherit", boxSizing:"border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:TC.muted,
                    letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Bis</div>
                  <input type="time" value={form.time_to}
                    onChange={e => setForm(f => ({...f, time_to:e.target.value}))}
                    style={{ width:"100%", padding:"11px 12px", borderRadius:12,
                      border:`1.5px solid ${TC.border}`, background:"rgba(0,0,0,0.03)",
                      fontSize:14, fontFamily:"inherit", boxSizing:"border-box" }} />
                </div>
              </div>

              {/* Notiz */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:TC.muted,
                  letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Notiz (optional)</div>
                <input value={form.note}
                  onChange={e => setForm(f => ({...f, note:e.target.value}))}
                  placeholder="z.B. nur für Fotoprojekte"
                  style={{ width:"100%", padding:"11px 14px", borderRadius:12,
                    border:`1.5px solid ${TC.border}`, background:"rgba(0,0,0,0.03)",
                    fontSize:13, fontFamily:"inherit", boxSizing:"border-box" }} />
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setAddOpen(false)}
                  style={{ flex:1, padding:"12px", borderRadius:50,
                    background:"rgba(0,0,0,0.05)", border:`1.5px solid ${TC.border}`,
                    fontSize:13, fontWeight:700, color:TC.ink2, cursor:"pointer", fontFamily:"inherit" }}>
                  Abbrechen
                </button>
                <button onClick={saveSlot}
                  style={{ flex:2, padding:"12px", borderRadius:50,
                    background:`linear-gradient(135deg,${TC.teal},${TC.teal2})`,
                    border:"none", fontSize:13, fontWeight:700, color:"white",
                    cursor:"pointer", fontFamily:"inherit",
                    boxShadow:`0 4px 12px ${TC.tealGlow}` }}>
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HAUPT-KOMPONENTE ──────────────────────────────────────────────
function InlineAvailability({ user, onBack }) {
  const today      = new Date();
  const [year, setYear]   = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [slots,    setSlots]    = React.useState([]);
  const [bookings, setBookings] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [selected, setSelected] = React.useState(null); // ISO-Datum

  // Daten laden
  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const from = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const to   = `${year}-${String(month+1).padStart(2,'0')}-${daysInMonth(year,month)}`;

    Promise.all([
      supabase.from("availability_slots")
        .select("id,date,time_from,time_to,blocked,note")
        .eq("user_id", user.id)
        .gte("date", from).lte("date", to)
        .order("date").order("time_from"),
      supabase.from("bookings")
        .select("id,scheduled_at,status,service_title,work_title,amount")
        .eq("wirker_id", user.id)
        .gte("scheduled_at", from + "T00:00:00")
        .lte("scheduled_at", to   + "T23:59:59")
        .not("scheduled_at", "is", null),
    ]).then(([sr, br]) => {
      // slot_type Feld ableiten (DB hat es noch nicht — Fallback)
      const enriched = (sr.data || []).map(s => ({
        ...s,
        slot_type: s.blocked ? "blocked" : "free",
      }));
      setSlots(enriched);
      setBookings(br.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id, year, month]);

  // Monats-Navigation
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y-1); }
    else setMonth(m => m-1);
    setSlots([]); setBookings([]); setLoading(true);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y+1); }
    else setMonth(m => m+1);
    setSlots([]); setBookings([]); setLoading(true);
  }

  // Slot hinzufügen
  async function handleAddSlot(slotData) {
    if (!user?.id) return;
    const { data } = await supabase.from("availability_slots")
      .insert({
        user_id:   user.id,
        date:      slotData.date,
        time_from: slotData.time_from,
        time_to:   slotData.time_to,
        blocked:   slotData.blocked || false,
        note:      slotData.note || null,
      }).select().single();
    if (data) {
      setSlots(s => [...s, { ...data, slot_type: data.blocked ? "blocked" : "free" }]);
    }
  }

  // Slot löschen
  async function handleDeleteSlot(id) {
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots(s => s.filter(x => x.id !== id));
  }

  // Kalendertage aufbauen
  const firstDay = firstDayOfMonth(year, month);
  const days     = daysInMonth(year, month);
  const todayStr = isoDate(today);

  // Heatmap: Tage mit Slots pro Status zählen
  const freeDays    = new Set(slots.filter(s => !s.blocked).map(s => s.date));
  const blockedDays = new Set(slots.filter(s => s.blocked).map(s => s.date));
  const bookedDays  = new Set(bookings.map(b => b.scheduled_at?.slice(0,10)).filter(Boolean));

  // Summary Stats
  const freeCount    = freeDays.size;
  const bookedCount  = bookedDays.size;
  const pendingCount = bookings.filter(b => b.status === "confirmed" || b.status === "in_progress").length;

  return (
    <>
      <ToolHeader title="Verfügbarkeit" emoji="🗓" onBack={onBack} />

      {/* ── CSS für Animationen ── */}
      <style>{`
        @keyframes slideUp {
          from { transform:translateY(100%); opacity:0; }
          to   { transform:translateY(0);    opacity:1; }
        }
        @keyframes calFadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div style={{ padding:"0 0 100px", animation:"calFadeIn .3s ease both" }}>

        {/* ── SUMMARY STRIP ── */}
        <div style={{ display:"flex", gap:0, padding:"0 20px 0",
          borderBottom:`1px solid ${TC.border}` }}>
          {[
            { dot:"#16D7C5", label:"Verfügbar",  value:freeCount },
            { dot:"#EF4444", label:"Ausgebucht", value:bookedCount },
            { dot:"#F5A623", label:"Offen",      value:pendingCount },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex:1, padding:"14px 0", textAlign:"center",
              borderRight: i < arr.length-1 ? `1px solid ${TC.border}` : "none",
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                gap:6, marginBottom:2 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:s.dot }} />
                <span style={{ fontSize:18, fontWeight:900, color:TC.ink }}>{s.value}</span>
              </div>
              <div style={{ fontSize:10.5, color:TC.muted, fontWeight:600,
                textTransform:"uppercase", letterSpacing:0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MONATS-NAVIGATION ── */}
        <div style={{ display:"flex", alignItems:"center", padding:"18px 20px 10px",
          justifyContent:"space-between" }}>
          <button onClick={prevMonth}
            style={{ width:38, height:38, borderRadius:12, background:"rgba(0,0,0,0.05)",
              border:`1.5px solid ${TC.border}`, fontSize:16, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", color:TC.ink }}>
            ‹
          </button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:17, fontWeight:900, color:TC.ink, letterSpacing:-.3 }}>
              {MONTHS_DE[month]}
            </div>
            <div style={{ fontSize:12, color:TC.muted }}>{year}</div>
          </div>
          <button onClick={nextMonth}
            style={{ width:38, height:38, borderRadius:12, background:"rgba(0,0,0,0.05)",
              border:`1.5px solid ${TC.border}`, fontSize:16, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", color:TC.ink }}>
            ›
          </button>
        </div>

        {/* ── WOCHENTAG-HEADER ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
          padding:"0 12px", marginBottom:4 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700,
              color:TC.muted, padding:"4px 0", letterSpacing:0.5 }}>
              {d}
            </div>
          ))}
        </div>

        {/* ── KALENDER-GRID ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
          gap:3, padding:"0 12px", marginBottom:20 }}>
          {/* Leere Zellen vor dem ersten Tag */}
          {Array.from({ length:firstDay }).map((_,i) => (
            <div key={`e${i}`} />
          ))}
          {/* Tage */}
          {Array.from({ length:days }).map((_,i) => {
            const day    = i + 1;
            const dStr   = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dStr === todayStr;
            const isSel   = dStr === selected;
            const status  = getDayStatus(dStr, slots, bookings);
            const { color } = STATUS_DOT[status];
            const isPast   = dStr < todayStr;

            return (
              <button key={day}
                onClick={() => setSelected(isSel ? null : dStr)}
                style={{
                  aspectRatio:"1",
                  borderRadius:12,
                  border: isSel
                    ? `2px solid ${TC.teal}`
                    : isToday
                    ? `2px solid ${TC.teal}44`
                    : "2px solid transparent",
                  background: isSel
                    ? `linear-gradient(135deg,${TC.teal}18,${TC.teal}08)`
                    : isToday
                    ? "rgba(22,215,197,0.06)"
                    : "transparent",
                  cursor:"pointer",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  gap:2, padding:"4px 2px",
                  opacity: isPast ? 0.38 : 1,
                  transition:"all .14s ease",
                  fontFamily:"inherit",
                }}>
                <span style={{
                  fontSize:13, fontWeight: isToday ? 900 : 500,
                  color: isToday ? TC.teal : TC.ink,
                  lineHeight:1,
                }}>
                  {day}
                </span>
                {/* Status-Punkt */}
                <div style={{
                  width:5, height:5, borderRadius:"50%",
                  background: status === "none" ? "transparent" : color,
                  transition:"background .14s",
                }} />
              </button>
            );
          })}
        </div>

        {/* ── LEGENDE ── */}
        <div style={{ display:"flex", gap:14, padding:"0 20px 20px",
          justifyContent:"center" }}>
          {[
            { color:"#16D7C5", label:"Verfügbar" },
            { color:"#F5A623", label:"Teilweise" },
            { color:"#EF4444", label:"Ausgebucht" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:s.color }} />
              <span style={{ fontSize:11, color:TC.muted, fontWeight:500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── DIESE WOCHE — Quick Overview ── */}
        <div style={{ padding:"0 20px 20px" }}>
          <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
            letterSpacing:1.1, textTransform:"uppercase", marginBottom:12 }}>
            Nächste Tage
          </div>
          <div style={{ display:"flex", gap:8, overflowX:"auto",
            scrollbarWidth:"none", paddingBottom:4 }}>
            {Array.from({ length:7 }).map((_,i) => {
              const d    = new Date();
              d.setDate(d.getDate() + i);
              const dStr = isoDate(d);
              const st   = getDayStatus(dStr, slots, bookings);
              const { color } = STATUS_DOT[st];
              const isSel = dStr === selected;
              const wd = ["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()];

              return (
                <button key={i} onClick={() => setSelected(isSel ? null : dStr)}
                  style={{
                    flexShrink:0, width:52, padding:"10px 0",
                    borderRadius:14, fontFamily:"inherit",
                    background: isSel
                      ? `linear-gradient(135deg,${TC.teal},${TC.teal2})`
                      : "rgba(0,0,0,0.04)",
                    border: isSel ? "none" : `1.5px solid ${TC.border}`,
                    cursor:"pointer", textAlign:"center",
                    transition:"all .14s ease",
                  }}>
                  <div style={{ fontSize:10.5, fontWeight:700,
                    color: isSel ? "rgba(255,255,255,0.75)" : TC.muted,
                    marginBottom:3, textTransform:"uppercase" }}>
                    {i === 0 ? "Heute" : wd}
                  </div>
                  <div style={{ fontSize:16, fontWeight:900,
                    color: isSel ? "white" : TC.ink, marginBottom:5 }}>
                    {d.getDate()}
                  </div>
                  <div style={{ width:6, height:6, borderRadius:"50%",
                    background: st === "none"
                      ? (isSel ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)")
                      : color,
                    margin:"0 auto" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── UPCOMING SLOTS ── */}
        {loading ? (
          <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:10 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ height:68, borderRadius:16, background:"rgba(0,0,0,0.04)",
                animation:"pulse 1.4s ease-in-out infinite",
                animationDelay:`${n*0.1}s` }} />
            ))}
          </div>
        ) : slots.length === 0 && bookings.length === 0 ? (
          <div style={{ margin:"0 20px", background:TC.card, borderRadius:20,
            padding:"28px 24px", textAlign:"center",
            border:`1px solid ${TC.border}` }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🌿</div>
            <div style={{ fontSize:15, fontWeight:800, color:TC.ink, marginBottom:6 }}>
              Noch keine Einträge für {MONTHS_DE[month]}
            </div>
            <div style={{ fontSize:13, color:TC.muted, lineHeight:1.65, marginBottom:18 }}>
              Tippe auf einen Tag im Kalender um Zeitfenster hinzuzufügen.
            </div>
          </div>
        ) : (
          <div style={{ padding:"0 20px" }}>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
              letterSpacing:1.1, textTransform:"uppercase", marginBottom:12 }}>
              {MONTHS_DE[month]} — Übersicht
            </div>
            {/* Alle Slots chronologisch */}
            {slots.slice(0, 12).map(s => {
              const st  = getSlotType(s.slot_type);
              const fmt = t => t?.slice(0,5) || "—";
              const d   = new Date(s.date + "T12:00:00");
              const dateLabel = d.toLocaleDateString("de-DE",
                { weekday:"short", day:"numeric", month:"short" });
              return (
                <div key={s.id}
                  onClick={() => setSelected(s.date)}
                  style={{ borderRadius:16, overflow:"hidden",
                    border:`1px solid ${TC.border}`, marginBottom:8,
                    background:TC.card, cursor:"pointer",
                    boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ height:3, background:st.color }} />
                  <div style={{ padding:"12px 16px",
                    display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:st.bg,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:st.color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:TC.ink }}>{st.label}</div>
                      <div style={{ fontSize:11.5, color:TC.muted, marginTop:1 }}>
                        {dateLabel} · {fmt(s.time_from)}–{fmt(s.time_to)}
                      </div>
                    </div>
                    <div style={{ fontSize:14, color:TC.muted }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Coming Soon Features ── */}
        <div style={{ margin:"20px 20px 0",
          background:"linear-gradient(135deg,rgba(22,215,197,0.07),rgba(22,215,197,0.02))",
          borderRadius:20, padding:"16px 20px",
          border:"1.5px solid rgba(22,215,197,0.14)" }}>
          <div style={{ fontWeight:700, fontSize:13, color:TC.teal, marginBottom:4 }}>
            🔮 Bald verfügbar
          </div>
          <div style={{ fontSize:12, color:TC.muted, lineHeight:1.6 }}>
            Google Calendar Sync · Automatische Buchungsfreigabe · Wiederkehrende Slots · Buchungslink teilen
          </div>
        </div>
      </div>

      {/* ── DAY DETAIL SHEET ── */}
      {selected && (
        <DayDetailSheet
          dateStr={selected}
          slots={slots}
          bookings={bookings}
          onClose={() => setSelected(null)}
          onAddSlot={async (slotData) => {
            await handleAddSlot(slotData);
            // Reload für diesen Tag
            const { data } = await supabase.from("availability_slots")
              .select("id,date,time_from,time_to,blocked,note")
              .eq("user_id", user.id)
              .eq("date", slotData.date)
              .order("time_from");
            if (data) {
              setSlots(prev => {
                const without = prev.filter(s => s.date !== slotData.date);
                return [...without, ...data.map(s => ({
                  ...s, slot_type: s.blocked ? "blocked" : "free"
                }))].sort((a,b) => a.date.localeCompare(b.date));
              });
            }
          }}
          onDeleteSlot={handleDeleteSlot}
        />
      )}
    </>
  );
}

// ── EINSTELLUNGEN (crashsicher) ───────────────────────────────────
function InlineSettings({ user, profile, onBack, onLogout, onSave }) {
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
    // Profil sofort im Parent spiegeln
    onSave?.({ display_name: displayName, is_available: isAvail });
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

// ── INSIGHTS — echte KI-Analyse ─────────────────────────────────
function InlineInsights({ user, profile, onBack }) {
  const [result,  setResult]  = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [filter,  setFilter]  = React.useState("alle"); // "alle"|"performance"|"growth"|"trend"|"coach"

  React.useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchCreatorInsights(user.id, profile)
      .then(r => { setResult(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const CATEGORY_COLORS = {
    performance: { bg:"rgba(22,215,197,0.08)",  border:"rgba(22,215,197,0.18)",  dot:TC.teal },
    growth:      { bg:"rgba(16,185,129,0.07)",  border:"rgba(16,185,129,0.16)",  dot:TC.green },
    trend:       { bg:"rgba(245,166,35,0.08)",  border:"rgba(245,166,35,0.18)",  dot:TC.gold },
    coach:       { bg:"rgba(255,138,107,0.08)", border:"rgba(255,138,107,0.18)", dot:TC.coral },
    business:    { bg:"rgba(22,215,197,0.06)",  border:"rgba(22,215,197,0.14)",  dot:TC.teal },
    community:   { bg:"rgba(139,92,246,0.07)",  border:"rgba(139,92,246,0.16)",  dot:"#8B5CF6" },
    portfolio:   { bg:"rgba(245,166,35,0.07)",  border:"rgba(245,166,35,0.16)",  dot:TC.gold },
    profile:     { bg:"rgba(16,185,129,0.07)",  border:"rgba(16,185,129,0.14)",  dot:TC.green },
    onboarding:  { bg:"rgba(255,138,107,0.09)", border:"rgba(255,138,107,0.20)", dot:TC.coral },
  };

  const TYPE_LABELS = {
    data:      "Deine Daten",
    trend:     "Plattform-Trend",
    coach:     "Creator-Tipp",
    pattern:   "Muster erkannt",
    community: "Community",
  };

  const FILTERS = [
    { key:"alle",        label:"Alle" },
    { key:"coach",       label:"💡 Tipps" },
    { key:"trend",       label:"📈 Trends" },
    { key:"data",        label:"📊 Daten" },
  ];

  const visible = result?.insights?.filter(ins =>
    filter === "alle" || ins.type === filter || ins.category === filter
  ) || [];

  return (
    <>
      <ToolHeader title="Insights" emoji="⚡" onBack={onBack} />
      <div style={{ padding:"0 0 80px" }}>

        {/* ── Datenpunkte Header ── */}
        {result && !loading && (
          <div style={{ padding:"12px 20px 0", marginBottom:4 }}>
            <div style={{ fontSize:11.5, color:TC.muted, fontWeight:500 }}>
              Basierend auf{" "}
              <span style={{ fontWeight:700, color:TC.ink }}>
                {result.dataPoints} Datenpunkten
              </span>
              {" "}der letzten 30 Tage
            </div>
          </div>
        )}

        {/* ── Filter Chips ── */}
        <div style={{ display:"flex", gap:6, padding:"14px 20px 16px",
          overflowX:"auto", scrollbarWidth:"none" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding:"7px 14px", borderRadius:50, border:"none",
                background: filter===f.key
                  ? `linear-gradient(135deg,${TC.teal},${TC.teal2})`
                  : "rgba(0,0,0,0.05)",
                color: filter===f.key ? "white" : TC.ink2,
                fontSize:12.5, fontWeight: filter===f.key ? 700 : 500,
                cursor:"pointer", fontFamily:"inherit",
                whiteSpace:"nowrap", flexShrink:0,
                boxShadow: filter===f.key ? `0 3px 12px ${TC.tealGlow}` : "none",
                transition:"all .15s ease",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ padding:"0 20px" }}>
          {loading ? (
            /* Skeleton Cards — wie Inhalte die laden */
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  background:"white", borderRadius:20, padding:24,
                  border:"1px solid rgba(0,0,0,0.06)",
                  animation:"pulse 1.4s ease-in-out infinite",
                  animationDelay:`${n * 0.1}s`,
                }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:"rgba(0,0,0,0.06)", marginBottom:12 }}/>
                  <div style={{ height:14, borderRadius:6, background:"rgba(0,0,0,0.06)", width:"70%", marginBottom:8 }}/>
                  <div style={{ height:11, borderRadius:4, background:"rgba(0,0,0,0.04)", width:"90%", marginBottom:4 }}/>
                  <div style={{ height:11, borderRadius:4, background:"rgba(0,0,0,0.04)", width:"60%" }}/>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🌱</div>
              <div style={{ fontWeight:700, color:TC.ink, marginBottom:6 }}>
                {result?.dataPoints === 0
                  ? "Noch keine Daten"
                  : "Kein Insight für diesen Filter"}
              </div>
              <div style={{ fontSize:13, color:TC.muted, lineHeight:1.6 }}>
                {result?.dataPoints === 0
                  ? "Poste deinen ersten Inhalt — dann beginnt HUI deinen Stil zu verstehen."
                  : "Wähle einen anderen Filter oben."}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {visible.map((ins, idx) => {
                const colors = CATEGORY_COLORS[ins.category] || CATEGORY_COLORS.coach;
                return (
                  <div key={ins.id}
                    style={{
                      background:"white",
                      borderRadius:20,
                      border:`1px solid rgba(0,0,0,0.06)`,
                      overflow:"hidden",
                      boxShadow:"0 1px 12px rgba(0,0,0,0.04)",
                      animation:"fadeIn .3s ease both",
                      animationDelay:`${idx * 0.06}s`,
                    }}>
                    {/* Farbiger Akzentbalken oben */}
                    <div style={{
                      height:3,
                      background:`linear-gradient(90deg,${colors.dot},${colors.dot}44)`,
                    }}/>
                    <div style={{ padding:"18px 20px 20px" }}>
                      {/* Type Badge + Icon */}
                      <div style={{ display:"flex", alignItems:"center",
                        justifyContent:"space-between", marginBottom:12 }}>
                        <div style={{
                          display:"inline-flex", alignItems:"center", gap:5,
                          padding:"4px 10px", borderRadius:50,
                          background:colors.bg, border:`1px solid ${colors.border}`,
                        }}>
                          <div style={{
                            width:6, height:6, borderRadius:"50%",
                            background:colors.dot, flexShrink:0,
                          }}/>
                          <span style={{ fontSize:11, fontWeight:700, color:colors.dot,
                            letterSpacing:0.3, textTransform:"uppercase" }}>
                            {TYPE_LABELS[ins.type] || ins.type}
                          </span>
                        </div>
                        <span style={{ fontSize:24 }}>{ins.icon}</span>
                      </div>
                      {/* Headline */}
                      <div style={{ fontSize:16, fontWeight:800, color:TC.ink,
                        letterSpacing:-.3, marginBottom:8, lineHeight:1.3 }}>
                        {ins.headline}
                      </div>
                      {/* Body */}
                      <div style={{ fontSize:13.5, color:"rgba(30,30,30,0.65)",
                        lineHeight:1.65, fontWeight:400 }}>
                        {ins.body}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* KI Footer */}
              <div style={{
                marginTop:4, padding:"16px 20px",
                borderRadius:20,
                background:"linear-gradient(135deg,rgba(22,215,197,0.07),rgba(22,215,197,0.03))",
                border:"1.5px solid rgba(22,215,197,0.15)",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <span style={{ fontSize:22, flexShrink:0 }}>🔮</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:TC.teal, marginBottom:2 }}>
                    KI-Coaching kommt bald
                  </div>
                  <div style={{ fontSize:12, color:TC.muted, lineHeight:1.5 }}>
                    Caption-Vorschläge · beste Posting-Zeit · Content-Ideen · Profil-Analyse
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── ENTWÜRFE ──────────────────────────────────────────────────────
function ToolPlaceholder({ toolKey, onBack, user, profile }) {
  if (toolKey === "insights") {
    return <InlineInsights user={user} profile={profile} onBack={onBack} />;
  }
  // Entwürfe — Placeholder
  return (
    <>
      <ToolHeader title="Entwürfe" emoji="📝" onBack={onBack} />
      <div style={{ padding:"32px 20px" }}>
        <div style={{ background:"white", borderRadius:20, padding:28, textAlign:"center",
          border:"1px solid rgba(0,0,0,0.06)", boxShadow:"0 2px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize:42, marginBottom:14 }}>📄</div>
          <div style={{ fontSize:16, fontWeight:800, color:TC.ink, marginBottom:8,
            letterSpacing:-.2 }}>Keine Entwürfe vorhanden</div>
          <div style={{ fontSize:13, color:TC.muted, lineHeight:1.65, maxWidth:260, margin:"0 auto" }}>
            Inhalte die du begonnen aber noch nicht veröffentlicht hast, erscheinen hier automatisch.
          </div>
        </div>
        <div style={{ marginTop:12, padding:"14px 18px", borderRadius:16,
          background:"rgba(22,215,197,0.06)", border:"1.5px solid rgba(22,215,197,0.14)",
          fontSize:13, color:TC.muted, lineHeight:1.5 }}>
          💡 Autosave für angefangene Werke kommt bald.
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// CHAT SHEET — Nachricht senden
// ══════════════════════════════════════════════════════════════════
function ChatSheet({ profile, user, onClose }) {
  const [msg, setMsg] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const SUGGESTIONS = [
    `Hey ${profile?.display_name?.split(" ")[0] || "👋"}, deine Arbeit hat mich sehr berührt.`,
    `Ich würde gerne mehr über deine Werke erfahren.`,
    `Ich suche jemanden für eine kreative Zusammenarbeit.`,
  ];

  async function sendMessage() {
    if (!msg.trim() || !user?.id || !profile?.id) return;
    setSending(true);
    try {
      // Chat in DB anlegen
      await supabase.from("chats").insert({
        participant_ids: [user.id, profile.id],
        state: "open",
        last_message: msg.trim(),
        last_message_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      });
      setSent(true);
      // Kein navigate() — würde Home-Route wechseln und showWirker nullen
      // Stattdessen: Sheet schließen, Success-State zeigen
      setTimeout(onClose, 1600);
    } catch(e) {
      setSent(true); // Optimistisch — Nachricht gilt als gesendet
      setTimeout(onClose, 1400);
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <SheetHandle />
      <div style={{ padding:"4px 20px 40px" }}>
        {/* Profile Mini */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20,
          padding:"14px 16px", background:"rgba(0,0,0,0.03)", borderRadius:16 }}>
          <div style={{ width:44, height:44, borderRadius:"50%",
            background:`linear-gradient(135deg,${TC.teal},${TC.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:900, color:"white", flexShrink:0, overflow:"hidden" }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : (profile?.display_name?.[0]||"?").toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:TC.ink }}>
              {profile?.display_name}
            </div>
            <div style={{ fontSize:12, color:TC.muted }}>
              {profile?.talent || "Creator"}
              {profile?.is_available
                ? <span style={{ color:TC.green, marginLeft:6 }}>· Verfügbar</span>
                : null}
            </div>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:42, marginBottom:12 }}>✉️</div>
            <div style={{ fontWeight:800, fontSize:16, color:TC.ink, marginBottom:6 }}>
              Nachricht gesendet!
            </div>
            <div style={{ fontSize:13, color:TC.muted }}>
              {profile?.display_name?.split(" ")[0]} wird benachrichtigt.
            </div>
          </div>
        ) : (<>
          {/* Vorschläge */}
          <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
            letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
            Schnellstart
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setMsg(s)}
                style={{ padding:"10px 14px", borderRadius:14,
                  background: msg===s ? "rgba(22,215,197,0.10)" : "rgba(0,0,0,0.04)",
                  border: msg===s ? `1.5px solid rgba(22,215,197,0.28)` : `1.5px solid rgba(0,0,0,0.07)`,
                  fontSize:13, color:TC.ink2, textAlign:"left",
                  cursor:"pointer", fontFamily:"inherit", lineHeight:1.5 }}>
                {s}
              </button>
            ))}
          </div>

          {/* Freitext */}
          <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
            letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
            Eigene Nachricht
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)}
            placeholder={`Schreib ${profile?.display_name?.split(" ")[0] || "etwas"}…`}
            rows={3}
            style={{ width:"100%", padding:"12px 14px", borderRadius:16,
              border:`1.5px solid rgba(0,0,0,0.08)`, background:"rgba(0,0,0,0.03)",
              fontSize:14, fontFamily:"inherit", resize:"none",
              outline:"none", boxSizing:"border-box", marginBottom:14 }} />

          <button onClick={sendMessage} disabled={!msg.trim() || sending}
            style={{ width:"100%", padding:"14px", borderRadius:50,
              background: msg.trim()
                ? `linear-gradient(135deg,${TC.teal},${TC.teal2})`
                : "rgba(0,0,0,0.08)",
              border:"none", color: msg.trim() ? "white" : TC.muted,
              fontWeight:800, fontSize:14, fontFamily:"inherit",
              cursor: msg.trim() ? "pointer" : "default",
              boxShadow: msg.trim() ? `0 4px 16px ${TC.tealGlow}` : "none",
              transition:"all .18s ease" }}>
            {sending ? "Sende…" : "Nachricht senden"}
          </button>
        </>)}
      </div>
    </BottomSheet>
  );
}

// ══════════════════════════════════════════════════════════════════
// REQUEST SHEET — Anfrage / Buchung
// ══════════════════════════════════════════════════════════════════
function RequestSheet({ profile, user, onClose }) {
  const [step,     setStep]    = React.useState(1); // 1=Typ, 2=Details, 3=Success
  const [reqType,  setReqType] = React.useState(null);
  const [form,     setForm]    = React.useState({
    date:"", budget:"", location:"", message:"", mood:""
  });
  const [sending,  setSending] = React.useState(false);

  const REQ_TYPES = [
    { key:"workshop",  label:"Workshop",         icon:"🎓", sub:"Gruppenformat oder 1:1" },
    { key:"shooting",  label:"Shooting",          icon:"📸", sub:"Foto oder Video" },
    { key:"collab",    label:"Zusammenarbeit",   icon:"🤝", sub:"Kreativprojekt" },
    { key:"event",     label:"Event",             icon:"🎪", sub:"Auftritt oder Performance" },
    { key:"coaching",  label:"Beratung",          icon:"💡", sub:"Beratung oder Coaching" },
    { key:"other",     label:"Sonstiges",         icon:"✨", sub:"Offene Anfrage" },
  ];

  const MOODS = ["entspannt","kreativ","professionell","abenteuerlich","intim","energetisch"];

  async function sendRequest() {
    if (!user?.id || !profile?.id || !reqType) return;
    setSending(true);
    const rt = REQ_TYPES.find(r => r.key === reqType);
    try {
      await supabase.from("chats").insert({
        participant_ids: [user.id, profile.id],
        state: "open",
        last_message: `Anfrage: ${rt?.label} — ${form.message || "Keine Nachricht"}`,
        last_message_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      });
    } catch(e) { console.warn("Request:", e); }
    setSending(false);
    setStep(3);
  }

  return (
    <BottomSheet onClose={onClose} tall>
      <SheetHandle />
      <div style={{ padding:"4px 20px 40px", overflowY:"auto", maxHeight:"72vh" }}>

        {step === 1 && (<>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:900, color:TC.ink,
              letterSpacing:-.3, marginBottom:4 }}>
              Anfrage an {profile?.display_name?.split(" ")[0]}
            </div>
            <div style={{ fontSize:13, color:TC.muted }}>Was hast du im Sinn?</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {REQ_TYPES.map(rt => (
              <button key={rt.key} onClick={() => { setReqType(rt.key); setStep(2); }}
                style={{ padding:"16px 12px", borderRadius:18,
                  background: reqType===rt.key
                    ? `linear-gradient(135deg,${TC.teal},${TC.teal2})`
                    : "rgba(0,0,0,0.04)",
                  border: reqType===rt.key ? "none" : `1.5px solid rgba(0,0,0,0.07)`,
                  cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                  boxShadow: reqType===rt.key ? `0 4px 14px ${TC.tealGlow}` : "none",
                  transition:"all .15s" }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{rt.icon}</div>
                <div style={{ fontWeight:800, fontSize:13.5,
                  color: reqType===rt.key ? "white" : TC.ink }}>
                  {rt.label}
                </div>
                <div style={{ fontSize:11.5, marginTop:2,
                  color: reqType===rt.key ? "rgba(255,255,255,0.75)" : TC.muted }}>
                  {rt.sub}
                </div>
              </button>
            ))}
          </div>
        </>)}

        {step === 2 && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <button onClick={() => setStep(1)}
              style={{ background:"none", border:"none", fontSize:20,
                cursor:"pointer", color:TC.muted }}>←</button>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:TC.ink }}>
                {REQ_TYPES.find(r=>r.key===reqType)?.icon}{" "}
                {REQ_TYPES.find(r=>r.key===reqType)?.label}
              </div>
              <div style={{ fontSize:12, color:TC.muted }}>Details zur Anfrage</div>
            </div>
          </div>

          {[
            { key:"date",     label:"Wunschdatum",    placeholder:"z.B. Juni 2026 oder flexibel", type:"text" },
            { key:"budget",   label:"Budget (ca.)",   placeholder:"z.B. € 200–400", type:"text" },
            { key:"location", label:"Ort",            placeholder:"Online, Hamburg, Berlin …", type:"text" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
                letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{f.label}</div>
              <input type={f.type} value={form[f.key]}
                onChange={e => setForm(prev => ({...prev, [f.key]:e.target.value}))}
                placeholder={f.placeholder}
                style={{ width:"100%", padding:"12px 14px", borderRadius:14,
                  border:`1.5px solid rgba(0,0,0,0.08)`, background:"rgba(0,0,0,0.03)",
                  fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}

          {/* Stimmung */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
              letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
              Gewünschte Stimmung
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {MOODS.map(m => (
                <button key={m} onClick={() => setForm(f => ({...f, mood:m}))}
                  style={{ padding:"6px 12px", borderRadius:50,
                    background: form.mood===m ? TC.teal : "rgba(0,0,0,0.04)",
                    border: form.mood===m ? "none" : `1.5px solid rgba(0,0,0,0.07)`,
                    fontSize:12.5, fontWeight: form.mood===m ? 700 : 500,
                    color: form.mood===m ? "white" : TC.ink2,
                    cursor:"pointer", fontFamily:"inherit" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Nachricht */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:800, color:TC.muted,
              letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
              Nachricht (optional)
            </div>
            <textarea value={form.message}
              onChange={e => setForm(f => ({...f, message:e.target.value}))}
              placeholder="Erzähl etwas über dein Projekt oder deine Idee…"
              rows={3}
              style={{ width:"100%", padding:"12px 14px", borderRadius:14,
                border:`1.5px solid rgba(0,0,0,0.08)`, background:"rgba(0,0,0,0.03)",
                fontSize:14, fontFamily:"inherit", resize:"none",
                outline:"none", boxSizing:"border-box" }} />
          </div>

          <button onClick={sendRequest} disabled={sending}
            style={{ width:"100%", padding:"14px", borderRadius:50,
              background:`linear-gradient(135deg,${TC.coral},${TC.coral}CC)`,
              border:"none", color:"white", fontWeight:900, fontSize:14,
              fontFamily:"inherit", cursor:"pointer",
              boxShadow:`0 4px 16px ${TC.tealGlow}`, opacity: sending ? 0.7 : 1 }}>
            {sending ? "Sende Anfrage…" : "✨ Anfrage senden"}
          </button>
        </>)}

        {step === 3 && (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🌱</div>
            <div style={{ fontWeight:900, fontSize:18, color:TC.ink,
              letterSpacing:-.3, marginBottom:8 }}>
              Anfrage gesendet!
            </div>
            <div style={{ fontSize:13.5, color:TC.muted, lineHeight:1.65, marginBottom:24 }}>
              {profile?.display_name?.split(" ")[0]} wird deine Anfrage erhalten
              und sich bald bei dir melden.
            </div>
            <button onClick={onClose}
              style={{ padding:"12px 28px", borderRadius:50,
                background:`linear-gradient(135deg,${TC.teal},${TC.teal2})`,
                border:"none", color:"white", fontWeight:700,
                fontSize:14, fontFamily:"inherit", cursor:"pointer" }}>
              Schließen
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// ══════════════════════════════════════════════════════════════════
// MORE MENU — Teilen, Melden, Blockieren
// ══════════════════════════════════════════════════════════════════
function MoreMenu({ profile, isOwner, onClose, onEdit }) {
  const ITEMS = [
    { icon:"🔗", label:"Profil teilen",        action: () => {
      navigator.share?.({ title: profile?.display_name, url: window.location.href })
        .catch(() => navigator.clipboard?.writeText(window.location.href));
      onClose();
    }},
    { icon:"🔔", label:"Benachrichtigungen",   action: onClose },
    { icon:"⭐", label:"Als Favorit speichern", action: onClose },
    ...(isOwner ? [
      { icon:"✏️", label:"Profil bearbeiten",   action: onEdit, teal:true },
    ] : [
      { icon:"🚩", label:"Profil melden",       action: onClose, red:true },
      { icon:"🚫", label:"Blockieren",          action: onClose, red:true },
    ]),
  ];

  return (
    <BottomSheet onClose={onClose}>
      <SheetHandle />
      <div style={{ padding:"4px 20px 32px" }}>
        <div style={{ fontWeight:800, fontSize:16, color:TC.ink, marginBottom:16 }}>Optionen</div>
        {ITEMS.map((item, i) => (
          <button key={i} onClick={item.action}
            style={{ width:"100%", padding:"14px 16px", borderRadius:16,
              background:"none", border:"none", textAlign:"left",
              display:"flex", alignItems:"center", gap:14,
              cursor:"pointer", fontFamily:"inherit",
              borderBottom: i < ITEMS.length-1 ? `1px solid rgba(0,0,0,0.06)` : "none" }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ fontSize:15, fontWeight:600,
              color: item.red ? "#EF4444" : item.teal ? TC.teal : TC.ink }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

// ── Shared Sheet Primitives ───────────────────────────────────────
function BottomSheet({ children, onClose, tall }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:980,
      display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
      onClick={onClose}>
      <div style={{ position:"absolute", inset:0,
        background:"rgba(0,0,0,0.4)", backdropFilter:"blur(6px)" }} />
      <div onClick={e => e.stopPropagation()}
        style={{
          position:"relative", zIndex:1,
          background:"#F9F7F4",
          borderRadius:"24px 24px 0 0",
          maxHeight: tall ? "88vh" : "75vh",
          overflowY:"auto",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
          animation:"slideUp .28s cubic-bezier(.34,1.1,.64,1) both",
          fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",
        }}>
        {children}
      </div>
    </div>
  );
}

function SheetHandle() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
      <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.14)" }} />
    </div>
  );
}