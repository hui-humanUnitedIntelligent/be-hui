# HUI — ECONOMIC TRANSPARENCY
**Phase 7F.6 — Wie Geld auf HUI fließt**

---

> „Transparenz ist nicht Offenlegung aller Zahlen.
> Es ist: klare Regeln, die nicht brechen."

---

## Wie Geld auf HUI fließt

### Einnahmemodell

| Quelle | Betrag | Transparent? |
|--------|--------|-------------|
| Booking-Provision | Max. 10% des Buchungswerts | ✅ Öffentlich |
| Freiwillige Mitgliedschaft | Frei wählbar | ✅ Opt-in |
| Lokale Kulturförderung | Gemeinschafts-gesteuert | ✅ Öffentlich |
| Creator-Tools (Premium) | Flat Rate | ✅ Öffentlich |

### Was HUI NIEMALS tut

| Verboten | Technische Garantie |
|----------|---------------------|
| Bezahlte Sichtbarkeit | `NON_EXTRACTIVE_RULES.forbidden.paidVisibility` |
| Pay-to-Rank | `NON_EXTRACTIVE_RULES.forbidden.payToRank` |
| Werbeeinblendungen | Kein Ad-System vorhanden oder geplant |
| Nutzerdaten-Verkauf | Keine externe Analytics-Integration |
| Verified käuflich | Verified nur durch echte Zusammenarbeit |
| Discovery-Bias | `visibilityFairness()` — monatlich geprüft |

---

## Was Sichtbarkeit NIE beeinflusst

```javascript
NON_EXTRACTIVE_RULES.discoveryNeverAffectedBy = [
  'payment_history',      // Zahlungshistorie
  'booking_volume',       // Buchungsvolumen
  'subscription_tier',    // Mitgliedschaftsstufe
  'verified_status',      // Verified ≠ mehr Sichtbarkeit
  'platform_spending',    // Geldausgaben auf HUI
  'referral_revenue',     // Empfehlungs-Umsatz
]
```

Diese Liste ist öffentlich und unveränderlich.
Jede Änderung würde eine neue Version der Platform-Regeln erfordern — mit öffentlicher Kommunikation.

---

## Kulturelle Schutzmechanismen

| Mechanismus | System | Schwellenwert |
|------------|--------|---------------|
| Sichtbarkeits-Fairness | `visibilityFairness()` | Bias ≤ 15% |
| Einkommens-Konzentration | `economicDiversity()` | Gini ≤ 0.50 |
| Creator-Überlastung | `creatorSustainability()` | max 3 aktive Projekte |
| Booking-Velocity | `economicPressure()` | max 2 Buchungen/Woche/Creator |
| Zugangs-Hürde | `collaborationAccessibility()` | accessibility > 0.30 |

Wenn einer dieser Schwellenwerte überschritten wird:
- Intern: `econSafetyCheck()` schlägt Alarm
- Öffentlich: Kommunikation im nächsten Community-Update
- Keine stille Korrektur ohne Transparenz

---

## Fairness-Garantien

### Für Creators

1. Die Provision ist **immer maximal 10%** — nie mehr.
2. Sichtbarkeit hängt **ausschließlich** von kreativem Beitrag und Resonanz ab.
3. Wer weniger bucht, wird **nicht unsichtbarer**.
4. Wer pausiert, **verliert keine Discovery-Qualität**.
5. Preise werden **vollständig vom Creator bestimmt** — HUI setzt keine Mindest- oder Maximalpreise.

### Für die Gemeinschaft

1. Keine Creator-Gruppe erhält systematisch mehr Sichtbarkeit durch Zahlung.
2. Lokale Kulturförderungs-Mittel werden **gemeinschaftlich entschieden**.
3. Jährlicher **öffentlicher Wirtschaftsbericht** (aggregiert, nie individual).
4. Wenn `econSafetyCheck()` kritisch: **öffentliche Kommunikation innerhalb 30 Tagen**.

---

## Was zukünftig nie eingeführt wird

HUI verpflichtet sich öffentlich: Diese Systeme werden **niemals** eingeführt:

```
❌ Boosted Posts / Promoted Content
❌ Paid Discovery Slots
❌ Premium Visibility Tiers
❌ Creator Revenue Shares based on Platform Metrics
❌ Algorithmic Prioritization for paid users
❌ Advertising of any kind
❌ Data Brokerage
```

Jede Abweichung davon würde eine öffentliche Community-Abstimmung erfordern.
