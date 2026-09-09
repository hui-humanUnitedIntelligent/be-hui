// src/lib/useRepost.js — REPOST-SYSTEM-001 (2026-09-09)
// ══════════════════════════════════════════════════════════════
// Repost-Hook fuer eine einzelne Feed-Karte. Analog zu
// useSingleReaction() in useReactions.jsx (gleiches Muster:
// Status laden + Realtime + optimistisches Toggle + Rollback),
// aber eigenstaendig, weil Reposts KEINE Reaktion sind (eigene
// Tabelle mit Snapshot + Caption + eigener Feed-Praesenz statt
// nur eines Zaehlers).
//
// NUR fuer original_type IN ('work','talent','experience','project')
// -- 'moment' wird NIE hier aufgerufen (Aufrufer/UI verantwortlich,
// zusaetzlich durch DB-CHECK-Constraint abgesichert).
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient.js";
import { useAuth } from "./AuthContext.jsx";
import { createNotification } from "./notificationService.js";
import { useTranslation } from "../hooks/useTranslation.js";

const ALLOWED_TYPES = ["work", "talent", "experience", "project"];

// originalId: uuid des Original-Posts (Werk/Talent/Erlebnis/Projekt)
// originalType: einer von ALLOWED_TYPES
// authorId: Ersteller des Original-Posts (fuer Benachrichtigung)
export function useRepostStatus(originalId, originalType, authorId = null) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isReposted, setIsReposted] = useState(false);
  const [repostId, setRepostId] = useState(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Eigenen Repost-Status laden
  useEffect(() => {
    if (!originalId || !user?.id) { setIsReposted(false); setRepostId(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("reposts")
          .select("id")
          .eq("user_id", user.id)
          .eq("original_type", originalType)
          .eq("original_id", originalId)
          .maybeSingle(); // HERZ-RACE-GUARD-Lehre: .maybeSingle() statt .single() (Memory #914)
        if (cancelled) return;
        setIsReposted(!!data);
        setRepostId(data?.id || null);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [originalId, originalType, user?.id]);

  // createRepost: legt einen neuen Repost an (mit optionalem Caption + Snapshot)
  const createRepost = useCallback(async (caption, postDataSnapshot) => {
    if (!user?.id || !originalId) return { ok: false };
    if (!ALLOWED_TYPES.includes(originalType)) return { ok: false }; // Momente-Schutz (defense-in-depth)
    if (isReposted || loading) return { ok: false, already: true };

    setLoading(true);
    // Optimistic
    setIsReposted(true);
    try {
      const { data, error } = await supabase
        .from("reposts")
        .insert({
          user_id: user.id,
          original_type: originalType,
          original_id: originalId,
          caption: caption?.trim() ? caption.trim().slice(0, 500) : null,
          post_data: postDataSnapshot || {},
        })
        .select("id")
        .single();
      if (error) throw error;
      setRepostId(data.id);

      // Benachrichtigung an den Ersteller (analog RESONANZ.4/.5-Muster)
      if (authorId && authorId !== user.id) {
        createNotification({
          recipientId: authorId,
          senderId:    user.id,
          type:        "repost",
          title:       t("repost.notifTitle"),
          body:        postDataSnapshot?.title ? `"${String(postDataSnapshot.title).slice(0, 80)}"` : undefined,
          entityId:    originalId,
          entityType:  originalType,
          metadata:    { original_id: originalId, original_type: originalType },
        }).catch(() => {});
      }
      return { ok: true, id: data.id };
    } catch (e) {
      // Rollback
      if (mounted.current) { setIsReposted(false); setRepostId(null); }
      return { ok: false, error: e };
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user?.id, originalId, originalType, authorId, isReposted, loading, t]);

  // deleteRepost: entfernt den eigenen Repost wieder (Anforderung 6)
  const deleteRepost = useCallback(async () => {
    if (!user?.id || !repostId) return { ok: false };
    if (loading) return { ok: false };
    setLoading(true);
    const prevId = repostId;
    // Optimistic
    setIsReposted(false);
    setRepostId(null);
    try {
      const { error } = await supabase
        .from("reposts")
        .delete()
        .eq("id", prevId)
        .eq("user_id", user.id);
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      // Rollback
      if (mounted.current) { setIsReposted(true); setRepostId(prevId); }
      return { ok: false, error: e };
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user?.id, repostId, loading]);

  return { isReposted, repostId, loading, createRepost, deleteRepost };
}
