# RFC-000 — Domain Model

**Status:** Ratifiziert  
**Version:** 1.0  
**Datum:** 2026-06-30

---

## 1. Domänen-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                         CORE                                 │
│  Registry · Core Engine · Action Engine · Resonance Engine  │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐   ┌─────▼─────┐
    │ IDENTITY│   │  CONTENT  │  │ SOCIAL  │   │ COMMERCE  │
    │ Profile │   │ Works·Feed│  │Chat·Foll│   │Booking·Pay│
    └─────────┘   └───────────┘  └─────────┘   └───────────┘
         │              │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐   ┌─────▼─────┐
    │ IMPACT  │   │ DISCOVERY │  │COMMUNITY│   │  PLATFORM │
    │ Votes   │   │ Search·Feed│ │Members  │   │Events·Admin│
    └─────────┘   └───────────┘  └─────────┘   └───────────┘
```

---

## 2. Domänen-Definitionen

### CORE
**Owner-Pfad:** `src/core/`, `src/registry/`, `src/architecture/`  
**Verantwortung:** Wirkungsdaten, Semantik, Action Engine, Architektur-Guards  
**Tabellen:** Keine direkten (liest aggregiert)

### IDENTITY
**Owner-Pfad:** `src/lib/AuthContext.jsx`, `ProfileService` in `db.js`  
**Verantwortung:** Auth, Session, Profile, Wirker-Profile, Membership  
**Tabellen:** `profiles`, `wirker_profiles`, `memberships`

### CONTENT
**Owner-Pfad:** `src/services/content.js`, Create-Flows  
**Verantwortung:** Works, Stories, Beiträge, Feed-Posts, Media  
**Tabellen:** `works`, `stories`, `beitraege`, `feed_posts`, `story_views`, `story_reactions`

### SOCIAL
**Owner-Pfad:** `src/lib/chatContext.js`, `src/lib/AppStateContext.jsx` (follows)  
**Verantwortung:** Chats, Messages, Follows, Connections, Presence  
**Tabellen:** `chats`, `messages`, `chat_participants`, `follows`, `connections`, `user_presence`

### COMMERCE
**Owner-Pfad:** `src/services/commerceEngine.js`, `src/lib/bookingContext.js`  
**Verantwortung:** Bookings, Payments, Escrow, Creator Economy  
**Tabellen:** `bookings`, `booking_events`, `payments`, `creator_wallets`, `work_sales`

### IMPACT
**Owner-Pfad:** Impact-Flows, `ImpactService` in `db.js`  
**Verantwortung:** Impact Projects, Votes, Rounds, Applications  
**Tabellen:** `impact_projects`, `impact_votes`, `impact_rounds`, `impact_applications`

### DISCOVERY
**Owner-Pfad:** `src/lib/discovery/`, `src/feed/`  
**Verantwortung:** Feed Stream, Search, Recommendations, Match  
**Tabellen:** `feed_items`, `user_match_scores`, `recommendations`

### COMMUNITY
**Owner-Pfad:** `src/lib/community/`  
**Verantwortung:** Communities, Members, Guardian Actions  
**Tabellen:** `communities`, `community_members`, `guardian_actions`

### PLATFORM
**Owner-Pfad:** `src/lib/events/`, Admin-Pages  
**Verantwortung:** Platform Events, Notifications (infrastructure), Admin  
**Tabellen:** `platform_events`, `notifications`

### TRUST
**Owner-Pfad:** `src/lib/trustContext.js`, `src/lib/trust/`  
**Verantwortung:** Trust Signals, Reputation  
**Tabellen:** `trust_signals`

---

## 3. Abhängigkeitsregeln

- UI importiert nur aus eigener Domäne + CORE + Shared Hooks
- Cross-Domain Reads: über Service-Interface oder Context
- Cross-Domain Writes: verboten ohne expliziten Contract
- CORE darf von keiner Domäne abhängen (außer Registry)

---

## 4. Service-Zuordnung

| Service | Domäne | Datei |
|---|---|---|
| ProfileService | IDENTITY | `services/db.js` |
| WirkerService | IDENTITY | `services/db.js` |
| WorkService | CONTENT | `services/db.js` |
| StoryService | CONTENT | `services/db.js` |
| ContentService | CONTENT | `services/content.js` |
| BookingService | COMMERCE | `services/db.js` |
| CommerceEngine | COMMERCE | `services/commerceEngine.js` |
| CreatorEconomy | COMMERCE | `services/creatorEconomy.js` |
| ImpactService | IMPACT | `services/db.js` |
| FeedService | DISCOVERY | `services/db.js` |
| ChatContext | SOCIAL | `lib/chatContext.js` |
| AppStateContext | SOCIAL/IDENTITY | `lib/AppStateContext.jsx` |
| TrustContext | TRUST | `lib/trustContext.js` |

**Hinweis:** `services/db.js` ist ein Legacy-Monolith — TODO(ADR-0001): Aufspaltung in Domain Services.

---

## Referenzen

- `src/architecture/domains.js` — Technische Definitionen
- `src/architecture/ownership.js` — Datei-Level Ownership
- [SYSTEM_OWNERSHIP.md](../SYSTEM_OWNERSHIP.md)
