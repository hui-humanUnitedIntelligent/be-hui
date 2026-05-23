// ImpactPage.jsx — PHASE 19.3: Luxury Impact Feed Finishing
// Kein Rebuild. Bestehende Struktur. Nur Tiefe, Ruhe, Premium-Qualität.
// Editorial calm · Cinematic image world · Warm material system

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { HUI } from "../design/hui.design.js";

// ── Safe Helpers ──────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => typeof v === "number" && isFinite(v) ? v : 0;
const safeStr = (v, fb = "") => typeof v === "string" && v.length > 0 ? v : fb;
const fmtEur  = (n) => `\u20ac${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

// ── Luxury Design Tokens — verfeinert, tiefer, wärmer ────────────
const T = {
  // Brand — satter, reicher
  teal:      "#0DC4B5",
  tealLight: "#22DDD0",
  tealGlow:  "rgba(13,196,181,0.22)",
  coral:     "#F4714F",
  coralSoft: "#F99478",
  coralGlow: "rgba(244,113,79,0.20)",
  gold:      "#D4952A",
  goldSoft:  "#F0C46A",
  goldGlow:  "rgba(212,149,42,0.18)",
  violet:    "#7264D6",
  violetGlow:"rgba(114,100,214,0.18)",

  // Surfaces — warme Creme-Hierarchie
  page:      "#F8F4EE",       // Seitengrund — wärmer
  surface:   "#FDFAF5",       // Cards
  surfaceHigh:"#FFFFFF",      // Elevierte Cards
  hero:      "#FBF2E2",       // Hero-Fundament

  // Glass
  glass:     "rgba(255,252,246,0.85)",
  glassDeep: "rgba(255,250,242,0.92)",

  // Typography
  ink:       "#141422",       // fast Navy-Schwarz
  ink2:      "#38384F",       // Body
  muted:     "#898998",       // Labels
  faint:     "#C2C2D0",       // Sehr leise

  // Borders — fast unsichtbar
  line:      "rgba(0,0,0,0.048)",
  lineSoft:  "rgba(0,0,0,0.030)",

  ff: HUI.FONT.family,
};

// ── Schatten-System — luxuriös, diffus ────────────────────────────
const S = {
  card:    "0 2px 20px rgba(0,0,0,0.055), 0 1px 4px rgba(0,0,0,0.030)",
  cardHov: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.040)",
  glass:   "0 8px 40px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.030), inset 0 1px 0 rgba(255,255,255,0.95)",
  glassHeavy: "0 16px 56px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.040), inset 0 1px 0 rgba(255,255,255,0.98)",
  btn:     (c) => `0 4px 18px ${c}38, 0 1px 4px ${c}28`,
};

// ── Seed Projects ─────────────────────────────────────────────────
const SEED = [
  {
    id:"s1", name:"Foodsharing Hamburg", category:"Soziales",
    description:"T\u00e4glich helfen echte Menschen echten Menschen. Lokale Verteilungspunkte retten Lebensmittel \u2014 und verbinden Nachbarn.",
    icon:"🥗", color:T.coral, colorGlow:T.coralGlow,
    votes:61, awarded_eur:520,
    tags:["Ern\u00e4hrung","Gemeinschaft"], supporters:54,
    img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90",
  },
  {
    id:"s2", name:"Stadtg\u00e4rten Berlin", category:"Umwelt",
    description:"Gr\u00fcne Inseln inmitten der Stadt \u2014 Gemeinschaftsg\u00e4rten, die Nachbarschaft bedeuten und Natur zur\u00fcckbringen.",
    icon:"🌿", color:T.teal, colorGlow:T.tealGlow,
    votes:34, awarded_eur:340,
    tags:["Natur","Stadt"], supporters:27,
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=90",
  },
  {
    id:"s3", name:"Kinderkunst f\u00fcr alle", category:"Bildung",
    description:"Kreative Entfaltung ist kein Luxus. Jedes Kind verdient einen Ort, an dem es sich ausdr\u00fccken darf.",
    icon:"🎨", color:T.violet, colorGlow:T.violetGlow,
    votes:28, awarded_eur:210,
    tags:["Kinder","Kreativit\u00e4t"], supporters:19,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90",
  },
  {
    id:"s4", name:"Repair Caf\u00e9 M\u00fcnchen", category:"Nachhaltigkeit",
    description:"Dinge reparieren statt wegwerfen \u2014 eine offene Werkstatt, die Gemeinschaft und Ressourcen sch\u00fctzt.",
    icon:"\uD83D\uDD27", color:T.gold, colorGlow:T.goldGlow,
    votes:19, awarded_eur:140,
    tags:["Nachhaltigkeit","DIY"], supporters:12,
    img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=90",
  },
];

const HERO_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=92";

const AVATARS = [
  "https://i.pravatar.cc/40?img=1",
  "https://i.pravatar.cc/40?img=5",
  "https://i.pravatar.cc/40?img=12",
  "https://i.pravatar.cc/40?img=23",
  "https://i.pravatar.cc/40?img=45",
];

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
    const t = setInterval(() => setTickIdx(i => (i+1) % TICKS.length), 4600);
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
          colorGlow:   `${safeStr(p.color, T.teal)}33`,
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

  const voices = projects.reduce((s,p) => s + p.votes, 0);
  const given  = projects.reduce((s,p) => s + p.awarded_eur, 0);
  const pool   = Math.max(given + 795, 2840);

  return (
    <div style={{
      width:"100%", minHeight:"100svh",
      background:T.page, fontFamily:T.ff,
      paddingBottom:130, overflowX:"hidden",
    }}>

      {/* ── CSS keyframes — via HUI Design System ── */}
      <style>{HUI.KEYFRAMES.replace(/hui-/g,'ip-')}</style>

      {/* Sektionen fließen ineinander — kein harter Sprung */}
      <ImpactHero pool={pool} tick={TICKS[tickIdx]} />

      {/* Sanfter Übergang Hero → Stats */}
      <SectionBridge from={T.hero} to={T.page} />

      <PoolStats count={projects.length} voices={voices} given={given} />

      {/* Sanfter Übergang Stats → Projects */}
      <SectionBridge from={T.page} to={T.page} accent={T.teal} />

      {loading ? <ImpactSkeleton /> : <ProjectSection projects={projects} />}

      <JoinSection />
    </div>
  );
}

/* ── Sektion-Übergangs-Bridge — eliminiert harte Sprünge ─────────── */
function SectionBridge({ accent }) {
  return (
    <div style={{
      height:32, marginTop:-1,
      background: accent
        ? `linear-gradient(to bottom, transparent 0%, ${accent}08 50%, transparent 100%)`
        : "transparent",
      pointerEvents:"none",
    }}/>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
function ImpactHero({ pool, tick }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background:`
        radial-gradient(ellipse 120% 75% at 85% 25%, rgba(240,196,106,0.20) 0%, transparent 52%),
        radial-gradient(ellipse 75%  75% at  8% 12%, rgba(244,113,79,0.12)  0%, transparent 48%),
        radial-gradient(ellipse 55%  55% at 50% 95%, rgba(13,196,181,0.10)  0%, transparent 52%),
        linear-gradient(175deg, #FCF1E0 0%, #F8EFE0 40%, #F3EAD8 100%)
      `,
    }}>

      {/* Ambient blobs — atmen langsam */}
      <div style={{
        position:"absolute", top:-90, right:-70, width:340, height:340,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(230,165,50,0.15) 0%, transparent 58%)",
        animation:"ip-breathe 7s ease-in-out infinite",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-50, left:-60, width:280, height:280,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(13,196,181,0.12) 0%, transparent 58%)",
        animation:"ip-breathe 9s ease-in-out 1.5s infinite",
        pointerEvents:"none",
      }}/>

      {/* Community Bildwelt — cinematic */}
      <div style={{
        position:"absolute", top:0, right:0,
        width:"54%", height:"100%", overflow:"hidden",
      }}>
        <img
          src={HERO_IMG} alt="Community"
          loading="eager"
          style={{
            width:"100%", height:"100%", objectFit:"cover",
            objectPosition:"center 20%",
            // Warmes cinematic Color-Grading
            filter:"saturate(0.82) brightness(0.94) sepia(0.08)",
          }}
        />
        {/* Sanfter Links-Übergang — nicht abrupt */}
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(to right,
            #F5EAD6 0%,
            rgba(245,234,214,0.88) 12%,
            rgba(245,234,214,0.52) 35%,
            rgba(245,234,214,0.15) 60%,
            transparent 80%
          )`,
          pointerEvents:"none",
        }}/>
        {/* Unten-Übergang — fließt in Seite */}
        <div style={{
          position:"absolute", left:0, right:0, bottom:0, height:"45%",
          background:`linear-gradient(to top, ${T.hero} 0%, rgba(251,242,226,0.7) 50%, transparent 100%)`,
          pointerEvents:"none",
        }}/>
        {/* Cinematic vignette — oben */}
        <div style={{
          position:"absolute", left:0, right:0, top:0, height:"25%",
          background:"linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 100%)",
          pointerEvents:"none",
        }}/>

        {/* Floating symbols — über Bild, sanft */}
        {[
          { e:"🌱", t:"10%", r:"20%", d:"0s",   a:"ip-float",  s:30 },
          { e:"🤝", t:"30%", r:"7%",  d:"0.8s", a:"ip-floatB", s:26 },
          { e:"💛", t:"55%", r:"30%", d:"1.5s", a:"ip-float",  s:24 },
          { e:"✨", t:"72%", r:"10%", d:"0.5s", a:"ip-floatB", s:20 },
        ].map((f,i) => (
          <div key={i} style={{
            position:"absolute", top:f.t, right:f.r, fontSize:f.s,
            animation:`${f.a} 4.5s ease-in-out ${f.d} infinite`,
            filter:"drop-shadow(0 3px 12px rgba(0,0,0,0.16))",
            zIndex:2, pointerEvents:"none",
          }}>{f.e}</div>
        ))}
      </div>

      {/* LEFT — Content */}
      <div style={{
        position:"relative", zIndex:3,
        padding:"60px 22px 42px",
        maxWidth:370,
      }}>

        {/* Label */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(13,196,181,0.10)",
          border:"1px solid rgba(13,196,181,0.22)",
          borderRadius:99, padding:"6px 14px", marginBottom:22,
          backdropFilter:"blur(10px)",
        }}>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.14em", textTransform:"uppercase" }}>
            HUI Impact Pool
          </span>
          <span style={{
            width:6, height:6, borderRadius:"50%", background:T.teal,
            boxShadow:`0 0 10px ${T.teal}`,
            display:"inline-block",
            animation:"ip-pulse 2.6s ease-in-out infinite",
          }}/>
        </div>

        {/* Headline — größer, mehr Luft */}
        <h1 style={{ margin:"0 0 16px", padding:0 }}>
          <span style={{
            display:"block", fontSize:40, fontWeight:900,
            color:T.ink, lineHeight:1.06, letterSpacing:"-0.033em",
          }}>Gemeinsam</span>
          <span style={{
            display:"block", fontSize:40, fontWeight:900,
            lineHeight:1.06, letterSpacing:"-0.033em",
            background:`linear-gradient(125deg, ${T.tealLight} 0%, ${T.teal} 40%, ${T.coral} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            paddingBottom:2, // Verhindert Clipping
          }}>Wirkung</span>
          <span style={{
            display:"block", fontSize:40, fontWeight:900,
            color:T.ink, lineHeight:1.06, letterSpacing:"-0.033em",
          }}>schaffen.</span>
        </h1>

        {/* Sub — ruhiger, mehr Luft */}
        <p style={{
          margin:"0 0 28px", fontSize:15, color:T.ink2,
          lineHeight:1.78, maxWidth:286, fontWeight:380,
          letterSpacing:"-0.008em",
        }}>
          Jede Buchung auf HUI flie&szlig;t zu 15% in diesen Pool &mdash;
          f&uuml;r Projekte, die unsere Welt wirklich besser machen.
        </p>

        {/* Pool Card — echtes Premium-Glas */}
        <div style={{
          display:"inline-block",
          background:"rgba(255,251,244,0.88)",
          backdropFilter:"blur(32px) saturate(1.5)",
          border:"1px solid rgba(255,248,235,0.96)",
          borderRadius:22, padding:"20px 26px 18px",
          boxShadow:S.glassHeavy,
          marginBottom:22,
        }}>
          <div style={{
            fontSize:10, color:T.muted, fontWeight:700,
            letterSpacing:"0.09em", textTransform:"uppercase",
            marginBottom:6,
          }}>Gesamter Pool</div>
          <div style={{
            fontSize:44, fontWeight:900, letterSpacing:"-0.05em",
            lineHeight:1,
            background:`linear-gradient(125deg, ${T.teal} 0%, ${T.coral} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{fmtEur(pool)}</div>
          <div style={{
            fontSize:12, color:T.muted, marginTop:7,
            fontWeight:480, letterSpacing:"-0.005em",
          }}>warten auf ihre Wirkung</div>
        </div>

        {/* CTA — schlank, einladend */}
        <div style={{ marginBottom:20 }}>
          <button style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"11px 22px", borderRadius:99,
            background:`linear-gradient(135deg, ${T.teal} 0%, ${T.tealLight} 100%)`,
            border:"none", color:"#fff",
            fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow:S.btn(T.teal),
          }}>
            <span style={{ fontSize:14 }}>🫶</span>
            Mehr \u00fcber den Impact Pool
          </button>
        </div>

        {/* Live Ticker */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(244,113,79,0.09)",
            border:"1px solid rgba(244,113,79,0.22)",
            borderRadius:99, padding:"5px 12px",
            backdropFilter:"blur(8px)",
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%", background:T.coral,
              display:"inline-block",
              animation:"ip-pulse 1.8s ease-in-out infinite",
            }}/>
            <span style={{ fontSize:9, color:T.coral, fontWeight:900,
              letterSpacing:"0.13em", textTransform:"uppercase" }}>Live</span>
          </div>
          <span style={{
            fontSize:12, color:T.ink2, lineHeight:1.5,
            fontWeight:420, letterSpacing:"-0.005em",
            animation:"ip-fadein 0.55s ease",
          }} key={tick}>{tick}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   POOL STATS — lebendig, kein Analytics-Panel
