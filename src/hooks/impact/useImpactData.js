// src/hooks/impact/useImpactData.js
// Extrahiert aus ImpactPage.jsx (2026-08-24)
// Alle Impact-spezifischen Hooks und Helper-Funktionen
// ══════════════════════════════════════════════════════════════════
import React from "react";
import { supabase } from "../../lib/supabaseClient";

// ── Helpers ──────────────────────────────────────────────────
export const safeArr = (v) => Array.isArray(v) ? v : [];
export const safeNum = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
export const fmtEur = (n) => {
  const s = Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return s + " €";
};
export function relTime(ts) {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  if (diff < 2592000) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return d.toLocaleDateString("de-DE");
}
export function fmtMonth(iso) {
  if (!iso) return "";
  const [y, m] = String(iso).split("-");
  const months = ["", "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"];
  return `${months[Number(m) || 0]} ${y}`;
}

// ── Hooks ────────────────────────────────────────────────────
export function useHeroStats() {
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
            .maybeSingle(),
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

export function usePoolBudgets() {
  const [s, setS] = React.useState({ pool:0, loading:true });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const month = new Date().toISOString().slice(0,7);
        // SSOT: stripe_impact_pool — Summe des laufenden Monats
        const { data, error } = await supabase
          .from("stripe_impact_pool")
          .select("impact_pool_eur")
          .eq("month", month);
        if (dead) return;
        const pool = (data || []).reduce((s, r) => s + safeNum(r.impact_pool_eur), 0);
        setS({ pool, loading:false });
      } catch (e) {
        console.warn("[POOL BUDGETS]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    })();
    return () => { dead = true; };
  }, []);
  return s;
}

export function useTransparenz() {
  const [s, setS] = React.useState({
    projekte:0, eur:0, stimmen:0, menschen:0, loading:true,
    // Status-Counts für "Impact auf einen Blick" Timeline — SSOT: impact_applications
    eingereicht:0, pruefung:0, nominiert:0, finanziert_count:0, umsetzung:0,
  });
  React.useEffect(() => {
    let dead = false;
    const fetch = async () => {
      try {
        const now30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        // FIX (2026-08-15, Migration 119): impact_votes hat seit der
        // Security-Hardening (Migration 104, 2026-08-12) eine RLS-Policy,
        // die SELECTs auf "eigene Stimmen" beschraenkt (voter_id=auth.uid()).
        // Eine direkte Zaehlung ueber alle Stimmen liefert seitdem nur noch
        // die Stimmen DES GERADE EINGELOGGTEN NUTZERS -- die globale Zahl
        // variierte je nach Betrachter. Fix: aggregierte RPC (SECURITY
        // DEFINER, gibt NUR total_votes/unique_voters zurueck, keine
        // Voter-Identitaet) statt direktem SELECT auf impact_votes.
        const [appRes, vRes] = await Promise.allSettled([
          // SSOT: impact_applications mit submitted_at für korrekte "Eingereicht"-Zählung
          supabase.from("impact_applications")
            .select("id,status,is_completed,funding_goal,current_amount_eur,created_at,submitted_at"),
          supabase.rpc("rpc_get_global_vote_stats"),
        ]);
        if (dead) return;
        const apps  = appRes.status === "fulfilled" ? (appRes.value.data || []) : [];
        const vStats = vRes.status === "fulfilled" ? (vRes.value.data?.[0] || {}) : {};
        const vdata = { count: Number(vStats.total_votes) || 0 };
        const unique = Number(vStats.unique_voters) || 0;

        // Finanziert = is_completed=true (via SADB gesetzt oder Trigger)
        const funded = apps.filter(p => p.is_completed === true);

        // In Umsetzung = alle finanzierten Projekte (is_completed=true)
        // Logik: Finanziert → startet Umsetzung (+1 pro finanziertem Projekt)
        const umsetzung = funded.length;

        // ROOT-CAUSE-FIX (2026-08-11): "in Projekte geflossen" zeigte hart-
        // codiert €0. Michael: Summe ALLER Gelder die in Projekte geflossen
        // sind — auch die noch NICHT abgeschlossenen (laufende Förderungen).
        // SSOT: current_amount_eur pro approved-Projekt (Status approved
        // deckt sowohl aktive/nominierte als auch fertig finanzierte ab).
        const eurTotal = apps
          .filter(p => p.status === "approved")
          .reduce((sum, p) => sum + (Number(p.current_amount_eur) || 0), 0);

        if (!dead) setS({
          projekte:         funded.length,
          eur:              eurTotal,
          stimmen:          vdata.count || 0,
          menschen:         unique,
          // Timeline-Counts — SSOT = impact_applications, identisch mit SADB
          // "Eingereicht": submitted_at gesetzt in letzten 30 Tagen (unabhängig vom Status)
          eingereicht:      apps.filter(p => p.submitted_at && p.submitted_at >= now30).length,
          // "In Prüfung": status=pending (warten auf SADB-Entscheidung)
          pruefung:         apps.filter(p => p.status === "pending").length,
          // "Nominiert": status=approved AND NOT is_completed (aktiv im Pool)
          nominiert:        apps.filter(p => p.status === "approved" && !p.is_completed).length,
          // "Finanziert": is_completed=true — Realtime live sobald SADB markiert
          finanziert_count: funded.length,
          // "In Umsetzung": = Finanziert-Count (jedes finanzierte Projekt = in Umsetzung)
          umsetzung,
          loading: false,
        });
      } catch (e) {
        console.warn("[TRANSP]", e?.message);
        if (!dead) setS(d => ({ ...d, loading:false }));
      }
    };
    fetch();
    // Realtime: bei Status-Änderung in impact_applications → sofort neu laden
    const ch = supabase.channel("hui_impact_transp_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "impact_applications" }, () => { if (!dead) fetch(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" },   () => { if (!dead) fetch(); })
      .subscribe();
    return () => { dead = true; supabase.removeChannel(ch); };
  }, []);
  return s;
}

