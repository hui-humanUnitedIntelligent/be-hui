#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="${WEBHOOK_URL:-https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook}"
PROJECT_REF="${PROJECT_REF:-gxztrhvhcxhmunhhkfjd}"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "STRIPE_SECRET_KEY fehlt"
  exit 1
fi

WHSEC=""

if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  WHSEC="$STRIPE_WEBHOOK_SECRET"
  echo "✅ STRIPE_WEBHOOK_SECRET aus GitHub Secret"
else
  curl -sfS "https://api.stripe.com/v1/webhook_endpoints?limit=20" -u "${STRIPE_SECRET_KEY}:" > /tmp/stripe_endpoints.json
  EXISTING_ID=$(WEBHOOK_URL="$WEBHOOK_URL" python3 <<'PY'
import json, os
with open("/tmp/stripe_endpoints.json") as f:
    d = json.load(f)
url = os.environ["WEBHOOK_URL"]
ids = [e["id"] for e in d.get("data", []) if e.get("url") == url]
print(ids[0] if ids else "")
PY
)

  if [ -n "$EXISTING_ID" ]; then
    echo "✅ Stripe Webhook existiert bereits ($EXISTING_ID) — Endpoint wird nicht neu erstellt"
    if supabase secrets list --project-ref "$PROJECT_REF" | grep -q 'STRIPE_WEBHOOK_SECRET'; then
      echo "✅ STRIPE_WEBHOOK_SECRET in Supabase vorhanden"
      supabase functions deploy handle-payment-webhook --project-ref "$PROJECT_REF" --no-verify-jwt
      sleep 15
      exit 0
    fi
    echo "❌ Webhook existiert, aber STRIPE_WEBHOOK_SECRET fehlt in Supabase/GitHub"
    exit 1
  fi

  CREATE=$(curl -sfS "https://api.stripe.com/v1/webhook_endpoints" \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "url=${WEBHOOK_URL}" \
    -d "enabled_events[]=payment_intent.succeeded" \
    -d "enabled_events[]=payment_intent.payment_failed" \
    -d "enabled_events[]=charge.dispute.created")
  WHSEC=$(echo "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["secret"])')
  echo "✅ Neuer Stripe Webhook erstellt"
fi

supabase secrets set STRIPE_WEBHOOK_SECRET="$WHSEC" --project-ref "$PROJECT_REF"
supabase functions deploy handle-payment-webhook --project-ref "$PROJECT_REF" --no-verify-jwt
echo "✅ STRIPE_WEBHOOK_SECRET gesetzt + handle-payment-webhook deployed"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "whsec=$WHSEC" >> "$GITHUB_OUTPUT"
fi
sleep 30
