# HUI Finance Cleanup Report — 2026-07-10

## Umgestellte Dateien
- `src/components/commerce/commerceUtils.js` → 0.20/0.80 (war 0.10/0.85)
- `src/lib/ambassadorUtils.js` → Komplett neu (Balanced Growth)
- `supabase/functions/create-payment-intent/index.ts` → PLATFORM_FEE 0.20
- `supabase/migrations/20260710_074_balanced_growth_finance.sql` → Neue RPCs

## Entfernte Elemente
- `rpc_record_payment` (Legacy RPC, falsche Raten) → DROPPED
- `cast-impact-vote` Edge Function → als LEGACY markiert (wird nach Phase 5 entfernt)

## Neue Elemente
- Tabelle: `hui_finance_phases` (KPI-gesteuerte Phasenwechsel)
- Tabelle: `hui_innovation_fund` (4% vom Brutto)
- Tabelle: `hui_impact_flex_pool` (1.8% vom Brutto)
- RPC: `rpc_get_active_phase()`
- RPC: `rpc_validate_balanced_growth(amount_eur)`
- RPC: `rpc_evaluate_phase_transition()`

## Validierung
- 100€ → Talent: 80€ / HUI: 20€ / Unternehmen: 10€ / Impact: 6€ / Innovation: 4€ ✓
- Self-Referral-Guard aktiv ✓
- Idempotenz (order_id Unique-Check) erhalten ✓
- Phasenwechsel-Automation: rpc_evaluate_phase_transition() via Automation ✓

## Offene Punkte
- SADB-Dashboard: Neue Kacheln für Innovation-Fund + Flex-Pool (nächster Schritt)
- EDB: Spalten hui_company_eur / impact_pool_eur / innovation_fund_eur in Views
- Monatliche KPI-Evaluation via Automation (ersten des Monats)
