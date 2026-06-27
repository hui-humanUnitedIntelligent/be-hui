# HUI Commerce 2.0 — Final Validation Report

**Datum:** 2026-06-27  
**Branch:** `cursor/commerce-2-canonical-refactor-b4e7`  
**Architecture Freeze:** Aktiv

---

## 1. Datenbank

### Tabellen (057)

| Tabelle | Kanonische Felder | Status |
|---|---|---|
| `orders` | `customer_id`, `state`, `commission_eur`, `stripe_payment_intent`, `cart_hash` | ✅ in 057 |
| `order_items` | `seller_id`, `snapshot`, `payout_status`, `fulfillment_status` | ✅ in 057 |
| `creator_wallets` | `balance`, `pending_balance`, `total_earned`, Stripe Connect, `currency`, `payout_email`, `payout_iban` | ✅ vereinigt |
| `creator_payouts` | `creator_id`, `gross_eur`, `net_eur`, `status` | ✅ in 057 |
| `shipments` | `order_id`, `order_item_id`, `creator_id` | ✅ in 057 |
| `commerce_events` | Audit-Log | ✅ in 057 |
| `webhook_events` | Stripe-Idempotenz | ✅ in 057 |
| `impact_rounds` | Impact-Pool | ✅ in 057 |
| `notifications` | Webhook-Benachrichtigungen | ✅ in 057 |

### Views

| View | Zweck | Status |
|---|---|---|
| `commerce_price_authority` | Server-Preisvalidierung (works/experiences) | ✅ kanonisch |
| `buyer_order_status` | Legacy-Kompatibilität (`buyer_id`/`status` Aliase) | ✅ temporär |

### Trigger

| Trigger | Tabelle | Status |
|---|---|---|
| `trg_orders_updated_at` | `orders` | ✅ |
| `trg_order_items_updated_at` | `order_items` | ✅ |
| `trg_creator_fulfillment_only` | `order_items` | ✅ Payout-Schutz |
| `trg_wallet_balance_guard` | `creator_wallets` | ✅ Balance-Schutz |
| `trg_sale_payment_guard` | `work_sales` | ✅ (wenn Tabelle existiert) |

### Policies (RLS)

| Tabelle | Policies | Status |
|---|---|---|
| `orders` | `orders_select_customer`, `orders_insert_customer`, `orders_update_customer`, `orders_service_all` | ✅ `customer_id` |
| `order_items` | `order_items_buyer_select`, `order_items_seller_select`, `order_items_service_all` | ✅ |
| `creator_wallets` | `wallets_owner_select`, `wallets_service_all` | ✅ kein Owner-Write |
| `creator_payouts` | `payouts_creator_select`, `payouts_service_all` | ✅ |

### RPCs

| Funktion | Zweck | Status |
|---|---|---|
| `increment_wallet_balance(p_user_id, p_amount)` | Wallet-Gutschrift | ✅ service_role only |
| `update_updated_at()` | Timestamp-Trigger | ✅ |

### Indizes (kritisch)

- `idx_orders_customer_id`, `idx_orders_state`, `idx_orders_stripe_pi`
- `idx_orders_cart_hash_v2`, `idx_orders_cust_pending` (WHERE `state='pending'`)
- `idx_order_items_seller`, `idx_order_items_payout`

### Legacy-Datenmigration (057)

- `buyer_id` → `customer_id` (wenn beide Spalten existieren)
- `status` → `state`
- `platform_fee_eur` → `commission_eur`
- `creator_id` → `seller_id` (order_items)

---

## 2. Edge Functions

| Function | Schema-kompatibel | Compile | Runtime |
|---|---|---|---|
| `create-payment-intent` | ✅ `customer_id`, `state`, `commission_eur`, `seller_id` | ⚠️ Deno nicht lokal | Nach Deploy: 401 erwartet |
| `handle-payment-webhook` | ✅ `customer_id`, `state`, `seller_id` | ⚠️ Deno nicht lokal | Nach Deploy: 400 erwartet |
| `check-order-status` | ✅ `buyer_order_status` View | ⚠️ Deno nicht lokal | Nach Deploy: 401 erwartet |
| `release-payout` | ✅ `seller_id` Filter | ⚠️ Deno nicht lokal | Nach Deploy: 401 erwartet |
| `distribute-impact-round` | ✅ Impact-Subsystem | ⚠️ Deno nicht lokal | Manuell deployen |

