# HUI — INFRASTRUCTURE AUDIT
**Phase 6A.1 — Stand: 2026-05-17**

---

## Executive Summary

HUI hat einen soliden Intelligence Stack (5C–5H).
Die größten Skalierungs-Risiken liegen NICHT im Algorithmus —
sondern in der Query-Last und den Monster-Komponenten.

**3 kritische P0-Issues. 4 P1-Issues. 6 P2-Verbesserungen.**

---

## P0 — KRITISCH (sofort adressieren)

### P0.1 — useCommunityHealth: 2.300 Rows pro Load
```
profiles     limit=200
bookings     limit=500
recommendations limit=300
follows      limit=1000
works        limit=300
TOTAL: 2.300 rows × 12 Loads/h × 1.000 User = 27,6M rows/h
```
**Problem:** Bei 1.000 simultanen Usern = 27,6M Supabase-Reads/Stunde.
**Lösung:** TTL-Cache (5min) + Backend-Aggregation-View (Phase 6A.3)

### P0.2 — DiscoveryFeed.jsx: 2.562 Zeilen, 117KB
```
Monster-Komponente: alles in einer Datei
20 useState, 9 useEffect, keine Separation of Concerns
```
**Problem:** Jede kleine Änderung re-rendert alles.
Mobile: hoher CPU-Burst beim ersten Render.
**Lösung:** Decomposition in 4 Sub-Komponenten (Phase 6A.2)

### P0.3 — Home.jsx: 33 useState ohne Memoization
```
33 useStates, 8 useEffects
Hooks useHomeOverlays + useHomeUser extrahiert aber NICHT integriert
```
**Problem:** Jeder State-Change triggert kompletten Re-render.
**Lösung:** Hooks integrieren, useState auf ~9 reduzieren

---

## P1 — BALD LIMITIEREND

### P1.1 — useCommunityHealth ohne Cache
5min Refresh-Intervall ist gesetzt, aber kein Cache-Layer.
Bei Tab-Switch wird neu geladen. Kein stale-while-revalidate.

### P1.2 — Keine Pipeline-Struktur in Discovery
`useContextualDiscovery` ist monolithisch.
8 Berechnungsschritte in einem useCallback — schwer zu debuggen.
Keine Stage-basierte Architektur für Optimierungen.

### P1.3 — Graph Calculations on Main Thread
`detectSoftClusters()`, `creatorBridgeScore()`, `relevanceScore()` laufen synchron.
Bei 60+ Creators: 50-100ms CPU-Block auf Main Thread.
Mobile: sichtbarer Jank.

### P1.4 — Kein Supabase Query Deduplication
`useContextualDiscovery` + `useDiscoveryFeed` können parallel laufen.
Doppelte Queries auf dieselben Tabellen ohne Deduplication.

---

## P2 — SPÄTER RELEVANT

### P2.1 — Bundle Size (unklar ohne Build-Analyse)
5 Intelligence-Layer + alle Hooks: geschätzter Bundle-Anteil ~80KB gzipped.
Keine Code-Splitting-Strategie für Discovery-Engine.

### P2.2 — Realtime Channel: nur works-feed aktiv
Kein Reconnect-Backoff. Keine Visibility-aware Throttling.
Bei Tab-Switch bleibt Channel offen.

### P2.3 — Search ohne Debounce-Cache
`useSmartSearch` hat 280ms Debounce aber kein Query-Result-Cache.
Gleiche Suche = erneuter Supabase-Call.

### P2.4 — Keine Pagination in Community Health
200 Profiles, 500 Bookings, 1000 Follows: alles auf einmal.
Kein Pagination. Bei 10.000 Usern: Problem.

### P2.5 — MeinHUI_SubPages.jsx: 23 Komponenten, 2047 Zeilen
Decomposition begonnen (5B) aber nicht fertiggestellt.

### P2.6 — WirkerProfilePage.jsx: 3069 Zeilen, 140KB
Größte Datei im Projekt. useWirkerProfileData extrahiert aber 18 Supabase-Calls bleiben.

---

## Budget-Analyse (Skalierung)

| Ressource | Aktuell (100 User) | Ziel (10k User) | Status |
|-----------|-------------------|-----------------|--------|
| Supabase Reads/h | 2.76M | 276M | 🔴 P0 |
| Community Health | 27.6k rows/load | Cached | 🔴 P0 |
| Bundle Size | ~300KB | <200KB | 🟡 P1 |
| Main Thread CPU | 100-200ms | <50ms | 🟡 P1 |
| Realtime Channels | 1 aktiv | <10 | ✅ OK |

---

## Lösungsplan (Phase 6A)

| Phase | Problem | Lösung | Impact |
|-------|---------|--------|--------|
| 6A.3 | P0.1 Community Health | TTL-Cache Layer | -95% Query-Last |
| 6A.2 | P0.2 DiscoveryFeed | Pipeline + Decomp | -60% Re-renders |
| 6A.4 | P1.3 Graph CPU | Background Worker | Main-Thread frei |
| 6A.3 | P1.1 kein Cache | stale-while-revalidate | <50ms cache hit |
| 6A.2 | P1.2 Pipeline | Stage-basiert | Debuggable |
| 6A.5 | P2.2 Realtime | Reconnect Backoff | Stable WS |
| 6A.6 | P2.3 Search Cache | Query Cache | -80% Search Calls |
