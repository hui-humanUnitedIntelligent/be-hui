package com.hui.app;

import android.os.Bundle;
<<<<<<< HEAD
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
=======
>>>>>>> 16ac5983 (Auto-Release: Version 2.0.6)
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

    @Override
<<<<<<< HEAD
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
=======
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ---- WebView Stabilität ----
        getBridge().getWebView().getSettings().setDomStorageEnabled(true);
        getBridge().getWebView().getSettings().setDatabaseEnabled(true);
        getBridge().getWebView().getSettings().setJavaScriptEnabled(true);

        // ---- Mixed Content (HTTPS + HTTP) ----
        getBridge().getWebView().getSettings().setMixedContentMode(0); // BLOCK

        // ---- Supabase / API Stabilität ----
        getBridge().getWebView().getSettings().setAllowFileAccess(true);
        getBridge().getWebView().getSettings().setAllowContentAccess(true);

        // ---- Performance ----
        getBridge().getWebView().getSettings().setLoadWithOverviewMode(true);
        getBridge().getWebView().getSettings().setUseWideViewPort(true);

        // ---- Plugins registrieren ----
        registerPlugins();
    }

    private void registerPlugins() {
        // Capacitor + Cordova Plugins werden automatisch geladen
        // Diese Methode existiert für zukünftige Erweiterungen
>>>>>>> 16ac5983 (Auto-Release: Version 2.0.6)
    }
}
