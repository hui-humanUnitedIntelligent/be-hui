// ImpactPage.jsx — V5: Emotion First · Seele zurück · Logik zuletzt
// Alle Hooks + Logik identisch — nur Reihenfolge + Präsentation neu
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { supabase } from "../lib/supabaseClient";
import { ImpactService, FeedService } from "../services/db.js";
import { HUI } from "../design/hui.design.js";
import ImpactFlow from "../system/flows/impact/ImpactFlow.jsx";

// ── Helpers ──────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
const fmtEur  = (n) =>
  `€${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

function relTime(ts) {
  if (!ts) return "";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60)    return "vor 1 Min.";
  if (d < 3600)  return `vor ${Math.round(d / 60)} Min.`;
  if (d < 86400) return `vor ${Math.round(d / 3600)} Std.`;
  return `vor ${Math.round(d / 86400)} Tg.`;
}

function fmtMonth(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  const N = ["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  return `${N[parseInt(m, 10)]} ${y}`;
}

// ── Design Tokens ────────────────────────────────────────────
const T = {
  teal:      "#0DC4B5",
  tealL:     "#22DDD0",
  tealGlow:  "rgba(13,196,181,0.20)",
  coral:     "#F4714F",
  coralGlow: "rgba(244,113,79,0.18)",
  gold:      "#D4952A",
  goldGlow:  "rgba(212,149,42,0.16)",
  violet:    "#7264D6",
  violetGlow:"rgba(114,100,214,0.16)",
  page:      "#F8F4EE",
  surface:   "#FDFAF5",
  surfaceHi: "#FFFFFF",
  hero:      "#FBF1E0",
  ink:       "#141422",
  ink2:      "#38384F",
  muted:     "#898998",
  faint:     "#C2C2D0",
  line:      "rgba(0,0,0,0.045)",
  ff:        HUI?.FONT?.family || "-apple-system,'SF Pro Display',sans-serif",
};

const S = {
  card:  "0 2px 20px rgba(0,0,0,0.055), 0 1px 4px rgba(0,0,0,0.030)",
  cardH: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.038)",
  glass: "0 4px 24px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.03)",
  btn:   (c) => `0 4px 18px ${c}38, 0 1px 4px ${c}28`,
};

// Konstanten
const CYCLE_STEPS = [
  { icon:"📝", label:"Projekt einreichen"          },
  { icon:"🔍", label:"HUI-Team prüft"              },
  { icon:"🌿", label:"3 Projekte nominiert"         },
  { icon:"🩷", label:"Community stimmt ab"          },
  { icon:"🏆", label:"Sieger erhält volle Summe"   },
  { icon:"🌱", label:"Restbetrag wird verteilt"     },
];

const POOL_SLICES = [
  { pct:40, emoji:"🗳", label:"Community-Fonds",      color:T.teal   },
  { pct:30, emoji:"🚀", label:"Wirkungsbudget",        color:T.coral  },
  { pct:20, emoji:"💡", label:"Innovationsbudget",     color:T.gold   },
  { pct:10, emoji:"🛡", label:"Kurationsbudget",       color:T.violet },
];

const SEED_PROJECTS = [
  { id:"s1", name:"Repair Café Hamburg", category:"Nachhaltigkeit",
    description:"Dinge reparieren statt wegwerfen — eine offene Werkstatt, die Gemeinschaft schafft.",
    icon:"🔧", color:T.teal, votes:94, goal_eur:3000, status:"nominated",
    img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90" },
  { id:"s2", name:"Foodsharing Hamburg", category:"Ernährung",
    description:"Lebensmittel retten und fair verteilen — gegen Verschwendung, für Gemeinschaft.",
    icon:"🥗", color:T.coral, votes:51, goal_eur:2500, status:"nominated",
    img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=90" },
  { id:"s3", name:"Musik für Kinder e.V.", category:"Bildung",
    description:"Kostenloser Musikunterricht für Kinder aus einkommensschwachen Familien.",
    icon:"🎵", color:T.violet, votes:29, goal_eur:2000, status:"nominated",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90" },
];

// ════════════════════════════════════════════════════════════════
// HOOKS — identisch zur Vorgängerversion, keine Änderungen
// ════════════════════════════════════════════════════════════════

function useHeroStats() {
  const [s, setS] = React.useState({ werke:0, erlebnisse:0, buchungen:0, pool:0, loading:true });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const now     = new Date();
        const msStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [wRes, eRes, bRes, rRes] = await Promise.allSettled([
          supabase.from("bookings").select("id", { count:"exact", head:true })
            .not("work_id","is",null),
          supabase.from("bookings").select("id", { count:"exact", head:true })
            .not("experience_id","is",null),
          supabase.from("bookings").select("id", { count:"exact", head:true })
            .gte("created_at", msStart),
          supabase.from("impact_rounds")
            .select("pool_eur")
            .eq("month", now.toISOString().slice(0,7))
            .single(),
        ]);
        if (dead) return;
        setS({
          werke:      wRes.status === "fulfilled" ? (wRes.value.count || 0) : 0,
          erlebnisse: eRes.status === "fulfilled" ? (eRes.value.count || 0) : 0,
          buchungen:  bRes.status === "fulfilled" ? (bRes.value.count || 0) : 0,
          pool:       rRes.status === "fulfilled" ? safeNum(rRes.value.data?.pool_eur) : 0,
          loading: false,
        });
      } catch (e) {
        console.warn("[HERO STATS]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    })();
    return () => { dead = true; };
  }, []);
  return s;
}

function usePoolBudgets() {
  const [s, setS] = React.useState({
    pool:0, community:0, wirkung:0, innovation:0, kuration:0, loading:true,
  });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const now     = new Date();
        const msStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [rRes, bRes] = await Promise.allSettled([
          supabase.from("impact_rounds")
            .select("pool_eur,voting_ends_at")
            .eq("month", now.toISOString().slice(0,7))
            .single(),
          supabase.from("bookings")
            .select("platform_fee")
            .gte("created_at", msStart),
        ]);
        if (dead) return;
        const round = rRes.status === "fulfilled" ? rRes.value.data : null;
        const fees  = bRes.status === "fulfilled" ? (bRes.value.data || []) : [];
        const provSum = fees.reduce((a,b) => a + safeNum(b.platform_fee), 0);
        const pool  = safeNum(round?.pool_eur) || Math.round(provSum * 0.15);
        setS({
          pool,
          community:  Math.round(pool * 0.40),
          wirkung:    Math.round(pool * 0.30),
          innovation: Math.round(pool * 0.20),
          kuration:   Math.round(pool * 0.10),
          votingEnds: round?.voting_ends_at || null,
          loading: false,
        });
      } catch (e) {
        console.warn("[POOL BUDGETS]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    })();
    return () => { dead = true; };
  }, []);
  return s;
}

function useTransparenz() {
  const [s, setS] = React.useState({ projekte:0, eur:0, stimmen:0, menschen:0, loading:true });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [pRes, vRes] = await Promise.allSettled([
          supabase.from("impact_projects")
            .select("id,awarded_eur")
            .in("status", ["funded","finished"]),
          supabase.from("impact_votes")
            .select("id,user_id", { count:"exact" }),
        ]);
        if (dead) return;
        const projs = pRes.status === "fulfilled" ? (pRes.value.data || []) : [];
        const vdata = vRes.status === "fulfilled" ? vRes.value : { count:0, data:[] };
        const unique = new Set((vdata.data || []).map(v => v.user_id)).size;
        setS({
          projekte: projs.length,
          eur:      projs.reduce((a,p) => a + safeNum(p.awarded_eur), 0),
          stimmen:  vdata.count || 0,
          menschen: unique,
          loading: false,
        });
      } catch (e) {
        console.warn("[TRANSPARENZ]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    })();
    return () => { dead = true; };
  }, []);
  return s;
}

function useLastPayout() {
  const [s, setS] = React.useState({ payout:null, others:[], loading:true });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data:round } = await supabase
          .from("impact_rounds")
          .select("id,month,pool_eur,distributed_at,winner_project_id")
          .eq("status","distributed")
          .order("distributed_at", { ascending:false })
          .limit(1)
          .single();
        if (dead || !round) { if (!dead) setS(d => ({...d, loading:false})); return; }
        const projIds = [round.winner_project_id].filter(Boolean);
        const { data:winnerProjs } = projIds.length
          ? await supabase.from("impact_projects")
              .select("id,name,icon,color,img_url,awarded_eur")
              .in("id", projIds)
          : { data:[] };
        const { data:others } = await supabase
          .from("impact_projects")
          .select("id,name,icon,awarded_eur")
          .gt("awarded_eur", 0)
          .neq("id", round.winner_project_id || "none")
          .order("awarded_eur", { ascending:false })
          .limit(5);
        if (dead) return;
        const wp = (winnerProjs || []).find(p => p.id === round.winner_project_id);
        setS({
          payout: {
            month: round.month,
            poolEur: round.pool_eur,
            winnerAmount: Math.round(safeNum(round.pool_eur) * 0.40),
            project: wp || null,
          },
          others: (others || []),
          loading: false,
        });
      } catch (e) {
        console.warn("[LAST PAYOUT]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    })();
    return () => { dead = true; };
  }, []);
  return s;
}

function useWeitereProjects() {
  const [projects, setProjects] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_projects")
          .select("id,name,icon,color,img_url,status,category,awarded_eur,distributed_at")
          .in("status", ["funded","finished"])
          .order("awarded_eur", { ascending:false })
          .limit(8);
        if (!dead) setProjects(data || []);
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, []);
  return projects;
}

function useImpactActivities() {
  const [acts, setActs] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const { data:votes } = await supabase
          .from("impact_votes")
          .select("id,created_at,user_id,project_id")
          .order("created_at", { ascending:false })
          .limit(8);
        if (dead || !votes?.length) return;
        const uIds = [...new Set(votes.map(v => v.user_id).filter(Boolean))];
        const pIds = [...new Set(votes.map(v => v.project_id).filter(Boolean))];
        const [uRes, pRes] = await Promise.allSettled([
          uIds.length ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", uIds)
                      : Promise.resolve({ data:[] }),
          pIds.length ? supabase.from("impact_projects").select("id,name").in("id", pIds)
                      : Promise.resolve({ data:[] }),
        ]);
        if (dead) return;
        const uMap = Object.fromEntries((uRes.value?.data || []).map(u => [u.id, u]));
        const pMap = Object.fromEntries((pRes.value?.data || []).map(p => [p.id, p]));
        setActs(votes.map(v => ({
          id:     v.id,
          user:   uMap[v.user_id]?.display_name || "Jemand",
          avatar: uMap[v.user_id]?.avatar_url || null,
          proj:   pMap[v.project_id]?.name || "ein Projekt",
          ago:    relTime(v.created_at),
        })));
      } catch { /* silent */ }
    };
    load();
    const iv = setInterval(load, 30_000);
    return () => { dead = true; clearInterval(iv); };
  }, []);
  return acts;
}

// ════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ════════════════════════════════════════════════════════════════
class ImpactErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed:false, error:null }; }
  static getDerivedStateFromError(e) { return { crashed:true, error:e }; }
  componentDidCatch(e) {
    console.error("[IMPACT CRASH]", { msg:e?.message, stack:e?.stack?.slice(0,400) });
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{ padding:40, textAlign:"center", fontFamily:T.ff,
        minHeight:"50vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:T.page }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🌱</div>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>
          Etwas ist schiefgelaufen
        </div>
        <div style={{ fontSize:13, marginBottom:20, maxWidth:280, color:T.muted }}>
          {this.state.error?.message || "Unbekannter Fehler"}
        </div>
        <button onClick={() => this.setState({ crashed:false, error:null })} style={{
          background:T.teal, color:"white", border:"none",
          borderRadius:20, padding:"10px 24px", fontSize:14, cursor:"pointer", fontWeight:600,
        }}>Neu laden</button>
      </div>
    );
  }
}

// ════════════════════════════════════════════════════════════════
// HAUPT-INNER
// ════════════════════════════════════════════════════════════════
function ImpactPageInner({ currentUser }) {
  // ── States ──
  const [projects,    setProjects]    = React.useState([]);
  const [loadingProj, setLoadingProj] = React.useState(true);
  const [activeRound, setActiveRound] = React.useState(null);
  const [userVotes,   setUserVotes]   = React.useState([]);
  const [voteLoading, setVoteLoading] = React.useState(false);
  const [showPropose, setShowPropose] = React.useState(false);
  const [infoModal,   setInfoModal]   = React.useState(null);

  // ── Hooks ──
  const hero       = useHeroStats();
  const pool       = usePoolBudgets();
  const transp     = useTransparenz();
  const payoutData = useLastPayout();
  const finanziert = useWeitereProjects();
  const activities = useImpactActivities();

  // ── Projekte laden ──
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,goal_eur,awarded_eur,tags,status,img_url")
          .in("status", ["nominated","active"])
          .order("votes", { ascending:false })
          .limit(3);
        if (dead) return;
        if (error) throw error;
        const IMGS = [
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90",
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=90",
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90",
        ];
        const rows = (data || []).map((p, i) => ({
          ...p, img: p.img_url || IMGS[i % IMGS.length],
        }));
        setProjects(rows.length ? rows : SEED_PROJECTS);
      } catch {
        if (!dead) setProjects(SEED_PROJECTS);
      } finally {
        if (!dead) setLoadingProj(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // ── ActiveRound + UserVotes ──
  React.useEffect(() => {
    if (!currentUser?.id) return;
    let dead = false;
    (async () => {
      try {
        const { data:round } = await ImpactService.getCurrentRound();
        if (dead) return;
        if (round?.id) {
          setActiveRound(round);
          const { data:votes } = await ImpactService.getUserVotesThisRound(currentUser.id, round.id);
          if (!dead) setUserVotes(safeArr(votes));
        }
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, [currentUser?.id]);

  // ── Vote ──
  const castVote = async (projectId) => {
    if (!currentUser?.id || voteLoading) return;
    if (userVotes.some(v => v.project_id === projectId)) return;
    const isMem = checkMember(currentUser);
    const maxV  = isMem ? 2 : 1;
    const usedV = userVotes.reduce((s,v) => s + safeNum(v.weight || 1), 0);
    if (usedV >= maxV) return;

    setUserVotes(prev => [...prev, { project_id:projectId, weight:1 }]);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, votes:(p.votes||0)+1 } : p));

    if (!activeRound?.id) return;
    setVoteLoading(true);
    try {
      const { error } = await ImpactService.castVote(currentUser.id, projectId, activeRound.id, isMem ? 2 : 1);
      if (error) {
        setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, votes:Math.max(0,(p.votes||1)-1) } : p));
      } else {
        const proj = projects.find(p => p.id === projectId);
        if (proj) FeedService.createActivity(currentUser.id, "impact_vote",
          `hat das Projekt „${proj.name}" unterstützt`, {}).catch(() => {});
      }
    } catch { /* silent */ } finally { setVoteLoading(false); }
  };

  // ── Derived ──
  const checkMember = (u) =>
    u?.is_wirker || ["talent","member","guardian","team"].includes(u?.membership_type);
  const isMem       = checkMember(currentUser);
  const maxVotes    = isMem ? 2 : 1;
  const usedVotes   = userVotes.reduce((s,v) => s + safeNum(v.weight || 1), 0);
  const remainVotes = Math.max(0, maxVotes - usedVotes);
  const totalVotes  = projects.reduce((s,p) => s + safeNum(p.votes), 0);
  const daysLeft    = activeRound?.voting_ends_at
    ? Math.max(0, Math.ceil((new Date(activeRound.voting_ends_at) - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ width:"100%", minHeight:"100svh", background:T.page,
      fontFamily:T.ff, paddingBottom:100, overflowX:"hidden" }}>
      <style>{`
        @keyframes ipFade    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes ipFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ipFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ipPulse   { 0%,100%{opacity:1} 50%{opacity:0.38} }
        @keyframes ipBreath  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .ip-p { cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .ip-p:active { opacity:0.78; transform:scale(0.972) !important; transition:all 0.11s !important; }
      `}</style>

      {/* ══ 1 ── GROSSER EMOTIONALER HERO ════════════════════════ */}
      <BigHero stats={hero} pool={pool} />

      {/* ══ 2 ── POOL-KARTE (zentral, einfach) ══════════════════ */}
      <PoolCard pool={pool} stats={hero} />

      {/* ══ 3 ── AKTUELLE ABSTIMMUNG (Herzstück) ════════════════ */}
      <VotingSection
        projects={projects}
        userVotes={userVotes}
        daysLeft={daysLeft}
        totalVotes={totalVotes}
        onVote={castVote}
        loading={loadingProj}
        onInfoClick={() => setInfoModal("vote")}
      />

      {/* ══ 4 ── STIMMEN PERSÖNLICH ══════════════════════════════ */}
      <VotePersonal
        usedVotes={usedVotes}
        maxVotes={maxVotes}
        remainVotes={remainVotes}
        isMem={isMem}
        userVotes={userVotes}
        projects={projects}
      />

      {/* ══ 5 ── GEMEINSAM ERMÖGLICHT (finanzierte Projekte) ════ */}
      <GemeinsamErmoegicht finanziert={finanziert} transp={transp} />

      {/* ══ 6 ── HERZENSPROJEKT EMOTIONAL ═══════════════════════ */}
      <HerzensprojektEmotional onPropose={() => setShowPropose(true)} />

      {/* ══ 7 ── LIVE-TICKER ═════════════════════════════════════ */}
      {activities.length > 0 && <LiveTicker activities={activities} />}

      {/* ══ 8 ── MECHANIK ERKLÄREN (weiter unten) ═══════════════ */}
      <MechanikErklaeung onInfo={() => setInfoModal("cycle")} />

      {/* ══ 9 ── FONDS-AUFTEILUNG (kompakt, ganz unten) ════════ */}
      <FondsAufteilungKompakt pool={pool} />

      {/* ══ LETZTE AUSZAHLUNG (footer-nah) ══════════════════════ */}
      {payoutData.payout && (
        <LetzteAuszahlung payout={payoutData.payout} others={payoutData.others} />
      )}

      {/* ══ FLOWS + MODALS ════════════════════════════════════════ */}
      {showPropose && (
        <React.Suspense fallback={null}>
          <ImpactFlow onClose={() => setShowPropose(false)} />
        </React.Suspense>
      )}
      {infoModal && (
        <InfoSheet modal={infoModal} onClose={() => setInfoModal(null)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. GROSSER EMOTIONALER HERO
// ════════════════════════════════════════════════════════════════
const HERO_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=92";

function BigHero({ stats, pool }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden", minHeight:320,
      background:`linear-gradient(172deg,#FCF0DE 0%,#F8EFE0 50%,#F3E9D6 100%)`,
    }}>
      {/* Hintergrundbild — rechte Hälfte */}
      <div style={{
        position:"absolute", top:0, right:0, width:"52%", height:"100%",
        overflow:"hidden",
      }}>
        <img src={HERO_IMG} alt="" style={{
          width:"100%", height:"100%", objectFit:"cover",
          objectPosition:"center",
          filter:"saturate(0.82) brightness(0.90)",
        }} loading="eager"/>
        {/* Gradient-Überblendung nach links */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to right,#FCF0DE 0%,rgba(252,240,222,0.6) 35%,transparent 70%)",
        }}/>
      </div>

      {/* Content — linke Hälfte */}
      <div style={{ position:"relative", zIndex:2, padding:"52px 22px 48px", maxWidth:"56%" }}>
        {/* Badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:7,
          background:`${T.teal}18`, border:`1px solid ${T.teal}28`,
          borderRadius:99, padding:"5px 13px", marginBottom:18 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
            animation:"ipPulse 2s ease-in-out infinite" }}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.14em", textTransform:"uppercase" }}>HUI Impact Pool</span>
        </div>

        {/* Headline — groß + emotional */}
        <h1 style={{ margin:"0 0 14px", fontSize:30, fontWeight:900,
          lineHeight:1.15, letterSpacing:"-0.028em", color:T.ink }}>
          Gemeinsam<br/>
          <span style={{ color:T.teal }}>Wirkung</span> schaffen.
        </h1>

        <p style={{ margin:"0 0 8px", fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:280 }}>
          Jede Buchung auf HUI hilft dabei, echte Herzensprojekte möglich zu machen.
        </p>

        <p style={{ margin:"0 0 28px", fontSize:14, fontWeight:700, color:T.teal }}>
          Kein Projekt geht leer aus.
        </p>

        {/* Handschrift-Stil Spruch (wie Screenshot) */}
        <div style={{
          position:"absolute", top:28, right:"-48%",
          fontFamily:"'Georgia',serif",
          fontSize:13, color:T.ink2, fontStyle:"italic",
          lineHeight:1.5, maxWidth:160, textAlign:"center",
          transform:"rotate(-4deg)",
          opacity:0.75,
          pointerEvents:"none",
        }}>
          Deine Entscheidungen<br/>
          <span style={{ fontWeight:700, color:T.ink }}>bewegen echte Projekte.</span>
          <div style={{
            marginTop:4, borderBottom:`1.5px solid ${T.teal}`,
            width:80, margin:"8px auto 0",
          }}/>
        </div>
      </div>

      {/* LIVE-Ticker unten */}
      <div style={{
        position:"relative", zIndex:2,
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 22px",
        background:"rgba(13,196,181,0.08)",
        borderTop:`1px solid ${T.teal}20`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
            animation:"ipPulse 1.4s ease-in-out infinite" }}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal, letterSpacing:"0.1em" }}>LIVE</span>
        </div>
        <span style={{ fontSize:12, color:T.ink2 }}>
          Der Impact Pool wächst gerade durch neue Buchungen
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. POOL-KARTE (zentral, einfach, emotional)
// ════════════════════════════════════════════════════════════════
function PoolCard({ pool, stats }) {
  const MINI_STATS = [
    { emoji:"📦", val:stats.werke,      label:"Werke verkauft"          },
    { emoji:"📅", val:stats.erlebnisse, label:"Erlebnisse gebucht"      },
    { emoji:"👥", val:stats.buchungen,  label:"Buchungen diesen Monat"  },
  ];

  return (
    <div style={{ padding:"24px 16px 0" }}>
      {/* Haupt-Pool-Karte */}
      <div style={{
        background:`linear-gradient(135deg,${T.teal}18,${T.teal}06)`,
        border:`1.5px solid ${T.teal}35`,
        borderRadius:24, padding:"24px 22px",
        boxShadow:`0 4px 28px ${T.teal}18, 0 1px 6px rgba(0,0,0,0.04)`,
        marginBottom:14,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:20 }}>❤️</span>
              <span style={{ fontSize:12, fontWeight:700, color:T.teal,
                letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Diesen Monat im Impact Pool
              </span>
            </div>
            <div style={{ fontSize:38, fontWeight:900, color:T.teal,
              letterSpacing:"-0.035em", lineHeight:1 }}>
              {pool.loading ? "—" : fmtEur(pool.pool)}
            </div>
            <div style={{ fontSize:12, color:T.ink2, marginTop:6 }}>
              Live berechnet aus HUI-Buchungen
            </div>
          </div>
          <div style={{ fontSize:42,
            filter:"drop-shadow(0 4px 14px rgba(13,196,181,0.32))",
            animation:"ipBreath 6s ease-in-out infinite",
          }}>💚</div>
        </div>
      </div>

      {/* 3 Mini-Stat-Karten */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {MINI_STATS.map((st, i) => (
          <div key={i} style={{
            background:T.surfaceHi, borderRadius:16, padding:"14px 12px",
            boxShadow:S.card, border:`1px solid ${T.line}`,
            textAlign:"center",
            animation:"ipFade 0.3s ease both", animationDelay:`${i*0.06}s`,
          }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{st.emoji}</div>
            <div style={{ fontSize:18, fontWeight:900, color:T.ink, letterSpacing:"-0.02em" }}>
              {stats.loading ? "—" : st.val}
            </div>
            <div style={{ fontSize:9, color:T.muted, marginTop:3, lineHeight:1.35 }}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. AKTUELLE ABSTIMMUNG — das Herzstück
// ════════════════════════════════════════════════════════════════
function VotingSection({ projects, userVotes, daysLeft, totalVotes, onVote, loading, onInfoClick }) {
  return (
    <div style={{ marginTop:32 }}>
      {/* Header */}
      <div style={{ padding:"0 16px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"baseline",
          justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
          <div>
            <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:900, color:T.ink,
              letterSpacing:"-0.022em" }}>Aktuelle Abstimmung</h2>
            {daysLeft !== null && (
              <span style={{ fontSize:12, color:T.coral, fontWeight:700 }}>
                Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""} — stimme jetzt ab
              </span>
            )}
          </div>
          <button onClick={onInfoClick} className="ip-p" style={{
            background:"none", border:`1px solid ${T.teal}30`, borderRadius:99,
            padding:"6px 14px", fontSize:11, fontWeight:700, color:T.teal, cursor:"pointer",
          }}>So funktioniert die Abstimmung</button>
        </div>
      </div>

      {/* Karten — vertical stack, fullwidth */}
      {loading ? (
        <div style={{ padding:"0 16px" }}><SkeletonCards count={3}/></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16, padding:"0 16px" }}>
          {projects.map((p, i) => (
            <VotingCard key={p.id} project={p} rank={i}
              voted={userVotes.some(v => v.project_id === p.id)}
              totalVotes={totalVotes} onVote={onVote} />
          ))}
        </div>
      )}
    </div>
  );
}

function VotingCard({ project:p, rank, voted, totalVotes, onVote }) {
  const accent = p.color || T.teal;
  const pct    = totalVotes > 0 ? Math.round(safeNum(p.votes) / totalVotes * 100) : 0;
  const goalEur = safeNum(p.goal_eur) || 2000;
  const [imgErr, setImgErr] = React.useState(false);
  const RANK_C = [T.teal, T.coral, T.violet];
  const rc = RANK_C[rank] || T.teal;

  // Supporter-Avatare
  const AVTS = ["https://i.pravatar.cc/28?img=1","https://i.pravatar.cc/28?img=5","https://i.pravatar.cc/28?img=12"];

  return (
    <div style={{
      background:T.surfaceHi, borderRadius:24, overflow:"hidden",
      boxShadow:S.card, border:`1px solid ${T.line}`,
      animation:"ipFade 0.38s ease both", animationDelay:`${rank*0.08}s`,
    }}>
      {/* Bild — gross */}
      <div style={{ position:"relative", height:180, overflow:"hidden",
        background:`${accent}12` }}>
        {p.img && !imgErr
          ? <img src={p.img} alt={p.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"saturate(0.85) brightness(0.92)" }} loading="lazy"/>
          : <div style={{ width:"100%", height:"100%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:56 }}>{p.icon||"🌱"}</div>
        }
        {/* Rang-Badge */}
        <div style={{ position:"absolute", top:14, left:14, width:30, height:30,
          borderRadius:"50%", background:rc, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:14, fontWeight:900, color:"white",
          boxShadow:`0 2px 10px ${rc}55` }}>{rank+1}</div>
        {/* Kategorie */}
        <div style={{ position:"absolute", top:14, right:14,
          background:"rgba(255,252,248,0.92)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,255,255,0.85)", borderRadius:99, padding:"4px 11px" }}>
          <span style={{ fontSize:9, color:T.ink2, fontWeight:750,
            letterSpacing:"0.08em", textTransform:"uppercase" }}>{p.category}</span>
        </div>
        {/* Gradient nach unten */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top,rgba(255,255,255,0.9) 0%,transparent 46%)",
          pointerEvents:"none" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 20px 20px" }}>
        <h3 style={{ margin:"0 0 8px", fontSize:19, fontWeight:820, color:T.ink,
          letterSpacing:"-0.02em", lineHeight:1.2 }}>{p.name}</h3>

        {p.description && (
          <p style={{ margin:"0 0 14px", fontSize:13, color:T.ink2, lineHeight:1.65,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {p.description}
          </p>
        )}

        {/* Stimmen + Ziel */}
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:12, color:T.muted, marginBottom:8 }}>
          <span><b style={{ color:T.ink }}>{p.votes||0}</b> Stimmen</span>
          <span>Ziel: <b style={{ color:T.ink }}>{fmtEur(goalEur)}</b></span>
        </div>

        {/* Fortschrittsbalken */}
        <div style={{ height:5, borderRadius:99, background:"rgba(0,0,0,0.07)",
          overflow:"hidden", marginBottom:14 }}>
          <div style={{ height:"100%", borderRadius:99,
            width:`${pct}%`, minWidth:pct>0?6:0,
            background:`linear-gradient(90deg,${accent},${accent}BB)`,
            transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)" }}/>
        </div>

        {/* Supporter-Zeile */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <div style={{ display:"flex" }}>
            {AVTS.map((av,j) => (
              <img key={j} src={av} alt="" style={{ width:22, height:22, borderRadius:"50%",
                border:"1.5px solid white", marginLeft:j>0?-7:0, objectFit:"cover" }}/>
            ))}
          </div>
          <span style={{ fontSize:11, color:T.muted }}>
            Du und {Math.max(0,(p.votes||0)-1)} weitere
          </span>
        </div>

        {/* Vote Button — groß + premium */}
        <button onClick={() => !voted && onVote(p.id)} className="ip-p"
          disabled={voted} style={{
            width:"100%", borderRadius:18, padding:"14px 0",
            cursor: voted ? "default" : "pointer",
            background: voted
              ? `linear-gradient(135deg,${accent}12,${accent}06)`
              : `linear-gradient(135deg,${accent},${accent}CC)`,
            color: voted ? accent : "white",
            border: voted ? `1.5px solid ${accent}30` : "none",
            fontSize:14, fontWeight:750, letterSpacing:"-0.01em",
            boxShadow: voted ? "none" : S.btn(accent),
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"all 0.22s ease",
          }}>
          <span style={{ fontSize:16 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Deine Stimme zählt" : "Mit 1 Stimme unterstützen"}</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. STIMMEN — PERSÖNLICH + WARM
// ════════════════════════════════════════════════════════════════
function VotePersonal({ usedVotes, maxVotes, remainVotes, isMem, userVotes, projects }) {
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <div style={{ padding:"28px 16px 0" }}>
      <div style={{
        background:T.surfaceHi, borderRadius:24, padding:"22px 20px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
      }}>
        {/* Emotionaler Titel */}
        <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:900, color:T.ink,
          letterSpacing:"-0.018em" }}>Deine Stimme zählt.</h3>
        <p style={{ margin:"0 0 18px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
          {remainVotes > 0
            ? <>Du kannst diesen Monat noch{" "}
                <b style={{ color:T.teal }}>{remainVotes} Projekt{remainVotes > 1 ? "e" : ""}</b> unterstützen.</>
            : <>Du hast diesen Monat alle deine Stimmen eingesetzt.{" "}
                <b style={{ color:T.ink }}>Nächsten Monat gibt es neue.</b></>
          }
        </p>

        {/* Dots */}
        <div style={{ display:"flex", gap:12, marginBottom:16 }}>
          {Array.from({ length:maxVotes }).map((_,i) => {
            const isUsed = i < usedVotes;
            const vote   = userVotes[i];
            const proj   = vote ? projMap[vote.project_id] : null;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%", flexShrink:0,
                  background: isUsed
                    ? `linear-gradient(135deg,${T.teal},${T.tealL})`
                    : "rgba(0,0,0,0.065)",
                  border: isUsed ? "none" : `2px dashed rgba(0,0,0,0.14)`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:17,
                  boxShadow: isUsed ? S.btn(T.teal) : "none",
                }}>
                  {isUsed ? "🩷" : ""}
                </div>
                <div style={{ fontSize:12, color: isUsed ? T.ink : T.muted }}>
                  {proj ? (
                    <><b>{proj.name}</b><div style={{ fontSize:10,color:T.muted }}>Stimme vergeben</div></>
                  ) : (
                    <span style={{ color:T.muted }}>Noch verfügbar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mitglied-Hinweis */}
        {isMem ? (
          <div style={{ fontSize:11, color:T.teal, fontWeight:700 }}>
            🏅 Als Mitglied oder Talent hast du 2 Stimmen pro Monat
          </div>
        ) : (
          <div style={{ padding:"12px 14px",
            background:`${T.gold}10`, border:`1px solid ${T.gold}25`,
            borderRadius:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:3 }}>
              ⭐ Mit Mitgliedschaft auf 2 Stimmen
            </div>
            <div style={{ fontSize:11, color:T.ink2 }}>
              Mitglieder und Talente können doppelt so viel bewirken.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. GEMEINSAM ERMÖGLICHT (finanzierte Projekte + Zahlen)
// ════════════════════════════════════════════════════════════════
function GemeinsamErmoegicht({ finanziert, transp }) {
  return (
    <div style={{ padding:"32px 16px 0" }}>
      {/* Titel */}
      <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:900, color:T.ink,
        letterSpacing:"-0.022em" }}>Gemeinsam ermöglicht</h2>
      <p style={{ margin:"0 0 18px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
        Echte Projekte. Echte Wirkung. Durch euch.
      </p>

      {/* Transparenz-Zahlen */}
      {!transp.loading && (transp.eur > 0 || transp.projekte > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:10, marginBottom:20 }}>
          {[
            { emoji:"💰", val:fmtEur(transp.eur),  label:"in Projekte geflossen" },
            { emoji:"📋", val:transp.projekte,       label:"Projekte finanziert"   },
            { emoji:"👥", val:transp.menschen,       label:"Unterstützer aktiv"    },
          ].map((st, i) => (
            <div key={i} style={{
              background:T.surfaceHi, borderRadius:16, padding:"14px 10px",
              boxShadow:S.card, border:`1px solid ${T.line}`, textAlign:"center",
            }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{st.emoji}</div>
              <div style={{ fontSize:16, fontWeight:900, color:T.teal,
                letterSpacing:"-0.02em" }}>{st.val}</div>
              <div style={{ fontSize:9, color:T.muted, marginTop:3, lineHeight:1.3 }}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Finanzierte Projekte */}
      {finanziert.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:T.muted }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🌱</div>
          <div style={{ fontSize:13 }}>Die ersten Projekte werden bald finanziert.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {finanziert.map((p, i) => (
            <div key={p.id} style={{
              background:T.surfaceHi, borderRadius:20,
              boxShadow:S.card, border:`1px solid ${T.line}`,
              display:"flex", alignItems:"center", gap:0, overflow:"hidden",
              animation:"ipFade 0.32s ease both", animationDelay:`${i*0.05}s`,
            }}>
              {/* Bild */}
              <div style={{ width:80, height:80, flexShrink:0,
                background:`${p.color||T.teal}12`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:34 }}>
                {p.img_url
                  ? <img src={p.img_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : (p.icon || "🌱")
                }
              </div>
              {/* Info */}
              <div style={{ flex:1, padding:"12px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>✅</span>
                  <span style={{ fontSize:14, fontWeight:800, color:T.ink }}>{p.name}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:900, color:T.teal,
                  letterSpacing:"-0.02em" }}>
                  {fmtEur(p.awarded_eur)} finanziert
                </div>
                {p.distributed_at && (
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                    {fmtMonth(p.distributed_at?.slice(0,7))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. HERZENSPROJEKT — EMOTIONAL
// ════════════════════════════════════════════════════════════════
function HerzensprojektEmotional({ onPropose }) {
  return (
    <div style={{ padding:"32px 16px 0" }}>
      <div style={{
        background:`linear-gradient(145deg,${T.teal}14,${T.teal}04)`,
        border:`1.5px solid ${T.teal}28`,
        borderRadius:28, padding:"32px 24px", textAlign:"center",
        position:"relative", overflow:"hidden",
      }}>
        {/* Dekorative Emojis */}
        <div style={{ position:"absolute", top:18, left:18, fontSize:22,
          animation:"ipFloat 7s ease-in-out 0s infinite", opacity:0.5 }}>🌱</div>
        <div style={{ position:"absolute", top:22, right:22, fontSize:20,
          animation:"ipFloat 9s ease-in-out 1.5s infinite", opacity:0.4 }}>✨</div>

        <div style={{ fontSize:44, marginBottom:16,
          filter:"drop-shadow(0 4px 16px rgba(13,196,181,0.3))",
          animation:"ipBreath 5s ease-in-out infinite" }}>💚</div>

        <h2 style={{ margin:"0 0 10px", fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em" }}>Hast du ein Herzensprojekt?</h2>

        <p style={{ margin:"0 0 8px", fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 8px" }}>
          Kennst du etwas, das unsere Welt besser machen könnte?
        </p>
        <p style={{ margin:"0 0 24px", fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 24px" }}>
          Reiche dein Projekt ein und lass die Community mitentscheiden.
        </p>

        <button onClick={onPropose} className="ip-p" style={{
          background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
          border:"none", borderRadius:20, padding:"15px 32px",
          fontSize:15, fontWeight:750, color:"white",
          cursor:"pointer", boxShadow:S.btn(T.teal),
          display:"inline-flex", alignItems:"center", gap:9,
          letterSpacing:"-0.01em",
        }}>
          <span style={{ fontSize:18 }}>🌱</span>
          Herzensprojekt einreichen
        </button>

        <div style={{ marginTop:12, fontSize:11, color:T.muted }}>
          Dauert ~5 Minuten · Kostenlos · Kein Projekt geht leer aus
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. LIVE-TICKER (kompakt)
// ════════════════════════════════════════════════════════════════
function LiveTicker({ activities }) {
  return (
    <div style={{ padding:"28px 16px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:T.teal,
          animation:"ipPulse 1.4s ease-in-out infinite" }}/>
        <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:T.ink,
          letterSpacing:"-0.01em" }}>Live-Aktivitäten im Impact Pool</h3>
      </div>

      <div style={{ background:T.surfaceHi, borderRadius:20,
        boxShadow:S.card, border:`1px solid ${T.line}`, overflow:"hidden" }}>
        {activities.slice(0,5).map((act, i) => (
          <div key={act.id} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"11px 16px",
            borderBottom: i < Math.min(activities.length,5)-1 ? `1px solid ${T.line}` : "none",
            animation:"ipFade 0.28s ease both", animationDelay:`${i*0.04}s`,
          }}>
            <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
              overflow:"hidden", background:`${T.teal}12`,
              border:`1px solid ${T.teal}20`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>
              {act.avatar
                ? <img src={act.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : "👤"
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:T.ink, lineHeight:1.4,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <b>{act.user}</b> hat <b>{act.proj}</b> mit 1 Stimme unterstützt
              </div>
            </div>
            <div style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{act.ago}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. MECHANIK ERKLÄREN (weiter unten, klar + ruhig)
// ════════════════════════════════════════════════════════════════
function MechanikErklaeung({ onInfo }) {
  return (
    <div style={{ padding:"32px 16px 0" }}>
      <h2 style={{ margin:"0 0 6px", fontSize:18, fontWeight:900, color:T.ink,
        letterSpacing:"-0.02em" }}>So funktioniert der Impact Pool</h2>
      <p style={{ margin:"0 0 18px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
        Transparent, fair, jeden Monat neu.
      </p>

      <div style={{ background:T.surfaceHi, borderRadius:22, padding:"20px 18px",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {CYCLE_STEPS.map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
              {/* Connector */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                width:34, flexShrink:0 }}>
                <div style={{
                  width:34, height:34, borderRadius:"50%",
                  background:`${T.teal}15`, border:`1.5px solid ${T.teal}35`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
                }}>{step.icon}</div>
                {i < CYCLE_STEPS.length - 1 && (
                  <div style={{ width:1.5, height:18,
                    background:`${T.teal}28`, margin:"2px 0" }}/>
                )}
              </div>
              {/* Label */}
              <div style={{ paddingTop:7 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.ink, lineHeight:1.4 }}>
                  {i+1}. {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onInfo} className="ip-p" style={{
          marginTop:16, background:"none", border:`1px solid ${T.teal}28`,
          borderRadius:99, padding:"8px 18px", fontSize:12, fontWeight:700,
          color:T.teal, cursor:"pointer",
        }}>Mehr erfahren</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 9. FONDS-AUFTEILUNG — KOMPAKT (ganz unten)
// ════════════════════════════════════════════════════════════════
function FondsAufteilungKompakt({ pool }) {
  return (
    <div style={{ padding:"28px 16px 0" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:800, color:T.ink,
        letterSpacing:"-0.015em" }}>So wird der Pool genutzt</h3>

      <div style={{ background:T.surfaceHi, borderRadius:20, overflow:"hidden",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {POOL_SLICES.map((sl, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
            borderBottom: i < POOL_SLICES.length-1 ? `1px solid ${T.line}` : "none",
          }}>
            <div style={{ width:8, height:8, borderRadius:2,
              background:sl.color, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>
                {sl.pct}% {sl.label}
              </span>
            </div>
            {!pool.loading && (
              <span style={{ fontSize:13, fontWeight:900, color:sl.color,
                letterSpacing:"-0.01em" }}>
                {fmtEur([pool.community,pool.wirkung,pool.innovation,pool.kuration][i])}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LETZTE AUSZAHLUNG (footer-nah, kompakt)
// ════════════════════════════════════════════════════════════════
function LetzteAuszahlung({ payout, others }) {
  if (!payout?.project) return null;

  return (
    <div style={{ padding:"28px 16px 0" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:800, color:T.ink,
        letterSpacing:"-0.015em" }}>Letzte Auszahlung</h3>

      <div style={{ background:T.surfaceHi, borderRadius:20, padding:"16px 16px",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {/* Gewinner */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12,
          padding:"12px 14px", background:`${T.gold}10`,
          borderRadius:14, border:`1px solid ${T.gold}22` }}>
          <span style={{ fontSize:22 }}>🏆</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:T.gold, fontWeight:700,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>
              GEWINNER {fmtMonth(payout.month)}
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:T.ink,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {payout.project.name}
            </div>
            <div style={{ fontSize:13, color:T.teal, fontWeight:700 }}>
              {fmtEur(payout.winnerAmount)} wurden ausgezahlt
            </div>
          </div>
        </div>

        {/* Weitere Verteilungen */}
        {others.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:T.muted,
              letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
              Zusätzlich verteilt
            </div>
            {others.slice(0,4).map((o,i) => (
              <div key={o.id} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"6px 0",
                borderBottom: i < Math.min(others.length,4)-1 ? `1px solid ${T.line}` : "none" }}>
                <span style={{ fontSize:12, color:T.ink2 }}>{o.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.teal }}>
                  +{fmtEur(o.awarded_eur)}
                </span>
              </div>
            ))}
            {others.length > 4 && (
              <div style={{ fontSize:10, color:T.muted, marginTop:6 }}>
                … und {others.length-4} weitere Projekte
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// INFO SHEET — Bottom Sheet
// ════════════════════════════════════════════════════════════════
function InfoSheet({ modal, onClose }) {
  const CONTENT = {
    cycle: {
      title:"So funktioniert der Impact Pool",
      body:(
        <>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:"0 0 12px" }}>
            Jede Buchung auf HUI erzeugt eine Provision. <b>15% davon</b> fließen direkt
            in den Impact Pool — automatisch, jeden Monat.
          </p>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:"0 0 12px" }}>
            Das HUI-Team prüft Bewerbungen, nominiert drei Projekte und die Community stimmt ab.
          </p>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:0 }}>
            Das Siegerprojekt erhält seine volle Wunschsumme. Der Restbetrag wird automatisch
            auf alle anderen verteilt.{" "}
            <b style={{ color:T.teal }}>Kein Projekt geht leer aus.</b>
          </p>
        </>
      ),
    },
    vote: {
      title:"So funktioniert die Abstimmung",
      body:(
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { icon:"👤", text:"Normale Nutzer: 1 Stimme pro Monat" },
              { icon:"🏅", text:"Mitglieder & Talente: 2 Stimmen pro Monat" },
              { icon:"📅", text:"Stimmen verfallen am Monatsende — sie addieren sich nicht" },
              { icon:"🏆", text:"Projekt mit den meisten Stimmen erhält die volle Wunschsumme" },
              { icon:"🌱", text:"Restbetrag geht fair an alle anderen Projekte" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14, color:T.ink2, lineHeight:1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
  };

  const c = CONTENT[modal] || CONTENT.cycle;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900,
      background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", background:T.surfaceHi,
        borderRadius:"26px 26px 0 0",
        padding:"24px 22px 44px",
        boxShadow:"0 -8px 48px rgba(0,0,0,0.12)",
        animation:"ipFade 0.22s ease both",
        maxHeight:"82vh", overflowY:"auto",
      }}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.10)",
          margin:"0 auto 20px" }}/>
        <h3 style={{ margin:"0 0 18px", fontSize:18, fontWeight:800,
          color:T.ink, letterSpacing:"-0.02em" }}>{c.title}</h3>
        {c.body}
        <button onClick={onClose} className="ip-p" style={{
          marginTop:24, width:"100%", background:T.teal, border:"none",
          borderRadius:18, padding:"14px 0", color:"white",
          fontSize:14, fontWeight:750, cursor:"pointer",
        }}>Verstanden</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════════
function SkeletonCards({ count = 2 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ height:200, borderRadius:22,
          background:"linear-gradient(90deg,#EDE9E0 25%,#F5F0E8 50%,#EDE9E0 75%)",
          backgroundSize:"200% 100%",
          animation:"ipFade 1.5s ease-in-out infinite" }}/>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════
export default function ImpactPage(props) {
  return (
    <ImpactErrorBoundary>
      <ImpactPageInner currentUser={props.currentUser} />
    </ImpactErrorBoundary>
  );
}
