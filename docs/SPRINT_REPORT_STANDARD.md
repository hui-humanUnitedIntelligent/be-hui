# HUI - STANDARD-ABSCHLUSSBERICHT NACH JEDEM SPRINT

Dieses Dokument definiert den verbindlichen Abschlussbericht fuer jede
abgeschlossene Aufgabe und jeden Sprint in HUI.

Ziel ist eine lebende Architektur- und Implementierungsdokumentation, die auch
spaeter noch aus dem Quellcode nachvollziehbar bleibt.

---

## Anwendungsbereich

Ein Abschlussbericht ist Pflicht nach:

- jeder abgeschlossenen Implementierungsaufgabe
- jedem Refactoring-Sprint
- jedem Architektur-Sprint
- jeder Fehlerbehebung mit Codeaenderung
- jeder Dokumentationsaenderung, wenn sie Architektur- oder Prozessregeln
  betrifft

Der Bericht beschreibt nur belegbare Fakten aus dem aktuellen Repository-Zustand.
Unbelegte Annahmen, Absichten oder erfundene Komponenten sind nicht erlaubt.

---

## Belegregeln

Jeder Bericht muss:

- echte Dateipfade nennen
- tatsaechlich analysierte Dateien nennen
- tatsaechlich geaenderte, neue oder entfernte Dateien nennen
- UI, Logik, Datenfluss und Architektur klar trennen
- bekannte Risiken und technische Schulden explizit ausweisen
- Empfehlungen nur nennen, aber nicht im Bericht implementieren

Falls ein Abschnitt nicht zutrifft, muss der Bericht dies ausdruecklich sagen,
zum Beispiel:

- `Keine Architekturaenderung.`
- `Keine bekannten Risiken.`
- `Keine neuen technischen Schulden entstanden.`
- `Keine neuen Dateien.`
- `Keine entfernten Dateien oder Legacy-Code.`

---

## Pflichtschema

Die folgende Markdown-Struktur ist unveraendert fuer jeden Sprint- oder
Aufgabenabschluss zu verwenden.

````markdown
# Sprint X.X - Titel

## 1. Ziel

Beschreibe kurz das Ziel des Sprints.

- Was sollte erreicht werden?
- Welches Problem wurde geloest?
- Warum war diese Aenderung notwendig?

---

## 2. Analysierte Dateien

Liste alle analysierten Dateien auf.

Fuer jede Datei:

- Dateipfad:
- Verantwortlichkeit:
- Warum wurde sie untersucht?

---

## 3. Geaenderte Dateien

Fuer jede geaenderte Datei:

- Dateipfad:
- Kurzbeschreibung der Aenderung:
- Hinzugefuegte Zeilen:
- Entfernte Zeilen:

Falls keine geaenderten Dateien vorhanden sind:

Keine geaenderten Dateien.

---

## 4. Neue Dateien

Falls neue Dateien erstellt wurden:

- Dateipfad:
- Verantwortlichkeit:
- Warum existiert diese Datei?

Falls keine neuen Dateien erstellt wurden:

Keine neuen Dateien.

---

## 5. Entfernte Dateien oder Legacy-Code

Dokumentiere:

- entfernte Komponenten
- entfernte Hooks
- entfernte States
- entfernte Storage-Keys
- entfernte Kommentare
- Legacy-Code
- Tombstones

Erklaere jeweils kurz warum.

Falls nichts entfernt wurde:

Keine entfernten Dateien oder Legacy-Code.

---

## 6. Architekturaenderungen

Beschreibe ausschliesslich die Architektur.

Beantworte, falls zutreffend:

- Welche Verantwortlichkeiten wurden verschoben?
- Welche Komponenten wurden vereinfacht?
- Welche neuen Architekturgrenzen entstanden?
- Welche Komponenten sind jetzt nur noch UI?
- Welche Komponenten enthalten jetzt Logik?
- Welche Hooks uebernehmen welche Verantwortung?

Falls keine Architekturaenderung stattfand:

Keine Architekturaenderung.

---

## 7. Datenfluss

Dokumentiere den aktuellen Call-Flow.

Nur den tatsaechlichen Ablauf dokumentieren.

Beispiel:

```text
App
->
Home
->
HomeShell
->
UnifiedFeed
->
FeedWelcomeHeader
->
FeedList
->
FeedRouter
->
BaseFeedCard
```

Falls kein Laufzeit-Datenfluss betroffen ist:

Kein Laufzeit-Datenfluss betroffen.

---

## 8. Laufzeitverhalten

Beschreibe:

- Was sieht der Nutzer jetzt?
- Was passiert beim Start?
- Welche Unterschiede gibt es zum vorherigen Verhalten?

Falls kein Laufzeitverhalten betroffen ist:

Kein Laufzeitverhalten betroffen.

---

## 9. Risiken

Falls vorhanden:

- moegliche Seiteneffekte
- bekannte Einschraenkungen
- offene Punkte

Falls keine Risiken bestehen:

Keine bekannten Risiken.

---

## 10. Technische Schulden

Liste Bereiche auf, die kuenftig verbessert werden sollten.

Zum Beispiel:

- grosse Komponenten
- doppelte Logik
- Legacy-Code
- fehlende Tests
- Optimierungspotenzial

Falls nichts auffaellt:

Keine neuen technischen Schulden entstanden.

---

## 11. Empfehlungen fuer den naechsten Sprint

Nicht implementieren.

Nur auflisten:

- Welche sinnvollen naechsten Schritte ergeben sich?
- Welche Architektur sollte als Naechstes verbessert werden?
- Welche Komponenten eignen sich fuer den naechsten Sprint?

---

## 12. Abschlussbewertung

Bewerte den Sprint hinsichtlich:

- Codequalitaet:
- Architekturqualitaet:
- Wartbarkeit:
- Erweiterbarkeit:
- Risiken:

Skala: 1-10.
````

---

## Berichtspraxis

Vor dem Schreiben des Abschlussberichts muessen die tatsaechlichen Aenderungen
aus dem Repository geprueft werden:

- `git diff --stat`
- `git diff --numstat`
- `git status`
- relevante Quellcode- und Dokumentationsdateien

Die Werte fuer hinzugefuegte und entfernte Zeilen muessen aus `git diff
--numstat` oder einem gleichwertigen Git-Vergleich stammen, sofern verfuegbar.
Wenn keine Zeilenzahlen verfuegbar sind, muss der Bericht dies klar sagen.

---

## Qualitaetsregel

Ein Abschlussbericht ist nur gueltig, wenn er aus dem aktuellen Quellcode
abgeleitet ist und keine Vermutungen enthaelt.
