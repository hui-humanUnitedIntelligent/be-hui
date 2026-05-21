// trustContext.js — HUI Trust & Reputation Layer v1.0
// Phase 3C: Kreative Glaubwürdigkeit — kein Freelancer-Ranking
//
// PHILOSOPHIE:
// Trust entsteht durch echte Zusammenarbeit, nicht durch Sterne.
// Signale sind subtil, human formuliert, kontext-sensitiv.
// Kein Gamification. Kein Level-System. Kein Score.
//
// KERN-TABELLEN:
// recommendations   — tiefe, menschliche Empfehlungen
// trust_events      — Vertrauens-Geschichte eines Creators
// collaborations    — verifizierte Zusammenarbeits-Historie

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// ────────────────────────────────────────────────────────────────
// REPUTATION SIGNALS — menschlich formuliert, keine Zahlen
// ────────────────────────────────────────────────────────────────
export const REPUTATION_QUALITIES = {
  // Verlässlichkeit
  quick_response:        { label: "Präsent & erreichbar",             icon: "⚡", category: "reliability" },
  high_completion:       { label: "Schöne Begegnungen entstehen",icon: "✦",  category: "reliability" },
  trusted_communication: { label: "Kommuniziert mit Herz",icon: "💬", category: "reliability" },
  // Zusammenarbeit
  creative_collab:       { label: "Kreativität entsteht gemeinsam",     icon: "🤝", category: "collaboration" },
  repeat_clients:        { label: "Begegnungen die bleiben",icon: "↩",  category: "collaboration" },
  community_active:      { label: "Lebt Gemeinschaft",            icon: "✦",  category: "collaboration" },
  // Qualität
  frequently_recommended:{ label: "Wird oft weiterempfohlen ✦",  icon: "✦",  category: "quality" },
  project_verified:      { label: "Geteilte Begegnungen ✦",      icon: "🌱", category: "quality" },
  long_term_collab:      { label: "Echte Verbindungen entstehen", icon: "🌱", category: "quality" },
};

// Collab-Typen für Recommendations
export const COLLAB_MOODS = [
  "ruhig und tief", "kreativ", "menschlich", "inspirierend",
  "experimentell", "still und konzentriert", "intensiv", "spielerisch",
];

export const OUTCOME_QUALITIES = [
  "eine schöne Begegnung",
  "außergewöhnlich berührend",
  "genau das, was ich mir gewünscht habe",
  "hat mich tief beeindruckt",
  "eine einzigartige Resonanz",
];

// ────────────────────────────────────────────────────────────────
// computeReputationSignals — aus DB-Daten Trust-Signale berechnen
// Gibt max. 4 Signale zurück — sehr subtil, keine Zahlenwand
// ────────────────────────────────────────────────────────────────
export function computeReputationSignals(profile, collabs = [], recs = []) {
  const signals = [];

  // Verlässlichkeit
  if (profile?.avg_response_time_h != null && profile.avg_response_time_h <= 3) {
    signals.push(REPUTATION_QUALITIES.quick_response);
  }
  if ((profile?.verified_collab_count || 0) >= 3) {
    signals.push(REPUTATION_QUALITIES.high_completion);
  }

  // Zusammenarbeit
  if ((profile?.repeat_client_count || 0) >= 2) {
    signals.push(REPUTATION_QUALITIES.repeat_clients);
  }
  if ((profile?.collab_count || 0) >= 5) {
    signals.push(REPUTATION_QUALITIES.community_active);
  }

  // Qualität
  const verifiedRecs = recs.filter(r => r.is_verified);
  if (verifiedRecs.length >= 2) {
    signals.push(REPUTATION_QUALITIES.frequently_recommended);
  }
  if ((profile?.verified_collab_count || 0) >= 1) {
    signals.push(REPUTATION_QUALITIES.project_verified);
  }

  // Langfristige Zusammenarbeit (mind. 1 Repeat-Client)
  const repeatCollabs = collabs.filter(c => c.is_repeat);
  if (repeatCollabs.length >= 1) {
    signals.push(REPUTATION_QUALITIES.long_term_collab);
  }

  // Max. 4 Signale — keine Zahlenwand
  return signals.slice(0, 4);
}

