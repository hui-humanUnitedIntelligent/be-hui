# HUI White Screen — Bekannte Ursachen & Prävention

**Stand:** 2026-08-22  
**Verbindlich für:** Alle Entwickler, KI-Systeme, Build-Prozesse

---

## Was ist ein White Screen?

Die App lädt (HTML kommt, JS-Module wird geladen), aber `#web-root` (web)
oder `#root` (mobile) bleibt leer — React hat nichts gerendert.
Der Nutzer sieht einen leeren weißen/cremefarbenen Bildschirm.

---

## Bekannte Ursachen (geordnet nach Häufigkeit)

### 1. React.lazy + Vite Suspense Hang (ISSUE #807)

**Symptom:** App lädt, Spinner erscheint kurz, dann weißer Screen. Keine
Fehlermeldung. `Suspense`-Fallback wird nie durch das echte Component ersetzt.

**Root Cause:** `React.lazy()` + Vite's `__vitePreload` hängen fest — der
dynamische Import wird nie resolved, Suspense wartet ewig.

**Fix:** Kritische Routen (LoginPage, LandingPage, AuthCallback,
PublicProfilePage) als **eager imports** — kein `React.lazy`, kein `Suspense`.
Nur AuthenticatedApp bleibt lazy (wird nur nach Login gerendert).

**Prävention:** Neue öffentliche Routen NIEMALS mit `React.lazy()`.
Wenn Lazy-Loading nötig: auf `modulePreload: false` in `vite.config.js`
achten und manuell testen.

**Referenz:** Commit e1122cde, Memory #807

---

### 2. Modul-Scope Init-Funktionen ohne try-catch

**Symptom:** White Screen sofort beim Laden. Keine Fehlermeldung sichtbar.
`createRoot()` wird nie erreicht.

**Root Cause:** `initSentry()`, `initGlobalKeyboardHandling()`,
`initAppPerformance()` etc. werden VOR `createRoot()` aufgerufen. Wenn eine
davon crasht (z.B. Sentry-DSN nicht gesetzt, `@sentry/react` Modul-Fehler),
stoppt die gesamte Modul-Ausführung. `createRoot()` wird nie aufgerufen.

**Fix:** ALLE Init-Aufrufe in `try-catch` wrappen:
```js
try { initSentry(); } catch (e) { console.error('[HUI] Sentry init failed:', e); }
try { initGlobalKeyboardHandling(); } catch (e) { console.error('[HUI] KB init failed:', e); }
```

**Prävention:** Jede neue Init-Funktion in `main.jsx` / `web-main.jsx` MUSS
in try-catch. Code-Review prüft das explizit.

**Referenz:** Commit 1d3f98f6

---

### 3. ChunkLoadError — Stale Assets nach Deploy

**Symptom:** App funktioniert nach einem neuen Deploy nicht mehr.
Fehler: `Failed to fetch dynamically imported module` oder
`Loading chunk web-AbCd123.js failed`.

**Root Cause:** Vite generiert content-hashed Chunk-Dateinamen
(`web-AbCd123.js`). Nach einem neuen Deploy hat der alte HTML-Verweis
noch den alten Hash → Datei existiert nicht mehr → Import schlägt fehlt.

**Fix:** 
- `GlobalAppBoundary` fängt ChunkLoadError und triggert auto-reload
  (mit 10s sessionStorage Guard gegen Endlos-Schleifen)
- `web.html` Guard prüft alle Errors auf Chunk-Muster
- Service Worker: `sw.js` mit `no-cache, no-store` Header

**Prävention:** Jeder dynamische Import-Pfad muss durch den
Chunk-Reload-Mechanismus abgedeckt sein. `Cache-Control: no-store` auf
HTML-Dateien in `vercel.json` sicherstellen.

**Referenz:** Memory #939, `componentDidCatch` in `GlobalAppBoundary`

---

### 4. Vercel Stale Deployment

**Symptom:** Code-Änderungen werden trotz `git push` nicht auf Vercel
sichtbar. Chunk-Hashes stimmen nicht überein.

**Root Cause:** Bei schnellen aufeinanderfolgenden Pushes kann Vercel
 Builds überspringen oder CDN-Caching verzögert sich.

**Fix:** 
- Warte mindestens 60-90s nach Push vor Verifikation
- Prüfe immer: `curl -s https://be-hui.vercel.app/app/login | grep -o 'web-[A-Za-z0-9_-]*\.js'`
  und vergleiche mit lokalem Build-Output (`ls www/assets/web-*.js`)
- Bei Mismatch: Vercel-Deployment-Logs prüfen
- `Cache-Control: no-store, no-cache` auf `web.html` in `vercel.json`

**Prävention:** Nach JEDEM Push: Chunk-Hash vergleichen vor Verifikation.

---

### 5. OTA Crash-Loop (Mobile, ISSUE OTA v5)

**Symptom:** Mobile App zeigt permanent weißen Screen. OTA-Updates
kommen nicht durch. App kann sich nicht selbst heilen.

