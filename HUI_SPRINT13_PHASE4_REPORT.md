# HUI Sprint 13 — Phase 4: Initial-Load Request Consolidation

**Sprint:** Implementation Sprint 13, Phase 4  
**Branch:** `cursor/sprint13-initial-load-dedup-6c13`  
**Datum:** 2026-07-16  
**Grundlage:** `HUI_NETWORK_REQUEST_AUDIT.md` (Phase 3)

---

## Executive Summary

Phase 4 reduziert den **Initial-Load-Request-Burst** durch **Promise-Sharing** und **`cachedQuery`** auf identischen produktiven Queries — ohne Änderungen an Businesslogik, UI, UX, Realtime, Schema oder Query-Ergebnissen.

| Metrik | Phase 3 Baseline | Phase 4 Nachher | Einsparung |
|--------|------------------|-----------------|------------|
| **Supabase HTTP gesamt** | 239 | **186** | **−53 (−22,2 %)** |
| **OPTIONS (Preflight)** | 107 | **74** | **−33 (−30,8 %)** |
| **Daten-Requests (ohne OPTIONS)** | 132 | **112** | **−20 (−15,2 %)** |
| **Duplikat-Signaturen (≥2×)** | 87 | **23** | **−64 (−73,6 %)** |

**Messung:** `/tmp/hui-network-phase4-after.json` vs. `/tmp/hui-network-audit.json` (Session-Pass, gleiches Harness-Szenario: Home-Load +12 s, Scroll).

---

## Aufgabe 1 — Initial-Load-Analyse (Phase 3, dokumentiert)

### Reihenfolge

1. **T+0–30 ms:** LiveTicker-OPTIONS-Cluster (10 Quellen × StrictMode)
2. **T+330 ms:** Feed-Initial-Page (`useFeedStream` — 6 Quellen parallel)
3. **T+330–700 ms:** ImpactPage-Hooks parallel (`impact_applications`, `impact_votes`, `bookings`)
4. **T+330–700 ms:** DiscoverPage-Load parallel (profiles, works, beitraege, talents)
5. **T+470–1100 ms:** UnifiedFeed `useHeuteStats` (4 Count/Profile-Queries)
6. **T+900–1500 ms:** Chat-List, Reactions-RPC, Storage-Media, Presence

### Parallele Requests

- Größter Cluster: **47 Requests** in <100 ms (Feed + Impact + Discover Mount)
- **40 Paare** mit ≤50 ms Abstand (StrictMode + paralleles Mounting)

### Identische Duplikate (Top)

| Query | Count (Baseline) | Ursache |
|-------|------------------|---------|
| LiveTicker-Quellen (works, experiences, …) | je 2× | StrictMode + kein In-Flight-Sharing |
| `profiles` IDENTITY_CONTRACT | 3× | Direkte `supabase.from` statt `ProfileService` / Cache |
| `saved_posts`, `follows`, `notifications` | je 2× | StrictMode, kein Cache |
| `chats` List-Query | 2× | `useChatList("home")` + `useChatList("cco")` |
| `reaction_counts` RPC | 2× | 2 sichtbare Posts, StrictMode |
| `PATCH profiles` (Presence) | 3× | StrictMode + parallele `ping()` |

### Abhängigkeiten

- Feed-Page → Profile-Anreicherung (separate Queries, nicht identisch)
- LiveTicker → sekundäre `works`-Lookup nur bei Resonance-Items (IDs variabel)
- Chat-List → `ProfileService.getMany` pro Chat (batch, user-abhängig)
- Impact-Hooks → unterschiedliche `impact_applications`-Sortierungen (**nicht** konsolidiert — unterschiedliche Ergebnisse)

---

## Aufgabe 2 — Identifizierte doppelte Requests (nur identische produktive Queries)

| Query-Signatur | Konsolidiert? | Mechanismus |
|----------------|---------------|-------------|
| LiveTicker 10× `GET … limit 5` | ✅ | `cachedQuery` + In-Flight |
| `saved_posts` list | ✅ | `cachedQuery` |
| `follows` list | ✅ | `cachedQuery` |
| `notifications` HEAD count | ✅ | `cachedQuery` |
| `chats` list (50) | ✅ | Shared `fetchChatListRows()` |
| `reaction_counts` RPC | ✅ | `cachedQuery` per `postId` |
| `PATCH profiles` Presence ping | ✅ | In-Flight Map |
| `useHeuteStats` 4 Queries | ✅ | `cachedQuery` |
| `useFeedStream` initial page | ✅ | `cachedQuery` |
| Discover initial 5 Queries | ✅ | `cachedQuery` |
| Impact `useHeroStats` / `usePoolBudgets` / `useTransparenz` / `useLastPayout` / `useImpactActivities` | ✅ | `cachedQuery` |
| `impact_applications` asc vs desc | ❌ | Unterschiedliche Sortierung/Ergebnis |
| Storage Media-URLs (gleiche URL) | ❌ | Browser-Layer, nicht identische REST-Signatur im Scope |

