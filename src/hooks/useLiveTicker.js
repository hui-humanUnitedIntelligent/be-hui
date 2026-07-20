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
import { supabase } from "../lib/supabaseClient.js";

const REFRESH_INTERVAL_MS = 60_000;
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

  const projectIds = [...new Set(rows.map(r => r.project_id))];
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
  const rows = await safe(
    supabase.from("experience_bookings")
      .select("id,created_at,booking_status,experience_id,experience:experience_id(title)")
      .in("booking_status", ["confirmed", "completed"])
      .order("created_at", { ascending:false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(b => ({
    id: `booking_${b.id}`, createdAt: b.created_at,
    text: b.experience?.title
      ? `Erlebnis „${esc(b.experience.title)}" wurde erfolgreich gebucht`
      : `Ein Erlebnis wurde erfolgreich gebucht`,
    openRef: b.experience_id ? { type:"experience", id:b.experience_id } : null,
  }));
}

const SOURCES = [
  fetchWorks, fetchExperiences, fetchImpactProjects, fetchConnections,
  fetchRecommendations, fetchResonance, fetchProjectSupport, fetchWirker,
  fetchWorkSales, fetchExperienceBookings,
];

export function useLiveTicker() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const bufferRef = useRef(new Map()); // id -> item, für Dedupe über Refreshes hinweg
  const mounted   = useRef(true);

  const refresh = useCallback(async () => {
    const results = await Promise.all(SOURCES.map(fn => fn().catch(() => [])));
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
    mounted.current = true;
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [refresh]);

  return { items, loading };
}
