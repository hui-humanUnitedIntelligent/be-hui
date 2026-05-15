// src/lib/moodUtils.js
// ══════════════════════════════════════════════════════════════
// HUI Emotionales Tagging-System
// Zentrale Quelle für alle Mood/Atmosphere/Energy-Definitionen.
// Alle Felder sind OPTIONAL — niemals erzwingen.
// ══════════════════════════════════════════════════════════════

/* ── MOOD TAGS ────────────────────────────────────────────────
   Kernstimmungen. Maximal 3 pro Item empfohlen.
   ──────────────────────────────────────────────────────────── */
export const MOOD_TAG_OPTIONS = [
  { key:"ruhe",         emoji:"🧘", label:"Ruhe",         color:"#6B9FD4" },
  { key:"inspiration",  emoji:"✨", label:"Inspiration",  color:"#F5A623" },
  { key:"heilung",      emoji:"🌸", label:"Heilung",      color:"#E8A0C8" },
  { key:"kreativ",      emoji:"🎨", label:"Kreativ",      color:"#A78BFA" },
  { key:"gemeinschaft", emoji:"🤝", label:"Gemeinschaft", color:"#FF8A6B" },
  { key:"abenteuer",    emoji:"🗺️", label:"Abenteuer",    color:"#3DB87A" },
  { key:"achtsamkeit",  emoji:"🌿", label:"Achtsamkeit",  color:"#5BAD8C" },
  { key:"energie",      emoji:"⚡", label:"Energie",      color:"#F59E0B" },
  { key:"tiefe",        emoji:"🌊", label:"Tiefe",        color:"#4A90D9" },
  { key:"freiheit",     emoji:"🦋", label:"Freiheit",     color:"#16D7C5" },
];

/* ── ATMOSPHERE TAGS ──────────────────────────────────────────
   Visuelle/räumliche Atmosphäre des Contents.
   ──────────────────────────────────────────────────────────── */
export const ATMOSPHERE_TAG_OPTIONS = [
  { key:"minimal",   emoji:"◻️", label:"Minimal"   },
  { key:"nature",    emoji:"🌲", label:"Natur"     },
  { key:"urban",     emoji:"🏙️", label:"Urban"     },
  { key:"warm",      emoji:"🔆", label:"Warm"      },
  { key:"cinematic", emoji:"🎬", label:"Cinematic"  },
  { key:"raw",       emoji:"🪨", label:"Raw"       },
  { key:"soft",      emoji:"☁️", label:"Soft"      },
  { key:"luxury",    emoji:"💎", label:"Luxury"    },
  { key:"cozy",      emoji:"🕯️", label:"Cozy"      },
  { key:"modern",    emoji:"⬡", label:"Modern"    },
];

/* ── ENERGY LEVEL ─────────────────────────────────────────────
   Wie viel Energie strahlt der Inhalt aus?
   ──────────────────────────────────────────────────────────── */
export const ENERGY_LEVELS = [
  { key:"soft",   emoji:"🌙", label:"Ruhig",    sub:"Entspannt & sanft"    },
  { key:"medium", emoji:"☀️", label:"Lebendig", sub:"Ausgeglichen & klar"  },
  { key:"high",   emoji:"⚡", label:"Intensiv", sub:"Kraftvoll & energisch" },
];

/* ── SOCIAL ENERGY ────────────────────────────────────────────
   Wie sozial ist das Erlebnis oder der Creator?
   ──────────────────────────────────────────────────────────── */
export const SOCIAL_ENERGY_OPTIONS = [
  { key:"solo",      emoji:"🧍", label:"Solo",       sub:"Für sich allein"       },
  { key:"social",    emoji:"👥", label:"Zu zweit",   sub:"Kleine Gruppen"        },
  { key:"community", emoji:"🫂", label:"Community",  sub:"Für alle offen"        },
];

/* ── CREATOR VIBE ─────────────────────────────────────────────
   Die Energie des Creators selbst.
   ──────────────────────────────────────────────────────────── */
export const CREATOR_VIBE_OPTIONS = [
  { key:"mindful",   emoji:"🧠", label:"Achtsam",   color:"#5BAD8C" },
  { key:"bold",      emoji:"🔥", label:"Mutig",     color:"#E05A3A" },
  { key:"warm",      emoji:"☀️", label:"Herzlich",  color:"#F5A623" },
  { key:"creative",  emoji:"🎨", label:"Kreativ",   color:"#A78BFA" },
  { key:"spiritual", emoji:"🌀", label:"Spirituell",color:"#4A90D9" },
  { key:"playful",   emoji:"🎭", label:"Verspielt", color:"#FF8A6B" },
  { key:"minimal",   emoji:"◻️", label:"Minimal",   color:"#888888" },
];

