// src/lib/ambassadorUtils.js — HUI Ambassador Logik
// VERIFIZIERT: Nur echte DB-Tabellen und Spalten (Stand 2026-06-08)
// Tabellen: ambassadors_applications, ambassador_ref_links
// Spalte: profiles.is_ambassador (boolean), profiles.profile_modules

// ── Level-Grenzen ─────────────────────────────────────────────
export const LEVEL_THRESHOLDS = {
  bronze:   { min: 0,   max: 10  },
  silver:   { min: 11,  max: 50  },
  gold:     { min: 51,  max: 200 },
  platinum: { min: 201, max: Infinity },
};

// ── Reward-Sätze pro Level ────────────────────────────────────
export const AMBASSADOR_REWARD_RATES = {
  bronze:   0.01,
  silver:   0.02,
  gold:     0.03,
  platinum: 0.04,
};

export const IMPACT_POOL_RATE = 0.15;

// ── Level-Labels ──────────────────────────────────────────────
export const LEVEL_CONFIG = {
  bronze:   { label: 'Bronze',  icon: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)'  },
  silver:   { label: 'Silber',  icon: '🥈', color: '#A8A8A8', bg: 'rgba(168,168,168,0.12)' },
  gold:     { label: 'Gold',    icon: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.12)'   },
  platinum: { label: 'Platin',  icon: '💎', color: '#B197FC', bg: 'rgba(177,151,252,0.12)' },
};

// ── Level berechnen ───────────────────────────────────────────
export function calcLevel(referralsCount = 0) {
  const n = Number(referralsCount) || 0;
  if (n >= LEVEL_THRESHOLDS.platinum.min) return 'platinum';
  if (n >= LEVEL_THRESHOLDS.gold.min)     return 'gold';
  if (n >= LEVEL_THRESHOLDS.silver.min)   return 'silver';
  return 'bronze';
}

export function calcReward(amountTotal, level) {
  const rate = AMBASSADOR_REWARD_RATES[level] ?? AMBASSADOR_REWARD_RATES.bronze;
  return {
    ambassador_share: amountTotal * rate,
    impact_share:     amountTotal * IMPACT_POOL_RATE,
    rate,
  };
}

// ── Status-Checks (aus profiles.is_ambassador + profile_modules) ─
export function isActiveAmbassador(profile) {
  return profile?.is_ambassador === true;
}

// Status kommt aus ambassadors_applications.status ODER profile_modules.ambassador.status
// Werte: 'offen' | 'angenommen' | 'abgelehnt' | 'widerrufen' | null
export function getAmbassadorStatus(profile) {
  return profile?.profile_modules?.ambassador?.status || null;
}

export function hasPendingApplication(profile) {
  const status = getAmbassadorStatus(profile);
  return status === 'offen' || status === 'pending';
}

export function canApplyAsAmbassador(profile) {
  if (isActiveAmbassador(profile)) return false;
  const status = getAmbassadorStatus(profile);
  return status !== 'offen' && status !== 'pending';
}

// Statistiken: aus profile_modules.ambassador (kein eigenes ambassador-Spalten in profiles)
export function getAmbStats(profile) {
  const amb = profile?.profile_modules?.ambassador || {};
  return {
    referral_count:          Number(amb.referral_count)          || 0,
    active_referral_count:   Number(amb.active_referral_count)   || 0,
    sleeping_referral_count: Number(amb.sleeping_referral_count) || 0,
    revenue_total:           Number(amb.revenue_total)           || 0,
    referral_code:           amb.referral_code                   || null,
    link_active:             amb.link_active                     !== false,
    level:                   amb.level                           || 'bronze',
  };
}
