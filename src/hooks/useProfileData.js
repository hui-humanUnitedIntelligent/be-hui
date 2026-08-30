// src/hooks/useProfileData.js
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE DATA LAYER — Sprint A + Instant-Render (2026-07-28)
// ──────────────────────────────────────────────────────────────────────
// Phase 1 (sofort): profiles + followCounts → Header rendert instant
// Phase 2 (lazy):   moments + recommendations → erst wenn angefragt
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { ProfileService } from '../services/db';
import { readCache, readPersistedProfile, writePersistedProfile } from "../lib/perfUtils.js";
import { supabase } from "../lib/supabaseClient.js";


// ── Felder ────────────────────────────────────────────────────────────
// SICHERHEIT: phone entfernt aus öffentlichem Profil-Load (2026-07-29)
// PRIVAT: phone wird nur geladen wenn includePrivate=true (eigenes Profil)
const PROFILE_SELECT_PUBLIC = "id,display_name,full_name,username,avatar_url,header_img,bio,location,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views,website,tagline,skills,is_available,hourly_rate,focus_type,account_type,managed_by,org_name,org_type,org_number,org_description,owner_user_id";
const PROFILE_SELECT_PRIVATE = PROFILE_SELECT_PUBLIC;

const WORKS_SELECT =
  "id,user_id,title,cover_url,category,status," +
  "approval_status,price,for_sale,visibility,created_at";

// ERLEBNIS-INFO-FIX (2026-08-15, Michael-Report — Screenshot "Versteckis mit
// Hunden"): "Uhrzeit fehlt, füge alles Informative hinzu". ROOT CAUSE: Diese
// SELECT-Liste (genutzt vom SSOT useProfileData-Hook für ALLE Profilseiten
// via ExperiencesSection.jsx → ContentPreviewSheet) hatte weder time_start/
// time_end noch caption/description/meeting_point/Platz-Infos ausgewählt --
// die Vorschau konnte diese Felder nicht zeigen, obwohl sie in der DB laengst
// vorhanden waren (siehe useFeedStream.js EXPERIENCES-Select, das bereits
// vollstaendiger war). Additiv ergaenzt, keine bestehende Spalte entfernt.
const EXPERIENCES_SELECT =
  "id,user_id,title,cover_url,category,date,status," +
  "approval_status,visibility,format,location_text,price,duration,created_at," +
  "caption,description,time_start,time_end,meeting_point,spots_available," +
  "max_participants,currency,price_per,registration_required";

const RECOMMENDATIONS_SELECT =
  "id,from_user_id,to_user_id,text,is_public,order_id,booking_id,deleted_at,created_at,is_positive";

const MOMENTS_SELECT =
  "id,user_id,src,type,moment_source,caption,content,created_at,moderation_blurred,moderation_flag";

// ── Hilfsfunktionen ───────────────────────────────────────────────────
function mergeUnique(primary = [], secondary = []) {
  const normalize = (v) => {
    if (typeof v === "string") return v.trim().toLowerCase();
    if (typeof v === "object" && v !== null) return (v.label || v.name || "").trim().toLowerCase();
    return "";
  };
  const seen = new Set(primary.map(normalize).filter(Boolean));
  const result = [...primary];
  for (const item of secondary) {
    const key = normalize(item);
    if (key && !seen.has(key)) { seen.add(key); result.push(item); }
  }
  return result;
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => (typeof s === "string" ? { icon: "✨", label: s } : s)).filter(Boolean);
}

