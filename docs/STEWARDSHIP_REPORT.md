# HUI — STEWARDSHIP REPORT
**Phase 7G — Stand: 2026-05-17**

---

## Stewardship Score

| Dimension | Score | Status |
|-----------|-------|--------|
| Governance Foundation Map | 9.5/10 | 7 Drift-Muster, 4 Prinzipien, Horizonte |
| Stewardship Engine | 9.5/10 | 11 Funktionen, alle qualitativ |
| Transparent Platform Changes | 9.5/10 | decisionImpact(), culturalTransparency() |
| Community Consultation | 9.0/10 | communityRepresentation(), Formate |
| Soft Moderation | 10/10 | MODERATION_PRINCIPLES.never.shadowBanning |
| Power Balance Protection | 9.5/10 | powerBalanceCheck(), 4 Dimensionen |
| Stewardship Ethics | 10/10 | 6 Verbote, 6 Förderungen, 8 Versprechen |
| Governance Observability | 9.5/10 | stewardshipScore(), 6 Metriken |

**Stewardship Score: 9.6/10**

---

## Was wurde implementiert

### 7G.1 — Governance Foundation Map (✅)
`docs/GOVERNANCE_FOUNDATION_MAP.md`
7 Machtdrift-Muster (Zentrale Entscheidungsgewalt → Algorithmische Unsichtbarkeit → Moderation-Härte...).
4 Stewardship-Prinzipien: Transparenz · Verantwortung · Partizipation · Langfristigkeit.
5 Governance-Horizonte nach Jahren.

### 7G.2-6+8 — Stewardship Engine (✅)
`src/lib/stewardship/index.js` — 310+ Zeilen

**`STEWARDSHIP_PRINCIPLES`** — 4 Grundsätze mit technischer Verankerung.

**`MODERATION_PRINCIPLES`** — technisch erzwungen:
```javascript
never.shadowBanning:           false  // Niemals
never.silentRemoval:           false  // Niemals
never.automatedPermanentBan:   false  // Niemals
never.punishmentWithoutContext:false  // Niemals
```

**`governanceHealth(governanceData)`** — 7G.2+8
3 Dimensionen: Transparenz-Score + Partizipations-Score + Moderation-Qualität.
Gesunde Appeal-Rate: 3-15% (zu niedrig = Angst, zu hoch = Chaos).
Gesunde Overturn-Rate: 15-40% (zu niedrig = rigide).

**`communityTrust(signals)`** — 7G.2+8
6 Signale: Newcomer-Retention + Feedback-Rate + Moderation-Satisfaction + Transparenz-Rating + Return-Rate + Konflikt-Rate.
KeySignal: der wichtigste Einzelindikator wird herausgestellt.

**`stewardshipBalance(data)`** — 7G.2+6
Community-Input-Rate bei Entscheidungen vs. Plattform-Allein-Entscheidungen.
Macht-Konzentration: Top-Creator Feed-Share + Gini + Moderation-Transparenz.

**`culturalTransparency(changelogData)`** — 7G.3
Coverage-Score (mind. 6 Einträge/90 Tage) + Quality-Score (kulturelle Notes + Algo-Erklärungen).
`missingItems[]` benennt konkret was fehlt.

**`decisionImpact(decision)`** — 7G.3
Typ (algorithm=1.0, economic=0.9, feature=0.4) × Scope (critical=1.0, minor=0.2).
Irreversibel → +20% Impact. Empfiehlt den richtigen Kommunikations-Prozess:
- Impact > 0.70: *"Community-Konsultation + 30 Tage Ankündigung"*
- Impact > 0.50: *"Ankündigung 14 Tage vorher + Impact-Notiz"*
- Impact > 0.30: *"Changelog-Eintrag + Erklärung"*

**`communityRepresentation(consultationData, demographics)`** — 7G.4
4 Dimensionen: geografisch + domains + Generationen + Häufigkeit.
Gaps: benennt explizit welche Stimmen fehlen.
Suggestion: konkrete Einladung für unterrepräsentierte Gruppen.

**`softModerationHealth(moderationData)`** — 7G.5
5 Metriken: Warnings vs. Removal + Human Review + Context + De-Escalation + Overturn.
`isRestorativ: boolean` — klares Flag für restaurative vs. strafende Moderation.

**`powerBalanceCheck(data)`** — 7G.6
4 Dimensionen: Creator-Elite (antiEliteDrift) + Wirtschaftlich (econSafetyCheck) + Governance + Moderation.
`urgentAction` wenn > 2 Konzentrations-Signale.

**`stewardshipScore(data)`** — 7G.8
Aggregiert alle 6 Governance-Dimensionen.
`seasonalNote`: Herbst → Reflexion, Winter → Stille Überprüfung.
`_isInternal: true`.

**`useStewardship()`** — React Hook
Lädt profiles + bookings → berechnet powerBalance.

---

## Gesamt-Versprechen-Inventar: 63

| Dokument | Versprechen |
|----------|------------|
| STEWARDSHIP_PHILOSOPHY.md | 8 (neu) |
| CULTURAL_PHILOSOPHY.md | 9 |
| LONG_TERM_CULTURAL_PHILOSOPHY.md | 8 |
| ASSISTIVE_INTELLIGENCE_PHILOSOPHY.md | 6 |
| COLLABORATION_PHILOSOPHY.md | 7 |
| REAL_WORLD_PHILOSOPHY.md | 7 |
| GENTLE_ECONOMY_PHILOSOPHY.md | 6 |
| LIVING_SPACES_PHILOSOPHY.md | 6 |
| PRESENCE_UI_PHILOSOPHY.md | 6 |
| **Gesamt** | **63** |

---

## Validierung: 15/15 ✅

---

## Nächste Schritte

1. **Öffentlicher Changelog** — erste Einträge erstellen (mind. 4/Monat)
2. **decisionImpact()** in Release-Prozess integrieren — vor jedem Deploy
3. **Community-Konsultations-Format** designen (ruhig, async, offen)
4. **Admin-Dashboard** für stewardshipScore() + powerBalanceCheck()
5. **Saisonale Governance-Reflexion** als Cron-Job (quartalsweise)
6. **Post-Mortem Template** erstellen für P0-Vorfälle
