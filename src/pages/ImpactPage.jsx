// ImpactPage.jsx — V5: Emotion First · Seele zurück · Logik zuletzt
// Alle Hooks + Logik identisch — nur Reihenfolge + Präsentation neu
// ═══════════════════════════════════════════════════════════════════

import { useStripeImpactPool } from '@/hooks/useStripeImpactPool';
import ReactDOM from 'react-dom';
import React from "react";
import { ProfileService } from '../services/db';
import { supabase } from "../lib/supabaseClient";
import { ImpactService, FeedService } from "../services/db.js";
import { HUI } from "../design/hui.design.js";
import ImpactFlow from "../system/flows/impact/ImpactFlow.jsx";
import { useAuth } from "../lib/AuthContext";
import { isProfileTalent } from "../lib/profileUtils.js";

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

// SEED_PROJECTS deaktiviert — nur echte Projekte aus impact_applications (status=approved)
const SEED_PROJECTS = [];

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
  const [s, setS] = React.useState({
    projekte:0, eur:0, stimmen:0, menschen:0, loading:true,
    // Status-Counts für "Impact auf einen Blick" Timeline
    eingereicht:0, pruefung:0, nominiert:0, finanziert_count:0, umsetzung:0,
  });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [allRes, vRes] = await Promise.allSettled([
          supabase.from("impact_projects")
            .select("id,status,awarded_eur"),
          supabase.from("impact_votes")
            .select("id,user_id", { count:"exact" }),
        ]);
        if (dead) return;
        const allProjs = allRes.status === "fulfilled" ? (allRes.value.data || []) : [];
        const vdata    = vRes.status   === "fulfilled" ? vRes.value : { count:0, data:[] };
        const unique   = new Set((vdata.data || []).map(v => v.user_id)).size;
        const funded   = allProjs.filter(p => ["funded","finished"].includes(p.status));
        setS({
          projekte:         funded.length,
          eur:              funded.reduce((a,p) => a + safeNum(p.awarded_eur), 0),
          stimmen:          vdata.count || 0,
          menschen:         unique,
          eingereicht:      allProjs.filter(p => p.status === "submitted").length,
          pruefung:         allProjs.filter(p => ["pending","approved"].includes(p.status)).length,
          nominiert:        allProjs.filter(p => ["nominated","active"].includes(p.status)).length,
          finanziert_count: funded.length,
          umsetzung:        allProjs.filter(p => p.status === "in_progress").length,
          loading: false,
        });
      } catch (e) {
        console.warn("[TRANSP]", e?.message);
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
          .select("id,name,icon,color,img_url,status,category,awarded_eur,distributed_at,impact_report,tags")
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
          uIds.length ? ProfileService.getMany(uIds) // ProfileService v1.0
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

// ════════════════════════════════════════════════════════════════
// HOOK: useWeitereHerzensprojekte — lädt aus impact_applications (Platz 2-N approved)
// ════════════════════════════════════════════════════════════════
function useWeitereHerzensprojekte(activeProjectIds) {
  const [data,    setData]    = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const idsKey = (activeProjectIds || []).slice().sort().join(",");

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data: rows } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,status,created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(20);
        if (dead) return;
        const activeSet = new Set(activeProjectIds || []);
        // Normalisiere auf einheitliches Format für HerzensKarte
        const normalized = (rows || [])
          .filter(p => !activeSet.has(p.id))
          .map(p => ({
            id:          p.id,
            name:        p.project_name,
            category:    p.short_desc?.slice(0, 20) || "Herzensprojekt",
            description: p.short_desc,
            icon:        "💚",
            color:       "#0DC4B5",
            status:      "approved",
            goal_eur:    p.funding_goal || 0,
            img_url:     p.cover_url || (p.media_urls && p.media_urls[0]) || null,
          }))
          .slice(0, 10);
        setData(normalized);
      } catch(e) { console.warn("[WEITERE HP]", e?.message); }
      if (!dead) setLoading(false);
    })();
    return () => { dead = true; };
  }, [idsKey]);

  return { data, loading };
}


// ════════════════════════════════════════════════════════════════
// HOOK: useApprovedApplications — bewilligte Herzensprojekte aus impact_applications
// ════════════════════════════════════════════════════════════════
function useApprovedApplications() {
  const [apps, setApps]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // poolMonth stabil halten — kein Re-Render auf iOS
  const poolMonthRef = React.useRef(new Date().toISOString().slice(0, 7));

  const loadApps = React.useCallback(async () => {
    try {
      const currentPoolMonth = new Date().toISOString().slice(0, 7);
      const { data: rawApps } = await supabase
        .from("impact_applications")
        .select("id,project_name,short_desc,problem,vision,why_support,funding_goal,funding_use,cover_url,media_urls,status,created_at,contact_name,contact_email,user_id")
        .eq("status", "approved").order("created_at", { ascending: false }).limit(50);
      const appList = rawApps || [];
      if (!appList.length) return [];
      const appIds = appList.map(a => a.id);
      const { data: votes } = await supabase
        .from("impact_votes").select("project_id").in("project_id", appIds).eq("pool_month", currentPoolMonth);
      const vc = {};
      (votes || []).forEach(v => { vc[v.project_id] = (vc[v.project_id] || 0) + 1; });
      return appList.map(a => ({ ...a, vote_count: vc[a.id] || 0 }))
        .sort((a, b) => b.vote_count - a.vote_count || new Date(b.created_at) - new Date(a.created_at));
    } catch (e) { console.warn("[APPROVED APPS]", e?.message); return []; }
  }, []);  // ← Keine poolMonth Dependency → kein Re-Render-Loop auf iOS

  React.useEffect(() => {
    let dead = false;
    loadApps().then(s => { if (!dead) { setApps(s); setLoading(false); } });
    const sub = supabase.channel("imp_apps_rt_" + Date.now())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" },
        (payload) => {
          // Optimistic update: vote_count sofort hochzählen ohne reload
          const pid = payload.new?.project_id;
          if (pid) {
            setApps(prev => prev.map(a =>
              a.id === pid ? { ...a, vote_count: (a.vote_count || 0) + 1 } : a
            ));
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "impact_applications" },
        () => loadApps().then(s => { if (!dead) setApps(s); }))
      .subscribe();
    return () => { dead = true; supabase.removeChannel(sub); };
  }, [loadApps]);

  const top1    = apps[0]    || null;
  const weitere = apps.slice(1, 5);
  return { apps, top1, weitere, loading };
}

// ── useMonthlyVoteRanking — Top 3 für Aktuelle Abstimmung ───────
function useMonthlyVoteRanking(approvedApps) {
  const top3 = React.useMemo(() => (approvedApps || []).slice(0, 3), [approvedApps]);
  React.useEffect(() => {
    if (!top3.length) return;
    const now = new Date();
    if (new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() !== now.getDate()) return;
    const month = now.toISOString().slice(0, 7);
    supabase.from("impact_monthly_results").upsert({
      month, year: now.getFullYear(),
      first_place_project_id:  top3[0]?.id || null,
      second_place_project_id: top3[1]?.id || null,
      third_place_project_id:  top3[2]?.id || null,
    }, { onConflict: "month" }).catch(() => {});
  }, [top3]);
  return top3;
}

