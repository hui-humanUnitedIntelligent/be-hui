# HUI Sprint 10 — Phase 2: ImpactPage Modularisierung

**Datum:** 2026-07-16  
**Branch:** `cursor/sprint10-phase2-impactpage-modular-2c4a`  
**Scope:** Strukturelle Aufteilung — keine Feature-, UI-, UX- oder Architekturänderungen

---

## Aufgabe 1 — Analyse (Original)

| Metrik | Wert |
|--------|------|
| **Datei** | `src/pages/ImpactPage.jsx` |
| **Zeilen (vorher)** | 3.399 |
| **Export** | `ImpactPage(props)` → `ImpactErrorBoundary` → `ImpactPageInner` |

### Hauptbereiche (Original, eine Datei)

| Bereich | Zeilen (ca.) | Typ |
|---------|--------------|-----|
| Imports & Helpers | 1–40 | Setup |
| Design Tokens (T, S, Konstanten) | 43–90 | Tokens |
| Data Hooks (inline) | 96–326, 369–537 | Businesslogik |
| ImpactErrorBoundary | 331–357 | UI |
| ApprovedProjectDetail | 539–1.010 | Dialog |
| MilestoneCard / MilestoneDetailSheet | 1.013–1.223 | UI |
| ApprovedAppCard | 1.224–1.285 | Section |
| **ImpactPageInner** | **1.287–1.575** | **Root-Orchestrierung** |
| BigHero | 1.580–1.670 | Section |
| WirkungsChips | 1.675–1.810 | Section |
| PoolCard | 1.815–1.909 | Section |
| VotingSection / VotingCard | 1.914–2.121 | Section |
| VotePersonal | 2.122–2.208 | Section |
| HerzensKarte / WeitereHerzensprojekte | 2.223–2.375 | Section |
| EmptyImpactState | 2.376–2.416 | UI |
| WeitereHerzensSection | 2.417–2.478 | Section |
| ApprovedAppCardCompact | 2.479–2.529 | Section |
| ImpactTimeline | 2.530–2.662 | Section |
| GemeinsamErmoegicht | 2.663–2.809 | Section |
| HerzensprojektEmotional | 2.810–2.875 | Section |
| LiveTicker | 2.876–2.920 | Section |
| MechanikErklaeung | 2.921–2.980 | Section |
| FondsAufteilungKompakt | 2.985–3.016 | Section |
| LetzteAuszahlung | 3.021–3.078 | Section |
| InfoSheet | 3.086–3.372 | Dialog |
| SkeletonCards | 3.377–3.392 | UI |

### States (ImpactPageInner — unverändert)

`projects`, `loadingProj`, `activeRound`, `userVotes`, `voteLoading`, `showPropose`, `infoModal`, `userImpact`, `detailApp`

### Effects (ImpactPageInner)

- Sync `rankedProjs.top3` → `projects`
- ActiveRound + UserVotes laden
- Realtime `votes_rt_main` (impact_votes INSERT)
- Persönliche Wirkung (hui_payments + impact_votes)

### Contexts

- `useAuth` (user, profile)

### Services / RPCs

- `ImpactService.getCurrentRound()`, `ImpactService.castVote()`
- `FeedService.createActivity()`
- `ProfileService.getMany()`
- Direkte Supabase-Queries in inline Hooks (impact_rounds, impact_votes, impact_applications, …)

### Inline Hooks (bleiben in ImpactPage.jsx)

`useHeroStats`, `usePoolBudgets`, `useTransparenz`, `useLastPayout`, `useWeitereProjects`, `useImpactActivities`, `useAllApprovedByVotes`, `useWeitereHerzensprojekte`, `useApprovedApplications`, `useMonthlyVoteRanking`

---

## Aufgabe 2 — Modulstruktur

```
src/pages/
├── ImpactPage.jsx                    # Re-Export (2 Zeilen)
└── profile/impact/
    ├── ImpactPage.jsx                # Hooks + ImpactPageInner + Export (727 Zeilen)
    ├── tokens.js                     # T, S, CYCLE_STEPS, POOL_SLICES
    ├── utils.js                      # safeArr, safeNum, fmtEur, relTime, fmtMonth
    ├── components/
    │   ├── ImpactErrorBoundary.jsx
    │   ├── SkeletonCards.jsx
    │   ├── EmptyImpactState.jsx
    │   └── MilestoneCard.jsx
    ├── sections/
    │   ├── BigHero.jsx
    │   ├── WirkungsChips.jsx
    │   ├── PoolCard.jsx
    │   ├── VotingSection.jsx
    │   ├── VotingCard.jsx
    │   ├── VotePersonal.jsx
    │   ├── ImpactTimeline.jsx
    │   ├── WeitereHerzensSection.jsx
    │   ├── WeitereHerzensprojekte.jsx
    │   ├── HerzensKarte.jsx
    │   ├── GemeinsamErmoegicht.jsx
    │   ├── HerzensprojektEmotional.jsx
    │   ├── LiveTicker.jsx
    │   ├── MechanikErklaeung.jsx
    │   ├── FondsAufteilungKompakt.jsx
    │   ├── LetzteAuszahlung.jsx
    │   ├── ApprovedAppCard.jsx
    │   └── ApprovedAppCardCompact.jsx
    └── dialogs/
        ├── ApprovedProjectDetail.jsx
        ├── InfoSheet.jsx
        └── MilestoneDetailSheet.jsx
```

