package com.hui.app;

import android.app.Application;
import com.getcapacitor.Capacitor;

public class MainApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // ---- Capacitor Initialisierung ----
        Capacitor.init(this);

        // ---- WebView Stabilität ----
        Capacitor.getBridge().getWebView().getSettings().setDomStorageEnabled(true);
        Capacitor.getBridge().getWebView().getSettings().setDatabaseEnabled(true);

        // ---- Plugin Stabilität ----
        Capacitor.getPlugins();

        // ---- Performance ----
        Capacitor.getBridge().getWebView().getSettings().setAllowFileAccess(true);
        Capacitor.getBridge().getWebView().getSettings().setAllowContentAccess(true);
    }
}
