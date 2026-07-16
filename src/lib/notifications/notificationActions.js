import { supabase } from "../supabaseClient.js";

export function dispatchNotifReadEvent() {
  window.dispatchEvent(new CustomEvent("hui:notif:read"));
}

export async function markNotificationRead(userId, id) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
  dispatchNotifReadEvent();
}

export async function markAllNotificationsRead(userId) {
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  dispatchNotifReadEvent();
}

export async function deleteNotification(userId, id) {
  await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
  dispatchNotifReadEvent();
}

export async function respondToConnectionRequest(id, action) {
  const status = action === "accept" ? "accepted" : action === "decline" ? "declined" : "pending";
  await supabase.from("profile_relations").update({ status }).eq("id", id);
}
