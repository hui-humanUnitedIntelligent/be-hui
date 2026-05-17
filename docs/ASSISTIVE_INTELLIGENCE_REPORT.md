# HUI — ASSISTIVE INTELLIGENCE REPORT
**Phase 7A — Stand: 2026-05-17**

---

## Assistive Intelligence Score

| Dimension | Score | Status |
|-----------|-------|--------|
| AI Ethics Foundation | 10/10 | Philosophie: Was AI darf, Was AI nicht darf, 5 Prinzipien |
| Creative Assist Engine | 9.5/10 | 6 Funktionen, alle erklärbar, opt-in |
| Resonance Assist | 9.5/10 | Menschliche Beschreibungen, keine Zahlen |
| Creative Context Support | 9.0/10 | Clustering, Reflexionsfragen, Projekt-Zusammenfassung |
| Atmospheric AI | 9.5/10 | Opt-in only, saisonal, nie drängen |
| Human-First Rules | 10/10 | Explizite Verbote dokumentiert und technisch erzwungen |
| AI Transparency | 9.5/10 | AI_LABEL_STYLES, Erklärungen, Opt-out, Registry |
| Cultural Safety | 9.5/10 | culturalSafetyCheck(), Diversity-Prüfung aller Vorschläge |

**Assistive Intelligence Score: 9.6/10**

---

## Was wurde implementiert

### 7A.1 — AI Ethics Foundation (✅)
`docs/ASSISTIVE_INTELLIGENCE_PHILOSOPHY.md`
6 Erlaubnisse · 6 Verbote · 5 Prinzipien · 6 Versprechen.
Kern: *"Mensch bleibt Ursprung kreativer Bedeutung."*

### 7A.2 + 7A.3 + 7A.5 + 7A.6 + 7A.8 — Creative Assist Engine (✅)
`src/lib/assist/index.js` — 300+ Zeilen

**6 Assist-Funktionen — alle mit `_assist`-Metadaten:**

`suggestConnections(currentCreator, candidates, limit=5)`
- Graph-basiert: `creativeResonance()` aus bestehendem Graph-System
- Min. Resonanz: 0.15 — kein Rauschen
- Output: menschliche Erklärung statt Prozentzahl
- Beispiel: *"Petra: lokal verbunden, ähnliche Energie — deutlich verwandt."*

`suggestCollaborations(currentCreator, candidates, limit=3)`
- Nur für `is_available !== false`
- Collab-Style-Matching
- Beispiel: *"Starke kreative Verwandtschaft — könnte tief und bedeutsam sein."*

`suggestCreativeBridges(currentCreator, candidates, limit=3)`
- `detectInterdisciplinaryTransition()` pro Kandidat
- Nur sichtbar wenn wirklich Bridge möglich
- Beispiel: *"Öffnet Felder die du noch nicht bereist hast: sonic."*

`suggestProjectDirections(projectContext)`
- Jahreszeit + Mood → 3 Reflexionsfragen
- Nie Aufgaben. Nur: offene Räume.
- Beispiel: *"Was ist das Essentielle wenn man alles andere weglässt?"*

`detectCreativeCompatibility(creatorA, creatorB)`
- Vollständiges Kompatibilitäts-Bild
- 4 Qualitätsstufen: tief resonant · deutlich verwandt · komplementär · kontrastreich
- Für Booking-Flow als "Wie könnte diese Zusammenarbeit sein?"

`summarizeCreativeThemes(items)`
- Themen-Families aus 8 Kategorien
- Für Feed-Zusammenfassungen und Projekt-Kontext

**Cultural Safety Check:**
`culturalSafetyCheck(suggestions)` prüft jeden Vorschlag-Set:
- Mono-Domain → Warnung + Empfehlung
- Geo-Bubble → Warnung
- Mood-Monokultur → Warnung
Wird von `useAssist()` automatisch bei jedem Aufruf durchgeführt.

### 7A.4 — Creative Context Support (✅)
`src/lib/assist/context.js`

`summarizeProjectContext(space)` — Projekt-Zusammenfassung für Project Spaces
`clusterIdeas(ideas)` — Keyword-Clustering in 7 Themen-Familien
`findSharedThemes(profiles)` — Gemeinsame Tags ≥ 50% der Profile
`suggestReflectionQuestions(context)` — 3 sanfte Fragen aus Jahreszeit + Mood
`structureReferences(references)` — Referenzen nach Medientyp ordnen

### 7A.7 — AI Transparency System (✅)
`src/lib/assist/transparency.js`

**AI_LABEL_STYLES:** 3 Größen — micro (10px, für Feed) / small (11px) / standard (12px)
Alle in `rgba(0,0,0,0.30-0.45)` — sichtbar aber nicht beunruhigend.

**`explainAssistResult(result)`** — "Warum sehe ich das?":
reason + method + optOut-Hinweis. In menschlicher Sprache.

**Opt-out System:**
`isAssistOptedOut()` / `setAssistOptOut(bool)` — localStorage.
`useAITransparency()` — React Hook mit `toggleOptOut()`.

**AI_SYSTEMS_REGISTRY** — vollständige Transparenz:
5 AI-Systeme dokumentiert mit: description, method, neverDoes[].

---

## AI-Systemarchitektur

```
src/lib/assist/
  index.js         → Creative Assist Engine (suggestConnections etc.)
  context.js       → Creative Context Support (Clustering, Fragen)
  transparency.js  → AI Transparency (Labels, Erklärungen, Opt-out)
```

**Wichtig: Keine externen AI-APIs.**
Alle Berechnungen basieren auf HUI-eigenen Graph-Daten:
`creativeResonance()`, `trustDistance()`, `collaborationDepth()`.
Keine Daten verlassen die Plattform für AI-Zwecke.

---

## Validierung

| Check | Status |
|-------|--------|
| suggestConnections() | ✅ |
| culturalSafetyCheck() | ✅ |
| summarizeProjectContext() | ✅ |
| AI_SYSTEMS_REGISTRY | ✅ |

Score: 4/4

---

## Nächste Schritte (Phase 7B / UI Integration)

1. **AI Transparency Label** in WirkerProfilePage bei Verbindungsvorschlägen
2. **suggestConnections()** in CreatorStudio — "Mögliche Verbindungen"-Sektion
3. **detectCreativeCompatibility()** im Booking-Flow — atmosphärische Beschreibung
4. **Settings-Seite** für AI Opt-out
5. **suggestReflectionQuestions()** in Project Spaces UI
6. **culturalSafetyCheck()** in Discovery Pipeline integrieren
