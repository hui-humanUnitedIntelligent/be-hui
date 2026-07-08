/**
 * useFeedStream — Phase 4F: Living Feed Infrastructure v2
 *
 * Kein Reload. Kein Poppen. Kein Sterben beim Tab-Wechsel.
 * Ein lebender Strom.
 *
 * Features:
 *  - Cursor-based Pagination (20 items initial, +15 bei Scroll)
 *  - Prefetch: lädt nächste Seite wenn User bei 70% angelangt
 *  - Soft Hydration: neue Items akkumuliert, Tap → sanfter Insert
 *  - Realtime: beitraege / invitations / experiences live updates
 *  - Feed Cache: Tab-Wechsel zerstört nichts (sessionStorage + in-memory)
 *  - Scroll Restore: kehrt zur letzten Position zurück
 *  - Idle Loading: requestIdleCallback für prefetch
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ProfileService, IDENTITY_CONTRACT } from '../services/db';
import { supabase }        from "../lib/supabaseClient.js";
import { useAuth }         from "../lib/AuthContext.jsx";
import { rhythmizeFeed }   from "./feedRhythmEngine.js";
import {
  normalizeMomentRow     as normalizeBeitragRow,
  normalizeExperienceRow,
  normalizeWorkRow,
  normalizeEventRow      as normalizeInvitationRow,
} from "../system/feed/unifiedNormalizer.js";

// ─── Konstanten ──────────────────────────────────────────────────────────────
const PAGE_SIZE          = 20;   // Items pro Seite
const PREFETCH_THRESHOLD = 0.70; // 70% gescrollt → prefetch
const SOFT_HYDRATE_DELAY = 800;  // ms Debounce bevor "N neue" Badge erscheint
const CACHE_KEY          = "hui_feed_cache_v5";
const CACHE_TTL_MS       = 5 * 60 * 1000; // 5 Minuten

// ─── Cache Helpers ────────────────────────────────────────────────────────────
function saveCache(items, cursor) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      items,
      cursor,
      ts: Date.now(),
    }));
  } catch (_) { /* storage full — ignore */ }
}

function loadCache() {
  // CACHE DISABLED — always fresh load
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  return null;
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
}

// ─── Scroll Position ──────────────────────────────────────────────────────────
const _scrollPos = { y: 0 };
export function saveFeedScrollPos(y) { _scrollPos.y = y; }
export function getFeedScrollPos()   { return _scrollPos.y; }

