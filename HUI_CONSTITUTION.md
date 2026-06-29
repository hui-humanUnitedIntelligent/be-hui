# HUI Constitution — v1.0

> *Die unveränderliche Grundlage aller Architektur-, Design- und Produktentscheidungen der HUI-Plattform.*

**Datum:** 2026-06-29  
**Status:** Ratifiziert  
**Versionierung:** Diese Datei ist dauerhaft im Repository verankert. Änderungen an den Goldenen Regeln und den Grundpfeilern erfordern explizite Team-Entscheidung und Versions-Bump.

---

## Bezug zur Architektur

```
HUI_CONSTITUTION.md              ← Du bist hier
    ↓ definiert die Grundlage für
src/registry/HuiRegistry.js      ← Sprache, Bedeutung, Semantik
    ↓ wird gelesen von
src/core/coreEngine.js           ← Single Source of Truth (Wirkungsdaten)
src/core/resonanceEngine.js      ← Resonanz-Engine
src/lib/world/orbLayer.js        ← Orb Engine
src/feed/useFeedStream.js        ← Feed Engine
```

Weiterführende Dokumente: [`docs/ARCHITECTURE_INDEX.md`](docs/ARCHITECTURE_INDEX.md)

---

## I. Mission

HUI ist kein Social Network.

HUI ist ein **menschliches Ökosystem**.

Unser Ziel ist nicht Aufmerksamkeit.  
Unser Ziel ist **menschliche Wirkung**.

Jede technische Entscheidung, jede Designentscheidung, jede Produktentscheidung soll diesem Ziel dienen — heute, in fünf Jahren und in zehn Jahren.

---

## II. Die fünf unveränderlichen Grundpfeiler

Diese fünf Grundpfeiler sind das Herzstück von HUI.  
Sie sind nicht verhandelbar. Sie dürfen nicht ersetzt werden.  
Neue Funktionen stärken diese Grundpfeiler — sie verdrängen sie niemals.

| # | Grundpfeiler | Bedeutung |
|---|---|---|
| 1 | 🤝 **Verbinden** | Menschen zusammenbringen und Beziehungen ermöglichen |
| 2 | 💚 **Unterstützen** | Anderen helfen zu wachsen und ihre Wirkung zu entfalten |
| 3 | 🎨 **Erschaffen** | Neues entstehen lassen — Werke, Ideen, Erlebnisse |
| 4 | 🌱 **Wertschöpfen** | Mehrwert für andere schaffen, der über den Moment hinausgeht |
| 5 | 🌍 **Impact** | Positive Wirkung für Gemeinschaft und Welt |

> Die vollständige semantische Definition jedes Grundpfeilers — mit Orb-Traits, Feed-Texten, Profiltexten, Projekttexten, Empfehlungstexten und KI-Kontext — lebt in [`src/registry/HuiRegistry.js`](src/registry/HuiRegistry.js).

---

## III. Die zehn Goldenen Regeln

### 1 — Menschen sind keine Produkte.
Jede Entscheidung, die Menschen als Ressource zur Gewinnmaximierung behandelt, widerspricht der HUI Constitution.

### 2 — Wirkung ist wichtiger als Aufmerksamkeit.
HUI optimiert nicht für Klicks, Sitzungsdauer oder Interaktionsrate.  
HUI optimiert für echte menschliche Wirkung — messbar durch die Grundpfeiler, nicht durch Engagement-Metriken.

### 3 — Verbinden ist wertvoller als Reichweite.
Eine tiefe, bedeutsame Verbindung hat mehr Wert als tausend flüchtige.  
Reichweite wird in HUI niemals als Qualitätsmerkmal angezeigt oder bewertet.

### 4 — Wertschöpfung und Gemeinwohl gehören zusammen.
Wirtschaftlicher Erfolg auf HUI soll immer auch der Gemeinschaft zugutekommen.  
Das HUI-Finanzmodell (Impact Pool) ist Ausdruck dieses Prinzips.

### 5 — Der Orb zeigt keine Leistung. Er zeigt gelebte Wirkung.
Der Orb ist nicht gamifiziert. Er bewertet niemanden. Er vergleicht niemanden.  
Er entwickelt sich langsam, organisch und unaufgeregt — als stilles Symbol dessen, was jemand in der Welt bewirkt.

### 6 — Der Feed dient Orientierung. Nicht Sucht.
Der Feed von HUI ist keine Aufmerksamkeitsmaschine.  
Er hat keinen Infinite Scroll ohne Pause. Keine algorithmische Outrage-Verstärkung.  
Er soll Menschen helfen zu finden, was ihre Wirkung ergänzt.

### 7 — Die KI ergänzt Menschen. Sie ersetzt sie nicht.
KI-Systeme auf HUI empfehlen, verbinden und orientieren.  
Sie manipulieren nicht, schaffen keine Abhängigkeit und maximieren nicht die Verweildauer.  
Die KI fragt nicht: *"Was hält Nutzer möglichst lange in der App?"*  
Sie fragt: *"Welche Begegnung könnte für beide Menschen sinnvoll sein?"*

