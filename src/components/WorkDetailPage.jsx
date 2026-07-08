// WorkDetailPage.jsx — Premium Work Detail Experience
// Route: /work/:id
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { safeQuery } from "../lib/perfUtils";
import { ProfileService } from '../services/db';
import { supabase } from "../lib/supabaseClient";
import { normalizeProfileInput } from '../lib/perfUtils';
import { useAuth } from "../lib/AuthContext";
import { useAppState } from "../lib/AppStateContext";
import { HUI } from "../design/hui.design.js";
// HUI Interaction Language v1.0 (2026-07-05) — Single Source of Truth,
// dieselben Komponenten wie im Feed (BaseFeedCard.jsx).
import {
  HUIHeartIcon, ExchangeIcon, HUIBookmarkIcon, RecommendIcon,
} from "../design/icons/HuiInteractionIcons.jsx";
import { useSingleReaction } from "../lib/useReactions.jsx";
import { haptic } from "./commerce/commerceUtils.js";

/* ── Design Tokens ─────────────────────────────────────────────────── */
const C = {
  teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, tealPale:HUI.COLOR.tealPale, tealGlow:"rgba(22,215,197,0.22)",
  coral:HUI.COLOR.coral, coral2:HUI.COLOR.coral, coralPale:HUI.COLOR.coralPale, coralGlow:"rgba(255,138,107,0.22)",
  gold:HUI.COLOR.gold, goldGlow:"rgba(245,166,35,0.18)",
  warm:HUI.COLOR.cream, card:"#FFFFFF",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2,
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes wdFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wdSkel { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes wdSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes wdPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .wd-tap:active { opacity: 0.72; transition: opacity 0.1s; }
  .wd-scroll::-webkit-scrollbar { display: none; }
  .wd-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .wd-swipe { touch-action: pan-y; user-select: none; }
`;

/* ── Helpers ────────────────────────────────────────────────────────── */
function fmtPrice(p) {
  if (p == null || p === "") return null;
  const n = Number(p);
  return isNaN(n) ? String(p) : `€ ${n.toFixed(2).replace(".", ",")}`;
}

function getImages(werk) {
  const imgs = [];
  if (werk.cover_url) imgs.push(werk.cover_url);
  if (Array.isArray(werk.images)) {
    werk.images.forEach(u => { if (u && u !== werk.cover_url) imgs.push(u); });
  }
  return imgs.length > 0 ? imgs : [null];
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ url, name, size = 40 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) return (
    <img src={url} alt={name}
      style={{ width:size, height:size, borderRadius:"50%",
        objectFit:"cover", border:"2px solid white",
        boxShadow:"0 2px 10px rgba(0,0,0,0.15)", flexShrink:0 }}/>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.34, fontWeight:900, color:"white",
      border:"2px solid white", boxShadow:"0 2px 10px rgba(0,0,0,0.15)",
      flexShrink:0, letterSpacing:-0.5 }}>
      {initials}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
function Skel({ w="100%", h=16, r=8, mb=0 }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"#EBEBEB", animation:"wdSkel 1.4s ease-in-out infinite",
    marginBottom:mb }}/>;
}

function WorkDetailSkeleton() {
  return (
    <div style={{ minHeight:"100vh", background:"transparent" }}>
      <style>{CSS}</style>
      {/* Hero skeleton */}
      <div style={{ width:"100%", height:"55vh",
        background:"linear-gradient(135deg,#e8e8e8,#f0f0f0)",
        animation:"wdSkel 1.4s ease-in-out infinite" }}/>
      <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        <Skel h={10} w="40%" r={6}/>
        <Skel h={28} w="85%" r={10}/>
        <Skel h={20} w="30%" r={8}/>
        <div style={{ height:1, background:C.border, margin:"8px 0" }}/>
        <Skel h={13} w="100%" r={6}/>
        <Skel h={13} w="92%" r={6}/>
        <Skel h={13} w="76%" r={6}/>
      </div>
    </div>
  );
}

/* ── Image Gallery with Swipe ───────────────────────────────────────── */
function ImageGallery({ images, title }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);
  const trackRef = useRef(null);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(images.length - 1, i + 1));

  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    startX.current = null;
  };

  const img = images[idx];

  return (
    <div className="wd-swipe" ref={trackRef}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position:"relative", width:"100%",
        height:"clamp(280px, 42vh, 480px)", overflow:"hidden",
        background:"#111" }}>

      {/* Image */}
      {img ? (
        <img key={idx} src={img} alt={`${title} ${idx+1}`}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            animation:"wdFadeUp 0.35s both",
            filter:"brightness(0.88) saturate(1.1)" }}/>
      ) : (
        <div style={{ width:"100%", height:"100%",
          background:"linear-gradient(135deg,#E6FAF8,#FFF2EE)",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:52, opacity:0.25 }}>🎨</div>
          <div style={{ fontSize:13, color:C.muted }}>Kein Bild verfügbar</div>
        </div>
      )}

      {/* Gradient overlays */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.72) 100%)" }}/>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,138,107,0.18) 0%, transparent 60%)" }}/>

      {/* Coral top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,${C.coral},${C.teal},transparent)`,
        pointerEvents:"none" }}/>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div style={{ position:"absolute", bottom:16, left:"50%",
          transform:"translateX(-50%)", display:"flex", gap:5 }}>
          {images.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width: i===idx ? 18 : 6, height:6, borderRadius:3,
                background: i===idx ? "white" : "rgba(255,255,255,0.45)",
                transition:"all 0.25s", cursor:"pointer" }}/>
          ))}
        </div>
      )}

      {/* Arrow buttons (tablet+) */}
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button onClick={prev} className="wd-tap"
              style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                width:36, height:36, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.3)", color:"white",
                fontSize:16, cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center" }}>‹</button>
          )}
          {idx < images.length - 1 && (
            <button onClick={next} className="wd-tap"
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                width:36, height:36, borderRadius:"50%",
                background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.3)", color:"white",
                fontSize:16, cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center" }}>›</button>
          )}
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div style={{ position:"absolute", top:16, right:16,
          background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)",
          borderRadius:999, padding:"3px 10px",
          fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.88)" }}>
          {idx+1} / {images.length}
        </div>
      )}
    </div>
  );
}

