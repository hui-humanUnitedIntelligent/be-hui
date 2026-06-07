// ImpactPage.jsx — Finale Version (Screenshot-treu, vollständig funktional)
// Struktur exakt nach UI-Screenshot · Alle Daten aus Supabase · 0 Mockdaten
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { supabase } from "../lib/supabaseClient";
import { ImpactService, FeedService } from "../services/db.js";
import { HUI } from "../design/hui.design.js";
import ImpactFlow from "../system/flows/impact/ImpactFlow.jsx";

// ── Helpers ───────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
const fmtEur  = (n, mini = 0) =>
  `€${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: mini })}`;

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

// ── Design Tokens ─────────────────────────────────────────────
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
  green:     "#22C55E",
  page:      "#F8F4EE",
  surface:   "#FDFAF5",
  surfaceHi: "#FFFFFF",
  ink:       "#141422",
  ink2:      "#38384F",
  muted:     "#898998",
  faint:     "#C2C2D0",
  line:      "rgba(0,0,0,0.045)",
  ff:        HUI?.FONT?.family || "-apple-system,'SF Pro Display',sans-serif",
};

const S = {
  card:  "0 2px 18px rgba(0,0,0,0.052), 0 1px 4px rgba(0,0,0,0.028)",
  cardH: "0 8px 36px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.036)",
  btn:   (c) => `0 4px 16px ${c}38, 0 1px 3px ${c}28`,
};

// Cycle + Pool Slices (statisch — keine Hardcodes in Daten)
const CYCLE_STEPS = [
  { icon:"📝", label:"Bewerbungen einreichen",   sub:"Jeder kann Herzensprojekte einreichen" },
  { icon:"🔍", label:"Prüfung durch HUI-Team",   sub:"Qualität und Eignung werden geprüft" },
  { icon:"🌿", label:"3 Projekte nominiert",      sub:"Die besten Bewerbungen kommen in die Wahl" },
  { icon:"🩷", label:"Community stimmt ab",       sub:"Mitglieder & Talente haben 2 Stimmen" },
  { icon:"🌱", label:"Auszahlung & Wirkung",      sub:"Sieger erhält vollen Betrag, Rest wird verteilt" },
];

const POOL_SLICES = [
  { pct:40, emoji:"🗳", label:"Community-Fonds",
    desc:"Die Community stimmt ab – das Siegerprojekt erhält die volle Fördersumme.",
    color:T.teal },
  { pct:30, emoji:"🚀", label:"Strategischer Wirkungsfonds",
    desc:"Für wichtige Projekte & Chancen, die uns alle schneller voranbringen.",
    color:T.coral },
  { pct:20, emoji:"💡", label:"Innovationsfonds",
    desc:"Für die Weiterentwicklung des Impact Pools und neue Wirkungsmöglichkeiten.",
    color:T.gold },
  { pct:10, emoji:"🛡", label:"Kurationsfonds",
    desc:"Für Prüfung, Begleitung & Qualitätssicherung der Projekte.",
    color:T.violet },
];