**Root Cause:** `notifyAppReady()` wurde VOR React-Render gerufen →
Plugin denkt "Version ist stabil" → React crasht → Plugin rollt NICHT
zurück → Crash-Loop → keine weitere OTA kommt durch.

**Fix:** `notifyAppReady()` aus `initOTA()` entfernt → neue
`confirmAppReady()` Funktion → in `App.jsx useEffect` nach erstem
Render gerufen. Wenn React crasht: useEffect läuft nie → kein
notifyAppReady → Plugin rollt nach 3 Crashes automatisch zurück.

**Prävention:** `notifyAppReady()` NIEMALS vor dem ersten React-Render
aufrufen. Backup-Dateien NIEMALS in `src/` commiten (Vite könnte sie als
Module erfassen).

**Referenz:** Memory OTA v5 Crash-Recovery

---

### 6. CSS / Layout White Screen

**Symptom:** React hat gerendert (DOM hat Children), aber nichts ist
sichtbar — `display:none`, `height:0`, `opacity:0`, `overflow:hidden`
auf Root-Containern.

**Root Cause:** Falsche CSS-Kombination auf Container-Elementen.
z.B. `animation-fill-mode: both` mit transienter `opacity:0` deaktiviert
Pointer-Events und Sichtbarkeit.

**Fix:** CSS-Animationen mit `forwards` statt `both`, `pointer-events: auto`
auf interaktive Elemente.

**Prävention:** Nach CSS-Änderungen an Root-Containern: Sichtprüfung
in der laufenden App (nicht nur Code-Review).

**Referenz:** Memory #794

---

### 7. Stacking Context Traps (Mobile)

**Symptom:** Modals/Overlays erscheinen hinter der Navbar, sind nicht
klickbar. Visuell wirkt es wie ein "kaputter" Screen.

**Root Cause:** `filter`, `transform`, `opacity < 1`, `will-change`,
`isolation`, `perspective` auf einem Vorfahren erzeugt einen eigenen
Stacking-Context. z-index-Werte werden NUR innerhalb dieses Kontexts
verglichen — egal wie hoch.

**Fix:** `createPortal(..., document.body)` für alle Modals/Overlays
(siehe Regel `footer-navbar-zindex.md`). `zIndex >= 10500`.

**Prävention:** Jedes neue Modal/Sheet MUSS per Portal gerendert werden.
Checkliste in `footer-navbar-zindex.md` befolgen.

**Referenz:** Memory #530

---

### 8. Backup-Dateien im Source-Tree

**Symptom:** Build bricht ab oder produziert kaputtes Bundle.
Android: `class X is public, should be declared in a file named X.java`.

**Root Cause:** Backup-Dateien (z.B. `backup_20260815_MainActivity.java`)
im `src/main/java/` oder `src/main/res/` Ordner werden vom Compiler
als echte Module/Ressourcen erfasst.

**Fix:** Backups NIE in `src/`, `java/`, `res/` ablegen. Stattdessen:
`android/java_backups/`, `android/icon_backups/`, oder außerhalb von `src/`.

**Prävention:** Siehe Regeln `android-java-backup.md`, `android-res-backup.md`.

---

## White Screen Guard v2 — Was es abfängt

| Fehler-Typ | Abgefangen? | Mechanismus |
|---|---|---|
| Modul-Lade-Fehler (404, syntax) | ✅ | `window.error` listener |
| React-Render-Crash | ✅ | `GlobalAppBoundary` (ErrorBoundary) |
| ChunkLoadError | ✅ | Auto-Reload (sessionStorage Guard) |
| Stiller Modul-Import-Fehler | ✅ | 5s Fallback (leerer `#web-root` Check) |
| CSS-bedingter White Screen | ❌ | Nicht abfangbar (DOM hat Children) |
| OTA Crash-Loop | ✅ | `confirmAppReady` nach Render |

## White Screen Guard v2 — Was es anzeigt

- HUI-gebrandete Fehlerseite (cream Hintergrund, ✦ Logo)
- Fehler-Details (aufklappbar): Typ, Message, Stack, Source-File
- "Neu laden" Button (full page reload)
- "Cache leeren" Button (Service Worker unregister + reload)
- Auto-Report via `sendBeacon` an sadb-webhook (best-effort)
- Timestamp + User-Agent für Diagnose

---

## Checkliste vor jedem Deploy (PFLICHT)

1. **Chunk-Hash prüfen:** Lokaler Build vs. Vercel — stimmen sie überein?
2. **Init-Funktionen:** Alle in try-catch? (main.jsx + web-main.jsx)
3. **Neue Routen:** Eager imports für öffentliche Routen? (kein React.lazy)
4. **Neue Modals:** Per `createPortal` + `zIndex >= 10500`?
5. **Backup-Dateien:** Nicht in `src/`, `java/`, `res/`?
6. **Cache-Control:** `no-store` auf HTML in `vercel.json`?
7. **Sichtprüfung:** In der laufenden App, nicht nur im Code
8. **modulePreload:** `false` in `vite.config.js` (verhindert Suspense-Häng)
