// src/lib/categories.js
// ─────────────────────────────────────────────────────────────────────────
// HUI KATEGORIEN — Single Source of Truth (2026-07-06, Lars)
// ─────────────────────────────────────────────────────────────────────────
// ARCHITEKTUR-ENTSCHEIDUNG (Governance-Pflichtanalyse vor Implementierung):
//
// BESTAND vor diesem Sprint: 3 verschiedene, hartcodierte und inkonsistente
// Kategorie-Listen im Code:
//   1. THEMES in SearchCommandCenter.jsx (5 Einträge)
//   2. CATEGORIES in WorkDetailsStep.jsx (15 Einträge, Werk-spezifisch)
//   3. CATEGORIES in ExperienceCreateStep.jsx (15 Einträge, Erlebnis-spezifisch)
// Keine DB-Tabelle für Kategorien -- works.category / experiences.category
// sind freie Text-Spalten (Legacy), keine Foreign-Keys, kein Enum.
//
// ENTSCHEIDUNG: Diese Datei ist ab jetzt die EINZIGE Quelle für die
// kanonische, uebergreifende HUI-Themenwelt (Discovery/Suche). Sie ersetzt
// THEMES in SearchCommandCenter.jsx vollstaendig. Die Werk-/Erlebnis-
// spezifischen CATEGORIES-Listen in den Create-Flows (WorkDetailsStep,
// ExperienceCreateStep) bleiben bewusst UNVERAENDERT -- sie bilden granulare
// Medium-Typen ab ("Illustration","Keramik","Yoga",...), die auf die freie
// works.category/experiences.category-Spalte schreiben. Eine Vereinheitlichung
// dieser Schreib-Taxonomie mit der hier definierten breiteren Themenwelt ist
// eine grössere Datenmigrations-Entscheidung (Architektur-Charta Prinzip 5)
// und nicht Teil dieses Sprints -- wird hier nur vorbereitet, nicht erzwungen.
//
// DATENFLUSS (Governance-Pflichtformat):
//   Quelle:       diese statische Konstante (CATEGORIES)
//   Verarbeitung: getCategoryBySlug/searchCategories (reine Client-Funktionen)
//   Speicherung:  keine eigene DB-Tabelle -- Kategorie-Auswahl wird beim
//                 Suchen in Keyword-Terme uebersetzt und gegen die
//                 bestehenden Spalten title/description/category (works,
//                 experiences) per ILIKE gematcht (siehe useFeedStream.js)
//   Notification: keine
//   Anzeige:      SearchCommandCenter.jsx (Schnellauswahl-Zeile + "Alle
//                 Kategorien"-Bottom-Sheet)
//   Statistik:    keine (vorbereitet ueber optionale Felder, siehe unten)
//   Admin:        keine eigene Verwaltung noetig (statische Liste im Code)
//
// ZUKUNFTSSICHERHEIT: jedes Kategorie-Objekt hat feste Kernfelder
// (id, name, icon, color, slug, keywords) und ist bewusst so gehalten, dass
// spaeter zusaetzliche, rein additive Felder ergaenzt werden koennen, ohne
// bestehende Konsumenten zu brechen -- z.B.:
//   parentId          -> Unterkategorien (aktuell immer null = Top-Level)
//   aiRecommended      -> KI-Empfehlungen (aktuell nicht gesetzt)
//   popular             -> "Beliebte Kategorien" (aktuell nicht gesetzt)
//   region              -> regionale Kategorien (aktuell nicht gesetzt)
// Diese Felder werden HEUTE nicht benutzt/gerendert -- sie existieren nur
// als vorbereitete, optionale Erweiterungspunkte (kein Scope-Creep).

