package com.hui.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Pull-to-Refresh: Android WebView nativen Overscroll deaktivieren ──
        // Das native Android-WebView-OverScroll (Glow-Effekt oben) würde mit
        // unserem JS-Pull-to-Refresh konkurrieren → deaktivieren.
        // Unser eigener PTR-Hook übernimmt die Geste vollständig.
        getBridge().getWebView().post(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            }
        });
    }
}
