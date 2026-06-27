# Commerce Edge Functions — Runtime Status

Stand: 2026-06-27 (vor Redeploy via `cursor/edge-functions-runtime-stabilize-7dda`)

## Verifikationskriterien

| HTTP-Status | Bedeutung |
|---|---|
| **401** oder **400** | Erfolg — Runtime gestartet, Handler erreicht |
| **404** | Fehler — Function nicht deployed |
| **503** | Fehler — Function bootet nicht (`LOAD_FUNCTION_ERROR`) |

## Pre-Deploy Status (Baseline)

Alle vier Commerce-Functions liefern aktuell **503** mit `LOAD_FUNCTION_ERROR`:

| Function | HTTP-Status | Runtime gestartet | Handler ausgeführt |
|---|---|---|---|
| `create-payment-intent` | 503 | nein | nein |
| `handle-payment-webhook` | 503 | nein | nein |
| `check-order-status` | 503 | nein | nein |
| `release-payout` | 503 | nein | nein |

Response-Body (alle): `{"code":"LOAD_FUNCTION_ERROR","message":"Failed to load edge function"}`

## Post-Deploy Erwartung

Nach erfolgreichem Redeploy (deploy-trigger + `.catch()`-Fixes):

| Function | Erwarteter HTTP-Status | Erwarteter Handler-Pfad |
|---|---|---|
| `create-payment-intent` | 401 | Auth-Check ohne Bearer-Token |
| `handle-payment-webhook` | 400 | Stripe-Signatur-Validierung schlägt fehl |
| `check-order-status` | 401 | Auth-Check ohne Bearer-Token |
| `release-payout` | 401 | Auth-Check ohne Bearer-Token |

## Änderungen in diesem Sprint

1. Alle falschen `.catch()`-Aufrufe auf Supabase Query Builder entfernt (async/await + `{ error }`-Check)
2. GitHub Workflow: `concurrency` verhindert parallele Deployments
3. Deployment-Verifikation prüft alle 4 Functions einzeln (401/400 = PASS, 404/503 = FAIL)
4. `deploy-trigger`-Kommentar in allen 4 Functions für erzwungenen Redeploy

## Manuelle Verifikation

```bash
BASE="https://gxztrhvhcxhmunhhkfjd.supabase.co/functions/v1"
for fn in create-payment-intent handle-payment-webhook check-order-status release-payout; do
  echo "=== $fn ==="
  curl -s -w "\nHTTP %{http_code}\n" "$BASE/$fn" -X POST -H "Content-Type: application/json" -d '{}'
done
```
