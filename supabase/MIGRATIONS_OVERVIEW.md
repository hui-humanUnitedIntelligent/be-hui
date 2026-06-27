# HUI Commerce — Migrationsübersicht

**Stand:** Commerce 2.0 Architecture Freeze (2026-06-27)

---

## Kanonische Migration (Produktion)

| Nr. | Datei | Status |
|---|---|---|
| **057** | `hui_057_commerce_schema_final.sql` | **KANONISCH — Produktion** |
| | `supabase/migrations/20260627_057_commerce_schema_final.sql` | Supabase CLI Track |

Migration 057 ersetzt logisch 051–056. Sie ist vollständig idempotent und arbeitet ausschließlich mit `ALTER TABLE IF NOT EXISTS` auf bestehenden Tabellen.

### Was 057 enthält

- **Orders:** `customer_id`, `state`, `commission_eur` + Stripe-Felder (`stripe_payment_intent`, `cart_hash`, …)
- **Order Items:** `seller_id`, `snapshot`, `payout_status`, `fulfillment_status`, …
- **Wallet:** Einziges `creator_wallets` (Stripe Connect + Phase4D `currency`/`payout_email`/`payout_iban`)
- **Views:** `commerce_price_authority`, `buyer_order_status` (Legacy-Aliase)
- **RPC:** `increment_wallet_balance`
- **Trigger:** `enforce_wallet_immutable_balance`, `enforce_creator_fulfillment_only`
- **Legacy-Datenmigration:** `buyer_id`→`customer_id`, `status`→`state`, `platform_fee_eur`→`commission_eur`, `creator_id`→`seller_id`

---

## Entwicklungsstand

| Nr. | Datei | Status |
|---|---|---|
| 056 | `hui_056_commerce_schema_aligned.sql` | Entwicklungsstand — nicht für Produktion |

---

## Legacy (nicht für neue Deployments)

| Nr. | Datei | Status |
|---|---|---|
| 051 | `hui_051_commerce_foundation.sql` | LEGACY — REMOVE AFTER PHASE 5 |
| 052 | `hui_052_commerce_p0_security.sql` | LEGACY |
| 053 | `hui_053_cart_hash_aborted.sql` | LEGACY |
| 054 | `hui_054_infrastructure_sync.sql` | LEGACY |
| 055 | `hui_055_commerce_production_final.sql` | LEGACY |
| 055 | `hui_055_commerce_complete.sql` | LEGACY (Variante) |
| — | `HUI_COMMERCE_COMPLETE_MIGRATION.sql` | LEGACY (051+052+053+054 Bundle) |
| — | `supabase/migrations/20260627_052_*.sql` | LEGACY |
| — | `supabase/migrations/20260627_053_*.sql` | LEGACY |
| — | `supabase/migrations/20260627_054_*.sql` | LEGACY |
| — | `supabase/phase4d_creator_economy.sql` | LEGACY (Wallet in 057 vereinigt) |

---

## Ausführungsreihenfolge

### Produktion (bestehende DB mit `customer_id`/`state`)

```
hui_057_commerce_schema_final.sql   ← einziger Schritt
```

### Greenfield (keine Commerce-Tabellen)

057 erstellt unterstützende Tabellen (`shipments`, `creator_wallets`, …) via `CREATE TABLE IF NOT EXISTS`, erweitert aber **nicht** `orders` neu an — setzt voraus, dass `orders`/`order_items` aus `026_production_schema` existieren.

---

## Verifikation nach 057

Am Ende von `hui_057_commerce_schema_final.sql` steht eine Verifikations-Query. Alle Einträge müssen `✅ vorhanden` zeigen.

Kritische Spalten:
- `orders.customer_id`, `orders.state`, `orders.commission_eur`
- `order_items.seller_id`, `order_items.payout_status`
- `creator_wallets.currency`, `creator_wallets.payout_iban`
