// src/pages/PublicProfilePage.jsx — HUI Living Portrait v4
// "I am entering someone's world."
// ════════════════════════════════════════════════════════════════
// ARCHITECTURE: Fully self-contained. No owner mode. No metrics.
// Emotional portrait of a real human inside the HUI ecosystem.
// USAGE: <PublicProfilePage profileId="uuid" onClose={() => {}} />
// ════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useConnectionEngine } from "../core/HuiConnectionEngine.jsx";
import { useAuth }   from "../lib/AuthContext.jsx";

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
  px:         16,
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
  .ppp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ppp-hscroll::-webkit-scrollbar { display:none; }

  @keyframes ppp-breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.010)} }
  @keyframes ppp-pulse-ring { 0%{transform:scale(1);opacity:.5} 70%{transform:scale(1.4);opacity:0} 100%{transform:scale(1.4);opacity:0} }
  @keyframes ppp-fade-up  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes ppp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes ppp-success-pop { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }

  .ppp-avatar-ring { animation:ppp-breathe 5s ease-in-out infinite; }
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
  .ppp-in { animation:ppp-fade-up .5s ease both; }
  .ppp-sheet { animation:ppp-slide-up .32s cubic-bezier(.22,1,.36,1) both; }
  .ppp-success { animation:ppp-success-pop .45s cubic-bezier(.22,1,.36,1) both; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const s  = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const n  = (v, fb=0)  => (typeof v==="number" && isFinite(v) ? v : fb);
const a  = (v)        => Array.isArray(v) ? v : [];
const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1).replace(".0","")}K` : String(n);

// ── Entry animation hook ─────────────────────────────────────────
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

// ── Supabase loader ──────────────────────────────────────────────
async function loadPublicProfile(profileId) {
  if (!profileId) return null;
  try {
    const fields = "id,username,display_name,bio,avatar_url,header_img,location,role,impact_eur,has_talent_profile,membership_type,skills,dna_tags";
    const { data, error } = await supabase.from("profiles").select(fields).eq("id", profileId).single();
    if (error) {
      const { data:d2 } = await supabase.from("profiles").select(fields).eq("username", profileId).single();
      return d2 || null;
    }
    return data;
  } catch { return null; }
}

// ── Fallbacks ────────────────────────────────────────────────────
const FB_IMG = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FB_AVT = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const SEED_WORKS = [
  { id:"w1", title:"Farben der Stille",   type:"Malerei",    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=75" },
  { id:"w2", title:"Horizonte",           type:"Fotografie", img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=75" },
  { id:"w3", title:"Klangraum",           type:"Musik",      img:"https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=75" },
  { id:"w4", title:"Gedankenfluss",       type:"Texte",      img:"https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=75" },
  { id:"w5", title:"Waldprojekt",         type:"Initiative", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
];

const SEED_EXPERIENCES = [
  { id:"x1", title:"See-Retreat",         tag:"Gemeinschaft", date:"Mai 2025", img:"https://images.unsplash.com/photo-1502003148287-a82ef80a6abc?w=400&q=75" },
  { id:"x2", title:"Lagerfeuer & Gitarren", tag:"Musikabend",  date:"Apr. 2025",img:"https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&q=75" },
  { id:"x3", title:"Bergtag mit Freunden", tag:"Ausflug",      date:"März 2025",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75" },
  { id:"x4", title:"Morgen im Wald",      tag:"Natur",        date:"Feb. 2025", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"x5", title:"Baumpflanzaktion",    tag:"Engagement",   date:"Jan. 2025", img:"https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=75" },
];

const SEED_ENCOUNTERS = [
  { id:"e1", emoji:"🌿", title:"Kreativer Waldrundgang", type:"Natur",     date:"Sa, 31. Mai", participants:12, img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"e2", emoji:"🧘", title:"Stille Meditation",      type:"Heilung",   date:"Mo, 2. Jun",  participants:8,  img:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=75" },
  { id:"e3", emoji:"🍽️", title:"Community Dinner",      type:"Verbindung",date:"Fr, 6. Jun",  participants:15, img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75" },
];

const DEFAULT_VALUES = [
  { icon:"🌿", label:"Natur",        bg:"rgba(34,197,94,0.10)"  },
  { icon:"✨", label:"Kreativität",  bg:"rgba(14,196,184,0.10)" },
  { icon:"👥", label:"Gemeinschaft", bg:"rgba(99,102,241,0.10)" },
  { icon:"🎵", label:"Musik",        bg:"rgba(139,92,246,0.10)" },
  { icon:"🧘", label:"Achtsamkeit",  bg:"rgba(245,158,11,0.08)" },
  { icon:"🐾", label:"Tiere",        bg:"rgba(245,158,11,0.10)" },
];

const TAGLINES = {
  "Natur":        "Findet Ruhe in Natur und Gemeinschaft.",
  "Tiere":        "Lebt mit offenem Herz für alle Lebewesen.",
  "Musik":        "Verbindet Menschen durch Klang und Rhythmus.",
  "Kreativität":  "Schafft kreative Begegnungen in echten Räumen.",
  "Achtsamkeit":  "Sucht Stille — und teilt sie mit anderen.",
  "Gemeinschaft": "Glaubt an die Kraft des gemeinsamen Augenblicks.",
  "Heilung":      "Hält Raum für das, was geheilt werden möchte.",
  "Kunst":        "Macht die Welt durch Schönheit ein wenig weicher.",
};

// ── Atoms ────────────────────────────────────────────────────────
function Sk({ w="100%", h=16, r=8, sx={} }) {
  return <div className="ppp-skeleton" style={{ width:w, height:h, borderRadius:r, ...sx }} />;
}
function Gap({ h=20 }) { return <div style={{height:h}}/>; }
function Divider() { return <div style={{height:1, margin:`0 ${T.px}px`, background:T.border}}/>; }

function SectionHead({ icon, emoji, title, sub, cta, onCta }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:`0 ${T.px}px 12px` }}>
      <div>
        <div style={{ fontSize:16, fontWeight:800, color:T.ink, letterSpacing:"-0.02em", display:"flex", gap:7, alignItems:"center" }}>
          {(icon||emoji) && <span style={{fontSize:17}}>{icon||emoji}</span>}
          {title}
        </div>
        {sub && <div style={{fontSize:11.5, color:T.inkFaint, marginTop:2, fontWeight:400}}>{sub}</div>}
      </div>
      {cta && (
        <button className="ppp-press-light" onClick={onCta} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          flexShrink:0, display:"flex", alignItems:"center", gap:3,
        }}>{cta} →</button>
      )}
    </div>
  );
}

function Sheet({ onClose, children, zIndex=9700 }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex, background:"rgba(15,17,23,0.44)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div className="ppp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px, calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheetShadow,
      }}>
        <div style={{width:36, height:4, borderRadius:99, background:T.borderMid, margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. HERO — Cinematic portrait header
// Layout matches reference: cover → avatar+name side by side → bio → capsules
// ══════════════════════════════════════════════════════════════

function AvatarModal({ src, name, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9900,
      background:"rgba(10,12,18,0.92)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{ position:"relative", maxWidth:300, width:"85vw" }}>
        <div style={{ width:"100%", aspectRatio:"1", borderRadius:"50%", overflow:"hidden",
          boxShadow:"0 24px 80px rgba(0,0,0,0.5), 0 0 0 3px rgba(14,196,184,0.35)" }}>
          <img src={src} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        </div>
        <div style={{ textAlign:"center", marginTop:18, fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.88)" }}>{name}</div>
        <button onClick={onClose} style={{
          position:"absolute", top:-10, right:-10,
          width:32, height:32, borderRadius:"50%",
          background:"rgba(255,255,255,0.14)", backdropFilter:"blur(8px)",
          border:"1px solid rgba(255,255,255,0.2)", color:"white",
          fontSize:16, cursor:"pointer", touchAction:"manipulation",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>×</button>
      </div>
    </div>
  );
}

function ValueCapsule({ icon, label, bg, onTap }) {
  const [tapped, setTapped] = useState(false);
  const handle = () => {
    setTapped(true);
    setTimeout(()=>setTapped(false), 700);
    onTap?.();
  };
  return (
    <button onClick={handle} style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"6px 12px", borderRadius:T.r99,
      background: tapped ? T.tealSoft : bg,
      border:`1px solid ${tapped ? T.tealMid : "rgba(15,17,23,0.08)"}`,
      fontSize:12.5, fontWeight:600, color: tapped ? T.teal : T.ink,
      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
      transition:"all .2s cubic-bezier(.22,1,.36,1)",
      flexShrink:0,
      boxShadow: tapped ? T.glowTeal : "none",
    }}>
      <span style={{fontSize:13}}>{icon}</span>{label}
    </button>
  );
}

function ProfileHero({ profile, loading, onClose, onFollow, followed, onChat, onSupport }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [avLoaded,  setAvLoaded]  = useState(false);
  const [avatarOpen,setAvatarOpen]= useState(false);
  const [shareOk,   setShareOk]   = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),60); return()=>clearTimeout(t); },[]);

  const heroImg  = s(profile?.header_img,   FB_IMG);
  const avatar   = s(profile?.avatar_url,   FB_AVT);
  const name     = s(profile?.display_name||profile?.username, "Unbekannt");
  const uname    = s(profile?.username, "");
  const bio      = s(profile?.bio, "");
  const loc      = s(profile?.location, "");
  const isTalent = !!(profile?.has_talent_profile||profile?.is_member||
                      profile?.role==="talent"||profile?.role==="wirker"||
                      profile?.membership_type==="talent");

  // Emotional tagline
  const tagline = useMemo(()=>{
    if (bio) return bio;
    const interests = a(profile?.interests);
    const key = typeof interests[0]==="string" ? interests[0] : (interests[0]?.name||"");
    return TAGLINES[key] || "Ein Mensch mit einer ruhigen, bedeutsamen Präsenz.";
  }, [bio, profile]);

  // Second line of tagline if bio is multi-sentence
  const taglineParts = useMemo(()=>{
    const parts = tagline.split(/\.\s+/);
    return parts.length > 1
      ? [parts[0]+".", parts.slice(1).join(". ")]
      : [tagline, null];
  }, [tagline]);

  // Values capsules
  const rawInterests = a(profile?.interests);
  const capsules = rawInterests.length
    ? rawInterests.slice(0,6).map((it,i)=>({
        icon: DEFAULT_VALUES[i % DEFAULT_VALUES.length].icon,
        label: typeof it==="string" ? it : s(it?.name,""),
        bg: DEFAULT_VALUES[i % DEFAULT_VALUES.length].bg,
      }))
    : DEFAULT_VALUES.slice(0,5);

  const handleShare = () => {
    const url = `${window.location.origin}/p/${s(profile?.username||profile?.id,"hui")}`;
    if (navigator.share) navigator.share({ title:`${name} auf HUI`, url }).catch(()=>{});
    else { try { navigator.clipboard.writeText(url); } catch(e){} }
    setShareOk(true); setTimeout(()=>setShareOk(false), 2000);
  };

  return (
    <>
      {/* ── CINEMATIC COVER ───────────────────────────────────── */}
      <div style={{ width:"100%", position:"relative" }}>
        <div style={{ width:"100%", height:190, position:"relative", overflow:"hidden",
          background:"linear-gradient(135deg,#0D1B2A,#1a2f45)" }}>
          <img src={heroImg} alt="" onLoad={()=>setImgLoaded(true)} onError={()=>setImgLoaded(true)}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
              opacity:imgLoaded?0.5:0, transition:"opacity 1.2s ease" }}/>
          {/* cream fade bottom */}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(180deg,rgba(247,246,243,0) 25%,rgba(247,246,243,0.88) 82%,rgba(247,246,243,1) 100%)" }}/>

          {/* ← back */}
          <button className="ppp-press" onClick={onClose} style={{
            position:"absolute", top:14, left:14, zIndex:10,
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.6)",
            boxShadow:"0 2px 10px rgba(0,0,0,0.10)",
            cursor:"pointer", touchAction:"manipulation",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.ink,
          }}>←</button>

          {/* Teilen + more */}
          <div style={{ position:"absolute", top:14, right:14, zIndex:10, display:"flex", gap:8 }}>
            <button className="ppp-press" onClick={handleShare} style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 13px", borderRadius:T.r99,
              background: shareOk?"rgba(14,196,184,0.9)":"rgba(255,255,255,0.85)",
              backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.6)",
              boxShadow:"0 2px 10px rgba(0,0,0,0.10)",
              cursor:"pointer", touchAction:"manipulation",
              fontSize:12, fontWeight:700,
              color: shareOk ? "white" : T.ink,
              fontFamily:"inherit", transition:"all .2s ease",
            }}>
              <span style={{fontSize:12}}>⬆</span> {shareOk?"Kopiert":"Teilen"}
            </button>
            <button className="ppp-press" style={{
              width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, color:T.inkSoft, cursor:"pointer", touchAction:"manipulation",
            }}>···</button>
          </div>
        </div>

        {/* ── IDENTITY AREA ─────────────────────────────────── */}
        <div style={{
          padding:`0 ${T.px}px 20px`,
          marginTop:-50,
          position:"relative", zIndex:2,
          opacity:mounted?1:0,
          transform:mounted?"none":"translateY(8px)",
          transition:"opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)",
        }}>

          {/* Row: Avatar | Name+meta | Follow */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:14 }}>

            {/* Avatar */}
            <div className="ppp-avatar-ring" style={{ position:"relative", flexShrink:0 }}>
              {isTalent && (
                <div style={{ position:"absolute", inset:-7, borderRadius:"50%",
                  border:"2px solid rgba(14,196,184,0.22)",
                  animation:"ppp-pulse-ring 3.2s ease-out infinite" }}/>
              )}
              <div style={{
                position:"absolute", inset:-3, borderRadius:"50%",
                background: isTalent
                  ? `conic-gradient(from 0deg,${T.teal},${T.coral},${T.teal})`
                  : `conic-gradient(from 0deg,rgba(14,196,184,0.6),rgba(14,196,184,0.18),rgba(14,196,184,0.6))`,
                opacity:0.9,
              }}/>
              <div className="ppp-press" onClick={()=>setAvatarOpen(true)} style={{
                position:"relative", width:84, height:84, borderRadius:"50%",
                border:"3px solid white",
                boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
                overflow:"hidden", background:T.bg,
                cursor:"pointer", touchAction:"manipulation",
              }}>
                {!avLoaded && <div className="ppp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                <img src={avatar} alt={name} onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)}
                  style={{ width:"100%", height:"100%", objectFit:"cover", opacity:avLoaded?1:0, transition:"opacity .5s ease" }}/>
              </div>
              {profile?.verified && (
                <div style={{ position:"absolute", bottom:2, right:2, width:20, height:20, borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
                  border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, color:"white", fontWeight:900, boxShadow:T.glowTeal }}>✓</div>
              )}
            </div>

            {/* Name + meta */}
            <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
              {loading ? (
                <>
                  <Sk w="60%" h={26} sx={{marginBottom:7}}/>
                  <Sk w="40%" h={12} r={6}/>
                </>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                    <h1 style={{ fontSize:"clamp(20px,5.5vw,27px)", fontWeight:800, color:T.ink,
                      letterSpacing:"-0.03em", lineHeight:1.1, margin:0 }}>{name}</h1>
                    {isTalent && profile?.verified && (
                      <span style={{ fontSize:16, lineHeight:1 }}>✔️</span>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4,
                    fontSize:12, color:T.inkFaint, fontWeight:400, flexWrap:"wrap" }}>
                    {uname && <span>@{uname}</span>}
                    {uname && loc && <span>·</span>}
                    {loc && <span>📍 {loc}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Follow */}
            {!loading && (
              <button className="ppp-press" onClick={onFollow} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"9px 18px", borderRadius:T.r99,
                fontSize:13, fontWeight:700,
                border:"none", flexShrink:0, alignSelf:"flex-end", marginBottom:4,
                background: followed
                  ? "rgba(15,17,23,0.07)"
                  : `linear-gradient(135deg,${T.teal},#0DBBAF)`,
                color: followed ? T.inkSoft : "white",
                boxShadow: followed ? "none" : `${T.glowTeal}, 0 2px 12px rgba(14,196,184,0.2)`,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                transition:"all .25s cubic-bezier(.22,1,.36,1)",
              }}>
                {followed ? "✓ Gefolgt" : "+ Folgen"}
              </button>
            )}
          </div>

          {/* Emotional tagline */}
          {!loading && (
            <div style={{ marginBottom:14, paddingLeft:2 }}>
              <p style={{ fontSize:14.5, lineHeight:1.68, color:T.inkSoft, margin:0,
                fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic",
                letterSpacing:"0.004em" }}>
                {taglineParts[0]}
                {taglineParts[1] && <><br/>{taglineParts[1]}</>}
              </p>
            </div>
          )}
          {loading && <Sk w="82%" h={13} sx={{marginBottom:8}}/>}
          {loading && <Sk w="64%" h={13} sx={{marginBottom:16}}/>}

          {/* Presence pill */}
          {!loading && (
            <div style={{ marginBottom:12 }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 12px", borderRadius:T.r99,
                background:"rgba(255,255,255,0.8)",
                border:`1px solid ${T.border}`,
                fontSize:12, color:T.inkSoft, fontWeight:500,
              }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
                  boxShadow:`0 0 0 2px ${T.tealSoft}`, display:"inline-block" }}/>
                offen für Begegnungen
              </span>
            </div>
          )}

          {/* Values capsules row */}
          {!loading && (
            <div className="ppp-hscroll" style={{ display:"flex", gap:7, paddingBottom:2, marginLeft:-2 }}>
              {capsules.map((c,i)=>c.label && (
                <ValueCapsule key={i} icon={c.icon} label={c.label} bg={c.bg}/>
              ))}
            </div>
          )}
        </div>

        {/* ── ACTION ROW — Chat + Schenken + Teilen ──────────── */}
        {!loading && (
          <div style={{ display:"flex", gap:8, padding:`0 ${T.px}px 20px` }}>
            <button className="ppp-press" onClick={onChat} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"11px 8px", borderRadius:T.r16,
              background:T.tealSoft, border:`1px solid ${T.tealMid}`,
              fontSize:11, fontWeight:700, color:T.teal,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }}>
              <span style={{fontSize:18}}>💬</span>Nachricht
            </button>
            <button className="ppp-press" onClick={onSupport} style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"11px 8px", borderRadius:T.r16,
              background:T.coralSoft, border:`1px solid ${T.coralMid}`,
              fontSize:11, fontWeight:700, color:T.coral,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }}>
              <span style={{fontSize:18}}>🌱</span>Schenken
            </button>
          </div>
        )}
      </div>

      {avatarOpen && <AvatarModal src={avatar} name={name} onClose={()=>setAvatarOpen(false)}/>}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. WERKE — Cinematic horizontal cards
