// src/pages/wirker-profile/index.jsx — Phase 24 VISITOR VIEW
// "Entering another human's creative universe"
// Layout: Hero → Stats Strip → Experiences → About+Wirkung → Moments → Community → Footer Values

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { S } from "../../core/hui.sources.js";
import { HUI } from "../../design/hui.design.js";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { useWirkerProfile } from "./hooks/useWirkerProfile.js";

const C  = HUI.COLOR;
const Sh = HUI.SHADOW;
const R  = HUI.RADIUS;

// ─── safe helpers ────────────────────────────────────────────────
const safeStr = (v, fb = "") => (v && typeof v === "string" ? v : fb);
const safeNum = (v, fb = 0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)           => Array.isArray(v) ? v : [];

// ─── scroll-entry ─────────────────────────────────────────────────
function useEntry(delay = 0) {
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
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(12px)",
      transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
    },
  };
}

// ─── press ────────────────────────────────────────────────────────
function usePress() {
  const [p, setP] = useState(false);
  return {
    pressed: p,
    bind: {
      onPointerDown:   () => setP(true),
      onPointerUp:     () => setP(false),
      onPointerLeave:  () => setP(false),
      onPointerCancel: () => setP(false),
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. HERO — cinematic, dark, atmospheric
// ═══════════════════════════════════════════════════════════════
const HERO_IMG_FB = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=85";
const AVATAR_FB   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80";
const DEFAULT_TAGS = [
  { icon: "🌿", label: "Atelier"      },
  { icon: "🌱", label: "Natur"        },
  { icon: "💡", label: "Kreativität"  },
  { icon: "✈️", label: "Reisen"       },
  { icon: "👥", label: "Gemeinschaft" },
];
const LIVE_AVATARS = [
  "https://i.pravatar.cc/32?img=5",
  "https://i.pravatar.cc/32?img=10",
  "https://i.pravatar.cc/32?img=14",
  "https://i.pravatar.cc/32?img=22",
];

function BookBtn({ onBook }) {
  const { pressed, bind } = usePress();
  return (
    <button {...bind} onClick={onBook} style={{
      display:"flex",alignItems:"center",gap:7,
      background: pressed ? C.tealDeep : C.teal,
      border:"none",borderRadius:99,
      padding:"11px 22px",
      color:"white",fontSize:13,fontWeight:700,
      cursor:"pointer",touchAction:"manipulation",
      boxShadow:`0 4px 18px ${C.tealGlow}`,
      transition:"background .15s ease",
    }}>
      <span style={{fontSize:15}}>📋</span> Erlebnis buchen
    </button>
  );
}
function MsgBtn({ onChat }) {
  const { pressed, bind } = usePress();
  return (
    <button {...bind} onClick={onChat} style={{
      display:"flex",alignItems:"center",gap:7,
      background: pressed ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.10)",
      border:"1.5px solid rgba(255,255,255,.32)",
      backdropFilter:"blur(10px)",
      borderRadius:99,padding:"10px 18px",
      color:"white",fontSize:13,fontWeight:600,
      cursor:"pointer",touchAction:"manipulation",
      transition:"background .15s ease",
    }}>
      <span style={{fontSize:14}}>💬</span> Nachricht senden
    </button>
  );
}
function FollowBtn({ followed, onFollow }) {
  const { pressed, bind } = usePress();
  return (
    <button {...bind} onClick={onFollow} style={{
      display:"flex",alignItems:"center",gap:7,
      background: followed
        ? "rgba(255,255,255,.18)"
        : pressed ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.08)",
      border:"1.5px solid rgba(255,255,255,.28)",
      backdropFilter:"blur(10px)",
      borderRadius:99,padding:"10px 18px",
      color:"white",fontSize:13,fontWeight:600,
      cursor:"pointer",touchAction:"manipulation",
      transition:"background .15s ease",
    }}>
      <span style={{fontSize:14}}>🤍</span> {followed ? "Gefolgt" : "Folgen"}
    </button>
  );
}

function VisitorHero({ profile, onClose, onBook, onChat }) {
  const heroActions = useHuiActions();
  const [mounted, setMounted] = useState(false);
  const [followed, setFollowed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const heroImg  = safeStr(profile?.header_img, HERO_IMG_FB);
  const avatar   = safeStr(profile?.img || profile?.avatar_url, AVATAR_FB);
  const name     = safeStr(profile?.display_name || profile?.name, "lars.platin.");
  const phil     = safeStr(profile?.bio, "Ich forme Raeume und Momente, die uns zurueck zu uns selbst bringen.");
  const tags     = safeArr(profile?.dna_tags || profile?.interests).length
    ? safeArr(profile?.dna_tags || profile?.interests).slice(0,5).map(t => ({ icon:"✦", label: t }))
    : DEFAULT_TAGS;
  const verified = !!profile?.verified;
  const liveCount = 31;
  const currentWork = safeStr(profile?.current_work, "Fragments of Light");

  return (
    <div style={{
      position:"relative",width:"100%",
      minHeight:340,
      overflow:"hidden",
      background:C.ink,
    }}>
      <style>{`
        @keyframes vParticle {
          0%,100%{transform:translateY(0) translateX(0);opacity:.4}
          50%{transform:translateY(-14px) translateX(5px);opacity:.75}
        }
        @keyframes vGlow {
          0%,100%{opacity:.14;transform:scale(1)}
          50%{opacity:.24;transform:scale(1.06)}
        }
        @keyframes vPulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.55;transform:scale(.75)}
        }
      `}</style>

      {/* BG cinematic */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`url(${heroImg})`,
        backgroundSize:"cover",backgroundPosition:"center 25%",
        opacity:.42,
      }}/>
      {/* gradient — left dark */}
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(105deg,rgba(6,14,14,.97) 0%,rgba(6,14,14,.82) 42%,rgba(6,14,14,.18) 100%)",
      }}/>
      {/* bottom fade */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,height:90,
        background:"linear-gradient(to top,rgba(6,14,14,.85),transparent)",
      }}/>

      {/* ambient blobs */}
      {[
        {top:"-15%",left:"60%",size:200,color:"rgba(13,196,181,.09)",dur:9},
        {top:"50%", left:"2%", size:140,color:"rgba(244,115,85,.07)",dur:12},
      ].map((b,i)=>(
        <div key={i} style={{
          position:"absolute",top:b.top,left:b.left,
          width:b.size,height:b.size,borderRadius:"50%",
          background:b.color,
          animation:`vGlow ${b.dur}s ease-in-out ${i*2}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}

      {/* floating particles */}
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{
          position:"absolute",
          width:3+i*.5,height:3+i*.5,borderRadius:"50%",
          background:`rgba(13,196,181,${.15+i*.06})`,
          top:`${10+i*14}%`,left:`${6+i*6}%`,
          animation:`vParticle ${5+i}s ease-in-out ${i*.7}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}

      {/* Top nav */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"16px 18px",zIndex:10,
      }}>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.18)",
          backdropFilter:"blur(12px)",borderRadius:99,
          width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",color:"white",fontSize:17,touchAction:"manipulation",
        }}>←</button>
        <div style={{display:"flex",gap:8}}>
          {["⬆️","···"].map((ic,i)=>(
            <button key={i} style={{
              background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.18)",
              backdropFilter:"blur(12px)",borderRadius:99,
              width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",color:"white",fontSize:13,touchAction:"manipulation",
            }}>{ic}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        position:"relative",zIndex:5,
        padding:"70px 18px 24px",
        display:"flex",flexDirection:"column",gap:0,
        opacity:mounted?1:0,
        transform:mounted?"none":"translateY(8px)",
        transition:"opacity .55s ease,transform .55s ease",
      }}>

        {/* Identity row */}
        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:12}}>
          {/* LEFT — avatar + name block */}
          <div style={{flex:"1 1 0",minWidth:0}}>
            {/* Creator badge + presence */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{
                background:"rgba(244,115,85,.22)",border:"1px solid rgba(244,115,85,.45)",
                backdropFilter:"blur(8px)",borderRadius:99,
                padding:"3px 10px",color:C.coralLight,fontSize:9,fontWeight:800,letterSpacing:".05em",
              }}>✦ CREATOR</div>
              <div style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,.75)",fontSize:10,fontWeight:600}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#22C55E",animation:"vPulse 2s infinite"}}/>
                Gerade im Atelier
              </div>
            </div>

            {/* Avatar + name */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <div style={{position:"relative",flexShrink:0}}>
                <img src={avatar} alt={name}
                  style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",
                    border:"3px solid rgba(255,255,255,.55)",
                    boxShadow:"0 4px 20px rgba(0,0,0,.4)"
                  }}
                  onError={e=>{e.target.src=AVATAR_FB;}}/>
                {verified && (
                  <div style={{
                    position:"absolute",bottom:2,right:2,
                    width:18,height:18,borderRadius:"50%",
                    background:C.teal,border:"2px solid white",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:9,color:"white",fontWeight:800,
                  }}>✓</div>
                )}
              </div>
              <div>
                <h1 style={{
                  fontSize:"clamp(26px,7vw,38px)",fontWeight:900,
                  color:"white",lineHeight:1.05,letterSpacing:"-.03em",
                  margin:0,textShadow:"0 2px 20px rgba(0,0,0,.5)",
                }}>{name}</h1>
              </div>
            </div>

            <p style={{
              fontSize:12.5,color:"rgba(255,255,255,.62)",
              margin:"0 0 12px",lineHeight:1.5,
              fontStyle:"italic",maxWidth:280,
            }}>{phil}</p>

            {/* Tags */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {tags.map((t,i)=>(
                <span key={i} style={{
                  background:"rgba(255,255,255,.09)",border:"1px solid rgba(255,255,255,.17)",
                  backdropFilter:"blur(6px)",borderRadius:99,
                  padding:"4px 11px",color:"rgba(255,255,255,.75)",
                  fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:5,
                }}><span style={{fontSize:11}}>{t.icon}</span>{t.label}</span>
              ))}
            </div>

            {/* CTAs */}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <BookBtn onBook={onBook}/>
              <MsgBtn onChat={onChat}/>
              <FollowBtn followed={followed} onFollow={()=>setFollowed(f=>!f)}/>
            </div>
          </div>

          {/* RIGHT — Live Atelier card */}
          <div style={{
            flexShrink:0,width:170,
            background:"rgba(10,22,22,.85)",
            backdropFilter:"blur(24px)",
            border:"1px solid rgba(255,255,255,.12)",
            borderRadius:R.lg,padding:"14px",
            boxShadow:"0 8px 32px rgba(0,0,0,.45)",
            alignSelf:"flex-start",
            marginTop:8,
          }}>
            <div style={{
              fontSize:12,fontWeight:800,color:"white",
              marginBottom:7,letterSpacing:"-.01em",
            }}>Heute im Atelier</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)",lineHeight:1.45,marginBottom:10}}>
              Neues Werk entsteht<br/>
              <em style={{color:C.tealLight,fontStyle:"italic"}}>„{currentWork}"</em>
            </div>
            {/* Live avatars */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <div style={{display:"flex"}}>
                {LIVE_AVATARS.map((av,i)=>(
                  <img key={i} src={av} alt=""
                    style={{
                      width:24,height:24,borderRadius:"50%",
                      border:"2px solid rgba(10,22,22,.9)",
                      objectFit:"cover",marginLeft:i===0?0:-7,
                    }}
                    onError={e=>{e.target.style.display="none";}}/>
                ))}
              </div>
              <span style={{fontSize:10,color:"rgba(255,255,255,.55)",fontWeight:600}}>
                {liveCount} dabei
              </span>
            </div>
            <button
              onClick={() => heroActions[A.OPEN_ROOM]?.({ creatorId: profile?.id || profile?.user_id })}
              style={{
                background:"none",border:"none",padding:0,width:"100%",textAlign:"left",
                fontSize:10,color:C.tealLight,fontWeight:700,cursor:"pointer",
                paddingTop:6,borderTop:"1px solid rgba(255,255,255,.09)",
                touchAction:"manipulation",fontFamily:"inherit",
              }}>
              Atelier live betreten →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. STATS STRIP
// ═══════════════════════════════════════════════════════════════
const STAT_DEFS = [
  { icon:"✨",  label:"Erlebnisse\ngeteilt",      key:"bookings",    suffix:"",  prefix:""  },
  { icon:"👥",  label:"Menschen\nresonieren",     key:"followers",   suffix:"",  prefix:""  },
  { icon:"⭐",  label:"Resonanz\nBewertung",      key:"rating",      suffix:"",  prefix:""  },
  { icon:"🌿",  label:"Spuren\nhinterlassen",     key:"traces",      suffix:"K", prefix:""  },
  { icon:"€",   label:"Gemeinsame\nWirkung",      key:"impact_eur",  suffix:"",  prefix:"€" },
];

function AnimCounter({ target, prefix="", suffix="" }) {
  const [v, setV] = useState(0);
  const done = useRef(false);
  const el   = useRef(null);
  useEffect(() => {
    const node = el.current; if (!node) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t = typeof target === "number" && isFinite(target) ? target : 0;
        if (!t) { setV(t); return; }
        let cur = 0; const step = t / 38;
        const timer = setInterval(() => {
          cur = Math.min(cur + step, t); setV(parseFloat(cur.toFixed(1)));
          if (cur >= t) clearInterval(timer);
        }, 24);
      }
    }, { threshold: 0.1 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={el}>{prefix}{typeof v === "number" && v % 1 !== 0 ? v.toFixed(1) : Math.round(v)}{suffix}</span>;
}

function StatsStrip({ profile }) {
  const vals = {
    bookings:   safeNum(profile?.bookings, 24),
    followers:  safeNum(profile?.followers, 189),
    rating:     safeNum(profile?.rating || profile?.resonance_rating, 4.8),
    traces:     safeNum(profile?.traces, 2),
    impact_eur: safeNum(profile?.impact_eur, 8950),
  };
  const { ref, style } = useEntry(0);
  return (
    <div ref={ref} style={{
      ...style,
      width:"100%",background:"white",
      padding:"18px 12px",
      borderBottom:"1px solid rgba(0,0,0,.05)",
    }}>
      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        gap:4,
      }}>
        {STAT_DEFS.map((s,i) => (
          <div key={i} style={{
            flex:"1 1 0",display:"flex",flexDirection:"column",alignItems:"center",
            gap:4,textAlign:"center",
            borderRight:i<STAT_DEFS.length-1?"1px solid rgba(0,0,0,.06)":"none",
            padding:"0 4px",
          }}>
            <div style={{fontSize:17,lineHeight:1}}>{s.icon}</div>
            <div style={{
              fontSize:"clamp(14px,4vw,20px)",fontWeight:800,
              color:C.ink,letterSpacing:"-.04em",lineHeight:1,
            }}>
              <AnimCounter target={vals[s.key]} prefix={s.prefix} suffix={s.suffix}/>
            </div>
            <div style={{
              fontSize:8.5,color:C.muted,fontWeight:500,
              lineHeight:1.3,whiteSpace:"pre-line",
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. EXPERIENCES — Airbnb editorial
// ═══════════════════════════════════════════════════════════════
const SEED_EXP = [
  {
    id:"e1",tag:"Beliebt",tagColor:"#6366F1",
    title:"Atelier Workshop",sub:"Kreative Natur erleben",
    dur:"4 Std.",spots:"6 Plätze",price:129,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80",
  },
  {
    id:"e2",tag:"Nur 2 frei",tagColor:C.coral,
    title:"1:1 Mentoring",sub:"Dein kreativer Flow",
    dur:"60 Min.",spots:"1:1 Session",price:149,
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80",
  },
  {
    id:"e3",tag:"Beliebt",tagColor:"#6366F1",
    title:"Natur Retreat",sub:"Wald. Stille. Verbundenheit.",
    dur:"3 Tage",spots:"8 Plätze",price:499,
    img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80",
  },
  {
    id:"e4",tag:"Community",tagColor:C.teal,
    title:"Musikabend",sub:"Klang & Verbindung",
    dur:"2,5 Std.",spots:"30 Plätze",price:39,
    img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80",
  },
  {
    id:"e5",tag:"Neu",tagColor:"#F59E0B",
    title:"Community Dinner",sub:"Echte Begegnungen",
    dur:"3 Std.",spots:"12 Plätze",price:59,
    img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80",
  },
];

function ExpCard({ exp, onBook }) {
  const { pressed, bind } = usePress();
  return (
    <div {...bind} style={{
      flexShrink:0,width:164,
      borderRadius:R.md,overflow:"hidden",
      background:"white",
      boxShadow: pressed ? Sh.xs : Sh.sm,
      border:"1px solid rgba(0,0,0,.05)",
      cursor:"pointer",touchAction:"manipulation",
      transform:pressed?"scale(.97)":"scale(1)",
      transition:"transform .15s ease,box-shadow .15s ease",
    }}>
      <div style={{height:120,overflow:"hidden",position:"relative",background:C.creamWarm}}>
        <img src={exp.img} alt={exp.title}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";}}/>
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,.32) 0%,transparent 55%)",
        }}/>
        <div style={{
          position:"absolute",top:8,left:8,
          background:exp.tagColor,color:"white",
          fontSize:7.5,fontWeight:800,borderRadius:99,padding:"3px 7px",letterSpacing:".03em",
        }}>{exp.tag}</div>
      </div>
      <div style={{padding:"10px 11px 12px"}}>
        <div style={{fontSize:12,fontWeight:800,color:C.ink,letterSpacing:"-.02em",marginBottom:2}}>
          {exp.title}
        </div>
        <div style={{fontSize:9.5,color:C.muted,marginBottom:7,fontWeight:500,lineHeight:1.3}}>
          {exp.sub}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8,fontSize:8.5,color:C.muted}}>
          <span>⏱ {exp.dur}</span>
          <span>👤 {exp.spots}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.03em"}}>
            €{exp.price}
          </span>
          <button onClick={()=>onBook?.(exp)} style={{
            background:"none",border:"none",padding:0,
            fontSize:9.5,fontWeight:700,color:C.teal,cursor:"pointer",
            touchAction:"manipulation",
          }}>Mehr erfahren →</button>
        </div>
      </div>
    </div>
  );
}

function VisitorExperiences({ experiences, onBook }) {
  const expActions = useHuiActions();
  const { ref, style } = useEntry(60);
  const items = safeArr(experiences).length ? safeArr(experiences) : SEED_EXP;
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:"white", padding:"22px 0 18px" }}>
      <div style={{
        padding:"0 18px 14px",
        display:"flex",justifyContent:"space-between",alignItems:"baseline",
      }}>
        <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
          Erlebnisse & Angebote
        </div>
        <button
          onClick={() => expActions[A.OPEN_EXPERIENCE]?.({ view: "alle", creatorId: null })}
          style={{
            background:"none",border:"none",padding:0,
            fontSize:11,color:C.teal,fontWeight:700,cursor:"pointer",
            whiteSpace:"nowrap",touchAction:"manipulation",fontFamily:"inherit",
          }}>
          Alle Erlebnisse anzeigen →
        </button>
      </div>
      <div style={{
        display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 6px",WebkitOverflowScrolling:"touch",
      }}>
        {items.map(e=><ExpCard key={e.id} exp={e} onBook={onBook}/>)}
        <div style={{flexShrink:0,width:6}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. ABOUT + WIRKUNG — editorial two-column
// ═══════════════════════════════════════════════════════════════
function Sparkline({ vals = [], color = C.teal }) {
  const safe = vals.filter(n => typeof n === "number" && isFinite(n));
  if (safe.length < 2) return null;
  const max = Math.max(...safe, 1);
  const w = 130, h = 50;
  const pts = safe.map((v, i) =>
    `${(i / (safe.length - 1)) * w},${h - (v / max) * (h - 4)}`
  ).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity=".4"/>
          <stop offset="100%" stopColor={color} stopOpacity=".9"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AboutSection({ profile }) {
  const aboutActions = useHuiActions();
  const { ref, style } = useEntry(40);
  const name      = safeStr(profile?.display_name || profile?.name, "lars.platin");
  const bio       = safeStr(profile?.bio, "Ich glaube an die Kraft echter Räume. Räume, in denen wir kreativ sein dürfen. Uns zeigen dürfen. Wachsen dürfen. Gemeinsam.");
  const impact    = safeNum(profile?.impact_eur, 8950);
  const projects  = safeNum(profile?.bookings, 24);
  const humans    = safeNum(profile?.followers, 189);
  const rating    = safeNum(profile?.resonance_rating, 4.8);
  const spark     = [300,520,440,810,700,980,760,1200,940,1350,1100,impact];
  const vidImg    = safeStr(profile?.header_img, "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80");

  return (
    <div ref={ref} style={{
      ...style,
      width:"100%",background:C.cream,
      padding:"22px 18px",
    }}>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:14,alignItems:"start"}}>

        {/* LEFT: story */}
        <div>
          <div style={{fontSize:15,fontWeight:800,color:C.ink,letterSpacing:"-.025em",marginBottom:10}}>
            Über {name}.
          </div>
          <p style={{
            fontSize:12,color:"rgba(30,30,30,.65)",lineHeight:1.65,
            margin:"0 0 12px",fontFamily:"-apple-system,BlinkMacSystemFont,'Georgia',serif",
          }}>{bio}</p>
          <button
            onClick={() => aboutActions[A.OPEN_WORLD]?.({ section: "reise" })}
            style={{
              background:"none",border:"none",padding:0,
              fontSize:11,fontWeight:700,color:C.teal,cursor:"pointer",touchAction:"manipulation",
              fontFamily:"inherit",
            }}>Mehr über meine Reise →</button>
        </div>

        {/* CENTER: cinematic image */}
        <div style={{
          width:110,flexShrink:0,borderRadius:R.md,overflow:"hidden",
          boxShadow:Sh.md,position:"relative",background:C.creamDeep,
        }}>
          <img src={vidImg} alt="Creator"
            style={{width:"100%",height:150,objectFit:"cover",display:"block"}}
            onError={e=>{e.target.style.display="none";}}/>
          <div style={{
            position:"absolute",inset:0,
            display:"flex",alignItems:"center",justifyContent:"center",
            background:"rgba(0,0,0,.18)",
          }}>
            <div style={{
              width:36,height:36,borderRadius:"50%",
              background:"rgba(255,255,255,.88)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,boxShadow:Sh.md,
            }}>▶</div>
          </div>
        </div>

        {/* RIGHT: Wirkung */}
        <div>
          <div style={{fontSize:14,fontWeight:800,color:C.ink,letterSpacing:"-.02em",marginBottom:12}}>
            Wirkung, die wir gemeinsam schaffen
          </div>
          {[
            {icon:"€",  label:"Gemeinsame Wirkung", val:`€${impact.toLocaleString("de-DE")}`},
            {icon:"✦",  label:"Unterstützte Projekte", val:projects},
            {icon:"👥", label:"Menschen begleitet",    val:humans},
            {icon:"⭐", label:"Resonanz Bewertung",    val:rating},
          ].map((m,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:8,
              marginBottom:i<3?9:0,
            }}>
              <span style={{
                width:22,height:22,borderRadius:"50%",
                background:`${C.teal}14`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,flexShrink:0,
              }}>{m.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:C.muted,lineHeight:1}}>{m.label}</div>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:C.ink}}>{m.val}</span>
            </div>
          ))}
          <div style={{marginTop:10}}>
            <Sparkline vals={spark} color={C.teal}/>
          </div>
          <button style={{
            background:"none",border:"none",padding:"8px 0 0",
            fontSize:11,fontWeight:700,color:C.teal,cursor:"pointer",touchAction:"manipulation",display:"block",
          }}
            onClick={() => aboutActions[A.GO_IMPACT]?.()}
          >Mehr Wirkung ansehen →</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. MOMENTS — "Momente aus meinem Raum"
