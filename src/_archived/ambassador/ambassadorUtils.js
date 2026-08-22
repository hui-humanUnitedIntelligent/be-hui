// BALANCED GROWTH v1 (2026-07-10)
// Ambassador-Provisionen aus dem HUI-Unternehmensanteil (10% vom Brutto)
// Stufen und Raten identisch mit DB-RPC rpc_process_order_fees

export const AMBASSADOR_TIERS = {
  starter: { label: 'Starter', min: 0,   max: 10,  rate: 0.05, display: '5%'  },
  bronze:  { label: 'Bronze',  min: 11,  max: 50,  rate: 0.10, display: '10%' },
  silber:  { label: 'Silber',  min: 51,  max: 200, rate: 0.15, display: '15%' },
  gold:    { label: 'Gold',    min: 201, max: null, rate: 0.20, display: '20%' },
};

// Balanced Growth: HUI-Anteil = 20% vom Brutto
export const BALANCED_GROWTH_RATES = {
  TALENT_SHARE:    0.80,   // 80% → Talent/Verkäufer
  HUI_SHARE:       0.20,   // 20% → HUI-System
  COMPANY_SPLIT:   0.50,   // 50% von HUI → Unternehmen (= 10% gesamt)
  IMPACT_SPLIT:    0.30,   // 30% von HUI → Impact-Pool (= 6% gesamt)
  INNOVATION_SPLIT:0.20,   // 20% von HUI → Innovation (= 4% gesamt)
  IMPACT_PROJECTS: 0.70,   // 70% von Impact → Projekte
  IMPACT_FLEX:     0.30,   // 30% von Impact → Flex-Pool
  PROJECT_RANK1:   0.50,   // 50% der Projektmittel → Platz 1
  PROJECT_RANK2:   0.30,   // 30% der Projektmittel → Platz 2
  PROJECT_RANK3:   0.20,   // 20% der Projektmittel → Platz 3
};

// Unternehmens-Phasenmodell
export const COMPANY_PHASES = {
  phase1: { label: 'Aufbau',    ops: 0.60, profit: 0.20, reserves: 0.20 },
  phase2: { label: 'Skalierung',ops: 0.40, profit: 0.40, reserves: 0.20 },
  phase3: { label: 'Etabliert', ops: 0.20, profit: 0.60, reserves: 0.20 },
};

// Legacy-Kompatibilität (wird noch von alten Komponenten referenziert)
export const IMPACT_POOL_RATE = BALANCED_GROWTH_RATES.IMPACT_SPLIT; // 0.30

/**
 * Ambassador-Level aus Referral-Anzahl berechnen
 */
export function getAmbassadorLevel(referralCount = 0) {
  if (referralCount >= 201) return 'gold';
  if (referralCount >= 51)  return 'silber';
  if (referralCount >= 11)  return 'bronze';
  return 'starter';
}

/**
 * Provision berechnen (aus HUI-Unternehmensanteil)
 * Balanced Growth: Basis = 10% vom Bruttobetrag
 */
export function calcAmbassadorCommission(totalAmountEur, referralCount = 0) {
  const level = getAmbassadorLevel(referralCount);
  const tier = AMBASSADOR_TIERS[level];
  const companyShare = totalAmountEur * BALANCED_GROWTH_RATES.HUI_SHARE * BALANCED_GROWTH_RATES.COMPANY_SPLIT;
  const commission = companyShare * tier.rate;
  return {
    level, tier,
    company_share_eur: Math.round(companyShare * 100) / 100,
    commission_eur: Math.round(commission * 100) / 100,
    rate: tier.rate,
  };
}

/**
 * Vollständige Balanced-Growth-Kalkulation für einen Transaktionswert
 */
