// Central realtime entity layer.
// Status: canonical realtime path: postgres event -> entity -> validation -> feed item.

import {
  normalizeBeitragRow,
  normalizeConnectionRow,
  normalizeExperienceRow,
  normalizeFeedPostRow,
  normalizeInvitationRow,
  normalizeStoryRow,
  normalizeWorkRow,
} from "../normalizers/entityNormalizer.js";

export const ENTITY_REALTIME_CHANNEL = "hui_entity_realtime_layer";

export const ENTITY_REALTIME_SOURCES = Object.freeze([
  {
    sourceTable: "works",
    filter: "status=eq.published",
    normalize: normalizeWorkRow,
    allow: (row) => row.visibility === "public",
  },
  {
    sourceTable: "experiences",
    filter: "status=eq.published",
    normalize: normalizeExperienceRow,
    allow: (row) => row.visibility === "public",
  },
  {
    sourceTable: "feed_posts",
    normalize: normalizeFeedPostRow,
    allow: (row) => row.is_archived !== true,
  },
  {
    sourceTable: "beitraege",
    normalize: normalizeBeitragRow,
  },
  {
    sourceTable: "stories",
    normalize: normalizeStoryRow,
    allow: (row) => !row.expires_at || new Date(row.expires_at) > new Date(),
  },
  {
    sourceTable: "invitations",
    filter: "visibility=eq.public",
    normalize: normalizeInvitationRow,
    allow: (row) => row.status === "active" && (!row.expires_at || new Date(row.expires_at) > new Date()),
  },
  {
    sourceTable: "connections",
    filter: "visibility=eq.public",
    normalize: normalizeConnectionRow,
    allow: (row) => row.status === "active",
  },
]);

export function createEntityRealtimeLayer({
  supabase,
  onEntity,
  onError,
  channelName = ENTITY_REALTIME_CHANNEL,
} = {}) {
  if (!supabase) throw new Error("createEntityRealtimeLayer: supabase fehlt");
  if (typeof onEntity !== "function") throw new Error("createEntityRealtimeLayer: onEntity fehlt");

  let channel = supabase.channel(channelName);

  ENTITY_REALTIME_SOURCES.forEach((source) => {
    const config = {
      event: "INSERT",
      schema: "public",
      table: source.sourceTable,
      ...(source.filter ? { filter: source.filter } : {}),
    };

    channel = channel.on("postgres_changes", config, (payload) => {
      try {
        const row = payload?.new;
        if (!row) return;
        if (source.allow && !source.allow(row)) return;

        const item = source.normalize({
          ...row,
          _sourceTable: source.sourceTable,
        });

        if (!item?.feedEligible) return;

        onEntity(item, item._entity, payload);
      } catch (err) {
        console.warn("[HUI_ENTITY_REALTIME_ERROR]", source.sourceTable, err?.message);
        onError?.(err, source, payload);
      }
    });
  });

  return channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR") {
      const err = new Error("EntityRealtimeLayer channel error");
      console.warn("[HUI_ENTITY_REALTIME_ERROR]", err.message);
      onError?.(err);
    }
  });
}
