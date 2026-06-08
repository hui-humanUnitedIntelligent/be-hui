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
  const level    = profile?.ambassador_level || (isAmb ? 'bronze' : null);
  const levelCfg = level ? LEVEL_CONFIG[level] : null;

  // Ref-Link: aus profiles.ref_link, Fallback berechnet aus username
  const [dbRefLink, setDbRefLink] = useState(null);
  useEffect(() => {
    if (!isAmb || !profile?.id) return;
    if (profile?.ref_link) {
      setDbRefLink(profile.ref_link);
      return;
    }
    // Kein ref_link im Profil → aus ambassador_ref_links Tabelle laden
    supabase
      .from("ambassador_ref_links")
      .select("ref_link, referral_code")
      .eq("user_id", profile.id)
      .single()
      .then(({ data }) => {
        if (data?.ref_link) {
          setDbRefLink(data.ref_link);
        } else if (profile?.username) {
          const code = "AMB-" + profile.username.toUpperCase().slice(0, 5);
          createRefLinkForAmbassador(profile.id, profile.username, code)
            .then(link => { if (link) setDbRefLink(link); });
        }
      });
  }, [profile?.id, isAmb, profile?.ref_link]);

  const safeUsername = (typeof profile?.username === "string" && profile.username.trim())
    ? profile.username.trim() : null;
  const computedRefLink = dbRefLink
    || profile?.ref_link
    || (safeUsername ? ("https://be-hui.com/" + safeUsername) : null);

  // Statistiken direkt aus profiles-Spalten
  const referralsCount   = Number(profile?.referred_users_count) || 0;
  const revenueTotal     = Number(profile?.impact_revenue)       || 0;

  // ambassador_applications — für detailliertere Referral-Daten
  const amb = profile?.profile_modules?.ambassador || null;
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
