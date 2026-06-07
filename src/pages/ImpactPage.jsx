// ImpactPage.jsx — PHASE 19.3: Luxury Impact Feed Finishing
// Kein Rebuild. Bestehende Struktur. Nur Tiefe, Ruhe, Premium-Qualität.
// Editorial calm · Cinematic image world · Warm material system

import React, { useState, useEffect, useRef } from "react";
import { useScrollEntry, useTap } from "../design/hui.hooks.js";
import { supabase } from "../lib/supabaseClient";
import { FeedService, ImpactService } from "../services/db.js";
import { HUI } from "../design/hui.design.js";
import ImpactFlow from "../system/flows/impact/ImpactFlow.jsx";  // Phase 23: Echter 4-Step Einreichungs-Wizard
import { IX } from "../design/hui.interaction.js";

// ── ErrorBoundary — ImpactPage Crash Isolation ───────────────────
class ImpactErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  componentDidCatch(error, info) {
    console.error("[IMPACT CRASH]", {
      error:          error?.message,
      stack:          error?.stack,
      componentStack: info?.componentStack,
    });
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          padding:40, textAlign:"center", fontFamily:"-apple-system,sans-serif",
          color:"#888", background:"#F9F7F4", minHeight:"60vh",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{ fontSize:32, marginBottom:16 }}>🌱</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color:"#333" }}>
            Etwas ist schiefgelaufen
          </div>
          <div style={{ fontSize:13, marginBottom:24, maxWidth:280 }}>
            {this.state.error?.message || "Unbekannter Fehler"}
          </div>
          <button
            onClick={() => this.setState({ crashed: false, error: null })}
            style={{
              background:"#16D7C5", color:"white", border:"none",
              borderRadius:20, padding:"10px 24px", fontSize:14,
              cursor:"pointer", fontWeight:600,
            }}
          >Neu laden</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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


// ═══════════════════════════════════════════════════════════════════════
// NEUE SEKTIONEN — werden an bestehende ImpactPage angehängt
// Ersetzen: ImpactPageInner + alle Unter-Komponenten
// ═══════════════════════════════════════════════════════════════════════

/* ────────────────────────────────────────────────────────────────────
   HERO IMAGE + CONSTANTS
──────────────────────────────────────────────────────────────────── */
const HERO_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=92";

const AVATARS = [
  "https://i.pravatar.cc/40?img=1","https://i.pravatar.cc/40?img=5",
  "https://i.pravatar.cc/40?img=12","https://i.pravatar.cc/40?img=23",
  "https://i.pravatar.cc/40?img=45",
];

/* ────────────────────────────────────────────────────────────────────
   CSS-SHADOWS (lokales S-Objekt)
──────────────────────────────────────────────────────────────────── */
const S = {
  card:    "0 2px 20px rgba(0,0,0,0.055), 0 1px 4px rgba(0,0,0,0.030)",
  cardHov: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.040)",
  glass:   "0 8px 40px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.030), inset 0 1px 0 rgba(255,255,255,0.95)",
  btn:     (c) => `0 4px 18px ${c}38, 0 1px 4px ${c}28`,
};

/* ────────────────────────────────────────────────────────────────────
   useImpactStats — echte Supabase-Daten für Hero
──────────────────────────────────────────────────────────────────── */
function useImpactStats() {
  const [stats, setStats] = React.useState({
    werkeSold: 0, erlebnisseBooked: 0,
    provisionen: 0, poolAmount: 0,
    totalProjects: 0, totalVoters: 0, totalAwarded: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Parallel: Werke, Erlebnisse (Buchungen), Pool
        const [wRes, bRes, projRes, roundRes] = await Promise.allSettled([
          // Werke verkauft diesen Monat
          supabase.from("bookings")
            .select("id,amount,platform_fee", { count: "exact" })
            .not("work_id", "is", null)
            .gte("created_at", monthStart)
            .eq("status", "completed"),
          // Erlebnisse gebucht diesen Monat
          supabase.from("bookings")
            .select("id,amount,platform_fee", { count: "exact" })
            .not("experience_id", "is", null)
            .gte("created_at", monthStart),
          // Alle aktiven Projekte
          supabase.from("impact_projects")
            .select("id,votes,awarded_eur,goal_eur,status"),
          // Aktueller Round
          supabase.from("impact_rounds")
            .select("pool_eur,voting_ends_at")
            .eq("month", now.toISOString().slice(0, 7))
            .single(),
        ]);

        if (dead) return;

        const werkeData   = wRes.status === "fulfilled" ? (wRes.value.data || []) : [];
        const erlebData   = bRes.status === "fulfilled" ? (bRes.value.data || []) : [];
        const projData    = projRes.status === "fulfilled" ? (projRes.value.data || []) : [];
        const roundData   = roundRes.status === "fulfilled" ? roundRes.value.data : null;

        const werkeSold   = wRes.status === "fulfilled" ? (wRes.value.count || werkeData.length) : 0;
        const erlebBooked = bRes.status === "fulfilled" ? (bRes.value.count || erlebData.length) : 0;

        // Provisionen = sum(platform_fee) dieser Monat
        const allBookings = [...werkeData, ...erlebData];
        const provisionen = allBookings.reduce((s, b) => s + safeNum(b.platform_fee), 0);
        // Impact Pool = 15% der Provisionen ODER aus round.pool_eur
        const poolAmount  = roundData?.pool_eur ?? Math.round(provisionen * 0.15);

        const totalAwarded = projData.reduce((s, p) => s + safeNum(p.awarded_eur), 0);
        const totalVoters  = projData.reduce((s, p) => s + safeNum(p.votes), 0);

        setStats({
          werkeSold: safeNum(werkeSold),
          erlebnisseBooked: safeNum(erlebBooked),
          provisionen: Math.round(provisionen),
          poolAmount: Math.max(safeNum(poolAmount), 0),
          totalProjects: projData.length,
          totalVoters,
          totalAwarded,
        });
      } catch(e) {
        console.warn("[IMPACT STATS]", e?.message);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  return { stats, loading };
}

/* ────────────────────────────────────────────────────────────────────
   useImpactActivity — Realtime Aktivitätsfeed
──────────────────────────────────────────────────────────────────── */
function useImpactActivity() {
  const [activities, setActivities] = React.useState([]);

  React.useEffect(() => {
    let dead = false;
    // Initial laden
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_votes")
          .select("id,created_at,user_id,project_id,weight,profiles(display_name,avatar_url),impact_projects(name,status)")
          .order("created_at", { ascending: false })
          .limit(10);
        if (dead) return;
        setActivities((data || []).map(r => ({
          id: r.id,
          type: "vote",
          userName: r.profiles?.display_name || "Jemand",
          avatar: r.profiles?.avatar_url,
          projectName: r.impact_projects?.name || "ein Projekt",
          ts: r.created_at,
          ago: relTime(r.created_at),
        })));
      } catch { /* silent */ }
    })();

    // Realtime
    const sub = supabase.channel("impact_activity")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "impact_votes"
      }, async (payload) => {
        if (dead) return;
        const v = payload.new;
        // Lade user + projekt nach
        const [uRes, pRes] = await Promise.allSettled([
          supabase.from("profiles").select("display_name,avatar_url").eq("id", v.user_id).single(),
          supabase.from("impact_projects").select("name").eq("id", v.project_id).single(),
        ]);
        const uName = uRes.status === "fulfilled" ? uRes.value.data?.display_name : "Jemand";
        const pName = pRes.status === "fulfilled" ? pRes.value.data?.name : "ein Projekt";
        setActivities(prev => [{
          id: v.id || Date.now(),
          type: "vote",
          userName: uName || "Jemand",
          avatar: uRes.status === "fulfilled" ? uRes.value.data?.avatar_url : null,
          projectName: pName || "ein Projekt",
          ts: v.created_at || new Date().toISOString(),
          ago: "gerade eben",
        }, ...prev].slice(0, 12));
      })
      .subscribe();

    return () => { dead = true; supabase.removeChannel(sub); };
  }, []);

  return activities;
}