══════════════════════════════════════════════════════════════════ */
function PoolStats({ count, voices, given }) {
  return (
    <div style={{ padding:"8px 18px 16px" }}>
      <div style={{
        background:T.glassDeep,
        backdropFilter:"blur(24px) saturate(1.4)",
        borderRadius:28, padding:"24px 22px 26px",
        boxShadow:S.glass,
        border:"1px solid rgba(255,250,240,0.98)",
      }}>

        {/* Bar header */}
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:14,
        }}>
          <span style={{
            fontSize:14, color:T.ink, fontWeight:700,
            letterSpacing:"-0.015em",
          }}>So wird der Pool verteilt</span>
          <div style={{
            width:24, height:24, borderRadius:"50%",
            background:"rgba(13,196,181,0.10)",
            border:"1px solid rgba(13,196,181,0.20)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, color:T.teal, fontWeight:700, cursor:"default",
          }}>i</div>
        </div>

        {/* Segment bar — höher, mit Gaps für Luxus-Gefühl */}
        <div style={{
          display:"flex", gap:3, borderRadius:12,
          height:12, overflow:"hidden",
        }}>
          {[
            { pct:40, bg:`linear-gradient(90deg,${T.teal},${T.tealLight})`,  glow:T.tealGlow },
            { pct:30, bg:`linear-gradient(90deg,${T.coral},${T.coralSoft})`, glow:T.coralGlow },
            { pct:20, bg:`linear-gradient(90deg,${T.violet},#9488E8)`,       glow:T.violetGlow },
            { pct:10, bg:`linear-gradient(90deg,${T.gold},${T.goldSoft})`,   glow:T.goldGlow },
          ].map((s,i) => (
            <div key={i} style={{
              flex:s.pct, background:s.bg,
              borderRadius:8,
              boxShadow:`0 2px 8px ${s.glow}`,
            }}/>
          ))}
        </div>

        {/* Legend — kompakter, luftiger */}
        <div style={{
          display:"flex", gap:16, marginTop:12,
          flexWrap:"wrap",
        }}>
          {[
            { c:T.teal,   l:"40% Community" },
            { c:T.coral,  l:"30% Wirkung"   },
            { c:T.violet, l:"20% Kuration"  },
            { c:T.gold,   l:"10% Innovation"},
          ].map(s => (
            <div key={s.l} style={{
              display:"flex", alignItems:"center", gap:6,
            }}>
              <div style={{
                width:8, height:8, borderRadius:3,
                background:s.c,
                boxShadow:`0 0 6px ${s.c}80`,
                flexShrink:0,
              }}/>
              <span style={{
                fontSize:11, color:T.muted, fontWeight:580,
                letterSpacing:"-0.008em",
              }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Subtiler Trennstrich — fast unsichtbar */}
        <div style={{
          height:1, margin:"20px 0",
          background:"linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 75%, transparent 100%)",
        }}/>

        {/* 3 Stats — mehr Luft, weniger Dashboard */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:10,
        }}>
          {[
            { icon:"🫶", val: count || "—",
              sub:  "Projekte\nbegleiten wir",
              accent: T.coral },
            { icon:"💬", val: voices || "—",
              sub:  "Stimmen der\nCommunity",
              accent: T.teal },
            { icon:"✨", val: fmtEur(Math.max(given, 2045)),
              sub:  "bereits in die\nWelt gegeben",
              accent: T.gold },
          ].map(it => (
            <div key={it.sub} style={{
              textAlign:"center",
              padding:"14px 6px 16px",
              background:"rgba(255,255,255,0.55)",
              borderRadius:20,
              border:"1px solid rgba(255,255,255,0.80)",
              boxShadow:"0 1px 6px rgba(0,0,0,0.030)",
            }}>
              <div style={{ fontSize:28, lineHeight:1, marginBottom:8 }}>{it.icon}</div>
              <div style={{
                fontSize:20, fontWeight:900, color:T.ink,
                letterSpacing:"-0.03em", lineHeight:1,
              }}>{it.val}</div>
              <div style={{
                fontSize:10, color:T.muted, lineHeight:1.5,
                marginTop:6, fontWeight:530,
                whiteSpace:"pre-line", letterSpacing:"-0.005em",
              }}>{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PROJECT SECTION
══════════════════════════════════════════════════════════════════ */
function ProjectSection({ projects }) {
  return (
    <div style={{ padding:"0 18px" }}>
      <div style={{
        display:"flex", alignItems:"flex-end",
        justifyContent:"space-between",
        marginBottom:22, paddingTop:8,
      }}>
        <div>
          <div style={{
            fontSize:23, fontWeight:900, color:T.ink,
            letterSpacing:"-0.028em", lineHeight:1,
            display:"flex", alignItems:"center", gap:10,
          }}>
            Herzensprojekte
            <span style={{ fontSize:20 }}>❤️</span>
          </div>
          <div style={{
            fontSize:13, color:T.muted, marginTop:5,
            fontWeight:480, letterSpacing:"-0.008em",
          }}>Kuratiert, gepr\u00fcft, wirkungsvoll</div>
        </div>
        <div style={{
          fontSize:12, color:T.teal, fontWeight:750,
          background:"rgba(13,196,181,0.09)",
          border:"1px solid rgba(13,196,181,0.20)",
          borderRadius:99, padding:"7px 16px",
          letterSpacing:"-0.01em",
        }}>{projects.length} aktiv</div>
      </div>

      {projects.length === 0
        ? <EmptyState />
        : <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {projects.map((p,i) => (
              <ProjectCard key={p.id} project={p} rank={i} />
            ))}
          </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PROJECT CARD — Editorial Calm · Story Energy · Luxury Material
══════════════════════════════════════════════════════════════════ */
function ProjectCard({ project:p, rank }) {
  const [voted,  setVoted]  = useState(false);
  const [votes,  setVotes]  = useState(p.votes);
  const [press,  setPress]  = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const isTop  = rank === 0;
  const accent = p.color ?? T.teal;
  const glow   = p.colorGlow ?? `${accent}33`;
  const pct    = Math.min(100, Math.round((p.awarded_eur / 700) * 100));

  return (
    <div
      onPointerDown={() => setPress(true)}
      onPointerUp={()   => setPress(false)}
      onPointerLeave={()=> setPress(false)}
      style={{
        background: T.surfaceHigh,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: press ? S.cardHov : S.card,
        border: `1px solid ${press ? accent+"38" : T.line}`,
        transform: press ? "scale(0.982)" : "scale(1)",
        // Spring easing für premium Touch-Gefühl
        transition: "transform 0.20s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.20s ease, border-color 0.20s ease",
      }}
    >

      {/* ── BILD — cinematic, 180px, volle Breite ── */}
      <div style={{
        width:"100%", height:182, position:"relative",
        background:`linear-gradient(145deg, ${accent}14, ${accent}05)`,
        overflow:"hidden",
      }}>
        {p.img && !imgErr ? (
          <img
            src={p.img} alt={p.name}
            onError={() => setImgErr(true)}
            style={{
              width:"100%", height:"100%",
              objectFit:"cover", display:"block",
              // Warmes cinematic grading
              filter:"saturate(0.85) brightness(0.97) sepia(0.06)",
            }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:60,
          }}>{p.icon}</div>
        )}

        {/* Atmosphärisches Bottom-Fade — weicher als vorher */}
        <div style={{
          position:"absolute", left:0, right:0, bottom:0, height:90,
          background:`linear-gradient(to top,
            ${T.surfaceHigh} 0%,
            rgba(255,255,255,0.80) 45%,
            transparent 100%
          )`,
          pointerEvents:"none",
        }}/>

        {/* Subtile Top-Vignette */}
        <div style={{
          position:"absolute", left:0, right:0, top:0, height:40,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, transparent 100%)",
          pointerEvents:"none",
        }}/>

        {/* Floating Accent-Glow im Bild */}
        <div style={{
          position:"absolute", bottom:-30, right:-30,
          width:120, height:120, borderRadius:"50%",
          background:`radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          pointerEvents:"none",
          animation:"ip-glow 4s ease-in-out infinite",
        }}/>

        {/* Top-left: Leading badge */}
        {isTop && (
          <div style={{
            position:"absolute", top:13, left:14,
            display:"inline-flex", alignItems:"center", gap:5,
            background:"rgba(255,252,248,0.90)",
            backdropFilter:"blur(14px)",
            border:`1px solid ${accent}28`,
            borderRadius:99, padding:"5px 13px",
            boxShadow:"0 2px 14px rgba(0,0,0,0.10)",
          }}>
            <span style={{
              fontSize:8, color:accent, fontWeight:900,
              letterSpacing:"0.12em", textTransform:"uppercase",
            }}>✦ Meiste Unterst\u00fctzung</span>
          </div>
        )}

        {/* Top-right: Kategorie */}
        <div style={{
          position:"absolute", top:13, right:14,
          background:"rgba(255,252,248,0.88)",
          backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,0.80)",
          borderRadius:99, padding:"5px 12px",
          boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        }}>
          <span style={{
            fontSize:9, color:T.ink2, fontWeight:750,
            letterSpacing:"0.07em", textTransform:"uppercase",
          }}>{p.category}</span>
        </div>
      </div>

      {/* ── BODY — mehr Luft, editorial ── */}
      <div style={{ padding:"20px 20px 22px" }}>

        {/* Name + Icon */}
        <div style={{
          display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:14,
          marginBottom:10,
        }}>
          <h3 style={{
            margin:0, fontSize:18, fontWeight:820,
            color:T.ink, lineHeight:1.20,
            letterSpacing:"-0.018em", flex:1,
          }}>{p.name}</h3>

          <div style={{
            width:44, height:44, borderRadius:15, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22,
            background:`linear-gradient(145deg, ${accent}18, ${accent}06)`,
            border:`1.5px solid ${accent}25`,
            boxShadow:`0 3px 10px ${glow}`,
          }}>{p.icon}</div>
        </div>

        {/* Description — mehr Luft */}
        {p.description && (
          <p style={{
            margin:"0 0 16px", fontSize:13, color:T.ink2,
            lineHeight:1.72, letterSpacing:"-0.006em",
            fontWeight:400,
            display:"-webkit-box", WebkitLineClamp:2,
            WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>{p.description}</p>
        )}

        {/* Progress — eleganter */}
        {p.awarded_eur > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:11, color:T.muted, marginBottom:6,
              fontWeight:550, letterSpacing:"-0.005em",
            }}>
              <span style={{ color:T.ink2, fontWeight:700 }}>
                {fmtEur(p.awarded_eur)} vergeben
              </span>
              <span>{pct}%</span>
            </div>
            <div style={{
              height:5, borderRadius:99,
              background:"rgba(0,0,0,0.048)",
              overflow:"hidden",
            }}>
              <div style={{
                height:"100%", borderRadius:99, width:`${pct}%`,
                background:`linear-gradient(90deg, ${accent}, ${accent}BB)`,
                boxShadow:`0 0 12px ${glow}`,
                transition:"width 1.8s cubic-bezier(0.22,1,0.36,1)",
              }}/>
            </div>
          </div>
        )}

        {/* Community row */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          marginBottom:18,
        }}>
          {/* Avatar stack */}
          <div style={{ display:"flex" }}>
            {AVATARS.slice(0,4).map((av,i) => (
              <img key={i} src={av} alt="" style={{
                width:27, height:27, borderRadius:"50%",
                border:"2.5px solid #fff",
                marginLeft: i===0 ? 0 : -9,
                objectFit:"cover",
                boxShadow:"0 1px 5px rgba(0,0,0,0.10)",
              }}/>
            ))}
          </div>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12, color:T.muted, fontWeight:550 }}>
              {votes} Stimmen
            </span>
            <span style={{
              fontSize:12, color:T.teal, fontWeight:720,
              marginLeft:7,
            }}>+{p.supporters}</span>
          </div>
          {/* 1 Tag — kompakt */}
          {safeArr(p.tags).slice(0,1).map(tag => (
            <span key={tag} style={{
              fontSize:10, padding:"4px 11px", borderRadius:99,
              background:`${accent}10`,
              border:`1px solid ${accent}20`,
              color:accent, fontWeight:700,
              letterSpacing:"-0.005em",
            }}>#{tag}</span>
          ))}
        </div>

        {/* CTA — schlank, warm, einladend (nicht aggressiv) */}
        <button
          onClick={() => { if(!voted){ setVoted(true); setVotes(v=>v+1); } }}
          style={{
            width:"100%",
            padding: voted ? "11px 0" : "12px 0",
            borderRadius:16,
            border: voted ? `1.5px solid ${accent}35` : "none",
            background: voted
              ? "transparent"
              : `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`,
            color:  voted ? accent : "#fff",
            fontSize:13, fontWeight:700,
            cursor: voted ? "default" : "pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow: voted ? "none" : S.btn(accent),
            transition:"all 0.24s ease",
            display:"flex", alignItems:"center",
            justifyContent:"center", gap:8,
          }}
        >
          <span style={{ fontSize:15 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Danke f\u00fcr deine Stimme" : "Unterst\u00fctzen"}</span>
        </button>

      </div>
    </div>
  );
}

/* ── EMPTY STATE ─────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      textAlign:"center", padding:"56px 28px",
      background:T.surfaceHigh, borderRadius:28,
      border:`1px solid ${T.line}`,
      boxShadow:S.card,
    }}>
      <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>🌱</div>
      <div style={{ fontSize:18, fontWeight:820, color:T.ink,
        marginBottom:10, letterSpacing:"-0.022em" }}>
        Erste Projekte entstehen gerade
      </div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.75,
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
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:22, paddingTop:8 }}>
        <div>
          <div style={{ width:186, height:26, borderRadius:10,
            background:"rgba(0,0,0,0.055)", marginBottom:7 }}/>
          <div style={{ width:148, height:14, borderRadius:7,
            background:"rgba(0,0,0,0.035)" }}/>
        </div>
        <div style={{ width:58, height:32, borderRadius:99,
          background:"rgba(13,196,181,0.10)" }}/>
      </div>
      {[182+80, 182+80, 182+70].map((h,i) => (
        <div key={i} style={{
          background:T.surfaceHigh, borderRadius:28,
          height:h, marginBottom:20,
          border:`1px solid ${T.line}`,
          overflow:"hidden", position:"relative",
          boxShadow:S.card,
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg, transparent 0%, rgba(13,196,181,0.055) 50%, transparent 100%)",
            animation:`ip-shimmer 2.2s ease-in-out ${i*0.35}s infinite`,
          }}/>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   JOIN SECTION
══════════════════════════════════════════════════════════════════ */
function JoinSection() {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ padding:"32px 18px 0" }}>
      <div style={{
        background:`
          radial-gradient(ellipse 85% 65% at 15% 0%,   rgba(13,196,181,0.09) 0%, transparent 55%),
          radial-gradient(ellipse 75% 75% at 85% 100%,  rgba(244,113,79,0.07) 0%, transparent 55%),
          rgba(255,252,246,0.75)
        `,
        backdropFilter:"blur(24px) saturate(1.3)",
        border:"1px solid rgba(255,252,244,0.96)",
        borderRadius:30, padding:"34px 26px 38px",
        textAlign:"center",
        boxShadow:`${S.glass}, 0 0 0 1px rgba(13,196,181,0.07)`,
      }}>
        <div style={{ fontSize:42, marginBottom:16, lineHeight:1 }}>🤲</div>

        <div style={{
          fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.028em", marginBottom:12,
        }}>Ein eigenes Projekt einreichen</div>

        <p style={{
          fontSize:14, color:T.ink2, lineHeight:1.76,
          maxWidth:290, margin:"0 auto 24px",
          fontWeight:390, letterSpacing:"-0.006em",
        }}>
          Du kennst ein Projekt, das echte Wirkung entfaltet?
          Reiche es ein &mdash; die Community entscheidet gemeinsam.
        </p>

        {/* Avatar row */}
        <div style={{
          display:"flex", justifyContent:"center",
          alignItems:"center", marginBottom:24,
        }}>
          {AVATARS.map((av,i) => (
            <img key={i} src={av} alt="" style={{
              width:33, height:33, borderRadius:"50%",
              border:"2.5px solid #fff",
              marginLeft: i===0 ? 0 : -10,
              objectFit:"cover",
              boxShadow:"0 2px 8px rgba(0,0,0,0.09)",
            }}/>
          ))}
          <span style={{
            marginLeft:13, fontSize:12, color:T.muted,
            fontWeight:600, letterSpacing:"-0.006em",
          }}>+28 haben bereits eingereicht</span>
        </div>

        <button
          onPointerEnter={() => setHov(true)}
          onPointerLeave={() => setHov(false)}
          style={{
            padding:"14px 38px", borderRadius:16,
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            border:"none", color:"#fff",
            fontSize:14, fontWeight:750, cursor:"pointer",
            fontFamily:T.ff, letterSpacing:"-0.01em",
            boxShadow: hov
              ? `0 14px 40px rgba(13,196,181,0.42), 0 4px 12px rgba(13,196,181,0.25)`
              : `0 6px 24px rgba(13,196,181,0.30), 0 2px 6px rgba(13,196,181,0.18)`,
            transform: hov ? "translateY(-2px) scale(1.015)" : "translateY(0) scale(1)",
            transition:"all 0.24s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          Projekt vorschlagen ✨
        </button>
      </div>
    </div>
  );
}
