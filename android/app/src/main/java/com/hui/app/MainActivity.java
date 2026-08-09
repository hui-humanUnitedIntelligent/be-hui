package com.hui.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // FIX (2026-08-09): WebView-Cache komplett leeren bei jedem Start.
    // ROOT CAUSE für Ziffern-Lücken-Bug: OTA-Updates (@capgo/capacitor-updater)
    // tauschen das Web-Bundle aus, aber die Android WebView behält den Cache
    // vom ALTEN Bundle (CSS, Fonts, JS). Neue Bundles referenzieren neue
    // Content-Hashes, aber die WebView serviert alte Font-Dateien aus dem
    // Cache → Font-Rendering-Fehler (Lücken zwischen Ziffern).
    //
    // clearCache(true) löscht den gesamten WebView-Cache (inkl. disk cache)
    // beim App-Start, sodass ALLE Assets frisch aus dem neuen Bundle geladen
    // werden. Minimaler Performance-Kosten (eine Sekunde beim ersten Laden).
    //
    // Zusätzlich: WebView-Remote-Debugging für chrome://inspect aktivieren.
    WebView.setWebContentsDebuggingEnabled(true);
    WebView.clearCache(true);
  }
}
