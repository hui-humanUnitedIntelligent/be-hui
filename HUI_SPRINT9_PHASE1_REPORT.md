# HUI Sprint 9 – Phase 1: Create Center Consolidation

**Datum:** 2026-07-16  
**Branch:** `cursor/sprint9-phase1-create-center-2c4a`  
**Scope:** Create-Einstiegspunkte konsolidieren — kein Refactoring der Create-Flows, keine Feed/Commerce/Presence/Orb-Änderungen.

---

## Architektur-Entscheidung (verbindlich)

| Bereich | Rolle |
|---------|-------|
| **MyBasisProfile** | Einzige produktive Create-Zentrale |
| **Orb / MeinHUI** | Persönliche Entwicklung, Resonanz, Wirkungsfeld — **kein Create** |

---

## Aufgabe 1 — Create-Einstiegspunkte (Audit)

| Datei | Funktion / Komponente | Erreichbar? | Ziel | Status Phase 1 |
|-------|----------------------|-------------|------|----------------|
| `src/pages/MyBasisProfile.jsx` | `MomentsSection` → `onAddMoment` → `TeilenFlow` | ✅ Ja | Moment teilen | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `MeinBereichMenu` → `WerkWizard` | ✅ Ja | Werk erstellen | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `MeinBereichMenu` → `ExperienceWizard` | ✅ Ja | Erlebnis erstellen | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `MeinBereichMenu` → `TalentAngebotWizard` | ✅ Ja | Talent-Angebot | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `ImpactProjekteTab` / Event → `ImpactFlow` | ✅ Ja | Impact-Projekt einreichen | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `ImpactUpdateSheet` | ✅ Ja | Impact-Update (bestehendes Projekt) | **Produktiv (Zentrale)** |
| `src/pages/MyBasisProfile.jsx` | `ImpactStimmenModal` | ✅ Ja | Impact-Stimmen abgeben | **Produktiv (Zentrale, kein Create)** |
| `src/components/home/profile/ProfileLauncher.jsx` | `openOwnProfile` → `MyBasisProfile` | ✅ Ja | Profil / Create-Hub öffnen | **Produktiv** |
| `src/components/home/navigation/HUIBottomNavigation.jsx` | Tab „Profil“ → `A.OPEN_OWN_PROFILE` | ✅ Ja | Profil / Create-Hub | **Produktiv** |
| `src/pages/Home.jsx` | Orb-Tap → `MeinHUI` (`setShowPlusSheet`) | ✅ Ja | Wirkungsraum (kein Create) | **Unverändert** |
| `src/pages/ImpactPage.jsx` | `HerzensprojektEmotional.onPropose` | ✅ Ja | → `openOwnProfile` + ImpactFlow im Profil | **Umgeleitet** |
| `src/core/hui.actions.js` | `OPEN_CREATE_FLOW`, `CREATE_EXPERIENCE`, `OPEN_STORY_COMPOSER`, `OPEN_IMPACT_FLOW` | ✅ Ja (Dispatcher) | → `openOwnProfile` (+ Impact-Event) | **Umgeleitet** |
| ~~`src/components/OrbCompass.jsx`~~ | Orb-Create-Kompass | ❌ Nein | Moment/Werk/Erlebnis/Impact | **Entfernt** |
| ~~`src/components/HuiMomentSheet.jsx`~~ | Moment-Sheet (nur via OrbCompass) | ❌ Nein | Moment | **Entfernt** |
| ~~`src/content/ContentTypeSelector.jsx`~~ | Typ-Auswahl (kein `setShowContentSelector(true)`) | ❌ Nein | Werk/Erlebnis/Moment/Einladung | **Entfernt** |
| ~~`src/components/HuiCreateFlow.jsx`~~ | Progressive Create v2 (kein Caller) | ❌ Nein | Multi-Type Create | **Entfernt** |
| ~~`src/pages/Home.jsx`~~ | `WorkFlow` / `ExperienceFlow` / `ImpactFlow` / `StoryComposer` / `TeilenFlow` Overlays | ❌ Nein | Legacy Orb/Home-Create | **Entfernt (Einstieg)** |
| ~~`src/pages/Home.jsx`~~ | `ContentTypeSelector` + `InvitationFlow` | ❌ Nein | Typ-Routing | **Entfernt (Einstieg)** |
| `src/pages/ImpactPage.jsx` | ~~`ImpactFlow` direkt~~ | — | Impact einreichen | **Entfernt (doppelter Einstieg)** |

