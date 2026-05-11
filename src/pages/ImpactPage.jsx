// ImpactPage.jsx — Cinematic, emotional, human story experience
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/* ── Brand ──────────────────────────────────── */
const C = {
  teal:      "#16D7C5",
  teal2:     "#11C5B7",
  tealPale:  "#E6FAF8",
  tealGlow:  "rgba(22,215,197,0.22)",
  coral:     "#FF8A6B",
  coralPale: "#FFF2EE",
  cream:     "#F9F6F2",
  warm:      "#FFF9F4",
  card:      "#FFFFFF",
  ink:       "#1A1A1A",
  ink2:      "#3A3A3A",
  muted:     "#888",
  muted2:    "#BBB",
  border:    "rgba(0,0,0,0.06)",
  gold:      "#F5A623",
  green:     "#3DB87A",
  sage:      "#8BAF8B",
};

/* ── Mock projects ───────────────────────────── */
const PROJECTS = [
  {
    id:1,
    title:"Bildung für Kinder in indigenen Gemeinden",
    short:"Lernräume, die Zukunft öffnen.",
    story:`Tief im kolumbianischen Regenwald, wo Straßen enden und Stille beginnt, bauen wir Schulen. Nicht aus Beton — aus Hoffnung.

Seit 2023 haben wir drei Lernzentren eröffnet. 134 Kinder lernen jetzt lesen. Nicht weil jemand ihnen etwas gegeben hat — sondern weil Menschen wie du Teil davon wurden.`,
    location:"Kolumbien",
    category:"Bildung",
    categoryColor:"#3DB87A",
    img:"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1509099652299-30938b0aeb63?w=900&q=90",
    raised:48650,
    goal:80000,
    supporters:1248,
    goals:[
      {label:"3 Lernzentren aufbauen",    done:true,  progress:"2/3"},
      {label:"200 Kinder fördern",         done:true,  progress:"134/200"},
      {label:"Lehrmaterialien stellen",    done:true,  progress:"✓"},
    ],
    votes:0,
  },
  {
    id:2,
    title:"Schutz der Meere und ihrer Bewohner",
    short:"Wir schützen, was uns schützt.",
    story:`Die Korallen vor Indonesien sterben leise. Aber sie sterben nicht still.

Unser Team aus lokalen Tauchern und Meeresbiologen pflanzt Korallen zurück. Überwacht Ökosysteme. Und bildet die nächste Generation von Meereshütern aus.`,
    location:"Indonesien",
    category:"Ozean",
    categoryColor:"#16D7C5",
    img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=900&q=90",
    raised:36200,
    goal:80000,
    supporters:876,
    goals:[
      {label:"500 Korallen gepflanzt",    done:true,  progress:"✓"},
      {label:"Schutzzone eingerichtet",   done:false, progress:"in Arbeit"},
      {label:"50 Guides ausgebildet",     done:false, progress:"28/50"},
    ],
    votes:0,
  },
  {
    id:3,
    title:"Stadtgärten als Begegnungsorte",
    short:"Wo Erde wächst, wächst Gemeinschaft.",
    story:`Berlin, Frankfurt, Hamburg. Zwischen Asphalt und Hochhäusern entstehen Orte, die atmen.

Gemeinschaftsgärten, in denen Menschen verschiedenster Herkunft gemeinsam pflanzen, ernten — und sich zum ersten Mal begegnen.`,
    location:"Deutschland",
    category:"Gemeinschaft",
    categoryColor:"#F5A623",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=90",
    raised:12800,
    goal:40000,
    supporters:412,
    goals:[
      {label:"12 Gärten angelegt",        done:false, progress:"8/12"},
      {label:"1000 Teilnehmer",           done:false, progress:"680/1000"},
    ],
    votes:0,
  },
];

/* ─── Global styles ─────────────────────────── */
const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideUp {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes breathe {
    0%,100% { transform:scale(1);    opacity:0.85; }
    50%      { transform:scale(1.06); opacity:1; }
  }
  @keyframes pulse-glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(22,215,197,0.30); }
    50%      { box-shadow: 0 0 0 14px rgba(22,215,197,0.00); }
  }
  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-6px); }
  }
  .ip-scroll::-webkit-scrollbar { display:none; }
  .ip-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .ip-tap { transition:transform 0.2s cubic-bezier(0.34,1.4,0.64,1); }
  .ip-tap:active { transform:scale(0.965); }
