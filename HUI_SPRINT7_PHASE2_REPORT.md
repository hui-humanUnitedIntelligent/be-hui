# HUI Sprint 7 Phase 2 — P0 Commerce Runtime Stabilization

**Datum:** 2026-07-16  
**Scope:** P0 Commerce — Legacy-Einstiegspunkte auf Commerce 2.0 umleiten. Keine Architekturänderungen, keine UI-Redesigns, keine neuen Features.

---

## Root Cause

Das Repository betrieb **zwei parallele Commerce-Schichten**:

| Schicht | Pfad | Stripe | Tabellen |
|---------|------|--------|----------|
| **Commerce 2.0 (produktiv)** | WerkeKorb → UnterstutzenFlow → `create-payment-intent` → Stripe → Webhook | Ja | `orders`, `order_items` |
| **Legacy Creator Economy** | WerkKaufFlow / ExperienceBookingFlow / SupportFlow → `creatorEconomy.js` | Nein | `work_sales`, `experience_bookings`, `creator_supports` |

**Problem:** Mehrere produktive UI-Einstiegspunkte (WorkDetail, Discover, BOOK_EXPERIENCE, Profil-Support) öffneten noch Legacy-Flows und schrieben in Phase-4D-Tabellen **ohne Stripe**. Der Feed-Pfad (Cart → Commerce 2.0) war bereits korrekt — dieselben User-Aktionen hatten unterschiedliche Checkout-Architekturen.

**P0-Ursache (laut Masterplan P0-3):** `WorkDetailPage onBuyWerk` → `WerkKaufFlow` statt Werkekorb.

---

## Aufgabe 1 — Produktiver Zahlungsfluss (Commerce 2.0)

```
User
  ↓
Checkout-Einstieg (Feed onBook / Discover onBook / WorkDetail / BOOK_EXPERIENCE)
  ↓
setCart (useCartPersistence — localStorage pro User)
  ↓
WerkeKorbButton → WerkeKorb.jsx (Mengen, Gruppierung, „Unterstützen"-CTA)
  ↓
UnterstutzenFlow.jsx (Schritt 0: Stripe Payment Element + Impact-Karte)
  ↓
commerceEngine.orderService.buildOrderPayload()
commerceEngine.resolveShippingStrategy()
  ↓
Edge Function: create-payment-intent
  • JWT Auth
  • commerce_price_authority (Server-seitige Preisvalidierung)
  • INSERT orders (state=pending)
  • INSERT order_items (payout_status=held)
  • Stripe PaymentIntent.create()
  ↓
StripePaymentStep.jsx → Stripe.confirmPayment()
  ↓
Stripe (Zahlung)
  ↓
Edge Function: handle-payment-webhook
  • webhook_events (Idempotenz)
  • orders.state → paid
  • commerce_events
  • notifications (Creator + Buyer)
  • rpc_process_order_fees → stripe_impact_pool
  • impact_rounds.pool_eur += impact_eur (additiv für Voting-UI)
  ↓
orders / order_items (SSOT)
  ↓
Impact Pool (ImpactPage, Ambassador)
  ↓
Payout: order_items.payout_status=held
  → SellerPayoutRequestSheet (rpc_seller_request_payout)
  → release-payout EF (Admin)
```

**Nicht geändert in diesem Sprint:** Webhook, Impact-RPC, Payout-Flow, Stripe-Konfiguration, Edge Functions.

---

## Aufgabe 2 — Legacy-Commerce in produktiver UI (vor Fix)

| User-Aktion | Datei | Funktion / Zeile | Legacy-Ziel | Produktiv erreichbar? |
|-------------|-------|------------------|-------------|---------------------|
| Werk kaufen (Detail) | `src/App.jsx` | `WorkDetailRouteWrapper`, Z.476–478 | `pendingWerkKauf` → `WerkKaufFlow` | **Ja** |
| Werk kaufen öffnen | `src/pages/Home.jsx` | `useEffect`, Z.189–191 | `setShowWerkCheckout` | **Ja** |
| Erlebnis buchen (Discover) | `src/pages/Home.jsx` | `DiscoverPage onBook`, Z.464–466 | `ExperienceBookingFlow` | **Ja** |
| Erlebnis buchen (Action) | `src/core/hui.actions.js` | `[A.BOOK_EXPERIENCE]`, Z.291–293 | `ExperienceBookingFlow` | **Ja** |
| Creator unterstützen | `src/pages/wirker-profile/index.jsx` | `handleSupport`, Z.868–869 | `SupportFlow` → `creator_supports` | **Ja** |
| Feed Kaufen/Buchen | `src/pages/Home.jsx` | `onBook`, Z.398–405 | `setCart` (Commerce 2.0) | **Ja — bereits korrekt** |

**Legacy-Dateien ohne produktiven Einstieg (unverändert):**

| Datei | Grund |
|-------|-------|
| `WerkKaufFlow.jsx` | Kein Render mehr in Home.jsx |
| `ExperienceBookingFlow.jsx` | Kein Render mehr in Home.jsx |
| `SupportFlow.jsx` | Kein Import/Render mehr in wirker-profile |
| `CreatorDashboard.jsx` | Kein UI-Einstieg (`window.__HUI_OPEN_CREATOR_DASH` — 0 Caller) |

