# Commerce Edge Functions — Runtime Status

Stand: 2026-06-27 (nach Merge PR #30 + Deploy Workflow #28292582123)

## Ursache des 503 LOAD_FUNCTION_ERROR (behoben)

**Belegbare Ursache:** `.catch()` auf Supabase PostgrestBuilder-Objekten in allen vier Functions.

Der Query Builder (`supabase.from(...).insert(...)`) gibt kein Promise zurück — `.catch()` ist zur Laufzeit undefiniert und verhindert das Booten der Deno-Runtime (`LOAD_FUNCTION_ERROR`).

**Fix (PR #30):** Alle `.catch()`-Aufrufe durch `const { error } = await ...` + `if (error)` ersetzt.

## Deployment (Workflow #28292582123)

Einzeln, sequentiell, kein paralleles Deployment (`concurrency: deploy-supabase-functions`):

| Schritt | Function | Ergebnis |
|---|---|---|
| 1 | `create-payment-intent` | ✅ Deployed (`--no-verify-jwt`) |
| 2 | `handle-payment-webhook` | ✅ Deployed (`--no-verify-jwt`) |
| 3 | `check-order-status` | ✅ Deployed |
| 4 | `release-payout` | ✅ Deployed |
| 5 | Stripe Secrets | ✅ `STRIPE_SECRET_KEY` gesetzt |

## Post-Deploy Verifikation

| Function | HTTP-Status | Response Body | Runtime gestartet | Handler ausgeführt |
|---|---|---|---|---|
| `create-payment-intent` (ohne JWT) | **401** | `{"error":"Unauthorized"}` | Ja | Ja |
| `create-payment-intent` (JWT, leer `orderItems`) | **400** | `{"error":"orderItems erforderlich"}` | Ja | Ja |
| `check-order-status` (ohne JWT) | **401** | `{"code":"UNAUTHORIZED_NO_AUTH_HEADER",...}` | Ja | Ja (JWT-Gateway) |
| `release-payout` (ohne JWT) | **401** | `{"code":"UNAUTHORIZED_NO_AUTH_HEADER",...}` | Ja | Ja (JWT-Gateway) |
| `handle-payment-webhook` (ohne Signatur) | **200** | `ok` | Ja | Ja (Early-Return) |

### Hinweis `handle-payment-webhook`

Erwarteter Status **400** setzt voraus, dass `STRIPE_WEBHOOK_SECRET` gesetzt ist. Aktuell fehlt dieses Secret — der Handler gibt bei fehlender Konfiguration `200 ok` zurück (Zeile 33–35 in `handle-payment-webhook/index.ts`), bevor die Signaturprüfung erreicht wird. Runtime bootet korrekt; kein 503.

## Commerce-Flow Test (nach Runtime-Fix)

Gestoppt beim ersten Fehler:

| Schritt | Ergebnis |
|---|---|
| 1. Payment Intent (published work) | ❌ HTTP 500 — `{"error":"Preisvalidierung fehlgeschlagen"}` |
| 4. `commerce_price_authority` | ❌ View fehlt in Prod (`PGRST205` / REST 404) |

Weitere Schritte (Order Insert, Stripe, Webhook, …) nicht ausgeführt.
