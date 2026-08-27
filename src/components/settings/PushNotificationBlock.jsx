// src/components/settings/PushNotificationBlock.jsx
// Ein/Aus-Steuerung für Push-Notifications in den App-Einstellungen.
// RESONANZ-BUCHUNG-001 (2026-08-08): + 3 einzeln deaktivierbare Kategorien
// (Buchungen / Kauf & Verkauf / Informativ), synchron zum Resonanzzentrum.

import { useState, useEffect } from "react";
import { loadPushSettingsFull, setPushEnabled, setPushCategory } from "../../lib/pushNotificationService.js";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "../../hooks/useTranslation.js";

const CATEGORIES = [
  { key: "push_buchungen",    apiKey: "buchungen",    label: "Buchungen",      hint: "Termine, die du gebucht hast oder bei dir gebucht wurden" },
  { key: "push_kauf_verkauf", apiKey: "kauf_verkauf", label: "Kauf & Verkauf", hint: t("push.ordersSales") },
  { key: "push_informativ",   apiKey: "informativ",   label: "Informativ",     hint: "Kommentare, Freigaben, Team-Nachrichten und mehr" },
];

function CategoryToggle({ label, hint, value, disabled, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "10px 0",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        style={{
          width: 40, height: 24, borderRadius: 12,
          background: value ? "#0EC4B8" : "rgba(26,26,24,0.12)",
          border: "none", cursor: disabled ? "default" : "pointer",
          position: "relative", transition: "background 0.2s ease",
          flexShrink: 0, opacity: disabled ? 0.4 : 1,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: value ? 19 : 3,
          width: 18, height: 18, borderRadius: "50%", background: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s ease",
        }}/>
      </button>
    </div>
  );
}

export default function PushNotificationBlock() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [categories, setCategories] = useState({ push_buchungen: true, push_kauf_verkauf: true, push_informativ: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCat, setSavingCat] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const full = await loadPushSettingsFull();
      setEnabled(full.push_enabled);
      setCategories({
        push_buchungen: full.push_buchungen,
        push_kauf_verkauf: full.push_kauf_verkauf,
        push_informativ: full.push_informativ,
      });
      setLoading(false);
    })();
  }, []);

  const handleToggle = async () => {
    if (saving || loading) return;
    setSaving(true);
    const newVal = !enabled;
    setEnabled(newVal);
    const ok = await setPushEnabled(newVal);
    if (!ok) {
      setEnabled(!newVal);
    }
    setSaving(false);
  };

  const handleCategoryToggle = async (cat) => {
    if (savingCat || loading || !enabled) return;
    setSavingCat(cat.key);
    const newVal = !categories[cat.key];
    setCategories(prev => ({ ...prev, [cat.key]: newVal }));
    const ok = await setPushCategory(cat.apiKey, newVal);
    if (!ok) {
      setCategories(prev => ({ ...prev, [cat.key]: !newVal }));
    }
    setSavingCat(null);
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>
            Push-Benachrichtigungen
          </div>
          <div style={{
            fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.45,
          }}>
            {isNative
              ? enabled
                ? t("push.notifDesc")
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

      {/* RESONANZ-BUCHUNG-001: Einzeln deaktivierbare Kategorien — nur sichtbar
          wenn Push grundsätzlich aktiv ist (sonst irrelevant, alles ist stumm). */}
      {isNative && enabled && !loading && (
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px solid rgba(26,26,24,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>
            Einzeln steuerbar
          </div>
          {CATEGORIES.map(cat => (
            <CategoryToggle
              key={cat.key}
              label={cat.label}
              hint={cat.hint}
              value={categories[cat.key]}
              disabled={savingCat === cat.key}
              onChange={() => handleCategoryToggle(cat)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
