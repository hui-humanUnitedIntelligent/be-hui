# HUI — PRESENCE SYSTEM MAP
**Phase 6F.1 — Kreative Präsenz statt Creator-Profil**

---

> „Ein Profil zeigt was jemand ist.
> Eine Präsenz zeigt wie jemand schafft."

---

## Was ist kreative Präsenz?

Kreative Präsenz ist nicht:
- eine Sammlung von Leistungen
- ein Follower-Count
- eine Selbstbeschreibung
- ein Skill-Set

Kreative Präsenz ist:
die Art wie jemand in der Welt kreativ wirkt —
erkennbar durch Zusammenarbeit, Resonanz und Zeit.

---

## Die 9 Dimensionen kreativer Präsenz

### 1. Kreative Handschrift
*Was macht jemanden unverwechselbar?*

Entsteht aus: Werkstil, DNA-Tags, wiederkehrenden Themen, Materialien.
Nicht selbst deklariert — durch Werke spürbar.
```
Signal: dna_tags + work.mood + work.category patterns
Sichtbar: als atmosphärische Qualität, nicht als Liste
```

### 2. Resonanzenergie
*Wie viel echte Resonanz erzeugt jemand?*

Nicht: Reichweite. Nicht: Likes.
Sondern: tiefe Verbindungen die entstehen.
```
Signal: recommendations_count / completed_collabs (Qualitäts-Ratio)
Nicht sichtbar als Zahl — als Textur erfahrbar
```

### 3. Atmosphärische Präsenz
*Welche Stimmung bringt jemand in einen Raum?*

Entsteht aus: Mood-Tags, Kollaborationsstil, Schreibweise.
Wie fühlt es sich an mit dieser Person zu arbeiten?
```
Signal: collab_mood + mood_tags + bio-Tonalität
Sichtbar: als atmosphärische Farbe / Energie
```

### 4. Kollaborationsstil
*Wie arbeitet jemand mit anderen?*

Ruhig vs. intensiv. Führend vs. folgend.
Prozess-orientiert vs. ergebnis-orientiert.
Verfügbarkeit und Rhythmus.
```
Signal: COLLAB_MOODS + response_rate + booking patterns
Sichtbar: als menschliche Beschreibung
```

### 5. Kreative Entwicklung
*Wohin bewegt sich jemand?*

Vertieft jemand seine Praxis? Wechselt er Felder?
Baut er Brücken? Gibt er weiter?
```
Signal: journey_phase + domain_transitions + mentoring
Sichtbar: als aktuelle Phase (nicht als Level)
```

### 6. Emotionale Kontinuität
*Wie ist jemand über Zeit präsent?*

Manche sind intensiv präsent — dann wieder weg.
Manche sind konstant, leise präsent.
Beides ist wertvoll. Beides ist sichtbar.
```
Signal: activity_rhythm + pause_patterns + seasonal_activity
Sichtbar: als Rhythmus-Beschreibung
```

### 7. Kreative Haltung
*Was leitet jemanden?*

Handwerk vs. Experiment. Gemeinschaft vs. Einsamkeit.
Lokales vs. Universales. Slow vs. Fast.
```
Signal: focus_type + bio-Themen + collaboration_count
Sichtbar: als Haltungs-Signatur
```

### 8. Lokale Verwurzelung
*Wo ist jemand wirklich präsent?*

Nicht nur: Wohnort.
Sondern: lokale kreative Verbindungen.
```
Signal: location_label + local_collaborations + local_events
Sichtbar: als lokale Präsenz-Qualität
```

### 9. Interdisziplinäre Bewegung
*Welche Welten verbindet jemand?*

Brücken zwischen visuell und akustisch.
Zwischen digital und handgemacht.
Zwischen lokal und global.
```
Signal: bridge_score + domain_diversity + collab_domains
Sichtbar: als Brücken-Qualität
```

---

## Presence vs. Profile — der Unterschied

| Profil | Präsenz |
|--------|---------|
| Statisch | Entwickelt sich |
| Selbst deklariert | Durch Resonanz entstanden |
| Liste von Skills | Atmosphärische Qualität |
| Follower-Anzahl | Resonanz-Tiefe |
| Leistungs-orientiert | Prozess-orientiert |
| Marke | Mensch |
| Performance | Authentizität |
| Sichtbarkeit | Verbindung |

---

## Presence Layers (Technisch)

```
src/lib/presence/
  index.js          → presenceProfile(), resonanceSignature()
                      collaborationStyle(), atmosphericIdentity()
                      creativeRhythm(), creativeContinuity()
                      expressionField(), usePresence()
```

Alle Systeme nutzen:
- `trustContext.js` → REPUTATION_QUALITIES, COLLAB_MOODS
- `journeyContext.js` → JOURNEY_STAGES, SOFT_STATUS
- `atmosphere/index.js` → MOOD_ATMOSPHERES, AMBIENT_STATES
- `creativeJourney/index.js` → JOURNEY_PHASES, detectJourneyPhase()
- `graph/index.js` → creativeResonance(), collaborationDepth()
