// src/components/settings/PushNotificationBlock.jsx
// Ein/Aus-Steuerung für Push-Notifications in den App-Einstellungen.
// PUSH-SETTINGS-BUNDLE-001 (2026-09-16): Detail-Schalter gebündelt in einem
// Dropdown — Klick auf die Zeile öffnet/schließt die Einstellungen.
// RESONANZ-BUCHUNG-001 (2026-08-08): + 3 einzeln deaktivierbare Kategorien
// (Buchungen / Kauf & Verkauf / Informativ), synchron zum Resonanzzentrum.

import { useState, useEffect } from "react";
import { loadPushSettingsFull, setPushEnabled, setPushCategory } from "../../lib/pushNotificationService.js";
// NOTIF-TYPE-PREFS-001 (2026-09-13): 6 Benachrichtigungstypen, bidirektional
// mit dem Resonanzzentrum-Filter synchronisiert (gleiche DB-Spalten + Event).
import {
  loadNotifPrefsLocal, loadNotifPrefsFromDB, saveNotifPrefToDB,
  broadcastNotifPrefs, NOTIF_FILTERS_EVENT,
} from "../../lib/notificationFilterGroups.js";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "../../hooks/useTranslation.js";



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
  const CATEGORIES = [
    { key: "push_buchungen",    apiKey: "buchungen",    label: t("sm.push.catBuchungen"),      hint: t("sm.push.catBuchungenHint") },
    { key: "push_kauf_verkauf", apiKey: "kauf_verkauf", label: t("sm.push.catKaufVerkauf"), hint: t("sm.push.catKaufVerkaufHint") },
    { key: "push_informativ",   apiKey: "informativ",   label: t("sm.push.catInformativ"),     hint: t("sm.push.catInformativHint") },
  ];
  const [enabled, setEnabled] = useState(false);
  const [categories, setCategories] = useState({ push_buchungen: true, push_kauf_verkauf: true, push_informativ: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCat, setSavingCat] = useState(null);

  // PUSH-SETTINGS-BUNDLE-001: Einstellungen gebündelt hinter einem Dropdown —
  // Detail-Schalter (3 Push-Kategorien + 6 Benachrichtigungstypen) erscheinen
  // erst nach Klick auf die Zeile (default: zu).
  const [open, setOpen] = useState(false);

  // ── NOTIF-TYPE-PREFS-001: 6 Typ-Präferenzen (Buchungen, Kommentare, Likes,
  // Follower, System, Sonstige) — SSOT-Spalten notif_* (Migration 139).
  // Sofort aus localStorage (kein Flackern), danach DB-Merge. Die 6 Typen
  // steuern BOTH: Resonanzzentrum-Sichtbarkeit UND Push — deshalb immer
  // sichtbar in den Settings, unabhängig von push_enabled.
  const [notifTypes, setNotifTypes] = useState(loadNotifPrefsLocal);
  useEffect(() => {
    let cancelled = false;
    loadNotifPrefsFromDB().then(dbPrefs => {
      if (!cancelled && dbPrefs) setNotifTypes(dbPrefs);
    });
    // Live-Sync mit dem Resonanzzentrum-Filter (offenes Panel) — gleiche
    // DB-Spalten, synchronisiert über hui:notif:filters (bidirektional).
    const onExternal = (e) => {
      if (e?.detail?.prefs) setNotifTypes(e.detail.prefs);
    };
    window.addEventListener(NOTIF_FILTERS_EVENT, onExternal);
    return () => { cancelled = true; window.removeEventListener(NOTIF_FILTERS_EVENT, onExternal); };
  }, []);

  const handleNotifTypeToggle = (groupKey) => {
    setNotifTypes(prev => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      // Persist: localStorage sofort + DB; live-Event aktualisiert ein
      // evtl. offenes Resonanzzentrum sofort mit.
      broadcastNotifPrefs(next);
      saveNotifPrefToDB(groupKey, next[groupKey]);
      return next;
    });
  };

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

  // PUSH-SETTINGS-BUNDLE-001: Zusammenfassung fuer die Dropdown-Zeile —
  // wie viele der 6 Benachrichtigungstypen stehen aktuell auf aktiv.
  const ACTIVE_TYPE_KEYS = ["bookings", "comments", "likes", "followers", "system", "other"];
  const activeTypeCount = ACTIVE_TYPE_KEYS.reduce(
    (n, k) => n + (notifTypes[k] === true ? 1 : 0), 0);
  const typeSummary = activeTypeCount === ACTIVE_TYPE_KEYS.length
    ? t("sm.push.alleAktiv")
    : t("sm.push.teilAktiv", { n: activeTypeCount });

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
            {t("sm.push.title")}
          </div>
          <div style={{
            fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.45,
          }}>
            {isNative
              ? enabled
                ? t("push.notifDesc")
                : t("sm.push.enableHint")
              : t("sm.push.onlyInApp")}
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

      {/* ── PUSH-SETTINGS-BUNDLE-001: Dropdown-Zeile — Klick öffnet/schließt
          die gebündelten Benachrichtigungs-Einstellungen. ─────────────────── */}
      {!loading && (
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12,
            marginTop: 8, paddingTop: 10, paddingBottom: open ? 2 : 12,
            background: "none", border: "none",
            borderTop: "1px solid rgba(26,26,24,0.06)",
            cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>
              {t("sm.push.anpassen")}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
              {typeSummary}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"
            style={{
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}>
            <path d="M4 6.5 L8 10.5 L12 6.5" fill="none" stroke="#999"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* ── Gebündelte Detail-Schalter — nur bei geöffnetem Dropdown ─────── */}
      {open && !loading && (<>

      {/* RESONANZ-BUCHUNG-001: Einzeln deaktivierbare Kategorien — nur sichtbar
          wenn Push grundsätzlich aktiv ist (sonst irrelevant, alles ist stumm). */}
      {isNative && enabled && (
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px solid rgba(26,26,24,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>
            {t("sm.push.einzelSteuerbar")}
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

      {/* ── NOTIF-TYPE-PREFS-001: 6 Benachrichtigungstypen ────────────────────
          Immer sichtbar (auch Web / Push aus): steuern die Sichtbarkeit im
          Resonanzzentrum UND den Push-Versand pro Typ. Bidirektional mit dem
          Filter im Resonanzzentrum synchronisiert (gleiche DB-Spalten). */}
      {!loading && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(26,26,24,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>
            {t("sm.push.notifTypesTitle")}
          </div>
          <CategoryToggle
            label={t("notif.filter.bookings")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.bookings}
            onChange={() => handleNotifTypeToggle("bookings")}
          />
          <CategoryToggle
            label={t("notif.filter.comments")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.comments}
            onChange={() => handleNotifTypeToggle("comments")}
          />
          <CategoryToggle
            label={t("notif.filter.likes")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.likes}
            onChange={() => handleNotifTypeToggle("likes")}
          />
          <CategoryToggle
            label={t("notif.filter.followers")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.followers}
            onChange={() => handleNotifTypeToggle("followers")}
          />
          <CategoryToggle
            label={t("notif.filter.system")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.system}
            onChange={() => handleNotifTypeToggle("system")}
          />
          <CategoryToggle
            label={t("notif.filter.other")}
            hint={t("sm.push.notifTypesHintResonanz")}
            value={notifTypes.other}
            onChange={() => handleNotifTypeToggle("other")}
          />
        </div>
      )}

      </>

      )}
    </div>
  );
}