// ══════════════════════════════════════════════════════════════
function WorkCard({ w, onClick }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-press-light ppp-in" onClick={()=>onClick?.(w)} style={{
      flexShrink:0, width:140, height:175, borderRadius:T.r16,
      overflow:"hidden", position:"relative",
      cursor:"pointer", touchAction:"manipulation",
      boxShadow:"0 2px 14px rgba(15,17,23,0.09), 0 1px 4px rgba(15,17,23,0.05)",
      background:"rgba(15,17,23,0.07)",
    }}>
      {!loaded && <div className="ppp-skeleton" style={{position:"absolute",inset:0}}/>}
      <img src={w.img} alt={w.title} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", opacity:loaded?1:0, transition:"opacity .6s ease" }}/>
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to top,rgba(10,14,20,0.72) 0%,rgba(10,14,20,0.04) 55%,transparent 100%)" }}/>
      <div style={{ position:"absolute", bottom:12, left:11, right:11 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.95)",
          lineHeight:1.35, marginBottom:2, letterSpacing:"-0.01em" }}>{w.title}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.46)", fontWeight:400 }}>{w.type}</div>
      </div>
    </div>
  );
}

function WorkeSection({ works }) {
  const { ref, style } = useEntry(0);
  const items = a(works).length ? a(works) : SEED_WORKS;
  return (
    <div ref={ref} style={{ ...style, width:"100%" }}>
      <SectionHead emoji="✨" title="Werke" sub="Kreativer Ausdruck" cta="Alle Werke ansehen"/>
      <div className="ppp-hscroll" style={{ display:"flex", gap:8, padding:`0 ${T.px}px 4px` }}>
        {items.map((w,i)=> <WorkCard key={w.id||i} w={w}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. ERLEBNISSE — Lived human moments
// ══════════════════════════════════════════════════════════════
function ExperienceCard({ x }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-press-light ppp-in" style={{
      flexShrink:0, width:148, height:168, borderRadius:T.r16,
      overflow:"hidden", position:"relative",
      boxShadow:"0 2px 12px rgba(15,17,23,0.08), 0 1px 4px rgba(15,17,23,0.04)",
      background:"rgba(15,17,23,0.06)", cursor:"default",
    }}>
      {!loaded && <div className="ppp-skeleton" style={{position:"absolute",inset:0}}/>}
      <img src={x.img} alt={x.title} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", opacity:loaded?1:0, transition:"opacity .6s ease" }}/>
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to top,rgba(10,14,20,0.65) 0%,rgba(10,14,20,0.06) 50%,transparent 100%)" }}/>
      {/* Tag badge */}
      <div style={{
        position:"absolute", top:10, left:10,
        padding:"3px 9px", borderRadius:T.r99,
        background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)",
        fontSize:9.5, fontWeight:700, color:T.ink, letterSpacing:"0.015em",
      }}>{x.tag}</div>
      <div style={{ position:"absolute", bottom:11, left:11, right:11 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:"rgba(255,255,255,0.95)",
          lineHeight:1.35, marginBottom:2 }}>{x.title}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{x.date}</div>
      </div>
    </div>
  );
}

