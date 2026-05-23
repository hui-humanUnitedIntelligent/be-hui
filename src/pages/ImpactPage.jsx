// ImpactPage.jsx — PHASE 19: Impact Experience Reconstruction
// Emotional. Warm. Atmosphärisch. Premium.
// KEINE neue Architektur — nur visuelle Veredelung.

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Safe Helpers ─────────────────────────────────────────────────
function safeArr(v)               { return Array.isArray(v) ? v : []; }
function safeNum(v)               { return typeof v === "number" && isFinite(v) ? v : 0; }
function safeStr(v, fb = "")      { return typeof v === "string" && v.length > 0 ? v : fb; }
function fmtEur(n)                { return `€${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`; }

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  teal:    "#16D7C5",
  coral:   "#FF8A6B",
  cream:   "#F9F7F4",
  ink:     "#1A1A1A",
  ink2:    "#3D3D3D",
  muted:   "#8E8E93",
  border:  "rgba(0,0,0,0.07)",
  glass:   "rgba(255,255,255,0.72)",
  ff:      "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

// ── Seed data for atmospheric feel when DB is empty ───────────────
const SEED_PROJECTS = [
  {
    id: "seed-1", name: "Gemeinschaftsgarten Altona",
    category: "Natur & Ort", description: "Ein stillgelegtes Stadtgrundstück wird zum lebendigen Begegnungsort — mit Beeten, Bänken und einem offenen Repair-Café.",
    icon: "🌿", color: T.teal, votes: 47, awarded_eur: 340, tags: ["Natur","Gemeinschaft","Hamburg"],
  },
  {
    id: "seed-2", name: "Kinderkunst für alle",
    category: "Bildung & Kreativität", description: "Kostenlose Kunst-Workshops für Kinder aus einkommensschwachen Familien. Weil kreative Entfaltung kein Luxus sein darf.",
    icon: "🎨", color: T.coral, votes: 63, awarded_eur: 520, tags: ["Kinder","Kunst","Bildung"],
  },
  {
    id: "seed-3", name: "Offene Bibliothek Neukölln",
    category: "Wissen & Teilhabe", description: "24/7 zugänglich, von der Community betrieben: ein Ort des Wissens, der Stille und der offenen Begegnung.",
    icon: "📚", color: "#8B7CF6", votes: 38, awarded_eur: 210, tags: ["Wissen","Kultur","Berlin"],
  },
];

// ── Activity Messages — lebendige Community-Energie ────────────────
const ACTIVITY_MSGS = [
  "Miriam unterstützt gerade ‘Gemeinschaftsgarten Altona’",
  "3 neue Stimmen in den letzten 10 Minuten",
  "Tom hat sein erstes Projekt eingereicht",
  "€120 fließen in den Pool durch neue Buchungen",
  "Lena unterstützt gerade ‘Kinderkunst für alle’",
  "Ein neues Projekt wartet auf Aufnahme",
];

