import { supabase } from "../supabaseClient.js";

/**
 * Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
 * existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
 * subscriben -- verhindert "cannot add postgres_changes callbacks ... after
 * subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
 */
export function subscribeNotificationInserts(userId, onInsert) {
  const topic = `notif:${userId}`;
  const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
  let ch = existing;
  let createdHere = false;

  if (!existing) {
    ch = supabase.channel(topic)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${userId}`,
      }, onInsert)
      .subscribe();
    createdHere = true;
  }

  return {
    channel: ch,
    createdHere,
    cleanup() {
      if (createdHere) supabase.removeChannel(ch);
    },
  };
}
