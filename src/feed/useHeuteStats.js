// src/feed/useHeuteStats.js
// Data hook for the "Heute auf HUI" live stats in the feed welcome header.

import React from "react";
import { getRecentMemberLiveText } from "./feedWelcomeHeaderUtils.js";

const INITIAL_HEUTE_STATS = { works: 0, experiences: 0, members: 0, liveText: "" };

export function useHeuteStats() {
  const [stats, setStats] = React.useState(INITIAL_HEUTE_STATS);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("../lib/supabaseClient.js");
        const today = new Date();
        today.setHours(0,0,0,0);
        const iso = today.toISOString();

        const [worksRes, expRes, membersRes, recentMember] = await Promise.all([
          supabase.from("works").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("experiences").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("profiles").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("profiles")
            .select("display_name, username, city")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

        if (cancelled) return;
        const liveText = getRecentMemberLiveText(recentMember.data);

        setStats({
          works:       worksRes.count  ?? 0,
          experiences: expRes.count    ?? 0,
          members:     membersRes.count ?? 0,
          liveText,
        });
      } catch { /* silent — Platzhalter bleiben */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return stats;
}