### Legacy Edge Functions (markiert, nicht gelöscht)

- `release-escrow` — bookings/escrow Flow
- `cast-impact-vote` — Impact-Subsystem

### Behobene Bugs

1. `check-order-status`: nutzte `buyer_id`/`status`/`creator_id` → jetzt `buyer_order_status` View
2. `handle-payment-webhook`: Creator-Notifications lasen `creator_id` statt `seller_id` → behoben
3. `create-payment-intent`: Snapshot nutzt `commission_eur`/`seller_id` statt Legacy-Namen

---

## 3. Frontend

### Kanonisch (aktiv)

| Komponente/Service | Pfad |
|---|---|
| WerkeKorb | `src/components/commerce/WerkeKorb.jsx` |
| UnterstuetzenFlow | `src/components/commerce/UnterstuetzenFlow.jsx` |
| StripePaymentStep | `src/components/commerce/StripePaymentStep.jsx` |
| commerceEngine | `src/services/commerceEngine.js` |
| useCartPersistence | `src/hooks/useCartPersistence.js` |
| CreatorDashboard | `src/pages/CreatorDashboard.jsx` |

### Legacy (markiert, noch vorhanden)

| Datei | Noch verdrahtet in |
|---|---|
| `WerkKaufFlow.jsx` | `Home.jsx` |
| `ExperienceBookingFlow.jsx` | `Home.jsx` |
| `SupportFlow.jsx` | `wirker-profile/index.jsx` |
| `creatorEconomy.js` | Legacy-Flows + CreatorDashboard |
| `MyCreatorDashboard.jsx` | Nicht importiert (tot) |

### Build-Validierung

```
npm run build → ✅ erfolgreich (5.62s)
```

### commerceEngine.js

- Queries nutzen `state`, `commission_eur`, `seller_id`
- `buildOrderPayload` nutzt kanonische Feldnamen
- Preisberechnung delegiert an `commerceUtils.js` + serverseitige Validierung in Edge Function

---

## 4. Deployment — Erforderliche Schritte

1. **Migration 057** in Supabase SQL Editor ausführen (`hui_057_commerce_schema_final.sql`)
2. **Verifikations-Query** am Dateiende — alle ✅
3. **Edge Functions deployen** (4 Commerce + optional `distribute-impact-round`)
4. **Stripe Secrets** setzen (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
5. **Stripe Webhook** registrieren → `handle-payment-webhook`
6. **Vercel Env-Vars** prüfen + Redeploy
7. **E2E-Test:** `node e2e-test.js`

**Kein Deploy während unfertiger Schritte** — erst DB, dann Functions, dann Frontend.

---

## 5. Cleanup (nach Verifikation)

Vollständige Liste: `docs/COMMERCE_CLEANUP_LIST.md`

### Sofort entfernbar (nach E2E + Produktions-Verifikation)

- 13 Legacy-Migrationsdateien (051–055, Bundle, CLI 052–054)
- 5 Legacy-Frontend-Dateien + Wiring in Home.jsx/wirker-profile
- 2 Legacy-Edge-Functions (`release-escrow`, optional `cast-impact-vote`)
- View `buyer_order_status` (wenn alle Clients auf `state`/`customer_id` migriert)

### Behalten

- `hui_056_commerce_schema_aligned.sql` (Entwicklungsreferenz)
- `hui_057_commerce_schema_final.sql` (kanonisch)

---

## Commit-Protokoll

| Commit | Änderung | Risiko | Tests |
|---|---|---|---|
| 1 | Migration 057 + Legacy-Markierung 051–055 | Niedrig (nur SQL-Dateien) | SQL-Syntax Review |
| 2 | Edge Functions + commerceEngine kanonisch | Mittel (Runtime-Änderung) | Code-Review, Build |
| 3 | Dokumentation + create-payment-intent Snapshot | Niedrig | `npm run build` ✅ |

**Nächster sicherer Schritt:** Migration 057 auf Staging/Produktion ausführen, dann Edge Functions redeployen.
