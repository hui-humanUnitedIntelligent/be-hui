# HUI Real User Flow Matrix — Production Hardening

Stand: 2026-05-25

Ziel dieser Matrix: echte Nutzbarkeit, stabile Hauptflows, sichtbare Fehler und reproduzierbare Journeys. Keine neuen Features, keine neue Architektur.

## Flow-Matrix

| Bereich | Journey | Entry Points | Kritische Dateien | Loading | Empty | Error/Retry | Runtime-Logs |
|---|---|---|---|---|---|---|---|
| AUTH | Signup, Login, Logout, Session Restore | `/login`, `/auth/callback`, ProtectedRoute | `src/pages/LoginPage.jsx`, `src/pages/AuthCallback.jsx`, `src/lib/AuthContext.jsx`, `src/App.jsx` | Auth splash/ProtectedRoute loader | Login-Form | Error UI in auth pages; global boundary | global error tracer, Sentry |
| PROFILE | Profil öffnen/bearbeiten, Avatar/Media, Follow/Connect | Bottom nav profile, feed creator, `/profile/:username` | `Home.jsx`, `ProfileLauncher.jsx`, `creator-profile/index.jsx`, `wirker-profile/index.jsx`, `AppStateContext.jsx` | Suspense/Profile fallback | Profile fallbacks | Follow errors now throw from context and are surfaced by work/profile surfaces | `profile.follow_*`, action logs |
| STORYS | Story erstellen, veröffentlichen, ansehen, realtime-ish refresh | Story create button, Orb share/story, feed StoryBar | `Home.jsx`, `HomeFeed.jsx`, `StoryBar.jsx`, `StoryComposer.jsx`, `TeilenFlow.jsx` | StoryBar loading text, composer upload progress | Create button remains visible when no stories exist | StoryBar retry, TeilenFlow visible publish error and no auto-close | `story.load_*`, `publish.teilen_*` |
| FEED | Post/feed refresh/interactions/navigation | `/Home` feed tab, notification feed target | `HomeFeed.jsx`, `useFeedStream.js`, `FeedRouter.jsx`, `Home.jsx` | Initial skeleton, load-more spinner | FeedEmptyState with create/discover CTAs | Inline feed error with retry; load-more errors visible via stream error | `feed.initial_load_*`, `feed.realtime_*`, `feed.manual_refresh` |
| WORKS | Werk erstellen, öffnen, liken/speichern, creator öffnen | Orb Werk, `/work/:id`, feed WorkCard | `WorkFlow.jsx`, `WorkDetailPage.jsx`, `AppStateContext.jsx` | Work skeleton, publish saving | Work not found state | Like/save/comment/cart/buy failures are visible; no fake commerce success on missing handler | `works.like_*`, `works.save_*`, `works.buy_unavailable`, `publish.work` console |
| CHAT | Chat öffnen, Nachricht senden, realtime message | Header/profile/comment/notification | `ChatCenterOverlay.jsx`, `chatContext.js`, `NotificationCenter.jsx`, `Home.jsx` | Chat list/room loading | Empty chat discover CTA | Notification chat target normalized; chat creation failures remain partly local to chat center | existing chat logs |
| BOOKING | Booking flow, confirm, state | Profile book/connect, notification bookings | `hui.actions.js`, `ConnectionCreatePage.jsx`, `bookingContext.js` | Connection publish state | N/A | Connection publish no longer closes on DB failure; booking notification fallback opens chat instead of invalid route | `publish.connection_*` |
| NOTIFICATIONS | Open, mark, realtime update | Header bell, action engine | `NotificationCenter.jsx`, `AppStateContext.jsx`, `Home.jsx` | Notification skeleton | EmptyState | Context-owned load/mark APIs, retry UI, normalized action URLs | `notifications.load_*`, `notifications.mark_read_*`, `notifications.realtime_*` |
| ORB | Open, close, navigation, create actions | Bottom nav center button | `BottomNav.jsx`, `Home.jsx`, `HuiPlusSheet.jsx`, `ContentTypeSelector.jsx`, `hui.actions.js` | Suspense/Portal mount guard | Membership gate for non-members | Invalid community tab no longer blanks UI; Orb mount guard remains | existing `[HUI ORB]` plus action logs |

## Kaputte Flows vor dem Hardening

- Feed crash risk: `RhythmicFeed` referenced stream variables outside its scope.
- Notifications: `NotificationCenter` expected `notifications`, `loadNotifications`, `markNotifsRead` from `AppStateContext`, but the context exposed only a count.
- Work detail: `loadSocial()` called missing `setLiked`; like/save APIs were missing from `AppStateContext`.
- Publish hard-fail violations:
  - `SupportSheet` showed success after DB failure.
  - `ConnectionCreatePage` closed after failed insert.
  - `TeilenFlow` ignored insert/upload errors and closed.
