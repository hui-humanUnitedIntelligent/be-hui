// src/lib/releaseNotes.js
// ═══════════════════════════════════════════════════════════════════
// SSOT: "Was ist neu"-Highlights pro App-Version (Michael 08.09.2026)
// ═══════════════════════════════════════════════════════════════════
// Der Agent pflegt bei JEDEM OTA-Release hier die Nutzer-sichtbaren
// Highlights der neuen Version (kurz, max. 5-6 Punkte, keine Details).
// Die WhatsNewModal-Komponente zeigt die Einträge beim ersten Start der
// neuen Version genau einmal (localStorage-Merker).
//
// Format: RELEASE_NOTES["<version>"] = { de: [...], en: [...] }
// - Nur Versionen mit Eintrag zeigen ein Sheet — kein Eintrag, kein Sheet.
// - de = Deutsch (Primärsprache der Closed-Beta), en = Fallback für alle
//   anderen UI-Sprachen (bewusst: Changelog-Übersetzung in 8 Sprachen wäre
//   Wartungsaufwand ohne Mehrwert für die Beta — Architektur-Charta:
//   Einfachheit vor Komplexität).
// - Nach ~8 Wochen können alte Einträge entfernt werden (Bundle-Hygiene).
// ═══════════════════════════════════════════════════════════════════

export const RELEASE_NOTES = {
  // 2.1.580 — von Michael am 09.09.2026 freigegeben ("deploy mit text")
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.580": {
    de: [
      "Entdecken: Neues Filter-Menü — Region & Sprache",
      "Profile: Follower- und Folgt-Listen per Antippen der Zahlen",
      "Projekt-Benachrichtigungen: Navigation repariert",
      "Übersetzungen verbessert",
      "Stabilität: Kommentare & Standortsuche für Web-Nutzer repariert",
    ],
    en: [
      "Discover: New filter menu — region & language",
      "Profiles: Tap the follower numbers to see follower & following lists",
      "Project notifications: navigation fixed",
      "Translations improved",
      "Stability: comments & location search fixed for web users",
    ],
  },

  // 2.1.579 — von Michael am 09.09.2026 vor Deploy geprueft und freigegeben
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.579": {
    de: [
      "Sprachauswahl für Inhalte: Du kannst Werken, Talent-Angeboten und Erlebnissen jetzt eine Sprache zuordnen",
      "Entdecken zeigt Inhalte passend zu deiner App-Sprache — über „Alle Sprachen“ siehst du alles",
      "In Profilen: Wenn jemand in mehreren Sprachen postet, kannst du oben per Filter wechseln",
      "Videos in Momenten werden jetzt zuverlässig mit Vorschaubild angezeigt",
      "Gefüllte Herzen bleiben jetzt zuverlässig gefüllt",
    ],
    en: [
      "Language selection: You can now assign a language to works, talent offers and experiences",
      "Discover shows content matching your app language — switch to „All languages“ to see everything",
      "In profiles: If someone posts in several languages, you can switch with a filter",
      "Videos in moments now display reliably with preview images",
      "Filled hearts now stay filled",
    ],
  },
  // 2.1.578 — von Michael am 08.09.2026 vor Deploy geprueft und freigegeben
  // (DEPLOY-INFO-REGEL: keine Nutzer-Infos ohne seine Text-Freigabe).
  "2.1.578": {
    de: [
      "Folgen ist jetzt zuverlässig: Entfolgen wird überall sofort angezeigt",
      "Das „Folge ich“-Zeichen sitzt jetzt über den Herzen auf Profil-Karten",
      "Herzensprojekte: Profilbilder der Unterstützer sind sichtbar",
      "Profil-Bezeichnungen korrigiert: Talent, Projekt, Verein, Unternehmen",
    ],
    en: [
      "Following is now reliable: unfollows show everywhere instantly",
      "The „Following“ label now sits above the hearts on profile cards",
      "Heart projects: profile pictures of supporters are now visible",
      "Profile labels corrected: Talent, Project, Association, Company",
    ],
  },
  // 2.1.577 — erstes Release mit WhatsNewModal. Fasst die Highlights der
  // Bug-Queue-Batches 2.1.572-577 zusammen (User haben diese OTAs teils
  // einzeln, teils kumulativ gezogen — das Sheet deckt alles Sichtbare ab).
  "2.1.577": {
    de: [
      "Gesichtserkennung & Face ID: App lässt sich jetzt per Gesicht entsperren",
      "Herz wird beim Liken jetzt gefüllt angezeigt",
      "Inspirierende Menschen: Like-Zähler und Account-Typ unter jedem Profil sichtbar",
      "Meine Tickets: Liste und Chat lassen sich durch Ziehen aktualisieren",
      "Impact: Projektbilder auf Tablets größer und proportional",
      "Zuverlässigere Antworten vom Support (E-Mail-Fehler behoben)",
    ],
    en: [
      "Face recognition & Face ID: unlock the app with your face",
      "Like hearts are now shown filled in",
      "Inspiring people: like counts and account type under every profile",
      "My tickets: pull to refresh in list and chat",
      "Impact: larger, proportional project images on tablets",
      "More reliable support replies (email bug fixed)",
    ],
  },
};

// Notizen fuer die aktuell laufende Version (oder null)
export function getReleaseNotes(version, lang) {
  const entry = RELEASE_NOTES[version];
  if (!entry) return null;
  if (lang && entry[lang] && entry[lang].length) return entry[lang];
  return entry.en || null;
}
