// src/pages/creator-profile/index.jsx — Phase 24 OWNER VIEW
// "Mein lebendiger kreativer Raum" — kein Besucherprofil, kein Social Media
// Struktur: Hero (Atelier-Dashboard) → QuickActions → Experiences → Activity → Earnings → Welten → Community

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HUI } from "../../design/hui.design.js";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";

const C = HUI.COLOR;
const Sh = HUI.SHADOW;
const R = HUI.RADIUS;

// ─── helpers ────────────────────────────────────────────────────
const safeStr = (v, fb = "") => (v && typeof v === "string" ? v : fb);
const safeNum = (v, fb = 0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)          => Array.isArray(v) ? v : [];

// ─── scroll-entry hook ─────────────────────────────────────────
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
  const style = {
    opacity: vis ? 1 : 0,
    transform: vis ? "none" : "translateY(14px)",
    transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
  };
  return { ref, style };
}

// ─── press feedback ─────────────────────────────────────────────
function usePress() {
  const [p, setP] = useState(false);
  const props = {
    onPointerDown:  () => setP(true),
    onPointerUp:    () => setP(false),
    onPointerLeave: () => setP(false),
    onPointerCancel:() => setP(false),
  };
  return { props, scale: p ? "scale(.96)" : "scale(1)" };
}

// ═══════════════════════════════════════════════════════════════
// 1. HERO — "Heute in deinem Raum"
// ═══════════════════════════════════════════════════════════════
const TODAY_ACTIVITY = [
  { icon:"💛", text:"3 neue Menschen haben resoniert" },
  { icon:"📅", text:"Morgen: Atelier Workshop · 6 Platze" },
  { icon:"✨", text:"€420 Wirkung diese Woche" },
  { icon:"✉️", text:"2 neue Nachrichten" },
];

const TAGS = ["Atelier", "Natur", "Kreativitat", "Reisen", "Gemeinschaft"];