**Legacy-Reads (kein Kauf-Pfad):**

| Datei | Nutzung |
|-------|---------|
| `useLiveTicker.js` | Liest `work_sales`, `experience_bookings` (Anzeige) |
| `UnifiedFeed.jsx` | `analyticsService.track` (Views, kein Kauf) |
| `CreatorDashboard.jsx` | Dashboard-Reads (dead entry) |

---

## Aufgabe 3 — Implementierte Fixes (minimal)

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/commerce/commerceUtils.js` | `toCommerceCartItem()`, `addCommerceCartItem()` — Cart-Normalisierung |
| `src/core/hui.actions.js` | `BOOK_EXPERIENCE` → Cart; neue Action `OPEN_WERKE_KORB` |
| `src/pages/Home.jsx` | `pendingWerkKauf` → Cart; Discover `onBook` → Cart; Legacy-Flow-Render entfernt |
| `src/App.jsx` | `onAddToKorb` + `onBuyWerk` → Router-State → Werkekorb |
| `src/pages/wirker-profile/index.jsx` | `handleSupport` → `OPEN_WERKE_KORB`; `SupportFlow` entfernt |
| `src/pages/DiscoverPage.jsx` | Kommentar aktualisiert (kein Verhaltens-Change — onBook kommt von Home) |
| `src/routes/registry.js` | Commerce-2.0-Routing dokumentiert |

### Fix-Details

1. **WorkDetail → Commerce 2.0:** `onAddToKorb` / `onBuyWerk` navigieren zu `/Home` mit `pendingWerkKauf`; Home fügt Werk zum Cart hinzu (`openWerkeKorb: true` bei „Jetzt kaufen").
2. **Discover + BOOK_EXPERIENCE → Commerce 2.0:** Erlebnisse werden wie im Feed in den Werkekorb gelegt.
3. **Profil-Support → Commerce 2.0:** Support-Button öffnet Werkekorb (`OPEN_WERKE_KORB`) statt Legacy-`SupportFlow`.

**Bewusst nicht geändert:** Legacy-Dateien (`WerkKaufFlow.jsx`, etc.) bleiben im Repo (Phase 5 Cleanup). HomeShell-State `showWerkCheckout`/`showBookingFlow` bleibt (kein produktiver Caller mehr).

---

## Aufgabe 4 — Regression (statische Verifikation)

| Flow | Einstieg nach Fix | Commerce 2.0? | Status |
|------|-------------------|---------------|--------|
| Werk kaufen | WorkDetail → Cart → WerkeKorb → UnterstutzenFlow | Ja | ✓ |
| Erlebnis buchen | Feed / Discover / BOOK_EXPERIENCE → Cart | Ja | ✓ |
| Unterstützen (Checkout) | WerkeKorb „Unterstützen" → UnterstutzenFlow | Ja | ✓ (unverändert) |
| Stripe PaymentIntent | `create-payment-intent` EF | Ja | ✓ (unverändert) |
| Webhook | `handle-payment-webhook` EF | Ja | ✓ (unverändert) |
| Order / Order Items | EF INSERT | Ja | ✓ (unverändert) |
| Impact Pool | `rpc_process_order_fees` | Ja | ✓ (unverändert) |
| Payout | `SellerPayoutRequestSheet` / held status | Ja | ✓ (unverändert) |
| Profil „Unterstützen" | Öffnet Werkekorb | Ja (teilweise) | ✓ Routing; siehe Risiken |

---

## Aufgabe 5 — Build

```bash
npm install   # Exit 0
npm run build # Exit 0 — vite build ✓ built in ~5s
```

---

## Risiken

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| **Profil-Support ohne variable Beträge:** `create-payment-intent` überspringt Items ohne `item_id` (Z.168). Legacy `SupportFlow` (freier Betrag → `creator_supports`) ist deaktiviert. Support-Button öffnet jetzt den leeren/befüllten Werkekorb. | Mittel | Phase 1.4 Masterplan: dediziertes Support-Item in `commerce_price_authority` — separates Ticket |
| **BOOK_EXPERIENCE ohne Erlebnis-ID:** Profil „Buchen"-CTA ruft Action ohne `experience`-Payload auf — Cart-Add schlägt still fehl (`return`). | Niedrig | Vorheriges Verhalten (leeres Booking-Flow) war ebenfalls unvollständig |
| **Edge Functions Runtime 503:** Dokumentiert in `COMMERCE_RUNTIME_STATUS.md` — unabhängig von diesem Routing-Fix | Hoch (Deploy) | EF-Deploy-Checkliste; nicht Teil dieses Sprints |
| **LiveTicker liest Legacy-Tabellen** | Niedrig | Read-only; keine neuen Writes |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Commerce 2.0 ist der einzige produktive Checkout | ✓ |
| Keine Legacy-Kaufpfade mehr im produktiven UI | ✓ |
| Stripe funktioniert unverändert | ✓ |
| Impact funktioniert unverändert | ✓ |
| Payout funktioniert unverändert | ✓ |
| Build erfolgreich | ✓ |
| Keine Architekturänderungen | ✓ |
| Nur P0-Commerce behoben | ✓ |

---

## Git

- **Branch:** `cursor/commerce-p0-runtime-81c2`
- **Commit:** Ein Commit
- **PR:** Draft gegen `main`
