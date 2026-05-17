# HUI — LEGACY FILE MAP
**Phase 4A.5 — Stand: 2026-05-17**

---

## Status-Definitionen

| Status | Bedeutung |
|--------|-----------|
| **ACTIVE** | Wird aktiv importiert und genutzt |
| **LEGACY** | Nicht mehr importiert, aber noch vorhanden |
| **DEPRECATED** | Ersetzt durch neuere Version, Import noch möglich |
| **INTERNAL** | Nur intern genutzt, nicht als öffentliche API |
| **STUB** | Existiert nur damit alte Links/Imports nicht crashen |

---

## Hooks

| Datei | Status | Ersetzt durch | Notiz |
|-------|--------|---------------|-------|
| `hooks/useBookings.v2.js` | **LEGACY** | `lib/bookingContext.js` | Niemand importiert es |
| `hooks/useProfile.js` | **LEGACY** | `lib/AuthContext.jsx` (profile) | Niemand importiert es |
| `hooks/useProfile.v2.js` | **LEGACY** | `lib/AuthContext.jsx` (profile) | Niemand importiert es |
| `hooks/useFeed.js` | **LEGACY** | `components/DiscoveryFeed.jsx` (inline) | Niemand importiert es |
| `hooks/useMatch.js` | **LEGACY** | `components/HuiMatchOverlay.jsx` (inline) | Niemand importiert es |
| `hooks/useImpactProjects.js` | **LEGACY** | `pages/ImpactPage.jsx` (inline) | Niemand importiert es |
| `hooks/useFavorites.js` | **LEGACY** | noch kein Ersatz | Favoriten-Feature nicht aktiv |
| `hooks/useTalentProfile.js` | **LEGACY** | `lib/AuthContext.jsx` (hasTalentProfile) | Niemand importiert es |
| `hooks/useWirker.js` | **LEGACY** | `components/WirkerProfilePage.jsx` (inline) | Niemand importiert es |
| `hooks/useWorks.js` | **LEGACY** | `lib/AppStateContext.jsx` (useOwnWorks) | Niemand importiert es |
| `hooks/useChat.js` | **DEPRECATED** | `lib/chatContext.js` | Wird noch von MeinHUI_SubPages genutzt |
| `hooks/useSearch.js` | **ACTIVE** | — | Wird von HuiSearchBar genutzt |
| `hooks/useSupabaseQuery.js` | **ACTIVE** | — | Basis-Hook für alle Queries |
| `hooks/use-mobile.jsx` | **ACTIVE** | — | shadcn utility |
| `hooks/useImpact.js` | **ACTIVE** | — | Wird von ImpactPage genutzt |

---

## Lib-Dateien

| Datei | Status | Notiz |
|-------|--------|-------|
| `lib/AppStateContext.jsx` | **ACTIVE** | Zentraler State-Owner |
| `lib/AuthContext.jsx` | **ACTIVE** | Auth Single-Owner |
| `lib/bookingContext.js` | **ACTIVE** | Booking Single-Owner |
| `lib/chatContext.js` | **ACTIVE** | Chat Single-Owner |
| `lib/trustContext.js` | **ACTIVE** | Trust Single-Owner |
| `lib/journeyContext.js` | **ACTIVE** | UX-Layer |
| `lib/sessionHooks.js` | **ACTIVE** | Presence, Scroll, Draft |
| `lib/perfUtils.js` | **ACTIVE** | safeQuery, cachedQuery |
| `lib/sentry.js` | **ACTIVE** | Error-Monitoring |
| `lib/supabaseClient.js` | **ACTIVE** | DB-Client |
| `lib/mockData.js` | **LEGACY** | Nur FeedCards.jsx importiert es (FeedCards selbst legacy?) |
| `lib/moodUtils.js` | **LEGACY** | DiscoveryFeed importiert emotionalScore |
| `lib/app-params.js` | **LEGACY** | Niemand importiert es |
| `lib/constants.js` | **LEGACY** | Niemand importiert es — lokale C={} Objekte überall |
| `lib/entities.js` | **ACTIVE** | Base44 SDK Entities |
| `lib/InsightsEngine.js` | **ACTIVE** | CreatorStudio Analytics |
| `lib/utils.js` | **ACTIVE** | cn(), isIframe() |
| `lib/PageNotFound.jsx` | **ACTIVE** | 404 Route |
| `lib/query-client.js` | **INTERNAL** | QueryClient Singleton |

---

## Components

| Datei | Status | Notiz |
|-------|--------|-------|
| `components/ChatDetailPage.jsx` | **LEGACY** | Ersetzt durch `components/ChatPage.jsx` |
| `components/BookingFlow.jsx` | **DEPRECATED** | Nicht mehr in Home.jsx, nur noch als File vorhanden |
| `components/FeedCards.jsx` | **LEGACY** | DiscoveryFeed nutzt eigene Inline-Karten |
| `components/WirkerProfileDashboard.jsx` | **DEPRECATED** | Ersetzt durch `pages/CreatorStudio.jsx` |
| `components/CreateFlow.jsx` | **DEPRECATED** | Ersetzt durch `components/HuiCreateFlow.jsx` |

---

## Pages

| Datei | Status | Notiz |
|-------|--------|-------|
| `pages/Home.jsx` | **ACTIVE** | App-Shell |
| `pages/ImpactPage.jsx` | **ACTIVE** | Impact-Tab |
| `pages/LoginPage.jsx` | **ACTIVE** | Auth |
| `pages/Admin.jsx` | **ACTIVE** | Admin-Tool |
| `pages/AuthCallback.jsx` | **ACTIVE** | OAuth |
| `pages/DiagnosePage.jsx` | **INTERNAL** | Dev-Tool |
| `pages/CreatorStudio.jsx` | **ACTIVE** | Creator Dashboard |
| `pages/EditProfile.jsx` | **ACTIVE** | Profil bearbeiten |
| `pages/BookingFlow.jsx` | **STUB** | Redirect zu /Home (Route-Stub) |
| `pages/ProfilePage.jsx` | **DEPRECATED** | pages/ Version — in Home als Tab, aber eigentlich ersetzt |

---

## Utils

| Datei | Status | Notiz |
|-------|--------|-------|
| `utils/index.ts` | **LEGACY** | Niemand importiert es |

---

## Aktions-Plan (NICHT LÖSCHEN — nur dokumentiert)

**Sofort sicher zu ignorieren (niemand importiert):**
- `hooks/useBookings.v2.js`
- `hooks/useProfile.js`, `hooks/useProfile.v2.js`
- `hooks/useFeed.js`, `hooks/useMatch.js`
- `hooks/useImpactProjects.js`, `hooks/useFavorites.js`
- `hooks/useTalentProfile.js`, `hooks/useWirker.js`, `hooks/useWorks.js`
- `lib/app-params.js`, `lib/constants.js`
- `utils/index.ts`

**In zukünftiger Cleanup-Phase löschen (erst nach vollständiger Verifikation):**
- `components/ChatDetailPage.jsx`
- `components/FeedCards.jsx`
- `components/WirkerProfileDashboard.jsx`
- `components/CreateFlow.jsx`

---
*Generiert: Phase 4A.5 — Keine Datei wurde gelöscht oder verändert.*
