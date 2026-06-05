// src/feed/cards/BaseFeedCard.jsx — Phase 4D
// Avatar tap → direkt vollständiges Profil öffnen (kein QuickPreview mehr)
// ══════════════════════════════════════════════════════════════
// Double-tap like · Heart burst · Optimistic reactions
// Shimmer skeleton · Lazy image loading · Scale press states
// GPU-accelerated animations via transform
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, memo } from "react";
import { PresenceDot, fmtPresence } from "../../lib/usePresence.jsx";
import { MembershipLabel } from "../../components/ui/TalentBadge.jsx";

const T = {
  bgCard: "#FFFFFF",
  ink:    "#1A1A2E",
  ink3:   "rgba(26,26,46,0.35)",
  teal:   "#16D7C5",
  tealSoft:"rgba(22,215,197,0.10)",
  tealLine:"rgba(22,215,197,0.18)",
  coral:  "#FF8A6B",
  shadow: "0 2px 18px rgba(26,26,46,0.07)",
  border: "rgba(26,26,46,0.06)",
  r: 28, rMedia: 22, rAvatar: 13, p: 16, gap: 12, mediaH: 280,
};

// ── CSS injection (once) ──────────────────────────────────────
const CARD_CSS = `
@keyframes huiHeartBurst {
  0%   { transform:translate(-50%,-50%) scale(0.3); opacity:1; }
  45%  { transform:translate(-50%,-50%) scale(1.25); opacity:1; }
  75%  { transform:translate(-50%,-50%) scale(1.0); opacity:0.9; }
  100% { transform:translate(-50%,-50%) scale(1.4); opacity:0; }
}
@keyframes huiBookmarkPulse {
  0%,100% { transform:scale(1); }
  40%     { transform:scale(1.35); }
  70%     { transform:scale(0.9); }
}
@keyframes huiShimmer {
  0%   { background-position:200% 0; }
  100% { background-position:-200% 0; }
}
@keyframes huiFadeUp {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.hui-card-img { animation: huiFadeUp 0.28s ease both; }
/* HUI: Kein Media-Zoom — ruhiger, hochwertiger Feed */
`;
let _cardCSS = false;
function injectCardCSS() {
  if (_cardCSS || typeof document === "undefined") return;
  _cardCSS = true;
  const s = document.createElement("style"); s.textContent = CARD_CSS;
  document.head.appendChild(s);
}

