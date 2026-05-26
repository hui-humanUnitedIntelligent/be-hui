import { supabase } from "../lib/supabaseClient.js";

export const SOCIAL_REALTIME_EVENTS = Object.freeze({
  INTERACTION_CREATED: "interaction.created",
  RELATIONSHIP_UPDATED: "relationship.updated",
  NOTIFICATION_CREATED: "notification.created",
  PRESENCE_UPDATED: "presence.updated",
  INVITATION_CHANGED: "invitation.changed",
  CHAT_CHANGED: "chat.changed",
  REACTION_CREATED: "reaction.created",
});

function remove(channel) {
  if (channel) supabase.removeChannel(channel);
}

export const EntityRealtimeLayer = Object.freeze({
  subscribeEntity({ entityType, entityId, handlers = {} }) {
    if (!entityType || !entityId) throw new Error("entityType and entityId are required");
    const channel = supabase
      .channel(`entity:${entityType}:${entityId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "interactions",
        filter: `target_entity_id=eq.${entityId}`,
      }, payload => handlers.onInteraction?.(payload))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notification_events",
        filter: `entity_id=eq.${entityId}`,
      }, payload => handlers.onNotificationEvent?.(payload))
      .subscribe();

    return () => remove(channel);
  },
});

export const SocialRealtimeLayer = Object.freeze({
  subscribeUser({ userId, handlers = {} }) {
    if (!userId) throw new Error("userId is required");
    const channel = supabase
      .channel(`social:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, payload => handlers.onNotification?.(payload))
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "interactions",
        filter: `target_user_id=eq.${userId}`,
      }, payload => handlers.onInteraction?.(payload))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "social_relationships",
        filter: `target_user_id=eq.${userId}`,
      }, payload => handlers.onRelationship?.(payload))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "presence_states",
        filter: `user_id=eq.${userId}`,
      }, payload => handlers.onPresence?.(payload))
      .subscribe();

    return () => remove(channel);
  },

  subscribeInvitation({ invitationId, handlers = {} }) {
    if (!invitationId) throw new Error("invitationId is required");
    const channel = supabase
      .channel(`social:invitation:${invitationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "invitation_responses",
        filter: `invitation_id=eq.${invitationId}`,
      }, payload => handlers.onInvitationResponse?.(payload))
      .subscribe();

    return () => remove(channel);
  },

  subscribeChat({ chatId, handlers = {} }) {
    if (!chatId) throw new Error("chatId is required");
    const channel = supabase
      .channel(`social:chat:${chatId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, payload => handlers.onMessage?.(payload))
      .subscribe();

    return () => remove(channel);
  },
});

export async function emitSocialRealtime({ targetUserId, event, payload = {} }) {
  if (!targetUserId || !event) return { emitted: false, reason: "missing_target_or_event" };
  const channel = supabase.channel(`social-emit:${targetUserId}:${Date.now()}`);
  if (typeof channel?.send !== "function") {
    return { emitted: false, reason: "broadcast_unavailable" };
  }

  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      remove(channel);
      resolve({ emitted: false, reason: "broadcast_timeout" });
    }, 1500);

    channel.subscribe(async status => {
      if (status !== "SUBSCRIBED") return;
      try {
        await channel.send({
          type: "broadcast",
          event,
          payload,
        });
        clearTimeout(timeout);
        remove(channel);
        resolve({ emitted: true });
      } catch (error) {
        clearTimeout(timeout);
        remove(channel);
        resolve({ emitted: false, reason: error.message });
      }
    });
  });
}
