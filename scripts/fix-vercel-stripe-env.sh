#!/usr/bin/env bash
# Sets Stripe publishable key for production builds and verifies bundle output.
# Primary: Vercel env via VERCEL_TOKEN (if available)
# Fallback: src/config/stripe-publishable-key.json (public pk_test — safe to commit)
set -euo pipefail

VERCEL_PROJECT_NAME="${VERCEL_PROJECT_NAME:-be-hui}"
VERCEL_TEAM_SLUG="${VERCEL_TEAM_SLUG:-hui-humanunitedintelligents-projects}"
PRODUCTION_URL="${PRODUCTION_URL:-https://be-hui.vercel.app}"
KEY_FILE="src/config/stripe-publishable-key.json"

log() { printf '%s\n' "$*"; }
fail() { log "❌ $*"; exit 1; }

vercel_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  if [ -n "$data" ]; then
    curl -sfS -X "$method" "https://api.vercel.com${path}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sfS -X "$method" "https://api.vercel.com${path}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

require_cmd node
require_cmd python3
require_cmd curl

if [ -z "${STRIPE_SECRET_KEY:-}" ] && [ -z "${VITE_STRIPE_PUBLIC_KEY:-}" ]; then
  fail "Weder STRIPE_SECRET_KEY noch VITE_STRIPE_PUBLIC_KEY gesetzt"
fi

log "→ Dependencies installieren"
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://gxztrhvhcxhmunhhkfjd.supabase.co}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk}"
npm ci

log "→ Stripe CLI installieren"
curl -fsSL https://github.com/stripe/stripe-cli/releases/download/v1.22.0/stripe_1.22.0_linux_x86_64.tar.gz | tar -xz stripe
export PATH="$PWD:$PATH"

log "→ Stripe Publishable Key auflösen"
PK="$(node scripts/resolve-stripe-publishable-key.mjs | tr -d '\r\n')"
[[ "$PK" =~ ^pk_(test|live)_ ]] || fail "Ungültiger Publishable Key: ${PK:0:20}..."
log "✅ Publishable Key: ${PK:0:24}..."

python3 - <<PY
import json
with open("$KEY_FILE", "w", encoding="utf-8") as f:
    json.dump({"key": "$PK"}, f, indent=2)
    f.write("\n")
PY
log "✅ $KEY_FILE geschrieben"

if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  log "→ STRIPE_PUBLISHABLE_KEY in Supabase setzen"
  curl -sfS -X POST "https://api.supabase.com/v1/projects/gxztrhvhcxhmunhhkfjd/secrets" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json; print(json.dumps([{'name':'STRIPE_PUBLISHABLE_KEY','value':'$PK'}]))")" >/dev/null
  log "✅ Supabase Secret STRIPE_PUBLISHABLE_KEY gesetzt"

  if command -v supabase >/dev/null 2>&1 || [ -x /tmp/supabase ]; then
    SB="${SUPABASE_BIN:-supabase}"
    command -v "$SB" >/dev/null 2>&1 || SB="/tmp/supabase"
    log "→ create-payment-intent redeployen"
    SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" "$SB" functions deploy create-payment-intent \
      --project-ref gxztrhvhcxhmunhhkfjd >/dev/null
    log "✅ Edge Function create-payment-intent deployed"
  fi
else
  log "⚠️ SUPABASE_ACCESS_TOKEN fehlt — STRIPE_PUBLISHABLE_KEY nicht in Supabase gesetzt"
fi

if [ -n "${VERCEL_TOKEN:-}" ]; then
  log "→ VERCEL_TOKEN vorhanden — Vercel Env setzen + Redeploy"
  TEAM_JSON="$(vercel_api GET "/v2/teams?slug=${VERCEL_TEAM_SLUG}" 2>/dev/null || vercel_api GET "/v2/teams")"
  TEAM_ID="$(printf '%s' "$TEAM_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); teams=d.get("teams") or []; print(teams[0]["id"] if teams else "")')"
  [ -n "$TEAM_ID" ] || fail "Vercel Team nicht gefunden"

  PROJECT_JSON="$(vercel_api GET "/v9/projects/${VERCEL_PROJECT_NAME}?teamId=${TEAM_ID}")"
  PROJECT_ID="$(printf '%s' "$PROJECT_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"

  ENV_JSON="$(vercel_api GET "/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}")"
  EXISTING_ID="$(PK="$PK" ENV_JSON="$ENV_JSON" python3 - <<'PY'