// ── Main Hook ─────────────────────────────────────────────────────────
export function useProfileData(profileId, includePrivate = false) {
  const [profile,         setProfile]         = useState(null);
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const [works,           setWorks]           = useState([]);
  const [experiences,     setExperiences]     = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [moments,         setMoments]         = useState([]);
  const [worksSaleStatus, setWorksSaleStatus] = useState({}); // {workId: "verkauft"|"reserviert"|null}
  const [followCounts,    setFollowCounts]    = useState({ followers: 0, following: 0 });

  // Phase-1 = Profil + followCounts loaded; Phase-2 = lazy content loaded
  const [loading,         setLoading]         = useState(!!profileId);
  const [loadingLazy,     setLoadingLazy]     = useState(false);
  const [error,           setError]           = useState(null);

  const requestId     = useRef(0);
  const lazyRequestId = useRef(0);

  // ── PHASE 1: Profil + followCounts (instant) ──────────────────────
  // INSTANT-RENDER: Prewarm-Cache synchron prüfen → Profil sofort rendern
  // Volle Daten werden im Hintergrund nachgeladen und aktualisiert
  const load = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    // 1. Prewarm-Cache synchron lesen (kein Network, <1ms)
    const prewarmData = readCache(`prewarm:${profileId}`);
    if (prewarmData?.data) {
      const raw = prewarmData.data;
      const normalizedProfile = {
        ...raw,
        avatar_url: raw.avatar_url || null,
        header_img: raw.header_img || null,
        location_final: (raw.location || "").trim(),
        skills_final: normalizeSkills(raw.skills),
        is_talent: raw.has_talent_profile === true,
      };
      setProfile(normalizedProfile);
      setFollowCounts({
        followers: raw.followers_count ?? 0,
        following: 0,
      });
      setLoading(false); // → Instant Render mit Prewarm-Daten
    }

    // 1b. HEADER-INSTANT-FIX (2026-08-10): Falls der In-Memory-Prewarm-Cache
    // leer ist (z.B. nach App-Neustart — passiert v.a. beim eigenen Profil,
    // das nie über eine Discover-Karte vorgewärmt wird), zweite Instant-
    // Render-Stufe aus dem persistenten localStorage-Cache. Zeigt sofort die
    // zuletzt bekannten Avatar/Cover-Daten, bevor der Netzwerk-Request
    // überhaupt gestartet ist. Wird unten nach erfolgreichem Fetch mit
    // frischen Daten überschrieben.
    let persistedProfile = null;
    if (!prewarmData?.data) {
      persistedProfile = readPersistedProfile(profileId);
      if (persistedProfile) {
        setProfile(persistedProfile);
        setFollowCounts({
          followers: persistedProfile.followers_count ?? 0,
          following: 0,
        });
        setLoading(false); // → Instant Render mit persistierten Daten
      }
    }

    // 2. Volle Daten asynchron nachladen (Hintergrund)
    const myId = ++requestId.current;
    if (!prewarmData?.data && !persistedProfile) setLoading(true);
    setError(null);

    try {
      const TIMEOUT_MS = 3000;
      const timeoutGuard = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("profile timeout")), TIMEOUT_MS)
      );

      // Profil-Query — OHNE follow_counts (entkoppelt, fire-and-forget)
      const profileRes = await Promise.race([
        (includePrivate
          ? supabase.from("profiles").select(PROFILE_SELECT_PRIVATE).eq("id", profileId).maybeSingle()
              .then(r => ({ data: r.data, error: r.error }))
              .catch(() => ({ data: null, error: { message: "profiles load failed" } }))
          : ProfileService.getById(profileId)
            .catch(() => ({ data: null, error: { message: "profiles load failed" } }))),
        timeoutGuard,
      ]);

      // follow_counts — fire-and-forget, blockiert niemals das Profil-Rendering
      supabase
        .rpc("get_follow_counts", { target_id: profileId })
        .then(r => {
          if (r?.data?.[0]) {
            setFollowCounts(prev => ({
              followers: r.data[0].followers ?? prev.followers ?? 0,
              following: r.data[0].following ?? prev.following ?? 0,
            }));
          }
        })
        .catch(() => {});
      if (myId !== requestId.current) {
        return;
      }

      if (profileRes.error || !profileRes.data) {
        // Nur Fehler setzen wenn wir keine Prewarm- ODER persistierten Daten haben
        if (!prewarmData?.data && !persistedProfile) {
          setError(profileRes.error?.message || "Profil nicht gefunden");
          setLoading(false);
        }
        return;
      }

      const raw = profileRes.data;

      const location_final = (raw.location || "").trim();
      const skills_final   = normalizeSkills(raw.skills);

      const normalizedProfile = {
        ...raw,
        avatar_url:     raw.avatar_url || null,
        header_img:     raw.header_img || null,
        location_final,
        skills_final,
        is_talent: raw.has_talent_profile === true,
      };

      setProfile(normalizedProfile);
      setWirkerProfile(null); // wirker_profiles = Legacy-Stub
      setFollowCounts(prev => ({
        followers: raw.followers_count ?? prev.followers ?? 0,
        following: prev.following ?? 0,
      }));
      // HEADER-INSTANT-FIX: frische Daten persistieren für den nächsten App-Start
      writePersistedProfile(profileId, normalizedProfile);

    } catch (err) {
      if (myId !== requestId.current) return;
      setError(err?.message || "Unbekannter Fehler");
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
  }, [profileId]);

  // ── PHASE 2: Lazy-Content (moments, recommendations, works, exp) ──
  // Wird aufgerufen wenn der Nutzer eine Section öffnet/scrollt
  const lazyInFlight = useRef(false);
  const loadLazy = useCallback(async () => {
    if (!profileId) return;
    if (lazyInFlight.current) return; // ref-guard: kein Stale-Closure-Problem
    lazyInFlight.current = true;

    const myId = ++lazyRequestId.current;
    setLoadingLazy(true);

    try {
      const TIMEOUT_MS = 5000;
      const timeoutGuard = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("lazy timeout")), TIMEOUT_MS)
      );

      const [worksRes, expsRes, recsRes, momentsRes] = await Promise.race([
        Promise.all([
          // works
          supabase
            .from("works")
            .select(WORKS_SELECT)
            .eq("user_id", profileId)
            .not("status", "eq", "deleted")
            .order("created_at", { ascending: false })
            .limit(30)
            .then(r => r)
            .catch(() => ({ data: [] })),

          // experiences
          supabase
            .from("experiences")
            .select(EXPERIENCES_SELECT)
            .eq("user_id", profileId)
            .not("status", "eq", "deleted")
            .order("created_at", { ascending: false })
            .limit(30)
            .then(r => r)
            .catch(() => ({ data: [] })),

          // recommendations
          supabase
            .from("recommendations")
            .select(RECOMMENDATIONS_SELECT)
            .eq("to_user_id", profileId)
            .eq("is_public", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(r => r)
            .catch(() => ({ data: [] })),

          // moments (beitraege) — nur öffentliche
          supabase
            .from("beitraege")
            .select(MOMENTS_SELECT)
            .eq("user_id", profileId)
            .eq("visibility_scope", "public")
            .order("created_at", { ascending: false })
            .limit(16)
            .then(r => r)
            .catch(() => ({ data: [] })),
        ]),
        timeoutGuard,
      ]);

      if (myId !== lazyRequestId.current) return;

      const worksData = Array.isArray(worksRes.data) ? worksRes.data : [];
      setWorks(worksData);

      // WORK-SALE-STATUS-001 (2026-08-22): Sale-Status für Werke abrufen
      // (verkauft/reserviert) — non-blocking, überschreibt nicht die Werke selbst
      if (worksData.length > 0) {
        const workIds = worksData.map(w => w.id).filter(Boolean);
        supabase
          .rpc("rpc_get_works_sale_status", { p_work_ids: workIds })
          .then(({ data: statusRows }) => {
            if (myId !== lazyRequestId.current) return;
            const statusMap = {};
            (statusRows || []).forEach(r => {
              if (r.sale_status) statusMap[r.work_id] = r.sale_status;
            });
            setWorksSaleStatus(statusMap);
          })
          .catch(() => {}); // Non-blocking — kein Sale-Status = kein Badge
      }
      setExperiences(Array.isArray(expsRes.data) ? expsRes.data : []);
      setMoments(momentsRes.data || []);

      // Recommendations: SOFORT setzen (ohne from_profile), dann enrichment
      const recsRaw = Array.isArray(recsRes.data) ? recsRes.data : [];
      // Phase 2a: sofort setzen — garantiert sichtbar auch wenn enrichment fehlschlägt
      setRecommendations(recsRaw.map(r => ({ ...r, from_profile: null })));

      // Phase 2b: from_profile nachladen (non-blocking, überschreibt nicht die Recommendation selbst)
      if (recsRaw.length > 0) {
        const fromIds = [...new Set(recsRaw.map(r => r.from_user_id).filter(Boolean))];
        supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url")
          .in("id", fromIds.slice(0, 20))
          .then(({ data: authorProfiles }) => {
            if (myId !== lazyRequestId.current) return;
            const authorMap = {};
            (authorProfiles || []).forEach(p => { authorMap[p.id] = p; });
            setRecommendations(prev => prev.map(r => ({
              ...r,
              from_profile: authorMap[r.from_user_id] || r.from_profile || null,
            })));
          })
          .catch(() => {});
      }

    } catch (err) {
      // Lazy-Fehler = kein UI-Crash, nur leere Sections
      console.warn("[useProfileData] lazy load failed:", err?.message);
    } finally {
      if (myId === lazyRequestId.current) setLoadingLazy(false);
      lazyInFlight.current = false;
    }
  }, [profileId]); // loadingLazy excluded — lazyInFlight ref guards against double-call

  useEffect(() => {
    load();
    // Lazy-Content zurücksetzen wenn profileId wechselt
    setWorks([]);
    setExperiences([]);
    setMoments([]);
    setRecommendations([]);
    setWorksSaleStatus({});
    lazyRequestId.current = 0;
    setLoadingLazy(false);
    lazyInFlight.current = false;
  }, [profileId]); // load bewusst nicht in deps — load ist stabil via useCallback

  // ── Follow-Count Refresh ──────────────────────────────────────────
  useEffect(() => {
    if (!profileId || typeof profileId !== "string" || profileId === "null") return;

    const refreshCounts = async () => {
      try {
        const { data } = await supabase.rpc("get_follow_counts", { target_id: profileId });
        setFollowCounts({
          followers: data?.[0]?.followers ?? 0,
          following: data?.[0]?.following ?? 0,
        });
      } catch (_) {}
    };

    window.addEventListener("hui:follow:changed", refreshCounts);
    return () => window.removeEventListener("hui:follow:changed", refreshCounts);
  }, [profileId]);

  return {
    profile,
    wirkerProfile,
    works,
    experiences,
    recommendations,
    moments,
    worksSaleStatus,
    followCounts,
    loading,
    loadingLazy,
    error,
    reload: load,
    loadLazy, // neu: von Sections aufzurufen
  };
}

export function filterWorksForPublic(works = []) {
  return works.filter(w => w.approval_status === "approved");
}
