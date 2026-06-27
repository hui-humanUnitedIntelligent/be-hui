# HUI Commerce 2.0 — Go-Live Checkliste

**Architecture Freeze:** Ab diesem Stand existiert genau eine Commerce-Architektur.

**Supabase Projekt:** `gxztrhvhcxhmunhhkfjd`  
**URL:** `https://gxztrhvhcxhmunhhkfjd.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd

---

## Kanonische Architektur

| Bereich | Kanonisch |
|---|---|
| **Orders** | `customer_id`, `state`, `commission_eur`, `seller_id`, `order_items`, `creator_wallets`, `creator_payouts` |
| **Checkout** | Feed → WerkeKorb → UnterstuetzenFlow → `create-payment-intent` → Stripe → `handle-payment-webhook` → `state=paid` → Impact → `release-payout` |
| **Migration** | `hui_057_commerce_schema_final.sql` (einzige Produktionsmigration) |
| **Edge Functions** | `create-payment-intent`, `handle-payment-webhook`, `check-order-status`, `release-payout`, `distribute-impact-round` |
| **Frontend** | `WerkeKorb`, `UnterstuetzenFlow`, `StripePaymentStep`, `commerceEngine.js`, `useCartPersistence`, `CreatorDashboard` |
| **Views** | `commerce_price_authority`, `buyer_order_status` (Legacy-Aliase, temporär) |
| **Wallet** | `creator_wallets` (einziges Wallet — Commerce + Phase4D vereinigt) |

**Legacy (nicht neu verwenden):** `buyer_id`, `status`, `creator_id` (Commerce), `platform_fee_eur`, Migrationen 051–055

---

## Infrastruktur-Status

| Komponente | Status |
|---|---|
| Supabase REST API | ✅ erreichbar |
| Commerce Schema | ⚠️ Migration 057 ausführen → Schritt 1 |
| Edge Functions | ⚠️ deployen → Schritt 2 |
| Stripe Webhook | ⚠️ registrieren → Schritt 3 |
| Vercel Env-Vars | ❓ prüfen → Schritt 4 |

---

## Schritt 1 — SQL ausführen (Supabase SQL Editor)

Öffne: https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd/sql

### Migration 057 — Commerce 2.0 Schema Final (KANONISCH)

Datei im Repo: **`hui_057_commerce_schema_final.sql`**

Alternativ (Supabase CLI): `supabase/migrations/20260627_057_commerce_schema_final.sql`

Diese Migration:
- Erweitert bestehende `orders`/`order_items` (kein Greenfield-CREATE)
- Migriert Legacy-Daten (`buyer_id`→`customer_id`, `status`→`state`, etc.)
- Vereinigt `creator_wallets` (Stripe Connect + `payout_email`/`payout_iban`/`currency`)
- Erstellt Views, Trigger, RLS, RPCs
- Ist vollständig idempotent

> **Hinweis:** Migrationen 051–055 sind Legacy. `056` bleibt als Entwicklungsstand. **Produktion = 057.**

**Prüfung nach SQL-Ausführung:**

```sql
-- Alle Tabellen vorhanden:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orders','order_items','commerce_events',
    'webhook_events','creator_wallets','creator_payouts',
    'shipments','impact_rounds'
  )
ORDER BY tablename;
```

```sql
-- Kanonische Spalten auf orders:
SELECT customer_id, state, commission_eur, stripe_payment_intent, cart_hash
FROM orders LIMIT 0;
```

```sql
-- Views funktionieren:
SELECT item_type, COUNT(*) FROM commerce_price_authority GROUP BY item_type;
```

```sql
-- Verifikations-Query aus 057 (am Dateiende) ausführen — alle ✅
```

---

## Schritt 2 — Edge Functions deployen

```bash
export SUPABASE_ACCESS_TOKEN=sbp_XXXXXXXXXXXXXXXXXX

npx supabase functions deploy create-payment-intent \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy handle-payment-webhook \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy check-order-status \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy release-payout \
  --project-ref gxztrhvhcxhmunhhkfjd

# Optional (Impact-Subsystem):
npx supabase functions deploy distribute-impact-round \
  --project-ref gxztrhvhcxhmunhhkfjd
```

### Secrets setzen

```bash
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase secrets set \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref gxztrhvhcxhmunhhkfjd
```

**Prüfung (401/400 = Runtime OK):**

```bash
BASE="https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1"
for fn in create-payment-intent handle-payment-webhook check-order-status release-payout; do
  echo "=== $fn ==="
  curl -s -w "\nHTTP %{http_code}\n" "$BASE/$fn" -X POST -H "Content-Type: application/json" -d '{}'
done
```

---

## Schritt 3 — Stripe Webhook registrieren

https://dashboard.stripe.com/test/webhooks → **Add endpoint**

| Feld | Wert |
|---|---|
| Endpoint URL | `https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook` |
| Events | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created` |

---

## Schritt 4 — Vercel Environment Variables

```
VITE_SUPABASE_URL=https://gxztrhvhcxhmunhhkfjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

Nach Änderung: Redeploy auslösen.

---

## Schritt 5 — E2E Test

```bash
set -a && source .env.test && set +a
node e2e-test.js
```

**Erwartung:** Auth → PI → Stripe succeeded → Webhook → `state=paid` → E2E erfolgreich

---

## Checkout-Flow (einziger gültiger Pfad)

```
Feed
  ↓
WerkeKorb
  ↓
UnterstuetzenFlow
  ↓
create-payment-intent
  ↓
Stripe Payment Element
  ↓
handle-payment-webhook
  ↓
orders.state = paid
  ↓
Creator Notification
  ↓
Impact (impact_rounds.pool_eur)
  ↓
release-payout
  ↓
creator_wallets
```

---

## Fehlerdiagnose

| Fehlschlag | Ursache | Lösung |
|---|---|---|
| `create-payment-intent: 404` | Function nicht deployed | Schritt 2 |
| `create-payment-intent: 500` | `STRIPE_SECRET_KEY` fehlt | Secret setzen |
| `create-payment-intent: 422` | Werk nicht published | `commerce_price_authority` prüfen |
| Order bleibt `pending` | Webhook fehlt | Schritt 3 |
| `check-order-status: 404` | Migration 057 nicht ausgeführt | Schritt 1 |
| `column buyer_id does not exist` | Legacy-Migration statt 057 | Nur 057 ausführen |

---

## Weitere Dokumentation

- `supabase/MIGRATIONS_OVERVIEW.md` — Migrationshistorie
- `supabase/COMMERCE_RUNTIME_STATUS.md` — Edge Function Runtime
- `docs/COMMERCE_CLEANUP_LIST.md` — Dateien für Phase 5 Entfernung
