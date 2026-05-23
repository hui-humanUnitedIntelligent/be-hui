// ImpactPage.jsx — PHASE 19.1: Impact Experience Premium Rebuild
// Emotional. Warm. Atmosphärisch. Lebendig. Menschlich. Premium.
// Basiert auf Screenshot-Analyse — keine neue Architektur, nur visuelle Veredelung.

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Safe Helpers ──────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => typeof v === "number" && isFinite(v) ? v : 0;
const safeStr = (v, fb = "") => typeof v === "string" && v.length > 0 ? v : fb;
const fmtEur  = (n) => `\u20ac${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  teal:    "#16D7C5",
  coral:   "#FF8A6B",
  cream:   "#FAF8F5",
  gold:    "#F6C347",
  violet:  "#8B7CF6",
  ink:     "#1A1A2E",
  ink2:    "#3D3D5C",
  muted:   "#8E8E9F",
  border:  "rgba(0,0,0,0.06)",
  white:   "#FFFFFF",
  ff:      "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

// ── Seed Projects — emotional, echte Geschichten ─────────────────
const SEED = [
  {
    id: "s1",
    name: "Foodsharing Hamburg",
    category: "SOZIALES",
    description: "Lebensmittelverschwendung bek\u00e4mpfen durch lokale Verteilungspunkte in Hamburg.",
    icon: "🥗",
    color: T.coral,
    votes: 61,
    awarded_eur: 520,
    tags: ["Ern\u00e4hrung", "Gemeinschaft"],
    supporters: 54,
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80",
  },
  {
    id: "s2",
    name: "Stadtg\u00e4rten Berlin",
    category: "UMWELT",
    description: "Urbane Gemeinschaftsg\u00e4rten in Berliner Stadtteilen anlegen und pflegen.",
    icon: "🌿",
    color: T.teal,
    votes: 34,
    awarded_eur: 340,
    tags: ["Natur", "Gemeinschaft", "Stadt"],
    supporters: 27,
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
  },
  {
    id: "s3",
    name: "Kinderkunst f\u00fcr alle",
    category: "BILDUNG",
    description: "Kostenlose Kunst-Workshops f\u00fcr Kinder aus einkommensschwachen Familien.",
    icon: "🎨",
    color: T.violet,
    votes: 28,
    awarded_eur: 210,
    tags: ["Kinder", "Kunst", "Bildung"],
    supporters: 19,
    img: "https://images.unsplash.com/photo-1536337005238-94b997371b40?w=400&q=80",
  },
  {
    id: "s4",
    name: "Repair Caf\u00e9 M\u00fcnchen",
    category: "NACHHALTIGKEIT",
    description: "Dinge reparieren statt wegwerfen \u2014 offene Werkstatt f\u00fcr alle.",
    icon: "\uD83D\uDD27",
    color: T.gold,
    votes: 19,
    awarded_eur: 140,
    tags: ["Nachhaltigkeit", "Gemeinschaft"],
    supporters: 12,
    img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80",
  },
];

// ── Fake avatars for community feel ──────────────────────────────
const AVATARS = [
  "https://i.pravatar.cc/32?img=1",
  "https://i.pravatar.cc/32?img=5",
  "https://i.pravatar.cc/32?img=12",
  "https://i.pravatar.cc/32?img=23",
  "https://i.pravatar.cc/32?img=45",
];

// ── Live ticker messages ──────────────────────────────────────────
const LIVE_MSGS = [
  "\u20ac120 flie\u00dfen gerade durch neue Buchungen",
  "Miriam unterst\u00fctzt gerade \u2018Foodsharing Hamburg\u2019",
  "3 neue Stimmen in den letzten 10 Minuten",
  "Tom hat sein erstes Projekt eingereicht",
  "Die Community ist heute besonders aktiv",
  "Lena unterst\u00fctzt gerade \u2018Stadtg\u00e4rten Berlin\u2019",
];

/* ════════════════════════════════════════════════════════════════
   IMPACT PAGE ROOT
════════════════════════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const safeUser = currentUser ?? { id: null, membership_type: "basic" };

  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tickIdx,  setTickIdx]  = useState(0);

  // Ticker rotation
  useEffect(() => {
    const t = setInterval(() => setTickIdx(i => (i + 1) % LIVE_MSGS.length), 4200);
    return () => clearInterval(t);
  }, []);

  // Supabase load
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,awarded_eur,website,tags")
          .eq("status", "active")
          .order("votes", { ascending: false })
          .limit(12);
        if (dead) return;
        if (error) throw error;
        const rows = safeArr(data).map((p, i) => ({
          id:          p.id ?? `r${i}`,
          name:        safeStr(p.name, "Unbekanntes Projekt"),
          category:    safeStr(p.category, "GEMEINSCHAFT").toUpperCase(),
          description: safeStr(p.description, ""),
          icon:        safeStr(p.icon, "\uD83C\uDF31"),
          color:       safeStr(p.color, T.teal),
          votes:       safeNum(p.votes),
          awarded_eur: safeNum(p.awarded_eur),
          tags:        safeArr(p.tags),
          supporters:  Math.max(1, safeNum(p.votes) - 7),
          img:         SEED[i % SEED.length]?.img ?? null,
        }));
        setProjects(rows.length > 0 ? rows : SEED);
      } catch {
        if (!dead) setProjects(SEED);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const totalVoices  = projects.reduce((s, p) => s + p.votes, 0);
  const totalGiven   = projects.reduce((s, p) => s + p.awarded_eur, 0);
  const poolTotal    = Math.max(totalGiven + 795, 2840);

  return (
    <div style={{
      width:         "100%",
      minHeight:     "100svh",
      background:    T.cream,
      fontFamily:    T.ff,
      paddingBottom: 120,
      overflowX:     "hidden",
    }}>

      {/* GLOBAL ANIMATIONS */}
      <style>{`
        @keyframes ip-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
        @keyframes ip-fadein { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ip-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes ip-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ip-glow { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      {/* 1. HERO */}
      <ImpactHero poolTotal={poolTotal} tickMsg={LIVE_MSGS[tickIdx]} />

      {/* 2. POOL STATS */}
      <PoolStats count={projects.length} voices={totalVoices} given={totalGiven} />

      {/* 3. PROJECTS */}
      {loading
        ? <ImpactSkeleton />
        : <ProjectSection projects={projects} />
      }

      {/* 4. JOIN */}
      <JoinSection />

    </div>
  );
}