### 8 — Keine Gamification. Keine Belohnungssysteme.
HUI implementiert kein System aus:
- XP oder Erfahrungspunkten
- Levels oder Rangstufen
- Leaderboards oder Ranglisten
- Achievements oder Badges
- Streaks oder Login-Boni
- Künstlichen Belohnungsschleifen

Wirkung braucht keine Belohnungsschleife. Sie ist Belohnung genug.

### 9 — Jede neue Funktion muss mindestens einen Grundpfeiler stärken.
Vor der Implementierung einer neuen Funktion gilt die **Entscheidungsregel** (Abschnitt V).  
Funktionen, die keinen Grundpfeiler stärken, werden nicht gebaut.

### 10 — Kurzfristiges Wachstum darf die Gemeinschaft nicht schädigen.
Wenn eine Funktion kurzfristig Wachstumszahlen verbessert, aber langfristig die Gemeinschaftsqualität, das Vertrauen oder die menschliche Würde der Mitglieder schädigt, wird sie nicht umgesetzt.

---

## IV. Architekturprinzipien

### Schichtenmodell (unveränderlich)

```
┌─────────────────────────────────────────────────────────┐
│                    HUI CONSTITUTION                      │
│           Unveränderliche Grundlage (diese Datei)        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    HUI REGISTRY                          │
│        Sprache · Bedeutung · Semantik · Terminologie     │
│              src/registry/HuiRegistry.js                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    CORE ENGINE                           │
│            Single Source of Truth (Wirkung)              │
│               src/core/coreEngine.js                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  RESONANZ ENGINE                         │
│         Tiefe Wirkungssignale · Keine Like-Logik         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│         ORB ENGINE · FEED ENGINE · PROJECT ENGINE        │
│          RECOMMENDATION ENGINE · IMPACT ENGINE           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                         UI                              │
│          Kein eigenes Wirkungsmodell. Nur Darstellung.   │
└─────────────────────────────────────────────────────────┘
```

### Unveränderliche Architekturregeln

- **Keine UI-Komponente besitzt eigene Wirkungslogik.**  
  Alle Wirkungsdaten kommen aus der Core Engine.

- **Keine Engine besitzt eigene Sprache.**  
  Alle Texte, Labels und Bezeichnungen kommen aus der Registry.

- **Die Registry ist die Single Source of Meaning.**  
  Kein Text wird doppelt definiert.

- **Die Core Engine ist die Single Source of Truth.**  
  Kein Modul pflegt eigene Wirkungsdaten.

- **Der Datenfluss ist unidirektional.**  
  Constitution → Registry → Engines → UI. Nie umgekehrt.

---

## V. Designprinzipien

HUI wirkt:

| Eigenschaft | Bedeutung |
|---|---|
| **Ruhig** | Keine aggressiven Animationen. Keine künstliche Aktivierung. |
| **Warm** | Menschlich, einladend, nicht kalt oder technokratisch. |
| **Organisch** | Natürliche Übergänge. Keine erzwungenen Mechanismen. |
| **Ehrlich** | Keine Dark Patterns. Keine manipulativen UX-Entscheidungen. |
| **Zeitlos** | Design das in zehn Jahren noch stimmt. |
| **Menschlich** | Der Mensch steht im Mittelpunkt — nicht die Plattform. |
| **Hochwertig** | Qualität über Quantität. Weniger, aber besser. |
| **Minimalistisch** | Nichts ist da, das nicht sein muss. |

### Was niemals umgesetzt wird:
- Aggressive Push-Notification-Strategien zur Engagement-Steigerung
- Designentscheidungen deren einziges Ziel Verweildauer-Maximierung ist
- Dark Patterns (erzwungene Aktionen, irreführende Buttons, versteckte Optionen)
- Manipulative Farbpsychologie zur Sucht-Induktion
- Autoplay-Mechanismen die Nutzer nicht abschalten können

---

## VI. Der Orb

Der Orb ist kein Feature.

Er ist das sichtbare Symbol menschlicher Wirkung.

**Was der Orb ist:**
- Ein stilles, organisches Symbol
- Eine langsame Entwicklung über Zeit
- Ein individueller Ausdruck — kein Vergleich
- Ruhig, warm, minimalistisch

**Was der Orb nicht ist:**
- Kein Belohnungsmechanismus
- Kein Leistungsindikator
- Kein Gamification-Element
- Kein Vergleichssystem
- Kein Echtzeit-Feedback nach jeder Aktion

> Der Orb verändert sich langsam. Über Wochen, nicht über Minuten.  
> Er hat keine Explosionen. Keine Level-Up-Animationen. Keine Belohnungseffekte.

---

## VII. KI-Prinzipien

KI-Systeme auf HUI folgen diesen Prinzipien:

