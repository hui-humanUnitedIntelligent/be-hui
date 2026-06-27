# HUI Commerce — Deployment Checklist

## Infrastruktur-Status (Stand: 2026-06-27)

| Komponente | Status | Aktion |
|---|---|---|
| Supabase Project | ✅ gxztrhvhcxhmunhhkfjd | aktiv |
| orders Tabelle | ⚠️ Stub-Schema | Migration 054 ausführen |
| order_items Tabelle | ⚠️ Stub-Schema | Migration 054 ausführen |
| commerce_events | ❌ fehlt | Migration 054 ausführen |
| webhook_events | ❌ fehlt | Migration 054 ausführen |
| creator_wallets | ❌ fehlt | Migration 054 ausführen |
| creator_payouts | ❌ fehlt | Migration 054 ausführen |
| shipments | ❌ fehlt | Migration 054 ausführen |
| commerce_price_authority View | ❌ fehlt | Migration 054 ausführen |
| Edge Functions | ❌ nie deployed | Schritt 3 |
| Stripe Webhook-Endpunkt | ❌ 0 konfiguriert | Schritt 4 |
| VITE_STRIPE_PUBLIC_KEY in Vercel | ❓ unbekannt | Schritt 5 prüfen |

---

## Schritt 1 — Supabase SQL Editor

Öffne: https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd/sql

Führe der Reihe nach aus:

### 1a. Migration 051 (Commerce Foundation)
→ Datei: `hui_051_commerce_foundation.sql`

### 1b. Migration 052 (P0 Security)
→ Datei: `hui_052_commerce_p0_security.sql`

### 1c. Migration 053 (Cart Hash + Aborted Status)
→ Datei: `hui_053_cart_hash_aborted.sql`

### 1d. Migration 054 (Infrastructure Sync) ← KRITISCH
→ Datei: `hui_054_infrastructure_sync.sql`
→ Diese Migration ergänzt alle fehlenden Spalten und Tabellen

**Nach Ausführung prüfen:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orders', 'order_items', 'commerce_events',
    'webhook_events', 'creator_wallets', 'creator_payouts',
    'shipments', 'impact_rounds'
  )
ORDER BY tablename;
-- Erwartung: 8 Zeilen
```

```sql
SELECT * FROM commerce_price_authority LIMIT 5;
-- Erwartung: Werke + Erlebnisse mit published/approved Status
```

---

## Schritt 2 — Supabase Access Token

Erstelle unter: https://supabase.com/dashboard/account/tokens

→ "New Token" → Name: "HUI Commerce Deploy" → kopieren

Dann in Terminal:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_XXXXXXXXXXXXXXXXXX
```

---

## Schritt 3 — Edge Functions deployen

```bash
# Im Repo-Verzeichnis (be-hui)
npx supabase functions deploy create-payment-intent \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy handle-payment-webhook \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy check-order-status \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy release-payout \
  --project-ref gxztrhvhcxhmunhhkfjd
```

### Edge Function Secrets setzen:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_51TlUr7... \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref gxztrhvhcxhmunhhkfjd
```

---

## Schritt 4 — Stripe Webhook konfigurieren

Öffne: https://dashboard.stripe.com/test/webhooks

→ "Add endpoint"

**Endpoint URL:**
```
https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook
```

**Events auswählen:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

→ Nach dem Speichern: **Webhook Signing Secret** kopieren
→ Dann als Secret setzen (Schritt 3 → STRIPE_WEBHOOK_SECRET)

---

## Schritt 5 — Vercel Environment Variables

Öffne: https://vercel.com/dashboard → HUI Projekt → Settings → Environment Variables

Prüfen/setzen:
```
VITE_SUPABASE_URL=https://gxztrhvhcxhmunhhkfjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk
VITE_STRIPE_PUBLIC_KEY=pk_test_51TlUr7QygHtJtH5iXXXXXXXXXX
```

⚠️ Auf Leerzeichen/Zeilenumbrüche achten — insbesondere bei VITE_SUPABASE_URL

**Nach Änderung: Redeploy auslösen**

---

## Schritt 6 — E2E-Test

```bash
# create-payment-intent testen
curl -s https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer [USER_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [
      {"item_id": "[WORK_UUID]", "item_type": "work", "quantity": 1}
    ]
  }'
# Erwartung: {"clientSecret": "pi_..._secret_...", "orderId": "..."}
```

---

## Schritt 7 — Validation

Nach erfolgreichem E2E-Test prüfen:
```sql
-- Order in DB
SELECT id, status, buyer_id, total_eur, stripe_payment_intent
FROM orders ORDER BY created_at DESC LIMIT 5;

-- Commerce Events
SELECT event_type, created_at FROM commerce_events
ORDER BY created_at DESC LIMIT 10;

-- Nach Webhook (payment_intent.succeeded)
SELECT id, status FROM orders WHERE status = 'paid' LIMIT 5;
```

---

## Quick-Reference: Supabase Projekt

| Parameter | Wert |
|---|---|
| Project Ref | `gxztrhvhcxhmunhhkfjd` |
| Supabase URL | `https://gxztrhvhcxhmunhhkfjd.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (vollständig in `.agents/.env`) |
| Dashboard | https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd |
| SQL Editor | https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd/sql |
| Edge Functions | https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd/functions |
