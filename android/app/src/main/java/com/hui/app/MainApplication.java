package com.hui.app;

import android.app.Application;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // Keine Capacitor-Initialisierung notwendig
    }
}