// ────────────────────────────────────────────────────────────────
// useCreatorReputation — alles was ein Creator-Profil braucht
// ────────────────────────────────────────────────────────────────
export function useCreatorReputation(creatorUserId) {
  const [recommendations, setRecommendations] = useState([]);
  const [collaborations,  setCollaborations]  = useState([]);
  const [trustEvents,     setTrustEvents]     = useState([]);
  const [loading,         setLoading]         = useState(false);

  const load = useCallback(async () => {
    if (!creatorUserId) return;
    setLoading(true);
    try {
      // Öffentliche Recommendations
      const { data: recs } = await supabase
        .from("recommendations")
        .select(`
          id, text, collab_type, collab_mood, project_type,
          creative_dir, outcome_quality, experience_note,
          is_verified, created_at,
          from_profile:profiles!recommendations_from_user_id_fkey(
            id, display_name, avatar_url, username
          )
        `)
        .eq("to_user_id", creatorUserId)
        .eq("is_public", true)
        .order("is_verified", { ascending: false })
        .order("created_at",  { ascending: false })
        .limit(20);

      // Collaboration History
      const { data: collabs } = await supabase
        .from("collaborations")
        .select("id, collab_type, creative_dir, completed_at, is_repeat")
        .eq("creator_id", creatorUserId)
        .order("completed_at", { ascending: false })
        .limit(10);

      setRecommendations(recs  || []);
      setCollaborations( collabs || []);
    } catch(e) {
      console.warn("[useCreatorReputation]", e.message);
    } finally {
      setLoading(false);
    }
  }, [creatorUserId]);

  useEffect(() => { load(); }, [load]);

  return { recommendations, collaborations, loading, reload: load };
}

// ────────────────────────────────────────────────────────────────
// useMyTrustEvents — eigene Trust-History für Creator Studio
// ────────────────────────────────────────────────────────────────
export function useMyTrustEvents() {
  const { user } = useAuth();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase.from("trust_events")
      .select(`
        id, event_type, context_ref, created_at,
        actor:profiles!trust_events_actor_id_fkey(
          id, display_name, avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  // Gruppiert nach Event-Typ
  const grouped = useMemo(() => {
    const g = {};
    events.forEach(e => {
      if (!g[e.event_type]) g[e.event_type] = [];
      g[e.event_type].push(e);
    });
    return g;
  }, [events]);

  return { events, grouped, loading };
}

// ────────────────────────────────────────────────────────────────
// useRecommendationActions — Recommendation senden
// ────────────────────────────────────────────────────────────────
export function useRecommendationActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Nach abgeschlossener Buchung Empfehlung senden
  const sendRecommendation = useCallback(async ({
    toUserId,
    bookingId = null,
    text,
    collabType,
    collabMood,
    projectType,
    creativeDir,
    outcomeQuality,
    experienceNote,
    isVerified = false,
  }) => {
    if (!user?.id || !toUserId || !text?.trim()) {
      return { error: "Fehlende Pflichtfelder" };
    }
    setLoading(true); setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("recommendations")
        .insert({
          from_user_id:   user.id,
          to_user_id:     toUserId,
          booking_id:     bookingId || null,
          text:           text.trim(),
          collab_type:    collabType    || null,
          collab_mood:    collabMood    || null,
          project_type:   projectType   || null,
          creative_dir:   creativeDir   || null,
          outcome_quality:outcomeQuality|| null,
          experience_note:experienceNote|| null,
          is_verified:    isVerified,
          is_public:      true,
        })
        .select("id").single();

      if (dbErr) throw dbErr;
      return { data };
    } catch(e) {
      setError(e.message);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Empfehlung nach Buchungs-Abschluss (auto-verifiziert)
  const sendVerifiedRecommendation = useCallback(async (props) => {
    return sendRecommendation({ ...props, isVerified: true });
  }, [sendRecommendation]);

  return { loading, error, sendRecommendation, sendVerifiedRecommendation };
}

// ────────────────────────────────────────────────────────────────
// useReputation (kombiniert alles für Profilseite)
// ────────────────────────────────────────────────────────────────
export function useReputation(profile) {
  const { recommendations, collaborations, loading } =
    useCreatorReputation(profile?.id || profile?.user_id);

  const signals = useMemo(() =>
    computeReputationSignals(profile, collaborations, recommendations),
    [profile, collaborations, recommendations]
  );

  // Collab-Zusammenfassung für Profil-Header
  const collabSummary = useMemo(() => {
    const total  = profile?.collab_count || collaborations.length || 0;
    const repeat = profile?.repeat_client_count || 0;
    const recs   = profile?.recommendations_count || recommendations.length || 0;

    if (total === 0 && recs === 0) return null;
    return { total, repeat, recs };
  }, [profile, collaborations, recommendations]);

  return {
    recommendations,
    collaborations,
    signals,
    collabSummary,
    loading,
  };
}