**Hinweis:** `HUI_CREATE_SYSTEM_AUDIT.md` lag im Repo nicht vor — Reachability-Analyse erfolgte per Code-Grep und Call-Graph.

---

## Aufgabe 2 — Entfernte tote Einstiegspunkte

### Gelöschte Dateien (~135 KB Dead Code)

- `src/components/OrbCompass.jsx`
- `src/components/HuiMomentSheet.jsx`
- `src/content/ContentTypeSelector.jsx`
- `src/components/HuiCreateFlow.jsx`

### Entfernte Home/HomeShell-Einstiege

- Lazy-Imports und Render-Blöcke: `TeilenFlow`, `WorkFlow`, `ExperienceFlow`, `ImpactFlow`, `StoryComposer`, `HuiCreateFlow`, `ContentTypeSelector`, `InvitationFlow`
- State-Flags: `showCreateFlow`, `showContentSelector`, `showTeilen`, `showStoryComposer`, `showWerkPublisher`, `showExperienceCreator`, `showImpactFlow`, `showInvitationFlow`

### Bereinigte Dispatcher (`hui.actions.js`)

- `OPEN_CREATE_FLOW`, `CREATE_EXPERIENCE`, `OPEN_STORY_COMPOSER` → `openOwnProfile()`
- `OPEN_IMPACT_FLOW` → `openOwnProfile()` + `hui:open-impact-propose` Event
- `SHARE_MOMENT` Fallback auf `StoryComposer` entfernt (nur noch native Share API)

---

## Aufgabe 3 — MyBasisProfile als einzige Create-Zentrale

| Funktion | Einstieg in MyBasisProfile |
|----------|---------------------------|
| Moment | `MomentsSection` → `TeilenFlow` |
| Werk | Mein Bereich → Werke → `WerkWizard` |
| Erlebnis | Mein Bereich → Erlebnisse → `ExperienceWizard` |
| Talent-Angebot | Mein Bereich → Talent-Angebote → `TalentAngebotWizard` |
| Impact (neu) | Mein Bereich → Erlebnisse/Impact-Tab → „Projekt einreichen“ → `ImpactFlow` |

**Keine produktiven Orb-Create-Pfade mehr.** Orb öffnet weiterhin `MeinHUI` (Resonanz/Wirkungsfeld).

---

## Aufgabe 4 — Regression (Code-Review / statisch)

| Check | Ergebnis |
|-------|----------|
| Profil öffnen (`OPEN_OWN_PROFILE`, Tab Profil) | ✅ Unverändert |
| Moment erstellen | ✅ `TeilenFlow` nur aus Profil |
| Werk erstellen | ✅ `WerkWizard` aus Profil |
| Erlebnis erstellen | ✅ `ExperienceWizard` aus Profil |
| Talent-Angebot | ✅ `TalentAngebotWizard` aus Profil |
| Impact | ✅ `ImpactFlow` aus Profil; ImpactPage leitet um |
| Abbrechen / Zurück | ✅ Flows behalten eigene `onClose` — unverändert |

---

## Aufgabe 5 — Build

```bash
npm install   # ✅ 0 vulnerabilities
npm run build # ✅ 792 modules, 4.55s
```

---

## Risiken

1. **Talent-Profil ohne MomentsSection:** Basis-User sehen Momente im Profil; Talent-User haben aktuell keine `MomentsSection` im Layout — ggf. Phase 2.
2. **Deep-Link Timing:** ImpactPage → Profil + Event `hui:open-impact-propose` setzt voraus, dass `MyBasisProfile` gemountet ist (via `ProfileLauncher`).
3. **Legacy-Docs:** `docs/HUI_ACTION_MAP.md` referenziert noch Orb-Create-Pfade — Dokumentation nicht Teil dieses Sprints.
4. **Flow-Implementierungen unverändert:** `TeilenFlow`, `WerkWizard`, `ExperienceWizard`, `ImpactFlow` etc. wurden nicht refactored — nur Einstiegspunkte.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| MyBasisProfile ist die einzige Create-Zentrale | ✅ |
| Keine produktiven Orb-Create-Pfade | ✅ |
| Keine doppelten Einstiegspunkte (Home/OrbCompass/ImpactPage-Flow) | ✅ |
| Build erfolgreich | ✅ |
| Keine Änderungen an den eigentlichen Create-Flows | ✅ |
| Keine Architekturänderung außerhalb Create-Einstieg | ✅ (Feed/Commerce/Presence/Orb-Verhalten unverändert) |