// ─── Batch-Query: eine Seite laden ───────────────────────────────────────────
// FEED.2E — Multi-Cursor: cursors = { works, exps, beitr } | null
async function fetchFeedPage(userId = null, cursors = null) {
  /**
   * Phase 4H — NO PROFILE JOINS
   * Alle Queries ohne relational join zu profiles.
   * Profile werden separat angereichert (optional, nie blockierend).
   */
  const limit = Math.ceil(PAGE_SIZE / 2); // 10 pro Quelle

  // FEED.2E — eigene Cursor pro Quelle statt eines globalen Timestamps
  const worksCursor = cursors?.works || null;
  const expsCursor  = cursors?.exps  || null;
  const beitrCursor = cursors?.beitr || null;
  // invitations: kein Cursor — immer neueste 2 aktive, nicht-abgelaufene
  const filterWorks = (q) => worksCursor ? q.lt("created_at", worksCursor) : q;
  const filterExps  = (q) => expsCursor  ? q.lt("created_at", expsCursor)  : q;
  const filterBeitr = (q) => beitrCursor ? q.lt("created_at", beitrCursor) : q;

  // ── Step 1: Plain queries — kein JOIN ──────────────────────────────────
  const [worksRes, expsRes, beitrRes, invRes] = await Promise.allSettled([
    filterWorks(
      supabase.from("works")
        .select("id,title,cover_url,media_url,category,description,caption,tags,price,for_sale,status,approval_status,user_id,creator_id,created_at")
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    filterExps(
      supabase.from("experiences")
        .select("id,title,cover_url,media_url,category,description,price,duration,format,location_text,date,time_start,time_end,is_live,booking_mode,pricing_type,experience_type,participant_limit,max_participants,mood,mood_tags,social_energy,status,approval_status,visibility,user_id,created_at")
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    filterBeitr(
      supabase.from("beitraege")
        .select("id,user_id,src,type,caption,created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    // invitations: kein rangeFilter — immer neueste 2 aktive Einladungen
    supabase.from("invitations")
      .select("id,user_id,text,title,vibe,mood,energy,location,city,time_label,starts_at,expires_at,visibility,status,max_participants,content_type,created_at")
      .eq("status", "active")
      .eq("visibility", "public")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  const works = worksRes.status === "fulfilled" ? (worksRes.value?.data || []) : [];
  const exps  = expsRes.status  === "fulfilled" ? (expsRes.value?.data  || []) : [];
  const beitr = beitrRes.status === "fulfilled" ? (beitrRes.value?.data || []) : [];
  const invs  = invRes.status   === "fulfilled" ? (invRes.value?.data   || []) : [];

  const beitrErr = beitrRes.status === "rejected"
    ? beitrRes.reason?.message
    : (beitrRes.value?.error?.message || null);
  const worksErr = worksRes.status === "rejected"
    ? worksRes.reason?.message
    : (worksRes.value?.error?.message || null);
  const expsErr = expsRes.status === "rejected"
    ? expsRes.reason?.message
    : (expsRes.value?.error?.message || null);


  if (typeof window !== "undefined") {
    window.__HUI_STREAM_DEBUG__ = {
      works: works.length, exps: exps.length,
      beitraege: beitr.length, beitrErr, worksErr, expsErr,
    };
  }

  // ── Step 2: Profile-Enrichment — optional, nie blockierend ─────────────
  // ── TRACE STEP 1: erstes Work-Item ─────────────────────────
  if (works && works.length > 0) {
    const w0 = works[0];
    if (import.meta.env.DEV) {
      console.group("🔍 STEP 1 - WORK[0]");
      if (import.meta.env.DEV) { console.log("raw row:", w0); }
      if (import.meta.env.DEV) { console.log("id:", w0.id); }
      if (import.meta.env.DEV) { console.log("user_id:", w0.user_id); }
      if (import.meta.env.DEV) { console.log("creator_id:", w0.creator_id); }
      if (import.meta.env.DEV) { console.groupEnd(); }
    }
  }

  const allRows = [...works, ...exps, ...beitr, ...invs];
  const userIds = [...new Set(allRows.map(r => r.user_id || r.creator_id).filter(Boolean))];
  // ── TRACE STEP 2: userIds ───────────────────────────────────
  if (import.meta.env.DEV) {
    console.group("🔍 STEP 2 - USER IDS");
    if (import.meta.env.DEV) { console.log("userIds:", userIds); }
    if (import.meta.env.DEV) { console.log("works[0].user_id in userIds:", works[0] ? userIds.includes(works[0].user_id) : "no works"); }
    if (import.meta.env.DEV) { console.groupEnd(); }
  }

  let profileMap = {};

  if (userIds.length > 0) {
    try {
      // ProfileService v1.0
      const { data: profileRows } = await ProfileService.getMany(userIds);
      // ── TRACE STEP 3: Supabase Profile Query Result ──────────
      if (import.meta.env.DEV) {
        console.group("🔍 STEP 3 - PROFILE QUERY");
        if (import.meta.env.DEV) { console.log("profileRows:", profileRows); }
        if (import.meta.env.DEV) { console.log("count:", profileRows?.length); }
        if (profileRows && profileRows.length > 0) {
          if (import.meta.env.DEV) { console.log("profileRows[0] fields:", Object.keys(profileRows[0])); }
          if (import.meta.env.DEV) { console.log("avatar_url:", profileRows[0].avatar_url); }
          if (import.meta.env.DEV) { console.log("display_name:", profileRows[0].display_name); }
          if (import.meta.env.DEV) { console.log("full_name:", profileRows[0].full_name); }
        }
        if (import.meta.env.DEV) { console.groupEnd(); }
      }

      if (profileRows) {
        profileRows.forEach(p => { profileMap[p.id] = p; });
      }
    } catch (_) {
      if (import.meta.env.DEV) { console.warn("[HUI_STREAM] Profile enrichment failed:", _?.message || _); }
    }

  // ── TRACE STEP 4: profileMap ──────────────────────────────
  const _w0uid = works[0] ? (works[0].user_id || works[0].creator_id) : null;
  if (import.meta.env.DEV) {
    console.group("🔍 STEP 4 - PROFILE MAP");
    if (import.meta.env.DEV) { console.log("profileMap keys:", Object.keys(profileMap)); }
    if (import.meta.env.DEV) { console.log("works[0] uid:", _w0uid); }
    if (import.meta.env.DEV) { console.log("profileMap[uid]:", _w0uid ? profileMap[_w0uid] : "no uid"); }
    if (import.meta.env.DEV) { console.groupEnd(); }
  }
  }

  // ── Step 3: Normalisieren (mit injiziertem profile aus profileMap) ──────
  let _step5Done = false; // nur erstes Work tracen
  function injectProfile(row) {
    const uid = row.user_id || row.creator_id || null;
    const p   = (uid && profileMap[uid]) ? profileMap[uid] : null;
    const result = { ...row, profile: p || { id: uid } };
    // ── TRACE STEP 5 (nur erstes Work) ────────────────────
    if (!_step5Done && row.title !== undefined) {
      _step5Done = true;
      if (import.meta.env.DEV) {
        console.group("🔍 STEP 5 - injectProfile (first work)");
        if (import.meta.env.DEV) { console.log("uid:", uid); }
        if (import.meta.env.DEV) { console.log("profileMap[uid]:", profileMap[uid]); }
        if (import.meta.env.DEV) { console.log("row.id:", row.id, "row.title:", row.title); }
        if (import.meta.env.DEV) { console.log("result.profile:", result.profile); }
        if (import.meta.env.DEV) { console.log("result.profile.avatar_url:", result.profile?.avatar_url); }
        if (import.meta.env.DEV) { console.log("result.profile.display_name:", result.profile?.display_name); }
        if (import.meta.env.DEV) { console.groupEnd(); }
      }
    }
    return result;
  }

  const normalizedBeitr = beitr.map(r => normalizeBeitragRow(injectProfile(r))).filter(Boolean);
  const normalized = [
    ...works.map(r => normalizeWorkRow(injectProfile(r))).filter(Boolean),
    ...exps.map(r => normalizeExperienceRow(injectProfile(r))).filter(Boolean),
    ...normalizedBeitr,
    ...invs.map(r => normalizeInvitationRow(injectProfile(r))).filter(Boolean),
  ];


  // FEED.13B — Upcoming Experience Relevance Ranking
  // Ersetzt FEED.10C (+4h Boost) durch zeitliche Relevanz-Verankerung.
  //
  // Regel: Experience mit Termin innerhalb von 7 Tagen erhält
  //   _sortKey = max(created_at, event_date - 48h)
  //
  // Effekte:
  //   Termin morgen (24h)  → visibilityAnchor = heute       → max(base, heute)
  //   Termin in 3 Tagen    → visibilityAnchor = übermorgen  → max(base, übermorgen)
  //   Termin in 6 Monaten  → CAP greift        → base (created_at, kein Vorteil)
  //   Vergangene Termine   → kein Vorteil      → base
  //   Works / Moments      → base (unverändert)
  //
  // Cursor, Pagination und Analytics bleiben vollständig unberührt.
  const _now                     = Date.now();
  const EVENT_VISIBILITY_WINDOW_MS = 48 * 60 * 60 * 1000;  // 48 Stunden Vorlauf
  const _WINDOW_MS                = 7  * 24 * 60 * 60 * 1000; // 7 Tage CAP (unverändert)

  normalized.forEach(item => {
    const base = item._raw?.created_at ? new Date(item._raw.created_at).getTime() : 0;
    if (item.type === "experience" && item._raw?.date) {
      const eventMs = new Date(item._raw.date).getTime();
      const delta   = eventMs - _now;
      if (delta >= 0 && delta < _WINDOW_MS) {
        // Termin in 0–7 Tagen → zeitliche Relevanz-Verankerung
        const visibilityAnchor = eventMs - EVENT_VISIBILITY_WINDOW_MS;
        item._sortKey = Math.max(base, visibilityAnchor);
      } else {
        // Vergangen oder > 7 Tage → kein Vorteil
        item._sortKey = base;
      }
    } else {
      item._sortKey = base;
    }
  });

  // Zeitsortiert (via _sortKey — created_at bleibt unberührt)
  normalized.sort((a, b) => (b._sortKey || 0) - (a._sortKey || 0));

  // FEED.2E — Cursor pro Quelle: letztes Item jeder Quelle (vor Normalisierung verfügbar)
  // works/exps/beitr existieren bereits aus Step 1 (Z.107-112)
  const nextCursors = {
    works: works.length >= limit ? (works[works.length - 1]?.created_at || null) : null,
    exps:  exps.length  >= limit ? (exps[exps.length   - 1]?.created_at || null) : null,
    beitr: beitr.length >= limit ? (beitr[beitr.length - 1]?.created_at || null) : null,
  };

  // FEED.2E — hasMore: true wenn mind. eine Quelle weitere Items hat
  const hasMore = works.length >= limit || exps.length >= limit || beitr.length >= limit;

  return { items: normalized, nextCursors, hasMore };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// ─── SEARCH-MODE FETCH — Search Experience 2.0 (2026-07-06, Lars) ───────────
// Eigenstaendige Fetch-Funktion fuer den Live-Search-Zustand des Feeds.
// BEWUSST getrennt von fetchFeedPage() gehalten (keine Cursor-Logik, kein
// Realtime, kein Prefetch) -- reduziert das Risiko, die bestehende,
// battle-getestete Pagination/Realtime-Pipeline durch Vermischung zu
// destabilisieren (Debug-Protokoll: ein gezielter, isolierter Fix).
// Wiederverwendung statt Neuerstellung: nutzt exakt dieselben Tabellen,
// Spalten-Sets und Normalizer wie fetchFeedPage() -- keine neue Datenquelle,
// keine neue Kartenart. typeFilter: null (alle Typen) | "work" | "experience".
import { getProfileCategoryLabels } from "../lib/categories.js";
// categoryFilter: optionales Objekt aus src/lib/categories.js
// ({name, keywords, ...}) -- Kategorie-Auswahl aus dem "Alle Kategorien"-
// Bottom-Sheet. Wird als ZUSAETZLICHE, AND-verknuepfte OR-Bedingung an die
// bestehende Textsuche angehaengt (zwei .or()-Aufrufe auf demselben Supabase-
// Query werden von PostgREST als UND zwischen den beiden OR-Gruppen
// ausgewertet) -- dadurch funktioniert "Kategorie + Freitext gleichzeitig"
// (z.B. Kategorie 'Musik' + Tippen von 'Konzert') genauso wie 'nur Kategorie'
// (leerer Freitext, nur categoryFilter gesetzt).
// categoryFilters: Array von Kategorie-Objekten aus src/lib/categories.js
// (Mehrfachauswahl, 2026-07-07 "Kategorie-Chips global") -- mehrere
// gleichzeitig ausgewaehlte Kategorien werden als EIN gemeinsamer OR-Block
// behandelt (Treffer in IRGENDEINER der ausgewaehlten Kategorien reicht,
// "Alle drei Kategorien werden beruecksichtigt").
function buildCategoryOrExpr(categoryFilters, cols) {
  const cats = Array.isArray(categoryFilters) ? categoryFilters.filter(Boolean) : [];
  if (cats.length === 0) return null;
  const terms = [...new Set(cats.flatMap(cat => [cat.name, ...(cat.keywords || [])]))].filter(Boolean);
  if (terms.length === 0) return null;
  return terms.flatMap(t => cols.map(c => `${c}.ilike.%${t}%`)).join(",");
}

// Umkreissuche (2026-07-06, Lars): radiusKm/geo optional. "world"/null/kein
// geo => Radius-RPCs werden NICHT aufgerufen, bestehendes Verhalten bleibt
// 1:1 erhalten. Ist ein konkreter Radius + Standort gesetzt, werden zuerst
// die nearby_*-RPCs (Migration 20260706_067) abgefragt -- die zurueckgegebenen
// ids grenzen die bestehenden works/experiences-Queries per .in() zusaetzlich
// ein (UND-Verknuepfung mit Text-/Kategorie-Filter), die Distanz wird pro
// Zeile mitgefuehrt und die Ergebnisse werden nach Distanz sortiert.
// HUI-weite Erweiterung "Home reagiert auf die globale Suche" (2026-07-06):
// fetchSearchResults() bleibt die EINZIGE Sucharchitektur im Projekt (Vorgabe
// Lars: "keine zweite Suchimplementierung"). Statt einer separaten Such-
// funktion fuer Menschen/Projekte werden Wirker (profiles) und Impact-
// Projekte (impact_projects) hier als zusaetzliche, parallele Queries
// angehaengt und im selben Rueckgabe-Objekt mitgeliefert -- Feed UND Home
// lesen aus genau derselben Quelle (useFeedStream -> isSearching-Zweig).
// Empfehlungen (Kundenstimmen) werden bewusst NICHT als eigener Ergebnis-Typ
// gesucht -- eine Empfehlung ist immer an eine Person gebunden, ein Treffer
// im Empfehlungstext waere ohne eigene Kartendarstellung wenig aussagekräftig.
// Stattdessen deckt die Wirker-Suche (Name/Talent/Ort) den relevanten Fall ab
// ("ich suche jemanden") vollstaendig ab -- keine zusaetzliche Baustelle ohne
// echten Mehrwert (Feature-Freeze-Prinzip).
async function fetchSearchResults(query, typeFilter = null, categoryFilters = null, radiusKm = null, geo = null) {
  const q = (query || "").trim();
  // Mehrfachauswahl (2026-07-07): categoryFilters ist ein Array. Defensive
  // Normalisierung, falls irgendein Aufrufer noch ein einzelnes Objekt uebergibt.
  const cats = Array.isArray(categoryFilters) ? categoryFilters.filter(Boolean) : (categoryFilters ? [categoryFilters] : []);
  const hasCategory = cats.length > 0;
  const hasRadius = !!(geo && radiusKm && radiusKm !== "world");
  // hasGeo (2026-07-07, Wirker-Angebotsradius-Ticket): unabhaengig von hasRadius,
  // weil Bedingung 1 (Suchender liegt im ANGEBOTSRADIUS DES WIRKERS) auch bei
  // "Weltweit"-Suchradius weiterhin geprueft werden muss -- nur wenn der
  // Suchende ueberhaupt einen Standort gesetzt hat, kann diese Distanz ermittelt
  // werden.
  const hasGeo = !!geo;
  if (!q && !hasCategory && !hasRadius) return { items: [], people: [], projects: [] };

  // Wirker + Projekte bei getipptem Freitext ODER aktiver Kategorie-Auswahl
  // (2026-07-07 erweitert -- Vorgabe: "Kategorie-Chips wirken gleichzeitig
  // auf alle Inhaltstypen", Ticket-Beispiel zeigt Kategorie+Radius OHNE
  // getippten Text). Reines Radius-Browsing OHNE Text/Kategorie triggert
  // weiterhin NICHT diesen Zweig -- dafuer existiert bereits eine eigene,
  // etablierte UI (DiscoverPage-Umkreissuche).
  const wantPeopleProjects = !!q || hasCategory;

  // Kategorie -> Wirker (2026-07-07): wirker_profiles.categories ist ein
  // TEXT[]-Feld (strukturierte Auswahl aus ProfilBearbeitenModal.jsx), KEIN
  // Freitext -- deshalb kein ILIKE wie bei Werken/Erlebnissen, sondern ein
  // .overlaps()-Abgleich gegen die aus dem Kategorie-Baum abgeleiteten
  // profile-Labels (getProfileCategoryLabels(), siehe categories.js).
  // Ergebnis: eine Menge erlaubter user_ids, die als .in()-Filter an die
  // eigentliche profiles-Query angehaengt wird (identisches Muster wie die
  // Radius-.in()-Filter bei Werken/Erlebnissen/Veranstaltungen).
  const wirkerCategoryPromise = (wantPeopleProjects && hasCategory)
    ? (async () => {
        const labels = [...new Set(cats.flatMap(cat => getProfileCategoryLabels(cat)))];
        if (labels.length === 0) return new Set(); // Kategorie(n) ohne profile-Label -> keine Wirker-Treffer
        const { data: wp } = await supabase.from("wirker_profiles")
          .select("user_id")
          .overlaps("categories", labels);
        return new Set((wp || []).map(r => r.user_id));
      })()
    : Promise.resolve(null); // null = keine Kategorie-Einschraenkung aktiv

  const projCatExpr = buildCategoryOrExpr(cats, ["name", "category"]);

  const peopleProjectsPromise = wantPeopleProjects
    ? (async () => {
        const wirkerCategoryIds = await wirkerCategoryPromise;
        let profilesSel = supabase.from("profiles")
          .select(IDENTITY_CONTRACT)
          .eq("has_talent_profile", true);
        if (q) profilesSel = profilesSel.or(`display_name.ilike.%${q}%,talent.ilike.%${q}%,location_label.ilike.%${q}%`);
        if (wirkerCategoryIds) profilesSel = profilesSel.in("id", [...wirkerCategoryIds]);

        let projectsSel = supabase.from("impact_projects")
          .select("id,name,category,icon,color,img_url,status,tags,awarded_eur")
          .in("status", ["approved","nominated","active","funded","finished"]);
        if (q) projectsSel = projectsSel.or(`name.ilike.%${q}%,category.ilike.%${q}%`);
        if (projCatExpr) projectsSel = projectsSel.or(projCatExpr);

        return Promise.allSettled([profilesSel.limit(12), projectsSel.limit(8)]);
      })()
    : Promise.resolve(null);

  // ── Wirker-Angebotsradius (2026-07-07) ──────────────────────────────
  // Bidirektionale Umkreispruefung fuer Wirker: ein Wirker wird nur gezeigt,
  // wenn (1) der Suchende innerhalb des Angebotsradius des Wirkers UND
  // (2) der Wirker innerhalb des Suchradius des Suchenden liegt. Beide
  // Distanzen sind dieselbe Zahl (Distanz Suchender<->Wirker), nur mit
  // zwei unterschiedlichen Schwellenwerten -- deshalb reicht EIN Distanz-Wert
  // pro Wirker, den wir ueber die bereits vorhandene nearby_wirker()-RPC
  // (Migration 067, nutzt profile_locations -- KEINE neue Geo-Infrastruktur)
  // holen und serverseitig bereits auf Bedingung 2 (Suchradius) einschraenken.
  // Bedingung 1 (Angebotsradius des Wirkers, wirker_profiles.radius_km)
  // pruefen wir danach client-seitig mit demselben Distanzwert.
  // WORLDWIDE_KM: wenn der Suchende "Weltweit" gewaehlt hat oder gar keinen
  // Radius aktiv hat, muss Bedingung 2 immer erfuellt sein -- die RPC kennt
  // aber kein "kein Limit" (BETWEEN mit NULL waere immer falsch), deshalb ein
  // Radius, der garantiert jeden Punkt der Erde abdeckt (Erdumfang/2 ≈ 20015km).
  const WORLDWIDE_KM = 20000;
  const wirkerGeoPromise = (wantPeopleProjects && hasGeo)
    ? (async () => {
        const { data: rows } = await supabase.rpc("nearby_wirker", {
          p_lat: geo.lat, p_lng: geo.lng,
          p_radius_km: hasRadius ? radiusKm : WORLDWIDE_KM,
          p_limit: 200,
        });
        const distMap = new Map((rows || []).map(r => [r.id, r.distance_km]));
        if (distMap.size === 0) return { distMap, radiusMap: new Map() };
        // Eigener Angebotsradius je Wirker -- dieselbe Spalte, die auch
        // ProfilBearbeitenModal.jsx unter "Mein Angebotsradius" schreibt.
        const { data: wp } = await supabase.from("wirker_profiles")
          .select("user_id,radius_km")
          .in("user_id", [...distMap.keys()]);
        const radiusMap = new Map((wp || []).map(r => [r.user_id, r.radius_km]));
        return { distMap, radiusMap };
      })()
    : Promise.resolve(null);

  const wantWorks = !typeFilter || typeFilter === "work";
  const wantExps  = !typeFilter || typeFilter === "experience";
  // Veranstaltungen (invitations) haben seit Migration 068 eigene lat/lng
  // (geokodet beim Erstellen in InvitationFlow.jsx) -- zaehlen bei Radius
  // GENAUSO mit wie Werke/Erlebnisse. Beitraege (Moments) bleiben ohne
  // Standortkonzept -- bei aktivem Kategorie- ODER Radius-Filter bewusst
  // ausgeblendet (kein falsch-positives/fehlendes Matching), bei reiner
  // Freitextsuche weiterhin Teil der Ergebnisse.
  // Kategorie ist jetzt (2026-07-07) ein gleichwertiger Ausloeser wie Text/
  // Radius fuer Veranstaltungen UND Beitraege -- vorher wurden beide bei
  // aktiver Kategorie bewusst ausgeblendet ("Sonderbehandlung"), das war
  // exakt die Einschraenkung, die dieses Ticket aufheben soll. Beitraege
  // bleiben weiterhin ohne eigenes Standortkonzept -- hasRadius alleine
  // triggert sie nicht (unveraendert), Text/Kategorie hingegen schon.
  const wantInvitations = !typeFilter && !!(q || hasRadius || hasCategory);
  const wantBeitraege   = !typeFilter && !!(q || hasCategory);

  const workCatExpr = buildCategoryOrExpr(cats, ["title","description","category"]);
  const expCatExpr  = buildCategoryOrExpr(cats, ["title","description","category","location_text"]);
  const invCatExpr  = buildCategoryOrExpr(cats, ["title","text","location","city"]);
  const beitrCatExpr= buildCategoryOrExpr(cats, ["caption"]);

  // Radius-RPCs VOR den eigentlichen Queries abfragen, damit ihre ids als
  // zusaetzlicher .in()-Filter angehaengt werden koennen.
  let workDistanceMap = null, expDistanceMap = null, invDistanceMap = null;
  if (hasRadius) {
    const [wRes, eRes, iRes] = await Promise.allSettled([
      wantWorks       ? supabase.rpc("nearby_works",       { p_lat: geo.lat, p_lng: geo.lng, p_radius_km: radiusKm, p_limit: 60 }) : Promise.resolve({ data: [] }),
      wantExps        ? supabase.rpc("nearby_experiences", { p_lat: geo.lat, p_lng: geo.lng, p_radius_km: radiusKm, p_limit: 60 }) : Promise.resolve({ data: [] }),
      wantInvitations ? supabase.rpc("nearby_invitations", { p_lat: geo.lat, p_lng: geo.lng, p_radius_km: radiusKm, p_limit: 30 }) : Promise.resolve({ data: [] }),
    ]);
    workDistanceMap = new Map((wRes.status === "fulfilled" ? (wRes.value?.data || []) : []).map(r => [r.id, r.distance_km]));
    expDistanceMap  = new Map((eRes.status === "fulfilled" ? (eRes.value?.data || []) : []).map(r => [r.id, r.distance_km]));
    invDistanceMap  = new Map((iRes.status === "fulfilled" ? (iRes.value?.data || []) : []).map(r => [r.id, r.distance_km]));
    // Keine Treffer im Radius -> Query fuer diesen Typ gar nicht erst absetzen.
    if (wantWorks       && workDistanceMap.size === 0) workDistanceMap.__empty = true;
    if (wantExps        && expDistanceMap.size  === 0) expDistanceMap.__empty  = true;
    if (wantInvitations && invDistanceMap.size  === 0) invDistanceMap.__empty  = true;
  }

  const tasks = [];
  tasks.push((wantWorks && !(hasRadius && workDistanceMap?.__empty))
    ? (() => {
        let sel = supabase.from("works")
          .select("id,title,cover_url,media_url,category,description,caption,tags,price,for_sale,status,approval_status,user_id,creator_id,created_at")
          .eq("status", "published").eq("approval_status", "approved");
        // Reihenfolge der Filterpipeline (Vorgabe 2026-07-07): 1. Suchbegriff,
        // 2. Radius, 4. Kategorie(n) -- Bedingung 3 (Angebotsradius) betrifft
        // ausschliesslich Wirker, siehe wirkerGeoPromise weiter unten.
        if (q) sel = sel.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
        if (hasRadius) sel = sel.in("id", [...workDistanceMap.keys()]);
        if (workCatExpr) sel = sel.or(workCatExpr);
        return sel.order("created_at", { ascending: false }).limit(hasRadius ? 60 : 20);
      })()
    : Promise.resolve({ data: [] }));
  tasks.push((wantExps && !(hasRadius && expDistanceMap?.__empty))
    ? (() => {
        let sel = supabase.from("experiences")
          .select("id,title,cover_url,media_url,category,description,price,duration,format,location_text,date,time_start,time_end,is_live,booking_mode,pricing_type,experience_type,participant_limit,max_participants,mood,mood_tags,social_energy,status,approval_status,visibility,user_id,created_at")
          .eq("status", "published").eq("approval_status", "approved");
        if (q) sel = sel.or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`);
        if (hasRadius) sel = sel.in("id", [...expDistanceMap.keys()]);
        if (expCatExpr) sel = sel.or(expCatExpr);
        return sel.order("created_at", { ascending: false }).limit(hasRadius ? 60 : 20);
      })()
    : Promise.resolve({ data: [] }));
  tasks.push(wantBeitraege
    ? (() => {
        let sel = supabase.from("beitraege")
          .select("id,user_id,src,type,caption,created_at");
        // Beitraege haben kein eigenes category-Feld -- Kategorie matcht
        // hier gegen die Caption (Freitext), exakt wie die uebrigen Typen
        // per ILIKE gegen ihre jeweiligen Textspalten matchen ("sofern
        // Kategorien vorhanden" -- Vorgabe, keine Kategorie-Spalte erfinden).
        if (q) sel = sel.ilike("caption", `%${q}%`);
        if (beitrCatExpr) sel = sel.or(beitrCatExpr);
        return sel.order("created_at", { ascending: false }).limit(15);
      })()
    : Promise.resolve({ data: [] }));
  tasks.push((wantInvitations && !(hasRadius && invDistanceMap?.__empty))
    ? (() => {
        let sel = supabase.from("invitations")
          .select("id,user_id,text,title,vibe,mood,energy,location,city,time_label,starts_at,expires_at,visibility,status,max_participants,content_type,created_at")
          .eq("status", "active").eq("visibility", "public")
          .gt("expires_at", new Date().toISOString());
        if (q) sel = sel.ilike("title", `%${q}%`);
        if (hasRadius) sel = sel.in("id", [...invDistanceMap.keys()]);
        if (invCatExpr) sel = sel.or(invCatExpr);
        return sel.order("created_at", { ascending: false }).limit(hasRadius ? 30 : 10);
      })()
    : Promise.resolve({ data: [] }));

  const [worksRes, expsRes, beitrRes, invRes] = await Promise.allSettled(tasks);
  let works = worksRes.status === "fulfilled" ? (worksRes.value?.data || []) : [];
  let exps  = expsRes.status  === "fulfilled" ? (expsRes.value?.data  || []) : [];
  const beitr = beitrRes.status === "fulfilled" ? (beitrRes.value?.data || []) : [];
  let invs  = invRes.status   === "fulfilled" ? (invRes.value?.data   || []) : [];

  // Distanz auf jede Zeile mitfuehren (fuer spaeteres "X km entfernt"-Label,
  // additiv als distance_km auf dem Roh-Objekt -- ueberlebt in item._raw).
  if (hasRadius) {
    works = works.map(w => ({ ...w, distance_km: workDistanceMap.get(w.id) ?? null }));
    exps  = exps.map(e  => ({ ...e, distance_km: expDistanceMap.get(e.id)  ?? null }));
    invs  = invs.map(i  => ({ ...i, distance_km: invDistanceMap.get(i.id)  ?? null }));
  }

  // Profil-Enrichment -- exakt dasselbe Muster wie fetchFeedPage() (ProfileService.getMany)
  const allRows = [...works, ...exps, ...beitr, ...invs];
  const userIds = [...new Set(allRows.map(r => r.user_id || r.creator_id).filter(Boolean))];
  let profileMap = {};
  if (userIds.length > 0) {
    try {
      const { data: profileRows } = await ProfileService.getMany(userIds);
      if (profileRows) profileRows.forEach(p => { profileMap[p.id] = p; });
    } catch (_) { /* Profil-Enrichment optional, nie blockierend */ }
  }
  function injectProfile(row) {
    const uid = row.user_id || row.creator_id || null;
    const p   = (uid && profileMap[uid]) ? profileMap[uid] : null;
    return { ...row, profile: p || { id: uid } };
  }

  const normalizedWorks       = works.map(r => normalizeWorkRow(injectProfile(r))).filter(Boolean);
  const normalizedExperiences = exps.map(r => normalizeExperienceRow(injectProfile(r))).filter(Boolean);
  const normalizedMoments     = beitr.map(r => normalizeBeitragRow(injectProfile(r))).filter(Boolean);
  const normalizedEvents      = invs.map(r => normalizeInvitationRow(injectProfile(r))).filter(Boolean);

  // ── Einheitliche Relevanz-Sortierung (2026-07-06, "eine intelligente
  // Suche") -- EINE Bewertungsfunktion fuer ALLE sechs Ergebnisgruppen
  // (Wirker/Projekte/Werke/Erlebnisse/Veranstaltungen/Beitraege). Stufen:
  // 0=exakter Treffer im Haupttext, 1=beginnt mit, 2=Wortanfang-Treffer,
  // 3=enthaelt (Haupttext) -- 4-7 dieselbe Abstufung im Nebentext (Kategorie/
  // Beschreibung/Ort). 9=kein Text-Treffer (reine Kategorie-/Radius-Anzeige,
  // z.B. wenn ueberhaupt kein Suchbegriff getippt wurde). Innerhalb einer
  // Stufe entscheidet bei aktiver Umkreissuche die Entfernung, sonst die
  // Aktualitaet (echter ISO-Timestamp aus _raw.created_at -- nicht der
  // bereits in einen Anzeigetext wie "vor 3 Std" umgewandelte createdAt-
  // Anzeigewert, der sich nicht als Datum vergleichen laesst).
  const qLower = q.toLowerCase();
  const escapeRx = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function matchTier(primary, secondary) {
    if (!qLower) return 9;
    const p = (primary || "").toLowerCase();
    const s = (secondary || "").toLowerCase();
    if (p === qLower) return 0;
    if (p && p.startsWith(qLower)) return 1;
    if (p && new RegExp(`\\b${escapeRx(qLower)}`).test(p)) return 2;
    if (p.includes(qLower)) return 3;
    if (s === qLower) return 4;
    if (s && s.startsWith(qLower)) return 5;
    if (s && new RegExp(`\\b${escapeRx(qLower)}`).test(s)) return 6;
    if (s.includes(qLower)) return 7;
    return 9;
  }
  function sortByRelevance(rows, getters) {
    rows.sort((a, b) => {
      const ta = matchTier(getters.primary(a), getters.secondary(a));
      const tb = matchTier(getters.primary(b), getters.secondary(b));
      if (ta !== tb) return ta - tb;
      if (hasRadius) {
        const da = getters.distance(a), db = getters.distance(b);
        if (da != null || db != null) {
          if (da == null) return 1;
          if (db == null) return -1;
          if (da !== db) return da - db;
        }
      }
      return new Date(getters.createdAt(b) || 0) - new Date(getters.createdAt(a) || 0);
    });
    return rows;
  }

  // Content-Items: title ist bereits die normalisierte Haupttext-Quelle
  // (Titel bzw. bei Beitraegen die Caption, siehe toFeedItem()); Sekundaertext
  // deckt Kategorie/Beschreibung/Ort ab, je nachdem was der Typ mitbringt.
  const contentGetters = {
    primary:   (it) => it.title,
    secondary: (it) => [it.text, it._raw?.category, it._raw?.location_text, it._raw?.location, it._raw?.city]
                          .filter(Boolean).join(" "),
    distance:  (it) => it.distanceKm,
    createdAt: (it) => it._raw?.created_at,
  };
  sortByRelevance(normalizedWorks,       contentGetters);
  sortByRelevance(normalizedExperiences, contentGetters);
  sortByRelevance(normalizedEvents,      contentGetters);
  sortByRelevance(normalizedMoments,     contentGetters);

  // Flache Liste NUR fuer Lade-/Leer-Zustandspruefungen in UnifiedFeed
  // (Skeleton/"keine Ergebnisse") -- fuer die eigentliche Darstellung werden
  // die sechs Gruppen einzeln konsumiert (siehe Rueckgabe unten).
  const normalized = [...normalizedWorks, ...normalizedExperiences, ...normalizedEvents, ...normalizedMoments];

  // Zusatz-Ergebnisse (Wirker/Projekte) parallel abwarten -- lief bereits
  // gleichzeitig mit den obigen Content-Queries (kein sequentielles Warten).
  let people = [], projects = [];
  if (wantPeopleProjects) {
    const ppRes = await peopleProjectsPromise;
    const profilesRes = ppRes?.[0];
    const projectsRes = ppRes?.[1];
    people   = (profilesRes?.status === "fulfilled" ? (profilesRes.value?.data || []) : []);
    projects = (projectsRes?.status === "fulfilled" ? (projectsRes.value?.data || []) : []);

    // Bidirektionale Radiuspruefung anwenden (siehe wirkerGeoPromise oben).
    // Ohne Standort des Suchenden (hasGeo=false) bleibt die bisherige
    // Text-only-Auswahl unveraendert -- exakt dasselbe Fallback-Verhalten
    // wie bei Werken/Erlebnissen ohne Standort.
    if (hasGeo) {
      const wirkerGeo = await wirkerGeoPromise;
      const distMap   = wirkerGeo?.distMap   || new Map();
      const radiusMap = wirkerGeo?.radiusMap || new Map();
      people = people
        .filter(p => {
          const d = distMap.get(p.id);
          if (d == null) return false; // ausserhalb Suchradius oder kein Standort erfasst
          const ownRadius = radiusMap.get(p.id);
          // -1 = Weltweit-Angebotsradius, null/unbekannt = kein Wert gesetzt -> nicht einschraenken
          if (ownRadius == null || ownRadius === -1) return true;
          return d <= ownRadius;
        })
        .map(p => ({ ...p, distanceKm: distMap.get(p.id) ?? null }));
    }
  }
  sortByRelevance(people, {
    primary:   (p) => p.display_name,
    secondary: (p) => [p.talent, p.location_label].filter(Boolean).join(" "),
    // Seit 2026-07-07 echte Distanz vorhanden, wenn der Suchende einen Standort
    // gesetzt hat (siehe wirkerGeoPromise) -- Tie-Break greift wie bei allen
    // anderen Typen nur bei aktivem Radius (hasRadius), sonst Aktualitaet.
    distance:  (p) => p.distanceKm ?? null,
    createdAt: (p) => p.member_since,
  });
  sortByRelevance(projects, {
    primary:   (p) => p.name,
    secondary: (p) => p.category,
    distance:  () => null,
    createdAt: (p) => p.distributed_at,
  });

  return {
    items: normalized, people, projects,
    // Gruppierte Ergebnisse in der vom Nutzer geforderten Reihenfolge
    // (Wirker/Projekte kommen separat als people/projects oben mit).
    works: normalizedWorks, experiences: normalizedExperiences,
    events: normalizedEvents, moments: normalizedMoments,
  };
}

export function useFeedStream({ searchQuery = "", typeFilter = null, categoryFilters = null, radiusKm = null, geo = null } = {}) {
  const { user } = useAuth();

  // ── SEARCH-MODE STATE — Search Experience 2.0 ─────────────────────────────
  // Laeuft komplett PARALLEL zur normalen Pagination/Realtime-Pipeline unten
  // (die immer weiterlaeuft, unveraendert) -- nur die RETURN-Werte am Ende
  // des Hooks entscheiden, ob normale Items oder Suchergebnisse exportiert
  // werden. Kein Eingriff in cursorRef/prefetch/realtime.
  //
  // categoryFilters (2026-07-06, "Alle Kategorien"-Feature; 2026-07-07 auf
  // Mehrfachauswahl erweitert): ein Array von Kategorie-Objekten aus
  // src/lib/categories.js ({name, keywords,...}) ODER null/leer. Zaehlt
  // genauso wie ein Freitext-Query als "isSearching" -- eine ausgewaehlte
  // Kategorie ohne eingegebenen Suchtext soll den Feed sofort filtern
  // (Vorgabe Lars).
  //
  // radiusKm/geo (Umkreissuche, 2026-07-06): ein konkret gewaehlter Radius
  // (nicht "world"/null) MIT bekanntem Standort zaehlt ebenfalls als
  // "isSearching" -- Nutzer soll direkt nach Standortwahl Ergebnisse in der
  // Naehe sehen, auch ohne eingetippten Suchtext.
  const [searchItems,    setSearchItems]    = useState([]);
  // Wirker/Projekte (2026-07-06, "Home reagiert auf globale Suche") --
  // separat von searchItems gehalten, da sie in UnifiedFeed als eigene,
  // kompakte Ergebnis-Reihen dargestellt werden (kein Feed-Card-Layout),
  // aber aus derselben fetchSearchResults()-Antwort stammen -- keine
  // zweite Datenquelle/Sucharchitektur.
  const [searchPeople,   setSearchPeople]   = useState([]);
  const [searchProjects, setSearchProjects] = useState([]);
  // Gruppierte Content-Ergebnisse (2026-07-06, "eine einzige intelligente
  // Suche"): dieselben Objekte wie in searchItems, nur schon nach Typ
  // aufgeteilt UND je Gruppe relevanzsortiert -- direkt aus derselben
  // fetchSearchResults()-Antwort, keine zweite Berechnung/Quelle.
  const [searchGroups,   setSearchGroups]   = useState({ works: [], experiences: [], events: [], moments: [] });
  const [searchLoading,  setSearchLoading]  = useState(false);
  const searchAliveRef = useRef({ v: false });
  const hasRadius = !!(geo && radiusKm && radiusKm !== "world");
  const isSearching = !!(searchQuery || "").trim() || !!categoryFilters?.length || hasRadius;

  const categoryKey = (categoryFilters || []).map(c => c?.id).filter(Boolean).sort().join(",");

  useEffect(() => {
    if (!isSearching) {
      setSearchItems([]); setSearchPeople([]); setSearchProjects([]);
      setSearchGroups({ works: [], experiences: [], events: [], moments: [] });
      setSearchLoading(false);
      return;
    }
    searchAliveRef.current.v = false;
    const alive = { v: true };
    searchAliveRef.current = alive;
    setSearchLoading(true);
    fetchSearchResults(searchQuery, typeFilter, categoryFilters, radiusKm, geo)
      .then(({ items, people, projects, works, experiences, events, moments }) => {
        if (!alive.v) return;
        setSearchItems(items);
        setSearchPeople(people);
        setSearchProjects(projects);
        setSearchGroups({ works, experiences, events, moments });
        setSearchLoading(false);
      })
      .catch(() => { if (alive.v) setSearchLoading(false); });
    return () => { alive.v = false; };
    // categoryKey statt der rohen categoryFilters-Arrayreferenz -- ein Array
    // aus einer Mehrfachauswahl bekommt bei jedem Render eine neue Referenz,
    // ein stabiler String verhindert unnoetige Refetches (2026-07-07).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter, categoryKey, radiusKm, geo?.lat, geo?.lng]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [items,          setItems]          = useState([]);
  const [rhythmicItems,  setRhythmicItems]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]     = useState(false);
  const [hasMore,        setHasMore]        = useState(true);
  const [error,          setError]          = useState(null);
  const [pendingItems,   setPendingItems]   = useState([]);  // Soft Hydration Queue
  const [pendingCount,   setPendingCount]   = useState(0);   // Badge "N neue"

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cursorRef         = useRef(null);     // FEED.2E: null | { works, exps, beitr } — Cursor pro Quelle
  const prefetchedRef     = useRef(null);     // Vorgeladene nächste Seite
  const prefetchingRef    = useRef(false);    // Prefetch läuft gerade
  const realtimeRef       = useRef(null);     // Supabase Realtime Channel
  const softHydrateTimer  = useRef(null);     // Debounce für Badge
  const idleCallbackRef   = useRef(null);     // requestIdleCallback ID
  const mountedRef        = useRef(true);

  // ── Safeguard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Rhythmisierung (nur bei items-Änderung, nicht bei pending) ────────────
  useEffect(() => {
    if (items.length === 0) { setRhythmicItems([]); return; }
    const rhythmic = rhythmizeFeed([...items]);
    setRhythmicItems(rhythmic);
    saveCache(items, cursorRef.current); // FEED.2E: cursorRef.current ist { works, exps, beitr } | null
  }, [items]);

  // ── Initial Load (mit Cache) ───────────────────────────────────────────────
  const initialLoad = useCallback(async () => {
    // Phase 4G: public feed — kein user.id nötig für beitraege / works
    // user.id wird nur für personalisierte Features genutzt (RLS-geschützte Inhalte)
    const userId = user?.id || null;
    setError(null);

    // Cache prüfen — sofort rendern wenn fresh
    const cached = loadCache();
    if (cached?.items?.length > 0) {
      setItems(cached.items);
      cursorRef.current = cached.cursors || null; // FEED.2E: cursors-Objekt (Cache aktuell disabled)
      setLoading(false);
      // Trotzdem im Hintergrund refreshen (silent)
      _silentRefresh(user.id);
      return;
    }

    setLoading(true);
    try {
      const { items: newItems, nextCursors, hasMore: more } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      cursorRef.current = nextCursors;
      setHasMore(more);
      setItems(newItems);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("[HUI_STREAM] initial load error:", err.message);
      setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // ── Silent Refresh (Cache war fresh — update im Hintergrund) ──────────────
  async function _silentRefresh(userId) {
    try {
      const { items: fresh, nextCursors } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      // Nur aktualisieren wenn sich was geändert hat
      const freshIds  = fresh.map(i => i.id).join(",");
      const currentIds = items.map(i => i.id).join(",");  // closure, okay hier
      if (freshIds !== currentIds) {
        cursorRef.current = nextCursors;
        setItems(fresh);
      }
    } catch (_) { /* silent */ }
  }

  // ── Load More (Pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Prefetch bereits vorhanden? → sofort einfügen
    if (prefetchedRef.current) {
      const { items: nextItems, nextCursors, hasMore: more } = prefetchedRef.current;
      prefetchedRef.current = null;
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursors;
      setHasMore(more);
      // Neuen Prefetch anstoßen
      _schedulePrefetch(user.id);
      return;
    }

    setLoadingMore(true);
    try {
      const { items: nextItems, nextCursors, hasMore: more } =
        await fetchFeedPage(user.id, cursorRef.current);
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursors;
      setHasMore(more);
    } catch (err) {
      console.error("[HUI_STREAM] loadMore error:", err.message);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [user?.id, loadingMore, hasMore]);

  // ── Prefetch (Idle) ───────────────────────────────────────────────────────
  const _schedulePrefetch = useCallback((userId) => {
    // FEED.2E: !cursorRef.current entfernt — cursorRef.current ist jetzt Objekt (immer truthy)
    // hasMore allein entscheidet ob Prefetch sinnvoll ist
    if (prefetchingRef.current || !hasMore) return;
    prefetchingRef.current = true;

    const run = async () => {
      try {
        const result = await fetchFeedPage(userId, cursorRef.current);
        if (mountedRef.current) prefetchedRef.current = result;
      } catch (_) { /* silent prefetch failure */ }
      finally { prefetchingRef.current = false; }
    };

    if (typeof requestIdleCallback !== "undefined") {
      idleCallbackRef.current = requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 1000);
    }
  }, [hasMore]);

  // ── Soft Hydration: neue Items aus Realtime akkumulieren ──────────────────
  const _receiveLiveItem = useCallback((rawItem, normalizer) => {
    const normalized = normalizer(rawItem);
    if (!normalized) return;

    // Existiert bereits? → update statt duplizieren
    setItems(prev => {
      const exists = prev.find(i => i.id === normalized.id);
      if (exists) return prev;  // kein Duplicate
      return prev;  // noch nicht einbauen — erst in pending
    });

    // In pending queue
    setPendingItems(prev => {
      if (prev.find(i => i.id === normalized.id)) return prev;
      return [normalized, ...prev];
    });

    // Debounce Badge
    clearTimeout(softHydrateTimer.current);
    softHydrateTimer.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPendingCount(prev => prev + 1);
    }, SOFT_HYDRATE_DELAY);
  }, []);

  // ── Soft Hydration: Items einbauen (User-Tap) ────────────────────────────
  const flushPendingItems = useCallback(() => {
    if (pendingItems.length === 0) return;
    setItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const newOnes = pendingItems.filter(i => !existingIds.has(i.id));
      return [...newOnes, ...prev];
    });
    setPendingItems([]);
    setPendingCount(0);
  }, [pendingItems]);

  // ── Realtime Setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Cleanup vorheriger Channel
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }

    realtimeRef.current = supabase
      .channel("hui_feed_realtime_v4f")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "beitraege",         // echte Tabelle — Realtime via Migration 040
      }, (payload) => {
        if (!mountedRef.current) return;
        _receiveLiveItem(payload.new, normalizeBeitragRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "invitations",
        filter: "visibility=eq.public",
      }, (payload) => {
        if (!mountedRef.current) return;
        const inv = payload.new;
        // Nur aktive, nicht abgelaufene
        if (inv.status !== "active") return;
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) return;
        _receiveLiveItem(inv, normalizeInvitationRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "experiences",
        filter: "status=eq.published",
      }, (payload) => {
        if (!mountedRef.current) return;
        // FEED.3B FIX-3 — approval_status Guard (Query: status=published AND approval_status=approved)
        if (payload.new?.approval_status !== "approved") return;
        _receiveLiveItem(payload.new, normalizeExperienceRow);
      })
      // FEED.3B FIX-2 — works INSERT (vorher fehlend, RT-1)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "works",
        filter: "status=eq.published",
      }, (payload) => {
        if (!mountedRef.current) return;
        // JS-Guard: approval_status analog zur Feed-Query prüfen
        if (payload.new?.approval_status !== "approved") return;
        _receiveLiveItem(payload.new, normalizeWorkRow);
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          if (import.meta.env.DEV) { console.warn("[HUI_STREAM] Realtime Channel Error — Feed läuft ohne Live-Updates weiter"); }
        }
      });

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      clearTimeout(softHydrateTimer.current);
      if (typeof cancelIdleCallback !== "undefined" && idleCallbackRef.current) {
        cancelIdleCallback(idleCallbackRef.current);
      }
    };
  }, [user?.id, _receiveLiveItem]);

  // ── Prefetch bei 70% Scroll (wird von ScrollSentinel aufgerufen) ──────────
  const onScrollProgress = useCallback((progress) => {
    if (progress >= PREFETCH_THRESHOLD && user?.id) {
      _schedulePrefetch(user.id);
    }
  }, [user?.id, _schedulePrefetch]);

  // ── Hard Refresh (pull-to-refresh, manuell) ────────────────────────────────
  const refresh = useCallback(async () => {
    clearCache();
    cursorRef.current = null;
    prefetchedRef.current = null;
    setPendingItems([]);
    setPendingCount(0);
    setItems([]);  // UI sofort clearen damit neue Items direkt sichtbar
    await initialLoad();
  }, [initialLoad]);

  return {
    // Items -- im Suchmodus (isSearching) werden die normalen Feed-Items
    // durch die Suchergebnisse ersetzt; Pagination/Realtime laufen im
    // Hintergrund unveraendert weiter und uebernehmen sofort wieder, wenn
    // die Suche verlassen wird (searchQuery wird leer).
    items:          isSearching ? searchItems : rhythmicItems,
    rawItems:       items,           // Unverarbeitet (für Debug) -- immer der normale Stream
    loading:        isSearching ? searchLoading : loading,
    loadingMore:    isSearching ? false : loadingMore,
    hasMore:        isSearching ? false : hasMore,   // Suchergebnisse v1: keine Pagination
    error,
    isSearching,

    // Wirker/Projekte-Treffer (2026-07-06) -- nur im Suchmodus befuellt,
    // sonst immer leere Arrays (kein Leck alter Ergebnisse beim Verlassen
    // der Suche).
    searchPeople:   isSearching ? searchPeople   : [],
    searchProjects: isSearching ? searchProjects : [],
    // Gruppierte, relevanzsortierte Content-Ergebnisse (Werke/Erlebnisse/
    // Veranstaltungen/Beitraege) -- fuer die 6-Gruppen-Darstellung in
    // UnifiedFeed. Nur im Suchmodus befuellt.
    searchGroups:   isSearching ? searchGroups   : { works: [], experiences: [], events: [], moments: [] },

    // Pagination
    loadMore,
    onScrollProgress,

    // Soft Hydration
    pendingCount,
    flushPendingItems,

    // Utils
    refresh,
  };
}
