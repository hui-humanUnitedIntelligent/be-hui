# HUI — REALTIME CHANNEL REGISTRY
**Phase 4A.4 — Single-Owner Architecture**

---

## Naming Convention

```
{scope}-{entity}:{userId|resourceId}
```

Beispiele:
- `asc-notifs:{userId}` — AppStateContext, notifications
- `bookings-client:{userId}` — AppStateContext, client bookings
- `creator-bookings:{userId}` — bookingContext, creator view
- `chat-list:{userId}` — chatContext, conversation list
- `thread:{chatId}` — chatContext, message thread

---

## Channel Register

| Channel Pattern | Owner File | Events | Cleanup | Consumers |
|-----------------|-----------|--------|---------|-----------|
| `asc-notifs:{userId}` | `lib/AppStateContext.jsx` | INSERT notifications | ✅ useEffect return | `useNotifCount()`, `NotificationCenter` |
| `bookings-client:{userId}` | `lib/AppStateContext.jsx` | * bookings | ✅ useEffect return | `useAppState().bookings` |
| `chats:{userId}` | `lib/AppStateContext.jsx` | INSERT messages | ✅ useEffect return | `useAppState().chats` |
| `creator-bookings:{userId}` | `lib/bookingContext.js` | * bookings | ✅ useEffect return | `useCreatorBookings()` |
| `chat-list:{userId}` | `lib/chatContext.js` | UPDATE/INSERT chats | ✅ useEffect return | `useChatList()` |
| `thread:{chatId}` | `lib/chatContext.js` | INSERT/UPDATE messages | ✅ useEffect return | `useChatThread()` |
| `convos:{userId}` | `hooks/useChat.js` | UPDATE conversations | ✅ useEffect return | `useConversations()` (legacy) |
| `msgs:{conversationId}` | `hooks/useChat.js` | INSERT messages | ✅ useEffect return | `useMessages()` (legacy) |
| `comments:{workId}` | `components/CommentSection.jsx` | INSERT comments | ✅ useEffect return | inline |
| `works-feed` | `components/DiscoveryFeed.jsx` | INSERT works | ✅ useEffect return | feed list |
| `chat-{chatId}` | `components/MeinHUI_SubPages.jsx` | INSERT messages | ✅ useEffect return | NachrichtenPage |
| `stripe_impact_pool_realtime` | `hooks/useStripeImpactPool.js` | * stripe_impact_pool, INSERT stripe_impact_pool_events | ✅ useEffect return | `useStripeImpactPool()`, `useLiveTicker()` |
| `votes_rt_main` | `lib/realtime/votesRealtimeBus.js` | INSERT impact_votes | ✅ refcount + unsubscribe | `ImpactPage`, `useLiveTicker()` |
| `hui_liveticker_rt` | `lib/realtime/livetickerRealtimeBus.js` | INSERT/UPDATE works, experiences, invitations, talents, impact_applications | ✅ refcount + unsubscribe | `useLiveTicker()` → `LiveTickerBar` |
| `payout_{ambassadorId}` | `hooks/useAmbassadorPayout.js` | * stripe_payouts, * stripe_ambassador_commissions | ✅ useEffect return | `useAmbassadorPayout()` |

---

## Regeln (ZWINGEND)

1. **.on() IMMER vor .subscribe()** — niemals danach
2. **Jeder Channel hat exakt einen Owner** — kein Channel-Name darf doppelt subscribed werden
3. **Cleanup verpflichtend** — `return () => supabase.removeChannel(channel)`
4. **StrictMode-safe** — Cleanup muss idempotent sein
5. **Reconnect-safe** — Channel-Ref via `useRef`, nie als Component-State

---

## Standard useEffect Template

```js
useEffect(() => {
  if (!user?.id) return;

  const channel = supabase
    .channel(`{scope}-{entity}:${user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: '{tableName}',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      // Handler — nur setState, keine weiteren DB-Calls
    });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
```

---

## Verboten

- ❌ `channel.on()` nach `channel.subscribe()`
- ❌ Gleicher Channel-Name in zwei verschiedenen useEffects/Komponenten
- ❌ Channel als React-State speichern (immer `useRef`)
- ❌ Channel außerhalb von useEffect erstellen
- ❌ Global-Singleton-Channels (window.channel = ...)

---
*Generiert: Phase 4A.4 — Stand 2026-05-17*
*Nachgetragen: Stripe-Impact-Pool + Ambassador-Payout Kanäle — Stand 2026-07-02 (ARCH-006.1 Sync-Audit)*
