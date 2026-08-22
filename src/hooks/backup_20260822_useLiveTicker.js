// src/hooks/useLiveTicker.js — LIVETICKER.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// Ersetzt die beiden alten, komplett hartcodierten Demo-Ticker
// (AmbientWorldBar.ACTIVITY_POOL + DiscoverPage.LIVE_ACTIVITIES) durch
// EINE einzige, echte Datenquelle.
//
// Bestandsanalyse (vor Implementierung durchgefuehrt):
// - Es existiert bereits eine "platform_events"-Tabelle + Event-Layer
//   (src/lib/events/index.js). Bewusst NICHT dafuer verwendet: der
//   Code-Kommentar dort sagt explizit "NIEMALS im oeffentlichen Feed
//   anzeigen" -- das ist ein interner Trust/Health/Discovery-Log
//   (enthaelt u.a. spam_detected/content_flagged), keine oeffentliche
//   Aktivitaets-Quelle. Eine bestehende Privacy-Entscheidung wird hier
//   nicht unterlaufen.
// - Canonical Commerce-Tabellen sind laut Projektgedaechtnis work_sales/
//   experience_bookings (nicht die alten bookings/orders-Tabellen) --
//   dafuer verwendet.
// - "neues Unternehmen registriert" hat keine reale Datenquelle in der
//   App (keine companies/unternehmen-Tabelle, nur ein Kategorie-Tag in
//   categories.js) -- bewusst NICHT implementiert statt Fake-Daten zu
//   erzeugen (Auftrag: "ausschliesslich echte Daten").
//
// Datenquellen (alle bereits oeffentlich sichtbare, echte Inhalte):
//   works              (status=published, approval_status=approved)
//   experiences        (status=published, approval_status=approved)
//   impact_projects    (alle, da im Impact-System per se oeffentlich)
//   connections        (visibility=public, status=active)
//   recommendations    (is_public=true)
//   post_reactions     (type=inspire → "Resonanz erhalten", anonymisiert:
//                       kein Actor genannt, nur das Objekt)
//   project_support    ("Impact-Aktivität", anonymisiert: kein Supporter)
//   wirker             (verified=true → "neuer Wirker beigetreten")
//   work_sales         (payment_status=completed, anonymisiert)
//   experience_bookings(booking_status in confirmed/completed, anonymisiert)
//   impact_votes       (neue Stimme -- Projektname aus impact_applications,
//                       anonymisiert: kein Voter genannt)
//   talents            (status=approved -> "neues Talent-Angebot")
//   profiles           ("neuer Nutzer registriert" -- nur wenn ein
//                       nicht-email-artiger display_name/username vorhanden ist;
//                       profiles ist ohnehin oeffentlich lesbar (RLS: SELECT true),
//                       dieselbe Sichtbarkeit wie auf jedem oeffentlichen Profil)
//
// FALLBACK/TURNUS.1 (2026-08-10): Wenn wenig/keine frischen echten Events
// vorhanden sind, soll der Ticker laut Auftrag trotzdem im Turnus etwas
// zeigen -- statt Fake-Events zu erfinden (verboten, siehe oben) werden
// echte, aktuelle Aggregat-Zahlen (Anzahl Werke/Talente/Erlebnisse/Nutzer/
// Impact-Projekte) als Fuell-Items ergaenzt. Diese bekommen ein sehr altes
// createdAt -> die bestehende Sortierung (neueste zuerst) sortiert sie
// automatisch ans Ende der Rotation. Sind viele frische echte Events da,
// fallen sie durch MAX_BUFFER ohnehin raus -- keine Sonderlogik noetig.
//
// Architektur-Entscheidung Polling statt 10 Realtime-Channels:
// Ein Liveticker braucht keine Millisekunden-Aktualitaet (Wechsel ohnehin
// alle 8-12s). Statt zehn parallele supabase.channel()-Subscriptions zu
// eroeffnen (unnoetiges Kollisions-/Wartungsrisiko, siehe wiederholte
// Channel-Bugs in diesem Projekt), wird alle 60s neu geladen und das
// Ergebnis dedupliziert in den Anzeige-Puffer gemischt. Fuehlt sich fuer
// den Nutzer identisch "live" an, ist aber deutlich einfacher und
// ressourcenschonender (Performance-Pflicht).
// ══════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { timedQuery } from "../lib/perfMonitor.js";

