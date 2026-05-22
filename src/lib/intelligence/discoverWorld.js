// discoverWorld.js — HUI Discover World Engine v1
//
// Philosophy: "walking through a living world of human creativity"
//
// Discover is NOT a search engine. NOT a marketplace. NOT an explore feed.
// It is a living creative city with emotional districts —
// each with its own atmosphere, rhythm, and human energy.
//
// Users wander. They don't search.
// Districts emerge. They don't get assigned.
// Content encounters. It doesn't recommend.
//
// ── Architecture ───────────────────────────────────────────────────────────
//   • Districts emerge from signal density — no static taxonomy
//   • Each district is a complete atmospheric world
//   • Motion, color, spacing, timing all shift between districts
//   • Spaces from resonanceSpaces.js can glow inside districts
//   • Path ordering is emotional, not algorithmic
//   • Pure function — deterministic, null-safe, SSR-safe
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: DISTRICT DEFINITIONS
// 8 emotional districts — each a city neighborhood with its own atmosphere.
// These are NEVER shown as category labels. They shape the visual world.
// ═══════════════════════════════════════════════════════════════════════════

export const DISCOVER_DISTRICTS = Object.freeze({

  quiet_makers: Object.freeze({
    id:             "quiet_makers",

    // Human-language entry point — shown as atmospheric invitation, never filter
    invitation:     "Stille Schöpfer",
    invitationSub:  "Menschen die tief in ihrer Arbeit verschwinden",

    // Very rare micro-moments
    whisperPool: [
      "Etwas Ruhiges entsteht in dieser Ecke der Welt.",
      "Hier arbeiten Menschen in stiller Hingabe.",
      "Diese Atmosphäre zieht heute stille Menschen an.",
    ],

    // Visual atmosphere — the district's emotional palette
    visual: Object.freeze({
      // Background field
      bgGradient:       "linear-gradient(160deg, rgba(240,245,248,1) 0%, rgba(232,240,244,1) 100%)",
      surfaceTint:      "rgba(139,150,181,0.040)",
      vignetteColor:    "rgba(100,120,150,0.060)",

      // Cards
      cardRadius:       24,
      cardShadow:       "0 4px 24px rgba(100,120,160,0.10), 0 1px 4px rgba(0,0,0,0.05)",
      cardGlassOpacity: 0.88,

      // Accent color for badges, borders, highlights
      accent:           "#8B96B5",          // lavender-grey
      accentSoft:       "rgba(139,150,181,0.15)",
      accentGlow:       "rgba(139,150,181,0.30)",
      tealTint:         "rgba(22,215,197,0.10)",

      // Typography
      headingWeight:    700,
      headingTracking:  "-0.02em",
      bodyTracking:     "0.01em",
      textMuted:        "rgba(80,90,110,0.55)",

      // Motion
      motionScale:      0.75,               // slow, meditative
      revealDelay:      0.08,               // s — stagger per card
      floatAmplitude:   4,
      floatPeriod:      "20s",
      transitionEase:   "cubic-bezier(0.15,1,0.22,1)",

      // Spatial rhythm
      cardSpacing:      16,                 // px between cards
      sectionPadding:   24,
      heroBorderRadius: 28,
    }),

    // Content affinity — which content types feel at home here
    affinity: { works: 0.45, notes: 0.35, experiences: 0.10, impact: 0.10 },

    // Tags / talents that belong here
    talentAffinity: ["keramik", "illustration", "textil", "skulptur", "gravur", "buchbinden"],
  }),

  night_thoughts: Object.freeze({
    id:             "night_thoughts",
    invitation:     "Nachtgedanken",
    invitationSub:  "Tiefe Reflexionen die nur in der Stille entstehen",

    whisperPool: [
      "Gedanken die nur in der Nacht entstehen, sammeln sich hier.",
      "Eine tiefe Stille trägt diese Ecke der Welt.",
      "Viele kreative Gedanken finden hier ihren Raum.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(25,30,50,1) 0%, rgba(18,22,42,1) 100%)",
      surfaceTint:      "rgba(40,50,90,0.060)",
      vignetteColor:    "rgba(20,25,60,0.080)",

      cardRadius:       22,
      cardShadow:       "0 8px 32px rgba(0,0,20,0.28), 0 2px 8px rgba(0,0,0,0.20)",
      cardGlassOpacity: 0.72,

      accent:           "#6B82C4",          // cool indigo
      accentSoft:       "rgba(107,130,196,0.18)",
      accentGlow:       "rgba(22,215,197,0.25)",
      tealTint:         "rgba(22,215,197,0.08)",

      headingWeight:    600,
      headingTracking:  "0.00em",
      bodyTracking:     "0.015em",
      textMuted:        "rgba(180,190,220,0.55)",

      motionScale:      0.62,               // cinematic stillness
      revealDelay:      0.12,
      floatAmplitude:   3,
      floatPeriod:      "26s",
      transitionEase:   "cubic-bezier(0.12,1,0.18,1)",

      cardSpacing:      20,
      sectionPadding:   24,
      heroBorderRadius: 24,
    }),

    affinity: { works: 0.15, notes: 0.55, experiences: 0.10, impact: 0.20 },
    talentAffinity: ["musik", "text", "philosophie", "poesie", "klang", "komposition"],
  }),

  warm_gatherings: Object.freeze({
    id:             "warm_gatherings",
    invitation:     "Warme Zusammenkünfte",
    invitationSub:  "Momente in denen Menschen gemeinsam etwas erleben",

    whisperPool: [
      "Hier begegnen sich gerade ähnliche Energien.",
      "Eine warme menschliche Energie verbindet diesen Ort.",
      "Menschen kommen hier auf natürliche Weise zusammen.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(255,252,245,1) 0%, rgba(253,246,236,1) 100%)",
      surfaceTint:      "rgba(255,138,107,0.032)",
      vignetteColor:    "rgba(200,120,90,0.040)",

      cardRadius:       26,
      cardShadow:       "0 6px 28px rgba(255,138,107,0.12), 0 1px 4px rgba(0,0,0,0.06)",
      cardGlassOpacity: 0.84,

      accent:           "#FF8A6B",          // coral
      accentSoft:       "rgba(255,138,107,0.14)",
      accentGlow:       "rgba(255,138,107,0.32)",
      tealTint:         "rgba(22,215,197,0.08)",

      headingWeight:    800,
      headingTracking:  "-0.02em",
      bodyTracking:     "normal",
      textMuted:        "rgba(100,70,50,0.50)",

      motionScale:      1.04,
      revealDelay:      0.05,
      floatAmplitude:   7,
      floatPeriod:      "10s",
      transitionEase:   "cubic-bezier(0.22,1,0.36,1)",

      cardSpacing:      14,
      sectionPadding:   20,
      heroBorderRadius: 28,
    }),

    affinity: { works: 0.20, notes: 0.15, experiences: 0.50, impact: 0.15 },
    talentAffinity: ["kochen", "gemeinschaft", "tanz", "theater", "yoga", "meditation"],
  }),

  living_works: Object.freeze({
    id:             "living_works",
    invitation:     "Lebendige Werke",
    invitationSub:  "Dinge die mit Händen und Herz entstanden sind",

    whisperPool: [
      "Etwas Echtes entsteht in dieser Ecke der Welt.",
      "Handwerk und Seele verbinden sich hier.",
      "Diese Werke tragen die Energie ihrer Schöpfer.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(252,250,245,1) 0%, rgba(248,244,236,1) 100%)",
      surfaceTint:      "rgba(196,151,58,0.028)",
      vignetteColor:    "rgba(160,120,40,0.035)",

      cardRadius:       20,
      cardShadow:       "0 4px 20px rgba(196,151,58,0.12), 0 1px 4px rgba(0,0,0,0.06)",
      cardGlassOpacity: 0.86,

      accent:           "#C4973A",          // warm gold
      accentSoft:       "rgba(196,151,58,0.14)",
      accentGlow:       "rgba(245,166,35,0.30)",
      tealTint:         "rgba(22,215,197,0.07)",

      headingWeight:    800,
      headingTracking:  "-0.025em",
      bodyTracking:     "normal",
      textMuted:        "rgba(90,70,30,0.50)",

      motionScale:      0.88,
      revealDelay:      0.06,
      floatAmplitude:   5,
      floatPeriod:      "14s",
      transitionEase:   "cubic-bezier(0.18,1,0.30,1)",

      cardSpacing:      12,
      sectionPadding:   20,
      heroBorderRadius: 22,
    }),

    affinity: { works: 0.65, notes: 0.10, experiences: 0.15, impact: 0.10 },
    talentAffinity: ["holz", "metall", "keramik", "glas", "leder", "schmuck", "handwerk"],
  }),

  gentle_resonance: Object.freeze({
    id:             "gentle_resonance",
    invitation:     "Sanfte Resonanz",
    invitationSub:  "Werke und Gedanken die tief berühren",

    whisperPool: [
      "Viele kreative Gedanken sammeln sich hier.",
      "Diese Atmosphäre trägt etwas Berührendes in sich.",
      "Sanfte Resonanz verbindet die Menschen in diesem Raum.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(245,250,252,1) 0%, rgba(238,248,250,1) 100%)",
      surfaceTint:      "rgba(22,215,197,0.028)",
      vignetteColor:    "rgba(16,180,170,0.038)",

      cardRadius:       24,
      cardShadow:       "0 6px 24px rgba(22,215,197,0.10), 0 1px 4px rgba(0,0,0,0.05)",
      cardGlassOpacity: 0.85,

      accent:           "#16D7C5",          // teal
      accentSoft:       "rgba(22,215,197,0.13)",
      accentGlow:       "rgba(22,215,197,0.28)",
      tealTint:         "rgba(22,215,197,0.10)",

      headingWeight:    700,
      headingTracking:  "-0.015em",
      bodyTracking:     "0.005em",
      textMuted:        "rgba(40,90,85,0.50)",

      motionScale:      0.92,
      revealDelay:      0.07,
      floatAmplitude:   5,
      floatPeriod:      "16s",
      transitionEase:   "cubic-bezier(0.18,1,0.28,1)",

      cardSpacing:      16,
      sectionPadding:   22,
      heroBorderRadius: 26,
    }),

    affinity: { works: 0.30, notes: 0.35, experiences: 0.20, impact: 0.15 },
    talentAffinity: ["gesang", "fotografie", "malerei", "zeichnung", "klang", "licht"],
  }),

  creative_rituals: Object.freeze({
    id:             "creative_rituals",
    invitation:     "Kreative Rituale",
    invitationSub:  "Wiederkehrende Praktiken die Bedeutung schaffen",

    whisperPool: [
      "Rituale und Wiederholung formen diese Ecke der Welt.",
      "Hier entsteht Bedeutung durch Beständigkeit.",
      "Kreative Rituale verbinden die Menschen in diesem Raum.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(248,246,252,1) 0%, rgba(242,240,250,1) 100%)",
      surfaceTint:      "rgba(160,140,210,0.030)",
      vignetteColor:    "rgba(130,110,190,0.040)",

      cardRadius:       22,
      cardShadow:       "0 5px 22px rgba(160,140,210,0.12), 0 1px 4px rgba(0,0,0,0.06)",
      cardGlassOpacity: 0.83,

      accent:           "#9B8BC4",          // soft violet
      accentSoft:       "rgba(160,140,210,0.14)",
      accentGlow:       "rgba(160,140,210,0.28)",
      tealTint:         "rgba(22,215,197,0.07)",

      headingWeight:    700,
      headingTracking:  "-0.01em",
      bodyTracking:     "0.008em",
      textMuted:        "rgba(70,55,100,0.50)",

      motionScale:      0.86,
      revealDelay:      0.09,
      floatAmplitude:   4,
      floatPeriod:      "18s",
      transitionEase:   "cubic-bezier(0.16,1,0.26,1)",

      cardSpacing:      18,
      sectionPadding:   22,
      heroBorderRadius: 24,
    }),

    affinity: { works: 0.30, notes: 0.30, experiences: 0.30, impact: 0.10 },
    talentAffinity: ["kalligraphie", "yoga", "meditation", "kochen", "gärtnern", "schreiben"],
  }),

  human_connection: Object.freeze({
    id:             "human_connection",
    invitation:     "Menschliche Verbindung",
    invitationSub:  "Wo echte kreative Begegnungen entstehen",

    whisperPool: [
      "Hier begegnen sich Menschen auf echte Weise.",
      "Vertrauen und Kreativität verbinden sich in diesem Raum.",
      "Menschliche Verbindungen tragen diese Ecke der Welt.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(253,250,244,1) 0%, rgba(250,246,238,1) 100%)",
      surfaceTint:      "rgba(245,166,35,0.025)",
      vignetteColor:    "rgba(200,140,30,0.032)",

      cardRadius:       26,
      cardShadow:       "0 6px 26px rgba(245,166,35,0.10), 0 1px 4px rgba(0,0,0,0.06)",
      cardGlassOpacity: 0.86,

      accent:           "#F5A623",          // gold-amber
      accentSoft:       "rgba(245,166,35,0.13)",
      accentGlow:       "rgba(245,166,35,0.28)",
      tealTint:         "rgba(22,215,197,0.08)",

      headingWeight:    800,
      headingTracking:  "-0.02em",
      bodyTracking:     "normal",
      textMuted:        "rgba(90,70,20,0.50)",

      motionScale:      0.93,
      revealDelay:      0.06,
      floatAmplitude:   5,
      floatPeriod:      "13s",
      transitionEase:   "cubic-bezier(0.18,1,0.28,1)",

      cardSpacing:      16,
      sectionPadding:   22,
      heroBorderRadius: 28,
    }),

    affinity: { works: 0.20, notes: 0.25, experiences: 0.35, impact: 0.20 },
    talentAffinity: ["coaching", "moderation", "community", "beratung", "mentoring"],
  }),

  slow_inspiration: Object.freeze({
    id:             "slow_inspiration",
    invitation:     "Langsame Inspiration",
    invitationSub:  "Dinge die Zeit brauchen um zu berühren",

    whisperPool: [
      "Manche Dinge brauchen Zeit um zu berühren — hier ist der Raum.",
      "Langsame Inspiration entsteht in tiefer Stille.",
      "Hier sammeln sich Werke die erst beim zweiten Blick wirklich zu sehen sind.",
    ],

    visual: Object.freeze({
      bgGradient:       "linear-gradient(160deg, rgba(245,248,244,1) 0%, rgba(238,244,240,1) 100%)",
      surfaceTint:      "rgba(124,200,160,0.028)",
      vignetteColor:    "rgba(90,160,120,0.036)",

      cardRadius:       22,
      cardShadow:       "0 4px 20px rgba(124,200,160,0.10), 0 1px 4px rgba(0,0,0,0.05)",
      cardGlassOpacity: 0.84,

      accent:           "#7CC8A0",          // sage green
      accentSoft:       "rgba(124,200,160,0.14)",
      accentGlow:       "rgba(124,200,160,0.26)",
      tealTint:         "rgba(22,215,197,0.09)",

      headingWeight:    600,
      headingTracking:  "-0.01em",
      bodyTracking:     "0.01em",
      textMuted:        "rgba(40,80,55,0.50)",

      motionScale:      0.80,
      revealDelay:      0.10,
      floatAmplitude:   4,
      floatPeriod:      "19s",
      transitionEase:   "cubic-bezier(0.14,1,0.24,1)",

      cardSpacing:      20,
      sectionPadding:   24,
      heroBorderRadius: 24,
    }),

    affinity: { works: 0.40, notes: 0.40, experiences: 0.10, impact: 0.10 },
    talentAffinity: ["natur", "botanik", "aquarell", "fotografie", "architektur", "tee"],
  }),

});

