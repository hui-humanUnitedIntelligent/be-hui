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

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // SCALE-FIX (2026-08-10): Android "Anzeigegröße" (Display Size) ist eine
    // System-Einstellung, die die effektive Density (densityDpi) für ALLE Apps
    // hochskaliert -- inkl. unserer WebView (Buttons/Text/Navbar werden dadurch
    // ueberproportional gross, "device-width" in CSS-px schrumpft effektiv).
    // Fix: App-eigene Resources IMMER auf DENSITY_DEVICE_STABLE fixieren,
    // unabhaengig von der System-Einstellung des Nutzers. Betrifft NUR unsere
    // App -- andere Apps und die native Status-Bar bleiben unveraendert
    // (Status-Bar wird vom System-Prozess gezeichnet, nicht von uns).
    @Override
    public Resources getResources() {
        Resources res = super.getResources();
        if (res.getConfiguration().densityDpi != DisplayMetrics.DENSITY_DEVICE_STABLE) {
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

            // Overscroll-Glow deaktivieren (PTR übernimmt die Geste)
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            // ── Safe-Area-Insets als CSS-Variablen in die WebView injizieren ──
            // env(safe-area-inset-bottom) funktioniert auf Android nur zuverlässig
            // mit Edge-to-Edge + overlaysWebView=true. Zur Sicherheit lesen wir die
            // echten WindowInsets aus und injizieren sie als CSS-Variablen.
            webView.post(() -> {
                ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
                    Insets systemBars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars() |
                        WindowInsetsCompat.Type.displayCutout()
                    );

                    int bottomPx = systemBars.bottom;
                    int topPx    = systemBars.top;
                    int leftPx   = systemBars.left;
                    int rightPx  = systemBars.right;

                    float density = getResources().getDisplayMetrics().density;
                    // px → dp für CSS-Kompatibilität
                    int bottomDp = Math.round(bottomPx / density);
                    int topDp    = Math.round(topPx    / density);
                    int leftDp   = Math.round(leftPx   / density);
                    int rightDp  = Math.round(rightPx  / density);

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
                        "})()";
                    webView.evaluateJavascript(js, null);

                    return WindowInsetsCompat.CONSUMED;
                });

                // Einmal sofort auslösen (danach bei jeder Rotation/Resize erneut)
                ViewCompat.requestApplyInsets(webView);
            });
        }
    }
}
