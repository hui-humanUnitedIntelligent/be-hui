# HUI Commerce 2.0 — Cleanup-Liste (Phase 5)

**Status:** Vorbereitet — nichts löschen bis E2E-Verifikation in Produktion abgeschlossen.

Alle markierten Dateien tragen den Header:
`LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5`

---

## Datenbank-Migrationen

| Datei | Grund |
|---|---|
| `hui_051_commerce_foundation.sql` | Ersetzt durch 057 |
| `hui_052_commerce_p0_security.sql` | In 057 integriert |
| `hui_053_cart_hash_aborted.sql` | In 057 integriert |
| `hui_054_infrastructure_sync.sql` | In 057 integriert |
| `hui_055_commerce_production_final.sql` | Ersetzt durch 057 |
| `hui_055_commerce_complete.sql` | Ersetzt durch 057 |
| `HUI_COMMERCE_COMPLETE_MIGRATION.sql` | Bundle 051–054, obsolet |
| `supabase/migrations/20260627_052_commerce_p0_security.sql` | Ersetzt durch 057 |
| `supabase/migrations/20260627_053_cart_hash_aborted_status.sql` | Ersetzt durch 057 |
| `supabase/migrations/20260627_054_commerce_infrastructure_sync.sql` | Ersetzt durch 057 |
| `supabase/phase4d_creator_economy.sql` | Wallet in 057 vereinigt |

**Behalten:** `hui_056_commerce_schema_aligned.sql` (Entwicklungsreferenz), `hui_057_commerce_schema_final.sql` (kanonisch)

---

## Edge Functions

| Function | Datei | Ersetzt durch |
|---|---|---|
| `release-escrow` | `supabase/functions/release-escrow/index.ts` | `release-payout` (Orders-Flow) |
| `cast-impact-vote` | `supabase/functions/cast-impact-vote/index.ts` | Impact-Subsystem (optional behalten) |

**Kanonisch behalten:** `create-payment-intent`, `handle-payment-webhook`, `check-order-status`, `release-payout`, `distribute-impact-round`

---

## Frontend

| Datei | Ersetzt durch |
|---|---|
| `src/components/commerce/WerkKaufFlow.jsx` | WerkeKorb → UnterstuetzenFlow |
| `src/components/commerce/ExperienceBookingFlow.jsx` | WerkeKorb → UnterstuetzenFlow |
| `src/components/economy/SupportFlow.jsx` | UnterstuetzenFlow |
| `src/services/creatorEconomy.js` | `commerceEngine.js` (+ CreatorDashboard-Anpassung) |
| `src/pages/MyCreatorDashboard.jsx` | `CreatorDashboard.jsx` |

### Wiring entfernen (nach Datei-Löschung)

| Datei | Referenz |
|---|---|
| `src/pages/Home.jsx` | Imports + Render von WerkKaufFlow, ExperienceBookingFlow |
| `src/pages/wirker-profile/index.jsx` | SupportFlow Import + Render |
| `src/App.jsx` | pendingWerkKauf Router-State |
| `src/core/hui.actions.js` | ExperienceBookingFlow Action |
| `src/pages/CreatorDashboard.jsx` | `creatorEconomy.js` → `commerceEngine.js` migrieren |

---

## Views (Datenbank, Phase 5)

| View | Aktion |
|---|---|
| `buyer_order_status` | Entfernen wenn alle Clients `customer_id`/`state` nutzen |

Legacy-Aliase in View: `buyer_id`, `status`, `platform_fee_eur`, `creator_id`

---

## Deploy-Artefakte

| Datei | Aktion |
|---|---|
| `hui_commerce_deploy_panel.html` | Auf 057 umstellen oder entfernen |

---

## Verifikation vor Löschung

1. Migration 057 in Produktion ausgeführt
2. Alle 4 Commerce Edge Functions deployed (401/400 Smoke-Test)
3. E2E-Test (`node e2e-test.js`) erfolgreich
4. Kein Import von Legacy-Frontend-Dateien mehr aktiv
5. `buyer_order_status` View nicht mehr von Clients benötigt