function ErlebnisseSection({ moments }) {
  const { ref, style } = useEntry(0);
  const items = a(moments).length ? a(moments).map((m,i)=>({
    id:m.id||i, title:m.caption||m.title||"Moment",
    tag:m.tag||"Erlebnis", date:m.time||m.date||"",
    img:m.img||FB_IMG,
  })) : SEED_EXPERIENCES;
  return (
    <div ref={ref} style={{ ...style, width:"100%" }}>
      <SectionHead emoji="🤍" title="Erlebnisse" sub="Momente, die verbinden" cta="Alle Erlebnisse ansehen"/>
      <div className="ppp-hscroll" style={{ display:"flex", gap:8, padding:`0 ${T.px}px 4px` }}>
        {items.map((x,i)=><ExperienceCard key={x.id||i} x={x}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. BEGEGNUNGEN — Real connection spaces
// ══════════════════════════════════════════════════════════════
function EncounterDetailSheet({ e, onClose }) {
  return (
    <Sheet onClose={onClose} zIndex={9750}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:36, marginBottom:8 }}>{e.emoji}</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.ink, marginBottom:4 }}>{e.title}</div>
        <div style={{ fontSize:13, color:T.inkFaint }}>{e.date} · {e.participants} nehmen teil</div>
      </div>
      <button className="ppp-press" onClick={onClose} style={{
        width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
        background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:"white", fontSize:15, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        boxShadow:T.glowTeal,
      }}>Dabei sein</button>
    </Sheet>
  );
}

