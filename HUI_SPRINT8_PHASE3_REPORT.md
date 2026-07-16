# HUI Sprint 8 Phase 3 — Presence Read Cutover (Chat)

**Datum:** 2026-07-16  
**Scope:** Chat liest Presence ausschließlich aus `user_presence` via `usePresenceMap`. Keine Änderungen an Feed, Discover, Commerce, Profile.

---

## Betroffene Komponenten

### Vorher (Legacy-Read)

| Datei | Zeile | Legacy-Quelle |
|-------|-------|---------------|
| `ConversationCard.jsx` | 33 | `formatPresence(conv.other_profile?.last_seen_at \|\| conv.last_seen_at)` |
| `ChatHeader.jsx` | 17 | `formatPresence(conv?.other_profile?.last_seen_at \|\| conv?.last_seen_at)` |

### Nachher (user_presence)

| Datei | Änderung |
|-------|----------|
| `ChatCenterOverlay.jsx` | `usePresenceMap(presenceUserIds)` — zentral für alle Chat-Partner |
| `ConversationList.jsx` | `presenceMap` + `currentUserId` durchreichen |
| `ConversationCard.jsx` | `presenceDisplayFromRow(presenceMap[otherId])` |
| `ChatHeader.jsx` | `presenceDisplayFromRow(presenceMap[otherId])` |
| `ConversationRoom.jsx` | `presenceMap` an `ChatHeader` |
| `usePresence.jsx` | `chatOtherUserId()`, `presenceDisplayFromRow()` |

### Unverändert (bewusst)

| Bereich | Read-Quelle |
|---------|-------------|
| Discover | `formatPresence(person.last_seen_at)` |
| Feed | Kein Presence-Read (nur `PresenceDot`-Import ungenutzt) |
| Home Write | `profiles.last_seen_at` via `usePresence.js` |

---

## Runtime

```
user_presence (DB)
  ↓ SELECT (initial load)
  ↓ postgres_changes (Realtime)
usePresenceMap(presenceUserIds)  [ChatCenterOverlay]
  ↓ presenceMap[userId]
presenceDisplayFromRow(row)
  ↓ { label, dot, online }
ConversationCard / ChatHeader (UI unverändert)
```

### Partner-ID-Auflösung

`chatOtherUserId(conv, currentUserId)`:
1. `conv.user_id`
2. `conv.other_profile.id`
3. `conv.participant_ids` (anderer Teilnehmer)

### Presence-User-IDs

Gesammelt aus:
- Alle offenen Chats in der Liste (`chats`)
- Aktiver ConversationRoom (`activeConv`)

---

## Realtime

| Aspekt | Implementierung |
|--------|-----------------|
| Subscription | `usePresenceMap` → ref-count Channel Registry (Phase 2) |
| Filter | `user_id=eq.{id}` (single) / `user_id=in.(...)` (multi) |
| Updates | `setMap` bei INSERT/UPDATE/DELETE |
| Reconnect | `visibilitychange → visible` → Reload |
| Cleanup | `removeChannel` bei refCount 0 |

Chat öffnet **eine** zentrale `usePresenceMap`-Subscription für alle Gesprächspartner — keine N+1-Subscriptions pro Karte.

---

## Regression (statische Prüfung)

| Szenario | Verhalten | Ergebnis |
|----------|-----------|----------|
| Online | `status === "online"` → grüner Dot, „Online" | ✓ |
| Idle/Away | `status === "away"` → amber Dot, „Gerade aktiv" | ✓ |
| Offline | `fmtPresence(row)` aus `last_seen_at` | ✓ |
| Reconnect | Visibility-Reload in `usePresenceMap` | ✓ |
| Mehrere Tabs | Separate Channel-Instanzen pro Tab | ✓ |
| Login | `presenceUserIds` befüllt wenn Chats laden | ✓ |
| Logout | `user?.id` null → leere IDs, Map leer | ✓ |
| Kein Presence-Eintrag | Fallback auf Mood-Label (ConversationCard) / Talent-Mood (ChatHeader) | ✓ |

---

## Build

```bash
npm install   # Exit 0
npm run build # Exit 0 — vite build ✓ built in ~5s
```

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| `user_presence` leer für Partner | Mittel | UI fällt auf Mood/Talent-Label zurück (wie vorher ohne Daten) |
| Online-Schwelle anders als Legacy (`<120s` vs `status`) | Niedrig | Bewusste SSOT-Semantik; konsistent mit Zielarchitektur |
| Viele Chat-Partner in einer Subscription | Niedrig | Max 50 Chats in `useChatList`; Filter `in.(...)` |
| Phase 2 PR #155 nicht gemerged | Niedrig | Branch baut auf Phase-2-Branch |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Chat liest ausschließlich `user_presence` | ✓ |
| Keine Reads mehr aus `profiles.last_seen_at` im Chat | ✓ |
| Realtime funktioniert | ✓ (via `usePresenceMap`) |
| Keine Regression | ✓ (statisch) |
| Build erfolgreich | ✓ |
| Keine Änderungen außerhalb Chat | ✓ |

---

## Git

- **Branch:** `cursor/presence-chat-cutover-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main` (stacked auf Sprint 8 Phase 2)
