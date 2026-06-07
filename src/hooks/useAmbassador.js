// src/hooks/useAmbassador.js
// ── HUI Ambassador Hook — App-seitig ─────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { isActiveAmbassador, hasPendingApplication, calcLevel, LEVEL_CONFIG } from "../lib/ambassadorUtils.js";

export function useAmbassador(profile) {
  const isAmb     = isActiveAmbassador(profile);
  const isPending = hasPendingApplication(profile);
  const amb       = profile?.profile_modules?.ambassador || null;
  const level     = amb?.level || (isAmb ? 'bronze' : null);
  const levelCfg  = level ? LEVEL_CONFIG[level] : null;

  return {
    isAmbassador:    isAmb,
    isPending,
    ambassadorData:  amb,
    level,
    levelCfg,
    refLink:         amb?.referral_link || null,
    refCode:         amb?.referral_code || null,
    referralsCount:  Number(amb?.referral_count) || 0,
    activeReferrals: Number(amb?.active_referral_count) || 0,
    sleepingReferrals: Number(amb?.sleeping_referral_count) || 0,
    revenueTotal:    Number(amb?.revenue_generated) || 0,
    linkActive:      amb?.link_active !== false,
  };
}

// Hook zum Einreichen einer Bewerbung
export function useAmbassadorApplication() {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [success, setSuccess]   = useState(false);

  const submit = useCallback(async (userId, formData, mediaFiles) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Medien hochladen
      const mediaUrls = [];
      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const ext  = file.name.split('.').pop();
          const name = `ambassador/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { data: up, error: upErr } = await supabase.storage
            .from('ambassador-media')
            .upload(name, file, { upsert: true });
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage
            .from('ambassador-media')
            .getPublicUrl(name);
          mediaUrls.push({ url: publicUrl, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name });
        }
      }

      // 2. Bewerbung in ambassadors_applications speichern
      const appPayload = {
        user_id:         userId,
        first_name:      formData.first_name,
        last_name:       formData.last_name,
        age:             Number(formData.age),
        gender:          formData.gender || null,
        location:        formData.location,
        motivation_text: formData.motivation_text,
        media_urls:      mediaUrls,
        phone:           formData.phone   || null,
        email:           formData.email   || null,
        status:          'offen',
      };

      const { error: insertErr } = await supabase
        .from('ambassadors_applications')
        .insert(appPayload);

      // Fallback: Tabelle existiert noch nicht → profile_modules nutzen
      if (insertErr && (insertErr.code === 'PGRST205' || insertErr.message?.includes('ambassadors_applications'))) {
        // Direkt in profile_modules speichern
        const { data: prof } = await supabase
          .from('profiles')
          .select('profile_modules')
          .eq('id', userId)
          .single();
        const pm  = prof?.profile_modules || {};
        const amb = { ...pm.ambassador, is_ambassador: false, status: 'pending', applied_at: new Date().toISOString(),
          motivation: formData.motivation_text, first_name: formData.first_name, last_name: formData.last_name,
          age: formData.age, gender: formData.gender, location: formData.location, media_urls: mediaUrls };
        await supabase.from('profiles').update({ profile_modules: { ...pm, ambassador: amb } }).eq('id', userId);
      } else if (insertErr) {
        throw insertErr;
      } else {
        // Auch profile_modules updaten für sofortige UI-Reaktion
        const { data: prof } = await supabase
          .from('profiles')
          .select('profile_modules')
          .eq('id', userId)
          .single();
        const pm  = prof?.profile_modules || {};
        const amb = { ...pm.ambassador, is_ambassador: false, status: 'pending', applied_at: new Date().toISOString(),
          motivation: formData.motivation_text };
        await supabase.from('profiles').update({ profile_modules: { ...pm, ambassador: amb } }).eq('id', userId);
      }

      setSuccess(true);
      return { ok: true };
    } catch (e) {
      setError(e.message || 'Fehler beim Einreichen der Bewerbung.');
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, success };
}


// ── Referral-Liste laden ─────────────────────────────────────
export function useReferrals(refCode) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!refCode) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, profile_modules, created_at")
      .eq("referred_by", refCode)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const list = data.map(p => {
          const pm = p.profile_modules || {};
          // Aktiv = hat in den letzten 30 Tagen gebucht oder ist Wirker
          const isActive = pm.is_wirker === true || pm.last_booking_at
            ? new Date(pm.last_booking_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            : false;
          return {
            id:          p.id,
            displayName: p.display_name || p.username || "Nutzer",
            username:    p.username     || null,
            avatarUrl:   p.avatar_url   || null,
            isActive,
            email:       pm.email       || null,
            phone:       pm.phone       || null,
            joinedAt:    p.created_at,
          };
        });
        setReferrals(list);
        setLoading(false);
      });
  }, [refCode]);

  return { referrals, loading };
}
