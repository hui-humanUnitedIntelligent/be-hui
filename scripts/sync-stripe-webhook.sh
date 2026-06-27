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

verify_runtime() {
  local status body
  body=$(curl -sS -w '\n%{http_code}' -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' -d '{}')
  status=$(echo "$body" | tail -n1)
  body=$(echo "$body" | sed '$d')
  echo "Runtime-Probe HTTP $status: ${body:0:80}"
  [ "$status" != "503" ] && [ "$status" != "404" ]
}

# ── Bekanntes Secret (GitHub Secret) ─────────────────────────────
if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  WHSEC="$STRIPE_WEBHOOK_SECRET"
  echo "✅ STRIPE_WEBHOOK_SECRET aus GitHub Secret"
  deploy_webhook_handler "$WHSEC"
  output_whsec "$WHSEC"
  sleep 20
  verify_runtime
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
  echo "✅ Stripe Webhook existiert ($ENDPOINT_ID)"
  if supabase secrets list --project-ref "$PROJECT_REF" 2>/dev/null | grep -q 'STRIPE_WEBHOOK_SECRET'; then
    echo "✅ STRIPE_WEBHOOK_SECRET in Supabase — kein Redeploy nötig"
    verify_runtime
    exit 0
  fi
  echo "⚠️  Webhook ohne Supabase-Secret — Endpoint wird neu erstellt"
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
echo "✅ Stripe Webhook bereit ($ENDPOINT_ID)"

deploy_webhook_handler "$WHSEC"
output_whsec "$WHSEC"
sleep 20
verify_runtime
echo "✅ Stripe Webhook konfiguriert"
