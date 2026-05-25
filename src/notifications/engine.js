import { supabase } from "../lib/supabaseClient.js";
import { INTERACTION_TYPES, assertValidInteraction } from "../interactions/contracts.js";

export const NOTIFICATION_TYPES = Object.freeze({
  FOLLOW: "follow",
  REACT: "react",
  REPLY: "reply",
  SAVE: "save",
  PARTICIPATE: "participate",
  INVITE_RESPONSE: "invite_response",
  BOOKING: "booking",
  SUPPORT: "support",
  MESSAGE: "message",
  COLLABORATION_INTEREST: "collaboration_interest",
  SYSTEM: "system",
});

const DEFAULT_COPY = Object.freeze({
  [INTERACTION_TYPES.FOLLOW]: {
    title: "Jemand folgt dir jetzt",
    body: "Eine neue Verbindung ist entstanden.",
  },
  [INTERACTION_TYPES.REACT]: {
    title: "Neue Resonanz",
    body: "Jemand hat auf einen Inhalt reagiert.",
  },
  [INTERACTION_TYPES.REPLY]: {
    title: "Neue Antwort",
    body: "Jemand hat geantwortet.",
  },
  [INTERACTION_TYPES.SAVE]: {
    title: "Inhalt gespeichert",
    body: "Jemand moechte zu deinem Inhalt zurueckkehren.",
  },
  [INTERACTION_TYPES.PARTICIPATE]: {
    title: "Neue Teilnahme",
    body: "Jemand nimmt teil.",
  },
  [INTERACTION_TYPES.INVITE_RESPONSE]: {
    title: "Neue Antwort auf deine Einladung",
    body: "Jemand hat auf deine Einladung reagiert.",
  },
  [INTERACTION_TYPES.BOOKING]: {
    title: "Neue Buchungsanfrage",
    body: "Eine neue Anfrage wartet auf dich.",
  },
  [INTERACTION_TYPES.SUPPORT]: {
    title: "Neue Unterstuetzung",
    body: "Jemand unterstuetzt dein Vorhaben.",
  },
  [INTERACTION_TYPES.MESSAGE]: {
    title: "Neue Nachricht",
    body: "Du hast eine Nachricht erhalten.",
  },
  [INTERACTION_TYPES.COLLABORATION_INTEREST]: {
    title: "Interesse an Zusammenarbeit",
    body: "Jemand moechte mit dir zusammenarbeiten.",
  },
});

function actionUrlFor(interaction) {
  if (interaction.metadata?.actionUrl) return interaction.metadata.actionUrl;
  if (interaction.targetEntityType === "chat") return `/chat/${interaction.targetEntityId}`;
  if (interaction.targetEntityType === "profile") return `/wirker/${interaction.targetEntityId}`;
  if (interaction.targetEntityType === "booking") return `/chat/${interaction.metadata?.chatId || ""}`;
  return null;
}

export function normalizeNotificationForInteraction(input = {}) {
  const interaction = assertValidInteraction(input);
  if (!interaction.targetUserId || interaction.targetUserId === interaction.actorId) return null;

  const copy = DEFAULT_COPY[interaction.interactionType] || DEFAULT_COPY[INTERACTION_TYPES.REACT];
  const actorName = interaction.metadata?.actorName || interaction.metadata?.senderName || "Jemand";
  const title = interaction.metadata?.notificationTitle
    || (interaction.interactionType === INTERACTION_TYPES.MESSAGE
      ? `Neue Nachricht von ${actorName}`
      : copy.title);

  return {
    type: NOTIFICATION_TYPES[interaction.interactionType?.toUpperCase?.()] || interaction.interactionType,
    actorId: interaction.actorId,
    targetUserId: interaction.targetUserId,
    entity: {
      type: interaction.targetEntityType,
      id: interaction.targetEntityId,
    },
    title,
    body: interaction.metadata?.notificationBody || interaction.metadata?.preview || copy.body,
    read: false,
    createdAt: interaction.createdAt,
    metadata: {
      ...(interaction.metadata || {}),
      interactionType: interaction.interactionType,
    },
    actionUrl: actionUrlFor(interaction),
  };
}

export async function persistNotificationEvent({ interaction, notification }) {
  if (!notification) return null;
  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      interaction_id: interaction.id,
      type: notification.type,
      actor_id: notification.actorId,
      target_user_id: notification.targetUserId,
      entity_type: notification.entity.type,
      entity_id: notification.entity.id,
      metadata: notification.metadata || {},
    })
    .select("id, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function persistNormalizedNotification(notification) {
  if (!notification) return null;
  const row = {
    user_id: notification.targetUserId,
    target_user_id: notification.targetUserId,
    actor_id: notification.actorId,
    sender_id: notification.actorId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    entity_id: notification.entity.id,
    entity_type: notification.entity.type,
    action_url: notification.actionUrl,
    read: false,
    metadata: notification.metadata || {},
    data: {
      actor: { id: notification.actorId },
      entity: notification.entity,
      metadata: notification.metadata || {},
    },
    created_at: notification.createdAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(row)
    .select("id, type, user_id, actor_id, entity_type, entity_id, read, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function createNotificationFromInteraction(interaction) {
  const notification = normalizeNotificationForInteraction(interaction);
  if (!notification) return { event: null, notification: null };

  const event = await persistNotificationEvent({ interaction, notification });
  const persisted = await persistNormalizedNotification(notification);
  return { event, notification: persisted };
}

export async function createCanonicalNotification({
  recipientId,
  senderId = null,
  type,
  title,
  body,
  entityId = null,
  entityType = null,
  actionUrl = null,
  metadata = {},
}) {
  if (!recipientId || !type) {
    throw new Error("recipientId and type are required for notifications");
  }
  if (recipientId === senderId) return null;

  return persistNormalizedNotification({
    type,
    actorId: senderId,
    targetUserId: recipientId,
    entity: { type: entityType, id: entityId },
    title: title || "Neue Aktivitaet",
    body: body || "",
    read: false,
    createdAt: new Date().toISOString(),
    metadata,
    actionUrl,
  });
}
