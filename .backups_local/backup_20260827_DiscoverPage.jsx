// src/pages/DiscoverPage.jsx — HUI Redesign v3 (2026-05-30)
// ════════════════════════════════════════════════════════════════
// DESIGN REFERENZ: Screenshot 2026-05-30
// Reihenfolge: Suche → Heute auf HUI → Menschen → Momente → Werke → Erlebnisse → Projekte → Orte
// KEINE Kategorie-Pills (HUI-Orb übernimmt Themennavigation)
// ════════════════════════════════════════════════════════════════
// REFACTORED 2026-08-25: Sub-components extracted to src/components/discover/
// No logic changes — pure file split for maintainability.

import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate }   from "react-router-dom";
import { NAV_CONTENT_SPACER_CSS } from "../components/home/navigation/navigationGeometry.js";
import { supabase }      from "../lib/supabaseClient.js";
import { getOptimalPageSize } from "../lib/deviceTier.js";
import { searchPlaces, distanceKm } from "../lib/geocoding.js";
import { filterDiscoveryItems, hasActiveSearchFilter } from "../lib/searchFilter.js";
import { useRadiusFilter } from "../hooks/useRadiusFilter.js";
import { useAuthGate }    from "../components/auth/AuthGate.jsx";
import TalentAnfrageFlow  from "../components/talents/TalentAnfrageFlow.jsx";
import TalentBookingFlow from "../components/talents/TalentBookingFlow.jsx";
import HuiLiveTicker from "../components/shared/HuiLiveTicker.jsx";
import { useContentPreview } from "../context/ContentPreviewContext.jsx";
import { normalizeTalentForPreview, normalizePostForPreview } from "../lib/previewNormalizers.js";
import { useProfileLauncher } from "../components/home/profile/ProfileLauncher.jsx";
import { ProfileService } from "../services/db.js";
import { formatDateDE } from "../lib/formatters.js";
import { useTranslation } from "../hooks/useTranslation.js";

const MenschenAllModal = lazy(() => import("../components/discover/MenschenAllModal.jsx"));
const WerkeAllModal = lazy(() => import("../components/discover/WerkeAllModal.jsx"));
const TalenteAllModal = lazy(() => import("../components/discover/TalenteAllModal.jsx"));
const ErlebnisseAllModal = lazy(() => import("../components/discover/ErlebnisseAllModal.jsx"));
const MomenteAllModal = lazy(() => import("../components/discover/MomenteAllModal.jsx"));
const ProjekteAllModal = lazy(() => import("../components/discover/ProjekteAllModal.jsx"));
const OrteAllModal = lazy(() => import("../components/discover/OrteAllModal.jsx"));

// ── Extracted sub-components ────────────────────────────────────
import { T, CSS, SYSTEM_USER_ID, safeStr, safeNum, _discoverCache, isCacheValid, filterByRadius, resetStaleLoading } from "../components/discover/constants.js";
import { DiscoverTitleBar } from "../components/discover/DiscoverTitleBar.jsx";
import { PeopleSection } from "../components/discover/PeopleSection.jsx";
import { MomenteSection } from "../components/discover/MomenteSection.jsx";
import { TalenteSection } from "../components/discover/TalentSection.jsx";
import { WerkeSection } from "../components/discover/WerkSection.jsx";
import { ErlebnisseSection } from "../components/discover/ErlebnisSection.jsx";
import { ProjekteSection } from "../components/discover/ProjektSection.jsx";
import { OrteSection } from "../components/discover/OrtSection.jsx";

