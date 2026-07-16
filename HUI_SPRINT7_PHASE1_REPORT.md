# HUI Sprint 7 Phase 1 — P0 Bugfix Report

**Datum:** 2026-07-16  
**Branch:** `cursor/open-profile-p0-fix-81c2`  
**Grundlage:** `HUI_ARCHITECTURE_MASTER_PLAN.md` Phase 0, Maßnahme 0.1  
**Scope:** Minimaler Fix für `OPEN_PROFILE` — kein Refactoring, keine Architekturänderung

---

## Executive Summary

Der P0-Bug **`OPEN_PROFILE` öffnet kein Profil-Overlay** wurde mit einer **4-Zeilen-Änderung** in `src/core/hui.actions.js` behoben. Die Action schreibt jetzt `selectedProfileId` via `openProfileById()` — den State, den `ProfileLauncher` tatsächlich rendert.

Build: **erfolgreich** (`npm install` Exit 0, `npm run build` Exit 0).

---

## Aufgabe 1 — Datenpfad (IST → SOLL)

### Vorher (defekt)

```
User-Klick (Chat, Empfehlungen, wirker-profile, useProfileLauncher, …)
        ↓
actions[A.OPEN_PROFILE](payload)          — hui.actions.js:184
        ↓
validate("OPEN_PROFILE", payload)
        ↓
setShowWirker(data)                       — hui.actions.js:204
        ↓
HomeShell State: showWirker = creator-Objekt
        ↓
ProfileLauncher liest nur selectedProfileId — ProfileLauncher.jsx:237
        ↓
selectedProfileId === null → kein Render
        ↓
❌ Profil öffnet nicht
```

### Nachher (behoben)

```
User-Klick
        ↓
actions[A.OPEN_PROFILE](payload)
        ↓
validate → creatorId / data.id / data.user_id extrahieren
        ↓
openProfileById(profileId)              — HomeShell.jsx:272
        ↓
setSelectedProfileId(trimmed UUID)
        ↓
ProfileLauncher: selectedProfileId gesetzt — ProfileLauncher.jsx:237
        ↓
useProfileType → isProfileTalent
        ↓
TalentProfilePage | BasisProfilePage Overlay
        ↓
✅ Profil rendert
```

### CLOSE_PROFILE (mitgefixt)

| Vorher | Nachher |
|--------|---------|
| `setShowWirker(null)` — wirkungslos | `closeProfileById()` → `setSelectedProfileId(null)` |

### closeAll() (mitgefixt)

| Vorher | Nachher |
|--------|---------|
| `setShowWirker(null)` | `closeProfileById()` |

---

## Aufgabe 2 — Root Cause

**Ursache:** State-Wiring-Bruch zwischen Action Engine und ProfileLauncher.

- `OPEN_PROFILE` setzte seit Phase 2/4 den State `showWirker` (Creator-Objekt).
- `ProfileLauncher` rendert ausschließlich bei `selectedProfileId` (UUID-String) oder `showCreatorDashboard` (eigenes Profil).
- **Kein Renderer** liest `showWirker` — State war tot (belegt in `HUI_PROFILE_SYSTEM_AUDIT.md`, Aufgabe 2.5).

**Warum Feed/Discover trotzdem funktionierten:** Diese Pfade nutzen `openProfileById()` direkt (`Home.jsx:396`, `Home.jsx:462`), nicht `OPEN_PROFILE`.

---

## Implementierter Minimal-Fix

**Datei:** `src/core/hui.actions.js` only

1. `buildActions(shell)`: `setShowWirker` durch `openProfileById` + `closeProfileById` ersetzt.
2. `OPEN_PROFILE`: `profileId = creatorId ?? data?.id ?? data?.user_id` → `openProfileById(String(profileId).trim())`.
3. `CLOSE_PROFILE`: `closeProfileById()` statt `setShowWirker(null)`.
4. `closeAll()`: `closeProfileById()` statt `setShowWirker(null)`.

**Nicht geändert:** `showWirker` State in `HomeShell.jsx` (bleibt ungenutzt — bewusst außerhalb Scope), UI-Komponenten, ProfileLauncher, Deep-Link-Routen.

