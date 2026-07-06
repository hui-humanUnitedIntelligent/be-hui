// src/lib/categories.js
// ─────────────────────────────────────────────────────────────────────────
// HUI KATEGORIEN — Single Source of Truth für die gesamte HUI-Domäne
// ─────────────────────────────────────────────────────────────────────────
// v2.0 (2026-07-06, Lars) — ARCHITEKTUR-VEREINHEITLICHUNG
//
// AUFTRAG: "NICHT einfach bestehende Kategorien ersetzen, sondern eine
// saubere Migration VORBEREITEN. Bestehende Daten bleiben vollständig
// kompatibel. Granulare Unterkategorien bleiben erhalten und werden als
// Child-Kategorien modelliert. Keine doppelten Kategorienlisten mehr im
// Projekt. Keine Hardcodes. Keine Datenverluste." Eine eigentliche
// DB-Datenmigration ist explizit NICHT Teil dieses Schritts.
//
// BESTANDSANALYSE (Governance-Pflicht vor Implementierung):
// Vor diesem Schritt gab es 2 verbleibende hartcodierte, granulare
// Kategorie-Listen (die uebergreifende 50er-Discovery-Liste "THEMES" wurde
// bereits im vorherigen Sprint durch v1 dieser Datei ersetzt):
//   1. CATEGORIES in src/system/flows/work/WorkDetailsStep.jsx (15 Werte,
//      Medium/Technik-fokussiert: "Fotografie","Digitale Kunst",...)
//   2. CATEGORIES in src/system/flows/experience/ExperienceCreateStep.jsx
//      (15 Werte, Themen-fokussiert: "Coaching","Meditation","Yoga",...)
// Beide schreiben als reiner Freitext in works.category / experiences.category
// (kein Enum, kein FK). ALLE 28 einzigartigen Werte aus beiden Listen wurden
// 1:1 gegen die bestehende 50er-Themenwelt gemappt (siehe RESOLUTION MAP
// unten) -- jeder bestehende DB-Wert hat jetzt einen exakten, eindeutigen
// Platz im Baum. Kein einziger Wert wurde umbenannt oder entfernt.
//
// DATENMODELL:
//   CATEGORIES = Parent-Ebene (bisher: die 50 Discovery-Themen). Jeder
//   Parent kann optional:
//     - legacyValues:  Freitext-Werte, die DIREKT diesem Parent entsprechen
//                       (z.B. "Fotografie" -> Parent "fotografie")
//     - appliesTo:      in welchen Kontexten dieser Parent als eigene Option
//                       auswaehlbar ist -- "search" (Discovery/Suche, immer),
//                       zusaetzlich "work" und/oder "experience" (Create-Flows)
//     - children:       granulare Unterkategorien (z.B. "Illustration",
//                       "Yoga") -- gleiche Feldstruktur wie Parents, aber
//                       ohne eigene Children (aktuell max. 2 Ebenen tief,
//                       aus gutem Grund: die UI braucht heute nicht mehr;
//                       das Datenmodell selbst erzwingt keine Tiefen-Grenze).
//
// KOMPATIBILITAETS-BRUECKE (kein Datenverlust, keine Migration heute):
//   resolveLegacyCategory(value) findet zu JEDEM bestehenden Freitext-Wert
//   in works.category/experiences.category (unabhaengig vom Flow) den
//   passenden Knoten im neuen Baum. Diese Funktion ist die Grundlage fuer
//   einen SPAETEREN, separaten Migrations-/Backfill-Schritt (z.B. um allen
//   Werken/Erlebnissen zusaetzlich ein normalisiertes category_slug-Feld zu
//   geben) -- schreibt selbst NICHTS in die DB, ist rein lesend.
//
//   getFlowCategoryOptions(flowKey) liefert fuer "work"/"experience" exakt
//   die gleiche Wertemenge (gleiche Strings, gleiche Reihenfolge) wie die
//   bisherigen hartcodierten CATEGORIES-Arrays -- die Create-Flows binden
//   sich jetzt AUSSCHLIESSLICH hieran, ohne dass sich am gespeicherten Wert
//   oder an der sichtbaren Auswahl irgendetwas aendert (reine Architektur-
//   Vereinheitlichung, kein UX-Wechsel).
//
// ZUKUNFTSSICHERHEIT — vorbereitete, HEUTE UNGENUTZTE Erweiterungspunkte
// (rein additiv, kein Scope-Creep, keine Breaking Changes):
//   parentId (Children referenzieren dies implizit ueber die Baumposition)
//   synonyms:     []    -> Synonyme fuer Suche/KI
//   aiTags:       []    -> KI-generierte Zusatz-Tags
//   i18n:         null  -> Mehrsprachigkeit, z.B. { en:"Creativity", ... }
//   region:       null  -> regionale Kategorien/Sichtbarkeit
//   personalized: null  -> personalisierte Kategorie-Gewichtung pro Nutzer
//   rank:         null  -> Ranking/Relevanz-Score
//   embedding:    null  -> Vektor fuer semantische Suche
// Diese Felder werden von KEINER aktuellen Komponente gelesen -- sie legen
// nur den Vertrag fest, damit spaetere Features (Suche/Feed/Marketplace/
// Buchungen/Impact/KI) ohne Strukturbruch andocken koennen.

