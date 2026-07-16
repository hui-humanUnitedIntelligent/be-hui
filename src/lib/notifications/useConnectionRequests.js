import { useState, useEffect, useCallback } from "react";
import { fetchConnectionRequests } from "./notificationQueries.js";
import { respondToConnectionRequest } from "./notificationActions.js";

export function useConnectionRequests(userId) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await fetchConnectionRequests(userId);
      if (data && Array.isArray(data)) setRequests(data);
    } catch(e) {
      console.error("[RESONANZZENTRUM] connection_requests load error:", e.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function respond(id, action) {
    await respondToConnectionRequest(id, action);
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  return { requests, loading, respond, reload: load };
}