export function useLastPayout() {
  const [s, setS] = React.useState({ payout:null, others:[], loading:true });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data:round } = await supabase
          .from("impact_rounds")
          .select("id,month,pool_eur,status")
          .eq("status","distributed")
          .order("month", { ascending:false })
          .limit(1)
          .maybeSingle();
        if (dead || !round) { if (!dead) setS(d => ({...d, loading:false})); return; }
        const projIds = []; // winner_project_id existiert nicht in impact_rounds
        const { data:winnerProjs } = projIds.length
          ? await supabase.from("impact_projects")
              .select("id,name,icon,color,awarded_eur")
              .in("id", projIds)
          : { data:[] };
        const { data:others } = await supabase
          .from("impact_projects")
          .select("id,name,icon,awarded_eur")
          .gt("awarded_eur", 0)
          .neq("id", "none")
          .order("awarded_eur", { ascending:false })
          .limit(5);
        if (dead) return;
        const wp = null; // winner_project_id existiert nicht in impact_rounds
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

export function useWeitereProjects() {
  const [projects, setProjects] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        // ROOT-CAUSE-FIX (2026-08-10): Diese Karte laß bisher aus der Legacy-
        // Tabelle "impact_projects" (immer leer -> zeigte permanent die
        // "Beispiel"-Platzhalter, auch wenn bereits echte Projekte fertig
        // finanziert waren). SSOT fuer abgeschlossene Projekte ist
        // impact_applications mit is_completed=true (identisch zur
        // Transparenz-Statistik "Projekte finanziert").
        const { data } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,current_amount_eur,completed_at,created_at")
          .eq("is_completed", true)
          .order("completed_at", { ascending:false })
          .limit(8);
        if (!dead) {
          setProjects((data || []).map(a => ({
            id:            a.id,
            name:          a.project_name,
            icon:          "💚",
            color:         "#0DC4B5",
            img_url:       a.cover_url || (a.media_urls && a.media_urls[0]) || null,
            awarded_eur:   a.funding_goal || a.current_amount_eur || 0,
            impact_report: null, // impact_applications hat kein separates Report-Feld -- Fallback-Text greift
            month:         a.completed_at || a.created_at || null,
            _raw:          a,
          })));
        }
      } catch { /* silent */ }
    };
    load();
    // Realtime: sobald ein Projekt fertig finanziert wird, sofort nachladen
    const ch = supabase.channel("hui_impact_weitere_live")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"impact_applications" }, load)
      .subscribe();
    return () => { dead = true; supabase.removeChannel(ch); };
  }, []);
  return projects;
}