// ── PARENT-KATEGORIEN (Discovery-Themenwelt, 50 Eintraege) ───────────────
export const CATEGORIES = [
  cat("nachhaltigkeit",   "Nachhaltigkeit",           "🌱", "#16A34A", ["nachhaltig","natur","umwelt","klima","oekologisch"]),
  cat("kreativitaet",     "Kreativität",              "🎨", "#9333EA", ["kreativ","kunst","design","gestaltung"], {
    legacyValues:["Kreativität"], appliesTo:["search","experience"],
    children:[
      child("illustration",   "Illustration",   ["Illustration"],   ["work"]),
      child("design",         "Design",         ["Design"],         ["work","experience","profile"]),
    ],
  }),
  cat("musik",            "Musik",                    "🎵", "#0EA5E9", ["musik","musiker","band","konzert","song","instrument"], {
    legacyValues:["Musik"], appliesTo:["search","work","experience","profile"],
  }),
  cat("gemeinschaft",     "Gemeinschaft",             "🤝", "#0EC4B8", ["gemeinschaft","community","nachbarschaft","treffen"]),
  cat("bildung",          "Bildung",                  "📚", "#D97706", ["bildung","lernen","kurs","workshop","schule"], {
    legacyValues:["Bildung"], appliesTo:["search","profile"],
  }),
  cat("technologie",      "Technologie",              "💻", "#6366F1", ["technologie","tech","software","programmieren","code"], {
    legacyValues:["Technologie"], appliesTo:["search","experience","profile"],
  }),
  cat("business",         "Business",                 "💼", "#475569", ["business","unternehmen","startup","gruendung"]),
  cat("gesundheit",       "Gesundheit",               "❤️", "#E11D48", ["gesundheit","wellness","fitness","ernaehrung"], {
    legacyValues:["Wellness"], appliesTo:["search","profile"],
  }),
  cat("achtsamkeit",      "Achtsamkeit",              "🧘", "#0EC4B8", ["achtsamkeit","meditation","mindfulness","ruhe"], {
    children:[
      child("meditation", "Meditation", ["Meditation"], ["experience"]),
      child("yoga",       "Yoga",       ["Yoga"],       ["experience"]),
    ],
  }),
  cat("kochen",           "Kochen",                   "🍳", "#EA580C", ["kochen","kueche","rezept","backen"], {
    legacyValues:["Gastronomie"], appliesTo:["search","profile"],
    children:[ child("ernaehrung", "Ernährung", ["Ernährung"], ["experience"]) ],
  }),
  cat("garten",           "Garten",                   "🌿", "#16A34A", ["garten","pflanzen","gaertnern","balkon"]),
  cat("wohnen",           "Wohnen",                   "🏡", "#D97706", ["wohnen","einrichtung","zuhause","interior"], {
    children:[ child("architektur", "Architektur", ["Architektur"], ["work"]) ],
  }),
  cat("kunst",            "Kunst",                    "🎭", "#9333EA", ["kunst","malerei","skulptur","galerie"], {
    legacyValues:["Kunst"], appliesTo:["search","experience","profile"],
    children:[
      child("digitale-kunst", "Digitale Kunst", ["Digitale Kunst"], ["work"]),
      child("malerei",        "Malerei",        ["Malerei"],        ["work"]),
      child("skulptur",       "Skulptur",       ["Skulptur"],       ["work"]),
      child("tanz",           "Tanz",           ["Tanz"],           ["experience"]),
    ],
  }),
  cat("fotografie",       "Fotografie",               "📷", "#0EA5E9", ["fotografie","foto","kamera","shooting"], {
    legacyValues:["Fotografie"], appliesTo:["search","work","experience","profile"],
  }),
  cat("film",             "Film",                     "🎬", "#6366F1", ["film","video","kino","regie"], {
    children:[ child("video", "Video", ["Video"], ["work","profile"]) ],
  }),
  cat("gaming",           "Gaming",                   "🎮", "#6366F1", ["gaming","games","zocken","esport"]),
  cat("literatur",        "Literatur",                "📖", "#D97706", ["literatur","buch","lesen","roman"]),
  cat("schreiben",        "Schreiben",                "✍️", "#D97706", ["schreiben","text","autor","bloggen"], {
    legacyValues:["Text"], appliesTo:["search","profile"],
  }),
  cat("sprache",          "Sprache",                  "🎤", "#0EA5E9", ["sprache","sprechen","rhetorik","vortrag"], {
    legacyValues:["Sprachen"], appliesTo:["search","experience"],
  }),
  cat("reisen",           "Reisen",                   "🌍", "#EA580C", ["reisen","urlaub","reise","abenteuer"]),
  cat("outdoor",          "Outdoor",                  "🏕️", "#16A34A", ["outdoor","wandern","camping","natur"]),
  cat("sport",            "Sport",                    "🚴", "#E11D48", ["sport","fitness","training","bewegung"], {
    legacyValues:["Sport"], appliesTo:["search","experience","profile"],
  }),
  cat("tiere",            "Tiere",                    "🐶", "#16A34A", ["tiere","hund","katze","tierschutz"]),
  cat("familie",          "Familie",                  "👨‍👩‍👧", "#DB2777", ["familie","eltern","erziehung"]),
  cat("kinder",           "Kinder",                   "👶", "#DB2777", ["kinder","baby","kita","spielen"]),
  cat("senioren",         "Senioren",                 "👵", "#475569", ["senioren","alter","pflege"]),
  cat("ehrenamt",         "Ehrenamt",                 "🍀", "#0EC4B8", ["ehrenamt","freiwillig","engagement","sozial"]),
  cat("events",           "Events",                   "🎉", "#E11D48", ["events","veranstaltung","party","feier"], {
    legacyValues:["Events"], appliesTo:["search","profile"],
  }),
  cat("freizeit",         "Freizeit",                 "🎪", "#EA580C", ["freizeit","hobby","spass"]),
  cat("handmade",         "Handmade",                 "🛍️", "#DB2777", ["handmade","selbstgemacht","unikat"]),
  cat("diy",              "DIY",                      "🧵", "#EA580C", ["diy","selbermachen","basteln"]),
  cat("handwerk",         "Handwerk",                 "🪚", "#D97706", ["handwerk","werkstatt","holz","metall"], {
    legacyValues:["Handwerk"], appliesTo:["search","work","profile"],
    children:[
      child("keramik", "Keramik", ["Keramik"], ["work"]),
      child("textil",  "Textil",  ["Textil"],  ["work"]),
    ],
  }),
  cat("reparatur",        "Reparatur",                "🔧", "#475569", ["reparatur","reparieren","fixen"]),
  cat("mobilitaet",       "Mobilität",                "🚗", "#0EA5E9", ["mobilitaet","auto","fahrrad","verkehr"]),
  cat("beauty",           "Beauty",                   "💄", "#DB2777", ["beauty","kosmetik","pflege"]),
  cat("mode",             "Mode",                     "👗", "#DB2777", ["mode","fashion","stil","kleidung"], {
    legacyValues:["Mode"], appliesTo:["search","work","profile"],
  }),
  cat("schmuck",          "Schmuck",                  "💎", "#DB2777", ["schmuck","ringe","ketten"], {
    legacyValues:["Schmuck"], appliesTo:["search","work"],
  }),
  cat("geschenke",        "Geschenke",                "🎁", "#E11D48", ["geschenke","geschenkidee","praesent"]),
  cat("dienstleistungen", "Dienstleistungen",         "📦", "#475569", ["dienstleistung","service"]),
  cat("finanzen",         "Finanzen",                 "📈", "#475569", ["finanzen","geld","investieren","budget"]),
  cat("recht",            "Recht",                    "⚖️", "#475569", ["recht","jura","vertrag","beratung"]),
  cat("immobilien",       "Immobilien",               "🏠", "#D97706", ["immobilien","wohnung","haus","miete"]),
  cat("innovation",       "Innovation",               "💡", "#6366F1", ["innovation","idee","zukunft"]),
  cat("ki",               "KI",                       "🤖", "#6366F1", ["ki","ai","kuenstliche intelligenz","machine learning"]),
  cat("digitales",        "Digitales",                "🌐", "#6366F1", ["digital","internet","online"]),
  cat("coaching",         "Coaching",                 "🧑‍🏫", "#0EC4B8", ["coaching","mentoring","beratung"], {
    legacyValues:["Coaching"], appliesTo:["search","experience","profile"],
  }),
  cat("lernen",           "Lernen",                   "🎓", "#D97706", ["lernen","studium","nachhilfe"]),
  cat("medizin",          "Medizin",                  "🩺", "#E11D48", ["medizin","arzt","gesundheit","therapie"]),
  cat("spiritualitaet",   "Spiritualität",            "🙏", "#9333EA", ["spiritualitaet","glaube","seele"]),
  cat("persoenlichkeitsentwicklung", "Persönlichkeitsentwicklung", "🌞", "#0EC4B8", ["persoenlichkeitsentwicklung","selbstentwicklung","wachstum"], {
    legacyValues:["Persönlichkeit"], appliesTo:["search","experience"],
  }),
  // Fallback-Bucket -- KEIN Discovery-Thema (hidden:true, taucht nicht im
  // "Alle Kategorien"-Grid auf), existiert ausschliesslich, damit der
  // Legacy-Wert "Sonstiges" (aus beiden Create-Flows) einen verlustfreien
  // Platz im Baum hat.
  cat("sonstiges",        "Sonstiges",                "🗂️", "#475569", [], {
    legacyValues:["Sonstiges"], appliesTo:["work","experience","profile"], hidden:true,
  }),
];

