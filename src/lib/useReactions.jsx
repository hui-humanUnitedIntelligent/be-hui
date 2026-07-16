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
import { HUIHeartIcon } from "../design/icons/HuiInteractionIcons.jsx";

// ── Shared Realtime Registry (post_reactions) ─────────────────
// Ein Channel pro Post, mehrere Hook-Instanzen als Listener.
// Behebt: doppelte Channels, verwaiste Callbacks, fehlende
// Cross-Instance-Sync (Feed + Detail + Preview gleichzeitig).
const _reactionChannels = new Map(); // topic -> { channel, refCount, listeners:Set }

function _topicKey(postId) {
  return `post_reactions:${postId}`;
}

function _broadcast(topic, msg) {
  const entry = _reactionChannels.get(topic);
  if (!entry) return;
  entry.listeners.forEach(fn => {
    try { fn(msg); } catch { /* silent */ }
  });
}

function _subscribePostReactions(postId, listener) {
  const topic = _topicKey(postId);
  let entry = _reactionChannels.get(topic);

  if (!entry) {
    const channel = supabase
      .channel(topic)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` },
        (payload) => { _broadcast(topic, { source: "realtime", event: "INSERT", row: payload.new }); })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` },
        (payload) => { _broadcast(topic, { source: "realtime", event: "DELETE", row: payload.old }); })
      .subscribe();
    entry = { channel, refCount: 0, listeners: new Set() };
    _reactionChannels.set(topic, entry);
  }

  entry.refCount++;
  entry.listeners.add(listener);

  return () => {
    const e = _reactionChannels.get(topic);
    if (!e) return;
    e.listeners.delete(listener);
    e.refCount--;
    if (e.refCount <= 0) {
      supabase.removeChannel(e.channel);
      _reactionChannels.delete(topic);
    }
  };
}

function _broadcastLocalReaction(postId, msg) {
  _broadcast(_topicKey(postId), { source: "local", ...msg });
}

function _applyReactionEvent(setMyTypes, setCounts, userId, msg) {
  const row = msg.row;
  if (!row?.type) return;

  const isOwn = row.user_id === userId;

  if (msg.event === "INSERT") {
    setMyTypes(prev => {
      if (!isOwn || prev.has(row.type)) return prev;
      const next = new Set(prev);
      next.add(row.type);
      return next;
    });
    setCounts(prev => {
      // Deduplizierung: optimistisch oder bereits gezählt
      if (isOwn && msg.source === "realtime") {
        // Realtime-Echo nach eigenem Toggle — Count bereits optimistisch
        return prev;
      }
      return {
        ...prev,
        [row.type]: (prev[row.type] || 0) + 1,
        total: (prev.total || 0) + 1,
      };
    });
  } else if (msg.event === "DELETE") {
    setMyTypes(prev => {
      if (!isOwn || !prev.has(row.type)) return prev;
      const next = new Set(prev);
      next.delete(row.type);
      return next;
    });
    setCounts(prev => {
      if (isOwn && msg.source === "realtime") return prev;
      return {
        ...prev,
        [row.type]: Math.max(0, (prev[row.type] || 0) - 1),
        total: Math.max(0, (prev.total || 0) - 1),
      };
    });
  }
}

