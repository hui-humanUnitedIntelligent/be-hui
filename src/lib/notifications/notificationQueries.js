import { supabase } from "../supabaseClient.js";

const NOTIFICATION_SELECT =
  "id,type,title,body,is_read,created_at,data,metadata,action_url,actor_id";

export async function fetchNotifications(userId) {
  return supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);
}

export async function fetchConnectionRequests(userId) {
  return supabase
    .from("profile_relations")
    .select("id,requester_id,intention,message,created_at,status")
    .eq("target_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
}

export async function fetchWeekStats(userId) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  return Promise.all([
    supabase.from("profile_watchlist")
      .select("id", { count:"exact", head:true })
      .eq("profile_id", userId)
      .gte("created_at", weekAgo),
    supabase.from("notifications")
      .select("id", { count:"exact", head:true })
      .eq("user_id", userId)
      .eq("type", "like")
      .gte("created_at", weekAgo),
    supabase.from("notifications")
      .select("id", { count:"exact", head:true })
      .eq("user_id", userId)
      .eq("type", "save")
      .gte("created_at", weekAgo),
    supabase.from("notifications")
      .select("id", { count:"exact", head:true })
      .eq("user_id", userId)
      .eq("type", "booking")
      .gte("created_at", weekAgo),
  ]).then(([w, l, s, b]) => ({
    connections: w.count ?? 0,
    reached:     (l.count ?? 0) * 4 + (s.count ?? 0) * 2,
    saved:       s.count ?? 0,
    booked:      b.count ?? 0,
  }));
}
