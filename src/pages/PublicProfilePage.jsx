// src/pages/PublicProfilePage.jsx — HUI Phase 3 FINAL
// "A living emotional identity inside a real human ecosystem."
// ════════════════════════════════════════════════════════════════
// ARCHITECTURE: Fully self-contained. No owner mode.
// Every interaction works. Every section connects.
// USAGE: <PublicProfilePage profileId="uuid" onClose={() => {}} />
// ════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useConnectionEngine } from "../core/HuiConnectionEngine.jsx";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:         "#F7F6F3",
  bgCard:     "#FFFFFF",
  bgSheet:    "rgba(252,251,249,0.98)",
  teal:       "#0EC4B8",
  tealSoft:   "rgba(14,196,184,0.10)",
  tealMid:    "rgba(14,196,184,0.22)",
  coral:      "#FF6B52",
  coralSoft:  "rgba(255,107,82,0.10)",
  coralMid:   "rgba(255,107,82,0.22)",
  ink:        "#0F1117",
  inkSoft:    "rgba(15,17,23,0.55)",
  inkFaint:   "rgba(15,17,23,0.28)",
  border:     "rgba(15,17,23,0.07)",
  borderMid:  "rgba(15,17,23,0.12)",
  px:         20,
  r4:4, r8:8, r12:12, r16:16, r20:20, r24:24, r99:99,
  cardShadow: "0 2px 12px rgba(15,17,23,0.06), 0 1px 3px rgba(15,17,23,0.04)",
  floatShadow:"0 8px 32px rgba(15,17,23,0.10), 0 2px 8px rgba(15,17,23,0.06)",
  sheetShadow:"0 -12px 48px rgba(15,17,23,0.14)",
  glowTeal:   "0 4px 20px rgba(14,196,184,0.28)",
  glowCoral:  "0 4px 20px rgba(255,107,82,0.22)",
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
  .ppp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif; }
  .ppp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ppp-scroll::-webkit-scrollbar { display:none; }

  @keyframes ppp-breathe  { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.012) translateY(-2px)} }
  @keyframes ppp-pulse-ring { 0%{transform:scale(1);opacity:.55} 70%{transform:scale(1.38);opacity:0} 100%{transform:scale(1.38);opacity:0} }
  @keyframes ppp-fade-up  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes ppp-blob-drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-8px) scale(1.05)} }
  @keyframes ppp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes ppp-success-pop { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes ppp-tag-glow { 0%,100%{box-shadow:0 0 0 0 rgba(14,196,184,0)} 50%{box-shadow:0 0 0 4px rgba(14,196,184,0.18)} }

  .ppp-avatar-ring { animation:ppp-breathe 4.8s ease-in-out infinite; }
  .ppp-blob  { animation:ppp-blob-drift 12s ease-in-out infinite; }
  .ppp-blob2 { animation:ppp-blob-drift 18s ease-in-out infinite reverse; }
  .ppp-skeleton {
    background:linear-gradient(90deg,rgba(15,17,23,.05) 25%,rgba(15,17,23,.09) 50%,rgba(15,17,23,.05) 75%);
    background-size:200% 100%;
    animation:ppp-shimmer 1.4s ease-in-out infinite;
    border-radius:8px;
  }
  .ppp-press { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease; }
  .ppp-press:active { transform:scale(0.93); opacity:0.76; }
  .ppp-press-light { transition:transform .14s ease,opacity .14s ease; }
  .ppp-press-light:active { transform:scale(0.96); opacity:0.82; }
  .ppp-in { animation:ppp-fade-up .55s ease both; }
  .ppp-sheet { animation:ppp-slide-up .32s cubic-bezier(.22,1,.36,1) both; }
  .ppp-success { animation:ppp-success-pop .45s cubic-bezier(.22,1,.36,1) both; }
  .ppp-value-active { animation:ppp-tag-glow 1.8s ease-in-out 1; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const s  = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const n  = (v, fb=0)  => (typeof v==="number" && isFinite(v) ? v : fb);
const a  = (v)        => Array.isArray(v) ? v : [];
const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1).replace(".0","")}K` : String(n);

function useEntry(delay=0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.04 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: {
    opacity: vis?1:0,
    transform: vis?"none":"translateY(14px)",
    transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
  }};
}

// ── Supabase ─────────────────────────────────────────────────────
async function loadPublicProfile(profileId) {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,bio,avatar_url,header_img,location,verified,is_member,role,impact_eur,followers,bookings,interests,current_work,has_talent_profile,membership_type")
      .eq("id", profileId).single();
    if (error) {
      const { data:d2 } = await supabase
        .from("profiles")
        .select("id,username,display_name,bio,avatar_url,header_img,location,verified,is_member,role,impact_eur,followers,bookings,interests,current_work,has_talent_profile,membership_type")
        .eq("username", profileId).single();
      return d2 || null;
    }
    return data;
  } catch { return null; }
}

// ── Fallback data ─────────────────────────────────────────────────
const FB_IMG = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FB_AVT = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const SEED_MOMENTS = [
  { id:"m1", caption:"Neues Werk entsteht", time:"Vor 2 Std.", img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=75" },
  { id:"m2", caption:"Heute am See",        time:"Vor 1 Tag",  img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=75" },
  { id:"m3", caption:"Abendlicht",          time:"Vor 2 Tagen",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75" },
  { id:"m4", caption:"Atelier Session",     time:"Vor 3 Tagen",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=75" },
  { id:"m5", caption:"Gemeinschaft",        time:"Vor 4 Tagen",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=75" },
];

const SEED_ENCOUNTERS = [
  { id:"e1", emoji:"🌿", title:"Kreativer Waldrundgang", type:"Natur", date:"Sa, 31. Mai", time:"09:00", location:"München", spotsLeft:3, host:"Mia Waldmann", feeling:"Erd dich. Atme tief.", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75", relatedValue:"Natur" },
  { id:"e2", emoji:"🧘", title:"Stille Meditation",      type:"Heilung",  date:"Mo, 2. Jun",  time:"06:00", location:"Hamburg",  spotsLeft:7, host:"Lena Stern",   feeling:"Beginne in Stille.",  img:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=75", relatedValue:"Achtsamkeit" },
  { id:"e3", emoji:"🍽️", title:"Community Dinner",      type:"Verbindung",date:"Fr, 6. Jun", time:"19:00", location:"Berlin",   spotsLeft:12,host:"Jonas Kreuz",  feeling:"Echter Austausch.",   img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75", relatedValue:"Gemeinschaft" },
];

const SEED_PROJECTS = [
  { id:"p1", emoji:"🌱", title:"Stadtgarten Projekt", tag:"Lokal",  tagColor:"rgba(34,197,94,0.15)",  tagText:"#16A34A", desc:"Gemeinsam grüne Oasen schaffen.", supporters:24, target:50, relatedValue:"Natur" },
  { id:"p2", emoji:"🐾", title:"Tierheim Support",    tag:"Tiere",  tagColor:"rgba(245,158,11,0.15)", tagText:"#D97706", desc:"Monatliche Unterstützung für 3 Tierheime.", supporters:18, target:30, relatedValue:"Tiere" },
  { id:"p3", emoji:"🎨", title:"Kunst im Kiez",       tag:"Kultur", tagColor:"rgba(99,102,241,0.15)", tagText:"#6366F1", desc:"Kreativprojekte für alle Altersgruppen.", supporters:41, target:60, relatedValue:"Kreativität" },
];

const DEFAULT_VALUES = [
  { icon:"🌿", label:"Natur",        bg:"rgba(34,197,94,0.10)",   related:["e1","p1"] },
  { icon:"✨", label:"Kreativität",  bg:"rgba(14,196,184,0.10)",  related:["p3"] },
  { icon:"👥", label:"Gemeinschaft", bg:"rgba(99,102,241,0.10)",  related:["e3"] },
  { icon:"🤍", label:"Achtsamkeit",  bg:T.coralSoft,              related:["e2"] },
  { icon:"🐾", label:"Tiere",        bg:"rgba(245,158,11,0.10)",  related:["p2"] },
  { icon:"🎵", label:"Musik",        bg:"rgba(139,92,246,0.10)",  related:[] },
];

// ══════════════════════════════════════════════════════════════
// ATOMS
// ══════════════════════════════════════════════════════════════
function Sk({ w="100%", h=16, r=8, sx={} }) {
  return <div className="ppp-skeleton" style={{ width:w,height:h,borderRadius:r,...sx }} />;
}

function PillBtn({ icon, label, variant="ghost", onClick, active=false, sx={} }) {
  const styles = {
    primary: { background:`linear-gradient(135deg,${T.teal},#0DBBAF)`, color:"white", border:"none", boxShadow:T.glowTeal },
    soft:    { background:T.tealSoft, color:T.teal, border:`1px solid ${T.tealMid}` },
    coral:   { background:T.coralSoft, color:T.coral, border:`1px solid ${T.coralMid}` },
    ghost:   { background:"rgba(15,17,23,0.05)", color:T.inkSoft, border:`1px solid ${T.border}` },
    active:  { background:T.tealSoft, color:T.teal, border:`1.5px solid ${T.teal}` },
  };
  return (
    <button className="ppp-press" onClick={onClick} style={{
      display:"inline-flex",alignItems:"center",gap:6,
      padding:"10px 18px",borderRadius:T.r99,
      fontSize:13,fontWeight:600,cursor:"pointer",
      touchAction:"manipulation",fontFamily:"inherit",
      transition:"all .2s ease",
      ...(active ? styles.active : styles[variant]||styles.ghost),
      ...sx,
    }}>
      {icon && <span style={{fontSize:15}}>{icon}</span>}
      {label}
    </button>
  );
}