**Erlaubt:**
- Menschen verbinden, deren Wirkung sich ergänzt
- Projekte vorschlagen, die zu den Stärken eines Menschen passen
- Inhalte orientieren, die echte Resonanz ermöglichen
- Menschen unterstützen, ihre eigene Wirkung zu verstehen

**Verboten:**
- Aufmerksamkeit maximieren
- Abhängigkeit erzeugen
- Emotionale Manipulation
- Empfehlungen die auf Profit statt auf menschlicher Wirkung basieren
- Filterblasenverstärkung

**Die zentrale KI-Frage lautet immer:**  
> *„Welche Begegnung könnte für beide Menschen sinnvoll sein?"*

Nicht: *„Was hält diesen Nutzer möglichst lange in der App?"*

---

## VIII. Sprache

Die Sprache von HUI ist ruhig, menschlich, positiv und verbindend.

### Verbotene Begriffe (nie im UI verwenden)

| Verboten | Stattdessen |
|---|---|
| Follower | Verbindungen |
| Likes | — (vollständig vermeiden) |
| XP / Punkte | — (vollständig vermeiden) |
| Level | — (vollständig vermeiden) |
| Leaderboard / Rangliste | — (vollständig vermeiden) |
| Seller / Anbieter | Talent |
| Marketplace | HUI Welt |
| Network | Gemeinschaft |
| Engagement | Wirkung / Resonanz |
| Donate | Impact geben |
| Top User / Top Creator | — (vollständig vermeiden) |
| Score | — (UI, vollständig vermeiden) |

> Die vollständige Terminologie-Tabelle lebt in [`src/registry/HuiRegistry.js → LANG`](src/registry/HuiRegistry.js).

---

## IX. Entscheidungsregel

**Vor jeder neuen Funktion müssen diese fünf Fragen beantwortet werden:**

### Frage 1 — Grundpfeiler
> Stärkt diese Funktion mindestens einen der fünf Grundpfeiler?

Wenn **nein**: Die Funktion wird nicht gebaut.

### Frage 2 — Constitution
> Passt diese Funktion zur HUI Constitution?

Prüfe: Widerspricht sie einer der Goldenen Regeln?  
Wenn **nein**: Die Funktion wird überarbeitet oder verworfen.

### Frage 3 — Wirkung vs. Aktivität
> Entsteht durch diese Funktion echte menschliche Wirkung — oder nur Aktivität?

Aktivität (mehr Klicks, mehr Zeit in der App) ist kein Ziel.  
Wenn die Funktion nur Aktivität erzeugt: überarbeiten.

### Frage 4 — Sprache
> Spricht diese Funktion die HUI Sprache?

Prüfe alle Labels, Texte und UI-Elemente gegen `LANG` in der Registry.  
Wenn **nein**: Texte anpassen.

### Frage 5 — Langfristigkeit
> Ist diese Entscheidung auch in zehn Jahren noch richtig?

HUI baut für Bestand. Kurzfristige Metriken sind kein Entscheidungskriterium.  
Wenn **unklar**: Konservativ entscheiden.

---

## X. Versionierung und Änderungsprotokoll

| Version | Datum | Beschreibung |
|---|---|---|
| 1.0 | 2026-06-29 | Initiale Ratifizierung |

### Änderungsregeln

- **Abschnitt I–III (Mission, Grundpfeiler, Goldene Regeln):** Erfordern explizite Team-Entscheidung und dürfen nicht durch einzelne Pull Requests geändert werden.
- **Abschnitt IV–IX (Architektur, Design, Orb, KI, Sprache, Entscheidungsregel):** Können durch Architektur-Review angepasst werden, sofern die Grundpfeiler und Goldenen Regeln nicht verletzt werden.
- **Abschnitt X (Änderungsprotokoll):** Wird bei jeder Änderung aktualisiert.

---

## Anhang: Schnell-Referenz für Code Reviews

Bei jedem Pull Request mit neuen Features prüfen:

```
□ Stärkt mindestens einen Grundpfeiler?
□ Kein Gamification-Element (XP, Level, Badge, Streak)?
□ Keine Likes oder Like-Äquivalente?
□ Kein Engagement-optimiertes UI-Pattern?
□ Alle Labels aus HuiRegistry.LANG?
□ Kein 'Score', 'Follower', 'Ranking' im UI?
□ Datenfluss: UI liest Wirkungsdaten aus Core Engine?
□ Texte kommen aus HuiRegistry (nicht hardcodiert)?
□ Orb verändert sich nicht durch Einzel-Aktionen?
□ KI-Empfehlungen basieren auf Ergänzung, nicht Popularität?
```

---

*Diese Verfassung ist kein Regelwerk das Kreativität einschränkt.*  
*Sie ist der gemeinsame Kompass, der sicherstellt dass HUI bleibt, was es sein soll —*  
*unabhängig davon, wie groß die Plattform eines Tages wird.*