// ── Konstruktor-Helfer (halten die Liste oben lesbar, keine Wiederholung
//    der Erweiterungsfelder in jeder Zeile) ───────────────────────────────
function baseExtensions() {
  return { synonyms:[], aiTags:[], i18n:null, region:null, personalized:null, rank:null, embedding:null };
}
function cat(id, name, icon, color, keywords, extra = {}) {
  return {
    id, name, icon, color, slug:id, keywords,
    legacyValues: extra.legacyValues || [],
    appliesTo: extra.appliesTo || ["search"],
    hidden: !!extra.hidden,
    children: (extra.children || []).map(c => ({ ...c, parentId:id })),
    ...baseExtensions(),
  };
}
function child(id, name, legacyValues, appliesTo, keywords = []) {
  return {
    id, name, icon:null, color:null, slug:id, keywords,
    legacyValues: legacyValues || [], appliesTo: appliesTo || [], hidden:false,
    children: [],
    ...baseExtensions(),
  };
}

// ── Schnellauswahl-Zeile (Discovery-Panel, horizontal scrollbar) ─────────
export const FEATURED_SLUGS = ["nachhaltigkeit","kreativitaet","musik","gemeinschaft","bildung"];
export const FEATURED_CATEGORIES = FEATURED_SLUGS
  .map(s => CATEGORIES.find(c => c.slug === s))
  .filter(Boolean);

