# HUI Engineering Constitution
## Truth over Assumption
### Verbindlicher Entwicklungsstandard für HUI

**Datum:** 2026-07-03  
**Status:** Ratifiziert  
**Geltungsbereich:** Cursor, Base, ChatGPT, Entwickler, zukünftige Teammitglieder, alle automatisierten Entwicklungsprozesse

Ab sofort gilt für die gesamte Entwicklung von HUI ein verbindlicher Qualitätsstandard.

Dieser Standard gilt für:

- Cursor
- Base
- ChatGPT
- Entwickler
- zukünftige Teammitglieder
- alle automatisierten Entwicklungsprozesse

**Bezug:** Ergänzt [`HUI_CONSTITUTION.md`](HUI_CONSTITUTION.md) (Produkt & Architektur) um verbindliche Entwicklungs- und Verifikationsregeln.

---

# Grundprinzip

Bei HUI werden Behauptungen durch überprüfbare Nachweise ersetzt.

Eine Änderung gilt niemals als abgeschlossen, weil sie programmiert wurde.

Sie gilt ausschließlich dann als abgeschlossen, wenn sie nachweislich in der laufenden App existiert.

---

# Definition von "Done"

Eine Aufgabe erhält erst dann den Status "Erledigt", wenn ALLE folgenden Punkte erfüllt sind.

## 1. Implementierung

□ Code wurde geschrieben.

□ Der Code entspricht der Aufgabenstellung.

---

## 2. Build

□ Der Build läuft fehlerfrei.

□ Es existieren keine Build-Warnungen, die die Funktion beeinflussen.

---

## 3. Git

□ Der Commit wurde erstellt.

□ Der Commit befindet sich im richtigen Branch.

□ Der Pull Request existiert.

---

## 4. Merge

□ Der Pull Request wurde gemerged.

□ Der Commit befindet sich nachweislich auf main.

Ein offener oder Draft-PR gilt NICHT als umgesetzt.

---

## 5. Deployment

□ Die neue Version wurde erfolgreich deployed.

□ Die laufende Version verwendet den aktuellen Commit.

---

## 6. Laufzeitprüfung

Die Änderung muss in der laufenden Anwendung überprüft werden.

Mindestens folgende Nachweise sind zu erbringen:

□ Komponente existiert im Repository.

□ Komponente wird importiert.

□ Komponente wird gerendert.

□ Bestandteil des Bundles.

□ Bestandteil des DOM.

□ Zur Laufzeit sichtbar.

---

## 7. Sichtprüfung

Nicht der Code entscheidet.

Nicht der Build entscheidet.

Nicht der Pull Request entscheidet.

Sondern ausschließlich das tatsächlich sichtbare Ergebnis in der laufenden Anwendung.

Wenn die Änderung nicht sichtbar ist,
ist die Aufgabe nicht abgeschlossen.

---

# Kommunikationsregel

Folgende Aussagen dürfen NICHT verwendet werden:

❌ "Erledigt."

❌ "Implementiert."

❌ "Behoben."

❌ "Deployed."

solange keine vollständige Verifikation erfolgt ist.

Stattdessen wird unterschieden zwischen:

**Implementiert**

= Code geschrieben.

**Verifiziert**

= Nachweislich in der laufenden Anwendung vorhanden.

Nur "Verifiziert" bedeutet abgeschlossen.

---

# Unsicherheit

Falls Informationen fehlen, ist dies klar zu kennzeichnen.

Beispiele:

"Das ist eine Vermutung."

"Das konnte ich nicht überprüfen."

"Hierfür fehlt mir ein Nachweis."

Vermutungen dürfen niemals als Tatsachen formuliert werden.

---

# Wahrheit vor Geschwindigkeit

Eine ehrliche Aussage wie

"Ich weiß es noch nicht."

ist wertvoller als eine unbelegte Behauptung.

---

# Release Guardian

Vor jedem Abschluss einer Aufgabe erfolgt automatisch eine Verifikation.

Checkliste:

□ PR gemerged

□ Commit auf main

□ Deployment erfolgreich

□ Bundle enthält Änderung

□ DOM enthält Änderung

□ Laufzeit bestätigt

□ Sichtprüfung bestanden

Erst danach erhält die Aufgabe den Status:

✅ VERIFIED

Vorher bleibt der Status:

⏳ IMPLEMENTIERT

oder

❌ NICHT VERIFIZIERT

---

# Grundsatz

Bei HUI gilt:

Code ist nicht die Wahrheit.

Der Build ist nicht die Wahrheit.

Ein Pull Request ist nicht die Wahrheit.

Die einzige Wahrheit ist das nachweisbare Verhalten der laufenden Anwendung.

Diese Regel ist verbindlicher Bestandteil der HUI-Entwicklungsphilosophie und gilt für alle zukünftigen Entwicklungen.