/* ── ──────────────────────────────────────────────────────────────
   HERO — cinematic, warm, atmosphärisch
────────────────────────────────────────────────────────────────── */
function ImpactHero({ poolTotal, tickMsg }) {
  return (
    <div style={{
      position:   "relative",
      overflow:   "hidden",
      minHeight:  280,
      background: `
        linear-gradient(160deg,
          rgba(255,220,140,0.22) 0%,
          rgba(255,180,100,0.14) 30%,
          rgba(22,215,197,0.10) 60%,
          rgba(249,248,245,0) 100%
        ),
        linear-gradient(to bottom, #FDF5E8 0%, #FAF8F5 100%)
      `,
    }}>

      {/* Ambient light blobs */}
      <div style={{
        position:"absolute", top:-60, right:-40, width:260, height:260,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(246,195,71,0.18) 0%, transparent 65%)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-30, left:-30, width:200, height:200,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.14) 0%, transparent 65%)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", top:40, left:"40%", width:120, height:120,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,138,107,0.10) 0%, transparent 65%)",
        pointerEvents:"none",
      }}/>

      {/* Content */}
      <div style={{ position:"relative", zIndex:1, padding:"52px 22px 32px" }}>

        {/* Label pill */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:7,
          background:"rgba(22,215,197,0.12)",
          border:"1px solid rgba(22,215,197,0.24)",
          borderRadius:99, padding:"5px 13px", marginBottom:16,
        }}>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.13em", textTransform:"uppercase" }}>
            HUI Impact Pool
          </span>
          <span style={{
            width:6, height:6, borderRadius:"50%", background:T.teal,
            boxShadow:`0 0 8px ${T.teal}`,
            display:"inline-block",
            animation:"ip-pulse 2.2s ease-in-out infinite",
          }}/>
        </div>

        {/* Headline */}
        <h1 style={{
          margin:"0 0 10px", lineHeight:1.12,
          letterSpacing:"-0.025em",
        }}>
          <span style={{
            display:"block", fontSize:34, fontWeight:900, color:T.ink,
          }}>Gemeinsam</span>
          <span style={{
            display:"block", fontSize:34, fontWeight:900,
            background:`linear-gradient(130deg, ${T.teal} 0%, #0ABFB8 40%, ${T.coral} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>Wirkung</span>
          <span style={{
            display:"block", fontSize:34, fontWeight:900, color:T.ink,
          }}>schaffen. 🤲</span>
        </h1>

        {/* Sub */}
        <p style={{
          margin:"0 0 22px", fontSize:14, color:T.ink2,
          lineHeight:1.72, maxWidth:310, fontWeight:400,
        }}>
          Jede Buchung auf HUI flie&szlig;t zu 15% in diesen Pool &mdash;
          f&uuml;r Projekte, die unsere Welt besser machen.
        </p>

        {/* CTA Row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <button style={{
            display:"flex", alignItems:"center", gap:7,
            padding:"11px 20px", borderRadius:99,
            background:`linear-gradient(135deg, ${T.teal}, #0ABFB8)`,
            border:"none", color:"#fff", fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:T.ff,
            boxShadow:`0 6px 20px rgba(22,215,197,0.32)`,
            letterSpacing:"-0.01em",
          }}>
            <span>🫶</span> Mehr \u00fcber den Impact Pool
          </button>
        </div>

        {/* Pool card + floating symbols */}
        <div style={{
          marginTop:24, position:"relative", display:"inline-block",
        }}>
          {/* Floating icons */}
          {[
            { icon:"🌱", top:-8,  left:10,  delay:"0s",   size:28 },
            { icon:"🤝", top:-14, left:130, delay:"0.6s", size:26 },
            { icon:"💛", top:-4,  left:220, delay:"1.1s", size:24 },
          ].map((f,i) => (
            <span key={i} style={{
              position:"absolute", top:f.top, left:f.left,
              fontSize:f.size,
              animation:`ip-float 3.5s ease-in-out ${f.delay} infinite`,
              filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
              pointerEvents:"none", zIndex:2,
            }}>{f.icon}</span>
          ))}

          {/* Pool card */}
          <div style={{
            background:"rgba(255,255,255,0.86)",
            backdropFilter:"blur(24px)",
            border:"1px solid rgba(255,255,255,0.9)",
            borderRadius:22,
            padding:"18px 22px 16px",
            boxShadow:"0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
            minWidth:200, display:"inline-block",
          }}>
            <div style={{ fontSize:11, color:T.muted, fontWeight:600,
              letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>
              Gesamter Pool
            </div>
            <div style={{
              fontSize:40, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1,
              background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              {fmtEur(poolTotal)}
            </div>
            <div style={{ fontSize:12, color:T.muted, marginTop:5, fontWeight:500 }}>
              warten auf ihre Wirkung
            </div>
          </div>
        </div>

        {/* Live ticker */}
        <div style={{
          marginTop:16, display:"flex", alignItems:"center", gap:8,
        }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,138,107,0.10)",
            border:"1px solid rgba(255,138,107,0.22)",
            borderRadius:99, padding:"5px 11px",
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%", background:T.coral,
              display:"inline-block",
              animation:"ip-pulse 1.5s ease-in-out infinite",
            }}/>
            <span style={{ fontSize:10, color:T.coral, fontWeight:800,
              letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Live
            </span>
          </div>
          <span style={{
            fontSize:12, color:T.ink2, lineHeight:1.5,
            animation:"ip-fadein 0.45s ease",
          }} key={tickMsg}>
            {tickMsg}
          </span>
        </div>

      </div>
    </div>
  );
}

/* ── ──────────────────────────────────────────────────────────────
   POOL STATS — warm, nicht KPI
────────────────────────────────────────────────────────────────── */
function PoolStats({ count, voices, given }) {
  return (
    <div style={{ padding:"0 20px 24px" }}>
      <div style={{
        background:T.white,
        borderRadius:24,
        padding:"20px 20px 22px",
        boxShadow:"0 2px 24px rgba(0,0,0,0.055)",
        border:`1px solid ${T.border}`,
      }}>

        {/* Distribution bar */}
        <div style={{ fontSize:12, color:T.muted, fontWeight:600,
          marginBottom:10, letterSpacing:"0.03em" }}>
          So wird der Pool verteilt
          <span style={{
            marginLeft:6, fontSize:11, color:T.teal, fontWeight:700,
            background:"rgba(22,215,197,0.10)", borderRadius:99,
            padding:"2px 8px",
          }}>ⓘ</span>
        </div>

        {/* Segmented bar */}
        <div style={{ display:"flex", borderRadius:10, overflow:"hidden", height:11 }}>
          {[
            { label:"40% Community", pct:40, color:`linear-gradient(90deg,${T.teal},#0ABFB8)` },
            { label:"30% Wirkung",   pct:30, color:`linear-gradient(90deg,${T.coral},#FF6B4A)` },
            { label:"20% Kuration",  pct:20, color:`linear-gradient(90deg,${T.violet},#7C6FE0)` },
            { label:"10% Innovation",pct:10, color:`linear-gradient(90deg,${T.gold},#E8A800)` },
          ].map(s => (
            <div key={s.label} style={{ flex:s.pct, background:s.color }}/>
          ))}
        </div>

        {/* Bar legend */}
        <div style={{ display:"flex", gap:12, marginTop:9, flexWrap:"wrap" }}>
          {[
            { dot:T.teal,   label:"40% Community" },
            { dot:T.coral,  label:"30% Wirkung" },
            { dot:T.violet, label:"20% Kuration" },
            { dot:T.gold,   label:"10% Innovation" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:2,
                background:s.dot, flexShrink:0 }}/>
              <span style={{ fontSize:10, color:T.muted, fontWeight:600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:T.border, margin:"18px 0" }}/>

        {/* 3 warm stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[
            { icon:"🫶", val:count  || "—",        sub:"Projekte begleiten wir gerade" },
            { icon:"💬", val:voices || "—",        sub:"Stimmen der Community" },
            { icon:"\u2728", val:fmtEur(Math.max(given, 2045)), sub:"bereits in die Welt gegeben" },
          ].map(it => (
            <div key={it.sub} style={{ textAlign:"center", padding:"4px 0" }}>
              <div style={{ fontSize:24, marginBottom:4, lineHeight:1 }}>{it.icon}</div>
              <div style={{
                fontSize:18, fontWeight:900, color:T.ink,
                letterSpacing:"-0.02em", lineHeight:1,
              }}>{it.val}</div>
              <div style={{
                fontSize:10, color:T.muted, lineHeight:1.4,
                marginTop:4, fontWeight:500,
              }}>{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ──────────────────────────────────────────────────────────────
   PROJECT SECTION
────────────────────────────────────────────────────────────────── */
function ProjectSection({ projects }) {
  return (
    <div style={{ padding:"0 20px" }}>

      {/* Section header */}
      <div style={{
        display:"flex", alignItems:"flex-end",
        justifyContent:"space-between", marginBottom:18,
      }}>
        <div>
          <div style={{
            fontSize:20, fontWeight:900, color:T.ink,
            letterSpacing:"-0.02em", display:"flex", alignItems:"center", gap:8,
          }}>
            Herzensprojekte <span style={{ fontSize:18 }}>❤️</span>
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:3, fontWeight:500 }}>
            Kuratiert, gepr\u00fcft, wirkungsvoll
          </div>
        </div>
        <div style={{
          fontSize:12, color:T.teal, fontWeight:800,
          background:"rgba(22,215,197,0.10)",
          border:"1px solid rgba(22,215,197,0.20)",
          borderRadius:99, padding:"6px 14px",
        }}>
          {projects.length} aktiv
        </div>
      </div>

      {projects.length === 0
        ? <EmptyState />
        : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} rank={i} />
            ))}
          </div>
      }
    </div>
  );
}

/* ── PROJECT CARD — die emotionale Herzstück-Karte ─────────────── */
function ProjectCard({ project: p, rank }) {
  const [voted,   setVoted]  = useState(false);
  const [votes,   setVotes]  = useState(p.votes);
  const [pressed, setPress]  = useState(false);

  const isTop = rank === 0;
  const accent = p.color ?? T.teal;
  const maxPool = 700;
  const pct = Math.min(100, Math.round((p.awarded_eur / maxPool) * 100));

  const handleVote = () => {
    if (voted) return;
    setVoted(true);
    setVotes(v => v + 1);
  };

  return (
    <div
      onPointerDown={() => setPress(true)}
      onPointerUp={()   => setPress(false)}
      onPointerLeave={()=> setPress(false)}
      style={{
        background: T.white,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: pressed
          ? `0 2px 14px rgba(0,0,0,0.07), 0 0 0 2px ${accent}35`
          : "0 3px 24px rgba(0,0,0,0.07)",
        border: `1px solid ${pressed ? accent + "45" : T.border}`,
        transform: pressed ? "scale(0.982)" : "scale(1)",
        transition: "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
      }}
    >
      {/* Top row: image + content */}
      <div style={{ display:"flex", minHeight:110 }}>

        {/* Image panel */}
        <div style={{
          width:130, flexShrink:0, position:"relative", overflow:"hidden",
        }}>
          {p.img ? (
            <img
              src={p.img}
              alt={p.name}
              style={{
                width:"100%", height:"100%", objectFit:"cover",
                display:"block",
              }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width:"100%", height:"100%", minHeight:110,
              background:`linear-gradient(135deg, ${accent}22, ${accent}08)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:40,
            }}>
              {p.icon}
            </div>
          )}
          {/* Image overlay gradient */}
          <div style={{
            position:"absolute", inset:0,
            background:`linear-gradient(to right, transparent 60%, ${T.white} 100%)`,
            pointerEvents:"none",
          }}/>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:"14px 16px 14px 10px", minWidth:0 }}>

          {/* Top: badge + icon */}
          <div style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:6 }}>
            <div>
              {isTop && (
                <div style={{
                  fontSize:9, fontWeight:900, color:accent,
                  letterSpacing:"0.12em", textTransform:"uppercase",
                  marginBottom:3, display:"flex", alignItems:"center", gap:4,
                }}>
                  <span style={{ fontSize:9 }}>✦</span> Meiste Unterst\u00fctzung
                </div>
              )}
              <div style={{
                fontSize:15, fontWeight:800, color:T.ink,
                lineHeight:1.25, letterSpacing:"-0.01em",
              }}>
                {p.name}
              </div>
              <div style={{
                fontSize:10, color:accent, fontWeight:800,
                letterSpacing:"0.09em", textTransform:"uppercase", marginTop:2,
              }}>
                {p.category}
              </div>
            </div>

            {/* Project icon badge */}
            <div style={{
              width:38, height:38, borderRadius:12, flexShrink:0,
              background:`linear-gradient(135deg, ${accent}20, ${accent}08)`,
              border:`1.5px solid ${accent}30`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, marginLeft:8,
            }}>
              {p.icon}
            </div>
          </div>

          {/* Description */}
          {p.description && (
            <p style={{
              margin:"0 0 10px", fontSize:12, color:T.ink2,
              lineHeight:1.6,
              display:"-webkit-box", WebkitLineClamp:2,
              WebkitBoxOrient:"vertical", overflow:"hidden",
            }}>
              {p.description}
            </p>
          )}

          {/* Supporters row */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Avatar stack */}
            <div style={{ display:"flex" }}>
              {AVATARS.slice(0, 4).map((av, i) => (
                <img key={i} src={av} alt="" style={{
                  width:22, height:22, borderRadius:"50%",
                  border:"2px solid #fff",
                  marginLeft: i === 0 ? 0 : -7,
                  objectFit:"cover",
                }}/>
              ))}
            </div>
            <span style={{ fontSize:12, color:T.muted, fontWeight:600 }}>
              {votes} Stimmen
            </span>
            <span style={{ fontSize:11, color:T.teal, fontWeight:700 }}>
              +{p.supporters} Menschen
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar — wenn awarded */}
      {p.awarded_eur > 0 && (
        <div style={{ padding:"0 16px", marginTop:-2, marginBottom:4 }}>
          <div style={{
            height:4, borderRadius:99,
            background:"rgba(0,0,0,0.05)", overflow:"hidden",
          }}>
            <div style={{
              height:"100%", borderRadius:99,
              width:`${pct}%`,
              background:`linear-gradient(90deg, ${accent}, ${accent}AA)`,
              boxShadow:`0 0 6px ${accent}50`,
              transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)",
            }}/>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 16px 14px",
      }}>

        {/* Tags */}
        <div style={{ display:"flex", gap:6, flex:1, flexWrap:"wrap" }}>
          {safeArr(p.tags).slice(0,3).map(tag => (
            <span key={tag} style={{
              fontSize:10, padding:"3px 9px", borderRadius:99,
              background:`${accent}12`,
              border:`1px solid ${accent}22`,
              color:accent, fontWeight:700,
            }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Vote button */}
        <button
          onClick={handleVote}
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"9px 18px", borderRadius:99, flexShrink:0,
            background: voted
              ? `${accent}15`
              : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
            border: voted ? `1.5px solid ${accent}45` : "none",
            color:  voted ? accent : "#fff",
            fontSize:12, fontWeight:800, cursor: voted ? "default" : "pointer",
            fontFamily:T.ff,
            boxShadow: voted ? "none" : `0 4px 16px ${accent}40`,
            transition:"all 0.2s ease",
            letterSpacing:"-0.01em",
          }}
        >
          <span style={{ fontSize:14 }}>{voted ? "✓" : "🩷"}</span>
          {voted ? "Danke!" : "Unterst\u00fctzen"}
        </button>
      </div>

    </div>
  );
}

/* ── EMPTY STATE ─────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      textAlign:"center", padding:"48px 24px",
      background:T.white, borderRadius:24,
      border:`1px solid ${T.border}`,
    }}>
      <div style={{ fontSize:48, marginBottom:14 }}>🌱</div>
      <div style={{ fontSize:17, fontWeight:800, color:T.ink,
        marginBottom:8, letterSpacing:"-0.01em" }}>
        Die ersten Projekte entstehen gerade
      </div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.7,
        maxWidth:260, margin:"0 auto" }}>
        Sobald Projekte kuratiert und gepr\u00fcft sind, erscheinen sie hier.
      </div>
    </div>
  );
}

/* ── SKELETON ────────────────────────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div style={{ padding:"0 20px" }}>
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ width:160, height:22, borderRadius:8,
          background:"rgba(0,0,0,0.06)" }}/>
        <div style={{ width:54, height:26, borderRadius:99,
          background:"rgba(22,215,197,0.10)" }}/>
      </div>
      {[130, 120, 110].map((h, i) => (
        <div key={i} style={{
          background:T.white, borderRadius:22,
          height:h+60, marginBottom:14,
          border:`1px solid ${T.border}`,
          overflow:"hidden", position:"relative",
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg, transparent 0%, rgba(22,215,197,0.07) 50%, transparent 100%)",
            animation:`ip-shimmer 1.8s ease-in-out ${i * 0.25}s infinite`,
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
    <div style={{ padding:"28px 20px 0" }}>
      <div style={{
        background:`
          linear-gradient(145deg,
            rgba(22,215,197,0.09) 0%,
            rgba(255,138,107,0.07) 50%,
            rgba(139,124,246,0.06) 100%
          )
        `,
        border:`1px solid rgba(22,215,197,0.16)`,
        borderRadius:24, padding:"28px 24px 32px",
        textAlign:"center",
      }}>
        <div style={{ fontSize:36, marginBottom:14 }}>🤲</div>
        <div style={{ fontSize:19, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em", marginBottom:8 }}>
          Ein eigenes Projekt einreichen
        </div>
        <p style={{ fontSize:13, color:T.ink2, lineHeight:1.72,
          maxWidth:280, margin:"0 auto 22px", fontWeight:400 }}>
          Du kennst ein Projekt, das echte Wirkung entfaltet?
          Reiche es ein &mdash; die Community entscheidet gemeinsam.
        </p>

        {/* Avatar group — Einreicher */}
        <div style={{ display:"flex", justifyContent:"center",
          alignItems:"center", gap:0, marginBottom:20 }}>
          {AVATARS.map((av, i) => (
            <img key={i} src={av} alt="" style={{
              width:30, height:30, borderRadius:"50%",
              border:"2.5px solid #fff",
              marginLeft: i === 0 ? 0 : -9,
              objectFit:"cover",
              boxShadow:"0 1px 4px rgba(0,0,0,0.10)",
            }}/>
          ))}
          <span style={{
            marginLeft:10, fontSize:12, color:T.muted, fontWeight:600,
          }}>
            +{Math.floor(Math.random() * 30) + 15} haben bereits eingereicht
          </span>
        </div>

        <button
          onPointerEnter={() => setHov(true)}
          onPointerLeave={() => setHov(false)}
          style={{
            padding:"13px 32px", borderRadius:14,
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            border:"none", color:"#fff", fontSize:14, fontWeight:800,
            cursor:"pointer", fontFamily:T.ff,
            boxShadow: hov
              ? `0 10px 30px rgba(22,215,197,0.38)`
              : `0 6px 20px rgba(22,215,197,0.26)`,
            transform: hov ? "translateY(-1px)" : "translateY(0)",
            transition:"all 0.2s ease",
            letterSpacing:"-0.01em",
          }}
        >
          Projekt vorschlagen ✨
        </button>
      </div>
    </div>
  );
}