// ── Baum-Zugriffshelfer ───────────────────────────────────────────────────
export function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug) || null;
}

// Alle Knoten (Parents + Children) als flache Liste, jeweils mit Referenz
// auf den Parent-Slug (bei Parents == eigener Slug). Interner Baustein fuer
// die Funktionen unten -- kann spaeter auch direkt fuer Admin-Tools o.ae.
// wiederverwendet werden.
function flattenNodes() {
  const out = [];
  for (const p of CATEGORIES) {
    out.push({ node: p, parentSlug: p.slug, isChild: false });
    for (const c of p.children) {
      out.push({ node: c, parentSlug: p.slug, isChild: true });
    }
  }
  return out;
}

// Client-seitige Filterung der Parent-LISTE (fuer das "Alle Kategorien"-
// Bottom-Sheet) -- matcht jetzt zusaetzlich gegen Children/Legacy-Werte,
// damit z.B. die Suche nach "Yoga" den Parent "Achtsamkeit" findet (mehr
// Recall, ohne dass die UI selbst Unterkategorien anzeigen muss).
export function searchCategories(query, { includeHidden = false } = {}) {
  const q = (query || "").trim().toLowerCase();
  const base = includeHidden ? CATEGORIES : CATEGORIES.filter(c => !c.hidden);
  if (!q) return base;
  return base.filter(c => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.keywords.some(k => k.toLowerCase().includes(q))) return true;
    if (c.legacyValues.some(v => v.toLowerCase().includes(q))) return true;
    return c.children.some(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.legacyValues.some(v => v.toLowerCase().includes(q))
    );
  });
}

