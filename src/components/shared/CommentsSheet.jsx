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
import { HUISendenIcon } from '../../design/icons/HuiSystemIcons.jsx';
import { HUIHeartIcon, HUIChatIcon } from '../../design/icons/HuiInteractionIcons.jsx';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { toast } from "../../lib/useToast.jsx";
import { haptic } from "../../components/commerce/commerceUtils.js";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import {
  getComments, createComment, updateComment, deleteComment,
  toggleCommentHeart, reportComment, subscribeComments,
} from "../../lib/commentsService.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

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
  .cs-overlay { animation: cs-overlay-in 0ms ease; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cs-sheet   { animation: cs-sheet-in 0ms cubic-bezier(.22,1,.36,1); }
  .cs-pop     { animation: cs-pop 260ms cubic-bezier(.22,1,.36,1); }
  .cs-btn { cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    border:none; background:none; font-family:inherit; transition:opacity .14s, transform .14s; }
  .cs-btn:active { opacity:.6; transform:scale(0.96); }
  .cs-textarea::placeholder { color: rgba(26,26,46,0.38); }
  .cs-emoji-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:2px; }
  .cs-emoji-btn { font-size:22px; padding:5px 3px; border:none; background:none; cursor:pointer; border-radius:8px; text-align:center; transition:background .12s; line-height:1; }
  .cs-emoji-btn:hover { background:rgba(13,196,181,0.12); }
  .cs-emoji-picker { position:absolute; bottom:62px; left:0; right:0; background:#fff; border-top:1px solid rgba(26,26,46,0.08); padding:10px 12px 8px; box-shadow:0 -4px 20px rgba(26,26,46,0.12); max-height:210px; overflow-y:auto; animation:cs-overlay-in 150ms ease; z-index:2; }
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
// ── CommentMenuPortal ─────────────────────────────────────────────────────
// Rendert das ••• Dropdown direkt auf document.body via Portal,
// damit Sheet-Overflow/clip-path den Dropdown nicht versteckt.
function CommentMenuPortal({ isOwn, menuOpen, setMenuOpen, confirmDelete, setConfirmDelete,
    reportMenu, setReportMenu, onEdit, onDelete, onReport, T }) {
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top:0, right:0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Dropdown OBEN-LINKS vom Button anzeigen
      setPos({ bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
    }
    setMenuOpen(v => !v);
  };

  // Außerhalb klicken schließt Menü — ABER nicht wenn ins Dropdown selbst geklickt wird
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      // Prüfe BOTH: Button UND Dropdown-Portal
      const inBtn = btnRef.current && btnRef.current.contains(e.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!inBtn && !inDropdown) {
        setMenuOpen(false);
        setConfirmDelete(false);
        setReportMenu(false);
      }
    };
    // mouseup statt mousedown — feuert NACH dem Button-Click, nicht davor
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, [menuOpen, setMenuOpen, setConfirmDelete, setReportMenu]);

  return (
    <>
      <button
        ref={btnRef}
        className="cs-btn"
        onClick={handleOpen}
        style={{ display:"flex", alignItems:"center", justifyContent:"center",
          gap:3, padding:"6px 8px", borderRadius:20,
          background: menuOpen ? "rgba(26,26,46,0.08)" : "transparent" }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:4, height:4, borderRadius:"50%",
            background:"rgba(26,26,46,0.45)", display:"block" }}/>
        ))}
      </button>

      {menuOpen && createPortal(
        <div ref={dropdownRef} style={{ position:"fixed", bottom: pos.bottom, right: pos.right,
          background:"#fff", borderRadius:10,
          boxShadow:"0 4px 16px rgba(26,26,46,0.18)",
          overflow:"hidden", zIndex:99999, minWidth:140 }}>
          {isOwn ? (
            <>
              <button className="cs-btn" onClick={onEdit}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 14px", fontSize:13, fontWeight:600, color:"#1A1A2E",
                  borderBottom:"1px solid rgba(26,26,46,0.08)", background:"none", cursor:"pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Bearbeiten
              </button>
              {!confirmDelete ? (
                <button className="cs-btn" onClick={() => setConfirmDelete(true)}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"10px 14px", fontSize:13, fontWeight:600, color:"#E53E3E",
                    background:"none", cursor:"pointer", textAlign:"left" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Löschen
                </button>
              ) : (
                <div style={{ padding:"10px 14px" }}>
                  <p style={{ fontSize:12, color:"#666", margin:"0 0 8px" }}>Kommentar wirklich löschen?</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="cs-btn" onClick={onDelete}
                      style={{ flex:1, padding:"7px 0", fontSize:12, fontWeight:700, color:"#fff",
                        background:"#E53E3E", borderRadius:8, cursor:"pointer" }}>
                      Löschen
                    </button>
                    <button className="cs-btn" onClick={() => setConfirmDelete(false)}
                      style={{ flex:1, padding:"7px 0", fontSize:12, fontWeight:600, color:"#666",
                        background:"#f5f5f5", borderRadius:8, cursor:"pointer" }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            !reportMenu ? (
              <button className="cs-btn" onClick={() => setReportMenu(true)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 14px", fontSize:13, fontWeight:600, color:"#1A1A2E",
                  background:"none", cursor:"pointer" }}>
                🚩 Melden
              </button>
            ) : REPORT_REASONS.map(r => (
              <button key={r.key} className="cs-btn" onClick={() => onReport(r.key)}
                style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
                  padding:"10px 14px", fontSize:13, fontWeight:500, color:"#1A1A2E",
                  borderBottom:"1px solid rgba(26,26,46,0.05)", background:"none", cursor:"pointer" }}>
                {r.label}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function CommentRow({ comment, depth, currentUserId, isAdmin, onReply, onSaveEdit, onDelete, onHeart, onReport, replyTargetId, onCancelReply, onSubmitReply, replyText, setReplyText, submittingReply }) {
  const { openCreatorProfile } = useProfileLauncher();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMenu, setReportMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isOwn = currentUserId && comment.user_id === currentUserId;
  const authorName = comment._author?.display_name || comment._author?.username || "HUI-Mitglied";

  // HINWEIS (COMMENTS-NO-PLACEHOLDER-Fix 2026-08-05): Gelöschte Kommentare
  // erreichen diese Komponente ueberhaupt nicht mehr -- buildTree()
  // (commentsService.js) filtert sie serverseitig aus dem Baum heraus und
  // haengt noch lebende Antworten beim naechsten sichtbaren Vorfahren ein.
  // Kein "Kommentar gelöscht"-Platzhalter mehr.

  return (
    <div style={{ marginLeft: depth * 26, padding:"10px 0" }} className={comment._justAdded ? "cs-pop" : ""}>
      <div style={{ display:"flex", gap:10 }}>
        <button
          onClick={() => { if (comment.user_id && comment.user_id !== currentUserId) openCreatorProfile(comment.user_id); }}
          style={{ background:"none", border:"none", padding:0, flexShrink:0,
            cursor: comment.user_id !== currentUserId ? "pointer" : "default",
            WebkitTapHighlightColor:"transparent" }}
        >
          <Avatar url={comment._author?.avatar_url} name={authorName} size={34} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button
              onClick={() => { if (comment.user_id && comment.user_id !== currentUserId) openCreatorProfile(comment.user_id); }}
              style={{ background:"none", border:"none", padding:0,
                cursor: comment.user_id !== currentUserId ? "pointer" : "default",
                fontSize:13, fontWeight:700, color:T.ink, WebkitTapHighlightColor:"transparent" }}
            >{authorName}</button>
            <span style={{ fontSize:11, color:T.inkFaint }}>{fmtTime(comment.created_at)}</span>
            {comment.is_edited && <span style={{ fontSize:11, color:T.inkFaint }}>· bearbeitet</span>}
          </div>

          {editing ? (
            <div style={{ marginTop:6 }}>
              <textarea
                autoFocus
                value={editText}
                onChange={e=>setEditText(e.target.value)}
                rows={Math.max(2, (editText.match(/\n/g)||[]).length + 1)}
                className="cs-textarea"
                onFocus={e => { const v = e.target; v.selectionStart = v.selectionEnd = v.value.length; }}
                style={{ width:"100%", border:`1px solid ${T.teal}`, borderRadius:12, padding:"8px 10px",
                  fontSize:14, fontFamily:"inherit", color:T.ink, resize:"none", boxSizing:"border-box",
                  outline:"none", boxShadow:`0 0 0 2px ${T.teal}22` }}
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
                <HUIHeartIcon size={15} active={comment.hearted_by_me} style={{color: comment.hearted_by_me ? T.coral : T.inkFaint}} />
                {comment.heart_count > 0 && <span style={{ fontSize:12, color: comment.hearted_by_me ? T.coral : T.inkFaint, fontWeight:600 }}>{comment.heart_count}</span>}
              </button>
              <button className="cs-btn" onClick={() => onReply(comment)} style={{ fontSize:12, fontWeight:700, color:T.inkFaint }}>Antworten</button>
              {/* ••• Button + Portal-Dropdown */}
              <div style={{ marginLeft:"auto" }}>
                <CommentMenuPortal
                  isOwn={isOwn}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  confirmDelete={confirmDelete}
                  setConfirmDelete={setConfirmDelete}
                  reportMenu={reportMenu}
                  setReportMenu={setReportMenu}
                  onEdit={() => { setEditing(true); setMenuOpen(false); }}
                  onDelete={() => { onDelete(comment.id); setMenuOpen(false); }}
                  onReport={(reason) => { onReport(comment.id, reason); setMenuOpen(false); setReportMenu(false); }}
                  T={T}
                />
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

export default function CommentsSheet({ open, onClose, postId, postType, postAuthorId, postActionUrl, highlightCommentId, mediaUrl = null, mediaType = null, postTitle = null }) {
  const { user, profile } = useAuth();
  // Back-Button Registration
  useModalRegistration(open, onClose, "CommentsSheet");
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
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
    // Sofort anzeigen (ohne Autor-Info) — der Nutzer sieht die Kommentare instant
    const undecorated = res.items;
    setItems(prev => reset ? undecorated : [...undecorated, ...prev]);
    setHasMore(res.hasMore);
    setOffset(res.nextOffset);
    setTotal(res.visibleTotal ?? res.totalRoots ?? 0);
    setLoading(false);
    // Autor-Profile im Hintergrund nachladen und items patchen
    if (undecorated.length) {
      decorateAuthors(undecorated).then(decorated => {
        setItems(prev => {
          if (reset) return decorated;
          // Bei "Mehr laden": neue Items vorne einfügen, alte behalten
          return [...decorated, ...prev.slice(undecorated.length)];
        });
      }).catch(() => {});
    }
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
        if (row.deleted_at) {
          // COMMENTS-NO-PLACEHOLDER-Fix: bei Soft-Delete durch einen anderen
          // Client den Kommentar komplett entfernen (kein Platzhalter) --
          // noch lebende Antworten werden beim Elternknoten "hochgereicht",
          // damit sie nicht mitverschwinden.
          const removeAndReparent = (list) => {
            const out = [];
            for (const c of list) {
              if (c.id === row.id) {
                out.push(...removeAndReparent(c.replies || []));
              } else {
                out.push({ ...c, replies: removeAndReparent(c.replies || []) });
              }
            }
            return out;
          };
          setItems(prev => removeAndReparent(prev));
          setTotal(t => row.parent_comment_id ? t : Math.max(0, t - 1));
          return;
        }
        const patch = (list) => list.map(c => c.id === row.id
          ? { ...c, text: row.text, is_edited: !!row.updated_at }
          : { ...c, replies: patch(c.replies || []) });
        setItems(prev => patch(prev));
      },
      onDelete: (row) => {
        // DELETE-Events liefern per RLS nur die id (siehe MERKEN.3-Lehre) --
        // wir nutzen ausschliesslich Soft-Delete (UPDATE), physisches DELETE
        // kommt hier praktisch nicht vor; defensiv trotzdem behandelt (komplett
        // entfernen, kein Platzhalter, Antworten hochreichen).
        const removeAndReparent = (list) => {
          const out = [];
          for (const c of list) {
            if (c.id === row.id) {
              out.push(...removeAndReparent(c.replies || []));
            } else {
              out.push({ ...c, replies: removeAndReparent(c.replies || []) });
            }
          }
          return out;
        };
        setItems(prev => removeAndReparent(prev));
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
      senderName: profile?.display_name || profile?.username, postActionUrl, postTitle,
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
      parentAuthorId, senderName: profile?.display_name || profile?.username, postActionUrl, postTitle,
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
    // Optimistisch: sofort aus Liste entfernen (bessere UX als Placeholder)
    const remove = (list) => list
      .filter(c => c.id !== commentId)
      .map(c => ({ ...c, replies: remove(c.replies || []) }));
    setItems(prev => remove(prev));
    haptic("light");
    const { error } = await deleteComment(commentId);
    if (error) {
      toast.error("Kommentar konnte nicht gelöscht werden.");
      // Reload bei Fehler
      // (kein Rollback nötig — deleteComment ist idempotent)
    }
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

  return createPortal(
    <div
      onClick={e => e.stopPropagation()}
      style={{ position:"fixed", inset:0, zIndex:10500 }}
    >
      <style>{CSS}</style>
      <div className="cs-overlay" onClick={onClose} style={{
        position:"absolute", inset:0, background:T.overlay,
      }}/>
      <div className="cs-sheet" style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"86vh",
        background:"rgba(252,253,252,0.96)",
        borderTopLeftRadius:28, borderTopRightRadius:28,
        boxShadow:"0 -12px 48px rgba(26,26,46,0.22)",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Grabber */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:10 }}>
          <div style={{ width:40, height:4, borderRadius:99, background:"rgba(26,26,46,0.16)" }}/>
        </div>

        {/* Media Preview — Bild oder Video oben */}
        {mediaUrl && (
          <div style={{
            margin:"10px 16px 0", borderRadius:16, overflow:"hidden",
            maxHeight:220, position:"relative", flexShrink:0,
            background:"rgba(26,26,46,0.06)",
          }}>
            {(mediaType === "video" || /\.mp4|\.webm|\.mov/i.test(mediaUrl)) ? (
              <video
                src={mediaUrl} style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block" }}
                autoPlay muted loop playsInline
              />
            ) : (
              <img
                src={mediaUrl} alt=""
                style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block" }}
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 10px" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:T.ink, display:"flex", alignItems:"center", gap:6 }}><HUIChatIcon size={17}/>Kommentare</div>
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
              <div style={{ marginBottom:10, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIChatIcon size={34}/></div>
              <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>Noch keine Kommentare.</div>
              <div style={{ fontSize:13, color:T.inkFaint, marginTop:4 }}>Sei der Erste und teile deine Gedanken.</div>
            </div>
          )}

          {loading && items.length === 0 && !migrationPending && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", gap:12 }}>
              <div style={{
                width:28, height:28, borderRadius:"50%",
                border:"3px solid rgba(13,196,181,0.15)",
                borderTopColor:"#0DC4B5",
                animation:"spin 0.7s linear infinite",
              }}/>
              <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)", fontWeight:600 }}>Kommentare werden geladen …</div>
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
        <div style={{ position:"relative" }}>
          {showEmojiPicker && (
            <div className="cs-emoji-picker">
              <div style={{ fontSize:11, fontWeight:700, color:T.inkFaint, marginBottom:6, letterSpacing:.5 }}>EMOJIS</div>
              <div className="cs-emoji-grid">
                {["😊","😂","🥰","😍","🤩","😎","🥳","🙌","👍","❤️","🔥","✨","💫","🌟","💡","🎉","🎊","🙏","💬","💭","🌿","🌱","💚","💙","💜","🤝","👏","🫶","😅","😇","🤔","💪","🦋","🌸","🌺","🍀","☀️","🌙","⭐","🎯","🎨","📚","💎","🚀","🌈","🎵","🎶","✅","🔑","🌍"].map(e => (
                  <button key={e} className="cs-emoji-btn" onClick={() => {
                    const ta = inputRef.current;
                    if (ta) {
                      const start = ta.selectionStart ?? input.length;
                      const end = ta.selectionEnd ?? input.length;
                      const newVal = input.slice(0, start) + e + input.slice(end);
                      setInput(newVal);
                      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + e.length; }, 0);
                    } else { setInput(v => v + e); }
                  }}>{e}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{
            display:"flex", gap:8, alignItems:"flex-end", padding:"10px 16px",
            paddingBottom:"max(12px, env(safe-area-inset-bottom))",
            borderTop:`1px solid ${T.border}`, background:"rgba(252,253,252,0.98)",
          }}>
            <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={32} />
            <button
              className="cs-btn"
              onClick={() => setShowEmojiPicker(v => !v)}
              style={{ fontSize:20, lineHeight:1, padding:"6px 2px", flexShrink:0, opacity: showEmojiPicker ? 1 : 0.55 }}
            >😊</button>
            <textarea
              ref={inputRef}
              value={input} onChange={e=>setInput(e.target.value)} rows={1}
              className="cs-textarea"
              placeholder="Teile deine Gedanken …"
              style={{
                flex:1, border:`1px solid ${T.border}`, borderRadius:18, padding:"9px 14px",
                fontSize:14, fontFamily:"inherit", color:T.ink, resize:"none", boxSizing:"border-box",
                maxHeight:100, background:"#fff",
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setShowEmojiPicker(false); handleSubmit(); } }}
              onFocus={() => setShowEmojiPicker(false)}
            />
            <button className="cs-btn" disabled={!input.trim() || submitting} onClick={() => { setShowEmojiPicker(false); handleSubmit(); }}
              style={{
                width:36, height:36, borderRadius:"50%", flexShrink:0,
                background: input.trim() ? T.teal : "rgba(26,26,46,0.08)",
                color: input.trim() ? "#fff" : T.inkFaint,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
              <HUISendenIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
