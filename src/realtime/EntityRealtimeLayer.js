// Canonical entity realtime layer.
// Story realtime is owned here; consumers subscribe to entityType="story".

import { supabase as defaultSupabase } from "../lib/supabaseClient.js";

export const ENTITY_REALTIME_EVENTS = {
  CHANGED: "hui:entity:changed",
  FEED_INVALIDATE: "hui:feed:invalidate",
};

const ENTITY_CONFIG = {
  story: {
    table: "stories",
    channel: "entity:story:stories",
  },
};

const subscribers = new Map();
const channels = new Map();

function assertEntityType(entityType) {
  if (entityType !== "story") {
    throw new Error(`Unsupported canonical entityType: ${entityType}`);
  }
  return entityType;
}

function fanout(entityType, message) {
  const set = subscribers.get(entityType);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(message);
    } catch (err) {
      console.warn("[EntityRealtimeLayer] subscriber failed:", err?.message || err);
    }
  }
}

export function notifyEntityChange(entityType, eventType, payload = {}) {
  const type = assertEntityType(entityType);
  const entity = payload.entity ?? payload.record ?? payload;
  const message = {
    entityType: type,
    eventType,
    entity,
    payload,
    source: payload.source || "local",
    ts: Date.now(),
  };

  fanout(type, message);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ENTITY_REALTIME_EVENTS.CHANGED, { detail: message }));
    window.dispatchEvent(new CustomEvent(ENTITY_REALTIME_EVENTS.FEED_INVALIDATE, {
      detail: { entityType: type, eventType, entity },
    }));
  }

  return {
    prepared: true,
    entityType: type,
    eventType,
    channel: ENTITY_CONFIG[type].channel,
  };
}

function ensureChannel(entityType, supabaseClient) {
  const type = assertEntityType(entityType);
  if (channels.has(type)) return channels.get(type).channel;

  const config = ENTITY_CONFIG[type];
  const channel = supabaseClient
    .channel(config.channel)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: config.table,
    }, (payload) => {
      notifyEntityChange(type, String(payload.eventType || "change").toLowerCase(), {
        entity: payload.new || payload.old,
        payload,
        source: "supabase",
      });
    })
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn("[EntityRealtimeLayer] story realtime channel error");
      }
    });

  channels.set(type, { channel, supabaseClient });
  return channel;
}

export function subscribeEntityRealtime(entityType, handler, options = {}) {
  const type = assertEntityType(entityType);
  if (typeof handler !== "function") {
    throw new Error("subscribeEntityRealtime requires a handler");
  }

  if (!subscribers.has(type)) subscribers.set(type, new Set());
  subscribers.get(type).add(handler);
  ensureChannel(type, options.supabaseClient || defaultSupabase);

  return () => {
    const set = subscribers.get(type);
    if (!set) return;
    set.delete(handler);
    if (set.size > 0) return;

    subscribers.delete(type);
    const entry = channels.get(type);
    if (entry?.channel) entry.supabaseClient.removeChannel(entry.channel);
    channels.delete(type);
  };
}
