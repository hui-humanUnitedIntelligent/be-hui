import { supabase } from "../lib/supabaseClient.js";
import {
  fromInteractionRow,
  toInteractionRow,
  assertValidInteraction,
} from "../interactions/contracts.js";
import { applyRelationshipForInteraction } from "./relationships.js";
import { createNotificationFromInteraction } from "../notifications/engine.js";
import { emitSocialRealtime, SOCIAL_REALTIME_EVENTS } from "./realtime.js";

export async function persistInteraction(input = {}) {
  const interaction = assertValidInteraction(input);
  const { data, error } = await supabase
    .from("interactions")
    .insert(toInteractionRow(interaction))
    .select(`
      id, interaction_type, actor_id, target_entity_type, target_entity_id,
      target_user_id, visibility, metadata, created_at
    `)
    .single();

  if (error) throw error;
  return fromInteractionRow(data);
}

export async function dispatchSocialInteraction(input = {}, options = {}) {
  const {
    updateRelationship = true,
    notify = true,
    emitRealtime = true,
  } = options;

  try {
    const canonicalInput = assertValidInteraction(input);
    const interaction = await persistInteraction(canonicalInput);
    const interactionWithId = { ...canonicalInput, id: interaction.id, createdAt: interaction.createdAt };

    const relationship = updateRelationship
      ? await applyRelationshipForInteraction(interactionWithId)
      : null;

    const notification = notify
      ? await createNotificationFromInteraction(interactionWithId)
      : { event: null, notification: null };

    const realtime = emitRealtime
      ? await emitSocialRealtime({
        targetUserId: interactionWithId.targetUserId,
        event: SOCIAL_REALTIME_EVENTS.INTERACTION_CREATED,
        payload: {
          interaction,
          relationshipId: relationship?.id || null,
          notificationId: notification?.notification?.id || null,
        },
      })
      : { emitted: false, reason: "disabled" };

    return {
      data: {
        interaction,
        relationship,
        notification,
        realtime,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Social interaction pipeline failed",
        cause: error,
      },
    };
  }
}

export async function assertSocialInteraction(input = {}, options = {}) {
  const result = await dispatchSocialInteraction(input, options);
  if (result.error) throw result.error.cause || new Error(result.error.message);
  return result.data;
}