function EncounterCard({ e, onPress }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ppp-press-light ppp-in" onClick={()=>onPress(e)} style={{
      flexShrink:0, width:190, borderRadius:T.r20, overflow:"hidden",
      background:"rgba(255,255,255,0.80)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      boxShadow:"0 2px 18px rgba(15,17,23,0.08), 0 1px 4px rgba(15,17,23,0.04)",
      border:"1px solid rgba(255,255,255,0.92)",
      cursor:"pointer", touchAction:"manipulation",
    }}>
      <div style={{ height:118, position:"relative", background:"rgba(15,17,23,0.05)" }}>
        {!loaded && <div className="ppp-skeleton" style={{position:"absolute",inset:0}}/>}
        <img src={e.img} alt={e.title} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", opacity:loaded?1:0, transition:"opacity .6s ease" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top,rgba(10,14,20,0.32),transparent 55%)" }}/>
        <div style={{ position:"absolute", top:9, left:9,
          background:"rgba(255,255,255,0.86)", backdropFilter:"blur(10px)",
          padding:"3px 8px", borderRadius:T.r99, fontSize:9.5, fontWeight:700, color:T.ink }}>{e.type}</div>
      </div>
      <div style={{ padding:"12px 13px 13px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:6,
          letterSpacing:"-0.015em", lineHeight:1.35 }}>{e.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:T.inkFaint }}>
          <span>📅 {e.date}</span>
          <span>👥 {e.participants} nehmen teil</span>
        </div>
      </div>
    </div>
  );
}

