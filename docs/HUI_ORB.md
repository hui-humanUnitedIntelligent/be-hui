# HUI Orb — Philosophie und Architektur

> *"Die Sonne symbolisiert die gemeinsame Menschlichkeit.*  
> *Das Blatt erzählt den individuellen Weg eines Menschen.*  
> *Der Orb ist von Anfang an vollständig.*  
> *Mit der Zeit erzählt das Blatt die Geschichte dieses Weges."*

**Version:** 1.0  
**Datum:** 2026-06-29  
**Grundlage:** [HUI_CONSTITUTION.md](../HUI_CONSTITUTION.md) v1.1

---

## I. Was der Orb ist

Der Orb ist kein Feature.  
Er ist kein Gamification-Element.  
Er ist kein Fortschrittsanzeiger.

**Der Orb ist das stille, sichtbare Symbol des Weges eines Menschen.**

Er zeigt keine Bewertung. Er erzählt eine Geschichte.

---

## II. Die Sonne ☀️

**Die Sonne verändert sich niemals.**

Sie ist bei jedem Menschen identisch — vom ersten Tag bis zum letzten.

Sie symbolisiert:

| Bedeutung | Warum |
|---|---|
| **Menschlichkeit** | Wir alle sind gleich in unserer Menschlichkeit |
| **Leben** | Das Licht, das allen gehört |
| **Gemeinschaft** | Das Gemeinsame, das uns verbindet |
| **Hoffnung** | Das Unveränderliche in einer sich verändernden Welt |

Die Sonne besitzt:
- Keine Individualisierung
- Keine Entwicklungsstufen
- Keine Bewertung
- Keine Unterschiede zwischen Menschen

Sie ist das Symbol dafür, dass kein Mensch mehr oder weniger wert ist als ein anderer.

---

## III. Das Blatt 🍃

**Das Blatt erzählt den individuellen Weg.**

Nicht die Identität.  
Nicht den Wert.  
Nicht die Leistung.  
Nur den persönlichen Weg durch die HUI-Gemeinschaft.

### Was das Blatt zeigt

- Welche Spuren jemand in der Gemeinschaft hinterlässt
- Durch welche Grundpfeiler sich jemand besonders ausdrückt
- Wie tief und breit die Resonanz mit anderen Menschen ist

### Was das Blatt nicht zeigt

- Keine Punktzahl
- Kein Level
- Kein Rang
- Keine Vergleiche mit anderen Menschen

### Wie sich das Blatt verändert

Das Blatt verändert sich **langsam** — organisch, über Monate und Jahre.  
Nicht nach einzelnen Aktionen. Nicht als Belohnung. Nicht als Strafe.

Es verändert sich weil ein Mensch in der Welt wirkt.  
Nicht weil er Aktionen in einer App ausführt.

---

## IV. Der Standard-Orb

Jedes neue Mitglied erhält **sofort den vollständigen HUI-Orb** — Sonne und Blatt.

Nicht:
```
Avatar/Foto  →  Orb nach Aktivität
```

Sondern:
```
Orb (origin)  →  individueller Orb (über Zeit)
```

Das neutrale Blatt des Ursprungs bedeutet:  
**„Dein Weg beginnt."**

Nicht: „Du hast noch nichts erreicht."

---

## V. Die Blatt-Entfaltung

Das Blatt entfaltet sich durch sechs Zustände — keine Levels, keine Stufen. Zustände eines Weges.

| Zustand | Name intern | Bedeutung |
|---|---|---|
| 🌱 Ursprung | `origin` | Der Weg beginnt. Stilles, ruhiges Blatt. |
| 🍃 Erstes Blatt | `first_leaf` | Erste Resonanz. Das Blatt zeigt sich der Welt. |
| 🌿 Erwachen | `awakening` | Das Blatt entfaltet sich, lebendig und offen. |
| 🍀 Ausdruck | `expression` | Das Blatt zeigt seine Form — ausgereift. |
| 🌳 Entfaltung | `unfolding` | Das Blatt in voller Lebendigkeit, reich an Geschichte. |
| 🌲 Verwurzelung | `rooted` | Tief geerdet, Impact-Fokus, Stille und Bestand. |

### Wichtig

Diese Zustände sind **keine Leistungsstufen**.  
Sie sind Momentaufnahmen eines natürlichen Weges.  
Ein Mensch im Zustand `origin` ist nicht weniger wert als einer im Zustand `rooted`.

---

## VI. Die fünf Grundpfeiler im Orb

Die Farbe und Form des Blattes spiegeln die dominanten Grundpfeiler wider.

