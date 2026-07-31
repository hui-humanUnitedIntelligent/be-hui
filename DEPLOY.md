# HUI Commerce — Go-Live Checkliste

**Supabase Projekt:** `gxztrhvhcxhmunhhkfjd`
**URL:** `https://gxztrhvhcxhmunhhkfjd.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd

---

## Infrastruktur-Status

| Komponente | Status |
|---|---|
| Supabase REST API | ✅ erreichbar |
| `orders` | ⚠️ Schema unvollständig → Schritt 1 |
| `order_items` | ⚠️ Schema unvollständig → Schritt 1 |
| `commerce_events` | ❌ fehlt → Schritt 1 |
| `webhook_events` | ❌ fehlt → Schritt 1 |
| `creator_wallets` | ❌ fehlt → Schritt 1 |
| `creator_payouts` | ❌ fehlt → Schritt 1 |
| `shipments` | ❌ fehlt → Schritt 1 |
| `commerce_price_authority` | ❌ fehlt → Schritt 1 |
| Edge Functions | ❌ nie deployed → Schritt 2 |
| Stripe Webhook | ❌ 0 Endpunkte → Schritt 3 |
| Vercel Env-Vars | ❓ prüfen → Schritt 4 |

---

## Schritt 1 — SQL ausführen (Supabase SQL Editor)

Öffne: https://supabase.com/dashboard/project/gxztrhvhcxhmunhhkfjd/sql

Führe **in dieser Reihenfolge** aus:

### 1a — Migration 051 (Commerce Foundation — Basis-Schema)
Datei im Repo: `hui_051_commerce_foundation.sql`
→ Erstellt `orders`, `order_items` mit vollständigem Commerce-Schema

### 1b — Migration 052 (P0 Security)
Datei im Repo: `hui_052_commerce_p0_security.sql`
→ `commerce_price_authority` View, RLS-Policies, Wallet-Guard

### 1c — Migration 053 (Session Idempotenz)
Datei im Repo: `hui_053_cart_hash_aborted.sql`
→ `cart_hash` Spalte, `aborted` Status, `buyer_order_status` View

### 1d — Migration 057 (Schema Final — KANONISCH) ← WICHTIGSTE
Datei im Repo: `hui_057_commerce_schema_final.sql`
→ Vollständige Commerce-2.0-Produktionsmigration (ersetzt 051–056)

**Prüfung nach SQL-Ausführung:**
```sql
-- Alle 8 Zeilen müssen erscheinen:
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
-- View muss Daten liefern:
SELECT item_type, COUNT(*) FROM commerce_price_authority GROUP BY item_type;
```

```sql
-- orders muss diese Spalten haben:
SELECT buyer_id, status, stripe_payment_intent, cart_hash
FROM orders LIMIT 0;
```

---

## Schritt 2 — Edge Functions deployen

**Voraussetzung:** Node.js installiert, Repo geclont.

```bash
# Supabase Access Token erstellen:
# https://supabase.com/dashboard/account/tokens → "New Token"

export SUPABASE_ACCESS_TOKEN=sbp_XXXXXXXXXXXXXXXXXX

# Im Repo-Verzeichnis:
npx supabase functions deploy create-payment-intent \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy handle-payment-webhook \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy check-order-status \
  --project-ref gxztrhvhcxhmunhhkfjd

npx supabase functions deploy release-payout \
  --project-ref gxztrhvhcxhmunhhkfjd
```

### Secrets setzen (nur 2 manuelle):
```bash
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sind AUTOMATISCH verfügbar

npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_51TlUr7QygHtJtH5i... \
  --project-ref gxztrhvhcxhmunhhkfjd

