// src/hooks/useAmbassador.js
// ── HUI Ambassador Hook — App-seitig ─────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { isActiveAmbassador, hasPendingApplication, getAmbassadorStatus, calcLevel, LEVEL_CONFIG } from "../lib/ambassadorUtils.js";
import { createRefLinkForAmbassador } from "../lib/referralTracking.js";

export function useAmbassador(profile) {
  // ── EINZIGE QUELLE: profiles.is_ambassador (boolean) ──────────
  const isAmb     = profile?.is_ambassador === true;
  const isPending = hasPendingApplication(profile);
  const ambStatus = getAmbassadorStatus(profile);

  // Level: aus profiles.ambassador_level, Fallback 'bronze'
  const level    = profile?.ambassador_level || amb?.level || (isAmb ? 'bronze' : null);
  const levelCfg = level ? LEVEL_CONFIG[level] : null;

  // Ref-Link: aus profiles.ref_link, Fallback berechnet aus username
  const [dbRefLink, setDbRefLink] = useState(null);
  useEffect(() => {
    if (!isAmb || !profile?.id) return;
    if (profile?.ref_link) {
      setDbRefLink(profile.ref_link);
      return;
    }
    // Kein ref_link im Profil → aus ambassador_ref_links Tabelle laden (mit Fehler-Guard)
    supabase
      .from("ambassador_ref_links")
      .select("ref_link, referral_code")
      .eq("user_id", profile.id)
      .single()
      .then(({ data, error }) => {
        if (error) return; // Tabelle existiert nicht oder kein Eintrag → ignorieren
        if (data?.ref_link) {
          setDbRefLink(data.ref_link);
        } else if (profile?.username) {
          const code = "AMB-" + profile.username.toUpperCase().slice(0, 5);
          createRefLinkForAmbassador(profile.id, profile.username, code)
            .then(link => { if (link) setDbRefLink(link); })
            .catch(() => {}); // Fehler ignorieren wenn Tabelle nicht existiert
        }
      })
      .catch(() => {}); // globaler Guard
  }, [profile?.id, isAmb, profile?.ref_link]);

  const safeUsername = (typeof profile?.username === "string" && profile.username.trim())
    ? profile.username.trim() : null;
  const computedRefLink = dbRefLink
    || profile?.ref_link
    || (safeUsername ? ("https://be-hui.com/" + safeUsername) : null);

  // Statistiken — aus profile_modules.ambassador (profiles-Spalten existieren noch nicht)
  const amb = profile?.profile_modules?.ambassador || null;
  const referralsCount    = Number(amb?.referral_count ?? profile?.referred_users_count) || 0;
  const revenueTotal      = Number(amb?.revenue_total  ?? profile?.impact_revenue)       || 0;
  const activeReferrals   = Number(amb?.active_referral_count)   || 0;
  const sleepingReferrals = Number(amb?.sleeping_referral_count) || 0;

  return {
    isAmbassador:     isAmb,
    isPending,
    ambassadorStatus: ambStatus,
    ambassadorData: {
      level:                  level || 'bronze',
      referral_link:          computedRefLink,
      referral_code:          amb?.referral_code || null,
      referral_count:         referralsCount,
      active_referral_count:  activeReferrals,
      sleeping_referral_count:sleepingReferrals,
      revenue_generated:      revenueTotal,
    },
    level,
    levelCfg,
    refLink:          computedRefLink,
    refCode:          amb?.referral_code || null,
    referralsCount,
    activeReferrals,
    sleepingReferrals,
    revenueTotal,
    linkActive:       amb?.link_active !== false,
  };
}



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

/**
 * Wird aufgerufen wenn das eigene Profil als Ambassador erkannt wird
 * aber noch kein Ref-Link existiert → automatisch anlegen.
 */
export async function ensureRefLink(userId, username, referralCode) {
  if (!userId || !username) return null;
  const { data } = await supabase
    .from("ambassador_ref_links")
    .select("ref_link")
    .eq("user_id", userId)
    .single();
  if (data?.ref_link) return data.ref_link;
  return await createRefLinkForAmbassador(userId, username, referralCode);
}

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
