# HUI — COMMUNITY HEALTH MAP
**Phase 5G.1 — Stand: 2026-05-17**

> Eine gesunde Community wächst nicht schnell —
> sie wächst nachhaltig.
> HUI misst keine Aktivität. HUI misst Resonanz.

---

## Das Gesundheits-Prinzip

Plattform-Gesundheit wird traditionell gemessen an:
- DAU/MAU (Daily/Monthly Active Users)
- Screen Time
- Session Länge
- Scroll-Tiefe
- Benachrichtigungs-Öffnungsrate

**HUI misst nichts davon.**

HUI misst:
- Resonanzqualität zwischen Menschen
- Fairness der Sichtbarkeit
- Nachhaltige Kollaborationstiefe
- Community-Diversität
- Kreative Energie über Zeit

---

## 1. Network Health Signals

| Signal | Quelle | Bedeutung | Gesundes Niveau |
|--------|--------|-----------|----------------|
| Bridge Density | Graph Engine | Anteil Bridge-Creators | > 5% der aktiven Creator |
| Mutual Follow Rate | `follows` | Gegenseitigkeit | > 15% der Follows |
| Cluster Isolation | Graph Clusters | Cluster verbinden sich | < 3 isolierte Cluster |
| Newcomer Integration | Profile `created_at` | Neue bekommen Verbindungen | > 30% in 30 Tagen |
| Connection Balance | Follow-Verteilung | Kein Creator dominiert | Top-10 < 40% aller Follows |
| Graph Diameter | längste Verbindung | niemand isoliert | max. 4 Hops |

---

## 2. Discovery Health Signals

| Signal | Schwellenwert | Problem | Reaktion |
|--------|--------------|---------|---------|
| Creator Exposure Gini | < 0.6 | Konzentration | Diversity Boost |
| Repetition Rate | < 25% gleiches Gesicht | Ermüdung | Anti-Repetition verschärfen |
| Discovery Fatigue | Session < 5min abgebrochen | schlechter Moment | Calm Mode |
| Exploration Ratio | > 20% unbekannte Creator | Filterblasen | Exploration Injection |
| Popularity Runaway | Top-1 Creator < 15% Feed | Monopol | Hard Cap |

---

## 3. Creator Health Signals

| Signal | Erkennungs-Proxy | Risiko | HUI-Reaktion |
|--------|-----------------|--------|-------------|
| Overexposure | > 3× Feed-Share in 7 Tagen | Burnout-Risiko | sanftes Throttling |
| Response Overload | Buchungsrate > 80% Kapazität | Überforderung | Verfügbarkeit prüfen |
| Interaction Saturation | > 50 Empfehlungs-Anfragen/Monat | Erschöpfung | kein weiterer Push |
| Trust Fatigue | Response-Rate sinkt trotz Anfragen | Rückzug | Sichtbarkeit reduzieren |
| Collaboration Imbalance | gibt immer, nimmt nie | Energie-Imbalance | Kollaborations-Einladungen |

---

## 4. Community Energy Signals

| Signal | Messung | Bedeutung |
|--------|---------|-----------|
| Resonance Quality | Empfehlungen / Buchungen | wie viele Buchungen enden in Empfehlung |
| Collaboration Depth | Repeat Collaborations | Tiefe statt Breite |
| Return Rate | Creators kehren zurück | Plattform-Vertrauen |
| Creative Output Trend | Works über Zeit | wächst das kreative Volumen? |
| Long-term Engagement | Creators > 6 Monate aktiv | Nachhaltigkeit |

---

## 5. Fairness Signals

| Signal | Gut | Problem | Reaktion |
|--------|-----|---------|---------|
| Newcomer Visibility | Top-20% sichtbar in 30 Tagen | < 10% → Starvation | Cold-Start Boost |
| Cluster Fairness | alle Cluster vertreten | 1 Cluster > 60% | Rotation |
| Bridge Creator Visibility | Bridge in Top-30 | keine Bridges sichtbar | Bridge Amplification |
| Minority Cluster Exposure | kleine Cluster bekommen Slots | < 5% → Invisibility | Diversity Minimum |
| Algorithmic Concentration | kein Creator systembegünstigt | 1 Creator immer oben | Hard Cap |

---

## 6. Calmness Signals

| Signal | Gut | Problem | Reaktion |
|--------|-----|---------|---------|
| Feed Velocity | ruhig, keine Hektik | zu viele neue Items/min | Slow Feed |
| Interaction Saturation | User wählt selbst | System drängt | Stop Pushing |
| Scroll Pressure | kein Infinite Loop | endloser Feed | Breathing Points |
| Context Exhaustion | kurze Sessions ok | Session immer länger | Overstimulation Guard |
| Notification Density | 0-2/Tag | > 5/Tag → Spam | Hard Cap Notifs |

---

## Gesundheits-Score-Formel (V1)

```
COMMUNITY_HEALTH = (
  network_health    * 0.25 +   // Verbindungsqualität
  discovery_fairness* 0.25 +   // Sichtbarkeits-Gerechtigkeit
  creator_wellbeing * 0.20 +   // Creator werden nicht verbrannt
  diversity         * 0.15 +   // kreative Vielfalt
  resonance_quality * 0.10 +   // echte Resonanz
  calmness          * 0.05     // Plattform-Ruhe
)
Skala: 0–1 | Ziel: > 0.75
```

---

## Datenpunkte (verfügbar)

| Datenpunkt | Quelle | Verfügbar |
|------------|--------|-----------|
| follows | `public.follows` | ✅ nach Migration 032 |
| bookings | `public.bookings` | ✅ |
| recommendations | `public.recommendations` | ✅ |
| profiles | `public.profiles` | ✅ |
| works | `public.works` | ✅ |
| graph health | `follow_graph_health` View | ✅ |
| cluster memberships | Graph Engine | ✅ client-side |
| bridge scores | Graph Engine | ✅ client-side |
| session signals | sessionStorage | ✅ client-side |
| discovery health | `analyzeDiscoveryHealth()` | ✅ |
| network health | `analyzeNetworkHealth()` | ✅ |
