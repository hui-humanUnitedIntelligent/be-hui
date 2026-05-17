# HUI — HEALTH INTEGRATION PHILOSOPHY
**Phase 5H.8 — Gesundheit als Discovery-Prinzip**

---

> „Die beste Plattform ist nicht die, die am meisten misst —
> sondern die, die das Richtige misst."

---

## Das Integrationsversprechen

Community Health fließt in Discovery ein — **sanft, transparent, capped**.

Das bedeutet:
- Kein Creator wird unsichtbar gemacht
- Kein Creator wird "bestraft"
- Keine geheimen Drosselungen
- Kein Shadowban-System

Das bedeutet stattdessen:
- Neue Creators bekommen faire Chancen (+10% Boost)
- Bridge-Creators werden leicht bevorzugt (+8%)
- Überexponierte Creators werden sanft balanciert (-15% max)
- Diverse Feeds werden aktiv gefördert

---

## Die 4-Schichten-Architektur

```
Discovery (5C)         75%   — Kern: Trust + Fit + Social + Fresh
Human Graph (5D)       10%   — Ergänzung: Bridge + Cluster + Nähe
Context (5E)          ±10%   — Timing: Flow + Calmness + Moment
Community Health (5G) ±15%   — Gesundheit: Fairness + Wellbeing
                       ↑
              Kein Schicht dominiert die andere.
              Alle arbeiten zusammen.
```

**Gesamt = immer 100%.** Nicht mehr, nicht weniger.

---

## Verbotene Mechaniken

### ❌ Versteckte Bestrafung
Kein Creator erfährt eine Sichtbarkeits-Reduktion ohne dass das System
diese offen dokumentiert hätte.

Die Score-Formel ist öffentlich:
```
finalScore = clamp(baseScore + healthMod, 0.05, 1.00)
healthMod  = clamp(sum(modifiers), -0.15, +0.10)
```

### ❌ Manipulative Sichtbarkeit
Kein Creator wird bevorzugt weil er:
- Geld zahlt
- Mehr postet
- Algorithmisc­h wertvoll ist für Wachstums-KPIs

### ❌ Künstliche Drosselung
Das Floor-Score-Prinzip ist unverhandelbar:
```javascript
const FLOOR_SCORE = 0.05;  // niemand unter 5% Sichtbarkeit
```

Ein Creator der 0.05 bekommt ist immer noch im Feed.
Er wird nicht versteckt — er wird balanciert.

### ❌ Creator-Kontrolle durch Algorithmus
Creator entscheiden selbst:
- ob sie verfügbar sind
- wann sie pausieren
- wie viel sie posten
- wann sie antworten

Der Algorithmus kann nie einen Creator zwingen.
Er kann nur — sehr sanft — die Sichtbarkeit formen.

### ❌ Algorithmischer Druck
Das Wellbeing-System darf nie Druck erzeugen.

`CreatorWellbeingHint` erscheint:
- max. 1× pro 7 Tage
- erst nach 3s Verzögerung (nicht sofort)
- kann immer geschlossen werden
- mit unterstützender Sprache (nicht mahnend)

---

## Was wir belohnen (und warum)

### ✅ Kreative Nachhaltigkeit
Creator die über Monate konsistent qualitative Arbeit zeigen,
bauen echtes Vertrauen auf. Das kommt ihnen zugute.
Nicht weil der Algorithmus es erzwingt — sondern weil Vertrauen
im Trust-Weight (5C) sich akkumuliert.

### ✅ Balance statt Dominanz
Ein Creator der 15% des Feeds belegt ist nicht mehr
sichtbar als einer der 5% belegt — wenn die 5% qualitativ sind.
Anti-Monopoly-Modifier sorgen dafür.

### ✅ Community-Gesundheit als Eigeninteresse
Ein gesundes Netzwerk ist im Interesse aller Creator.
Wenn das Netzwerk gesund ist:
- gibt es mehr Discovery-Möglichkeiten
- gibt es mehr potenzielle Kunden
- gibt es mehr Kollaborations-Partner
- gibt es weniger Burnout

### ✅ Resonanzqualität als Langzeit-Kapital
Eine Empfehlung nach einer abgeschlossenen Buchung ist mehr wert
als 100 Likes. Das Trust-Weight spiegelt das.

---

## Transparenz-Mechanismen

### Score Breakdown (Debug-Modus)
Jedes Feed-Item kann seinen Score-Breakdown zeigen:
```javascript
item._breakdown = {
  baseScore:  0.72,   // Discovery + Graph + Context
  satMod:    -0.05,   // Saturation Dampening
  divMod:    +0.03,   // Diversity Boost
  newMod:     0.00,   // Newcomer (nicht applicable)
  bridgeMod: +0.05,   // Bridge Creator Boost
  monoMod:    0.00,   // Anti-Monopoly (nicht applicable)
  calmMod:   +0.01,   // Calmness Preference
  finalScore: 0.76,
}
```

### Self-Healing Audit-Log
Wenn Self-Healing aktiv ist:
```javascript
healingStatus = {
  severity: 'moderate',
  actions: [
    { action: 'newcomer_boost', reason: 'Newcomer-Integration zu niedrig' }
  ],
  params: { explorationRatio: 0.30 }
}
```

Das System ist nie eine Blackbox.

---

## Jährlicher Gesundheits-Report

HUI verpflichtet sich zu einem jährlichen öffentlichen Health-Report:
- Community Health Score (Trend über 12 Monate)
- Bridge-Density-Entwicklung
- Newcomer-Integration-Rate
- Resonanz-Qualitäts-Entwicklung
- Änderungen an Schwellenwerten (mit Begründung)

Kein Wachstums-Report. Ein Gesundheits-Report.
