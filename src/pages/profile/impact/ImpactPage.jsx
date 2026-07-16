// src/pages/profile/impact/ImpactPage.jsx — V5: Businesslogik + Orchestrierung
// Sprint 10 Phase 2: UI-Module ausgelagert

import { useStripeImpactPool } from "@/hooks/useStripeImpactPool";
import React from "react";
import { ProfileService } from "../../../services/db";
import { supabase } from "../../../lib/supabaseClient.js";
import { ImpactService, FeedService } from "../../../services/db.js";
import ImpactFlow from "../../../system/flows/impact/ImpactFlow.jsx";
import { useAuth } from "../../../lib/AuthContext";
import { isProfileTalent } from "../../../lib/profileUtils.js";
import { safeArr, safeNum, relTime } from "./utils.js";
import { T } from "./tokens.js";
import { ImpactErrorBoundary } from "./components/ImpactErrorBoundary.jsx";
import { BigHero } from "./sections/BigHero.jsx";
import { PoolCard } from "./sections/PoolCard.jsx";
import { VotingSection } from "./sections/VotingSection.jsx";
import { VotePersonal } from "./sections/VotePersonal.jsx";
import { ImpactTimeline } from "./sections/ImpactTimeline.jsx";
import { WeitereHerzensSection } from "./sections/WeitereHerzensSection.jsx";
import { GemeinsamErmoegicht } from "./sections/GemeinsamErmoegicht.jsx";
import { HerzensprojektEmotional } from "./sections/HerzensprojektEmotional.jsx";
import { MechanikErklaeung } from "./sections/MechanikErklaeung.jsx";
import { LiveTicker } from "./sections/LiveTicker.jsx";
import { LetzteAuszahlung } from "./sections/LetzteAuszahlung.jsx";
import { ApprovedProjectDetail } from "./dialogs/ApprovedProjectDetail.jsx";
import { InfoSheet } from "./dialogs/InfoSheet.jsx";


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
        const pool  = safeNum(round?.pool_eur) || Math.round(provSum * 0.06);  // 6% vom Bruttoumsatz (Balanced Growth)
        setS({
          pool,
          community:  Math.round(pool * 0.70),  // 70% -> Projekte
          wirkung:    Math.round(pool * 0.30),  // 30% -> Flex-Pool
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
            winnerAmount: Math.round(safeNum(round.pool_eur) * 0.70),  // 70% -> Rank 1 Projekte
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
function useAllApprovedByVotes() {
  const [allProjects, setAllProjects] = React.useState([]);
  const [loading, setLoading]         = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const poolMonth = new Date().toISOString().slice(0, 7);
      // 1. Alle approved Projekte
      const { data: rows } = await supabase
        .from("impact_applications")
        .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,current_amount_eur,status,is_completed,created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: true }) // Ältere bevorzugt bei Stimmengleichstand
        .limit(50);
      if (!rows?.length) return [];
      // Abgeschlossene Projekte herausfiltern (is_completed oder Ziel vollständig erreicht)
      const activeRows = rows.filter(a =>
        !a.is_completed &&
        safeNum(a.current_amount_eur) < safeNum(a.funding_goal)
      );

      // 2. Vote-Counts für diesen Monat für ALLE Projekte
      const appIds = activeRows.map(a => a.id);
      const { data: voteData } = await supabase
        .from("impact_votes")
        .select("project_id")
        .in("project_id", appIds)
        .eq("pool_month", poolMonth);
      const voteMap = {};
      (voteData || []).forEach(v => {
        voteMap[v.project_id] = (voteMap[v.project_id] || 0) + 1;
      });

      // 3. Normalisieren + sortieren: Votes DESC, dann created_at ASC
      return activeRows.map(app => ({
        id:                 app.id,
        name:               app.project_name,
        category:           app.short_desc?.slice(0, 28) || "Herzensprojekt",
        description:        app.short_desc,
        icon:               "💚",
        color:              "#0DC4B5",
        votes:              voteMap[app.id] || 0,
        vote_count:         voteMap[app.id] || 0,
        goal_eur:           app.funding_goal || 2000,
        current_amount_eur: app.current_amount_eur || 0,
        status:             app.status,
        is_completed:       app.is_completed || false,
        img:                app.cover_url || (app.media_urls && app.media_urls[0]) || null,
        img_url:            app.cover_url || (app.media_urls && app.media_urls[0]) || null,
        created_at:         app.created_at,
      })).sort((a, b) =>
        b.votes - a.votes ||                                    // 1. Votes DESC
        new Date(a.created_at) - new Date(b.created_at)        // 2. Ältere zuerst (Stabilität)
      );
    } catch(e) { console.warn("[ALL APPROVED VOTES]", e?.message); return []; }
  }, []);

  React.useEffect(() => {
    let dead = false;
    load().then(rows => {
      if (!dead) { setAllProjects(rows); setLoading(false); }
    });
    // Realtime: bei neuen Votes sofort neu sortieren
    const topic = "imp_all_rt_" + Date.now();
    const sub = supabase.channel(topic)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" }, () => {
        load().then(rows => { if (!dead) setAllProjects(rows); });
      })
      .subscribe();
    return () => { dead = true; supabase.removeChannel(sub); };
  }, [load]);

  const top3   = allProjects.slice(0, 3);
  const others = allProjects.slice(3);
  return { allProjects, top3, others, loading };
}