function Divider() { return <div style={{height:1,margin:`4px ${T.px}px`,background:T.border}}/>; }
function Gap({ h=24 }) { return <div style={{height:h}}/>; }

// ── Section Header ────────────────────────────────────────────────
function SectionHead({ icon, title, sub, cta, onCta }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:`0 ${T.px}px 14px` }}>
      <div>
        <div style={{ fontSize:17,fontWeight:800,color:T.ink,letterSpacing:"-0.025em",display:"flex",gap:7,alignItems:"center" }}>
          {icon && <span>{icon}</span>}{title}
        </div>
        {sub && <div style={{fontSize:12,color:T.inkFaint,marginTop:2}}>{sub}</div>}
      </div>
      {cta && (
        <button className="ppp-press-light" onClick={onCta} style={{
          background:"none",border:"none",padding:0,
          fontSize:12,color:T.teal,fontWeight:700,
          cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
          flexShrink:0,
        }}>{cta}</button>
      )}
    </div>
  );
}

// ── Bottom Sheet Wrapper ──────────────────────────────────────────
function Sheet({ onClose, children, zIndex=9700 }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex,background:"rgba(15,17,23,0.48)",display:"flex",alignItems:"flex-end" }}
      onClick={onClose}>
      <div className="ppp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%",background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px, calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheetShadow,
      }}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. HERO — Emotional identity header
// MICRO-COMPLETE v1: Avatar · Identity · Values · 5 Actions
// ══════════════════════════════════════════════════════════════