// ═══════════════════════════════════════════════════════════════
const SEED_MOMENTS = [
  {id:"m1",caption:"Neues Werk in\nEntstehung",time:"Vor 2 Std.",
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=75"},
  {id:"m2",caption:"Heute am See.\nDankbar.",time:"Vor 1 Tag",
   img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=75"},
  {id:"m3",caption:"Abendlicht.\nMagisch.",time:"Vor 2 Tagen",
   img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=75"},
  {id:"m4",caption:"Atelier Session.\nSo viel Energie!",time:"Vor 3 Tagen",
   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=75"},
];

function MomentCard({ m }) {
  const { pressed, bind } = usePress();
  return (
    <div {...bind} style={{
      flexShrink:0,width:145,height:190,
      borderRadius:R.md,overflow:"hidden",position:"relative",
      cursor:"pointer",touchAction:"manipulation",background:C.creamDeep,
      transform:pressed?"scale(.97)":"scale(1)",
      transition:"transform .15s ease",
    }}>
      <img src={m.img} alt=""
        style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
        onError={e=>{e.target.style.display="none";}}/>
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(to top,rgba(0,0,0,.68) 0%,rgba(0,0,0,.10) 60%)",
      }}/>
      <div style={{
        position:"absolute",bottom:12,left:11,right:11,
      }}>
        <div style={{fontSize:11,fontWeight:700,color:"white",lineHeight:1.35,whiteSpace:"pre-line"}}>
          {m.caption}
        </div>
        <div style={{fontSize:9,color:"rgba(255,255,255,.6)",marginTop:4}}>{m.time}</div>
      </div>
    </div>
  );
}

function MomentsSection({ moments }) {
  const { ref, style } = useEntry(60);
  const items = safeArr(moments).length ? safeArr(moments) : SEED_MOMENTS;
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:"white", padding:"22px 0 18px" }}>
      <div style={{
        padding:"0 18px 14px",
        display:"flex",justifyContent:"space-between",alignItems:"baseline",
      }}>
        <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
          Momente aus meinem Raum
        </div>
      </div>
      <div style={{
        display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 6px",WebkitOverflowScrolling:"touch",
      }}>
        {items.map(m=><MomentCard key={m.id} m={m}/>)}
        <div style={{flexShrink:0,width:6}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. COMMUNITY / RESONANCE — "Menschen in Resonanz"
// ═══════════════════════════════════════════════════════════════
const SEED_COMMUNITY = [
  {id:"c1",name:"Mara",   role:"Hat am Atelier Workshop teilgenommen", time:"Gerade aktiv", dot:"#22C55E",av:"https://i.pravatar.cc/40?img=1"},
  {id:"c2",name:"Jonas",  role:"1:1 Mentoring gebucht",               time:"Vor 12 Min.",  dot:C.teal,   av:"https://i.pravatar.cc/40?img=3"},
  {id:"c3",name:"Lea",    role:"Hat diesen Moment geliebt",           time:"Vor 1 Std.",   dot:C.coral,  av:"https://i.pravatar.cc/40?img=5"},
  {id:"c4",name:"Timo",   role:"Im Natur Retreat dabei",              time:"Heute",        dot:"#8B5CF6",av:"https://i.pravatar.cc/40?img=8"},
  {id:"c5",name:"Anna",   role:"Neuer Follower",                      time:"Heute",        dot:"#F59E0B",av:"https://i.pravatar.cc/40?img=12"},
];

function ResonanceRow({ m }) {
  const rowActions = useHuiActions();
  return (
    <button
      onClick={() => rowActions[A.OPEN_PROFILE]?.({ creatorId: m?.id, creator: m, source: S.VISITOR_PROFILE })}
      style={{
        display:"flex",alignItems:"center",gap:10,
        padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,.045)",
        background:"none",border:"none",width:"100%",textAlign:"left",
        cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
      }}>
      <div style={{position:"relative",flexShrink:0}}>
        <img src={m.av} alt={m.name}
          style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",background:C.creamDeep}}
          onError={e=>{e.target.style.display="none";}}/>
        <div style={{
          position:"absolute",bottom:1,right:1,
          width:9,height:9,borderRadius:"50%",
          background:m.dot,border:"1.5px solid white",
        }}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:C.ink,letterSpacing:"-.015em"}}>{m.name}</div>
        <div style={{fontSize:10,color:C.muted,marginTop:1,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
        }}>{m.role}</div>
      </div>
      <div style={{fontSize:9,color:C.muted,fontWeight:500,flexShrink:0,whiteSpace:"nowrap"}}>{m.time}</div>
    </button>
  );
}

