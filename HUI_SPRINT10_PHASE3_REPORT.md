# HUI Sprint 10 — Phase 3: DiscoverPage Modularisierung

**Datum:** 2026-07-16  
**Branch:** `cursor/sprint10-phase3-discoverpage-modular-2c4a`  
**Scope:** Strukturelle Aufteilung — keine Feature-, UI-, UX- oder Architekturänderungen

---

## Aufgabe 1 — Analyse (Original)

| Metrik | Wert |
|--------|------|
| **Datei** | `src/pages/DiscoverPage.jsx` |
| **Zeilen (vorher)** | 2.299 |
| **Export** | `DiscoverPage({ onView, onMap, onBook })` |

### Hauptbereiche (Original, eine Datei)

| Bereich | Zeilen (ca.) | Typ |
|---------|--------------|-----|
| Imports & Lazy-Modals | 1–30 | Setup |
| Design Tokens & CSS | 33–96 | Tokens |
| Helpers (safeStr, timeAgo, …) | 99–109 | Utils |
| ViewToggle, Skel, SectionHead | 112–186 | UI |
| DiscoverTitleBar | 203–222 | Header |
| PersonCard, PeopleSection | 271–449 | Section |
| MomentCard, MomenteSection | 459–607 | Section |
| CardPrimitives, TalentCard, TalenteSection | 608–871 | Section |
| WerkCard, LocationRadiusRow, WerkeSection | 872–1115 | Section |
| ErlebnisCard, ErlebnisseSection | 1120–1307 | Section |
| ProjektCard, ProjekteSection | 1308–1491 | Section |
| OrteSection, OrtCard | 1492–1599 | Section |
| filterByRadius | 1600–1622 | Filter-Logik |
| **DiscoverPage (Businesslogik)** | **1630–2.299** | **Root** |

### States (Root — unverändert)

`view`, `loading`, `people`, `momente`, `werke`, `talente`, `erlebnisse`, `projekte`, `talentLocQuery/Suggest/Searching`, `werkLocQuery/...`, `erlebnisLocQuery/...`, `talentInquiry`, `talentBooking`, Modal-States (`showWerkeModal`, …)

### Effects (Root)

- Daten-Loader (profiles, beitraege, works, talents, experiences, impact_applications)
- Geocoding-Debounces für Talent/Werk/Erlebnis-Standortsuche (3× 450ms)

### Contexts / Hooks

- `useRadiusFilter()` — globaler Radius-Zustand
- `useAuthGate()` — Auth-Gating für Talent-Buchung
- `useContentPreview()` — Vorschau-Infrastruktur

### Services / Queries

- Supabase: `profiles`, `beitraege`, `works`, `talents`, `experiences`, `impact_applications`
- `searchPlaces()` — Nominatim-Geocoding
- `distanceKm()` — Distanzberechnung

### Dialoge / Modals (Root-Orchestrierung)

- `TalentAnfrageFlow`, `TalentBookingFlow`
- Lazy: `WerkeAllModal`, `TalenteAllModal`, `ErlebnisseAllModal`, `MomenteAllModal`, `ProjekteAllModal`, `OrteAllModal`

---

## Aufgabe 2 — Modulstruktur

```
src/pages/
├── DiscoverPage.jsx                    # Re-Export (2 Zeilen)
└── profile/discover/
    ├── DiscoverPage.jsx                # Businesslogik + Orchestrierung (726 Zeilen)
    ├── tokens.js                       # T, CSS, SEED_*, MEDIUM_COLOR, …
    ├── utils.js                        # safeStr, personTags, timeAgo, …
    ├── components/
    │   ├── ViewToggle.jsx
    │   ├── Skel.jsx
    │   ├── SectionHead.jsx
    │   ├── DiscoverTitleBar.jsx
    │   ├── CardPrimitives.jsx
    │   └── LocationRadiusRow.jsx
    └── sections/
        ├── PersonCard.jsx, PeopleSection.jsx
        ├── MomentCard.jsx, MomenteSection.jsx
        ├── TalentCard.jsx, TalenteSection.jsx
        ├── WerkCard.jsx, WerkeSection.jsx
        ├── ErlebnisCard.jsx, ErlebnisseSection.jsx
        ├── ProjektCard.jsx, ProjekteSection.jsx
        └── OrtCard.jsx, OrteSection.jsx
```

