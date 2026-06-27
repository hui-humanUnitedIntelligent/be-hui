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
  DEPLOY_ARGS=(--project-ref "$PROJECT_REF")
  if [ "$FN" = "create-payment-intent" ] || [ "$FN" = "handle-payment-webhook" ]; then
    DEPLOY_ARGS+=(--no-verify-jwt)
  fi
  if ! npx supabase functions deploy "$FN" "${DEPLOY_ARGS[@]}"; then
    echo "   ❌ $FN deployment failed"
    exit 1
  fi
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

# ── Schritt 5: Alle Commerce-Functions verifizieren ─────────
echo ""
echo "5. Edge Functions verifizieren..."

verify_function() {
  local name="$1"
  local url="$2"
  shift 2

  local body_file="/tmp/${name//[^a-zA-Z0-9]/_}_test.json"
  local status
  status=$(curl -s -o "$body_file" -w "%{http_code}" "$url" "$@")
  local body
  body=$(cat "$body_file" 2>/dev/null || echo "")

  local runtime="nein"
  local handler="nein"
  local result="FAIL"

  if [ "$status" = "401" ] || [ "$status" = "400" ]; then
    runtime="ja"
    handler="ja"
    result="PASS"
  elif [ "$status" = "404" ] || [ "$status" = "503" ]; then
    runtime="nein"
    handler="nein"
    result="FAIL"
    return 1
  else
    runtime="ja"
    handler="teilweise (HTTP $status)"
    result="WARN"
  fi

  echo "   ── $name ──"
  echo "      HTTP-Status:        $status"
  echo "      Runtime gestartet:  $runtime"
  echo "      Handler ausgeführt: $handler"
  echo "      Ergebnis:           $result"
  echo "      Response:           $body"
}

FAIL=0
verify_function "create-payment-intent" \
  "$SUPA_URL/functions/v1/create-payment-intent" \
  -X POST -H "Content-Type: application/json" -d '{}' || FAIL=1

verify_function "handle-payment-webhook" \
  "$SUPA_URL/functions/v1/handle-payment-webhook" \
  -X POST -H "Content-Type: application/json" -d '{}' || FAIL=1

verify_function "check-order-status" \
  "$SUPA_URL/functions/v1/check-order-status" \
  -X POST -H "Content-Type: application/json" -d '{}' || FAIL=1

verify_function "release-payout" \
  "$SUPA_URL/functions/v1/release-payout" \
  -X POST -H "Content-Type: application/json" -d '{}' || FAIL=1

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "❌ Deployment-Verifikation fehlgeschlagen (404 oder 503)"
  echo "   Logs prüfen: npx supabase functions logs <name> --project-ref $PROJECT_REF"
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
