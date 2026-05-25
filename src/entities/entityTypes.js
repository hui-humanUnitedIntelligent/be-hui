// Canonical entity taxonomy for HUI platform content.
// Status: canonical source of truth for entityType and feed-card routing.

export const ENTITY_TYPES = Object.freeze({
  WORK: "work",
  STORY: "story",
  FEED_POST: "feed_post",
  BEITRAG: "beitrag",
  EXPERIENCE: "experience",
  INVITATION: "invitation",
  CONNECTION: "connection",
  IMPACT_APPLICATION: "impact_application",
});

export const ENTITY_SOURCE_TABLES = Object.freeze({
  works: ENTITY_TYPES.WORK,
  stories: ENTITY_TYPES.STORY,
  feed_posts: ENTITY_TYPES.FEED_POST,
  beitraege: ENTITY_TYPES.BEITRAG,
  experiences: ENTITY_TYPES.EXPERIENCE,
  invitations: ENTITY_TYPES.INVITATION,
  connections: ENTITY_TYPES.CONNECTION,
  impact_applications: ENTITY_TYPES.IMPACT_APPLICATION,
});

export const LEGACY_ENTITY_SOURCES = Object.freeze({
  beitraege: "legacy-read-feed-source",
  feed_posts: "transitional-post-source",
});

const ENTITY_ALIAS_MAP = Object.freeze({
  werk: ENTITY_TYPES.WORK,
  work: ENTITY_TYPES.WORK,
  work_upload: ENTITY_TYPES.WORK,
  kunstwerk: ENTITY_TYPES.WORK,
  design: ENTITY_TYPES.WORK,
  handwerk: ENTITY_TYPES.WORK,
  erlebnis: ENTITY_TYPES.EXPERIENCE,
  experience: ENTITY_TYPES.EXPERIENCE,
  event: ENTITY_TYPES.EXPERIENCE,
  workshop: ENTITY_TYPES.EXPERIENCE,
  session: ENTITY_TYPES.EXPERIENCE,
  retreat: ENTITY_TYPES.EXPERIENCE,
  story: ENTITY_TYPES.STORY,
  moment: ENTITY_TYPES.STORY,
  note: ENTITY_TYPES.FEED_POST,
  thought: ENTITY_TYPES.FEED_POST,
  post: ENTITY_TYPES.FEED_POST,
  beitrag: ENTITY_TYPES.BEITRAG,
  beitraege: ENTITY_TYPES.BEITRAG,
  invitation: ENTITY_TYPES.INVITATION,
  einladung: ENTITY_TYPES.INVITATION,
  connection: ENTITY_TYPES.CONNECTION,
  verbindung: ENTITY_TYPES.CONNECTION,
  impact: ENTITY_TYPES.IMPACT_APPLICATION,
  impact_application: ENTITY_TYPES.IMPACT_APPLICATION,
});

export function normalizeEntityType(value, sourceTable = null) {
  if (sourceTable && ENTITY_SOURCE_TABLES[sourceTable]) {
    return ENTITY_SOURCE_TABLES[sourceTable];
  }

  const key = String(value || "").toLowerCase();
  return ENTITY_ALIAS_MAP[key] || ENTITY_TYPES.FEED_POST;
}

export function getFeedRouteType(entityType) {
  switch (normalizeEntityType(entityType)) {
    case ENTITY_TYPES.WORK:
      return "work";
    case ENTITY_TYPES.EXPERIENCE:
      return "experience";
    case ENTITY_TYPES.INVITATION:
      return "invitation";
    case ENTITY_TYPES.CONNECTION:
      return "moment";
    case ENTITY_TYPES.IMPACT_APPLICATION:
      return "moment";
    case ENTITY_TYPES.STORY:
    case ENTITY_TYPES.FEED_POST:
    case ENTITY_TYPES.BEITRAG:
    default:
      return "moment";
  }
}

export function isKnownEntityType(value) {
  return Object.values(ENTITY_TYPES).includes(value);
}