// Ordered by how often they appear as entry point (most common → least)
const DISTRICT_ORDER = [
  "quiet_makers", "living_works", "warm_gatherings",
  "gentle_resonance", "slow_inspiration", "creative_rituals",
  "human_connection", "night_thoughts",
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: PATH DEFINITION
// The discovery path — ordered sequence of districts the user wanders through.
// Emotional logic: contrast-then-harmony, never jarring transitions.
// ═══════════════════════════════════════════════════════════════════════════

// Compatible district pairs — which districts feel natural next to each other
const DISTRICT_COMPATIBILITY = {
  quiet_makers:     ["slow_inspiration", "gentle_resonance", "night_thoughts",  "living_works"],
  night_thoughts:   ["quiet_makers",     "slow_inspiration", "gentle_resonance","creative_rituals"],
  warm_gatherings:  ["human_connection", "gentle_resonance", "living_works",    "creative_rituals"],
  living_works:     ["quiet_makers",     "warm_gatherings",  "gentle_resonance","slow_inspiration"],
  gentle_resonance: ["quiet_makers",     "slow_inspiration", "living_works",    "night_thoughts"],
  creative_rituals: ["night_thoughts",   "gentle_resonance", "slow_inspiration","human_connection"],
  human_connection: ["warm_gatherings",  "gentle_resonance", "living_works",    "creative_rituals"],
  slow_inspiration: ["quiet_makers",     "gentle_resonance", "night_thoughts",  "living_works"],
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: NULL-SAFE INPUT NORMALIZERS
// ═══════════════════════════════════════════════════════════════════════════

const safeNum  = (v, fb = 0) => { const n = Number(v); return (isNaN(n)||!isFinite(n)) ? fb : Math.max(0,n); };
const safeStr  = (v, fb = "") => (v != null && typeof v === "string") ? v : fb;
const safeArr  = (v)           => Array.isArray(v) ? v.filter(Boolean) : [];

function normalizeFeed(rawFeed) {
  const items = safeArr(rawFeed);
  const n = items.length;
  if (n === 0) return { count:0, workRatio:0, noteRatio:0, experienceRatio:0, avgResonanz:0, avgBerührt:0, dominantPresence:null, talentFrequency:{}, creatorDiversity:0, emotionalDensity:0 };

  let works = 0, notes = 0, exps = 0;
  let totalRes = 0, totalBer = 0;
  const talentFreq = {};
  const creators   = new Set();
  const presences  = {};

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const type = safeStr(item.type || item.rhythmState,"post").toLowerCase();
    if (type.includes("work") || type === "werk") works++;
    else if (type === "note" || type === "thought") notes++;
    else if (type === "experience" || type === "event") exps++;

    totalRes += safeNum(item.resonanz || item.stats?.likes);
    totalBer += safeNum(item.berührt || 0);

    const t = safeStr(item.talent || item.category,"").toLowerCase();
    if (t) talentFreq[t] = (talentFreq[t] || 0) + 1;

    const cr = item.creatorId || item.userId || item.name;
    if (cr) creators.add(cr);
    const ps = safeStr(item.presenceState);
    if (ps) presences[ps] = (presences[ps] || 0) + 1;
  }

  return {
    count: n,
    workRatio:   works / n,
    noteRatio:   notes / n,
    experienceRatio: exps / n,
    avgResonanz: totalRes / n,
    avgBerührt:  totalBer / n,
    talentFrequency: talentFreq,
    creatorDiversity: creators.size / Math.max(n, 1),
    dominantPresence: Object.entries(presences).sort(([,a],[,b])=>b-a)[0]?.[0] || null,
    emotionalDensity: clamp((totalBer + (totalRes * 0.2)) / Math.max(n,1) / 12, 0, 1),
  };
}

function normalizeAtmosphere(raw) {
  if (!raw || typeof raw !== "object") return { id:"calm_transition", motionScale:1, warmthDelta:0 };
  return { id:safeStr(raw.id,"calm_transition"), motionScale:safeNum(raw.motionScale,1), warmthDelta:safeNum(raw.warmthDelta,0) };
}

function normalizeIdentities(raw) {
  if (!raw) return { archetypeFrequency:{}, dominantArchetype:null };
  const items = Array.isArray(raw) ? raw : [];
  const freq = {};
  for (const id of items) {
    if (!id) continue;
    const archetype = safeStr(id.emotionalIdentity?.id || id.archetype);
    if (archetype) freq[archetype] = (freq[archetype] || 0) + 1;
  }
  const dominant = Object.entries(freq).sort(([,a],[,b])=>b-a)[0]?.[0] || null;
  return { archetypeFrequency: freq, dominantArchetype: dominant };
}

function normalizeSpaces(raw) {
  if (!raw || !raw.spaces) return { activeIds:[], dominantId:null };
  return {
    activeIds:   (raw.spaces || []).map(s => safeStr(s.id)).filter(Boolean),
    dominantId:  safeStr(raw.dominant?.id || ""),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: DISTRICT EMERGENCE SCORERS
// Each returns a 0–1 strength for a district emerging in this context.
// ═══════════════════════════════════════════════════════════════════════════

function talentOverlap(feed, districtTalents) {
  const freq = feed.talentFrequency || {};
  const total = Object.values(freq).reduce((a,b) => a+b, 0);
  if (total === 0) return 0;
  const matched = districtTalents.reduce((s,t) => s + (freq[t] || 0), 0);
  return clamp(matched / total * 2, 0, 1);
}

function scoreQuietMakers(feed, atm, identities, spaces) {
  const work     = clamp(feed.workRatio      * 1.8, 0, 1);
  const quiet    = clamp(1 - feed.noteRatio,        0, 1) * 0.3;
  const calm     = ["quiet_reflection","calm_transition"].includes(atm.id) ? 0.25 : 0;
  const identity = identities.dominantArchetype === "quiet_creator" ? 0.25 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.quiet_makers.talentAffinity);
  const creating = feed.dominantPresence === "creating" ? 0.15 : 0;

  return weightedMean([
    [work,     0.28], [quiet,   0.14], [calm,    0.20],
    [identity, 0.16], [talent,  0.14], [creating,0.08],
  ]);
}

function scoreNightThoughts(feed, atm, identities, spaces) {
  const night    = atm.id === "deep_night_presence" ? 0.55 : 0;
  const notes    = clamp(feed.noteRatio * 2.0,        0, 1);
  const deep     = identities.dominantArchetype === "deep_reflector" ? 0.25 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.night_thoughts.talentAffinity);
  const reflect  = feed.dominantPresence === "reflecting" ? 0.20 : 0;

  return weightedMean([
    [night,   0.38], [notes,  0.26], [deep,   0.16],
    [talent,  0.12], [reflect,0.08],
  ]);
}

function scoreWarmGatherings(feed, atm, identities, spaces) {
  const exp      = clamp(feed.experienceRatio * 2.2, 0, 1);
  const gather   = feed.dominantPresence === "gathering" ? 0.30 : 0;
  const warmAtm  = ["gentle_gathering","warm_creation"].includes(atm.id) ? 0.22 : 0;
  const connector= identities.dominantArchetype === "warm_connector" ? 0.22 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.warm_gatherings.talentAffinity);

  return weightedMean([
    [exp,      0.30], [gather,   0.22], [warmAtm,  0.20],
    [connector,0.18], [talent,   0.10],
  ]);
}

