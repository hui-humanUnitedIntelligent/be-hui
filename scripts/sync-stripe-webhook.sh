#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="${WEBHOOK_URL:-https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1/handle-payment-webhook}"
PROJECT_REF="${PROJECT_REF:-gxztrhvhcxhmunhhkfjd}"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "STRIPE_SECRET_KEY fehlt"
  exit 1
fi

if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  WHSEC="$STRIPE_WEBHOOK_SECRET"
else
  curl -sfS "https://api.stripe.com/v1/webhook_endpoints?limit=20" -u "${STRIPE_SECRET_KEY}:" > /tmp/stripe_endpoints.json
  WEBHOOK_URL="$WEBHOOK_URL" STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" python3 <<'PY'
import json, os, urllib.request, base64
with open("/tmp/stripe_endpoints.json") as f:
    d = json.load(f)
url = os.environ["WEBHOOK_URL"]
key = os.environ["STRIPE_SECRET_KEY"]
auth = "Basic " + base64.b64encode((key + ":").encode()).decode()
for e in d.get("data", []):
    if e.get("url") == url:
        req = urllib.request.Request(
            f"https://api.stripe.com/v1/webhook_endpoints/{e['id']}",
            method="DELETE",
            headers={"Authorization": auth},
        )
        urllib.request.urlopen(req)
PY
  CREATE=$(curl -sfS "https://api.stripe.com/v1/webhook_endpoints" \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "url=${WEBHOOK_URL}" \
    -d "enabled_events[]=payment_intent.succeeded" \
    -d "enabled_events[]=payment_intent.payment_failed" \
    -d "enabled_events[]=charge.dispute.created")
  WHSEC=$(echo "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["secret"])')
fi

supabase secrets set STRIPE_WEBHOOK_SECRET="$WHSEC" --project-ref "$PROJECT_REF"
supabase functions deploy handle-payment-webhook --project-ref "$PROJECT_REF" --no-verify-jwt
echo "✅ STRIPE_WEBHOOK_SECRET synchronisiert + handle-payment-webhook deployed"
sleep 20
