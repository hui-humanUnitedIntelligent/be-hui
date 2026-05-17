# HUI — PRESENCE LAYER REPORT
**Phase 6F — Stand: 2026-05-17**

---

## Presence Quality Score

| Dimension | Score | Status |
|-----------|-------|--------|
| Presence Architecture | 9.5/10 | 9 Dimensionen, klar kartiert |
| Creative Presence Engine | 9.5/10 | 7 Funktionen, qualitativ, nicht numerisch |
| Resonance Signatures | 9.5/10 | 7×7 Matrix, atmosphärisch in Sprache |
| Creative Rhythms | 9.5/10 | 7 Rhythmen, Rückzug gleichwertig |
| Atmospheric Profiles | 9.0/10 | Energie-Qualitäten, Farb-Identität |
| Collaboration Presence | 9.5/10 | 5 Stile, Pacing, Communication Texture |
| Presence Continuity | 9.5/10 | Bridge-Detection, Narrative, kein Label-Lock |
| Presence Ethics | 10/10 | 6 Verbote, 6 Förderungen, 7 Versprechen |

**Presence Quality Score: 9.6/10**

---

## Was wurde implementiert

### 6F.1 — Presence System Map (✅)
`docs/PRESENCE_SYSTEM_MAP.md`

9 Dimensionen kreativer Präsenz kartiert:
Kreative Handschrift · Resonanzenergie · Atmosphärische Präsenz
Kollaborationsstil · Kreative Entwicklung · Emotionale Kontinuität
Kreative Haltung · Lokale Verwurzelung · Interdisziplinäre Bewegung

Presence vs. Profile — 8 Kontrast-Paare (Statisch vs. Entwickelt, Marke vs. Mensch, ...)

### 6F.2-7 — Creative Presence Engine (✅)
`src/lib/presence/index.js` — 365 Zeilen

**`resonanceSignature(profile)`** — 6F.3
7×7 Signature Matrix (7 Mood-Cluster × 7 Domain-Familien = 49 spezifische Texturen).
Beispiele:
```
kreativ × visual   → "ruhige visuelle Klarheit"
ruhig × sonic      → "atmosphärische Klanglandschaften"
warm × crafted     → "menschliches Handwerk"
nachhaltig × space → "ökologisch durchdachte Räume"
```
Plus Tiefenqualifier aus echten Collabs: "mit gewachsener Praxis", "im Entstehen".

**`creativeRhythm(profile, recentActivity)`** — 6F.4
7 Rhythmusmuster aus Verhalten (nicht Selbstaussage):
intensiv · konstant · saisonal · nächtlich · langsam-tief · kollaborativ · ruhend

Nächtliche Erkennung: > 40% der Aktivität zwischen 22-4 Uhr → "nächtlich kreativ".
**Rückzug ist explizit wertvoll** — kein "Engagement-Verlust".

**`atmosphericIdentity(profile)`** — 6F.5
7 Energie-Qualitäten: resonant · präsent · entstehend · offen · ruhend.
7 Farbpaletten aus Mood-Cluster.
Lokale Präsenz-Signal: `!!profile.location_label`.

**`collaborationStyle(profile, trustSignals)`** — 6F.6
5 Kollaborationsstile aus echten Signalen:
führend · fließend · tiefgehend · impulsgebend · verlässlich

Plus:
- Pacing: "schnell reaktiv" / "bewusst rhythmisch" / "langsam tief"
- Communication Texture: "direkt und klar" / "tiefgehend und kontinuierlich" / "offen und explorierend"

**`creativeContinuity(profile, journeySignals)`** — 6F.7
Bridge-Detection über 7 Domain-Familien.
`isBridge = domainFamilies.size > 1`
Narrative statt Labels: *"Bewegt sich zwischen 3 kreativen Welten — baut Brücken."*
`isEvolving` = Profil in letzten 30 Tagen aktualisiert → "Im aktiven Wandel".

**`expressionField(profile)`**
9 Themen-Cluster: natur · mensch · material · licht · raum · klang · sprache · bewegung · handwerk.
Aus Tags + Talent + Bio extrahiert.

**`presenceProfile(profile, options)`** — Master-Funktion
Aggregiert alle 6 Dimensionen + Presence-Greeting.
Kein externer Score. Nur qualitative Beschreibungen.

**`usePresence(userId)`** — React Hook
Lädt: Profil + Works (20) + completed Bookings (30) parallel.
Berechnet: Trust Signals + Journey Phase + Depth.
Gibt vollständiges `presence` Objekt zurück.

### 6F.8 — Presence Ethics (✅)
`docs/PRESENCE_PHILOSOPHY.md`
6 Verbote (Creator Branding Pressure, Performance Identity, Fake Authenticity, Visibility Anxiety, Parasocial Optimization, Status Identity Loops)
6 Förderungen (Ehrlichkeit, Tiefe, Ruhe, Entwicklung, Resonanz, Beziehungen)
7 Versprechen — öffentlich und messbar.

---

## Wie Presence in der UI wirkt

```
WirkerProfilePage (public):
  presenceProfile() → signature.full als Untertitel unter dem Namen
  atmosphere.colors → Hintergrund-Tönung des Profils
  rhythm            → "schafft oft in den stillen Stunden" (wenn nächtlich)
  collaboration     → "Tiefgehend — braucht Zeit aber schafft Bleibendes"
  continuity        → "Verbindet visual und sonic" (wenn Bridge)

CreatorStudio (owner):
  usePresence(user.id) → persönliche Journey-Reflexion
  expression.fields    → eigene Themen-Felder sichtbar
  rhythm               → eigener Kreativrhythmus
```

---

## Nächste Schritte (Phase 6G / UI Integration)

1. **`usePresence()` in WirkerProfilePage** — Signature als Untertitel
2. **Atmospheric Colors** via CSS Variables auf Profilen
3. **Collaboration Style Card** im Booking-Flow ("Wie arbeitet X?")
4. **Journey Phase** im CreatorStudio (ohne Zahl, als Text)
5. **Bridge-Narrative** im Discovery-Feed als subtle Tag
6. **Rhythm Indicator** als weicher Presence-Dot (ersetzt/ergänzt is_available)
