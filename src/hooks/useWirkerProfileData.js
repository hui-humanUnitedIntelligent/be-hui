// src/hooks/useWirkerProfileData.js
// HUI — WirkerProfile Data Hook — Phase 5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Kapselt die gesamte Datenfetch-Logik von WirkerProfilePage.
// Trennt Data Layer von Render Layer.
//
// VORHER: WirkerProfilePage hatte 9 supabase.from()-Calls direkt
//         im Render-File verteilt über 3 useEffects
//
// NACHHER: Ein Hook, eine Verantwortlichkeit.
//
// USAGE:
//   const { profile, works, exps, recs, loading, followed,
//           setFollowed, reload } = useWirkerProfileData(rawWirker, user);
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PROFILE_FIELDS = `
  id, username, display_name, bio, talent, location_label,
  focus_type, dna_tags, header_img, avatar_url, is_available,
  response_rate, total_bookings_completed, created_at,
  has_talent_profile, hourly_rate, is_verified
`.trim();

// Sichere Supabase-Query — gibt { data, error } zurück, wirft nie
async function safeQuery(queryBuilder) {
  try {
    return await queryBuilder;
  } catch (e) {
    return { data: null, error: e };
  }
}

// Profile-Normalisierung — vereinheitlicht Feldnamen aus verschiedenen Quellen
function normalizeProfile(raw) {
  if (!raw) return null;
  return {
    id:             raw.id || raw.user_id,
    display_name:   raw.display_name || raw.full_name || raw.name || 'Unbekannt',
    username:       raw.username || null,
    bio:            raw.bio || 'Kreativ. Präsent. Hier.',
    talent:         raw.talent || 'Kreativ',
    location_label: raw.location_label || raw.location || 'Deutschland',
    focus_type:     raw.focus_type || 'hybrid',
    dna_tags:       raw.dna_tags?.length ? raw.dna_tags : ['Kreativität','Handwerk'],
    header_img:     raw.header_img || raw.cover_url ||
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=85',
    avatar_url:     raw.avatar_url || raw.img || raw.profile_img,
    is_available:   raw.is_available ?? true,
    response_rate:  raw.response_rate,
    total_bookings_completed: raw.total_bookings_completed || 0,
    hourly_rate:    raw.hourly_rate,
    is_verified:    raw.is_verified || false,
    has_talent_profile: raw.has_talent_profile || false,
    created_at:     raw.created_at,
  };
}

export function useWirkerProfileData(rawWirker, currentUser) {
  const [profile,  setProfile]  = useState(null);
  const [works,    setWorks]    = useState([]);
  const [exps,     setExps]     = useState([]);
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [followed, setFollowed] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!rawWirker) return;
    setLoading(true);

    const userId   = rawWirker.user_id || rawWirker.id;
    const username = rawWirker.username;
    let prof = null;

    // 1. Profil laden — erst by ID, dann by username
    if (userId && userId !== 'mock') {
      const { data } = await safeQuery(
        supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).single()
      );
      prof = data;
    }
    if (!prof && username) {
      const { data } = await safeQuery(
        supabase.from('profiles').select(PROFILE_FIELDS).eq('username', username).single()
      );
      prof = data;
    }

    if (!mountedRef.current) return;
    const normalized = normalizeProfile(prof || rawWirker);
    setProfile(normalized);

    // 2. Follow-Status prüfen
    if (currentUser?.id && normalized?.id) {
      const { data: followData } = await safeQuery(
        supabase.from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', normalized.id)
          .maybeSingle()
      );
      if (mountedRef.current) setFollowed(!!followData);
    }

    // 3. Works, Experiences, Recs parallel laden
    if (normalized?.id) {
      const targetId = normalized.id;
      const [worksRes, expsRes, recsRes] = await Promise.all([
        safeQuery(supabase.from('works').select('*').eq('user_id', targetId)
          .eq('status', 'published').order('created_at', { ascending: false }).limit(20)),
        safeQuery(supabase.from('experiences').select('*').eq('user_id', targetId)
          .eq('status', 'published').order('created_at', { ascending: false }).limit(12)),
        safeQuery(supabase.from('recommendations').select('*').eq('recipient_id', targetId)
          .order('created_at', { ascending: false }).limit(10)),
      ]);
      if (mountedRef.current) {
        if (worksRes.data?.length) setWorks(worksRes.data);
        if (expsRes.data?.length)  setExps(expsRes.data);
        if (recsRes.data?.length)  setRecs(recsRes.data);
      }
    }

    if (mountedRef.current) setLoading(false);
  }, [rawWirker?.id || rawWirker?.username, currentUser?.id]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const reload = useCallback(() => {
    setWorks([]); setExps([]); setRecs([]);
    load();
  }, [load]);

  return { profile, works, exps, recs, loading, followed, setFollowed, reload };
}