/* ────────────────────────────────────────────────────────────────────
   useLastPayout — letzte Auszahlung aus impact_rounds
──────────────────────────────────────────────────────────────────── */
function useLastPayout() {
  const [payout, setPayout] = React.useState(null);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_rounds")
          .select("id,month,pool_eur,distributed_at,winner_project_id,impact_projects(name,icon,color,category)")
          .eq("status", "distributed")
          .order("distributed_at", { ascending: false })
          .limit(1)
          .single();
        if (dead) return;
        if (data) {
          // Weitere Projekte die auch etwas bekommen haben
          const { data: winners } = await supabase
            .from("impact_projects")
            .select("id,name,awarded_eur,icon")
            .eq("status", "funded")
            .neq("id", data.winner_project_id)
            .order("awarded_eur", { ascending: false })
            .limit(4);
          setPayout({
            month: data.month,
            poolEur: data.pool_eur,
            distributedAt: data.distributed_at,
            winner: {
              name: data.impact_projects?.name || "Siegerprojekt",
              icon: data.impact_projects?.icon || "🏆",
              color: data.impact_projects?.color || T.teal,
            },
            winnerAmount: Math.round((data.pool_eur || 0) * 0.40),
            others: (winners || []).map(w => ({
              name: w.name,
              amount: w.awarded_eur || 160,
              icon: w.icon || "🌱",
            })),
          });
        }
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, []);

  return payout;
}

/* ────────────────────────────────────────────────────────────────────
   relTime helper (falls nicht global)
──────────────────────────────────────────────────────────────────── */
function relTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)  return "gerade eben";
  if (diff < 3600) return `vor ${Math.round(diff/60)} Min.`;
  if (diff < 86400) return `vor ${Math.round(diff/3600)} Std.`;
  return `vor ${Math.round(diff/86400)} Tg.`;
}

