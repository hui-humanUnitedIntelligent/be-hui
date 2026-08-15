package com.hui.app;

import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_REQUEST_CODE = 1001;
    private WebView webViewRef;

    // JS-Interface für Mikrofon-Berechtigung
    // Wird von JS aufgerufen: window.__HUI_MIC.requestPermission()
    public class MicPermissionInterface {
        @android.webkit.JavascriptInterface
        public void requestPermission() {
            runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED) {
                    if (webViewRef != null) {
                        webViewRef.evaluateJavascript(
                            "window.__HUI_MIC_PERMISSION_RESULT(true)", null);
                    }
                } else {
                    ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        MIC_PERMISSION_REQUEST_CODE);
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MIC_PERMISSION_REQUEST_CODE) {
            boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (webViewRef != null) {
                webViewRef.evaluateJavascript(
                    "window.__HUI_MIC_PERMISSION_RESULT(" + granted + ")", null);
            }
        }
    }

    // SCALE-FIX (2026-08-10): Android "Anzeigegröße" (Display Size) ist eine
    // System-Einstellung, die die effektive Density (densityDpi) für ALLE Apps
    // hochskaliert -- inkl. unserer WebView (Buttons/Text/Navbar werden dadurch
    // ueberproportional gross, "device-width" in CSS-px schrumpft effektiv).
    // Fix: App-eigene Resources auf DENSITY_DEVICE_STABLE resetieren, aber NUR
    // wenn die Density hoeher als der Standard ist (Display Size = "Gross").
    // Bei Display Size = "Klein" oder Default: NICHT aendern — sonst wuerde
    // die Density erhoeht und alles erscheint gezoomt (Bug: Avatar/Cover-Bild
    // Zoom bei APK-Build, 2026-08-10). Betrifft NUR unsere App --
    // andere Apps und die native Status-Bar bleiben unveraendert
    // (Status-Bar wird vom System-Prozess gezeichnet, nicht von uns).
    @Override
    public Resources getResources() {
        Resources res = super.getResources();
        if (res.getConfiguration().densityDpi > DisplayMetrics.DENSITY_DEVICE_STABLE) {
            DisplayMetrics dm = new DisplayMetrics();
            dm.setTo(res.getDisplayMetrics());
            dm.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE;
            Configuration cfg = new Configuration(res.getConfiguration());
            cfg.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE;
            res.updateConfiguration(cfg, dm);
        }
        return res;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // ── Edge-to-Edge: App zeichnet hinter System-Bars ────────────────
        // setDecorFitsSystemWindows(false) = App ist für eigene Insets
        // verantwortlich. Capacitor/WebView liefert env(safe-area-inset-*)
        // an CSS, sobald die App hinter die Bars zeichnet.
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Transparente Bars
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        }

        // Android 10+ (API 29): Gesturenavigation — kein Kontrast-Balken
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // WebView-Remote-Debugging
        WebView.setWebContentsDebuggingEnabled(true);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // WebView-Cache leeren bei jedem Start
            webView.clearCache(true);

            // textZoom hart auf 100 fixieren — verhindert Rundungsfehler bei
            // Zeichenbreiten durch System-Textgrößen-Einstellungen (Xiaomi etc.)
            webView.getSettings().setTextZoom(100);

            // ── Mikrofon: JS-Interface registrieren ──────────────────
            // Erlaubt JS, die Android Runtime Permission für RECORD_AUDIO
            // anzufordern. Die Web Speech API (webkitSpeechRecognition)
            // benötigt diese Berechtigung, funktioniert aber nicht zuverlässig
            // über den Standard-WebView-Permission-Flow.
            webViewRef = webView;
            webView.addJavascriptInterface(new MicPermissionInterface(), "__HUI_MIC");
            // MediaPlayback ohne User-Gesture erlauben (für SpeechRecognition)
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

            // ── WebChromeClient: Mikrofon-Permission für WebView gewähren ──
            // Override onPermissionRequest: wenn die WebView Mikrofon anfordert
            // (z.B. via getUserMedia), automatisch gewähren — die echte
            // Runtime Permission wurde bereits via MicPermissionInterface
            // angefordert. Ohne diesen Override würde die WebView den
            // Zugriff still ablehnen.
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        // Nur Audio-Ressourcen gewähren (keine Kamera)
                        String[] resources = request.getResources();
                        boolean hasAudio = false;
                        for (String r : resources) {
                            if (r.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                                hasAudio = true;
                                break;
                            }
                        }
                        if (hasAudio) {
                            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                        } else {
                            // Für andere Ressourcen: Default-Verhalten
                            // (nicht gewähren, nicht ablehnen)
                        }
                    });
                }
            });

            // ── NATIVE PINCH-ZOOM DEAKTIVIEREN (2026-08-11) ──────────────
            // BUG (Nutzer-Screenshots 2026-08-11): Beim Pinch-Zoom auf ein
            // Bild in der Lightbox zoomte/verschob sich die GESAMTE Seite
            // (Modal-Hintergrund inkl. Bild wurde klein und in eine Ecke
            // verschoben) statt nur das Bild selbst via CSS-Transform zu
            // zoomen. Root Cause: Android WebView hat setSupportZoom() und
            // setBuiltInZoomControls() standardmaessig AKTIV (Default=true),
            // was das eingebaute Browser-Pinch-Zoom der GESAMTEN Seite
            // aktiviert — unabhaengig von der viewport-meta "user-scalable=no"
            // in index.html (bekannte Android-WebView-Inkonsistenz, das
            // eingebaute Zoom kann die Meta-Tag-Einstellung umgehen).
            // Das native Seiten-Zoom kollidierte mit der eigenen JS/CSS-
            // basierten Pinch-Zoom-Logik in ImageLightbox.jsx (die NUR das
            // <img>-Element transformieren soll) und verursachte zusaetzlich
            // fehlerhaftes Zurueck-Taste-Verhalten, da die Seite waehrend
            // des nativen Zooms visuell/touch-technisch verschoben war.
            // Fix: Browser-eigenes Pinch-Zoom komplett deaktivieren — alle
            // Zoom-Gesten laufen jetzt AUSSCHLIESSLICH durch die App-eigene
            // JS-Touch-Logik (ImageLightbox.jsx), die das Bild korrekt
            // innerhalb seiner eigenen Grenzen zoomt/verschiebt.
            webView.getSettings().setSupportZoom(false);
            webView.getSettings().setBuiltInZoomControls(false);
            webView.getSettings().setDisplayZoomControls(false);

            // Overscroll-Glow deaktivieren (PTR übernimmt die Geste)
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            // ── Safe-Area + Keyboard(IME)-Insets als CSS-Variablen injizieren ──
            // KEYBOARD-FIX (2026-08-10): Root Cause des systemweiten
            // "Tastatur verdeckt Eingabefeld"-Bugs gefunden. Vorher wurde hier
            // IMMER `WindowInsetsCompat.CONSUMED` zurückgegeben — das verschluckt
            // ALLE Inset-Typen inkl. ime() bevor sie die WebView/Chromium-eigene
            // interne IME-Resize-Logik erreichen (die normalerweise über das
            // <meta viewport interactive-widget=resizes-content> + visualViewport
            // laufen würde). Dadurch hat window.visualViewport.height sich NIE
            // korrekt verändert, wenn die Tastatur aufging — der bestehende
            // useKeyboardInset.js-Hook (visualViewport-basiert) bekam daher immer
            // nur 0px zurück, egal ob Tastatur offen war oder nicht.
            //
            // Fix: 1) Nur die Typen KONSUMIEREN, die wir hier selbst auswerten
            //         (systemBars + displayCutout) — ime() bleibt unkonsumiert
            //         und läuft weiter zur Standard-WebView-Behandlung durch.
            //      2) ZUSÄTZLICH ime()-Inset selbst auslesen und als eigene,
            //         robuste native CSS-Variable + Custom-Event injizieren —
            //         als Fallback/Ergänzung falls die Chromium-eigene
            //         visualViewport-Erkennung auf einzelnen Geräten (Xiaomi
            //         HyperOS u.ä.) trotzdem nicht zuverlässig feuert.
            webView.post(() -> {
                ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
                    Insets systemBars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars() |
                        WindowInsetsCompat.Type.displayCutout()
                    );
                    Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());

                    int bottomPx = systemBars.bottom;
                    int topPx    = systemBars.top;
                    int leftPx   = systemBars.left;
                    int rightPx  = systemBars.right;
                    int imeBottomPx = imeInsets.bottom;

                    float density = getResources().getDisplayMetrics().density;
                    // px → dp für CSS-Kompatibilität
                    int bottomDp = Math.round(bottomPx / density);
                    int topDp    = Math.round(topPx    / density);
                    int leftDp   = Math.round(leftPx   / density);
                    int rightDp  = Math.round(rightPx  / density);
                    int imeDp    = Math.round(imeBottomPx / density);

                    // CSS-Variablen in die WebView injizieren
                    String js = "javascript:(function(){" +
                        "var r = document.documentElement.style;" +
                        "r.setProperty('--hui-safe-bottom', '" + bottomDp + "px');" +
                        "r.setProperty('--hui-safe-top',    '" + topDp    + "px');" +
                        "r.setProperty('--hui-safe-left',   '" + leftDp   + "px');" +
                        "r.setProperty('--hui-safe-right',  '" + rightDp  + "px');" +
                        "window.__HUI_SAFE_INSETS = {" +
                        "  bottom:" + bottomDp + "," +
                        "  top:"    + topDp    + "," +
                        "  left:"   + leftDp   + "," +
                        "  right:"  + rightDp  +
                        "};" +
                        // Natives Keyboard-Inset-Signal (SSOT-Ergänzung, siehe
                        // src/hooks/useKeyboardInset.js — wird dort zusammen mit
                        // visualViewport gemerged, jeweils der größere Wert gewinnt)
                        "window.__HUI_NATIVE_KEYBOARD_INSET = " + imeDp + ";" +
                        "window.dispatchEvent(new CustomEvent('hui:native-keyboard-inset', {detail:{inset:" + imeDp + "}}));" +
                        "})()";
                    webView.evaluateJavascript(js, null);

                    // Nur systemBars + displayCutout konsumieren — ime() UND alle
                    // anderen Typen (z.B. tappableElement) unangetastet weiterreichen,
                    // damit Chromiums eigene IME-Resize-Logik weiterhin greifen kann.
                    return new WindowInsetsCompat.Builder(insets)
                        .setInsets(
                            WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(),
                            Insets.NONE
                        )
                        .build();
                });

                // Einmal sofort auslösen (danach bei jeder Rotation/Resize/Tastatur erneut)
                ViewCompat.requestApplyInsets(webView);
            });
        }
    }
}