function OwnerHero({ profile, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const name      = safeStr(profile?.display_name || profile?.name, "Creator");
  const heroImg   = safeStr(profile?.header_img || profile?.img, "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=85");
  const phil      = safeStr(profile?.bio, "Ich forme Raume und Momente,\ndie uns zuruck zu uns selbst bringen.");
  const tags      = safeArr(profile?.dna_tags || profile?.interests).slice(0, 5);
  const usedTags  = tags.length ? tags : TAGS;

  return (
    <div style={{
      position: "relative", width: "100%",
      minHeight: 300, maxHeight: 380,
      overflow: "hidden", background: C.ink,
    }}>
      <style>{`
        @keyframes ambientFloat {
          0%,100%{transform:translateY(0) scale(1);opacity:.18}
          50%{transform:translateY(-18px) scale(1.04);opacity:.28}
        }
        @keyframes softPulse {
          0%,100%{opacity:.7;transform:scale(1)}
          50%{opacity:1;transform:scale(1.15)}
        }
      `}</style>

      {/* BG image — warmer, softer */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`url(${heroImg})`,
        backgroundSize:"cover",backgroundPosition:"center 30%",
        opacity:.35,
      }}/>

      {/* Gradient — left heavy, warm */}
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(105deg, rgba(8,18,18,.96) 0%, rgba(8,18,18,.78) 50%, rgba(8,18,18,.20) 100%)",
      }}/>

      {/* Ambient light blob */}
      <div style={{
        position:"absolute",top:"-20%",right:"15%",
        width:220,height:220,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(13,196,181,.12) 0%,transparent 70%)",
        animation:"ambientFloat 8s ease-in-out infinite",pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute",bottom:"-10%",left:"5%",
        width:160,height:160,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(244,115,85,.10) 0%,transparent 70%)",
        animation:"ambientFloat 11s ease-in-out 2s infinite",pointerEvents:"none",
      }}/>

      {/* Top nav */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"16px 18px",zIndex:10,
      }}>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.18)",
          backdropFilter:"blur(12px)",borderRadius:99,
          width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",color:"white",fontSize:17,touchAction:"manipulation",
        }}>←</button>

        {/* Subtle presence — no badge, just quiet text */}
        <div style={{
          background:"rgba(13,196,181,.12)",border:"1px solid rgba(13,196,181,.25)",
          backdropFilter:"blur(10px)",borderRadius:99,
          padding:"5px 12px",color:"rgba(13,196,181,.90)",
          fontSize:10,fontWeight:600,letterSpacing:".04em",
        }}>
          ● Dein Raum ist offen
        </div>

        <button style={{
          background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.18)",
          backdropFilter:"blur(12px)",borderRadius:99,
          width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",color:"white",fontSize:14,touchAction:"manipulation",
        }}>✏️</button>
      </div>

      {/* Main content */}
      <div style={{
        position:"relative",zIndex:5,
        display:"flex",alignItems:"flex-end",gap:14,
        padding:"78px 18px 24px",
        opacity:mounted?1:0,
        transform:mounted?"none":"translateY(10px)",
        transition:"opacity .6s ease,transform .6s ease",
      }}>

        {/* LEFT — Identity + philosophy */}
        <div style={{flex:"1 1 0",minWidth:0}}>
          <h1 style={{
            fontSize:"clamp(24px,6vw,34px)",fontWeight:800,
            color:"white",lineHeight:1.1,letterSpacing:"-.03em",
            margin:"0 0 8px",textShadow:"0 2px 20px rgba(0,0,0,.5)",
          }}>
            Willkommen,<br/>
            <span style={{color:C.tealLight}}>{name}.</span>
          </h1>

          <p style={{
            fontSize:12,color:"rgba(255,255,255,.55)",margin:"0 0 13px",
            lineHeight:1.55,fontStyle:"italic",maxWidth:240,whiteSpace:"pre-line",
          }}>"{phil}"</p>

          {/* Tags */}
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {usedTags.map((t,i)=>(
              <span key={i} style={{
                background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.14)",
                backdropFilter:"blur(6px)",borderRadius:99,
                padding:"3px 9px",color:"rgba(255,255,255,.65)",
                fontSize:9,fontWeight:600,
              }}>✦ {t}</span>
            ))}
          </div>
        </div>

        {/* RIGHT — Atelier Dashboard Widget */}
        <div style={{
          flexShrink:0,width:178,
          background:"rgba(255,252,248,.92)",backdropFilter:"blur(22px)",
          borderRadius:R.lg,padding:"13px 14px",
          boxShadow:Sh.lg,border:"1px solid rgba(255,255,255,.60)",
        }}>
          <div style={{
            fontSize:10,fontWeight:700,color:C.ink,marginBottom:9,
            letterSpacing:".04em",opacity:.55,
          }}>HEUTE IN DEINEM RAUM</div>

          {TODAY_ACTIVITY.map((a,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"flex-start",gap:6,
              marginBottom:i<TODAY_ACTIVITY.length-1?7:0,
            }}>
              <span style={{fontSize:12,flexShrink:0,marginTop:1}}>{a.icon}</span>
              <span style={{fontSize:10,color:"#444",lineHeight:1.4,fontWeight:500}}>{a.text}</span>
            </div>
          ))}

          <div style={{
            marginTop:10,paddingTop:8,
            borderTop:"1px solid rgba(0,0,0,.07)",
            fontSize:9,color:C.teal,fontWeight:700,cursor:"pointer",
          }}>
            Alle Aktivitat ansehen →
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. QUICK ACTION BAR
// ═══════════════════════════════════════════════════════════════
const ACTIONS = [
  { icon:"✨",label:"Neues Erlebnis",   color:C.teal   },
  { icon:"🚪",label:"Raum offnen",      color:C.coral  },
  { icon:"📸",label:"Moment teilen",    color:"#8B5CF6"},
  { icon:"👥",label:"Community",        color:"#0EA5E9"},
  { icon:"💰",label:"Einnahmen",        color:C.gold   },
  { icon:"📅",label:"Kalender",         color:"#22C55E"},
  { icon:"🌱",label:"Wirkung",          color:C.coral  },
  { icon:"🏛",label:"Atelier",          color:C.teal   },
];

function ActionPill({ a, onAction }) {
  const { props, scale } = usePress();
  return (
    <button {...props} onClick={()=>onAction?.(a.label)}
      style={{
        flexShrink:0,display:"flex",flexDirection:"column",
        alignItems:"center",gap:5,
        background:`${a.color}0D`,
        border:`1px solid ${a.color}22`,
        borderRadius:R.md,padding:"12px 14px",
        cursor:"pointer",touchAction:"manipulation",
        transform:scale,transition:"transform .15s ease",
        minWidth:72,
      }}>
      <span style={{fontSize:20}}>{a.icon}</span>
      <span style={{
        fontSize:9,fontWeight:700,color:a.color,
        letterSpacing:".02em",textAlign:"center",lineHeight:1.2,
      }}>{a.label}</span>
    </button>
  );
}

