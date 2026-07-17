package com.hui.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Edge-to-Edge aktivieren ───────────────────────────────────────
        // false = App zeichnet selbst hinter Status- und Navigations-Bar.
        // Die App-interne Safe-Area-Behandlung erfolgt via
        // env(safe-area-inset-*) in CSS (NAV_SAFE_BOTTOM_CSS in navigationGeometry.js).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Flags: Layout erstreckt sich in alle System-Bar-Bereiche
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        // System-Bars transparent — Farbe und Deko über CSS/Webview-Layer
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        // Vollbild-Systemleisten-Layout (API 30+, rückwärtskompatibel via WindowCompat)
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }
}
