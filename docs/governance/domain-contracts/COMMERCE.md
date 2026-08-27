# Domain Contract — COMMERCE

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Commerce & Transactions  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Wertschöpfung ermöglichen — Buchungen, Käufe, Escrow, Creator-Economy und Gentle Economy.

**Grundpfeiler-Bezug:** 💚 Unterstützen · 🌱 Wertschöpfen

---

## Verantwortung

### Besitzt (fachlich)

- Orders
- Payments
- Bookings
- Cart
- Payouts
- Supports
- Creator Wallets

### Besitzt ausdrücklich NICHT

- Content-Erstellung (→ CREATION)
- Chat (→ COMMUNICATION)
- Impact Pool (→ IMPACT)
- Profil (→ IDENTITY)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `bookings`
- `experience_bookings`
- `orders`
- `order_items`
- `creator_wallets`
- `creator_supports`
- `commerce_events`
- `availability_slots`

### Tabellen — nur lesen

- `profiles`
- `works`
- `experiences`

### Tabellen — niemals schreiben

- `profiles`
- `impact_votes`
- `messages`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | BookingService (db.js), commerceEngine.js, creatorEconomy.js, lib/bookingContext.js |
| **Contexts** | bookingContext (Creator-Bookings), AppStateContext.bookings (Client) |
| **Hooks** | useCartPersistence, useCreatorBookings |
| **Komponenten** | components/commerce/*, components/economy/SupportFlow, components/ExperienceBookingFlow |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 13 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| orderService (`commerceEngine.js`) | public | — |
| fulfillmentService (`commerceEngine.js`) | public | — |
| BookingService | public | createBooking, confirmBooking |
| walletService (`creatorEconomy.js`) | public | — |
| COMMERCE_CONFIG | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `BOOKING_REQUESTED`
- `BOOKING_COMPLETED`
- `BOOKING_CANCELLED`
- `booking.created`
- `order.completed`
- `payment.received`
- `escrow.released`

### Konsumiert

- `WORK_PUBLISHED`
- `EXPERIENCE_CREATED`
- `PROFILE_COMPLETED`

### Darf niemals erzeugen

- `resonance.sent`
- `impact.vote.cast`

---

## Realtime

### Kanäle

- `bookings-client:{userId}`
- `creator-bookings:{userId}`

### Erlaubte Presence-Informationen

_Keine_

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
- `CREATION`

### Darf abhängig sein von

- `STUDIO`
- `TRUST`

### Verbotene zyklische Abhängigkeiten

- COMMERCE → CREATION → COMMERCE (ohne Order-Event)

---

## Constitution

### Besonders geltende Regeln

- Regel 4 — Wertschöpfung und Gemeinwohl
- Gentle Economy Philosophy

### Invarianten

- Impact Pool Rate (7%)
- Keine manipulative Pricing-Dark-Patterns

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- DUPLICATE_OWNER: bookings (8 shadow states)
- DB_DIRECT_WRITE: WirkerProfileDashboard writes bookings
- CROSS_DOMAIN_WRITE: MeinHUI_SubPages availability_slots

---

## Intelligence

### Empfehlungen

- BookingService + bookingService + bookingContext konsolidieren
- experienceBookingService benennen

### Typische Risiken

- 3 parallele Booking-Services
- Stripe/Escrow Komplexität

### Erlaubte Refactorings

- Booking-Konsolidierung
- Commerce 2.0 durchgängig

### Niemals

- Aggressive Upselling
- Engagement-optimierte Checkout-Flows

---

## Migration

### Vollständig migriert wenn

- Ein Booking-Owner
- Edge Functions als Payment-Gateway
- 0 Namenskollisionen

### Metriken „fertig"

- **healthScore:** 45% → 85%
- **duplicateOwners:** 0

**Aktueller Health Score (Baseline):** 45%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/commerce/ExperienceBookingFlow.jsx, components/commerce/StripePaymentStep.jsx, components/commerce/UnterstutzenFlow.jsx, components/commerce/WerkKaufFlow.jsx, components/commerce/WerkeKorb.jsx, components/commerce/commerceUtils.js, components/economy/SupportFlow.jsx, components/studio/EinAusgabenModal.jsx (+5)

---

*Domain Contract COMMERCE — ARCH-005.1. Keine Runtime-Änderung.*
