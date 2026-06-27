#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="${WEBHOOK_URL:-https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook}"
PROJECT_REF="${PROJECT_REF:-gxztrhvhcxhmunhhkfjd}"
EVENTS=(
  payment_intent.succeeded
  payment_intent.payment_failed
  charge.dispute.created
)

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "STRIPE_SECRET_KEY fehlt"
  exit 1
fi

output_whsec() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "whsec=$1" >> "$GITHUB_OUTPUT"
  fi
}

deploy_webhook_handler() {
  supabase secrets set STRIPE_WEBHOOK_SECRET="$1" --project-ref "$PROJECT_REF"
  supabase functions deploy handle-payment-webhook --project-ref "$PROJECT_REF" --no-verify-jwt
  echo "✅ STRIPE_WEBHOOK_SECRET gesetzt + handle-payment-webhook deployed"
}

verify_webhook_signature() {
  local secret="$1"
  local payload='{"id":"evt_golive_probe","object":"event","type":"payment_intent.succeeded","created":1700000000,"data":{"object":{"id":"pi_probe","object":"payment_intent","amount":100,"metadata":{}}}}'
  local sig status body
  sig=$(WHSEC="$secret" PAYLOAD="$payload" node -e "
const Stripe = require('stripe');
const s = new Stripe('sk_test_x');
console.log(s.webhooks.generateTestHeaderString({ payload: process.env.PAYLOAD, secret: process.env.WHSEC }));
")
  body=$(curl -sS -w '\n%{http_code}' -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -H "stripe-signature: $sig" \
    -d "$payload")
  status=$(echo "$body" | tail -n1)
  body=$(echo "$body" | sed '$d')
  echo "Probe HTTP $status: ${body:0:120}"
  if echo "$body" | grep -q 'Invalid signature'; then
    echo "❌ Signatur-Probe fehlgeschlagen"
    return 1
  fi
  if [ "$status" = "503" ]; then
    echo "❌ Edge Function nicht erreichbar (503)"
    return 1
  fi
  return 0
}

# ── Bekanntes Secret (GitHub Secret) ─────────────────────────────
if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  WHSEC="$STRIPE_WEBHOOK_SECRET"
  echo "✅ STRIPE_WEBHOOK_SECRET aus GitHub Secret"
  deploy_webhook_handler "$WHSEC"
  output_whsec "$WHSEC"
  sleep 25
  verify_webhook_signature "$WHSEC"
  exit 0
fi

# ── Stripe Endpoints für unsere URL auflisten ────────────────────
curl -sfS "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
  -u "${STRIPE_SECRET_KEY}:" > /tmp/stripe_endpoints.json

readarray -t MATCHING_IDS < <(WEBHOOK_URL="$WEBHOOK_URL" python3 <<'PY'
import json, os
with open("/tmp/stripe_endpoints.json") as f:
    data = json.load(f)
url = os.environ["WEBHOOK_URL"]
for endpoint in data.get("data", []):
    if endpoint.get("url") == url:
        print(endpoint["id"])
PY
)

if [ "${#MATCHING_IDS[@]}" -gt 1 ]; then
  echo "⚠️  ${#MATCHING_IDS[@]} Webhooks für dieselbe URL — bereinige Duplikate"
  for id in "${MATCHING_IDS[@]}"; do
    curl -sfS -X DELETE "https://api.stripe.com/v1/webhook_endpoints/${id}" -u "${STRIPE_SECRET_KEY}:" > /dev/null
    echo "   gelöscht: $id"
  done
  MATCHING_IDS=()
fi

if [ "${#MATCHING_IDS[@]}" -eq 1 ]; then
  ENDPOINT_ID="${MATCHING_IDS[0]}"
  echo "✅ Stripe Webhook existiert ($ENDPOINT_ID) — Secret-Sync via Neuerstellung"
  curl -sfS -X DELETE "https://api.stripe.com/v1/webhook_endpoints/${ENDPOINT_ID}" -u "${STRIPE_SECRET_KEY}:" > /dev/null
fi

# ── Neuen Webhook anlegen (liefert whsec_) ───────────────────────
CREATE_ARGS=(-d "url=${WEBHOOK_URL}")
for ev in "${EVENTS[@]}"; do
  CREATE_ARGS+=(-d "enabled_events[]=${ev}")
done

CREATE=$(curl -sfS "https://api.stripe.com/v1/webhook_endpoints" \
  -u "${STRIPE_SECRET_KEY}:" \
  "${CREATE_ARGS[@]}")
WHSEC=$(echo "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["secret"])')
ENDPOINT_ID=$(echo "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
echo "✅ Neuer Stripe Webhook erstellt ($ENDPOINT_ID)"

deploy_webhook_handler "$WHSEC"
output_whsec "$WHSEC"
sleep 25
verify_webhook_signature "$WHSEC"
echo "✅ Webhook-Signatur-Verifikation erfolgreich"
