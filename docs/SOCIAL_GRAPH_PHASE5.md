# HUI Phase 5 - Social Graph + Interaction Engine

Stand: 2026-05-25

## 1. Vollstaendige Social-Graph-Map

| Domain | Bestehende Tabellen / Code | Beziehung | Status |
| --- | --- | --- | --- |
| Follow | `follows`, `src/lib/AppStateContext.jsx`, `src/pages/wirker-profile/hooks/useBookingState.js` | `follower_id -> followed_id` | Canonical write-owner bleibt AppState; Phase 5 spiegelt in `interactions` + `social_relationships`. |
| Bookings | `bookings`, `booking_events`, `src/lib/bookingContext.js` | `requester_id -> creator_id` | Canonical interaction `booking`; relationship `participant`. |
| Invitations | `invitations`, `invitation_responses`, `src/content/invitation/useInvitationResponse.js` | `user_id` host, responses als Teilnahme | Canonical interaction `invite_response`; relationship `participant`. |
| Chats | `chats`, `messages`, `src/lib/chatContext.js` | `participant_a <-> participant_b`; message sender | Canonical interaction `message`; relationship `participant`; realtime via `SocialRealtimeLayer.subscribeChat`. |
| Notifications | `notifications`, `src/lib/notificationService.js` | user alert | Canonical notification pipeline in `src/notifications/engine.js`; normalized into existing table. |
| Connections | `connections` | Content-/event post, kein graph edge | Transitional content entity; graph edges muessen ueber `social_relationships` laufen. |
| Resonances / reactions | `resonances`, `src/lib/resonance/index.js` | `user_id -> target` typed resonance | Canonical interaction `react`, `save`, `support`, `participate`; legacy platform event write removed from resonance path. |
| Participation | `invitation_responses`; capacity fields in `connections` / `experiences` | echte Teilnahme nur bei invitations | Canonical only when a persisted participation row exists. |
| Trust / reputation | `recommendations`, `collaborations`, `trust_events`, `profiles.trust_score` | trust events and verified collaborations | Transitional trust source; Phase 5 relationship types include `trusted`, but no point/gamification model. |
| Creator / profile / user | `auth.users`, `profiles`, `wirker_profiles`, `works.user_id`, `works.creator_id` | person identity + creator extension | Canonical person id is `profiles.id` (`auth.users.id`). |
| Presence | `profiles.last_seen`, `src/lib/sessionHooks.js`, `src/lib/presence/index.js` | online signal | Canonical operational state in `presence_states`; `profiles.last_seen` is transitional compatibility write. |

### Doppelte Bedeutungen

- `connection`: content entity (`connections`) vs. social edge language. Canonical graph edges are only `social_relationships`.
- `resonanz` / likes: legacy `work_likes`, `likes`, `work_saves` vs. canonical `resonances` and Phase 5 `interactions`.
- Booking actors: legacy `user_id`/`wirker_id` and newer `requester_id`/`creator_id`. Canonical actors are `actorId`, `targetUserId`.
- Chat participants: legacy `user1_id`/`user2_id`, transitional `participant_ids`, canonical runtime `participant_a`/`participant_b`.
- Presence timestamps: `last_seen`, `last_active_at`, `last_active_signal`; canonical runtime table is `presence_states`.

### Actor/User/Profile Inkonsistenzen

- `actor_id`, `sender_id`, `user_id`, `creator_id`, `requester_id`, `follower_id` carried the same semantic role in different flows.
- Phase 5 contract normalizes all social events to:

```js
{
  id,
  interactionType,
  actorId,
  targetEntityType,
  targetEntityId,
  targetUserId,
  visibility,
  metadata,
  createdAt,
}
```

## 2. Kanonische Interaction-Struktur

Source of truth:

- `src/interactions/contracts.js`
- `sql/migrations_safe/033_social_graph_foundation.sql`
- table `interactions`

Supported types:

- `follow`
- `react`
- `reply`
- `save`
- `participate`
- `invite_response`
- `booking`
- `support`
- `message`
- `collaboration_interest`

Validation:

- `validateInteraction()`
- `assertValidInteraction()`
- `toInteractionRow()`
- no silent fallback for malformed interactions