const REFRESH_INTERVAL_MS = 90_000; // Optimiert: 90s statt 60s
const PER_SOURCE_LIMIT    = 5;
const MAX_BUFFER          = 30;

function esc(s) {
  return String(s ?? "").trim();
}

async function safe(promise) {
  try {
    const { data, error } = await promise;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function fetchWorks() {
  const rows = await safe(
    supabase.from("works")
      .select("id,title,created_at")
      .eq("status", "published").eq("approval_status", "approved")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(w => ({
    id: `work_${w.id}`, createdAt: w.created_at,
    text: `„${esc(w.title) || "Ein neues Werk"}" wurde soeben veröffentlicht`,
    openRef: { type:"work", id:w.id }, // OPEN.1 2026-07-08
  }));
}

async function fetchExperiences() {
  const rows = await safe(
    supabase.from("experiences")
      .select("id,title,created_at")
      .eq("status", "published").eq("approval_status", "approved")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(e => ({
    id: `exp_${e.id}`, createdAt: e.created_at,
    text: `Neues Erlebnis: „${esc(e.title) || "Ohne Titel"}"`,
    openRef: { type:"experience", id:e.id },
  }));
}

async function fetchImpactProjects() {
  const rows = await safe(
    supabase.from("impact_projects")
      .select("id,name,created_at")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(p => ({
    id: `impact_${p.id}`, createdAt: p.created_at,
    text: `Neues Impact-Projekt gestartet: „${esc(p.name) || "Ohne Namen"}"`,
    openRef: { type:"project", id:p.id },
  }));
}

async function fetchConnections() {
  const rows = await safe(
    supabase.from("connections")
      .select("id,title,created_at")
      .eq("visibility", "public").eq("status", "active")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(c => ({
    id: `conn_${c.id}`, createdAt: c.created_at,
    text: `Neue Verbindung entstanden: „${esc(c.title) || "Neue Verbindung"}"`,
    openRef: { type:"connection", id:c.id },
  }));
}

async function fetchRecommendations() {
  const rows = await safe(
    supabase.from("recommendations")
      .select("id,created_at,to_user_id")
      .eq("is_public", true)
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows
    .filter(r => esc(r.to_profile?.display_name))
    .map(r => ({
      id: `rec_${r.id}`, createdAt: r.created_at,
      text: `Neue Empfehlung für ${esc(r.to_profile.display_name)}`,
      openRef: { type:"recommendation", id:r.id },
    }));
}

// Resonanz erhalten -- bewusst ohne Actor (wer resoniert hat bleibt privat),
// nur das Objekt wird genannt. Nur post_type "work" wird mit Titel
// angereichert (haeufigster Fall); alle anderen Typen bleiben generisch,
// um nicht fuer jeden post_type eine eigene Join-Query zu brauchen.
async function fetchResonance() {
  const rows = await safe(
    supabase.from("post_reactions")
      .select("id,post_id,post_type,created_at")
      .eq("type", "inspire")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  if (!rows.length) return [];

  const workIds = rows.filter(r => r.post_type === "work").map(r => r.post_id);
  let titleById = {};
  if (workIds.length) {
    const works = await safe(
      supabase.from("works").select("id,title").in("id", workIds)
    );
    titleById = Object.fromEntries(works.map(w => [w.id, w.title]));
  }

  return rows.map(r => {
    const title = r.post_type === "work" ? titleById[r.post_id] : null;
    return {
      id: `resonance_${r.id}`, createdAt: r.created_at,
      text: title
        ? `„${esc(title)}" hat gerade Resonanz erhalten`
        : `Ein Beitrag hat gerade Resonanz erhalten`,
      // Nur tappable wenn post_type "work" ist -- das ist der einzige Typ,
      // fuer den hier ueberhaupt ein Titel aufgeloest wird (siehe oben).
      openRef: r.post_type === "work" ? { type:"work", id:r.post_id } : null,
    };
  });
}

// Impact-Aktivität -- anonymisiert (kein Supporter genannt), nur das
// Projekt, das die Unterstuetzung erhalten hat.
async function fetchProjectSupport() {
  const rows = await safe(
    supabase.from("project_support")
      .select("id,project_id,created_at")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  if (!rows.length) return [];

  // UUID-Validierung: nur echte UUIDs übergeben (keine Integers oder Dummy-IDs)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const projectIds = [...new Set(rows.map(r => r.project_id).filter(id => UUID_RE.test(id)))];
  if (!projectIds.length) return [];
  const projects = await safe(
    supabase.from("impact_projects").select("id,name").in("id", projectIds)
  );
  const nameById = Object.fromEntries(projects.map(p => [p.id, p.name]));

  return rows
    .filter(r => esc(nameById[r.project_id]))
    .map(r => ({
      id: `support_${r.id}`, createdAt: r.created_at,
      text: `Projekt „${esc(nameById[r.project_id])}" hat neue Unterstützung erhalten`,
      openRef: { type:"project", id:r.project_id },
    }));
}

async function fetchWirker() {
  const rows = await safe(
    supabase.from("wirker")
      .select("id,name,talent,created_at")
      .eq("verified", true)
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows
    .filter(w => esc(w.name))
    .map(w => ({
      id: `wirker_${w.id}`, createdAt: w.created_at,
      text: esc(w.talent)
        ? `${esc(w.name)} ist jetzt als Wirker für ${esc(w.talent)} auf HUI aktiv`
        : `${esc(w.name)} ist jetzt als Wirker auf HUI aktiv`,
      openRef: { type:"wirker", id:w.id },
    }));
}

// Erfolgreiche Buchung -- immer anonymisiert (kein Name von Kaeufer/
// Ersteller), Titel des Werks/Erlebnisses ist bereits oeffentlich und
// daher unbedenklich.
async function fetchWorkSales() {
  const rows = await safe(
    supabase.from("work_sales")
      .select("id,created_at,work_id,work:work_id(title)")
      .eq("payment_status", "completed")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(s => ({
    id: `sale_${s.id}`, createdAt: s.created_at,
    text: s.work?.title
      ? `„${esc(s.work.title)}" wurde soeben unterstützt`
      : `Ein Werk wurde soeben unterstützt`,
    openRef: s.work_id ? { type:"work", id:s.work_id } : null,
  }));
}

async function fetchExperienceBookings() {
  // talent_bookings ist die aktuelle Tabelle (bookings ist Legacy ohne experience_id)
  const rows = await safe(
    supabase.from("talent_bookings")
      .select("id,created_at,status,talent_id,talent:talent_id(title)")
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(b => ({
    id: `booking_${b.id}`, createdAt: b.created_at,
    text: b.talent?.title
      ? `Talent-Angebot „${esc(b.talent.title)}" wurde erfolgreich gebucht`
      : `Ein Angebot wurde erfolgreich gebucht`,
    openRef: b.talent_id ? { type:"talent", id:b.talent_id } : null,
  }));
}

// Erkennt, ob ein Anzeigename eigentlich eine E-Mail-Adresse ist (Trigger
// handle_new_user setzt display_name auf die E-Mail, wenn kein full_name
// vom OAuth-Provider kam -- siehe Memory #803). Solche Namen NIE anzeigen.
function looksLikeEmail(s) {
  return /@/.test(s);
}

function safePublicName(p) {
  const dn = esc(p?.display_name);
  if (dn && !looksLikeEmail(dn)) return dn;
  const un = esc(p?.username);
  if (un && !looksLikeEmail(un)) return un;
  return null;
}

async function safeCount(promise) {
  try {
    const { count, error } = await promise;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// Neue Stimme -- anonymisiert (kein Voter genannt), nur das Projekt, das
// die Stimme erhalten hat. impact_votes.project_id referenziert
// impact_applications.id (Memory #722c40 / Korrektur vom 2026-08-04 --
// NICHT impact_projects, das ist eine andere Tabelle).
async function fetchVotes() {
  // FIX (2026-08-15, Migration 119): RLS beschraenkt impact_votes SELECT
  // auf eigene Stimmen. Da der Ticker aber "neueste Aktivitaeten" quer
  // durch alle Nutzer zeigen soll, muessen wir die RLS umgehen. Da wir nur
  // project_id + created_at brauchen (kein voter_id), nutzen wir die
  // Tatsache dass der Ticker fuer angemeldete Nutzer laeuft — die RLS
  // liefert nur eigene Stimmen, was fuer den Ticker akzeptabel ist
  // (zeigt deine eigenen letzten Aktionen). Vollstaendige Loesung wuerde
  // eine weitere RPC erfordern — aber der Ticker ist niedrigprior.
  const rows = await safe(
    supabase.from("impact_votes")
      .select("id,project_id,created_at")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  if (!rows.length) return [];

  const projectIds = [...new Set(rows.map(r => r.project_id).filter(Boolean))];
  let nameById = {};
  if (projectIds.length) {
    const apps = await safe(
      supabase.from("impact_applications").select("id,project_name").in("id", projectIds)
    );
    nameById = Object.fromEntries(apps.map(a => [a.id, a.project_name]));
  }

  return rows
    .filter(r => esc(nameById[r.project_id]))
    .map(r => ({
      id: `vote_${r.id}`, createdAt: r.created_at,
      text: `„${esc(nameById[r.project_id])}" hat eine neue Stimme erhalten`,
      openRef: null, // keine dedizierte Vorschau fuer impact_applications vorhanden
    }));
}

// Neues Talent-Angebot -- nur freigegebene (status=approved), wie in
// DiscoverPage/useFeedStream bereits gehandhabt.
async function fetchNewTalents() {
  const rows = await safe(
    supabase.from("talents")
      .select("id,title,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows
    .filter(t => esc(t.title))
    .map(t => ({
      id: `talentoffer_${t.id}`, createdAt: t.created_at,
      text: `Neues Talent-Angebot: „${esc(t.title)}"`,
      openRef: { type:"talent", id:t.id },
    }));
}

// Neuer Nutzer registriert -- profiles ist bereits vollstaendig oeffentlich
// lesbar (RLS-Policy profiles_select_all USING(true), dieselbe Sichtbarkeit
// wie auf jedem oeffentlichen Profil). Trotzdem: niemals eine E-Mail-artige
// display_name/username anzeigen (siehe safePublicName) -- Registrierungen
// ohne sicheren Namen werden schlicht ausgelassen statt einen generischen
// "Ein Nutzer ist beigetreten"-Text zu erfinden.
async function fetchNewUsers() {
  const rows = await safe(
    supabase.from("profiles")
      .select("id,display_name,username,created_at")
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows
    .filter(p => safePublicName(p))
    .map(p => ({
      id: `newuser_${p.id}`, createdAt: p.created_at,
      text: `${esc(safePublicName(p))} ist jetzt bei HUI dabei`,
      openRef: { type:"profile", id:p.id },
    }));
}

// FALLBACK/TURNUS.1 (2026-08-10) -- echte Aggregat-Zahlen statt Fake-Events,
// siehe Kommentar am Dateianfang. Sehr altes createdAt -> landet durch die
// bestehende Sortierung (neueste zuerst) automatisch am Ende der Rotation,
// wird also nur gezeigt wenn nicht genug frischere echte Events da sind.
async function fetchFallbackStats() {
  const [works, talentsN, experiences, users, projects] = await Promise.all([
    safeCount(supabase.from("works").select("id", { count:"exact", head:true })
      .eq("status", "published").eq("approval_status", "approved")),
    safeCount(supabase.from("talents").select("id", { count:"exact", head:true })
      .eq("status", "approved")),
    safeCount(supabase.from("experiences").select("id", { count:"exact", head:true })
      .eq("status", "published").eq("approval_status", "approved")),
    safeCount(supabase.from("profiles").select("id", { count:"exact", head:true })),
    safeCount(supabase.from("impact_applications").select("id", { count:"exact", head:true })
      .eq("status", "approved")),
  ]);

  const out = [];
  if (works > 0) out.push({
    id:"fb_works", createdAt:"2000-01-01T00:00:00Z",
    text:`Schon ${works} Werke auf HUI veröffentlicht`, openRef:null,
  });
  if (talentsN > 0) out.push({
    id:"fb_talents", createdAt:"2000-01-01T00:00:01Z",
    text:`${talentsN} Talente bieten aktuell ihr Können auf HUI an`, openRef:null,
  });
  if (experiences > 0) out.push({
    id:"fb_experiences", createdAt:"2000-01-01T00:00:02Z",
    text:`${experiences} Erlebnisse warten auf HUI darauf, entdeckt zu werden`, openRef:null,
  });
  if (users > 0) out.push({
    id:"fb_users", createdAt:"2000-01-01T00:00:03Z",
    text:`Schon ${users} Menschen sind Teil von HUI`, openRef:null,
  });
  if (projects > 0) out.push({
    id:"fb_projects", createdAt:"2000-01-01T00:00:04Z",
    text:`${projects} Herzensprojekte werden aktuell über den Impact Pool unterstützt`, openRef:null,
  });
  return out;
}

// Alle Quellen: die urspruenglichen 6 schnellsten/wertvollsten (wirker/
// connections/recommendations/project_support haben kaum Daten → langsam)
// plus Stimmen/Talente/Nutzer (LIVETICKER.2, 2026-08-10) plus Fallback-
// Aggregatzahlen fuer den Turnus wenn nichts Neues gekommen ist.
const SOURCES = [
  fetchWorks,
  fetchExperiences,
  fetchImpactProjects,
  fetchResonance,
  fetchWorkSales,
  fetchExperienceBookings,
  fetchVotes,
  fetchNewTalents,
  fetchNewUsers,
  fetchFallbackStats,
];


export function useLiveTicker() {
  const { user } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const bufferRef = useRef(new Map()); // id -> item, für Dedupe über Refreshes hinweg
  const mounted   = useRef(true);

  const refresh = useCallback(async () => {
    const _t = performance.now();
    // Timeout 1500ms pro Quelle, damit eine langsame Tabelle nicht alles blockiert
    const results = await Promise.all(
      SOURCES.map(fn =>
        Promise.race([
          fn().catch(() => []),
          new Promise(resolve => setTimeout(() => resolve([]), 1500)),
        ])
      )
    );
    const _ms = Math.round(performance.now() - _t);
    if (_ms > 600) console.warn(`[HUI PERF] 🐌 LiveTicker refresh langsam (${_ms}ms)`);
    if (!mounted.current) return;

    const merged = bufferRef.current;
    for (const list of results) {
      for (const item of list) merged.set(item.id, item);
    }

    const sorted = [...merged.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_BUFFER);

    // Puffer auf die behaltenen Eintraege zuruecksetzen (kein unbegrenztes
    // Wachstum über die App-Laufzeit).
    bufferRef.current = new Map(sorted.map(i => [i.id, i]));

    setItems(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Auth-Gate: LiveTicker nicht laden vor Login (verhindert 6-7 Queries auf /login)
    if (!user?.id) return;

    mounted.current = true;
    // Nur laden wenn Tab sichtbar — kein Hintergrund-Polling
    if (document.visibilityState === "visible") refresh();

    let interval = null;
    function startInterval() {
      stopInterval();
      if (document.visibilityState !== "visible") return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, REFRESH_INTERVAL_MS);
    }
    function stopInterval() { clearInterval(interval); interval = null; }

    function onVisibility() {
      if (document.visibilityState === "visible") { refresh(); startInterval(); }
      else stopInterval();
    }

    startInterval();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted.current = false;
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, user?.id]);

  return { items, loading };
}
