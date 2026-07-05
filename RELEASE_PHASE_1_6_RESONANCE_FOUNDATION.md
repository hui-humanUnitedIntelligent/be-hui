# RELEASE Phase 1.6 — Meine Resonanz Foundation

**Release:** HUI Release Engineering Phase 1.6  
**Datum:** 2026-07-01  
**Status:** Abgeschlossen

---

## Vision

„Meine Resonanz" ist die persönliche Erlebniswelt eines Menschen innerhalb von HUI — kein Dashboard, kein Konto, kein Creator Studio.

> Alles, was HUI bei mir bewegt.

---

## Finale Architektur

```
/resonanz                    → MeineResonanzFoundation (Hub)
/resonanz/:section           → Deep-Link zu Sektion

src/features/resonance/
├── foundation/
│   ├── MeineResonanzFoundation.jsx   # Offizieller Einstieg
│   ├── resonanceSections.js          # Sektions-Registry (flexible Reihenfolge)
│   ├── ResonanceSectionShell.jsx     # Gemeinsamer Sektions-Rahmen
│   ├── components/
│   │   └── MyRecommendationsContent.jsx
│   └── sections/
│       ├── TimelineSection.jsx
│       ├── ResonanzzentrumSection.jsx
│       ├── DeinRaumSection.jsx
│       ├── ErlebtSection.jsx
│       └── EmpfehlungenSection.jsx
└── legacy/
    └── LEGACY_RESONANCE_COMPONENTS.md
```

### Sektions-Registry (`resonanceSections.js`)

Die Reihenfolge ist zentral konfigurierbar — Phase 1.7 kann die Navigationsreihenfolge ändern, ohne Komponenten zu refactoren:

| ID | Label | Tagline | Komponente |
|----|-------|---------|------------|
| `timeline` | Timeline | Alles, was mich bewegt hat | `MeineResonanz` (embedded) |
| `dein-raum` | Dein Raum | Gespeicherte Inhalte, Favoriten, Merklisten | `MerkenSection` |
| `erlebt` | Erlebt | Buchungen, Käufe, besuchte Erlebnisse, unterstützte Projekte | `MeineResonanz` (gefiltert) |
| `empfehlungen` | Empfehlungen | Von mir ausgesprochene Empfehlungen | `MyRecommendationsContent` |
| `resonanzzentrum` | Resonanzzentrum | Alles, was zu mir zurückkommt | `ResonanzzentrumPanel` |

**Vorbereitete zukünftige Reihenfolge (Phase 1.7):**  
Timeline → Dein Raum → Erlebt → Empfehlungen → Resonanzzentrum  
(Array in `resonanceSections.js` umsortieren — kein Refactoring nötig)

---

## Offizieller Einstieg

| Vorher | Nachher |
|--------|---------|
| `MyBasisProfile` → Overlay `MeineResonanz` | `MyBasisProfile` → `navigate("/resonanz")` |
| Keine URL-Route | `/resonanz` und `/resonanz/:section` |
| Kein Action-Contract | `A.OPEN_MEINE_RESONANZ` in `hui.actions.js` |

---

## Verwendete Komponenten (produktiv)

| Sektion | Komponente | Datenquelle |
|---------|------------|-------------|
| Timeline | `src/pages/studio/MeineResonanz.jsx` | `orders`, `payments`, `bookings`, `impact_votes`, `impact_applications` |
| Dein Raum | `src/components/profile/MerkenSection.jsx` | `saved_posts` |
| Erlebt | `MeineResonanz` mit `allowedTypes` | Gleiche Timeline-Queries, gefiltert |
| Empfehlungen | `MyRecommendationsContent` | `user_recommendations` |
| Resonanzzentrum | `ResonanzzentrumPanel` aus `useNotifications.jsx` | Notifications + Connection Requests |

### Anpassungen an bestehenden Komponenten

- **`MeineResonanz.jsx`**: Neue Props `embedded`, `allowedTypes`, `defaultFilter`, `emptyTitle`, `emptyBody` — kein neues Datenmodell
- **`HuiStudio.jsx`**: `MyRecommendationsModal` nutzt jetzt `MyRecommendationsContent` (keine Duplikation)
- **`MyBasisProfile.jsx`**: Shortcut leitet zu `/resonanz` statt Overlay