# STRIPE_WEBHOOK_SECRET erst nach Schritt 3:
npx supabase secrets set \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref gxztrhvhcxhmunhhkfjd
```

**Prüfung:**
```bash
curl -s https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer DEIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"orderItems":[{"item_id":"TEST","item_type":"work","quantity":1}]}'
# Erwartung: {"error":"..."} oder {"clientSecret":"..."} — kein 404
```

---

## Schritt 3 — Stripe Webhook registrieren

Öffne: https://dashboard.stripe.com/test/webhooks

→ **"Add endpoint"**

| Feld | Wert |
|---|---|
| Endpoint URL | `https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook` |
| Events | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created` |

→ Nach dem Speichern: **Signing Secret** kopieren (`whsec_...`)
→ Dann Schritt 2 fortsetzen: `STRIPE_WEBHOOK_SECRET` setzen

---

## Schritt 4 — Vercel Environment Variables prüfen

Öffne: https://vercel.com → HUI Projekt → Settings → Environment Variables

**Pflicht-Vars:**
```
VITE_SUPABASE_URL=https://gxztrhvhcxhmunhhkfjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk
VITE_STRIPE_PUBLIC_KEY=pk_test_51TlUr7QygHtJtH5i...
```

**Wichtig:** Keine Leerzeichen, keine Zeilenumbrüche am Ende der Werte.

Nach Änderung: **Redeploy** auslösen (Vercel Dashboard → Deployments → "Redeploy").

---

## Schritt 5 — E2E Test

```bash
# .env.test erstellen (niemals committen):
cat > .env.test << 'EOF'
SUPABASE_URL=https://gxztrhvhcxhmunhhkfjd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_51TlUr7...
TEST_USER_EMAIL=dein-test@beispiel.de
TEST_USER_PASS=dein-passwort
TEST_WORK_ID=UUID-eines-published-werks-aus-der-DB
EOF

# Test ausführen:
set -a && source .env.test && set +a
node e2e-test.js
```

**Erwartete Ausgabe:**
```
1. Authentifizierung...
   ✅ Eingeloggt als: test@beispiel.de
2. Payment Intent erstellen...
   ✅ Payment Intent erstellt: pi_...
   ✅ Order ID: ...
   ✅ clientSecret vorhanden: JA
3. Stripe Testzahlung...
   ✅ Stripe Status: succeeded
4. Warte auf Webhook (5 Sekunden)...
5. Order-Status prüfen...
   ✅ Order = paid ✓
══════════════════════════════════════════════
 ✅ E2E TEST ERFOLGREICH
══════════════════════════════════════════════
```

---

## E2E-Flow: Was wann geprüft wird

| Schritt | Was passiert | Erfolgskriterium |
|---|---|---|
| Auth | Supabase JWT holen | `access_token` vorhanden |
| PI erstellen | Edge Function aufrufen | HTTP 200, `clientSecret` |
| Stripe Zahlung | `pm_card_visa` bestätigen | `status: succeeded` |
| Webhook | Stripe → Supabase | Order → `paid` |
| Notifications | Buyer + Creator | In `notifications` Tabelle |
| Impact | 7% in `impact_rounds` | `pool_eur` erhöht |
| Creator Order | In `order_items` | `fulfillment_status: new` |

---

## Fehlerdiagnose

| Fehlschlag bei | Ursache | Lösung |
|---|---|---|
| `create-payment-intent: 404` | Edge Function nicht deployed | Schritt 2 wiederholen |
| `create-payment-intent: 500` | `STRIPE_SECRET_KEY` fehlt | Secret setzen |
| `create-payment-intent: 422` | Werk nicht published / kein Preis | Werk status prüfen |
| `Stripe: succeeded` aber Order `pending` | Webhook nicht registriert | Schritt 3 |
| `Stripe: succeeded` aber `failed` | `STRIPE_WEBHOOK_SECRET` falsch | Secret neu setzen |
| `clientSecret` leer im Browser | `VITE_STRIPE_PUBLIC_KEY` fehlt | Vercel Env + Redeploy |
| Stripe Element lädt nicht | `VITE_SUPABASE_URL` hat Leerzeichen | Vercel Env bereinigen |
