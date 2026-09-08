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