function QuickActions({ onAction }) {
  const { ref, style } = useEntry(50);
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:"white", padding:"16px 0 14px" }}>
      <div style={{
        display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",
        padding:"2px 18px 4px",WebkitOverflowScrolling:"touch",
      }}>
        {ACTIONS.map((a,i) => <ActionPill key={i} a={a} onAction={onAction}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. OWNER EXPERIENCES — große cinematic cards
// ═══════════════════════════════════════════════════════════════
const SEED_EXP = [
  {
    id:"e1",title:"Atelier Workshop",category:"Creative Nature",
    dur:"4 Std.",spots:6,totalSpots:6,price:129,nextDate:"24. Mai",
    earnings:774,resonance:4.9,tag:"Ausgebucht",tagColor:C.coral,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  },
  {
    id:"e2",title:"1:1 Mentoring",category:"Kreativer Flow",
    dur:"60 Min.",spots:3,totalSpots:11,price:149,nextDate:"30. Mai",
    earnings:1490,resonance:5.0,tag:"Aktiv",tagColor:C.teal,
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
  },
  {
    id:"e3",title:"Natur Retreat",category:"Wald & Kunst",
    dur:"3 Tage",spots:2,totalSpots:8,price:499,nextDate:"14. Jun",
    earnings:2994,resonance:4.8,tag:"2 frei",tagColor:"#8B5CF6",
    img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
  },
  {
    id:"e4",title:"Musikabend",category:"Klang & Verbindung",
    dur:"2,5 Std.",spots:18,totalSpots:30,price:39,nextDate:"6. Jun",
    earnings:468,resonance:4.7,tag:"Offen",tagColor:"#F59E0B",
    img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
  },
];

function ExpOwnerCard({ exp }) {
  const { props, scale } = usePress();
  const pct = Math.round(((exp.totalSpots - exp.spots) / Math.max(exp.totalSpots, 1)) * 100);

  return (
    <div {...props} style={{
      flexShrink:0,width:230,borderRadius:R.lg,overflow:"hidden",
      background:"white",boxShadow:Sh.md,
      cursor:"pointer",touchAction:"manipulation",
      transform:scale,transition:"transform .18s ease",
      border:"1px solid rgba(0,0,0,.04)",
    }}>
      {/* Cover */}
      <div style={{height:140,overflow:"hidden",position:"relative",background:C.creamWarm}}>
        <img src={exp.img} alt={exp.title}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";}}/>
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 55%)",
        }}/>
        <div style={{
          position:"absolute",top:10,left:10,
          background:exp.tagColor,color:"white",
          fontSize:8,fontWeight:800,borderRadius:99,padding:"3px 8px",letterSpacing:".03em",
        }}>{exp.tag}</div>
        {/* Earnings badge */}
        <div style={{
          position:"absolute",top:10,right:10,
          background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",
          borderRadius:99,padding:"3px 8px",
          fontSize:9,fontWeight:700,color:"white",
        }}>€{exp.earnings.toLocaleString("de-DE")}</div>
      </div>

      {/* Content */}
      <div style={{padding:"12px 13px 14px"}}>
        <div style={{fontSize:13,fontWeight:800,color:C.ink,letterSpacing:"-.02em",marginBottom:2}}>
          {exp.title}
        </div>
        <div style={{fontSize:10,color:C.muted,fontWeight:500,marginBottom:8}}>{exp.category}</div>

        {/* Meta row */}
        <div style={{display:"flex",gap:10,marginBottom:8,fontSize:9,color:C.muted}}>
          <span>⏱ {exp.dur}</span>
          <span>📅 {exp.nextDate}</span>
          <span>⭐ {exp.resonance}</span>
        </div>

        {/* Capacity bar */}
        <div>
          <div style={{
            display:"flex",justifyContent:"space-between",
            fontSize:9,color:C.muted,marginBottom:3,
          }}>
            <span>{exp.totalSpots - exp.spots}/{exp.totalSpots} Platze belegt</span>
            <span style={{color:pct>80?C.coral:C.teal,fontWeight:700}}>{pct}%</span>
          </div>
          <div style={{height:3,borderRadius:3,background:"rgba(0,0,0,.07)",overflow:"hidden"}}>
            <div style={{
              height:"100%",borderRadius:3,
              width:`${pct}%`,
              background:`linear-gradient(90deg,${C.teal},${pct>80?C.coral:C.tealLight})`,
              transition:"width 1s ease",
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function OwnerExperiences({ experiences }) {
  const ownerExpActions = useHuiActions();
  const { ref, style } = useEntry(80);
  const items = safeArr(experiences).length ? safeArr(experiences) : SEED_EXP;

  return (
    <div ref={ref} style={{ ...style, width:"100%", background:C.cream, padding:"22px 0 18px" }}>
      <div style={{
        padding:"0 18px 14px",
        display:"flex",justifyContent:"space-between",alignItems:"baseline",
      }}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
            Meine Erlebnisse
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>
            Deine aktiven kreativen Raume.
          </div>
        </div>
        <button
          onClick={() => ownerExpActions[A.OPEN_EXPERIENCE_MANAGER]?.()}
          style={{
            background:"none",border:"none",padding:0,
            fontSize:11,color:C.teal,fontWeight:700,cursor:"pointer",
            whiteSpace:"nowrap",touchAction:"manipulation",fontFamily:"inherit",
          }}>
          Alle verwalten →
        </button>
      </div>

      <div style={{
        display:"flex",gap:12,overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 6px",WebkitOverflowScrolling:"touch",
      }}>
        {items.map(e => <ExpOwnerCard key={e.id} exp={e}/>)}

        {/* Add new card */}
        <button
          onClick={() => ownerExpActions[A.CREATE_EXPERIENCE]?.()}
          style={{
            flexShrink:0,width:140,borderRadius:R.lg,
            border:`2px dashed ${C.teal}44`,
            background:"none",padding:0,cursor:"pointer",
            touchAction:"manipulation",fontFamily:"inherit",
            textAlign:"left",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:8,minHeight:240,
        }}>
          <div style={{
            width:40,height:40,borderRadius:"50%",
            background:`${C.teal}14`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:20,color:C.teal,
          }}>+</div>
          <span style={{fontSize:10,fontWeight:700,color:C.teal,textAlign:"center",lineHeight:1.3}}>
            Neues Erlebnis<br/>erstellen
          </span>
        </button>

        <div style={{flexShrink:0,width:6}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. LIVE ACTIVITY — "Dein Raum lebt"
// ═══════════════════════════════════════════════════════════════
const SEED_ACTIVITY = [
  { icon:"💛",text:"Mara hat dein Erlebnis gespeichert",time:"Vor 12 Min.",color:C.coral  },
  { icon:"📬",text:"Neue Buchungsanfrage eingegangen",  time:"Vor 34 Min.",color:C.teal   },
  { icon:"🌱",text:"Jonas hat ein Projekt unterstutzt", time:"Vor 1 Std.", color:"#22C55E" },
  { icon:"✨",text:"4 neue Menschen haben resoniert",   time:"Vor 2 Std.", color:"#8B5CF6" },
  { icon:"💬",text:"Lina hat einen Moment geteilt",     time:"Gestern",   color:C.coral  },
  { icon:"📅",text:"Atelier Workshop: 6/6 Platze",      time:"Gestern",   color:C.gold   },
];

function LiveActivity({ activity }) {
  const { ref, style } = useEntry(100);
  const items = safeArr(activity).length ? safeArr(activity) : SEED_ACTIVITY;

  return (
    <div ref={ref} style={{ ...style, width:"100%", background:"white", padding:"22px 18px" }}>
      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14,
      }}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>Dein Raum lebt</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Aktuelle Resonanz in deinem Universum.</div>
        </div>
        <span style={{fontSize:11,color:C.teal,fontWeight:700,cursor:"pointer"}}>Alle →</span>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {items.map((a,i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"11px 0",
            borderBottom:i<items.length-1?"1px solid rgba(0,0,0,.045)":"none",
          }}>
            <div style={{
              width:34,height:34,borderRadius:"50%",flexShrink:0,
              background:`${a.color}14`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
            }}>{a.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:C.ink,fontWeight:500,lineHeight:1.35}}>{a.text}</div>
            </div>
            <div style={{fontSize:9,color:C.muted,flexShrink:0,whiteSpace:"nowrap"}}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. EARNINGS + WIRKUNG — ruhige Wirkungskarten
// ═══════════════════════════════════════════════════════════════
function Sparkline({ vals = [], color = C.teal }) {
  const safe = vals.filter(n => typeof n === "number" && isFinite(n));
  if (safe.length < 2) return null;
  const max = Math.max(...safe, 1);
  const pts = safe.map((v, i) => `${(i / (safe.length - 1)) * 120},${26 - (v / max) * 22}`).join(" ");
  return (
    <svg width="120" height="28" viewBox="0 0 120 28" style={{ display:"block", overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" opacity=".80" />
    </svg>
  );
}

function WirkungCard({ icon, label, value, sub, color, spark }) {
  const { ref, style } = useEntry(0);
  return (
    <div ref={ref} style={{
      ...style,
      background:`${color}0A`,border:`1px solid ${color}18`,
      borderRadius:R.md,padding:"16px 14px",
    }}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>{label}</div>
          <div style={{fontSize:22,fontWeight:800,color:C.ink,letterSpacing:"-.04em",lineHeight:1}}>
            {value}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>{sub}</div>
        </div>
        <div style={{
          width:36,height:36,borderRadius:"50%",
          background:`${color}14`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
        }}>{icon}</div>
      </div>
      {spark && <Sparkline vals={spark} color={color}/>}
    </div>
  );
}

function OwnerEarnings({ profile }) {
  const { ref, style } = useEntry(80);
  const earnings  = safeNum(profile?.earnings_month, 2840);
  const books     = safeNum(profile?.bookings_month, 31);
  const projects  = safeNum(profile?.projects_supported, 18);
  const resonance = safeNum(profile?.resonance_rating, 4.8);
  const spark     = [380, 640, 510, 860, 740, 1050, 820, 1300, 990, 1440, 1200, earnings];

  return (
    <div ref={ref} style={{ ...style, width:"100%", background:C.cream, padding:"22px 18px" }}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
          Wirkung & Energiefluss
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>
          Deine kreative Energie in Zahlen.
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <WirkungCard icon="💰" label="Einnahmen diesen Monat" color={C.teal}
          value={`€${earnings.toLocaleString("de-DE")}`} sub="Nachster Auszahlungstag: 1. Jun"
          spark={spark}/>
        <WirkungCard icon="👥" label="Menschen begleitet" color="#6366F1"
          value={books} sub="+4 diese Woche"/>
        <WirkungCard icon="🌱" label="Unterstutzte Projekte" color={C.coral}
          value={projects} sub="3 aktiv · 15 abgeschlossen"/>
        <WirkungCard icon="⭐" label="Resonanzbewertung" color={C.gold}
          value={`${resonance}`} sub="Aus 31 Begegnungen"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. WELTEN — Portal entries
// ═══════════════════════════════════════════════════════════════
const WORLDS = [
  {id:"atelier", icon:"🎨",label:"Atelier",   sub:"Dein Raum",        color:C.coral,
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"},
  {id:"projekte",icon:"✨",label:"Projekte",  sub:"Wirkung schaffen", color:"#6366F1",
   img:"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=75"},
  {id:"natur",   icon:"🌿",label:"Natur",     sub:"Deine Quelle",     color:"#22C55E",
   img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=75"},
  {id:"reisen",  icon:"✈️",label:"Reisen",    sub:"Unterwegs",        color:C.teal,
   img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=75"},
  {id:"momente", icon:"📸",label:"Momente",   sub:"Deine Augenblicke",color:"#F59E0B",
   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=75"},
  {id:"musik",   icon:"🎵",label:"Musik",     sub:"Klang & Ausdruck", color:"#EC4899",
   img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&q=75"},
  {id:"gedanken",icon:"💭",label:"Gedanken",  sub:"Deine Impulse",    color:"#8B5CF6",
   img:"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&q=75"},
  {id:"community",icon:"👥",label:"Community",sub:"Dein Kreis",       color:"#0EA5E9",
   img:"https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=200&q=75"},
];

function WorldPortal({ world }) {
  const [hov, setHov] = useState(false);
  const { props, scale } = usePress();
  const portalActions = useHuiActions();
  return (
    <div {...props}
      onClick={() => portalActions[A.OPEN_WORLD]?.({ worldId: world.id, world })}
      onPointerEnter={()=>setHov(true)}
      onPointerLeave={()=>{setHov(false);}}
      style={{
        flexShrink:0,display:"flex",flexDirection:"column",
        alignItems:"center",gap:8,cursor:"pointer",width:78,
        touchAction:"manipulation",
        transform:scale,transition:"transform .18s ease",
      }}>
      <div style={{
        width:70,height:70,borderRadius:"50%",overflow:"hidden",position:"relative",
        border:`2.5px solid ${hov?world.color:"rgba(0,0,0,.08)"}`,
        boxShadow:hov?`0 0 0 5px ${world.color}18,0 8px 24px ${world.color}28`:Sh.sm,
        transition:"all .3s ease",
      }}>
        <img src={world.img} alt={world.label}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";e.target.parentNode.style.background=`${world.color}22`;}}/>
        <div style={{
          position:"absolute",inset:0,
          background:`radial-gradient(circle,${world.color}60 0%,${world.color}25 100%)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,
          opacity:hov?1:0,transition:"opacity .25s ease",
        }}>{world.icon}</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontSize:10,fontWeight:700,letterSpacing:"-.01em",
          color:hov?world.color:C.ink,transition:"color .25s ease",
        }}>{world.label}</div>
        <div style={{fontSize:8,color:C.muted,lineHeight:1.3,marginTop:1}}>{world.sub}</div>
      </div>
    </div>
  );
}

function OwnerSpaces({ spaces }) {
  const { ref, style } = useEntry(60);
  const worldMgmtActions = useHuiActions();
  const worlds = safeArr(spaces).length ? safeArr(spaces) : WORLDS;
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:"white", padding:"22px 0 18px" }}>
      <div style={{
        padding:"0 18px 14px",
        display:"flex",justifyContent:"space-between",alignItems:"baseline",
      }}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>Deine Welten</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Portale in deine kreativen Raume.</div>
        </div>
        <button
          onClick={() => worldMgmtActions[A.OPEN_WORLD]?.({ view:"manage" })}
          style={{
            background:"none",border:"none",padding:0,
            fontSize:11,color:C.teal,fontWeight:700,
            cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
          }}>Verwalten →</button>
      </div>
      <div style={{
        display:"flex",gap:14,overflowX:"auto",scrollbarWidth:"none",
        padding:"3px 18px 4px",WebkitOverflowScrolling:"touch",
      }}>
        {worlds.map(w=><WorldPortal key={w.id} world={w}/>)}
        <div style={{flexShrink:0,width:4}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. COMMUNITY — "Menschen in deinem Raum"
// ═══════════════════════════════════════════════════════════════
const SEED_COMMUNITY = [
  {id:"c1",name:"Mara",   role:"Wiederkehrende Gastgeberin",status:"Gerade aktiv",  statusColor:"#22C55E",av:"https://i.pravatar.cc/40?img=1",count:"7 Begegnungen"},
  {id:"c2",name:"Jonas",  role:"Atelier Workshop Gast",      status:"Plant Buchung", statusColor:C.teal,   av:"https://i.pravatar.cc/40?img=3",count:"3 Begegnungen"},
  {id:"c3",name:"Lina",   role:"Resoniert regelmassig",      status:"Verfolgt dich", statusColor:"#8B5CF6",av:"https://i.pravatar.cc/40?img=5",count:"12 Resonanzen"},
  {id:"c4",name:"Tobias", role:"Community-Supporter",         status:"Aktiv",         statusColor:C.coral,  av:"https://i.pravatar.cc/40?img=8",count:"5 Projekte"},
];

function CommunityMember({ m }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:12,
      padding:"12px 0",borderBottom:"1px solid rgba(0,0,0,.044)",
    }}>
      <img src={m.av} alt={m.name}
        style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",flexShrink:0,background:C.creamDeep}}
        onError={e=>{e.target.style.display="none";}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:13,fontWeight:700,color:C.ink,letterSpacing:"-.015em"}}>{m.name}</span>
          <span style={{fontSize:9,color:m.statusColor,fontWeight:700}}>● {m.status}</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:1}}>{m.role}</div>
      </div>
      <div style={{
        fontSize:9,color:C.muted,fontWeight:600,
        background:C.cream,borderRadius:99,padding:"3px 8px",flexShrink:0,
      }}>{m.count}</div>
    </div>
  );
}

function OwnerCommunity({ community }) {
  const { ref, style } = useEntry(80);
  const members = safeArr(community).length ? safeArr(community) : SEED_COMMUNITY;
  return (
    <div ref={ref} style={{ ...style, width:"100%", background:C.cream, padding:"22px 18px 28px" }}>
      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14,
      }}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C.ink,letterSpacing:"-.025em"}}>
            Menschen in deinem Raum
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>
            Wiederkehrende Verbindungen & aktive Resonanz.
          </div>
        </div>
        <span style={{fontSize:11,color:C.teal,fontWeight:700,cursor:"pointer"}}>Alle →</span>
      </div>

      <div style={{
        background:"white",borderRadius:R.md,
        padding:"2px 14px",
        boxShadow:Sh.xs,border:"1px solid rgba(0,0,0,.04)",
      }}>
        {members.map(m=><CommunityMember key={m.id} m={m}/>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT — CreatorProfilePage
// ═══════════════════════════════════════════════════════════════
export default function CreatorProfilePage({
  wirker:  rawWirker,
  profile: externalProfile,
  onClose,
  onAction,
}) {
  const raw     = externalProfile || rawWirker || {};
  const safe    = useMemo(() => createProfileItem(raw), [raw?.id, raw?.user_id]);
  const profile = safe?._raw || raw;

  const actions      = useHuiActions();
  const [actionError, setActionError] = useState(null);
  const handleClose  = useCallback(() => { onClose?.(); }, [onClose]);
  const handleAction = useCallback((k) => {
    setActionError(null);
    // Route known actions through engine, fallback to prop
    if (k === "chat")    return actions[A.OPEN_CHAT]?.({ source: S.OWNER_PROFILE });
    if (k === "impact")  return actions[A.OPEN_IMPACT]?.();
    if (k === "orb")     return actions[A.OPEN_ORB]?.();
    if (k === "booking") return actions[A.OPEN_BOOKING]?.({ source: S.OWNER_PROFILE });
    onAction?.(k);
  }, [actions, onAction]);

  // Owner Quick Action handler — wired to Action Engine
  const handleQuickAction = useCallback((label) => {
    setActionError(null);
    const MAP = {
      "Neues Erlebnis":  () => actions[A.CREATE_EXPERIENCE]?.(),
      "Raum offnen":     () => actions[A.OPEN_ROOM]?.(),
      "Moment teilen":   () => actions[A.OPEN_STORY_COMPOSER]?.(),
      "Community":       () => setActionError("Community-Ansicht ist noch nicht produktionsreif. Bitte nutze den sichtbaren Community-Bereich auf dieser Seite."),
      "Einnahmen":       () => setActionError("Einnahmen sind aktuell nur als Übersicht auf dieser Profilseite verfügbar."),
      "Kalender":        () => setActionError("Kalender-Verfügbarkeit ist noch nicht produktionsreif."),
      "Wirkung":         () => actions[A.OPEN_IMPACT]?.(),
      "Atelier":         () => actions[A.OPEN_OWN_PROFILE]?.(),
    };
    const fn = MAP[label];
    if (fn) fn();
    else onAction?.(label);
  }, [actions, onAction]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      overflowY:"auto", overflowX:"hidden",
      background:C.cream,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      WebkitOverflowScrolling:"touch",
      paddingBottom:"max(100px, calc(88px + env(safe-area-inset-bottom, 0px)))",
    }}>
      <style>{HUI.KEYFRAMES}</style>
      <style>{`*{box-sizing:border-box;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{display:none}`}</style>

      <OwnerHero    profile={profile} onClose={handleClose} />
      <QuickActions onAction={handleQuickAction} />
      {actionError && (
        <div style={{ margin:"12px 18px 0", padding:"12px 14px",
          borderRadius:R.md, background:"rgba(255,138,107,0.12)",
          border:"1px solid rgba(255,138,107,0.28)",
          color:C.ink2, fontSize:13, lineHeight:1.5 }}>
          <strong style={{ color:C.coral }}>Aktion nicht verfügbar.</strong>{" "}
          {actionError}
        </div>
      )}
      <OwnerExperiences experiences={null} />
      <LiveActivity activity={null} />
      <OwnerEarnings profile={profile} />
      <OwnerSpaces  spaces={null} />
      <OwnerCommunity community={null} />
    </div>
  );
}
