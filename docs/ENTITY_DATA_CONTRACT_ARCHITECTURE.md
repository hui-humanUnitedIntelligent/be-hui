# Phase 4 Entity / Data / Contract Architecture

Status: canonical platform data layer introduced in this branch.

## 1. Complete entity map

| Table | Active use | Author fields | Content fields | Media fields | Visibility/status | Timestamps | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `works` | active feed + publish + profile | `user_id`, legacy/DB `creator_id` | `title`, `description`, `caption`, `category`, `tags` | `cover_url`, `media_url`, legacy `images` | `visibility`, `status=published/draft/archived` | `created_at`, `updated_at` | `creator_id` remains DB compatibility; canonical runtime is `authorId`. |
| `stories` | active story publish/read; feed eligible when active | `user_id` | `caption`, `text_overlay`, `mood`, `location` | `media_url`, `media_type` | optional/legacy `status`; `expires_at` drives active state | `created_at`; `updated_at` not reliable in all migrations | No direct status/visibility insert added where schema comments say absent. |
| `feed_posts` | active/transitional post publish; now feed source | `user_id` | `caption`, `mood`, `location` | `media_url`, `media_type` | no visibility column; `is_archived=false` means public feed | `created_at`, `updated_at` | Transitional replacement for `beitraege`; canonical entityType is `feed_post`. |
| `beitraege` | legacy read/realtime feed source | `user_id` | `caption`, `type` | `src` | no visibility/status in app contract | `created_at` | No frontend insert found; retained as `legacy-read-feed-source`. |
| `experiences` | active feed + publish | `user_id` | `title`, `description`, `category`, mood/scheduling/pricing fields | `cover_url`, `media_url`, `images` JSONB | `visibility`, `status=published/draft/paused/archived` | `created_at`, `updated_at` | `sale_mode/price_type/pricing_type`, `participant_limit/max_participants/spots_available` remain DB-level overlaps. |
| `invitations` | active feed + publish + realtime | `user_id` | `text`, `title`, `body`, `vibe`, `mood`, `location`, `city`, `time_label` | none | `visibility public/followers/private`, `status active/expired/cancelled` | `created_at`, `updated_at` | Generated `content_type` remains DB-owned. |
| `connections` | active publish; now central feed source/realtime when public | `user_id` | `type`, `title`, `description`, schedule/location/cost fields | none | `visibility public/followers/private`, `status active/closed/cancelled` | `created_at`, `updated_at` | Routed as moment until a dedicated card exists. |
| `impact_applications` | active submit-only | `user_id` | project/contact/funding fields | `media_urls`, `cover_url` | no visibility column; `status=pending/reviewed...` | `created_at`, `submitted_at`, `reviewed_at`; no reliable `updated_at` | Not feed eligible; still canonicalized/validated for publish. |

## 2. Canonical entity structure

Source of truth:

- `src/entities/entityTypes.js`
- `src/contracts/entityContract.js`
- `src/contracts/authorContract.js`
- `src/contracts/visibilityContract.js`
- `src/contracts/mediaContract.js`
- `src/normalizers/entityNormalizer.js`

Canonical runtime shape:

```js
{
  id,
  entityType,
  authorId,
  authorProfile,
  title,
  content,
  media: [{ type, url, alt, width, height, blurhash }],
  visibility,
  status,
  createdAt,
  updatedAt,
  metadata,
  realtime,
  feedEligible
}
```

Feed cards receive a compatibility adapter from `toFeedCardEntity()`. The canonical entity remains available as `_entity`; URL arrays for old cards are exposed as `images`/`mediaUrls`.

## 3. Legacy systems still present

- `src/system/feed/feedNormalizer.js`: deprecated transitional re-export to canonical normalizer.
- `src/lib/factories/createFeedItem.js`: transitional render adapter; canonical entities are preserved instead of re-normalized.
- `src/lib/AppStateContext.jsx` `useFeedData()`: legacy parallel loader; invitation inline normalizer removed.
- `beitraege`: legacy read/realtime source without frontend publish.
- `feed_posts`: transitional post source; now normalized centrally and included in the feed registry.
- Older publishers (`WerkPublisher`, `PublishWorkFlow`, `HuiCreateFlow`) remain but now validate through the central contract before insert.

## 4. Current source of truth

- Entity types/routes: `src/entities/entityTypes.js`
- Visibility values: `src/contracts/visibilityContract.js`
- Author semantics: `src/contracts/authorContract.js`
- Media shape: `src/contracts/mediaContract.js`
- Entity validation: `src/contracts/entityContract.js`
- DB row -> canonical/feed adapter: `src/normalizers/entityNormalizer.js`
- Feed source registry: `src/entities/feedEntitySources.js`
- Realtime registry: `src/entities/EntityRealtimeLayer.js`

## 5. Tables actively used

Active feed sources: `works`, `experiences`, `feed_posts`, `beitraege`, `stories`, `invitations`, `connections`.

Active publish/submit sources: `works`, `experiences`, `stories`, `feed_posts`, `invitations`, `connections`, `impact_applications`.

Submit-only/non-feed: `impact_applications`.

## 6. Deprecated fields

Deprecated at contract boundary: `creator`, `creator_id`, `user`, `user_id`, `author`, `profile`, `image`, `images`, `media_url`, `cover_url`, `attachments`, `src`, `created_at`, `updated_at`.

These fields may still exist in DB rows, but normalizers map them to:

- `authorId`
- `authorProfile`
- `media[]`
- `createdAt`
- `updatedAt`
- `metadata.deprecatedFields`

## 7. Normalizers removed or centralized

- The old `src/system/feed/feedNormalizer.js` implementation was removed and replaced with a transitional re-export.
- The invitation inline normalizer in `AppStateContext` was removed.
- `feedService.getHomeFeed()` now maps `feed_posts`/`works` via canonical normalizers.
- `createFeedItem()` no longer re-normalizes canonical entities; it preserves `entityType` and canonical contract fields.

## 8. Central realtime paths

`src/entities/EntityRealtimeLayer.js` is now the single feed realtime path:

1. Supabase postgres event
2. source registry lookup
3. central normalizer
4. entity validation
5. `feedEligible` check
6. soft hydration insert

Realtime sources: `works`, `experiences`, `feed_posts`, `beitraege`, `stories`, `invitations`, `connections`.

## 9. Open risks

- DB schema drift still exists: some environments may lack optional `stories.visibility`, `works.visibility`, `feed_posts`, or `connections`. Source query failures are isolated per table and logged.
- `impact_applications` has no `updated_at`/visibility DB columns; canonical values are runtime-only.
- `experiences` historical migrations still disagree on `status=active` vs `published`.
- Dedicated UI cards do not exist for `connections`/`impact_applications`; routing remains entityType-based and uses existing cards.
- Existing DB columns remain for compatibility; destructive migrations were intentionally not introduced.

## 10. Verification expectations

- Build: `npm run build`
- Lint changed UI files: `npx eslint src/components/HuiCreateFlow.jsx src/components/WerkPublisher.jsx src/components/StoryComposer.jsx src/components/publishing/PublishWorkFlow.jsx src/components/connection-create/ConnectionCreatePage.jsx src/components/HomeFeed.jsx src/feed/cards/FeedRouter.jsx src/feed/cards/WorkCard.jsx src/feed/cards/ExperienceCard.jsx src/feed/cards/MomentCard.jsx --quiet`
- Runtime assumptions:
  - Supabase relationships used by existing code remain available.
  - Missing/legacy tables fail per source without crashing the whole feed.
  - Publish flows fail closed when `validateEntity`, `validateVisibility`, `validateMedia`, or `validateAuthor` reports an error.