| Grundpfeiler | Blattqualität | Farbe | Bedeutung |
|---|---|---|---|
| 🤝 Verbinden | Verzweigt, offen | Teal `#0DC4B5` | Öffnet sich nach außen — lädt ein |
| 💚 Unterstützen | Schützend, breit | Grün `#22C55E` | Gibt Schutz ohne zu dominieren |
| 🎨 Erschaffen | Entfaltend | Coral `#F47355` | Zeigt seine eigene Form |
| 🌱 Wertschöpfen | Verwurzelt | Gold `#D4952A`` | Tief verankert, gibt von dort |
| 🌍 Impact | Weitreichend | Blau `#0EA5E9` | Strahlt weit in die Welt |

Die Farbmischung entsteht aus den **resonanzbestätigten** Stärken — nicht aus bloßen Handlungen.  
Resonanz bedeutet: andere Menschen haben auf den Weg reagiert.

---

## VII. Architektur

```
HUI_CONSTITUTION.md       ← Philosophische Grundlage
         ↓
src/registry/HuiRegistry.js  ← ORB_TRAITS: Blatt-Eigenschaften pro Grundpfeiler
         ↓
src/core/coreEngine.js    ← Wirkungssignale (resonance_*, orb_vitality, orb_depth)
         ↓
src/core/orbEngine.js     ← computeParams(): Core Engine → visuelle Parameter
         ↓
src/hooks/useCoreEngine.js   ← useOrbParams(userId) React Hook
         ↓
src/components/orb/OrbLeaf.jsx   ← UI: Das individuelle Blatt
src/components/profile/OrbSignatur.jsx  ← Profil: Orb + dominantPillars
```

### Datenfluss

```
Menschliche Handlung
    ↓  (CoreEngine.signals.record)
Wirkungssignal in DB
    ↓  (wöchentliche Aggregation)
Core Profile: orb_vitality, orb_depth, orb_breadth, resonance_*
    ↓  (OrbEngine.computeParams)
Visuelle Parameter: leaf.archetype, color, glow, animation
    ↓  (useOrbParams Hook)
OrbLeaf Rendering
```

### Was die Orb Engine tut

Die Orb Engine (`orbEngine.js`) tut **einen Ding**: Sie übersetzt Core Engine Daten in visuelle Parameter.

Sie kennt keine Regeln über Menschen.  
Sie bewertet niemanden.  
Sie berechnet nur: gegeben diese Wirkungsdaten — wie sieht das Blatt aus?

---

## VIII. Regeln für die Implementierung

### Sprache im Code

| Nicht verwenden | Stattdessen |
|---|---|
| `growth`, `grow` | `story`, `path`, `journey` |
| `seed` (als Archetype) | `origin` |
| `sprouting` | `first_leaf` |
| `young` (Zustand) | `awakening` |
| `mature` (Zustand) | `expression` |
| `flourishing` | `unfolding` |
| `level`, `stage` | Zustand des Weges |
| `progress` | (vermeiden — kein Fortschrittsdenken) |
| `evolution` | `unfolding` |
| `computeGrowth()` | `computeJourney()` oder `computeStory()` |

### Was niemals implementiert werden darf

- Animationen oder Effekte wenn das Blatt seinen Zustand wechselt (kein "Level Up")
- Anzeige des aktuellen Zustands als Zahl oder Prozent
- Vergleich von Blatt-Zuständen zwischen Menschen
- Benachrichtigungen wenn sich das Blatt verändert hat
- Countdown oder Timer bis zur nächsten Veränderung

### Was erlaubt ist

- Sanfte, langsame Farbveränderungen über Zeit
- Organisches Atmen und Schweben des Blattes
- Anzeige der dominanten Grundpfeiler (als Sprache, nie als Zahlen)
- "Wirkt besonders durch..." im öffentlichen Profil

---

## IX. Häufige Fragen

**Warum erhält jeder sofort den Orb?**  
Weil der Mensch von Anfang an vollständig ist. Der Orb spiegelt das wider.

**Warum wächst der Orb nicht?**  
Der Orb wächst nicht — das Blatt erzählt mit der Zeit eine Geschichte. Das ist ein fundamentaler Unterschied: Wachstum impliziert Fortschritt und Bewertung. Eine Geschichte impliziert Bedeutung und Weg.

**Wie lange dauert eine Blatt-Veränderung?**  
Monate, nicht Stunden. HUI misst keine App-Aktivität, sondern echte menschliche Wirkung.

**Kann man den Orb "verlieren"?**  
Nein. Der Orb ist dauerhaft. Das Blatt kann sich verändern — aber es verschwindet nicht.

---

*Verwandte Dokumente:*  
*[HUI_CONSTITUTION.md](../HUI_CONSTITUTION.md) · [HuiRegistry.js](../src/registry/HuiRegistry.js) · [orbEngine.js](../src/core/orbEngine.js) · [ARCHITECTURE_INDEX.md](ARCHITECTURE_INDEX.md)*