`;

/* ─── Helpers ───────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat("de-DE").format(n);
}
function pct(raised, goal) {
  return Math.round((raised / goal) * 100);
}

/* ════════════════════════════════════════════
   PROJECT STORY PAGE — full cinematic detail
════════════════════════════════════════════ */
function ProjectStory({ p, onBack, onVote, hasVoted }) {
  const [voted, setVoted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function doVote() {
    setVoted(true);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3200);
    onVote && onVote(p.id);
  }

  const progress = pct(p.raised, p.goal);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      background:C.cream, overflowY:"auto" }}
      className="ip-scroll">

      {/* ── Cinematic hero image ── */}
      <div style={{ position:"relative", height:"60vh",
        minHeight:360, maxHeight:520 }}>
        <img src={p.img} alt={p.title}
          style={{ position:"absolute", inset:0, width:"100%",
            height:"100%", objectFit:"cover",
            filter:"brightness(0.62) saturate(1.15)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            rgba(0,0,0,0.30) 0%,
            rgba(0,0,0,0.0) 25%,
            rgba(10,5,0,0.15) 55%,
            rgba(10,5,0,0.88) 100%)` }}/>

        {/* Controls */}
        <div style={{ position:"absolute", top:0, left:0, right:0,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          display:"flex", justifyContent:"space-between" }}>
          <button onClick={onBack}
            style={{ width:42, height:42, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.28)",
              cursor:"pointer", fontSize:17, color:"white",
              display:"flex", alignItems:"center",
              justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>←</button>
          <button style={{ width:42, height:42, borderRadius:"50%",
            background:"rgba(255,255,255,0.18)",
            backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.28)",
            cursor:"pointer", color:"white", fontSize:16,
            display:"flex", alignItems:"center",
            justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>↗</button>
        </div>

        {/* Category + title at bottom */}
        <div style={{ position:"absolute", bottom:0,
          left:0, right:0, padding:"0 24px 28px" }}>
          <div style={{ display:"inline-block",
            background:p.categoryColor+"33",
            backdropFilter:"blur(8px)",
            border:`1px solid ${p.categoryColor}55`,
            borderRadius:999, padding:"4px 14px",
            fontSize:11, fontWeight:700,
            color:p.categoryColor, marginBottom:12 }}>
            {p.category}
          </div>
          <div style={{ fontWeight:900, fontSize:28, color:"white",
            letterSpacing:-0.8, lineHeight:1.15, marginBottom:8 }}>
            {p.title}
          </div>
          <div style={{ display:"flex", alignItems:"center",
            gap:8, color:"rgba(255,255,255,0.72)", fontSize:13 }}>
            <span>📍</span><span>{p.location}</span>
            <span style={{ width:3, height:3, borderRadius:"50%",
              background:"rgba(255,255,255,0.4)",
              display:"inline-block" }}/>
            <span>{fmt(p.supporters)} Menschen dabei</span>
          </div>
        </div>
      </div>

      {/* ── Story text ── */}
      <div style={{ background:C.card, padding:"32px 24px 28px",
        borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontWeight:800, fontSize:13, color:C.teal,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>
          Die Geschichte
        </div>
        <div style={{ fontSize:16, color:C.ink2, lineHeight:1.85,
          whiteSpace:"pre-line", fontWeight:400 }}>
          {p.story}
        </div>
      </div>

      {/* ── Progress — warm, organic, NOT a dashboard ── */}
      <div style={{ background:C.warm, padding:"28px 24px" }}>
        <div style={{ fontWeight:800, fontSize:13, color:C.sage,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:20 }}>
          Gemeinsame Wirkung
        </div>

        {/* Pool orb */}
        <div style={{ display:"flex", alignItems:"center",
          gap:20, marginBottom:24 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", flexShrink:0,
            background:`radial-gradient(circle at 35% 35%,
              rgba(22,215,197,0.9), rgba(17,197,183,0.6))`,
            boxShadow:`0 0 0 8px ${C.tealGlow},
              0 8px 32px rgba(22,215,197,0.30)`,
            display:"flex", alignItems:"center",
            justifyContent:"center",
            animation:"breathe 4s ease-in-out infinite" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:900, fontSize:13,
                color:"white", letterSpacing:-0.3 }}>
                {progress}%
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:26,
              color:C.ink, letterSpacing:-0.6 }}>
              € {fmt(p.raised)}
            </div>
            <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
              von € {fmt(p.goal)} gemeinsam bewegt
            </div>
          </div>
        </div>

        {/* Organic progress bar */}
        <div style={{ height:8, borderRadius:999,
          background:"rgba(0,0,0,0.06)",
          overflow:"hidden", marginBottom:28 }}>
          <div style={{ height:"100%", borderRadius:999,
            width:`${progress}%`,
            background:`linear-gradient(90deg,${C.teal},${C.teal2})`,
            boxShadow:`0 0 8px ${C.tealGlow}`,
            transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
        </div>

        {/* Goals — story style */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {p.goals.map((g,i)=>(
            <div key={i} style={{ display:"flex",
              alignItems:"center", gap:14,
              padding:"12px 16px",
              background:g.done?"rgba(61,184,122,0.08)":C.card,
              borderRadius:16,
              border:`1px solid ${g.done?"rgba(61,184,122,0.20)":C.border}` }}>
              <div style={{ width:28, height:28, borderRadius:"50%",
                background:g.done?C.green:"rgba(0,0,0,0.06)",
                display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0,
                fontSize:12, color:g.done?"white":C.muted }}>
                {g.done ? "✓" : "·"}
              </div>
              <div style={{ flex:1, fontSize:14, color:C.ink2 }}>
                {g.label}
              </div>
              <div style={{ fontSize:12, fontWeight:700,
                color:g.done?C.green:C.muted }}>
                {g.progress}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Second image — documentary ── */}
      <div style={{ margin:"0 20px 28px",
        borderRadius:24, overflow:"hidden", height:200 }}>
        <img src={p.img2} alt=""
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.85) saturate(1.1)" }}/>
      </div>

      {/* Bottom CTA space */}
      <div style={{ height:90 }}/>

      {/* ── Sticky bottom: Vote ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0,
        background:"rgba(249,246,242,0.97)",
        backdropFilter:"blur(20px)",
        borderTop:`1px solid ${C.border}`,
        padding:"14px 24px max(20px,env(safe-area-inset-bottom))" }}>

        {showConfirm ? (
          <div style={{ textAlign:"center", padding:"10px 0",
            animation:"fadeUp 0.4s ease both" }}>
            <div style={{ fontSize:26, marginBottom:4 }}>🌱</div>
            <div style={{ fontWeight:800, fontSize:16, color:C.green }}>
              Deine Stimme zählt.
            </div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>
              Du hast etwas Echtes bewegt.
            </div>
          </div>
        ) : (
          <button
            onClick={doVote}
            disabled={voted || hasVoted}
            style={{ width:"100%", padding:"16px",
              background: (voted||hasVoted)
                ? `linear-gradient(135deg,${C.green},#2DA86A)`
                : `linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:18, fontSize:16,
              fontWeight:900, color:"white", cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:(voted||hasVoted)
                ? "0 6px 24px rgba(61,184,122,0.35)"
                : `0 6px 24px ${C.tealGlow}`,
              opacity:(voted||hasVoted)?0.9:1,
              transition:"all 0.4s",
              WebkitTapHighlightColor:"transparent" }}>
            {(voted||hasVoted) ? "✓ Du hast abgestimmt" : "🌱 Für dieses Projekt stimmen"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN IMPACT PAGE
════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const [projects,     setProjects]     = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [votedId,      setVotedId]      = useState(null);
  const [poolTotal,    setPoolTotal]    = useState(0);
  const [monthVoting,  setMonthVoting]  = useState(true);
  const [activeFilter, setActiveFilter] = useState("aktiv");
  const [loading,      setLoading]      = useState(true);
  const [weeklyInflow, setWeeklyInflow] = useState(0);

  // Load real data from Supabase
  useEffect(() => {
    async function load() {
      try {
        // 1. Projects
        const { data: projData } = await supabase
          .from("impact_projects")
          .select("*")
          .in("status", ["active", "voting", "funded"])
          .order("votes", { ascending: false });

        if (projData && projData.length > 0) {
          // Map DB fields to component shape
          setProjects(projData.map(p => ({
            id:            p.id,
            title:         p.name,
            short:         p.description?.slice(0, 80) + "...",
            story:         p.description || "",
            location:      p.contact_name || "",
            category:      p.category || "Soziales",
            categoryColor: p.color || "#3DB87A",
            img:           p.icon?.startsWith("http") ? p.icon
                           : "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=90",
            img2:          null,
            raised:        p.awarded_eur || 0,
            goal:          10000,
            votes:         p.votes || 0,
            status:        p.status,
            tags:          p.tags || [],
          })));
          setMonthVoting(projData.some(p => p.status === "voting"));
        } else {
          // Graceful fallback to hardcoded if DB empty
          setProjects(PROJECTS);
          setMonthVoting(true);
        }

        // 2. Pool total — sum of all payments impact_eur
        const { data: poolData } = await supabase
          .from("payments")
          .select("impact_eur");
        const total = (poolData || []).reduce((s, r) => s + (r.impact_eur || 0), 0);
        setPoolTotal(total > 0 ? total : 124850);

        // 3. Weekly inflow (last 7 days)
        const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
        const { data: weekData } = await supabase
          .from("payments")
          .select("impact_eur")
          .gte("created_at", weekAgo);
        const weekly = (weekData || []).reduce((s, r) => s + (r.impact_eur || 0), 0);
        setWeeklyInflow(weekly > 0 ? weekly : 8950);

      } catch(e) {
        console.error("[ImpactPage] load:", e.message);
        setProjects(PROJECTS);
        setPoolTotal(124850);
        setWeeklyInflow(8950);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // User's vote from DB
  useEffect(() => {
    if (!currentUser?.id) return;
    supabase.from("impact_votes")
      .select("project_id").eq("user_id", currentUser.id)
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .maybeSingle()
      .then(({ data }) => { if (data) setVotedId(data.project_id); });
  }, [currentUser?.id]);

  async function handleVote(id) {
    if (votedId || !currentUser?.id) return;
    setVotedId(id);
    setProjects(ps => ps.map(p => p.id === id ? {...p, votes: p.votes + 1} : p));
    await supabase.from("impact_votes").upsert({
      user_id: currentUser.id, project_id: id,
      created_at: new Date().toISOString()
    });
    await supabase.from("impact_projects")
      .update({ votes: projects.find(p=>p.id===id)?.votes + 1 || 1 })
      .eq("id", id);
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:36, height:36, border:`3px solid #16D7C5`,
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }} />
      <div style={{ fontSize:13, color:"#888" }}>Impact Pool wird geladen…</div>
    </div>
  );

  if (selected) return (
    <ProjectStory
      p={selected}
      onBack={() => setSelected(null)}
      onVote={handleVote}
      hasVoted={votedId === selected.id}
    />
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background:C.cream, paddingBottom:110 }}>

        {/* ══ 1. CINEMATIC HERO ══════════════════════════ */}
        <div style={{ position:"relative", height:"55vh",
          minHeight:340, maxHeight:480, overflow:"hidden" }}>
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=90"
            alt="Impact"
            style={{ position:"absolute", inset:0, width:"100%",
              height:"100%", objectFit:"cover",
              filter:"brightness(0.58) saturate(1.2)" }}/>
          {/* Teal→Coral atmospheric gradient */}
          <div style={{ position:"absolute", inset:0,
            background:`
              linear-gradient(to bottom,
                rgba(22,215,197,0.30) 0%,
                rgba(0,0,0,0.0) 30%,
                rgba(10,5,0,0.78) 100%)
            ` }}/>

          {/* Top label */}
          <div style={{ position:"absolute",
            top:"max(52px,env(safe-area-inset-top,52px))",
            left:24 }}>
            <div style={{ display:"inline-flex", alignItems:"center",
              gap:6, background:"rgba(22,215,197,0.22)",
              backdropFilter:"blur(8px)",
              border:"1px solid rgba(22,215,197,0.40)",
              borderRadius:999, padding:"5px 14px" }}>
              <span style={{ width:6, height:6, borderRadius:"50%",
                background:C.teal, display:"inline-block",
                boxShadow:`0 0 6px ${C.teal}`,
                animation:"breathe 3s ease-in-out infinite" }}/>
              <span style={{ fontSize:11, color:C.teal,
                fontWeight:700 }}>Impact Pool · Mai 2026</span>
            </div>
          </div>

          {/* Hero headline */}
          <div style={{ position:"absolute", bottom:0,
            left:0, right:0, padding:"0 24px 32px" }}>
            <div style={{ fontWeight:900, fontSize:30, color:"white",
              letterSpacing:-0.8, lineHeight:1.15, marginBottom:10 }}>
              Gemeinsam bewegen<br/>wir echte Veränderung.
            </div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)",
              lineHeight:1.65, maxWidth:300 }}>
              Jede Buchung auf HUI fließt in echte Projekte —
              ausgewählt von der Community.
            </div>
          </div>
        </div>

        {/* ══ 2. IMPACT POOL — organic, not a dashboard ══ */}
        <div style={{ margin:"24px 20px",
          borderRadius:28, overflow:"hidden",
          background:`linear-gradient(145deg,
            rgba(22,215,197,0.12) 0%,
            rgba(255,138,107,0.08) 100%)`,
          border:`1px solid rgba(22,215,197,0.18)`,
          boxShadow:"0 4px 32px rgba(22,215,197,0.10)",
          padding:"28px 24px" }}>

          {/* Floating orb */}
          <div style={{ display:"flex", alignItems:"center",
            gap:20, marginBottom:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:64, height:64, borderRadius:"50%",
                background:`radial-gradient(circle at 30% 30%,
                  ${C.teal}, ${C.teal2})`,
                display:"flex", alignItems:"center",
                justifyContent:"center",
                animation:"float 5s ease-in-out infinite",
                boxShadow:`0 0 0 0 ${C.tealGlow}`,
                animationName:"float,pulse-glow",
                animationDuration:"5s,3s",
                animationIterationCount:"infinite" }}>
                <span style={{ fontSize:26 }}>🌱</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted,
                fontWeight:600, marginBottom:4 }}>
                Gemeinsamer Impact Pool
              </div>
              <div style={{ fontWeight:900, fontSize:32,
                color:C.ink, letterSpacing:-1,
                transition:"all 0.8s" }}>
                € {fmt(poolTotal)}
              </div>
              <div style={{ fontSize:12, color:C.teal,
                fontWeight:600, marginTop:3 }}>
                ↑ € {new Intl.NumberFormat('de-DE').format(weeklyInflow)} diese Woche
              </div>
            </div>
          </div>

          {/* Explanation — human, not technical */}
          <div style={{ fontSize:14, color:C.ink2,
            lineHeight:1.75,
            padding:"16px 18px",
            background:"rgba(255,255,255,0.55)",
            borderRadius:18 }}>
            Aus jeder Buchung fließen <strong>15 %</strong> in diesen Pool.
            Die Community entscheidet jeden Monat, welche Projekte gefördert werden.
            <span style={{ color:C.teal, fontWeight:700 }}> Deine Stimme zählt.</span>
          </div>
        </div>

        {/* ══ 3. FILTER TABS — ruhig, minimal ════════════ */}
        <div style={{ display:"flex", gap:8, padding:"0 20px 24px" }}>
          {[
            {key:"aktiv",      label:"Aktive Projekte"},
            {key:"voting",     label:"Abstimmung"},
            {key:"bewirkt",    label:"Bewirkt"},
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{ padding:"8px 16px", borderRadius:999,
                background: activeFilter===f.key
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : "rgba(0,0,0,0.05)",
                color: activeFilter===f.key ? "white" : C.muted,
                border:"none", cursor:"pointer", fontSize:12,
                fontWeight: activeFilter===f.key ? 700 : 500,
                fontFamily:"inherit",
                boxShadow: activeFilter===f.key
                  ? `0 4px 12px ${C.tealGlow}` : "none",
                transition:"all 0.25s",
                WebkitTapHighlightColor:"transparent" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ══ 4. PROJECT CARDS — story windows ═══════════ */}
        {activeFilter !== "bewirkt" && (
          <div style={{ padding:"0 20px",
            display:"flex", flexDirection:"column", gap:20 }}>
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id} p={p} idx={i}
                onOpen={() => setSelected(p)}
                voted={votedId === p.id}
                onVote={() => handleVote(p.id)}
                showVote={activeFilter === "voting" && monthVoting}
              />
            ))}
          </div>
        )}

        {/* ══ 5. BEWIRKT — completed stories ═════════════ */}
        {activeFilter === "bewirkt" && (
          <div style={{ padding:"0 20px" }}>
            <BewirktSection />
          </div>
        )}

        {/* ══ 6. COMMUNITY QUOTE ══════════════════════════ */}
        <div style={{ margin:"32px 20px 0",
          padding:"28px 24px",
          background:C.card, borderRadius:28,
          boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:22, color:C.teal,
            marginBottom:10, lineHeight:1 }}>"</div>
          <div style={{ fontSize:17, color:C.ink2,
            fontStyle:"italic", lineHeight:1.75, marginBottom:16 }}>
            Ich buche bei HUI, weil ich weiß, dass mein Geld nicht nur
            eine Dienstleistung kauft — es bewegt etwas in der Welt.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80"
              alt="Maria"
              style={{ width:36, height:36, borderRadius:"50%",
                objectFit:"cover" }}/>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>
                Maria K.
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                HUI-Entdeckerin seit 2024
              </div>
            </div>
          </div>
        </div>

        <div style={{ height:24 }}/>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   PROJECT CARD — cinematic story window