// ── Detailseite für bewilligte Anträge ──────────────────────────
function ApprovedProjectDetail({ app, onClose, currentUser, onVoted = () => {} }) {
  const [voted,        setVoted]        = React.useState(false);
  const [voteCount,    setVoteCount]    = React.useState(0);
  const [userVotesLeft, setUserVotesLeft] = React.useState(null); // null = lädt noch
  const [loading,      setLoading]      = React.useState(false);
  const [checking,     setChecking]     = React.useState(true);
  const [voteError,    setVoteError]    = React.useState(null);

  const img = app.cover_url
    || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";

  // Pool-Monat: YYYY-MM des aktuellen Monats
  const poolMonth = new Date().toISOString().slice(0, 7); // z.B. "2026-06"

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // 1. Bereits für dieses Projekt abgestimmt?
        if (currentUser?.id) {
          const { data: existing } = await supabase
            .from("impact_votes")
            .select("id")
            .eq("voter_id", currentUser.id)
            .eq("project_id", app.id)
            .limit(1);
          if (!dead && existing?.length) setVoted(true);

          // 2. Wieviele Stimmen hat der User diesen Monat bereits vergeben?
          const { count: usedThisMonth } = await supabase
            .from("impact_votes")
            .select("id", { count: "exact", head: true })
            .eq("voter_id", currentUser.id)
            .eq("pool_month", poolMonth);
          // Single Source of Truth: isProfileTalent
          const maxStimmen = isProfileTalent(currentUser) ? 2 : 1;
          if (!dead) setUserVotesLeft(Math.max(0, maxStimmen - (usedThisMonth || 0)));
        }

        // 3. Gesamtstimmen für dieses Projekt
        const { count } = await supabase
          .from("impact_votes")
          .select("id", { count: "exact", head: true })
          .eq("project_id", app.id);
        if (!dead) setVoteCount(count || 0);
      } catch { /* silent */ }
      if (!dead) setChecking(false);
    })();
    return () => { dead = true; };
  }, [app.id, currentUser?.id]);

  const handleVote = async () => {
    if (!currentUser?.id || voted || loading) return;
    if (userVotesLeft !== null && userVotesLeft <= 0) {
      setVoteError("Du hast diesen Monat keine Stimmen mehr.");
      return;
    }
    setLoading(true);
    setVoteError(null);
    try {
      const { error } = await supabase.from("impact_votes").insert({
        voter_id:   currentUser.id,
        project_id: app.id,
        pool_month: poolMonth,
        weight:     1,
        created_at: new Date().toISOString(),
      });
      if (!error) {
        setVoted(true);
        setVoteCount(v => v + 1);
        setUserVotesLeft(v => Math.max(0, (v || 1) - 1));
        onVoted(app.id);
      } else {
        setVoteError("Abstimmung fehlgeschlagen. Bitte erneut versuchen.");
      }
    } catch { setVoteError("Verbindungsfehler. Bitte erneut versuchen."); }
    setLoading(false);
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "";

  // Portal: direkt in document.body mounten — kein Clipping durch Page-Flow
  const content = (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:9998,
        background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
        animation:"ipFadeIn 0.22s ease both",
      }} />
      {/* Bottom-Sheet: top=15px → minimale Luft oben, Navbar-sicher */}
      <div onClick={e => e.stopPropagation()} style={{
        position:"fixed", left:0, right:0, top:15, bottom:0, zIndex:9999,
        background:"#FDFAF5",
        borderRadius:"24px 24px 0 0",
        boxShadow:"0 -12px 60px rgba(0,0,0,0.22)",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        animation:"ipSlideUp 0.30s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Drag-Handle — fixiert oben */}
        <div style={{ flexShrink:0, paddingTop:10, paddingBottom:4 }}>
          <div style={{
            width:40, height:4, borderRadius:99,
            background:"rgba(20,20,34,0.15)",
            margin:"0 auto",
          }} />
        </div>
        {/* Scrollbarer Inhalt — nimmt restliche Höhe, Navbar-Abstand innen */}
        <div style={{
          flex:1, overflowY:"auto",
          overscrollBehavior:"contain",
          WebkitOverflowScrolling:"touch",
          paddingBottom:"calc(88px + env(safe-area-inset-bottom, 0px))",
        }}>
        {/* Bild */}
        <div style={{ position:"relative", height:220, borderRadius:"24px 24px 0 0", overflow:"hidden" }}>
          <img src={img} alt={app.project_name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }}
          />
          <button onClick={onClose} style={{
            position:"absolute", top:12, right:12,
            width:36, height:36, borderRadius:"50%",
            background:"rgba(0,0,0,0.50)", border:"none",
            color:"#fff", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            backdropFilter:"blur(4px)",
            zIndex:2,
          }}>✕</button>
          <div style={{
            position:"absolute", bottom:12, left:12,
            background:"rgba(13,196,181,0.92)", borderRadius:99,
            padding:"4px 12px", fontSize:11, fontWeight:700, color:"#fff",
          }}>✅ Bewilligt</div>
        </div>

        {/* Inhalt */}
        <div style={{ padding:"20px 20px 28px" }}>
          <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:900, color:"#141422" }}>
            {app.project_name}
          </h2>
          <p style={{ margin:"0 0 16px", fontSize:13.5, color:"#555", lineHeight:1.6 }}>
            {app.short_desc}
          </p>

          {app.problem && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Das Problem</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.problem}</p>
            </div>
          )}
          {app.vision && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Vision & Lösung</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.vision}</p>
            </div>
          )}
          {app.why_support && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Warum fördern?</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.why_support}</p>
            </div>
          )}

          {/* Meta-Infos */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, margin:"16px 0",
            background:"rgba(13,196,181,0.07)", borderRadius:14, padding:14,
          }}>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Förderbetrag</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#0DC4B5" }}>
                € {(app.funding_goal || 0).toLocaleString("de-DE")}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Eingereicht</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#141422" }}>{fmtDate(app.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Stimmen</div>
              <div style={{ fontSize:16, fontWeight:900, color:"#0DC4B5" }}>
                {checking ? "…" : `${voteCount} 🗳`}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Status</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>✅ Bewilligt</div>
            </div>
          </div>

          {/* Zusatzmaterial */}
          {app.media_urls && app.media_urls.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>
                Zusatzmaterial ({app.media_urls.length} Datei{app.media_urls.length !== 1 ? "en" : ""})
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {app.media_urls.map((url, idx) => {
                  const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                  return isImg ? (
                    <a key={idx} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Datei ${idx+1}`}
                        style={{ width:72, height:72, objectFit:"cover", borderRadius:10,
                          border:"1px solid rgba(0,0,0,0.10)" }} />
                    </a>
                  ) : (
                    <a key={idx} href={url} target="_blank" rel="noreferrer"
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:"rgba(114,100,214,0.08)",
                        border:"1px solid rgba(114,100,214,0.20)",
                        borderRadius:10, padding:"8px 12px",
                        fontSize:12, color:"#7264D6", fontWeight:600,
                        textDecoration:"none",
                      }}>
                      📎 Datei {idx+1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Stimmen-System ── */}
          <div style={{ marginTop: 8 }}>

            {/* Stimmen-Counter */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:12,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:20 }}>🗳</span>
                <span style={{ fontSize:15, fontWeight:800, color:"#141422" }}>
                  {checking ? "…" : voteCount}
                </span>
                <span style={{ fontSize:12, color:"#888" }}>
                  {voteCount === 1 ? "Stimme" : "Stimmen"} bisher
                </span>
              </div>
              {currentUser?.id && userVotesLeft !== null && !voted && (
                <div style={{
                  fontSize:11, fontWeight:700,
                  background: userVotesLeft > 0 ? "rgba(13,196,181,0.10)" : "rgba(239,68,68,0.10)",
                  color:      userVotesLeft > 0 ? "#0DC4B5" : "#ef4444",
                  border:     `1px solid ${userVotesLeft > 0 ? "rgba(13,196,181,0.25)" : "rgba(239,68,68,0.25)"}`,
                  borderRadius:99, padding:"4px 10px",
                }}>
                  {userVotesLeft > 0 ? `${userVotesLeft} Stimme${userVotesLeft !== 1 ? "n" : ""} übrig` : "Keine Stimmen mehr"}
                </div>
              )}
            </div>

            {/* Fortschrittsbalken */}
            {voteCount > 0 && (
              <div style={{
                height:4, borderRadius:99, background:"rgba(13,196,181,0.12)", marginBottom:14,
              }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  background:"linear-gradient(90deg,#0DC4B5,#22DDD0)",
                  width:`${Math.min(100, (voteCount / Math.max(voteCount, 20)) * 100)}%`,
                  transition:"width 0.5s ease",
                }} />
              </div>
            )}

            {/* Error */}
            {voteError && (
              <div style={{
                fontSize:12, color:"#ef4444", marginBottom:10,
                padding:"8px 12px", background:"rgba(239,68,68,0.08)",
                borderRadius:10, border:"1px solid rgba(239,68,68,0.20)",
              }}>
                ⚠️ {voteError}
              </div>
            )}

            {/* Vote-Button */}
            {currentUser?.id ? (
              voted ? (
                <div style={{
                  textAlign:"center", padding:"14px 16px",
                  background:"rgba(34,197,94,0.10)", borderRadius:14,
                  border:"1px solid rgba(34,197,94,0.25)",
                }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>💚</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#22c55e" }}>Deine Stimme zählt!</div>
                  <div style={{ fontSize:12, color:"#666", marginTop:2 }}>
                    Du hast für „{app.project_name}" gestimmt.
                  </div>
                </div>
              ) : userVotesLeft === 0 ? (
                <div style={{
                  textAlign:"center", padding:"14px 16px",
                  background:"rgba(239,68,68,0.06)", borderRadius:14,
                  border:"1px solid rgba(239,68,68,0.20)",
                }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#ef4444" }}>
                    🗳 Keine Stimmen mehr diesen Monat
                  </div>
                  <div style={{ fontSize:11, color:"#888", marginTop:4 }}>
                    Deine Stimmen werden am 1. des nächsten Monats erneuert.
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleVote}
                  disabled={loading || checking || userVotesLeft === 0}
                  style={{
                    width:"100%", padding:"15px",
                    background: (loading || checking)
                      ? "rgba(13,196,181,0.50)"
                      : "linear-gradient(135deg,#0DC4B5,#22DDD0)",
                    border:"none", borderRadius:99, color:"#fff",
                    fontSize:15, fontWeight:800,
                    cursor: (loading || checking) ? "not-allowed" : "pointer",
                    boxShadow:"0 4px 18px rgba(13,196,181,0.35)",
                    transition:"all 0.2s",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}
                >
                  {loading ? (
                    <><span style={{ fontSize:16 }}>⏳</span> Wird gespeichert…</>
                  ) : (
                    <><span style={{ fontSize:16 }}>🗳</span> Für dieses Projekt abstimmen</>
                  )}
                </button>
              )
            ) : (
              <div style={{
                textAlign:"center", padding:"14px",
                background:"rgba(0,0,0,0.04)", borderRadius:14,
              }}>
                <div style={{ fontSize:13, color:"#666" }}>Melde dich an, um abstimmen zu können.</div>
              </div>
            )}
          </div>
        </div>
        </div>{/* /Scroll-Wrapper */}
      </div>{/* /Sheet */}
    </>
  );
  return typeof document !== "undefined"
    ? ReactDOM.createPortal(content, document.body)
    : content;
}

// ── Karte für bewilligte Anträge ────────────────────────────────
function ApprovedAppCard({ app, onOpen }) {
  const [hov, setHov] = React.useState(false);
  const img = app.cover_url
    || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";

  return (
    <div
      onClick={() => onOpen(app)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:20, overflow:"hidden", cursor:"pointer",
        background:"#fff",
        boxShadow: hov
          ? "0 8px 40px rgba(0,0,0,0.13)"
          : "0 2px 16px rgba(0,0,0,0.07)",
        transition:"box-shadow 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        border:"1px solid rgba(13,196,181,0.12)",
      }}
    >
      {/* Bild */}
      <div style={{ height:160, overflow:"hidden", position:"relative" }}>
        <img src={img} alt={app.project_name}
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s",
            transform: hov ? "scale(1.04)" : "scale(1)" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }}
        />
        <div style={{
          position:"absolute", top:10, right:10,
          background:"rgba(13,196,181,0.90)", borderRadius:99,
          padding:"3px 10px", fontSize:10, fontWeight:700, color:"#fff",
        }}>✅ Bewilligt</div>
      </div>
      {/* Text */}
      <div style={{ padding:"14px 16px 16px" }}>
        <h3 style={{ margin:"0 0 6px", fontSize:15, fontWeight:800, color:"#141422", lineHeight:1.3 }}>
          💚 {app.project_name}
        </h3>
        <p style={{
          margin:"0 0 12px", fontSize:12.5, color:"#666", lineHeight:1.5,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {app.short_desc}
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, fontWeight:800, color:"#0DC4B5" }}>
            🔥 € {(app.funding_goal || 0).toLocaleString("de-DE")}
          </span>
          <span style={{
            fontSize:11, fontWeight:700, color:"#0DC4B5",
            background:"rgba(13,196,181,0.10)", borderRadius:99, padding:"4px 10px",
            border:"1px solid rgba(13,196,181,0.25)",
          }}>
            Mehr erfahren →
          </span>
        </div>
      </div>
    </div>
  );
}

function ImpactPageInner({ currentUser: currentUserProp }) {
  // ── Auth — immer aus AuthContext, Props als Fallback ──
  const { user, profile } = useAuth();
  // currentUser = echtes Supabase-Profil (Single Source of Truth)
  const currentUser = profile || currentUserProp || null;

  // ── States ──
  const [projects,    setProjects]    = React.useState([]);
  const [loadingProj, setLoadingProj] = React.useState(true);
  const [activeRound, setActiveRound] = React.useState(null);
  const [userVotes,   setUserVotes]   = React.useState([]);
  const [voteLoading, setVoteLoading] = React.useState(false);
  const [showPropose,   setShowPropose]   = React.useState(false);
  const [infoModal,     setInfoModal]     = React.useState(null);
  const [userImpact,    setUserImpact]    = React.useState({ eur:0, projekte:0, loading:true });

  // ── Hooks ──
  const hero       = useHeroStats();
  const pool       = usePoolBudgets();
  const transp     = useTransparenz();
  const payoutData = useLastPayout();
  const finanziert = useWeitereProjects();
  const activities = useImpactActivities();
  const activeIds     = projects.map(p => p.id);
  const weitereHP     = useWeitereHerzensprojekte(activeIds);
  const approvedApps  = useApprovedApplications();
  const [detailApp, setDetailApp] = React.useState(null);

  // ── Projekte laden — aus impact_applications (approved) ──
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // Lade approved Projekte aus impact_applications
        const { data, error } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,status,created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);
        if (dead) return;
        if (error) throw error;

        // Vote-Counts für diesen Monat
        const poolMonth = new Date().toISOString().slice(0, 7);
        const appIds = (data || []).map(a => a.id);
        let voteMap = {};
        if (appIds.length > 0) {
          const { data: voteData } = await supabase
            .from("impact_votes")
            .select("project_id")
            .in("project_id", appIds)
            .eq("pool_month", poolMonth);
          (voteData || []).forEach(v => {
            voteMap[v.project_id] = (voteMap[v.project_id] || 0) + 1;
          });
        }

        // Normalisiere auf VotingCard-Format
        const rows = (data || []).map(app => ({
          id:          app.id,
          name:        app.project_name,
          category:    app.short_desc?.slice(0, 28) || "Herzensprojekt",
          description: app.short_desc,
          icon:        "💚",
          color:       "#0DC4B5",
          votes:       voteMap[app.id] || 0,
          goal_eur:    app.funding_goal || 2000,
          status:      app.status,
          img:         app.cover_url || (app.media_urls && app.media_urls[0]) || null,
        })).sort((a, b) => b.votes - a.votes);

        if (!dead) setProjects(rows);
      } catch (e) {
        console.warn("[PROJECTS]", e?.message);
        if (!dead) setProjects([]);
      } finally {
        if (!dead) setLoadingProj(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  // ── ActiveRound + UserVotes (live aus impact_votes) ──
  React.useEffect(() => {
    if (!currentUser?.id) return;
    let dead = false;
    const month = new Date().toISOString().slice(0,7);
    (async () => {
      try {
        const { data:round } = await ImpactService.getCurrentRound();
        if (dead) return;
        if (round?.id) setActiveRound(round);
        // Single Source of Truth: voter_id + pool_month
        const { data: votes } = await supabase
          .from("impact_votes")
          .select("id,project_id,pool_month,weight,created_at")
          .eq("voter_id", currentUser.id)
          .eq("pool_month", month);
        if (!dead) setUserVotes(safeArr(votes));
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, [currentUser?.id]);

  // ── Realtime: impact_votes → Stimmen sofort aktualisieren ──
  React.useEffect(() => {
    if (!currentUser?.id) return;
    const month = new Date().toISOString().slice(0,7);
    const sub = supabase.channel("votes_rt_main")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" },
        (payload) => {
          const v = payload.new;
          if (!v) return;
          // Eigene Stimme → userVotes aktualisieren
          if (v.voter_id === currentUser.id && v.pool_month === month) {
            setUserVotes(prev => [...prev, v]);
          }
          // Projektstimmen in Echtzeit hochzählen
          setProjects(prev => prev.map(p =>
            p.id === v.project_id ? { ...p, votes: (p.votes || 0) + 1 } : p
          ));
        })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [currentUser?.id]);

  // ── Persönliche Wirkung des Nutzers ──
  React.useEffect(() => {
    if (!currentUser?.id) { setUserImpact(p => ({ ...p, loading:false })); return; }
    let dead = false;
    (async () => {
      try {
        const [payRes, voteRes] = await Promise.allSettled([
          supabase.from("hui_payments")
            .select("impact_eur").eq("user_id", currentUser.id).eq("payment_status","paid"),
          supabase.from("impact_votes")
            .select("id,project_id").eq("voter_id", currentUser.id),
        ]);
        if (dead) return;
        const pays  = payRes.status  === "fulfilled" ? (payRes.value.data  || []) : [];
        const votes = voteRes.status === "fulfilled" ? (voteRes.value.data || []) : [];
        const eur = pays.reduce((s, p) => s + (Number(p.impact_eur) || 0), 0);
        const uniqueProj = [...new Set(votes.map(v => v.project_id))].length;
        setUserImpact({ eur, projekte:uniqueProj, loading:false });
      } catch { if (!dead) setUserImpact(p => ({ ...p, loading:false })); }
    })();
    return () => { dead = true; };
  }, [currentUser?.id]);

  // ── Vote ──
  const castVote = async (projectId) => {
    if (!currentUser?.id || voteLoading) return;
    if (userVotes.some(v => v.project_id === projectId)) return;
    const maxV = isProfileTalent(currentUser) ? 2 : 1;
    const usedV = userVotes.reduce((s,v) => s + safeNum(v.weight || 1), 0);
    if (usedV >= maxV) return;

    setUserVotes(prev => [...prev, { project_id:projectId, weight:1 }]);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, votes:(p.votes||0)+1 } : p));

    setVoteLoading(true);
    try {
      // Single Source of Truth: voter_id + pool_month (kein round_id)
      const { error } = await ImpactService.castVote(currentUser.id, projectId, null, maxV);
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

  // ── Derived — Stimmen basieren auf echtem Profil-Status ──
  // isProfileTalent = Single Source of Truth (profileUtils.js)
  const isMem    = isProfileTalent(currentUser);
  const maxVotes = isMem ? 2 : 1;
  const usedVotes   = userVotes.reduce((s,v) => s + safeNum(v.weight || 1), 0);
  const remainVotes = Math.max(0, maxVotes - usedVotes);
  const totalVotes  = projects.reduce((s,p) => s + safeNum(p.votes), 0);
  const monthlyTop3 = useMonthlyVoteRanking(approvedApps.apps);
  const daysLeft    = activeRound?.voting_ends_at
    ? Math.max(0, Math.ceil((new Date(activeRound.voting_ends_at) - Date.now()) / 86400000))
    : null;


  return (
    <div data-impact-page style={{ width:"100%", background:T.page,
      fontFamily:T.ff,
      overflowX:"hidden" }}>
      <style>{`
        @keyframes ipFade    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes ipFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ipFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ipPulse   { 0%,100%{opacity:1} 50%{opacity:0.38} }
        @keyframes ipSlideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes ipModalIn  { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ipSlideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes ipFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes ipBreath  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .ip-p { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
        .ip-p:active { opacity:0.78; -webkit-transform:scale(0.972) !important; transform:scale(0.972) !important; transition:all 0.11s !important; }
        /* iOS Safari: overflow:hidden + border-radius fix */
        [data-impact-page] * { -webkit-backface-visibility:hidden; }
        [data-impact-page] img { -webkit-transform:translateZ(0); transform:translateZ(0); }
        /* iOS: smooth scrolling */
        [data-impact-page] { -webkit-overflow-scrolling:touch; }
        /* Fix: animations auf iOS */
        @-webkit-keyframes ipFade { from{opacity:0;-webkit-transform:translateY(14px)} to{opacity:1;-webkit-transform:none} }
        @-webkit-keyframes ipSlideUp { from{-webkit-transform:translateY(100%)} to{-webkit-transform:translateY(0)} }
      `}</style>

      {/* ══ 1 ── GROSSER EMOTIONALER HERO ════════════════════════ */}
      <BigHero stats={hero} pool={pool} />

      {/* ══ 2 ── POOL-KARTE mit Budget-Chips ════════════════════ */}
      <PoolCard pool={pool} stats={hero} userImpact={userImpact} />

      {/* ══ 3 ── AKTUELLE ABSTIMMUNG ═══════════════════════════ */}
      <VotingSection
        projects={
          projects.length > 0 ? projects
          : monthlyTop3.length > 0
            ? monthlyTop3.map(a => ({
                id: a.id, name: a.project_name,
                category: a.short_desc?.slice(0,20) || "Herzensprojekt",
                description: a.short_desc, icon: "💚", color: "#0DC4B5",
                votes: a.vote_count || 0, goal_eur: a.funding_goal || 0,
                status: "approved",
                img: a.cover_url || (a.media_urls && a.media_urls[0]) || null,
              }))
            : []
        }
        userVotes={userVotes}
        daysLeft={daysLeft}
        totalVotes={totalVotes}
        onVote={castVote}
        loading={loadingProj && approvedApps.loading}
        onInfoClick={() => setInfoModal("leeraus")}
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

      {/* ══ 4b ── IMPACT TIMELINE "Impact auf einen Blick" ═══════ */}
      <ImpactTimeline transp={transp} />

      {/* ══ 4b.5 ── BEWILLIGTE HERZENSPROJEKTE — TOP 1 ═══════════ */}
      {(approvedApps.loading || approvedApps.top1) && (
        <BewilligteTop1Section
          app={approvedApps.top1}
          loading={approvedApps.loading}
          onOpen={setDetailApp}
        />
      )}

      {/* ══ 4c ── WEITERE HERZENSPROJEKTE — Platz 2-5 dynamisch ══ */}
      <WeitereHerzensSection
        apps={approvedApps.weitere}
        loadingApps={approvedApps.loading}
        seedData={weitereHP.data}
        seedLoading={weitereHP.loading}
        onOpen={setDetailApp}
        allApps={approvedApps.apps}
      />

      {/* ══ 5 ── GEMEINSAM ERMÖGLICHT ════════════════════════════ */}
      <GemeinsamErmoegicht finanziert={finanziert} transp={transp} />

      {/* ══ 6 ── HERZENSPROJEKT EINREICHEN ═══════════════════════ */}
      <HerzensprojektEmotional onPropose={() => setShowPropose(true)} />

      {/* ══ 7 ── SO FUNKTIONIERT DER IMPACT POOL ════════════════ */}
      <MechanikErklaeung onInfo={() => setInfoModal("cycle")} />

      {/* ══ 8 ── LIVE-TICKER (wenn Aktivitäten) ════════════════ */}
      {activities.length > 0 && <LiveTicker activities={activities} />}

      {/* ══ LETZTE AUSZAHLUNG ════════════════════════════════════ */}
      {payoutData.payout && (
        <LetzteAuszahlung payout={payoutData.payout} others={payoutData.others} />
      )}

      {/* ══ DETAIL-MODAL via Portal — immer ganz oben ════════════ */}
      {detailApp && (
        <ApprovedProjectDetail
          app={detailApp}
          onClose={() => setDetailApp(null)}
          currentUser={currentUser}
          onVoted={(pid) => setDetailApp(prev => prev ? { ...prev, vote_count:(prev.vote_count||0)+1 } : prev)}
        />
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
// WIRKUNGS-CHIPS — selbsterklärend + Popover
// ════════════════════════════════════════════════════════════════
const WIRKUNGSCHIPS = [
  {
    pct:40, emoji:"💚", label:"Projekte fördern",
    color:"#0DC4B5",
    popover:"Finanziert Herzensprojekte der Gemeinschaft. Der Sieger erhält die volle Wunschsumme — die übrigen Projekte erhalten einen Anteil. Kein Projekt geht leer aus.",
    eurKey:"community",
  },
  {
    pct:30, emoji:"🚀", label:"HUI weiterentwickeln",
    color:"#F4714F",
    popover:"Ermöglicht neue Funktionen, Verbesserungen und strategische Projekte, die HUI als Plattform langfristig stärken — für alle Mitglieder.",
    eurKey:"wirkung",
  },
  {
    pct:20, emoji:"💡", label:"Neue Ideen ermöglichen",
    color:"#D4952A",
    popover:"Schafft Raum für innovative Projekte und Experimente. Ideen, die noch keinen Platz haben, bekommen hier ihre Chance.",
    eurKey:"innovation",
  },
  {
    pct:10, emoji:"🛡️", label:"Qualität sichern",
    color:"#7264D6",
    popover:"Finanziert die Prüfung, Begleitung und Qualitätssicherung aller eingereichten Projekte — damit nur echte Wirkung gefördert wird.",
    eurKey:"kuration",
  },
];

function WirkungsChips({ pool }) {
  const [activeChip, setActiveChip] = React.useState(null);

  // Klick außerhalb schließt Popover
  React.useEffect(() => {
    if (activeChip === null) return;
    const close = (e) => {
      if (!e.target.closest("[data-chip-wrap]")) setActiveChip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeChip]);

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {WIRKUNGSCHIPS.map((chip, i) => {
        const eur    = pool[chip.eurKey] || 0;
        const isOpen = activeChip === i;

        return (
          <div key={i} data-chip-wrap style={{ position:"relative" }}>
            {/* Chip */}
            <button
              onClick={() => setActiveChip(isOpen ? null : i)}
              className="ip-p"
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                background: isOpen ? `${chip.color}22` : `${chip.color}12`,
                border:`1.5px solid ${chip.color}${isOpen ? "55" : "30"}`,
                borderRadius:99, padding:"6px 11px",
                cursor:"pointer",
                transition:"all 0.16s ease",
                boxShadow: isOpen ? `0 2px 12px ${chip.color}28` : "none",
                outline:"none",
              }}
              onMouseEnter={e => {
                if (!isOpen) {
                  e.currentTarget.style.background  = `${chip.color}1E`;
                  e.currentTarget.style.boxShadow   = `0 2px 10px ${chip.color}22`;
                  e.currentTarget.style.borderColor = `${chip.color}48`;
                }
              }}
              onMouseLeave={e => {
                if (!isOpen) {
                  e.currentTarget.style.background  = `${chip.color}12`;
                  e.currentTarget.style.boxShadow   = "none";
                  e.currentTarget.style.borderColor = `${chip.color}30`;
                }
              }}
              aria-expanded={isOpen}
              aria-label={`${chip.label} – ${chip.pct}%`}
            >
              <span style={{ fontSize:14, lineHeight:1 }}>{chip.emoji}</span>
              <span style={{ fontSize:11, fontWeight:700, color:chip.color,
                lineHeight:1.2 }}>
                {chip.label}
              </span>
              <span style={{
                fontSize:10, fontWeight:900, color:chip.color,
                background:`${chip.color}18`, borderRadius:99,
                padding:"1px 6px", marginLeft:1,
              }}>{chip.pct}%</span>
              {!pool.loading && eur > 0 && (
                <span style={{ fontSize:10, fontWeight:800, color:chip.color,
                  opacity:0.78 }}>{fmtEur(eur)}</span>
              )}
            </button>

            {/* Popover */}
            {isOpen && (
              <div style={{
                position:"absolute", top:"calc(100% + 8px)", left:0,
                zIndex:200, minWidth:220, maxWidth:280,
                background:"#FFFFFF",
                border:`1.5px solid ${chip.color}30`,
                borderRadius:16,
                padding:"14px 16px",
                boxShadow:`0 8px 32px rgba(0,0,0,0.10), 0 2px 8px ${chip.color}18`,
                animation:"ipFade 0.16s ease both",
              }}>
                {/* Pfeil */}
                <div style={{
                  position:"absolute", top:-7, left:18,
                  width:12, height:12, background:"#FFFFFF",
                  border:`1.5px solid ${chip.color}30`,
                  transform:"rotate(45deg)",
                  borderBottom:"none", borderRight:"none",
                  borderRadius:"2px 0 0 0",
                }}/>
                {/* Inhalt */}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{chip.emoji}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:800, color:"#141422",
                      lineHeight:1.25 }}>{chip.label}</div>
                    <div style={{ fontSize:10, fontWeight:700,
                      color:chip.color }}>{chip.pct}% des Impact Pools</div>
                  </div>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#38384F",
                  lineHeight:1.6 }}>{chip.popover}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. POOL-KARTE (zentral, einfach, emotional)
// ════════════════════════════════════════════════════════════════
function PoolCard({ pool, stats, userImpact }) {
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
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>❤️</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.teal,
                letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Diesen Monat im Impact Pool
              </span>
            </div>
            <div style={{ fontSize:36, fontWeight:900, color:T.teal,
              letterSpacing:"-0.035em", lineHeight:1 }}>
              {pool.loading ? "—" : fmtEur(pool.pool)}
            </div>
            <div style={{ fontSize:11, color:T.ink2, marginTop:5 }}>
              Live berechnet aus HUI-Buchungen
            </div>
          </div>
          <div style={{ fontSize:38,
            filter:"drop-shadow(0 4px 14px rgba(13,196,181,0.32))",
            animation:"ipBreath 6s ease-in-out infinite",
          }}>💚</div>
        </div>

        {/* Wirkungs-Chips mit Popover */}
        <WirkungsChips pool={pool} />

        {/* Deine Wirkung — dezent, nur wenn User eingeloggt */}
        {userImpact && !userImpact.loading && (
          <div style={{
            marginTop:14, paddingTop:12,
            borderTop:"1px solid rgba(255,255,255,0.20)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13 }}>💚</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.teal }}>Deine Wirkung</span>
            </div>
            <div style={{ display:"flex", gap:18 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:900, color:T.teal, lineHeight:1 }}>
                  {userImpact.eur > 0 ? fmtEur(userImpact.eur) : "0 €"}
                </div>
                <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>eingebracht</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:900, color:T.teal, lineHeight:1 }}>
                  {userImpact.projekte}
                </div>
                <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>
                  Projekt{userImpact.projekte !== 1 ? "e" : ""} unterstützt
                </div>
              </div>
            </div>
          </div>
        )}
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
    <div style={{ marginTop:24 }}>
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
            background:"none",
            border:`1px solid ${T.teal}38`,
            borderRadius:99,
            padding:"7px 15px",
            fontSize:11, fontWeight:700, color:T.teal, cursor:"pointer",
            transition:"all 0.18s ease",
            boxShadow:`0 0 0 0 ${T.teal}00`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${T.teal}10`;
            e.currentTarget.style.boxShadow  = `0 0 12px ${T.teal}28`;
            e.currentTarget.style.border     = `1px solid ${T.teal}60`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.boxShadow  = `0 0 0 0 ${T.teal}00`;
            e.currentTarget.style.border     = `1px solid ${T.teal}38`;
          }}
          >💚 Kein Projekt geht leer aus</button>
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
    <div id={`project-${p.id}`} style={{
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
            {(p.votes||0) > 0
              ? `${p.votes} ${p.votes === 1 ? "Mensch möchte" : "Menschen möchten"} dieses Projekt ermöglichen`
              : "Sei der Erste, der unterstützt"}
          </span>
        </div>

        {/* Emotionale Wirkungsleiste — Menschen, Anteil, Restbetrag */}
        <div style={{
          display:"flex", alignItems:"stretch", gap:0,
          background:`${accent}08`, borderRadius:14,
          border:`1px solid ${accent}18`, marginBottom:14,
          overflow:"hidden",
        }}>
          {[
            {
              top: `${p.votes || 0} Menschen`,
              bot: "möchten helfen",
              accent,
            },
            {
              top: `${pct} % der Stimmen`,
              bot: "für dieses Projekt",
              accent,
            },
            {
              top: goalEur > 0 && pct > 0
                ? `Noch ${fmtEur(Math.max(0, goalEur - Math.round(pct / 100 * goalEur)))}`
                : `Ziel: ${fmtEur(goalEur)}`,
              bot: "bis Finanzierung",
              accent,
            },
          ].map((stat, si) => (
            <div key={si} style={{
              flex:1, padding:"9px 8px", textAlign:"center",
              borderRight: si < 2 ? `1px solid ${accent}15` : "none",
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:T.ink,
                lineHeight:1.25, marginBottom:2 }}>{stat.top}</div>
              <div style={{ fontSize:9, color:T.muted, lineHeight:1.3 }}>{stat.bot}</div>
            </div>
          ))}
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
    <div style={{ padding:"16px 16px 0" }}>
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
// 4b. WEITERE HERZENSPROJEKTE

// SEED_WEITERE_PROJEKTE deaktiviert — nur echte Projekte aus impact_applications
const SEED_WEITERE_PROJEKTE = [];

// ════════════════════════════════════════════════════════════════
const HP_STATUS = {
  submitted:   { icon:"📬", color:"#9CA3AF", label:"Eingegangen"   },
  pending:     { icon:"🟡", color:"#D97706", label:"In Prüfung"     },
  approved:    { icon:"🟢", color:"#16A34A", label:"Genehmigt"     },
  nominated:   { icon:"🗳️", color:"#0DC4B5", label:"Nominiert"     },
  active:      { icon:"🗳️", color:"#0DC4B5", label:"Abstimmung"    },
  in_progress: { icon:"🚀", color:"#7264D6", label:"In Umsetzung" },
  funded:      { icon:"💪", color:"#0DC4B5", label:"Finanziert"   },
  finished:    { icon:"✅",     color:"#16A34A", label:"Abgeschlossen" },
};

function HerzensKarte({ p, idx }) {
  const [imgErr, setImgErr] = React.useState(false);
  const cfg     = HP_STATUS[p.status] || HP_STATUS.pending;
  const accent  = p.color || T.teal;
  const goalEur = safeNum(p.goal_eur) || 0;
  return (
    <div style={{
      background:T.surfaceHi, borderRadius:20,
      boxShadow:S.card, border:`1px solid ${T.line}`,
      overflow:"hidden",
      animation:"ipFade 0.32s ease both",
      animationDelay:`${(idx||0)*0.05}s`,
    }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <div style={{ width:84, flexShrink:0, background:`${accent}12`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>
          {p.img_url && !imgErr
            ? <img src={p.img_url} alt={p.name} onError={() => setImgErr(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
            : (p.icon || "🌱")
          }
        </div>
        <div style={{ flex:1, padding:"11px 13px", minWidth:0 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:4,
            background:`${cfg.color}14`, border:`1px solid ${cfg.color}28`,
            borderRadius:99, padding:"2px 8px", marginBottom:5 }}>
            <span style={{ fontSize:10 }}>{cfg.icon}</span>
            <span style={{ fontSize:9, fontWeight:800, color:cfg.color,
              letterSpacing:"0.05em", textTransform:"uppercase" }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, lineHeight:1.3,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            marginBottom: p.description ? 3 : 0 }}>{p.name}</div>
          {p.description && (
            <div style={{ fontSize:11.5, color:T.ink2, lineHeight:1.5, marginBottom:5,
              display:"-webkit-box", WebkitLineClamp:1,
              WebkitBoxOrient:"vertical", overflow:"hidden" }}>
              {p.description}
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:6 }}>
            {p.category && (
              <span style={{ fontSize:9, color:T.muted, fontWeight:700,
                letterSpacing:"0.04em", textTransform:"uppercase" }}>{p.category}</span>
            )}
            {goalEur > 0 && (
              <span style={{ fontSize:10, color:accent, fontWeight:800 }}>
                Ziel: {fmtEur(goalEur)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeitereHerzensprojekte({ data, loading }) {
  const [expanded, setExpanded] = React.useState(false);
  // Wenn DB leer → Seed-Projekte als Platzhalter zeigen
  const rawList = Array.isArray(data) ? data : [];
  const list    = rawList;
  const isSeed  = !loading && rawList.length === 0;
  const visible = expanded ? list : list.slice(0, 4);
  const hasMore = list.length > 4;
  return (
    <div style={{ marginTop:24, padding:"0 16px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"baseline",
          justifyContent:"space-between", marginBottom:4 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.ink,
            letterSpacing:"-0.022em" }}>
            🌱 Weitere Herzensprojekte
          </h2>
          {!loading && list.length > 4 && !expanded && (
            <button onClick={() => setExpanded(true)} className="ip-p"
              style={{ background:"none", border:"none", padding:0, cursor:"pointer",
                fontSize:11, fontWeight:700, color:T.teal, flexShrink:0, marginLeft:8 }}>
              Alle {list.length} anzeigen →
            </button>
          )}
        </div>
        <p style={{ margin:0, fontSize:12.5, color:T.ink2, lineHeight:1.6 }}>
          {loading
            ? "Wird geladen…"
            : isSeed
              ? "Beispielprojekte — so sehen eingereichte Herzensprojekte aus."
              : `${rawList.length} Projekt${rawList.length !== 1 ? "e" : ""} — eingereicht, geprüft oder in Umsetzung.`
          }
        </p>
      </div>
      {loading ? <SkeletonCards count={3} /> : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {visible.map((p, i) => <HerzensKarte key={p.id||i} p={p} idx={i} />)}
          </div>
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="ip-p"
              style={{ width:"100%", marginTop:12, background:"none",
                border:`1px solid ${T.teal}30`, borderRadius:14, padding:"11px 0",
                fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
                transition:"all 0.18s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
              onMouseEnter={e => { e.currentTarget.style.background=`${T.teal}08`; e.currentTarget.style.borderColor=`${T.teal}50`; }}
              onMouseLeave={e => { e.currentTarget.style.background="none";        e.currentTarget.style.borderColor=`${T.teal}30`; }}
            >
              {expanded
                ? <span>▲  Weniger anzeigen</span>
                : <span>▼  Alle {list.length} Projekte anzeigen</span>
              }
            </button>
          )}
          <div style={{ marginTop:12, padding:"9px 13px",
            background:`${T.teal}07`, border:`1px solid ${T.teal}14`,
            borderRadius:13, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📨</span>
            <span style={{ fontSize:11, color:T.ink2, lineHeight:1.5 }}>
              Neue Herzensprojekte kommen jeden Monat hinzu.{" "}
              <b style={{ color:T.teal }}>Der Impact Pool lebt und wächst.</b>
            </span>
          </div>
        </>
      )}
    </div>
  );
}





// ════════════════════════════════════════════════════════════════
// EmptyImpactState — kein Dummy, kein Fallback
// Wird angezeigt wenn keine echten Projekte in Supabase existieren
// ════════════════════════════════════════════════════════════════
function EmptyImpactState({ type = "voting" }) {
  const configs = {
    voting: {
      icon: "🗳",
      title: "Noch keine Projekte in der Abstimmung",
      text: "Sobald Herzensprojekte vom HUI-Team geprüft und nominiert wurden, erscheinen sie hier.",
    },
    weitere: {
      icon: "🌱",
      title: "Noch keine weiteren Herzensprojekte",
      text: "Eingereichte Projekte erscheinen hier, sobald sie vom HUI-Team geprüft wurden.",
    },
    bewilligt: {
      icon: "💚",
      title: "Noch keine bewilligten Projekte",
      text: "Sobald ein Herzensprojekt bewilligt wird, erscheint es hier.",
    },
  };
  const cfg = configs[type] || configs.voting;
  return (
    <div style={{
      textAlign:"center", padding:"36px 24px",
      background:"rgba(13,196,181,0.04)",
      border:"1px dashed rgba(13,196,181,0.25)",
      borderRadius:20, margin:"0 16px",
    }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{cfg.icon}</div>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:8 }}>
        {cfg.title}
      </div>
      <div style={{ fontSize:13, color:T.ink2, lineHeight:1.6 }}>
        {cfg.text}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BewilligteTop1Section — Zeigt NUR das führende Projekt (Top 1)
// ════════════════════════════════════════════════════════════════
function BewilligteTop1Section({ app, loading, onOpen }) {
  if (loading) return (
    <div style={{ padding:"28px 20px 8px", maxWidth:600, margin:"0 auto" }}>
      <h2 style={{ margin:"0 0 16px", fontSize:20, fontWeight:900, color:"#141422" }}>💚 Bewilligte Herzensprojekte</h2>
      <SkeletonCards count={1} />
    </div>
  );
  if (!app) return (
    <div style={{ padding:"28px 20px 8px", maxWidth:600, margin:"0 auto" }}>
      <h2 style={{ margin:"0 0 16px", fontSize:20, fontWeight:900, color:"#141422" }}>💚 Bewilligte Herzensprojekte</h2>
      <EmptyImpactState type="bewilligt" />
    </div>
  );
  return (
    <div style={{ padding:"28px 20px 8px", maxWidth:600, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:900, color:"#141422" }}>💚 Bewilligte Herzensprojekte</h2>
        <p style={{ margin:0, fontSize:13, color:"#666" }}>Diese Projekte wurden vom HUI-Team geprüft und bewilligt — jetzt abstimmen!</p>
      </div>
      <ApprovedAppCard app={app} onOpen={onOpen} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// WeitereHerzensSection — Platz 2-5 approved + Fallback Seed
// ════════════════════════════════════════════════════════════════
function WeitereHerzensSection({ apps, loadingApps, seedData, seedLoading, onOpen }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasReal = !loadingApps && apps && apps.length > 0;
  const rawList = hasReal ? apps : [];
  const isSeed  = false;
  const visible = expanded ? rawList : rawList.slice(0, 4);
  const hasMore = rawList.length > 4;
  const isLoading = loadingApps;
  return (
    <div style={{ marginTop:24, padding:"0 16px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:4 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.ink, letterSpacing:"-0.022em" }}>🌱 Weitere Herzensprojekte</h2>
          {!isLoading && rawList.length > 4 && !expanded && (
            <button onClick={() => setExpanded(true)} className="ip-p"
              style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:11, fontWeight:700, color:T.teal, flexShrink:0, marginLeft:8 }}>
              Alle {rawList.length} anzeigen →
            </button>
          )}
        </div>
        <p style={{ margin:0, fontSize:12.5, color:T.ink2, lineHeight:1.6 }}>
          {isLoading ? "Wird geladen…" : isSeed
            ? "Beispielprojekte — so sehen eingereichte Herzensprojekte aus."
            : `${rawList.length} Projekt${rawList.length !== 1 ? "e" : ""} — sortiert nach Community-Stimmen`}
        </p>
      </div>
      {isLoading ? <SkeletonCards count={3} /> : rawList.length === 0 ? (
        <EmptyImpactState type="weitere" />
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {visible.map((p, i) =>
              hasReal
                ? <ApprovedAppCardCompact key={p.id||i} app={p} rank={i+2} onOpen={onOpen} />
                : <HerzensKarte key={p.id||i} p={p} idx={i} />
            )}
          </div>
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="ip-p"
              style={{ width:"100%", marginTop:12, background:"none",
                border:`1px solid ${T.teal}30`, borderRadius:14, padding:"11px 0",
                fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {expanded ? <span>▲ Weniger</span> : <span>▼ Alle {rawList.length} Projekte</span>}
            </button>
          )}
          <div style={{ marginTop:12, padding:"9px 13px", background:`${T.teal}07`, border:`1px solid ${T.teal}14`,
            borderRadius:13, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📨</span>
            <span style={{ fontSize:11, color:T.ink2, lineHeight:1.5 }}>
              Neue Herzensprojekte kommen jeden Monat hinzu. <b style={{ color:T.teal }}>Der Impact Pool lebt und wächst.</b>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ApprovedAppCardCompact — Kompaktkarte für "Weitere Herzensprojekte"
// ════════════════════════════════════════════════════════════════
function ApprovedAppCardCompact({ app, rank, onOpen }) {
  const img = app.cover_url || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";
  return (
    <div onClick={() => onOpen && onOpen(app)} className="ip-p"
      style={{ display:"flex", alignItems:"center", gap:12, background:"#fff",
        borderRadius:16, padding:"12px 14px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
        border:"1px solid rgba(13,196,181,0.10)", cursor:"pointer" }}>
      <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
        background:"rgba(13,196,181,0.12)", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:11, fontWeight:900, color:T.teal }}>
        {rank}
      </div>
      <div style={{ width:56, height:56, borderRadius:12, overflow:"hidden", flexShrink:0 }}>
        <img src={img} alt={app.project_name}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#141422",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          maxWidth:"100%" }}>
          💚 {app.project_name}
        </div>
        <div style={{ fontSize:11, color:"#888", marginTop:2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          maxWidth:"100%" }}>
          {app.short_desc}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#22c55e",
            background:"rgba(34,197,94,0.10)", borderRadius:99, padding:"2px 8px",
            border:"1px solid rgba(34,197,94,0.20)" }}>✅ Bewilligt</span>
          <span style={{ fontSize:11, color: app.vote_count > 0 ? T.teal : "#aaa", fontWeight:700,
            transition:"color 0.3s ease" }}>
            🗳 {app.vote_count || 0} {app.vote_count === 1 ? "Stimme" : "Stimmen"}
          </span>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.teal }}>€ {(app.funding_goal||0).toLocaleString("de-DE")}</div>
        <div style={{ fontSize:10, color:"#999" }}>Ziel</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// IMPACT TIMELINE — "Impact auf einen Blick"
// Horizontale Kette: eingereicht → Prüfung → nominiert → finanziert → in Umsetzung
// ════════════════════════════════════════════════════════════════
function ImpactTimeline({ transp }) {
  // Immer rendern — auch wenn DB leer (zeigt 0er Counts als "noch ausstehend")

  const steps = [
    {
      icon: "📬",
      count: transp.loading ? null : transp.eingereicht,
      label: "Eingereicht",
      sub: "Letzte 30 Tage",
      color: "#9CA3AF",
    },
    {
      icon: "🔍",
      count: transp.pruefung,
      label: "In Prüfung",
      sub: "Aktuell",
      color: "#D97706",
    },
    {
      icon: "🌱",
      count: transp.nominiert,
      label: "Nominiert",
      sub: "Diesen Monat",
      color: T.teal,
    },
    {
      icon: "💚",
      count: transp.finanziert_count,
      label: "Finanziert",
      sub: "Insgesamt",
      color: "#16A34A",
    },
    {
      icon: "🚀",
      count: transp.umsetzung,
      label: "In Umsetzung",
      sub: "Aktuell",
      color: "#7264D6",
    },
  ];

  return (
    <div style={{ margin:"24px 16px 0" }}>
      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <h2 style={{ margin:"0 0 3px", fontSize:20, fontWeight:900, color:T.ink,
          letterSpacing:"-0.022em" }}>Impact auf einen Blick</h2>
        <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.5 }}>
          Wie Projekte durch HUI wachsen und wirken.
        </p>
      </div>

      {/* Timeline — horizontal scroll auf mobil */}
      <div style={{
        background:T.surfaceHi, borderRadius:20,
        boxShadow:S.card, border:`1px solid ${T.line}`,
        padding:"18px 12px",
        overflowX:"auto",
        WebkitOverflowScrolling:"touch",
      }}>
        <div style={{
          display:"flex", alignItems:"center",
          gap:0, minWidth:"min-content",
        }}>
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {/* Schritt */}
              <div style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                minWidth:62, textAlign:"center", flexShrink:0,
              }}>
                {/* Icon-Kreis */}
                <div style={{
                  width:44, height:44, borderRadius:"50%",
                  background:`${step.color}14`,
                  border:`1.5px solid ${step.color}35`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:20,
                  marginBottom:8,
                  boxShadow: step.count > 0 ? `0 2px 12px ${step.color}28` : "none",
                }}>
                  {step.icon}
                </div>
                {/* Zahl */}
                <div style={{
                  fontSize:20, fontWeight:900,
                  color: step.count === null ? T.muted : step.count > 0 ? step.color : T.muted,
                  letterSpacing:"-0.03em", lineHeight:1, marginBottom:3,
                  minWidth:24, textAlign:"center",
                }}>
                  {step.count === null ? "·" : step.count}
                </div>
                {/* Label */}
                <div style={{
                  fontSize:9, fontWeight:700, color:T.ink2, lineHeight:1.35,
                }}>
                  {step.label}
                </div>
                {/* Sub */}
                <div style={{ fontSize:8, color:T.muted, marginTop:2 }}>
                  {step.sub}
                </div>
              </div>

              {/* Pfeil zwischen Schritten */}
              {i < steps.length - 1 && (
                <div style={{
                  fontSize:12, color:`${T.teal}55`, flexShrink:0,
                  padding:"0 4px", marginBottom:18,
                }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Hinweis-Zeile */}
        <div style={{
          marginTop:12, fontSize:11, color:T.muted,
          textAlign:"center", lineHeight:1.5,
        }}>
          {transp.loading
            ? "Projektdaten werden geladen…"
            : steps.every(s => s.count === 0 || s.count === null)
              ? "Der Impact Pool startet — neue Projekte erscheinen hier, sobald sie live gehen. 🌱"
              : "Der Impact Pool lebt und wächst — gemeinsam bewegen wir mehr. 💚"
          }
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
function GemeinsamErmoegicht({ finanziert, transp }) {
  return (
    <div style={{ padding:"20px 16px 0" }}>
      {/* Titel + Link */}
      <div style={{ display:"flex", alignItems:"baseline",
        justifyContent:"space-between", marginBottom:4 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em" }}>Gemeinsam ermöglicht</h2>
        {finanziert.length > 0 && (
          <span style={{ fontSize:11, color:T.teal, fontWeight:700, cursor:"pointer",
            flexShrink:0, marginLeft:8 }}>
            Alle {finanziert.length} ansehen →
          </span>
        )}
      </div>
      <p style={{ margin:"0 0 14px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
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
        <div style={{
          background:`linear-gradient(135deg,${T.teal}10,${T.teal}04)`,
          border:`1.5px solid ${T.teal}22`,
          borderRadius:20, padding:"24px 20px",
        }}>
          <div style={{ fontSize:32, marginBottom:10, textAlign:"center" }}>💚</div>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:10, textAlign:"center" }}>
            Die ersten Projekte werden bald gemeinsam finanziert.
          </div>
          {/* Beispiel-Wirkungskarten (Vorschau wie es aussehen wird) */}
          {[
            { name:"Repair Café Altona", month:"März 2026",
              lines:["340 Geräte repariert","120 Menschen geholfen","18 Ehrenamtliche aktiv"], icon:"🔧" },
            { name:"Musik verbindet", month:"Februar 2026",
              lines:["42 Kinder erhalten Unterricht","3 neue Kurse gestartet","Selbstvertrauen gestärkt"], icon:"🎵" },
          ].map((ex, ei) => (
            <div key={ei} style={{
              background:"rgba(255,255,255,0.55)", backdropFilter:"blur(6px)",
              borderRadius:14, padding:"12px 14px", marginBottom:8,
              border:`1px solid ${T.teal}15`, opacity:0.72,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{ex.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:T.muted }}>Finanziert im {ex.month} · Beispiel</div>
                </div>
              </div>
              {ex.lines.map((l, li) => (
                <div key={li} style={{ display:"flex", gap:6, fontSize:11, color:T.ink2,
                  marginBottom:3, alignItems:"center" }}>
                  <span style={{ color:T.teal, fontSize:10 }}>✔</span><span>{l}</span>
                </div>
              ))}
            </div>
          ))}
          <p style={{ fontSize:11, color:T.muted, lineHeight:1.6, margin:"10px 0 0",
            textAlign:"center" }}>
            So sehen finanzierte Wirkungsprojekte später aus.
          </p>
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
                {/* Titel + Datum */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.ink, lineHeight:1.3,
                    marginBottom:1 }}>{p.name}</div>
                  {p.distributed_at && (
                    <div style={{ fontSize:10, color:T.muted }}>
                      Finanziert {fmtMonth(p.distributed_at?.slice(0,7))}
                    </div>
                  )}
                </div>
                {/* Wirkungszeilen aus impact_report oder Fallback */}
                {Array.isArray(p.impact_report) && p.impact_report.length > 0
                  ? p.impact_report.slice(0, 3).map((line, li) => (
                    <div key={li} style={{ display:"flex", alignItems:"center", gap:5,
                      fontSize:11, color:T.ink2, lineHeight:1.45, marginBottom:2 }}>
                      <span style={{ color:T.teal, fontSize:10, flexShrink:0 }}>✔</span>
                      <span>{line}</span>
                    </div>
                  ))
                  : (
                    <div style={{ fontSize:12, fontWeight:700, color:T.teal, lineHeight:1.4 }}>
                      Gemeinsam ermöglicht
                      {p.awarded_eur > 0 && (
                        <span style={{ fontSize:10, color:T.muted, fontWeight:500,
                          marginLeft:6 }}>
                          {fmtEur(p.awarded_eur)}
                        </span>
                      )}
                    </div>
                  )
                }
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
    <div style={{ padding:"20px 16px 0" }}>
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

        <p style={{ fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 8px" }}>
          Kennst du etwas, das unsere Welt besser machen könnte?
        </p>
        <p style={{ fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:300, margin:"0 auto 24px" }}>
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

        {/* Vertrauenselemente */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center",
          gap:8, marginTop:18 }}>
          {[
            "✓ Bewerbung kostenlos",
            "✓ Dauer ~5 Minuten",
            "✓ Kein Projekt geht leer aus",
            "✓ Prüfung durch HUI-Team",
          ].map((item, i) => (
            <div key={i} style={{
              display:"inline-flex", alignItems:"center",
              background:"rgba(255,255,255,0.6)", backdropFilter:"blur(8px)",
              border:`1px solid ${T.teal}22`, borderRadius:99,
              padding:"5px 11px", fontSize:10, fontWeight:600, color:T.ink2,
            }}>{item}</div>
          ))}
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
    <div style={{ padding:"16px 16px 0" }}>
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
    <div style={{ padding:"20px 16px 0" }}>
      <div style={{ display:"flex", alignItems:"baseline",
        justifyContent:"space-between", marginBottom:14 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:T.ink,
          letterSpacing:"-0.02em" }}>So funktioniert der Impact Pool</h2>
        <button onClick={onInfo} className="ip-p" style={{
          background:"none", border:`1px solid ${T.teal}28`,
          borderRadius:99, padding:"5px 13px", fontSize:11, fontWeight:700,
          color:T.teal, cursor:"pointer", flexShrink:0,
        }}>Mehr erfahren</button>
      </div>

      <div style={{ background:T.surfaceHi, borderRadius:20, padding:"16px 14px",
        boxShadow:S.card, border:`1px solid ${T.line}` }}>
        {/* 2×3 Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {CYCLE_STEPS.map((step, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:10,
              background:`${T.teal}07`, border:`1px solid ${T.teal}18`,
              borderRadius:14, padding:"11px 13px",
            }}>
              {/* Schritt-Nummer + Icon */}
              <div style={{ flexShrink:0, position:"relative" }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.teal}22,${T.teal}08)`,
                  border:`1.5px solid ${T.teal}35`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
                }}>{step.icon}</div>
                <div style={{
                  position:"absolute", top:-4, left:-4,
                  width:16, height:16, borderRadius:"50%",
                  background:T.teal, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontSize:9, fontWeight:900, color:"white",
                  boxShadow:`0 1px 4px ${T.teal}44`,
                }}>{i+1}</div>
              </div>
              {/* Label */}
              <div style={{ fontSize:12, fontWeight:700, color:T.ink, lineHeight:1.35 }}>
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Schluss-Hinweis */}
        <div style={{ marginTop:12, padding:"8px 12px",
          background:`${T.teal}06`, borderRadius:10,
          fontSize:11, color:T.ink2, lineHeight:1.5, textAlign:"center" }}>
          Einmal im Monat. Immer gemeinsam.{" "}
          <b style={{ color:T.teal }}>Kein Projekt geht leer aus.</b>
        </div>
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
// ════════════════════════════════════════════════════════════════
// HUI INFO SHEET — wiederverwendbar, Escape + Outside-click + Slide
// ════════════════════════════════════════════════════════════════
function InfoSheet({ modal, onClose }) {
  // Escape schließt
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Body-Scroll sperren
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Sektion-Renderer für "leeraus"-Modal
  const Section = ({ icon, title, children }) => (
    <div style={{
      background:`${T.teal}06`, border:`1px solid ${T.teal}15`,
      borderRadius:16, padding:"16px 16px", marginBottom:12,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:14, fontWeight:800, color:T.ink,
          letterSpacing:"-0.015em" }}>{title}</span>
      </div>
      <div style={{ fontSize:13, color:T.ink2, lineHeight:1.7 }}>{children}</div>
    </div>
  );

  // Bullet-Liste
  const Bullets = ({ items }) => (
    <ul style={{ margin:"8px 0 0", padding:"0 0 0 4px", listStyle:"none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8,
          marginBottom:4, fontSize:13, color:T.ink2 }}>
          <span style={{ color:T.teal, fontWeight:700, flexShrink:0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  const CONTENT = {
    // ── Neues Haupt-Modal ────────────────────────────────────────
    leeraus: {
      title: "❤️ Warum geht kein Projekt leer aus?",
      subtitle: "Die Community entscheidet nur, welches Projekt zuerst verwirklicht wird. Nicht welches gewinnt und welches verliert.",
      body: (
        <>
          {/* Haupttext */}
          {[
            "Bei HUI gewinnt zwar jeden Monat ein Projekt die Abstimmung und erhält seine komplette Wunschsumme.",
            "Die übrigen Projekte gehen jedoch nicht leer aus.",
            "Der verbleibende Community-Anteil des Impact Pools wird auf alle anderen zugelassenen Projekte verteilt.",
            "Dadurch wächst jedes Projekt Monat für Monat weiter.",
            "So entsteht kein Alles-oder-Nichts-System.",
          ].map((text, i) => (
            <p key={i} style={{
              margin:"0 0 12px", fontSize:14, color:T.ink2, lineHeight:1.72,
            }}>{text}</p>
          ))}

          {/* Kernaussagen */}
          <div style={{
            background:`${T.teal}08`, border:`1px solid ${T.teal}20`,
            borderRadius:16, padding:"16px 18px", marginBottom:16,
          }}>
            {[
              { icon:"🩷", text:"Jede Stimme erzeugt Wirkung." },
              { icon:"📦", text:"Jedes Projekt erhält Unterstützung." },
              { icon:"🎯", text:"Früher oder später erreicht jedes Projekt sein Ziel." },
            ].map((item, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"9px 0",
                borderBottom: i < 2 ? `1px solid ${T.teal}14` : "none",
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:T.ink, lineHeight:1.4 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Abschluss */}
          <div style={{
            background:`linear-gradient(135deg,${T.teal}15,${T.teal}05)`,
            border:`1.5px solid ${T.teal}30`,
            borderRadius:18, padding:"18px 20px", textAlign:"center",
          }}>
            <div style={{ fontSize:24, marginBottom:8 }}>💚</div>
            <p style={{ margin:"0 0 4px", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
              Deshalb gilt bei HUI:
            </p>
            <div style={{
              fontSize:17, fontWeight:900, color:T.teal,
              letterSpacing:"-0.018em", lineHeight:1.3,
            }}>
              "Kein Projekt geht leer aus."
            </div>
          </div>
        </>
      ),
    },

    // ── Zyklus-Modal (unverändert) ───────────────────────────────
    cycle: {
      title: "So funktioniert der Impact Pool",
      subtitle: "Transparent, fair, jeden Monat neu.",
      body: (
        <>
          <p style={{ color:T.ink2, lineHeight:1.75, fontSize:14, margin:"0 0 12px" }}>
            Jede Buchung auf HUI erzeugt eine Provision.{" "}
            <b>15% davon</b> fließen direkt in den Impact Pool — automatisch, jeden Monat.
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

    // ── Vote-Modal (Fallback, bleibt erhalten) ───────────────────
    vote: {
      title: "So funktioniert die Abstimmung",
      subtitle: null,
      body: (
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
      style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"rgba(14,14,24,0.52)",
        backdropFilter:"blur(8px)",
        WebkitBackdropFilter:"blur(8px)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:"16px",
        animation:"ipFadeIn 0.18s ease both",
      }}
      onClick={onClose}
    >
      {/* Modal-Container — zentriert, max-width 640px */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"90%",
          maxWidth:640,
          background:T.surfaceHi,
          borderRadius:24,
          boxShadow:"0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
          maxHeight:"88vh",
          display:"flex",
          flexDirection:"column",
          overflow:"hidden",
          animation:"ipModalIn 0.24s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Sticky Header */}
        <div style={{
          padding:"20px 22px 16px",
          borderBottom:`1px solid ${T.line}`,
          background:T.surfaceHi,
          flexShrink:0,
          position:"relative",
        }}>
          {/* Close-X */}
          <button
            onClick={onClose}
            className="ip-p"
            aria-label="Schließen"
            style={{
              position:"absolute", top:16, right:16,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.06)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:T.muted,
              transition:"background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
          >✕</button>

          <h3 style={{
            margin:"0 40px 0 0",
            fontSize:18, fontWeight:900,
            color:T.ink, letterSpacing:"-0.022em", lineHeight:1.25,
          }}>
            {c.title}
          </h3>
          {c.subtitle && (
            <p style={{ margin:"6px 0 0", fontSize:13, color:T.ink2, lineHeight:1.6 }}>
              {c.subtitle}
            </p>
          )}
        </div>

        {/* Scrollbarer Body */}
        <div style={{
          flex:1,
          overflowY:"auto",
          padding:"20px 22px",
          WebkitOverflowScrolling:"touch",
        }}>
          {c.body}
        </div>

        {/* Sticky Footer Buttons */}
        <div style={{
          padding:"14px 22px 20px",
          borderTop:`1px solid ${T.line}`,
          background:T.surfaceHi,
          flexShrink:0,
          display:"flex", gap:10,
        }}>
          {/* Primär: Verstanden */}
          <button onClick={onClose} className="ip-p" style={{
            flex:1,
            background:`linear-gradient(135deg,${T.teal},${T.tealL})`,
            border:"none", borderRadius:16, padding:"13px 0",
            color:"white", fontSize:14, fontWeight:750,
            cursor:"pointer",
            boxShadow:`0 4px 16px ${T.teal}38`,
            transition:"opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Verstanden ✓</button>

          {/* Sekundär: Impact Pool entdecken (scrollt nach oben) */}
          {modal === "leeraus" && (
            <button onClick={onClose} className="ip-p" style={{
              flex:1,
              background:"none",
              border:`1.5px solid ${T.teal}38`,
              borderRadius:16, padding:"13px 0",
              color:T.teal, fontSize:14, fontWeight:700,
              cursor:"pointer",
              transition:"all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${T.teal}10`;
              e.currentTarget.style.borderColor = `${T.teal}60`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = `${T.teal}38`;
            }}
            >Impact Pool entdecken</button>
          )}
        </div>
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
