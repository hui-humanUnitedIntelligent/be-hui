# HUI Product Completion 2.4 — Commerce Unification

**Phase:** 2.4  
**Status:** Abgeschlossen  
**Datum:** 2026-07-01  

---

## Ziel

Commerce 2.0 ist das einzige offizielle Commerce-System der Plattform. Alle Kauf-, Buchungs- und Unterstützungsprozesse laufen über denselben Checkout.

---

## Finaler Commerce-Datenfluss

```
Einstiegspunkt (Feed / Detail / Profil / Discover / …)
        ↓
Commerce 2.0 — addItemToCart() / normalizeCommerceCartItem()
        ↓
WerkeKorb (persistenter Cart: localStorage hui_cart_v1:{userId})
        ↓
UnterstützenFlow (Stripe Payment Intent via Edge Function)
        ↓
StripePaymentStep → create-payment-intent → Stripe
        ↓
Webhook handle-payment-webhook → orders / order_items
        ↓
Bestätigung (Danke-Screen / ?hui_order=&status=success)
        ↓
Meine Resonanz (orders + order_items)
```

### Unterstützung (Creator Support)

```
Profil → CreatorSupportSheet (Betrag wählen)
        ↓
WerkeKorb (type: support)
        ↓
UnterstützenFlow → Stripe (item_type: support, creator_id als item_id)
```

---

## Migrierte Einstiegspunkte

| Einstiegspunkt | Vorher | Nachher |
|----------------|--------|---------|
| **Feed** (`UnifiedFeed.onBook`) | Commerce 2.0 Cart | ✅ unverändert (addItemToCart) |
| **Home** (`WerkeKorbButton`) | Commerce 2.0 | ✅ unverändert |
| **Entdecken** (`DiscoverPage.onBook`) | `ExperienceBookingFlow` (Legacy) | ✅ WerkeKorb + Auto-Open |
| **Suche** (`SearchCommandCenter`) | Kein Commerce (Profil) | ✅ unverändert (kein Kauf) |
| **Werk-Detail** (`/work/:id`) | `WerkKaufFlow` via `pendingWerkKauf` | ✅ `pendingCartItem` → WerkeKorb |
| **Werk-Detail** „In den Korb“ | Unwired (no-op) | ✅ `onAddToKorb` → Cart |
| **Profil** (`BOOK_EXPERIENCE`) | `ExperienceBookingFlow` | ✅ Cart + WerkeKorb |
| **Profil** (Support) | `SupportFlow` → `supportService` | ✅ `CreatorSupportSheet` → Cart |
| **Creator** (`CreatorDashboard`) | Legacy-Tabellen lesen | ⚠️ Dashboard liest noch Legacy (Read-only) |
| **Impact** | Impact-Votes (kein Commerce) | ✅ unverändert |
| **Support** (`SupportPage`) | Helpdesk-Tickets | ✅ unverändert (kein Commerce) |
| **Empfehlungen** (`FavoritesPage`) | `OPEN_WERK` fehlte | ✅ `A.OPEN_WERK` → `/work/:id` |
| **Action Engine** (`BOOK_EXPERIENCE`) | `setShowBookingFlow` | ✅ `ADD_TO_CART` / Cart |
| **Action Engine** (`SUPPORT_CREATOR`) | — | ✅ neu: Support-Sheet |
| **Deep Link** `/work/:id` | Legacy Buy | ✅ Commerce 2.0 |
| **Deep Link** `/BookingFlow` | Redirect `/Home` | ✅ unverändert |
| **Deep Link** `?hui_order=` | Commerce 2.0 | ✅ unverändert |

---

## Deaktivierte Legacy-Komponenten

| Komponente | Datei | Status |
|------------|-------|--------|
| `WerkKaufFlow` | `src/components/commerce/WerkKaufFlow.jsx` | `LEGACY_COMMERCE_DISABLED = true` — rendert `null` |
| `ExperienceBookingFlow` | `src/components/commerce/ExperienceBookingFlow.jsx` | `LEGACY_COMMERCE_DISABLED = true` |
| `SupportFlow` | `src/components/economy/SupportFlow.jsx` | `LEGACY_COMMERCE_DISABLED = true` |

**Nicht entfernt** (bewusst, Phase 5):

- `src/services/creatorEconomy.js` — `salesService`, `bookingService`, `supportService` (Creator-Dashboard Read)
- `src/lib/bookingContext.js` — Booking Intelligence (separates Produkt, kein Checkout)
- `showWerkCheckout` / `showBookingFlow` State in `HomeShell.jsx` (Legacy-State, nicht mehr gerendert)

---

## Neue / geänderte Commerce-2.0-Dateien

| Datei | Rolle |
|-------|-------|
| `src/components/commerce/commerceUtils.js` | `normalizeCommerceCartItem`, `addItemToCart`, `buildSupportCartItem` |
| `src/components/commerce/CreatorSupportSheet.jsx` | Support-Betragswahl → WerkeKorb |
| `src/core/hui.actions.js` | `ADD_TO_CART`, `OPEN_WERK`, `SUPPORT_CREATOR`; `BOOK_EXPERIENCE` → Cart |
| `supabase/functions/create-payment-intent/index.ts` | `item_type: support` mit serverseitiger Preisvalidierung |

