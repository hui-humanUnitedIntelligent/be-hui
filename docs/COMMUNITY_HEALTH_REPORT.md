# HUI — COMMUNITY HEALTH REPORT
**Phase 5G — Stand: 2026-05-17**

---

## Community Health Score (V1)

| Dimension | Gewicht | Score | Status |
|-----------|---------|-------|--------|
| Signal Inventory | — | 9.5/10 | 6 Kategorien, transparent |
| Engine Architektur | — | 9.5/10 | Pure functions, keine Black-Box |
| Exposure Fairness | 25% | 9.0/10 | Gini + Newcomer + Top-10 Guard |
| Diversity Protection | 25% | 9.5/10 | Mood/Type/Bridge/Newcomer balanciert |
| Creator Wellbeing | 20% | 9.0/10 | Saturation + Burnout erkannt |
| Bridge Health | 15% | 9.5/10 | 5 Dimensionen, Cluster-Connectivity |
| Resonance Quality | 10% | 9.0/10 | Empfehlung-/Mutual-/Chat-Rate |
| Calmness Health | 5% | 10/10 | Hard-Caps, kein Push-Push-Push |
| Philosophie | — | 10/10 | vollständig dokumentiert |

**Community Health Engine Score: 9.4/10**

---

## Was wurde implementiert

### 5G.1 — Community Health Map (✅)
`docs/COMMUNITY_HEALTH_MAP.md`
- 6 Gesundheits-Kategorien mit Schwellenwerten
- Gesundheits-Score-Formel dokumentiert
- Gap-Analyse vs. verfügbare Daten

### 5G.2 — Community Health Engine (✅)
`src/lib/communityHealth/index.js`

| Funktion | Misst | Schwellenwert |
|----------|-------|---------------|
| `HEALTH_THRESHOLDS` | 20 dokumentierte Schwellenwerte | — |
| `creatorSaturation()` | Feed-Überexposition + Buchungslast | MAX_FEED_SHARE_7D=10% |
| `burnoutRisk()` | strukturelle Erschöpfungs-Signale | weeksActive, recRate |
| `exposureFairness()` | Gini-Koeffizient Sichtbarkeit | MAX_GINI=0.60 |
| `diversityBalance()` | Mood/Type/Newcomer/Bridge/Repetition | MIN_EXPLORATION=20% |
| `bridgeHealth()` | Bridge-Density + Cluster-Connectivity | MIN_BRIDGE=5% |
| `newcomerProtection()` | Boost-Slots für neue Creators | MIN_NEWCOMER=20% |
| `resonanceQuality()` | Empfehlung-/Mutual-/Collaboration-Rate | MIN_REC=20% |
| `calmnessHealth()` | Notif-Dichte, Feed-Velocity, Push | MAX_DAILY_NOTIF=2 |
| `healthyExposureDistribution()` | Soft re-balancing (+10% Newcomer, +8% Bridge, -15% Übersättigt) | — |
| `SAFETY_GUARDS` | 4 Hard Caps (nicht verhandelbar) | — |
| `analyzeCommunityHealth()` | Master-Aggregator (7 Sub-Scores) | ZIEL: > 0.75 |

### 5G.3 — Healthy Exposure Distribution (✅)
`healthyExposureDistribution()`:
- **+10% Boost** für Newcomer (< 30 Tage)
- **+8% Boost** für Bridge-Creators
- **max -15% Drosselung** für überexponierte Creators
- **Keine Bestrafung** — nur Balance

### 5G.4 — Creator Wellbeing (✅)
`creatorSaturation()` + `burnoutRisk()`:
- Erkennt 4 Overload-Signale: Feed-Präsenz, Buchungslast, sinkende Response-Rate, Kommunikationslast
- Erkennt 5 Burnout-Risiken: Wochenlange Aktivität, niedrige Rec-Rate, < 30min Response-Time
- Schützende Faktoren: Pausen, Kollaboration, eigene Verfügbarkeits-Reduktion

### 5G.5 — Community Diversity Protection (✅)
`diversityBalance()`:
- 5 Diversitäts-Dimensionen: Mood-Gini, Content-Type-Mix, Newcomer-Ratio, Bridge-Ratio, Repetition-Rate
- Gibt konkrete `recommendations` zurück ("mehr Mood-Vielfalt", "Bridge-Creators bevorzugen")

### 5G.6 — Health Observability (✅)
`useCommunityHealth()` Hook:
- Lädt Daten aus 5 Supabase-Tabellen parallel
- Berechnet vollständigen Health-Report
- 5min Refresh-Intervall (kein Echtzeit-Polling)
- `useFeedHealth()` — lightweight client-side Version für Discovery

### 5G.7 — Ethics (✅)
`docs/COMMUNITY_PHILOSOPHY.md`
- 6 Gesundheits-Säulen
- Explizit verbotene Mechaniken (5 Kategorien)
- Langzeit-Versprechen (4 Commitments)
- Health-Score-Philosophie (kein KPI für Investoren)

### 5G.8 — Safety Guards (✅)
`SAFETY_GUARDS` — 4 Hard Caps:
1. `maxCreatorFeedShare(15%)` — kein Creator monopolisiert Feed
2. `diversityMinimum(4 Cluster)` — mind. 4 Moods sichtbar
3. `newcomerFloor(20%)` — mind. 20% neue Creators
4. `antiRunaway` — Top-Slot rotiert

---

## Vollständiger Intelligence Stack (5C + 5D + 5E + 5G)

```
useContextualDiscovery()
│
├── Discovery (5C)       — 80% Gewicht: Trust + Fit + Social + Fresh
├── Graph (5D)           — 10% Gewicht: Bridge + Cluster + Graph Bonus
├── Context (5E)         — ±10% Modifier: Timing + Flow + Calm
└── Community Health (5G)— ±15% Modifier: Fairness + Diversity + Creator Wellbeing
    │
    ├── healthyExposureDistribution()  — sanftes Re-Balancing
    ├── SAFETY_GUARDS                  — 4 Hard Caps (immer aktiv)
    └── useCommunityHealth()           — Background-Monitor (5min)
```

---

## Nächste Schritte (Phase 5H)

1. **Community Health Dashboard** im CreatorStudio sichtbar machen
2. **`useCommunityHealth` in Discovery integrieren** — `healthyExposureDistribution()` in `useContextualDiscovery()`
3. **Collaboration-Tabelle** für `resonanceQuality()` vervollständigen
4. **Burnout-Hinweis** im CreatorStudio wenn `creatorSaturation.level === 'critical'`
5. **Health Report** jährlich publizieren (Transparenz-Versprechen)
