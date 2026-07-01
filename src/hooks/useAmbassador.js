// src/hooks/useAmbassador.js — HUI Ambassador Hook
// VERIFIZIERT: Nur echte Supabase-Tabellen und Spalten (Stand 2026-06-08)
// DB-Quellen:
//   profiles.is_ambassador (bool)
//   profiles.profile_modules.ambassador (JSON, für Status + Statistiken)
//   profiles.referred_by (string)
//   ambassador_ref_links: id, user_id, username, ref_link, referral_code, created_at
//   ambassadors_applications: id, user_id, first_name, last_name, age, gender,
//     location, motivation_text, media_urls, phone, email, status, created_at

import { useState, useEffect, useCallback } from "react";
import { supabase }                          from "../lib/supabaseClient.js";
import {
  isActiveAmbassador,
  hasPendingApplication,
  getAmbassadorStatus,
  getAmbStats,
  calcLevel,
  LEVEL_CONFIG,
} from "../lib/ambassadorUtils.js";
import {
  createRefLinkForAmbassador,
} from "../lib/referralTracking.js";

// ── Haupt-Hook für eigenes Ambassador-Profil ──────────────────
export function useAmbassador(profile) {
  const isAmb     = isActiveAmbassador(profile);
  const isPending = hasPendingApplication(profile);
  const ambStatus = getAmbassadorStatus(profile);
  const stats     = getAmbStats(profile);

  // Level berechnet aus referral_count in profile_modules
  const level    = calcLevel(stats.referral_count);
  const levelCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;

  // Ref-Link: aus ambassador_ref_links laden wenn Ambassador
  const [refLink, setRefLink] = useState(null);

  // Reflink direkt aus profiles.username — Single Source of Truth
  useEffect(() => {
    if (!isAmb || !profile?.id) { setRefLink(null); return; }
    // Primär: RPC für autorisierten Link
    supabase
      .rpc("rpc_get_ambassador_ref_link", { p_ambassador_id: profile.id })
      .then(({ data }) => {
        setRefLink(data || (profile.username ? `https://be-hui.com/${profile.username}` : null));
      })
      .catch(() => {
        if (profile?.username) setRefLink(`https://be-hui.com/${profile.username}`);
      });
  }, [isAmb, profile?.id, profile?.username]);

  const computedRefLink = refLink
    || (profile?.username ? `https://be-hui.com/${profile.username}` : null);

  return {
    isAmbassador:     isAmb,
    isPending,
    ambassadorStatus: ambStatus,
    ambassadorData: {
      level,
      levelCfg,
      referral_link:          computedRefLink,
      referral_code:          stats.referral_code,
      referral_count:         stats.referral_count,
      active_referral_count:  stats.active_referral_count,
      sleeping_referral_count:stats.sleeping_referral_count,
      revenue_generated:      stats.revenue_total,
      link_active:            stats.link_active,
    },
    level,
    levelCfg,
    refLink: computedRefLink,
    refCode: stats.referral_code,
    referralsCount:   stats.referral_count,
    activeReferrals:  stats.active_referral_count,
    sleepingReferrals:stats.sleeping_referral_count,
    revenueTotal:     stats.revenue_total,
    linkActive:       stats.link_active,
  };
}

// ── Bewerbungs-Hook ───────────────────────────────────────────
export function useAmbassadorApplication() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (userId, formData, mediaFiles) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Medien hochladen (optional)
      const mediaUrls = [];
      if (mediaFiles?.length > 0) {
        for (const file of mediaFiles) {
          const ext  = file.name.split(".").pop() || "jpg";
          const name = `ambassador/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("ambassador-media")
            .upload(name, file, { upsert: true });
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage
            .from("ambassador-media")
            .getPublicUrl(name);
          mediaUrls.push({
            url:  publicUrl,
            type: file.type.startsWith("video") ? "video" : "image",
            name: file.name,
          });
        }
      }

      // 2. Bewerbung in ambassadors_applications (echte Tabelle!) speichern
      const { error: insertErr } = await supabase
        .from("ambassadors_applications")
        .insert({
          user_id:         userId,
          first_name:      formData.first_name      || "",
          last_name:       formData.last_name       || "",
          age:             Number(formData.age)     || null,
          gender:          formData.gender          || null,
          location:        formData.location        || "",
          motivation_text: formData.motivation_text || "",
          media_urls:      mediaUrls,
          phone:           formData.phone           || null,
          email:           formData.email           || null,
          status:          "offen",
        });

      if (insertErr) throw insertErr;

      // 3. profile_modules.ambassador.status → 'offen' setzen für sofortige UI-Reaktion
      const { data: prof } = await supabase
        .from("profiles")
        .select("profile_modules")
        .eq("id", userId)
        .single();

      const pm  = prof?.profile_modules || {};
      const amb = { ...(pm.ambassador || {}), status: "offen", applied_at: new Date().toISOString() };
      await supabase
        .from("profiles")
        .update({ profile_modules: { ...pm, ambassador: amb } })
        .eq("id", userId);

      setSuccess(true);
      return { ok: true };
    } catch (e) {
      const msg = e?.message || "Fehler beim Einreichen der Bewerbung.";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, success };
}


// ── Referral-Liste (für Ambassador-Dashboard) ─────────────────
// Nutzt rpc_get_ambassador_referrals — Single Source of Truth
// Liefert: id, display_name, username, avatar_url, email, phone, role, created_at, is_active
export function useReferrals(ambassadorId, refCode) {
  const [referrals, setReferrals] = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!ambassadorId) return;
    setLoading(true);

    supabase
      .rpc("rpc_get_ambassador_referrals", { p_ambassador_id: ambassadorId })
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        setReferrals(data.map(p => ({
          id:                 p.id,
          displayName:        p.display_name || p.username || "Nutzer",
          username:           p.username     || null,
          avatarUrl:          p.avatar_url   || null,
          email:              p.email        || null,
          phone:              p.phone        || null,
          isActive:           !!p.is_active,
          firstTransactionAt: p.first_transaction_at || null,
          joinedAt:           p.created_at   || null,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ambassadorId]);

  return { referrals, loading };
}


// ── Ref-Link — aus profiles.username (Single Source of Truth) ──
// ambassador_ref_links NICHT mehr als primäre Quelle nutzen
export async function ensureRefLink(userId, username) {
  if (!userId || !username) return null;
  try {
    const { data } = await supabase.rpc("rpc_get_ambassador_ref_link", {
      p_ambassador_id: userId,
    });
    return data || `https://be-hui.com/${username}`;
  } catch {
    return `https://be-hui.com/${username}`;
  }
}
