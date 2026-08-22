# HUI Known Errors Database (Lernsystem — Punkt 7)

**Stand:** 2026-08-22
**Zweck:** Jeder behobene Fehler wird hier dokumentiert.
Zukünftige Builds werden gegen diese Liste geprüft —
bekannte Fehler dürfen NIE wieder auftreten.

---

## Aktive Known Errors (automatisch gefüllt)

### WS-001: React.lazy + Vite Suspense Hang

- **Fingerprint:** `suspense_hang:*:Suspense/__vitePreload`
- **Ursache:** `React.lazy()` + Vite's `__vitePreload` hängen fest — Suspense wartet ewig.
- **Lösung:** Öffentliche Routen als eager imports (kein React.lazy). `modulePreload: false` in vite.config.js.
- **Behoben:** 2026-08-22, Commit e1122cde
- **Prävention:** Neue öffentliche Routen NIEMALS mit `React.lazy()`.

### WS-002: Modul-Scope Init ohne try-catch

- **Fingerprint:** `modul_init_crash:*:init*`
- **Ursache:** Init-Funktion crash vor `createRoot()` → Modul-Ausführung stoppt.
- **Lösung:** ALLE Init-Aufrufe in try-catch wrappen.
- **Behoben:** 2026-08-22, Commit 1d3f98f6
- **Prävention:** Jede neue Init-Funktion in main.jsx/web-main.jsx MUSS in try-catch.

### WS-003: ChunkLoadError (stale assets)

- **Fingerprint:** `chunk_load_error:*:ChunkLoadError`
- **Ursache:** Stale Chunk-Hash nach Deploy — Datei existiert nicht mehr.
- **Lösung:** Auto-Reload mit 10s sessionStorage Guard (max 2 Retries, dann Fallback-UI).
- **Behoben:** 2026-08-22
- **Prävention:** `Cache-Control: no-store` auf HTML in vercel.json.

### WS-005: OTA Crash-Loop (Mobile)

- **Fingerprint:** `ota_crash_loop:*:notifyAppReady`
- **Ursache:** `notifyAppReady()` vor React-Render → Plugin denkt Version stabil → Crash-Loop.
- **Lösung:** `confirmAppReady()` in App.jsx useEffect nach erstem Render.
- **Behoben:** 2026-08-21, v2.1.322
- **Prävention:** `notifyAppReady()` NIEMALS vor dem ersten React-Render.

### WS-006: CSS Layout White Screen

- **Fingerprint:** `css_white_screen:*:animation-fill-mode`
- **Ursache:** `animation-fill-mode: both` mit transienter `opacity:0` deaktiviert Pointer-Events.
- **Lösung:** `forwards` statt `both`, `pointer-events: auto` auf interaktive Elemente.
- **Behoben:** 2026-07-28
- **Prävention:** Nach CSS-Änderungen an Root-Containern: Sichtprüfung.

### WS-007: Stacking Context Traps

- **Fingerprint:** `stacking_context_trap:*:z-index`
- **Ursache:** `filter`, `transform`, `opacity < 1` auf Ancestor erzeugt Stacking-Context.
- **Lösung:** `createPortal(..., document.body)` für alle Modals. `zIndex >= 10500`.
- **Behoben:** 2026-07-05
- **Prävention:** Jedes neue Modal MUSS per Portal gerendert werden.

### WS-008: Backup-Dateien im Source-Tree

- **Fingerprint:** `backup_in_source_tree:*:is public`
- **Ursache:** Backup-Dateien in `src/`, `java/`, `res/` werden vom Compiler erfasst.
- **Lösung:** Backups NIE in `src/`, `java/`, `res/`. Stattdessen `android/java_backups/`, etc.
- **Behoben:** 2026-08-15
- **Prävention:** Pre-Deploy Gate prüft automatisch auf Backup-Dateien.

### WS-100: LoginPage Brace-Mismatch White Screen

- **Fingerprint:** `white_screen:LoginPage.jsx:handleLogin`
- **Ursache:** Fehlende schließende `}` in `handleLogin` → LoginPage() return undefined → React 18 committed leeren Tree ohne Error.
- **Lösung:** Klammer ergänzt, doppelte `}` am Dateiende entfernt.
- **Behoben:** 2026-08-22, Commit 67502ac6
- **Prävention:** Brace-Bilanz-Prüfung vor jedem Commit (acorn --module --ecma2022).

### WS-101: Login-Button versehentlich gelöscht (Collateral Damage)

- **Fingerprint:** `js_error:LoginPage.jsx:PrimaryBtn submit`
- **Ursache:** Ambassador-Removal-Commit (f473c037) löschte Submit-Button + Error/Success-Feedback mit.
- **Lösung:** Submit-Button + ErrorMessage/SuccessMessage + "Passwort vergessen?" wiederhergestellt.
- **Behoben:** 2026-08-22, Commit d617fb7d
- **Prävention:** Diff-Hunks sorgfältig prüfen — nicht nur die Ziel-Zeilen entfernen.

---

## Format für neue Einträge

```
### [ERROR-CODE]: [Name]

- **Fingerprint:** `[fingerprint pattern]`
- **Ursache:** [Root Cause Beschreibung]
- **Lösung:** [Was wurde geändert]
- **Behoben:** [Datum], [Commit/Version]
- **Prävention:** [Wie wird verhindert dass es wieder auftritt]
```

---

## Automatisches Lernsystem

Die `errorReporter.js` Bibliothek:
1. Speichert behobene Fehler in `localStorage` (`hui_known_errors`)
2. Prüft jeden neuen Fehler gegen diese Datenbank (`checkReoccurrence()`)
3. Bei Reoccurrence: Event `system_error_reoccurred` wird ausgelöst
4. Der `pre-deploy-gate.sh` prüft Build gegen diese Liste

## SADB Events (Punkt 8)

Folgende Events werden an SADB gesendet:
- `system_error_detected` — Fehler erkannt
- `system_error_report_created` — Report erzeugt
- `system_error_sent_to_admin` — An Dashboard gesendet
- `system_error_grouped` — Fehler gruppiert
- `system_error_fixed` — Als behoben markiert
- `system_error_reoccurred` — Fehler erneut aufgetreten
