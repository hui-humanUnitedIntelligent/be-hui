// chat-center/MessageBubble.jsx v3
// Media (Image/Video/Voice) + Bearbeiten/Löschen Modal
// Click auf Nachricht → Mini-Modal (Bearbeiten / Löschen)

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { HUI } from "../../design/hui.design.js";
import { useImageGallery } from "../../context/ImageGalleryContext.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatTimeDE } from "../../lib/formatters.js";

// ── Emoji-Reaktionsleiste (Long-Press) ──
const QUICK_EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "🙏", "👏", "💪"];

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, coral:HUI.COLOR.coral, ink:HUI.COLOR.ink };

const CSS = `
  @keyframes mb-in-own   { from{opacity:0;transform:translateX(8px) scale(0.98)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes mb-in-other { from{opacity:0;transform:translateX(-8px) scale(0.98)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes mb-typing   { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
  @keyframes mb-modal-in { from{opacity:0;transform:translateY(6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;

function formatTime(iso) {
  if (!iso) return "";
  return formatTimeDE(new Date(iso), {hour:"2-digit",minute:"2-digit"});
}

// ── Typing ──
export function TypingBubble() {
  return (
    <div style={{ display:"flex", justifyContent:"flex-start", padding:"2px 20px 10px", alignItems:"flex-end", gap:10 }}>
      <style>{CSS}</style>
      <div style={{
        padding:"14px 18px", background:"rgba(255,255,255,0.62)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        borderRadius:"20px 20px 20px 6px", border:"1px solid rgba(255,255,255,0.55)",
        boxShadow:"0 4px 16px rgba(0,0,0,0.07)", display:"flex", gap:5, alignItems:"center",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%", background:"rgba(22,215,197,0.45)",
            animation:"mb-typing 1.8s " + (i*0.28) + "s ease-in-out infinite",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── Action Modal (Bearbeiten / Löschen) ──
function MessageActionModal({ msg = {}, position = {}, onEdit = () => {}, onDelete = () => {}, onClose = () => {} }) {
  useModalRegistration(true, () => onClose?.(), "MessageActionModal");
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(msg.text || "");
  const own = msg.own === true;

  if (!own) {
    // Fremde Nachricht: nur schließen (keine Aktionen erlaubt)
    onClose();
    return null;
  }

  // Nicht bearbeitbar: gelöschte Nachrichten oder Media-only
  const canEdit = !msg.is_deleted && (msg.message_type === "text" || !msg.message_type);

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:10490,
        background:"rgba(0,0,0,0.08)",
      }}/>
      {/* Modal */}
      <div style={{
        position:"fixed", zIndex:10500,
        top: Math.min(position.y, window.innerHeight - 180),
        left: own
          ? Math.min(position.x - 160, window.innerWidth - 180)
          : Math.max(position.x - 10, 10),
        background:"rgba(255,255,255,0.96)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderRadius:16, padding:"6px 0",
        boxShadow:"0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        border:"1px solid rgba(0,0,0,0.07)",
        minWidth:170,
        animation:"mb-modal-in 0.18s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <style>{CSS}</style>

        {!editMode ? (
          <>
            {/* Bearbeiten — nur für Text */}
            {canEdit && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  width:"100%", padding:"11px 18px", border:"none",
                  background:"none", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:12,
                  fontSize:14, color:C.ink,
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Bearbeiten
              </button>
            )}

            {/* Divider */}
            {canEdit && (
              <div style={{ height:1, background:"rgba(0,0,0,0.06)", margin:"2px 0" }}/>
            )}

            {/* Löschen */}
            {!msg.is_deleted && (
              <button
                onClick={() => { onDelete?.(msg.id); onClose?.(); }}
                style={{
                  width:"100%", padding:"11px 18px", border:"none",
                  background:"none", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:12,
                  fontSize:14, color:"#FF4D4D",
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="3 6 5 6 21 6" stroke="#FF4D4D" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M19 6l-1 14H6L5 6" stroke="#FF4D4D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11v6M14 11v6" stroke="#FF4D4D" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M9 6V4h6v2" stroke="#FF4D4D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Löschen
              </button>
            )}
          </>
        ) : (
          /* Edit Mode */
          <div style={{ padding:"12px 14px" }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
              rows={3}
              style={{
                width:"100%", border:"1.5px solid rgba(22,215,197,0.35)",
                borderRadius:10, padding:"8px 12px",
                fontSize:14, color:C.ink, fontFamily:"inherit",
                resize:"none", outline:"none",
                background:"rgba(255,255,255,0.9)",
                boxSizing:"border-box",
              }}
            />
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button
                onClick={onClose}
                style={{
                  flex:1, padding:"9px", border:"1px solid rgba(0,0,0,0.10)",
                  borderRadius:9, background:"rgba(0,0,0,0.04)", cursor:"pointer",
                  fontSize:13, color:"rgba(80,80,80,0.8)",
                  WebkitTapHighlightColor:"transparent",
                }}
              >Abbrechen</button>
              <button
                onClick={() => { if (editText.trim()) { onEdit?.(msg.id, editText); onClose?.(); } }}
                style={{
                  flex:1, padding:"9px",
                  border:"none", borderRadius:9,
                  background:"linear-gradient(135deg," + C.teal + "," + C.teal2 + ")",
                  color:"white", cursor:"pointer", fontSize:13, fontWeight: 600,
                  WebkitTapHighlightColor:"transparent",
                }}
              >Speichern</button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// ── Media Content ──
// Bild im Chat — öffnet die zentrale ImageGallery statt window.open
function ImageThumb({ msg = {} }) {
  const { openGallery } = useImageGallery();
  return (
    <img
      src={msg.media_url} alt="Bild"
      style={{
        maxWidth:"100%", maxHeight:260, borderRadius:12,
        display:"block", objectFit:"cover",
        cursor:"pointer",
      }}
      onClick={() => openGallery(msg.media_url)}
      onLoad={() => window.dispatchEvent(new CustomEvent("hui:chat:media-loaded"))}
      onError={() => window.dispatchEvent(new CustomEvent("hui:chat:media-loaded"))}
    />
  );
}

function MediaContent({ msg = {}, own = false }) {
  const type = msg.media_type || msg.message_type;
  if (!msg.media_url) return null;

  if (type === "image") {
    return <ImageThumb msg={msg} />;
  }
  if (type === "video") {
    return (
      <video
        src={msg.media_url} controls
        style={{ maxWidth:"100%", maxHeight:260, borderRadius:12, display:"block" }}
      />
    );
  }
  if (type === "voice") {
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"8px 12px", minWidth:160,
        background: own ? "rgba(255,255,255,0.18)" : "rgba(22,215,197,0.08)",
        borderRadius:12,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            stroke={own ? "white" : C.teal} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"
            stroke={own ? "white" : C.teal} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <audio src={msg.media_url} controls style={{ height:28, flex:1 }}/>
      </div>
    );
  }
  return null;
}

// ── Emoji Reaktion Bar (Long-Press → Emoji auswählen) ──
function EmojiReactionBar({ msg = {}, position = {}, onReact = () => {}, onClose = () => {} }) {
  useModalRegistration(true, () => onClose?.(), "EmojiReactionBar");
  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setAnimateIn(true)); }, []);

  const isOwn = msg.own === true;

  return createPortal(
    <>
      {/* Transparenter Backdrop — schließt bei Tap außerhalb */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:10490,
        background:"rgba(0,0,0,0.06)",
        opacity: animateIn ? 1 : 0,
        transition:"opacity 0.15s ease-out",
      }}/>
      {/* Emoji-Leiste */}
      <div style={{
        position:"fixed", zIndex:10500,
        bottom: Math.min(Math.max(position.y - 60, 80), window.innerHeight - 120),
        left: "50%",
        transform: `translateX(-50%) scale(${animateIn ? 1 : 0.85})`,
        opacity: animateIn ? 1 : 0,
        transition:"all 0.20s cubic-bezier(0.22,1,0.36,1)",
        background:"rgba(255,255,255,0.97)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderRadius:28, padding:"8px 10px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        border:"1px solid rgba(0,0,0,0.07)",
        display:"flex", gap:2, alignItems:"center",
      }}>
        <style>{CSS}</style>
        {QUICK_EMOJIS.map((emoji, i) => {
          // Highlight wenn Nutzer schon mit diesem Emoji reagiert hat
          const userReacted = (msg.reactions || []).some(r => r.emoji === emoji && r.user_id === msg._currentUserId);
          return (
            <button
              key={i}
              onClick={() => { onReact(msg.id, emoji); onClose(); }}
              style={{
                width:42, height:42, borderRadius:"50%",
                border:"none", background: userReacted ? "rgba(22,215,197,0.12)" : "transparent",
                cursor:"pointer", fontSize:22, lineHeight:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                WebkitTapHighlightColor:"transparent",
                transition:"transform 0.12s ease-out",
                transform: animateIn ? "scale(1)" : "scale(0.7)",
                animationDelay: `${i * 0.02}s`,
              }}
              onTouchStart={e => { e.currentTarget.style.transform = "scale(1.3)"; }}
              onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >{emoji}</button>
          );
        })}
      </div>
    </>,
    document.body
  );
}

// ── Reaktions-Anzeige unter der Bubble ──
function ReactionBadges({ msg = {}, own = false }) {
  const reactions = msg.reactions;
  if (!reactions || reactions.length === 0) return null;

  // Emoji → Count gruppieren
  const counts = {};
  for (const r of reactions) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  }

  return (
    <div style={{
      display:"flex", gap:4, flexWrap:"wrap",
      marginTop:4,
      justifyContent: own ? "flex-end" : "flex-start",
    }}>
      {Object.entries(counts).map(([emoji, count]) => (
        <div key={emoji} style={{
          display:"flex", alignItems:"center", gap:3,
          padding:"2px 8px",
          background:"rgba(255,255,255,0.78)",
          backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
          borderRadius:99, border:"1px solid rgba(0,0,0,0.06)",
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
          fontSize:13, lineHeight:1,
        }}>
          <span style={{ fontSize:14 }}>{emoji}</span>
          {count > 1 && <span style={{ fontSize:11, color:"rgba(80,80,80,0.5)", fontWeight: 500 }}>{count}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Haupt-Bubble ──
export default function MessageBubble({ msg, onDelete, onEdit, onReact }) {
  const own = msg.own === true;
  const [modal, setModal] = useState(null); // { x, y } | null
  const [showReactions, setShowReactions] = useState(false);
  const bubbleRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x:0, y:0 });

  const isDeleted    = msg.is_deleted;
  const hasMedia     = !!(msg.media_url);

  const handlePress = useCallback((e) => {
    // Nicht auf Audio/Video-Controls triggern
    if (e.target.closest("audio,video,button,a")) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect || !own) return;
    const x = rect.right;
    const y = rect.bottom + 6;
    setModal({ x, y });
  }, [own]);

  // ── Long-Press für Emoji-Reaktion ──
  // 500ms gedrückt halten → Emoji-Leiste öffnet sich
  const startLongPress = useCallback((e) => {
    if (e.target.closest("audio,video,button,a")) return;
    if (isDeleted) return;
    const touch = e.touches?.[0] || e;
    const x = touch.clientX || 0;
    const y = touch.clientY || 0;
    touchStartPos.current = { x, y };
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowReactions(true);
      // Haptic Feedback (falls unterstützt)
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }, [isDeleted]);

  const cancelLongPress = useCallback((e) => {
    clearTimeout(longPressTimer.current);
    // Abbrechen wenn Finger zu weit bewegt wurde (>15px)
    if (e.touches || e.changedTouches) {
      const touch = e.changedTouches?.[0] || e.touches?.[0];
      if (touch) {
        const dx = Math.abs((touch.clientX || 0) - touchStartPos.current.x);
        const dy = Math.abs((touch.clientY || 0) - touchStartPos.current.y);
        if (dx > 15 || dy > 15) clearTimeout(longPressTimer.current);
      }
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(longPressTimer.current), []);
  const isVoiceOnly  = hasMedia && (msg.media_type === "voice" || msg.message_type === "voice");
  // Text anzeigen wenn: kein Media-only oder expliziter Text neben Media
  const showText     = !isDeleted && (
    !hasMedia ||
    (msg.text && msg.text !== "\uD83C\uDFA4 Sprachnachricht" && msg.text !== "\uD83D\uDDBC Bild" && msg.text !== "\uD83C\uDFAC Video")
  );

  return (
    <div style={{
      display:"flex",
      justifyContent: own ? "flex-end" : "flex-start",
      alignItems:"flex-end", gap:9,
      padding:"3px 16px 10px",
      animation: own ? "mb-in-own 0.40s cubic-bezier(0.22,1,0.36,1) both" : "mb-in-other 0.40s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <style>{CSS}</style>

      {/* Fremdes Avatar */}
      {!own && msg.avatar && (
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:"url(" + msg.avatar + ") center/cover no-repeat",
          border:"1.5px solid rgba(255,255,255,0.8)",
          boxShadow:"0 2px 6px rgba(0,0,0,0.10)", marginBottom:2,
        }}/>
      )}
      {!own && !msg.avatar && (
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:"linear-gradient(135deg," + C.teal + "70," + C.teal2 + "50)",
          border:"1.5px solid rgba(255,255,255,0.8)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, color:"white", fontWeight: 600, marginBottom:2,
        }}>{(msg.sender_name||"?")[0].toUpperCase()}</div>
      )}

      <div
        ref={bubbleRef}
        style={{ maxWidth:"72%", display:"flex", flexDirection:"column",
          alignItems: own ? "flex-end" : "flex-start", gap:4,
          cursor: own && !isDeleted ? "pointer" : "default",
          userSelect:"none",
          WebkitUserSelect:"none",
          touchAction:"auto",
        }}
        onClick={handlePress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={e => { e.preventDefault(); if(!isDeleted) setShowReactions(true); }}
      >
        {/* Bubble */}
        {own ? (
          <div style={{
            padding: hasMedia && !showText ? "8px" : "12px 18px",
            background:"linear-gradient(160deg,rgba(22,215,197,0.88) 0%,rgba(17,197,183,0.92) 100%)",
            borderRadius:"22px 22px 6px 22px",
            color: isDeleted ? "rgba(255,255,255,0.55)" : "white",
            fontSize: isDeleted ? 13 : 14.5, lineHeight:1.70,
            boxShadow:"0 4px 16px rgba(22,215,197,0.18),0 2px 6px rgba(0,0,0,0.04)",
            fontStyle: isDeleted ? "italic" : "normal",
            position:"relative",
            overflow:"hidden",
          }}>
            {!isDeleted && (
              <div style={{
                position:"absolute", inset:0, borderRadius:"inherit",
                background:"linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%)",
                pointerEvents:"none",
              }}/>
            )}
            {isDeleted ? (
              <span style={{ position:"relative" }}>Diese Nachricht wurde gelöscht.</span>
            ) : (
              <div style={{ position:"relative" }}>
                <MediaContent msg={msg} own={own}/>
                {showText && <div style={{ marginTop: hasMedia ? 8 : 0 }}>{msg.text}</div>}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: hasMedia && !showText ? "8px" : "12px 18px",
            background:"rgba(255,255,255,0.68)",
            backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
            borderRadius:"22px 22px 22px 6px",
            border:"1px solid rgba(255,255,255,0.62)",
            color: isDeleted ? "rgba(80,80,80,0.45)" : C.ink,
            fontSize: isDeleted ? 13 : 14.5, lineHeight:1.70,
            boxShadow:"0 4px 18px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04)",
            fontStyle: isDeleted ? "italic" : "normal",
            overflow:"hidden",
          }}>
            {isDeleted ? "Diese Nachricht wurde gelöscht." : (
              <>
                <MediaContent msg={msg} own={own}/>
                {showText && <div style={{ marginTop: hasMedia ? 8 : 0 }}>{msg.text}</div>}
              </>
            )}
          </div>
        )}

        {/* Reaktionen (Emoji-Badges) */}
        <ReactionBadges msg={msg} own={own}/>

        {/* Meta */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          flexDirection: own ? "row-reverse" : "row",
        }}>
          <span style={{ fontSize:10.5, color:"rgba(80,80,80,0.42)" }}>
            {formatTime(msg.created_at)}
          </span>
          {msg.edited_at && !isDeleted && (
            <span style={{ fontSize:10, color:"rgba(80,80,80,0.35)", fontStyle:"italic" }}>
              bearbeitet
            </span>
          )}
        </div>
      </div>

      {/* Action Modal (Bearbeiten/Löschen — nur eigene) */}
      {modal && (
        <MessageActionModal
          msg={msg}
          position={modal}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setModal(null)}
        />
      )}

      {/* Emoji Reaktion Bar (Long-Press — alle Nachrichten) */}
      {showReactions && (
        <EmojiReactionBar
          msg={{ ...msg, _currentUserId: msg._currentUserId }}
          position={{ y: bubbleRef.current?.getBoundingClientRect()?.bottom || 200 }}
          onReact={onReact}
          onClose={() => setShowReactions(false)}
        />
      )}
    </div>
  );
}
