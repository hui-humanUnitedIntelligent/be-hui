import { supabase } from "../lib/supabaseClient.js";
import { INTERACTION_TYPES, assertValidInteraction } from "../interactions/contracts.js";

export const RELATIONSHIP_TYPES = Object.freeze({
  FOLLOWING: "following",
  MUTUAL: "mutual",
  COLLABORATOR: "collaborator",
  PARTICIPANT: "participant",
  SUPPORTER: "supporter",
  TRUSTED: "trusted",
  BLOCKED: "blocked",
});

const RELATIONSHIP_TYPE_SET = new Set(Object.values(RELATIONSHIP_TYPES));

const RELATIONSHIP_BY_INTERACTION = Object.freeze({
  [INTERACTION_TYPES.FOLLOW]: RELATIONSHIP_TYPES.FOLLOWING,
  [INTERACTION_TYPES.BOOKING]: RELATIONSHIP_TYPES.PARTICIPANT,
  [INTERACTION_TYPES.INVITE_RESPONSE]: RELATIONSHIP_TYPES.PARTICIPANT,
  [INTERACTION_TYPES.PARTICIPATE]: RELATIONSHIP_TYPES.PARTICIPANT,
  [INTERACTION_TYPES.MESSAGE]: RELATIONSHIP_TYPES.PARTICIPANT,
  [INTERACTION_TYPES.REACT]: RELATIONSHIP_TYPES.SUPPORTER,
  [INTERACTION_TYPES.SAVE]: RELATIONSHIP_TYPES.SUPPORTER,
  [INTERACTION_TYPES.SUPPORT]: RELATIONSHIP_TYPES.SUPPORTER,
  [INTERACTION_TYPES.REPLY]: RELATIONSHIP_TYPES.SUPPORTER,
  [INTERACTION_TYPES.COLLABORATION_INTEREST]: RELATIONSHIP_TYPES.COLLABORATOR,
});

const STRENGTH_BY_INTERACTION = Object.freeze({
  [INTERACTION_TYPES.FOLLOW]: 2,
  [INTERACTION_TYPES.REACT]: 1,
  [INTERACTION_TYPES.REPLY]: 2,
  [INTERACTION_TYPES.SAVE]: 1,
  [INTERACTION_TYPES.PARTICIPATE]: 5,
  [INTERACTION_TYPES.INVITE_RESPONSE]: 3,
  [INTERACTION_TYPES.BOOKING]: 6,
  [INTERACTION_TYPES.SUPPORT]: 4,
  [INTERACTION_TYPES.MESSAGE]: 1,
  [INTERACTION_TYPES.COLLABORATION_INTEREST]: 5,
});

function clampStrength(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(0, Math.min(100, parsed));
}

export function validateRelationship(input = {}) {
  const value = {
    sourceUserId: input.sourceUserId ?? input.source_user_id,
    targetUserId: input.targetUserId ?? input.target_user_id,
    relationshipType: input.relationshipType ?? input.relationship_type,
    strength: clampStrength(input.strength ?? 1),
    metadata: input.metadata || {},
    createdAt: input.createdAt ?? input.created_at ?? new Date().toISOString(),
  };
  const errors = [];

  if (!value.sourceUserId) errors.push("sourceUserId is required");
  if (!value.targetUserId) errors.push("targetUserId is required");
  if (value.sourceUserId && value.targetUserId && value.sourceUserId === value.targetUserId) {
    errors.push("sourceUserId and targetUserId must differ");
  }
  if (!RELATIONSHIP_TYPE_SET.has(value.relationshipType)) {
    errors.push(`relationshipType must be one of: ${Array.from(RELATIONSHIP_TYPE_SET).join(", ")}`);
  }
  if (typeof value.metadata !== "object" || Array.isArray(value.metadata)) {
    errors.push("metadata must be a JSON object");
  }

  return { valid: errors.length === 0, errors, value };
}

export function assertValidRelationship(input = {}) {
  const result = validateRelationship(input);
  if (!result.valid) {
    throw new Error(`Invalid relationship: ${result.errors.join("; ")}`);
  }
  return result.value;
}

export function relationshipFromInteraction(input = {}) {
  const interaction = assertValidInteraction(input);
  const relationshipType = RELATIONSHIP_BY_INTERACTION[interaction.interactionType];

  if (!relationshipType || !interaction.targetUserId || interaction.actorId === interaction.targetUserId) {
    return null;
  }

  return {
    sourceUserId: interaction.actorId,
    targetUserId: interaction.targetUserId,
    relationshipType,
    strength: STRENGTH_BY_INTERACTION[interaction.interactionType] || 1,
    metadata: {
      lastInteractionType: interaction.interactionType,
      lastInteractionId: interaction.id || null,
      targetEntityType: interaction.targetEntityType,
      targetEntityId: interaction.targetEntityId,
      context: interaction.metadata || {},
    },
  };
}

export async function upsertRelationship(input = {}) {
  const relationship = assertValidRelationship(input);
  const now = new Date().toISOString();
  const row = {
    source_user_id: relationship.sourceUserId,
    target_user_id: relationship.targetUserId,
    relationship_type: relationship.relationshipType,
    strength: relationship.strength,
    metadata: relationship.metadata || {},
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("social_relationships")
    .upsert(row, { onConflict: "source_user_id,target_user_id,relationship_type" })
    .select("id, source_user_id, target_user_id, relationship_type, strength, metadata, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function applyRelationshipForInteraction(interaction) {
  const relationship = relationshipFromInteraction(interaction);
  if (!relationship) return null;
  return upsertRelationship(relationship);
}