════════════════════════════════════════════ */
function ProjectCard({ p, idx, onOpen, voted, onVote, showVote }) {
  const [localVoted, setLocalVoted] = useState(voted);
  const progress = pct(p.raised, p.goal);

  function handleVote(e) {
    e.stopPropagation();
    if (localVoted || voted) return;
    setLocalVoted(true);
    onVote();
  }

  return (
    <div
      className="ip-tap"
      onClick={onOpen}
      style={{ borderRadius:28, overflow:"hidden",
        background:C.card, cursor:"pointer",
        boxShadow:"0 4px 28px rgba(0,0,0,0.10)",
        animation:`fadeUp 0.55s ${idx*0.10}s both` }}>

      {/* Full-bleed image — dominant */}
      <div style={{ position:"relative", height:280, overflow:"hidden" }}>
        <img src={p.img} alt={p.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.72) saturate(1.1)" }}/>
        {/* Gradient — story framing */}
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            rgba(0,0,0,0.0) 30%,
            rgba(10,5,0,0.80) 100%)` }}/>

        {/* Category badge */}
        <div style={{ position:"absolute", top:16, left:16 }}>
          <div style={{ background:p.categoryColor+"33",
            backdropFilter:"blur(8px)",
            border:`1px solid ${p.categoryColor}55`,
            borderRadius:999, padding:"4px 12px",
            fontSize:11, fontWeight:700, color:p.categoryColor }}>
            {p.category}
          </div>
        </div>

        {/* Heart */}
        <div style={{ position:"absolute", top:14, right:14 }}>
          <button onClick={e=>e.stopPropagation()}
            style={{ width:36, height:36, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.28)",
              display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer",
              fontSize:15,
              WebkitTapHighlightColor:"transparent" }}>
            🤍
          </button>
        </div>

        {/* Supporter count */}
        <div style={{ position:"absolute", bottom:16, left:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {/* Stacked avatars hint */}
            <div style={{ display:"flex" }}>
              {[
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&q=80",
              ].map((src,i) => (
                <img key={i} src={src} alt=""
                  style={{ width:22, height:22, borderRadius:"50%",
                    objectFit:"cover",
                    border:"2px solid rgba(255,255,255,0.7)",
                    marginLeft: i>0 ? -7 : 0 }}/>
              ))}
            </div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)",
              fontWeight:600 }}>
              {fmt(p.supporters)} dabei
            </span>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div style={{ padding:"20px 20px 0" }}>
        <div style={{ fontWeight:900, fontSize:18, color:C.ink,
          letterSpacing:-0.4, lineHeight:1.25, marginBottom:6 }}>
          {p.title}
        </div>
        <div style={{ fontSize:14, color:C.muted,
          fontStyle:"italic", marginBottom:16,
          lineHeight:1.5 }}>
          {p.short}
        </div>

        {/* Organic progress */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.ink }}>
              € {fmt(p.raised)}
            </span>
            <span style={{ fontSize:12, color:C.muted }}>
              {progress}% erreicht
            </span>
          </div>
          <div style={{ height:5, borderRadius:999,
            background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999,
              width:`${progress}%`,
              background:`linear-gradient(90deg,${C.teal},${C.teal2})`,
              boxShadow:`0 0 6px ${C.tealGlow}` }}/>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"0 20px 20px",
        display:"flex", gap:10 }}>
        {showVote ? (
          <button onClick={handleVote}
            style={{ flex:1, padding:"12px",
              background:(localVoted||voted)
                ?`linear-gradient(135deg,${C.green},#2DA86A)`
                :`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:14, fontSize:14,
              fontWeight:800, color:"white", cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:(localVoted||voted)
                ?"0 4px 14px rgba(61,184,122,0.30)"
                :`0 4px 14px ${C.tealGlow}`,
              transition:"all 0.35s",
              WebkitTapHighlightColor:"transparent" }}>
            {(localVoted||voted) ? "✓ Abgestimmt" : "🌱 Abstimmen"}
          </button>
        ) : (
          <button onClick={e=>{e.stopPropagation();onOpen();}}
            style={{ flex:1, padding:"12px",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:14, fontSize:14,
              fontWeight:800, color:"white", cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 4px 14px ${C.tealGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            Geschichte lesen →
          </button>
        )}
        <button onClick={e=>e.stopPropagation()}
          style={{ width:44, height:44, borderRadius:14,
            background:"rgba(0,0,0,0.04)", border:"none",
            cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center",
            justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>
          ↗
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BEWIRKT — completed with warmth
════════════════════════════════════════════ */
function BewirktSection() {
  const done = [
    {
      title:"Trinkwasser für 3 Dörfer",
      location:"Kenia", month:"März 2026",
      awarded:28400, img:"https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&q=85",
      highlight:"847 Menschen haben täglich sauberes Wasser.",
    },
    {
      title:"Solarenergie für eine Schule",
      location:"Ghana", month:"Februar 2026",
      awarded:18200, img:"https://images.unsplash.com/photo-1509099652299-30938b0aeb63?w=600&q=85",
      highlight:"320 Kinder lernen jetzt auch nach Einbruch der Dunkelheit.",
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ fontWeight:800, fontSize:13, color:C.sage,
        letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
        Bereits bewirkt
      </div>
      {done.map((d,i) => (
        <div key={i} style={{ borderRadius:24, overflow:"hidden",
          background:C.card, boxShadow:"0 3px 18px rgba(0,0,0,0.08)",
          animation:`fadeUp 0.5s ${i*0.1}s both` }}>
          <div style={{ height:190, overflow:"hidden", position:"relative" }}>
            <img src={d.img} alt={d.title}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.75) saturate(1.1)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.72) 100%)"}}/>
            <div style={{ position:"absolute", bottom:14, left:16, right:16 }}>
              <div style={{ fontWeight:900, fontSize:16, color:"white",
                marginBottom:2 }}>{d.title}</div>
              <div style={{ fontSize:11,
                color:"rgba(255,255,255,0.72)" }}>
                📍 {d.location} · {d.month}
              </div>
            </div>
            {/* Checkmark badge */}
            <div style={{ position:"absolute", top:14, right:14,
              width:32, height:32, borderRadius:"50%",
              background:C.green,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:14,
              boxShadow:"0 4px 12px rgba(61,184,122,0.40)" }}>
              ✓
            </div>
          </div>
          <div style={{ padding:"16px 18px" }}>
            <div style={{ fontWeight:800, fontSize:15, color:C.ink,
              marginBottom:6 }}>€ {fmt(d.awarded)} ausgezahlt</div>
            <div style={{ fontSize:14, color:C.ink2,
              fontStyle:"italic", lineHeight:1.65 }}>
              „{d.highlight}"
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