---

## Aufgabe 3 — Konsolidierung (Implementierung)

### Kern: `src/lib/perfUtils.js`

- **`cachedQuery`:** In-Flight Promise-Sharing (`_inflight` Map) + bestehender TTL-Cache
- Keine neue Cache-Architektur — Erweiterung der Phase-6C-Infrastruktur

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/perfUtils.js` | In-Flight Dedup in `cachedQuery` |
| `src/hooks/useLiveTicker.js` | Alle 10 Quellen via `tickerQuery()` → `cachedQuery` |
| `src/lib/useReactions.jsx` | `reaction_counts` RPC + `saved_posts` Initial-Load |
| `src/lib/AppStateContext.jsx` | `notifications` + `follows` |
| `src/lib/chatContext.js` | Shared `fetchChatListRows()` |
| `src/lib/usePresence.js` | In-Flight Dedup für `ping()` |
| `src/feed/UnifiedFeed.jsx` | `useHeuteStats` 4 Queries |
| `src/feed/useFeedStream.js` | Initial `fetchFeedPage` |
| `src/pages/DiscoverPage.jsx` | 5 Initial-Load-Queries |
| `src/pages/ImpactPage.jsx` | 5 Impact-Hooks (identische Queries) |

**Nicht geändert:** Realtime, RPC-Signaturen, Sortierungen, Limits, Filter, UI, Navigation, Commerce-Logik, Presence-Semantik (weiterhin 60 s Heartbeat).

---

## Aufgabe 4 — OPTIONS

| Befund | Wert |
|--------|------|
| OPTIONS vorher | 107 |
| OPTIONS nachher | **74** |
| Einsparung | **−33** |

**Ursache der Reduktion:** Jeder vermiedene doppelte GET/PATCH/POST entfällt mit seinem OPTIONS-Preflight-Paar. Keine CORS-/Server-Änderung.

---

## Aufgabe 5 — Regression

| Bereich | Prüfung | Ergebnis |
|---------|---------|----------|
| **Home** | Load + Mess-Harness | ✅ 186 HTTP, App rendert |
| **Feed** | `useFeedStream` cached initial — gleiche `fetchFeedPage` | ✅ Keine Query-Änderung |
| **Discover** | `cachedQuery` — gleiche SELECT/LIMIT/ORDER | ✅ |
| **Profile** | `ProfileService` unverändert, Presence ping deduped | ✅ |
| **Commerce** | Keine Commerce-Dateien geändert | ✅ |
| **Chat** | Shared loader — gleiche Query | ✅ |
| **Impact** | `cachedQuery` — gleiche Queries | ✅ |
| **Presence** | Heartbeat 60 s, gleiches UPDATE | ✅ |
| **Navigation** | Keine Nav-Änderungen | ✅ |
| **Build** | `npm run build` | ✅ Erfolgreich (5,13 s) |

---

## Aufgabe 6 — Performance (vorher/nachher)

| Metrik | Vorher (Phase 3) | Nachher (Phase 4) | Delta |
|--------|------------------|-------------------|-------|
| Initial HTTP gesamt | 239 | 186 | **−53** |
| OPTIONS | 107 | 74 | **−33** |
| Daten-HTTP | 132 | 112 | **−20** |
| Duplikat-Signaturen | 87 | 23 | **−64** |
| Session-Dauer (Messpass) | 24 s | 15,5 s | −8,5 s (Nebenbefund) |

**Rohdaten:** `/tmp/hui-network-audit.json` (vorher), `/tmp/hui-network-phase4-after.json` (nachher)

---

## Aufgabe 7 — Build

```
npm install  → 0 vulnerabilities
npm run build → ✓ built in 5.13s
```

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| TTL-Cache liefert veraltete Daten | Niedrig | TTL 15–60 s; Initial-Load-Dedup primär via In-Flight |
| `cachedQuery` maskiert echte Fehler | Niedrig | Fehler werden nicht gecacht (`!result?.error`) |
| Verbleibende 23 Duplikat-Signaturen | Mittel | U.a. unterschiedliche SELECTs, Storage-URLs — Phase 5 |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Initial-Load-Requests reduziert | ✅ −53 HTTP (−22 %) |
| Doppelte Requests entfernt | ✅ −64 Duplikat-Signaturen |
| Keine Businesslogik verändert | ✅ |
| Keine UI verändert | ✅ |
| Keine Realtime verändert | ✅ |
| Build erfolgreich | ✅ |
| Initial-Load messbar kleiner | ✅ |
| Ein Commit | ✅ |
| Eine PR | ✅ |

---

## Nächste Schritte (Phase 5, nicht in Scope)

1. Idle-Polling-Stack (15,5 req/min) — separater Sprint laut Phase-3-Empfehlung
2. Storage-URL-Dedup (Browser-Cache)
3. Verbleibende Impact-Hook-Überlappungen mit unterschiedlichen SELECTs evaluieren