// ── Avatar fullscreen modal ───────────────────────────────────
function AvatarModal({ src, name, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed",inset:0,zIndex:9900,
        background:"rgba(10,12,18,0.92)",
        backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        display:"flex",alignItems:"center",justifyContent:"center",
        animation:"ppp-fade-up .22s ease both",
      }}
    >
      <div onClick={e=>e.stopPropagation()} style={{ position:"relative",maxWidth:320,width:"90vw" }}>
        <div style={{
          width:"100%",aspectRatio:"1",borderRadius:"50%",overflow:"hidden",
          boxShadow:"0 24px 80px rgba(0,0,0,0.55), 0 0 0 3px rgba(14,196,184,0.35)",
        }}>
          <img src={src} alt={name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
        </div>
        <div style={{ textAlign:"center",marginTop:20,fontSize:17,fontWeight:700,color:"rgba(255,255,255,0.9)" }}>{name}</div>
        <button onClick={onClose} style={{
          position:"absolute",top:-12,right:-12,
          width:34,height:34,borderRadius:"50%",
          background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",
          border:"1px solid rgba(255,255,255,0.18)",color:"white",
          fontSize:16,cursor:"pointer",touchAction:"manipulation",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>×</button>
      </div>
    </div>
  );
}

// ── Value pill (tappable, floating) ───────────────────────────
function ValuePill({ icon, label, bg }) {
  const [tapped, setTapped] = useState(false);
  return (
    <button
      onClick={()=>{ setTapped(true); setTimeout(()=>setTapped(false),900); }}
      style={{
        display:"inline-flex",alignItems:"center",gap:5,
        padding:"6px 13px",borderRadius:T.r99,
        background: tapped ? T.tealSoft : bg,
        border:`1px solid ${tapped ? T.teal : "transparent"}`,
        fontSize:12.5,fontWeight:600,color: tapped ? T.teal : T.ink,
        cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
        transition:"all .2s cubic-bezier(.22,1,.36,1)",
        boxShadow: tapped ? T.glowTeal : "0 1px 4px rgba(15,17,23,0.06)",
        flexShrink:0,
      }}
    ><span style={{fontSize:14}}>{icon}</span>{label}</button>
  );
}

// ── Action icon button ────────────────────────────────────────
function ActionBtn({ icon, label, onClick, active=false, variant="ghost" }) {
  const styles = {
    ghost:   { bg:"rgba(15,17,23,0.05)", color:T.inkSoft, border:`1px solid ${T.border}` },
    teal:    { bg:T.tealSoft, color:T.teal, border:`1px solid ${T.tealMid}` },
    coral:   { bg:T.coralSoft, color:T.coral, border:`1px solid ${T.coralMid}` },
    active:  { bg:T.tealSoft, color:T.teal, border:`1.5px solid ${T.teal}`, boxShadow:T.glowTeal },
  };
  const st = active ? styles.active : styles[variant]||styles.ghost;
  return (
    <button className="ppp-press" onClick={onClick} style={{
      display:"flex",flexDirection:"column",alignItems:"center",gap:4,
      padding:"10px 14px",borderRadius:T.r16,
      background:st.bg,border:st.border,
      boxShadow:st.boxShadow||"none",
      color:st.color,fontSize:11,fontWeight:600,
      cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
      transition:"all .22s cubic-bezier(.22,1,.36,1)",
      minWidth:58,
    }}>
      <span style={{fontSize:18,lineHeight:1}}>{icon}</span>
      <span style={{lineHeight:1.2}}>{label}</span>
    </button>
  );
}

// ── Main ProfileHero ──────────────────────────────────────────
function ProfileHero({ profile, loading, onClose, onFollow, followed, onChat, onSupport }) {
  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [avLoaded,    setAvLoaded]    = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [shareToast,  setShareToast]  = useState(false);
  const [avatarOpen,  setAvatarOpen]  = useState(false);
  const [connecting,  setConnecting]  = useState(false);

  const engine = useConnectionEngine();

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),60); return()=>clearTimeout(t); },[]);

  // ── Derived values ──────────────────────────────────────────
  const heroImg  = s(profile?.header_img,  FB_IMG);
  const avatar   = s(profile?.avatar_url,  FB_AVT);
  const name     = s(profile?.display_name||profile?.name||profile?.username, "Unbekannt");
  const uname    = s(profile?.username, "");
  const bio      = s(profile?.bio, "");
  const loc      = s(profile?.location, "");
  const isTalent = !!(profile?.has_talent_profile||profile?.is_member||
                      profile?.role==="talent"||profile?.role==="wirker"||
                      profile?.membership_type==="talent");
  const profileId = s(profile?.id, "");
  const isConn   = engine.isConnected(profileId);

  // ── Values preview (max 4) ──────────────────────────────────
  const rawInterests = a(profile?.interests);
  const valueTags = rawInterests.length
    ? rawInterests.slice(0,4).map((it,i)=>({
        icon: DEFAULT_VALUES[i % DEFAULT_VALUES.length].icon,
        label: typeof it==="string" ? it : s(it?.name,""),
        bg:   DEFAULT_VALUES[i % DEFAULT_VALUES.length].bg,
      }))
    : DEFAULT_VALUES.slice(0,4);

  // ── Handlers ────────────────────────────────────────────────
  const handleShare = () => {
    const url = `${window.location.origin}/p/${s(profile?.username||profile?.id,"hui")}`;
    if (navigator.share) {
      navigator.share({ title:`${name} auf HUI`, url }).catch(()=>{});
    } else {
      try { navigator.clipboard.writeText(url); } catch(e) {}
    }
    setShareToast(true);
    setTimeout(()=>setShareToast(false), 2000);
  };

  const handleConnect = () => {
    if (isConn) return;
    setConnecting(true);
    setTimeout(()=>{
      engine.connect(profileId, profile);
      engine.updateAmbient?.(`✦ Neue Verbindung mit ${name}`);
      setConnecting(false);
    }, 260);
  };

  return (
    <>
      {/* ── COVER ─────────────────────────────────────────────── */}
      <div style={{ width:"100%",position:"relative" }}>
        <div style={{
          width:"100%",height:200,position:"relative",
          overflow:"hidden",
          background:"linear-gradient(135deg,#0D1B2A 0%,#162535 100%)",
        }}>
          {/* Hero image */}
          <img
            src={heroImg} alt=""
            onLoad={()=>setImgLoaded(true)}
            onError={()=>setImgLoaded(true)}
            style={{
              position:"absolute",inset:0,width:"100%",height:"100%",
              objectFit:"cover",
              opacity:imgLoaded ? 0.42 : 0,
              transition:"opacity 1s ease",
            }}
          />
          {/* Bottom fade to cream */}
          <div style={{
            position:"absolute",inset:0,
            background:"linear-gradient(180deg,rgba(247,246,243,0) 30%,rgba(247,246,243,0.92) 88%,rgba(247,246,243,1) 100%)",
          }}/>
          {/* Ambient blobs */}
          <div className="ppp-blob" style={{
            position:"absolute",top:-50,right:-50,width:220,height:220,
            borderRadius:"50%",pointerEvents:"none",
            background:"radial-gradient(circle,rgba(14,196,184,0.16),transparent 70%)",
          }}/>
          <div className="ppp-blob2" style={{
            position:"absolute",bottom:10,left:-40,width:180,height:180,
            borderRadius:"50%",pointerEvents:"none",
            background:"radial-gradient(circle,rgba(255,107,82,0.11),transparent 70%)",
          }}/>

          {/* ← Back */}
          <button className="ppp-press" onClick={onClose} style={{
            position:"absolute",top:16,left:16,zIndex:10,
            width:38,height:38,borderRadius:"50%",
            background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
            border:"1px solid rgba(255,255,255,0.62)",
            boxShadow:"0 2px 12px rgba(0,0,0,0.12)",
            cursor:"pointer",touchAction:"manipulation",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:17,color:T.ink,
          }}>←</button>

          {/* ⬆ Share */}
          <button className="ppp-press" onClick={handleShare} style={{
            position:"absolute",top:16,right:16,zIndex:10,
            width:38,height:38,borderRadius:"50%",
            background: shareToast?"rgba(14,196,184,0.90)":"rgba(255,255,255,0.88)",
            backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
            border:"1px solid rgba(255,255,255,0.62)",
            boxShadow:"0 2px 12px rgba(0,0,0,0.12)",
            cursor:"pointer",touchAction:"manipulation",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:15,
            color: shareToast?"white":T.inkSoft,
            transition:"all .25s ease",
          }}>{shareToast ? "✓" : "⬆"}</button>
        </div>

        {/* ── IDENTITY CARD ───────────────────────────────────── */}
        <div style={{
          width:"100%",
          marginTop:-56,
          padding:`0 ${T.px}px 28px`,
          position:"relative",zIndex:2,
          opacity: mounted?1:0,
          transform: mounted?"none":"translateY(10px)",
          transition:"opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1)",
        }}>

          {/* Row: Avatar + Follow */}
          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:18 }}>

            {/* Avatar */}
            <div className="ppp-avatar-ring" style={{ position:"relative",flexShrink:0 }}>
              {/* Gradient ring */}
              <div style={{
                position:"absolute",inset:-4,borderRadius:"50%",
                background: isTalent
                  ? `conic-gradient(from 0deg,${T.teal},${T.coral},${T.teal})`
                  : `conic-gradient(from 0deg,rgba(14,196,184,0.55),rgba(14,196,184,0.18),rgba(14,196,184,0.55))`,
                opacity:0.88,
              }}/>
              {/* Pulse ring — talent only */}
              {isTalent && (
                <div style={{
                  position:"absolute",inset:-9,borderRadius:"50%",
                  border:"2px solid rgba(14,196,184,0.26)",
                  animation:"ppp-pulse-ring 3s ease-out infinite",
                }}/>
              )}
              {/* Image container */}
              <div
                className="ppp-press"
                onClick={()=>setAvatarOpen(true)}
                style={{
                  position:"relative",width:92,height:92,borderRadius:"50%",
                  border:"3.5px solid white",
                  boxShadow:"0 6px 24px rgba(0,0,0,0.18),0 0 0 1px rgba(255,255,255,0.6)",
                  overflow:"hidden",background:T.bg,cursor:"pointer",
                  touchAction:"manipulation",
                }}
              >
                {!avLoaded && <div className="ppp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                <img
                  src={avatar} alt={name}
                  onLoad={()=>setAvLoaded(true)}
                  onError={()=>setAvLoaded(true)}
                  style={{
                    width:"100%",height:"100%",objectFit:"cover",
                    opacity:avLoaded?1:0,
                    transition:"opacity .5s ease",
                  }}
                />
              </div>
              {/* Verified */}
              {profile?.verified && (
                <div style={{
                  position:"absolute",bottom:3,right:3,
                  width:22,height:22,borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
                  border:"2.5px solid white",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:"white",fontWeight:800,
                  boxShadow:T.glowTeal,
                }}>✓</div>
              )}
            </div>

            {/* Follow button */}
            <button className="ppp-press" onClick={onFollow} style={{
              display:"inline-flex",alignItems:"center",gap:6,
              padding:"10px 22px",borderRadius:T.r99,
              fontSize:13.5,fontWeight:700,
              cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
              border:"none",alignSelf:"flex-start",marginTop:60,
              background: followed
                ? "rgba(15,17,23,0.08)"
                : `linear-gradient(135deg,${T.teal},#0DBBAF)`,
              color: followed ? T.inkSoft : "white",
              boxShadow: followed ? "none" : `${T.glowTeal},0 2px 12px rgba(14,196,184,0.22)`,
              transition:"all .28s cubic-bezier(.22,1,.36,1)",
            }}>
              {followed ? "✓ Gefolgt" : "+ Folgen"}
            </button>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <Sk w="52%" h={28}/><Sk w="32%" h={13}/><Sk w="80%" h={13} r={6}/><Sk w="66%" h={13} r={6}/>
            </div>
          )}

          {/* Identity */}
          {!loading && profile && (
            <>
              {/* Name + badge */}
              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5 }}>
                <h1 style={{
                  fontSize:"clamp(23px,6vw,30px)",fontWeight:800,
                  color:T.ink,letterSpacing:"-0.032em",lineHeight:1.1,margin:0,
                }}>{name}</h1>
                {isTalent && (
                  <span style={{
                    fontSize:9.5,fontWeight:800,letterSpacing:".07em",
                    color:T.teal,background:T.tealSoft,
                    border:`1px solid ${T.tealMid}`,
                    padding:"3px 9px",borderRadius:T.r99,
                    textTransform:"uppercase",
                  }}>Creator</span>
                )}
              </div>

              {/* @username + location */}
              <div style={{
                display:"flex",alignItems:"center",gap:10,
                fontSize:12.5,color:T.inkFaint,fontWeight:500,marginBottom:14,
              }}>
                {uname && <span>@{uname}</span>}
                {uname && loc && <span style={{width:3,height:3,borderRadius:"50%",background:T.inkFaint,display:"inline-block"}}/>}
                {loc && <span>📍 {loc}</span>}
              </div>

              {/* Bio */}
              {bio && (
                <p style={{
                  fontSize:14.5,lineHeight:1.7,color:T.inkSoft,
                  margin:"0 0 18px",
                  fontFamily:"-apple-system,'Georgia',serif",
                  maxWidth:340,
                }}>{bio}</p>
              )}

              {/* Values preview */}
              <div style={{
                display:"flex",flexWrap:"wrap",gap:7,marginBottom:22,
              }}>
                {valueTags.map((v,i)=>v.label && (
                  <ValuePill key={i} icon={v.icon} label={v.label} bg={v.bg}/>
                ))}
              </div>

              {/* ── Action row ── */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(4,1fr)",
                gap:8,
              }}>
                {/* Connect */}
                <ActionBtn
                  icon={connecting ? "…" : isConn ? "✓" : "✦"}
                  label={isConn ? "Verbunden" : "Verbinden"}
                  variant={isConn ? "active" : "ghost"}
                  active={isConn}
                  onClick={handleConnect}
                />
                {/* Message */}
                <ActionBtn
                  icon="💬"
                  label="Nachricht"
                  variant="teal"
                  onClick={onChat}
                />
                {/* Support */}
                <ActionBtn
                  icon="🌱"
                  label="Schenken"
                  variant="coral"
                  onClick={onSupport}
                />
                {/* Share (already in header but duplicate as action) */}
                <ActionBtn
                  icon={shareToast ? "✓" : "⬆"}
                  label={shareToast ? "Kopiert" : "Teilen"}
                  variant={shareToast ? "active" : "ghost"}
                  active={shareToast}
                  onClick={handleShare}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Avatar modal */}
      {avatarOpen && (
        <AvatarModal src={avatar} name={name} onClose={()=>setAvatarOpen(false)}/>
      )}
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// 2. PRESENCE STRIP — Soft human atmosphere, no metrics
// ══════════════════════════════════════════════════════════════

