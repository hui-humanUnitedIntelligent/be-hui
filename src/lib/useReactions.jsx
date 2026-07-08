// src/lib/useReactions.jsx — Phase 4B
// ══════════════════════════════════════════════════════════════
// Unified reaction hook for feed items (like · inspire · save).
// Optimistic UI + DB write + rollback on error.
// Also writes to saved_posts when type = "save".
// Fires notifications silently.
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase }   from "./supabaseClient.js";
import { useAuth }    from "./AuthContext.jsx";
import { createNotification } from "./notificationService.js";

// ── useSingleReaction ─────────────────────────────────────────
// postId: uuid of the post/work/experience
// postType: "post"|"work"|"experience"|"invitation"
// authorId: who created the post (for notifications)
export function useSingleReaction(postId, postType = "post", authorId = null) {
  const { user } = useAuth();
  const [counts,   setCounts]   = useState({ like:0, inspire:0, save:0, total:0 });
  const [myTypes,  setMyTypes]  = useState(new Set()); // which types current user has set
  const [loading,  setLoading]  = useState(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Load counts + user's reactions
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    async function load() {
      try {
        // Counts (public)
        const { data: cData } = await supabase
          .rpc("reaction_counts", { p_post_id: postId });
        if (!cancelled && cData) setCounts(cData);

        // My reactions (if logged in)
        if (user?.id) {
          const { data: myData } = await supabase
            .from("post_reactions")
            .select("type")
            .eq("post_id", postId)
            .eq("user_id", user.id);
          if (!cancelled && myData) setMyTypes(new Set(myData.map(r => r.type)));
        }
      } catch { /* silent */ }
    }
    load();
    return () => { cancelled = true; };
  }, [postId, user?.id]);

  // ── Realtime — andere Clients sehen neue/entfernte Reaktionen live,
  //    ohne Reload. Eigene Aenderungen kommen bereits optimistisch rein
  //    und werden hier ignoriert (sonst Doppelzaehlung durch das Echo). ──
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`post_reactions:${postId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.new;
          if (!row || row.user_id === user?.id) return; // eigene Aenderung schon optimistisch drin
          setCounts(prev => ({ ...prev, [row.type]: (prev[row.type] || 0) + 1, total: (prev.total || 0) + 1 }));
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.old;
          if (!row || row.user_id === user?.id) return;
          setCounts(prev => ({ ...prev, [row.type]: Math.max(0, (prev[row.type] || 0) - 1), total: Math.max(0, (prev.total || 0) - 1) }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, user?.id]);

  const toggle = useCallback(async (type) => {
    if (!user?.id || !postId) return;
    if (loading) return;

    const wasActive = myTypes.has(type);

    // Optimistic update
    setMyTypes(prev => {
      const next = new Set(prev);
      wasActive ? next.delete(type) : next.add(type);
      return next;
    });
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (wasActive ? -1 : 1)),
      total:  Math.max(0, (prev.total  || 0) + (wasActive ? -1 : 1)),
    }));

    setLoading(true);
    try {
      if (wasActive) {
        await supabase.from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("type", type);
        // Remove from saved_posts if save
        if (type === "save") {
          await supabase.from("saved_posts")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
        }
      } else {
        await supabase.from("post_reactions")
          .upsert({ post_id: postId, post_type: postType, user_id: user.id, type },
            { ignoreDuplicates: true });
        // Save snapshot to saved_posts
        if (type === "save") {
          await supabase.from("saved_posts").upsert(
            { user_id: user.id, post_id: postId, post_type: postType, post_data: {} },
            { ignoreDuplicates: true }
          );
        }
        // Fire notification silently
        if (authorId && authorId !== user.id) {
          createNotification({
            recipientId: authorId,
            senderId:    user.id,
            type:        type === "save" ? "save" : type === "inspire" ? "resonanz" : "like",
            title:       type === "save"    ? "Jemand hat deinen Beitrag gespeichert" :
                         type === "inspire" ? "Jemand lässt sich von dir inspirieren" :
                                              "Jemandem gefällt dein Beitrag",
            entityId:   postId,
            entityType: postType,
          }).catch(() => {});
        }
      }
    } catch {
      // Rollback
      setMyTypes(prev => {
        const next = new Set(prev);
        wasActive ? next.add(type) : next.delete(type);
        return next;
      });
      setCounts(prev => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) + (wasActive ? 1 : -1)),
        total:  Math.max(0, (prev.total  || 0) + (wasActive ? 1 : -1)),
      }));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user?.id, postId, postType, authorId, myTypes, loading]);

  return { counts, myTypes, toggle, isLoggedIn: !!user?.id };
}

// ── useSavedPosts ─────────────────────────────────────────────
// Returns saved post ids + toggle save function
export function useSavedPosts() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!user?.id) { setSavedIds(new Set()); return; }
    supabase.from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map(r => r.post_id)));
      });
  }, [user?.id]);

  const toggleSave = useCallback(async (postId, postType = "post", snapshot = {}) => {
    if (!user?.id) return;
    const isSaved = savedIds.has(postId);

    // Optimistic
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(postId) : next.add(postId);
      return next;
    });

    try {
      if (isSaved) {
        await supabase.from("saved_posts").delete()
          .eq("user_id", user.id).eq("post_id", postId);
        await supabase.from("post_reactions").delete()
          .eq("user_id", user.id).eq("post_id", postId).eq("type", "save");
      } else {
        await supabase.from("saved_posts").upsert(
          { user_id: user.id, post_id: postId, post_type: postType, post_data: snapshot },
          { ignoreDuplicates: true }
        );
        await supabase.from("post_reactions").upsert(
          { post_id: postId, post_type: postType, user_id: user.id, type: "save" },
          { ignoreDuplicates: true }
        );
      }
    } catch {
      // Rollback
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  }, [user?.id, savedIds]);

  return { savedIds, toggleSave, isSaved: (id) => savedIds.has(id) };
}
