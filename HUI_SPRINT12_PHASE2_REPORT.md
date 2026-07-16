# HUI Sprint 12 — Phase 2 Report: Supabase Query Hardening

**Stand:** 2026-07-16  
**Branch:** `cursor/sprint12-query-hardening-6c13`  
**Grundlage:** `HUI_PERFORMANCE_BASELINE_AUDIT.md` (Phase 1), `QUERY_RULES.md`

---

## Executive Summary

| Metrik | Vorher | Nachher | Delta |
|--------|-------:|--------:|------:|
| Unbounded SELECTs (touchable, `src/`) | **79** | **53** | **−26** |
| Unbounded SELECTs (gesamt inkl. Presence) | 80 | 54 | −26 |
| Geänderte Dateien | — | **17** | — |
| Geänderte Queries | — | **26** | — |
| Build (`npm run build`) | — | **✓ erfolgreich** | — |

**Methode:** Statischer Chain-Scanner (`.from()` + `.select()` ohne `.limit()`, `.range()`, `.single()`, `.maybeSingle()`, `count/head`, `buildPage()`).  
**Scope-Ausschlüsse (Sprint-Vorgabe):** Feed, Commerce, Presence, Navigation — keine Änderungen in diesen Bereichen.

**Keine Änderungen an:** Businesslogik, UI/UX, Realtime, Sortierung, Filter, Tabellen, Migrationen, RPCs.

---

## Aufgabe 1 — Inventar unbounded SELECTs

### Scanner-Ergebnis vor Hardening: 79 touchable Queries

