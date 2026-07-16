// src/lib/commentsService.js — KOMMENTAR.1 (2026-07-09)
// ══════════════════════════════════════════════════════════════════
// Zentrale Datenschicht fuer die generalisierte Kommentarfunktion.
// EINZIGER Ort, der die Tabellen post_comments/comment_hearts/
// comment_reports anspricht -- CommentsSheet.jsx enthaelt KEINE eigene
// Query-Logik ausserhalb dieser Funktionen (Single Source of Truth,
// siehe Architektur-Charta #7/Governance "keine parallelen Datenfluesse").
//
// Voraussetzung: Migration 073 (supabase/migrations/20260709_073_
// comments_system.sql) muss im Supabase SQL Editor ausgefuehrt sein.
// Bis dahin liefern die Funktionen defensiv leere Ergebnisse / den
// Sentinel-Fehler "MIGRATION_PENDING" statt die App abstuerzen zu lassen.
// ══════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient.js";

const TABLE  = "post_comments";
const MAX_DEPTH_FETCHES = 6; // Sicherheitsdeckel gegen endlose Nachlade-Schleifen

function isMissingTableError(error) {
  // Postgres/PostgREST: 42P01 = undefined_table, oder PostgREST-Fehlercode PGRST205
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|not find the table/i.test(error.message || ""));
}

function shapeRow(row) {
  return {
    id: row.id, post_id: row.post_id, post_type: row.post_type, user_id: row.user_id,
    parent_comment_id: row.parent_comment_id, text: row.deleted_at ? "" : row.text,
    created_at: row.created_at, is_edited: !!row.updated_at, is_deleted: !!row.deleted_at,
    heart_count: 0, hearted_by_me: false, replies: [],
  };
}

async function attachHearts(flatRows, currentUserId) {
  if (!flatRows.length) return;
  const ids = flatRows.map(r => r.id);
  const { data: counts } = await supabase.rpc("comment_heart_counts", { p_comment_ids: ids });
  const countMap = new Map((counts || []).map(c => [c.comment_id, c.count]));
  let myHearts = new Set();
  if (currentUserId) {
    const { data: mine } = await supabase.from("comment_hearts").select("comment_id").eq("user_id", currentUserId).in("comment_id", ids).limit(ids.length);
    myHearts = new Set((mine || []).map(m => m.comment_id));
  }
  flatRows.forEach(r => {
    r.heart_count = countMap.get(r.id) || 0;
    r.hearted_by_me = myHearts.has(r.id);
  });
}

function buildTree(rootRows, replyRows) {
  const byId = new Map();
  [...rootRows, ...replyRows].forEach(r => byId.set(r.id, r));
  replyRows.forEach(r => {
    const parent = byId.get(r.parent_comment_id);
    if (parent) parent.replies.push(r);
  });
  return rootRows;
}

// ── Kommentare laden (Root-Seite + alle Antworten dieser Roots) ───────
export async function getComments(postId, postType, { offset = 0, limit = 20, currentUserId } = {}) {
  const { data: roots, error, count } = await supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("post_id", postId).eq("post_type", postType)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (isMissingTableError(error)) return { items: [], hasMore: false, nextOffset: 0, totalRoots: 0, error: "MIGRATION_PENDING" };
  if (error || !roots) return { items: [], hasMore: false, nextOffset: offset, totalRoots: 0, error: error?.message || "unknown" };

  const rootShaped = roots.map(shapeRow);

  // Antworten (beliebige Tiefe) iterativ nachladen -- Kommentar-Threads sind
  // in der Praxis flach (1-2 Ebenen), ein Sicherheitsdeckel verhindert
  // trotzdem endlose Schleifen bei unerwartet tiefen Threads.
  let frontierIds = rootShaped.map(r => r.id);
  const replyShaped = [];
  for (let i = 0; i < MAX_DEPTH_FETCHES && frontierIds.length; i++) {
    const { data: children, error: childErr } = await supabase
      .from(TABLE).select("*").in("parent_comment_id", frontierIds).order("created_at", { ascending: true });
    if (childErr || !children || !children.length) break;
    const shaped = children.map(shapeRow);
    replyShaped.push(...shaped);
    frontierIds = shaped.map(c => c.id);
  }

  await attachHearts([...rootShaped, ...replyShaped], currentUserId);
  const tree = buildTree(rootShaped, replyShaped);

  const totalRoots = count ?? (offset + roots.length);
  return { items: tree, hasMore: offset + roots.length < totalRoots, nextOffset: offset + roots.length, totalRoots, error: null };
}

