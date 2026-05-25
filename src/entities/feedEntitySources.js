// Central feed source registry.
// Status: canonical place where table rows become canonical entities for feed.

import {
  normalizeBeitragRow,
  normalizeConnectionRow,
  normalizeExperienceRow,
  normalizeFeedPostRow,
  normalizeInvitationRow,
  normalizeStoryRow,
  normalizeWorkRow,
} from "../normalizers/entityNormalizer.js";

export const PAGE_SIZE = 20;

export const FEED_ENTITY_SOURCES = Object.freeze([
  {
    sourceTable: "works",
    active: true,
    legacy: false,
    limit: 10,
    normalize: normalizeWorkRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("works")
        .select(`id,title,cover_url,media_url,category,description,
                 caption,tags,price,status,visibility,user_id,creator_id,created_at,updated_at,
                 profile:profiles(id,display_name,avatar_url,talent,location_label)`)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
  {
    sourceTable: "experiences",
    active: true,
    legacy: false,
    limit: 10,
    normalize: normalizeExperienceRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("experiences")
        .select(`id,title,cover_url,media_url,category,description,
                 price,duration,format,location_text,date,
                 booking_mode,pricing_type,experience_type,
                 participant_limit,max_participants,
                 mood,mood_tags,social_energy,
                 status,visibility,user_id,created_at,updated_at,
                 profile:profiles(id,display_name,avatar_url,talent,location_label)`)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
  {
    sourceTable: "feed_posts",
    active: true,
    legacy: true,
    limit: 8,
    normalize: normalizeFeedPostRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("feed_posts")
        .select(`id,user_id,caption,media_url,media_type,mood,location,is_archived,created_at,updated_at,
                 profile:user_id(id,display_name,avatar_url,talent,location_label)`)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
  {
    sourceTable: "beitraege",
    active: true,
    legacy: true,
    limit: 8,
    normalize: normalizeBeitragRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("beitraege")
        .select("id,user_id,src,type,caption,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
  {
    sourceTable: "stories",
    active: true,
    legacy: false,
    limit: 4,
    normalize: normalizeStoryRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("stories")
        .select(`id,user_id,media_url,media_type,caption,text_overlay,mood,location,
                 visibility,expires_at,created_at,
                 profile:user_id(id,display_name,avatar_url,talent,location_label)`)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
  {
    sourceTable: "invitations",
    active: true,
    legacy: false,
    limit: 2,
    normalize: normalizeInvitationRow,
    query: (supabase, limit) => supabase.from("invitations")
      .select(`id,user_id,text,title,vibe,mood,energy,
               location,city,time_label,starts_at,expires_at,
               visibility,status,max_participants,content_type,created_at,updated_at,
               profile:profiles(id,display_name,avatar_url,talent,location_label)`)
      .eq("status", "active")
      .eq("visibility", "public")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(limit),
  },
  {
    sourceTable: "connections",
    active: true,
    legacy: false,
    limit: 4,
    normalize: normalizeConnectionRow,
    query: (supabase, limit, cursor) => {
      let q = supabase.from("connections")
        .select(`id,user_id,type,title,description,date,time,location,max_participants,
                 cost,cost_amount,mood,visibility,openness,status,created_at,updated_at`)
        .eq("status", "active")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      return q;
    },
  },
]);

export async function fetchCanonicalFeedPage(supabase, cursor = null, pageSize = PAGE_SIZE) {
  const settled = await Promise.allSettled(
    FEED_ENTITY_SOURCES
      .filter((source) => source.active)
      .map(async (source) => {
        const { data, error } = await source.query(
          supabase,
          source.limit || Math.ceil(pageSize / 2),
          cursor
        );
        if (error) {
          console.warn("[HUI_ENTITY_FEED_SOURCE_ERROR]", source.sourceTable, error.code, error.message);
          return [];
        }
        return (data || [])
          .map((row) => source.normalize(row))
          .filter((item) => item?.feedEligible);
      })
  );

  const items = settled
    .flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, pageSize);

  const nextCursor = items.length > 0
    ? items[items.length - 1].createdAt || null
    : null;

  return {
    items,
    nextCursor,
    hasMore: items.length >= pageSize,
  };
}