// Derive presence signals from profile data — no numbers, only character
function derivePresence(profile) {
  const items = [];
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const role      = profile?.role || "";
  const loc       = profile?.location || "";

  // From interests / values
  const interestMap = {
    "Natur":        { icon:"🌿", text:"organisiert Naturbegegnungen" },
    "Tiere":        { icon:"🐾", text:"unterstützt Tierprojekte" },
    "Musik":        { icon:"🎵", text:"lebt in Klang und Rhythmus" },
    "Kreativität":  { icon:"🎨", text:"liebt kreative Räume" },
    "Achtsamkeit":  { icon:"🧘", text:"teilt ruhige Momente" },
    "Gemeinschaft": { icon:"👥", text:"verbindet Menschen" },
    "Heilung":      { icon:"🌸", text:"schafft heilsame Räume" },
    "Kunst":        { icon:"🖼️", text:"erschafft sichtbare Schönheit" },
    "Sport":        { icon:"⚡", text:"bewegt sich mit Freude" },
    "Reisen":       { icon:"🌍", text:"erkundet neue Horizonte" },
  };

  interests.slice(0, 3).forEach(it => {
    const key = typeof it === "string" ? it : (it?.name || "");
    const mapped = interestMap[key];
    if (mapped) items.push(mapped);
  });

  // Role-based signal
  if (role === "talent" || role === "wirker" || profile?.has_talent_profile) {
    items.push({ icon:"✨", text:"aktiv in der Community" });
  }

  // Location signal
  if (loc) {
    items.push({ icon:"🌎", text:`engagiert sich in ${loc.split(",")[0]}` });
  }

  // Openness — always present as a warm closing signal
  items.push({ icon:"☕", text:"offen für Begegnungen" });

  // Unique, max 5
  const seen = new Set();
  return items.filter(it => {
    if (seen.has(it.text)) return false;
    seen.add(it.text);
    return true;
  }).slice(0, 5);
}

function PresencePill({ icon, text }) {
  const [tapped, setTapped] = useState(false);
  const handleTap = () => {
    setTapped(true);
    setTimeout(() => setTapped(false), 800);
  };
  return (
    <button
      className="ppp-press-light"
      onClick={handleTap}
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 15px",
        borderRadius: T.r99,
        border: `1px solid ${tapped ? T.tealMid : T.border}`,
        background: tapped
          ? T.tealSoft
          : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: tapped
          ? T.glowTeal
          : "0 1px 6px rgba(15,17,23,0.06)",
        cursor: "pointer",
        touchAction: "manipulation",
        fontFamily: "inherit",
        transition: "all .25s cubic-bezier(.22,1,.36,1)",
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontSize: 12.5,
        fontWeight: 500,
        color: tapped ? T.teal : T.inkSoft,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        transition: "color .25s ease",
      }}>{text}</span>
    </button>
  );
}

