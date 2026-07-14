# Domain Contract — COMMUNICATION

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Communication & Notifications  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Menschlicher Dialog — Chats, Nachrichten, Benachrichtigungen und Conversation-UI.

**Grundpfeiler-Bezug:** 🤝 Verbinden · 💚 Unterstützen

---

## Verantwortung

### Besitzt (fachlich)

- Conversations
- Messages
- Chats
- Notifications
- Chat-UI
- Notification-Delivery

### Besitzt ausdrücklich NICHT

- Profil (→ IDENTITY)
- Connections/Follows (→ CONNECTION)
- Commerce (→ COMMERCE)
- Push-Engagement-Optimierung

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `conversations`
- `messages`
- `chats`
- `notifications`

### Tabellen — nur lesen

- `profiles`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `bookings`
- `follows`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | ChatService (db.js), lib/notificationService.js |
| **Contexts** | chatContext (Owner), AppStateContext.notifications (Owner) |
| **Hooks** | useChatList, useChatThread, useNotifCount, useNotifications |
| **Komponenten** | components/chat-center/*, components/NotificationCenter, components/notifications/* |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 17 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| ChatService | public | sendMessage, getThread, createChat |
| notificationService | public | sendNotification, markRead |
| useChatList (`chatContext.js`) | public | — |
| useChatThread (`chatContext.js`) | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `message.sent`
- `message.read`
- `notification.received`

### Konsumiert

- `CONNECTION_OPENED`
- `BOOKING_REQUESTED`
- `WORK_PUBLISHED`

### Darf niemals erzeugen

- `resonance.sent`
- `spam ohne SPAM_DETECTED`

---

## Realtime

### Kanäle

- `chat-list:{userId}`
- `thread:{chatId}`
- `asc-notifs:{userId}`
- `chats:{userId}`

### Erlaubte Presence-Informationen

- typing indicator (ephemeral, optional)

---

## Layer

### Erlaubte Layer

- Presentation
- Application
- Domain
- Infrastructure
- Core

### Verbotene Layer

_Keine zusätzlichen Verbote_

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `IDENTITY`
- `CONNECTION`

### Darf abhängig sein von

- `STUDIO`

### Verbotene zyklische Abhängigkeiten

- COMMUNICATION → IDENTITY (Profile-Write)

---

## Constitution

### Besonders geltende Regeln

- Regel 7 — KI ersetzt Menschen nicht
- Design: Keine aggressive Push-Strategie

### Invarianten

- chatContext als Single Owner
- Cleanup verpflichtend (REALTIME_REGISTRY)

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- REALTIME: Channel-Owner-Validierung
- DUPLICATE_OWNER: chats/messages (3 shadow states)
- DB_DIRECT_WRITE: WirkerProfilePage inserts chats
- LEGACY: useChat.js deprecated

---

## Intelligence

### Empfehlungen

- useChat.js → chatContext migrieren
- WirkerProfilePage chat.insert → ChatService

### Typische Risiken

- MeinHUI_SubPages direct message writes
- Legacy useChat hooks

### Erlaubte Refactorings

- ChatContext-Konsolidierung
- Legacy-Hook-Entfernung

### Niemals

- Engagement-Push-Notifications
- Read-Receipt-Gamification

---

## Migration

### Vollständig migriert wenn

- chatContext alleiniger Owner
- useChat.js entfernt
- 0 duplicate chat owners

### Metriken „fertig"

- **healthScore:** 70% → 95%
- **duplicateOwners:** 0

**Aktueller Health Score (Baseline):** 70%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/NotificationCenter.jsx, components/chat-center/ChatAtmosphere.jsx, components/chat-center/ChatCenterOverlay.jsx, components/chat-center/ChatHeader.jsx, components/chat-center/ChatInput.jsx, components/chat-center/ChatMessages.jsx, components/chat-center/ConversationCard.jsx, components/chat-center/ConversationList.jsx (+9)

---

*Domain Contract COMMUNICATION — ARCH-005.1. Keine Runtime-Änderung.*