export default function DiscoverPage({ onView, onMap, onBook, openMenschenSignal, searchState = {} }) {
  const { t: _t } = useTranslation();
  const view = "cards"; // Fest auf Kacheln — Listenansicht-Umschaltung 2026-08-06 entfernt (Buttons raus)
  const [loading, setLoading] = useState(true);
  const [people, setPeople]           = useState([]);
  const [momente, setMomente]         = useState([]);
  const [werke, setWerke]             = useState([]);
  const [talente, setTalente]         = useState([]);

  // ── Talent-Umkreissuche -- VEREINHEITLICHT (2026-07-06) ──
  // Frueher: eigener lokaler Radius-State (talentRadiusKm, Default 50km,
  // 4 feste Stufen) + eigene Standort-Auswahl (talentLocActive), komplett
  // unabhaengig von der globalen Suche. Jetzt: derselbe useRadiusFilter()-
  // Hook wie SearchCommandCenter -- radius.geo/radius.radiusKm sind exakt
  // derselbe Zustand, Aenderungen an einer Stelle wirken ueberall sofort.
  // Die Autocomplete-Vorschlagsliste (Tippen -> Nominatim-Vorschlaege ->
  // konkrete Zeile anklicken) ist reine UI-Mechanik und bleibt lokal --
  // beim Anklicken wird die gewaehlte Zeile per radius.setGeo() direkt in
  // den globalen Zustand geschrieben (kein zweites Geocoding).
  const radius = useRadiusFilter();
  const [talentLocQuery, setTalentLocQuery]     = useState("");
  const [talentLocSuggest, setTalentLocSuggest] = useState([]);
  const [talentLocSearching, setTalentLocSearching] = useState(false);
  const talentLocDebounce = useRef(null);

  // Preload PublicProfilePage + OrbSignatur beim Discover-Mount
  // → beide Chunks im Browser-Cache wenn Nutzer ein Profil antippt
  useEffect(() => {
    import("./PublicProfilePage.jsx").catch(() => {});
    import("../components/profile/OrbSignatur.jsx").catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(talentLocDebounce.current);
    if (talentLocQuery.trim().length < 2) { setTalentLocSuggest([]); return; }
    setTalentLocSearching(true);
    talentLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(talentLocQuery);
      setTalentLocSuggest(res);
      setTalentLocSearching(false);
    }, 450);
    return () => clearTimeout(talentLocDebounce.current);
  }, [talentLocQuery]);

  function handlePickTalentLoc(place) {
    radius.setGeo(place);
    setTalentLocQuery("");
    setTalentLocSuggest([]);
  }
  function handleClearTalentLoc() {
    radius.clearLocation();
    setTalentLocQuery("");
    setTalentLocSuggest([]);
  }

  // ── Werke/Erlebnisse-Umkreissuche -- gleicher globaler radius-Zustand ──
  // (Erweiterung 2026-07-06: Radius-Vereinheitlichung war bisher nur fuer
  // Talente verdrahtet, siehe Commit 071a8dab. Werke/Erlebnisse nutzen
  // denselben Autocomplete-lokal/Ergebnis-global-Mechanismus.)
  const [werkLocQuery, setWerkLocQuery]     = useState("");
  const [werkLocSuggest, setWerkLocSuggest] = useState([]);
  const [werkLocSearching, setWerkLocSearching] = useState(false);
  const werkLocDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(werkLocDebounce.current);
    if (werkLocQuery.trim().length < 2) { setWerkLocSuggest([]); return; }
    setWerkLocSearching(true);
    werkLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(werkLocQuery);
      setWerkLocSuggest(res);
      setWerkLocSearching(false);
    }, 450);
    return () => clearTimeout(werkLocDebounce.current);
  }, [werkLocQuery]);

  function handlePickWerkLoc(place) {
    radius.setGeo(place);
    setWerkLocQuery("");
    setWerkLocSuggest([]);
  }
  function handleClearWerkLoc() {
    radius.clearLocation();
    setWerkLocQuery("");
    setWerkLocSuggest([]);
  }

  const [erlebnisLocQuery, setErlebnisLocQuery]     = useState("");
  const [erlebnisLocSuggest, setErlebnisLocSuggest] = useState([]);
  const [erlebnisLocSearching, setErlebnisLocSearching] = useState(false);
  const erlebnisLocDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(erlebnisLocDebounce.current);
    if (erlebnisLocQuery.trim().length < 2) { setErlebnisLocSuggest([]); return; }
    setErlebnisLocSearching(true);
    erlebnisLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(erlebnisLocQuery);
      setErlebnisLocSuggest(res);
      setErlebnisLocSearching(false);
    }, 450);
    return () => clearTimeout(erlebnisLocDebounce.current);
  }, [erlebnisLocQuery]);

  function handlePickErlebnisLoc(place) {
    radius.setGeo(place);
    setErlebnisLocQuery("");
    setErlebnisLocSuggest([]);
  }
  function handleClearErlebnisLoc() {
    radius.clearLocation();
    setErlebnisLocQuery("");
    setErlebnisLocSuggest([]);
  }

  const [erlebnisse, setErlebnisse]   = useState([]);
  const [projekte, setProjekte]       = useState([]);
  const [orte, setOrte]               = useState([]); // echte Orte via rpc_discover_places
  const [orteInitialPlace, setOrteInitialPlace] = useState(null); // Deep-Link in OrteAllModal (z.B. Klick auf Teaser-Karte)
  const [talentInquiry, setTalentInquiry] = useState(null);
  const [talentBooking, setTalentBooking] = useState(null); // ausgewaehltes Talent fuer Anfrage-Modal
  const { requireAuth } = useAuthGate();

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Stale-While-Revalidate: Cache sofort anzeigen, dann im Hintergrund aktualisieren
      if (isCacheValid() && _discoverCache.data) {
        const c = _discoverCache.data;
        if (!cancelled) {
          if (c.people)        setPeople(c.people);
          if (c.werke)         setWerke(c.werke);
          if (c.talente)       setTalente(c.talente);
          if (c.erlebnisse)    setErlebnisse(c.erlebnisse);
          if (c.projekte)      setProjekte(c.projekte);
          if (c.momente)       setMomente(c.momente);
          if (c.orte)          setOrte(c.orte);
          setLoading(false);
        }
        return; // Cache noch frisch — kein Netzwerk-Request
      }

      // Dedup: verhindert parallele Loads (z.B. durch mehrfache PTR-Events)
      resetStaleLoading();
      if (_discoverCache.loading) return;
      _discoverCache.loading = true;
      _discoverCache.loadingTs = Date.now();

      try {
        // People — sortiert nach Beliebtheit (Follower + Likes kombiniert) via RPC
        const { data: profiles } = await supabase
          .rpc("rpc_discover_people", { p_sort: "popular", p_limit: getOptimalPageSize(12), p_offset: 0 });

        if (!cancelled && profiles?.length > 0) {
          // Feed-Profile in Cache schreiben → Profil-Tap ist instant (kein DB-Request mehr)
          ProfileService.prewarm(profiles);
          setPeople(profiles.map(p => ({
            id:           p.id,
            name:         safeStr(p.full_name || p.display_name || p.username) || null,
            bio:          safeStr(p.bio),
            location:     safeStr(p.location_label), // Identity Contract v1.0
            avatar:       safeStr(p.avatar_url),
            impact:       safeNum(p.impact_eur, 0),
            followers:    safeNum(p.followers_count, 0),
            likes:        safeNum(p.total_likes, 0),
            last_seen_at: null, // last_seen_at nicht im Identity Contract
            interests:    [], // dna_tags/skills nicht im Identity Contract
          })));
        }

        // Momente (beitraege) — 2-Schritt-Query (kein FK beitraege.user_id → profiles)
        const { data: beitr } = await supabase
          .from("beitraege")
          .select("id,src,type,moment_source,linked_project_id,caption,content,created_at,user_id,views_count")
          .order("created_at", { ascending:false })
          .neq("user_id", SYSTEM_USER_ID) // System-Bot nicht im Entdecken (Regel: nur Home-Feed)
          .limit(getOptimalPageSize(8));

        if (!cancelled && beitr?.length > 0) {
          // Profile nachladen
          const beitrUserIds = [...new Set(beitr.map(b => b.user_id).filter(Boolean))];
          let beitrProfileMap = {};
          if (beitrUserIds.length > 0) {
            const { data: bpros } = await supabase
              .from("public_profiles")
              .select("id,display_name,full_name,avatar_url")
              .in("id", beitrUserIds);
            if (bpros) beitrProfileMap = Object.fromEntries(bpros.map(p => [p.id, p]));
          }
          // Echte Like-/Kommentar-Zahlen nachladen — dieselbe SSOT wie ueberall
          // sonst im System: reaction_counts(post_id).inspire fuer das Herz-Icon
          // (identisch zum likes_count-Trigger auf works/experiences, siehe
          // BaseFeedCard.jsx ActionBtn Icon={HUIHeartIcon} count={inspireCount}),
          // count_comments(post_id, 'moment') fuer die Sprechblase. Vorher wurden
          // hier deterministische Fake-Zahlen aus der charCodeAt der ID erzeugt.
          const beitrEngagement = await Promise.all(beitr.map(async (b) => {
            // Supabase JS v2 .rpc() hat keine .catch() Methode — try/await statt .catch()
            let rc = null, cc = null;
            try { rc = (await supabase.rpc("reaction_counts", { p_post_id: b.id }))?.data; } catch {}
            try { cc = (await supabase.rpc("count_comments", { p_post_id: b.id, p_post_type: "moment" }))?.data; } catch {}
            return { id: b.id, likes: rc?.inspire ?? 0, comments: typeof cc === "number" ? cc : 0 };
          }));
          const beitrEngagementMap = Object.fromEntries(beitrEngagement.map(e => [e.id, e]));

          if (!cancelled) setMomente(beitr.map(b => {
            const bp = beitrProfileMap[b.user_id] || {};
            const eng = beitrEngagementMap[b.id] || { likes:0, comments:0 };
            return {
            id:         b.id,
            user_id:    b.user_id,
            src:        safeStr(b.src),
            caption:    safeStr(b.caption, _t("discover.fallbackMoment")),
            type:       safeStr(b.type, "foto"),
            created_at: b.created_at,
            name:       safeStr(bp.full_name || bp.display_name, _t("discover.fallbackMember")),
            avatar_url: bp.avatar_url || null,
            location:   "",
            likes:      eng.likes,
            comments:   eng.comments,
            views:      b.views_count || 0,
          };
          }));
        }

        // Werke — 2-Schritt-Query (kein FK von works.user_id → profiles)
        // Schritt 1: Werke laden
        const { data: ws, error: wsErr } = await supabase
          .from("works")
          .select("id,title,cover_url,category,file_format,tags,status,approval_status,visibility,price,location_text,lat,lng,user_id,created_at,likes_count,views_count")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .eq("visibility", "public")
          .order("likes_count", { ascending:false })
          .limit(8);

        if (!cancelled && ws?.length > 0) {
          // Schritt 2: Profile für alle Autoren nachladen (public_profiles = öffentlich lesbar)
          const FILE_FORMAT_LABEL = {
            original: _t("discover.fileFormatOriginal"),
            druck:    _t("discover.fileFormatDruck"),
            digital:  _t("discover.fileFormatDigital"),
          };
          const userIds = [...new Set(ws.map(w => w.user_id).filter(Boolean))];
          let profileMap = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("public_profiles")
              .select("id,display_name,full_name,avatar_url")
              .in("id", userIds);
            if (profs) profileMap = Object.fromEntries(profs.map(p => [p.id, p]));
          }
          setWerke(ws.map(w => {
            const prof = profileMap[w.user_id] || {};
            return {
              id:        w.id,
              user_id:   w.user_id,
              title:     safeStr(w.title, _t("discover.fallbackWerk")),
              cover:     safeStr(w.cover_url),
              medium:    FILE_FORMAT_LABEL[w.file_format] || safeStr(w.category, _t("discover.fallbackWerk")),
              price:     w.price != null ? safeNum(w.price, 0) : null,
              location:  safeStr(w.location_text),
              lat:       Number.isFinite(w.lat) ? w.lat : null,
              lng:       Number.isFinite(w.lng) ? w.lng : null,
              author:    safeStr(prof.full_name || prof.display_name, _t("discover.fallbackTalent")),
              avatar_url: prof.avatar_url || null,
              likes:     w.likes_count || 0,
              views:     w.views_count || 0,
            };
          }));
        } else if (!wsErr) {
          // Keine Werke in DB → setWerke([]) → displayWerke fällt auf SEED zurück
          if (!cancelled) setWerke([]);
        }

        // Talente — freigegebene Dienstleistungsangebote (TALENT-OFFERS-001/TALENT-SERVICES-001)
        // Oeffentlich sichtbar nur status='approved' (RLS deckt das zusaetzlich ab)
        const { data: tal, error: talErr } = await supabase
          .from("talents")
          .select("id,title,description,category,images,price_per_hour,price_per_session,currency,location_type,location_address,location_notes,map_link,lat,lng,user_id,created_at,available_dates,available_time_slots,recurring,duration_minutes,max_participants,min_participants,booking_type,booking_window_start,booking_window_end,views_count")
          .eq("status", "approved")
          .order("created_at", { ascending:false })
          .limit(8);

        if (talErr) {
        }

        if (!cancelled && tal?.length > 0) {
          // Anbieternamen nachladen (kein FK-Embed, eigene Anfrage — gleiches Muster wie "People")
          const providerIds = [...new Set(tal.map(t => t.user_id).filter(Boolean))];
          let providerMap = {};
          if (providerIds.length > 0) {
            const { data: provs } = await supabase
              .from("profiles")
              .select("id,display_name,full_name,username")
              .in("id", providerIds);
            providerMap = Object.fromEntries((provs || []).map(p => [p.id, safeStr(p.full_name || p.display_name || p.username, _t("discover.fallbackTalent"))]));
          }
          if (!cancelled) {
            setTalente(tal.map(t => ({
              id:                    t.id,
              user_id:               t.user_id,
              title:                 safeStr(t.title, _t("discover.fallbackTalentOffer")),
              description:           safeStr(t.description),
              cover:                 (Array.isArray(t.images) && t.images[0]?.url) ? safeStr(t.images[0].url) : null,
              category:              safeStr(t.category),
              price_per_hour:        t.price_per_hour != null ? safeNum(t.price_per_hour, 0) : null,
              price_per_session:     t.price_per_session != null ? safeNum(t.price_per_session, 0) : null,
              currency:              safeStr(t.currency, "EUR"),
              location_type:         safeStr(t.location_type),
              location_address:      safeStr(t.location_address),
              location_notes:        safeStr(t.location_notes),
              map_link:              safeStr(t.map_link),
              lat:                   Number.isFinite(t.lat) ? t.lat : null,
              lng:                   Number.isFinite(t.lng) ? t.lng : null,
              author:                providerMap[t.user_id] || _t("discover.fallbackTalent"),
              // Buchungsdaten (TALENT-SERVICES-001) — fuer TalentBookingFlow
              available_dates:       Array.isArray(t.available_dates) ? t.available_dates : [],
              available_time_slots:  Array.isArray(t.available_time_slots) ? t.available_time_slots : [],
              recurring:             safeStr(t.recurring),
              duration_minutes:      t.duration_minutes != null ? safeNum(t.duration_minutes, 0) : null,
              max_participants:      t.max_participants != null ? safeNum(t.max_participants, 1) : 1,
              min_participants:      t.min_participants != null ? safeNum(t.min_participants, 1) : 1,
              booking_type:          safeStr(t.booking_type, "einzel"),
              booking_window_start:  safeStr(t.booking_window_start),
              booking_window_end:    safeStr(t.booking_window_end),
              views:                 t.views_count || 0,
            })));
          }
        } else if (!talErr) {
          if (!cancelled) setTalente([]);
        }

        // Erlebnisse — korrigierte Feldnamen: location_text, max_participants
        const { data: exps, error: expsErr } = await supabase
          .from("experiences")
          .select("id,title,cover_url,date,duration,location_text,max_participants,status,approval_status,category,experience_type,format,lat,lng,user_id,created_at,likes_count,views_count")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .order("likes_count", { ascending:false })
          .limit(8);

        if (expsErr) {
        }

        if (!cancelled && exps?.length > 0) {
          setErlebnisse(exps.map(e => {
            const d = e.date ? new Date(e.date) : null;
            const now = new Date();
            // Status ableiten
            let statusLabel = "Aktiv";
            let statusColor = "#16A34A";
            if (d && d > now) { statusLabel = "Geplant";       statusColor = "#D97706"; }
            if (d && d < now) { statusLabel = "Abgeschlossen"; statusColor = "rgba(26,26,46,0.38)"; }

            // Typ-Label
            const typeRaw = e.experience_type || e.category || "";
            const typeMap = { workshop:"Workshop", event:"Event", ausstellung:"Ausstellung",
              projekt:"Projekt", kurs:"Kurs", online:"Online" };
            const typeLabel = typeMap[typeRaw.toLowerCase()] || typeRaw || "Erlebnis";

            // Datum
            const dateStr = d ?formatDateDE(d, { day:"numeric", month:"short" }) : null;
            const dayNum  = d ? String(d.getDate()).padStart(2,"0") : null;
            const monthSh = d ? d.toLocaleString("de",{month:"short"}) : null;

            return {
              id:          e.id,
              user_id:     e.user_id,
              title:       safeStr(e.title, "Erlebnis"),
              cover:       safeStr(e.cover_url),
              date:        dayNum,
              month:       monthSh,
              dateStr,
              dayLabel:    dateStr || "",
              time:        safeStr(e.duration),
              location:    safeStr(e.location_text),
              spots:       safeNum(e.max_participants, 0),
              statusLabel,
              statusColor,
              typeLabel,
              format:      safeStr(e.format),
              lat:         Number.isFinite(e.lat) ? e.lat : null,
              lng:         Number.isFinite(e.lng) ? e.lng : null,
              likes:       e.likes_count || 0,
              views:       e.views_count || 0,
            };
          }));
        } else if (!expsErr) {
          if (!cancelled) setErlebnisse([]);
        }

        // SYS-REFACTOR-023: totes impact_pool-Query entfernt (Ergebnis 'imp' wurde nie gelesen, keine Verhaltensaenderung)

        // Impact-Projekte — nach Stimmen/Rank sortiert (Projekt der Woche = #1)
        // Spalten: project_name (nicht name), rank (Trigger aktuell via impact_votes)
        const { data: projRaw } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,location,rank,funding_goal,current_amount_eur,status,created_at")
          .eq("status","approved")
          .order("rank", { ascending:true, nullsFirst:false })
          .order("created_at", { ascending:true })
          .limit(10);

        // vote_count per Projekt via RPC (FIX 2026-08-15, Migration 119: RLS-Bug)
        let voteMap = {};
        if (projRaw && projRaw.length > 0) {
          const ids = projRaw.map(p => p.id);
          const { data: voteRows } = await supabase
            .rpc("rpc_get_vote_counts", { p_project_ids: ids, p_pool_month: null });
          if (voteRows) {
            voteRows.forEach(v => { voteMap[v.project_id] = Number(v.vote_count) || 0; });
          }
        }
        // null-rank Projekte ans Ende, nach votes sortieren
        const projData = projRaw
          ? [...projRaw].sort((a, b) => {
              const aRank = a.rank ?? 9999;
              const bRank = b.rank ?? 9999;
              if (aRank !== bRank) return aRank - bRank;
              return (voteMap[b.id] || 0) - (voteMap[a.id] || 0);
            })
          : null;

        if (!cancelled && projData?.length > 0) {
          const CAT_COLOR = {
            natur:    { bg:"rgba(22,163,74,0.12)", text:"#16A34A" },
            tiere:    { bg:"rgba(217,119,6,0.12)",  text:"#D97706" },
            umwelt:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            kultur:   { bg:"rgba(99,102,241,0.12)", text:"#6366F1" },
            bildung:  { bg:"rgba(232,87,58,0.12)",  text:"#F47355" },
            sozial:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
          };
          // Kategorie aus location (Fallback: "Impact")
          const CAT_COLOR_EXT = {
            ...CAT_COLOR,
            impact:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            sozial:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            gesundheit: { bg:"rgba(239,68,68,0.12)", text:"#EF4444" },
            community: { bg:"rgba(99,102,241,0.12)", text:"#6366F1" },
          };
          // Fallback-Cover-Pool für Projekte ohne Bild
          const COVER_FALLBACKS = [
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75",
            "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75",
            "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=75",
          ];
          setProjekte(projData.map((p, idx) => {
            // Kategorie: aus Beschreibung/Name ableiten oder "Impact" als Fallback
            let catRaw = "";
            const nameLower = (p.project_name || "").toLowerCase();
            if (nameLower.includes("tier") || nameLower.includes("hund") || nameLower.includes("dog")) catRaw = "tiere";
            else if (nameLower.includes("garten") || nameLower.includes("natur") || nameLower.includes("grün")) catRaw = "natur";
            else if (nameLower.includes("meer") || nameLower.includes("küste") || nameLower.includes("umwelt") || nameLower.includes("klima")) catRaw = "umwelt";
            else if (nameLower.includes("kind") || nameLower.includes("lern") || nameLower.includes("schule") || nameLower.includes("bildung")) catRaw = "bildung";
            else if (nameLower.includes("musik") || nameLower.includes("kunst") || nameLower.includes("kultur")) catRaw = "kultur";
            else if (nameLower.includes("sozial") || nameLower.includes("obdach") || nameLower.includes("mahlzeit") || nameLower.includes("mensch")) catRaw = "sozial";
            else catRaw = "impact";
            const cc = CAT_COLOR_EXT[catRaw] || { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" };
            const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);
            const votes = voteMap[p.id] || 0;
            return {
              id:       p.id,
              title:    p.project_name || "Projekt",
              desc:     p.short_desc || "",
              cat:      catLabel,
              catColor: cc,
              cover:    p.cover_url || COVER_FALLBACKS[idx % COVER_FALLBACKS.length],
              members:  votes,
              rank:     p.rank || 0,
              funding_goal:       p.funding_goal || 0,
              current_amount_eur: p.current_amount_eur || 0,
              _raw:     p,
            };
          }));
        }

        // Orte — echte Standort-Gruppen aus Profilen/Werken/Erlebnissen (rpc_discover_places)
        const { data: placesData } = await supabase
          .rpc("rpc_discover_places", { p_sort: "active", p_limit: 8, p_offset: 0 });
        if (!cancelled && placesData) {
          setOrte(placesData.map(p => ({
            place_key:         p.place_key,
            people_count:      p.people_count || 0,
            works_count:       p.works_count || 0,
            experiences_count: p.experiences_count || 0,
            total_count:       p.total_count || 0,
          })));
        }

      } catch (e) {
        console.warn("[DiscoverPage] load error:", e?.message);
      } finally {
        _discoverCache.loading = false;
        _discoverCache.loadingTs = 0;
        if (!cancelled) setLoading(false);
      }
    }

    // Bei PTR/manuellem Reload: Cache-TTL resetten damit frische Daten geladen werden
    function forceLoad() {
      _discoverCache.ts = 0; // Cache invalidieren
      load();
    }
    load();
    // Safety: force loading=false after 10s regardless of what happens
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        setLoading(l => {
          if (l) console.warn('[DiscoverPage] Safety timeout: forcing loading=false after 10s');
          return false;
        });
        _discoverCache.loading = false;
        _discoverCache.loadingTs = 0;
      }
    }, 10000);
    return () => { cancelled = true; clearTimeout(safetyTimer); };
  }, []);  

  // ── DiscoverPage Cache-Sync: schreibt geladene Daten in den SWR-Cache ──
  // Wird nach jedem erfolgreichen Load ausgeführt und merkt sich die Daten für 5 Min.
  React.useEffect(() => {
    if (!loading && (people.length || werke.length || talente.length)) {
      _discoverCache.data = { people, werke, talente, erlebnisse, projekte, momente, orte };
      _discoverCache.ts = Date.now();
    }
  }, [loading, people, werke, talente, erlebnisse, projekte, momente, orte]);

  // ── Pull-to-Refresh: feed-refresh-Event abonnieren ────────────
  // Wenn PTR (Home.jsx) ausgelöst wird, soll auch DiscoverPage neu laden.
  // Trick: reloadKey-Counter → useEffect-Dependency triggert Reload.
  const [discoverReloadKey, setDiscoverReloadKey] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setDiscoverReloadKey(k => k + 1);
    window.addEventListener("feed-refresh", handler);
    return () => window.removeEventListener("feed-refresh", handler);
  }, []);

  // ── People: nur echte DB-Daten (kein Seed-Fallback — verhindert Klick-Bug)
  const filteredPeople = people;



  const displayMomente    = momente; // nur echte Daten
  const navigate           = useNavigate();
  const { open: openPreview } = useContentPreview(); // OPEN.1 2026-07-08
  const { openCreatorProfile } = useProfileLauncher(); // Autor-Klick → Profil
  const baseDisplayWerke      = werke; // nur echte Daten
  const baseDisplayTalente    = talente; // nur echte Daten
  const baseDisplayErlebnisse = erlebnisse; // nur echte Daten

  // Umkreisfilter: nur aktiv wenn Nutzer einen Standort ausgewaehlt hat UND
  // der globale Radius nicht "Weltweit" ist (radius.isWorldwide => kein
  // Distanzfilter, wie bei Werken/Erlebnissen/Veranstaltungen).
  // Online-Angebote bleiben immer sichtbar (kein Standort-Bezug).
  // Angebote ohne Koordinaten (nicht geocodebar) werden ausgeblendet, aber
  // gezaehlt, damit es nicht "grundlos" weniger Ergebnisse gibt.
  let hiddenNoCoordsCount = 0;
  const displayTalente = (!radius.geo || radius.isWorldwide)
    ? baseDisplayTalente
    : baseDisplayTalente
        .map(t => {
          if (t.location_type === "online") return { ...t, distanceKm: null };
          if (Number.isFinite(t.lat) && Number.isFinite(t.lng)) {
            const d = distanceKm(radius.geo.lat, radius.geo.lng, t.lat, t.lng);
            return { ...t, distanceKm: d };
          }
          return { ...t, distanceKm: undefined }; // ohne Koordinaten
        })
        .filter(t => {
          if (t.location_type === "online") return true;
          if (t.distanceKm === undefined) { hiddenNoCoordsCount++; return false; }
          return t.distanceKm <= radius.radiusKm;
        })
        .sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
  const { list: displayWerke, hidden: werkHiddenCount } =
    filterByRadius(baseDisplayWerke, radius, () => false);
  const { list: displayErlebnisse, hidden: erlebnisHiddenCount } =
    filterByRadius(baseDisplayErlebnisse, radius, e => e.format === "online");

  const displayProjekte   = projekte; // nur echte Daten

  // ── SEARCH FILTER (2026-08-12) ────────────────────────────────────
  // BUGFIX: SearchCommandCenter-Suchstate wurde bisher NICHT an
  // DiscoverPage weitergegeben — Sucheingabe im Entdecken-Tab hatte
  // null Effekt. Jetzt: clientseitige Filterung aller Sections nach
  // Freitext + Kategorien. typeFilter blendet nicht zutreffende
  // Sections komplett aus (z.B. typeFilter="work" → nur Werke sichtbar).
  const _searchQuery     = searchState.query || "";
  const _searchCats      = Array.isArray(searchState.categories) ? searchState.categories : [];
  const _typeFilter      = searchState.typeFilter || null;
  const _searchActive     = hasActiveSearchFilter({ query: _searchQuery, categoryFilters: _searchCats });

  const searchedPeople = useMemo(() =>
    _searchActive ? filterDiscoveryItems(filteredPeople, { query: _searchQuery, categoryFilters: _searchCats },
      p => [p.name, p.bio, p.location, p.interests?.join?.(" ") || ""]) : filteredPeople,
  [filteredPeople, _searchActive, _searchQuery, _searchCats]);

  const searchedMomente = useMemo(() =>
    _searchActive ? filterDiscoveryItems(displayMomente, { query: _searchQuery, categoryFilters: _searchCats },
      m => [m.caption, m.name, m.location]) : displayMomente,
  [displayMomente, _searchActive, _searchQuery, _searchCats]);

  const searchedTalente = useMemo(() =>
    _searchActive ? filterDiscoveryItems(displayTalente, { query: _searchQuery, categoryFilters: _searchCats },
      t => [t.title, t.description, t.category, t.author, t.location_address, t.location_notes]) : displayTalente,
  [displayTalente, _searchActive, _searchQuery, _searchCats]);

  const searchedWerke = useMemo(() =>
    _searchActive ? filterDiscoveryItems(displayWerke, { query: _searchQuery, categoryFilters: _searchCats },
      w => [w.title, w.medium, w.author, w.location]) : displayWerke,
  [displayWerke, _searchActive, _searchQuery, _searchCats]);

  const searchedErlebnisse = useMemo(() =>
    _searchActive ? filterDiscoveryItems(displayErlebnisse, { query: _searchQuery, categoryFilters: _searchCats },
      e => [e.title, e.typeLabel, e.location, e.dayLabel]) : displayErlebnisse,
  [displayErlebnisse, _searchActive, _searchQuery, _searchCats]);

  const searchedProjekte = useMemo(() =>
    _searchActive ? filterDiscoveryItems(displayProjekte, { query: _searchQuery, categoryFilters: _searchCats },
      p => [p.title, p.desc, p.cat]) : displayProjekte,
  [displayProjekte, _searchActive, _searchQuery, _searchCats]);

  // typeFilter: blendet Sections aus, die nicht zum Filter passen
  const _showPeople     = !_typeFilter || _typeFilter === "profile";
  const _showMomente    = !_typeFilter || _typeFilter === "profile";
  const _showWerke      = !_typeFilter || _typeFilter === "work";
  const _showTalente    = !_typeFilter || _typeFilter === "experience";
  const _showErlebnisse = !_typeFilter || _typeFilter === "experience";
  const _showProjekte   = !_typeFilter;
  const _showOrte       = !_typeFilter && !_searchActive;

  // Person/Wirker-Karte (OPEN.4 2026-07-08): sprang bisher IMMER direkt aufs
  // Profil ohne jede Vorschau -- echte Luecke, da "alle Wirker" explizit zur
  // einheitlichen Vorschau gehoeren. Jetzt: Vorschau zuerst, "Vollstaendige
  // Ansicht" darin fuehrt zum Profil (bei echter UUID + Username), sonst
  // (Seed-Karten) bleibt nur die Vorschau ohne Profil-Sprung.
  const handlePersonPress = useCallback((person) => {
    // (2026-07-29) PersonCard öffnet DIREKT das öffentliche Profil.
    const isRealId = person?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(person.id));
    if (isRealId && typeof onView === "function") {
      onView(person.id);
    }
  }, [onView]);

  // Werk-Karte: öffne Werk-Detailseite (nur bei echter DB-ID, nicht bei Seed-Daten)
  const handleWerkPress = useCallback((werk) => {
    const werkId = werk.id;
    const isRealId = werkId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(werkId));
    if (!isRealId) return; // Seed-Karte: nichts tun
    // Direkt zur WorkDetailPage navigieren (zuverlässiger als Sheet-Normalisierung)
    navigate(`/work/${werkId}`);
  }, [navigate]);

  // Talent-Karte: Anmeldung/Registrierung erzwingen (useAuthGate), danach Anfrage-Modal öffnen.
  // Seed-Karten (keine echte UUID) öffnen nach Login bewusst kein Modal (kein echter Anbieter dahinter).
  const handleTalentPress = useCallback((talent) => {
    const talentId = talent.id;
    const isRealId = talentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(talentId));
    const hasPrice = talent.price_per_hour != null || talent.price_per_session != null;
    if (isRealId) { try { supabase.rpc("increment_talent_views", { talent_id: talentId }); } catch {} }
    requireAuth(hasPrice ? "ein Talent zu buchen" : "ein Talent zu kontaktieren", () => {
      if (!isRealId) return;
      if (hasPrice) setTalentBooking(talent);
      else setTalentInquiry(talent);
    });
  }, [requireAuth]);

  // Moment-Karte (OPEN.1, 2026-07-08): oeffnet jetzt die geteilte Vorschau
  // des Moments selbst statt direkt zum Profil zu springen -- der bisherige
  // Weg (Profil des Erstellers) ist ohne eigenen Moment-Detail-View durch
  // die Vorschau ersetzt, die Titelbild/Text/Datum des Moments zeigt.
  const handleMomentPress = useCallback((moment) => {
    const isRealId = moment?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(moment.id));
    if (isRealId) { try { supabase.rpc("increment_moment_views", { moment_id: moment.id }); } catch {} }
    // NAME-FIX: normalizePostForPreview → extractAuthor() sucht raw.profile/creator/author/user
    // — Moment-Objekt aus DiscoverPage hat aber nur flaches `name` Feld, kein profile-Objekt.
    // Ohne Injection fällt extractAuthor auf "Mitglied" zurück. Profil-Daten werden hier
    // aus den bereits geladenen Feldern (name, avatar_url, user_id) strukturiert.
    const item = normalizePostForPreview({
      ...moment,
      title: moment.caption,
      profile: {
        id: moment.user_id || "",
        full_name: moment.name || "",
        display_name: moment.name || "",
        avatar_url: moment.avatar_url || null,
      },
    }, "moment");
    if (item) openPreview(item);
  }, [openPreview]);

  // Erlebnis-Karte: öffne ExperienceBookingFlow (Detail + Buchen)
  const handleErlebnisPress = useCallback((erlebnis) => {
    const isRealId = erlebnis?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(erlebnis.id));
    if (isRealId) { try { supabase.rpc("increment_experience_views", { experience_id: erlebnis.id }); } catch {} }
    if (isRealId) {
      if (typeof onBook === "function") { onBook(erlebnis); return; }
    }
    const profileId = erlebnis.user_id;
    if (profileId && typeof onView === "function") onView(profileId);
  }, [onBook, onView]);

  // Projekt-Karte (OPEN.1, 2026-07-08): zeigte bisher IMMER nur die
  // allgemeine Impact-Seite, unabhaengig davon welches Projekt angetippt
  // wurde. Jetzt: Vorschau des konkreten Projekts (Name/Beschreibung/Bild);
  // "Vollstaendige Ansicht" fuehrt weiterhin zur Impact-Seite (keine eigene
  // Projekt-Detailroute vorhanden).
  const handleProjektPress = useCallback((projekt) => {
    // Seed-Karten (keine echte UUID) → kein Deep-Link (keine Detailseite verfügbar)
    const isRealId = projekt?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(projekt.id));
    if (!isRealId) return; // Seed-Karte: kein Klick-Effekt
    // Direkter Deep-Link zu /impact → ApprovedProjectDetail öffnet sich über
    // location.state.openProjectId (bestehender Mechanismus in ImpactPage.jsx)
    navigate("/impact", { state: { openProjectId: projekt.id } });
  }, [navigate]);

  // (makeScrollHandler entfernt 2026-08-06 — letzter Aufrufer war der 'Alle anzeigen'-Button der
  //  Menschen-Sektion, der zuvor sinnlos zur eigenen Sektion zurückscrollte statt ein echtes
  //  Modal zu öffnen. Ersetzt durch MenschenAllModal, siehe showMenschenModal.)

  // Modal-States (lazy — erst beim Öffnen initialisiert)
  const [showMenschenModal,   setShowMenschenModal]   = useState(false);

  // ── Deep-Link: "Menschen entdecken"-Button im Chat (ImpactCard) ──────────
  // openMenschenSignal ist ein hochzählender Counter aus Home.jsx. DiscoverPage
  // bleibt als Keep-Alive-Tab immer gemountet, daher öffnet jede Änderung des
  // Signals (auch wenn man schon auf dem Discover-Tab war) zuverlässig das
  // MenschenAllModal — statt nur zur eigenen Sektion zu springen.
  useEffect(() => {
    if (openMenschenSignal) setShowMenschenModal(true);
  }, [openMenschenSignal]);
  const [showWerkeModal,      setShowWerkeModal]      = useState(false);
  const [showTalenteModal,    setShowTalenteModal]     = useState(false);
  const [showErlebnisseModal, setShowErlebnisseModal]  = useState(false);
  const [showMomenteModal,    setShowMomenteModal]     = useState(false);
  const [showProjekteModal,   setShowProjekteModal]    = useState(false);
  const [showOrteModal,       setShowOrteModal]        = useState(false);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="dp-root" style={{
      width:"100%", background:T.bg,
      fontFamily:"Inter,sans-serif",
      color:T.ink,
      overscrollBehavior:"none",
    }}>
      <style>{CSS}</style>

      {/* ── 1. Titelbereich ── */}
      <DiscoverTitleBar />


      {/* ── 1b. Live Activity Bar ── */}
      <div style={{ marginBottom:8 }}>
        <HuiLiveTicker/>
      </div>

      {/* ── 3. Menschen entdecken ── */}
      {_showPeople && (
      <PeopleSection
        people={searchedPeople}
        onPersonPress={handlePersonPress}
        loading={loading}
        delay={60}
        view={view}
        onSectionAction={() => setShowMenschenModal(true)}
      />
      )}

      {/* ── 4. Momente aus deiner Nähe ── */}
      {_showMomente && (
      <MomenteSection
        momente={searchedMomente}
        loading={loading}
        delay={80}
        view={view}
        onPress={handleMomentPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowMomenteModal(true)}
      />
      )}

      {/* ── 4b. Talente entdecken ── */}
      {_showTalente && (
      <TalenteSection
        talente={searchedTalente}
        loading={loading}
        delay={90}
        view={view}
        onPress={handleTalentPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowTalenteModal(true)}
        locQuery={talentLocQuery}
        onLocQueryChange={setTalentLocQuery}
        locSuggest={talentLocSuggest}
        locSearching={talentLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickTalentLoc}
        onClearLoc={handleClearTalentLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />
      )}

      {/* ── 5. Werke entdecken ── */}
      {_showWerke && (
      <WerkeSection
        werke={searchedWerke}
        loading={loading}
        delay={100}
        view={view}
        onPress={handleWerkPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowWerkeModal(true)}
        locQuery={werkLocQuery}
        onLocQueryChange={setWerkLocQuery}
        locSuggest={werkLocSuggest}
        locSearching={werkLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickWerkLoc}
        onClearLoc={handleClearWerkLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={werkHiddenCount}
      />
      )}

      {/* ── 6. Erlebnisse für dich ── */}
      {_showErlebnisse && (
      <ErlebnisseSection
        erlebnisse={searchedErlebnisse}
        loading={loading}
        delay={120}
        view={view}
        onPress={handleErlebnisPress}
        onSectionAction={() => setShowErlebnisseModal(true)}
        locQuery={erlebnisLocQuery}
        onLocQueryChange={setErlebnisLocQuery}
        locSuggest={erlebnisLocSuggest}
        locSearching={erlebnisLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickErlebnisLoc}
        onClearLoc={handleClearErlebnisLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={erlebnisHiddenCount}
      />
      )}

      {/* ── 7. Projekte & Initiativen ── */}
      {_showProjekte && (
      <ProjekteSection
        projekte={searchedProjekte}
        loading={loading}
        delay={140}
        view={view}
        onPress={handleProjektPress}
        onSectionAction={() => setShowProjekteModal(true)}
      />
      )}

      {/* ── 8. Orte entdecken ── */}
      {_showOrte && (
      <OrteSection
        orte={orte}
        loading={loading}
        delay={160}
        onSectionAction={() => { setOrteInitialPlace(null); setShowOrteModal(true); }}
        onPressOrt={(placeKey) => { setOrteInitialPlace(placeKey); setShowOrteModal(true); }}
      />
      )}

      {/* ── No-Results Message bei aktiver Suche ── */}
      {_searchActive && !searchedPeople.length && !searchedMomente.length &&
       !searchedWerke.length && !searchedTalente.length && !searchedErlebnisse.length &&
       !searchedProjekte.length && (
        <div style={{ padding:"60px 24px", textAlign:"center", color:"rgba(26,53,48,0.38)" }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>{_t("discover.noResults")}</div>
          <div style={{ fontSize:13 }}>
            {_t("discover.noResultsQuery", { query: _searchQuery })}
            {_searchCats.length > 0 && _t("discover.tryOtherCats")}
          </div>
        </div>
      )}

      {/* ── Orb-Clearance-Spacer — letzter Scroll-Inhalt vor Modals.
           Verhindert Orb-Überlappung auf allen Geräten (Android + iOS). ── */}
      <div style={{ height: NAV_CONTENT_SPACER_CSS }} aria-hidden="true" />

      {/* Talent-Anfrage-Modal (Portal, siehe .agents/rules/footer-navbar-zindex.md) */}
      {talentInquiry && (
        <TalentAnfrageFlow talent={talentInquiry} onClose={() => setTalentInquiry(null)} />
      )}
      {talentBooking && (
        <>
          <TalentBookingFlow talent={talentBooking} onClose={() => setTalentBooking(null)} />
        </>
      )}

      {/* ── Alle-Ansehen-Modals (lazy, erst beim Öffnen geladen) ── */}
      <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}>
        <WerkeAllModal
          isOpen={showWerkeModal}
          onClose={() => setShowWerkeModal(false)}
          onPressItem={(werk) => {
            setShowWerkeModal(false);
            navigate(`/work/${werk.id}`);
          }}
        />
        <TalenteAllModal
          isOpen={showTalenteModal}
          onClose={() => setShowTalenteModal(false)}
          onPressTalent={(talent) => {
            setShowTalenteModal(false);
            const normalized = normalizeTalentForPreview(talent, talent._author);
            if (normalized) openPreview(normalized);
          }}
        />
        <ErlebnisseAllModal
          isOpen={showErlebnisseModal}
          onClose={() => setShowErlebnisseModal(false)}
          onPressItem={(exp) => {
            setShowErlebnisseModal(false);
            openPreview({ id:exp.id, type:"erlebnis", title:exp.title, experienceId:exp.id });
          }}
        />
        <MenschenAllModal
          isOpen={showMenschenModal}
          onClose={() => setShowMenschenModal(false)}
          onPressPerson={(person) => {
            setShowMenschenModal(false);
            if (person?.id && typeof onView === "function") onView(person.id);
          }}
        />
        <MomenteAllModal
          isOpen={showMomenteModal}
          onClose={() => setShowMomenteModal(false)}
          onPressItem={() => setShowMomenteModal(false)}
        />
        <ProjekteAllModal
          isOpen={showProjekteModal}
          onClose={() => setShowProjekteModal(false)}
          onPressItem={(proj) => {
            // Direkt zur vollständigen Impact-Projekt-Detailseite navigieren.
            // ApprovedProjectDetail in ImpactPage.jsx öffnet sich über den
            // Deep-Link-Mechanismus: location.state.openProjectId
            setShowProjekteModal(false);
            navigate("/impact", { state: { openProjectId: proj.id } });
          }}
        />
        <OrteAllModal
          isOpen={showOrteModal}
          onClose={() => setShowOrteModal(false)}
          initialPlace={orteInitialPlace}
          onPressPerson={(id) => {
            setShowOrteModal(false);
            if (id && typeof onView === "function") onView(id);
          }}
          onPressWork={(workId) => {
            setShowOrteModal(false);
            navigate(`/work/${workId}`);
          }}
          onPressExperience={(exp) => {
            setShowOrteModal(false);
            openPreview({ id:exp.id, type:"erlebnis", title:exp.title, experienceId:exp.id });
          }}
        />
      </Suspense>
    </div>
  );
}
