// mood/moodConfig.js — HUI Mood System
// Single source of truth für alle Mood-Konfigurationen

export const MOODS = [
  { key:"ruhe",       label:"Ruhig",        emoji:"🌿", color:"#16D7C5" },
  { key:"kreativ",    label:"Kreativ",      emoji:"✦",  color:"#FF8A6B" },
  { key:"inspiriert", label:"Inspirierend", emoji:"💫", color:"#F5A623" },
  { key:"wirkung",    label:"Wirkung",      emoji:"🌱", color:"#16D7C5" },
  { key:"sozial",     label:"Sozial",       emoji:"🤝", color:"#FF8A6B" },
  { key:"fokus",      label:"Fokus",        emoji:"◎",  color:"#16D7C5" },
  { key:"natur",      label:"Natur",        emoji:"🍃", color:"#16D7C5" },
  { key:"offen",      label:"Offen",        emoji:"∞",  color:"#F5A623" },
  { key:"lernen",     label:"Lernen",       emoji:"📖", color:"#16D7C5" },
  { key:"aktiv",      label:"Aktiv",        emoji:"⚡", color:"#FF8A6B" },
];

export const MATCH_PLACEHOLDERS = [
  "Was bewegt dich heute?",
  "Ich suche kreative Menschen…",
  "Heute etwas Ruhiges…",
  "Menschen in meiner Nähe…",
  "Ich brauche Inspiration…",
  "Etwas Sinnvolles beitragen…",
  "Verbinde mich mit Energie…",
  "Zeig mir Überraschendes…",
];

// Mood → Feed-Priorisierungs-Hints (für spätere Feed-Logik)
export const MOOD_FEED_HINTS = {
  ruhe:       { tags:["natur","slow","meditation","gespräch"],  energy:"low"  },
  kreativ:    { tags:["kunst","design","prozess","workshop"],   energy:"medium"},
  inspiriert: { tags:["stories","ideen","entdecken","vision"],  energy:"medium"},
  wirkung:    { tags:["impact","community","sozial","lokal"],   energy:"high" },
  sozial:     { tags:["begegnung","raum","event","Menschen"],   energy:"medium"},
  fokus:      { tags:["tief","solo","werk","craft"],            energy:"low"  },
  natur:      { tags:["draußen","lokal","wandern","stille"],    energy:"low"  },
  offen:      { tags:["spontan","zufall","neu","entdecken"],    energy:"any"  },
  lernen:     { tags:["workshop","mentor","kurs","austausch"],  energy:"medium"},
  aktiv:      { tags:["sport","energie","bewegung","outdoor"],  energy:"high" },
};
