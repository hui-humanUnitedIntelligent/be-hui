// Central entity normalizer.
// Status: canonical path from table rows/realtime events to feed-card data.

import {
  createCanonicalEntity,
  validateEntity,
} from "../contracts/entityContract.js";
import { ENTITY_SOURCE_TABLES, ENTITY_TYPES, getFeedRouteType } from "../entities/entityTypes.js";

const FALLBACK_TITLE = "Unbenannt";

function safeStr(value, fallback = "") {
  return value != null && value !== "" ? String(value).trim() : fallback;
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function relTime(ts) {
  if (!ts) return "";
  try {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "Gerade eben";
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
    return `vor ${Math.floor(diff / 86400)} Tagen`;
  } catch {
    return "";
  }
}

function firstMediaUrl(entity) {
  return entity.media?.[0]?.url || null;
}

function mediaUrls(entity) {
  return (entity.media || []).map((item) => item.url).filter(Boolean);
}

function buildExperienceMeta(raw = {}) {
  return [
    raw.date
      ? new Date(raw.date).toLocaleDateString("de-DE", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })
      : null,
    raw.location_text || raw.location || null,
    raw.price != null ? `${raw.price} €` : raw.pricing_type === "free" ? "Kostenlos" : null,
    (raw.participant_limit || raw.max_participants)
      ? `Max. ${raw.participant_limit || raw.max_participants} Personen`
      : null,
  ].filter(Boolean).join(" · ");
}

function defaultRhythmState(routeType, raw = {}) {
  if (raw.rhythmState) return raw.rhythmState;
  if (routeType === "experience") return "experience";
  if (routeType === "work") return "hero";
  if (routeType === "invitation") return "resonance";
  return "note";
}

function defaultPresenceState(routeType, raw = {}) {
  if (raw.presenceState) return raw.presenceState;
  if (routeType === "experience") return "gathering";
  if (routeType === "invitation") return "gathering";
  if (routeType === "moment") return "reflecting";
  return "creating";
}

export function normalizeEntity(row, options = {}) {
  const entity = createCanonicalEntity(row, options);
  const validation = validateEntity(entity, {
    requireId: options.requireId !== false,
    requireAuthor: options.requireAuthor !== false,
  });

  if (!validation.valid) {
    console.warn("[HUI_ENTITY_INVALID]", {
      sourceTable: entity.metadata?.sourceTable,
      entityType: entity.entityType,
      id: entity.id,
      errors: validation.errors,
    });
    return null;
  }

  return entity;
}

export function normalizeEntityFromTable(sourceTable, row, options = {}) {
  return normalizeEntity(row, {
    ...options,
    sourceTable,
    entityType: ENTITY_SOURCE_TABLES[sourceTable],
  });
}

export function normalizeEntities(rows = [], options = {}) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => normalizeEntity(row, options))
    .filter(Boolean);
}

export function normalizeTableRows(sourceTable, rows = [], options = {}) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => normalizeEntityFromTable(sourceTable, row, options))
    .filter(Boolean);
}

export function toFeedCardEntity(entity) {
  if (!entity) return null;

  const raw = entity.metadata?.raw || {};
  const routeType = getFeedRouteType(entity.entityType);
  const imageUrls = mediaUrls(entity);
  const firstImage = firstMediaUrl(entity);
  const creator = {
    id: entity.authorId,
    name: entity.authorProfile?.displayName || "Creative Human",
    displayName: entity.authorProfile?.displayName || "Creative Human",
    avatar: entity.authorProfile?.avatarUrl || null,
    username: entity.authorProfile?.username || "",
    talent: entity.authorProfile?.talent || raw.category || "",
    location: entity.authorProfile?.location || raw.location_text || raw.location || "",
    verified: Boolean(entity.authorProfile?.verified),
  };

  const caption = safeStr(entity.content || raw.caption || raw.text || raw.body);
  const title = safeStr(entity.title, FALLBACK_TITLE);

  return {
    ...entity,
    type: routeType,
    content_type: routeType,
    entityType: entity.entityType,
    title,
    caption,
    description: safeStr(raw.description || entity.content || raw.caption || raw.text),
    text: safeStr(raw.text || raw.caption || entity.content),
    name: creator.name,
    creator,
    creator_id: entity.authorId,
    creatorId: entity.authorId,
    authorId: entity.authorId,
    authorProfile: entity.authorProfile,
    avatar: creator.avatar,
    talent: creator.talent,
    location: raw.location_text || raw.location || raw.city || creator.location,
    media: entity.media,
    mediaUrls: imageUrls,
    entityMedia: entity.media,
    images: imageUrls,
    expImg: firstImage,
    coverUrl: firstImage,
    cover_url: firstImage,
    expTitle: safeStr(raw.expTitle || entity.title || raw.name),
    expMeta: buildExperienceMeta(raw),
    bookingMode: safeStr(raw.booking_mode || raw.bookingMode, "direct"),
    pricingType: safeStr(raw.pricing_type || raw.pricingType, "fixed"),
    expType: safeStr(raw.experience_type || raw.expType),
    price: raw.price != null ? safeNum(raw.price) : null,
    duration: safeStr(raw.duration),
    format: safeStr(raw.format),
    rhythmState: defaultRhythmState(routeType, raw),
    presenceState: defaultPresenceState(routeType, raw),
    resonanz: safeNum(raw.resonanz || raw.likes),
    berührt: safeNum(raw.berührt),
    begleitet: safeNum(raw.begleitet),
    viewers: Array.isArray(raw.viewers) ? raw.viewers.filter(Boolean) : [],
    viewerExtra: safeNum(raw.viewerExtra),
    time: safeStr(raw.time || raw.time_label) || relTime(entity.createdAt),
    category: safeStr(raw.category),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
    status: entity.status,
    visibility: entity.visibility,
    isLive: Boolean(raw.isLive || raw.is_live),
    feedEligible: entity.feedEligible,
    _raw: raw,
    _entity: entity,
  };
}

export function normalizeFeedItem(row, options = {}) {
  return toFeedCardEntity(normalizeEntity(row, options));
}

export function normalizeFeedItems(rows = [], options = {}) {
  return normalizeEntities(rows, options).map(toFeedCardEntity).filter(Boolean);
}

export const normalizeWorkRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("works", row));

export const normalizeStoryRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("stories", row));

export const normalizeFeedPostRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("feed_posts", row));

export const normalizeBeitragRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("beitraege", row));

export const normalizeExperienceRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("experiences", row));

export const normalizeInvitationRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("invitations", row));

export const normalizeConnectionRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("connections", row));

export const normalizeImpactApplicationRow = (row) =>
  toFeedCardEntity(normalizeEntityFromTable("impact_applications", row));

export const CANONICAL_NORMALIZERS = Object.freeze({
  [ENTITY_TYPES.WORK]: normalizeWorkRow,
  [ENTITY_TYPES.STORY]: normalizeStoryRow,
  [ENTITY_TYPES.FEED_POST]: normalizeFeedPostRow,
  [ENTITY_TYPES.BEITRAG]: normalizeBeitragRow,
  [ENTITY_TYPES.EXPERIENCE]: normalizeExperienceRow,
  [ENTITY_TYPES.INVITATION]: normalizeInvitationRow,
  [ENTITY_TYPES.CONNECTION]: normalizeConnectionRow,
  [ENTITY_TYPES.IMPACT_APPLICATION]: normalizeImpactApplicationRow,
});