// ── Shimmer skeleton ──────────────────────────────────────────
export function CardSkeleton() {
  injectCardCSS();
  const shimmer = {
    background: "linear-gradient(90deg,rgba(26,26,46,0.06) 25%,rgba(26,26,46,0.13) 50%,rgba(26,26,46,0.06) 75%)",
    backgroundSize: "200% 100%",
    animation: "huiShimmer 1.6s ease-in-out infinite",
  };
  return (
    <article style={{
      background: T.bgCard, borderRadius: T.r, marginBottom: 14,
      marginLeft: 12, marginRight: 12,
      boxShadow: T.shadow, border: "1px solid " + T.border, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 0", display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ width:38,height:38,borderRadius:T.rAvatar, ...shimmer }} />
        <div style={{ flex:1 }}>
          <div style={{ height:11,borderRadius:6,width:"55%",marginBottom:7,...shimmer }} />
          <div style={{ height:9,borderRadius:5,width:"35%",...shimmer }} />
        </div>
      </div>
      <div style={{ padding:"14px 16px 6px" }}>
        <div style={{ height:10,borderRadius:5,marginBottom:7,...shimmer }} />
        <div style={{ height:10,borderRadius:5,width:"72%",...shimmer }} />
      </div>
      <div style={{ margin:"10px 16px 16px",height:180,borderRadius:T.rMedia,...shimmer }} />
    </article>
  );
}

// ── Avatar ────────────────────────────────────────────────────
const CardAvatar = memo(function CardAvatar({ src, name, size = 38, isTalent = false }) {
  const [err, setErr] = useState(false);
  const letter = ((name || "H")[0] || "H").toUpperCase();
  return (
    <div style={{
      width:size,height:size,borderRadius:T.rAvatar,flexShrink:0,
      overflow:"hidden",background:T.tealSoft,
      border: isTalent ? "2px solid #16D7C5" : "1.5px solid "+T.tealLine,
      boxShadow: isTalent ? "0 0 8px rgba(22,215,197,0.30)" : "none",
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.38,fontWeight:700,color:T.teal,
    }}>
      {src && !err
        ? <img src={src} alt={name||""} onError={() => setErr(true)}
            loading="lazy"
            style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        : letter}
    </div>
  );
});

// ── Header ────────────────────────────────────────────────────
export const FeedCardHeader = memo(function FeedCardHeader({ author, time, badge, onProfile, presenceStatus }) {
  const _isTalent = author?.isTalent || false;
  const _mType    = author?.membershipType || "base";
  const name   = (author && (author.name || author.displayName)) || "Human";
  const uname  = (author && author.username) || null;
  // avatar: author.avatar (normalisiert) — bereits als URL oder null
  const avatar = author?.avatar || author?.avatar_url || null;
  const ver    = (author && author.verified) || false;
  const uid    = (author && author.id)       || null;
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{ display:"flex",alignItems:"center",gap:T.gap,padding:T.p+"px "+T.p+"px 0" }}>
      {/* Avatar → direkt vollständiges Profil öffnen */}
      <button
        onClick={onProfile ? () => {
          console.log("🔵 STEP 1 — Avatar click", { uid, hasOnProfile: !!onProfile, authorId: uid });
          onProfile();
        } : () => console.warn("🔴 STEP 1 — Avatar click: onProfile ist undefined (uid:", uid, ")")}
        onTouchStart={onProfile ? () => setPressed(true)  : undefined}
        onTouchEnd={onProfile   ? () => setPressed(false) : undefined}
        onMouseDown={onProfile  ? () => setPressed(true)  : undefined}
        onMouseUp={onProfile    ? () => setPressed(false) : undefined}
        style={{
          background:"none",border:"none",padding:0,
          cursor: onProfile ? "pointer" : "default",
          flexShrink:0,
          position:"relative",
          opacity: pressed ? 0.72 : 1,
          transition: "opacity 0.15s ease",
          touchAction: "manipulation",
          WebkitTapHighlightColor:"transparent",
        }}
      >
        <CardAvatar src={avatar} name={name} size={38} isTalent={_isTalent}/>
        {presenceStatus && presenceStatus !== "offline" && (
          <div style={{ position:"absolute", bottom:-1, right:-1 }}>
            <PresenceDot status={presenceStatus} size={9} />
          </div>
        )}
      </button>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:5 }}>
          <span
            onClick={onProfile ? () => { console.log("🔵 STEP 1b — Name click", { uid }); onProfile(); } : undefined}
            style={{ fontSize:13.5,fontWeight:700,color:T.ink,letterSpacing:-0.2,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              cursor: onProfile ? "pointer" : "default",
              WebkitTapHighlightColor:"transparent",
            }}>
            {name}
          </span>
          {ver && <span style={{ fontSize:11,color:T.teal }}>✦</span>}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
          <MembershipLabel membershipType={_mType} size="xs" />
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:1 }}>
          {uname && <span style={{ fontSize:11,color:T.ink3 }}>{"@"+uname}</span>}
          {uname && time && <span style={{ fontSize:11,color:T.ink3 }}>·</span>}
          {time  && <span style={{ fontSize:11,color:T.ink3 }}>{time}</span>}
          {presenceStatus === "online" && (
            <span style={{ fontSize:10.5, color:"#22C55E", fontWeight:500 }}>● gerade online</span>
          )}
        </div>
      </div>
      {badge && (
        <div style={{
          padding:"3px 9px",borderRadius:20,
          background: badge.bg||T.tealSoft,
          border:"1px solid "+(badge.border||T.tealLine),
          fontSize:10,fontWeight:700,color:badge.color||T.teal,
          flexShrink:0,letterSpacing:0.3,
        }}>
          {badge.label}
        </div>
      )}
    </div>
  );
});