---

## Integrierte Bereiche

- Persönliche Timeline (Commerce + Impact + Buchungen)
- Gespeicherte Inhalte / Merklisten
- Erlebte Transaktionen und Unterstützungen
- Ausgesprochene Empfehlungen
- Benachrichtigungen (Resonanzzentrum)

---

## Bewusst getrennte Bereiche

### Studio (nicht in Resonance)

- Einnahmen (`EinAusgabenModal`, `CreatorDashboard`)
- Creator-Aufträge
- Creator-Verwaltung (`HuiStudio` Account)
- Werke verwalten (`MeineWerkeSection` in Profil)
- Erlebnisse verwalten (`ErlebnisseSection` in Profil)

### Profil (nur Identität)

- Avatar, Cover, Bio, Talente
- Öffentliche Sections (Works, Experiences als Showcase)
- Einstellungen, Studio-Zugang
- **Keine** dauerhaften Erlebnisdaten im Profil

---

## Leere Zustände

Keine Mock-Daten. Hochwertige Empty States:

- Timeline/Erlebt: `TimelineEmptyState` in `MeineResonanz`
- Dein Raum: `MerkenSection` eigener Empty State
- Empfehlungen: `components/ui/EmptyState.jsx`
- Resonanzzentrum: `EmptyState` preset `notifications`

---

## Navigation

| Mechanismus | Details |
|-------------|---------|
| Route | `/resonanz`, `/resonanz/:section` in `App.jsx` |
| Action | `A.OPEN_MEINE_RESONANZ` → `navigate("/resonanz")` |
| Source | `S.RESONANCE` in `hui.sources.js` |
| Registry | Einträge `resonanz` + `resonanz-section` in `routes/registry.js` |
| Ref-Exclusion | `resonanz` in `EXCLUDED_REF_PATHS` |

---

## Verbleibende technische Schulden

1. **`FavoritesPage`** — Mock-Daten, kein Nav-Link; sollte in Phase 1.7 entweder an `MerkenSection` angebunden oder archiviert werden
2. **`CreatorStudio` vs `HuiStudio`** — parallele Studio-Systeme (dokumentiert in `routes/registry.js`)
3. **`MeinHUI` Journey** — Mock-Daten, kein Link zu echter Timeline
4. **`ResonanzzentrumSection`** — öffnet Panel als Overlay; embedded Inline-Ansicht für Phase 1.7
5. **Timeline-Navigation** — `onNavigate` in Erlebt/Timeline nutzt Router; Buchungs-Details noch ohne Deep-Link
6. **`GO_FAVORITES`** — Action existiert, kein UI-Aufruf; Dein Raum jetzt über `/resonanz/dein-raum`

---

## Empfehlung für Phase 1.7

1. **Navigations-Reihenfolge finalisieren** — `RESONANCE_SECTIONS` umsortieren gemäß Produktentscheidung
2. **Bottom-Nav oder Orb-Link** — offiziellen Einstieg `/resonanz` in primäre Navigation integrieren
3. **`MeinHUI` anbinden** — „Deine Reise" mit echter Timeline verknüpfen, Mock-Daten entfernen
4. **`FavoritesPage` bereinigen** — Mock-Daten entfernen oder Seite archivieren
5. **Resonanzzentrum inline** — `embedded`-Variante für `ResonanzzentrumPanel`
6. **Deep-Links** — Buchungs- und Erlebnis-Details aus Timeline-Einträgen
7. **Studio-Konsolidierung** — `CreatorStudio`-Stubs durch `HuiStudio`-Modals ersetzen

---

## Definition of Done

- [x] Meine Resonanz besitzt einen offiziellen Einstieg (`/resonanz`)
- [x] Es existiert eine gemeinsame Foundation-Struktur
- [x] Keine neuen Datenmodelle
- [x] Keine Mock-Daten in Foundation
- [x] Keine doppelten Komponenten (Empfehlungen extrahiert)
- [x] Studio bleibt sauber getrennt
- [x] Profil bleibt sauber getrennt
- [x] Build erfolgreich
- [x] Keine neuen ESLint-Fehler
- [x] Dokumentation vollständig
