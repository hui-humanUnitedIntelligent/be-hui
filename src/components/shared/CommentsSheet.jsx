// src/components/shared/CommentsSheet.jsx — KOMMENTAR.1 (2026-07-09)
// ══════════════════════════════════════════════════════════════════
// EIN Kommentar-Bottom-Sheet für ALLE Content-Typen (Werke, Erlebnisse,
// Beiträge, Veranstaltungen, Projekte, Empfehlungen, Wirker, Verbindungen)
// -- geöffnet aus ContentPreviewSheet.jsx / PostFullscreenView.jsx heraus,
// niemals als eigene, parallele Implementierung pro Typ.
//
// HUI-Philosophie: Kommentare dienen Resonanz und Wertschätzung, nicht
// Reichweite -- ruhige, warme Gestaltung, kein Social-Media-Lärm.
//
// Wiederverwendet bewusst:
//   - T-Farbtokens (teal/coral/ink) 1:1 aus ContentPreviewSheet.jsx
//   - Overlay/Sheet-Animationsmuster 1:1 aus ContentPreviewSheet.jsx
//   - toast aus useToast.jsx, haptic aus commerceUtils.js
//   - Realtime-Dedup-Pattern aus useReactions.jsx (via commentsService.js)
// ══════════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { toast } from "../../lib/useToast.jsx";
import { haptic } from "../../components/commerce/commerceUtils.js";
import {
  getComments, createComment, updateComment, deleteComment,
  toggleCommentHeart, reportComment, subscribeComments,
} from "../../lib/commentsService.js";

const T = {
  ink: "#1A1A2E", inkSoft: "rgba(26,26,46,0.60)", inkFaint: "rgba(26,26,46,0.38)",
  teal: "#0DC4B5", coral: "#F47355", border: "rgba(26,26,46,0.08)",
  sheet: "#FCFDFC", overlay: "rgba(20,24,22,0.46)", card: "rgba(26,26,46,0.035)",
};

const REPORT_REASONS = [
  { key: "spam", label: "Spam" },
  { key: "beleidigung", label: "Beleidigung" },
  { key: "unangemessen", label: "Unangemessen" },
];

const CSS = `
  @keyframes cs-overlay-in { from{opacity:0} to{opacity:1} }
  @keyframes cs-sheet-in   { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes cs-pop        { 0%{transform:scale(.92);opacity:0} 100%{transform:scale(1);opacity:1} }
  .cs-overlay { animation: cs-overlay-in 200ms ease; }
  .cs-sheet   { animation: cs-sheet-in 240ms cubic-bezier(.22,1,.36,1); }
  .cs-pop     { animation: cs-pop 260ms cubic-bezier(.22,1,.36,1); }
  .cs-btn { cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    border:none; background:none; font-family:inherit; transition:opacity .14s, transform .14s; }
  .cs-btn:active { opacity:.6; transform:scale(0.96); }
  .cs-textarea::placeholder { color: rgba(26,26,46,0.38); }
`;

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1)  return "gerade eben";
  if (diff < 60) return `vor ${diff} Min`;
  const h = Math.floor(diff / 60);
  if (h < 24)   return `vor ${h} Std`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();
}

function Avatar({ url, name, size = 34 }) {
  return url ? (
    <img loading="lazy" decoding="async" src={url} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
  ) : (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:"rgba(13,196,181,0.14)", color:T.teal,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800,
    }}>{initials(name)}</div>
  );
}