/* ── Related Work Mini Card ─────────────────────────────────────────── */
function RelatedCard({ werk, onClick }) {
  const img = werk.cover_url
    || (Array.isArray(werk.images) && werk.images[0])
    || null;
  return (
    <div className="wd-tap" onClick={() => onClick(werk.id)}
      style={{ flexShrink:0, width:140, cursor:"pointer" }}>
      <div style={{ borderRadius:16, overflow:"hidden", height:140,
        position:"relative", background:"#eee",
        boxShadow:"0 3px 12px rgba(0,0,0,0.10)" }}>
        {img ? (
          <img src={img} alt={werk.title}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%",
            background:"linear-gradient(135deg,#E6FAF8,#FFF2EE)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28, opacity:0.3 }}>🎨</span>
          </div>
        )}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(transparent 50%,rgba(0,0,0,0.6))" }}/>
        {werk.price != null && (
          <div style={{ position:"absolute", bottom:8, left:8,
            background:"rgba(255,255,255,0.92)", borderRadius:999,
            padding:"2px 8px", fontSize:10, fontWeight:900, color:C.ink }}>
            {fmtPrice(werk.price)}
          </div>
        )}
      </div>
      <div style={{ padding:"6px 2px 0" }}>
        <div style={{ fontSize:11.5, fontWeight:700, color:C.ink,
          lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis",
          whiteSpace:"nowrap" }}>{werk.title || "Werk"}</div>
        <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
          {werk.category || ""}
        </div>
      </div>
    </div>
  );
}

