// Canonical interaction contracts for Phase 5 social infrastructure.
// These helpers are intentionally framework-free so every writer can share
// the same validation path before touching Supabase.

export const INTERACTION_TYPES = Object.freeze({
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
});

export const TARGET_ENTITY_TYPES = Object.freeze({
  PROFILE: "profile",
  WORK: "work",
  EXPERIENCE: "experience",
  INVITATION: "invitation",
  BOOKING: "booking",
  CHAT: "chat",
  MESSAGE: "message",
  CONNECTION: "connection",
  COMMENT: "comment",
  COMMUNITY: "community",
  IMPACT_PROJECT: "impact_project",
  SYSTEM: "system",
});

export const INTERACTION_VISIBILITY = Object.freeze({
  PUBLIC: "public",
  FOLLOWERS: "followers",
  PRIVATE: "private",
  SYSTEM: "system",
});

const INTERACTION_TYPE_SET = new Set(Object.values(INTERACTION_TYPES));
const TARGET_ENTITY_TYPE_SET = new Set(Object.values(TARGET_ENTITY_TYPES));
const VISIBILITY_SET = new Set(Object.values(INTERACTION_VISIBILITY));

function cleanString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function isMetadataObject(value) {
  return value == null || (typeof value === "object" && !Array.isArray(value));
}

export function normalizeInteraction(input = {}) {
  const metadata = input.metadata ?? input.context ?? {};
  return {
    id: cleanString(input.id) || null,
    interactionType: cleanString(input.interactionType),
    actorId: cleanString(input.actorId ?? input.actor_id),
    targetEntityType: cleanString(input.targetEntityType ?? input.target_entity_type),
    targetEntityId: String(cleanString(input.targetEntityId ?? input.target_entity_id) || ""),
    targetUserId: cleanString(input.targetUserId ?? input.target_user_id) || null,
    visibility: cleanString(input.visibility) || INTERACTION_VISIBILITY.PRIVATE,
    metadata,
    createdAt: input.createdAt ?? input.created_at ?? new Date().toISOString(),
  };
}

export function validateInteraction(input = {}) {
  const value = normalizeInteraction(input);
  const errors = [];

  if (!INTERACTION_TYPE_SET.has(value.interactionType)) {
    errors.push(`interactionType must be one of: ${Array.from(INTERACTION_TYPE_SET).join(", ")}`);
  }
  if (!value.actorId) errors.push("actorId is required");
  if (!TARGET_ENTITY_TYPE_SET.has(value.targetEntityType)) {
    errors.push(`targetEntityType must be one of: ${Array.from(TARGET_ENTITY_TYPE_SET).join(", ")}`);
  }
  if (!value.targetEntityId) errors.push("targetEntityId is required");
  if (!VISIBILITY_SET.has(value.visibility)) {
    errors.push(`visibility must be one of: ${Array.from(VISIBILITY_SET).join(", ")}`);
  }
  if (!isMetadataObject(value.metadata)) {
    errors.push("metadata must be a JSON object");
  }
  if (Number.isNaN(new Date(value.createdAt).getTime())) {
    errors.push("createdAt must be a valid ISO timestamp");
  }

  return { valid: errors.length === 0, errors, value };
}

export function assertValidInteraction(input = {}) {
  const result = validateInteraction(input);
  if (!result.valid) {
    throw new Error(`Invalid interaction: ${result.errors.join("; ")}`);
  }
  return result.value;
}

export function toInteractionRow(interaction) {
  const value = assertValidInteraction(interaction);
  return {
    interaction_type: value.interactionType,
    actor_id: value.actorId,
    target_entity_type: value.targetEntityType,
    target_entity_id: value.targetEntityId,
    target_user_id: value.targetUserId,
    visibility: value.visibility,
    metadata: value.metadata || {},
    created_at: value.createdAt,
  };
}

export function fromInteractionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    interactionType: row.interaction_type,
    actorId: row.actor_id,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id,
    targetUserId: row.target_user_id,
    visibility: row.visibility,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}