// ── Ein Kommentar (+ rekursiv seine Antworten) ────────────────────────
function CommentRow({ comment, depth, currentUserId, isAdmin, onReply, onSaveEdit, onDelete, onHeart, onReport, replyTargetId, onCancelReply, onSubmitReply, replyText, setReplyText, submittingReply }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMenu, setReportMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isOwn = currentUserId && comment.user_id === currentUserId;
  const authorName = comment._author?.display_name || comment._author?.username || "HUI-Mitglied";

  if (comment.is_deleted) {
    return (
      <div style={{ marginLeft: depth * 26, padding:"8px 0" }}>
        <div style={{ display:"flex", gap:10 }}>
          <Avatar url={null} name="—" size={30} />
          <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", paddingTop:6 }}>Kommentar gelöscht</div>
        </div>
        {comment.replies?.map(r => (
          <CommentRow key={r.id} comment={r} depth={depth+1} currentUserId={currentUserId} isAdmin={isAdmin}
            onReply={onReply} onSaveEdit={onSaveEdit} onDelete={onDelete} onHeart={onHeart} onReport={onReport}
            replyTargetId={replyTargetId} onCancelReply={onCancelReply} onSubmitReply={onSubmitReply}
            replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth * 26, padding:"10px 0" }} className={comment._justAdded ? "cs-pop" : ""}>
      <div style={{ display:"flex", gap:10 }}>
        <Avatar url={comment._author?.avatar_url} name={authorName} size={34} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>{authorName}</span>
            <span style={{ fontSize:11, color:T.inkFaint }}>{fmtTime(comment.created_at)}</span>
            {comment.is_edited && <span style={{ fontSize:11, color:T.inkFaint }}>· bearbeitet</span>}
          </div>

          {editing ? (
            <div style={{ marginTop:6 }}>
              <textarea
                value={editText} onChange={e=>setEditText(e.target.value)} rows={2}
                className="cs-textarea"
                style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:12, padding:"8px 10px",
                  fontSize:14, fontFamily:"inherit", color:T.ink, resize:"none", boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button className="cs-btn" onClick={() => { onSaveEdit(comment.id, editText); setEditing(false); }}
                  style={{ fontSize:12, fontWeight:700, color:T.teal }}>Speichern</button>
                <button className="cs-btn" onClick={() => { setEditing(false); setEditText(comment.text); }}
                  style={{ fontSize:12, fontWeight:600, color:T.inkFaint }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:14, color:T.ink, lineHeight:1.5, marginTop:2, wordBreak:"break-word", whiteSpace:"pre-wrap" }}>
              {comment.text}
            </div>
          )}

          {!editing && (
            <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:6 }}>
              <button className="cs-btn" onClick={() => onHeart(comment)} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill={comment.hearted_by_me ? T.coral : "none"} stroke={comment.hearted_by_me ? T.coral : T.inkFaint} strokeWidth="2">
                  <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.8 5.5 4c2-.4 4 .5 5 2.2C11.5 4.5 13.5 3.6 15.5 4c3.5.8 5 4.4 3.5 7.8C19.5 16.4 12 21 12 21z" strokeLinejoin="round"/>
                </svg>
                {comment.heart_count > 0 && <span style={{ fontSize:12, color: comment.hearted_by_me ? T.coral : T.inkFaint, fontWeight:600 }}>{comment.heart_count}</span>}
              </button>
              <button className="cs-btn" onClick={() => onReply(comment)} style={{ fontSize:12, fontWeight:700, color:T.inkFaint }}>Antworten</button>
              <div style={{ position:"relative", marginLeft:"auto" }}>
                <button className="cs-btn" onClick={() => setMenuOpen(v=>!v)} style={{ fontSize:16, color:T.inkFaint, padding:"0 4px" }}>•••</button>
                {menuOpen && (
                  <div style={{ position:"absolute", right:0, top:22, background:T.sheet, border:`1px solid ${T.border}`,
                    borderRadius:12, boxShadow:"0 8px 24px rgba(26,26,46,0.14)", overflow:"hidden", zIndex:5, minWidth:150 }}>
                    {isOwn ? (
                      <>
                        <button className="cs-btn" onClick={() => { setEditing(true); setMenuOpen(false); }}
                          style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, color:T.ink }}>Bearbeiten</button>
                        {!confirmDelete ? (
                          <button className="cs-btn" onClick={() => setConfirmDelete(true)}
                            style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, color:T.coral }}>Löschen</button>
                        ) : (
                          <button className="cs-btn" onClick={() => { onDelete(comment.id); setMenuOpen(false); }}
                            style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, fontWeight:700, color:T.coral }}>Wirklich löschen?</button>
                        )}
                      </>
                    ) : (
                      !reportMenu ? (
                        <button className="cs-btn" onClick={() => setReportMenu(true)}
                          style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, color:T.ink }}>Melden</button>
                      ) : REPORT_REASONS.map(r => (
                        <button key={r.key} className="cs-btn" onClick={() => { onReport(comment.id, r.key); setMenuOpen(false); setReportMenu(false); }}
                          style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, color:T.ink }}>{r.label}</button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {replyTargetId === comment.id && (
            <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"flex-end" }}>
              <textarea
                autoFocus value={replyText} onChange={e=>setReplyText(e.target.value)} rows={1}
                className="cs-textarea" placeholder={`Antwort an ${authorName} …`}
                style={{ flex:1, border:`1px solid ${T.border}`, borderRadius:14, padding:"8px 12px",
                  fontSize:13, fontFamily:"inherit", color:T.ink, resize:"none", boxSizing:"border-box" }}
              />
              <button className="cs-btn" disabled={!replyText.trim() || submittingReply} onClick={onSubmitReply}
                style={{ fontSize:12, fontWeight:700, color: replyText.trim() ? T.teal : T.inkFaint, padding:"8px 4px" }}>Senden</button>
              <button className="cs-btn" onClick={onCancelReply} style={{ fontSize:12, color:T.inkFaint, padding:"8px 4px" }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map(r => (
        <CommentRow key={r.id} comment={r} depth={depth+1} currentUserId={currentUserId} isAdmin={isAdmin}
          onReply={onReply} onSaveEdit={onSaveEdit} onDelete={onDelete} onHeart={onHeart} onReport={onReport}
          replyTargetId={replyTargetId} onCancelReply={onCancelReply} onSubmitReply={onSubmitReply}
          replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} />
      ))}
    </div>
  );
}

