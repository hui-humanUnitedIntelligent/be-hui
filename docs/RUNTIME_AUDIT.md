# HUI — RUNTIME AUDIT
**Phase 6B.1 — Stand: 2026-05-17**

---

## P0 — KRITISCH

### P0.1 — Kein Code-Splitting (0 React.lazy)
```
App.jsx: 7 schwere statische Imports
WirkerProfilePage.jsx:  3069Z, 140KB → immer geladen
CreatorStudio:          direkt importiert → immer geladen
WorkDetailPage:         direkt importiert → immer geladen
ImpactPage:             direkt importiert
DiagnosePage:           direkt importiert (sollte nie in Prod laden)
```
**Impact:** Initial Bundle enthält Seiten die 90%+ der User nie besuchen.
Geschätzt: +150-200KB unnötige JS beim ersten Load.
**Lösung:** React.lazy + Suspense für alle schweren Routes (6B.2)

### P0.2 — Kein manualChunks in vite.config.ts
```
Alle Libraries in einem Vendor-Chunk.
Supabase + Framer + Radix + React = ein riesiges Bundle.
```
**Impact:** Browser kann Vendor-Cache nicht nutzen wenn App-Code ändert.
**Lösung:** manualChunks für stable Vendor-Libraries (6B.2)

### P0.3 — Intelligence Layer immer im Main Bundle
```
discovery/index.js:     596Z (21KB)
graph/index.js:         662Z (24KB)
contextual/index.js:    639Z (23KB)
communityHealth/:       743+335Z (39KB)
pipeline/index.js:      ~15KB
cache/index.js:         ~12KB
Total Intelligence:     ~134KB — immer geladen
```
**Impact:** User auf LoginPage lädt 134KB Intelligence die er nicht braucht.
**Lösung:** Intelligence als separater Chunk (6B.2)

---

## P1 — BALD LIMITIEREND

### P1.1 — Progressive Discovery fehlt
Discovery lädt alles oder nichts.
User sieht erst Items wenn alle 8 Pipeline-Stages durch sind.
**Lösung:** Progressive Delivery in 3 Wellen (6B.3)

### P1.2 — Home.jsx: 33 useState, kein Suspense
Alle States werden synchron initialisiert.
Erste Render = teuer.
**Lösung:** State-Gruppen in Sub-Hooks auslagern

### P1.3 — Kein Worker Pool
graphWorker.js ist deploybar aber nicht in Discovery integriert.
Main Thread läuft noch voll für Graph-Berechnungen.

### P1.4 — Keine Adaptive Pipeline
Gleiche Pipeline-Tiefe auf High-End und Low-End-Devices.
**Lösung:** Device-aware Pipeline Depth (6B.6)

---

## P2 — SPÄTER RELEVANT

### P2.1 — react-leaflet (Karte) immer geladen
Leaflet.js ist schwer (~40KB gzipped) und nur auf LiveMap genutzt.
Sollte lazy geladen werden.

### P2.2 — react-quill immer geladen
Rich Text Editor nur im Create-Flow — trotzdem global im Bundle.

### P2.3 — Framer Motion: alle Variants geladen
AnimatePresence + Variants auch wenn keine Animationen aktiv.

### P2.4 — Keine Suspense-Boundaries in Feed
Feed lädt alles synchron. Kein Streaming von Komponenten.

### P2.5 — DiagnosePage in Prod-Bundle
Nur für Developer. Sollte komplett aus Prod-Bundle entfernt sein.

---

## Bundle-Schätzung (vor 6B)

| Chunk | Geschätzte Größe (gzip) | Status |
|-------|------------------------|--------|
| Vendor (React+Router+...) | ~80KB | 🔴 ungesplittet |
| Supabase | ~45KB | 🔴 im Vendor |
| Framer Motion | ~35KB | 🟡 immer geladen |
| Radix UI (alle) | ~60KB | 🟡 tree-shakeable |
| Intelligence Layer | ~60KB | 🔴 immer geladen |
| App-Code | ~120KB | 🔴 monolithisch |
| **Gesamt Initial** | **~400KB** | 🔴 |

**Ziel nach 6B:** < 180KB Initial + Lazy-Chunks on demand

---

## Lösungsplan

| Phase | Problem | Fix | Impact |
|-------|---------|-----|--------|
| 6B.2 | P0.1 kein lazy | React.lazy für alle Routen | -40% initial |
| 6B.2 | P0.2 keine Chunks | manualChunks Vite config | Cache-Effizienz +50% |
| 6B.2 | P0.3 Intelligence always | Lazy Intelligence Chunk | -60KB initial |
| 6B.3 | P1.1 kein Progressive | 3-Wellen Delivery | UX sofort |
| 6B.4 | P1.2 Pipeline | Stage Memoization | -30% Re-runs |
| 6B.5 | P1.3 kein Worker Pool | Pool + Priority Queue | Main Thread frei |
| 6B.6 | P1.4 adaptive | Device-aware Depth | Mobile smooth |