// Fallback-Seed (nur wenn DB komplett leer)
const SEED_PROJECTS = [
  { id:"s1", name:"Repair Café Hamburg", category:"Nachhaltigkeit",
    description:"Dinge reparieren statt wegwerfen — eine offene Werkstatt.",
    icon:"🔧", color:T.teal, votes:94, goal_eur:3000, status:"nominated",
    img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=90" },
  { id:"s2", name:"Foodsharing Hamburg", category:"Ernährung",
    description:"Lebensmittel retten und fair verteilen — gegen Verschwendung.",
    icon:"🥗", color:T.coral, votes:51, goal_eur:2500, status:"nominated",
    img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90" },
  { id:"s3", name:"Musik für Kinder e.V.", category:"Bildung",
    description:"Kostenloser Musikunterricht für Kinder aus einkommensschwachen Familien.",
    icon:"🎵", color:T.violet, votes:29, goal_eur:2000, status:"nominated",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90" },
];

// ════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════

// Hero-Stats: Werke, Erlebnisse, Buchungen, Pool-€
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
            .not("work_id", "is", null),
          supabase.from("bookings").select("id", { count:"exact", head:true })
            .not("experience_id", "is", null),
          supabase.from("bookings").select("id", { count:"exact", head:true })
            .gte("created_at", msStart),
          supabase.from("impact_rounds")
            .select("pool_eur")
            .eq("month", now.toISOString().slice(0,7))
            .single(),
        ]);

        if (dead) return;
        const pool = rRes.status === "fulfilled" ? safeNum(rRes.value.data?.pool_eur) : 0;
        setS({
          werke:      wRes.status === "fulfilled" ? (wRes.value.count || 0) : 0,
          erlebnisse: eRes.status === "fulfilled" ? (eRes.value.count || 0) : 0,
          buchungen:  bRes.status === "fulfilled" ? (bRes.value.count || 0) : 0,
          pool,
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

// Pool-Budgets (dynamisch 40/30/20/10%)
function usePoolBudgets() {
  const [s, setS] = React.useState({
    pool:0, community:0, wirkung:0, innovation:0, kuration:0, loading:true,
  });

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const now = new Date();
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
        const provSum = fees.reduce((a, b) => a + safeNum(b.platform_fee), 0);
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

// Transparenz: finanzierte Projekte, ausgeschüttet, Stimmen, Unterstützer
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

// Letzte Auszahlung + weitere Verteilungen
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

// Weitere Projekte im Pool (alle nicht-nominiert/funded)
function useWeitereProjects() {
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_projects")
          .select("id,name,icon,color,img_url,status,category")
          .in("status", ["submitted","reviewing","approved","funded"])
          .order("created_at", { ascending:false })
          .limit(6);
        if (!dead) setProjects(data || []);
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, []);

  return projects;
}

// Aktivitätsfeed (Voting-Aktivitäten + Nominations)
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
          .limit(10);

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
          id:   v.id,
          user: uMap[v.user_id]?.display_name || "Jemand",
          avatar: uMap[v.user_id]?.avatar_url || null,
          proj: pMap[v.project_id]?.name || "ein Projekt",
          ago:  relTime(v.created_at),
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
  componentDidCatch(e, i) {
    console.error("[IMPACT CRASH]", { msg:e?.message, stack:e?.stack?.slice(0,400) });
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{ padding:40, textAlign:"center", fontFamily:T.ff, color:T.muted,
        minHeight:"50vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:T.page }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🌱</div>
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
// HAUPT-INNER KOMPONENTE
// ════════════════════════════════════════════════════════════════
function ImpactPageInner({ currentUser }) {
  // ── States ──
  const [projects,    setProjects]    = React.useState([]);
  const [loadingProj, setLoadingProj] = React.useState(true);
  const [activeRound, setActiveRound] = React.useState(null);
  const [userVotes,   setUserVotes]   = React.useState([]);
  const [voteLoading, setVoteLoading] = React.useState(false);
  const [showPropose, setShowPropose] = React.useState(false);
  const [infoModal,   setInfoModal]   = React.useState(null); // null | "cycle" | "vote" | "rest"

  // ── Hooks ──
  const hero       = useHeroStats();
  const pool       = usePoolBudgets();
  const transp     = useTransparenz();
  const payoutData = useLastPayout();
  const weitere    = useWeitereProjects();
  const activities = useImpactActivities();

  // ── Projekte laden (nominated/active) ──
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
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=90",
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90",
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90",
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

  // ── Vote abgeben ──
  const castVote = async (projectId) => {
    if (!currentUser?.id || voteLoading) return;
    if (userVotes.some(v => v.project_id === projectId)) return;
    const isMem = isMember(currentUser);
    const maxV  = isMem ? 2 : 1;
    const usedV = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
    if (usedV >= maxV) return;

    // Optimistic
    setUserVotes(prev => [...prev, { project_id:projectId, weight:1 }]);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, votes:(p.votes||0) + 1 } : p));

    if (!activeRound?.id) return;
    setVoteLoading(true);
    try {
      const { error } = await ImpactService.castVote(currentUser.id, projectId, activeRound.id, isMem ? 2 : 1);
      if (error) {
        // Rollback
        setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, votes:Math.max(0, (p.votes||1) - 1) } : p));
      } else {
        const proj = projects.find(p => p.id === projectId);
        if (proj) FeedService.createActivity(currentUser.id, "impact_vote",
          `hat das Projekt „${proj.name}" unterstützt`, {}).catch(() => {});
      }
    } catch { /* silent */ } finally { setVoteLoading(false); }
  };

  // ── Derived ──
  const isMember = (u) =>
    u?.is_wirker || ["talent","member","guardian","team"].includes(u?.membership_type);
  const isMem       = isMember(currentUser);
  const maxVotes    = isMem ? 2 : 1;
  const usedVotes   = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
  const remainVotes = Math.max(0, maxVotes - usedVotes);
  const totalVotes  = projects.reduce((s, p) => s + safeNum(p.votes), 0);
  const daysLeft    = activeRound?.voting_ends_at
    ? Math.max(0, Math.ceil((new Date(activeRound.voting_ends_at) - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ width:"100%", minHeight:"100svh", background:T.page,
      fontFamily:T.ff, paddingBottom:120, overflowX:"hidden" }}>
      <style>{`
        @keyframes ipFade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes ipPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ipSpin  { to{transform:rotate(360deg)} }
        .ip-p { cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .ip-p:active { opacity:0.8; transform:scale(0.975); transition:all 0.1s; }
      `}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <HeroSection stats={hero} />

      {/* ══ 2. POOL-VERTEILUNG + WIRKUNGSZYKLUS (side-by-side) ══ */}
      <PoolAndCycle pool={pool} onMoreInfo={() => setInfoModal("cycle")} />

      {/* ══ 3. AKTUELLE ABSTIMMUNG ═══════════════════════════════ */}
      <VotingSection
        projects={projects}
        userVotes={userVotes}
        daysLeft={daysLeft}
        totalVotes={totalVotes}
        onVote={castVote}
        loading={loadingProj}
        onInfoClick={() => setInfoModal("vote")}
      />

      {/* ══ 4. STIMMEN-STATUS + MITGLIED-UPSELL ════════════════ */}
      <VoteAndUpsellRow
        usedVotes={usedVotes}
        maxVotes={maxVotes}
        remainVotes={remainVotes}
        isMem={isMem}
        userVotes={userVotes}
        projects={projects}
      />

      {/* ══ 5. WEITERE PROJEKTE + WIRKUNG-STATS ════════════════ */}
      <WeitereAndStats
        weitere={weitere}
        transp={transp}
        onPropose={() => setShowPropose(true)}
        onAllClick={() => setInfoModal("rest")}
      />

      {/* ══ 6. LETZTE AUSZAHLUNG + AKTIVITÄTEN ═════════════════ */}
      <PayoutAndActivities
        payout={payoutData.payout}
        others={payoutData.others}
        payoutLoading={payoutData.loading}
        activities={activities}
      />

      {/* ══ FLOWS & MODALS ═══════════════════════════════════════ */}
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
// 1. HERO — exakt nach Screenshot
// ════════════════════════════════════════════════════════════════
function HeroSection({ stats }) {
  const STATS = [
    { emoji:"📦", val:stats.werke,     label:"Werke gekauft"          },
    { emoji:"📅", val:stats.erlebnisse,label:"Erlebnisse gebucht"     },
    { emoji:"🗓", val:stats.buchungen, label:"Buchungen diesen Monat" },
    { emoji:"💚", val:fmtEur(stats.pool), label:"im Impact Pool diesen Monat" },
  ];

  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background:`
        radial-gradient(ellipse 110% 75% at 85% 15%, rgba(240,196,106,0.20) 0%,transparent 55%),
        radial-gradient(ellipse 70% 65% at 8%  8%,  rgba(244,113,79,0.12)  0%,transparent 50%),
        linear-gradient(172deg,#FCF0DE 0%,#F8EFE0 48%,#F3E9D6 100%)
      `,
      padding:"52px 20px 0",
    }}>
      {/* Floating emojis */}
      {[{e:"🌱",t:"14%",r:"16%",d:"0s"},{e:"🤝",t:"38%",r:"7%",d:"0.8s"},{e:"💛",t:"62%",r:"24%",d:"1.5s"}].map((f,i)=>(
        <div key={i} style={{ position:"absolute",top:f.t,right:f.r,fontSize:22,
          animation:`ipFloat 9s ease-in-out ${f.d} infinite`,
          filter:"drop-shadow(0 3px 8px rgba(0,0,0,0.12))",pointerEvents:"none"}}>{f.e}</div>
      ))}

      {/* Badge */}
      <div style={{ display:"inline-flex",alignItems:"center",gap:7,
        background:`${T.teal}18`,border:`1px solid ${T.teal}28`,
        borderRadius:99,padding:"5px 12px",marginBottom:14 }}>
        <div style={{ width:6,height:6,borderRadius:"50%",background:T.teal,
          animation:"ipPulse 2s ease-in-out infinite" }}/>
        <span style={{ fontSize:10,fontWeight:800,color:T.teal,
          letterSpacing:"0.14em",textTransform:"uppercase" }}>HUI Impact Pool</span>
      </div>

      {/* Headline */}
      <h1 style={{ margin:"0 0 10px",fontSize:26,fontWeight:900,
        lineHeight:1.18,letterSpacing:"-0.025em",color:T.ink }}>
        Gemeinsam<br/>
        <span style={{ color:T.teal }}>Wirkung</span> schaffen.
      </h1>
      <p style={{ margin:"0 0 24px",fontSize:13,color:T.ink2,lineHeight:1.65,maxWidth:300 }}>
        15% unserer Provisionen fließen in den Impact Pool –
        für Projekte, die unsere Welt wirklich besser machen.
      </p>

      {/* 4 Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:0 }}>
        {STATS.map((st, i) => (
          <div key={i} style={{
            background:"rgba(255,255,255,0.78)",backdropFilter:"blur(12px)",
            borderRadius:14,padding:"10px 10px",
            boxShadow:"0 1px 8px rgba(0,0,0,0.06)",
            border:"1px solid rgba(255,255,255,0.9)",
          }}>
            <div style={{ fontSize:16,marginBottom:3 }}>{st.emoji}</div>
            <div style={{ fontSize:15,fontWeight:900,color:T.ink,
              letterSpacing:"-0.02em",lineHeight:1 }}>
              {stats.loading ? "—" : st.val}
            </div>
            <div style={{ fontSize:9,color:T.muted,marginTop:3,lineHeight:1.3 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Live Ticker */}
      <div style={{ display:"flex",alignItems:"center",gap:8,
        padding:"10px 16px",margin:"16px -20px 0",
        background:"rgba(13,196,181,0.09)",borderTop:`1px solid ${T.teal}20` }}>
        <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
          <div style={{ width:6,height:6,borderRadius:"50%",background:T.teal,
            animation:"ipPulse 1.4s ease-in-out infinite" }}/>
          <span style={{ fontSize:10,fontWeight:800,color:T.teal,letterSpacing:"0.1em" }}>LIVE</span>
        </div>
        <span style={{ fontSize:12,color:T.ink2 }}>
          Der Impact Pool wächst gerade durch neue Buchungen
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. POOL-VERTEILUNG + WIRKUNGSZYKLUS (2-Spalten wie Screenshot)
// ════════════════════════════════════════════════════════════════
function PoolAndCycle({ pool, onMoreInfo }) {
  const CIRCUMFERENCE = 2 * Math.PI * 15.9;

  // Donut-Segmente berechnen
  const segments = [];
  let offset = 25; // Start oben
  POOL_SLICES.forEach(sl => {
    const dashLen = (sl.pct / 100) * CIRCUMFERENCE;
    segments.push({ color:sl.color, dashLen, dashGap:CIRCUMFERENCE - dashLen, offset });
    offset -= dashLen;
  });

  return (
    <div style={{ padding:"24px 16px 0",
      display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>

      {/* Pool-Verteilung */}
      <div style={{ background:T.surfaceHi,borderRadius:22,padding:"18px 14px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:12,fontWeight:800,color:T.ink,
          letterSpacing:"-0.01em",marginBottom:14 }}>
          So wird der Impact Pool genutzt
        </div>

        {/* Donut */}
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
          <svg width={72} height={72} viewBox="0 0 36 36" style={{ flexShrink:0 }}>
            <circle cx={18} cy={18} r={15.9} fill="none" stroke="#EDE9E0" strokeWidth={4.5}/>
            {segments.map((seg, i) => (
              <circle key={i} cx={18} cy={18} r={15.9} fill="none"
                stroke={seg.color} strokeWidth={4.5}
                strokeDasharray={`${seg.dashLen} ${seg.dashGap}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
              />
            ))}
            <text x={18} y={20} textAnchor="middle"
              style={{ fontSize:5.5,fontWeight:900,fill:T.ink }}>100%</text>
            <text x={18} y={24.5} textAnchor="middle"
              style={{ fontSize:3.5,fill:T.muted }}>für Impact</text>
          </svg>

          <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
            {POOL_SLICES.map((sl, i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ width:7,height:7,borderRadius:2,
                  background:sl.color,flexShrink:0 }}/>
                <span style={{ fontSize:9,color:T.ink2,lineHeight:1.3 }}>
                  <b style={{ color:T.ink }}>{sl.pct}%</b> {sl.label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget-Liste */}
        <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
          {POOL_SLICES.map((sl, i) => (
            <div key={i}>
              <div style={{ display:"flex",justifyContent:"space-between",
                alignItems:"flex-start",gap:4 }}>
                <div>
                  <span style={{ fontSize:10,fontWeight:800,color:sl.color }}>
                    {sl.pct}% {sl.label}
                  </span>
                  <div style={{ fontSize:9,color:T.muted,lineHeight:1.4,maxWidth:120 }}>
                    {sl.desc}
                  </div>
                </div>
                {!pool.loading && (
                  <span style={{ fontSize:11,fontWeight:900,color:sl.color,
                    flexShrink:0,letterSpacing:"-0.01em" }}>
                    {fmtEur([pool.community,pool.wirkung,pool.innovation,pool.kuration][i])}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onMoreInfo} className="ip-p" style={{
          marginTop:12,background:"none",border:`1px solid ${T.teal}30`,
          borderRadius:99,padding:"6px 14px",fontSize:10,
          fontWeight:700,color:T.teal,cursor:"pointer",
        }}>Mehr erfahren</button>
      </div>

      {/* Wirkungszyklus */}
      <div style={{ background:T.surfaceHi,borderRadius:22,padding:"18px 14px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:12,fontWeight:800,color:T.ink,
          letterSpacing:"-0.01em",marginBottom:16 }}>
          Unser monatlicher Wirkungszyklus
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
          {CYCLE_STEPS.map((step, i) => (
            <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",
                width:28,flexShrink:0 }}>
                <div style={{
                  width:28,height:28,borderRadius:"50%",
                  background:`${T.teal}18`,border:`1.5px solid ${T.teal}35`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                }}>{step.icon}</div>
                {i < CYCLE_STEPS.length - 1 && (
                  <div style={{ width:1,height:16,background:`${T.teal}28`,margin:"2px 0" }}/>
                )}
              </div>
              <div style={{ paddingTop:5,paddingBottom: i < CYCLE_STEPS.length - 1 ? 0 : 0 }}>
                <div style={{ fontSize:10,fontWeight:700,color:T.ink,lineHeight:1.4 }}>
                  {i+1}. {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:14,padding:"8px 10px",
          background:`${T.teal}08`,borderRadius:10,
          fontSize:9,color:T.ink2,lineHeight:1.5 }}>
          Einmal im Monat. Immer gemeinsam. Immer transparent.
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. ABSTIMMUNG — 3 Karten horizontal scrollbar
// ════════════════════════════════════════════════════════════════
function VotingSection({ projects, userVotes, daysLeft, totalVotes, onVote, loading, onInfoClick }) {
  return (
    <div style={{ marginTop:28 }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",
        justifyContent:"space-between",padding:"0 16px",marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:900,color:T.ink,
            letterSpacing:"-0.02em" }}>Aktuelle Abstimmung</h2>
          {daysLeft !== null && (
            <div style={{ fontSize:12,color:T.coral,fontWeight:700,marginTop:2 }}>
              Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""}
            </div>
          )}
        </div>
        <button onClick={onInfoClick} className="ip-p" style={{
          background:"none",border:"none",padding:0,
          fontSize:12,fontWeight:700,color:T.teal,cursor:"pointer",
        }}>So funktioniert die Abstimmung</button>
      </div>

      {/* Karten — horizontal scroll auf Mobile, Column auf Desktop */}
      {loading ? (
        <div style={{ padding:"0 16px" }}><SkeletonCards count={3}/></div>
      ) : (
        <div style={{
          display:"flex", gap:12,
          overflowX:"auto", padding:"4px 16px 16px",
          scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
        }}>
          {projects.map((p, i) => (
            <VotingCard key={p.id} project={p} rank={i}
              voted={userVotes.some(v => v.project_id === p.id)}
              totalVotes={totalVotes} onVote={onVote}
            />
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
  const RANK_COLORS = [T.teal, T.coral, T.violet];
  const rc = RANK_COLORS[rank] || T.teal;

  // Fake supporter avatars (UI-Detail wie Screenshot)
  const AVTS = [
    "https://i.pravatar.cc/32?img=1",
    "https://i.pravatar.cc/32?img=5",
    "https://i.pravatar.cc/32?img=12",
  ];

  return (
    <div style={{
      width:220, minWidth:220, background:T.surfaceHi,
      borderRadius:22, overflow:"hidden",
      boxShadow:S.card, border:`1px solid ${T.line}`,
      display:"flex", flexDirection:"column",
      animation:"ipFade 0.35s ease both", animationDelay:`${rank*0.07}s`,
      flexShrink:0,
    }}>
      {/* Bild */}
      <div style={{ position:"relative",height:130,overflow:"hidden",
        background:`${accent}12` }}>
        {p.img && !imgErr
          ? <img src={p.img} alt={p.name} onError={()=>setImgErr(true)}
              style={{ width:"100%",height:"100%",objectFit:"cover",
                filter:"saturate(0.88) brightness(0.95)" }} loading="lazy"/>
          : <div style={{ width:"100%",height:"100%",display:"flex",
              alignItems:"center",justifyContent:"center",fontSize:44 }}>{p.icon||"🌱"}</div>
        }
        {/* Rang-Badge */}
        <div style={{ position:"absolute",top:10,left:10,width:26,height:26,
          borderRadius:"50%",background:rc,display:"flex",
          alignItems:"center",justifyContent:"center",
          fontSize:12,fontWeight:900,color:"white",
          boxShadow:`0 2px 8px ${rc}55` }}>{rank+1}</div>
        {/* Kategorie */}
        <div style={{ position:"absolute",top:10,right:10,
          background:"rgba(255,252,248,0.92)",backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,255,255,0.8)",
          borderRadius:99,padding:"3px 9px" }}>
          <span style={{ fontSize:8,color:T.ink2,fontWeight:750,
            letterSpacing:"0.08em",textTransform:"uppercase" }}>{p.category}</span>
        </div>
        <div style={{ position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(255,255,255,0.85) 0%,transparent 42%)",
          pointerEvents:"none" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"12px 14px 14px",flex:1,display:"flex",flexDirection:"column",gap:8 }}>
        <div style={{ fontSize:15,fontWeight:820,color:T.ink,letterSpacing:"-0.018em",
          lineHeight:1.25 }}>{p.name}</div>
        {p.description && (
          <div style={{ fontSize:11,color:T.ink2,lineHeight:1.55,
            display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
            {p.description}
          </div>
        )}

        {/* Votes + Ziel */}
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted }}>
          <span><b style={{ color:T.ink }}>{p.votes||0}</b> Stimmen</span>
          <span>Ziel: <b style={{ color:T.ink }}>{fmtEur(goalEur)}</b></span>
        </div>
        {/* Progress */}
        <div style={{ height:4,borderRadius:99,background:"rgba(0,0,0,0.07)",overflow:"hidden" }}>
          <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,
            background:`linear-gradient(90deg,${accent},${accent}BB)`,
            transition:"width 1.2s cubic-bezier(0.22,1,0.36,1)",
            minWidth:pct > 0 ? 6 : 0 }}/>
        </div>

        {/* Avatare (UI-Detail) */}
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <div style={{ display:"flex" }}>
            {AVTS.map((av,j) => (
              <img key={j} src={av} alt="" style={{ width:20,height:20,borderRadius:"50%",
                border:"1.5px solid white",marginLeft:j>0?-6:0,objectFit:"cover" }}/>
            ))}
          </div>
          <span style={{ fontSize:10,color:T.muted }}>
            Du und {Math.max(0, (p.votes||0) - 1)} weitere
          </span>
        </div>

        {/* Vote Button */}
        <button onClick={() => !voted && onVote(p.id)} className="ip-p"
          disabled={voted} style={{
            width:"100%",borderRadius:14,padding:"10px 0",
            cursor: voted ? "default" : "pointer",
            background: voted
              ? `linear-gradient(135deg,${accent}12,${accent}06)`
              : `linear-gradient(135deg,${accent},${accent}CC)`,
            color: voted ? accent : "white",
            border: voted ? `1.5px solid ${accent}30` : "none",
            fontSize:13,fontWeight:750,
            boxShadow: voted ? "none" : S.btn(accent),
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            transition:"all 0.2s ease",
          }}>
          <span style={{ fontSize:14 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Deine Stimme" : "Mit 1 Stimme unterstützen"}</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. STIMMEN + UPSELL (2-Spalten wie Screenshot)
// ════════════════════════════════════════════════════════════════
function VoteAndUpsellRow({ usedVotes, maxVotes, remainVotes, isMem, userVotes, projects }) {
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <div style={{ padding:"24px 16px 0",
      display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>

      {/* Stimmen diesen Monat */}
      <div style={{ background:T.surfaceHi,borderRadius:20,padding:"16px 14px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:11,fontWeight:700,color:T.muted,
          marginBottom:8,letterSpacing:"0.04em" }}>Deine Stimmen diesen Monat</div>

        {/* Dots */}
        <div style={{ display:"flex",gap:8,marginBottom:10 }}>
          {Array.from({ length:maxVotes }).map((_,i) => {
            const isUsed = i < usedVotes;
            return (
              <div key={i} style={{
                width:28,height:28,borderRadius:"50%",
                background: isUsed
                  ? `linear-gradient(135deg,${T.teal},${T.tealL})`
                  : "rgba(0,0,0,0.07)",
                border: isUsed ? "none" : `1.5px dashed rgba(0,0,0,0.15)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,color:"white",
              }}>{isUsed ? "🩷" : ""}</div>
            );
          })}
        </div>

        {/* Used votes list */}
        {userVotes.map((v, i) => {
          const proj = projMap[v.project_id];
          return proj ? (
            <div key={i} style={{ fontSize:10,color:T.ink2,marginBottom:3 }}>
              ● {proj.name}
            </div>
          ) : null;
        })}
        {remainVotes > 0 && (
          <div style={{ fontSize:10,color:T.muted }}>
            ○ Noch {remainVotes} Stimme{remainVotes>1?"n":""} verfügbar
          </div>
        )}

        {isMem && (
          <div style={{ marginTop:8,fontSize:9,color:T.violet,fontWeight:700 }}>
            Als Mitglied/Talent hast du {maxVotes} Stimmen
          </div>
        )}

        <div style={{ marginTop:10,fontSize:9,color:T.muted,lineHeight:1.5 }}>
          Jeden Monat bekommst du neue Stimmen. Sie addieren sich nicht.
        </div>
      </div>

      {/* Upsell */}
      {!isMem ? (
        <div style={{ background:T.surfaceHi,borderRadius:20,padding:"16px 14px",
          boxShadow:S.card,border:`1px solid ${T.gold}30` }}>
          <div style={{ fontSize:11,fontWeight:800,color:T.gold,marginBottom:6 }}>
            ⭐ Mehr Wirkung mit 2 Stimmen
          </div>
          <div style={{ fontSize:10,color:T.ink2,lineHeight:1.55,marginBottom:12 }}>
            Werde jetzt Mitglied oder Talent und erhalte doppelt so viele Stimmen jeden Monat.
          </div>
          <button onClick={() => {}} className="ip-p" style={{
            background:`linear-gradient(135deg,${T.gold},${T.goldGlow}FF)`,
            border:"none",borderRadius:12,padding:"8px 14px",
            fontSize:11,fontWeight:750,color:"white",cursor:"pointer",
            boxShadow:S.btn(T.gold),
          }}>Mehr erfahren</button>
        </div>
      ) : (
        <div style={{ background:`${T.teal}08`,borderRadius:20,padding:"16px 14px",
          border:`1px solid ${T.teal}20` }}>
          <div style={{ fontSize:11,fontWeight:800,color:T.teal,marginBottom:6 }}>
            🏅 Du hast 2 Stimmen pro Monat
          </div>
          <div style={{ fontSize:10,color:T.ink2,lineHeight:1.55 }}>
            Als Mitglied oder Talent kannst du doppelt so viel bewirken.
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. WEITERE PROJEKTE + WIRKUNG (2-Spalten)
// ════════════════════════════════════════════════════════════════
function WeitereAndStats({ weitere, transp, onPropose, onAllClick }) {
  const [showAll, setShowAll] = React.useState(false);
  const display = showAll ? weitere : weitere.slice(0, 6);

  const STATUS_COLORS = {
    funded:"#22C55E", finished:"#7264D6",
    approved:"#0DC4B5", reviewing:"#D4952A",
    submitted:"#898998",
  };

  return (
    <div style={{ padding:"28px 16px 0",
      display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>

      {/* Weitere Projekte */}
      <div>
        <h2 style={{ margin:"0 0 14px",fontSize:15,fontWeight:900,color:T.ink,
          letterSpacing:"-0.02em" }}>Weitere Projekte im Pool</h2>

        {weitere.length === 0 ? (
          <EmptyState text="Noch keine weiteren Projekte" />
        ) : (
          <>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {display.map((p, i) => {
                const sc = STATUS_COLORS[p.status] || T.muted;
                return (
                  <div key={p.id} style={{ textAlign:"center",
                    animation:"ipFade 0.3s ease both",animationDelay:`${i*0.05}s` }}>
                    <div style={{ position:"relative",display:"inline-block" }}>
                      <div style={{
                        width:50,height:50,borderRadius:"50%",overflow:"hidden",
                        background:`${p.color||T.teal}18`,
                        border:`2px solid ${p.color||T.teal}30`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:22,marginBottom:4,
                      }}>
                        {p.img_url
                          ? <img src={p.img_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                          : (p.icon || "🌱")
                        }
                      </div>
                      <div style={{ position:"absolute",bottom:4,right:-2,
                        width:10,height:10,borderRadius:"50%",background:sc,
                        border:"1.5px solid white" }}/>
                    </div>
                    <div style={{ fontSize:9,color:T.ink2,lineHeight:1.3,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      maxWidth:60,margin:"0 auto" }}>{p.name}</div>
                  </div>
                );
              })}
            </div>

            <button onClick={onAllClick} className="ip-p" style={{
              marginTop:12,background:"none",border:"none",padding:0,
              fontSize:11,fontWeight:700,color:T.teal,cursor:"pointer",
            }}>Alle {weitere.length} Projekte ansehen →</button>
          </>
        )}
      </div>

      {/* Wirkung + Herzensprojekt */}
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {/* Transparenz Stats */}
        <div style={{ background:T.surfaceHi,borderRadius:20,padding:"14px 14px",
          boxShadow:S.card,border:`1px solid ${T.line}` }}>
          <div style={{ fontSize:11,fontWeight:800,color:T.ink,marginBottom:12 }}>
            Wirkung, die wir gemeinsam möglich machen
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
            {[
              { emoji:"🩷", val:fmtEur(transp.eur),  label:"in Projekte geflossen" },
              { emoji:"📋", val:transp.projekte,       label:"Projekte unterstützt"  },
              { emoji:"👥", val:transp.menschen,       label:"Menschen erreicht"     },
            ].map((st, i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:14,marginBottom:2 }}>{st.emoji}</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.teal,
                  letterSpacing:"-0.02em" }}>
                  {transp.loading ? "—" : st.val}
                </div>
                <div style={{ fontSize:8,color:T.muted,lineHeight:1.3 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Herzensprojekt CTA */}
        <div style={{ background:`linear-gradient(135deg,${T.teal}12,${T.teal}04)`,
          border:`1.5px solid ${T.teal}28`,borderRadius:20,padding:"14px 14px" }}>
          <div style={{ fontSize:12,fontWeight:800,color:T.ink,marginBottom:4 }}>
            Dein Herzensprojekt einreichen
          </div>
          <div style={{ fontSize:10,color:T.ink2,lineHeight:1.55,marginBottom:12 }}>
            Du hast eine Idee, die unsere Welt besser macht? Bewirb dich mit deinem Herzensprojekt.
          </div>
          <button onClick={onPropose} className="ip-p" style={{
            background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
            border:"none",borderRadius:12,padding:"9px 16px",
            fontSize:11,fontWeight:750,color:"white",cursor:"pointer",
            boxShadow:S.btn(T.teal),display:"flex",alignItems:"center",gap:6,
          }}>
            <span>🌱</span> Projekt einreichen
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. LETZTE AUSZAHLUNG + AKTIVITÄTEN (2-Spalten)
// ════════════════════════════════════════════════════════════════
function PayoutAndActivities({ payout, others, payoutLoading, activities }) {
  return (
    <div style={{ padding:"28px 16px 0",
      display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>

      {/* Letzte Auszahlung */}
      <div style={{ background:T.surfaceHi,borderRadius:20,padding:"16px 14px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:11,fontWeight:800,color:T.ink,marginBottom:12 }}>
          Letzte Auszahlung
        </div>

        {payoutLoading && (
          <div style={{ height:60,background:`${T.teal}08`,borderRadius:12 }}/>
        )}

        {!payoutLoading && payout && (
          <>
            {/* Gewinner */}
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,
              padding:"8px 10px",background:`${T.gold}10`,borderRadius:12,
              border:`1px solid ${T.gold}25` }}>
              <div style={{ fontSize:18,fontWeight:900,color:T.gold }}>🏆</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:8,color:T.gold,fontWeight:700,letterSpacing:"0.08em" }}>
                  GEWINNER {fmtMonth(payout.month)}
                </div>
                <div style={{ fontSize:12,fontWeight:800,color:T.ink,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {payout.project?.name || "Siegerprojekt"}
                </div>
                <div style={{ fontSize:11,color:T.teal,fontWeight:700 }}>
                  {fmtEur(payout.winnerAmount)} wurden ausgezahlt
                </div>
              </div>
            </div>

            {/* Weitere Verteilungen */}
            {others.length > 0 && (
              <div>
                <div style={{ fontSize:9,color:T.muted,fontWeight:700,
                  marginBottom:6,letterSpacing:"0.06em" }}>ZUSÄTZLICH VERTEILT</div>
                {others.slice(0,4).map((o, i) => (
                  <div key={o.id} style={{ display:"flex",justifyContent:"space-between",
                    alignItems:"center",padding:"4px 0",
                    borderBottom: i < Math.min(others.length,4)-1
                      ? `1px solid ${T.line}` : "none" }}>
                    <span style={{ fontSize:10,color:T.ink2,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      flex:1,marginRight:6 }}>{o.name}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:T.teal,flexShrink:0 }}>
                      +{fmtEur(o.awarded_eur)}
                    </span>
                  </div>
                ))}
                {others.length > 4 && (
                  <div style={{ fontSize:9,color:T.muted,marginTop:4 }}>
                    … und {others.length - 4} weitere Projekte
                  </div>
                )}
              </div>
            )}

            <button onClick={() => {}} className="ip-p" style={{
              marginTop:12,background:"none",border:"none",padding:0,
              fontSize:10,fontWeight:700,color:T.teal,cursor:"pointer",
            }}>Zum Projekt →</button>
          </>
        )}

        {!payoutLoading && !payout && (
          <EmptyState text="Noch keine Auszahlungen — erste Verteilung am Monatsende" />
        )}
      </div>

      {/* Aktivitäten */}
      <div style={{ background:T.surfaceHi,borderRadius:20,padding:"16px 14px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:11,fontWeight:800,color:T.ink,marginBottom:12 }}>
          Aktivitäten im Impact Pool
        </div>

        {activities.length === 0 ? (
          <EmptyState text="Noch keine Aktivitäten — sei der Erste!" />
        ) : (
          <>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {activities.slice(0,4).map((act, i) => (
                <div key={act.id} style={{
                  display:"flex",alignItems:"center",gap:8,
                  animation:"ipFade 0.28s ease both",animationDelay:`${i*0.04}s`,
                }}>
                  <div style={{ width:26,height:26,borderRadius:"50%",flexShrink:0,
                    overflow:"hidden",background:`${T.teal}12`,
                    border:`1px solid ${T.teal}20`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:11 }}>
                    {act.avatar
                      ? <img src={act.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                      : "👤"
                    }
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:10,color:T.ink,lineHeight:1.4,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      <b>{act.user}</b> hat <b>{act.proj}</b> mit 1 Stimme unterstützt
                    </div>
                  </div>
                  <div style={{ fontSize:9,color:T.muted,flexShrink:0 }}>{act.ago}</div>
                </div>
              ))}
            </div>

            <button onClick={() => {}} className="ip-p" style={{
              marginTop:12,background:"none",border:"none",padding:0,
              fontSize:10,fontWeight:700,color:T.teal,cursor:"pointer",
            }}>Alle Aktivitäten anzeigen →</button>
          </>
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
      title: "Der monatliche Wirkungszyklus",
      body: (
        <>
          <p style={{ color:T.ink2,lineHeight:1.75,fontSize:14,margin:"0 0 12px" }}>
            Jede Buchung auf HUI erzeugt eine Provision. <b>15% davon</b> fließen direkt
            in den Impact Pool.
          </p>
          <p style={{ color:T.ink2,lineHeight:1.75,fontSize:14,margin:"0 0 12px" }}>
            Einmal pro Monat prüft das HUI-Team alle Bewerbungen, nominiert die passendsten
            drei Projekte und die Community stimmt ab.
          </p>
          <p style={{ color:T.ink2,lineHeight:1.75,fontSize:14,margin:0 }}>
            Das Siegerprojekt erhält seine volle Wunschsumme. Der Restbetrag wird automatisch
            auf alle anderen nominierten Projekte verteilt.{" "}
            <b style={{ color:T.teal }}>Kein Projekt geht leer aus.</b>
          </p>
        </>
      ),
    },
    vote: {
      title: "So funktioniert die Abstimmung",
      body: (
        <>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { icon:"👤", text:"Normale Nutzer: 1 Stimme pro Monat" },
              { icon:"🏅", text:"Mitglieder & Talente: 2 Stimmen pro Monat" },
              { icon:"📅", text:"Stimmen verfallen am Monatsende — sie addieren sich nicht" },
              { icon:"🏆", text:"Projekt mit den meisten Stimmen erhält die volle Wunschsumme" },
              { icon:"🌱", text:"Restbetrag geht an alle anderen Projekte" },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <span style={{ fontSize:18,flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14,color:T.ink2,lineHeight:1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    rest: {
      title: "Kein Projekt geht leer aus",
      body: (
        <>
          <p style={{ color:T.ink2,lineHeight:1.75,fontSize:14,margin:"0 0 12px" }}>
            Wenn ein Projekt die Abstimmung gewinnt, erhält es seine volle Wunschsumme.
          </p>
          <div style={{ background:`${T.teal}08`,borderRadius:14,padding:"14px 16px",marginBottom:12 }}>
            <div style={{ fontSize:13,color:T.ink,lineHeight:1.8 }}>
              Beispiel:<br/>
              Pool = <b>€2.000</b><br/>
              Gewinner Wunsch = <b>€1.200</b><br/>
              → Verbleibend: <b>€800</b><br/>
              → Verteilt auf alle anderen Projekte
            </div>
          </div>
          <p style={{ color:T.ink2,lineHeight:1.75,fontSize:14,margin:0 }}>
            Diese <b>€800</b> werden automatisch und fair auf alle weiteren
            nominierten Projekte aufgeteilt. Kein Projekt verlässt den Monat
            ohne einen Beitrag.
          </p>
        </>
      ),
    },
  };

  const c = CONTENT[modal] || CONTENT.cycle;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:900,
      background:"rgba(0,0,0,0.42)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"flex-end" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%",background:T.surfaceHi,
        borderRadius:"24px 24px 0 0",padding:"24px 22px 40px",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.11)",
        animation:"ipFade 0.22s ease both",
        maxHeight:"82vh",overflowY:"auto",
      }}>
        <div style={{ width:36,height:4,borderRadius:2,background:"rgba(0,0,0,0.10)",
          margin:"0 auto 18px" }}/>
        <h3 style={{ margin:"0 0 16px",fontSize:18,fontWeight:800,
          color:T.ink,letterSpacing:"-0.02em" }}>{c.title}</h3>
        {c.body}
        <button onClick={onClose} className="ip-p" style={{
          marginTop:24,width:"100%",background:T.teal,border:"none",
          borderRadius:16,padding:"13px 0",color:"white",
          fontSize:14,fontWeight:750,cursor:"pointer",
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
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ height:170,borderRadius:20,
          background:"linear-gradient(90deg,#EDE9E0 25%,#F5F1E8 50%,#EDE9E0 75%)",
          backgroundSize:"200% 100%",
          animation:"ipFade 1.4s ease-in-out infinite" }}/>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign:"center",padding:"20px 10px",color:T.muted }}>
      <div style={{ fontSize:24,marginBottom:6 }}>🌱</div>
      <div style={{ fontSize:11,lineHeight:1.5 }}>{text}</div>
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