/* ════════════════════════════════════════════════════════════════
   SCORING: Wie gut passt ein Item zu einer Stimmung?
   Erweitert die bestehende MOOD_WEIGHTS-Logik in DiscoveryFeed.
   Gibt einen Score 0..1+ zurück (kumulativ).
   Alle Zugriffe sind optional (?.includes / ?.[])
   ════════════════════════════════════════════════════════════════ */

// Welche Tags sollen für welche Stimmung geboosted werden?
export const MOOD_TAG_BOOSTS = {
  ruhe: {
    mood_tags:       ["ruhe", "heilung", "achtsamkeit", "tiefe"],
    atmosphere_tags: ["nature", "soft", "cozy", "minimal", "warm"],
    energy_levels:   ["soft"],
    social_energy:   ["solo"],
    creator_vibes:   ["mindful", "spiritual", "minimal"],
  },
  inspiration: {
    mood_tags:       ["inspiration", "kreativ", "energie", "freiheit"],
    atmosphere_tags: ["cinematic", "modern", "luxury", "urban"],
    energy_levels:   ["medium", "high"],
    social_energy:   [],
    creator_vibes:   ["bold", "creative"],
  },
  gemeinschaft: {
    mood_tags:       ["gemeinschaft", "energie", "freiheit"],
    atmosphere_tags: ["warm", "cozy", "urban"],
    energy_levels:   ["medium", "high"],
    social_energy:   ["social", "community"],
    creator_vibes:   ["warm", "playful"],
  },
  kreativitaet: {
    mood_tags:       ["kreativ", "inspiration", "energie"],
    atmosphere_tags: ["raw", "cinematic", "urban", "modern"],
    energy_levels:   ["medium", "high"],
    social_energy:   [],
    creator_vibes:   ["creative", "bold", "playful"],
  },
  abenteuer: {
    mood_tags:       ["abenteuer", "energie", "freiheit"],
    atmosphere_tags: ["nature", "raw", "urban"],
    energy_levels:   ["high"],
    social_energy:   ["social", "community"],
    creator_vibes:   ["bold", "playful"],
  },
  ueberraschung: {
    mood_tags:       [],
    atmosphere_tags: [],
    energy_levels:   [],
    social_energy:   [],
    creator_vibes:   [],
  },
};

/**
 * emotionalScore(item, moodKey) → number
 *
 * Berechnet wie gut ein Feed-Item emotional zu einer Stimmung passt.
 * Alle Felder optional — niemals crash.
 * Gibt 0 zurück wenn keine Tags vorhanden.
 */
export function emotionalScore(item, moodKey) {
  if (!item || !moodKey) return 0;
  const boost = MOOD_TAG_BOOSTS[moodKey];
  if (!boost) return 0;

  let score = 0;

  // mood_tags
  const moodTags = Array.isArray(item.mood_tags) ? item.mood_tags : [];
  for (const tag of boost.mood_tags) {
    if (moodTags.includes(tag)) score += 0.40;
  }

  // atmosphere_tags
  const atmTags = Array.isArray(item.atmosphere_tags) ? item.atmosphere_tags : [];
  for (const tag of boost.atmosphere_tags) {
    if (atmTags.includes(tag)) score += 0.25;
  }

  // energy_level
  if (boost.energy_levels.length && item.energy_level) {
    if (boost.energy_levels.includes(item.energy_level)) score += 0.30;
  }

  // social_energy
  if (boost.social_energy.length && item.social_energy) {
    if (boost.social_energy.includes(item.social_energy)) score += 0.20;
  }

  // creator_vibe (Array oder String)
  const vibes = Array.isArray(item.creator_vibe)
    ? item.creator_vibe
    : (item.creator_vibe ? [item.creator_vibe] : []);
  for (const v of boost.creator_vibes) {
    if (vibes.includes(v)) score += 0.20;
  }

  return score;
}

/**
 * getEnergyColor(level) → CSS-Farbe
 */
export function getEnergyColor(level) {
  return level === "soft" ? "#6B9FD4"
    : level === "high" ? "#F5A623"
    : "#16D7C5";
}

/**
 * getMoodTagColor(key) → CSS-Farbe
 */
export function getMoodTagColor(key) {
  return MOOD_TAG_OPTIONS.find(t => t.key === key)?.color || "#888";
}
