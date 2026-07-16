// src/pages/profile/discover/DiscoverPage.jsx — Businesslogik + Orchestrierung
// Sprint 10 Phase 3: UI-Module ausgelagert

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuthGate } from "../../../components/auth/AuthGate.jsx";
import TalentAnfrageFlow from "../../../components/talents/TalentAnfrageFlow.jsx";
import TalentBookingFlow from "../../../components/talents/TalentBookingFlow.jsx";
import { searchPlaces, distanceKm } from "../../../lib/geocoding.js";
import { useRadiusFilter } from "../../../hooks/useRadiusFilter.js";
const WerkeAllModal = lazy(() => import("../../../components/discover/WerkeAllModal.jsx"));
const TalenteAllModal = lazy(() => import("../../../components/discover/TalenteAllModal.jsx"));
const ErlebnisseAllModal = lazy(() => import("../../../components/discover/ErlebnisseAllModal.jsx"));
const MomenteAllModal = lazy(() => import("../../../components/discover/MomenteAllModal.jsx"));
const ProjekteAllModal = lazy(() => import("../../../components/discover/ProjekteAllModal.jsx"));
const OrteAllModal = lazy(() => import("../../../components/discover/OrteAllModal.jsx"));
import HuiLiveTicker from "../../../components/shared/HuiLiveTicker.jsx";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";
import { normalizePostForPreview, normalizeProjectForPreview, normalizeWirkerForPreview } from "../../../lib/previewNormalizers.js";
import { safeStr, safeNum } from "./utils.js";
import { T, CSS, SEED_PEOPLE, SEED_MOMENTE, SEED_TALENTE, SEED_WERKE, SEED_ERLEBNISSE, SEED_PROJEKTE } from "./tokens.js";
import { DiscoverTitleBar } from "./components/DiscoverTitleBar.jsx";
import { PeopleSection } from "./sections/PeopleSection.jsx";
import { MomenteSection } from "./sections/MomenteSection.jsx";
import { TalenteSection } from "./sections/TalenteSection.jsx";
import { WerkeSection } from "./sections/WerkeSection.jsx";
import { ErlebnisseSection } from "./sections/ErlebnisseSection.jsx";
import { ProjekteSection } from "./sections/ProjekteSection.jsx";
import { OrteSection } from "./sections/OrteSection.jsx";


function filterByRadius(items, radius, isOnlineFn) {
  if (!radius.geo || radius.isWorldwide) return { list: items, hidden: 0 };
  let hidden = 0;
  const list = items
    .map(item => {
      if (isOnlineFn(item)) return { ...item, distanceKm: null };
      if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
        return { ...item, distanceKm: distanceKm(radius.geo.lat, radius.geo.lng, item.lat, item.lng) };
      }
      return { ...item, distanceKm: undefined };
    })
    .filter(item => {
      if (isOnlineFn(item)) return true;
      if (item.distanceKm === undefined) { hidden++; return false; }
      return item.distanceKm <= radius.radiusKm;
    })
    .sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  return { list, hidden };
}