function ResonanceCommunity({ community }) {
  const communityActions = useHuiActions();
  const { ref, style } = useEntry(80);
  const members = safeArr(community).length ? safeArr(community) : SEED_COMMUNITY;
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:C.cream, padding:"22px 18px 24px" }}>
      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14,
      }}>
        <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
          Menschen in Resonanz
        </div>
        <button
          onClick={() => communityActions[A.OPEN_COMMUNITY]?.({ view: "alle" })}
          style={{
            background:"none",border:"none",padding:0,
            fontSize:11,color:C.teal,fontWeight:700,cursor:"pointer",
            touchAction:"manipulation",fontFamily:"inherit",
          }}>
          Alle Menschen ansehen →
        </button>
      </div>
      <div style={{
        background:"white",borderRadius:R.md,
        padding:"2px 14px",
        boxShadow:Sh.xs,border:"1px solid rgba(0,0,0,.04)",
      }}>
        {members.map(m=><ResonanceRow key={m.id} m={m}/>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. FOOTER VALUES
// ═══════════════════════════════════════════════════════════════
const VALUES = [
  {icon:"🌿",label:"Authentisch",sub:"Echt & transparent"},
  {icon:"✨",label:"Inspirierend",sub:"Kreativität wecken"},
  {icon:"👥",label:"Verbindend", sub:"Gemeinschaft leben"},
  {icon:"🤍",label:"Achtsam",    sub:"Mit Herz & Seele"},
];

function FooterValues() {
  const { ref, style } = useEntry(0);
  return (
    <div ref={ref} style={{
      ...style,
      width:"100%",background:"white",
      borderTop:"1px solid rgba(0,0,0,.05)",
      padding:"20px 12px 28px",
    }}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {VALUES.map((v,i)=>(
          <div key={i} style={{textAlign:"center",padding:"10px 4px"}}>
            <div style={{fontSize:22,marginBottom:4}}>{v.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{v.label}</div>
            <div style={{fontSize:8.5,color:C.muted,marginTop:2,lineHeight:1.3}}>{v.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FLOATING BOOK CTA — sticky bottom
// ═══════════════════════════════════════════════════════════════
function FloatingBookCTA({ onBook, profileName }) {
  const { pressed, bind } = usePress();
  return (
    <div style={{
      position:"fixed",
      bottom:"max(80px, calc(72px + env(safe-area-inset-bottom,0px)))",
      left:18,right:18,zIndex:9100,
      display:"flex",gap:10,alignItems:"center",
    }}>
      <button {...bind} onClick={onBook} style={{
        flex:1,
        background: pressed
          ? `linear-gradient(135deg,${C.tealDeep},${C.teal})`
          : `linear-gradient(135deg,${C.teal},${C.tealLight})`,
        border:"none",borderRadius:99,
        padding:"14px 24px",
        color:"white",fontSize:14,fontWeight:700,
        cursor:"pointer",touchAction:"manipulation",
        boxShadow:`0 6px 22px ${C.tealGlow}`,
        transition:"background .15s ease,transform .15s ease",
        transform:pressed?"scale(.98)":"scale(1)",
      }}>
        Erlebnis mit {profileName || "Creator"} buchen
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT — WirkerProfilePage (VISITOR)
// ═══════════════════════════════════════════════════════════════
export default function WirkerProfilePage({ wirker: rawWirker, onClose, onBook, onChat, _zIndex = 9500 }) {
  const safe    = useMemo(() => createProfileItem(rawWirker), [
    rawWirker?.id, rawWirker?.user_id,
  ]);
  const actions = useHuiActions();

  // Phase 3: echte Profil-Daten + Experiences aus Supabase
  const { profile: liveProfile, exps: liveExps, works: liveWorks } = useWirkerProfile(rawWirker);

  // Merge: liveProfile wenn geladen, sonst rawWirker als Fallback
  const profile = liveProfile?._raw || liveProfile || safe?._raw || rawWirker || {};
  // Experiences: echte Supabase-Daten bevorzugt, SEED als Fallback (im Component)
  const experiences = liveExps?.length > 0 ? liveExps : null;

  const name = safeStr(profile?.display_name || profile?.name, "Creator");

  const handleClose = useCallback(() => { onClose?.(); }, [onClose]);

  // Route through Action Engine — falls back to prop callbacks for non-HomeShell contexts
  const handleBook = useCallback((exp) => {
    if (actions[A.BOOK_EXPERIENCE]) {
      actions[A.BOOK_EXPERIENCE]({ experience: exp, creator: profile, source: S.VISITOR_PROFILE });
    } else {
      onBook?.(profile, exp);
    }
  }, [actions, profile, onBook]);

  const handleChat = useCallback(() => {
    if (actions[A.OPEN_CHAT]) {
      // PHASE 2C: source + vollständiges recipient-Objekt
      // normalizeRecipient() läuft in OPEN_CHAT — hier rohe Daten ok
      actions[A.OPEN_CHAT]({
        recipient: {
          id:           profile?.id || profile?.user_id,
          display_name: profile?.display_name || profile?.name || "Creator",
          avatar_url:   profile?.img || profile?.avatar_url || null,
          talent:       profile?.talent || null,
        },
        source: S.VISITOR_PROFILE,  // LOOP 1: Return zum Profil nach Chat-Close
      });
    } else {
      onChat?.(profile);
    }
  }, [actions, profile, onChat]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:_zIndex,
      overflowY:"auto", overflowX:"hidden",
      background:C.cream,
      animation:"hui-profile-enter 220ms cubic-bezier(0.22,1,0.36,1) both",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      WebkitOverflowScrolling:"touch",
      paddingBottom:"max(120px, calc(100px + env(safe-area-inset-bottom,0px)))",
    }}>
      <style>{HUI.KEYFRAMES}</style>
      <style>{`
        @keyframes hui-profile-enter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <style>{`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{display:none}
      `}</style>

      <VisitorHero   profile={profile} onClose={handleClose} onBook={handleBook} onChat={handleChat}/>
      <StatsStrip    profile={profile}/>
      <VisitorExperiences experiences={experiences} onBook={handleBook}/>
      <AboutSection  profile={profile}/>
      <MomentsSection moments={null}/>
      <ResonanceCommunity community={null}/>
      <FooterValues/>
      <FloatingBookCTA onBook={handleBook} profileName={name}/>
    </div>
  );
}
