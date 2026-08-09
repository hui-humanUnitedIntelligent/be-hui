package com.hui.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // WebView-Remote-Debugging (statisch — OK)
    WebView.setWebContentsDebuggingEnabled(true);

    // WebView-Cache leeren bei jedem Start (Instanz-Methode — über Bridge)
    if (this.bridge != null && this.bridge.getWebView() != null) {
      this.bridge.getWebView().clearCache(true);

      // ROOT CAUSE FIX (2026-08-09): Android WebViews uebernehmen auf vielen
      // Geraeten (bestaetigt: Xiaomi HyperOS 3.0 / Android 16, System-
      // Textgroesse 90%) automatisch die System-Bedienhilfen-Textgroesse als
      // WebView-eigenen "textZoom"-Faktor. Dieser Zoom laeuft auf Engine-
      // Ebene VOR jeglichem CSS-Layout und ist ein komplett anderer Mechanismus
      // als CSS "text-size-adjust" (das nur das alte Safari-Auto-Zoom-Verhalten
      // steuert, NICHT Androids nativen WebView-Zoom). Bei einem Zoom-Faktor
      // ungleich 100% (z.B. 90%) entstehen Rundungsfehler bei den Zeichen-
      // Vorschubbreiten (advance widths) -- besonders sichtbar bei eng
      // gesetzten Zahlenfolgen (Betraege), kaum sichtbar bei lockerem Fliesstext.
      // Das erklaert, warum keine reine CSS-/Font-Aenderung das Problem loesen
      // konnte: es lag nie im Content, sondern in der WebView-Engine-Konfiguration.
      //
      // FIX: textZoom hart auf 100 fixieren, unabhaengig von der System-
      // Bedienhilfen-Textgroesse des Nutzers. Macht die App-Darstellung auf
      // allen Geraeten konsistent (User-Textgroessen-Praeferenz wird dadurch
      // fuer die App ignoriert -- bewusste Entscheidung fuer Rendering-
      // Konsistenz, analog zu vielen produktiven Capacitor/Cordova-Apps).
      this.bridge.getWebView().getSettings().setTextZoom(100);
    }
  }
}