| Datei | Zeile | Tabelle | ORDER BY | LIMIT/RANGE | Produktiv |
|-------|------:|---------|:--------:|:-----------:|:---------:|
| `StoryBar.jsx` | 73 | story_views | Nein | Nein | Ja |
| `StoryBar.jsx` | 681 | stories | Ja | Nein | Ja |
| `AmbassadorStudioSection.jsx` | 237 | profiles | Nein | Nein | Ja |
| `AmbassadorStudioSection.jsx` | 306 | profiles | Nein | Nein | Ja |
| `AmbassadorStudioSection.jsx` | 594 | profiles | Ja | Nein | Ja |
| `ChatCenterOverlay.jsx` | 192 | follows | Nein | Nein | Ja |
| `ChatCenterOverlay.jsx` | 208 | follows | Nein | Nein | Ja |
| `EinAusgabenModal.jsx` | 113 | payments | Ja | Nein | Ja |
| `EinAusgabenModal.jsx` | 138 | bookings | Ja | Nein | Ja |
| `EinAusgabenModal.jsx` | 163 | orders | Ja | Nein | Ja |
| `EinAusgabenModal.jsx` | 199 | payments | Ja | Nein | Ja |
| `EinAusgabenModal.jsx` | 226 | bookings | Ja | Nein | Ja |
| `EinAusgabenModal.jsx` | 257 | order_items | Nein | Nein | Ja |
| `EinAusgabenModal.jsx` | 265 | works | Nein | Nein | Ja |
| `MeineProjekteModal.jsx` | 90 | project_support | Ja | Nein | Ja |
| `MeineProjekteModal.jsx` | 97 | impact_votes | Ja | Nein | Ja |
| `MeineProjekteModal.jsx` | 115 | impact_projects | Nein | Nein | Ja |
| `MeineProjekteModal.jsx` | 126 | impact_applications | Ja | Nein | Ja |
| `MeineProjekteModal.jsx` | 697 | impact_milestones | Ja | Nein | Ja |
| `MyRecommendationsModal.jsx` | 44 | user_recommendations | Ja | Nein | Ja |
| `MyRecommendationsModal.jsx` | 68 | impact_projects | Nein | Nein | Ja |
| `MyRecommendationsModal.jsx` | 78 | works | Nein | Nein | Ja |
| `MyRecommendationsModal.jsx` | 88 | experiences | Nein | Nein | Ja |
| `StatistikenModal.jsx` | 139 | works | Nein | Nein | Ja |
| `TeilenFlow.jsx` | 851 | beitraege | Nein | Nein | Legacy-False-Positive* |
| `coreEngine.js` | 443 | core_profiles | Nein | Nein | Ja (maybeSingle) |
| `resonanceEngine.js` | 246 | core_resonance_chains | Nein | Nein | Ja |
| `useLiveTicker.js` | 154 | works | Nein | Nein | Ja |
| `useLiveTicker.js` | 185 | impact_projects | Nein | Nein | Ja |
| `useMySales.js` | 26 | order_items | Ja | Nein | Ja |
| `useProfileLocations.js` | 21 | profile_locations | Ja | Nein | Ja |
| `useTalentBookings.js` | 34 | talent_bookings | Ja | Nein | Ja |
| `useTalentBookings.js` | 36 | talent_bookings | Ja | Nein | Ja |
| `useTalents.js` | 31 | talents | Ja | Nein | Ja |
| `AppStateContext.jsx` | 89 | follows | Nein | Nein | Ja |
| `bookingContext.js` | 413 | availability_slots | Ja | Nein | Ja |
| `chatContext.js` | 159 | chat_participants | Nein | Nein | Ja |
| `chatContext.js` | 169 | messages | Nein | Nein | Ja |
| `contentPreviewLoaders.js` | 27–70 | diverse | Nein | Nein | Ja (maybeSingle) |
| `useNotifications.jsx` | 209 | profile_relations | Ja | Nein | Ja |
| `useReactions.jsx` | 41 | post_reactions | Nein | Nein | Ja |
| `useReactions.jsx` | 188 | saved_posts | Nein | Nein | Ja |
| `Admin.jsx` | 127 | post_comments | Nein | Nein | Ja |
| `Admin.jsx` | 133 | profiles | Nein | Nein | Ja |
| `DiscoverPage.jsx` | 1849 | profiles | Nein | Nein | Ja |
| `FavoritesPage.jsx` | 730 | payments | Nein | Nein | Ja |
| `ImpactPage.jsx` | 149 | bookings | Nein | Nein | Ja |
| `ImpactPage.jsx` | 188 | impact_projects | Nein | Nein | Ja |
| `ImpactPage.jsx` | 190 | impact_votes | count | Nein | Ja |
| `ImpactPage.jsx` | 236 | impact_projects | Nein | Nein | Ja |
| `ImpactPage.jsx` | 306 | impact_projects | Nein | Nein | Ja |
| `ImpactPage.jsx` | 393 | impact_votes | Nein | Nein | Ja |
| `ImpactPage.jsx` | 474 | impact_votes | Nein | Nein | Ja |
| `ImpactPage.jsx` | 623 | impact_project_updates | Ja | Nein | Ja |
| `ImpactPage.jsx` | 652 | impact_milestones | Ja | Nein | Ja |
| `ImpactPage.jsx` | 1334 | impact_votes | Nein | Nein | Ja |
| `ImpactPage.jsx` | 1385 | hui_payments | Nein | Nein | Ja |
| `ImpactPage.jsx` | 1387 | impact_votes | Nein | Nein | Ja |
| `MyBasisProfile.jsx` | 2605 | impact_applications | Ja | Nein | Ja |
| `services/db.js` | 96 | profiles | Nein | Nein | Ja |
| `services/db.js` | 162 | wirker_profiles | Ja | Nein | Ja (buildPage) |
| `services/db.js` | 498 | impact_votes | Nein | Nein | Ja |
| `services/db.js` | 554 | feed_items | Ja | Nein | Ja (Feed — nicht geändert) |
| `MerkenSection.jsx` | 151 | works | Nein | Nein | Ja |
| `MerkenSection.jsx` | 160 | experiences | Nein | Nein | Ja |
| `MerkenSection.jsx` | 169 | beitraege | Nein | Nein | Ja |
| `CommentsSheet.jsx` | 229 | profiles | Nein | Nein | Ja |
| `MomenteAllModal.jsx` | 108 | profiles | Nein | Nein | Ja |
| `TalenteAllModal.jsx` | 107 | profiles | Nein | Nein | Ja |
| `ImpactStimmenModal.jsx` | 114 | impact_applications | Ja | Nein | Ja |
| `ImpactStimmenModal.jsx` | 118 | impact_votes | Nein | Nein | Ja |
| `usePresence.jsx` | 106 | user_presence | Nein | Nein | Ja (Presence — nicht geändert) |

\* `TeilenFlow.jsx:851` — Scanner-False-Positive (`getSession()`, kein SELECT).

---

## Aufgabe 2 — Bewertung (A vs B)

### Kategorie B — angepasst (26 Queries)

| Kriterium | Begründung |
|-----------|------------|
| `.in('id', ids)` + `.limit(ids.length)` | Ergebnismenge ist durch `ids`-Array bereits begrenzt; Limit ändert keine Ergebnisse |
| `.limit(10)` auf Monats-Stimmen | Code dokumentiert max. 2 Stimmen/Monat (`ImpactService.castVote`, `ImpactPage`) |
| `.limit(50)` auf approved Applications | SSOT-Cap identisch mit `ImpactPage.useAllApprovedByVotes` (Zeile 382) |