// ── Schnelle Zaehlung (RPC, kein Volltransfer) — fuer Feed-/Preview-Badges
export async function countComments(postId, postType) {
  const { data, error } = await supabase.rpc("count_comments", { p_post_id: postId, p_post_type: postType });
  if (isMissingTableError(error)) return 0;
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}

// ── Kommentar/Antwort erstellen ───────────────────────────────────────
export async function createComment({ postId, postType, userId, text, parentCommentId = null, parentAuthorId = null, postAuthorId = null, senderName = null }) {
  const { data, error } = await supabase.from(TABLE).insert({
    post_id: postId, post_type: postType, user_id: userId, text, parent_comment_id: parentCommentId,
  }).select().single();
  if (error) return { data: null, error };

  // Benachrichtigung: bei Antwort geht sie an den Autor des Eltern-Kommentars,
  // sonst an den Autor des Beitrags. Nie an sich selbst. Best-effort (.catch),
  // Kommentar-Erstellung darf nie an einer fehlschlagenden Notification scheitern.
  const recipientId = parentCommentId ? parentAuthorId : postAuthorId;
  if (recipientId && recipientId !== userId) {
    const type = parentCommentId ? "comment_reply" : "comment";
    const body = text.length > 140 ? `${text.slice(0, 137)}…` : text;
    supabase.from("notifications").insert({
      user_id: recipientId, type,
      title: parentCommentId ? `${senderName || "Jemand"} hat auf deinen Kommentar geantwortet` : `${senderName || "Jemand"} hat kommentiert`,
      body, is_read: false, actor_id: userId,
      metadata: { post_id: postId, post_type: postType, comment_id: data.id },
      created_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {});
  }

  return { data: shapeRow(data), error: null };
}

export async function updateComment(commentId, text) {
  const { error } = await supabase.from(TABLE).update({ text, updated_at: new Date().toISOString() }).eq("id", commentId);
  return { error };
}

// Soft-Delete (siehe Migration 073 + MERKEN.3-Lehre: DELETE-Realtime-Events
// liefern per RLS nur die id im payload.old -- ein UPDATE liefert vollen Row-State).
export async function deleteComment(commentId) {
  const { error } = await supabase.from(TABLE).update({ deleted_at: new Date().toISOString(), text: "" }).eq("id", commentId);
  return { error };
}

export async function toggleCommentHeart(commentId, userId, currentlyHearted) {
  if (currentlyHearted) {
    const { error } = await supabase.from("comment_hearts").delete().eq("comment_id", commentId).eq("user_id", userId);
    return { error };
  }
  const { error } = await supabase.from("comment_hearts").insert({ comment_id: commentId, user_id: userId });
  return { error };
}

export async function reportComment(commentId, userId, reason) {
  const { error } = await supabase.from("comment_reports").insert({ comment_id: commentId, reporter_id: userId, reason });
  return { error };
}

// ── Realtime — Dedup-Pattern (Standing-Regel: Topic-Pruefung vor Subscribe,
//    Callbacks VOR .subscribe() registrieren, removeChannel() beim Cleanup) ──
export function subscribeComments(postId, postType, { onInsert, onUpdate, onDelete } = {}) {
  const topic = `post_comments:${postType}:${postId}`;
  const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
  let ch = existing;
  let createdHere = false;
  if (!existing) {
    ch = supabase.channel(topic)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLE, filter: `post_id=eq.${postId}` },
        (payload) => { if (payload.new?.post_type === postType) onInsert?.(payload.new); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLE, filter: `post_id=eq.${postId}` },
        (payload) => { if (payload.new?.post_type === postType) onUpdate?.(payload.new); })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: TABLE, filter: `post_id=eq.${postId}` },
        (payload) => onDelete?.(payload.old))
      .subscribe();
    createdHere = true;
  }
  return () => { if (createdHere) supabase.removeChannel(ch); };
}