// ──────────────────────────────────────────────────────────────
// IMPACT-POOL LIVE-TICKER (2026-08-22): Zeigt die letzten 5 Verteilungen
// aus dem Impact-Pool an — für vollständige Transparenz "wohin fließt
// mein Geld". Quelle: impact_distributions (öffentlich lesbar, RLS
// USING(true)), anonymisiert: kein Nutzername, nur Betrag + Projekt.
// ──────────────────────────────────────────────────────────────
export function usePoolDistributionsTicker() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const { data: rows } = await supabase
          .from("impact_distributions")
          .select("id,amount_eur,distributed_at,project_id")
          .order("distributed_at", { ascending:false })
          .limit(5);
        if (dead) return;
        if (!rows?.length) { setItems([]); setLoading(false); return; }

        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const projIds = [...new Set(rows.map(r => r.project_id).filter(id => UUID_RE.test(String(id))))];
        let nameById = {};
        if (projIds.length) {
          const { data: apps } = await supabase
            .from("impact_applications")
            .select("id,project_name")
            .in("id", projIds);
          nameById = Object.fromEntries((apps || []).map(a => [a.id, a.project_name]));
        }
        if (dead) return;

        setItems(rows.map(r => ({
          id: r.id,
          amount: Number(r.amount_eur || 0),
          proj: r.project_id ? nameById[r.project_id] : null,
          ts: r.distributed_at,
          ago: relTime(r.distributed_at),
        })));
        setLoading(false);
      } catch { if (!dead) setLoading(false); }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => { dead = true; clearInterval(iv); };
  }, []);
  return { items, loading };
}

