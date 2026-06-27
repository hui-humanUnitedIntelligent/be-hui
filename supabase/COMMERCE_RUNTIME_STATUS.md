# Commerce Edge Functions — Runtime Status

**Commerce 2.0 Architecture Freeze** — Stand: 2026-06-27

---

## Kanonische Edge Functions

| Function | Zweck | Schema |
|---|---|---|
| `create-payment-intent` | Checkout-Einstieg, PI erstellen | `customer_id`, `state`, `commission_eur`, `seller_id` |
| `handle-payment-webhook` | Stripe Webhook → `state=paid` | `customer_id`, `state`, `seller_id` |
| `check-order-status` | Post-Redirect Status-Poll | `buyer_order_status` View (kanonisch + Aliase) |
| `release-payout` | Creator-Auszahlung | `seller_id`, `creator_wallets`, `creator_payouts` |
| `distribute-impact-round` | Monatliche Impact-Verteilung | `impact_rounds.status` |

## Legacy Edge Functions (nicht Commerce-Checkout)

| Function | Status |
|---|---|
| `release-escrow` | LEGACY — bookings/escrow Flow |
| `cast-impact-vote` | LEGACY — Impact-Subsystem (manuell deployen) |

---

## Verifikationskriterien

| HTTP-Status | Bedeutung |
|---|---|
| **401** oder **400** | Erfolg — Runtime gestartet, Handler erreicht |
| **404** | Fehler — Function nicht deployed |
| **503** | Fehler — Function bootet nicht (`LOAD_FUNCTION_ERROR`) |

---

## Checkout-Flow (Runtime-Abhängigkeiten)

```
UnterstuetzenFlow
  → create-payment-intent  (benötigt: commerce_price_authority, orders, order_items)
  → Stripe Payment Element
  → handle-payment-webhook   (benötigt: webhook_events, impact_rounds, notifications)
  → check-order-status       (benötigt: buyer_order_status View)
  → release-payout           (benötigt: creator_wallets, increment_wallet_balance RPC)
```

**Voraussetzung:** Migration `057` muss ausgeführt sein.

---

## Manuelle Verifikation

```bash
BASE="https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1"
for fn in create-payment-intent handle-payment-webhook check-order-status release-payout; do
  echo "=== $fn ==="
  curl -s -w "\nHTTP %{http_code}\n" "$BASE/$fn" -X POST -H "Content-Type: application/json" -d '{}'
done
```

Erwartung nach Deploy: **401** (Auth) oder **400** (Validation) — kein 503/404.

---

## Schema-Kompatibilität (057)

| Function | Kanonische Felder | Legacy-Felder |
|---|---|---|
| `create-payment-intent` | ✅ customer_id, state, commission_eur, seller_id | — |
| `handle-payment-webhook` | ✅ customer_id, state, seller_id | — |
| `check-order-status` | ✅ via buyer_order_status | status-Alias in Response (temporär) |
| `release-payout` | ✅ seller_id | creator_id nur als Request-Param-Name |
| `distribute-impact-round` | ✅ impact_rounds | — |

---

## Deploy

Siehe `DEPLOY.md` Schritt 2. GitHub Workflow deployt automatisch die 4 Commerce-Functions bei Push auf `main`.
