# HUI Architecture Index — v2.0

> *Zentraler Querverweiskatalog der gesamten HUI-Architektur.*  
> *Jedes Modul, jede Engine, jedes Dokument — an einem Ort verlinkt.*

**Aktualisiert:** 2026-06-29

---

## Fundament

| Dokument | Beschreibung |
|---|---|
| [`HUI_CONSTITUTION.md`](../HUI_CONSTITUTION.md) | **Die Verfassung.** Mission, Grundpfeiler, Goldene Regeln, Architekturprinzipien — unveränderlich |
| [`src/registry/HuiRegistry.js`](../src/registry/HuiRegistry.js) | **Single Source of Meaning.** Sprache, Texte, Farben, Orb-Traits für alle Module |
| [`src/core/hui.pillars.js`](../src/core/hui.pillars.js) | Re-Export der Registry (Rückwärtskompatibilität) |

---

## Engines

### Core Engine
| Datei | Zweck |
|---|---|
| [`src/core/coreEngine.js`](../src/core/coreEngine.js) | Single Source of Truth für Wirkungsdaten |
| [`src/core/resonanceEngine.js`](../src/core/resonanceEngine.js) | Resonanz-Signale, Tiefe der Begegnung |
| [`src/core/orbEngine.js`](../src/core/orbEngine.js) | Orb-Parameter aus Wirkungsprofil |

### Feed Engine
| Datei | Zweck |
|---|---|
| [`src/feed/useFeedStream.js`](../src/feed/useFeedStream.js) | Living Feed Infrastructure |
| [`src/feed/feedRhythmEngine.js`](../src/feed/feedRhythmEngine.js) | Rhythmisierung, Energie-Balance |
| [`src/system/feed/unifiedNormalizer.js`](../src/system/feed/unifiedNormalizer.js) | Normalisierung + Pillar-Hint |
| [`src/feed/cards/FeedRouter.jsx`](../src/feed/cards/FeedRouter.jsx) | Card-Routing nach Content-Typ |

### Intelligence Engine
| Datei | Zweck |
|---|---|
| [`src/lib/intelligence/emotionalIdentity.js`](../src/lib/intelligence/emotionalIdentity.js) | Atmosphärische Identität (privat, nie UI-sichtbar) |
| [`src/lib/intelligence/resonanceSpaces.js`](../src/lib/intelligence/resonanceSpaces.js) | Temporäre Resonanz-Räume |
| [`src/lib/intelligence/relationshipMemory.js`](../src/lib/intelligence/relationshipMemory.js) | Beziehungsgedächtnis |
| [`src/lib/intelligence/sharedAtmosphere.js`](../src/lib/intelligence/sharedAtmosphere.js) | Geteilte Atmosphäre |

### World Engine
| Datei | Zweck |
|---|---|
| [`src/lib/world/orbLayer.js`](../src/lib/world/orbLayer.js) | Orb-Atmosphäre |
| [`src/lib/world/worldSurfaceController.js`](../src/lib/world/worldSurfaceController.js) | Surface-Steuerung |
| [`src/lib/world/safariPaintRecovery.js`](../src/lib/world/safariPaintRecovery.js) | iOS Safari Fix |

---

## Orb

| Datei | Zweck |
|---|---|
| [`src/system/orb/OrbConfig.js`](../src/system/orb/OrbConfig.js) | Orb-Konfiguration (liest aus Registry) |
| [`src/system/orb/OrbSystem.jsx`](../src/system/orb/OrbSystem.jsx) | Orb-System Hauptkomponente |
| [`src/system/orb/OrbCenter.jsx`](../src/system/orb/OrbCenter.jsx) | Orb-Zentrum |
| [`src/components/orb/OrbLeaf.jsx`](../src/components/orb/OrbLeaf.jsx) | Individuelles Blatt (Profil) |
| [`src/hooks/useCoreEngine.js`](../src/hooks/useCoreEngine.js) | React-Hook: useOrbParams, useCoreProfile |

---

## Profil

| Datei | Zweck |
|---|---|
| [`src/components/profile/PublicProfilePreview.jsx`](../src/components/profile/PublicProfilePreview.jsx) | Öffentliche Ansicht mit OrbLeaf + dominantPillars |
| [`src/components/profile/ProfileHeader.jsx`](../src/components/profile/ProfileHeader.jsx) | Profil-Header |
| [`src/pages/TalentProfilePage.jsx`](../src/pages/TalentProfilePage.jsx) | Talent-Profil |

---

## Commerce & Publishing

| Datei | Zweck |
|---|---|
| [`src/components/publishing/PublishWorkFlow.jsx`](../src/components/publishing/PublishWorkFlow.jsx) | Werk veröffentlichen → signalHelpers |
| [`src/components/commerce/WerkKaufFlow.jsx`](../src/components/commerce/WerkKaufFlow.jsx) | Kauf → resonanceHelpers |
| [`src/services/commerceEngine.js`](../src/services/commerceEngine.js) | Commerce-Logik |

---

## Design System

| Datei | Zweck |
|---|---|
| [`src/design/hui.design.js`](../src/design/hui.design.js) | HUI Design System — Farben, Typografie, Spacing |
| [`src/design/hui.interaction.js`](../src/design/hui.interaction.js) | Interaction Tokens |
| [`src/design/hui.hooks.js`](../src/design/hui.hooks.js) | Design-Hooks |

---

## Core Actions & Contracts

| Datei | Zweck |
|---|---|
| [`src/core/hui.actions.js`](../src/core/hui.actions.js) | Action-Definitionen |
| [`src/core/hui.contracts.js`](../src/core/hui.contracts.js) | Action-Verträge |
| [`src/core/hui.flow.js`](../src/core/hui.flow.js) | Flow-Logik |
| [`src/core/hui.navigator.jsx`](../src/core/hui.navigator.jsx) | Navigation |

---

## Dokumentation

| Dokument | Beschreibung |
|---|---|
| [`HUI_CONSTITUTION.md`](../HUI_CONSTITUTION.md) | **Die Verfassung** |
| [`CODEBASE.md`](../CODEBASE.md) | Codebase-Übersicht |
| [`docs/HUI_ACTION_CONTRACTS.md`](HUI_ACTION_CONTRACTS.md) | Action Contract Map |
| [`docs/HUI_ACTION_MAP.md`](HUI_ACTION_MAP.md) | Action Map |
| [`docs/COMMUNITY_PHILOSOPHY.md`](COMMUNITY_PHILOSOPHY.md) | Community-Philosophie |
| [`docs/RANKING_PHILOSOPHY.md`](RANKING_PHILOSOPHY.md) | Warum keine Rankings |
| [`docs/GENTLE_ECONOMY_PHILOSOPHY.md`](GENTLE_ECONOMY_PHILOSOPHY.md) | Sanfte Ökonomie |

---

## Entscheidungsregel (Schnell-Referenz)

Vor jedem neuen Feature:

```
1. Stärkt es mindestens einen Grundpfeiler?           → nein = nicht bauen
2. Passt es zur HUI Constitution?                     → nein = überarbeiten
3. Entsteht echte Wirkung oder nur Aktivität?         → nur Aktivität = überarbeiten
4. Spricht es die HUI Sprache (Registry.LANG)?        → nein = Texte anpassen
5. Ist die Entscheidung in 10 Jahren noch richtig?    → unklar = konservativ
```

---

*Dieser Index wird bei jeder Architekturänderung aktualisiert.*  
*Grundlage aller Entscheidungen: [`HUI_CONSTITUTION.md`](../HUI_CONSTITUTION.md)*