import json, os
envs = json.loads(os.environ["ENV_JSON"]).get("envs", [])
for e in envs:
    if e.get("key") == "VITE_STRIPE_PUBLIC_KEY":
        print(e.get("id", ""))
        break
PY
)"

  PAYLOAD="$(python3 -c "import json; print(json.dumps({'value': '$PK', 'target': ['production', 'preview', 'development']}))")"
  if [ -n "$EXISTING_ID" ]; then
    vercel_api PATCH "/v9/projects/${PROJECT_ID}/env/${EXISTING_ID}?teamId=${TEAM_ID}" "$PAYLOAD" >/dev/null
  else
    CREATE="$(python3 -c "import json; print(json.dumps({'key': 'VITE_STRIPE_PUBLIC_KEY', 'value': '$PK', 'type': 'encrypted', 'target': ['production', 'preview', 'development']}))")"
    vercel_api POST "/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" "$CREATE" >/dev/null
  fi

  DEPLOY_BODY="$(printf '%s' "$PROJECT_JSON" | python3 - <<'PY'
import json, sys
p = json.load(sys.stdin)
l = p.get("link") or {}
print(json.dumps({
  "name": p["name"],
  "project": p["id"],
  "target": "production",
  "gitSource": {
    "type": l.get("type", "github"),
    "org": l.get("org"),
    "repo": l.get("repo"),
    "ref": l.get("productionBranch", "main"),
  },
}))
PY
)"
  vercel_api POST "/v13/deployments?teamId=${TEAM_ID}&forceNew=1" "$DEPLOY_BODY" >/dev/null
  log "✅ Vercel Env gesetzt + Redeploy ausgelöst"
else
  log "⚠️ VERCEL_TOKEN fehlt — Fallback: Key wird über $KEY_FILE in den Build eingebunden"
fi

log "→ Lokaler Production-Build zur Verifikation"
npm run build

HOME_CHUNK="$(ls dist/assets/Home-*.js | head -1)"
[ -f "$HOME_CHUNK" ] || fail "Home-Chunk nicht gefunden"
if rg -q 'LEER/FEHLEND' "$HOME_CHUNK" && ! rg -q 'pk_(test|live)_' "$HOME_CHUNK"; then
  fail "Lokaler Build enthält keinen Stripe Publishable Key"
fi
FOUND="$(rg -o 'pk_(test|live)_[A-Za-z0-9]+' "$HOME_CHUNK" | head -1)"
log "✅ Lokaler Build OK — ${FOUND:0:24}..."

if [ -n "${VERCEL_TOKEN:-}" ]; then
  log "→ Warte auf Vercel Production (max 10 min)"
  sleep 60
  for i in $(seq 1 30); do
    HTML="$(curl -sfS "${PRODUCTION_URL}/" || true)"
    MAIN_JS="$(printf '%s' "$HTML" | python3 -c 'import re,sys; m=re.search(r"/assets/index-[^\"]+\.js", sys.stdin.read()); print(m.group(0) if m else "")' 2>/dev/null || true)"
    if [ -n "$MAIN_JS" ]; then
      HOME_JS="$(curl -sfS "${PRODUCTION_URL}${MAIN_JS}" | python3 -c 'import re,sys; m=re.search(r"assets/Home-[^\"]+\.js", sys.stdin.read()); print("/"+m.group(0) if m else "")' 2>/dev/null || true)"
      if [ -n "$HOME_JS" ]; then
        BODY="$(curl -sfS "${PRODUCTION_URL}${HOME_JS}" || true)"
        if printf '%s' "$BODY" | rg -q 'pk_(test|live)_' && ! printf '%s' "$BODY" | rg -q 'Bc=""'; then
          PROD_PK="$(printf '%s' "$BODY" | python3 -c 'import re,sys; m=re.search(r"pk_(?:test|live)_[A-Za-z0-9]+", sys.stdin.read()); print(m.group(0) if m else "")')"
          log "✅ Production Bundle OK — ${PROD_PK:0:24}..."
          exit 0
        fi
      fi
    fi
    log "   [$i/30] Production noch nicht aktualisiert..."
    sleep 20
  done
  fail "Production Bundle nach Redeploy noch ohne pk_test_"
fi

log "✅ Stripe Publishable Key Fix abgeschlossen (Merge → main triggert Vercel Deploy)"
