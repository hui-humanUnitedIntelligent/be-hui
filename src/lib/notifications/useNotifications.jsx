import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../AuthContext.jsx";
import { fetchNotifications } from "./notificationQueries.js";
import { subscribeNotificationInserts } from "./notificationRealtime.js";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./notificationActions.js";
import {
  filterVisibleNotifications,
  countUnreadNotifications,
} from "./notificationHelpers.js";

export function useNotifications() {
  // WICHTIG: useAuth() darf nicht in try/catch aufgerufen werden (React Rules of Hooks)
  const authCtx = useAuth();
  const user = authCtx?.user ?? null;

  const [items,   setItems]   = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const subRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await fetchNotifications(user.id);
      if (data && Array.isArray(data)) {
        setItems(filterVisibleNotifications(data));
        setUnread(countUnreadNotifications(data));
      }
    } catch(e) {
      console.error("[RESONANZZENTRUM] notifications load error:", e.message);
    }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setItems([]); setUnread(0); return; }
    load();
    const { channel, cleanup } = subscribeNotificationInserts(user.id, (payload) => {
      setItems(prev => [payload.new, ...prev]);
      setUnread(prev => prev + 1);
    });
    subRef.current = channel;
    return cleanup;
  }, [user?.id, load]);

  const markRead = useCallback(async (id) => {
    if (!user?.id) return;
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await markNotificationRead(user.id, id);
    } catch { /* silent */ }
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead(user.id);
    } catch { /* silent */ }
  }, [user?.id]);

  const deleteNotif = useCallback(async (id) => {
    if (!user?.id) return;
    // Optimistic: sofort aus UI entfernen
    setItems(prev => {
      const removed = prev.find(n => n.id === id);
      const next = prev.filter(n => n.id !== id);
      if (removed && !removed.is_read) {
        setUnread(u => Math.max(0, u - 1));
      }
      return next;
    });
    try {
      await deleteNotification(user.id, id);
    } catch { /* silent */ }
  }, [user?.id]);

  return { items, unread, loading, markRead, markAllRead, deleteNotif, reload: load };
}