// ──────────────────────────────────────────────────────────────
// IMPACT-VORMONATE (2026-08-22): Vollständiges monatliches Archiv der
// Impact-Pool-Verteilungen — für die "Impact Vormonate"-Übersicht im
// PoolCard-Button. Aggregiert je Monat: Gesamtbetrag, die (bis zu 3)
// ausgewählten Projekte mit Betrag + Stimmenanzahl + Rang.
// Quellen: impact_distributions (öffentlich, RLS USING(true)),
// impact_monthly_projects (öffentlich, RLS USING(true), historische
// Zeilen bleiben mit is_active=false erhalten), impact_applications
// (Projektnamen), rpc_get_vote_counts (aggregierte Stimmen, kein Voter-
// Bezug). Lazy geladen — erst wenn das Modal tatsächlich geöffnet wird.
// ──────────────────────────────────────────────────────────────
export function useImpactMonthlyHistory(enabled) {
  const [months, setMonths] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || loaded) return;
    let dead = false;
    (async () => {
      try {
        // 1. Alle jemals verteilten Beträge (öffentlich, anonymisiert)
        const { data: distRows } = await supabase
          .from("impact_distributions")
          .select("project_id,amount_eur,distributed_at")
          .order("distributed_at", { ascending: false })
          .limit(1000);

        // 2. Alle monatlichen Projekt-Auswahlen (auch vergangene, is_active egal)
        const { data: monthlyRows } = await supabase
          .from("impact_monthly_projects")
          .select("project_id,pool_month,position")
          .order("pool_month", { ascending: false });

        if (dead) return;

        // ── Beträge pro Monat + Projekt summieren ──
        const byMonth = {}; // { "2026-08": { total, projects: { pid: eur } } }
        for (const r of (distRows || [])) {
          const m = String(r.distributed_at || "").slice(0, 7);
          if (!m) continue;
          if (!byMonth[m]) byMonth[m] = { total: 0, projects: {} };
          const eur = Number(r.amount_eur) || 0;
          byMonth[m].total += eur;
          if (r.project_id) {
            byMonth[m].projects[r.project_id] = (byMonth[m].projects[r.project_id] || 0) + eur;
          }
        }

        // ── Monats-Auswahl (Rang/Position) einmischen ──
        const posByMonth = {}; // { "2026-08": { pid: position } }
        for (const r of (monthlyRows || [])) {
          if (!r.pool_month) continue;
          if (!posByMonth[r.pool_month]) posByMonth[r.pool_month] = {};
          posByMonth[r.pool_month][r.project_id] = r.position;
          // Projekt auch dann in byMonth aufnehmen, wenn (noch) kein Betrag
          // verteilt wurde (z.B. laufender Monat) — Rang bleibt sichtbar.
          if (!byMonth[r.pool_month]) byMonth[r.pool_month] = { total: 0, projects: {} };
          if (!(r.project_id in byMonth[r.pool_month].projects)) {
            byMonth[r.pool_month].projects[r.project_id] = 0;
          }
        }

        const allMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
        if (!allMonths.length) { if (!dead) { setMonths([]); setLoading(false); setLoaded(true); } return; }

        // ── Alle beteiligten Projekt-IDs sammeln → Namen laden ──
        const allProjIds = [...new Set(
          allMonths.flatMap(m => Object.keys(byMonth[m].projects))
        )];
        let nameById = {};
        if (allProjIds.length) {
          const { data: apps } = await supabase
            .from("impact_applications")
            .select("id,project_name")
            .in("id", allProjIds);
          nameById = Object.fromEntries((apps || []).map(a => [a.id, a.project_name]));
        }

        // ── Stimmen pro Monat laden (aggregiert, kein Voter-Bezug) ──
        const votesByMonth = {}; // { "2026-08": { pid: count } }
        await Promise.all(allMonths.map(async (m) => {
          const pids = Object.keys(byMonth[m].projects);
          if (!pids.length) return;
          try {
            const { data: vc } = await supabase
              .rpc("rpc_get_vote_counts", { p_project_ids: pids, p_pool_month: m });
            votesByMonth[m] = Object.fromEntries((vc || []).map(v => [v.project_id, Number(v.vote_count) || 0]));
          } catch { votesByMonth[m] = {}; }
        }));

        if (dead) return;

        const result = allMonths.map(m => {
          const projs = Object.entries(byMonth[m].projects).map(([pid, eur]) => ({
            id: pid,
            name: nameById[pid] || "Unbenanntes Projekt",
            eur,
            votes: votesByMonth[m]?.[pid] || 0,
            position: posByMonth[m]?.[pid],
          }));
          // Sortierung: bekannte Position zuerst (0,1,2…), sonst nach Betrag
          projs.sort((a, b) => {
            if (a.position != null && b.position != null) return a.position - b.position;
            if (a.position != null) return -1;
            if (b.position != null) return 1;
            return b.eur - a.eur;
          });
          return { month: m, label: fmtMonth(m), total: byMonth[m].total, projects: projs };
        });

        if (!dead) { setMonths(result); setLoading(false); setLoaded(true); }
      } catch {
        if (!dead) { setLoading(false); setLoaded(true); }
      }
    })();
    return () => { dead = true; };
  }, [enabled, loaded]);

  return { months, loading };
}