/* ════════════════════════════════════════════════════════════════════
   HAUPT-KOMPONENTE
═══════════════════════════════════════════════════════════════════ */
function ImpactPageInner({ currentUser }) {
  const [projects,    setProjects]    = React.useState([]);
  const [loading,     setLoading]     = React.useState(true);
  const [showPropose, setShowPropose] = React.useState(false);
  const [activeRound, setActiveRound] = React.useState(null);
  const [userVotes,   setUserVotes]   = React.useState([]);
  const [voteLoading, setVoteLoading] = React.useState(false);
  const [showCycleInfo, setShowCycleInfo] = React.useState(false);
  const [showVoteInfo,  setShowVoteInfo]  = React.useState(false);

  const { stats, loading: statsLoading } = useImpactStats();
  const activities = useImpactActivity();
  const lastPayout = useLastPayout();

  // Projekte laden
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("impact_projects")
          .select("id,name,category,description,icon,color,votes,goal_eur,awarded_eur,website,tags,status,contact_name,img_url,month")
          .in("status", ["nominated","active"])
          .order("votes", { ascending: false })
          .limit(12);
        if (dead) return;
        if (error) throw error;
        const imgs = [
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=90",
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=90",
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=90",
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=90",
        ];
        const rows = (data || []).map((p, i) => ({
          ...p,
          colorGlow: `${p.color || T.teal}33`,
          supporters: Math.max(1, safeNum(p.votes) - 3),
          img: p.img_url || imgs[i % imgs.length],
        }));
        setProjects(rows.length > 0 ? rows : SEED.map(s => ({ ...s, goal_eur: s.awarded_eur * 3 || 3000, status: "nominated" })));
      } catch {
        if (!dead) setProjects(SEED.map(s => ({ ...s, goal_eur: s.awarded_eur * 3 || 3000, status: "nominated" })));
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // Weitere Projekte (wartet auf Nominierung)
  const [allProjects, setAllProjects] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("impact_projects")
          .select("id,name,category,icon,color,status,votes,goal_eur,img_url")
          .in("status", ["submitted","reviewing","approved","nominated","funded","finished"])
          .order("created_at", { ascending: false })
          .limit(20);
        setAllProjects(data || []);
      } catch { /* silent */ }
    })();
  }, []);

  // ActiveRound + UserVotes
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

  // Vote abgeben
  const castVote = async (projectId) => {
    if (!currentUser?.id || voteLoading) return;
    const alreadyVoted = userVotes.some(v => v.project_id === projectId);
    if (alreadyVoted) return;

    const isMember = currentUser?.is_wirker || currentUser?.membership_type === "talent" || currentUser?.membership_type === "member";
    const voteWeight = isMember ? 2 : 1;
    const totalUsed = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
    if (totalUsed >= (isMember ? 2 : 1)) return;

    // Optimistic
    setUserVotes(prev => [...prev, { project_id: projectId, weight: 1 }]);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, votes: p.votes + 1, supporters: p.supporters + 1 } : p
    ));

    if (!activeRound?.id) return;
    setVoteLoading(true);
    try {
      const { error } = await ImpactService.castVote(currentUser.id, projectId, activeRound.id, voteWeight);
      if (error) {
        setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, votes: p.votes - 1, supporters: p.supporters - 1 } : p
        ));
      } else {
        const proj = projects.find(p => p.id === projectId);
        if (proj) FeedService.createActivity(currentUser.id, "impact_vote",
          `hat das Projekt „${proj.name}" unterstützt`, {}).catch(() => {});
      }
    } catch { /* silent */ }
    finally { setVoteLoading(false); }
  };

  const _projects = safeArr(projects);
  const nominated = _projects.filter(p => p.status === "nominated" || p.status === "active");
  const voices    = nominated.reduce((s, p) => s + safeNum(p.votes), 0);

  // Verbleibende Tage
  const daysLeft = activeRound?.voting_ends_at
    ? Math.max(0, Math.ceil((new Date(activeRound.voting_ends_at) - Date.now()) / 86400000))
    : null;

  const isMember = currentUser?.is_wirker || ["talent","member","guardian","team"].includes(currentUser?.membership_type);
  const maxVotes = isMember ? 2 : 1;
  const usedVotes = userVotes.reduce((s, v) => s + safeNum(v.weight || 1), 0);
  const remainingVotes = Math.max(0, maxVotes - usedVotes);

  return (
    <div style={{
      width: "100%", minHeight: "100svh",
      background: T.page, fontFamily: T.ff,
      paddingBottom: 120, overflowX: "hidden",
    }}>
      <style>{`
        @keyframes ipBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes ipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ipPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes ipSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ipLiveDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        .ip-card-press { cursor:pointer; transition:transform 0.14s ease, box-shadow 0.14s ease; }
        .ip-card-press:active { transform:scale(0.982) translateY(1.5px) !important; }
      `}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════════ */}
      <ImpactHeroNew stats={stats} statsLoading={statsLoading} />

      {/* ══ 2. POOL-VERTEILUNG + WIRKUNGSZYKLUS ═════════════════════ */}
      <PoolDistributionAndCycle onShowInfo={() => setShowCycleInfo(true)} />

      {/* ══ 3. AKTUELLE ABSTIMMUNG ═══════════════════════════════════ */}
      {nominated.length > 0 && (
        <VotingSection
          projects={nominated}
          userVotes={userVotes}
          daysLeft={daysLeft}
          onVote={castVote}
          loading={loading}
          onShowInfo={() => setShowVoteInfo(true)}
        />
      )}

      {/* ══ 4. STIMMEN-STATUS + MEMBER-UPSELL ═══════════════════════ */}
      <VoteStatusRow
        remainingVotes={remainingVotes}
        maxVotes={maxVotes}
        isMember={isMember}
        usedVotes={usedVotes}
      />

      {/* ══ 5. WEITERE PROJEKTE ══════════════════════════════════════ */}
      {allProjects.length > 0 && (
        <MoreProjectsSection projects={allProjects} />
      )}

      {/* ══ 6. IMPACT-STATS + PROJEKT EINREICHEN ════════════════════ */}
      <ImpactBottomRow
        stats={stats}
        totalProjects={allProjects.length}
        onPropose={() => setShowPropose(true)}
        activities={activities}
      />

      {/* ══ 7. LETZTE AUSZAHLUNG ════════════════════════════════════ */}
      {lastPayout && (
        <LastPayoutSection payout={lastPayout} />
      )}

      {/* ══ 8. PROJEKT EINREICHEN FLOW ══════════════════════════════ */}
      {showPropose && (
        <React.Suspense fallback={null}>
          <ImpactFlow onClose={() => setShowPropose(false)} />
        </React.Suspense>
      )}

      {/* ══ INFO OVERLAYS ═══════════════════════════════════════════ */}
      {showCycleInfo && (
        <InfoOverlay title="Der monatliche Wirkungszyklus" onClose={() => setShowCycleInfo(false)}>
          <p style={{ color:T.ink2, lineHeight:1.7, fontSize:14 }}>
            Jedes Werk und jedes Erlebnis das auf HUI verkauft wird, erzeugt eine kleine Provision.
            15% davon fließen direkt in den Impact Pool.<br/><br/>
            Einmal pro Monat stimmt die Community ab, welches Projekt die gesammelten Mittel erhält.
            Das Projekt mit den meisten Stimmen erhält seine volle Wunschsumme.
          </p>
        </InfoOverlay>
      )}
      {showVoteInfo && (
        <InfoOverlay title="So funktioniert die Abstimmung" onClose={() => setShowVoteInfo(false)}>
          <p style={{ color:T.ink2, lineHeight:1.7, fontSize:14 }}>
            Normale Nutzer haben <b>1 Stimme</b> pro Monat.<br/>
            Mitglieder und Talente haben <b>2 Stimmen</b> pro Monat.<br/><br/>
            Stimmen addieren sich nicht über Monate — jeder Monat beginnt neu.
            Das Projekt mit den meisten Stimmen erhält am Monatsende seine volle Wunschsumme.
          </p>
        </InfoOverlay>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   HERO NEU — mit Live-Daten
──────────────────────────────────────────────────────────────────── */
function ImpactHeroNew({ stats, statsLoading }) {
  const s = stats;

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: `
        radial-gradient(ellipse 120% 75% at 85% 25%, rgba(240,196,106,0.20) 0%, transparent 52%),
        radial-gradient(ellipse 75%  75% at  8% 12%, rgba(244,113,79,0.12)  0%, transparent 48%),
        linear-gradient(175deg, #FCF1E0 0%, #F8EFE0 40%, #F3EAD8 100%)
      `,
    }}>
      {/* Ambient blobs */}
      <div style={{
        position:"absolute", top:-90, right:-70, width:340, height:340,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(230,165,50,0.15) 0%, transparent 58%)",
        animation:"ipBreathe 7s ease-in-out infinite",
        pointerEvents:"none",
      }}/>

      {/* Hero Image rechts */}
      <div style={{
        position:"absolute", top:0, right:0,
        width:"54%", height:"100%", overflow:"hidden",
      }}>
        <img src={HERO_IMG} alt="Community" loading="eager" style={{
          width:"100%", height:"100%", objectFit:"cover",
          objectPosition:"center 20%",
          filter:"saturate(0.82) brightness(0.94) sepia(0.08)",
        }}/>
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(to right,
            #F5EAD6 0%, rgba(245,234,214,0.88) 12%,
            rgba(245,234,214,0.52) 35%, rgba(245,234,214,0.15) 60%, transparent 80%
          )`,
          pointerEvents:"none",
        }}/>
        <div style={{
          position:"absolute", left:0, right:0, bottom:0, height:"45%",
          background:`linear-gradient(to top, #FBF2E2 0%, rgba(251,242,226,0.7) 50%, transparent 100%)`,
          pointerEvents:"none",
        }}/>
        {/* Floating Symbols */}
        {[
          { e:"🌱", t:"10%", r:"20%", d:"0s" },
          { e:"🤝", t:"30%", r:"7%",  d:"0.8s" },
          { e:"💛", t:"55%", r:"30%", d:"1.5s" },
          { e:"✨", t:"72%", r:"10%", d:"0.5s" },
        ].map((f, i) => (
          <div key={i} style={{
            position:"absolute", top:f.t, right:f.r, fontSize:26,
            animation:`ipFloat 9s ease-in-out ${f.d} infinite`,
            filter:"drop-shadow(0 3px 12px rgba(0,0,0,0.16))",
            zIndex:2, pointerEvents:"none",
          }}>{f.e}</div>
        ))}
      </div>

      {/* LEFT — Content */}
      <div style={{
        position:"relative", zIndex:3,
        padding:"52px 22px 36px",
        maxWidth:380,
      }}>
        {/* Label */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(13,196,181,0.10)", border:"1px solid rgba(13,196,181,0.22)",
          borderRadius:99, padding:"6px 14px", marginBottom:18,
          backdropFilter:"blur(10px)",
        }}>
          <div style={{
            width:6, height:6, borderRadius:"50%",
            background:T.teal, animation:"ipLiveDot 2s ease-in-out infinite",
          }}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.14em", textTransform:"uppercase" }}>HUI Impact Pool</span>
        </div>

        {/* Headline */}
        <h1 style={{ margin:"0 0 14px", fontSize:30, fontWeight:900, lineHeight:1.18,
          letterSpacing:"-0.025em", color:T.ink }}>
          Gemeinsam<br/>
          <span style={{ color:T.teal }}>Wirkung</span> schaffen.
        </h1>
        <p style={{ margin:"0 0 28px", fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300 }}>
          15% unserer Provisionen fließen in den Impact Pool –<br/>
          für Projekte, die unsere Welt wirklich besser machen.
        </p>

        {/* Live Stats Grid */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10,
          marginBottom:20,
        }}>
          {[
            { val: s.werkeSold,         label:"Werke\nverkauft",         emoji:"🎨" },
            { val: s.erlebnisseBooked,  label:"Erlebnisse\ngebucht",     emoji:"📅" },
            { val: s.werkeSold + s.erlebnisseBooked, label:"Buchungen\ndiesen Monat", emoji:"📋" },
            { val: `€${s.poolAmount.toLocaleString("de-DE")}`,
                                         label:"im Impact Pool\ndiesen Monat", emoji:"💚", highlight:true },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.highlight
                ? `linear-gradient(135deg,${T.teal}18,${T.teal}08)`
                : "rgba(255,255,255,0.72)",
              backdropFilter:"blur(16px)",
              border: item.highlight
                ? `1.5px solid ${T.teal}35`
                : "1px solid rgba(255,255,255,0.85)",
              borderRadius:16, padding:"12px 14px",
              boxShadow:"0 2px 16px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{item.emoji}</div>
              <div style={{
                fontSize:22, fontWeight:900, letterSpacing:"-0.03em",
                color: item.highlight ? T.teal : T.ink,
                lineHeight:1,
              }}>
                {statsLoading ? "–" : item.val}
              </div>
              <div style={{ fontSize:10, color:T.ink2, marginTop:4, lineHeight:1.4, whiteSpace:"pre-line" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Live Ticker */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(255,255,255,0.60)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(13,196,181,0.20)",
          borderRadius:99, padding:"8px 16px",
        }}>
          <div style={{
            width:7, height:7, borderRadius:"50%", background:T.teal,
            animation:"ipLiveDot 2s ease-in-out infinite", flexShrink:0,
          }}/>
          <span style={{ fontSize:12, color:T.ink2, fontWeight:500 }}>
            LIVE · Der Impact Pool wächst gerade durch neue Buchungen
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   POOL-VERTEILUNG + WIRKUNGSZYKLUS (nebeneinander)
──────────────────────────────────────────────────────────────────── */
function PoolDistributionAndCycle({ onShowInfo }) {
  const slices = [
    { pct:40, label:"Community-Fonds",           desc:"Die Community stimmt ab – das Siegerprojekt erhält die volle Fördersumme.", color:T.teal },
    { pct:30, label:"Strategischer Wirkungsfonds",desc:"Für wichtige Projekte & Chancen, die uns alle schneller voranbringen.",     color:T.coral },
    { pct:20, label:"Innovationsfonds",           desc:"Für die Weiterentwicklung des Impact Pools und neue Wirkungsmöglichkeiten.", color:T.gold },
    { pct:10, label:"Kurationsfonds",             desc:"Für Prüfung, Begleitung & Qualitätssicherung der Projekte.",               color:T.violet },
  ];

  const cycle = [
    { step:"1", label:"Bewerbungen\neinreichen",  icon:"📝" },
    { step:"2", label:"Prüfung durch\nHUI-Team", icon:"🔍" },
    { step:"3", label:"Projekte\nnominiert",       icon:"🌿" },
    { step:"4", label:"Community\nstimmt ab",     icon:"🩷" },
    { step:"5", label:"Auszahlung &\nWirkung entfalten", icon:"🌱" },
  ];

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr 1fr", gap:14,
      padding:"0 16px", margin:"24px 0 0",
    }}>
      {/* Pool-Verteilung */}
      <div style={{
        background:T.surfaceHigh, borderRadius:24, padding:"20px 18px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
      }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:T.ink,
          letterSpacing:"-0.02em" }}>So wird der Impact Pool genutzt</h3>

        {/* Donut Placeholder — SVG */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
          <svg width={90} height={90} viewBox="0 0 36 36" style={{ flexShrink:0 }}>
            <circle cx={18} cy={18} r={15.9} fill="none" stroke="#F0EDE8" strokeWidth={5}/>
            {/* Segmente: 40/30/20/10 */}
            <circle cx={18} cy={18} r={15.9} fill="none"
              stroke={T.teal} strokeWidth={5}
              strokeDasharray={`${40} ${60}`} strokeDashoffset={25}/>
            <circle cx={18} cy={18} r={15.9} fill="none"
              stroke={T.coral} strokeWidth={5}
              strokeDasharray={`${30} ${70}`} strokeDashoffset={-15}/>
            <circle cx={18} cy={18} r={15.9} fill="none"
              stroke={T.gold} strokeWidth={5}
              strokeDasharray={`${20} ${80}`} strokeDashoffset={-45}/>
            <circle cx={18} cy={18} r={15.9} fill="none"
              stroke={T.violet} strokeWidth={5}
              strokeDasharray={`${10} ${90}`} strokeDashoffset={-65}/>
            <text x={18} y={21} textAnchor="middle"
              style={{ fontSize:6, fontWeight:900, fill:T.ink }}>100%</text>
            <text x={18} y={25} textAnchor="middle"
              style={{ fontSize:4, fill:T.ink2 }}>für Impact</text>
          </svg>
          <div style={{ flex:1 }}>
            {slices.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:8 }}>
                <div style={{
                  width:10, height:10, borderRadius:3, flexShrink:0,
                  background:s.color, marginTop:2,
                }}/>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:T.ink }}>
                    {s.pct}% {s.label}
                  </div>
                  <div style={{ fontSize:9.5, color:T.ink2, lineHeight:1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onShowInfo} style={{
          background:"none", border:`1px solid ${T.teal}30`,
          borderRadius:99, padding:"6px 14px",
          fontSize:11, fontWeight:700, color:T.teal,
          cursor:"pointer", WebkitTapHighlightColor:"transparent",
        }}>Mehr erfahren</button>
      </div>

      {/* Wirkungszyklus */}
      <div style={{
        background:T.surfaceHigh, borderRadius:24, padding:"20px 18px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
      }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:T.ink,
          letterSpacing:"-0.02em" }}>Unser monatlicher Wirkungszyklus</h3>

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {cycle.map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.teal}20,${T.teal}08)`,
                  border:`1.5px solid ${T.teal}35`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, flexShrink:0,
                }}>{step.icon}</div>
                {i < cycle.length - 1 && (
                  <div style={{ width:1.5, height:18, background:`${T.teal}25`, margin:"2px 0" }}/>
                )}
              </div>
              <div style={{ paddingTop:6, paddingBottom: i < cycle.length - 1 ? 0 : 0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.ink, whiteSpace:"pre-line" }}>
                  {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ margin:"14px 0 0", fontSize:10.5, color:T.ink2, lineHeight:1.5 }}>
          Einmal im Monat. Immer gemeinsam. Immer transparent.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   VOTING SECTION — Aktuelle Abstimmung
──────────────────────────────────────────────────────────────────── */
function VotingSection({ projects, userVotes, daysLeft, onVote, loading, onShowInfo }) {
  return (
    <div style={{ padding:"0 16px", marginTop:28 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink, letterSpacing:"-0.02em" }}>
            Aktuelle Abstimmung
            {daysLeft !== null && (
              <span style={{ fontSize:13, fontWeight:600, color:T.coral, marginLeft:10 }}>
                · Noch {daysLeft} Tage
              </span>
            )}
          </h2>
        </div>
        <button onClick={onShowInfo} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
          WebkitTapHighlightColor:"transparent",
        }}>So funktioniert die Abstimmung</button>
      </div>

      {/* Project Cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {projects.slice(0, 3).map((p, i) => (
          <VotingCard
            key={p.id}
            project={p}
            rank={i}
            userVotes={userVotes}
            onVote={onVote}
            totalVotes={projects.reduce((s, pp) => s + safeNum(pp.votes), 0)}
          />
        ))}
      </div>
    </div>
  );
}

function VotingCard({ project: p, rank, userVotes, onVote, totalVotes }) {
  const voted  = userVotes.some(v => v.project_id === p.id);
  const accent = p.color || T.teal;
  const glow   = `${accent}33`;
  const [imgErr, setImgErr] = React.useState(false);
  const goalEur = safeNum(p.goal_eur) || 3000;
  const pct = totalVotes > 0 ? Math.round(safeNum(p.votes) / totalVotes * 100) : 0;

  const RANK_COLORS = [T.teal, T.coral, T.violet];
  const rankColor = RANK_COLORS[rank] || T.teal;

  return (
    <div style={{
      background:T.surfaceHigh, borderRadius:24, overflow:"hidden",
      boxShadow:S.card, border:`1px solid ${T.line}`,
      animation:"ipSlideIn 0.4s ease both",
      animationDelay:`${rank * 0.08}s`,
    }}>
      {/* Bild */}
      <div style={{ position:"relative", height:160, overflow:"hidden",
        background:`linear-gradient(135deg,${accent}15,${accent}05)` }}>
        {p.img && !imgErr ? (
          <img src={p.img} alt={p.name} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              filter:"saturate(0.85) brightness(0.96)" }} loading="lazy"/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:56 }}>{p.icon || "🌱"}</div>
        )}
        {/* Rank Badge */}
        <div style={{
          position:"absolute", top:12, left:12,
          width:36, height:36, borderRadius:"50%",
          background:rankColor, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, fontWeight:900, color:"white",
          boxShadow:`0 2px 12px ${rankColor}66`,
        }}>{rank + 1}</div>
        {/* Kategorie */}
        <div style={{
          position:"absolute", top:12, right:12,
          background:"rgba(255,252,248,0.90)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(255,255,255,0.80)",
          borderRadius:99, padding:"4px 11px",
        }}>
          <span style={{ fontSize:9, color:T.ink2, fontWeight:750,
            letterSpacing:"0.07em", textTransform:"uppercase" }}>{p.category}</span>
        </div>
        {/* Gradient Fade */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(255,255,255,0.85) 0%, transparent 45%)",
          pointerEvents:"none" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 18px 18px" }}>
        <h3 style={{ margin:"0 0 8px", fontSize:17, fontWeight:820,
          color:T.ink, letterSpacing:"-0.018em" }}>{p.name}</h3>
        {p.description && (
          <p style={{ margin:"0 0 12px", fontSize:13, color:T.ink2, lineHeight:1.65,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {p.description}
          </p>
        )}

        {/* Stimmen + Ziel */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Avatar Stack */}
            <div style={{ display:"flex" }}>
              {AVATARS.slice(0, 3).map((av, i) => (
                <img key={i} src={av} alt="" style={{
                  width:24, height:24, borderRadius:"50%",
                  border:"2px solid #fff", marginLeft: i === 0 ? 0 : -8,
                  objectFit:"cover",
                }}/>
              ))}
            </div>
            <span style={{ fontSize:12, color:T.ink2, fontWeight:600 }}>
              <b style={{ color:T.ink }}>{p.votes}</b> Stimmen
            </span>
          </div>
          <span style={{ fontSize:12, color:T.ink2, fontWeight:600 }}>
            Ziel: <b style={{ color:T.ink }}>€{goalEur.toLocaleString("de-DE")}</b>
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ height:6, borderRadius:99, background:"rgba(0,0,0,0.07)",
          overflow:"hidden", marginBottom:14 }}>
          <div style={{
            height:"100%", borderRadius:99, width:`${pct}%`,
            background:`linear-gradient(90deg,${accent},${accent}BB)`,
            boxShadow:`0 0 10px ${glow}`,
            transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)",
            minWidth: pct > 0 ? 12 : 0,
          }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:11, color:T.muted, marginBottom:14 }}>
          <span>{pct}% der Stimmen</span>
          {safeNum(p.awarded_eur) > 0 && (
            <span>€{safeNum(p.awarded_eur).toLocaleString("de-DE")} vergeben</span>
          )}
        </div>

        {/* Vote Button */}
        <button
          onClick={() => !voted && onVote(p.id)}
          style={{
            width:"100%", border:"none", borderRadius:16,
            padding:"12px 0", cursor: voted ? "default" : "pointer",
            background: voted
              ? `linear-gradient(135deg,${accent}15,${accent}08)`
              : `linear-gradient(135deg,${accent},${accent}CC)`,
            color: voted ? accent : "white",
            fontSize:14, fontWeight:750,
            letterSpacing:"-0.01em",
            boxShadow: voted ? "none" : S.btn(accent),
            border: voted ? `1.5px solid ${accent}35` : "none",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"all 0.2s ease",
            WebkitTapHighlightColor:"transparent",
          }}
        >
          <span style={{ fontSize:16 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Danke für deine Stimme" : "Mit Stimme unterstützen"}</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STIMMEN STATUS + MEMBER UPSELL
──────────────────────────────────────────────────────────────────── */
function VoteStatusRow({ remainingVotes, maxVotes, isMember, usedVotes }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr 1fr", gap:14,
      padding:"0 16px", marginTop:20,
    }}>
      {/* Deine Stimmen */}
      <div style={{
        background:T.surfaceHigh, borderRadius:20, padding:"18px 16px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
      }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.ink, marginBottom:8,
          letterSpacing:"-0.01em" }}>Deine Stimmen diesen Monat</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
          {Array.from({ length: maxVotes }).map((_, i) => (
            <div key={i} style={{
              width:28, height:28, borderRadius:"50%",
              background: i < usedVotes
                ? `linear-gradient(135deg,${T.teal},${T.tealLight})`
                : "rgba(0,0,0,0.07)",
              border: i < usedVotes ? "none" : `1.5px dashed rgba(0,0,0,0.15)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14,
            }}>{i < usedVotes ? "✓" : ""}</div>
          ))}
        </div>
        <div style={{ fontSize:12, color:T.ink2 }}>
          Du hast <b style={{ color:T.teal }}>{remainingVotes} Stimme{remainingVotes !== 1 ? "n" : ""}</b> übrig
          {isMember && <span style={{ fontSize:10, color:T.violet, display:"block", marginTop:2 }}>
            (Als Mitglied/Talent)
          </span>}
        </div>
        <div style={{ fontSize:11, color:T.muted, marginTop:8, lineHeight:1.5 }}>
          Jeden Monat bekommst du neue Stimmen. Sie addieren sich nicht.
        </div>
      </div>

      {/* Mehr Wirkung */}
      {!isMember ? (
        <div style={{
          background:`linear-gradient(135deg,${T.gold}18,${T.gold}08)`,
          border:`1.5px solid ${T.gold}30`,
          borderRadius:20, padding:"18px 16px",
          boxShadow:S.card,
        }}>
          <div style={{ fontSize:20, marginBottom:6 }}>⭐</div>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:6 }}>
            Mehr Wirkung mit 2 Stimmen
          </div>
          <div style={{ fontSize:12, color:T.ink2, lineHeight:1.5, marginBottom:12 }}>
            Werde jetzt Mitglied oder Talent und erhalte 2 Stimmen pro Monat.
          </div>
          <button style={{
            background:`linear-gradient(135deg,${T.gold},${T.goldSoft})`,
            border:"none", borderRadius:12, padding:"8px 16px",
            fontSize:12, fontWeight:750, color:"white",
            cursor:"pointer", boxShadow:S.btn(T.gold),
            WebkitTapHighlightColor:"transparent",
          }}>Mehr erfahren</button>
        </div>
      ) : (
        <div style={{
          background:`linear-gradient(135deg,${T.teal}15,${T.teal}05)`,
          border:`1.5px solid ${T.teal}25`,
          borderRadius:20, padding:"18px 16px",
          boxShadow:S.card,
        }}>
          <div style={{ fontSize:20, marginBottom:6 }}>🏅</div>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:6 }}>
            Danke für dein Engagement!
          </div>
          <div style={{ fontSize:12, color:T.ink2, lineHeight:1.5 }}>
            Als Mitglied/Talent hast du 2 Stimmen pro Monat und kannst so doppelte Wirkung entfalten.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   WEITERE PROJEKTE IM POOL
