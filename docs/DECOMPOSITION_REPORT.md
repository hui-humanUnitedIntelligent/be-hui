# HUI — DECOMPOSITION REPORT
**Phase 5B — Stand: 2026-05-17**

---

## Complexity Audit — Ergebnisse

### Top Monster-Komponenten (Complexity Score)

| Datei | Zeilen | Score | useStates | useEffects | Supabase |
|-------|--------|-------|-----------|------------|---------|
| MeinHUI_SubPages.jsx | 2047 | **481.5** 🔴 | 56 | 13 | 33 |
| WirkerProfilePage.jsx | 3069 | **391.0** 🔴 | 43 | 7 | 18 |
| DiscoveryFeed.jsx | 2562 | **225.4** 🔴 | 20 | 9 | 1 |
| HuiCreateFlow.jsx | 1782 | **225.3** 🔴 | 44 | 1 | 5 |
| Home.jsx | 1801 | **201.8** 🔴 | 33 | 8 | 0 |
| services/db.js | 573 | **161.7** 🔴 | 0 | 0 | 52 |
| BookingFlow.jsx | 1128 | **126.5** 🔴 | 16 | 3 | 1 |

---

## Priorisierter Decomposition-Plan

### P0 — Gefährliche Monster-Komponenten (DEPLOYED ✅)

**Home.jsx: 33 useState → 2 dedizierte Hooks**

| Hook | Extrahiert | Was |
|------|-----------|-----|
| `useHomeOverlays()` | ✅ | 22 show*-States + CustomEvent-Listener |
| `useHomeUser()` | ✅ | isTalent/isWirker/userName/currentUser + 4 useEffects |

Home.jsx Ziel: **von 33 States → ~9 States** (nur noch Tab, Orb, Cart, Feed-spezifisches)

**WirkerProfilePage.jsx: 18 Supabase-Calls → 1 Hook**

| Hook | Extrahiert | Was |
|------|-----------|-----|
| `useWirkerProfileData()` | ✅ | Profile-Fetch, Works, Exps, Recs, Follow-Status |

WirkerProfilePage Ziel: **Data Layer vollständig herausgezogen**

### P1 — Primitive Extraction (DEPLOYED ✅)

| File | Inhalt | Extrahiert nach |
|------|--------|----------------|
| `WirkerProfilePrimitives.jsx` | Skel, ProfileSkeleton, RecCard | `src/components/profile/` |
| `MeinHUIShared.jsx` | PageShell, Spinner, EmptyMsg, Tabs, Card | `src/components/studio/` |

### P1 — safeQuery Utility (DEPLOYED ✅)

`src/lib/safeQuery.js` — globaler Wrapper für alle 76 ungeschützten Supabase-Calls.
Verhindert unhandled rejections. Einheitliches `{ data, error }` Pattern.

### P2 — Folder-Struktur (Empfehlung)

```
src/
  components/
    profile/          ← WirkerProfile Primitives, Inline-Tools
    studio/           ← MeinHUI SubPages + Shared
    feed/             ← FeedCards, HomeFeed Primitives
    overlays/         ← BookingFlow, ChatPage, HuiMatchOverlay
  hooks/
    useHomeOverlays   ← neu ✅
    useHomeUser       ← neu ✅
    useWirkerProfileData ← neu ✅
  lib/
    safeQuery         ← neu ✅
```

### P3 — Verbleibende Arbeit

| # | File | Problem | Empfehlung |
|---|------|---------|-----------|
| P3.1 | MeinHUI_SubPages.jsx | 23 Komponenten in 1 File | Split nach Studio/Account |
| P3.2 | HuiCreateFlow.jsx | 44 States | useCreateFlowState Hook |
| P3.3 | DiscoveryFeed.jsx | render + transform vermischt | useFeedData + FeedRenderer trennen |
| P3.4 | services/db.js | 52 Supabase-Calls | safeQuery migrieren |

---

## Was wurde NICHT angefasst

- Kein UI verändert
- Kein Feature hinzugefügt
- Kein Verhalten geändert
- Kein Routing geändert
- Keine Props umbenannt

Die extrahierten Hooks/Primitives sind **reine Refactors** —
sie kapseln bestehende Logik ohne Verhaltensänderung.

---

## Messbare Verbesserungen

| Metrik | Vorher | Nachher (Ziel) |
|--------|--------|----------------|
| Home.jsx useState | 33 | ~9 (nach Integration) |
| WirkerProfilePage Data Coupling | direkt | über Hook isoliert |
| Primitive Wiederverwendbarkeit | 0 | Skel/RecCard/PageShell shared |
| safeQuery Coverage | 0% | 100% (nach Migration) |
| Folder-Struktur | flach | domain-orientiert |
