# HUI RC1 — QA Tracker

**Repository:** be-hui  
**RC1-Integrationsstand:** PR #139 (gemergt 2026-07-15)  
**Freeze ab:** 2026-07-15  
**`main` Commit:** `6f56aa08`

---

## Automatisierte Verifikation (2026-07-15)

| Prüfung | Branch | Ergebnis |
|---|---|---|
| `npm install` | Integration (#139) | ✅ PASS (376 packages) |
| `npm run build` | Integration (#139) | ✅ PASS (804 modules, 5.16s) |
| `npm install` | `main` @ `6f56aa08` | ✅ PASS (376 packages) |
| `npm run build` | `main` @ `6f56aa08` | ✅ PASS (804 modules, 5.26s) |
| Feed Reality Check | Integration (#139) | ✅ PASS — Realtime-Verlust behoben, IO-Root korrekt |
| ESLint `src/feed/` | Integration (#139) | ⚠️ PRE-EXISTING — `react-hooks/exhaustive-deps` Regel nicht konfiguriert |

**Manuell ausstehend:** Safari, Firefox, Android/APK (kein WebKit/APK in Cloud-Umgebung).

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
| RC1-001 | P0 | Build | Cloud CI | — | Ja — `npm install` auf `main` | `package.json` referenziert nicht existierendes Paket `stripe-js@^1.54.0`; fehlende Peer-Deps | [#139](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/139) | Verifiziert |
| RC1-002 | P3 | Build | Cloud CI | — | Ja — `npx eslint src/feed/` | ESLint-Plugin `react-hooks/exhaustive-deps` in `eslint.config.js` nicht registriert | — | Offen |

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
| Build stabil | ✅ `main` @ `6f56aa08` — npm install + build PASS |
| Feed stabil | ⏳ Automatisiert ✅ — Geräte-QA ausstehend |
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
| 2026-07-15 | — | RC1-Freeze gestartet, QA-Tracker angelegt | [#141](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/141) |
| 2026-07-15 | RC1-001 | Build-Blocker auf `main` identifiziert; Fix in Integrations-Branch verifiziert | [#139](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/139) |
| 2026-07-15 | — | Feed Reality Check + Build auf Integrations-Branch bestanden | [#139](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/139) |
| 2026-07-15 | RC1-002 | ESLint-Konfigurationsfehler dokumentiert (nicht RC1-blockierend) | — |
| 2026-07-15 | RC1-001 | PR #139 gemergt; Build auf `main` erneut verifiziert | [#139](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/139) |
