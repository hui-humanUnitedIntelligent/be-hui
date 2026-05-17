# HUI — CONTEXT PHILOSOPHY
**Phase 5E.7 — Kontext ohne Kontrolle**

---

> „Die Plattform soll verstehen,
> was Menschen brauchen —
> nicht was sie klicken sollen."

---

## Das Paradox der Personalisierung

Personalisierung kann zwei Dinge bedeuten:

**Gut:** Die Plattform versteht, dass jemand abends Ruhe sucht,
und zeigt ruhige, tiefe Inhalte statt hektischer Trends.

**Schlecht:** Die Plattform versteht, dass jemand abends emotional
vulnerabler ist, und zeigt Inhalte die emotionale Reaktionen triggern.

HUI wählt immer Ersteres.

---

## Was Kontext-Intelligenz bei HUI bedeutet

Kontext ist eine sanfte Hand — keine Steuerung.

### Beispiel: Abendstimmung
```
Was wir erkennen:
Es ist 22 Uhr. Die Session läuft seit 18 Minuten.

Was wir tun:
→ Feed wird leicht ruhiger (max. 12 statt 24 Items)
→ Tiefe Werke werden leicht bevorzugt
→ Kein Overstimulation-Push

Was wir NICHT tun:
→ Emotional aufgeladene Inhalte zeigen
→ FOMO-Trigger aktivieren
→ "Du könntest etwas verpassen!" 
```

### Beispiel: Fokus-Suche
```
Was wir erkennen:
User hat "Holz" in die Suche getippt.

Was wir tun:
→ Semantische Suche (Holzhandwerk, Tischlerei, Holzschnitzerei)
→ Nischen-Tiefe bevorzugen
→ Relevante Trust-Signale zeigen

Was wir NICHT tun:
→ "Andere haben auch gesucht..."
→ Upsell-Empfehlungen
→ Verwandte Suchen pushen die nichts mit Holz zu tun haben
```

---

## Explizit verbotene Kontext-Nutzungen

### ❌ Emotionale Manipulation
Niemals:
- Inhalte timen wenn User emotional vulnerabler ist
- Schlechte Stimmung erkennen und ausnutzen
- Verlust-Angst durch kontextuelles Timing erzeugen

### ❌ Psychologische Ausnutzung
Niemals:
- Cognitive Load nutzen (abends schlechte Entscheidungen)
- Variable Rewards (Slot-Maschinen-Mechanik)
- Social Pressure durch Timing

### ❌ Aufmerksamkeitshacking
Niemals:
- Benachrichtigungen zum "optimalen" Sucht-Moment
- Feed-Verlängerung durch emotionale Trigger
- Cliffhanger-Inhalte die zur Rückkehr zwingen

### ❌ Invasive Verhaltensanalyse
Niemals:
- Klick-Sequenzen speichern
- Scrollgeschwindigkeit messen
- Verweildauer pro Item loggen
- Maus-Bewegungen analysieren

---

## Was wir tun dürfen

### ✅ Tagesrhythmus respektieren
Allgemein bekannte kreative Rhythmen (morgens fokussiert,
abends ruhig) können Feed-Zusammenstellung sanft beeinflussen.
Max-Einfluss: 10% auf Ranking.

### ✅ Explizite Stimmungswahl honorieren
Wenn User einen Mood wählt, wird das als klares Signal respektiert.
Nicht als Profiling-Datum, sondern als Wunsch für diese Session.

### ✅ Überstimulation sanft erkennen
Nach langer Session kann der Feed leicht reduziert werden.
User kann immer mehr laden. Kein Paternalismus — nur Angebot.

### ✅ Flow-Kontext nutzen
Wenn Suchfeld aktiv: fokussierte Ergebnisse.
Wenn Chat offen: Kollaborations-Qualitäten zeigen.
Wenn CreateFlow offen: Creator-Support statt Discovery.

---

## Die Grenzen (technisch erzwungen)

```javascript
// Kontext-Einfluss ist hard-capped:
const ctxMod = contextualRelevance(item, context);
// clamp(modifier, -0.05, 0.10) — max ±10% auf Score

// Session-Daten verfallen automatisch:
sessionStorage.removeItem('hui_ctx'); // bei Tab-Close

// Mood verfällt nach 2 Stunden:
if (Date.now() - ctx.moodSetAt > 7200000) return null;

// Keine persistenten Verhaltens-Profile:
// localStorage wird nur für: Talent-Status, Draft-Saves genutzt
```

---

## Transparenz-Versprechen

1. **Dieses Dokument** erklärt vollständig wie Kontext genutzt wird
2. **Der Code** ist öffentlich zugänglich
3. **Keine Secret Updates**: Änderungen an der Kontext-Logik werden dokumentiert
4. **Opt-out** kommt in Phase 5F: User kann Kontext-Features deaktivieren

---

## Das Maß für gute Kontext-Intelligenz

Eine einfache Frage:

> „Würde dieser Mensch sich verstanden fühlen
> oder benutzt?"

Wenn die Antwort „benutzt" ist: nicht implementieren.
Wenn die Antwort „verstanden" ist: vorsichtig implementieren.

**HUI versteht Menschen. HUI benutzt sie nicht.**
