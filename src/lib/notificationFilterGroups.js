// src/lib/notificationFilterGroups.js — NOTIF-TYPE-PREFS-001 (2026-09-13)
// ══════════════════════════════════════════════════════════════════════════════
// SSOT für die 6 deaktivierbaren Benachrichtigungstypen (Migration 139,
// Spalten notif_* auf user_notification_settings):
//   bookings | comments | likes | followers | system | other
//
// BI-DIREKTIONALE SYNC-QUELLE: Resonanzzentrum-Filter (NotificationPanel)
// und Settings (PushNotificationBlock) lesen/schreiben dieselben DB-Spalten
// (rpc_get_push_settings / rpc_set_push_category) und synchronisieren live
// über das window-Event "hui:notif:filters". localStorage ist der schnelle
// UI-Fallback (sofortige Filterung + offline-tauglich), DB die persistente
// Wahrheit (überlebt Logout/Login und Gerätewechsel).
//
// WARNUNG (SSOT-Spiegel, analog TAB_FILTERS/TYPE_META): Diese Typ-Gruppen
// müssen synchron gehalten werden mit send-push-notifications/index.ts
// (serverseitiger Push-Gate) — JS-Clients und Deno-Edge-Function können
// sich keine Module teilen.
// ══════════════════════════════════════════════════════════════════════════════

// ── 6 Typ-Gruppen: notification.type → Gruppe ────────────────────────────────
// (everything not listed lands in "other" — catch-all, nie undefined)
const GROUP_BOOKINGS = [
  "talent_booking_paid", "talent_booking_confirmed", "talent_booking_cancelled",
  "experience_booking_paid", "experience_booking_confirmed", "experience_booking_cancelled",
  "booking", "booking_change", "experience_soon", "new_booking",
];
const GROUP_COMMENTS = [
  "comment", "comment_reply",
];
// "Likes & Inspirationen": Inhalts-Wertschätzung — resonanz (=inspirierend
// gefunden), like und save (Inhalt gespeichert) sind dieselbe Kategorie.
const GROUP_LIKES = [
  "like", "resonanz", "save",
];
// "Follower & Reposts": soziale Verbindungen + geteilte Inhalte
const GROUP_FOLLOWERS = [
  "new_follower", "follow", "follow_request",
  "repost", "share",
  "connection_req", "connection_new", "participant", "watcher",
];
// "Systemnachrichten": Freigaben/Ablehnungen, Support, Broadcasts, Milestones
const GROUP_SYSTEM = [
  "work_approved", "work_rejected",
  "talent_approved", "talent_rejected",
  "experience_approved", "experience_rejected",
  "project_approved", "project_rejected",
  "impact_project_rejected",
  "content_approved", "content_rejected",
  "bug_report_resolved",
  "support_ticket", "support_ticket_reply",
  "milestone", "achievement",
  "admin_broadcast", "broadcast",
  "system",
];

const GROUP_LOOKUP = new Map();
for (const type of GROUP_BOOKINGS)  GROUP_LOOKUP.set(type, "bookings");
for (const type of GROUP_COMMENTS)  GROUP_LOOKUP.set(type, "comments");
for (const type of GROUP_LIKES)     GROUP_LOOKUP.set(type, "likes");
for (const type of GROUP_FOLLOWERS) GROUP_LOOKUP.set(type, "followers");
for (const type of GROUP_SYSTEM)    GROUP_LOOKUP.set(type, "system");

/** notification.type → Gruppen-Key ('bookings'|'comments'|'likes'|'followers'|'system'|'other') */
export function getNotifGroup(type) {
  return GROUP_LOOKUP.get(type) || "other";
}

// ── Default-Präferenzen (alles an) ────────────────────────────────────────────
export const DEFAULT_NOTIF_PREFS = {
  bookings:  true,
  comments:  true,
  likes:     true,
  followers: true,
  system:    true,
  other:     true,
};

// ── localStorage (schnelle UI-Filterung, Fallback bei DB-Fehler/offline) ────
const LS_KEY = "hui_notif_type_prefs";

/** Lädt Präferenzen synchron aus localStorage (merge mit Defaults, robust). */
export function loadNotifPrefsLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_NOTIF_PREFS };
    const parsed = JSON.parse(raw);
    // Nur bekannte Keys, fehlende = Default (additiv zukunftssicher)
    const merged = { ...DEFAULT_NOTIF_PREFS };
    for (const key of Object.keys(DEFAULT_NOTIF_PREFS)) {
      if (typeof parsed[key] === "boolean") merged[key] = parsed[key];
    }
    return merged;
  } catch {
    return { ...DEFAULT_NOTIF_PREFS };
  }
}

/** Schreibt Präferenzen synchron in localStorage. */
export function saveNotifPrefsLocal(prefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch { /* localStorage voll/verboten — DB bleibt Wahrheit */ }
}

// ── DB-Load (persistente Wahrheit) — rpc_get_push_settings liefert notif_* ──
import { supabase } from "./supabaseClient.js";

/** Lädt die 6 Typ-Präferenzen aus der DB (rpc_get_push_settings). */
export async function loadNotifPrefsFromDB() {
  try {
    const { data, error } = await supabase.rpc("rpc_get_push_settings");
    if (error) throw error;
    const row = data?.[0] || {};
    return {
      bookings:  row.notif_bookings  !== false,
      comments:  row.notif_comments  !== false,
      likes:     row.notif_likes     !== false,
      followers: row.notif_followers !== false,
      system:    row.notif_system   !== false,
      other:     row.notif_other    !== false,
    };
  } catch (e) {
    console.warn("[NOTIF-FILTER] DB-Load fehlgeschlagen, localStorage bleibt Quelle:", e?.message);
    return null; // null = DB nicht erreichbar → localStorage weiterverwenden
  }
}

/** Schreibt EINE Typ-Präferenz in die DB (rpc_set_push_category, additive Keys). */
export async function saveNotifPrefToDB(groupKey, enabled) {
  try {
    const { error } = await supabase.rpc("rpc_set_push_category", { p_category: groupKey, p_enabled: enabled });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[NOTIF-FILTER] DB-Save fehlgeschlagen (localStorage hält UI-Fallback):", e?.message);
    return false;
  }
}

// ── Live-Sync-Event (Resonanzzentrum ↔ Settings in derselben Session) ────────
export const NOTIF_FILTERS_EVENT = "hui:notif:filters";

/** Benachrichtigt alle offenen Konsumenten (Panel/Settings) über neue Prefs. */
export function broadcastNotifPrefs(prefs) {
  saveNotifPrefsLocal(prefs);
  try {
    window.dispatchEvent(new CustomEvent(NOTIF_FILTERS_EVENT, { detail: { prefs } }));
  } catch { /* kein window (SSR-Test) — egal */ }
}
