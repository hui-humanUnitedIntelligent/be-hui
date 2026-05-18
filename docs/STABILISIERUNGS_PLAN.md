# HUI STABILISIERUNGS-PLAN
## Stand: 2026-05-18 10:37

## AUDIT-ERGEBNIS

### Kritische Dateigroessen
| Datei | Zeilen | Status |
|-------|--------|--------|
| WirkerProfilePage.jsx | 3134 | KRITISCH — Modularisierung noetig |
| DiscoveryFeed.jsx | 2613 | KRITISCH — Modularisierung noetig |
| MeinHUI_SubPages.jsx | 2047 | KRITISCH |
| HuiCreateFlow.jsx | 1782 | GROSS |
| Home.jsx | 1545 | GROSS |

### Behobene Build-Fehler (diese Session)
- OK Home.jsx — import-Fragment (sessionHooks)
- OK Home.jsx — doppelte function HomeFeed
- OK AuthContext.jsx — signInWithGoogle ReferenceError
- OK CreatorStudio.jsx — doppelter useCreatorJourney import
- OK PlatformDashboard.jsx — useRecovery Duplikat am Dateiende
- OK ChatPage.jsx — doppelter chatContext import
- OK WirkerProfilePage.jsx — presence ReferenceError (8 Stellen)
- OK WirkerProfilePage.jsx — usePresence falscher Hook (Legacy vs. Presence)

---

## ABSOLUTE IMPORT-REGELN

REIHENFOLGE:
  1. React + Hooks
  2. Third-Party (react-router, etc.)
  3. Supabase / DB
  4. Context (AuthContext, AppStateContext)
  5. Hooks (sessionHooks, bookingContext, etc.)
  6. Lib (lib/*, @/lib/*)
  7. Components
  8. Assets

VERBOTEN:
  - import mitten im Code
  - zwei import-Bloecke fuer dieselbe Quelle
  - nested import { ... } import { ... }
  - Re-imports nach Funktions-Definitionen

PFLICHT vor neuem Import:
  1. Pruefe: existiert das Symbol bereits?
  2. Falls ja: bestehenden Block erweitern
  3. Falls nein: ans Ende des richtigen Abschnitts

---

## ABSOLUTE HOOK-REGELN

NIEMALS:
  - Hooks innerhalb von if/else
  - Hooks nach fruehemreturn
  - Hooks in Schleifen
  - Hook-Reihenfolge veraendern
  - Zwei Hooks gleichen Namens, verschiedener Herkunft verwechseln

PFLICHT:
  - Alle Hooks am Anfang der Komponente
  - Aliase nutzen: import { useX as useXLegacy }
  - Null-Guards: hook?.value statt hook.value
  - Defensive Defaults: const x = useX() ?? null

---

## MODULARISIERUNGS-PLAN

### Phase A — WirkerProfilePage (3134Z)
  src/components/WirkerProfile/
    index.jsx        — Root + Routing (max 150Z)
    WPHeader.jsx     — Hero Image, Avatar, Name, Stats
    WPPresence.jsx   — Creative Presence Layer
    WPReputation.jsx — Trust, Empfehlungen
    WPWerke.jsx      — Works Grid
    WPBooking.jsx    — Request Sheet

### Phase B — DiscoveryFeed (2613Z)
  src/components/DiscoveryFeed/
    index.jsx        — Root + Pipeline (max 200Z)
    WirkerTile.jsx   — Wirker-Kachel
    WerkTile.jsx     — Werk-Kachel
    ExperienceCard.jsx — Erlebnis-Karte
    MomenteBar.jsx   — Story-Leiste

### Phase C — Home (1545Z)
  src/pages/Home/
    index.jsx        — Tab-Router + Keep-Alive (max 200Z)
    HomeFeed.jsx     — Social Feed (bereits extrahiert)
    HomeBottomNav.jsx — Navigation

---

## QUALITAETS-GATES (vor jedem Commit)

  1. Keine mid-file imports
  2. Keine doppelten Symbole (import/no-duplicates)
  3. Hook-Regeln (react-hooks/rules-of-hooks)
  4. Undefined variables (no-undef)

---

## PRIORITAETEN

  1. BUILD-STABILITAET — kein Commit ohne Syntax-Check
  2. HOOK-SICHERHEIT — alle Hooks validiert
  3. MODULARISIERUNG — WirkerProfilePage zuerst
  4. NEUE FEATURES — erst nach Stabilisierung

---

HUI ist keine Dashboard-App. HUI ist eine emotionale, atmosphaerische
Plattform fuer menschliche kreative Verbindung. Stabilitaet ist
Voraussetzung fuer die Premium-UX die HUI verdient.