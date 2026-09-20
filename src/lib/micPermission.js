// src/lib/micPermission.js
// MIC-PERMISSION-SSOT (2026-09-19, Michael-Report "Mikrofon funktioniert
// nicht — Nutzer-Bewilligung einholen"): Einheitliche Mikrofon-Berechtigungs-
// anforderung fuer ALLE Mikrofon-Nutzer der App.
//
// ROOT CAUSE des Reports: Die native Android-Bruecke __HUI_MIC
// (MainActivity.MicPermissionInterface) zeigt den Android-Runtime-Permission-
// Dialog fuer RECORD_AUDIO — aber nur, wenn JS sie auch aufruft. Die
// Suche (SearchCommandCenter, 2026-08-12) tat das; der Chat-Voice-Button
// (ChatInput.startRecording) rief getUserMedia direkt auf. Der WebView-
// onPermissionRequest-Override in MainActivity gewaehrt zwar die WebView-
// Anfrage automatisch, aber OHNE zuvor erteilte Runtime-Permission
// (Actiocompat.requestPermissions) liefert Android keinen Mic-Stream —
// getUserMedia schlaegt still fehl / liefert tote Tracks. Deshalb: JEDE
// Mikrofon-Nutzung ruft VOR getUserMedia requestMicPermission() auf —
// auf Android erscheint damit der System-Dialog ("HUI darf auf dein
// Mikrofon zugreifen?"), erst nach Erteilung startet die Aufnahme.
//
// Fallbacks: Browser (keine Bridge) → Web-Prompt via getUserMedia.
// Keine Methode verfuegbar → false.
export async function requestMicPermission() {
  // 1. Native Android Bridge (Capacitor)
  if (typeof window !== "undefined" && window.__HUI_MIC
      && typeof window.__HUI_MIC.requestPermission === "function") {
    return new Promise((resolve) => {
      window.__HUI_MIC_PERMISSION_RESULT = (granted) => {
        resolve(granted === true || granted === "true");
        window.__HUI_MIC_PERMISSION_RESULT = null;
      };
      try {
        window.__HUI_MIC.requestPermission();
      } catch {
        resolve(false);
      }
      // Timeout: 10s
      setTimeout(() => {
        if (window.__HUI_MIC_PERMISSION_RESULT) {
          window.__HUI_MIC_PERMISSION_RESULT = null;
          resolve(false);
        }
      }, 10000);
    });
  }
  // 2. Web Fallback (Browser)
  if (typeof navigator !== "undefined" && navigator.mediaDevices
      && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch { return false; }
  }
  // 3. Keine Methode verfügbar
  return false;
}