// ── Media (lazy + fade-in + double-tap like) ──────────────────
export const FeedMedia = memo(function FeedMedia({ media, alt, relaxed, onDoubleTap }) {
  const [err,     setErr]     = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [heartPos,setHeartPos]= useState(null);
  const tapRef = useRef({ t: 0, x: 0, y: 0 });

  injectCardCSS();

  let url = null;
  if (Array.isArray(media) && media.length > 0) {
    const f = media[0];
    url = f?.url || (typeof f === "string" ? f : null);
  } else if (typeof media === "string" && media.length > 0) {
    url = media;
  }

  if (!url || err) return null;

  const h = relaxed ? 340 : T.mediaH;

  function handleTap(e) {
    const now = Date.now();
    const dt  = now - tapRef.current.t;
    if (dt < 320 && dt > 60) {
      // Double tap
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
      const cy = (e.touches?.[0]?.clientY || e.clientY) - rect.top;
      setHeartPos({ x: cx, y: cy });
      onDoubleTap?.();
      setTimeout(() => setHeartPos(null), 750);
    }
    tapRef.current = { t: now };
  }

  return (
    <div
      style={{
        margin: "14px " + T.p + "px 0",
        height: h, borderRadius: T.rMedia,
        overflow: "hidden", background: "#F0EFED",
        flexShrink: 0, position: "relative",
        cursor: "pointer",
        // Soft shadow under media
        boxShadow: "0 4px 20px rgba(26,26,46,0.08)",
      }}
      onTouchEnd={handleTap}
      onDoubleClick={handleTap}
    >
      {/* Blur placeholder while loading */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,rgba(22,215,197,0.07),rgba(255,138,107,0.07))",
          animation: "huiShimmer 1.6s ease-in-out infinite",
          backgroundSize: "200% 100%",
        }} />
      )}

      <img
        src={url}
        alt={alt || ""}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
        className="hui-card-img"
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          willChange: "opacity, transform",
        }}
      />

      {/* Heart burst on double-tap */}
      {heartPos && (
        <div style={{
          position: "absolute",
          left: heartPos.x, top: heartPos.y,
          pointerEvents: "none",
          fontSize: 64,
          lineHeight: 1,
          animation: "huiHeartBurst 0.7s cubic-bezier(.22,1,.36,1) forwards",
          willChange: "transform, opacity",
          zIndex: 5,
          filter: "drop-shadow(0 4px 12px rgba(255,100,100,0.45))",
        }}>❤️</div>
      )}
    </div>
  );
});

// ── Action Button ─────────────────────────────────────────────
const ActionBtn = memo(function ActionBtn({
  icon, label, count, active, onClick, activeColor, animKey
}) {
  const [scale, setScale] = useState(false);
  const isBookmark = icon === "⊕" || icon === "🔖";

  function handleClick() {
    setScale(true);
    setTimeout(() => setScale(false), 400);
    onClick?.();
  }

  const col = active ? (activeColor || T.teal) : T.ink3;
  return (
    <button
      onClick={handleClick}
      style={{
        background: "none", border: "none",
        padding: "7px 11px",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 5,
        borderRadius: 12,
        touchAction: "manipulation",
        // Spring scale
        transform: scale
          ? (isBookmark ? "scale(1.3)" : "scale(0.88)")
          : "scale(1)",
        transition: scale
          ? "transform 0.08s cubic-bezier(.22,1,.36,1)"
          : "transform 0.22s cubic-bezier(.22,1,.36,1)",
        willChange: "transform",
        animation: (scale && isBookmark) ? "huiBookmarkPulse 0.4s ease" : "none",
      }}
    >
      <span style={{
        fontSize: 17, lineHeight: 1, color: col,
        display: "block",
        // Filled heart for active touch
        filter: active && icon === "🤍" ? "none" : undefined,
      }}>
        {active && icon === "🤍" ? "❤️" : icon}
      </span>
      {(count != null || label) && (
        <span style={{
          fontSize: 12.5, color: col,
          fontWeight: active ? 700 : 400,
          transition: "color 0.18s ease",
        }}>
          {count != null ? count : label}
        </span>
      )}
    </button>
  );
});

