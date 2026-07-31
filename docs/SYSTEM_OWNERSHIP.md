# HUI — SYSTEM OWNERSHIP MAP
**Phase 4A.1 — Audit Date: 2026-05-17**

---

## Ownership-Prinzip

Jedes Datensystem hat genau **einen Owner** (Single Source of Truth).
Owner = die Datei die Supabase schreibt UND den lokalen State hält.
Consumer = Dateien die nur lesen (via Props, Context, Hook-Return).

---

## System-Ownership-Tabelle

| System | Single Owner | Darf schreiben | Darf lesen (Consumer) |
|--------|--------------|----------------|----------------------|
| **Auth / Session** | `lib/AuthContext.jsx` | ✅ AuthContext only | alle via `useAuth()` |
| **Profile (eigenes)** | `lib/AppStateContext.jsx` → `services/db.js` | ✅ AppState + EditProfile.jsx (erlaubt) | alle via `useAppState()` |
| **Profile (fremd)** | `components/WirkerProfilePage.jsx` | ✅ lokaler Fetch ok | props/inline |
| **Notifications** | `lib/AppStateContext.jsx` | ✅ AppState only | `useNotifCount()`, `useAppState().notifications` |
| **Chats (Liste)** | `lib/chatContext.js` → `useChatList()` | ✅ chatContext only | via `useChatList()` |
| **Messages (Thread)** | `lib/chatContext.js` → `useChatThread()` | ✅ chatContext only | via `useChatThread()` |
| **Bookings (Client)** | `lib/AppStateContext.jsx` | ✅ AppState only | via `useAppState()` |
| **Bookings (Creator)** | `lib/bookingContext.js` → `useCreatorBookings()` | ✅ bookingContext only | via `useCreatorBookings()` |
| **Works** | `lib/AppStateContext.jsx` → `services/db.js` | ✅ AppState + Create-Flows (akzeptiert) | via `useOwnWorks()` |
| **Experiences** | `services/db.js` | ✅ Service Layer | via direktem Fetch in WirkerProfilePage |
| **Stories** | `services/db.js` → `StoryService` | ✅ StoryService + Create-Flows (akzeptiert) | `StoryBar` via `StoryService`; `storyRefreshKey` |
| **Trust / Reputation** | `lib/trustContext.js` | ✅ trustContext only | via `useReputation()` |
| **Follows** | `lib/AppStateContext.jsx` | ✅ AppState + WorkDetailPage (❗) | via `useFollowStatus()` |
| **Work Interactions** | `lib/AppStateContext.jsx` | ✅ AppState + WorkDetailPage (❗) | via `useWorkInteraction()` |
| **Presence** | `lib/sessionHooks.js` → `usePresence()` | ✅ sessionHooks only | via `usePresence()` |
| **Realtime Channels** | Verteilt (siehe REALTIME_REGISTRY.md) | ✅ je Single-Owner | via Context |
| **UI Overlays** | `lib/AppStateContext.jsx` → `useUIState()` | ✅ AppState | via `useUIState()` |
| **Discovery Feed** | `components/DiscoveryFeed.jsx` | ❗ lokal (akzeptiert — paginated) | inline |
| **Impact / Votes** | `pages/ImpactPage.jsx` | ❗ direkt (akzeptiert — standalone) | inline |
| **Payments / Escrow** | `functions/createCheckout.ts` + `stripeWebhook.ts` | ✅ Backend-only | via HuiPaymentDB |

---

## Problembereiche (❗)

### 1. KRITISCH — Direkte DB-Writes in UI-Komponenten (nicht durch Service-Layer)

| Datei | Table | Typ |
|-------|-------|-----|
| `components/WorkDetailPage.jsx` | work_likes, work_saves, follows | INSERT/DELETE |
| `components/WirkerProfileDashboard.jsx` | bookings (confirm/decline), works | UPDATE |
| `components/MeinHUI_SubPages.jsx` | messages, availability_slots, impact_votes | INSERT/DELETE |
| `components/StoryBar.jsx` (StoryViewer) | story_views, messages | UPSERT/INSERT |
| `components/WirkerProfilePage.jsx` | chats (INSERT!) | INSERT |

### 2. DOPPELTE STATE-OWNER

| Daten | # Duplikat-States | Primärer Owner |
|-------|-------------------|----------------|
| bookings | 8 | `lib/bookingContext.js` |
| works | 11 | `lib/AppStateContext.jsx` |
| profile | 19 | `lib/AppStateContext.jsx` |
| chats | 3 | `lib/chatContext.js` |
| messages | 3 | `lib/chatContext.js` |

### 3. LEGACY HOOKS (werden nicht mehr importiert)

- `hooks/useBookings.v2.js` — UNUSED
- `hooks/useProfile.js` — UNUSED  
- `hooks/useProfile.v2.js` — UNUSED
- `hooks/useFeed.js` — UNUSED
- `hooks/useMatch.js` — UNUSED
- `hooks/useImpactProjects.js` — UNUSED
- `hooks/useFavorites.js` — UNUSED
- `hooks/useTalentProfile.js` — UNUSED
- `hooks/useWirker.js` — UNUSED
- `hooks/useWorks.js` — UNUSED

---

## Akzeptierte Ausnahmen (by design)

- **Create-Flows** (`HuiCreateFlow`, `UniversalPostFlow`, `WerkPublisher`, `ExperienceCreator`):  
  Direkte DB-Writes akzeptiert — sie sind isolierte Transaktions-Flows ohne State-Sharing.
- **DiagnosePage**: Admin-Tool — direkter Supabase-Zugriff by design.
- **EditProfile**: Einzige legitime Profil-Schreib-Komponente neben AppStateContext.
- **LoginPage**: Auth-Flows dürfen supabase.auth direkt aufrufen.

---
*Generiert: Phase 4A.1 — Alle Änderungen rein architektonisch, keine UI-Änderungen.*