export function useImpactActivities() {
  const [acts, setActs] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        // FIX (2026-08-15, Migration 119): impact_votes RLS beschraenkt
        // SELECT auf eigene Stimmen. useLiveActivities bekommt nur noch die
        // Stimmen des eingeloggten Nutzers. Da wir hier keine voter_id 
        // exposen wollen (Privacy), zeigen wir "Jemand" fuer alle Votes.
        // Die Query bleibt ein direkter SELECT (mit voter_id fuer RLS) aber
        // wir_resolver voter_id nicht mehr im Display — "Jemand" fuer alle.
        // Da RLS nur eigene Stimmen liefert, ist diese Aktivitaetsliste nun
        // "deine Stimmen + abgeschlossene Projekte" statt "alle Stimmen".
        // Das ist akzeptabel — globale Stimmen werden ueberall anders durch
        // die RPCs korrekt gezaehlt; diese Liste ist persoenlicher Natur.
        const [votesRes, completedRes] = await Promise.allSettled([
          supabase.from("impact_votes")
            .select("id,created_at,voter_id,project_id")
            .order("created_at", { ascending:false })
            .limit(8),
          // NEU: abgeschlossene/fertig finanzierte Projekte in die
          // Live-Aktivitäten mit aufnehmen (simple Anzeige, Michael-Wunsch
          // 2026-08-11) — SSOT: impact_applications.is_completed=true
          supabase.from("impact_applications")
            .select("id,project_name,completed_at")
            .eq("is_completed", true)
            .not("completed_at", "is", null)
            .order("completed_at", { ascending:false })
            .limit(5),
        ]);
        if (dead) return;
        const votes     = votesRes.status === "fulfilled" ? (votesRes.value.data || []) : [];
        const completed = completedRes.status === "fulfilled" ? (completedRes.value.data || []) : [];
        if (!votes.length && !completed.length) return;

        const pIds = [...new Set(votes.map(v => v.project_id).filter(Boolean))];
        const [pRes] = await Promise.allSettled([
          // ROOT-CAUSE-FIX (2026-08-11): SSOT = impact_applications
          pIds.length ? supabase.from("impact_applications").select("id,project_name").in("id", pIds)
                      : Promise.resolve({ data:[] }),
        ]);
        if (dead) return;
        const pMap = Object.fromEntries((pRes.value?.data || []).map(p => [p.id, p]));

        const voteActs = votes.map(v => ({
          id:     `vote_${v.id}`,
          type:   "vote",
          user_id: null,
          user:   "Jemand",
          avatar: null,
          proj:   pMap[v.project_id]?.project_name || "ein Projekt",
          ts:     v.created_at,
          ago:    relTime(v.created_at),
        }));

        const completedActs = completed.map(c => ({
          id:   `completed_${c.id}`,
          type: "completed",
          proj: c.project_name || "Ein Projekt",
          ts:   c.completed_at,
          ago:  relTime(c.completed_at),
        }));

        // Zusammenführen + nach Zeit sortieren (neueste zuerst)
        const merged = [...voteActs, ...completedActs]
          .sort((a, b) => new Date(b.ts) - new Date(a.ts))
          .slice(0, 8);

        setActs(merged);
      } catch { /* silent */ }
    };
    load();
    const iv = setInterval(load, 30_000);
    // Realtime: sofort nachladen, sobald ein Projekt fertig finanziert wird
    const ch = supabase.channel("hui_impact_activities_live")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"impact_applications" }, load)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"impact_votes" }, load)
      .subscribe();
    return () => { dead = true; clearInterval(iv); supabase.removeChannel(ch); };
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
        <div style={{ marginBottom:12, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIImpactIcon size={36}/></div>
        <div style={{ fontSize:16, fontWeight: 600, color:T.ink, marginBottom:8 }}>
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
// HOOK: useMonthlyProjects — Admin-ausgewählte 3 Projekte pro Monat
// Versucht rpc_get_monthly_projects; Fallback auf useAllApprovedByVotes
// ════════════════════════════════════════════════════════════════
export function useMonthlyProjects() {
  const [monthlyProjects, setMonthlyProjects] = React.useState([]);
  const [monthlyLoading, setMonthlyLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const poolMonth = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase.rpc("rpc_get_monthly_projects", { p_pool_month: poolMonth });
      if (error || !data?.length) {
        // Fallback: keine admin-Auswahl → bestehende Top-3-Logik greift
        return [];
      }
      return data.map(app => ({
        id:                 app.project_id,
        name:               app.project_name,
        category:           app.short_desc?.slice(0, 28) || "Herzensprojekt",
        description:        app.short_desc,
        icon:               "💚",
        color:              "#0DC4B5",
        votes:              Number(app.votes) || 0,
        vote_count:         Number(app.votes) || 0,
        awarded_eur:        app.funding_goal || 2000,
        current_amount_eur: app.current_amount_eur || 0,
        status:             app.status,
        is_completed:       app.is_completed || false,
        img:                app.cover_url || (app.media_urls && app.media_urls[0]) || null,
        img_url:            app.cover_url || (app.media_urls && app.media_urls[0]) || null,
        created_at:         app.created_at,
        _monthlySelected:   true,
      })).sort((a, b) =>
        b.votes - a.votes ||
        new Date(a.created_at) - new Date(b.created_at)
      );
    } catch(e) { console.warn("[MONTHLY PROJECTS]", e?.message); return []; }
  }, []);

  React.useEffect(() => {
    let dead = false;
    load().then(rows => { if (!dead) { setMonthlyProjects(rows); setMonthlyLoading(false); } });
    const refreshHandler = () => { load().then(rows => { if (!dead) setMonthlyProjects(rows); }); };
    window.addEventListener("feed-refresh", refreshHandler);
    // Realtime: bei neuen Votes sofort neu sortieren
    const topic = "imp_monthly_rt_" + Date.now();
    const sub = supabase.channel(topic)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" }, () => {
        load().then(rows => { if (!dead) setMonthlyProjects(rows); });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "impact_monthly_projects" }, () => {
        load().then(rows => { if (!dead) setMonthlyProjects(rows); });
      })
      .subscribe();
    return () => { dead = true; supabase.removeChannel(sub); window.removeEventListener("feed-refresh", refreshHandler); };
  }, [load]);

  return { monthlyProjects, monthlyLoading };
}

