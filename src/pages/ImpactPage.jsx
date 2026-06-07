// ImpactPage.jsx — Phase 2: Mechanik, Transparenz & Wirkung
// Vollständig neu — eine Datei, kein Anhängen, kein Patchen
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { supabase } from "../lib/supabaseClient";
import { ImpactService, FeedService } from "../services/db.js";
import { HUI } from "../design/hui.design.js";
import ImpactFlow from "../system/flows/impact/ImpactFlow.jsx";

// ── Safe Helpers ──────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v : [];
const safeNum = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0) ? v : fb;
const fmtEur  = (n) => `€${safeNum(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;

function relTime(ts) {
  if (!ts) return "";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60)    return "gerade eben";
  if (d < 3600)  return `vor ${Math.round(d / 60)} Min.`;
  if (d < 86400) return `vor ${Math.round(d / 3600)} Std.`;
  return `vor ${Math.round(d / 86400)} Tg.`;
}

function fmtMonth(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  const names = ["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  return `${names[parseInt(m, 10)]} ${y}`;
}

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  teal: "#0DC4B5", tealLight: "#22DDD0", tealGlow: "rgba(13,196,181,0.22)",
  coral: "#F4714F", coralGlow: "rgba(244,113,79,0.20)",
  gold: "#D4952A", goldSoft: "#F0C46A", goldGlow: "rgba(212,149,42,0.18)",
  violet: "#7264D6", violetGlow: "rgba(114,100,214,0.18)",
  page: "#F8F4EE", surface: "#FDFAF5", surfaceHigh: "#FFFFFF",
  ink: "#141422", ink2: "#38384F", muted: "#898998", faint: "#C2C2D0",
  line: "rgba(0,0,0,0.048)",
  ff: HUI?.FONT?.family || "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
};

const S = {
  card: "0 2px 20px rgba(0,0,0,0.055), 0 1px 4px rgba(0,0,0,0.030)",
  cardHov: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.040)",
  btn: (c) => `0 4px 18px ${c}38, 0 1px 4px ${c}28`,
};

// ── Seed Fallback (nur wenn DB leer) ──────────────────────────
const SEED = [
  { id:"s1", name:"Foodsharing Hamburg", category:"Soziales",
    description:"Täglich helfen echte Menschen echten Menschen.",
    icon:"🥗", color:T.coral, colorGlow:T.coralGlow, votes:61, goal_eur:1560, awarded_eur:0,
    tags:["Ernährung","Gemeinschaft"], status:"nominated",
    img:"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90" },
  { id:"s2", name:"Stadtgärten Berlin", category:"Umwelt",
    description:"Grüne Inseln inmitten der Stadt.",
    icon:"🌿", color:T.teal, colorGlow:T.tealGlow, votes:34, goal_eur:900, awarded_eur:0,
    tags:["Natur","Stadt"], status:"nominated",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=90" },
  { id:"s3", name:"Kinderkunst für alle", category:"Bildung",
    description:"Kreative Entfaltung ist kein Luxus.",
    icon:"🎨", color:T.violet, colorGlow:T.violetGlow, votes:28, goal_eur:700, awarded_eur:0,
    tags:["Kinder","Kreativität"], status:"nominated",
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90" },
];

const POOL_SLICES = [
  { pct:40, emoji:"🗳", label:"Community Budget",   color:T.teal   },
  { pct:30, emoji:"🚀", label:"Wirkungsbudget",     color:T.coral  },
  { pct:20, emoji:"💡", label:"Innovationsbudget",  color:T.gold   },
  { pct:10, emoji:"🛡", label:"Kurationsbudget",    color:T.violet },
];

const CYCLE_STEPS = [
  { icon:"📝", label:"HUI-Team prüft Bewerbungen" },
  { icon:"🌿", label:"Drei Projekte werden nominiert" },
  { icon:"🩷", label:"Community stimmt ab" },
  { icon:"🏆", label:"Sieger erhält volle Wunschsumme" },
  { icon:"🌱", label:"Restbetrag geht an alle anderen" },
];

// ── ErrorBoundary ─────────────────────────────────────────────
class ImpactErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(e) { return { crashed: true, error: e }; }
  componentDidCatch(e, i) {
    console.error("[IMPACT CRASH]", { msg: e?.message, stack: e?.stack, comp: i?.componentStack });
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{ padding:40, textAlign:"center", fontFamily:T.ff, color:T.muted,
        minHeight:"60vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:T.page }}>
        <div style={{ fontSize:32, marginBottom:16 }}>🌱</div>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>Etwas ist schiefgelaufen</div>
        <div style={{ fontSize:13, marginBottom:24, maxWidth:280, color:T.muted }}>
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
// HOOKS
// ════════════════════════════════════════════════════════════════

// Hook: Pool-Statistiken (Buchungen → Provisionen → Pool)
function usePoolStats() {
  const [data, setData] = React.useState({
    poolEur: 0, communityEur: 0, wirkungEur: 0, innovationEur: 0, kurationsEur: 0,
    loading: true,
  });

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [roundRes, bookRes] = await Promise.allSettled([
          supabase.from("impact_rounds")
            .select("pool_eur,voting_ends_at,status")
            .eq("month", now.toISOString().slice(0, 7))
            .single(),
          supabase.from("bookings")
            .select("platform_fee")
            .gte("created_at", monthStart),
        ]);

        if (dead) return;

        const round = roundRes.status === "fulfilled" ? roundRes.value.data : null;
        const bookings = bookRes.status === "fulfilled" ? (bookRes.value.data || []) : [];
        const provisionen = bookings.reduce((s, b) => s + safeNum(b.platform_fee), 0);
        const poolEur = safeNum(round?.pool_eur) || Math.round(provisionen * 0.15);

        setData({
          poolEur,
          communityEur:  Math.round(poolEur * 0.40),
          wirkungEur:    Math.round(poolEur * 0.30),
          innovationEur: Math.round(poolEur * 0.20),
          kurationsEur:  Math.round(poolEur * 0.10),
          votingEndsAt:  round?.voting_ends_at || null,
          loading: false,
        });
      } catch (e) {
        console.warn("[POOL STATS]", e?.message);
        if (!dead) setData(d => ({ ...d, loading: false }));
      }
    })();
    return () => { dead = true; };
  }, []);

  return data;
}

// Hook: Transparenz-Dashboard — aggregierte Wirkungszahlen
function useTransparenzStats() {
  const [s, setS] = React.useState({
    projekte: 0, ausgeschuettet: 0, stimmen: 0,
    unterstuetzer: 0, loading: true,
  });

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [projRes, votesRes] = await Promise.allSettled([
          supabase.from("impact_projects")
            .select("id,awarded_eur,status")
            .in("status", ["funded","finished"]),
          supabase.from("impact_votes")
            .select("id,user_id", { count: "exact" }),
        ]);
        if (dead) return;

        const projs = projRes.status === "fulfilled" ? (projRes.value.data || []) : [];
        const votesCount = votesRes.status === "fulfilled" ? (votesRes.value.count || 0) : 0;
        const uniqueUsers = votesRes.status === "fulfilled"
          ? new Set((votesRes.value.data || []).map(v => v.user_id)).size : 0;

        setS({
          projekte: projs.length,
          ausgeschuettet: projs.reduce((s, p) => s + safeNum(p.awarded_eur), 0),
          stimmen: votesCount,
          unterstuetzer: uniqueUsers,
          loading: false,
        });
      } catch (e) {
        console.warn("[TRANSPARENZ]", e?.message);
        if (!dead) setS(d => ({ ...d, loading: false }));
      }
    })();
    return () => { dead = true; };
  }, []);

  return s;
}

// Hook: Vergangene Gewinner (distributed rounds)
function usePastWinners() {
  const [winners, setWinners] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data: rounds } = await supabase
          .from("impact_rounds")
          .select("id,month,pool_eur,distributed_at,winner_project_id")
          .eq("status", "distributed")
          .order("distributed_at", { ascending: false })
          .limit(6);

        if (dead || !rounds?.length) { if (!dead) setLoading(false); return; }

        const projectIds = rounds.map(r => r.winner_project_id).filter(Boolean);
        const { data: projs } = projectIds.length > 0
          ? await supabase.from("impact_projects")
              .select("id,name,icon,color,category,img_url,awarded_eur")
              .in("id", projectIds)
          : { data: [] };

        if (dead) return;
        const projMap = Object.fromEntries((projs || []).map(p => [p.id, p]));
        setWinners(rounds.map(r => ({
          month: r.month,
          poolEur: r.pool_eur,
          distributedAt: r.distributed_at,
          winnerAmount: Math.round(safeNum(r.pool_eur) * 0.40),
          project: projMap[r.winner_project_id] || null,
        })).filter(w => w.project));
      } catch (e) {
        console.warn("[PAST WINNERS]", e?.message);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  return { winners, loading };
}

// Hook: Restverteilung — was bekommen Nicht-Gewinner?
function useRestVerteilung() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // Letzte verteilte Runde
        const { data: round } = await supabase
          .from("impact_rounds")
          .select("id,pool_eur,winner_project_id,distributed_at")
          .eq("status", "distributed")
          .order("distributed_at", { ascending: false })
          .limit(1)
          .single();

        if (dead || !round) return;

        // Alle Projekte mit awarded_eur aus dieser Periode
        const { data: projs } = await supabase
          .from("impact_projects")
          .select("id,name,icon,color,awarded_eur,status")
          .gt("awarded_eur", 0)
          .order("awarded_eur", { ascending: false })
          .limit(8);

        if (dead) return;
        const all = (projs || []);
        setItems(all.map(p => ({
          id: p.id,
          name: p.name,
          icon: p.icon || "🌱",
          color: p.color || T.teal,
          amount: p.awarded_eur,
          isWinner: p.id === round.winner_project_id,
        })));
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, []);

  return items;
}

// Hook: Aktivitätsfeed (Polling, kein FK-JOIN)
function useActivityFeed() {
  const [acts, setActs] = React.useState([]);

  React.useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const { data: votes } = await supabase
          .from("impact_votes")
          .select("id,created_at,user_id,project_id")
          .order("created_at", { ascending: false })
          .limit(8);
        if (dead || !votes?.length) return;

        const uIds = [...new Set(votes.map(v => v.user_id).filter(Boolean))];
        const pIds = [...new Set(votes.map(v => v.project_id).filter(Boolean))];
        const [uRes, pRes] = await Promise.allSettled([
          uIds.length ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", uIds) : { data: [] },
          pIds.length ? supabase.from("impact_projects").select("id,name").in("id", pIds) : { data: [] },
        ]);
        if (dead) return;
        const uMap = Object.fromEntries((uRes.value?.data || []).map(u => [u.id, u]));
        const pMap = Object.fromEntries((pRes.value?.data || []).map(p => [p.id, p]));
        setActs(votes.map(v => ({
          id: v.id,
          userName: uMap[v.user_id]?.display_name || "Jemand",
          avatar: uMap[v.user_id]?.avatar_url || null,
          projectName: pMap[v.project_id]?.name || "ein Projekt",
          ago: relTime(v.created_at),
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
// HAUPT-KOMPONENTE
// ════════════════════════════════════════════════════════════════
function ImpactPageInner({ currentUser }) {
  // — States —
  const [projects,     setProjects]    = React.useState([]);
  const [loadingProj,  setLoadingProj] = React.useState(true);
  const [allProjects,  setAllProjects] = React.useState([]);
  const [activeRound,  setActiveRound] = React.useState(null);
  const [userVotes,    setUserVotes]   = React.useState([]);
  const [voteLoading,  setVoteLoading] = React.useState(false);
  const [showPropose,  setShowPropose] = React.useState(false);
  const [showInfoModal, setShowInfoModal] = React.useState(null); // null | "cycle" | "vote"

  // — Hooks —
  const pool       = usePoolStats();
  const transp     = useTransparenzStats();
  const { winners, loading: winnersLoading } = usePastWinners();
  const restItems  = useRestVerteilung();
  const activities = useActivityFeed();

  // — Projekte laden (nominated / active) —
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,goal_eur,awarded_eur,tags,status,img_url,contact_name")
          .in("status", ["nominated","active"])
          .order("votes", { ascending: false })
          .limit(10);
        if (dead) return;
        if (error) throw error;
        const IMGS = [
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90",
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=90",
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90",
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=90",
        ];
        const rows = (data || []).map((p, i) => ({
          ...p, colorGlow: `${p.color || T.teal}33`,
          img: p.img_url || IMGS[i % IMGS.length],
        }));
        setProjects(rows.length > 0 ? rows : SEED);
      } catch {
        if (!dead) setProjects(SEED);
      } finally {
        if (!dead) setLoadingProj(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // — Alle Projekte (Status-Übersicht) —
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_projects")
          .select("id,name,icon,color,status,votes,goal_eur")
          .in("status", ["submitted","reviewing","approved","nominated","funded","finished"])
          .order("created_at", { ascending: false })
          .limit(20);
        setAllProjects(data || []);
      } catch { /* silent */ }
    })();
  }, []);

  // — ActiveRound + UserVotes —
  React.useEffect(() => {
    if (!currentUser?.id) return;
    let dead = false;
    (async () => {
      try {
        const { data: round } = await ImpactService.getCurrentRound();
        if (dead) return;
        if (round?.id) {
          setActiveRound(round);
          const { data: votes } = await ImpactService.getUserVotesThisRound(currentUser.id, round.id);
          if (!dead) setUserVotes(safeArr(votes));
        }
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, [currentUser?.id]);

  // — Vote abgeben —
  const castVote = async (projectId) => {
    if (!currentUser?.id || voteLoading) return;
    if (userVotes.some(v => v.project_id === projectId)) return;
    const isMem = currentUser?.is_wirker ||
      ["talent","member","guardian","team"].includes(currentUser?.membership_type);
    const maxV = isMem ? 2 : 1;
    const usedV = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
    if (usedV >= maxV) return;

    setUserVotes(prev => [...prev, { project_id: projectId, weight: 1 }]);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, votes: p.votes + 1 } : p));

    if (!activeRound?.id) return;
    setVoteLoading(true);
    try {
      const { error } = await ImpactService.castVote(currentUser.id, projectId, activeRound.id, isMem ? 2 : 1);
      if (error) {
        setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, votes: p.votes - 1 } : p));
      } else {
        const proj = projects.find(p => p.id === projectId);
        if (proj) FeedService.createActivity(currentUser.id, "impact_vote",
          `hat das Projekt „${proj.name}" unterstützt`, {}).catch(() => {});
      }
    } catch { /* silent */ } finally { setVoteLoading(false); }
  };

  // — Derived —
  const nominated  = projects.filter(p => p.status === "nominated" || p.status === "active");
  const isMember   = currentUser?.is_wirker ||
    ["talent","member","guardian","team"].includes(currentUser?.membership_type);
  const maxVotes   = isMember ? 2 : 1;
  const usedVotes  = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
  const remainVotes = Math.max(0, maxVotes - usedVotes);
  const daysLeft   = activeRound?.voting_ends_at
    ? Math.max(0, Math.ceil((new Date(activeRound.voting_ends_at) - Date.now()) / 86400000))
    : null;
  const totalVotes = nominated.reduce((s, p) => s + safeNum(p.votes), 0);

  return (
    <div style={{ width:"100%", minHeight:"100svh", background:T.page, fontFamily:T.ff,
      paddingBottom:120, overflowX:"hidden" }}>
      <style>{`
        @keyframes ipFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes ipPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes ipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .ip-press { cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .ip-press:active { transform:scale(0.975) !important; transition:transform 0.12s !important; }
      `}</style>

      {/* 1 ── HERO */}
      <HeroSection />

      {/* 2 ── POOL DIESEN MONAT */}
      <PoolThisMonth pool={pool} />

      {/* 3 ── MECHANIK / GEWINNER-LOGIK */}
      <MechanikStepper onInfo={() => setShowInfoModal("cycle")} />

      {/* 4 ── AKTUELLE ABSTIMMUNG */}
      <VotingSection
        projects={nominated}
        userVotes={userVotes}
        daysLeft={daysLeft}
        totalVotes={totalVotes}
        onVote={castVote}
        loading={loadingProj}
        onInfo={() => setShowInfoModal("vote")}
      />

      {/* 5 ── STIMMEN-STATUS */}
      <VoteStatus
        usedVotes={usedVotes}
        maxVotes={maxVotes}
        remainVotes={remainVotes}
        isMember={isMember}
        userVotes={userVotes}
        projects={projects}
      />

      {/* 6 ── RESTVERTEILUNG */}
      {restItems.length > 0 && (
        <RestVerteilung items={restItems} poolEur={pool.communityEur} />
      )}

      {/* 7 ── VERGANGENE GEWINNER */}
      <PastWinnersSection winners={winners} loading={winnersLoading} />

      {/* 8 ── TRANSPARENZ DASHBOARD */}
      <TransparenzDashboard stats={transp} />

      {/* 9 ── HERZENSPROJEKT */}
      <HerzensprojektSection onPropose={() => setShowPropose(true)} />

      {/* 10 ── AKTIVITÄTSFEED */}
      {activities.length > 0 && <ActivityFeed activities={activities} />}

      {/* FLOW */}
      {showPropose && (
        <React.Suspense fallback={null}>
          <ImpactFlow onClose={() => setShowPropose(false)} />
        </React.Suspense>
      )}

      {/* INFO MODAL */}
      {showInfoModal && (
        <InfoModal
          title={showInfoModal === "cycle"
            ? "Der monatliche Wirkungszyklus"
            : "So funktioniert die Abstimmung"}
          onClose={() => setShowInfoModal(null)}
        >
          {showInfoModal === "cycle" ? (
            <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14 }}>
              Jede Buchung auf HUI erzeugt eine kleine Provision.
              15% davon fließen direkt in den Impact Pool.<br/><br/>
              Einmal pro Monat prüft das HUI-Team Bewerbungen, nominiert drei Projekte
              und die Community stimmt ab. Das Siegerprojekt bekommt seine volle Wunschsumme.
              Der Rest wird fair auf alle anderen nominierten Projekte verteilt.<br/><br/>
              <b>Kein Projekt geht leer aus.</b>
            </p>
          ) : (
            <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14 }}>
              Normale Nutzer haben <b>1 Stimme</b> pro Monat.<br/>
              Mitglieder & Talente haben <b>2 Stimmen</b> pro Monat.<br/><br/>
              Stimmen addieren sich nicht über Monate. Jeder Monat beginnt neu.
              Das Projekt mit den meisten Stimmen am Monatsende erhält seine volle Wunschsumme.
            </p>
          )}
        </InfoModal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 1: HERO