function PresenceStrip({ profile }) {
  const { ref, style } = useEntry(0);
  const items = useMemo(() => derivePresence(profile), [profile]);

  return (
    <div ref={ref} style={{ ...style, width: "100%" }}>
      <div style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        display: "flex",
        gap: 8,
        padding: `6px ${T.px}px 10px`,
      }}>
        {items.map((it, i) => (
          <PresencePill key={i} icon={it.icon} text={it.text} />
        ))}
        {/* Trailing spacer so last pill doesn't clip on iOS */}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
      <style>{`.ppp-scroll::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. HUMAN QUOTE — Emotional bio highlight
// ══════════════════════════════════════════════════════════════
function HumanQuote({ profile }) {
  const { ref, style } = useEntry(40);
  const bio  = s(profile?.bio, "");
  const name = s(profile?.display_name||profile?.username, "");
  if (!bio) return null;
  return (
    <div ref={ref} style={{ ...style,margin:`0 ${T.px}px`,background:`linear-gradient(135deg,${T.tealSoft},rgba(247,246,243,0.4))`,border:`1px solid ${T.tealMid}`,borderRadius:T.r20,padding:"22px 20px" }}>
      <div style={{ fontSize:28,color:T.teal,fontWeight:800,lineHeight:1,marginBottom:10,opacity:0.45 }}>"</div>
      <p style={{ fontSize:15,lineHeight:1.7,color:T.inkSoft,margin:"0 0 14px",fontFamily:"-apple-system,'Georgia',serif",fontStyle:"italic" }}>{bio}</p>
      {name && <div style={{ fontSize:12,fontWeight:700,color:T.teal }}>— {name}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. MOMENTS — Interactive memory spaces
// ══════════════════════════════════════════════════════════════
function MomentDetail({ m, onClose, onBookmark, bookmarked }) {
  return (
    <Sheet onClose={onClose} zIndex={9800}>
      <div style={{ position:"relative",borderRadius:T.r16,overflow:"hidden",marginBottom:20,height:240 }}>
        <img src={m.img} alt={m.caption} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,17,23,0.7),transparent 60%)" }}/>
        <div style={{ position:"absolute",bottom:16,left:16,right:16 }}>
          <div style={{ fontSize:16,fontWeight:700,color:"white",marginBottom:4 }}>{m.caption}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>{m.time}</div>
        </div>
        <button className="ppp-press" onClick={()=>onBookmark(m)} style={{
          position:"absolute",top:12,right:12,
          width:34,height:34,borderRadius:"50%",
          background:bookmarked?"rgba(14,196,184,0.9)":"rgba(255,255,255,0.85)",
          backdropFilter:"blur(8px)",border:"none",
          cursor:"pointer",touchAction:"manipulation",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
          transition:"all .2s ease",
        }}>{bookmarked?"🔖":"♡"}</button>
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <PillBtn icon="💬" label="Kommentieren" variant="soft" sx={{flex:1}} onClick={onClose}/>
        <PillBtn icon="⬆" label="Teilen" variant="ghost" sx={{flex:1}} onClick={()=>{ try{navigator.share({title:m.caption});}catch(e){} onClose(); }}/>
      </div>
    </Sheet>
  );
}

function MomentCard({ m, onClick }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-press ppp-in" onClick={()=>onClick(m)} style={{ flexShrink:0,width:155,height:205,borderRadius:T.r16,overflow:"hidden",position:"relative",cursor:"pointer",touchAction:"manipulation",boxShadow:T.cardShadow,background:"rgba(15,17,23,0.08)" }}>
      <img src={m.img} alt={m.caption} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} style={{ width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .5s ease",display:"block" }}/>
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,17,23,0.75),rgba(15,17,23,0.02) 55%)" }}/>
      <div style={{ position:"absolute",bottom:14,left:12,right:12 }}>
        <div style={{ fontSize:11.5,fontWeight:700,color:"white",lineHeight:1.4,marginBottom:3 }}>{m.caption}</div>
        <div style={{ fontSize:9,color:"rgba(255,255,255,0.52)",fontWeight:500 }}>{m.time}</div>
      </div>
    </div>
  );
}

function MomentsSection({ moments, engine }) {
  const { ref, style } = useEntry(60);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(null);
  const items = a(moments).length ? a(moments) : SEED_MOMENTS;
  const shown  = expanded ? items : items.slice(0,4);

  return (
    <div ref={ref} style={{ ...style,width:"100%",paddingBottom:8 }}>
      <SectionHead icon="📸" title="Momente" sub="Echte Augenblicke"
        cta={items.length>4 ? (expanded?"Weniger":"Alle ansehen") : null}
        onCta={()=>setExpanded(e=>!e)} />

      <div style={{ display:"flex",gap:10,overflowX:expanded?"visible":"auto",flexWrap:expanded?"wrap":"nowrap",scrollbarWidth:"none",padding:`3px ${T.px}px 6px`,WebkitOverflowScrolling:"touch" }}>
        {shown.map((m,i)=><MomentCard key={m.id||i} m={m} onClick={setSelected}/>)}
        {!expanded && <div style={{flexShrink:0,width:8}}/>}
      </div>

      {selected && (
        <MomentDetail
          m={selected}
          onClose={()=>setSelected(null)}
          onBookmark={(m)=>{ engine?.bookmark(m.id,"moment",m); }}
          bookmarked={engine?.isBookmarked(selected?.id)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. PROJECTS — Ecosystem nodes
// ══════════════════════════════════════════════════════════════
function ProjectDetail({ p, onClose, onSupport, engine }) {
  const [supportSent, setSupportSent] = useState(false);
  const supported = engine?.isBookmarked(`proj_${p.id}`);
  const progress  = Math.round((p.supporters / p.target) * 100);

  const handleSupport = () => {
    engine?.bookmark(`proj_${p.id}`, "project", p);
    setSupportSent(true);
    setTimeout(()=>setSupportSent(false), 2000);
    onSupport?.(p);
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20 }}>
        <div style={{ width:52,height:52,borderRadius:T.r16,background:p.tagColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0 }}>{p.emoji}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:4 }}>{p.title}</div>
          <span style={{ fontSize:10,fontWeight:800,letterSpacing:".04em",color:p.tagText,background:p.tagColor,padding:"2px 8px",borderRadius:T.r99 }}>{p.tag}</span>
        </div>
      </div>

      <p style={{ fontSize:14,lineHeight:1.65,color:T.inkSoft,margin:"0 0 20px" }}>{p.desc}</p>

      {/* Progress */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
          <span style={{ fontSize:13,fontWeight:700,color:T.ink }}>{p.supporters} Unterstützer</span>
          <span style={{ fontSize:13,color:T.inkFaint }}>Ziel: {p.target}</span>
        </div>
        <div style={{ height:6,borderRadius:T.r99,background:"rgba(15,17,23,0.07)",overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${Math.min(progress,100)}%`,background:`linear-gradient(90deg,${T.teal},#0DBBAF)`,borderRadius:T.r99,transition:"width .8s ease" }}/>
        </div>
        <div style={{ fontSize:11,color:T.inkFaint,marginTop:5 }}>{progress}% erreicht</div>
      </div>

      {/* Related encounters */}
      {SEED_ENCOUNTERS.filter(e=>e.relatedValue===p.relatedValue).length>0 && (
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:12,fontWeight:700,color:T.inkSoft,marginBottom:8 }}>Verbundene Begegnungen</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {SEED_ENCOUNTERS.filter(e=>e.relatedValue===p.relatedValue).map(e=>(
              <span key={e.id} style={{ fontSize:12,padding:"5px 12px",borderRadius:T.r99,background:T.tealSoft,color:T.teal,fontWeight:600 }}>{e.emoji} {e.title}</span>
            ))}
          </div>
        </div>
      )}

      <button className="ppp-press" onClick={handleSupport} style={{
        width:"100%",padding:"14px",borderRadius:T.r99,border:"none",
        background:supported||supportSent?`linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.08))`:`linear-gradient(135deg,${T.coral},#FF8A70)`,
        color:supported||supportSent?"#16A34A":"white",fontSize:14,fontWeight:700,
        cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
        boxShadow:supported||supportSent?"none":T.glowCoral,
        transition:"all .25s ease",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        {supportSent ? <span className="ppp-success">✓ Du unterstützt dieses Projekt</span>
          : supported ? "✓ Unterstützt"
          : "🌱 Projekt unterstützen"}
      </button>
    </Sheet>
  );
}

