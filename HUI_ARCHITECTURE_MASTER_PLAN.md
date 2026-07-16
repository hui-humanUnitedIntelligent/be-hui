# HUI Architecture Master Plan

**Version:** 2026-07-16 (Sprint 8 — Presence Consolidation Complete)  
**Status:** Living document  

---

## Presence Layer (Sprint 8 — Final)

### Single Source of Truth

| Concern | Owner | Table |
|---------|-------|-------|
| Presence Read | `usePresenceMap()` | `user_presence` |
| Presence Write (own user) | `usePresence()` | `user_presence` |
| Presence Display | `presenceDisplay()`, `PresenceDot`, `fmtPresence()` | — |

**Deprecated (Runtime):** `profiles.last_seen_at`, `profiles.last_seen`, `formatPresence()`.

### Write Path (einziger produktiver Pfad)

```
Home.jsx
  → usePresence(userId, currentPage?)
  → supabase.from("user_presence").upsert({
       user_id, status, last_seen_at, updated_at, current_page
     })
```

Lifecycle: `online` → (idle 90s) → `away` → (unload) → `offline`  
Heartbeat: 45s while active  

### Read Path

```
user_presence
  → usePresenceMap(userIds[])
  → Realtime postgres_changes
  → Consumer:
       - Feed (UnifiedFeed.FeedList → _presenceStatus)
       - Discover (PeopleSection → PersonCard)
       - Chat (ChatHeader, ConversationCard)
```

### Module Map

| Modul | Datei | Rolle |
|-------|-------|-------|
| Canonical API | `src/lib/usePresence.jsx` | Write + Read + UI helpers |
| Re-Export | `src/lib/usePresence.js` | Backward-compatible imports |
| Feed | `src/feed/UnifiedFeed.jsx` | Batch read via `usePresenceMap` |
| Discover | `src/pages/DiscoverPage.jsx` | PeopleSection batch read |
| Chat | `src/components/chat-center/*.jsx` | Per-conversation read |
| Session | `src/lib/sessionHooks.js` | **Kein Presence** (Scroll/Drafts only) |

### Realtime

- Channel topic: `presence_map_{firstUserId}`
- Table: `public.user_presence`
- Events: `*` (INSERT/UPDATE)
- Dedupe: reuse existing channel per topic (systemweit)

---

## Related Documents

| Document | Inhalt |
|----------|--------|
| [`HUI_PRESENCE_CONSOLIDATION_COMPLETE.md`](HUI_PRESENCE_CONSOLIDATION_COMPLETE.md) | Final Cutover Report (Phase 6) |
| [`HUI_SPRINT8_PHASE5_REPORT.md`](HUI_SPRINT8_PHASE5_REPORT.md) | Feed Read Cutover |
| [`docs/ARCHITECTURE_INDEX.md`](docs/ARCHITECTURE_INDEX.md) | Vollständiger Modul-Katalog |
| [`sql/036_presence_reactions.sql`](sql/036_presence_reactions.sql) | `user_presence` Schema |

---

## Governance Rules

1. **Kein** neuer Presence-Read aus `profiles`.
2. **Kein** Dual-Write — nur `user_presence`.
3. Presence-Anzeige **nur** über `usePresenceMap` / `presenceDisplay`.
4. Eigener User-Heartbeat **nur** über `usePresence()` aus `usePresence.jsx`.