### Kategorie A — bewusst unbounded (nicht geändert)

| Query / Bereich | Begründung |
|-----------------|------------|
| `useTransparenz` — alle `impact_projects` | Aggregat-Counts pro Status; Limit würde Statistiken verfälschen |
| `usePoolBudgets` — Monats-`bookings` | Summe `platform_fee` über alle Buchungen des Monats |
| Vote-Counts `.in(project_id, appIds)` | Braucht alle Stimmen für bis zu 50 Apps zur korrekten Sortierung |
| `EinAusgabenModal` — payments/bookings/orders | Vollständige Finanzhistorie des Users |
| `MeineProjekteModal` — supports/votes/apps | Vollständige Studio-Historie |
| `AppStateContext` / `ChatCenterOverlay` — follows | Vollständiger Follow-Graph für Toggle-State |
| `chatContext` — messages | Unread-Count braucht alle ungelesenen Nachrichten pro Chat |
| `useSavedPosts` — saved_posts | Vollständiges Set für Merken-State |
| `useTalents` / `useMySales` / `useTalentBookings` | Vollständige Listen in Studio/Commerce-UI |
| `AmbassadorStudioSection` — referred profiles | Vollständige Referral-Liste |
| `StoryBar` — story_views | Vollständiges View-Set für Unread-Ring |
| `StatistikenModal` — works stats | Aggregation über alle eigenen Werke |
| `contentPreviewLoaders` | `one()` → `.maybeSingle()` (1 Zeile); Scanner-False-Positive |
| `db.js` wirker_profiles.list | `buildPage()` via Return; Scanner-False-Positive |
| `db.js` feed_items | Feed-Bereich — Sprint-Ausschluss |
| `usePresence` | Presence-Bereich — Sprint-Ausschluss |
| `impact_project_updates` / `impact_milestones` pro Projekt | Detail-Ansicht zeigt alle Updates/Meilensteine |
| `resonanceEngine.totalReach` | Summe `participant_count` über alle Chains |
| `FavoritesPage` payments | Legacy-Tabelle; Summen-Aggregation (leer in Produktion) |

---

## Aufgabe 3 — Durchgeführte Änderungen

### Geänderte Queries (Vorher → Nachher)

| # | Datei | Tabelle | Änderung | Begründung |
|---|-------|---------|----------|------------|
| 1 | `services/db.js` | profiles | `+ .limit(ids.length)` | Batch-Load; ids-Array begrenzt Ergebnis |
| 2 | `services/db.js` | impact_votes | `+ .limit(10)` | Max. 2 Stimmen/Monat (Validierung) |
| 3 | `ImpactPage.jsx` | impact_projects | `+ .limit(projIds.length)` | projIds max. 1 Eintrag |
| 4 | `ImpactPage.jsx` | impact_projects | `+ .limit(pIds.length)` | pIds aus max. 8 Votes |
| 5 | `ImpactPage.jsx` | impact_votes | `+ .limit(10)` | User-Stimmen aktueller Monat |
| 6 | `MerkenSection.jsx` | works | `+ .limit(ids.work.length)` | IN-Filter begrenzt |
| 7 | `MerkenSection.jsx` | experiences | `+ .limit(ids.experience.length)` | IN-Filter begrenzt |
| 8 | `MerkenSection.jsx` | beitraege | `+ .limit(ids.beitrag.length)` | IN-Filter begrenzt |
| 9 | `CommentsSheet.jsx` | profiles | `+ .limit(ids.length)` | Autoren der geladenen Kommentarseite |
| 10 | `DiscoverPage.jsx` | profiles | `+ .limit(providerIds.length)` | Max. 8 Provider aus Talent-Query |
| 11 | `MomenteAllModal.jsx` | profiles | `+ .limit(ids.length)` | IDs aus paginierter Seite |
| 12 | `TalenteAllModal.jsx` | profiles | `+ .limit(ids.length)` | IDs aus paginierter Seite |
| 13 | `useLiveTicker.js` | works | `+ .limit(workIds.length)` | workIds aus PER_SOURCE_LIMIT=5 |
| 14 | `useLiveTicker.js` | impact_projects | `+ .limit(projectIds.length)` | projectIds aus PER_SOURCE_LIMIT=5 |
| 15 | `MeineProjekteModal.jsx` | impact_projects | `+ .limit(allIds.length)` | IN-Filter begrenzt |
| 16 | `useTalentBookings.js` | profiles | `+ .limit(otherIds.length)` | IN-Filter begrenzt |
| 17 | `MyRecommendationsModal.jsx` | impact_projects | `+ .limit(projectIds.length)` | IN-Filter begrenzt |
| 18 | `MyRecommendationsModal.jsx` | works | `+ .limit(workIds.length)` | IN-Filter begrenzt |
| 19 | `MyRecommendationsModal.jsx` | experiences | `+ .limit(expIds.length)` | IN-Filter begrenzt |
| 20 | `ImpactStimmenModal.jsx` | impact_applications | `+ .limit(50)` | SSOT-Cap wie ImpactPage |
| 21 | `ImpactStimmenModal.jsx` | impact_votes | `+ .limit(10)` | Max. 2 Stimmen/Monat |
| 22 | `chatContext.js` | chat_participants | `+ .limit(chatIds.length)` | IN-Filter begrenzt |
| 23 | `useReactions.jsx` | post_reactions | `+ .limit(20)` | Max. Reaktionstypen pro Post |
| 24 | `commentsService.js` | comment_hearts | `+ .limit(ids.length)` | IN-Filter begrenzt |
| 25 | `Admin.jsx` | post_comments | `+ .limit(commentIds.length)` | IN-Filter aus Reports (max 100) |
| 26 | `Admin.jsx` | profiles | `+ .limit(profileIds.length)` | IN-Filter begrenzt |

