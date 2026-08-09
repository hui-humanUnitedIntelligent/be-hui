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
    }
  }
}