/* ── Icon Buttons ───────────────────────────────────────────────────── */
// ARIA-Label je Interaktion -- deckt alle 4 Icons der HUI Interaction Icon
// Library v1.0 ab (nicht nur Resonanz), analog ACTION_ARIA in BaseFeedCard.jsx.
const DETAIL_ARIA = {
  resonanz:    { on: "Resonanz entfernen",   off: "Resonanz geben" },
  austauschen: { on: "Kommentare schliessen", off: "Austauschen" },
  merken:      { on: "Aus Merkliste entfernen", off: "Merken" },
  weitergeben: { off: "Weitergeben" }, // kein Toggle -- einmalige Aktion
};
function IconBtn({ Icon, label, active, color, onPress, disabled, loading, variant }) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const isResonanz = variant === "resonanz";
  const ariaSpec = DETAIL_ARIA[variant];
  const isToggle = !!(ariaSpec && ariaSpec.on);
  // Genereller Tap-Feedback (alle 4 Icons) -- die Resonanz-spezifische
  // Aktivierungs-Animation (Puls + Lichtring) sitzt seit 2026-07-08 im
  // HUIHeartIcon selbst (active-Prop), nicht mehr hier als filter-Glow
  // (filter widerspricht der Vorgabe "nur transform/opacity"). Alle 4 Icons
  // haben inzwischen ihre eigene, aber gleichwertige Aktivierungs-Animation
  // eingebaut (siehe HuiInteractionIcons.jsx).
  const pressMs = isResonanz ? 150 : 300;
  const pressScale = isResonanz ? 1.08 : 1.25;
  const handleTap = () => {
    if (disabled || loading) return;
    setPressed(true);
    setTimeout(() => setPressed(false), pressMs);
    onPress?.();
  };
  const ariaLabel = ariaSpec ? (active && ariaSpec.on ? ariaSpec.on : ariaSpec.off) : (label || undefined);
  // v2.0 Zustände — Icon-Form bleibt immer identisch, nur Opacity/Scale ändern sich.
  const iconOpacity = disabled ? 0.28 : loading ? 0.5 : active ? 1 : hover ? 0.8 : 0.55;
  return (
    <button onClick={handleTap} disabled={disabled}
      aria-label={ariaLabel} aria-pressed={isToggle ? !!active : undefined}
      aria-busy={!!loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display:"flex", flexDirection:"column", alignItems:"center",
        gap:4, background:"none", border:"none",
        cursor: disabled ? "default" : "pointer",
        padding:"8px 12px", borderRadius:12,
        minWidth: 48, minHeight: 48, // alle 4 Icons: 48x48 Touchflaeche (A11y-Vorgabe)
        transform: pressed ? `scale(${pressScale})` : (hover && !disabled ? "scale(1.06)" : "scale(1)"),
        transition: pressed && isResonanz
          ? "transform 0.16s cubic-bezier(.22,1,.36,1)"
          : "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <span style={{ position:"relative", display:"flex", opacity: iconOpacity, borderRadius:"50%", color: color || C.coral,
        transition:"opacity 0.18s ease" }}>
        {Icon ? <Icon size={24} active={!!active} /> : null}
        {loading && (
          <span aria-hidden="true" style={{
            position:"absolute", inset:-2, borderRadius:"50%",
            border:`2px solid ${color || C.coral}`, borderTopColor:"transparent",
            animation:"hui-icon-spin 700ms linear infinite",
          }} />
        )}
      </span>
      <span style={{ fontSize:10, fontWeight:600,
        color: active ? (color||C.coral) : C.muted }}>
        {label}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function WorkDetailPage({ onBuyWerk, onAddToKorb, onViewCreator }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toggleFollow } = useAppState();

  const [werk,    setWerk]    = useState(null);
  const [creator, setCreator] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [shareOk,   setShareOk]   = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments,  setComments]  = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resonanz/Merken -- EIN zentraler Mechanismus, identisch zum Feed
  // (post_reactions/reaction_counts, siehe BaseFeedCard.jsx). Ersetzt die
  // fruehere work_likes/work_saves-Direktanbindung samt den nicht
  // existierenden toggleLikeWork/toggleSaveWork-Aufrufen (echter Bug --
  // beide Funktionen gab es in AppStateContext nie, Resonanz auf der
  // Werk-Detailseite schrieb daher nie in die DB).
  // MERKEN.2A (2026-07-08): Snapshot der echten Werk-Daten fuer
  // saved_posts.post_data -- identischer Mechanismus wie im Feed
  // (UnifiedFeed.jsx), damit "Gemerkte Inhalte" auch von hier aus
  // gespeicherte Werke mit Titel/Bild/Ersteller zeigt.
  const postSnapshot = useMemo(() => ({
    cover_url:   werk?.cover_url || null,
    title:       werk?.title || null,
    author_name: creator?.display_name || creator?.username || null,
    user_id:     creator?.id || null,
  }), [werk?.cover_url, werk?.title, creator?.display_name, creator?.username, creator?.id]);

  const { counts: reactionCounts, myTypes: reactionTypes, toggle: toggleReaction } =
    useSingleReaction(id, "work", creator?.id, postSnapshot);
  const resonated      = reactionTypes.has("inspire");
  const resonanceCount = reactionCounts.inspire || 0;
  const saved          = reactionTypes.has("save");


  /* ── Load Social State ──────────────────────────────────────────── */
  const loadSocial = useCallback(async (werkId, creatorId) => {
    if (!user?.id || !werkId) return;
    try {
      // Resonanz/Merken werden bereits von useSingleReaction geladen
      // (post_reactions) -- hier nur noch Follow-Status + Kommentare.

      // Following creator?
      if (creatorId) {
        const { data: followRow } = await supabase
          .from("follows").select("id")
          .eq("follower_id", user.id).eq("followed_id", creatorId).maybeSingle();
        setFollowing(!!followRow);
      }

      // Comments
      const { data: cData } = await supabase
        .from("comments")
        .select("id, text, created_at, user_id, profiles(display_name, avatar_url, username)")
        .eq("work_id", werkId)
        .order("created_at", { ascending: true })
        .limit(50);
      setComments(cData || []);
      setCommentCount((cData || []).length);

      // Increment view count
      await supabase.rpc("increment_work_views", { work_id: werkId }).catch(() => {});
    } catch(e) {
      console.error("[WorkDetail] loadSocial:", e.message);
    }
  }, [user?.id]);

  /* ── Toggle Resonanz — ueber post_reactions (useSingleReaction) ──── */
  const handleLike = useCallback(() => {
    if (!user?.id) return;
    haptic(resonated ? "selection" : "light");
    toggleReaction("inspire");
  }, [user?.id, resonated, toggleReaction]);

  /* ── Toggle Merken — ueber post_reactions (useSingleReaction) ─────── */
  const handleSave = useCallback(() => {
    if (!user?.id) return;
    haptic(saved ? "selection" : "light");
    toggleReaction("save");
  }, [user?.id, saved, toggleReaction]);

  /* ── Toggle Follow — via AppStateContext (Single Owner) ─────────── */
  const handleFollow = useCallback(async () => {
    if (!user?.id || !creator?.id) return;
    const newFollowing = !following;
    // Optimistic local UI
    setFollowing(newFollowing);
    // DB-Sync via AppStateContext.toggleFollow — kein direktes supabase.from() hier
    await toggleFollow(creator.id);
  }, [user?.id, creator?.id, following, toggleFollow]);

  /* ── Submit Comment ──────────────────────────────────────────────── */
  const handleComment = useCallback(async () => {
    const txt = commentInput.trim();
    if (!txt || !user?.id) return;
    setSubmittingComment(true);
    const optimistic = {
      id: "opt_" + Date.now(),
      text: txt, work_id: id, user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: { display_name: user.user_metadata?.full_name || "Du", avatar_url: null, username: "" }
    };
    setComments(c => [...c, optimistic]);
    setCommentCount(c => c + 1);
    setCommentInput("");
    const { error } = await supabase.from("comments")
      .insert({ work_id: id, user_id: user.id, text: txt });
    if (error) {
      console.error("[Comment] insert:", error.message);
      setComments(c => c.filter(x => x.id !== optimistic.id));
      setCommentCount(c => c - 1);
    }
    setSubmittingComment(false);
  }, [commentInput, user?.id, id]);

  /* ── Load ──────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Werk laden — nur Felder die tatsächlich in der DB existieren
      // (works.user_id → auth.users, kein FK zu profiles → kein JOIN möglich)
      const { data: w, error: wErr } = await supabase
        .from("works")
        .select("id,title,description,cover_url,media_url,price,category,tags,status,approval_status,user_id,creator_id,likes_count,created_at,images,caption,location_text")
        .eq("id", id)
        .single();

      if (wErr || !w) throw new Error("Werk nicht gefunden");
      setWerk(w);

      // Profil separat via ProfileService (kein JOIN wegen fehlendem FK zu profiles)
      const creatorId = w.user_id || w.creator_id;
      if (creatorId) {
        const { data: prof } = await ProfileService.getById(creatorId);
        setCreator(prof || null);
      }
      await loadRelated(w.category, creatorId, id);
      if (user?.id) await loadSocial(id, creatorId);

    } catch (e) {
      console.error("[HUI] WorkDetail Fehler:", e);
      setError(e.message || "Werk konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function loadRelated(category, userId, currentId) {
    try {
      // Gleiche Kategorie ODER gleicher Creator, exkl. aktuelles Werk
      const queries = await Promise.allSettled([
        supabase.from("works")
          .select("id, title, price, cover_url, images, category")
          .eq("status", "published")
          .eq("category", category || "")
          .neq("id", currentId)
          .limit(6),
        supabase.from("works")
          .select("id, title, price, cover_url, images, category")
          .eq("status", "published")
          .eq("user_id", userId || "")
          .neq("id", currentId)
          .limit(4),
      ]);

      const catWorks  = queries[0].status === "fulfilled" ? (queries[0].value.data || []) : [];
      const userWorks = queries[1].status === "fulfilled" ? (queries[1].value.data || []) : [];

      // Merge + deduplizieren
      const seen = new Set();
      const merged = [...catWorks, ...userWorks].filter(w => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      }).slice(0, 8);

      setRelated(merged);
    } catch(e) {
      console.warn("[HUI] Related works Fehler:", e.message);
    }
  }

  useEffect(() => { load(); }, [load]);

  /* ── Share ─────────────────────────────────────────────────────── */
  const handleShare = () => {
    const url = window.location.href;
    const title = werk?.title || "Werk auf HUI";
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
    setShareOk(true);
    setTimeout(() => setShareOk(false), 2000);
  };

  /* ── Loading ───────────────────────────────────────────────────── */
  if (loading) return <WorkDetailSkeleton />;

  /* ── Error ─────────────────────────────────────────────────────── */
  if (error || !werk) return (
    <div style={{ minHeight:"100vh", background:C.warm,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:32, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ fontSize:52, marginBottom:16 }}>😕</div>
      <div style={{ fontWeight:800, fontSize:20, color:C.ink, marginBottom:8 }}>
        Werk nicht gefunden
      </div>
      <div style={{ fontSize:13, color:C.muted, textAlign:"center",
        lineHeight:1.6, marginBottom:24, maxWidth:260 }}>
        {error || "Dieses Werk existiert nicht mehr oder wurde entfernt."}
      </div>
      <button onClick={() => navigate(-1)} className="wd-tap"
        style={{ padding:"13px 28px", borderRadius:16,
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          color:"white", border:"none", fontWeight:800,
          fontSize:14, cursor:"pointer",
          boxShadow:`0 4px 18px ${C.tealGlow}` }}>
        Zurück
      </button>
    </div>
  );

  /* ── Data ──────────────────────────────────────────────────────── */
  const images      = getImages(werk);
  const priceStr    = fmtPrice(werk.price);
  const displayName = creator?.display_name || creator?.username || "Unbekannter Creator";
  const username    = creator?.username || "hui-user";
  const avatarUrl   = creator?.avatar_url || null;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:C.warm,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      maxWidth:680, margin:"0 auto" }}>
      <style>{CSS}</style>

      {/* ── Back Button (floating) ── */}
      <div style={{ position:"fixed", top:"max(16px,env(safe-area-inset-top,16px))",
        left:16, zIndex:200 }}>
        <button onClick={() => navigate(-1)} className="wd-tap"
          style={{ width:40, height:40, borderRadius:"50%",
            background:"rgba(0,0,0,0.38)", backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.2)", color:"white",
            fontSize:18, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center" }}>
          ‹
        </button>
      </div>

      {/* ── Hero Gallery ── */}
      <ImageGallery images={images} title={werk.title || "Werk"}/>

      {/* ── Content ── */}
      <div style={{ padding:"0 0 120px", animation:"wdFadeUp 0.4s 0.1s both" }}>

        {/* Category + Price header */}
        <div style={{ padding:"20px 20px 0",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ background:C.coralPale, border:`1px solid ${C.coral}33`,
            borderRadius:999, padding:"4px 12px",
            fontSize:11, fontWeight:800, color:C.coral,
            letterSpacing:1.2, textTransform:"uppercase" }}>
            {werk.category || "Werk"}
          </div>
          {priceStr && (
            <div style={{ fontSize:26, fontWeight:900, color:C.ink,
              letterSpacing:-0.5 }}>
              {priceStr}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ padding:"12px 20px 0" }}>
          <h1 style={{ margin:0, fontSize:"clamp(20px,2.2rem,30px)",
            fontWeight:900, color:C.ink, letterSpacing:-0.8, lineHeight:1.15 }}>
            {werk.title || "Unbekanntes Werk"}
          </h1>
        </div>

        {/* ── Creator Section ── */}
        <div onClick={() => onViewCreator ? onViewCreator(normalizeProfileInput(creator)) : navigate(`/profile/${username}`)}
          className="wd-tap"
          style={{ margin:"16px 20px 0", padding:"14px 16px",
            background:C.card, borderRadius:18,
            border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
            display:"flex", alignItems:"center", gap:12,
            cursor:"pointer" }}>
          <Avatar url={avatarUrl} name={displayName} size={46}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
              <span style={{ fontWeight:800, fontSize:15, color:C.ink,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {displayName}
              </span>
              {creator?.is_wirker && (
                <span style={{ fontSize:13 }}>✦</span>
              )}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>@{username}</div>
            {creator?.bio && (
              <div style={{ fontSize:12, color:C.ink2, marginTop:4,
                lineHeight:1.5, overflow:"hidden",
                display:"-webkit-box", WebkitLineClamp:2,
                WebkitBoxOrient:"vertical" }}>
                {creator.bio}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
            {user?.id && creator?.id && user.id !== creator.id && (
              <button onClick={handleFollow}
                style={{ padding:"7px 14px",
                  background: following
                    ? "rgba(0,0,0,0.06)"
                    : "linear-gradient(135deg,#16D7C5,#11C5B7)",
                  border:"none", borderRadius:50,
                  fontSize:12, fontWeight:700,
                  color: following ? "#888" : "white",
                  cursor:"pointer", fontFamily:"inherit",
                  transition:"all .2s" }}>
                {following ? "Folge ich" : "Folgen"}
              </button>
            )}
            <div style={{ color:C.muted, fontSize:18 }}>›</div>
          </div>
        </div>

        {/* ── Social Actions ── */}
        <div style={{ margin:"16px 20px 0", padding:"8px 4px",
          background:C.card, borderRadius:18, border:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-around",
          boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          {/* HUI Interaction Language v1.0 (2026-07-05) — Mapping:
              Resonanz bleibt Like-Reaktion | Kommentar → Austauschen
              (oeffnet bereits den Diskussions-Thread) | Teilen → Weitergeben
              (2026-07-05: Schale+Samen → Schwung-Pfeil, Lars-Vorlage;
              "das moechte ich an andere weitergeben") | Merken bleibt
              Bookmark. */}
          <IconBtn
            Icon={HUIHeartIcon}
            label={resonanceCount > 0 ? String(resonanceCount) : "Resonanz"}
            active={resonated}
            color={C.coral}
            variant="resonanz"
            onPress={handleLike}
          />
          <IconBtn
            Icon={ExchangeIcon}
            label={commentCount > 0 ? String(commentCount) : "Austauschen"}
            active={showComments}
            color={C.teal}
            variant="austauschen"
            onPress={() => { haptic("light"); setShowComments(s => !s); }}
          />
          <IconBtn
            Icon={RecommendIcon}
            label={shareOk ? "Kopiert!" : "Weitergeben"}
            active={shareOk}
            color={C.teal}
            variant="weitergeben"
            onPress={() => { haptic("light"); handleShare(); }}
          />
          <IconBtn
            Icon={HUIBookmarkIcon}
            label={saved ? "Gemerkt" : "Merken"}
            active={saved}
            color={C.gold}
            variant="merken"
            onPress={handleSave}
          />
        </div>

        {/* ── Comments Section ── */}
        {showComments && (
          <div style={{ margin:"12px 20px 0", background:C.card,
            borderRadius:18, border:`1px solid ${C.border}`,
            overflow:"hidden" }}>
            {/* Input */}
            <div style={{ display:"flex", gap:8, padding:"12px 14px",
              borderBottom:`1px solid ${C.border}` }}>
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleComment()}
                placeholder="Dein Kommentar..."
                style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:50,
                  padding:"9px 14px", fontSize:13, color:HUI.COLOR.ink,
                  fontFamily:"inherit", outline:"none", background:HUI.COLOR.cream }}
              />
              <button onClick={handleComment} disabled={!commentInput.trim() || submittingComment}
                style={{ padding:"9px 16px", background:`linear-gradient(135deg,#16D7C5,#11C5B7)`,
                  border:"none", borderRadius:50, fontSize:13, fontWeight:700,
                  color:"white", cursor:"pointer", opacity: !commentInput.trim() ? 0.4 : 1 }}>
                →
              </button>
            </div>
            {/* Comment list */}
            <div style={{ maxHeight:280, overflowY:"auto" }}>
              {comments.length === 0 ? (
                <div style={{ padding:"24px", textAlign:"center",
                  fontSize:13, color:"#888" }}>
                  Noch kein Kommentar. Sei der Erste.
                </div>
              ) : (comments || []).filter(c => c && (c.id || c.user_id)).map(c => (
                <div key={c.id} style={{ display:"flex", gap:10, padding:"10px 14px",
                  borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
                    background:"linear-gradient(135deg,#16D7C544,#FF8A6B44)",
                    overflow:"hidden", display:"flex", alignItems:"center",
                    justifyContent:"center", fontWeight:700, fontSize:13, color:HUI.COLOR.teal }}>
                    {c.profiles?.avatar_url
                      ? <img src={c.profiles.avatar_url} alt=""
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : (c.profiles?.display_name?.[0] || "?")}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"baseline", marginBottom:2 }}>
                      <span style={{ fontWeight:700, fontSize:12, color:HUI.COLOR.ink }}>
                        {c.profiles?.display_name || "Nutzer"}
                      </span>
                      <span style={{ fontSize:10, color:"#BBB" }}>
                        {new Date(c.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short"})}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:HUI.COLOR.ink2, lineHeight:1.5 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {werk.description && (
          <div style={{ margin:"16px 20px 0", padding:"18px",
            background:C.card, borderRadius:18, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted,
              letterSpacing:1.4, textTransform:"uppercase", marginBottom:10 }}>
              Beschreibung
            </div>
            <p style={{ margin:0, fontSize:14.5, color:C.ink2,
              lineHeight:1.75, whiteSpace:"pre-wrap" }}>
              {werk.description}
            </p>
          </div>
        )}

        {/* ── Details Grid ── */}
        <div style={{ margin:"12px 20px 0",
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {werk.category && (
            <div style={{ padding:"14px 16px", background:C.card,
              borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.muted,
                letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>
                Kategorie
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>
                {werk.category}
              </div>
            </div>
          )}
          {werk.created_at && (
            <div style={{ padding:"14px 16px", background:C.card,
              borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.muted,
                letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>
                Erstellt
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>
                {new Date(werk.created_at).toLocaleDateString("de-DE",
                  { day:"numeric", month:"long", year:"numeric" })}
              </div>
            </div>
          )}
        </div>

        {/* ── Related Works ── */}
        {related.length > 0 && (
          <div style={{ margin:"24px 0 0" }}>
            <div style={{ padding:"0 20px 14px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
                Ähnliche Werke
              </div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>
                {related.length} Werke
              </div>
            </div>
            <div className="wd-scroll"
              style={{ display:"flex", gap:12, overflowX:"auto",
                padding:"0 20px 4px" }}>
              {console.log('[HUI MAP DEBUG] WorkDetailPage.jsx.related', related) || null}
          {(related || []).filter(w => w && typeof w === 'object').map(w => (
                <RelatedCard key={w.id} werk={w}
                  onClick={id => navigate(`/work/${id}`)}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Commerce Bar ── */}
      <div style={{ position:"fixed", bottom:0, left:"50%",
        transform:"translateX(-50%)", width:"100%", maxWidth:680,
        padding:"12px 20px", paddingBottom:"max(12px,env(safe-area-inset-bottom,12px))",
        background:"rgba(249,247,244,0.96)", backdropFilter:"blur(16px)",
        borderTop:`1px solid ${C.border}`,
        display:"flex", gap:10, zIndex:10500 }}>
        <button
          onClick={() => onAddToKorb ? onAddToKorb({...werk, img: images[0], price: priceStr}) : null}
          className="wd-tap"
          style={{ flex:1, padding:"14px",
            background:"none", border:`1.5px solid ${C.coral}55`,
            borderRadius:16, color:C.coral, fontSize:14,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          In den Korb
        </button>
        <button
          onClick={() => onBuyWerk ? onBuyWerk({...werk, img: images[0], price: priceStr}) : onBuyWerk?.({...werk, img: images[0], price: priceStr})}
          className="wd-tap"
          style={{ flex:2, padding:"14px",
            background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
            border:"none", borderRadius:16, color:"white",
            fontSize:14, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:`0 4px 18px ${C.coralGlow}` }}>
          Jetzt kaufen ✦
        </button>
      </div>

    </div>
  );
}