// ── useSingleReaction ─────────────────────────────────────────
// postId: uuid of the post/work/experience
// postType: "post"|"work"|"experience"|"invitation"
// authorId: who created the post (for notifications)
export function useSingleReaction(postId, postType = "post", authorId = null, postSnapshot = null) {
  const { user } = useAuth();
  const [counts,   setCounts]   = useState({ like:0, inspire:0, save:0, total:0 });
  const [myTypes,  setMyTypes]  = useState(new Set()); // which types current user has set
  const [loading,  setLoading]  = useState(false);
  const mounted = useRef(true);
  const pendingLocalRef = useRef(null); // eigene Instanz nicht doppelt updaten

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
        } else if (!cancelled) {
          setMyTypes(new Set());
        }
      } catch { /* silent */ }
    }
    load();
    return () => { cancelled = true; };
  }, [postId, user?.id]);

  // ── Realtime — geteilter Channel pro Post, Fan-out an alle Instanzen ──
  useEffect(() => {
    if (!postId) return;

    const listener = (msg) => {
      if (!mounted.current) return;
      // Lokales Fan-out: diese Instanz hat bereits optimistisch aktualisiert
      if (msg.source === "local" && pendingLocalRef.current) {
        const p = pendingLocalRef.current;
        if (p.event === msg.event && p.type === msg.row?.type && msg.row?.user_id === user?.id) {
          pendingLocalRef.current = null;
          return;
        }
      }
      _applyReactionEvent(setMyTypes, setCounts, user?.id, msg);
    };

    return _subscribePostReactions(postId, listener);
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

    // Andere Instanzen (Feed + Detail + Preview) sofort synchronisieren
    pendingLocalRef.current = { event: wasActive ? "DELETE" : "INSERT", type };
    _broadcastLocalReaction(postId, {
      event: wasActive ? "DELETE" : "INSERT",
      row: { post_id: postId, user_id: user.id, type },
    });

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
        // Save snapshot to saved_posts -- MERKEN.2A (2026-07-08): postSnapshot
        if (type === "save") {
          await supabase.from("saved_posts").upsert(
            { user_id: user.id, post_id: postId, post_type: postType, post_data: postSnapshot || {} },
            { ignoreDuplicates: true }
          );
        }
        // Resonanz-Notification — nur Ersteller, nur inspire (nicht save)
        if (authorId && authorId !== user.id && type !== "save") {
          const senderName = user.display_name || user.username || "Jemand";
          const postTitle  = postSnapshot?.title || "";
          if (type === "inspire") {
            createNotification({
              recipientId: authorId,
              senderId:    user.id,
              type:        "resonanz",
              title:       `${senderName} hat deinem Beitrag Resonanz gegeben`,
              body:        postTitle ? `„${postTitle.slice(0, 80)}"` : "",
              entityId:    postId,
              entityType:  postType,
            }).catch(() => {});
          } else {
            createNotification({
              recipientId: authorId,
              senderId:    user.id,
              type:        "like",
              title:       `${senderName} gefällt dein Beitrag`,
              body:        postTitle ? `„${postTitle.slice(0, 80)}"` : "",
              entityId:    postId,
              entityType:  postType,
            }).catch(() => {});
          }
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
      pendingLocalRef.current = { event: wasActive ? "INSERT" : "DELETE", type };
      _broadcastLocalReaction(postId, {
        event: wasActive ? "INSERT" : "DELETE",
        row: { post_id: postId, user_id: user.id, type },
      });
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user?.id, user?.display_name, user?.username, postId, postType, authorId, postSnapshot, myTypes, loading]);

  return { counts, myTypes, toggle, isLoggedIn: !!user?.id };
}

// ── ResonanzStats — kompakte Anzeige fuer Karten ohne FeedActions ──
// Nutzt denselben useSingleReaction-Hook (keine zweite Datenquelle).
export function ResonanzStats({ postId, postType = "post", authorId = null, size = 12, showCount = true }) {
  const { counts, myTypes } = useSingleReaction(postId, postType, authorId);
  const count = counts?.inspire || 0;
  const active = myTypes?.has?.("inspire") ?? false;

  if (!postId) return null;
  if (!showCount && !active) return null;
  if (!showCount && active) {
    return <HUIHeartIcon size={size} active />;
  }
  if (count === 0 && !active) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <HUIHeartIcon size={size} active={active} />
      {showCount && count > 0 ? count : null}
    </span>
  );
}

// ── useSavedPosts ─────────────────────────────────────────────
// Returns saved post ids + toggle save function
export function useSavedPosts() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const idMapRef = useRef(new Map());

  useEffect(() => {
    if (!user?.id) { setSavedIds(new Set()); idMapRef.current = new Map(); return; }
    supabase.from("saved_posts")
      .select("id, post_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setSavedIds(new Set(data.map(r => r.post_id)));
          idMapRef.current = new Map(data.map(r => [r.id, r.post_id]));
        }
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const topic = `saved_posts_count:${user.id}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let channel = existing;
    let createdHere = false;
    if (!existing) {
      channel = supabase
        .channel(topic)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "saved_posts", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new;
            if (!row?.post_id) return;
            idMapRef.current.set(row.id, row.post_id);
            setSavedIds(prev => (prev.has(row.post_id) ? prev : new Set(prev).add(row.post_id)));
          })
        .on("postgres_changes",
          { event: "DELETE", schema: "public", table: "saved_posts", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const rowId = payload.old?.id;
            if (!rowId) return;
            const postId = idMapRef.current.get(rowId);
            if (!postId) return;
            idMapRef.current.delete(rowId);
            setSavedIds(prev => {
              if (!prev.has(postId)) return prev;
              const next = new Set(prev);
              next.delete(postId);
              return next;
            });
          })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(channel); };
  }, [user?.id]);

  const toggleSave = useCallback(async (postId, postType = "post", snapshot = {}) => {
    if (!user?.id) return;
    const isSaved = savedIds.has(postId);

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
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  }, [user?.id, savedIds]);

  return { savedIds, toggleSave, isSaved: (id) => savedIds.has(id), count: savedIds.size };
}