// ════════════════════════════════════════════════════════════════
// HOOK: useAllApprovedByVotes — Single Source of Truth
// Lädt ALLE approved Projekte + vote_count dieses Monats
// Sortierung: vote_count DESC, dann created_at ASC (ältere bevorzugt bei Gleichstand)
// Top 3 = VotingCards, Rest = Weitere Herzensprojekte
// ════════════════════════════════════════════════════════════════
export function useAllApprovedByVotes() {
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
      // FIX (2026-08-15, Migration 119): direkter SELECT auf impact_votes
      // lieferte seit Migration 104 (RLS: nur eigene Stimmen sichtbar) je
      // nach Betrachter eine andere Zahl. Fix: SECURITY-DEFINER-RPC.
      const appIds = activeRows.map(a => a.id);
      const { data: voteRows } = await supabase
        .rpc("rpc_get_vote_counts", { p_project_ids: appIds, p_pool_month: poolMonth });
      const voteMap = {};
      (voteRows || []).forEach(v => {
        voteMap[v.project_id] = Number(v.vote_count) || 0;
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
        awarded_eur:           app.funding_goal || 2000,
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
    // PULL-TO-REFRESH (2026-08-18): Bei "feed-refresh"-Event (ausgelöst durch
    // Pull-to-Refresh in Home.jsx) Daten neu laden — gleicher Mechanismus wie
    // DiscoverPage's reloadKey.
    const refreshHandler = () => { load().then(rows => { if (!dead) setAllProjects(rows); }); };
    window.addEventListener("feed-refresh", refreshHandler);
    // Realtime: bei neuen Votes sofort neu sortieren
    const topic = "imp_all_rt_" + Date.now();
    const sub = supabase.channel(topic)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" }, () => {
        load().then(rows => { if (!dead) setAllProjects(rows); });
      })
      .subscribe();
    return () => { dead = true; supabase.removeChannel(sub); window.removeEventListener("feed-refresh", refreshHandler); };
  }, [load]);

  const top3   = allProjects.slice(0, 3);
  const others = allProjects.slice(3);
  return { allProjects, top3, others, loading };
}

// Legacy-Kompatibilität: wird nicht mehr benutzt, aber falls noch referenziert
export function useWeitereHerzensprojekte(_ignored) {
  return { data: [], loading: false };
}


// ════════════════════════════════════════════════════════════════
// HOOK: useApprovedApplications — bewilligte Herzensprojekte aus impact_applications
// ════════════════════════════════════════════════════════════════
export function useApprovedApplications() {
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
      // FIX (2026-08-15, Migration 119): RPC statt direktem SELECT (RLS-Bug)
      const { data: voteRows } = await supabase
        .rpc("rpc_get_vote_counts", { p_project_ids: appIds, p_pool_month: currentPoolMonth });
      const vc = {};
      (voteRows || []).forEach(v => { vc[v.project_id] = Number(v.vote_count) || 0; });
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
export function useMonthlyVoteRanking(approvedApps) {
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