──────────────────────────────────────────────────────────────────── */
const STATUS_LABELS = {
  submitted: { label:"Eingereicht",        color:"#94A3B8" },
  reviewing: { label:"In Prüfung",         color:T_IMPACT_GOLD || "#D97706" },
  approved:  { label:"Angenommen",         color:T_IMPACT_TEAL || "#0DC4B5" },
  rejected:  { label:"Abgelehnt",          color:"#EF4444" },
  nominated: { label:"Nominiert",          color:"#7264D6" },
  funded:    { label:"Finanziert ✓",       color:"#16A34A" },
  finished:  { label:"Abgeschlossen",      color:"#94A3B8" },
};

// Hilfskonstanten die T noch nicht haben (fallback)
const T_IMPACT_TEAL = "#0DC4B5";
const T_IMPACT_GOLD = "#D4952A";

function MoreProjectsSection({ projects }) {
  const [showAll, setShowAll] = React.useState(false);
  const displayed = showAll ? projects : projects.slice(0, 6);

  return (
    <div style={{ padding:"0 16px", marginTop:28 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink, letterSpacing:"-0.02em" }}>
          Weitere Projekte im Pool
        </h2>
        {projects.length > 6 && (
          <button onClick={() => setShowAll(!showAll)} style={{
            background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
          }}>
            {showAll ? "Weniger" : `Alle ${projects.length} Projekte ansehen`}
          </button>
        )}
      </div>

      {/* Horizontal scroll für Bubbles */}
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8, WebkitOverflowScrolling:"touch" }}
        className="dp-hscroll">
        {displayed.map((p, i) => {
          const status = STATUS_LABELS[p.status] || { label:p.status, color:T.ink2 };
          const accent = p.color || T.teal;
          return (
            <div key={p.id} style={{
              flexShrink:0, width:100, display:"flex", flexDirection:"column",
              alignItems:"center", gap:6, cursor:"pointer",
              animation:"ipSlideIn 0.3s ease both",
              animationDelay:`${i * 0.04}s`,
            }}>
              {/* Circle Avatar */}
              <div style={{
                width:70, height:70, borderRadius:"50%",
                background:`linear-gradient(135deg,${accent}25,${accent}10)`,
                border:`2px solid ${accent}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28, position:"relative",
                boxShadow:"0 3px 14px rgba(0,0,0,0.07)",
              }}>
                {p.icon || "🌱"}
                {/* Status Dot */}
                <div style={{
                  position:"absolute", bottom:2, right:2,
                  width:14, height:14, borderRadius:"50%",
                  background:status.color, border:"2px solid white",
                }}/>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.ink, lineHeight:1.3,
                  overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2,
                  WebkitBoxOrient:"vertical" }}>{p.name}</div>
                <div style={{ fontSize:9.5, color:status.color, fontWeight:700, marginTop:2 }}>
                  {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   IMPACT BOTTOM ROW: Stats + Projekt einreichen + Aktivitätsfeed
──────────────────────────────────────────────────────────────────── */
function ImpactBottomRow({ stats, totalProjects, onPropose, activities }) {
  return (
    <div style={{ padding:"0 16px", marginTop:28 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

        {/* Links: Stats + Projekt einreichen */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Wirkung-Stats */}
          <div style={{
            background:T.surfaceHigh, borderRadius:20, padding:"18px 16px",
            boxShadow:S.card, border:`1px solid ${T.line}`,
          }}>
            <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:800, color:T.ink }}>
              Wirkung, die wir gemeinsam möglich machen
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { val:`€${safeNum(stats.totalAwarded).toLocaleString("de-DE")}`,
                  label:"in Projekte ausgezahlt", icon:"🩷" },
                { val:totalProjects,
                  label:"Projekte unterstützt",   icon:"🌍" },
                { val:safeNum(stats.totalVoters),
                  label:"Menschen erreicht",       icon:"👥" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:40, height:40, borderRadius:12, flexShrink:0,
                    background:`${T.teal}15`, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:18,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:20, fontWeight:900, color:T.teal,
                      letterSpacing:"-0.03em" }}>{item.val}</div>
                    <div style={{ fontSize:11, color:T.ink2 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projekt einreichen */}
          <div style={{
            background:`linear-gradient(135deg,${T.teal}15,${T.teal}05)`,
            border:`1.5px solid ${T.teal}30`,
            borderRadius:20, padding:"18px 16px",
            boxShadow:S.card,
          }}>
            <div style={{ fontSize:24, marginBottom:8 }}>💚</div>
            <h3 style={{ margin:"0 0 8px", fontSize:14, fontWeight:800, color:T.ink }}>
              Dein Herzensprojekt einreichen
            </h3>
            <p style={{ margin:"0 0 14px", fontSize:12, color:T.ink2, lineHeight:1.5 }}>
              Du hast eine Idee, die unsere Welt besser macht? Bewirb dich mit deinem Herzensprojekt.
            </p>
            <button onClick={onPropose} style={{
              width:"100%", border:"none", borderRadius:14,
              padding:"11px 0",
              background:`linear-gradient(135deg,${T.teal},${T.tealLight})`,
              color:"white", fontSize:13, fontWeight:750,
              cursor:"pointer", boxShadow:S.btn(T.teal),
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              WebkitTapHighlightColor:"transparent",
            }}>
              <span>🌱</span> Projekt einreichen
            </button>
          </div>
        </div>

        {/* Rechts: Aktivitätsfeed */}
        <div style={{
          background:T.surfaceHigh, borderRadius:20, padding:"18px 16px",
          boxShadow:S.card, border:`1px solid ${T.line}`,
          display:"flex", flexDirection:"column",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", background:T.teal,
              animation:"ipLiveDot 2s ease-in-out infinite",
            }}/>
            <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:T.ink }}>
              Aktivitäten im Impact Pool
            </h3>
          </div>

          {activities.length === 0 ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:8,
              padding:"20px 0", color:T.muted }}>
              <span style={{ fontSize:28 }}>🌱</span>
              <span style={{ fontSize:12 }}>Noch keine Aktivitäten</span>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {activities.slice(0, 5).map((act, i) => (
                <div key={act.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  animation:"ipSlideIn 0.3s ease both",
                  animationDelay:`${i * 0.06}s`,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width:32, height:32, borderRadius:"50%", flexShrink:0,
                    overflow:"hidden",
                    background: act.avatar ? "transparent" : `${T.teal}20`,
                    border:`1.5px solid ${T.teal}20`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:14,
                  }}>
                    {act.avatar
                      ? <img src={act.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : "👤"
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:T.ink, lineHeight:1.4,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <b>{act.userName}</b>{" "}hat{" "}
                      <b>{act.projectName}</b> mit 1 Stimme unterstützt
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{act.ago}</div>
                </div>
              ))}
            </div>
          )}

          {activities.length > 5 && (
            <button style={{
              marginTop:12, background:"none", border:`1px solid ${T.teal}30`,
              borderRadius:99, padding:"7px 16px",
              fontSize:11, fontWeight:700, color:T.teal,
              cursor:"pointer", alignSelf:"flex-start",
              WebkitTapHighlightColor:"transparent",
            }}>Alle Aktivitäten anzeigen</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LETZTE AUSZAHLUNG
──────────────────────────────────────────────────────────────────── */
function LastPayoutSection({ payout }) {
  const fmt = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("de-DE", { month:"long", year:"numeric" });
  };

  return (
    <div style={{ padding:"0 16px", marginTop:28 }}>
      <h2 style={{ margin:"0 0 14px", fontSize:18, fontWeight:900, color:T.ink,
        letterSpacing:"-0.02em" }}>Letzte Auszahlung</h2>

      <div style={{
        background:T.surfaceHigh, borderRadius:24, padding:"20px 18px",
        boxShadow:S.card, border:`1px solid ${T.line}`,
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:16,
      }}>
        {/* Gewinner */}
        <div>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6, marginBottom:12,
            background:`${T.gold}18`, border:`1px solid ${T.gold}30`,
            borderRadius:99, padding:"4px 12px",
          }}>
            <span style={{ fontSize:12 }}>🏆</span>
            <span style={{ fontSize:10, fontWeight:800, color:T.gold,
              letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Gewinner · {fmt(payout.distributedAt)}
            </span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{
              width:52, height:52, borderRadius:16,
              background:`${T.teal}18`, border:`1.5px solid ${T.teal}25`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
            }}>{payout.winner.icon}</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
                {payout.winner.name}
              </div>
              <div style={{ fontSize:13, color:T.teal, fontWeight:750, marginTop:2 }}>
                €{safeNum(payout.winnerAmount).toLocaleString("de-DE")} wurden ausgezahlt
              </div>
            </div>
          </div>

          <button style={{
            background:"none", border:`1px solid ${T.teal}35`,
            borderRadius:12, padding:"7px 16px",
            fontSize:12, fontWeight:700, color:T.teal,
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
          }}>Zum Projekt</button>
        </div>

        {/* Zusätzlich verteilt */}
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:T.ink2,
            letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:10 }}>
            Zusätzlich verteilt
          </div>
          {(payout.others || []).map((o, i) => (
            <div key={i} style={{
              display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"6px 0",
              borderBottom: i < (payout.others.length - 1) ? `1px solid ${T.line}` : "none",
            }}>
              <span style={{ fontSize:12, color:T.ink }}>{o.icon} {o.name}</span>
              <span style={{ fontSize:12, fontWeight:750, color:T.teal }}>
                +€{safeNum(o.amount).toLocaleString("de-DE")}
              </span>
            </div>
          ))}
          {(payout.others || []).length === 0 && (
            <div style={{ fontSize:12, color:T.muted }}>Keine weiteren Verteilungen</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   INFO OVERLAY
──────────────────────────────────────────────────────────────────── */
function InfoOverlay({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:900,
      background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end",
      WebkitTapHighlightColor:"transparent",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", background:T.surfaceHigh,
        borderRadius:"24px 24px 0 0", padding:"28px 22px 40px",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.12)",
        animation:"ipSlideIn 0.28s ease both",
      }}>
        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)",
          margin:"0 auto 20px", }}/>
        <h3 style={{ margin:"0 0 14px", fontSize:18, fontWeight:800, color:T.ink,
          letterSpacing:"-0.02em" }}>{title}</h3>
        {children}
        <button onClick={onClose} style={{
          marginTop:20, width:"100%", background:T.teal, border:"none",
          borderRadius:16, padding:"12px 0", color:"white",
          fontSize:14, fontWeight:750, cursor:"pointer",
          WebkitTapHighlightColor:"transparent",
        }}>Verstanden</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SKELETON
──────────────────────────────────────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div style={{ padding:"0 16px", marginTop:24 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height:280, borderRadius:24, marginBottom:16,
          background:"linear-gradient(90deg,#F0EDE8 25%,#F8F4EE 50%,#F0EDE8 75%)",
          backgroundSize:"200% 100%",
          animation:"ipBreathe 1.4s ease-in-out infinite",
        }}/>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ROOT EXPORT
──────────────────────────────────────────────────────────────────── */
export default function ImpactPage(props) {
  const { currentUser } = props;
  return (
    <ImpactErrorBoundary>
      <ImpactPageInner currentUser={currentUser} />
    </ImpactErrorBoundary>
  );
}