export const CATEGORIES = [
  { id:"nachhaltigkeit",   name:"Nachhaltigkeit",           icon:"🌱", color:"#16A34A", slug:"nachhaltigkeit",   keywords:["nachhaltig","natur","umwelt","klima","oekologisch"] },
  { id:"kreativitaet",     name:"Kreativität",              icon:"🎨", color:"#9333EA", slug:"kreativitaet",     keywords:["kreativ","kunst","design","gestaltung"] },
  { id:"musik",            name:"Musik",                    icon:"🎵", color:"#0EA5E9", slug:"musik",            keywords:["musik","musiker","band","konzert","song","instrument"] },
  { id:"gemeinschaft",     name:"Gemeinschaft",             icon:"🤝", color:"#0EC4B8", slug:"gemeinschaft",     keywords:["gemeinschaft","community","nachbarschaft","treffen"] },
  { id:"bildung",          name:"Bildung",                  icon:"📚", color:"#D97706", slug:"bildung",          keywords:["bildung","lernen","kurs","workshop","schule"] },
  { id:"technologie",      name:"Technologie",              icon:"💻", color:"#6366F1", slug:"technologie",      keywords:["technologie","tech","software","programmieren","code"] },
  { id:"business",         name:"Business",                 icon:"💼", color:"#475569", slug:"business",         keywords:["business","unternehmen","startup","gruendung"] },
  { id:"gesundheit",       name:"Gesundheit",               icon:"❤️", color:"#E11D48", slug:"gesundheit",       keywords:["gesundheit","wellness","fitness","ernaehrung"] },
  { id:"achtsamkeit",      name:"Achtsamkeit",              icon:"🧘", color:"#0EC4B8", slug:"achtsamkeit",      keywords:["achtsamkeit","meditation","mindfulness","ruhe"] },
  { id:"kochen",           name:"Kochen",                   icon:"🍳", color:"#EA580C", slug:"kochen",           keywords:["kochen","kueche","rezept","backen"] },
  { id:"garten",           name:"Garten",                    icon:"🌿", color:"#16A34A", slug:"garten",           keywords:["garten","pflanzen","gaertnern","balkon"] },
  { id:"wohnen",           name:"Wohnen",                    icon:"🏡", color:"#D97706", slug:"wohnen",           keywords:["wohnen","einrichtung","zuhause","interior"] },
  { id:"kunst",            name:"Kunst",                     icon:"🎭", color:"#9333EA", slug:"kunst",            keywords:["kunst","malerei","skulptur","galerie"] },
  { id:"fotografie",       name:"Fotografie",                icon:"📷", color:"#0EA5E9", slug:"fotografie",       keywords:["fotografie","foto","kamera","shooting"] },
  { id:"film",             name:"Film",                      icon:"🎬", color:"#6366F1", slug:"film",             keywords:["film","video","kino","regie"] },
  { id:"gaming",           name:"Gaming",                    icon:"🎮", color:"#6366F1", slug:"gaming",           keywords:["gaming","games","zocken","esport"] },
  { id:"literatur",        name:"Literatur",                 icon:"📖", color:"#D97706", slug:"literatur",        keywords:["literatur","buch","lesen","roman"] },
  { id:"schreiben",        name:"Schreiben",                 icon:"✍️", color:"#D97706", slug:"schreiben",        keywords:["schreiben","text","autor","bloggen"] },
  { id:"sprache",          name:"Sprache",                   icon:"🎤", color:"#0EA5E9", slug:"sprache",          keywords:["sprache","sprechen","rhetorik","vortrag"] },
  { id:"reisen",           name:"Reisen",                    icon:"🌍", color:"#EA580C", slug:"reisen",           keywords:["reisen","urlaub","reise","abenteuer"] },
  { id:"outdoor",          name:"Outdoor",                   icon:"🏕️", color:"#16A34A", slug:"outdoor",          keywords:["outdoor","wandern","camping","natur"] },
  { id:"sport",            name:"Sport",                     icon:"🚴", color:"#E11D48", slug:"sport",            keywords:["sport","fitness","training","bewegung"] },
  { id:"tiere",            name:"Tiere",                     icon:"🐶", color:"#16A34A", slug:"tiere",            keywords:["tiere","hund","katze","tierschutz"] },
  { id:"familie",          name:"Familie",                   icon:"👨‍👩‍👧", color:"#DB2777", slug:"familie",          keywords:["familie","eltern","erziehung"] },
  { id:"kinder",           name:"Kinder",                    icon:"👶", color:"#DB2777", slug:"kinder",           keywords:["kinder","baby","kita","spielen"] },
  { id:"senioren",         name:"Senioren",                   icon:"👵", color:"#475569", slug:"senioren",         keywords:["senioren","alter","pflege"] },
  { id:"ehrenamt",         name:"Ehrenamt",                   icon:"🍀", color:"#0EC4B8", slug:"ehrenamt",         keywords:["ehrenamt","freiwillig","engagement","sozial"] },
  { id:"events",           name:"Events",                     icon:"🎉", color:"#E11D48", slug:"events",           keywords:["events","veranstaltung","party","feier"] },
  { id:"freizeit",         name:"Freizeit",                   icon:"🎪", color:"#EA580C", slug:"freizeit",         keywords:["freizeit","hobby","spass"] },
  { id:"handmade",         name:"Handmade",                   icon:"🛍️", color:"#DB2777", slug:"handmade",         keywords:["handmade","selbstgemacht","unikat"] },
  { id:"diy",              name:"DIY",                        icon:"🧵", color:"#EA580C", slug:"diy",              keywords:["diy","selbermachen","basteln"] },
  { id:"handwerk",         name:"Handwerk",                   icon:"🪚", color:"#D97706", slug:"handwerk",         keywords:["handwerk","werkstatt","holz","metall"] },
  { id:"reparatur",        name:"Reparatur",                  icon:"🔧", color:"#475569", slug:"reparatur",        keywords:["reparatur","reparieren","fixen"] },
  { id:"mobilitaet",       name:"Mobilität",                  icon:"🚗", color:"#0EA5E9", slug:"mobilitaet",       keywords:["mobilitaet","auto","fahrrad","verkehr"] },
  { id:"beauty",           name:"Beauty",                     icon:"💄", color:"#DB2777", slug:"beauty",           keywords:["beauty","kosmetik","pflege"] },
  { id:"mode",             name:"Mode",                       icon:"👗", color:"#DB2777", slug:"mode",             keywords:["mode","fashion","stil","kleidung"] },
  { id:"schmuck",          name:"Schmuck",                    icon:"💎", color:"#DB2777", slug:"schmuck",          keywords:["schmuck","ringe","ketten"] },
  { id:"geschenke",        name:"Geschenke",                  icon:"🎁", color:"#E11D48", slug:"geschenke",        keywords:["geschenke","geschenkidee","praesent"] },
  { id:"dienstleistungen", name:"Dienstleistungen",           icon:"📦", color:"#475569", slug:"dienstleistungen", keywords:["dienstleistung","service"] },
  { id:"finanzen",         name:"Finanzen",                   icon:"📈", color:"#475569", slug:"finanzen",         keywords:["finanzen","geld","investieren","budget"] },
  { id:"recht",            name:"Recht",                      icon:"⚖️", color:"#475569", slug:"recht",            keywords:["recht","jura","vertrag","beratung"] },
  { id:"immobilien",       name:"Immobilien",                 icon:"🏠", color:"#D97706", slug:"immobilien",       keywords:["immobilien","wohnung","haus","miete"] },
  { id:"innovation",       name:"Innovation",                 icon:"💡", color:"#6366F1", slug:"innovation",       keywords:["innovation","idee","zukunft"] },
  { id:"ki",               name:"KI",                          icon:"🤖", color:"#6366F1", slug:"ki",               keywords:["ki","ai","kuenstliche intelligenz","machine learning"] },
  { id:"digitales",        name:"Digitales",                  icon:"🌐", color:"#6366F1", slug:"digitales",        keywords:["digital","internet","online"] },
  { id:"coaching",         name:"Coaching",                   icon:"🧑‍🏫", color:"#0EC4B8", slug:"coaching",        keywords:["coaching","mentoring","beratung"] },
  { id:"lernen",           name:"Lernen",                     icon:"🎓", color:"#D97706", slug:"lernen",           keywords:["lernen","studium","nachhilfe"] },
  { id:"medizin",          name:"Medizin",                    icon:"🩺", color:"#E11D48", slug:"medizin",          keywords:["medizin","arzt","gesundheit","therapie"] },
  { id:"spiritualitaet",   name:"Spiritualität",              icon:"🙏", color:"#9333EA", slug:"spiritualitaet",   keywords:["spiritualitaet","glaube","seele"] },
  { id:"persoenlichkeitsentwicklung", name:"Persönlichkeitsentwicklung", icon:"🌞", color:"#0EC4B8", slug:"persoenlichkeitsentwicklung", keywords:["persoenlichkeitsentwicklung","selbstentwicklung","wachstum"] },
];

// Schnellauswahl-Zeile (horizontal scrollbar, direkt im Discovery-Panel
// sichtbar) -- bewusst kurz gehalten (5 Eintraege), Rest via "Alle Kategorien".
export const FEATURED_SLUGS = ["nachhaltigkeit","kreativitaet","musik","gemeinschaft","bildung"];
export const FEATURED_CATEGORIES = FEATURED_SLUGS
  .map(s => CATEGORIES.find(c => c.slug === s))
  .filter(Boolean);

export function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug) || null;
}

// Client-seitige Filterung der Kategorie-LISTE selbst (nicht der Feed-
// Ergebnisse) -- fuer das Suchfeld im "Alle Kategorien"-Bottom-Sheet.
export function searchCategories(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return CATEGORIES;
  return CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.keywords.some(k => k.toLowerCase().includes(q))
  );
}
