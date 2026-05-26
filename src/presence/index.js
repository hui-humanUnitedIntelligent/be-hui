import { supabase } from "../lib/supabaseClient.js";

export const PRESENCE_STATUS = Object.freeze({
  ONLINE: "online",
  ACTIVE: "active",
  IDLE: "idle",
  OFFLINE: "offline",
});

const PRESENCE_STATUS_SET = new Set(Object.values(PRESENCE_STATUS));

export function statusFromLastActive(lastActiveAt) {
  if (!lastActiveAt) return PRESENCE_STATUS.OFFLINE;
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diffMin < 2) return PRESENCE_STATUS.ACTIVE;
  if (diffMin < 10) return PRESENCE_STATUS.ONLINE;
  if (diffMin < 60) return PRESENCE_STATUS.IDLE;
  return PRESENCE_STATUS.OFFLINE;
}

export function validatePresence(input = {}) {
  const value = {
    userId: input.userId ?? input.user_id,
    status: input.status || PRESENCE_STATUS.ACTIVE,
    currentRoute: input.currentRoute ?? input.current_route ?? null,
    currentWorld: input.currentWorld ?? input.current_world ?? null,
    lastActiveAt: input.lastActiveAt ?? input.last_active_at ?? new Date().toISOString(),
    metadata: input.metadata || {},
  };
  const errors = [];

  if (!value.userId) errors.push("userId is required");
  if (!PRESENCE_STATUS_SET.has(value.status)) {
    errors.push(`status must be one of: ${Array.from(PRESENCE_STATUS_SET).join(", ")}`);
  }
  if (Number.isNaN(new Date(value.lastActiveAt).getTime())) {
    errors.push("lastActiveAt must be a valid ISO timestamp");
  }
  if (typeof value.metadata !== "object" || Array.isArray(value.metadata)) {
    errors.push("metadata must be a JSON object");
  }

  return { valid: errors.length === 0, errors, value };
}

export function assertValidPresence(input = {}) {
  const result = validatePresence(input);
  if (!result.valid) throw new Error(`Invalid presence: ${result.errors.join("; ")}`);
  return result.value;
}

export async function updatePresence(input = {}) {
  const presence = assertValidPresence(input);
  const row = {
    user_id: presence.userId,
    status: presence.status,
    current_route: presence.currentRoute,
    current_world: presence.currentWorld,
    last_active_at: presence.lastActiveAt,
    metadata: presence.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("presence_states")
    .upsert(row, { onConflict: "user_id" })
    .select("user_id, status, current_route, current_world, last_active_at, metadata, updated_at")
    .single();

  if (error) throw error;

  const profileResult = await supabase
    .from("profiles")
    .update({ last_seen: presence.lastActiveAt })
    .eq("id", presence.userId);
  if (profileResult?.error) throw profileResult.error;

  return {
    userId: data.user_id,
    status: data.status,
    currentRoute: data.current_route,
    currentWorld: data.current_world,
    lastActiveAt: data.last_active_at,
    metadata: data.metadata || {},
  };
}

export async function getPresence(userId) {
  if (!userId) throw new Error("userId is required");
  const { data, error } = await supabase
    .from("presence_states")
    .select("user_id, status, current_route, current_world, last_active_at, metadata, updated_at")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return {
    userId: data.user_id,
    status: data.status || statusFromLastActive(data.last_active_at),
    currentRoute: data.current_route,
    currentWorld: data.current_world,
    lastActiveAt: data.last_active_at,
    metadata: data.metadata || {},
  };
}