export default function DiscoverPage({ onView, onMap, onBook }) {
  const [view, setView]         = useState("cards"); // "cards" | "list"
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
  const [talentInquiry, setTalentInquiry] = useState(null);
  const [talentBooking, setTalentBooking] = useState(null); // ausgewaehltes Talent fuer Anfrage-Modal
  const { requireAuth } = useAuthGate();

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // People
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
          .or("has_talent_profile.eq.true,is_member.eq.true,role.eq.talent,role.eq.wirker")
          .order("created_at", { ascending:false })
          .limit(12);

        if (!cancelled && profiles?.length > 0) {
          setPeople(profiles.map(p => ({
            id:           p.id,
            name:         safeStr(p.display_name || p.username) || null,
            bio:          safeStr(p.bio),
            location:     safeStr(p.location_label), // Identity Contract v1.0
            avatar:       safeStr(p.avatar_url),
            impact:       safeNum(p.impact_eur, 0),
            last_seen_at: null, // last_seen_at nicht im Identity Contract
            interests:    [], // dna_tags/skills nicht im Identity Contract
          })));
        }

        // Momente (beitraege)
        const { data: beitr } = await supabase
          .from("beitraege")
          .select("id,src,type,caption,created_at,user_id")
          .order("created_at", { ascending:false })
          .limit(8);

        if (!cancelled && beitr?.length > 0) {
          setMomente(beitr.map(b => ({
            id:         b.id,
            user_id:    b.user_id,
            src:        safeStr(b.src),
            caption:    safeStr(b.caption, "Ein Moment"),
            type:       safeStr(b.type, "foto"),
            created_at: b.created_at,
            name:       "HUI Mitglied",
            location:   "",
          })));
        }

        // Werke — nur existierende DB-Felder (medium/media_url/likes_count existieren NICHT)
        // Felder: id, title, cover_url, category, file_format, tags, status, visibility, user_id, created_at
        const { data: ws, error: wsErr } = await supabase
          .from("works")
          .select("id,title,cover_url,category,file_format,tags,status,approval_status,visibility,price,location_text,lat,lng,user_id,created_at")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .eq("visibility", "public")
          .order("created_at", { ascending:false })
          .limit(8);

        if (wsErr) {
        }

        if (!cancelled && ws?.length > 0) {
          // file_format-Werte: 'original'|'druck'|'digital'
          // Mappen auf lesbare Labels für MEDIUM_COLOR-Fallback
          const FILE_FORMAT_LABEL = {
            original: "Original",
            druck:    "Druck",
            digital:  "Digital Art",
          };
          setWerke(ws.map(w => ({
            id:       w.id,
            user_id:  w.user_id || w.creator_id,
            title:    safeStr(w.title, "Werk"),
            cover:    safeStr(w.cover_url),
            medium:   FILE_FORMAT_LABEL[w.file_format] || safeStr(w.category, "Werk"),
            price:    w.price != null ? safeNum(w.price, 0) : null,
            location: safeStr(w.location_text),
            lat:      Number.isFinite(w.lat) ? w.lat : null,
            lng:      Number.isFinite(w.lng) ? w.lng : null,
            author:   "HUI Talent",
          })));
        } else if (!wsErr) {
          // Keine Werke in DB → setWerke([]) → displayWerke fällt auf SEED zurück
          if (!cancelled) setWerke([]);
        }

        // Talente — freigegebene Dienstleistungsangebote (TALENT-OFFERS-001/TALENT-SERVICES-001)
        // Oeffentlich sichtbar nur status='approved' (RLS deckt das zusaetzlich ab)
        const { data: tal, error: talErr } = await supabase
          .from("talents")
          .select("id,title,description,category,images,price_per_hour,price_per_session,currency,location_type,location_address,location_notes,map_link,lat,lng,user_id,created_at,available_dates,available_time_slots,recurring,duration_minutes,max_participants,min_participants,booking_type,booking_window_start,booking_window_end")
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
              .select("id,display_name,username")
              .in("id", providerIds);
            providerMap = Object.fromEntries((provs || []).map(p => [p.id, safeStr(p.display_name || p.username, "HUI Talent")]));
          }
          if (!cancelled) {
            setTalente(tal.map(t => ({
              id:                    t.id,
              user_id:               t.user_id,
              title:                 safeStr(t.title, "Talent-Angebot"),
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
              author:                providerMap[t.user_id] || "HUI Talent",
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
            })));
          }
        } else if (!talErr) {
          if (!cancelled) setTalente([]);
        }

        // Erlebnisse — korrigierte Feldnamen: location_text, max_participants
        const { data: exps, error: expsErr } = await supabase
          .from("experiences")
          .select("id,title,cover_url,date,duration,location_text,max_participants,status,approval_status,category,experience_type,format,lat,lng,user_id,created_at")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .order("created_at", { ascending:false })
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
            const dateStr = d ? d.toLocaleDateString("de-DE",{ day:"numeric", month:"short" }) : null;
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
            };
          }));
        } else if (!expsErr) {
          if (!cancelled) setErlebnisse([]);
        }

        // SYS-REFACTOR-023: totes impact_pool-Query entfernt (Ergebnis 'imp' wurde nie gelesen, keine Verhaltensaenderung)

        // Impact-Projekte — neueste zuerst (approved & aktiv)
        const { data: projData } = await supabase
          .from("impact_applications")
          .select("id,name,description,cover_url,category,vote_count,rank,funding_goal,current_amount_eur,status,created_at")
          .eq("status","approved")
          .order("created_at", { ascending:false })
          .limit(6);

        if (!cancelled && projData?.length > 0) {
          const CAT_COLOR = {
            natur:    { bg:"rgba(22,163,74,0.12)", text:"#16A34A" },
            tiere:    { bg:"rgba(217,119,6,0.12)",  text:"#D97706" },
            umwelt:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            kultur:   { bg:"rgba(99,102,241,0.12)", text:"#6366F1" },
            bildung:  { bg:"rgba(232,87,58,0.12)",  text:"#F47355" },
            sozial:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
          };
          setProjekte(projData.map(p => {
            const cat = (p.category || "").toLowerCase();
            const cc = CAT_COLOR[cat] || { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" };
            return {
              id:       p.id,
              title:    p.name || "Projekt",
              desc:     p.description || "",
              cat:      p.category || "Projekt",
              catColor: cc,
              cover:    p.cover_url || null,
              members:  p.vote_count || 0,
              rank:     p.rank || 0,
              funding_goal:       p.funding_goal || 0,
              current_amount_eur: p.current_amount_eur || 0,
            };
          }));
        }

      } catch (e) {
        console.warn("[DiscoverPage] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── People: DB oder Seed ─────────────────────────────────────
  const filteredPeople = people.length > 0 ? people : SEED_PEOPLE;

  const displayMomente    = momente.length > 0 ? momente : SEED_MOMENTE;
  const navigate           = useNavigate();
  const { open: openPreview } = useContentPreview(); // OPEN.1 2026-07-08
  const baseDisplayWerke      = werke.length > 0 ? werke : SEED_WERKE;
  const baseDisplayTalente    = talente.length > 0 ? talente : SEED_TALENTE;
  const baseDisplayErlebnisse = erlebnisse.length > 0 ? erlebnisse : SEED_ERLEBNISSE;

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

  const displayProjekte   = projekte.length > 0 ? projekte : SEED_PROJEKTE;

  // Person/Wirker-Karte (OPEN.4 2026-07-08): sprang bisher IMMER direkt aufs
  // Profil ohne jede Vorschau -- echte Luecke, da "alle Wirker" explizit zur
  // einheitlichen Vorschau gehoeren. Jetzt: Vorschau zuerst, "Vollstaendige
  // Ansicht" darin fuehrt zum Profil (bei echter UUID + Username), sonst
  // (Seed-Karten) bleibt nur die Vorschau ohne Profil-Sprung.
  const handlePersonPress = useCallback((person) => {
    const isRealId = person?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(person.id));
    const item = normalizeWirkerForPreview(person);
    if (item) {
      openPreview({
        ...item,
        canOpenFull: isRealId && !!person.username,
        fullPath: (isRealId && person.username) ? `/${person.username}` : null,
      });
      return;
    }
    if (typeof onView === "function") onView(person.id || person.user_id);
  }, [openPreview, onView]);

  // Werk-Karte: öffne Werk-Detailseite (nur bei echter DB-ID, nicht bei Seed-Daten)
  const handleWerkPress = useCallback((werk) => {
    const werkId = werk.id;
    // UUID-Prüfung: echte Supabase-IDs sind UUIDs (8-4-4-4-12)
    // Seed-IDs wie "w1","w2" sind keine UUIDs → kein Navigate
    const isRealId = werkId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(werkId));
    if (isRealId) {
      // Werke öffnen direkt WorkDetailPage (hat Bild, Preis, Kaufen-Button)
      // ContentPreviewSheet ist für Beiträge/Projekte, nicht für Werke
      navigate(`/work/${werkId}`);
    }
    // Seed-Karte: kein Navigate — kein "Werk nicht gefunden"
  }, [navigate]);

  // Talent-Karte: Anmeldung/Registrierung erzwingen (useAuthGate), danach Anfrage-Modal öffnen.
  // Seed-Karten (keine echte UUID) öffnen nach Login bewusst kein Modal (kein echter Anbieter dahinter).
  const handleTalentPress = useCallback((talent) => {
    const talentId = talent.id;
    const isRealId = talentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(talentId));
    // Hat das Angebot einen Preis (TALENT-SERVICES-001)? -> echte Buchung+Zahlung.
    // Sonst (kein Preis hinterlegt) -> Fallback auf die einfache Anfrage-Maske.
    const hasPrice = talent.price_per_hour != null || talent.price_per_session != null;
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
    const item = normalizePostForPreview({ ...moment, title: moment.caption }, "moment");
    if (item) openPreview(item);
  }, [openPreview]);

  // Erlebnis-Karte: öffne ExperienceBookingFlow (Detail + Buchen)
  const handleErlebnisPress = useCallback((erlebnis) => {
    const isRealId = erlebnis?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(erlebnis.id));
    if (isRealId) {
      // Erlebnisse direkt mit ExperienceBookingFlow öffnen (hat Bild, Beschreibung, Buchungs-Button)
      // ContentPreviewSheet ist für Beiträge/Projekte, nicht für buchbare Erlebnisse
      if (typeof onBook === "function") { onBook(erlebnis); return; }
    }
    // Seed-Karte oder kein onBook: Fallback auf Profil
    const profileId = erlebnis.user_id;
    if (profileId && typeof onView === "function") onView(profileId);
  }, [onBook, onView]);

  // Projekt-Karte (OPEN.1, 2026-07-08): zeigte bisher IMMER nur die
  // allgemeine Impact-Seite, unabhaengig davon welches Projekt angetippt
  // wurde. Jetzt: Vorschau des konkreten Projekts (Name/Beschreibung/Bild);
  // "Vollstaendige Ansicht" fuehrt weiterhin zur Impact-Seite (keine eigene
  // Projekt-Detailroute vorhanden).
  const handleProjektPress = useCallback((projekt) => {
    const item = normalizeProjectForPreview({
      id: projekt.id, name: projekt.title, description: projekt.desc,
      img_url: projekt.cover, category: projekt.cat, created_at: null,
    });
    if (item) openPreview(item);
  }, [openPreview]);

  // SectionHead "Alle ansehen →" → Modal öffnen
  const makeScrollHandler = useCallback((selector) => () => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  // Modal-States (lazy — erst beim Öffnen initialisiert)
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
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      color:T.ink,
      overscrollBehavior:"none",
    }}>
      <style>{CSS}</style>

      {/* ── 1. Titelbereich ── */}
      <DiscoverTitleBar view={view} onViewChange={setView} />

      {/* ── 1b. Live Activity Bar ── */}
      <div style={{ marginBottom:8 }}>
        <HuiLiveTicker/>
      </div>

      {/* ── 3. Menschen entdecken ── */}
      <PeopleSection
        people={filteredPeople}
        onPersonPress={handlePersonPress}
        loading={loading && people.length === 0}
        delay={60}
        view={view}
        onSectionAction={makeScrollHandler("[data-dp-people]")}
      />

      {/* ── 4. Momente aus deiner Nähe ── */}
      <MomenteSection
        momente={displayMomente}
        loading={loading && momente.length === 0}
        delay={80}
        view={view}
        onPress={handleMomentPress}
        onSectionAction={() => setShowMomenteModal(true)}
      />

      {/* ── 4b. Talente entdecken ── */}
      <TalenteSection
        talente={displayTalente}
        loading={loading && talente.length === 0}
        delay={90}
        view={view}
        onPress={handleTalentPress}
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

      {/* ── 5. Werke entdecken ── */}
      <WerkeSection
        werke={displayWerke}
        loading={loading && werke.length === 0}
        delay={100}
        view={view}
        onPress={handleWerkPress}
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

      {/* ── 6. Erlebnisse für dich ── */}
      <ErlebnisseSection
        erlebnisse={displayErlebnisse}
        loading={loading && erlebnisse.length === 0}
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

      {/* ── 7. Projekte & Initiativen ── */}
      <ProjekteSection
        projekte={displayProjekte}
        loading={loading}
        delay={140}
        view={view}
        onPress={handleProjektPress}
        onSectionAction={() => setShowProjekteModal(true)}
      />

      {/* ── 8. Orte entdecken ── */}
      <OrteSection onMap={onMap} delay={160} view={view} />

      {/* Talent-Anfrage-Modal (Portal, siehe .agents/rules/footer-navbar-zindex.md) */}
      {talentInquiry && (
        <TalentAnfrageFlow talent={talentInquiry} onClose={() => setTalentInquiry(null)} />
      )}
      {talentBooking && (
        <TalentBookingFlow talent={talentBooking} onClose={() => setTalentBooking(null)} />
      )}

      {/* ── Alle-Ansehen-Modals (lazy, erst beim Öffnen geladen) ── */}
      <Suspense fallback={null}>
        <WerkeAllModal
          isOpen={showWerkeModal}
          onClose={() => setShowWerkeModal(false)}
          onPressItem={(werk) => {
            setShowWerkeModal(false);
            openPreview({ id:werk.id, type:"werk", title:werk.title, cover:werk.cover_url, workId:werk.id });
          }}
        />
        <TalenteAllModal
          isOpen={showTalenteModal}
          onClose={() => setShowTalenteModal(false)}
          onPressTalent={(talent) => {
            setShowTalenteModal(false);
            openPreview({ id:talent.id, type:"talent", title:talent.title, talentId:talent.id });
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
        <MomenteAllModal
          isOpen={showMomenteModal}
          onClose={() => setShowMomenteModal(false)}
          onPressItem={() => setShowMomenteModal(false)}
        />
        <ProjekteAllModal
          isOpen={showProjekteModal}
          onClose={() => setShowProjekteModal(false)}
          onPressItem={(proj) => {
            setShowProjekteModal(false);
            openPreview({ id:proj.id, type:"projekt", title:proj.name, projectId:proj.id });
          }}
        />
        <OrteAllModal
          isOpen={showOrteModal}
          onClose={() => setShowOrteModal(false)}
        />
      </Suspense>
    </div>
  );
}
