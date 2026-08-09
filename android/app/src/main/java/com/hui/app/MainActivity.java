package com.hui.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // FIX (2026-08-09): WebView-Remote-Debugging aktivieren, um über
    // chrome://inspect echte Computed-Styles auf dem Live-Gerät zu prüfen —
    // statt weiter blind Font-Fixes zu raten (siehe Engineering Constitution:
    // Truth over Assumption). Sicherheitsrisiko minimal, da nur bei
    // physisch per USB verbundenem, freigegebenem Debug-Gerät nutzbar.
    WebView.setWebContentsDebuggingEnabled(true);
  }
}