export default function CommentsSheet({ open, onClose, postId, postType, postAuthorId, postActionUrl, highlightCommentId }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [migrationPending, setMigrationPending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const authorCache = useRef(new Map());

  const decorateAuthors = useCallback(async (rows) => {
    const flatten = (list) => list.flatMap(c => [c, ...flatten(c.replies || [])]);
    const flat = flatten(rows);
    const ids = [...new Set(flat.map(c => c.user_id))].filter(id => !authorCache.current.has(id));
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id", ids);
      (data || []).forEach(p => authorCache.current.set(p.id, p));
    }
    const attach = (list) => list.map(c => ({ ...c, _author: authorCache.current.get(c.user_id) || null, replies: attach(c.replies || []) }));
    return attach(rows);
  }, []);

  const load = useCallback(async (reset = true) => {
    setLoading(true);
    const nextOffset = reset ? 0 : offset;
    const res = await getComments(postId, postType, { offset: nextOffset, limit: 20, currentUserId: user?.id });
    if (res.error === "MIGRATION_PENDING") { setMigrationPending(true); setLoading(false); return; }
    const decorated = await decorateAuthors(res.items);
    setItems(prev => reset ? decorated : [...decorated, ...prev]); // aeltere Seite wird oben angehaengt
    setHasMore(res.hasMore);
    setOffset(res.nextOffset);
    setTotal(res.totalRoots || 0);
    setLoading(false);
  }, [postId, postType, user?.id, offset, decorateAuthors]);

  useEffect(() => {
    if (!open || !postId) return;
    setItems([]); setOffset(0); setMigrationPending(false);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId, postType]);

  // ── Realtime: neue/aktualisierte/geloeschte Kommentare anderer Clients ──
  useEffect(() => {
    if (!open || !postId) return;
    const unsubscribe = subscribeComments(postId, postType, {
      onInsert: async (row) => {
        if (row.user_id === user?.id) return; // eigene bereits optimistisch drin
        const [decorated] = await decorateAuthors([{ ...row, is_deleted:false, is_edited:false, heart_count:0, hearted_by_me:false, replies:[] }]);
        setItems(prev => {
          if (!row.parent_comment_id) {
            setTotal(t => t + 1);
            return [...prev, decorated];
          }
          const insert = (list) => list.map(c => c.id === row.parent_comment_id
            ? { ...c, replies: [...c.replies, decorated] }
            : { ...c, replies: insert(c.replies || []) });
          return insert(prev);
        });
      },
      onUpdate: (row) => {
        const patch = (list) => list.map(c => c.id === row.id
          ? { ...c, text: row.text, is_deleted: !!row.deleted_at, is_edited: !!row.updated_at }
          : { ...c, replies: patch(c.replies || []) });
        setItems(prev => patch(prev));
      },
      onDelete: (row) => {
        // DELETE-Events liefern per RLS nur die id (siehe MERKEN.3-Lehre) --
        // wir nutzen ausschliesslich Soft-Delete (UPDATE), physisches DELETE
        // kommt hier praktisch nicht vor; defensiv trotzdem behandelt.
        const patch = (list) => list.map(c => c.id === row.id ? { ...c, is_deleted:true, text:"" } : { ...c, replies: patch(c.replies || []) });
        setItems(prev => patch(prev));
      },
    });
    return unsubscribe;
  }, [open, postId, postType, user?.id, decorateAuthors]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || !user?.id) return;
    setSubmitting(true);
    haptic("light");
    const optimistic = {
      id: `tmp_${Date.now()}`, post_id: postId, post_type: postType, user_id: user.id,
      parent_comment_id: null, text, created_at: new Date().toISOString(),
      is_deleted:false, is_edited:false, heart_count:0, hearted_by_me:false, replies:[],
      _author: { id:user.id, display_name: profile?.display_name, username: profile?.username, avatar_url: profile?.avatar_url },
      _justAdded: true,
    };
    setItems(prev => [...prev, optimistic]);
    setTotal(t => t + 1);
    setInput("");
    const { data, error } = await createComment({
      postId, postType, userId: user.id, text, postAuthorId,
      senderName: profile?.display_name || profile?.username, postActionUrl,
    });
    setSubmitting(false);
    if (error || !data) {
      setItems(prev => prev.filter(c => c.id !== optimistic.id));
      setTotal(t => Math.max(0, t - 1));
      toast.error("Kommentar konnte nicht gesendet werden.");
      return;
    }
    setItems(prev => prev.map(c => c.id === optimistic.id ? { ...optimistic, id: data.id, created_at: data.created_at } : c));
  }, [input, user?.id, postId, postType, postAuthorId, postActionUrl, profile]);

  const handleReply = useCallback((comment) => { setReplyTargetId(comment.id); setReplyText(""); }, []);
  const handleCancelReply = useCallback(() => { setReplyTargetId(null); setReplyText(""); }, []);

  const handleSubmitReply = useCallback(async () => {
    const text = replyText.trim();
    if (!text || !user?.id || !replyTargetId) return;
    setSubmittingReply(true);
    haptic("light");
    const parentId = replyTargetId;

    let parentAuthorId = null;
    const findParent = (list) => { for (const c of list) { if (c.id === parentId) return c; const f = findParent(c.replies||[]); if (f) return f; } return null; };
    const parent = findParent(items);
    parentAuthorId = parent?.user_id || null;

    const optimistic = {
      id: `tmp_${Date.now()}`, post_id: postId, post_type: postType, user_id: user.id,
      parent_comment_id: parentId, text, created_at: new Date().toISOString(),
      is_deleted:false, is_edited:false, heart_count:0, hearted_by_me:false, replies:[],
      _author: { id:user.id, display_name: profile?.display_name, username: profile?.username, avatar_url: profile?.avatar_url },
      _justAdded: true,
    };
    const insertOptim = (list) => list.map(c => c.id === parentId ? { ...c, replies:[...c.replies, optimistic] } : { ...c, replies: insertOptim(c.replies||[]) });
    setItems(prev => insertOptim(prev));
    setReplyTargetId(null); setReplyText("");

    const { data, error } = await createComment({
      postId, postType, userId: user.id, text, parentCommentId: parentId,
      parentAuthorId, senderName: profile?.display_name || profile?.username, postActionUrl,
    });
    setSubmittingReply(false);
    if (error || !data) {
      const removeOptim = (list) => list.map(c => ({ ...c, replies: (c.replies||[]).filter(r => r.id !== optimistic.id).map(r => r) })).map(c => ({ ...c, replies: removeOptim(c.replies||[]) }));
      setItems(prev => removeOptim(prev));
      toast.error("Antwort konnte nicht gesendet werden.");
      return;
    }
    const patchId = (list) => list.map(c => c.id === optimistic.id ? { ...optimistic, id: data.id, created_at: data.created_at } : { ...c, replies: patchId(c.replies||[]) });
    setItems(prev => patchId(prev));
  }, [replyText, replyTargetId, user?.id, postId, postType, postActionUrl, profile, items]);

  const handleSaveEdit = useCallback(async (commentId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const patch = (list) => list.map(c => c.id === commentId ? { ...c, text: trimmed, is_edited:true } : { ...c, replies: patch(c.replies||[]) });
    setItems(prev => patch(prev));
    const { error } = await updateComment(commentId, trimmed);
    if (error) toast.error("Änderung konnte nicht gespeichert werden.");
  }, []);

  const handleDelete = useCallback(async (commentId) => {
    const patch = (list) => list.map(c => c.id === commentId ? { ...c, is_deleted:true, text:"" } : { ...c, replies: patch(c.replies||[]) });
    setItems(prev => patch(prev));
    haptic("light");
    const { error } = await deleteComment(commentId);
    if (error) toast.error("Kommentar konnte nicht gelöscht werden.");
  }, []);

  const handleHeart = useCallback(async (comment) => {
    if (!user?.id) return;
    const willHeart = !comment.hearted_by_me;
    haptic("selection");
    const patch = (list) => list.map(c => c.id === comment.id
      ? { ...c, hearted_by_me: willHeart, heart_count: Math.max(0, c.heart_count + (willHeart?1:-1)) }
      : { ...c, replies: patch(c.replies||[]) });
    setItems(prev => patch(prev));
    const { error } = await toggleCommentHeart(comment.id, user.id, comment.hearted_by_me);
    if (error) setItems(prev => patch(prev)); // rollback (toggle zurueck)
  }, [user?.id]);

  const handleReport = useCallback(async (commentId, reason) => {
    if (!user?.id) return;
    const { error } = await reportComment(commentId, user.id, reason);
    error ? toast.error("Meldung nicht möglich.") : toast.success("Danke, wir prüfen das.");
  }, [user?.id]);

  if (!open) return null;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{ position:"fixed", inset:0, zIndex:20000 }}
    >
      <style>{CSS}</style>
      <div className="cs-overlay" onClick={onClose} style={{
        position:"absolute", inset:0, background:T.overlay, backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      }}/>
      <div className="cs-sheet" style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"86vh",
        background:"rgba(252,253,252,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderTopLeftRadius:28, borderTopRightRadius:28,
        boxShadow:"0 -12px 48px rgba(26,26,46,0.22)",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Grabber */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:10 }}>
          <div style={{ width:40, height:4, borderRadius:99, background:"rgba(26,26,46,0.16)" }}/>
        </div>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 10px" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>💬 Kommentare</div>
            <div style={{ fontSize:12, color:T.inkFaint, marginTop:2 }}>
              {total > 0 ? `${total} ${total === 1 ? "Kommentar" : "Kommentare"}` : "Noch keine Kommentare"}
            </div>
          </div>
          <button className="cs-btn" onClick={onClose} style={{ fontSize:20, color:T.inkFaint, padding:6 }}>✕</button>
        </div>

        {/* Liste */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px", WebkitOverflowScrolling:"touch" }}>
          {migrationPending && (
            <div style={{ textAlign:"center", padding:"30px 10px", color:T.inkFaint, fontSize:13 }}>
              Kommentare sind bald verfügbar — die Funktion wird gerade aktiviert.
            </div>
          )}

          {!migrationPending && hasMore && (
            <div style={{ textAlign:"center", padding:"6px 0 14px" }}>
              <button className="cs-btn" onClick={() => load(false)} disabled={loading}
                style={{ fontSize:12, fontWeight:700, color:T.teal }}>
                {loading ? "Lädt …" : "Mehr laden"}
              </button>
            </div>
          )}

          {!migrationPending && !loading && total === 0 && (
            <div style={{ textAlign:"center", padding:"48px 20px" }}>
              <div style={{ fontSize:34, marginBottom:10 }}>💬</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>Noch keine Kommentare.</div>
              <div style={{ fontSize:13, color:T.inkFaint, marginTop:4 }}>Sei der Erste und teile deine Gedanken.</div>
            </div>
          )}

          {items.map(c => (
            <CommentRow key={c.id} comment={c} depth={0} currentUserId={user?.id} isAdmin={profile?.role === "admin"}
              onReply={handleReply} onSaveEdit={handleSaveEdit} onDelete={handleDelete} onHeart={handleHeart} onReport={handleReport}
              replyTargetId={replyTargetId} onCancelReply={handleCancelReply} onSubmitReply={handleSubmitReply}
              replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} />
          ))}
          <div style={{ height:14 }}/>
        </div>

        {/* Eingabebereich — fixiert unten */}
        <div style={{
          display:"flex", gap:10, alignItems:"flex-end", padding:"10px 16px",
          paddingBottom:"max(12px, env(safe-area-inset-bottom))",
          borderTop:`1px solid ${T.border}`, background:"rgba(252,253,252,0.98)",
        }}>
          <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={32} />
          <textarea
            value={input} onChange={e=>setInput(e.target.value)} rows={1}
            className="cs-textarea"
            placeholder="Teile deine Gedanken oder gib wertschätzendes Feedback …"
            style={{
              flex:1, border:`1px solid ${T.border}`, borderRadius:18, padding:"9px 14px",
              fontSize:14, fontFamily:"inherit", color:T.ink, resize:"none", boxSizing:"border-box",
              maxHeight:100, background:"#fff",
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <button className="cs-btn" disabled={!input.trim() || submitting} onClick={handleSubmit}
            style={{
              width:36, height:36, borderRadius:"50%", flexShrink:0,
              background: input.trim() ? T.teal : "rgba(26,26,46,0.08)",
              color: input.trim() ? "#fff" : T.inkFaint,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