Import-Pfade `Home.jsx`, `App.jsx` → `pages/ImpactPage.jsx` bleiben unverändert.

---

## Aufgabe 3 — Ausgelagerte UI-Blöcke

| Modul | Verantwortlichkeit |
|-------|-------------------|
| `BigHero` | Emotionaler Hero-Header |
| `PoolCard` + `WirkungsChips` | Impact-Pool-KPIs |
| `VotingSection` + `VotingCard` | Aktuelle Abstimmung |
| `VotePersonal` | Persönliche Stimmen-Übersicht |
| `ImpactTimeline` | „Impact auf einen Blick“ |
| `WeitereHerzensSection` | Weitere Herzensprojekte (Platz 2–5) |
| `GemeinsamErmoegicht` | Finanzierte Projekte |
| `HerzensprojektEmotional` | Projekt-Einreichungs-CTA |
| `MechanikErklaeung` | Pool-Mechanik-Erklärung |
| `LiveTicker` | Live-Aktivitäts-Ticker |
| `LetzteAuszahlung` | Letzte Pool-Auszahlung |
| `ApprovedProjectDetail` | Projekt-Detail-Bottom-Sheet |
| `InfoSheet` | Info-Modals (leeraus, cycle, vote) |
| `ImpactErrorBoundary` | Crash-Fallback |

---

## Aufgabe 4 — Businesslogik

- **Verbleibt vollständig in** `profile/impact/ImpactPage.jsx`
- Alle inline Hooks unverändert
- `castVote`, Realtime-Subscriptions, Derived-State in `ImpactPageInner`
- Keine Services/RPCs geändert
- Keine Hooks in separate Dateien extrahiert

---

## Aufgabe 5 — Regression (Checkliste)

| Bereich | Status |
|---------|--------|
| Impact öffnen | ✓ Import-Pfad unverändert, Build OK |
| Projekte | ✓ VotingSection + WeitereHerzensSection |
| Abstimmungen | ✓ castVote + VotePersonal unverändert |
| Timeline | ✓ ImpactTimeline extrahiert, gleiche Props |
| Statistiken | ✓ PoolCard + hero stats |
| Diagramme | ✓ WirkungsChips + PoolCard |
| Pool | ✓ usePoolBudgets in Root |
| Navigation | ✓ Tab-Routing unverändert |
| Dialoge | ✓ InfoSheet, ApprovedProjectDetail, ImpactFlow |
| Zurück | ✓ onClose-Handler unverändert |

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
| Re-Renders | Keine neuen Wrapper/Provider |
| Contexts | Keine neuen Contexts |
| Realtime-Subscriptions | `votes_rt_main`, Hook-Channels unverändert in Root |
| Timer | `useImpactActivities` 30s-Interval unverändert |
| Bundle | ImpactPage ~82 kB (gzip ~20.3 kB) — vergleichbar mit vorher (~85 kB) |

---

## Aufgabe 8 — Metriken

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Monolith `ImpactPage.jsx` | 3.399 Zeilen | 2 Zeilen (Re-Export) |
| Root mit Businesslogik | — | 727 Zeilen (−79 %) |
| Gesamtmodul (impact/) | — | 3.451 Zeilen (inkl. Import-Zeilen) |
| Dateien | 1 | 28 |

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Import-Pfad-Fehler | Niedrig | Build + `../../../../` in Subdirs |
| Verhalten-Drift | Niedrig | Code 1:1 verschoben |
| Ungenutzte Extrakte | Niedrig | `ApprovedAppCard`, `FondsAufteilungKompakt` waren bereits unreferenziert im Original — beibehalten |

---

## Definition of Done

- [x] ImpactPage deutlich kleiner (727 vs. 3.399 Zeilen Root-Logik)
- [x] Businesslogik unverändert
- [x] UI unverändert
- [x] Keine neuen Features
- [x] Keine Architekturänderung
- [x] Build erfolgreich
- [x] Performance unverändert
- [x] Ein Commit
- [x] Eine PR
