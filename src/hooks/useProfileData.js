// src/hooks/useProfileData.js
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE DATA LAYER — Sprint A
// ──────────────────────────────────────────────────────────────────────
// Single Source of Truth für alle Profilseiten:
//   MyBasisProfile · TalentProfilePage · BasisProfilePage
//   WirkerProfilePage · TalentProfilePage · BasisProfilePage
//
// SINGLE SOURCE OF TRUTH (dokumentiert, noch keine Migration):
//   Avatar  → profiles.avatar_url        (wirker_profiles.avatar_url  REDUNDANT)
//   Cover   → profiles.header_img        (wirker_profiles.header_img  REDUNDANT)
//   Skills  → profiles.skills            (PRIMARY)
//   Cats    → wirker_profiles.categories (Wirker-Feature — NICHT in skills_final)
//   Standort→ wirker_profiles.location_label > profiles.location
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { ProfileService } from '../services/db';
import { supabase } from "../lib/supabaseClient.js";

// ── Felder ────────────────────────────────────────────────────────────
// Sprint F.7B: impact_eur + follower_count ergänzt (DB-bestätigt via SearchCommandCenter, WorkDetailPage)
// Identity Contract v1.0: PROFILE_SELECT → CANONICAL
const PROFILE_SELECT = "id,display_name,full_name,username,avatar_url,header_img,bio,location,location_label,member_since,role,has_talent_profile,is_ambassador,talent,membership_type,membership_active,followers_count,impact_eur,profile_views,phone,website,tagline,skills,is_available,hourly_rate,focus_type";

const WIRKER_SELECT =
  // Sprint F.4D.1: avatar_url + header_img ENTFERNT
  // Wahrheitsquelle: profiles.avatar_url + profiles.header_img
  // wirker_profiles.avatar_url/.header_img werden nie geschrieben → Legacy
  "id,user_id,slug,talent,categories,location_label," +
  "hourly_rate,is_verified,rating_avg,booking_count";

// WORKS_SELECT — geprüfte Felder (Sprint E.11)
// NICHT hinzufügen: medium (existiert nicht in der works-Tabelle)
const WORKS_SELECT =
  "id,user_id,title,cover_url,category,status," +
  "approval_status,price,for_sale,visibility,created_at";

const EXPERIENCES_SELECT =
  "id,user_id,title,cover_url,category,date,status," +
  "approval_status,visibility,format,location_text,price,duration,created_at";

// recommendations.from_user_id referenziert auth.users (nicht profiles) → kein PostgREST-Join möglich
// from_profile wird separat nachgeladen wenn benötigt
const RECOMMENDATIONS_SELECT =
  "id,from_user_id,to_user_id,text,is_public,created_at";

const MOMENTS_SELECT =
  "id,user_id,src,type,caption,created_at";

// ── Hilfsfunktionen ───────────────────────────────────────────────────

/** Duplikate aus zwei String-Arrays entfernen (case-insensitive) */
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

/** Kategorien aus wirker_profiles normalisieren */
function normalizeCats(cats) {
  if (!Array.isArray(cats)) return [];
  return cats.map(c => (typeof c === "string" ? { icon: "✨", label: c } : c)).filter(Boolean);
}

/** Skills aus profiles normalisieren */
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => (typeof s === "string" ? { icon: "✨", label: s } : s)).filter(Boolean);
}

// ── Main Hook ─────────────────────────────────────────────────────────

/**
 * useProfileData(profileId)
 *
 * Lädt alle Profildaten zentral. Gibt normalisierte Daten zurück inkl.:
 *   profile.location_final  — wirker_profiles.location_label > profiles.location
 *   profile.skills_final    — normalizeSkills(profiles.skills) — einzige Wahrheitsquelle
 *   profile.avatar_url      — immer aus profiles (Single Source of Truth)
 *   profile.header_img      — immer aus profiles (Single Source of Truth)
 *
 * @param {string|null} profileId  — UUID des Users. null → kein Load.
 */
