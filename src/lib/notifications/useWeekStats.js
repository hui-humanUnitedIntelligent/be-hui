import { useState, useEffect } from "react";
import { fetchWeekStats } from "./notificationQueries.js";

export function useWeekStats(userId) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchWeekStats(userId).then(setStats);
  }, [userId]);

  return stats;
}