---

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/core/hui.actions.js` | OPEN_PROFILE/CLOSE_PROFILE/closeAll auf `selectedProfileId`-Pfad |
| `HUI_SPRINT7_PHASE1_REPORT.md` | Dieser Bericht |

---

## Aufgabe 3 — Einstiegspunkte (statische Verifikation)

| Einstieg | Mechanismus | Vor Fix | Nach Fix |
|----------|-------------|---------|----------|
| **Feed Avatar** | `openProfileById` direkt (`Home.jsx:396`) | ✓ | ✓ (unverändert) |
| **Discover** | `onView` → `openProfileById` (`Home.jsx:462`) | ✓ | ✓ (unverändert) |
| **Chat Profil-Tap** | `openCreatorProfile` → `OPEN_PROFILE` (`ChatCenterOverlay.jsx:361,431`) | ✗ | ✓ |
| **Empfehlungen** | `openProfileById` direkt (`MyRecommendationsModal.jsx:204`) | ✓ | ✓ (unverändert) |
| **MyBasisProfile Notifications** | `__HUI_OPEN_PROFILE__` → `openProfileById` | ✓ | ✓ (unverändert) |
| **PostFullscreenView** | `__HUI_OPEN_PROFILE__` → `openProfileById` | ✓ | ✓ (unverändert) |
| **wirker-profile Community** | `OPEN_PROFILE` (`wirker-profile/index.jsx:668`) | ✗ | ✓ |
| **useProfileLauncher** | `openProfile` / `openCreatorProfile` → `OPEN_PROFILE` | ✗ | ✓ |
| **OPEN_EXPERIENCE** | delegiert an `OPEN_PROFILE` (`hui.actions.js:263`) | ✗ | ✓ |
| **Favorites** | `onView` → `openProfileById` (`Home.jsx:499`) | ✓ | ✓ (unverändert) |
| **LiveMap / Match** | `onView` → `openProfileById` | ✓ | ✓ (unverändert) |
| **Suche (Feed)** | `openProfileById` bei Profil-Treffern | ✓ | ✓ (unverändert) |
| **AmbassadorStudio** | `openProfileById` direkt | ✓ | ✓ (unverändert) |

---

## Aufgabe 4 — Regressionstest (statische Analyse)

| Szenario | Erwartung | Risiko |
|----------|-----------|--------|
| **Basisprofil** (Fremd, nicht-Talent) | `ProfileLauncher` → `BasisProfilePage` | Keine Änderung am Renderer |
| **Talentprofil** (Fremd) | `ProfileLauncher` → `TalentProfilePage` | Keine Änderung am Renderer |
| **Eigenes Profil** | `OPEN_OWN_PROFILE` → `showCreatorDashboard` | Unverändert — anderer Action-Pfad |
| **Overlay schließen** | `closeProfileById` / `onClose` | `CLOSE_PROFILE` jetzt funktional |
| **Navigation zurück** | `selectedProfileId = null` | Unverändert |
| **Mehrfach öffnen** | `setSelectedProfileId` mit neuer ID | Unverändert |
| **Deep Links** `/profile/:username` | `App.jsx` Route → `WirkerProfilePage` | **Nicht angefasst** |

**Hinweis:** Kein manueller Browser-Test in dieser Cloud-Agent-Session. Verifikation erfolgte via Import-Graph, State-Wiring und erfolgreichem Production-Build.

---

## Aufgabe 5 — Build-Ergebnis

```
npm install  → Exit 0 (377 packages, 0 vulnerabilities)
npm run build → Exit 0 (vite build, 807 modules, 5.02s)
```

Keine neuen Build-Fehler. Bestehende Chunk-Size-Warnungen unverändert.

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| `showWirker` State bleibt in HomeShell | Niedrig | Tot; Entfernung in späterer Phase (Master-Plan Phase 4) |
| `profileId` nicht string-fähig | Niedrig | `String(profileId).trim()`; `openProfileById` validiert UUID-Format |
| Profil offen + Tab-Wechsel | Niedrig | `closeAllOverlays` in HomeShell setzt bereits `selectedProfileId(null)` |
| OPEN_CHAT mit offenem Profil (LOOP 1) | Keine Regression | Kommentar „NICHT setShowWirker(null)" unverändert; `selectedProfileId` bleibt bei Chat-Open |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| OPEN_PROFILE funktioniert wieder | ✓ (State → `selectedProfileId`) |
| Alle bekannten Einstiegspunkte adressiert | ✓ (siehe Tabelle) |
| Kein Buildfehler | ✓ |
| Keine Regression auf direkten `openProfileById`-Pfaden | ✓ (unverändert) |
| Nur dieser Bug behoben | ✓ (1 Produktionsdatei) |
| Keine Architekturänderung | ✓ |
| Keine UI/Design-Änderung | ✓ |

---

## Nächster Schritt

**Sprint 7 Phase 2** gemäß `HUI_ARCHITECTURE_MASTER_PLAN.md` Phase 0, Maßnahme 0.2: Commerce Edge Functions Deploy-Verifikation.

---

*Ende Sprint 7 Phase 1*
