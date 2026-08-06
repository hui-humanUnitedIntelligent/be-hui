// src/components/settings/PushNotificationBlock.jsx
// Ein/Aus-Steuerung für Push-Notifications in den App-Einstellungen.

import { useState, useEffect } from "react";
import { loadPushSettings, setPushEnabled } from "../../lib/pushNotificationService.js";
import { Capacitor } from "@capacitor/core";

export default function PushNotificationBlock() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Beim Mount: aktuellen Status vom Server laden
  useEffect(() => {
    (async () => {
      setLoading(true);
      const val = await loadPushSettings();
      setEnabled(val);
      setLoading(false);
    })();
  }, []);

  const handleToggle = async () => {
    if (saving || loading) return;
    setSaving(true);
    const newVal = !enabled;
    setEnabled(newVal); // Optimistic UI
    const ok = await setPushEnabled(newVal);
    if (!ok) {
      setEnabled(!newVal); // Revert bei Fehler
    }
    setSaving(false);
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div style={{
      padding: "16px 16px 14px",
      borderBottom: "1px solid rgba(26,26,24,0.06)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>
            Push-Benachrichtigungen
          </div>
          <div style={{
            fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.45,
          }}>
            {isNative
              ? enabled
                ? "Du erhältst Benachrichtigungen für neue Nachrichten, Verbindungen und Aktivitäten."
                : "Aktiviere Push, um über neue Aktivitäten informiert zu werden."
              : "Push-Benachrichtigungen sind nur in der HUI-App verfügbar."}
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={loading || saving || !isNative}
          style={{
            width: 46, height: 28, borderRadius: 14,
            background: enabled ? "#0EC4B8" : "rgba(26,26,24,0.12)",
            border: "none", cursor: isNative && !saving ? "pointer" : "default",
            position: "relative",
            transition: "background 0.25s ease",
            flexShrink: 0,
            opacity: (!isNative || loading) ? 0.4 : 1,
          }}
        >
          <div style={{
            position: "absolute",
            top: 3, left: enabled ? 21 : 3,
            width: 22, height: 22, borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transition: "left 0.25s ease",
          }}/>
        </button>
      </div>

      {saving && (
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          Wird gespeichert…
        </div>
      )}
    </div>
  );
}