export function calcBalancedGrowth(totalEur, referralCount = 0, phase = 'phase1') {
  const hui = Math.round(totalEur * BALANCED_GROWTH_RATES.HUI_SHARE * 100) / 100;
  const talent = totalEur - hui;
  const company = Math.round(hui * BALANCED_GROWTH_RATES.COMPANY_SPLIT * 100) / 100;
  const impact = Math.round(hui * BALANCED_GROWTH_RATES.IMPACT_SPLIT * 100) / 100;
  const innovation = Math.round((hui - company - impact) * 100) / 100;
  const impactProjects = Math.round(impact * BALANCED_GROWTH_RATES.IMPACT_PROJECTS * 100) / 100;
  const impactFlex = Math.round((impact - impactProjects) * 100) / 100;
  const { commission_eur } = calcAmbassadorCommission(totalEur, referralCount);
  const phaseData = COMPANY_PHASES[phase] || COMPANY_PHASES.phase1;
  return {
    total_eur: totalEur,
    talent_eur: talent,
    hui_total_eur: hui,
    company_eur: company,
    impact_eur: impact,
    innovation_eur: innovation,
    impact_projects_eur: impactProjects,
    impact_flex_eur: impactFlex,
    ambassador_commission_eur: commission_eur,
    company_ops_eur: Math.round(company * phaseData.ops * 100) / 100,
    company_profit_eur: Math.round(company * phaseData.profit * 100) / 100,
    company_reserves_eur: Math.round(company * phaseData.reserves * 100) / 100,
  };
}

// Legacy-Exports (Rückwärtskompatibilität)
export const LEVEL_THRESHOLDS = {
  starter: { min: 0 },
  bronze: { min: 11 },
  silber: { min: 51 },
  gold: { min: 201 },
};
export const AMBASSADOR_REWARD_RATES = {
  starter: AMBASSADOR_TIERS.starter.rate,
  bronze:  AMBASSADOR_TIERS.bronze.rate,
  silber:  AMBASSADOR_TIERS.silber.rate,
  gold:    AMBASSADOR_TIERS.gold.rate,
};

// ── Legacy-Kompatibilität: Profile-Helper (useAmbassador.js) ──────
// Diese Funktionen bleiben für Rückwärtskompatibilität mit bestehenden
// Komponenten. Sie nutzen profile_modules.ambassador aus der DB.

export const LEVEL_CONFIG = {
  starter: { label: 'Starter', icon: '🌱', color: '#6BAE8F', bg: 'rgba(107,174,143,0.12)' },
  bronze:  { label: 'Bronze',  icon: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)'  },
  silber:  { label: 'Silber',  icon: '🥈', color: '#A8A8A8', bg: 'rgba(168,168,168,0.12)' },
  gold:    { label: 'Gold',    icon: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.12)'   },
};

/**
 * Legacy: Level aus Referral-Anzahl (alias für getAmbassadorLevel)
 */
export function calcLevel(referralsCount = 0) {
  return getAmbassadorLevel(referralsCount);
}

/**
 * Legacy: Reward-Berechnung (angepasst an Balanced Growth)
 */
export function calcReward(amountTotal, level) {
  const lvl = level || 'starter';
  const rate = AMBASSADOR_REWARD_RATES[lvl] ?? AMBASSADOR_REWARD_RATES.starter;
  const result = calcAmbassadorCommission(amountTotal, 0);
  return {
    ambassador_share: result.commission_eur,
    impact_share:     amountTotal * IMPACT_POOL_RATE,
    rate,
  };
}

/**
 * Status-Checks (aus profiles.is_ambassador + profile_modules)
 */
export function isActiveAmbassador(profile) {
  return profile?.is_ambassador === true;
}

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

/**
 * Statistiken aus profile_modules.ambassador
 */
export function getAmbStats(profile) {
  const amb = profile?.profile_modules?.ambassador || {};
  return {
    referral_count:          Number(amb.referral_count)          || 0,
    active_referral_count:   Number(amb.active_referral_count)   || 0,
    sleeping_referral_count: Number(amb.sleeping_referral_count) || 0,
    revenue_total:           Number(amb.revenue_total)           || 0,
    referral_code:           amb.referral_code                   || null,
    link_active:             amb.link_active                     !== false,
    level:                   amb.level                           || 'starter',
  };
}