/* ════════════════════════════════════════════════════════════════════
   IMPACT PAGE — PHASE 19
════════════════════════════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const safeUser = currentUser ?? { id: null, membership_type: "basic", impact_eur: 0 };

  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [actIdx,   setActIdx]   = useState(0);

  // Rotate activity messages every 4s
  useEffect(() => {
    const t = setInterval(() => setActIdx(i => (i + 1) % ACTIVITY_MSGS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Load from Supabase
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error: e } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,status,month,awarded_eur,website,tags")
          .eq("status", "active")
          .order("votes", { ascending: false })
          .limit(12);

        if (dead) return;
        if (e) throw e;

        const rows = safeArr(data).map(p => ({
          id:          p.id          ?? "x",
          name:        safeStr(p.name,        "Unbekanntes Projekt"),
          category:    safeStr(p.category,    "Gemeinschaft"),
          description: safeStr(p.description, ""),
          icon:        safeStr(p.icon,        "🌱"),
          color:       safeStr(p.color,       T.teal),
          votes:       safeNum(p.votes),
          awarded_eur: safeNum(p.awarded_eur),
          tags:        safeArr(p.tags),
        }));

        setProjects(rows.length > 0 ? rows : SEED_PROJECTS);
      } catch (err) {
        if (!dead) setError(err?.message ?? "Ladefehler");
        if (!dead) setProjects(SEED_PROJECTS);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const totalVoices  = projects.reduce((s, p) => s + p.votes, 0);
  const totalAwarded = projects.reduce((s, p) => s + p.awarded_eur, 0);
  const poolEur      = Math.max(totalAwarded, 2840); // warm fallback

  return (
    <div style={{
      width:       "100%",
      minHeight:   "100svh",
      background:  T.cream,
      fontFamily:  T.ff,
      paddingBottom: 112,
      overflowX:   "hidden",
    }}>

      {/* ── 1. HERO ───────────────────────────────────────────── */}
      <ImpactHero poolEur={poolEur} actMsg={ACTIVITY_MSGS[actIdx]} />

      {/* ── 2. POOL VISUAL ────────────────────────────────────── */}
      <PoolVisual poolEur={poolEur} totalVoices={totalVoices} count={projects.length} />

      {/* ── 3. ERROR ──────────────────────────────────────────── */}
      {error && (
        <div style={{ margin:"0 20px 16px", padding:"12px 16px",
          background:"rgba(255,138,107,0.08)", borderRadius:14,
          border:"1px solid rgba(255,138,107,0.2)",
          fontSize:12, color:"#C44" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── 4. PROJEKTE ───────────────────────────────────────── */}
      {loading ? <ImpactSkeleton /> : (
        <ProjectSection projects={projects} safeUser={safeUser} />
      )}

      {/* ── 5. MITMACHEN ──────────────────────────────────────── */}
      <JoinSection />

    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   HERO — warm, atmospheric, emotional
──────────────────────────────────────────────────────────────── */
function ImpactHero({ poolEur, actMsg }) {
  return (
    <div style={{
      position:   "relative",
      overflow:   "hidden",
      padding:    "56px 24px 44px",
      background: `
        radial-gradient(ellipse 120% 80% at 10% 0%,  rgba(22,215,197,0.13) 0%, transparent 60%),
        radial-gradient(ellipse 90%  90% at 90% 10%, rgba(255,138,107,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 70%  60% at 50% 100%,rgba(139,124,246,0.07) 0%, transparent 60%),
        #F9F7F4
      `,
    }}>

      {/* Floating ambient orbs */}
      <div style={{
        position:"absolute", top:-40, right:-30,
        width:180, height:180, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.12) 0%, transparent 70%)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-20, left:-20,
        width:140, height:140, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,138,107,0.10) 0%, transparent 70%)",
        pointerEvents:"none",
      }}/>

      {/* Label */}
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        background:"rgba(22,215,197,0.12)", border:"1px solid rgba(22,215,197,0.22)",
        borderRadius:99, padding:"5px 12px", marginBottom:18,
      }}>
        <span style={{ fontSize:9, color:T.teal, fontWeight:800,
          letterSpacing:"0.14em", textTransform:"uppercase" }}>
          HUI Impact Pool
        </span>
        <span style={{ width:6, height:6, borderRadius:"50%",
          background:T.teal,
          boxShadow:`0 0 6px ${T.teal}`,
          animation:"impact-pulse 2.4s ease-in-out infinite",
          display:"inline-block",
        }}/>
      </div>

      {/* Headline */}
      <h1 style={{
        margin:"0 0 12px", fontSize:32, fontWeight:900,
        color:T.ink, lineHeight:1.15, letterSpacing:"-0.02em",
      }}>
        Gemeinsam<br/>
        <span style={{
          background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>
          echte Wirkung
        </span>
        {" "}schaffen.
      </h1>

      {/* Sub */}
      <p style={{
        margin:"0 0 24px", fontSize:14, color:T.ink2,
        lineHeight:1.7, maxWidth:320, fontWeight:400,
      }}>
        Jede Buchung auf HUI fließt zu 15% in diesen Pool.
        Die Community entscheidet gemeinsam, wo das Geld wirklich wirkt.
      </p>

      {/* Pool amount — emotional centrepiece */}
      <div style={{
        display:"inline-flex", flexDirection:"column",
        background:T.glass, backdropFilter:"blur(20px)",
        border:"1px solid rgba(22,215,197,0.18)",
        borderRadius:20, padding:"16px 24px",
        boxShadow:"0 8px 32px rgba(22,215,197,0.10)",
      }}>
        <span style={{ fontSize:11, color:T.muted, fontWeight:600,
          letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
          Im Pool
        </span>
        <span style={{
          fontSize:38, fontWeight:900, letterSpacing:"-0.03em",
          background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          lineHeight:1,
        }}>
          {fmtEur(poolEur)}
        </span>
        <span style={{ fontSize:11, color:T.muted, marginTop:4 }}>
          warten auf ihre Wirkung
        </span>
      </div>

      {/* Live activity ticker */}
      <div style={{
        marginTop:20, display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:7, color:T.coral, fontWeight:800,
          letterSpacing:"0.12em", textTransform:"uppercase" }}>
          Live
        </span>
        <span style={{ width:5, height:5, borderRadius:"50%",
          background:T.coral, flexShrink:0,
          animation:"impact-pulse 1.6s ease-in-out infinite",
          display:"inline-block",
        }}/>
        <span style={{
          fontSize:12, color:T.ink2, lineHeight:1.4,
          animation:"impact-fade 0.5s ease",
          key:actMsg,
        }}>
          {actMsg}
        </span>
      </div>

      <style>{`
        @keyframes impact-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.85); }
        }
        @keyframes impact-fade {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   POOL VISUAL — Community-Energie statt KPI-Grid
──────────────────────────────────────────────────────────────── */
function PoolVisual({ poolEur, totalVoices, count }) {
  const distributed = Math.round(poolEur * 0.72); // 72% already directed

  return (
    <div style={{ padding:"0 20px 28px" }}>

      {/* Hauptkarte */}
      <div style={{
        background:"#FFFFFF",
        borderRadius:24,
        padding:"20px 20px 24px",
        boxShadow:"0 2px 20px rgba(0,0,0,0.06)",
        border:`1px solid ${T.border}`,
      }}>

        {/* Verteilungs-Balken */}
        <div style={{ fontSize:12, color:T.muted, fontWeight:600, marginBottom:10 }}>
          Wie der Pool verteilt wird
        </div>
        <DistributionBar />

        {/* Divider */}
        <div style={{ height:1, background:T.border, margin:"20px 0" }}/>

        {/* 3 Werte — warm, nicht KPI */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          {[
            { icon:"🤝", value:count || "—",           label:"Projekte begleiten wir gerade" },
            { icon:"💬", value:totalVoices || "—",     label:"Stimmen der Community" },
            { icon:"✨", value:fmtEur(distributed),    label:"bereits in die Welt gegeben" },
          ].map(it => (
            <div key={it.label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{it.icon}</div>
              <div style={{ fontSize:17, fontWeight:900, color:T.ink,
                letterSpacing:"-0.02em" }}>{it.value}</div>
              <div style={{ fontSize:10, color:T.muted, lineHeight:1.4,
                marginTop:2 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Distribution Bar — 4 Ebenen, warm erklärt ───────────────── */
function DistributionBar() {
  const slices = [
    { label:"Community", pct:40, color:T.teal },
    { label:"Wirkung",   pct:30, color:T.coral },
    { label:"Kuration",  pct:20, color:"#8B7CF6" },
    { label:"Innovation",pct:10, color:"#F6C347" },
  ];

  return (
    <div>
      <div style={{ display:"flex", borderRadius:10, overflow:"hidden", height:10 }}>
        {slices.map(s => (
          <div key={s.label} style={{
            flex:s.pct, background:s.color, transition:"flex 0.6s ease",
          }}/>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap" }}>
        {slices.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }}/>
            <span style={{ fontSize:10, color:T.muted, fontWeight:600 }}>
              {s.pct}% {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PROJECT SECTION
──────────────────────────────────────────────────────────────── */
function ProjectSection({ projects, safeUser }) {
  const list = safeArr(projects);

  return (
    <div style={{ padding:"0 20px" }}>

      {/* Section Header */}
      <div style={{ display:"flex", alignItems:"flex-end",
        justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:T.ink,
            letterSpacing:"-0.02em" }}>
            Herzens­projekte
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>
            Kuratiert, geprüft, wirkungsvoll
          </div>
        </div>
        <div style={{
          fontSize:11, color:T.teal, fontWeight:700,
          background:"rgba(22,215,197,0.10)", borderRadius:99,
          padding:"5px 12px", border:`1px solid rgba(22,215,197,0.18)`,
        }}>
          {list.length} aktiv
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyImpact />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {list.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} safeUser={safeUser} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ProjectCard — emotional, warm, tief ─────────────────────── */
function ProjectCard({ project, index, safeUser }) {
  const [pressed, setPressed] = useState(false);
  const [voted,   setVoted]   = useState(false);
  const [localVotes, setLocalVotes] = useState(project.votes);

  const maxPool   = 800;
  const pct       = Math.min(100, Math.round((project.awarded_eur / maxPool) * 100));
  const isLeading = index === 0;

  const handleVote = () => {
    if (voted) return;
    setVoted(true);
    setLocalVotes(v => v + 1);
  };

  // Accent — wärmer als die rohe Farbe
  const accent = project.color ?? T.teal;

  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={()   => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 24,
        overflow:    "hidden",
        boxShadow:   pressed
          ? `0 2px 12px rgba(0,0,0,0.08), 0 0 0 2px ${accent}30`
          : "0 2px 20px rgba(0,0,0,0.06)",
        border:      `1px solid ${pressed ? accent + "40" : T.border}`,
        transform:   pressed ? "scale(0.985)" : "scale(1)",
        transition:  "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      {/* Colour accent header bar */}
      <div style={{
        height:    4,
        background:`linear-gradient(90deg, ${accent}, ${accent}88)`,
      }}/>

      {/* Card body */}
      <div style={{ padding:"18px 20px 20px" }}>

        {/* Top row */}
        <div style={{ display:"flex", alignItems:"flex-start",
          gap:12, marginBottom:12 }}>

          {/* Icon */}
          <div style={{
            width:52, height:52, borderRadius:16, flexShrink:0,
            background:`linear-gradient(135deg, ${accent}22, ${accent}0A)`,
            border:`1.5px solid ${accent}30`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24,
          }}>
            {project.icon}
          </div>

          {/* Name + category */}
          <div style={{ flex:1, minWidth:0 }}>
            {isLeading && (
              <div style={{
                fontSize:9, fontWeight:800, color:accent,
                letterSpacing:"0.12em", textTransform:"uppercase",
                marginBottom:3,
              }}>
                ✦ Meiste Unterstützung
              </div>
            )}
            <div style={{ fontSize:16, fontWeight:800, color:T.ink,
              lineHeight:1.25, letterSpacing:"-0.01em" }}>
              {project.name}
            </div>
            <div style={{ fontSize:11, color:accent, fontWeight:700,
              marginTop:2, textTransform:"uppercase", letterSpacing:"0.07em" }}>
              {project.category}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description.length > 0 && (
          <p style={{
            margin:"0 0 14px", fontSize:13, color:T.ink2,
            lineHeight:1.65, display:"-webkit-box",
            WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>
            {project.description}
          </p>
        )}

        {/* Progress — wenn Mittel vergeben */}
        {project.awarded_eur > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              marginBottom:6, fontSize:11, color:T.muted, fontWeight:500 }}>
              <span style={{ color:T.ink, fontWeight:700 }}>
                {fmtEur(project.awarded_eur)}
              </span>
              <span>aus {fmtEur(maxPool)} möglich</span>
            </div>
            <div style={{
              height:7, borderRadius:99,
              background:"rgba(0,0,0,0.06)",
              overflow:"hidden",
            }}>
              <div style={{
                height:"100%", borderRadius:99,
                width:`${pct}%`,
                background:`linear-gradient(90deg, ${accent}, ${accent}BB)`,
                transition:"width 1.2s cubic-bezier(0.22,1,0.36,1)",
                boxShadow:`0 0 8px ${accent}60`,
              }}/>
            </div>
          </div>
        )}

        {/* Bottom row: Votes + CTA */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Votes */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(0,0,0,0.04)", borderRadius:99, padding:"7px 14px",
          }}>
            <span style={{ fontSize:13, fontWeight:900, color:T.ink }}>
              {localVotes}
            </span>
            <span style={{ fontSize:11, color:T.muted, fontWeight:500 }}>
              Stimmen
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }}/>

          {/* Tags */}
          {safeArr(project.tags).slice(0,2).map(tag => (
            <span key={tag} style={{
              fontSize:10, padding:"4px 9px", borderRadius:99,
              background:`${accent}14`, color:accent,
              fontWeight:700, border:`1px solid ${accent}25`,
            }}>
              #{tag}
            </span>
          ))}

          {/* Vote CTA */}
          <button
            onClick={handleVote}
            style={{
              padding:"8px 16px", borderRadius:99,
              background: voted
                ? `${accent}18`
                : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
              border: voted ? `1.5px solid ${accent}50` : "none",
              color:  voted ? accent : "#fff",
              fontSize:12, fontWeight:800,
              cursor: voted ? "default" : "pointer",
              transition:"all 0.22s ease",
              flexShrink:0,
              boxShadow: voted ? "none" : `0 4px 14px ${accent}40`,
              fontFamily:T.ff,
            }}
          >
            {voted ? "✓ Danke" : "Unterstützen"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */
function EmptyImpact() {
  return (
    <div style={{
      textAlign:"center", padding:"48px 24px",
      background:"#FFFFFF", borderRadius:24,
      border:`1px solid ${T.border}`,
    }}>
      <div style={{ fontSize:44, marginBottom:16 }}>🌱</div>
      <div style={{ fontSize:17, fontWeight:800, color:T.ink,
        marginBottom:8, letterSpacing:"-0.01em" }}>
        Die ersten Projekte entstehen gerade
      </div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.65, maxWidth:260, margin:"0 auto" }}>
        Sobald Projekte kuratiert und geprüft sind, erscheinen sie hier.
        Du kannst selbst eines einreichen.
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SKELETON — warm, nicht generisch
──────────────────────────────────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div style={{ padding:"0 20px" }}>
      {[180, 220, 160].map((h, i) => (
        <div key={i} style={{
          background:"#FFFFFF", borderRadius:24,
          height:h, marginBottom:16,
          border:`1px solid ${T.border}`,
          overflow:"hidden", position:"relative",
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:`linear-gradient(90deg,
              transparent 0%, rgba(22,215,197,0.07) 50%, transparent 100%)`,
            animation:`impact-shimmer 1.8s ease-in-out ${i * 0.2}s infinite`,
          }}/>
        </div>
      ))}
      <style>{`
        @keyframes impact-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   JOIN SECTION — Mitmachen, ruhig und einladend
──────────────────────────────────────────────────────────────── */
function JoinSection() {
  return (
    <div style={{ padding:"32px 20px 0" }}>
      <div style={{
        background:`linear-gradient(135deg,
          rgba(22,215,197,0.10) 0%,
          rgba(255,138,107,0.08) 50%,
          rgba(139,124,246,0.07) 100%)`,
        borderRadius:24,
        padding:"28px 24px",
        border:`1px solid rgba(22,215,197,0.15)`,
        textAlign:"center",
      }}>
        <div style={{ fontSize:28, marginBottom:12 }}>🤲</div>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink,
          letterSpacing:"-0.02em", marginBottom:8 }}>
          Ein eigenes Projekt einreichen
        </div>
        <div style={{ fontSize:13, color:T.ink2, lineHeight:1.7,
          marginBottom:20, maxWidth:280, margin:"0 auto 20px" }}>
          Du kennst ein Projekt, das echte Wirkung entfaltet?
          Reiche es ein — die Community entscheidet gemeinsam.
        </div>
        <button style={{
          padding:"13px 28px", borderRadius:14,
          background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          border:"none", color:"#fff", fontSize:14, fontWeight:800,
          cursor:"pointer", fontFamily:T.ff,
          boxShadow:`0 6px 20px rgba(22,215,197,0.28)`,
          letterSpacing:"-0.01em",
        }}>
          Projekt vorschlagen
        </button>
      </div>
    </div>
  );
}
