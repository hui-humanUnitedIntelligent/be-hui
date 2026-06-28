#!/usr/bin/env bash
# Resolves Stripe publishable key, sets Vercel production env, force-redeploys, verifies bundle.
set -euo pipefail

VERCEL_PROJECT_NAME="${VERCEL_PROJECT_NAME:-be-hui}"
VERCEL_TEAM_SLUG="${VERCEL_TEAM_SLUG:-hui-humanunitedintelligents-projects}"
PRODUCTION_URL="${PRODUCTION_URL:-https://be-hui.vercel.app}"

log() { printf '%s\n' "$*"; }
fail() { log "❌ $*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

require_cmd curl
require_cmd python3

if [ -z "${VERCEL_TOKEN:-}" ]; then
  fail "VERCEL_TOKEN fehlt — Vercel API nicht erreichbar"
fi

if [ -z "${STRIPE_SECRET_KEY:-}" ] && [ -z "${VITE_STRIPE_PUBLIC_KEY:-}" ]; then
  fail "Weder STRIPE_SECRET_KEY noch VITE_STRIPE_PUBLIC_KEY gesetzt"
fi

resolve_publishable_key() {
  if [ -n "${VITE_STRIPE_PUBLIC_KEY:-}" ]; then
    log "→ VITE_STRIPE_PUBLIC_KEY aus Secret verwenden"
    printf '%s' "$VITE_STRIPE_PUBLIC_KEY"
    return
  fi

  log "→ Publishable Key via Stripe API auflösen"
  python3 - <<'PY'
import json, os, sys, urllib.request

sk = os.environ["STRIPE_SECRET_KEY"].strip()
headers = {
    "Authorization": f"Bearer {sk}",
    "Content-Type": "application/json",
}

def post_v2(path, payload):
    req = urllib.request.Request(
        f"https://api.stripe.com{path}",
        data=json.dumps(payload).encode(),
        headers={**headers, "Stripe-Version": "2025-11-17.preview"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def get_v1(path):
    req = urllib.request.Request(
        f"https://api.stripe.com{path}",
        headers=headers,
        method="GET",
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

# Preferred: Stripe V2 publishable key creation (idempotent for our use case)
for attempt in ("v2_create", "v1_account"):
    try:
        if attempt == "v2_create":
            data = post_v2("/v2/iam/api_keys", {"type": "publishable_key"})
            key = data.get("key") or data.get("publishable_key") or data.get("value")
            if isinstance(key, dict):
                key = key.get("key") or key.get("value")
        else:
            data = get_v1("/v1/account")
            key = data.get("settings", {}).get("dashboard", {}).get("display_name")
            key = None
        if key and str(key).startswith("pk_"):
            print(str(key).strip())
            sys.exit(0)
    except Exception as exc:
        if attempt == "v2_create":
            sys.stderr.write(f"v2 create failed: {exc}\n")
        else:
            raise

sys.stderr.write("Konnte keinen publishable key von Stripe ableiten\n")
sys.exit(1)
PY
}

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

PK="$(resolve_publishable_key | tr -d '\r\n')"
[[ "$PK" =~ ^pk_(test|live)_ ]] || fail "Ungültiger Publishable Key: ${PK:0:20}..."

log "✅ Publishable Key: ${PK:0:20}..."

log "→ Vercel Team + Projekt auflösen"
TEAM_JSON="$(vercel_api GET "/v2/teams?slug=${VERCEL_TEAM_SLUG}" || true)"
TEAM_ID="$(printf '%s' "$TEAM_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); teams=d.get("teams") or []; print(teams[0]["id"] if teams else "")' 2>/dev/null || true)"

if [ -z "$TEAM_ID" ]; then
  TEAM_ID="$(vercel_api GET "/v2/teams" | python3 -c 'import json,sys; d=json.load(sys.stdin); teams=d.get("teams") or []; print(teams[0]["id"] if teams else "")')"
fi
[ -n "$TEAM_ID" ] || fail "Vercel Team nicht gefunden"

PROJECT_JSON="$(vercel_api GET "/v9/projects/${VERCEL_PROJECT_NAME}?teamId=${TEAM_ID}")"
PROJECT_ID="$(printf '%s' "$PROJECT_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
[ -n "$PROJECT_ID" ] || fail "Vercel Projekt nicht gefunden"

log "✅ Projekt: ${VERCEL_PROJECT_NAME} (${PROJECT_ID})"

log "→ Vercel Env VITE_STRIPE_PUBLIC_KEY prüfen/setzen"
ENV_JSON="$(vercel_api GET "/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}")"
EXISTING_ID="$(PK="$PK" ENV_JSON="$ENV_JSON" python3 - <<'PY'
import json, os
envs = json.loads(os.environ["ENV_JSON"]).get("envs", [])
pk = os.environ["PK"]
for e in envs:
    if e.get("key") == "VITE_STRIPE_PUBLIC_KEY" and "production" in (e.get("target") or []):
        print(e.get("id", ""))
        break
PY
)"

if [ -n "$EXISTING_ID" ]; then
  log "→ Env existiert (${EXISTING_ID}) — Wert aktualisieren"
  vercel_api PATCH "/v9/projects/${PROJECT_ID}/env/${EXISTING_ID}?teamId=${TEAM_ID}" \
    "$(python3 - <<PY
import json
print(json.dumps({"value": "$PK", "target": ["production", "preview", "development"]}))
PY
)" >/dev/null
else
  log "→ Env fehlt — neu anlegen"
  vercel_api POST "/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" \
    "$(python3 - <<PY