---

## Legacy-Routen

| Route | Verhalten |
|-------|-----------|
| `/BookingFlow` | Redirect → `/Home` (Kompatibilität) |
| `pendingWerkKauf` Router-State | Alias → `pendingCartItem` (Rückwärtskompatibilität) |

---

## Qualitätsprüfung

### Doppelte Commerce-Systeme

| System | Status |
|--------|--------|
| Commerce 2.0 (`commerceEngine.js`, WerkeKorb, UnterstützenFlow) | ✅ Kanonisch |
| Phase 4D (`creatorEconomy.js`) | ⚠️ Nur Dashboard-Reads + deaktivierte Flows |
| `useCheckout.js` / `CheckoutButton.jsx` | ⚠️ Orphan (nie angebunden) |
| `bookingContext.js` | ✅ Separates Booking-Intelligence-System |

### Doppelte Contexts / State

- Cart: `useCartPersistence` in `HomeShell` (einzige Quelle)
- Legacy `showWerkCheckout` / `showBookingFlow`: noch im State, nicht mehr gerendert

### Tote Imports (nicht Phase-2.4-Scope)

- `CheckoutButton.jsx` — nicht importiert
- `CheckoutSuccess.jsx` / `CheckoutCancel.jsx` — nicht in `App.jsx` geroutet

### Events

- `feed-refresh` — unverändert, kein Commerce-Event
- Stripe-Redirect `?hui_order=` — Commerce 2.0 in `UnterstutzenFlow`

---

## Validierung

| Prüfung | Ergebnis |
|---------|----------|
| `npm run build` | ✅ Erfolgreich |
| ESLint (Projekt) | ✅ Keine neuen Commerce-bezogenen Fehler (bestehende Projekt-Warnungen) |
| Legacy-Flows produktiv erreichbar | ✅ Nein — Guards + keine Render-Pfade |
| End-to-End Stripe | ⚠️ Erfordert konfigurierte Stripe/Supabase-Umgebung (`DEPLOY.md`) |

### Manuelle E2E-Checkliste

1. **Werk:** Feed → Korb → Unterstützen → Stripe → Danke → Meine Resonanz  
2. **Werk:** `/work/:id` → Jetzt kaufen → WerkeKorb → Checkout  
3. **Erlebnis:** Discover → Buchen → WerkeKorb → Checkout  
4. **Erlebnis:** Profil → Buchen → WerkeKorb → Checkout  
5. **Support:** Profil → Unterstützen → Betrag → WerkeKorb → Checkout  

---

## Verbleibende technische Schulden

1. **CreatorDashboard** liest noch `work_sales`, `experience_bookings`, `creator_supports` — Migration auf `orders`/`order_items` in Phase 5
2. **Legacy-State** `showWerkCheckout` / `showBookingFlow` in HomeShell entfernen nach Phase-5-Validierung
3. **Legacy-Dateien** `WerkKaufFlow`, `ExperienceBookingFlow`, `SupportFlow` physisch löschen nach Phase 5
4. **Orphan Checkout** (`useCheckout.js`, `CheckoutButton`) evaluieren und entfernen
5. **ContentDetailPage** existiert nicht — Werk-Detail ist `WorkDetailPage` (`/work/:id`)
6. **ExperiencesSection** auf Profil hat keinen per-Card-Buchen-Button (nur Hero-CTA mit erstem Erlebnis)

---

## Finale Commerce-Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                          │
│  Feed · Discover · WorkDetail · Profile · Favorites     │
│  Action Engine (BOOK_EXPERIENCE, ADD_TO_CART, …)        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              commerceUtils.js (SSOT)                     │
│  normalizeCommerceCartItem · addItemToCart               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  WerkeKorb.jsx + useCartPersistence                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  UnterstutzenFlow.jsx + StripePaymentStep.jsx            │
│  commerceEngine.js (buildOrderPayload, shipping rules)   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Edge Functions                                          │
│  create-payment-intent · handle-payment-webhook            │
│  check-order-status                                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase: orders · order_items · commerce_price_authority│
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  MeineResonanz.jsx (Käufer-Historie)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Definition of Done

- [x] Genau ein offizielles Commerce-System (Commerce 2.0)
- [x] Werke verwenden ausschließlich Commerce 2.0
- [x] Erlebnisse verwenden ausschließlich Commerce 2.0
- [x] Unterstützungen verwenden Commerce 2.0 (CreatorSupportSheet → Cart → Stripe)
- [x] Keine produktiv erreichbaren Legacy-Flows
- [x] Keine parallelen Checkout-Overlays in Home.jsx
- [x] Build erfolgreich
- [x] Dokumentation vollständig
- [ ] Vollständige Stripe-E2E in Produktionsumgebung (abhängig von Deploy-Konfiguration)
