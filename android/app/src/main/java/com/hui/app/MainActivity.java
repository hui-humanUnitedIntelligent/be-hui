package com.hui.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // ── Edge-to-Edge: App zeichnet hinter System-Bars ────────────────
        // setDecorFitsSystemWindows(false) = App ist für eigene Insets
        // verantwortlich. Capacitor/WebView liefert env(safe-area-inset-*)
        // an CSS, sobald die App hinter die Bars zeichnet.
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Transparente Bars (Fallback für ältere APIs, styles.xml übernimmt ab API 21+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        }

        // Android 10+ (API 29): Gesturenavigation — kein weißer/schwarzer Balken
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // ── Safe-Area-Insets als JS-Variablen in die WebView injizieren ──
        // env(safe-area-inset-bottom) funktioniert auf Android nur zuverlässig,
        // wenn overlaysWebView=true (Capacitor) + Edge-to-Edge aktiv.
        // Zur Sicherheit lesen wir die echten WindowInsets aus und
        // injizieren sie als CSS-Variablen (--safe-bottom, --safe-top),
        // damit die Navbar auch auf Geräten mit Soft-Keys korrekt Abstand hält.
        getBridge().getWebView().post(() -> {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;

            // Overscroll-Glow deaktivieren (PTR übernimmt die Geste)
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            // WindowInsets auslesen und in WebView injizieren
            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
                WindowInsetsCompat systemBars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() |
                    WindowInsetsCompat.Type.displayCutout()
                );

                int bottomPx = systemBars.bottom;
                int topPx    = systemBars.top;
                int leftPx   = systemBars.left;
                int rightPx  = systemBars.right;

                float density = getResources().getDisplayMetrics().density;
                // px → dp für CSS-Kompatibilität
                // env(safe-area-inset-*) liefert dp-Werte, wir tun dasselbe
                int bottomDp = Math.round(bottomPx / density);
                int topDp    = Math.round(topPx    / density);
                int leftDp   = Math.round(leftPx   / density);
                int rightDp  = Math.round(rightPx  / density);

                // CSS-Variablen in die WebView injizieren (fallback zu env())
                String js = "javascript:(function(){" +
                    "var r = document.documentElement.style;" +
                    "r.setProperty('--hui-safe-bottom', '" + bottomDp + "px');" +
                    "r.setProperty('--hui-safe-top',    '" + topDp    + "px');" +
                    "r.setProperty('--hui-safe-left',   '" + leftDp   + "px');" +
                    "r.setProperty('--hui-safe-right',  '" + rightDp  + "px');" +
                    // Auch als globale Window-Variable für JS-Zugriff
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