function scoreLivingWorks(feed, atm, identities, spaces) {
  const work     = clamp(feed.workRatio * 2.0, 0, 1);
  const highRes  = clamp(feed.avgResonanz / 25, 0, 1);
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.living_works.talentAffinity);
  const creating = feed.dominantPresence === "creating" ? 0.20 : 0;
  const inspirer = identities.dominantArchetype === "gentle_inspirer" ? 0.18 : 0;

  return weightedMean([
    [work,     0.32], [highRes,  0.20], [talent,   0.22],
    [creating, 0.14], [inspirer, 0.12],
  ]);
}

function scoreGentleResonance(feed, atm, identities, spaces) {
  const berührt  = clamp(feed.avgBerührt / 10, 0, 1);
  const resonanz = clamp(feed.avgResonanz / 22, 0, 1);
  const inspAtm  = atm.id === "collective_inspiration" ? 0.22 : 0;
  const inspirer = identities.dominantArchetype === "gentle_inspirer" ? 0.22 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.gentle_resonance.talentAffinity);
  const resonating = feed.dominantPresence === "resonating" ? 0.18 : 0;

  return weightedMean([
    [berührt,   0.28], [resonanz,  0.22], [inspAtm,  0.16],
    [inspirer,  0.16], [talent,    0.10], [resonating,0.08],
  ]);
}

