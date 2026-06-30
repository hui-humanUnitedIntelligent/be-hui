# Domain Services — Prepared Structure (CORE-001)

> Ziel-Ordner für die Aufspaltung von `services/db.js` gemäß ADR-0001.

## Geplante Services

| Service | Domäne | Tabellen | Quell-Owner |
|---|---|---|---|
| `identityService.js` | IDENTITY | profiles, wirker_profiles, memberships | AuthContext, db.js ProfileService |
| `contentService.js` | CONTENT | works, stories, beitraege, comments | content.js, db.js WorkService |
| `socialService.js` | SOCIAL | chats, messages, follows, connections | chatContext, AppStateContext |
| `commerceService.js` | COMMERCE | bookings, payments, creator_wallets | bookingContext, commerceEngine |
| `impactService.js` | IMPACT | impact_projects, impact_votes, impact_rounds | db.js ImpactService |
| `discoveryService.js` | DISCOVERY | feed_items, recommendations | feed/, discovery/ |
| `platformService.js` | PLATFORM | notifications, platform_events | events/, notificationService |

## Migrationsregel

1. Service extrahieren aus `db.js`
2. Context-Owner delegiert an Service
3. UI-Verstöße migrieren (siehe `violations.js`)
4. `db.js` re-exportiert für Rückwärtskompatibilität
5. Deprecated-Marker entfernen wenn vollständig migriert

## Status

**CORE-001:** Ordner vorbereitet, keine Services extrahiert (kein Verhaltenswechsel).
