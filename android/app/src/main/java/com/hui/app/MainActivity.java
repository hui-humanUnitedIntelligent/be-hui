package com.hui.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ---- Bridge erst NACH dem Layout verfügbar ----
        getBridge().getWebView().post(() -> {
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
        });
    }
}