function BegegnungenSection({ encounters, onOpenProfile }) {
  const { ref, style } = useEntry(0);
  const [selected, setSelected] = useState(null);
  const items = a(encounters).length ? a(encounters) : SEED_ENCOUNTERS;
  return (
    <div ref={ref} style={{ ...style, width:"100%" }}>
      <SectionHead emoji="🌿" title="Begegnungen" sub="Echte menschliche Verbindung" cta="Alle Begegnungen ansehen"/>
      <div className="ppp-hscroll" style={{ display:"flex", gap:8, padding:`0 ${T.px}px 4px` }}>
        {items.map((e,i)=><EncounterCard key={e.id||i} e={e} onPress={setSelected}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
      {selected && <EncounterDetailSheet e={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. VERBINDUNGEN — Social depth without metrics
// ══════════════════════════════════════════════════════════════
function VerbindungenSection({ profileId, engine }) {
  const { ref, style } = useEntry(0);
  const bridges = [
    { icon:"👥", title:"3 gemeinsame Verbindungen", sub:"Lena, Jonas und 1 weiterer kennen diese Person", iconBg:"rgba(14,196,184,0.10)" },
    { icon:"🌿", title:"Ähnliche Begegnungen",        sub:"Ihr habt beide Natur-Erlebnisse besucht",      iconBg:"rgba(34,197,94,0.10)"  },
    { icon:"💛", title:"Gemeinsame Werte",             sub:"Natur · Achtsamkeit · Gemeinschaft",            iconBg:"rgba(245,158,11,0.10)" },
  ];
  return (
    <div ref={ref} style={{ ...style, padding:`0 ${T.px}px` }}>
      <SectionHead title="+ Verbindungen" sub="Was euch verbindet"/>
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {bridges.map((b,i)=>(
          <div key={i} className="ppp-press-light" style={{
            display:"flex", alignItems:"center", gap:14, padding:"14px 0",
            borderBottom: i < bridges.length-1 ? `1px solid ${T.border}` : "none",
            cursor:"pointer", touchAction:"manipulation",
          }}>
            <div style={{ width:38, height:38, borderRadius:T.r12, background:b.iconBg,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600, color:T.ink, marginBottom:2, letterSpacing:"-0.01em" }}>{b.title}</div>
              <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.45, fontWeight:400 }}>{b.sub}</div>
            </div>
            <div style={{ fontSize:13, color:T.inkFaint, opacity:0.7 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. WERTE & INTERESSEN — Emotional discovery
// ══════════════════════════════════════════════════════════════
function ValueDiscoverySheet({ value, onClose }) {
  return (
    <Sheet onClose={onClose} zIndex={9750}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:10 }}>{value.icon}</div>
        <div style={{ fontSize:18, fontWeight:800, color:T.ink, marginBottom:6 }}>{value.label}</div>
        <div style={{ fontSize:13.5, color:T.inkFaint, lineHeight:1.6 }}>
          Entdecke Menschen, Begegnungen und Werke rund um {value.label}.
        </div>
      </div>
      <button className="ppp-press" onClick={onClose} style={{
        width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
        background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:"white", fontSize:15, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        boxShadow:T.glowTeal,
      }}>Entdecken</button>
    </Sheet>
  );
}

function WerteSection({ interests }) {
  const { ref, style } = useEntry(0);
  const [selected, setSelected] = useState(null);
  const rawInterests = a(interests);
  const tags = rawInterests.length
    ? rawInterests.map((it,i)=>({
        icon: DEFAULT_VALUES[i % DEFAULT_VALUES.length].icon,
        label: typeof it==="string" ? it : s(it?.name,""),
        bg: DEFAULT_VALUES[i % DEFAULT_VALUES.length].bg,
      }))
    : DEFAULT_VALUES;
  return (
    <div ref={ref} style={{ ...style, padding:`0 ${T.px}px` }}>
      <SectionHead title="+ Werte & Interessen" sub="Tap zum Entdecken"/>
      <div className="ppp-hscroll" style={{ display:"flex", gap:7, paddingBottom:4 }}>
        {tags.map((t,i)=>t.label && (
          <ValueCapsule key={i} icon={t.icon} label={t.label} bg={t.bg} onTap={()=>setSelected(t)}/>
        ))}
        <div style={{flexShrink:0,width:4}}/>
      </div>
      {selected && <ValueDiscoverySheet value={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FLOATING CONNECT — Soft bottom-right pill
// ══════════════════════════════════════════════════════════════
function FloatingConnect({ onConnect, connected }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),1000); return()=>clearTimeout(t); },[]);

  if (connected) return (
    <div style={{
      position:"fixed",
      bottom:"max(94px, calc(86px + env(safe-area-inset-bottom,0px)))",
      right:T.px, zIndex:9200,
      opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(8px)",
      transition:"opacity .4s ease 1s, transform .4s ease 1s",
      pointerEvents:"none",
    }}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"8px 14px", borderRadius:T.r99,
        background:"rgba(255,255,255,0.84)", backdropFilter:"blur(16px)",
        border:`1px solid ${T.tealMid}`,
        boxShadow:"0 2px 12px rgba(14,196,184,0.14)",
        fontSize:12, fontWeight:600, color:T.teal,
      }}>✓ Verbunden</div>
    </div>
  );

  return (
    <div style={{
      position:"fixed",
      bottom:"max(94px, calc(86px + env(safe-area-inset-bottom,0px)))",
      right:T.px, zIndex:9200,
      opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(14px)",
      transition:"opacity .5s ease 1s, transform .5s cubic-bezier(.22,1,.36,1) 1s",
      pointerEvents:vis?"auto":"none",
    }}>
      <button className="ppp-press" onClick={onConnect} style={{
        display:"inline-flex", alignItems:"center", gap:7,
        padding:"11px 20px", borderRadius:T.r99, border:"none",
        background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:"white", fontSize:13.5, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        boxShadow:`${T.glowTeal}, 0 6px 24px rgba(14,196,184,0.22), 0 2px 8px rgba(0,0,0,0.07)`,
        letterSpacing:"-0.01em",
      }}>
        <span style={{fontSize:14}}>✦</span>Verbinden
      </button>
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
        <div className="ppp-success" style={{ textAlign:"center", padding:"24px 0" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
          <div style={{ fontSize:17, fontWeight:700, color:T.teal, marginBottom:6 }}>Nachricht gesendet</div>
          <div style={{ fontSize:13, color:T.inkFaint }}>{name} wird deine Nachricht sehen</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:16 }}>✉️ Nachricht an {name}</div>
          <textarea
            value={msg} onChange={e=>setMsg(e.target.value)}
            placeholder="Was möchtest du mitteilen?"
            style={{
              width:"100%", minHeight:110, padding:"13px 14px",
              borderRadius:T.r16, border:`1.5px solid ${T.border}`,
              background:T.bg, fontSize:14, color:T.ink, resize:"none",
              fontFamily:"inherit", lineHeight:1.6, outline:"none",
              boxSizing:"border-box",
            }}
          />
          <div style={{ height:14 }}/>
          <button className="ppp-press" onClick={handleSend} disabled={!msg.trim()} style={{
            width:"100%", padding:"15px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal, opacity:msg.trim()?1:0.45,
          }}>Senden</button>
        </>
      )}
    </Sheet>
  );
}

function SupportSheet({ name, onClose, profileId }) {
  const [amount, setAmount] = useState(5);
  const [sent, setSent] = useState(false);
  const amounts = [3, 5, 10, 20];
  const handleSupport = () => { setSent(true); setTimeout(onClose, 2000); };
  return (
    <Sheet onClose={onClose} zIndex={9750}>
      {sent ? (
        <div className="ppp-success" style={{ textAlign:"center", padding:"24px 0" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
          <div style={{ fontSize:17, fontWeight:700, color:T.coral, marginBottom:6 }}>€{amount} gesendet</div>
          <div style={{ fontSize:13, color:T.inkFaint }}>Danke für deine Unterstützung</div>
          <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>15% fließen in HUI Impact Projekte</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:4 }}>🌱 {name} unterstützen</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:20 }}>15% fließen automatisch in HUI Impact Projekte</div>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {amounts.map(a=>(
              <button key={a} onClick={()=>setAmount(a)} style={{
                flex:1, padding:"12px 0", borderRadius:T.r12,
                border:`1.5px solid ${amount===a?T.coral:T.border}`,
                background:amount===a?T.coralSoft:"transparent",
                color:amount===a?T.coral:T.inkSoft,
                fontSize:13, fontWeight:700, cursor:"pointer",
                touchAction:"manipulation", fontFamily:"inherit",
                transition:"all .18s ease",
              }}>€{a}</button>
            ))}
          </div>
          <button className="ppp-press" onClick={handleSupport} style={{
            width:"100%", padding:"15px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.coral},#FF8A70)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowCoral,
          }}>€{amount} senden 🌱</button>
        </>
      )}
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function PublicProfilePage({ profileId, onClose }) {
  const { user, authProfile } = useAuth();

  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [mounted,     setMounted]     = useState(false);
  const [showChat,    setShowChat]    = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const engine      = useConnectionEngine();
  const followed    = engine.isFollowed(profileId);
  const isConnected = engine.isConnected(profileId);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);
  useEffect(()=>{
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    loadPublicProfile(profileId).then(data => {
      if (data) {
        // Wenn es das eigene Profil ist: AuthContext-Änderungen bevorzugen
        const isOwnProfile = user?.id && data.id === user.id;
        if (isOwnProfile && authProfile) {
          setProfile({
            ...data,
            avatar_url: authProfile.avatar_url ?? data.avatar_url,
            header_img: authProfile.header_img  ?? data.header_img,
            bio:        authProfile.bio          ?? data.bio,
          });
        } else {
          setProfile(data);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  },[profileId]);

  const name = s(profile?.display_name||profile?.username, "Unbekannt");

  const handleClose   = useCallback(()=>{ if(typeof onClose==="function") onClose(); },[onClose]);
  const handleFollow  = useCallback(()=>{
    if(followed) engine.unfollow(profileId);
    else { engine.follow(profileId); engine.updateAmbient?.(`✦ Neue Verbindung`); }
  },[followed,profileId,engine]);
  const handleConnect = useCallback(()=>{
    engine.connect(profileId, profile);
    engine.updateAmbient?.(`✦ ${name} und du verbinden euch`);
  },[profileId,profile,engine,name]);

  return (
    <div className="ppp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(18px)",
      transition:"opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1)",
      background:T.bg,
    }}>
      <style>{CSS}</style>

      {/* Scrollable content */}
      <div className="ppp-scroll" style={{ flex:1, overflowY:"auto", paddingBottom:160 }}>

        {/* 1. Cinematic hero */}
        <ProfileHero
          profile={profile} loading={loading}
          onClose={handleClose}
          onFollow={handleFollow} followed={followed}
          onChat={()=>setShowChat(true)}
          onSupport={()=>setShowSupport(true)}
        />

        <Gap h={20}/>

        {/* 2. Werke */}
        <WorkeSection works={profile?.works}/>

        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* 3. Erlebnisse */}
        <ErlebnisseSection moments={profile?.moments}/>

        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* 4. Begegnungen */}
        <BegegnungenSection encounters={profile?.encounters}/>

        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* 5. Verbindungen */}
        <VerbindungenSection profileId={profileId} engine={engine}/>

        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* 6. Werte & Interessen */}
        <WerteSection interests={profile?.skills}/>

        <Gap h={52}/>
      </div>

      {/* Overlays */}
      {showChat    && <ChatSheet    name={name} onClose={()=>setShowChat(false)}/>}
      {showSupport && <SupportSheet name={name} onClose={()=>setShowSupport(false)} profileId={profileId}/>}

      {/* Floating CTA */}
      {!showChat && !showSupport && (
        <FloatingConnect onConnect={handleConnect} connected={isConnected}/>
      )}
    </div>
  );
}