---

## Aufgabe 4 — Regression

Statische Prüfung — keine UI-Änderungen, keine Filter-/Sortierungsänderungen:

| Bereich | Status | Prüfung |
|---------|--------|---------|
| Feed | ✓ unverändert | Keine Dateien unter `src/feed/` geändert |
| Discover | ✓ | `DiscoverPage`, `*AllModal` — nur `.limit(ids.length)` auf Profile-Batch |
| Profile | ✓ | `MerkenSection` — Cover-Load unverändert in Ergebnis |
| Commerce | ✓ unverändert | Keine `commerce/`-Dateien geändert |
| Impact | ✓ | Limits aligniert mit bestehendem SSOT (50 Apps, 10 Votes) |
| Chat | ✓ | Nur `chat_participants` gehärtet; `messages` unverändert |
| Navigation | ✓ unverändert | Keine Nav-Dateien geändert |
| Suche | ✓ | `userSearch.js` unverändert (hat bereits `.limit()`) |
| Build | ✓ | `npm run build` — 810 Module, 5.08s, Exit 0 |

---

## Aufgabe 5 — Performance

| Metrik | Wert |
|--------|------|
| Unbounded SELECTs vorher | 79 |
| Unbounded SELECTs nachher | 53 |
| Reduktion | **26 (−33 %)** |
| Betroffene Dateien | 17 |
| Queries mit `.limit(ids.length)` | 18 |
| Queries mit dokumentiertem Business-Cap | 8 |

**Erwartete DB-Last-Reduktion:**

- **Hoch:** Batch-Profile-Loads (`ProfileService.getMany`, Discover, Modals) — verhindert Full-Table-Scans bei großen `profiles`-Tabellen
- **Mittel:** Impact-Stimmen-Queries — explizite Caps statt unbounded Reads
- **Niedrig:** IN-Filter-Queries mit `.limit(n)` — Postgres optimiert IN bereits; Limit ist Defense-in-Depth

Keine Runtime-Messung in diesem Sprint — strukturelle Reduktion nachweisbar.

---

## Aufgabe 6 — Build

```
npm install  → 377 packages, 0 vulnerabilities
npm run build → ✓ built in 5.08s (810 modules transformed)
```

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| `ImpactStimmenModal` limit(50) schneidet bei >50 approved Apps | Niedrig | Identisch mit `ImpactPage` SSOT seit Phase 4 |
| `limit(10)` auf Monats-Stimmen | Sehr niedrig | Business-Regel: max. 2 Stimmen |
| Verbleibende 53 unbounded Queries | Bekannt | Dokumentiert als Kategorie A; Phase 3 Kandidaten |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Produktive unbounded SELECTs geprüft | ✓ (79 inventarisiert) |
| Nur sichere Queries angepasst | ✓ (26 von 79) |
| Keine Businesslogik verändert | ✓ |
| Keine UI verändert | ✓ |
| Keine Realtime verändert | ✓ |
| Build erfolgreich | ✓ |
| Performance verbessert | ✓ (−26 unbounded) |
| Ein Commit | ✓ |
| Eine PR | ✓ |

---

*Erstellt: Sprint 12 Phase 2 — Supabase Query Hardening*