// KOMPATIBILITAETS-BRUECKE: findet zu einem bestehenden Freitext-Wert aus
// works.category/experiences.category (unabhaengig vom Flow) den passenden
// Knoten im neuen Baum. Rein lesend -- schreibt nichts, veraendert keine
// Daten. Grundlage fuer einen spaeteren, separaten Migrations-/Backfill-Schritt.
export function resolveLegacyCategory(value) {
  const v = (value || "").trim().toLowerCase();
  if (!v) return null;
  for (const { node, parentSlug, isChild } of flattenNodes()) {
    if (node.legacyValues.some(lv => lv.toLowerCase() === v)) {
      return { parentSlug, childId: isChild ? node.id : null, node };
    }
  }
  return null;
}

// Reihenfolge der Legacy-Optionen pro Flow -- 1:1 identisch zur Reihenfolge
// der frueheren hartcodierten CATEGORIES-Arrays in WorkDetailsStep.jsx bzw.
// ExperienceCreateStep.jsx, damit sich an der sichtbaren Auswahl fuer die
// Nutzer *nichts* aendert (reine Architektur-Vereinheitlichung, kein UX-Wechsel).
const FLOW_ORDER = {
  profile: ["musik","kunst","design","fotografie","video","schreiben","bildung","sport","gesundheit","kochen","events","coaching","handwerk","technologie","mode","sonstiges"],
  work: ["fotografie","digitale-kunst","illustration","design","malerei","skulptur","keramik","schmuck","textil","mode","musik","video","architektur","handwerk","sonstiges"],
  experience: ["coaching","musik","fotografie","meditation","yoga","design","sprache","sport","kunst","technologie","tanz","ernaehrung","persoenlichkeitsentwicklung","kreativitaet","sonstiges"],
};

// Liefert fuer einen Create-Flow ("work" | "experience") die exakte Menge an
// auswaehlbaren Freitext-Werten (Strings) -- Drop-in-Ersatz fuer die
// bisherigen hartcodierten CATEGORIES-Konstanten in den Create-Flow-Dateien.
// Jeder zurueckgegebene String ist exakt der Wert, der wie bisher in
// works.category/experiences.category geschrieben wird.
export function getFlowCategoryOptions(flowKey) {
  const values = [];
  for (const { node, parentSlug } of flattenNodes()) {
    if (!node.appliesTo.includes(flowKey)) continue;
    const label = node.legacyValues[0] || node.name;
    if (!values.includes(label)) values.push(label);
  }
  const order = FLOW_ORDER[flowKey] || [];
  const idFor = (label) => {
    const hit = flattenNodes().find(({node}) => (node.legacyValues[0]||node.name) === label);
    return hit ? hit.node.id : label;
  };
  return values.sort((a, b) => {
    const ia = order.indexOf(idFor(a));
    const ib = order.indexOf(idFor(b));
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
