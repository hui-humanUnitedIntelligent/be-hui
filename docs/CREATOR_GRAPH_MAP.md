# HUI — CREATOR GRAPH MAP
**Phase 5D.1 — Stand: 2026-05-17**

> Kein Influencer-System. Kein Social-Ranking.
> HUI versteht: wie kreative Beziehungen entstehen und wachsen.

---

## Das Grundprinzip

Ein kreatives Netzwerk ist kein Follower-Graph.
Es ist ein Resonanz-Netz.

Menschen verbinden sich durch:
— was sie schaffen
— wie sie zusammenarbeiten
— was sie berührt
— wen sie vertrauen
— wo sie kreativ aufeinandertreffen

**HUI misst Resonanz — nicht Reichweite.**

---

## 1. Direct Human Signals

Explizite Handlungen zwischen zwei Menschen.

| Signal | Tabelle/Quelle | Kanten-Typ | Stärke | Bidirektional? |
|--------|----------------|------------|--------|----------------|
| Follow | `follows` (follower_id → following_id) | gerichtet | Mittel | Nein |
| Mutual Follow | `follows` (beide Richtungen) | ungerichtet | Hoch | Ja |
| Chat geöffnet | `conversations`/`chats` | gerichtet | Mittel | Nein |
| Repeat Chat | mehrere Messages in Konversation | ungerichtet | Hoch | Ja |
| Booking gesendet | `bookings` (client_id → wirker_id) | gerichtet | Hoch | Nein |
| Booking abgeschlossen | `bookings` (status=completed) | ungerichtet | Sehr hoch | Ja |
| Repeat Booking | Mehrfach gleiche zwei Personen | ungerichtet | Sehr hoch | Ja |
| Empfehlung | `recommendations` (reviewer → recipient) | gerichtet | Sehr hoch | Nein |
| Gegenseitige Empfehlung | beide Richtungen | ungerichtet | Maximal | Ja |
| Collaboration | `chats` (type=collaboration) | ungerichtet | Sehr hoch | Ja |
| Profil-Besuch | client-side (sessionStorage) | gerichtet | Niedrig | Nein |

### Kantengewichte (normalisiert 0–1)
```
Gegenseitige Empfehlung  ████████████  1.0
Repeat Booking           ███████████░  0.9
Abgeschlossene Buchung   ██████████░░  0.8
Collaboration-Chat       █████████░░░  0.75
Empfehlung (einseitig)   ████████░░░░  0.65
Repeat Chat              ███████░░░░░  0.55
Mutual Follow            █████░░░░░░░  0.45
Booking gesendet         ████░░░░░░░░  0.35
Chat geöffnet            ███░░░░░░░░░  0.25
Follow (einseitig)       ██░░░░░░░░░░  0.20
Profil-Besuch            █░░░░░░░░░░░  0.05
```

---

## 2. Creative Resonance Signals

Strukturelle Ähnlichkeiten die Verbindungen wahrscheinlicher machen.

| Signal | Quelle | Resonanz-Typ |
|--------|--------|--------------|
| Gleicher Mood-Cluster | `profiles.mood` / Works | kreative Sprache |
| Überlappende DNA-Tags | `profiles.dna_tags` | kreative Identität |
| Ergänzende Focus-Types | `profiles.focus_type` | komplementäre Kraft |
| Ähnliche Talent-Nischen | `profiles.talent` | professionelle Resonanz |
| Gleiche Erlebnis-Typen | `experiences.type` | Format-Affinität |
| Ähnliche Story-Themen | `stories.tags` | narrative Resonanz |
| Lokale Nähe | `profiles.location_label` | geografische Energie |

### Resonanz-Matrix (Mood-Cluster)
```
kreativ    ↔ inspirierend, authentisch, warm
ruhig      ↔ authentisch, nachhaltig, kontemplativ
warm       ↔ authentisch, inspirierend, ruhig
professionell ↔ authentisch, kreativ, nachhaltig
authentisch ↔ alle Cluster (universeller Brücken-Mood)
inspirierend ↔ kreativ, warm, abenteuerlich
nachhaltig ↔ ruhig, authentisch, warm
```

