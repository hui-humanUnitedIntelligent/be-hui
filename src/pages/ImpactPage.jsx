// ImpactPage.jsx — PHASE 19.2: Impact Premium Polish
// Kein Rebuild. Bestehende Richtung hochwertig veredelt.
// Cinematic depth · Premium material system · Story energy

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Safe Helpers ──────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => typeof v === "number" && isFinite(v) ? v : 0;
const safeStr = (v, fb = "") => typeof v === "string" && v.length > 0 ? v : fb;
const fmtEur  = (n) => `\u20ac${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

// ── Premium Design Tokens ─────────────────────────────────────────
const T = {
  // Core brand — tiefer, reicher
  teal:      "#0EC4B4",     // etwas tiefer als vorher
  tealLight: "#16D7C5",
  coral:     "#F97555",     // wärmer, weniger neon
  coralSoft: "#FF9B7A",
  gold:      "#E8A835",     // goldenes Abendlicht
  goldSoft:  "#F6C96B",
  violet:    "#7C6FE0",
  // Surfaces
  cream:     "#FAF7F2",     // wärmer
  creamDeep: "#F4EFE6",     // tiefes Creme für Hero
  white:     "#FFFFFF",
  glass:     "rgba(255,255,255,0.78)",
  glassDark: "rgba(255,252,248,0.88)",
  // Typography
  ink:       "#16162A",     // tiefer, fast Navy
  ink2:      "#3A3A54",
  muted:     "#8B8BA0",
  mutedLight:"#B4B4C8",
  // System
  border:    "rgba(0,0,0,0.055)",
  borderSoft:"rgba(0,0,0,0.035)",
  ff:        "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

// ── Seed Projects ─────────────────────────────────────────────────
const SEED = [
  {
    id:"s1", name:"Foodsharing Hamburg", category:"Soziales",
    description:"Lebensmittelverschwendung bek\u00e4mpfen durch lokale Verteilungspunkte \u2014 t\u00e4glich helfen echte Menschen echten Menschen.",
    icon:"🥗", color:T.coral, votes:61, awarded_eur:520,
    tags:["Ern\u00e4hrung","Gemeinschaft","Hamburg"], supporters:54,
    img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=85",
  },
  {
    id:"s2", name:"Stadtg\u00e4rten Berlin", category:"Umwelt",
    description:"Urbane Gemeinschaftsg\u00e4rten in Berliner Stadtteilen \u2014 gr\u00fcne Inseln inmitten der Stadt, f\u00fcr alle.",
    icon:"🌿", color:T.teal, votes:34, awarded_eur:340,
    tags:["Natur","Gemeinschaft","Berlin"], supporters:27,
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=85",
  },
  {
    id:"s3", name:"Kinderkunst f\u00fcr alle", category:"Bildung",
    description:"Kreative Entfaltung ist kein Luxus. Kostenlose Workshops f\u00fcr Kinder, die sonst keinen Zugang h\u00e4tten.",
    icon:"🎨", color:T.violet, votes:28, awarded_eur:210,
    tags:["Kinder","Kreativit\u00e4t","Bildung"], supporters:19,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=85",
  },
  {
    id:"s4", name:"Repair Caf\u00e9 M\u00fcnchen", category:"Nachhaltigkeit",
    description:"Dinge reparieren statt wegwerfen. Eine offene Werkstatt, die Gemeinschaft schafft.",
    icon:"\uD83D\uDD27", color:T.gold, votes:19, awarded_eur:140,
    tags:["Nachhaltigkeit","DIY","M\u00fcnchen"], supporters:12,
    img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=85",
  },
];

// ── Community Photo — emotionale Bildwelt im Hero ─────────────────
const HERO_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=90";

// ── Avatars ───────────────────────────────────────────────────────
const AVATARS = [
  "https://i.pravatar.cc/40?img=1",
  "https://i.pravatar.cc/40?img=5",
  "https://i.pravatar.cc/40?img=12",
  "https://i.pravatar.cc/40?img=23",
  "https://i.pravatar.cc/40?img=45",
];

// ── Live ticker ───────────────────────────────────────────────────
const TICKS = [
  "\u20ac120 flie\u00dfen gerade durch neue Buchungen",
  "Miriam unterst\u00fctzt gerade \u2018Foodsharing Hamburg\u2019",
  "3 neue Stimmen in den letzten 10 Minuten",
  "Tom hat sein erstes Projekt eingereicht",
  "Die Community ist heute besonders aktiv",
  "Lena unterst\u00fctzt \u2018Stadtg\u00e4rten Berlin\u2019",
];

/* ════════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tickIdx,  setTickIdx]  = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTickIdx(i => (i+1) % TICKS.length), 4400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,awarded_eur,website,tags")
          .eq("status","active")
          .order("votes",{ascending:false})
          .limit(12);
        if (dead) return;
        if (error) throw error;
        const rows = safeArr(data).map((p,i) => ({
          id:          p.id ?? `r${i}`,
          name:        safeStr(p.name,"Projekt"),
          category:    safeStr(p.category,"Gemeinschaft"),
          description: safeStr(p.description,""),
          icon:        safeStr(p.icon,"🌱"),
          color:       safeStr(p.color, T.teal),
          votes:       safeNum(p.votes),
          awarded_eur: safeNum(p.awarded_eur),
          tags:        safeArr(p.tags),
          supporters:  Math.max(1, safeNum(p.votes) - 7),
          img:         SEED[i % SEED.length]?.img ?? null,
        }));
        setProjects(rows.length > 0 ? rows : SEED);
      } catch { if (!dead) setProjects(SEED); }
      finally  { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  const voices   = projects.reduce((s,p) => s + p.votes, 0);
  const given    = projects.reduce((s,p) => s + p.awarded_eur, 0);
  const pool     = Math.max(given + 795, 2840);

  return (
    <div style={{
      width:"100%", minHeight:"100svh",
      background:T.cream, fontFamily:T.ff,
      paddingBottom:128, overflowX:"hidden",
    }}>

      {/* CSS animations — alle leichtgewichtig */}
      <style>{`
        @keyframes ip-pulse  { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:.35;transform:scale(.7)} }
        @keyframes ip-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ip-float  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
        @keyframes ip-floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-5px) rotate(-2deg)} }
        @keyframes ip-shimmer{ 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
        @keyframes ip-breathe{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      <ImpactHero pool={pool} tick={TICKS[tickIdx]} />
      <PoolStats count={projects.length} voices={voices} given={given} />
      {loading ? <ImpactSkeleton /> : <ProjectSection projects={projects} />}
      <JoinSection />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   HERO — cinematic depth, warmth, community image world
────────────────────────────────────────────────────────────────── */
function ImpactHero({ pool, tick }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      // Warmes goldenes Fundament
      background:`
        radial-gradient(ellipse 110% 70% at 80% 30%, rgba(246,201,107,0.22) 0%, transparent 55%),
        radial-gradient(ellipse 80%  80% at 10% 10%, rgba(255,149,117,0.14) 0%, transparent 50%),
        radial-gradient(ellipse 60%  60% at 50% 90%, rgba(14,196,180,0.11) 0%, transparent 55%),
        linear-gradient(175deg, #FDF4E7 0%, #F7F2EA 45%, #F2EDE3 100%)
      `,
    }}>

      {/* Ambient glow blobs — größer, weicher */}
      <div style={{
        position:"absolute", top:-80, right:-60, width:320, height:320,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(232,168,53,0.16) 0%, transparent 60%)",
        animation:"ip-breathe 6s ease-in-out infinite",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-40, left:-50, width:260, height:260,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(14,196,180,0.13) 0%, transparent 60%)",
        animation:"ip-breathe 8s ease-in-out 1s infinite",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", top:60, left:"35%", width:160, height:160,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(249,117,85,0.09) 0%, transparent 65%)",
        pointerEvents:"none",
      }}/>

      {/* Community Bildwelt — rechts/oben */}
      <div style={{
        position:"absolute", top:0, right:0,
        width:"52%", height:"100%",
        overflow:"hidden",
      }}>
        <img
          src={HERO_IMG}
          alt="Menschen gemeinsam"
          style={{
            width:"100%", height:"100%", objectFit:"cover",
            objectPosition:"center top",
            filter:"saturate(0.88) brightness(0.96)",
          }}
          loading="eager"
        />
        {/* Links-fade: Bild fließt sanft in den Content über */}
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(to right,
            ${T.cream.replace(")", ",1)")} 0%,
            rgba(242,237,227,0.92) 15%,
            rgba(242,237,227,0.55) 40%,
            transparent 75%
          )`.replace("rgba(242,237,227,1)", "#F2EDE3"),
          pointerEvents:"none",
        }}/>
        {/* Unten-fade */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, #FAF7F2 0%, transparent 35%)",
          pointerEvents:"none",
        }}/>

        {/* Floating Impact Symbols — über dem Bild */}
        {[
          { icon:"🌱", top:"12%", right:"18%", delay:"0s",   anim:"ip-float",  size:32 },
          { icon:"🤝", top:"28%", right:"6%",  delay:"0.7s", anim:"ip-floatB", size:28 },
          { icon:"💛", top:"52%", right:"28%", delay:"1.3s", anim:"ip-float",  size:26 },
          { icon:"✨", top:"68%", right:"8%",  delay:"0.4s", anim:"ip-floatB", size:22 },
        ].map((f,i) => (
          <div key={i} style={{
            position:"absolute", top:f.top, right:f.right,
            fontSize:f.size,
            animation:`${f.anim} 4s ease-in-out ${f.delay} infinite`,
            filter:"drop-shadow(0 3px 10px rgba(0,0,0,0.14))",
            zIndex:2,
          }}>{f.icon}</div>
        ))}
      </div>

      {/* LEFT — Content */}
      <div style={{
        position:"relative", zIndex:3,
        padding:"56px 22px 36px",
        maxWidth:380,
      }}>

        {/* Label */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(14,196,180,0.11)",
          border:"1px solid rgba(14,196,180,0.26)",
          borderRadius:99, padding:"5px 14px", marginBottom:20,
          backdropFilter:"blur(8px)",
        }}>
          <span style={{
            fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.14em", textTransform:"uppercase",
          }}>HUI Impact Pool</span>
          <span style={{
            width:6, height:6, borderRadius:"50%", background:T.teal,
            boxShadow:`0 0 10px ${T.teal}`,
            display:"inline-block",
            animation:"ip-pulse 2.4s ease-in-out infinite",
          }}/>
        </div>

        {/* Headline — Premium Typografie */}
        <h1 style={{ margin:"0 0 14px", padding:0 }}>
          <span style={{
            display:"block", fontSize:38, fontWeight:900,
            color:T.ink, lineHeight:1.08, letterSpacing:"-0.03em",
          }}>Gemeinsam</span>
          <span style={{
            display:"block", fontSize:38, fontWeight:900,
            lineHeight:1.08, letterSpacing:"-0.03em",
            background:`linear-gradient(128deg, ${T.tealLight} 0%, ${T.teal} 35%, ${T.coral} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>Wirkung</span>
          <span style={{
            display:"block", fontSize:38, fontWeight:900,
            color:T.ink, lineHeight:1.08, letterSpacing:"-0.03em",
          }}>schaffen.</span>
        </h1>

        {/* Sub — mehr Luft, bessere Lesbarkeit */}
        <p style={{
          margin:"0 0 26px", fontSize:15, color:T.ink2,
          lineHeight:1.75, maxWidth:290, fontWeight:400,
          letterSpacing:"-0.005em",
        }}>
          Jede Buchung auf HUI flie&szlig;t zu 15% in diesen Pool &mdash;
          f&uuml;r Projekte, die unsere Welt wirklich besser machen.
        </p>

        {/* Pool Card — Glassmorphism, eleviert */}
        <div style={{
          display:"inline-block",
          background:"rgba(255,255,255,0.82)",
          backdropFilter:"blur(28px) saturate(1.4)",
          border:"1px solid rgba(255,255,255,0.92)",
          borderRadius:22,
          padding:"18px 24px 16px",
          boxShadow:`
            0 16px 48px rgba(0,0,0,0.09),
            0 4px 16px rgba(0,0,0,0.055),
            inset 0 1px 0 rgba(255,255,255,0.95)
          `,
          marginBottom:18,
        }}>
          <div style={{
            fontSize:11, color:T.muted, fontWeight:600,
            letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:5,
          }}>Gesamter Pool</div>
          <div style={{
            fontSize:42, fontWeight:900, letterSpacing:"-0.045em",
            lineHeight:1,
            background:`linear-gradient(128deg, ${T.teal} 0%, ${T.coral} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{fmtEur(pool)}</div>
          <div style={{
            fontSize:12, color:T.muted, marginTop:6,
            fontWeight:500, letterSpacing:"-0.005em",
          }}>warten auf ihre Wirkung</div>
        </div>

        {/* CTA */}
        <div style={{ marginBottom:18 }}>
          <button style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"12px 22px", borderRadius:99,
            background:`linear-gradient(135deg, ${T.teal}, ${T.tealLight})`,
            border:"none", color:"#fff",
            fontSize:13, fontWeight:800, cursor:"pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow:`0 6px 24px rgba(14,196,180,0.34)`,
          }}>
            <span>🫶</span>
            <span>Mehr \u00fcber den Impact Pool</span>
          </button>
        </div>

        {/* Live Ticker */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(249,117,85,0.10)",
            border:"1px solid rgba(249,117,85,0.24)",
            borderRadius:99, padding:"5px 12px",
            backdropFilter:"blur(8px)",
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%", background:T.coral,
              display:"inline-block",
              animation:"ip-pulse 1.6s ease-in-out infinite",
            }}/>
            <span style={{
              fontSize:9, color:T.coral, fontWeight:900,
              letterSpacing:"0.12em", textTransform:"uppercase",
            }}>Live</span>
          </div>
          <span style={{
            fontSize:12, color:T.ink2, lineHeight:1.5,
            animation:"ip-fadein 0.5s ease",
            fontWeight:450,
          }} key={tick}>{tick}</span>
        </div>

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   POOL STATS — warm, lebendig, kein Dashboard
────────────────────────────────────────────────────────────────── */
function PoolStats({ count, voices, given }) {
  return (
    <div style={{ padding:"24px 18px 20px" }}>

      {/* Glassmorphism-Karte — warmer Glow */}
      <div style={{
        background:"rgba(255,255,255,0.86)",
        backdropFilter:"blur(20px) saturate(1.3)",
        borderRadius:26,
        padding:"22px 20px 24px",
        boxShadow:`
          0 4px 32px rgba(0,0,0,0.07),
          0 1px 8px rgba(0,0,0,0.04),
          inset 0 1px 0 rgba(255,255,255,0.98)
        `,
        border:"1px solid rgba(255,255,255,0.95)",
        // Sehr subtiler Glow am Rand
        outline:"1px solid rgba(14,196,180,0.08)",
        outlineOffset:"0px",
      }}>

        {/* Bar header */}
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:12,
        }}>
          <span style={{
            fontSize:13, color:T.ink, fontWeight:700,
            letterSpacing:"-0.01em",
          }}>So wird der Pool verteilt</span>
          <span style={{
            fontSize:11, color:T.teal, fontWeight:700,
            background:"rgba(14,196,180,0.10)",
            border:"1px solid rgba(14,196,180,0.18)",
            borderRadius:99, padding:"2px 9px",
          }}>ⓘ</span>
        </div>

        {/* Gradient segmented bar — höher, mehr Tiefe */}
        <div style={{
          display:"flex", borderRadius:12, overflow:"hidden",
          height:13,
          boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {[
            { pct:40, bg:`linear-gradient(90deg,${T.teal},${T.tealLight})` },
            { pct:30, bg:`linear-gradient(90deg,${T.coral},${T.coralSoft})` },
            { pct:20, bg:`linear-gradient(90deg,${T.violet},#9D90F5)` },
            { pct:10, bg:`linear-gradient(90deg,${T.gold},${T.goldSoft})` },
          ].map((s,i) => (
            <div key={i} style={{ flex:s.pct, background:s.bg }}/>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap" }}>
          {[
            { c:T.teal,   l:"40% Community" },
            { c:T.coral,  l:"30% Wirkung" },
            { c:T.violet, l:"20% Kuration" },
            { c:T.gold,   l:"10% Innovation" },
          ].map(s => (
            <div key={s.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{
                width:9, height:9, borderRadius:3,
                background:s.c, flexShrink:0,
                boxShadow:`0 0 5px ${s.c}60`,
              }}/>
              <span style={{
                fontSize:10, color:T.muted, fontWeight:600,
                letterSpacing:"-0.005em",
              }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Divider — sehr subtil */}
        <div style={{
          height:1, margin:"18px 0",
          background:"linear-gradient(90deg, transparent, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, transparent)",
        }}/>

        {/* 3 warm stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
          {[
            { icon:"🫶", val:count||"—",     sub:"Projekte begleiten\nwir gerade",   color:T.coral },
            { icon:"💬", val:voices||"—",    sub:"Stimmen der\nCommunity",          color:T.teal },
            { icon:"✨", val:fmtEur(Math.max(given,2045)), sub:"bereits in die\nWelt gegeben", color:T.gold },
          ].map(it => (
            <div key={it.sub} style={{
              textAlign:"center", padding:"8px 4px",
              background:"rgba(0,0,0,0.018)", borderRadius:16,
            }}>
              <div style={{ fontSize:26, lineHeight:1, marginBottom:6 }}>{it.icon}</div>
              <div style={{
                fontSize:19, fontWeight:900, color:T.ink,
                letterSpacing:"-0.025em", lineHeight:1,
              }}>{it.val}</div>
              <div style={{
                fontSize:10, color:T.muted, lineHeight:1.45,
                marginTop:5, fontWeight:500, whiteSpace:"pre-line",
              }}>{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   PROJECT SECTION
────────────────────────────────────────────────────────────────── */
function ProjectSection({ projects }) {
  return (
    <div style={{ padding:"0 18px" }}>

      {/* Section header */}
      <div style={{
        display:"flex", alignItems:"flex-end",
        justifyContent:"space-between",
        marginBottom:20, paddingTop:4,
      }}>
        <div>
          <div style={{
            fontSize:22, fontWeight:900, color:T.ink,
            letterSpacing:"-0.025em",
            display:"flex", alignItems:"center", gap:9,
          }}>
            Herzensprojekte
            <span style={{ fontSize:20 }}>❤️</span>
          </div>
          <div style={{
            fontSize:12, color:T.muted, marginTop:4,
            fontWeight:500, letterSpacing:"-0.005em",
          }}>Kuratiert, gepr\u00fcft, wirkungsvoll</div>
        </div>
        <div style={{
          fontSize:12, color:T.teal, fontWeight:800,
          background:"rgba(14,196,180,0.10)",
          border:"1px solid rgba(14,196,180,0.22)",
          borderRadius:99, padding:"6px 15px",
          letterSpacing:"-0.01em",
        }}>
          {projects.length} aktiv
        </div>
      </div>

      {projects.length === 0
        ? <EmptyState />
        : <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {projects.map((p,i) => <ProjectCard key={p.id} project={p} rank={i} />)}
          </div>
      }
    </div>
  );
}

/* ── PROJECT CARD — Story Energy, Premium Material ──────────────── */
function ProjectCard({ project:p, rank }) {
  const [voted,  setVoted]  = useState(false);
  const [votes,  setVotes]  = useState(p.votes);
  const [press,  setPress]  = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const isTop  = rank === 0;
  const accent = p.color ?? T.teal;
  const pct    = Math.min(100, Math.round((p.awarded_eur / 700) * 100));

  return (
    <div
      onPointerDown={() => setPress(true)}
      onPointerUp={()   => setPress(false)}
      onPointerLeave={()=> setPress(false)}
      style={{
        background:T.white,
        borderRadius:26,
        overflow:"hidden",
        // Premium layered shadow
        boxShadow: press
          ? `0 2px 16px rgba(0,0,0,0.08), 0 0 0 2.5px ${accent}40`
          : `0 4px 28px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.04)`,
        border:`1px solid ${press ? accent+"45" : "rgba(0,0,0,0.05)"}`,
        transform: press ? "scale(0.980)" : "scale(1)",
        transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      {/* IMAGE — größer, emotionaler, 160px */}
      <div style={{
        width:"100%", height:170, overflow:"hidden",
        position:"relative", flexShrink:0,
        background:`linear-gradient(135deg, ${accent}18, ${accent}06)`,
      }}>
        {p.img && !imgErr ? (
          <img
            src={p.img} alt={p.name}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:56, letterSpacing:0,
          }}>{p.icon}</div>
        )}

        {/* Unten-Overlay für sanften Übergang */}
        <div style={{
          position:"absolute", left:0, right:0, bottom:0, height:80,
          background:"linear-gradient(to top, rgba(255,255,255,0.96) 0%, transparent 100%)",
          pointerEvents:"none",
        }}/>

        {/* Top-left badge */}
        {isTop && (
          <div style={{
            position:"absolute", top:12, left:14,
            display:"inline-flex", alignItems:"center", gap:5,
            background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(12px)",
            borderRadius:99, padding:"5px 12px",
            boxShadow:"0 2px 12px rgba(0,0,0,0.12)",
          }}>
            <span style={{ fontSize:9, color:accent, fontWeight:900,
              letterSpacing:"0.1em", textTransform:"uppercase" }}>
              ✦ Meiste Unterst\u00fctzung
            </span>
          </div>
        )}

        {/* Category badge top-right */}
        <div style={{
          position:"absolute", top:12, right:14,
          background:"rgba(255,255,255,0.86)",
          backdropFilter:"blur(12px)",
          borderRadius:99, padding:"4px 11px",
          boxShadow:"0 2px 10px rgba(0,0,0,0.10)",
        }}>
          <span style={{
            fontSize:9, color:T.ink2, fontWeight:800,
            letterSpacing:"0.08em", textTransform:"uppercase",
          }}>{p.category}</span>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding:"16px 18px 18px" }}>

        {/* Name + icon */}
        <div style={{
          display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:12, marginBottom:8,
        }}>
          <h3 style={{
            margin:0, fontSize:17, fontWeight:800,
            color:T.ink, lineHeight:1.22, letterSpacing:"-0.015em",
            flex:1,
          }}>{p.name}</h3>
          <div style={{
            width:42, height:42, borderRadius:14, flexShrink:0,
            background:`linear-gradient(135deg, ${accent}20, ${accent}08)`,
            border:`1.5px solid ${accent}28`,
            display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:22,
          }}>{p.icon}</div>
        </div>

        {/* Description */}
        {p.description && (
          <p style={{
            margin:"0 0 12px", fontSize:13, color:T.ink2,
            lineHeight:1.68, letterSpacing:"-0.005em",
            display:"-webkit-box", WebkitLineClamp:2,
            WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>{p.description}</p>
        )}

        {/* Progress */}
        {p.awarded_eur > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:11, color:T.muted, marginBottom:5, fontWeight:500,
            }}>
              <span style={{ color:T.ink, fontWeight:700 }}>
                {fmtEur(p.awarded_eur)} vergeben
              </span>
              <span>{pct}%</span>
            </div>
            <div style={{
              height:6, borderRadius:99,
              background:"rgba(0,0,0,0.055)",
              overflow:"hidden",
              boxShadow:"inset 0 1px 2px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                height:"100%", borderRadius:99,
                width:`${pct}%`,
                background:`linear-gradient(90deg, ${accent}, ${accent}BB)`,
                boxShadow:`0 0 10px ${accent}55`,
                transition:"width 1.6s cubic-bezier(0.22,1,0.36,1)",
              }}/>
            </div>
          </div>
        )}

        {/* Community + CTA row */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Avatar stack — hochwertig */}
          <div style={{ display:"flex", alignItems:"center", gap:0 }}>
            {AVATARS.slice(0,4).map((av,i) => (
              <img key={i} src={av} alt="" style={{
                width:26, height:26, borderRadius:"50%",
                border:"2.5px solid #fff",
                marginLeft: i===0 ? 0 : -9,
                objectFit:"cover",
                boxShadow:"0 1px 4px rgba(0,0,0,0.10)",
              }}/>
            ))}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:T.muted, fontWeight:600,
              letterSpacing:"-0.005em" }}>
              {votes} Stimmen
              <span style={{
                color:T.teal, fontWeight:700, marginLeft:6,
              }}>+{p.supporters}</span>
            </div>
          </div>

          {/* Tags — nur 1-2, kompakt */}
          {safeArr(p.tags).slice(0,2).map(tag => (
            <span key={tag} style={{
              fontSize:10, padding:"3px 9px", borderRadius:99,
              background:`${accent}11`,
              border:`1px solid ${accent}22`,
              color:accent, fontWeight:700,
              flexShrink:0, letterSpacing:"-0.005em",
            }}>#{tag}</span>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          height:1, margin:"14px 0 14px",
          background:"linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent)",
        }}/>

        {/* Vote Button — full width, premium */}
        <button
          onClick={() => { if(!voted){setVoted(true);setVotes(v=>v+1);} }}
          style={{
            width:"100%", padding:"13px 0",
            borderRadius:14, border:"none",
            background: voted
              ? `${accent}12`
              : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
            border: voted ? `1.5px solid ${accent}40` : "1px solid transparent",
            color:  voted ? accent : "#fff",
            fontSize:14, fontWeight:800,
            cursor: voted ? "default" : "pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow: voted ? "none" : `0 6px 20px ${accent}42`,
            transition:"all 0.22s ease",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:8,
          }}
        >
          <span style={{ fontSize:16 }}>{voted ? "✓" : "🩷"}</span>
          {voted ? "Danke f\u00fcr deine Stimme!" : "Unterst\u00fctzen"}
        </button>

      </div>
    </div>
  );
}

/* ── EMPTY STATE ─────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      textAlign:"center", padding:"52px 24px",
      background:T.white, borderRadius:26,
      border:`1px solid ${T.border}`,
      boxShadow:"0 4px 24px rgba(0,0,0,0.055)",
    }}>
      <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>🌱</div>
      <div style={{ fontSize:18, fontWeight:800, color:T.ink,
        marginBottom:10, letterSpacing:"-0.02em" }}>
        Erste Projekte entstehen gerade
      </div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.72,
        maxWidth:260, margin:"0 auto", fontWeight:400 }}>
        Sobald Projekte kuratiert sind, erscheinen sie hier.
      </div>
    </div>
  );
}

/* ── SKELETON ────────────────────────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div style={{ padding:"0 18px" }}>
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:20,
      }}>
        <div>
          <div style={{ width:180, height:26, borderRadius:10,
            background:"rgba(0,0,0,0.06)", marginBottom:6 }}/>
          <div style={{ width:140, height:14, borderRadius:7,
            background:"rgba(0,0,0,0.04)" }}/>
        </div>
        <div style={{ width:54, height:30, borderRadius:99,
          background:"rgba(14,196,180,0.10)" }}/>
      </div>
      {[190, 180, 170].map((h,i) => (
        <div key={i} style={{
          background:T.white, borderRadius:26,
          height:h+100, marginBottom:16,
          border:`1px solid ${T.border}`,
          overflow:"hidden", position:"relative",
          boxShadow:"0 4px 24px rgba(0,0,0,0.055)",
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg, transparent 0%, rgba(14,196,180,0.06) 50%, transparent 100%)",
            animation:`ip-shimmer 2s ease-in-out ${i*0.3}s infinite`,
          }}/>
        </div>
      ))}
    </div>
  );
}

/* ── JOIN SECTION ────────────────────────────────────────────────── */
function JoinSection() {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ padding:"28px 18px 0" }}>
      <div style={{
        // Warmer atmosphärischer Hintergrund
        background:`
          radial-gradient(ellipse 80% 60% at 20% 0%,  rgba(14,196,180,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 80% 100%, rgba(249,117,85,0.08) 0%, transparent 55%),
          rgba(255,255,255,0.70)
        `,
        backdropFilter:"blur(20px)",
        border:"1px solid rgba(14,196,180,0.14)",
        borderRadius:28, padding:"32px 24px 36px",
        textAlign:"center",
        boxShadow:"0 4px 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize:40, marginBottom:14, lineHeight:1 }}>🤲</div>
        <div style={{
          fontSize:21, fontWeight:900, color:T.ink,
          letterSpacing:"-0.025em", marginBottom:10,
        }}>
          Ein eigenes Projekt einreichen
        </div>
        <p style={{
          fontSize:14, color:T.ink2, lineHeight:1.72,
          maxWidth:290, margin:"0 auto 22px",
          fontWeight:400, letterSpacing:"-0.005em",
        }}>
          Du kennst ein Projekt, das echte Wirkung entfaltet?
          Reiche es ein &mdash; die Community entscheidet gemeinsam.
        </p>

        {/* Avatar row */}
        <div style={{
          display:"flex", justifyContent:"center",
          alignItems:"center", marginBottom:22,
        }}>
          {AVATARS.map((av,i) => (
            <img key={i} src={av} alt="" style={{
              width:32, height:32, borderRadius:"50%",
              border:"2.5px solid #fff",
              marginLeft: i===0 ? 0 : -10,
              objectFit:"cover",
              boxShadow:"0 2px 6px rgba(0,0,0,0.10)",
            }}/>
          ))}
          <span style={{
            marginLeft:12, fontSize:12, color:T.muted,
            fontWeight:600, letterSpacing:"-0.005em",
          }}>+28 haben bereits eingereicht</span>
        </div>

        <button
          onPointerEnter={() => setHov(true)}
          onPointerLeave={() => setHov(false)}
          style={{
            padding:"14px 36px", borderRadius:16,
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            border:"none", color:"#fff",
            fontSize:15, fontWeight:800, cursor:"pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow: hov
              ? `0 12px 36px rgba(14,196,180,0.40)`
              : `0 6px 24px rgba(14,196,180,0.28)`,
            transform: hov ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
            transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          Projekt vorschlagen ✨
        </button>
      </div>
    </div>
  );
}
