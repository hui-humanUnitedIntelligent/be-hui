# android/ — Capacitor Android Wrapper

Dieser Ordner enthält die native Android-Hülle (Capacitor/`BridgeActivity`),
die den be-hui Web-Build (`dist/`) als APK verpackt. Import 2026-07-09 vom
lokalen Capacitor-Projekt des Nutzers (Michael), als RAR-Datei übergeben.

## Bekannter Fix: Android-System-Navigationsleiste überlappte die App-Navbar

`app/src/main/java/com/hui/app/MainActivity.java` enthält den Fix für das
Problem, dass die Android-3-Tasten-/Gesten-Navigationsleiste die eigene
App-Bottom-Navbar überdeckte (Capacitor zeichnet das WebView standardmäßig
"edge-to-edge" ohne System-Insets zu berücksichtigen):

- `WindowCompat.setDecorFitsSystemWindows(getWindow(), true)` — vor
  `super.onCreate()`, damit Android den Content-Bereich automatisch um die
  System-Insets verkleinert.
- Zusätzlich ein `OnApplyWindowInsetsListener` auf der Root-View, der das
  Bottom-Padding explizit auf die System-Bars-Insets setzt (Redundanz/
  Absicherung, falls Punkt 1 auf einem Geräte-/Android-Versions-Mix nicht
  ausreicht).

## Generierter Inhalt — NICHT versioniert

`app/src/main/assets/public/` (der eigentliche Web-Bundle-Snapshot) wird
bewusst NICHT ins Repo übernommen — das ist Build-Output, kein Quellcode.
Vor jedem APK-Build erzeugen mit:

```bash
npm run build          # erzeugt dist/
npx cap sync android    # kopiert dist/ nach android/app/src/main/assets/public/
```

## Unvollständig übernommen — noch offen (RAR-Kompressionsfehler beim Import)

Beim Entpacken der übergebenen RAR-Datei kamen folgende Dateien beschädigt
(0 Bytes) an und wurden NICHT übernommen, um keine kaputten/leeren Dateien
zu committen (Charta: keine Annahmen/erfundenen Inhalte). Fehlen noch,
bevor dieser Ordner allein buildfähig ist:

- `app/build.gradle` (Module-Level Gradle-Konfiguration — **kritisch**,
  ohne diese Datei kann das Projekt nicht gebaut werden)
- `app/src/main/res/values/strings.xml`
- `app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png`
- `capacitor-cordova-android-plugins/cordova.variables.gradle`

Bitte diese 4 Dateien einzeln nachreichen (z.B. als Textinhalt oder in
einem ZIP statt RAR — zuverlässigere Kompatibilität beim Entpacken).
