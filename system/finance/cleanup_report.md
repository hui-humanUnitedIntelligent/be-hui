# HUI Finance Cleanup Report — 2026-07-10
## Balanced Growth v1 — Vollständige Migration

### STATUS: ✅ ACTIVE

---

## Phase 1: DB-Migration (Commit 17bc848f)

### Neue Tabellen
| Tabelle | Zweck |
|---|---|
| `hui_finance_phases` | KPI-gesteuerte Phasenwechsel (Aufbau/Skalierung/Etabliert) |
| `hui_innovation_fund` | 4% vom Bruttoumsatz → Produktentwicklung/KI/Forschung |
| `hui_impact_flex_pool` | 1,8% vom Bruttoumsatz → Soforthilfe/Reserve/neue Projekte |

### Neue Spalten auf stripe_impact_pool
`hui_company_eur`, `impact_pool_eur`, `innovation_fund_eur`, `impact_projects_eur`, `impact_flex_pool_eur`, `finance_model`, `company_phase`

### Neue RPCs
| RPC | Zweck |
|---|---|
| `rpc_get_active_phase()` | Aktive Unternehmensphase abrufen |
| `rpc_validate_balanced_growth(eur)` | Formel-Validierung |
| `rpc_process_order_fees(order_id)` | Hauptformel 80/20 (aktualisiert) |
| `rpc_process_talent_booking_fees(booking_id)` | Identisch für Buchungen |

### Validierungstest 100€ ✅
- Talent: 80€ ✓
- HUI gesamt: 20€ ✓
- Unternehmen: 10€ ✓
- Impact: 6€ ✓
- Innovation: 4€ ✓
- Impact Projekte: 4,20€ ✓
- Impact Flex: 1,80€ ✓

---

## Phase 2: Frontend-Migration

### Aktualisierte Dateien
| Datei | Änderung |
|---|---|
| `src/components/commerce/commerceUtils.js` | PLATFORM_FEE 0.15→0.20, CREATOR_SHARE 0.85→0.80, IMPACT_RATE 0.0225→0.06 |
| `src/services/commerceEngine.js` | CREATOR_PAYOUT_RATE 0.85→0.80 |
| `src/lib/ambassadorUtils.js` | Komplett neu: BALANCED_GROWTH_RATES, COMPANY_PHASES, calcBalancedGrowth() |
| `supabase/functions/create-payment-intent/index.ts` | PLATFORM_FEE_RATE 0.15→0.20, CREATOR_SHARE 0.85→0.80 |
| `src/pages/ImpactPage.jsx` | Text "15% davon" → "6% des Umsatzes" |

### Backup
- `system/finance/legacy_backup/commerceUtils_legacy.js`
- `system/finance/legacy_backup/ambassadorUtils_legacy.js`
- `system/finance/legacy_backup/commerceEngine_legacy.js`

---

## Neue Finanzformel (SSOT)

```
Transaktion 100€
├── Talent/Creator:    80€  (80%)
└── HUI-System:        20€  (20%)
    ├── Unternehmen:   10€  (50% von HUI)
    ├── Impact-Pool:    6€  (30% von HUI)
    │   ├── Projekte:  4,20€ (70% von Impact → Rank 1: 50%, Rank 2: 30%, Rank 3: 20%)
    │   └── Flex-Pool: 1,80€ (30% von Impact)
    └── Innovation:     4€  (20% von HUI)
```

## Ambassador-Provision (aus Unternehmensanteil)
| Stufe | Referrals | Rate |
|---|---|---|
| Starter | 0–10 | 5% |
| Bronze | 11–50 | 10% |
| Silber | 51–200 | 15% |
| Gold | 201+ | 20% |

## Unternehmens-Phasenmodell
| Phase | Betrieb | Gewinn | Rücklagen | KPI-Trigger |
|---|---|---|---|---|
| 1 – Aufbau | 60% | 20% | 20% | Aktiv (Standard) |
| 2 – Skalierung | 40% | 40% | 20% | 1.000 Tx/Monat, 100K€, 3 Monate positiv |
| 3 – Etabliert | 20% | 60% | 20% | 5.000 Tx/Monat, 500K€, 6 Monate positiv |

---

## Offene Punkte (nächste Phase)
- [ ] SADB: Neue Kacheln für Innovation Fund + Flex Pool
- [ ] EDB: Spalten hui_company_eur / impact_pool_eur / innovation_fund_eur
- [ ] Automation: Monatliche KPI-Evaluation (1. jeden Monats)
- [ ] rpc_evaluate_phase_transition() → automatischer Phasenwechsel
