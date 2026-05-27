// src/pages/BasisProfilePage.jsx — HUI BasisUser Portrait v1
// "Meeting a real human being."
// ════════════════════════════════════════════════════════════════
// Für normale HUI-Nutzer (keine Talent/Creator-Rolle).
// Kein Creator-Dashboard. Kein Feed. Keine Metriken.
// Menschliche Präsenz — ruhig, emotional, editorial.
// USAGE: <BasisProfilePage profileId="uuid" onClose={() => {}} />
// ════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useConnectionEngine } from "../core/HuiConnectionEngine.jsx";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  bgSheet:   "rgba(252,251,248,0.98)",
  teal:      "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B52",
  coralSoft: "rgba(255,107,82,0.10)",
  coralMid:  "rgba(255,107,82,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.28)",
  border:    "rgba(26,26,24,0.07)",
  borderMid: "rgba(26,26,24,0.12)",
  px:        16,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  cardShadow:"0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  glowTeal:  "0 4px 18px rgba(14,196,184,0.26)",
  sheetShadow:"0 -12px 48px rgba(26,26,24,0.12)",
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
  .bp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif; }
  .bp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .bp-scroll::-webkit-scrollbar { display:none; }
  .bp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .bp-hscroll::-webkit-scrollbar { display:none; }

  @keyframes bp-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes bp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes bp-pulse    { 0%,100%{transform:scale(1);opacity:.5} 60%{transform:scale(1.35);opacity:0} }
  @keyframes bp-breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.008)} }

  .bp-skeleton {
    background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);
    background-size:200% 100%;
    animation:bp-shimmer 1.5s ease-in-out infinite;
    border-radius:8px;
  }
  .bp-press  { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease; }
  .bp-press:active { transform:scale(0.93); opacity:0.74; }
  .bp-press-light  { transition:transform .14s ease,opacity .14s ease; }
  .bp-press-light:active { transform:scale(0.96); opacity:0.82; }
  .bp-in { animation:bp-fade-up .5s ease both; }
  .bp-sheet { animation:bp-slide-up .3s cubic-bezier(.22,1,.36,1) both; }
  .bp-avatar-ring { animation:bp-breathe 5.5s ease-in-out infinite; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const s = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const a = (v) => Array.isArray(v) ? v : [];

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
  return {
    ref,
    style: {
      opacity: vis?1:0,
      transform: vis?"none":"translateY(12px)",
      transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`,
    }
  };
}

async function loadProfile(profileId) {
  if (!profileId) return null;
  try {
    const fields = "id,username,display_name,bio,avatar_url,header_img,location,verified,role,interests,has_talent_profile,membership_type";
    const { data, error } = await supabase.from("profiles").select(fields).eq("id", profileId).single();
    if (error) {
      const { data:d2 } = await supabase.from("profiles").select(fields).eq("username", profileId).single();
      return d2 || null;
    }
    return data;
  } catch { return null; }
}

// ── Fallback data ─────────────────────────────────────────────────
const FB_IMG = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FB_AVT = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

const SEED_MOMENTS = [
  { id:"m1", caption:"Ein Morgen im Wald.", date:"Heute",       img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"m2", caption:"Café mit Freunden.",  date:"Gestern",     img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75" },
  { id:"m3", caption:"Einfach nur dankbar.",date:"2 Tage zuvor",img:"https://images.unsplash.com/photo-1490750967868-88df5691cc38?w=400&q=75" },
  { id:"m4", caption:"Neuer Song in Arbeit.",date:"4 Tage zuvor",img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=75" },
  { id:"m5", caption:"Spaziergang mit Luna.",date:"5 Tage zuvor",img:"https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=75" },
];

const DEFAULT_INTERESTS = [
  { icon:"🌿", label:"Natur",       text:"Verbindet mich mit mir selbst.",  bg:"rgba(34,197,94,0.08)"   },
  { icon:"🎵", label:"Musik",       text:"Begleitet mich jeden Tag.",       bg:"rgba(139,92,246,0.08)"  },
  { icon:"🧘", label:"Ruhe",        text:"Gibt mir Klarheit und Kraft.",    bg:"rgba(14,196,184,0.08)"  },
  { icon:"☕", label:"Begegnungen", text:"Echte Gespräche berühren mich.",  bg:"rgba(245,158,11,0.08)"  },
  { icon:"🐾", label:"Tiere",       text:"Sie lehren mich Liebe.",          bg:"rgba(239,68,68,0.08)"   },
  { icon:"✨", label:"Kreativität", text:"Mein Ausdruck und Ausgleich.",    bg:"rgba(99,102,241,0.08)"  },
];

const TAGLINES = {
  "Natur":        "Liebe die Natur, Musik und gute Gespräche.\nSuche echte Begegnungen und Orte,\nan denen man gemeinsam wachsen kann.",
  "Musik":        "Musik ist meine Sprache.\nIch lebe für Klang, Stille und echte Verbindungen.",
  "Achtsamkeit":  "Lebe bewusst. Atme tief.\nSuche Menschen, die im Jetzt ankommen können.",
  "Gemeinschaft": "Glaube an die Kraft echten Zusammenseins.\nJeder Mensch hat eine Geschichte, die es wert ist, gehört zu werden.",
  "Heilung":      "Auf der Suche nach Heilung und Tiefe.\nLiebe Natur, Ruhe und menschliche Wärme.",
  "Tiere":        "Tiere erden mich.\nSuche Menschen, die genauso lieben wie ich.",
};

const OPEN_FOR = [
  { icon:"🌲", label:"Naturgruppen",   sub:"Gemeinsam draußen unterwegs sein"  },
  { icon:"🎵", label:"Musikabende",    sub:"Musik hören, teilen und genießen"  },
  { icon:"☕", label:"Café & Gespräche",sub:"Gute Gespräche in entspannter Runde" },
  { icon:"🧘", label:"Achtsamkeit",    sub:"Meditation, Yoga und innere Ruhe"  },
];

// ── Atoms ────────────────────────────────────────────────────────
function Sk({ w="100%", h=16, r=8, sx={} }) {
  return <div className="bp-skeleton" style={{ width:w, height:h, borderRadius:r, ...sx }}/>;
}
function Gap({ h=16 }) { return <div style={{height:h}}/>; }
function Divider() {
  return <div style={{ height:1, margin:`0 ${T.px}px`, background:T.border }}/>;
}
function SectionHead({ icon, title, sub, cta, onCta }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:`0 ${T.px}px 12px` }}>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, display:"flex", gap:7, alignItems:"center", letterSpacing:"-0.02em" }}>
          {icon && <span style={{fontSize:16}}>{icon}</span>}{title}
        </div>
        {sub && <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>{sub}</div>}
      </div>
      {cta && (
        <button className="bp-press-light" onClick={onCta} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>{cta} →</button>
      )}
    </div>
  );
}
function Sheet({ onClose, children, zIndex=9700 }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex, background:"rgba(26,26,24,0.42)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div className="bp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px, calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheetShadow,
      }}>
        <div style={{ width:36, height:4, borderRadius:99, background:T.borderMid, margin:"0 auto 20px" }}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HERO — Cinematic portrait, matches screenshot 1:1
// ══════════════════════════════════════════════════════════════
function InterestCapsule({ icon, label, bg, active, onTap }) {
  return (
    <button onClick={onTap} style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"7px 13px", borderRadius:T.r99,
      background: active ? T.tealSoft : bg || "rgba(26,26,24,0.06)",
      border:`1px solid ${active ? T.tealMid : "rgba(26,26,24,0.09)"}`,
      fontSize:13, fontWeight:600, color: active ? T.teal : T.ink,
      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
      transition:"all .2s cubic-bezier(.22,1,.36,1)", flexShrink:0,
    }}>
      <span style={{fontSize:14}}>{icon}</span>{label}
    </button>
  );
}

function ProfileHero({ profile, loading, onClose, onFollow, followed }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [avLoaded,  setAvLoaded]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [shareOk,   setShareOk]   = useState(false);
  const [avOpen,    setAvOpen]    = useState(false);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),60); return()=>clearTimeout(t); },[]);

  const heroImg = s(profile?.header_img,  FB_IMG);
  const avatar  = s(profile?.avatar_url,  FB_AVT);
  const name    = s(profile?.display_name||profile?.username, "Unbekannt");
  const uname   = s(profile?.username, "");
  const loc     = s(profile?.location, "");
  const bio     = s(profile?.bio, "");

  const tagline = useMemo(()=>{
    if (bio) return bio;
    const ints = a(profile?.interests);
    const key = typeof ints[0]==="string" ? ints[0] : (ints[0]?.name||"");
    return TAGLINES[key] || "Liebe die Natur, Musik und gute Gespräche.\nSuche echte Begegnungen und Orte,\nan denen man gemeinsam wachsen kann.";
  }, [bio, profile]);

  const rawInterests = a(profile?.interests);
  const capsules = rawInterests.length
    ? rawInterests.slice(0,6).map((it,i)=>({
        icon:  DEFAULT_INTERESTS[i % DEFAULT_INTERESTS.length].icon,
        label: typeof it==="string" ? it : s(it?.name,""),
        bg:    DEFAULT_INTERESTS[i % DEFAULT_INTERESTS.length].bg,
      }))
    : DEFAULT_INTERESTS.slice(0,5);

  const handleShare = () => {
    const url = `${window.location.origin}/p/${s(profile?.username||profile?.id,"hui")}`;
    if (navigator.share) navigator.share({ title:`${name} auf HUI`, url }).catch(()=>{});
    else { try { navigator.clipboard.writeText(url); } catch(e){} }
    setShareOk(true); setTimeout(()=>setShareOk(false),2000);
  };

  return (
    <>
      {/* COVER */}
      <div style={{ width:"100%", position:"relative" }}>
        <div style={{ width:"100%", height:180, position:"relative", overflow:"hidden",
          background:"linear-gradient(160deg,#2C3E2D 0%,#4A5E3A 50%,#8B7355 100%)" }}>
          <img src={heroImg} alt="" onLoad={()=>setImgLoaded(true)} onError={()=>setImgLoaded(true)}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
              opacity:imgLoaded?0.55:0, transition:"opacity 1.2s ease" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(180deg,rgba(247,245,240,0) 20%,rgba(247,245,240,0.85) 78%,rgba(247,245,240,1) 100%)" }}/>
          {/* ← back */}
          <button className="bp-press" onClick={onClose} style={{
            position:"absolute", top:14, left:14, zIndex:10,
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.82)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.55)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.ink, cursor:"pointer", touchAction:"manipulation",
          }}>←</button>
          {/* ··· */}
          <button className="bp-press" style={{
            position:"absolute", top:14, right:14, zIndex:10,
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.82)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.55)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, color:T.inkSoft, cursor:"pointer", touchAction:"manipulation",
          }}>···</button>
        </div>

        {/* IDENTITY — avatar left + name/bio right (matches screenshot) */}
        <div style={{
          padding:`0 ${T.px}px`,
          marginTop:-48,
          position:"relative", zIndex:2,
          opacity:mounted?1:0,
          transform:mounted?"none":"translateY(8px)",
          transition:"opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)",
        }}>

          {/* Row: Avatar | Name block | Presence pill top-right */}
          <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

            {/* Avatar */}
            <div className="bp-avatar-ring" style={{ flexShrink:0, position:"relative", marginTop:6 }}>
              {/* Teal gradient ring */}
              <div style={{ position:"absolute", inset:-3, borderRadius:"50%",
                background:`conic-gradient(from 0deg,${T.teal},rgba(14,196,184,0.3),${T.teal})`,
                opacity:0.9 }}/>
              {/* Subtle pulse */}
              <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
                border:"1.5px solid rgba(14,196,184,0.18)",
                animation:"bp-pulse 4s ease-out infinite" }}/>
              <div className="bp-press" onClick={()=>setAvOpen(true)} style={{
                position:"relative", width:80, height:80, borderRadius:"50%",
                border:"3px solid white",
                boxShadow:"0 4px 18px rgba(0,0,0,0.14)",
                overflow:"hidden", background:T.bg,
                cursor:"pointer", touchAction:"manipulation",
              }}>
                {!avLoaded && <div className="bp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                <img src={avatar} alt={name} onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)}
                  style={{ width:"100%", height:"100%", objectFit:"cover", opacity:avLoaded?1:0, transition:"opacity .5s ease" }}/>
              </div>
            </div>

            {/* Name + meta + bio */}
            <div style={{ flex:1, minWidth:0, paddingTop:50 }}>
              {loading ? (
                <><Sk w="58%" h={24} sx={{marginBottom:6}}/><Sk w="42%" h={12} r={6} sx={{marginBottom:10}}/><Sk w="88%" h={12} r={6} sx={{marginBottom:5}}/><Sk w="72%" h={12} r={6}/></>
              ) : (
                <>
                  {/* Name */}
                  <h1 style={{ fontSize:"clamp(21px,5.5vw,27px)", fontWeight:800, color:T.ink,
                    letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 0 4px" }}>
                    {name}
                    {profile?.verified && <span style={{marginLeft:7,fontSize:16}}>🌿</span>}
                  </h1>
                  {/* @user + location */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.inkFaint, fontWeight:400, marginBottom:10, flexWrap:"wrap" }}>
                    {uname && <span>@{uname}</span>}
                    {uname && loc && <span>·</span>}
                    {loc && <><span>📍</span><span>{loc}</span></>}
                  </div>
                  {/* Emotional tagline */}
                  <p style={{ fontSize:14, lineHeight:1.65, color:T.inkSoft, margin:0,
                    fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic",
                    letterSpacing:"0.003em", whiteSpace:"pre-line" }}>
                    {tagline}
                  </p>
                </>
              )}
            </div>

            {/* Presence pill — top right (matches screenshot) */}
            {!loading && (
              <div style={{ flexShrink:0, marginTop:54 }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  padding:"6px 12px", borderRadius:T.r99,
                  background:"rgba(255,255,255,0.82)",
                  border:`1px solid ${T.border}`,
                  fontSize:11.5, color:T.inkSoft, fontWeight:500,
                  boxShadow:"0 1px 6px rgba(26,26,24,0.06)",
                  whiteSpace:"nowrap",
                }}>
                  <span style={{fontSize:12}}>☕</span>
                  offen für Begegnungen
                </div>
              </div>
            )}
          </div>

          {/* Capsules row + Follow button on same line */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16, gap:10 }}>
            <div className="bp-hscroll" style={{ display:"flex", gap:7, flex:1, minWidth:0 }}>
              {!loading && capsules.map((c,i)=>c.label && (
                <InterestCapsule key={i} icon={c.icon} label={c.label} bg={c.bg}/>
              ))}
              {loading && [1,2,3].map(i=><Sk key={i} w={72} h={32} r={99}/>)}
            </div>
            {/* Follow */}
            {!loading && (
              <button className="bp-press" onClick={onFollow} style={{
                flexShrink:0,
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"9px 18px", borderRadius:T.r99,
                fontSize:13, fontWeight:700,
                border:"none",
                background: followed ? "rgba(26,26,24,0.07)" : `linear-gradient(135deg,${T.teal},#0DBBAF)`,
                color: followed ? T.inkSoft : "white",
                boxShadow: followed ? "none" : `${T.glowTeal}, 0 2px 10px rgba(14,196,184,0.2)`,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                transition:"all .25s cubic-bezier(.22,1,.36,1)",
              }}>
                {followed ? "✓ Gefolgt" : "+ Folgen"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Avatar fullscreen */}
      {avOpen && (
        <div onClick={()=>setAvOpen(false)} style={{
          position:"fixed", inset:0, zIndex:9900,
          background:"rgba(10,12,18,0.9)", backdropFilter:"blur(20px)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{ position:"relative", maxWidth:280, width:"80vw" }}>
            <div style={{ width:"100%", aspectRatio:"1", borderRadius:"50%", overflow:"hidden",
              boxShadow:"0 20px 70px rgba(0,0,0,0.5), 0 0 0 3px rgba(14,196,184,0.3)" }}>
              <img src={avatar} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
            <div style={{ textAlign:"center", marginTop:16, fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.88)" }}>{name}</div>
            <button onClick={()=>setAvOpen(false)} style={{
              position:"absolute", top:-8, right:-8, width:30, height:30, borderRadius:"50%",
              background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.2)",
              color:"white", fontSize:15, cursor:"pointer", touchAction:"manipulation",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>×</button>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// MOMENTE — Small emotional fragments of life
// Exactly as in screenshot: grid of 5 cards with caption + date + ···
// ══════════════════════════════════════════════════════════════
function MomentCard({ m }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="bp-press-light bp-in" style={{
      display:"flex", flexDirection:"column",
      borderRadius:T.r12, overflow:"hidden",
      background:T.bgCard,
      boxShadow:T.cardShadow,
      cursor:"default",
    }}>
      {/* Image */}
      <div style={{ aspectRatio:"1", position:"relative", background:"rgba(26,26,24,0.06)" }}>
        {!loaded && <div className="bp-skeleton" style={{position:"absolute",inset:0}}/>}
        <img src={m.img} alt={m.caption} onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
            opacity:loaded?1:0, transition:"opacity .55s ease" }}/>
      </div>
      {/* Caption + date + ··· */}
      <div style={{ padding:"9px 10px 10px", display:"flex", alignItems:"flex-start", gap:4 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.ink, lineHeight:1.4,
            marginBottom:3, letterSpacing:"-0.005em" }}>{m.caption}</div>
          <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400 }}>{m.date}</div>
        </div>
        <button style={{ background:"none", border:"none", padding:"2px 3px",
          fontSize:14, color:T.inkFaint, cursor:"pointer", touchAction:"manipulation",
          flexShrink:0, lineHeight:1 }}>···</button>
      </div>
    </div>
  );
}

function MomenteSection({ moments }) {
  const { ref, style } = useEntry(0);
  const items = a(moments).length ? a(moments) : SEED_MOMENTS;
  return (
    <div ref={ref} style={{ ...style, width:"100%", padding:`0 ${T.px}px` }}>
      <SectionHead icon="📸" title="Momente" sub="Kleine Augenblicke aus meinem Alltag" cta="Alle Momente ansehen"/>
      {/* 5-column horizontal scroll grid — matches screenshot */}
      <div className="bp-hscroll" style={{
        display:"grid",
        gridTemplateColumns:`repeat(${items.length}, minmax(130px, 1fr))`,
        gap:8,
        paddingBottom:4,
      }}>
        {items.map((m,i)=> <MomentCard key={m.id||i} m={m}/>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TWO-COLUMN SECTION: Verbindungen | Interessen & Werte
// Matches screenshot layout exactly
// ══════════════════════════════════════════════════════════════
function VerbindungenColumn({ profileId }) {
  const { ref, style } = useEntry(0);
  const bridges = [
    { icon:"👥", iconBg:"rgba(14,196,184,0.10)",  title:"3 gemeinsame Verbindungen", sub:"Lena, Jonas und 1 weiterer kennen diese Person" },
    { icon:"🌿", iconBg:"rgba(34,197,94,0.10)",   title:"Ähnliche Interessen",       sub:"Ihr teilt 4 Interessen: Natur, Musik, Tiere, Ruhe" },
    { icon:"💛", iconBg:"rgba(245,158,11,0.10)",  title:"Gemeinsame Werte",          sub:"Achtsamkeit, Ehrlichkeit, Gemeinschaft" },
    { icon:"📍", iconBg:"rgba(99,102,241,0.10)",  title:"Gleiche Region",            sub:"Ihr seid beide in Freiburg" },
  ];
  return (
    <div ref={ref} style={{ ...style, flex:1, minWidth:0 }}>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em",
        display:"flex", gap:6, alignItems:"center", marginBottom:14 }}>
        <span>👥</span> Verbindungen & Gemeinsamkeiten
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {bridges.map((b,i)=>(
          <div key={i} className="bp-press-light" style={{
            display:"flex", alignItems:"center", gap:11,
            padding:"12px 0",
            borderBottom: i < bridges.length-1 ? `1px solid ${T.border}` : "none",
            cursor:"pointer", touchAction:"manipulation",
          }}>
            <div style={{ width:36, height:36, borderRadius:10, background:b.iconBg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.01em", lineHeight:1.3 }}>{b.title}</div>
              <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4, fontWeight:400 }}>{b.sub}</div>
            </div>
            <div style={{ fontSize:13, color:T.inkFaint, opacity:0.6 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InteressenColumn({ interests }) {
  const { ref, style } = useEntry(80);
  const rawInterests = a(interests);
  const tags = rawInterests.length
    ? rawInterests.slice(0,6).map((it,i)=>({
        icon:  DEFAULT_INTERESTS[i % DEFAULT_INTERESTS.length].icon,
        label: typeof it==="string" ? it : s(it?.name,""),
        text:  DEFAULT_INTERESTS[i % DEFAULT_INTERESTS.length].text,
        bg:    DEFAULT_INTERESTS[i % DEFAULT_INTERESTS.length].bg,
      }))
    : DEFAULT_INTERESTS;

  return (
    <div ref={ref} style={{ ...style, flex:1, minWidth:0 }}>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em",
        display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
        <span>🌿</span> Interessen & Werte
      </div>
      <div style={{ fontSize:11, color:T.inkFaint, marginBottom:14, fontWeight:400 }}>Dinge, die mich bewegen</div>
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:8,
      }}>
        {tags.slice(0,6).map((t,i)=>t.label && (
          <div key={i} className="bp-press-light" style={{
            padding:"12px 13px", borderRadius:T.r16,
            background:T.bgCard,
            border:`1px solid ${T.border}`,
            boxShadow:T.cardShadow,
            cursor:"pointer", touchAction:"manipulation",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <span style={{fontSize:15}}>{t.icon}</span>
              <span style={{ fontSize:12.5, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>{t.label}</span>
            </div>
            <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.5, fontWeight:400 }}>{t.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TwoColumnSection({ profileId, interests }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* On wide screens → side by side. On narrow → stacked */}
      <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
        <VerbindungenColumn profileId={profileId}/>
        <InteressenColumn interests={interests}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OFFEN FÜR BEGEGNUNGEN — Bottom open-for section
// ══════════════════════════════════════════════════════════════
function OffenFuerSection() {
  const { ref, style } = useEntry(0);
  return (
    <div ref={ref} style={{ ...style, padding:`0 ${T.px}px` }}>
      <SectionHead icon="☕" title="Offen für Begegnungen" sub="Themen & Erlebnisse, die mich gerade interessieren"/>
      <div className="bp-hscroll" style={{ display:"flex", gap:8, paddingBottom:4 }}>
        {OPEN_FOR.map((item,i)=>(
          <div key={i} className="bp-press-light" style={{
            flexShrink:0,
            display:"flex", flexDirection:"column", gap:4,
            padding:"14px 16px",
            borderRadius:T.r16,
            background:T.bgCard,
            border:`1px solid ${T.border}`,
            boxShadow:T.cardShadow,
            cursor:"pointer", touchAction:"manipulation",
            minWidth:148,
          }}>
            <span style={{fontSize:24, marginBottom:2}}>{item.icon}</span>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>{item.label}</div>
            <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.45 }}>{item.sub}</div>
          </div>
        ))}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FLOATING CONNECT — Soft pill bottom-right
// ══════════════════════════════════════════════════════════════
function FloatingConnect({ onConnect, connected }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),1000); return()=>clearTimeout(t); },[]);

  if (connected) return (
    <div style={{
      position:"fixed",
      bottom:"max(90px, calc(82px + env(safe-area-inset-bottom,0px)))",
      right:T.px, zIndex:9200,
      opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(8px)",
      transition:"opacity .4s ease 1s, transform .4s ease 1s",
      pointerEvents:"none",
    }}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"8px 15px", borderRadius:T.r99,
        background:"rgba(255,255,255,0.84)", backdropFilter:"blur(14px)",
        border:`1px solid ${T.tealMid}`,
        boxShadow:"0 2px 12px rgba(14,196,184,0.12)",
        fontSize:12, fontWeight:600, color:T.teal,
      }}>✓ Verbunden</div>
    </div>
  );

  return (
    <div style={{
      position:"fixed",
      bottom:"max(90px, calc(82px + env(safe-area-inset-bottom,0px)))",
      right:T.px, zIndex:9200,
      opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(14px)",
      transition:"opacity .5s ease 1s, transform .5s cubic-bezier(.22,1,.36,1) 1s",
      pointerEvents:vis?"auto":"none",
    }}>
      <button className="bp-press" onClick={onConnect} style={{
        display:"inline-flex", alignItems:"center", gap:7,
        padding:"12px 22px", borderRadius:T.r99, border:"none",
        background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
        color:"white", fontSize:14, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        boxShadow:`${T.glowTeal}, 0 6px 24px rgba(14,196,184,0.22), 0 2px 8px rgba(0,0,0,0.06)`,
        letterSpacing:"-0.01em",
      }}>
        <span style={{fontSize:15}}>+</span>Verbinden
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function BasisProfilePage({ profileId, onClose }) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  const engine      = useConnectionEngine();
  const followed    = engine.isFollowed(profileId);
  const isConnected = engine.isConnected(profileId);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);
  useEffect(()=>{
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    loadProfile(profileId).then(data=>{ setProfile(data); setLoading(false); });
  },[profileId]);

  const handleFollow  = useCallback(()=>{
    if(followed) engine.unfollow(profileId);
    else engine.follow(profileId);
  },[followed,profileId,engine]);

  const handleConnect = useCallback(()=>{
    engine.connect(profileId, profile);
    const name = s(profile?.display_name||profile?.username,"");
    engine.updateAmbient?.(`✦ ${name} und du verbinden euch`);
  },[profileId,profile,engine]);

  const handleClose = useCallback(()=>{ if(typeof onClose==="function") onClose(); },[onClose]);

  return (
    <div className="bp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(16px)",
      transition:"opacity .4s ease, transform .4s cubic-bezier(.22,1,.36,1)",
      background:T.bg,
    }}>
      <style>{CSS}</style>

      <div className="bp-scroll" style={{ flex:1, overflowY:"auto", paddingBottom:150 }}>

        {/* 1. Cinematic Hero */}
        <ProfileHero
          profile={profile} loading={loading}
          onClose={handleClose}
          onFollow={handleFollow} followed={followed}
        />

        <Gap h={24}/>

        {/* 2. Momente */}
        <MomenteSection moments={profile?.moments}/>

        <Gap h={28}/>
        <Divider/>
        <Gap h={24}/>

        {/* 3. Two-column: Verbindungen + Interessen */}
        <TwoColumnSection profileId={profileId} interests={profile?.interests}/>

        <Gap h={28}/>
        <Divider/>
        <Gap h={24}/>

        {/* 4. Offen für Begegnungen */}
        <OffenFuerSection/>

        <Gap h={52}/>
      </div>

      {/* Floating CTA */}
      <FloatingConnect onConnect={handleConnect} connected={isConnected}/>
    </div>
  );
}