function ProjectCard({ p, onPress }) {
  const [pressed, setPressed] = useState(false);
  const progress = Math.round((p.supporters/p.target)*100);
  return (
    <div className="ppp-press-light ppp-in" onClick={()=>onPress(p)} style={{
      background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,
      boxShadow:T.cardShadow,padding:"16px",cursor:"pointer",touchAction:"manipulation",
    }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:12 }}>
        <div style={{ width:44,height:44,borderRadius:T.r12,background:p.tagColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{p.emoji}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4 }}>
            <span style={{ fontSize:13,fontWeight:700,color:T.ink,letterSpacing:"-0.01em" }}>{p.title}</span>
            <span style={{ fontSize:9,fontWeight:800,letterSpacing:".04em",color:p.tagText,background:p.tagColor,padding:"2px 7px",borderRadius:T.r99 }}>{p.tag}</span>
          </div>
          <div style={{ fontSize:12,color:T.inkSoft,lineHeight:1.45 }}>{p.desc}</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height:3,borderRadius:T.r99,background:"rgba(15,17,23,0.06)",overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${Math.min(progress,100)}%`,background:`linear-gradient(90deg,${T.teal},#0DBBAF)`,borderRadius:T.r99 }}/>
      </div>
      <div style={{ fontSize:10,color:T.inkFaint,marginTop:4 }}>{p.supporters} / {p.target} Unterstützer · {progress}%</div>
    </div>
  );
}

function ProjectsSection({ projects, engine }) {
  const { ref, style } = useEntry(80);
  const [selected, setSelected] = useState(null);
  const items = a(projects).length ? a(projects) : SEED_PROJECTS;

  return (
    <div ref={ref} style={{ ...style,width:"100%",padding:`0 ${T.px}px` }}>
      <SectionHead icon="🌱" title="Initiativen" sub="Wirkung im echten Leben"/>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {items.map((p,i)=><ProjectCard key={p.id||i} p={p} onPress={setSelected}/>)}
      </div>
      {selected && (
        <ProjectDetail p={selected} onClose={()=>setSelected(null)} engine={engine}
          onSupport={(p)=>{ engine?.updateAmbient?.(`🌱 Jemand unterstützt "${p.title}"`); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. ENCOUNTERS — Core platform flows
// ══════════════════════════════════════════════════════════════
function EncounterDetailSheet({ e, onClose, engine, onOpenHost }) {
  const joined    = engine?.hasJoined(e.id);
  const bookmarked= engine?.isBookmarked(`enc_${e.id}`);
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    setJoining(true);
    setTimeout(() => {
      if (joined) engine?.leaveEncounter(e.id);
      else engine?.joinEncounter(e.id, e);
      setJoining(false);
    }, 180);
    if (!joined) engine?.updateAmbient?.(`✦ Jemand nimmt an "${e.title}" teil`);
  };

  return (
    <Sheet onClose={onClose} zIndex={9800}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
          <div style={{ fontSize:32 }}>{e.emoji||"🌿"}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17,fontWeight:800,color:T.ink,letterSpacing:"-0.025em",marginBottom:4 }}>{e.title}</div>
            <div style={{ fontSize:12,color:T.inkSoft }}>{e.type}</div>
          </div>
          <button className="ppp-press" onClick={()=>{ engine?.bookmark(`enc_${e.id}`,"encounter",e); }} style={{
            width:36,height:36,borderRadius:"50%",border:"none",
            background:bookmarked?T.tealSoft:"rgba(15,17,23,0.05)",
            color:bookmarked?T.teal:T.inkSoft,
            cursor:"pointer",touchAction:"manipulation",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,
            transition:"all .2s ease",
          }}>{bookmarked?"🔖":"♡"}</button>
        </div>

        {/* Meta */}
        <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 }}>
          {[
            e.date && `📅 ${e.date}`,
            e.time && `⏰ ${e.time}`,
            e.location && `📍 ${e.location}`,
            e.spotsLeft && `👥 Noch ${e.spotsLeft} Plätze`,
          ].filter(Boolean).map((tag,i)=>(
            <span key={i} style={{ fontSize:12,padding:"5px 12px",borderRadius:T.r99,background:"rgba(15,17,23,0.05)",color:T.inkSoft,fontWeight:500 }}>{tag}</span>
          ))}
        </div>

        {e.feeling && (
          <div style={{ fontSize:14,color:T.inkSoft,fontStyle:"italic",lineHeight:1.6,padding:"12px 16px",borderRadius:T.r12,background:T.tealSoft,border:`1px solid ${T.tealMid}`,marginBottom:16 }}>
            "{e.feeling}"
          </div>
        )}

        {/* Host */}
        {e.host && (
          <div className="ppp-press-light" onClick={()=>{ onClose(); onOpenHost?.(e); }} style={{
            display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
            borderRadius:T.r16,background:T.bgCard,border:`1px solid ${T.border}`,
            cursor:"pointer",touchAction:"manipulation",marginBottom:16,
          }}>
            <div style={{ width:40,height:40,borderRadius:"50%",overflow:"hidden",flexShrink:0 }}>
              {e.hostAvatar
                ? <img src={e.hostAvatar} alt={e.host} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <div style={{width:"100%",height:"100%",background:T.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>
              }
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11,color:T.inkFaint,marginBottom:2 }}>Organisiert von</div>
              <div style={{ fontSize:14,fontWeight:700,color:T.ink }}>{e.host}</div>
            </div>
            <div style={{ fontSize:13,color:T.teal,fontWeight:600 }}>Profil →</div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button className="ppp-press" onClick={handleJoin} disabled={joining} style={{
        width:"100%",padding:"15px",borderRadius:T.r99,border:"none",
        background:joined?`linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06))`:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:joined?"#16A34A":"white",fontSize:15,fontWeight:700,
        cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
        boxShadow:joined?"none":T.glowTeal,
        transition:"all .25s ease",opacity:joining?.7:1,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        {joining?"…":joined?"✓ Du bist dabei":"✦ Ich bin dabei"}
      </button>
    </Sheet>
  );
}

function EncounterCard({ e, onPress }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-press ppp-in" onClick={()=>onPress(e)} style={{
      flexShrink:0,width:200,borderRadius:T.r16,overflow:"hidden",background:T.bgCard,
      cursor:"pointer",touchAction:"manipulation",boxShadow:T.floatShadow,
    }}>
      <div style={{ height:128,position:"relative",background:"rgba(15,17,23,0.06)" }}>
        <img src={e.img} alt={e.title} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
          style={{ width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .5s ease" }}/>
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,17,23,0.42),transparent 60%)" }}/>
        <div style={{ position:"absolute",top:10,left:10,background:"rgba(255,255,255,0.90)",backdropFilter:"blur(8px)",padding:"3px 9px",borderRadius:T.r99,fontSize:9.5,fontWeight:700,color:T.ink }}>{e.type}</div>
        <div style={{ position:"absolute",top:10,right:10,fontSize:16 }}>{e.emoji}</div>
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontSize:13,fontWeight:700,color:T.ink,marginBottom:5,letterSpacing:"-0.01em" }}>{e.title}</div>
        <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.inkSoft }}>
          {e.date ? <><span>📅</span><span>{e.date}</span></> : <><span>👥</span><span>{e.participants||"?"} Plätze</span></>}
        </div>
      </div>
    </div>
  );
}

