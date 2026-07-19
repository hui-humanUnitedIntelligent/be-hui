package com.hui.app;

import android.os.Build;
import android.os.Bundle;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // ── Edge-to-Edge ──────────────────────────────────────────────────
        WindowCompat.setDecorFitsSystemWindows(window, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // ── Safe-Area-Insets → CSS-Variablen ─────────────────────────────
        getBridge().getWebView().post(() -> {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;

            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
                // getInsets() liefert androidx.core.graphics.Insets — kein WindowInsetsCompat
                Insets systemBars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() |
                    WindowInsetsCompat.Type.displayCutout()
                );

                int bottomPx = systemBars.bottom;
                int topPx    = systemBars.top;
                int leftPx   = systemBars.left;
                int rightPx  = systemBars.right;

                float density = getResources().getDisplayMetrics().density;
                int bottomDp  = Math.round(bottomPx / density);
                int topDp     = Math.round(topPx    / density);
                int leftDp    = Math.round(leftPx   / density);
                int rightDp   = Math.round(rightPx  / density);

                String js = "javascript:(function(){" +
                    "var r=document.documentElement.style;" +
                    "r.setProperty('--hui-safe-bottom','" + bottomDp + "px');" +
                    "r.setProperty('--hui-safe-top','"    + topDp    + "px');" +
                    "r.setProperty('--hui-safe-left','"   + leftDp   + "px');" +
                    "r.setProperty('--hui-safe-right','"  + rightDp  + "px');" +
                    "window.__HUI_SAFE_INSETS={" +
                    "bottom:" + bottomDp + "," +
                    "top:"    + topDp    + "," +
                    "left:"   + leftDp   + "," +
                    "right:"  + rightDp  +
                    "};" +
                    "})()";
                webView.evaluateJavascript(js, null);

                return WindowInsetsCompat.CONSUMED;
            });

            ViewCompat.requestApplyInsets(webView);
        });
    }
}