import json
print(json.dumps({
  "key": "VITE_STRIPE_PUBLIC_KEY",
  "value": "$PK",
  "type": "encrypted",
  "target": ["production", "preview", "development"],
}))
PY
)" >/dev/null
fi

log "✅ VITE_STRIPE_PUBLIC_KEY in Vercel gesetzt"

log "→ Force-Redeploy ohne Build-Cache"
DEPLOY_JSON="$(vercel_api POST "/v13/deployments?teamId=${TEAM_ID}&forceNew=1" \
  "$(printf '%s' "$PROJECT_JSON" | python3 - <<'PY'
import json, sys
project = json.load(sys.stdin)
link = project.get("link") or {}
print(json.dumps({
  "name": project.get("name"),
  "project": project.get("id"),
  "target": "production",
  "gitSource": {
    "type": link.get("type", "github"),
    "org": link.get("org"),
    "repo": link.get("repo"),
    "ref": link.get("productionBranch", "main"),
  },
  "build": {"env": {}},
}))
PY
)")"

DEPLOY_URL="$(printf '%s' "$DEPLOY_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("url",""))')"
DEPLOY_ID="$(printf '%s' "$DEPLOY_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("id",""))')"
log "→ Deployment gestartet: ${DEPLOY_URL:-?} (${DEPLOY_ID})"

log "→ Warte auf Deployment READY (max 10 min)"
for i in $(seq 1 60); do
  STATE="$(vercel_api GET "/v13/deployments/${DEPLOY_ID}?teamId=${TEAM_ID}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("readyState",""))')"
  log "   [$i/60] state=${STATE}"
  if [ "$STATE" = "READY" ]; then
    break
  fi
  if [ "$STATE" = "ERROR" ] || [ "$STATE" = "CANCELED" ]; then
    fail "Deployment fehlgeschlagen: ${STATE}"
  fi
  sleep 10
done
[ "$STATE" = "READY" ] || fail "Deployment Timeout"

log "→ Production-Bundle prüfen: ${PRODUCTION_URL}"
sleep 15
HTML="$(curl -sfS "${PRODUCTION_URL}/")"
MAIN_JS="$(printf '%s' "$HTML" | python3 -c 'import re,sys; m=re.search(r"/assets/index-[^\"]+\.js", sys.stdin.read()); print(m.group(0) if m else "")')"
[ -n "$MAIN_JS" ] || fail "index.js im HTML nicht gefunden"

HOME_JS="$(curl -sfS "${PRODUCTION_URL}${MAIN_JS}" | python3 -c 'import re,sys; data=sys.stdin.read(); m=re.search(r"assets/Home-[^\"]+\.js", data); print("/"+m.group(0) if m else "")')"
[ -n "$HOME_JS" ] || fail "Home-Chunk im Bundle nicht gefunden"

HOME_BODY="$(curl -sfS "${PRODUCTION_URL}${HOME_JS}")"
if printf '%s' "$HOME_BODY" | rg -q 'Bc=""'; then
  fail 'Bundle enthält noch Bc="" — Stripe Key fehlt im Build'
fi
if ! printf '%s' "$HOME_BODY" | rg -q 'pk_(test|live)_'; then
  fail "Bundle enthält keinen pk_test_/pk_live_ Key"
fi

FOUND_PK="$(printf '%s' "$HOME_BODY" | python3 -c 'import re,sys; m=re.search(r"pk_(?:test|live)_[A-Za-z0-9]+", sys.stdin.read()); print(m.group(0) if m else "")')"
log "✅ Bundle OK — ${FOUND_PK:0:24}..."

log "✅ Vercel Stripe Env Fix abgeschlossen"
