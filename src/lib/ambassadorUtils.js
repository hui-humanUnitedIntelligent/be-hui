// src/lib/ambassadorUtils.js
// ── HUI Ambassador — Zentrale Logik (App + Admin nutzen dieselben Regeln) ──
// WICHTIG: Nur diese Datei für Level-Grenzen und Reward-Sätze ändern.

// ── Level-Grenzen ─────────────────────────────────────────────
export const LEVEL_THRESHOLDS = {
  bronze:   { min: 0,   max: 10  },
  silver:   { min: 11,  max: 50  },
  gold:     { min: 51,  max: 200 },
  platinum: { min: 201, max: Infinity },
};

// ── Reward-Sätze pro Level ────────────────────────────────────
export const AMBASSADOR_REWARD_RATES = {
  bronze:   0.01,  // 1 %
  silver:   0.02,  // 2 %
  gold:     0.03,  // 3 %
  platinum: 0.04,  // 4 %
};

// ── Impact-Pool-Rate (unveränderlich) ─────────────────────────
export const IMPACT_POOL_RATE = 0.15; // 15 %

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

// ── Reward-Betrag berechnen ───────────────────────────────────
export function calcReward(amountTotal, level) {
  const rate = AMBASSADOR_REWARD_RATES[level] ?? AMBASSADOR_REWARD_RATES.bronze;
  return {
    ambassador_share: amountTotal * rate,
    impact_share:     amountTotal * IMPACT_POOL_RATE,
    rate,
  };
}

// ── Ambassador-Status aus profile_modules lesen ───────────────
export function getAmbassadorData(profile) {
  if (!profile) return null;
  const pm  = profile.profile_modules || {};
  const amb = pm.ambassador || null;
  if (!amb) return null;
  return amb;
}

export function isActiveAmbassador(profile) {
  const amb = getAmbassadorData(profile);
  return amb?.is_ambassador === true && amb?.status === 'active';
}

export function hasPendingApplication(profile) {
  const amb = getAmbassadorData(profile);
  return amb?.status === 'pending';
}