Import-Pfade `Home.jsx`, `App.jsx` → `pages/DiscoverPage.jsx` bleiben unverändert.

---

## Aufgabe 3 — Ausgelagerte UI-Blöcke

| Modul | Verantwortlichkeit |
|-------|-------------------|
| `DiscoverTitleBar` | Header + View-Toggle |
| `LocationRadiusRow` | Standort-Suche + Radius-Chips |
| `PeopleSection` | Menschen entdecken |
| `MomenteSection` | Momente-Karussell |
| `TalenteSection` | Talente + Umkreissuche |
| `WerkeSection` | Werke + Radius |
| `ErlebnisseSection` | Erlebnisse + Radius |
| `ProjekteSection` | Impact-Projekte |
| `OrteSection` | Orte entdecken |
| `CardPrimitives` | CardBadge, CardTitle, CardLocationRow |

`React.memo` für TalentCard/WerkCard/ErlebnisCard bleibt in den jeweiligen Section-Dateien (identisches Render-Verhalten).

---

## Aufgabe 4 — Businesslogik

- **Verbleibt vollständig in** `profile/discover/DiscoverPage.jsx`
- `filterByRadius()` in Root
- Alle Supabase-Queries, Handler (`handlePersonPress`, `handleWerkPress`, …)
- Radius-Debounces und `useRadiusFilter`-Integration
- Keine Hooks extrahiert, keine Services geändert

---

## Aufgabe 5 — Regression (Checkliste)

| Bereich | Status |
|---------|--------|
| Suche | ✓ Geocoding-Debounces in Root |
| Radius | ✓ useRadiusFilter + filterByRadius unverändert |
| Kategorien | ✓ Karten-Badges unverändert |
| Karten | ✓ Card/Grid-Views extrahiert, gleiche Props |
| Listen | ✓ List-View in Sections |
| Detailansichten | ✓ openPreview / navigate Handler in Root |
| Filter | ✓ displayTalente/Werke/Erlebnisse-Logik in Root |
| Navigation | ✓ onView/onMap/onBook Props unverändert |

---

## Aufgabe 6 — Build

```bash
npm install   # ✓
npm run build # ✓ 834 modules, built in ~5s
```

---

## Aufgabe 7 — Performance

| Prüfpunkt | Ergebnis |
|-----------|----------|
| Render-Verhalten | Unverändert — gleiche Komponenten-Hierarchie |
| Re-Renders | React.memo in Sections beibehalten |
| Contexts | Keine neuen Contexts |
| Realtime-Subscriptions | Keine (war schon so) |
| Timer | 3× Geocoding-Debounce (450ms) + useImpactActivities N/A |
| Bundle | DiscoverPage ~75 kB (gzip ~17.2 kB) — vergleichbar mit vorher |

---

## Aufgabe 8 — Metriken

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Monolith `DiscoverPage.jsx` | 2.299 Zeilen | 2 Zeilen (Re-Export) |
| Root mit Businesslogik | — | 726 Zeilen (−68 %) |
| Gesamtmodul (discover/) | — | ~2.450 Zeilen (inkl. Import-Zeilen) |
| Dateien | 1 | 24 |

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Import-Pfad-Fehler | Niedrig | Build + `../../../../` in Subdirs |
| Memo-Verhalten | Niedrig | memo in Section-Dateien beibehalten |
| SEED-Fallbacks | Niedrig | SEED_* in tokens.js, Import in Root |

---

## Definition of Done

- [x] DiscoverPage deutlich kleiner (726 vs. 2.299 Zeilen Root-Logik)
- [x] Businesslogik unverändert
- [x] UI unverändert
- [x] Keine neuen Features
- [x] Keine Architekturänderung
- [x] Build erfolgreich
- [x] Performance unverändert
- [x] Ein Commit
- [x] Eine PR
