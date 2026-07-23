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
  metadata   = null,
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
        metadata:    metadata   || null,
        read:        false,
        is_read:     false,
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
  share:    { title: "Jemand hat etwas mit dir geteilt", body: "Schau es dir an." },
  system:   { title: "HUI-Plattform",               body: "" },
  watcher:  { title: "Jemand beobachtet dein Wirken", body: "Deine Präsenz zieht Aufmerksamkeit an." },
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

/**
 * Notification wenn jemand ein Profil in die Watchlist nimmt ("Im Blick behalten")
 */
export async function notifyWatcher({ watcherId, profileId, watcherName }) {
  return createNotification({
    recipientId: profileId,
    senderId:    watcherId,
    type:        "watcher",
    title:       `${watcherName || "Jemand"} beobachtet dein Wirken`,
    body:        "Deine Präsenz zieht Aufmerksamkeit an.",
    entityId:    watcherId,
    entityType:  "profile",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// RESONANZZENTRUM-HARMONISIERUNG: Momente + alle Content-Arten
// ────────────────────────────────────────────────────────────────────────────

/**
 * Notification: Moment gemeldet (1 Meldung) → an Initiator
 */
export async function notifyMomentReported({ momentOwnerId, momentId, momentPreview, reportCount = 1 }) {
  return createNotification({
    recipientId: momentOwnerId,
    senderId:    null,
    type:        "moment_reported",
    title:       "Dein Moment wurde gemeldet",
    body:        `Dein Moment wird geprüft. Meldungsanzahl: ${reportCount}.`,
    entityId:    momentId,
    entityType:  "moment",
    metadata:    { moment_preview: momentPreview?.substring(0, 100) ?? null, report_count: reportCount },
  });
}

/**
 * Notification: Moment durch 5+ Meldungen entfernt → an Initiator
 */
export async function notifyMomentRemovedByReports({ momentOwnerId, momentId, momentPreview }) {
  return createNotification({
    recipientId: momentOwnerId,
    senderId:    null,
    type:        "moment_reported_removed",
    title:       "Dein Moment wurde entfernt",
    body:        "Dein Moment wurde von 5 verschiedenen Nutzern gemeldet und automatisch aus Entdecken entfernt.",
    entityId:    momentId,
    entityType:  "moment",
    metadata:    { moment_preview: momentPreview?.substring(0, 100) ?? null, reason: "5 Meldungen durch verschiedene Nutzer" },
  });
}

/**
 * Notification: Moment durch Admin entfernt → an Initiator
 */
export async function notifyMomentRemovedByAdmin({ momentOwnerId, momentId, momentPreview, reason }) {
  return createNotification({
    recipientId: momentOwnerId,
    senderId:    null,
    type:        "moment_removed",
    title:       "🗑️ Dein Moment wurde entfernt",
    body:        momentPreview ? `„${momentPreview.substring(0,60)}" wurde entfernt. Begründung: ${reason || "Verstoß gegen Community-Richtlinien"}` : (reason || "Dein Moment wurde vom Admin entfernt."),
    entityId:    momentId,
    entityType:  "moment",
    metadata:    { reason: reason || "Verstoß gegen Community-Richtlinien", moment_preview: momentPreview?.substring(0, 100) ?? null },
  });
}

/**
 * Notification: Talent freigegeben
 */
export async function notifyTalentApproved({ userId, talentId, talentTitle, adminNote }) {
  return createNotification({
    recipientId: userId,
    senderId:    null,
    type:        "talent_approved",
    title:       "✅ Dein Talent-Angebot wurde freigegeben!",
    body:        `„${talentTitle || "Dein Talent"}" ist jetzt öffentlich sichtbar.`,
    entityId:    talentId,
    entityType:  "talent",
    metadata:    { entry_title: talentTitle, message: adminNote || "Herzlichen Glückwunsch!" },
  });
}

/**
 * Notification: Talent abgelehnt
 */
export async function notifyTalentRejected({ userId, talentId, talentTitle, reason }) {
  return createNotification({
    recipientId: userId,
    senderId:    null,
    type:        "talent_rejected",
    title:       "❌ Dein Talent-Angebot wurde abgelehnt",
    body:        `„${talentTitle || "Dein Talent"}" wurde abgelehnt.`,
    entityId:    talentId,
    entityType:  "talent",
    metadata:    { entry_title: talentTitle, rejection_reason: reason || "(Kein Grund angegeben)" },
  });
}

/**
 * Notification: Projekt freigegeben
 */
export async function notifyProjectApproved({ userId, projectId, projectName, adminNote }) {
  return createNotification({
    recipientId: userId,
    senderId:    null,
    type:        "project_approved",
    title:       "✅ Dein Projekt wurde freigegeben!",
    body:        `„${projectName || "Dein Projekt"}" ist jetzt sichtbar.`,
    entityId:    projectId,
    entityType:  "project",
    metadata:    { project_name: projectName, message: adminNote || "Herzlichen Glückwunsch!" },
  });
}

/**
 * Notification: Projekt abgelehnt
 */
export async function notifyProjectRejected({ userId, projectId, projectName, reason }) {
  return createNotification({
    recipientId: userId,
    senderId:    null,
    type:        "project_rejected",
    title:       "❌ Dein Projekt wurde abgelehnt",
    body:        `„${projectName || "Dein Projekt"}" wurde abgelehnt.`,
    entityId:    projectId,
    entityType:  "project",
    metadata:    { project_name: projectName, rejection_reason: reason || "(Kein Grund angegeben)" },
  });
}

/**
 * Notification: Content aktualisiert (Moment / Talent / Erlebnis / Projekt)
 */
export async function notifyContentUpdated({ userId, entityId, entityType, entityTitle, message }) {
  const typeConfig = {
    moment:     { type: "moment_updated",     emoji: "✏️", label: "Moment" },
    talent:     { type: "talent_updated",     emoji: "⭐", label: "Talent-Angebot" },
    experience: { type: "experience_updated", emoji: "🌿", label: "Erlebnis" },
    project:    { type: "project_updated",    emoji: "📌", label: "Projekt" },
  };
  const cfg = typeConfig[entityType] || { type: "content_updated", emoji: "✏️", label: "Inhalt" };
  return createNotification({
    recipientId: userId,
    senderId:    null,
    type:        cfg.type,
    title:       `${cfg.emoji} Dein ${cfg.label} wurde aktualisiert`,
    body:        message || `„${entityTitle || "Dein Inhalt"}" wurde aktualisiert.`,
    entityId,
    entityType,
    metadata:    { entry_title: entityTitle, message },
  });
}