---

## 3. Trust Graph Signals

Vertrauens-Kanten im Netzwerk.

| Signal | Quelle | Vertrauens-Typ |
|--------|--------|----------------|
| Verifizierte Empfehlung | `recommendations` + Buchungsabschluss | maximal |
| Gegenseitige Empfehlung | beide Richtungen | partnerschaftlich |
| Wiederholte Zusammenarbeit | Mehrfach-Bookings | langfristig |
| Collaboration-Abschluss | `chats.type=collaboration` abgeschlossen | bewährt |
| Response-Konsistenz | `profiles.response_rate` > 80% | verlässlich |
| Completion-Rate | `profiles.total_bookings_completed` / Anfragen | professionell |

---

## 4. Community Signals (Soft Clusters)

Kreative Ökosysteme — keine harten Grenzen.

Menschen gehören mehreren Clustern an. Das ist gewollt.

| Cluster-Typ | Bildungsprinzip | Beispiele |
|-------------|----------------|-----------|
| Mood-Cluster | primärer Mood des Profils | "ruhige Kreative", "warme Erzähler" |
| Nischen-Cluster | dominante DNA-Tags | "Holzhandwerk", "Vocal-Coaching" |
| Lokale Cluster | `location_label` | "Berlin Kreative", "München Handwerk" |
| Format-Cluster | focus_type Kombination | "Works-Focused", "Experience-First" |
| Kollaborations-Cluster | gemeinsame Zusammenarbeits-Historien | organisch gewachsen |

### Soft Cluster Membership (0–1, nicht binär)
```
Creator A:
  mood-cluster "kreativ":        0.85  (primär)
  mood-cluster "inspirierend":   0.60  (sekundär)
  nischen-cluster "Fotografie":  0.90  (stark)
  nischen-cluster "Storytelling":0.45  (schwach)
  lokal-cluster "Hamburg":       1.00  (eindeutig)
```

---

## 5. Temporal Signals

Wie Beziehungen sich über Zeit entwickeln.

| Signal | Bedeutung | Gewicht |
|--------|-----------|---------|
| Erste Interaktion < 30 Tage | neue Verbindung | niedrig |
| Regelmäßige Interaktionen | stabile Verbindung | hoch |
| Wachsende Interaktionsfrequenz | aufblühende Beziehung | sehr hoch |
| Pause + Rückkehr | langfristige Bindung | sehr hoch |
| Abnehmende Interaktion | schwindende Verbindung | niedrig |

---

## Graph-Gesundheit — Was wir überwachen

```
POPULARITY RUNAWAY:    Einzelne Knoten dominieren Graph
CLUSTER ISOLATION:     Cluster verbinden sich nicht
EMPFEHLUNGS-INZUCHT:  Empfehlungen nur innerhalb kleiner Kreise
NEWCOMER STARVATION:  Neue Creators werden nicht eingebunden
BRIDGE COLLAPSE:       Verbindende Menschen verlassen die Plattform
TRUST MONOPOLY:        Vertrauen konzentriert sich auf wenige
```

---

## Verfügbare Daten vs. Benötigte Daten

### Jetzt verfügbar (aktiv in Supabase)
- `bookings`: client_id, wirker_user_id, status, created_at ✅
- `recommendations`: reviewer_id, recipient_id, text, created_at ✅
- `profiles`: dna_tags, focus_type, mood, location_label, talent ✅
- `conversations`/`chats`: participant_ids, type ✅

### Noch nicht erfasst (Phase 5E Potenzial)
- `follows` Tabelle: im Code referenziert, in DB noch nicht explizit ⚠
- Profil-Besuchs-Counter: client-side only ⚠
- Such-Queries: nicht persistiert ⚠
- Co-Follow-Graphen: nicht berechnet ⚠
- Story-Interaktionen: `story_views` vorhanden aber nicht ausgewertet ⚠
