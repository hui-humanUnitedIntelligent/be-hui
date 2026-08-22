#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Post-Deploy Smoke Test (Punkt 13)
# Testet Kernrouten nach Deploy auf White-Screen / JS-Errors.
# Bei Fehlschlag: Alert an SADB-Webhook + Rollback-Hinweis.
# ═══════════════════════════════════════════════════════════════
set -e

BASE_URL="${1:-https://be-hui.vercel.app}"
WEBHOOK_URL="https://sadb-webhook.b44-hui.workers.dev/"
FAILED=0
RESULTS=""

echo "═══════════════════════════════════════════════════"
echo "  HUI Post-Deploy Smoke Test"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════"

# ── Kernrouten ──────────────────────────────────────────────────
ROUTES=(
  "/|Landing Page"
  "/app/login|Login Page"
  "/app/auth/callback|Auth Callback"
)

for entry in "${ROUTES[@]}"; do
  PATH_="${entry%%|*}"
  NAME="${entry##*|}"
  URL="${BASE_URL}${PATH_}"

  echo ""
  echo "Testing: $NAME ($URL)"

  # HTTP Status
  HTTP_CODE=$(curl -s -o /tmp/smoke-response.html -w "%{http_code}" "$URL" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    # Check if #web-root or #root exists
    if grep -q 'id="web-root"' /tmp/smoke-response.html || grep -q 'id="root"' /tmp/smoke-response.html; then
      # Check if JS module script exists
      if grep -q 'type="module"' /tmp/smoke-response.html; then
        echo "  ✅ $NAME: HTTP 200, HTML structure OK"
        RESULTS="${RESULTS}✅ ${NAME}: OK\n"
      else
        echo "  ⚠️ $NAME: HTTP 200 but no module script found"
        RESULTS="${RESULTS}⚠️ ${NAME}: no module script\n"
        FAILED=$((FAILED + 1))
      fi
    else
      echo "  ❌ $NAME: HTTP 200 but no #web-root/#root element"
      RESULTS="${RESULTS}❌ ${NAME}: no root element\n"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "  ❌ $NAME: HTTP $HTTP_CODE"
    RESULTS="${RESULTS}❌ ${NAME}: HTTP ${HTTP_CODE}\n"
    FAILED=$((FAILED + 1))
  fi
done

# ── Chunk-Verfügbarkeit prüfen ─────────────────────────────────
echo ""
echo "Checking: Main chunk available..."
MAIN_CHUNK=$(grep -o 'src="[^"]*\.js"' /tmp/smoke-response.html 2>/dev/null | head -1 | sed 's/src="//;s/"//')
if [ -n "$MAIN_CHUNK" ]; then
  if [[ "$MAIN_CHUNK" == /* ]]; then
    CHUNK_URL="${BASE_URL}${MAIN_CHUNK}"
  else
    CHUNK_URL="${BASE_URL}/${MAIN_CHUNK}"
  fi
  CHUNK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CHUNK_URL" 2>/dev/null || echo "000")
  if [ "$CHUNK_CODE" = "200" ]; then
    echo "  ✅ Main chunk: HTTP 200 ($MAIN_CHUNK)"
  else
    echo "  ❌ Main chunk: HTTP $CHUNK_CODE ($MAIN_CHUNK)"
    RESULTS="${RESULTS}❌ Main chunk: HTTP ${CHUNK_CODE}\n"
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⚠️ No main chunk found in HTML"
fi

# ── Ergebnis ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$FAILED" -gt 0 ]; then
  echo "  ❌ SMOKE TEST FAILED — $FAILED issue(s) detected"
  echo ""
  echo -e "$RESULTS"
  echo ""
  echo "  → ROLLBACK RECOMMENDED"
  echo "  → Alerting SADB..."

  # Alert an SADB
  curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"item_type\":\"system_error\",\"item_id\":\"smoke-$(date +%s)\",\"item_title\":\"Post-Deploy Smoke Test FAILED\",\"trigger\":\"post-deploy-smoke-test\",\"error_data\":{\"errorType\":\"smoke_test_failed\",\"errorCode\":\"SMK-001\",\"message\":\"Smoke test failed with $FAILED issues\",\"route\":\"$BASE_URL\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"results\":\"$(echo -e $RESULTS | tr '\n' ';')\",\"priority\":\"CRITICAL\",\"status\":\"open\"}}" \
    > /dev/null 2>&1 || true

  echo "═══════════════════════════════════════════════════"
  exit 1
else
  echo "  ✅ SMOKE TEST PASSED — All routes OK"
  echo ""
  echo -e "$RESULTS"
  echo "═══════════════════════════════════════════════════"
  exit 0
fi