// Legacy-Kompatibilität: wird nicht mehr benutzt, aber falls noch referenziert
function useWeitereHerzensprojekte(_ignored) {
  return { data: [], loading: false };
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
        .select("id,project_name,short_desc,problem,vision,why_support,funding_goal,current_amount_eur,funding_use,cover_url,media_urls,status,is_completed,created_at,contact_name,contact_email,user_id")
        .eq("status", "approved").order("created_at", { ascending: false }).limit(50);
      const appList = (rawApps || []).filter(a =>
        !a.is_completed && safeNum(a.current_amount_eur) < safeNum(a.funding_goal)
      );
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
    let createdHere = false;
    loadApps().then(s => { if (!dead) { setApps(s); setLoading(false); } });
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    // Hinweis: Topic ist bereits durch Date.now() pro Mount eindeutig (kein
    // Kollisionsrisiko), der Schutz wird hier trotzdem konsistent mitgefuehrt.
    const topic = "imp_apps_rt_" + Date.now();
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let sub = existing;
    if (!existing) {
      sub = supabase.channel(topic)
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
      createdHere = true;
    }
    return () => { dead = true; if (createdHere) supabase.removeChannel(sub); };
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
  const rankedProjs   = useAllApprovedByVotes();          // ← SSOT für alle Rankings
  const approvedApps  = useApprovedApplications();        // für VotePersonal projMap
  const [detailApp, setDetailApp] = React.useState(null);

  // ── Projekte: werden jetzt von useAllApprovedByVotes gehandelt ──
  // Top 3 nach Stimmen → projects State (für Kompatibilität mit bestehendem Code)
  React.useEffect(() => {
    if (rankedProjs.loading) return;
    setProjects(rankedProjs.top3);
    setLoadingProj(false);
  }, [rankedProjs.top3, rankedProjs.loading]);

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
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "votes_rt_main";
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let sub = existing;
    let createdHere = false;
    if (!existing) {
      sub = supabase.channel(topic)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" },
          (payload) => {
            const v = payload.new;
            if (!v) return;
            // Eigene Stimme → userVotes aktualisieren
            if (v.voter_id === currentUser.id && v.pool_month === month) {
              setUserVotes(prev => [...prev, v]);
            }
            // Projektstimmen in Echtzeit hochzählen
            // Optimistic vote-count — rankedProjs Realtime übernimmt echte Neu-Sortierung
            setProjects(prev => prev.map(p =>
              p.id === v.project_id ? { ...p, votes: (p.votes || 0) + 1 } : p
            ));
          })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(sub); };
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
        // Optimistic Update rückgängig machen
        setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, votes:Math.max(0,(p.votes||1)-1) } : p));
        // Sichtbarer Fehler — kein stiller Fail
        const msg = error.message || "";
        if (msg.includes("Maximale Stimmen")) {
          alert("Du hast bereits alle deine Stimmen diesen Monat vergeben.");
        } else if (msg.includes("Bereits für")) {
          alert("Du hast bereits für dieses Projekt gestimmt.");
        } else {
          alert("Abstimmung fehlgeschlagen. Bitte lade die Seite neu und versuche es erneut.");
        }
      } else {
        const proj = projects.find(p => p.id === projectId);
        if (proj) FeedService.createActivity(currentUser.id, "impact_vote",
          `hat das Projekt „${proj.name}" unterstützt`, {}).catch(() => {});
      }
    } catch (e) {
      // Verbindungsfehler — UI zurücksetzen + Hinweis
      setUserVotes(prev => prev.filter(v => v.project_id !== projectId));
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, votes:Math.max(0,(p.votes||1)-1) } : p));
      alert("Verbindungsfehler. Bitte lade die Seite neu und versuche es erneut.");
    } finally { setVoteLoading(false); }
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
        onOpen={setDetailApp}
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
        projects={[...projects, ...(approvedApps.apps || []).filter(a => !projects.find(p => p.id === a.id)).map(a => ({ ...a, name: a.name || a.project_name }))]}
      />

      {/* ══ 4b ── IMPACT TIMELINE "Impact auf einen Blick" ═══════ */}
      <ImpactTimeline transp={transp} />

      {/* ══ 4c ── WEITERE HERZENSPROJEKTE — Platz 2-5 dynamisch ══ */}
      <WeitereHerzensSection
        apps={approvedApps.weitere}
        loadingApps={approvedApps.loading}
        seedData={rankedProjs.others}
        seedLoading={rankedProjs.loading}
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

export default function ImpactPage(props) {
  return (
    <ImpactErrorBoundary>
      <ImpactPageInner currentUser={props.currentUser} />
    </ImpactErrorBoundary>
  );
}