function EncountersSection({ encounters, engine, onOpenProfile }) {
  const { ref, style } = useEntry(100);
  const [selected, setSelected] = useState(null);
  const items = a(encounters).length ? a(encounters) : SEED_ENCOUNTERS;

  return (
    <div ref={ref} style={{ ...style,width:"100%" }}>
      <SectionHead icon="🌿" title="Begegnungen" sub="Echte menschliche Verbindung"/>
      <div style={{ display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",padding:`3px ${T.px}px 6px`,WebkitOverflowScrolling:"touch" }}>
        {items.map((e,i)=><EncounterCard key={e.id||i} e={e} onPress={setSelected}/>)}
        <div style={{flexShrink:0,width:8}}/>
      </div>
      {selected && (
        <EncounterDetailSheet
          e={selected}
          onClose={()=>setSelected(null)}
          engine={engine}
          onOpenHost={(e)=>{ if(e.hostId||e.host) onOpenProfile?.(e.hostId, e.host); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 7. VALUES — Discovery gateways
// ══════════════════════════════════════════════════════════════
function ValueDiscovery({ value, onClose }) {
  const related = SEED_ENCOUNTERS.filter(e => e.relatedValue === value.label);
  const relProj  = SEED_PROJECTS.filter(p => p.relatedValue === value.label);
  return (
    <Sheet onClose={onClose}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <div style={{ width:48,height:48,borderRadius:T.r16,background:value.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>{value.icon}</div>
        <div>
          <div style={{ fontSize:18,fontWeight:800,color:T.ink }}>{value.label}</div>
          <div style={{ fontSize:12,color:T.inkFaint }}>Menschen und Begegnungen rund um diesen Wert</div>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <div style={{ fontSize:13,fontWeight:700,color:T.inkSoft,marginBottom:10 }}>🌿 Passende Begegnungen</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:18 }}>
            {related.map(e=>(
              <div key={e.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:T.r12,background:"rgba(15,17,23,0.04)",border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:22 }}>{e.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:T.ink }}>{e.title}</div>
                  <div style={{ fontSize:11,color:T.inkFaint }}>{e.date} · {e.location}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {relProj.length > 0 && (
        <>
          <div style={{ fontSize:13,fontWeight:700,color:T.inkSoft,marginBottom:10 }}>🌱 Verbundene Projekte</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:18 }}>
            {relProj.map(p=>(
              <div key={p.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:T.r12,background:"rgba(15,17,23,0.04)",border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:22 }}>{p.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:T.ink }}>{p.title}</div>
                  <div style={{ fontSize:11,color:T.inkFaint }}>{p.supporters} Unterstützer</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {related.length===0 && relProj.length===0 && (
        <div style={{ textAlign:"center",padding:"20px 0",color:T.inkFaint,fontSize:13 }}>
          Noch keine Inhalte für diesen Wert — bald mehr ✦
        </div>
      )}

      <PillBtn label={`Mehr zu ${value.label} entdecken →`} variant="soft" sx={{width:"100%",justifyContent:"center"}} onClick={onClose}/>
    </Sheet>
  );
}

function ValuesSection({ interests }) {
  const { ref, style } = useEntry(60);
  const [activeValue, setActiveValue] = useState(null);
  const raw   = a(interests);
  const tags  = raw.length
    ? raw.map((it,i)=>({ icon:DEFAULT_VALUES[i%DEFAULT_VALUES.length].icon, label:typeof it==="string"?it:s(it?.name,""), bg:DEFAULT_VALUES[i%DEFAULT_VALUES.length].bg }))
    : DEFAULT_VALUES;

  return (
    <div ref={ref} style={{ ...style,width:"100%",padding:`0 ${T.px}px` }}>
      <SectionHead icon="✦" title="Werte & Interessen" sub="Tap zum Entdecken"/>
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {tags.map((v,i)=>v.label&&(
          <button key={i} className="ppp-press ppp-value-active" onClick={()=>setActiveValue(v)} style={{
            display:"inline-flex",alignItems:"center",gap:7,
            padding:"9px 16px",borderRadius:T.r99,
            background:v.bg,border:`1px solid ${v.bg}`,
            fontSize:13,fontWeight:600,color:T.ink,
            cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
            transition:"all .18s ease",
          }}>
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
      </div>
      {activeValue && <ValueDiscovery value={activeValue} onClose={()=>setActiveValue(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. CONNECTION BRIDGE CARDS — Ecosystem context
// ══════════════════════════════════════════════════════════════
function ConnectionBridges({ profileId, engine }) {
  const { ref, style } = useEntry(120);
  // Dynamic bridge suggestions
  const bridges = [
    { icon:"👥", title:"3 gemeinsame Verbindungen", sub:"Lena, Jonas und 1 weiterer kennen diese Person", action:"Zeigen" },
    { icon:"🌿", title:"Ähnliche Begegnungen", sub:"Ihr habt beide Natur-Erlebnisse besucht", action:"Entdecken" },
    { icon:"💛", title:"Gemeinsame Werte", sub:"Natur · Achtsamkeit · Gemeinschaft", action:"Mehr" },
  ];

  return (
    <div ref={ref} style={{ ...style,padding:`0 ${T.px}px` }}>
      <SectionHead icon="✦" title="Verbindungen" sub="Was euch verbindet"/>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {bridges.map((b,i)=>(
          <div key={i} className="ppp-press-light" style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"14px 16px",borderRadius:T.r16,
            background:T.bgCard,border:`1px solid ${T.border}`,
            boxShadow:T.cardShadow,cursor:"pointer",touchAction:"manipulation",
          }}>
            <div style={{ width:40,height:40,borderRadius:T.r12,background:T.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink,marginBottom:3 }}>{b.title}</div>
              <div style={{ fontSize:11,color:T.inkSoft,lineHeight:1.4 }}>{b.sub}</div>
            </div>
            <div style={{ fontSize:12,color:T.teal,fontWeight:600,flexShrink:0 }}>{b.action} →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SHEETS — Chat + Support
// ══════════════════════════════════════════════════════════════
function ChatSheet({ name, onClose }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    if (!msg.trim()) return;
    setSent(true);
    setTimeout(onClose, 1800);
  };
  return (
    <Sheet onClose={onClose} zIndex={9750}>
      {sent ? (
        <div className="ppp-success" style={{ textAlign:"center",padding:"24px 0" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>✦</div>
          <div style={{ fontSize:17,fontWeight:700,color:T.teal,marginBottom:6 }}>Nachricht gesendet</div>
          <div style={{ fontSize:13,color:T.inkFaint }}>{name} wird deine Nachricht sehen</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:15,fontWeight:700,color:T.ink,marginBottom:14 }}>Nachricht an {name}</div>
          <textarea autoFocus value={msg} onChange={e=>setMsg(e.target.value)}
            placeholder={`Was möchtest du ${name} sagen?`}
            style={{
              width:"100%",minHeight:110,resize:"none",
              border:`1.5px solid ${msg?T.teal:T.border}`,
              borderRadius:T.r16,padding:"14px 16px",
              fontSize:14,color:T.ink,fontFamily:"inherit",outline:"none",background:T.bg,
              transition:"border-color .2s ease",boxSizing:"border-box",lineHeight:1.6,
            }}/>
          <div style={{ display:"flex",gap:10,marginTop:12 }}>
            <PillBtn label="Abbrechen" variant="ghost" sx={{flex:1}} onClick={onClose}/>
            <button className="ppp-press" onClick={handleSend} style={{
              flex:2,padding:"13px",borderRadius:T.r99,border:"none",
              background:msg.trim()?`linear-gradient(135deg,${T.teal},#0DBBAF)`:"rgba(15,17,23,0.06)",
              color:msg.trim()?"white":T.inkFaint,fontSize:14,fontWeight:700,
              cursor:msg.trim()?"pointer":"default",touchAction:"manipulation",fontFamily:"inherit",
              boxShadow:msg.trim()?T.glowTeal:"none",transition:"all .2s ease",
            }}>{msg.trim()?"Senden ✦":"Nachricht eingeben…"}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function SupportSheet({ name, onClose, engine, profileId }) {
  const [amount, setAmount] = useState(5);
  const [sent, setSent] = useState(false);
  const amounts = [2, 5, 10, 20, 50];
  const handleSupport = () => {
    setSent(true);
    engine?.updateAmbient?.(`🌱 Jemand unterstützt ${name}`);
    setTimeout(onClose, 2400);
  };
  return (
    <Sheet onClose={onClose} zIndex={9750}>
      {sent ? (
        <div className="ppp-success" style={{ textAlign:"center",padding:"24px 0" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🌱</div>
          <div style={{ fontSize:17,fontWeight:700,color:"#16A34A",marginBottom:6 }}>€{amount} Wirkung gesendet</div>
          <div style={{ fontSize:13,color:T.inkFaint }}>Danke — du hilfst {name} zu wirken</div>
          <div style={{ fontSize:11,color:T.inkFaint,marginTop:4 }}>15% fließen in HUI Impact Projekte</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:15,fontWeight:700,color:T.ink,marginBottom:4 }}>🌱 {name} unterstützen</div>
          <div style={{ fontSize:12,color:T.inkFaint,marginBottom:20 }}>15% fließen automatisch in HUI Impact Projekte</div>
          <div style={{ display:"flex",gap:8,marginBottom:20 }}>
            {amounts.map(a=>(
              <button key={a} onClick={()=>setAmount(a)} style={{
                flex:1,padding:"12px 0",borderRadius:T.r12,
                border:`1.5px solid ${amount===a?T.teal:T.border}`,
                background:amount===a?T.tealSoft:"transparent",
                color:amount===a?T.teal:T.inkSoft,
                fontSize:13,fontWeight:700,cursor:"pointer",
                touchAction:"manipulation",fontFamily:"inherit",
                transition:"all .18s ease",
              }}>€{a}</button>
            ))}
          </div>
          <button className="ppp-press" onClick={handleSupport} style={{
            width:"100%",padding:"15px",borderRadius:T.r99,border:"none",
            background:`linear-gradient(135deg,${T.coral},#FF8A70)`,
            color:"white",fontSize:15,fontWeight:700,
            cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
            boxShadow:T.glowCoral,
          }}>€{amount} senden 🌱</button>
        </>
      )}
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// FLOATING CONNECT CTA
// ══════════════════════════════════════════════════════════════
function FloatingConnect({ name, onConnect, connected }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),700); return()=>clearTimeout(t); },[]);
  return (
    <div style={{
      position:"fixed",
      bottom:"max(88px, calc(80px + env(safe-area-inset-bottom,0px)))",
      left:T.px,right:T.px,zIndex:9200,
      opacity:vis?1:0,transform:vis?"none":"translateY(14px)",
      transition:"opacity .5s ease .7s, transform .5s ease .7s",
      pointerEvents:vis?"auto":"none",
    }}>
      <button className="ppp-press" onClick={onConnect} style={{
        width:"100%",borderRadius:T.r99,
        padding:"15px 28px",border:"none",
        background:connected?"rgba(15,17,23,0.07)":`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:connected?"rgba(15,17,23,0.5)":"white",
        fontSize:15,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
        boxShadow:connected?"none":`${T.glowTeal}, 0 4px 24px rgba(0,0,0,0.14)`,
        transition:"all .28s cubic-bezier(.22,1,.36,1)",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        <span>{connected?"✓":"✦"}</span>
        {connected?"Verbindung gesendet":`Mit ${name||"diesem Menschen"} verbinden`}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function PublicProfilePage({ profileId, onClose }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const engine      = useConnectionEngine();
  const followed    = engine.isFollowed(profileId);
  const isConnected = engine.isConnected(profileId);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    loadPublicProfile(profileId).then(data=>{ setProfile(data); setLoading(false); });
  },[profileId]);

  const name = s(profile?.display_name||profile?.username, "Unbekannt");

  const handleClose   = useCallback(()=>{ if(typeof onClose==="function") onClose(); },[onClose]);

  const handleFollow  = useCallback(()=>{
    if(followed) engine.unfollow(profileId);
    else { engine.follow(profileId); engine.updateAmbient?.(`✦ Jemand folgt jetzt ${name}`); }
  },[followed,profileId,engine,name]);

  const handleConnect = useCallback(()=>{
    engine.connect(profileId, profile);
    engine.updateAmbient?.(`✦ ${name} und du verbinden euch`);
  },[profileId,profile,engine,name]);

  const handleOpenProfile = useCallback((hostId, hostName)=>{
    // Re-open same overlay with host profile — or close and let parent navigate
    // For now: close current profile and let parent open the host profile
    if(hostId) {
      handleClose();
      setTimeout(()=>{
        window.__HUI_OPEN_PROFILE__?.(hostId);
      }, 350);
    }
  },[handleClose]);

  return (
    <div className="ppp-root" style={{
      position:"fixed",inset:0,zIndex:9500,
      display:"flex",flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(20px)",
      transition:"opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1)",
      background:T.bg,
    }}>
      <style>{CSS}</style>

      {/* Scrollable content */}
      <div className="ppp-scroll" style={{ flex:1,overflowY:"auto",paddingBottom:170 }}>

        {/* 1. Hero */}
        <ProfileHero
          profile={profile} loading={loading}
          onClose={handleClose}
          onFollow={handleFollow} followed={followed}
          onChat={()=>setShowChat(true)}
          onSupport={()=>setShowSupport(true)}
        />

        <Gap h={12}/>

        {/* 2. Presence strip — no metrics, only character */}
        {!loading && <PresenceStrip profile={profile}/>}

        <Gap h={8}/>

        {/* 3. Quote */}
        {!loading && <HumanQuote profile={profile}/>}

        <Gap h={28}/>

        {/* 4. Moments */}
        <MomentsSection moments={profile?.moments} engine={engine}/>

        <Gap h={28}/>
        <Divider/>
        <Gap h={24}/>

        {/* 5. Encounters */}
        <EncountersSection
          encounters={profile?.encounters}
          engine={engine}
          onOpenProfile={handleOpenProfile}
        />

        <Gap h={28}/>
        <Divider/>
        <Gap h={24}/>

        {/* 7. Connection bridges */}
        <ConnectionBridges profileId={profileId} engine={engine}/>

        <Gap h={28}/>
        <Divider/>
        <Gap h={24}/>

        {/* 8. Values */}
        <ValuesSection interests={profile?.interests}/>

        <Gap h={48}/>
      </div>

      {/* Overlays */}
      {showChat    && <ChatSheet    name={name} onClose={()=>setShowChat(false)}    engine={engine}/>}
      {showSupport && <SupportSheet name={name} onClose={()=>setShowSupport(false)} engine={engine} profileId={profileId}/>}

      {/* Floating CTA — hidden when sheet open */}
      {!showChat && !showSupport && (
        <FloatingConnect name={name} onConnect={handleConnect} connected={isConnected}/>
      )}
    </div>
  );
}