- Story callback mismatch: `Home.jsx` passed `onPublished` to `StoryComposer`, which expects `onSuccess`.
- Story viewer prop mismatch: `Home.jsx` passed `story`, while `StoryViewer` expects `data`.
- Notification navigation bug: `feed` target called `handleTab("home")`; `/chat`, `/discover`, `/bookings` action URLs were not normalized.
- Work commerce buttons on route entry were visually active but functionally no-ops.
- Overlay crashes auto-closed after 1.5s and looked like user cancellation.
- Creator quick actions for unfinished tools were silent/no-op or invalid action references.

## Runtime-Probleme gefixt

- Context-owned notification list, loading, error, mark-read, retry and realtime refresh added.
- Work like/save persistence added with rollback + visible error at point of interaction.
- Feed loading/error/retry state added; realtime now listens for published works.
- StoryBar now uses real stories with loading/error/retry instead of HomeFeed mock story rings.
- Publish flows now fail hard: no fake success, no auto-close, visible error.
- OverlayBoundary no longer auto-closes on crash; user can retry or close.
- Notification route normalization prevents blank tabs and invalid booking paths.
- Unavailable Work buy/cart route actions now show visible runtime errors instead of no-op.

## Canonical User Journeys

1. **Neuer User**
   - Login/signup -> ProtectedRoute session restore -> `/Home` -> empty/feed state -> profile tab.
   - Stabilisiert durch auth loader, feed loading/error, profile open path.

2. **Creator**
   - Profile owner view -> create story/work/experience via Orb/content selector -> publish.
   - Stabilisiert durch publish hard-fail handling and visible owner-action unavailable states.

3. **Story User**
   - Open feed -> create story -> publish -> view real story group.
   - Stabilisiert through `StoryComposer.onSuccess`, real `StoryBar`, `StoryViewer data`.

4. **Buyer/Booking User**
   - Open creator/work -> book/connect or work CTA.
   - Stabilisiert by connection publish hard-fail and work CTA visible unavailable state.
   - Instabil: dedicated booking confirmation/state machine is still not fully wired to UI.

5. **Social User**
   - Open feed -> open profile -> follow/connect/chat -> notifications.
   - Stabilisiert by follow notification import, visible follow/work social errors, notification realtime/update path.

## Weiterhin instabile Bereiche

- Dedicated booking UI remains partially orphaned; current production path is connect/chat.
- Chat/booking schema drift still exists between `bookingContext.js`, `chatContext.js`, and `services/db.js`.
- Studio sub-pages are still placeholder/stub surfaces.
- Several profile sections still use seed/fallback stats where DB fields are missing.
- Impact voting still has client-side path while an edge function exists.
- Migrations do not fully describe runtime tables used by feed/chat/booking.

## Legacy / Experimental / Fallback-only

- `src/services/content.js`: legacy alternate content layer, currently zero imports.
- `src/services/db.js` chat/booking services: legacy schema (`conversations`) differs from live chat (`chats`).
- `src/components/publishing/PublishWorkFlow.jsx`, `WerkPublisher.jsx`: legacy work publish surfaces.
- `src/pages/DiscoverPage.jsx.bak`: dead backup file.
- `src/system/orb/OrbSystem.jsx`: radial Orb fallback; normal member create path uses `ContentTypeSelector`.
- `src/pages/wirker-profile/hooks/useBookingState.js`, `sections/BookingSection.jsx`: fallback/orphaned booking UI.
- `src/pages/studio/StudioSubPages.jsx`: placeholder-only creator tools.

## Runtime-Logs ergänzt

- `src/lib/runtimeLog.js`
  - groups logs by `flow` + `event`
  - stores recent logs in `window.__HUI_RUNTIME_LOGS__`
  - console output in dev or when `localStorage.hui_runtime_logs = "1"`
- Added log flows:
  - `feed`: initial load, partial query errors, load more, refresh, realtime works
  - `notifications`: load, mark read, realtime, weekly impact failures
  - `publish`: connection/teilen success and failure
  - `works`: like/save/cart/buy interaction failures
  - `story`: load success/failure, composer success
  - `profile`: follow failures/successes

## Kritische Dateien

- `src/lib/AppStateContext.jsx`
- `src/components/NotificationCenter.jsx`
- `src/components/HomeFeed.jsx`
- `src/feed/useFeedStream.js`
- `src/components/WorkDetailPage.jsx`
- `src/pages/Home.jsx`
- `src/components/StoryBar.jsx`
- `src/components/teilen/TeilenFlow.jsx`
- `src/components/connection-create/ConnectionCreatePage.jsx`
- `src/components/SupportSheet.jsx`
- `src/lib/ErrorBoundaries.jsx`
- `src/lib/runtimeLog.js`

## Runtime assumptions

- Supabase tables expected: `notifications`, `follows`, `work_likes`, `work_saves`, `works`, `experiences`, `beitraege`, `invitations`, `stories`, `story_views`.
- Work commerce checkout is not available from `/work/:id`; UI now fails visibly instead of pretending success.
- Booking production path remains connect/chat until the existing booking state machine is wired into UI.