function scoreCreativeRituals(feed, atm, identities, spaces) {
  const balanced = 1 - Math.abs(feed.workRatio - feed.noteRatio) * 2;   // works ≈ notes
  const steady   = identities.dominantArchetype === "steady_presence" ? 0.25 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.creative_rituals.talentAffinity);
  const variety  = clamp(feed.creatorDiversity * 1.5, 0, 1);
  const calm     = atm.motionScale < 0.92 ? 0.15 : 0;

  return weightedMean([
    [balanced, 0.32], [steady, 0.22], [talent, 0.20],
    [variety,  0.16], [calm,   0.10],
  ]);
}

function scoreHumanConnection(feed, atm, identities, spaces) {
  const exp      = clamp(feed.experienceRatio * 1.8, 0, 1);
  const berührt  = clamp(feed.avgBerührt / 8,  0, 1);
  const connector= identities.dominantArchetype === "warm_connector" ? 0.25 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.human_connection.talentAffinity);
  const human    = spaces.activeIds.includes("human_connection") ? 0.20 : 0;

  return weightedMean([
    [exp,      0.28], [berührt,   0.24], [connector, 0.22],
    [talent,   0.14], [human,     0.12],
  ]);
}

function scoreSlowInspiration(feed, atm, identities, spaces) {
  const emotional= clamp(feed.emotionalDensity * 1.4, 0, 1);
  const explorer = identities.dominantArchetype === "curious_explorer" ? 0.22 : 0;
  const talent   = talentOverlap(feed, DISCOVER_DISTRICTS.slow_inspiration.talentAffinity);
  const slow     = atm.motionScale < 0.90 ? 0.18 : 0;
  const notes    = clamp(feed.noteRatio * 1.8, 0, 1);

  return weightedMean([
    [emotional, 0.28], [explorer, 0.20], [talent,  0.22],
    [slow,      0.16], [notes,    0.14],
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: MAIN ENGINE — buildDiscoverWorld()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives the living Discover World from collective creative signals.
 *
 * @param {Array}            rawFeed        — normalized feed items
 * @param {SharedAtmosphere} rawAtmosphere  — from buildSharedAtmosphere()
 * @param {Array}            rawIdentities  — array of ProfileItems with emotionalIdentity
 * @param {ResonanceSpaces}  rawSpaces      — from buildResonanceSpaces()
 *
 * @returns {DiscoverWorld} — frozen object
 *   {
 *     path:       Array<DistrictStop>,    // ordered wandering path (2–4 districts)
 *     districts:  Array<ActiveDistrict>,  // all emerged districts
 *     primary:    ActiveDistrict,         // entry district
 *     ambient:    DiscoverAmbient,        // blended visual field for Discover UI
 *     whisper:    string | null,          // very rare atmospheric text
 *     scores:     object,                 // INTERNAL
 *     _empty:     boolean,
 *   }
 *
 *   DistrictStop: { district: ActiveDistrict, position: number, transitionFrom: string|null }
 *   ActiveDistrict: { id, archetype, score, visual, invitation, invitationSub, affinity, spaceGlow }
 */
export function buildDiscoverWorld(
  rawFeed       = [],
  rawAtmosphere = {},
  rawIdentities = [],
  rawSpaces     = {},
) {
  const feed       = normalizeFeed(rawFeed);
  const atm        = normalizeAtmosphere(rawAtmosphere);
  const identities = normalizeIdentities(rawIdentities);
  const spaces     = normalizeSpaces(rawSpaces);

  // ── Score all 8 districts ──────────────────────────────────────────
  const rawScores = {
    quiet_makers:     scoreQuietMakers(feed,    atm, identities, spaces),
    night_thoughts:   scoreNightThoughts(feed,  atm, identities, spaces),
    warm_gatherings:  scoreWarmGatherings(feed, atm, identities, spaces),
    living_works:     scoreLivingWorks(feed,    atm, identities, spaces),
    gentle_resonance: scoreGentleResonance(feed,atm, identities, spaces),
    creative_rituals: scoreCreativeRituals(feed,atm, identities, spaces),
    human_connection: scoreHumanConnection(feed,atm, identities, spaces),
    slow_inspiration: scoreSlowInspiration(feed,atm, identities, spaces),
  };

  // ── Filter to emerged districts (min 0.22) ───────────────────────
  const MIN_DISTRICT_SCORE = 0.22;
  const emerged = Object.entries(rawScores)
    .filter(([,s]) => s >= MIN_DISTRICT_SCORE)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5);   // max 5 districts visible

  if (emerged.length === 0) {
    return buildEmptyWorld(rawScores);
  }

  // ── Build active districts ────────────────────────────────────────
  const allDistricts = emerged.map(([id, score]) => {
    const archetype = DISCOVER_DISTRICTS[id];
    if (!archetype) return null;

    // Attach space glow if a matching resonance space is active
    const spaceGlow = spaces.activeIds.includes(id)
      ? { active: true, intensity: score * 0.6 }
      : null;

    return Object.freeze({
      id,
      archetype,
      score,
      visual:       archetype.visual,
      invitation:   archetype.invitation,
      invitationSub:archetype.invitationSub,
      affinity:     archetype.affinity,
      spaceGlow,
    });
  }).filter(Boolean);

  const primary = allDistricts[0];

  // ── Build wandering path ──────────────────────────────────────────
  const path = buildWanderingPath(allDistricts, rawScores);

  // ── Blend ambient field ───────────────────────────────────────────
  const ambient = buildDiscoverAmbient(allDistricts);

  // ── Derive whisper ────────────────────────────────────────────────
  const whisper = deriveWorldWhisper(primary, feed);

  return Object.freeze({
    path,
    districts: allDistricts,
    primary,
    ambient,
    whisper,
    scores:    rawScores,
    _empty:    false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: WANDERING PATH BUILDER
// Orders districts into an emotionally coherent journey.
// Contrast-then-harmony: no two adjacent districts clash tonally.
// ═══════════════════════════════════════════════════════════════════════════

function buildWanderingPath(districts, scores) {
  if (districts.length === 0) return [];
  if (districts.length === 1) {
    return [{ district: districts[0], position: 0, transitionFrom: null }];
  }

  const path = [];
  const used  = new Set();
  let   curr  = districts[0].id;
  path.push({ district: districts[0], position: 0, transitionFrom: null });
  used.add(curr);

  const remaining = districts.slice(1);

  while (remaining.length > 0 && path.length < 4) {
    // Find the best next district: highest score among compatible neighbors
    const compatible  = DISTRICT_COMPATIBILITY[curr] || [];
    const notUsed     = remaining.filter(d => !used.has(d.id));
    const candidates  = notUsed.filter(d => compatible.includes(d.id));

    // If no compatible neighbor available, take highest remaining
    const next = candidates.length > 0
      ? candidates.sort((a,b) => b.score - a.score)[0]
      : notUsed.sort((a,b) => b.score - a.score)[0];

    if (!next) break;

    path.push({
      district:       next,
      position:       path.length,
      transitionFrom: curr,
    });
    used.add(next.id);
    curr = next.id;

    const idx = remaining.findIndex(d => d.id === next.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return path;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: DISCOVER AMBIENT FIELD
// Blends visual tokens from active districts for the Discover UI.
// ═══════════════════════════════════════════════════════════════════════════

function buildDiscoverAmbient(districts) {
  if (!districts.length) return buildNullAmbient();

  const total = districts.reduce((s,d) => s + d.score, 0);
  const w     = d => d.score / total;

  const blended = districts.reduce((acc, d) => {
    const wi = w(d);
    const v  = d.visual;
    return {
      motionScale:      acc.motionScale      + safeNum(v.motionScale, 1)  * wi,
      revealDelay:      acc.revealDelay      + safeNum(v.revealDelay, 0.07)*wi,
      floatAmplitude:   acc.floatAmplitude   + safeNum(v.floatAmplitude,5) * wi,
      cardSpacing:      acc.cardSpacing      + safeNum(v.cardSpacing, 14)  * wi,
      sectionPadding:   acc.sectionPadding   + safeNum(v.sectionPadding,20)* wi,
      cardGlassOpacity: acc.cardGlassOpacity + safeNum(v.cardGlassOpacity,.85)*wi,
    };
  }, { motionScale:0, revealDelay:0, floatAmplitude:0, cardSpacing:0, sectionPadding:0, cardGlassOpacity:0 });

  const dominant = districts[0];
  const v        = dominant.visual;

  return Object.freeze({
    ...blended,
    // Qualitative: from dominant district
    bgGradient:       v.bgGradient,
    surfaceTint:      v.surfaceTint,
    vignetteColor:    v.vignetteColor,
    accent:           v.accent,
    accentSoft:       v.accentSoft,
    accentGlow:       v.accentGlow,
    tealTint:         v.tealTint,
    cardRadius:       v.cardRadius,
    cardShadow:       v.cardShadow,
    headingWeight:    v.headingWeight,
    headingTracking:  v.headingTracking,
    bodyTracking:     v.bodyTracking,
    textMuted:        v.textMuted,
    floatPeriod:      v.floatPeriod,
    transitionEase:   v.transitionEase,
    heroBorderRadius: v.heroBorderRadius,
  });
}

function buildNullAmbient() {
  return Object.freeze({
    bgGradient:       "linear-gradient(160deg, rgba(252,250,248,1) 0%, rgba(248,246,242,1) 100%)",
    surfaceTint:      "rgba(160,176,172,0.020)",
    vignetteColor:    "rgba(140,156,152,0.025)",
    accent:           "#16D7C5",
    accentSoft:       "rgba(22,215,197,0.12)",
    accentGlow:       "rgba(22,215,197,0.25)",
    tealTint:         "rgba(22,215,197,0.09)",
    cardRadius:       22,
    cardShadow:       "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
    cardGlassOpacity: 0.84,
    headingWeight:    700,
    headingTracking:  "-0.015em",
    bodyTracking:     "normal",
    textMuted:        "rgba(80,80,80,0.50)",
    motionScale:      0.92,
    revealDelay:      0.07,
    floatAmplitude:   5,
    floatPeriod:      "15s",
    cardSpacing:      14,
    sectionPadding:   20,
    heroBorderRadius: 24,
    transitionEase:   "cubic-bezier(0.22,1,0.36,1)",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: DISCOVER DRIFT
// The world transitions slowly when signals shift.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blends a past Discover World with a freshly computed one.
 * The world evolves over hours, not seconds.
 *
 * @param {DiscoverWorld} pastWorld
 * @param {DiscoverWorld} freshWorld
 * @param {number}        minutesElapsed
 *
 * @returns {DiscoverWorld}
 */
export function discoverDrift(pastWorld, freshWorld, minutesElapsed = 0) {
  if (!pastWorld || pastWorld._empty) return freshWorld;
  if (!freshWorld)                     return pastWorld;

  // Districts shift slowly — 60-min half-life
  const HALF_LIFE = 60;
  const t = clamp(1 - Math.pow(0.5, minutesElapsed / HALF_LIFE), 0, 0.90);

  // Numerical ambient tokens blend continuously
  const lerpN = (key, fb) => lerp(
    safeNum(pastWorld.ambient?.[key], fb),
    safeNum(freshWorld.ambient?.[key], fb),
    t
  );

  const blendedAmbient = {
    ...freshWorld.ambient,
    motionScale:      lerpN("motionScale",    0.92),
    revealDelay:      lerpN("revealDelay",    0.07),
    floatAmplitude:   lerpN("floatAmplitude", 5),
    cardSpacing:      lerpN("cardSpacing",    14),
    cardGlassOpacity: lerpN("cardGlassOpacity",0.84),
    // Qualitative switch at 50%
    bgGradient:       t > 0.5 ? freshWorld.ambient?.bgGradient   : pastWorld.ambient?.bgGradient,
    accent:           t > 0.5 ? freshWorld.ambient?.accent        : pastWorld.ambient?.accent,
    surfaceTint:      t > 0.5 ? freshWorld.ambient?.surfaceTint   : pastWorld.ambient?.surfaceTint,
    transitionEase:   t > 0.5 ? freshWorld.ambient?.transitionEase: pastWorld.ambient?.transitionEase,
  };

  return Object.freeze({
    ...freshWorld,
    ambient: Object.freeze(blendedAmbient),
    whisper: freshWorld.whisper,
    _driftT: t,
    _empty:  false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: MEMOIZED SELECTORS
// Safe accessors — always return sensible defaults, never throw.
// ═══════════════════════════════════════════════════════════════════════════

/** Returns the ambient field for the Discover UI. */
export function selectDiscoverAmbient(world) {
  return world?.ambient ?? buildNullAmbient();
}

/** Returns the primary district id or null. */
export function selectPrimaryDistrict(world) {
  return world?.primary?.id ?? null;
}

/** Returns the wandering path (array of district stops). */
export function selectWanderingPath(world) {
  return world?.path ?? [];
}

/** Returns the world whisper or null. */
export function selectWorldWhisper(world) {
  return world?.whisper ?? null;
}

/** Returns the accent color for the primary district. */
export function selectDistrictAccent(world) {
  return world?.primary?.visual?.accent ?? "#16D7C5";
}

/** Returns the bg gradient CSS for the Discover page. */
export function selectDiscoverBg(world) {
  return world?.ambient?.bgGradient ?? buildNullAmbient().bgGradient;
}

/** Returns motion scale (0.62–1.04) for Discover animations. */
export function selectDiscoverMotionScale(world) {
  const s = world?.ambient?.motionScale;
  return (typeof s === "number" && !isNaN(s)) ? clamp(s, 0.60, 1.06) : 0.92;
}

/** Returns per-card reveal stagger delay in seconds. */
export function selectRevealDelay(world) {
  const d = world?.ambient?.revealDelay;
  return (typeof d === "number" && !isNaN(d)) ? clamp(d, 0.04, 0.14) : 0.07;
}

/** Returns true if the world is empty (no districts emerged). */
export function isEmptyWorld(world) {
  return !world || world._empty === true;
}

/** Debug summary. NEVER pass to user UI. */
export function debugWorldSummary(world) {
  if (!world || world._empty) return "[empty world]";
  const path = (world.path || []).map(s => s.district.id.split("_")[0]).join(" → ");
  const top  = Object.entries(world.scores || {}).sort(([,a],[,b])=>b-a).slice(0,3)
    .map(([k,v])=>`${k.split("_")[0]}:${(v*100).toFixed(0)}`).join(" ");
  return `path: ${path} | ${top}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: DISTRICT → CONTENT MAPPING
// Maps feed items into their most appropriate district.
// Used by DiscoverPage to visually group content emotionally.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assigns each feed item to its best-matching district.
 * Pure — returns new array, never mutates.
 *
 * @param {Array}        items    — normalized feed items
 * @param {DiscoverWorld} world
 *
 * @returns {Array<{item, districtId, district}>}
 */
export function assignItemsToDistricts(items, world) {
  if (!items || !world || world._empty) return safeArr(items).map(i => ({ item:i, districtId:null, district:null }));

  const districts = world.districts || [];
  if (districts.length === 0) return safeArr(items).map(i => ({ item:i, districtId:null, district:null }));

  return safeArr(items).map(item => {
    if (!item) return null;

    const type    = safeStr(item.type || item.rhythmState,"post").toLowerCase();
    const talent  = safeStr(item.talent || item.category,"").toLowerCase();

    // Score item against each district's affinity
    let   bestId    = districts[0].id;
    let   bestScore = -1;

    for (const d of districts) {
      const archetype = d.archetype || DISCOVER_DISTRICTS[d.id];
      if (!archetype) continue;

      // Content type affinity
      const typeScore =
        (type.includes("work") || type === "werk") ? (archetype.affinity.works || 0)
        : (type === "note" || type === "thought")   ? (archetype.affinity.notes || 0)
        : (type === "experience" || type === "event")? (archetype.affinity.experiences || 0)
        : (type === "impact")                        ? (archetype.affinity.impact || 0)
        : 0.25;

      // Talent affinity
      const talentScore = (archetype.talentAffinity || []).includes(talent) ? 0.35 : 0;

      // District score (proxy for strength)
      const districtStrength = d.score * 0.30;

      const total = typeScore * 0.45 + talentScore * 0.35 + districtStrength * 0.20;

      if (total > bestScore) {
        bestScore = total;
        bestId    = d.id;
      }
    }

    const bestDistrict = districts.find(d => d.id === bestId) || null;
    return Object.freeze({ item, districtId: bestId, district: bestDistrict });
  }).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: MOCK FACTORY
// Build Discover World from feed alone (no Supabase needed).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Builds a Discover World from feed items only.
 * @param {Array}            feedItems
 * @param {SharedAtmosphere} sharedAtmosphere — from curateHumaneFeed result
 */
export function mockDiscoverWorldFromFeed(feedItems = [], sharedAtmosphere = null) {
  const atm = sharedAtmosphere || { id: "calm_transition", motionScale: 1.0 };
  return buildDiscoverWorld(feedItems, atm, [], {});
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: PILL → DISTRICT MAPPING
// Maps legacy pill/category IDs to district IDs for backward compat.
// ═══════════════════════════════════════════════════════════════════════════

const PILL_TO_DISTRICT = {
  alle:        null,            // no filter → world decides
  kunst:       "gentle_resonance",
  handwerk:    "living_works",
  musik:       "night_thoughts",
  natur:       "slow_inspiration",
  design:      "quiet_makers",
  wellness:    "creative_rituals",
  gemeinschaft:"warm_gatherings",
  kultur:      "slow_inspiration",
};

/**
 * Returns the district id for a pill/category id.
 * Returns null for "alle" (no filter).
 */
export function pillToDistrict(pillId) {
  return PILL_TO_DISTRICT[pillId] ?? null;
}

/**
 * Returns visual tokens for a specific district id.
 */
export function getDistrictVisual(districtId) {
  return DISCOVER_DISTRICTS[districtId]?.visual ?? buildNullAmbient();
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function weightedMean(pairs) {
  let sum = 0, totalW = 0;
  for (const [v, w] of pairs) {
    if (typeof v === "number" && !isNaN(v) && typeof w === "number" && w > 0) {
      sum    += clamp(v, 0, 1) * w;
      totalW += w;
    }
  }
  return totalW > 0 ? clamp(sum / totalW, 0, 1) : 0;
}

function clamp(v, min, max) {
  if (typeof v !== "number" || isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }

function deriveWorldWhisper(primary, feed) {
  if (!primary || primary.score < 0.40) return null;
  const hash = Math.floor((feed.workRatio * 97 + feed.noteRatio * 73 + feed.avgBerührt * 11) * 100) % 9;
  if (hash !== 0) return null;  // ~11% of qualifying moments
  const pool = primary.archetype?.whisperPool || [];
  return pool.length ? pool[hash % pool.length] : null;
}

function buildEmptyWorld(scores) {
  return Object.freeze({
    path: [], districts: [], primary: null,
    ambient: buildNullAmbient(), whisper: null,
    scores, _empty: true,
  });
}