// ════════════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <div style={{
      position:"relative", overflow:"hidden", minHeight:220,
      background:`
        radial-gradient(ellipse 120% 80% at 85% 20%, rgba(240,196,106,0.22) 0%, transparent 55%),
        radial-gradient(ellipse 75% 70% at 8% 10%, rgba(244,113,79,0.13) 0%, transparent 50%),
        linear-gradient(175deg, #FCF1E0 0%, #F8EFE0 45%, #F3EAD8 100%)
      `,
      padding:"52px 22px 36px",
    }}>
      {/* Floating symbols */}
      {[{e:"🌱",t:"12%",r:"18%",d:"0s"},{e:"🤝",t:"35%",r:"8%",d:"0.7s"},{e:"💛",t:"60%",r:"28%",d:"1.4s"}].map((f,i)=>(
        <div key={i} style={{ position:"absolute",top:f.t,right:f.r,fontSize:24,
          animation:`ipFloat 9s ease-in-out ${f.d} infinite`,
          filter:"drop-shadow(0 3px 10px rgba(0,0,0,0.14))",pointerEvents:"none" }}>{f.e}</div>
      ))}

      <div style={{ display:"inline-flex", alignItems:"center", gap:7,
        background:`${T.teal}18`, border:`1px solid ${T.teal}28`,
        borderRadius:99, padding:"6px 14px", marginBottom:16 }}>
        <div style={{ width:6,height:6,borderRadius:"50%",background:T.teal,
          animation:"ipPulse 2s ease-in-out infinite" }}/>
        <span style={{ fontSize:10, fontWeight:800, color:T.teal,
          letterSpacing:"0.14em", textTransform:"uppercase" }}>HUI Impact Pool</span>
      </div>

      <h1 style={{ margin:"0 0 12px", fontSize:28, fontWeight:900, lineHeight:1.18,
        letterSpacing:"-0.025em", color:T.ink }}>
        Gemeinsam<br/>
        <span style={{ color:T.teal }}>Wirkung</span> schaffen.
      </h1>
      <p style={{ margin:0, fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:320 }}>
        15% unserer Provisionen fließen in den Impact Pool —
        für Projekte, die unsere Welt wirklich besser machen.
        <br/><b style={{ color:T.ink }}>Kein Projekt geht leer aus.</b>
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 2: POOL DIESEN MONAT (mit echten Zahlen)
// ════════════════════════════════════════════════════════════════
function PoolThisMonth({ pool }) {
  const budgets = [
    { emoji:"🗳", label:"Community Budget (40%)",  eur: pool.communityEur,  color:T.teal   },
    { emoji:"🚀", label:"Wirkungsbudget (30%)",    eur: pool.wirkungEur,    color:T.coral  },
    { emoji:"💡", label:"Innovationsbudget (20%)", eur: pool.innovationEur, color:T.gold   },
    { emoji:"🛡", label:"Kurationsbudget (10%)",   eur: pool.kurationsEur,  color:T.violet },
  ];

  return (
    <Section title="Diesen Monat im Impact Pool" emoji="💚" mt={24}>
      {/* Gesamtpool prominent */}
      <div style={{
        background:`linear-gradient(135deg,${T.teal}18,${T.teal}06)`,
        border:`1.5px solid ${T.teal}35`, borderRadius:20,
        padding:"18px 20px", marginBottom:14,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.teal,
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Gesamtpool</div>
          <div style={{ fontSize:32, fontWeight:900, color:T.teal, letterSpacing:"-0.03em" }}>
            {pool.loading ? "—" : fmtEur(pool.poolEur)}
          </div>
          <div style={{ fontSize:12, color:T.ink2, marginTop:3 }}>
            Live berechnet aus Provisionen dieses Monats
          </div>
        </div>
        <div style={{ fontSize:36, filter:"drop-shadow(0 3px 12px rgba(13,196,181,0.3))" }}>💚</div>
      </div>

      {/* Budget-Zeilen */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {budgets.map((b, i) => (
          <div key={i} style={{
            background:T.surfaceHigh, borderRadius:16, padding:"12px 16px",
            boxShadow:S.card, border:`1px solid ${T.line}`,
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:12, flexShrink:0,
              background:`${b.color}18`, display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:18,
            }}>{b.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{b.label}</div>
            </div>
            <div style={{ fontSize:18, fontWeight:900, color:b.color, letterSpacing:"-0.02em" }}>
              {pool.loading ? "—" : fmtEur(b.eur)}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 3: MECHANIK — Stepper
// ════════════════════════════════════════════════════════════════
function MechanikStepper({ onInfo }) {
  return (
    <Section title="So funktioniert die monatliche Vergabe" emoji="🔄" mt={28}>
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {CYCLE_STEPS.map((step, i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
            {/* Connector */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:36, flexShrink:0 }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:`linear-gradient(135deg,${T.teal}22,${T.teal}08)`,
                border:`1.5px solid ${T.teal}40`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17, flexShrink:0,
              }}>{step.icon}</div>
              {i < CYCLE_STEPS.length - 1 && (
                <div style={{ width:1.5, height:20, background:`${T.teal}30`, margin:"2px 0" }} />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingTop:7, paddingBottom: i < CYCLE_STEPS.length - 1 ? 0 : 0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.ink, lineHeight:1.4 }}>{step.label}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onInfo} className="ip-press" style={{
        marginTop:16, background:"none", border:`1px solid ${T.teal}30`,
        borderRadius:99, padding:"8px 18px",
        fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
      }}>Mehr zum Vergabe-Prozess</button>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 4: ABSTIMMUNG
// ════════════════════════════════════════════════════════════════
function VotingSection({ projects, userVotes, daysLeft, totalVotes, onVote, loading, onInfo }) {
  if (loading) return <SkeletonCards count={3} />;
  if (!projects.length) return null;

  return (
    <Section title="Aktuelle Abstimmung" emoji="🗳" mt={28}
      right={
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {daysLeft !== null && (
            <span style={{ fontSize:12, fontWeight:700, color:T.coral }}>
              Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""}
            </span>
          )}
          <button onClick={onInfo} className="ip-press" style={{
            background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
          }}>Wie?</button>
        </div>
      }
    >
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {projects.map((p, i) => (
          <VotingCard key={p.id} project={p} rank={i}
            voted={userVotes.some(v => v.project_id === p.id)}
            totalVotes={totalVotes} onVote={onVote} />
        ))}
      </div>
    </Section>
  );
}

function VotingCard({ project: p, rank, voted, totalVotes, onVote }) {
  const accent = p.color || T.teal;
  const pct = totalVotes > 0 ? Math.round(safeNum(p.votes) / totalVotes * 100) : 0;
  const goalEur = safeNum(p.goal_eur) || 1200;
  const [imgErr, setImgErr] = React.useState(false);

  const RANK_COLORS = [T.teal, T.coral, T.violet, T.gold];
  const rc = RANK_COLORS[rank] || T.teal;

  return (
    <div style={{
      background:T.surfaceHigh, borderRadius:24, overflow:"hidden",
      boxShadow:S.card, border:`1px solid ${T.line}`,
      animation:"ipFade 0.35s ease both", animationDelay:`${rank * 0.07}s`,
    }}>
      {/* Bild */}
      <div style={{ position:"relative", height:150, overflow:"hidden",
        background:`linear-gradient(135deg,${accent}15,${accent}05)` }}>
        {p.img && !imgErr
          ? <img src={p.img} alt={p.name} onError={() => setImgErr(true)}
              style={{ width:"100%",height:"100%",objectFit:"cover",
                filter:"saturate(0.85) brightness(0.96)" }} loading="lazy"/>
          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:52 }}>{p.icon||"🌱"}</div>
        }
        {/* Rank */}
        <div style={{ position:"absolute",top:12,left:12,width:32,height:32,
          borderRadius:"50%",background:rc,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:14,fontWeight:900,color:"white",
          boxShadow:`0 2px 10px ${rc}66` }}>{rank+1}</div>
        {/* Kategorie */}
        <div style={{ position:"absolute",top:12,right:12,
          background:"rgba(255,252,248,0.92)",backdropFilter:"blur(12px)",
          border:"1px solid rgba(255,255,255,0.8)",
          borderRadius:99,padding:"4px 11px" }}>
          <span style={{ fontSize:9,color:T.ink2,fontWeight:750,
            letterSpacing:"0.07em",textTransform:"uppercase" }}>{p.category}</span>
        </div>
        <div style={{ position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(255,255,255,0.88) 0%,transparent 45%)",
          pointerEvents:"none" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 18px 18px" }}>
        <h3 style={{ margin:"0 0 6px",fontSize:17,fontWeight:820,
          color:T.ink,letterSpacing:"-0.018em" }}>{p.name}</h3>
        {p.description && (
          <p style={{ margin:"0 0 12px",fontSize:13,color:T.ink2,lineHeight:1.65,
            display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
            {p.description}
          </p>
        )}

        {/* Ziel */}
        <div style={{ display:"flex",justifyContent:"space-between",
          fontSize:12,color:T.ink2,marginBottom:6 }}>
          <span><b style={{ color:T.ink }}>{p.votes}</b> Stimmen · {pct}%</span>
          <span>Ziel: <b style={{ color:T.ink }}>{fmtEur(goalEur)}</b></span>
        </div>
        <div style={{ height:5,borderRadius:99,background:"rgba(0,0,0,0.07)",
          overflow:"hidden",marginBottom:14 }}>
          <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,
            background:`linear-gradient(90deg,${accent},${accent}BB)`,
            transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)",minWidth:pct>0?8:0 }}/>
        </div>

        {/* Vote Button */}
        <button onClick={() => !voted && onVote(p.id)} className="ip-press" style={{
          width:"100%", borderRadius:16, padding:"12px 0",
          cursor: voted ? "default" : "pointer",
          background: voted
            ? `linear-gradient(135deg,${accent}15,${accent}08)`
            : `linear-gradient(135deg,${accent},${accent}CC)`,
          color: voted ? accent : "white",
          border: voted ? `1.5px solid ${accent}35` : "none",
          fontSize:14, fontWeight:750, letterSpacing:"-0.01em",
          boxShadow: voted ? "none" : S.btn(accent),
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          transition:"all 0.2s ease",
        }}>
          <span style={{ fontSize:16 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Danke für deine Stimme" : "Mit Stimme unterstützen"}</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 5: STIMMEN-STATUS
// ════════════════════════════════════════════════════════════════
function VoteStatus({ usedVotes, maxVotes, remainVotes, isMember, userVotes, projects }) {
  const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <Section title="Deine Stimmen" emoji="🗳" mt={28}>
      <div style={{ background:T.surfaceHigh,borderRadius:20,padding:"18px 18px",
        boxShadow:S.card,border:`1px solid ${T.line}` }}>

        {/* Stimmen-Dots */}
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
          {Array.from({ length: maxVotes }).map((_, i) => {
            const used = i < usedVotes;
            const vote = userVotes[i];
            const proj = vote ? projMap[vote.project_id] : null;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:30, height:30, borderRadius:"50%", flexShrink:0,
                  background: used
                    ? `linear-gradient(135deg,${T.teal},${T.tealLight})`
                    : "rgba(0,0,0,0.07)",
                  border: used ? "none" : `1.5px dashed rgba(0,0,0,0.15)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, color:"white",
                }}>{used ? "●" : "○"}</div>
                {proj && (
                  <span style={{ fontSize:12, color:T.ink2 }}>
                    {projMap[vote.project_id]?.name || "Projekt"}
                  </span>
                )}
                {!used && (
                  <span style={{ fontSize:12, color:T.muted }}>Noch verfügbar</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Status-Text */}
        <div style={{ fontSize:13, color:T.ink2, lineHeight:1.6 }}>
          {remainVotes > 0
            ? <>Du hast noch <b style={{ color:T.teal }}>{remainVotes} Stimme{remainVotes>1?"n":""}</b> übrig.</>
            : <><b style={{ color:T.ink }}>Alle Stimmen verwendet.</b> Nächsten Monat gibt es neue.</>
          }
          {isMember && (
            <div style={{ fontSize:11,color:T.violet,marginTop:4 }}>
              🏅 Als Mitglied/Talent hast du 2 Stimmen pro Monat
            </div>
          )}
        </div>

        {!isMember && (
          <div style={{ marginTop:14, padding:"12px 14px",
            background:`${T.gold}12`, border:`1px solid ${T.gold}25`,
            borderRadius:14 }}>
            <div style={{ fontSize:12,fontWeight:700,color:T.gold,marginBottom:4 }}>
              ⭐ Mit Mitgliedschaft auf 2 Stimmen
            </div>
            <div style={{ fontSize:12,color:T.ink2 }}>
              Mitglieder und Talente können doppelt so viel bewirken.
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 6: RESTVERTEILUNG
// ════════════════════════════════════════════════════════════════
function RestVerteilung({ items, poolEur }) {
  const winner = items.find(i => i.isWinner);
  const others = items.filter(i => !i.isWinner);

  return (
    <Section title="Was passiert mit den anderen Projekten?" emoji="🌱" mt={28}>
      <p style={{ margin:"0 0 16px",fontSize:13,color:T.ink2,lineHeight:1.65 }}>
        Auch Projekte ohne Sieg erhalten Wirkung. Der Restbetrag wird fair auf alle
        anderen nominierten Projekte verteilt — kein Projekt geht leer aus.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {winner && (
          <RestItem
            name={winner.name} icon={winner.icon} color={T.teal}
            amount={winner.amount} badge="🏆 Gewinner" badgeColor={T.teal}
          />
        )}
        {others.map((item, i) => (
          <RestItem key={item.id}
            name={item.name} icon={item.icon} color={item.color || T.violet}
            amount={item.amount}
            badge={i === 0 ? "🌱 Anteil aus Restbudget" : "🎨 Anteil aus Restbudget"}
            badgeColor={item.color || T.violet}
          />
        ))}
      </div>

      {items.length === 0 && (
        <EmptyState text="Noch keine Verteilungen — Auszahlung am Monatsende" />
      )}
    </Section>
  );
}

function RestItem({ name, icon, color, amount, badge, badgeColor }) {
  return (
    <div style={{
      background:T.surfaceHigh, borderRadius:18, padding:"14px 16px",
      boxShadow:S.card, border:`1px solid ${T.line}`,
      display:"flex", alignItems:"center", gap:14,
    }}>
      <div style={{
        width:44, height:44, borderRadius:14, flexShrink:0,
        background:`${color}18`, border:`1.5px solid ${color}28`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
      }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14,fontWeight:750,color:T.ink,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</div>
        <div style={{ fontSize:11,color:badgeColor,fontWeight:700,marginTop:2 }}>{badge}</div>
      </div>
      <div style={{ fontSize:18,fontWeight:900,color:color,flexShrink:0,letterSpacing:"-0.02em" }}>
        {fmtEur(amount)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 7: VERGANGENE GEWINNER
// ════════════════════════════════════════════════════════════════
function PastWinnersSection({ winners, loading }) {
  return (
    <Section title="Bereits ermöglicht" emoji="🏆" mt={28}>
      {loading && <SkeletonCards count={2} />}
      {!loading && winners.length === 0 && (
        <EmptyState text="Die ersten Gewinner werden nach der Abstimmung bekannt gegeben." />
      )}
      {!loading && winners.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {winners.map((w, i) => {
            const p = w.project;
            const accent = p.color || T.teal;
            return (
              <div key={i} style={{
                background:T.surfaceHigh, borderRadius:20,
                boxShadow:S.card, border:`1px solid ${T.line}`,
                overflow:"hidden", display:"flex", alignItems:"stretch",
                animation:"ipFade 0.35s ease both", animationDelay:`${i*0.06}s`,
              }}>
                {/* Bild */}
                <div style={{ width:90, flexShrink:0, position:"relative",
                  background:`${accent}15` }}>
                  {p.img_url
                    ? <img src={p.img_url} alt={p.name} style={{ width:"100%",height:"100%",
                        objectFit:"cover",filter:"saturate(0.85)" }} loading="lazy"/>
                    : <div style={{ width:"100%",height:"100%",display:"flex",
                        alignItems:"center",justifyContent:"center",fontSize:36 }}>{p.icon||"🏆"}</div>
                  }
                </div>
                {/* Info */}
                <div style={{ flex:1, padding:"14px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}>
                    <span style={{ fontSize:10,fontWeight:800,color:T.gold,
                      letterSpacing:"0.1em",textTransform:"uppercase" }}>🏆 Gewinner</span>
                    <span style={{ fontSize:10,color:T.muted }}>·</span>
                    <span style={{ fontSize:10,color:T.muted }}>{fmtMonth(w.month)}</span>
                  </div>
                  <div style={{ fontSize:15,fontWeight:800,color:T.ink,
                    letterSpacing:"-0.018em",marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:11,color:T.muted,marginBottom:8 }}>{p.category}</div>
                  <div style={{ fontSize:20,fontWeight:900,color:T.teal,letterSpacing:"-0.02em" }}>
                    {fmtEur(w.winnerAmount)} finanziert
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 8: TRANSPARENZ DASHBOARD
// ════════════════════════════════════════════════════════════════
function TransparenzDashboard({ stats }) {
  const items = [
    { emoji:"💚", val: stats.projekte,        label:"Projekte finanziert"  },
    { emoji:"💰", val: fmtEur(stats.ausgeschuettet), label:"ausgeschüttet" },
    { emoji:"🗳", val: stats.stimmen,          label:"Stimmen abgegeben"   },
    { emoji:"👥", val: stats.unterstuetzer,    label:"aktive Unterstützer"  },
  ];

  return (
    <Section title="Wirkung durch die Community" emoji="🌍" mt={28}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background:T.surfaceHigh, borderRadius:18, padding:"16px 14px",
            boxShadow:S.card, border:`1px solid ${T.line}`,
            animation:"ipFade 0.35s ease both", animationDelay:`${i*0.05}s`,
          }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{item.emoji}</div>
            <div style={{ fontSize:24, fontWeight:900, color:T.teal,
              letterSpacing:"-0.03em", lineHeight:1 }}>
              {stats.loading ? "—" : item.val}
            </div>
            <div style={{ fontSize:11, color:T.ink2, marginTop:4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 9: HERZENSPROJEKT
// ════════════════════════════════════════════════════════════════
function HerzensprojektSection({ onPropose }) {
  return (
    <Section mt={28}>
      <div style={{
        background:`linear-gradient(135deg,${T.teal}15,${T.teal}04)`,
        border:`1.5px solid ${T.teal}30`, borderRadius:24,
        padding:"28px 22px", textAlign:"center",
      }}>
        <div style={{ fontSize:40, marginBottom:14 }}>💚</div>
        <h2 style={{ margin:"0 0 10px", fontSize:20, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em" }}>Hast du ein Herzensprojekt?</h2>
        <p style={{ margin:"0 0 8px", fontSize:14, color:T.ink2, lineHeight:1.7 }}>
          Jeder kann sich bewerben. Das HUI-Team prüft alle Einreichungen sorgfältig.
        </p>
        <p style={{ margin:"0 0 24px", fontSize:14, color:T.ink2, lineHeight:1.7 }}>
          Jeden Monat werden die passendsten Projekte nominiert und der Community vorgestellt.
        </p>
        <button onClick={onPropose} className="ip-press" style={{
          background:`linear-gradient(135deg,${T.teal},${T.tealLight})`,
          border:"none", borderRadius:18, padding:"14px 28px",
          fontSize:15, fontWeight:750, color:"white",
          cursor:"pointer", boxShadow:S.btn(T.teal),
          display:"inline-flex", alignItems:"center", gap:8,
          letterSpacing:"-0.01em",
        }}>
          <span>🌱</span> Herzensprojekt einreichen
        </button>
        <div style={{ marginTop:14, fontSize:12, color:T.muted }}>
          Bewerbung dauert ~5 Minuten · Kostenlos
        </div>
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SEKTION 10: AKTIVITÄTSFEED
// ════════════════════════════════════════════════════════════════
function ActivityFeed({ activities }) {
  return (
    <Section title="Live-Aktivitäten" emoji="⚡" mt={28}>
      <div style={{ background:T.surfaceHigh, borderRadius:20,
        boxShadow:S.card, border:`1px solid ${T.line}`, overflow:"hidden" }}>
        {activities.map((act, i) => (
          <div key={act.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"12px 16px",
            borderBottom: i < activities.length-1 ? `1px solid ${T.line}` : "none",
            animation:"ipFade 0.3s ease both", animationDelay:`${i*0.04}s`,
          }}>
            <div style={{
              width:34, height:34, borderRadius:"50%", flexShrink:0,
              overflow:"hidden", background:`${T.teal}18`,
              border:`1.5px solid ${T.teal}20`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
            }}>
              {act.avatar
                ? <img src={act.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : "👤"
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12,color:T.ink,lineHeight:1.4,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                <b>{act.userName}</b> hat <b>{act.projectName}</b> unterstützt
              </div>
            </div>
            <div style={{ fontSize:10,color:T.muted,flexShrink:0 }}>{act.ago}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════

function Section({ title, emoji, mt = 0, right, children }) {
  return (
    <div style={{ padding:"0 16px", marginTop:mt }}>
      {(title || right) && (
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:14 }}>
          {title && (
            <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:T.ink,
              letterSpacing:"-0.022em", display:"flex", alignItems:"center", gap:7 }}>
              {emoji && <span style={{ fontSize:18 }}>{emoji}</span>}
              {title}
            </h2>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function SkeletonCards({ count = 2 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height:180, borderRadius:20,
          background:"linear-gradient(90deg,#F0EDE8 25%,#F8F4EE 50%,#F0EDE8 75%)",
          backgroundSize:"200% 100%",
          animation:"ipFade 1.4s ease-in-out infinite",
        }}/>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign:"center", padding:"28px 16px", color:T.muted }}>
      <div style={{ fontSize:30, marginBottom:8 }}>🌱</div>
      <div style={{ fontSize:13 }}>{text}</div>
    </div>
  );
}

function InfoModal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:900,
      background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", background:T.surfaceHigh,
        borderRadius:"24px 24px 0 0", padding:"28px 22px 44px",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.12)",
        animation:"ipFade 0.25s ease both",
        maxHeight:"80vh", overflowY:"auto",
      }}>
        <div style={{ width:36,height:4,borderRadius:2,background:"rgba(0,0,0,0.12)",
          margin:"0 auto 20px" }}/>
        <h3 style={{ margin:"0 0 14px",fontSize:18,fontWeight:800,
          color:T.ink,letterSpacing:"-0.02em" }}>{title}</h3>
        {children}
        <button onClick={onClose} className="ip-press" style={{
          marginTop:20, width:"100%", background:T.teal, border:"none",
          borderRadius:16, padding:"13px 0", color:"white",
          fontSize:14, fontWeight:750, cursor:"pointer",
        }}>Verstanden</button>
      </div>
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