## 3. Relationship-Architektur

Source of truth:

- `src/social/relationships.js`
- table `social_relationships`

Canonical shape:

```js
{
  sourceUserId,
  targetUserId,
  relationshipType,
  strength,
  createdAt,
  metadata,
}
```

Relationship types:

- `following`
- `mutual`
- `collaborator`
- `participant`
- `supporter`
- `trusted`
- `blocked`

Current interaction mapping:

| Interaction | Relationship |
| --- | --- |
| `follow` | `following` |
| `booking`, `invite_response`, `participate`, `message` | `participant` |
| `react`, `save`, `support`, `reply` | `supporter` |
| `collaboration_interest` | `collaborator` |

## 4. Notification-Architektur

Source of truth:

- `src/notifications/engine.js`
- table `notification_events`
- normalized writes to existing `notifications`

Pipeline:

```text
interaction
-> normalize notification event
-> notification_events
-> notifications
-> SocialRealtimeLayer
```

Canonical notification shape:

```js
{
  id,
  type,
  actor,
  entity,
  targetUserId,
  read,
  createdAt,
  metadata,
}
```

Existing `src/lib/notificationService.js` is now a compatibility wrapper around the canonical engine.

## 5. Presence-Architektur

Source of truth:

- `src/presence/index.js`
- table `presence_states`
- compatibility mirror: `profiles.last_seen`

Canonical shape:

```js
{
  userId,
  status,
  currentRoute,
  currentWorld,
  lastActiveAt,
}
```

Statuses:

- `online`
- `active`
- `idle`
- `offline`

Validation:

- `validatePresence()`
- `assertValidPresence()`

## 6. Deprecated Systeme

- `work_likes`
- `work_saves`
- generic `likes`
- generic `favorites` as social relationship
- `follows.following_id` naming from old docs
- `chats.user1_id/user2_id`
- direct notification inserts from feature flows
- direct follow writes in profile hooks
- resonance-only `platform_events` emission as a reaction pipeline

## 7. Source of Truth ab Phase 5

| Concern | Source of Truth |
| --- | --- |
| Interaction contract | `src/interactions/contracts.js`, `interactions` |
| Relationship graph | `src/social/relationships.js`, `social_relationships` |
| Social event pipeline | `src/social/eventPipeline.js` |
| Notification engine | `src/notifications/engine.js`, `notification_events`, `notifications` |
| Presence state | `src/presence/index.js`, `presence_states` |
| Realtime architecture | `src/social/realtime.js` |
| Person identity | `profiles.id` (`auth.users.id`) |

## 8. Zentralisierte Realtime-Pfade

- Notifications and target-user interactions: `SocialRealtimeLayer.subscribeUser`
- Chat messages: `SocialRealtimeLayer.subscribeChat`
- Invitation responses: `SocialRealtimeLayer.subscribeInvitation`
- Entity activity and notification events: `EntityRealtimeLayer.subscribeEntity`
- Presence updates: `SocialRealtimeLayer.subscribeUser`

Legacy table subscriptions still exist for feed and creator-booking views. They are transitional until those screens consume the central layers.

## 9. Offene Risiken

- Client-side multi-table writes are not database-atomic. A future RPC or edge function should wrap `interaction -> relationship -> notification` in one transaction.
- Existing database environments must run `033_social_graph_foundation.sql` before Phase 5 writers are enabled.
- Some older schemas still expose legacy booking/profile columns; migrations should continue consolidating on `requester_id`, `creator_id`, and `profiles.id`.
- `connections` is still a content type, not a relationship edge. Any future join/RSVP model must persist before it can create `participate`.
- Feed realtime is still table-specific and should later be migrated to entity/social refresh events.

## 10. Runtime assumptions

- Supabase Realtime is enabled for `interactions`, `social_relationships`, `presence_states`, `notification_events`, `notifications`, `messages`, and `invitation_responses`.
- RLS policies from `033_social_graph_foundation.sql` are applied.
- `profiles.id` remains the canonical person identifier.
- No fake presence is created: own presence writes persist to `presence_states` and mirror `profiles.last_seen`; read fallback logs a warning when canonical state is unavailable.
