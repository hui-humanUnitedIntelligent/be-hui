// src/lib/notificationService.js
// Phase 4E: Reality Notifications
// Erzeugt echte Notification-Records in Supabase bei sozialen Aktionen.
//
// Typen:
//   follow       — jemand folgt dir
//   message      — neue Nachricht
//   booking      — Buchungsanfrage / Update
//   resonanz     — jemand resoniert mit deinem Werk/Erlebnis
//   system       — Systemereignis

import { supabase } from "./supabaseClient";

/**
 * Erstellt eine Notification in der notifications-Tabelle.
 * Schlägt silent fehl — nie als blocking verwenden.
 */
export async function createNotification({
  recipientId,    // Wer bekommt die Notif
  senderId,       // Wer triggert sie (null für System)
  type,           // "follow" | "message" | "booking" | "resonanz" | "system"
  title,
  body,
  entityId  = null,  // z.B. chat_id, booking_id, work_id
  entityType = null, // "chat" | "booking" | "work" | "experience"
  actionUrl  = null,
}) {
  if (!recipientId || !type) {
    console.warn("[HUI_NOTIF] createNotification: fehlende Pflichtfelder", { recipientId, type });
    return null;
  }
  // Keine Selbst-Benachrichtigung
  if (recipientId === senderId) return null;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id:     recipientId,
        sender_id:   senderId   || null,
        type,
        title:       title      || notifDefaults[type]?.title    || "Neue Aktivität",
        body:        body       || notifDefaults[type]?.body     || "",
        entity_id:   entityId   || null,
        entity_type: entityType || null,
        action_url:  actionUrl  || null,
        read:        false,
        created_at:  new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[HUI_NOTIF] INSERT failed:", error.code, error.message);
      return null;
    }
    console.log("[HUI_REALITY] notification created ✓", { type, recipientId: recipientId.slice(0,8)+"…", id: data?.id });
    return data;
  } catch(err) {
    console.warn("[HUI_NOTIF] Exception:", err?.message);
    return null;
  }
}

const notifDefaults = {
  follow:   { title: "Jemand folgt dir",           body: "Eine neue Verbindung in deiner Community." },
  message:  { title: "Neue Nachricht",              body: "Du hast eine Nachricht erhalten." },
  booking:  { title: "Buchungsanfrage",             body: "Jemand möchte ein Erlebnis mit dir buchen." },
  resonanz: { title: "Resonanz auf dein Werk",      body: "Dein Werk berührt jemanden." },
  system:   { title: "HUI-Plattform",               body: "" },
};

/**
 * Notification beim Follow
 */
export async function notifyFollow({ followerId, followedId, followerName }) {
  return createNotification({
    recipientId: followedId,
    senderId:    followerId,
    type:        "follow",
    title:       `${followerName || "Jemand"} folgt dir jetzt`,
    body:        "Eine neue Verbindung ist entstanden.",
    entityId:    followerId,
    entityType:  "profile",
  });
}

/**
 * Notification bei neuer Nachricht
 */
export async function notifyMessage({ senderId, recipientId, senderName, chatId, preview }) {
  return createNotification({
    recipientId,
    senderId,
    type:        "message",
    title:       `Neue Nachricht von ${senderName || "jemandem"}`,
    body:        preview ? preview.slice(0, 80) : "Du hast eine Nachricht erhalten.",
    entityId:    chatId,
    entityType:  "chat",
    actionUrl:   "/chat/" + chatId,
  });
}

/**
 * Notification bei Buchungsanfrage
 */
export async function notifyBooking({ senderId, recipientId, senderName, bookingId, experienceTitle }) {
  return createNotification({
    recipientId,
    senderId,
    type:        "booking",
    title:       `Buchungsanfrage von ${senderName || "jemandem"}`,
    body:        experienceTitle ? `Für: ${experienceTitle}` : "Eine neue Buchungsanfrage wartet auf dich.",
    entityId:    bookingId,
    entityType:  "booking",
  });
}

/**
 * Notification bei Resonanz auf ein Werk
 */
export async function notifyResonanz({ senderId, recipientId, senderName, workId, workTitle }) {
  return createNotification({
    recipientId,
    senderId,
    type:        "resonanz",
    title:       `${senderName || "Jemand"} resoniert mit deinem Werk`,
    body:        workTitle ? `"${workTitle.slice(0,60)}"` : "Dein Werk bewegt jemanden.",
    entityId:    workId,
    entityType:  "work",
  });
}
