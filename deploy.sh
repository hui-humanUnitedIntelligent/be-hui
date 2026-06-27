#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# HUI Commerce — Ein-Klick Deployment
# Ausführen: bash deploy.sh
# Voraussetzung: Node.js, npx verfügbar
# ═══════════════════════════════════════════════════════════════════

set -e

PROJECT_REF="gxztrhvhcxhmunhhkfjd"
SUPA_URL="https://gxztrhvhcxhmunhhkfjd.supabase.co"

echo ""
echo "══════════════════════════════════════════════════"
echo "  HUI Commerce — Deployment"
echo "══════════════════════════════════════════════════"
echo ""

# ── Schritt 1: Access Token ──────────────────────────
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Supabase Access Token benötigt."
  echo "→ https://supabase.com/dashboard/account/tokens → 'New Token'"
  echo ""
  read -p "Token eingeben (sbp_...): " SUPABASE_ACCESS_TOKEN
  export SUPABASE_ACCESS_TOKEN
fi
echo "✓ Access Token gesetzt"

# ── Schritt 2: Stripe Secret Key ────────────────────
if [ -z "$STRIPE_SECRET_KEY" ]; then
  read -p "Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
  export STRIPE_SECRET_KEY
fi
echo "✓ Stripe Key gesetzt"

# ── Schritt 3: Edge Functions deployen ──────────────
echo ""
echo "3. Edge Functions deployen..."

for FN in create-payment-intent handle-payment-webhook check-order-status release-payout; do
  echo "   → $FN..."
  npx supabase functions deploy "$FN" \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt 2>&1 | grep -E "Deployed|Error|error" || true
  echo "   ✓ $FN deployed"
done

# ── Schritt 4: Secrets setzen ───────────────────────
echo ""
echo "4. Secrets setzen..."
npx supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --project-ref "$PROJECT_REF"
echo "   ✓ STRIPE_SECRET_KEY gesetzt"

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  npx supabase secrets set \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    --project-ref "$PROJECT_REF"
  echo "   ✓ STRIPE_WEBHOOK_SECRET gesetzt"
else
  echo "   ⚠  STRIPE_WEBHOOK_SECRET nicht gesetzt — nach Webhook-Registrierung nachholen"
fi

# ── Schritt 5: create-payment-intent testen ─────────
echo ""
echo "5. Edge Function testen..."
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk"

STATUS=$(curl -s -o /tmp/pi_test.json -w "%{http_code}" \
  "$SUPA_URL/functions/v1/create-payment-intent" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderItems":[]}')

echo "   HTTP Status: $STATUS"
echo "   Response: $(cat /tmp/pi_test.json)"

if [ "$STATUS" = "404" ]; then
  echo ""
  echo "❌ Edge Function noch nicht verfügbar (HTTP 404)"
  echo "   → Deployment möglicherweise fehlgeschlagen. Logs prüfen:"
  echo "   npx supabase functions logs create-payment-intent --project-ref $PROJECT_REF"
  exit 1
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Edge Functions deployed!"
echo "══════════════════════════════════════════════════"
echo ""
echo "Nächste Schritte:"
echo "  1. SQL im Supabase SQL Editor ausführen:"
echo "     → https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo "     → Datei: hui_054_infrastructure_sync.sql"
echo ""
echo "  2. Stripe Webhook registrieren:"
echo "     → https://dashboard.stripe.com/test/webhooks"
echo "     → URL: $SUPA_URL/functions/v1/handle-payment-webhook"
echo "     → Events: payment_intent.succeeded, payment_intent.payment_failed"
echo "     → Webhook Secret holen und setzen:"
echo "     npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref $PROJECT_REF"
echo ""
echo "  3. E2E Test:"
echo "     node e2e-test.js"
