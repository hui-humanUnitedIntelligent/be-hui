# HUI RC1 — QA Tracker

**Repository:** be-hui  
**RC1-Integrationsstand:** PR #139  
**Freeze ab:** 2026-07-15  
**Aktuelle Version:** `1.0` (`src/version.ts`)

---

## Freeze-Status

Ab diesem Zeitpunkt gilt:

| Erlaubt | Nicht erlaubt |
|---|---|
| Bugfixes | Neue Features |
| Regression-Fixes | Designänderungen |
| Crash-Fixes | Neue Animationen |
| Build-Fixes | Performance-Experimente |
| Datenfehler | Architekturänderungen |
| Sicherheitsfehler | Refactorings |

**Regel:** Jede Änderung muss einen reproduzierbaren Fehler beheben. Keine Sammel-PRs.

---

## Bugfix-Workflow

Für jeden gefundenen Fehler:

1. Bug reproduzieren
2. Root Cause beweisen
3. Genau einen Fix (eine PR pro Bug)
4. Build
5. Erneut testen

---

## Testplan — Checkliste

### 1. Feed

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Neuer Beitrag erscheint sofort | ☐ | ☐ | ☐ | |
| Chronologische Reihenfolge stimmt | ☐ | ☐ | ☐ | |
| Bereich „Demnächst" zeigt nur kommende Erlebnisse | ☐ | ☐ | ☐ | |
| Keine doppelten Beiträge | ☐ | ☐ | ☐ | |
| Keine fehlenden Beiträge | ☐ | ☐ | ☐ | |
| Infinite Scroll funktioniert | ☐ | ☐ | ☐ | |
| Kein weißer Bereich | ☐ | ☐ | ☐ | |
| Keine Sprünge | ☐ | ☐ | ☐ | |

### 2. Safari (Gesamt)

| Bereich | Getestet | Status |
|---|---|---|
| Feed | ☐ | |
| Scrollen | ☐ | |
| Bilder | ☐ | |
| Profil | ☐ | |
| Mein HUI | ☐ | |
| Commerce | ☐ | |

### 3. Firefox (Gesamt)

| Bereich | Getestet | Status |
|---|---|---|
| Feed | ☐ | |
| Scrollen | ☐ | |
| Bilder | ☐ | |
| Profil | ☐ | |
| Mein HUI | ☐ | |
| Commerce | ☐ | |

### 4. Android / APK (Gesamt)

| Bereich | Getestet | Status |
|---|---|---|
| Feed | ☐ | |
| Scrollen | ☐ | |
| Bilder | ☐ | |
| Profil | ☐ | |
| Mein HUI | ☐ | |
| Commerce | ☐ | |

### 5. Commerce

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Werk öffnen | ☐ | ☐ | ☐ | |
| Erlebnis öffnen | ☐ | ☐ | ☐ | |
| Warenkorb | ☐ | ☐ | ☐ | |
| Checkout | ☐ | ☐ | ☐ | |
| Stripe | ☐ | ☐ | ☐ | |
| Resonanz | ☐ | ☐ | ☐ | |

### 6. Profile

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Eigenes Profil | ☐ | ☐ | ☐ | |
| Fremdes Profil | ☐ | ☐ | ☐ | |
| Wirker | ☐ | ☐ | ☐ | |
| Werke | ☐ | ☐ | ☐ | |
| Momente | ☐ | ☐ | ☐ | |
| Empfehlungen | ☐ | ☐ | ☐ | |

### 7. Suche

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Suche | ☐ | ☐ | ☐ | |
| Kategorien | ☐ | ☐ | ☐ | |
| Radius | ☐ | ☐ | ☐ | |
| Filter | ☐ | ☐ | ☐ | |

### 8. Chat

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Chat öffnen | ☐ | ☐ | ☐ | |
| Nachricht senden | ☐ | ☐ | ☐ | |
| Realtime | ☐ | ☐ | ☐ | |

### 9. Impact

| Prüfpunkt | Safari | Firefox | Android/APK | Status |
|---|---|---|---|---|
| Projekte | ☐ | ☐ | ☐ | |
| Stimmen | ☐ | ☐ | ☐ | |
| Verlauf | ☐ | ☐ | ☐ | |

---

## Bug-Tracker

**Prioritäten:**

| Stufe | Bedeutung |
|---|---|
| P0 | Crash, Datenverlust, Checkout/Stripe blockiert, Login unmöglich |
| P1 | Kernfunktion defekt, Workaround schwer oder nicht vorhanden |
| P2 | Eingeschränkte Funktion, Workaround vorhanden |
| P3 | Kosmetisch, geringe Auswirkung |

**Status-Werte:** `Offen` · `In Bearbeitung` · `Behoben` · `Verifiziert`

| ID | Prio | Bereich | Gerät | Browser | Reproduzierbar | Root Cause | PR | Status |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | *Noch keine Bugs erfasst* |

### Bug-Eintrag Vorlage

```markdown
### RC1-XXX — Kurztitel

- **Prio:** P0 | P1 | P2 | P3
- **Bereich:** Feed | Safari | Firefox | Android | Commerce | Profile | Suche | Chat | Impact
- **Gerät:** z. B. iPhone 15, Pixel 8, MacBook
- **Browser:** Safari 18 / Firefox 128 / APK
- **Reproduzierbar:** Ja — Schritte: 1. … 2. … 3. …
- **Root Cause:** (nach Analyse ausfüllen)
- **PR:** #NNN
- **Status:** Offen | In Bearbeitung | Behoben | Verifiziert
```

---

## Release-Kriterien

RC1 gilt als freigegeben, wenn alle Punkte erfüllt sind:

| Kriterium | Status |
|---|---|
| Build stabil | ☐ |
| Feed stabil | ☐ |
| Safari stabil | ☐ |
| Firefox stabil | ☐ |
| APK stabil | ☐ |
| Commerce stabil | ☐ |
| Keine P0 Bugs | ☐ |
| Keine P1 Bugs | ☐ |

---

## Changelog (RC1-Freeze)

| Datum | ID | Aktion | PR |
|---|---|---|---|
| 2026-07-15 | — | RC1-Freeze gestartet, QA-Tracker angelegt | — |
