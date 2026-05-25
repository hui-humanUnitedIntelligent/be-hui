// Canonical entity contract.
// Status: platform source of truth for content entities.

import { normalizeAuthor, validateAuthor } from "./authorContract.js";
import { mediaFromRow, normalizeMediaInput, validateMedia } from "./mediaContract.js";
import {
  DEFAULT_VISIBILITY,
  isFeedVisible,
  normalizeVisibility,
  validateVisibility,
} from "./visibilityContract.js";
import {
  ENTITY_SOURCE_TABLES,
  ENTITY_TYPES,
  LEGACY_ENTITY_SOURCES,
  normalizeEntityType,
} from "../entities/entityTypes.js";

export const CANONICAL_ENTITY_FIELDS = Object.freeze([
  "id",
  "entityType",
  "authorId",
  "authorProfile",
  "title",
  "content",
  "media",
  "visibility",
  "status",
  "createdAt",
  "updatedAt",
  "metadata",
  "realtime",
  "feedEligible",
]);

const PUBLISHED_STATUSES = Object.freeze(["published", "active"]);
const NON_FEED_STATUSES = Object.freeze(["draft", "archived", "paused", "cancelled", "expired", "pending"]);

function safeStr(value, fallback = "") {
  return value != null && value !== "" ? String(value).trim() : fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const str = safeStr(value);
    if (str) return str;
  }
  return "";
}

function tableFromEntityType(entityType) {
  const match = Object.entries(ENTITY_SOURCE_TABLES)
    .find(([, type]) => type === entityType);
  return match?.[0] || null;
}

export function isPublishedStatus(status, entityType) {
  if (entityType === ENTITY_TYPES.STORY) return status === "published" || status === "active" || status === "";
  if (entityType === ENTITY_TYPES.FEED_POST || entityType === ENTITY_TYPES.BEITRAG) {
    return !NON_FEED_STATUSES.includes(status);
  }
  return PUBLISHED_STATUSES.includes(status);
}

export function createCanonicalEntity(row = {}, options = {}) {
  const sourceTable = options.sourceTable || row.sourceTable || row._sourceTable || null;
  const entityType = normalizeEntityType(
    options.entityType || row.entityType || row.content_type || row.type || row._type,
    sourceTable
  );

  const { authorId, authorProfile } = normalizeAuthor(row);
  const status = safeStr(row.status || (row.is_archived ? "archived" : ""), "");
  const visibility = normalizeVisibility(row.visibility, DEFAULT_VISIBILITY);
  const media = options.media || mediaFromRow(row);
  const title = firstNonEmpty(
    row.title,
    row.project_name,
    row.name,
    row.expTitle,
    row.caption?.slice?.(0, 80),
    row.text?.slice?.(0, 80)
  );
  const content = firstNonEmpty(
    row.content,
    row.description,
    row.caption,
    row.text,
    row.body,
    row.short_desc,
    row.problem,
    row.story
  );
  const createdAt = row.createdAt || row.created_at || row.submitted_at || null;
  const updatedAt = row.updatedAt || row.updated_at || row.reviewed_at || createdAt;
  const legacyStatus = sourceTable ? LEGACY_ENTITY_SOURCES[sourceTable] || null : null;
  const feedEligible = Boolean(
    isFeedVisible(visibility) &&
    isPublishedStatus(status, entityType) &&
    entityType !== ENTITY_TYPES.IMPACT_APPLICATION
  );

  return {
    id: row.id != null ? String(row.id) : null,
    entityType,
    authorId,
    authorProfile,
    title,
    content,
    media,
    visibility,
    status,
    createdAt,
    updatedAt,
    metadata: {
      sourceTable: sourceTable || tableFromEntityType(entityType),
      legacyStatus,
      deprecatedFields: collectDeprecatedFields(row),
      category: row.category || null,
      tags: Array.isArray(row.tags) ? row.tags : [],
      raw: row,
    },
    realtime: options.realtime || null,
    feedEligible,
  };
}

export function collectDeprecatedFields(row = {}) {
  const deprecated = [];
  [
    "creator",
    "creator_id",
    "user",
    "user_id",
    "author",
    "profile",
    "image",
    "images",
    "media_url",
    "cover_url",
    "attachments",
    "src",
    "created_at",
    "updated_at",
  ].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(row, field)) deprecated.push(field);
  });
  return deprecated;
}

export function validateEntity(entity, { requireId = true, requireAuthor = true } = {}) {
  const errors = [];

  if (!entity || typeof entity !== "object") {
    return { valid: false, errors: ["entity fehlt"] };
  }

  if (requireId && !entity.id) errors.push("id fehlt");
  if (!entity.entityType) errors.push("entityType fehlt");
  if (!entity.visibility) errors.push("visibility fehlt");

  const visibilityResult = validateVisibility(entity.visibility);
  if (!visibilityResult.valid) errors.push(...visibilityResult.errors);

  const mediaResult = validateMedia(entity.media);
  if (!mediaResult.valid) errors.push(...mediaResult.errors);

  if (requireAuthor) {
    const authorResult = validateAuthor({ authorId: entity.authorId });
    if (!authorResult.valid) errors.push(...authorResult.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    entity,
  };
}

export function validatePublishEntity(row, options = {}) {
  const entity = createCanonicalEntity(row, {
    ...options,
    media: options.media || normalizeMediaInput(
      options.mediaInput || row.media || row.images || row.media_urls || row.media_url || row.cover_url
    ),
  });

  return validateEntity(entity, {
    requireId: false,
    requireAuthor: true,
  });
}

export function assertValidEntity(entity, options = {}) {
  const result = validateEntity(entity, options);
  if (!result.valid) {
    throw new Error(`Entity contract invalid: ${result.errors.join("; ")}`);
  }
  return entity;
}
