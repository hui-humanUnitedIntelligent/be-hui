// src/lib/pushNotificationService.js
// Push-Notification-System für HUI
// Verwaltet: Token-Registrierung, Vordergrund/Betrieb, Einstellungen
//
// WICHTIG: Wir importieren @capacitor/push-notifications NICHT.
// Stattdessen nutzen wir registerPlugin aus @capacitor/core —
// genau das, was @capacitor/push-notifications intern auch tut:
//   const PushNotifications = registerPlugin('PushNotifications', {});
//
// Das native Plugin wird vom Capacitor-Bridge zur Laufzeit auf
// Android/iOS bereitgestellt. Auf Web ist es ein No-Op-Proxy.
// Dadurch gibt es KEINEN Rollup-Resolve-Fehler beim Web-Build.

import { Capacitor, registerPlugin } from "@capacitor/core";
import { supabase } from "./supabaseClient";

// ── Plugin Proxy (läuft auf allen Plattformen, No-Op auf Web) ────────────────
const PushNotifications = registerPlugin("PushNotifications", {});

// ── State ──────────────────────────────────────────────────────────────────
let _initialized = false;
let _pushEnabled = false;
let _currentToken = null;
let _foregroundListeners = false;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Lädt die aktuellen Push-Einstellungen vom Server.
 */
export async function loadPushSettings() {
  try {
    const { data, error } = await supabase.rpc("rpc_get_push_settings");
    if (error) {
      console.warn("[HUI_PUSH] loadPushSettings error:", error.message);
      _pushEnabled = false;
      return false;
    }
    _pushEnabled = data?.[0]?.push_enabled ?? false;
    return _pushEnabled;
  } catch (e) {
    console.warn("[HUI_PUSH] loadPushSettings exception:", e?.message);
    _pushEnabled = false;
    return false;
  }
}

/**
 * RESONANZ-BUCHUNG-001 (2026-08-08): Lädt alle Push-Einstellungen inkl.
 * der 3 Kategorie-Schalter (Buchungen / Kauf & Verkauf / Informativ).
 * Rückgabe: { push_enabled, push_buchungen, push_kauf_verkauf, push_informativ }
 */
export async function loadPushSettingsFull() {
  try {
    const { data, error } = await supabase.rpc("rpc_get_push_settings");
    if (error) {
      console.warn("[HUI_PUSH] loadPushSettingsFull error:", error.message);
      return { push_enabled: false, push_buchungen: true, push_kauf_verkauf: true, push_informativ: true };
    }
    const row = data?.[0] || {};
    return {
      push_enabled:      row.push_enabled ?? false,
      push_buchungen:    row.push_buchungen ?? true,
      push_kauf_verkauf: row.push_kauf_verkauf ?? true,
      push_informativ:   row.push_informativ ?? true,
    };
  } catch (e) {
    console.warn("[HUI_PUSH] loadPushSettingsFull exception:", e?.message);
    return { push_enabled: false, push_buchungen: true, push_kauf_verkauf: true, push_informativ: true };
  }
}

/**
 * RESONANZ-BUCHUNG-001 (2026-08-08): Aktiviert/deaktiviert eine einzelne
 * Push-Kategorie ("buchungen" | "kauf_verkauf" | "informativ").
 */
export async function setPushCategory(category, enabled) {
  try {
    const { error } = await supabase.rpc("rpc_set_push_category", { p_category: category, p_enabled: enabled });
    if (error) {
      console.warn("[HUI_PUSH] setPushCategory error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[HUI_PUSH] setPushCategory exception:", e?.message);
    return false;
  }
}

/**
 * Aktiviert oder deaktiviert Push-Notifications.
 */
export async function setPushEnabled(enabled) {
  try {
    const { error } = await supabase.rpc("rpc_set_push_enabled", { p_enabled: enabled });
    if (error) {
      console.warn("[HUI_PUSH] setPushEnabled error:", error.message);
      return false;
    }
    _pushEnabled = enabled;
    if (enabled) {
      await registerDevice();
    } else {
      _currentToken = null;
    }
    return true;
  } catch (e) {
    console.warn("[HUI_PUSH] setPushEnabled exception:", e?.message);
    return false;
  }
}

/**
 * Initialisiert das Push-Notification-System beim App-Start.
 */
export async function initPushNotifications() {
  if (_initialized) {
    return;
  }
  _initialized = true;

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (!_foregroundListeners) {
    _foregroundListeners = true;

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[HUI_PUSH] Registration error:", err);
    });

    PushNotifications.addListener("registration", async (token) => {
      _currentToken = token.value;
      await saveTokenToServer(token.value);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      window.dispatchEvent(new CustomEvent("hui:push:foreground", {
        detail: {
          title: notification.title || "HUI",
          body: notification.body || "",
          data: notification.data || {},
        }
      }));
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification?.data || {};
      window.dispatchEvent(new CustomEvent("hui:push:navigate", {
        detail: {
          entity_type: data.entity_type || data.notificationType,
          entity_id: data.entity_id,
          action_url: data.action_url,
          data,
        }
      }));
    });
  }

  if (_pushEnabled) {
    await registerDevice();
  }
}

async function registerDevice() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.warn("[HUI_PUSH] Berechtigung nicht gewährt");
      return;
    }
    await PushNotifications.register();
  } catch (e) {
    console.error("[HUI_PUSH] registerDevice exception:", e?.message);
  }
}

async function saveTokenToServer(token) {
  if (!token) return;
  try {
    const platform = Capacitor.getPlatform();
    const { error } = await supabase.rpc("rpc_register_device_token", {
      p_token: token,
      p_platform: platform,
    });
    if (error) {
      console.warn("[HUI_PUSH] saveToken error:", error.message);
    } else {
    }
  } catch (e) {
    console.warn("[HUI_PUSH] saveTokenToServer exception:", e?.message);
  }
}

export async function invalidateTokensOnLogout() {
  try {
    await supabase.rpc("rpc_invalidate_device_tokens");
    _currentToken = null;
    _pushEnabled = false;
  } catch (e) {
    console.warn("[HUI_PUSH] invalidateTokens exception:", e?.message);
  }
}

export function isPushEnabled() {
  return _pushEnabled;
}
