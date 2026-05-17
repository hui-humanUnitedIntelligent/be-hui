# HUI — CONTEXT SIGNAL MAP
**Phase 5E.1 — Stand: 2026-05-17**

> HUI versteht Menschen — nicht nur Klicks.
> Kontext-Intelligenz bedeutet: den richtigen Moment erkennen.
> Nicht den optimalen Engagement-Moment.

---

## Das Grundprinzip

Kontext ist nicht Verhalten.

Ein Klick sagt: „jemand hat geklickt."
Kontext sagt: „jemand sucht gerade kreative Ruhe."

HUI interpretiert Signale — nicht um zu manipulieren,
sondern um zu verstehen, wie es gerade helfen kann.

**Grenze:** HUI speichert keine Verhaltensdaten.
Kontext-Intelligenz läuft vollständig client-side.
Kein Tracking. Kein Profiling. Keine Server-Logs.

---

## 1. Temporal Context (Zeit-Signale)

Kreative Menschen haben natürliche Rhythmen.
HUI respektiert sie.

| Zeitfenster | Uhrzeit | Kreative Energie | HUI-Reaktion |
|-------------|---------|-----------------|--------------|
| Frühe Nacht | 00–05 | ruhig, experimentell | stille Entdeckung, kein Druck |
| Morgen | 05–09 | aufbrechend, frisch | Inspiration, neue Gesichter |
| Vormittag | 09–12 | fokussiert, produktiv | Buchungsmomente, Kollaboration |
| Mittag | 12–14 | offen, sozial | Community, Entdeckung |
| Nachmittag | 14–18 | kreativ-aktiv | Works, Erlebnisse, Stories |
| Früher Abend | 18–21 | Übergabe, reflektiv | Empfehlungen, ruhige Discovery |
| Abend | 21–24 | tief, kontemplativ | Stille Werke, ruhige Profile |

### Was wir NICHT tun
- ❌ Benachrichtigungen pushen wenn User am aktivsten ist
- ❌ Inhalte zurückhalten bis zum „optimalen Moment"
- ❌ Aktivitätszeit maximieren durch Timing-Manipulation

---

## 2. Mood Context (Stimmungs-Signale)

Signale:
- Gewählter Mood (HuiMatchOverlay) → explicit, direkt
- Tageszeit-abgeleiteter Mood → implicit, weich
- Navigations-Rhythmus → sehr schwach, nie allein genutzt
- Profil-Tags der zuletzt besuchten Creators → kreative Färbung

| Mood-Typ | Quelle | Qualität | Verarbeitung |
|----------|--------|---------|--------------|
| Explizit gewählt | HuiMatchOverlay | Sehr hoch | direkt als Ranking-Signal |
| Tageszeit-basiert | `new Date().getHours()` | Mittel | Soft-Suggestion |
| Profil-Resonanz | besuchte Creator-Moods | Niedrig | marginale Gewichtung |

### Wichtig: Mood wird NICHT persistiert
- Kein localStorage für Mood (außer opt-in)
- Session-Reset nach 2 Stunden Inaktivität
- Mood ist temporär — wie eine echte Stimmung

---

## 3. Intent Context (Intentions-Signale)

Was will jemand gerade?

| Intent | Erkennungs-Signal | Reaktion |
|--------|------------------|---------|
| Entdecken | Discovery-Tab, kein Suchbegriff | breite Exploration |
| Suchen | Suchfeld aktiv, Suchbegriff | gezielte Ergebnisse |
| Kollaborieren | Chat initiiert, Booking-Anfrage geöffnet | Creator-Details hervorheben |
| Inspirieren lassen | Feed browsen, Stories anschauen | breite kreative Vielfalt |
| Zeigen | CreateFlow geöffnet | Publikations-Support |
| Buchen | RequestSheet geöffnet | Verfügbarkeit, Trust-Signale |

### Signal-Qualität
```
Explizit (Suchfeld): 100%  — User sagt direkt was er will
Navigations-Kontext: 60%   — Tab + Flow gibt Hinweis
Temporal (Uhrzeit):  30%   — schwaches, kulturell variables Signal
Sequenz:             20%   — sehr vorsichtig nutzen
```

---

## 4. Environmental Context

| Signal | Erkennbar? | Nutzung |
|--------|-----------|---------|
| Lokale Community | `profiles.location_label` | lokale Creator-Nähe |
| Mobil/Desktop | `window.innerWidth` | Feed-Density anpassen |
| Online/Offline | `navigator.onLine` | Graceful Degradation |
| Tageszeit + Wochentag | `Date` | Temporal Context |
| Wochenende vs Werktag | `Date.getDay()` | kreative Energie |

---

## 5. Interaction Context (Session-Signale)

Nur session-basiert. Nie persistiert. Nie geloggt.

| Signal | Messung | Interpretation |
|--------|---------|---------------|
| Session-Dauer | `Date.now() - sessionStart` | kurz = scanning, lang = vertieft |
| Scroll-Tiefe | Scroll-Position im Feed | tief = engagiert, flach = Überblick |
| Return-Visit | `sessionStorage` Marker | Wiederkehr = Vertrautheit |
| Repeated Profile | gleicher Creator 2× besucht | echtes Interesse |
| Quick-Exit | < 30s, keine Interaktion | schlechter Moment |

### Was wir NICHT speichern
- ❌ Exakte Klick-Sequenzen
- ❌ Verweildauer pro Item
- ❌ Mouse-Movement
- ❌ Scroll-Geschwindigkeit

---

## 6. Creative Flow Context

Die wichtigste — und vorsichtigst einzusetzende — Kategorie.

| Flow-Zustand | Erkennungs-Proxy | Reaktion |
|-------------|-----------------|---------|
| Explorativ | Discovery aktiv, kein Mood gewählt | Vielfalt, Überraschung |
| Fokussiert | Suche aktiv, spezifischer Query | Präzise Ergebnisse |
| Kollaborativ | Chat oder Booking offen | Partner-Qualitäten |
| Inspirationssuchend | Story-Sektion aktiv | emotionale Tiefe |
| Ruhig | Abend, lange Session, langsames Scrollen | ruhige Qualitäts-Inhalte |
| Scanning | kurze Session, Überblick | Vielfalt, leichte Inhalte |

---

## Datenschutz-Commitments

```
✅ Alle Kontext-Berechnungen: client-side only
✅ Keine Server-Logs von Verhaltensdaten
✅ Session-Daten: sessionStorage, nicht localStorage
✅ Mood: temporär, reset nach Inaktivität
✅ Keine Profil-Anreicherung durch Kontext
✅ User kann Kontext-Features deaktivieren (Phase 5F)
✅ Transparente Dokumentation (dieses Dokument)
```