// ── Actions bar ───────────────────────────────────────────────
export const FeedActions = memo(function FeedActions({
  reactions, onReaction, onShare, extraActions
}) {
  const r = reactions || {};
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "10px " + (T.p - 4) + "px",
      borderTop: "1px solid " + T.border,
      marginTop: 14, gap: 2,
    }}>
      <ActionBtn icon="✦"  count={r.inspireCount||null} active={r.inspired} activeColor={T.teal}  onClick={() => onReaction?.("inspire")} />
      <ActionBtn icon="🤍" count={r.touchCount||null}   active={r.touched}  activeColor={T.coral} onClick={() => onReaction?.("touch")}   />
      <ActionBtn icon="⊕"  active={r.saved}             activeColor="#8B5CF6"                      onClick={() => onReaction?.("save")}    />
      <div style={{ flex: 1 }} />
      {extraActions || null}
      <ActionBtn icon="↗" onClick={onShare} />
    </div>
  );
});

// ── Base Card ─────────────────────────────────────────────────
export default function BaseFeedCard({
  item, onProfile, onReaction, onShare, badge, children, extraActions
}) {
  injectCardCSS();

  const reactions = item?._reactions || {};

  // Optimistic like state
  const [localReactions, setLocalReactions] = useState(reactions);

  // Sync if item changes externally
  React.useEffect(() => {
    setLocalReactions(item?._reactions || {});
  }, [item?.id]); // eslint-disable-line

  if (!item?.id) return null;

  const handleReaction = useCallback((type) => {
    // Optimistic update
    setLocalReactions(prev => {
      const next = { ...prev };
      if (type === "inspire") {
        next.inspired = !prev.inspired;
        next.inspireCount = (prev.inspireCount || 0) + (next.inspired ? 1 : -1);
      } else if (type === "touch") {
        next.touched = !prev.touched;
        next.touchCount = (prev.touchCount || 0) + (next.touched ? 1 : -1);
      } else if (type === "save") {
        next.saved = !prev.saved;
      }
      return next;
    });
    // Propagate to parent (DB update)
    onReaction?.(type);
  }, [onReaction]);

  const handleDoubleTap = useCallback(() => {
    if (!localReactions.touched) {
      handleReaction("touch");
    }
  }, [localReactions.touched, handleReaction]);

  return (
    <article
      style={{
        background: T.bgCard,
        borderRadius: T.r,
        marginBottom: 14,
        marginLeft: 12,
        marginRight: 12,
        boxShadow: T.shadow,
        border: "1px solid " + T.border,
        overflow: "hidden",
        // Soft entrance
        animation: "huiFadeUp 0.3s ease both",
        willChange: "transform, opacity",
      }}
    >
      <FeedCardHeader
        author={item.author}
        time={item.createdAt}
        badge={badge}
        onProfile={onProfile}
        presenceStatus={item._presenceStatus || null}
      />
      <div style={{ padding: "12px " + T.p + "px 0" }}>{children}</div>
      <FeedMedia
        media={item.media}
        alt={item.title || item.text}
        relaxed={!!(item._reactions?._relaxed)}
        onDoubleTap={handleDoubleTap}
      />
      <FeedActions
        reactions={localReactions}
        onReaction={handleReaction}
        onShare={onShare}
        extraActions={extraActions}
      />
    </article>
  );
}