export function useProfileData(profileId) {
  const [profile,      setProfile]      = useState(null);
  const [wirkerProfile,setWirkerProfile]= useState(null);
  const [works,        setWorks]        = useState([]);
  const [experiences,  setExperiences]  = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [moments,      setMoments]      = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  // Laufende Request-ID — verhindert Race Conditions
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const myId = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      // ── Gesamt-Timeout: 5s — verhindert ewigen Spinner ───────────
      const TIMEOUT_MS = 2800;
      const timeoutGuard = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("useProfileData timeout")), TIMEOUT_MS)
      );

      // ── Alle Queries parallel ────────────────────────────────────
      const [
        profileRes,
        wpRes,
        worksRes,
        expsRes,
        projsRes,
        recsRes,
        momentsRes,
        fcRes,
      ] = await Promise.race([
        Promise.all([

        // 1. profiles — ProfileService v1.0
        ProfileService.getById(profileId)
          .catch(() => ({ data: null, error: { message: "profiles load failed" } })),

        // 2. wirker_profiles — Tabelle existiert nicht mehr, Legacy-Stub
        Promise.resolve({ data: null }),

        // 3. works — kein Status-Filter (Creator sieht alles, Fremdprofil filtert selbst)
        supabase
          .from("works")
          .select(WORKS_SELECT)
          .eq("user_id", profileId)
          .not("status", "eq", "deleted")
          .order("created_at", { ascending: false })
          .limit(30)
          .then(r => r)
          .catch(() => ({ data: [] })),

        // 4. experiences — kein Status-Filter (approval_status für Live-Badge erforderlich)
        supabase
          .from("experiences")
          .select(EXPERIENCES_SELECT)
          .eq("user_id", profileId)
          .not("status", "eq", "deleted")
          .order("created_at", { ascending: false })
          .limit(30)
          .then(r => r)
          .catch(() => ({ data: [] })),

        // 4b. impact_projects — Spalten verifiziert (kein user_id/title/cover_url/approval_status in DB)
        // impact_projects sind global, kein user_id-Filter möglich
        Promise.resolve({ data: [] }), // Platzhalter: impact_projects ohne user_id-FK

        // 5. recommendations — FK: to_user_id (Sprint F.4B.2 — einzige Wahrheitsquelle)
        supabase
          .from("recommendations")
          .select(RECOMMENDATIONS_SELECT)
          .eq("to_user_id", profileId)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(r => r)
          .catch(() => ({ data: [] })),

        // 6. moments (beitraege)
        supabase
          .from("beitraege")
          .select(MOMENTS_SELECT)
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .limit(16)
          .then(r => r)
          .catch(() => ({ data: [] })),

        // 7. followCounts RPC
        supabase
          .rpc("get_follow_counts", { target_id: profileId })
          .then(r => r)
          .catch(() => ({ data: null })),
        ]),
        timeoutGuard,
      ]);

      // Race-Condition-Schutz
      if (myId !== requestId.current) return;

      // ── Fehlerbehandlung ──────────────────────────────────────────
      if (profileRes.error || !profileRes.data) {
        setError(profileRes.error?.message || "Profil nicht gefunden");
        setLoading(false);
        return;
      }

      const raw = profileRes.data;
      const wp  = wpRes.data || null;

      // ── Normalisierung ────────────────────────────────────────────

      // location_final: profiles.location (einzige Wahrheitsquelle — Sprint F.3B)
      // wirker_profiles.location_label ist Legacy und wird NICHT mehr bevorzugt
      const location_final = (raw.location || "").trim();

      // skills_final: profiles.skills (einzige Wahrheitsquelle — Sprint F.3C)
      // wirker_profiles.categories ist ein separates Wirker-Feature und fließt
      // NICHT mehr in skills_final ein — kein categories-Merge
      const skills_final = normalizeSkills(raw.skills);

      // Normalisiertes Profil-Objekt
      // HINWEIS: avatar_url + header_img kommen AUSSCHLIESSLICH aus profiles
      // wirker_profiles.avatar_url / .header_img werden IGNORIERT (redundant, dokumentiert)
      const normalizedProfile = {
        ...raw,
        // explizit überschreiben — Single Source of Truth sicherstellen
        avatar_url:     raw.avatar_url  || null,
        header_img:     raw.header_img  || null,
        // normalisierte Felder
        location_final,
        skills_final,
        // Talent-Flag normalisieren
        is_talent: raw.has_talent_profile === true, // normalisiert aus has_talent_profile (is_talent nicht in DB)
      };

      setProfile(normalizedProfile);
      setWirkerProfile(wp);


      // ── Regressionsschutz: Schema-Fehler sofort sichtbar machen ──
      if (worksRes.error) {
        console.error('[WORKS QUERY FAILED]', worksRes.error);
      }
      setWorks(Array.isArray(worksRes.data) ? worksRes.data : []);
      // Merge experiences + projects (beide mit _source Tag versehen)
      const expsTagged  = (expsRes.data  || []).map(e => ({ ...e, _source: "experiences" }));
      const projsTagged = (projsRes.data || []).map(p => ({ ...p, _source: "projects" }));
      const merged = [...expsTagged, ...projsTagged]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setExperiences(merged);
      if (recsRes.error) {
        console.error("[RECOMMENDATIONS QUERY FAILED]", recsRes.error);
      }
      // Autoren-Namen batch-laden (FK zu auth.users → kein PostgREST-JOIN möglich)
      {
        const recsRaw = (recsRes.data || []).filter(Boolean);
        if (recsRaw.length > 0 && myId === requestId.current) {
          const authorIds = [...new Set(recsRaw.map(r => r.from_user_id).filter(Boolean))];
          let authorMap = {};
          if (authorIds.length > 0) {
            try {
              const { data: authorProfiles } = await supabase
                .from("profiles")
                .select("id,display_name,avatar_url")
                .in("id", authorIds);
              (authorProfiles || []).forEach(p => { authorMap[p.id] = p; });
            } catch (_) { /* noop */ }
          }
          setRecommendations(recsRaw.map(r => ({
            ...r,
            from_profile: authorMap[r.from_user_id] || null,
          })));
        } else {
          setRecommendations([]);
        }
      }
      setMoments(momentsRes.data    || []);
      setFollowCounts({
        followers: fcRes.data?.[0]?.followers ?? 0,
        following: fcRes.data?.[0]?.following ?? 0,
      });

    } catch (err) {
      if (myId !== requestId.current) return;
      console.error("[useProfileData] Unerwarteter Fehler:", err);
      setError(err?.message || "Unbekannter Fehler");
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Realtime: Follower-Counts live aktualisieren ──────────────────
  // Subscribt auf INSERT/DELETE in der follows-Tabelle für diesen Nutzer.
  // Bei jeder Änderung wird nur der follow-Count-RPC neu abgerufen (kein
  // kompletter Reload) → sofortige Anzeige ohne Seitenneuladen.
  useEffect(() => {
    if (!profileId) return;

    const refreshCounts = async () => {
      try {
        const { data } = await supabase
          .rpc("get_follow_counts", { target_id: profileId });
        setFollowCounts({
          followers: data?.[0]?.followers ?? 0,
          following: data?.[0]?.following ?? 0,
        });
      } catch (_) { /* noop */ }
    };

    // Kanal: Änderungen wenn jemand diesem Nutzer folgt oder entfolgt
    const channel = supabase
      .channel(`follows:profile:${profileId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "follows",
        filter: `followed_id=eq.${profileId}`,
      }, refreshCounts)
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "follows",
        filter: `followed_id=eq.${profileId}`,
      }, refreshCounts)
      // Eigene Following-Zahl: wenn dieser Nutzer jemandem folgt/entfolgt
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "follows",
        filter: `follower_id=eq.${profileId}`,
      }, refreshCounts)
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "follows",
        filter: `follower_id=eq.${profileId}`,
      }, refreshCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return {
    profile,
    wirkerProfile,
    works,
    experiences,
    recommendations,
    moments,
    followCounts,
    loading,
    error,
    reload: load,
  };
}

// ── Convenience-Exports ───────────────────────────────────────────────

/**
 * Hilfsfunktion: works nach Sichtbarkeit filtern
 * Fremdprofil: nur approved; Creator: alle außer deleted (bereits in Query)
 */
export function filterWorksForPublic(works = []) {
  // Nur wirklich freigegebene Werke sind öffentlich sichtbar.
  // Ein bereits veröffentlichtes Werk das bearbeitet wurde hat:
  //   status="pending_review", approval_status="pending" → NICHT sichtbar
  // Erst nach Admin-Freigabe: approval_status="approved" → sichtbar
  return works.filter(w =>
    w.approval_status === "approved"
  );
}

/**
 * Hilfsfunktion: experiences nach Sichtbarkeit filtern
 * Fremdprofil: nur published/active/approved
 */
export function filterExperiencesForPublic(exps = []) {
  // Nur freigegebene Erlebnisse/Projekte sind öffentlich sichtbar.
  // approval_status="approved" ist Pflicht — sonst pending/rejected nicht anzeigen.
  return exps.filter(e =>
    e.approval_status === "approved"
  );
}
