// src/feed/StoryViewer.jsx — Phase 3C Premium Polish
// ══════════════════════════════════════════════════════════════
// GPU-accelerated progress bars · rAF timer · preload next
// Swipe-down with drag resistance + opacity follow
// Smooth fade transitions between stories
// Long press pause · Tap zone nav
// ══════════════════════════════════════════════════════════════
import React, {
  useState, useEffect, useRef, useCallback, memo
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";
import StoryReactionTray from "./StoryReactionTray.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const DUR   = 6000; // ms per story

function fmtAgo(ts) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m <  1)  return "Gerade eben";
  if (m < 60)  return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} T`;
}

// Preload image/video
function preload(story) {
  if (!story?.media_url) return;
  if (story.media_type === "video") {
    const v = document.createElement("video");
    v.src = story.media_url; v.preload = "auto";
  } else {
    const i = new Image(); i.src = story.media_url;
  }
}

// ── Progress Bar (GPU-accelerated via scaleX) ─────────────────
const ProgressBar = memo(function ProgressBar({ active, done, pct, count }) {
  return (
    <div style={{
      display: "flex", gap: 3,
      padding: "calc(env(safe-area-inset-top,10px) + 8px) 10px 0",
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 2.5, borderRadius: 2,
          background: "rgba(255,255,255,0.25)",
          overflow: "hidden",
          // GPU layer
          willChange: "transform",
          transform: "translateZ(0)",
        }}>
          <div style={{
            height: "100%", borderRadius: 2, background: "#fff",
            transformOrigin: "left center",
            // Use scaleX → GPU composited, no layout reflow
            transform: `scaleX(${
              i < done ? 1 :
              i === done && active ? pct / 100 :
              0
            })`,
            transition: (i === done && active)
              ? `transform ${DUR}ms linear`
              : "none",
            willChange: "transform",
          }} />
        </div>
      ))}
    </div>
  );
});

// ── Header overlay ────────────────────────────────────────────
const StoryHeader = memo(function StoryHeader({ group, story, onClose, onProfile }) {
  return (
    <div style={{
      position: "absolute",
      top: "calc(env(safe-area-inset-top,10px) + 22px)",
      left: 0, right: 0,
      padding: "0 14px",
      display: "flex", alignItems: "center", gap: 10,
      zIndex: 20,
    }}>
      <button
        onClick={e => { e.stopPropagation(); onClose(); setTimeout(() => onProfile?.(group.userId), 180); }}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", touchAction: "manipulation" }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          border: `2px solid ${TEAL}`, overflow: "hidden",
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {group.avatar
            ? <img src={group.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            : (group.name?.[0] || "?").toUpperCase()
          }
        </div>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color:"#fff",fontWeight:700,fontSize:14,lineHeight:1.2 }}>{group.name}</div>
        <div style={{ color:"rgba(255,255,255,0.5)",fontSize:11,marginTop:1 }}>
          {story.mood ? story.mood + " · " : ""}
          {fmtAgo(story.created_at)}
          {story.location ? " · " + story.location : ""}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{
          background: "rgba(255,255,255,0.14)", border: "none",
          borderRadius: "50%", width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff", fontSize: 20, lineHeight: 1,
          touchAction: "manipulation", backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >×</button>
    </div>
  );
});

// ── Main ──────────────────────────────────────────────────────
export default function StoryViewer({
  groups = [], startGroupIdx = 0,
  onClose, onProfilePress, onMarkSeen
}) {
  const { user } = useAuth();

  const [gIdx, setGIdx] = useState(Math.max(0, Math.min(startGroupIdx, groups.length - 1)));
  const [sIdx, setSIdx] = useState(0);

  // pct: 0-100, driven by rAF
  const [pct,    setPct]    = useState(0);
  const [paused, setPaused] = useState(false);

  // Swipe state
  const [dragY,    setDragY]    = useState(0);
  const [dragging, setDragging] = useState(false);

  // Fade between stories
  const [fade, setFade] = useState(1);

  // Closing
  const [closing, setClosing] = useState(false);

  const rafRef     = useRef(null);
  const startRef   = useRef(null);
  const elapsedRef = useRef(0);
  const touchRef   = useRef({ x:0, y:0, t:0 });
  const pausedRef  = useRef(false);
  const videoRef   = useRef(null);

  const group   = groups[gIdx]   ?? null;
  const stories = group?.stories ?? [];
  const story   = stories[sIdx]  ?? null;
  const isVideo = story?.media_type === "video";

  // Record view
  useEffect(() => {
    if (!story?.id || !user?.id) return;
    supabase.from("story_views")
      .upsert({ story_id: story.id, viewer_id: user.id }, { ignoreDuplicates: true })
      .then(() => onMarkSeen?.(group?.userId))
      .catch(() => {});
  }, [story?.id]); // eslint-disable-line

  // Preload next
  useEffect(() => {
    const next = stories[sIdx + 1];
    if (next) preload(next);
    // Also preload first story of next group
    const nextGroup = groups[gIdx + 1];
    if (nextGroup?.stories?.[0]) preload(nextGroup.stories[0]);
  }, [gIdx, sIdx]); // eslint-disable-line

  // rAF-based timer
  const startTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now() - elapsedRef.current;

    function tick(now) {
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const elapsed = now - startRef.current;
      const p = Math.min((elapsed / DUR) * 100, 100);
      setPct(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        advance(1);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [gIdx, sIdx]); // eslint-disable-line

  useEffect(() => {
    elapsedRef.current = 0;
    setPct(0);
    setFade(0);
    // Tiny delay for fade-in
    const t = setTimeout(() => { setFade(1); startTimer(); }, 60);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [gIdx, sIdx]); // eslint-disable-line

  function advance(dir) {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    if (dir > 0) {
      if (sIdx < stories.length - 1) { setSIdx(s => s + 1); }
      else if (gIdx < groups.length - 1) { setGIdx(g => g + 1); setSIdx(0); }
      else close();
    } else {
      if (sIdx > 0) { setSIdx(s => s - 1); }
      else if (gIdx > 0) { setGIdx(g => g - 1); setSIdx(0); }
    }
  }

  function close() {
    setClosing(true);
    cancelAnimationFrame(rafRef.current);
    setTimeout(() => onClose?.(), 200);
  }

  function doPause() {
    pausedRef.current = true;
    setPaused(true);
    videoRef.current?.pause?.();
  }

  function doResume() {
    pausedRef.current = false;
    setPaused(false);
    videoRef.current?.play?.().catch(() => {});
  }

  // ── Touch ──────────────────────────────────────────────────
  function onTouchStart(e) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    doPause();
    setDragging(false);
    setDragY(0);
  }

  function onTouchMove(e) {
    const t = e.touches[0];
    const dy = t.clientY - touchRef.current.y;
    const dx = t.clientX - touchRef.current.x;
    if (dy > 10 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      setDragging(true);
      // Resistance: √dy so it feels heavy
      setDragY(Math.sqrt(Math.max(0, dy)) * 5.5);
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;

    if (dragY > 90) { close(); return; }
    setDragY(0); setDragging(false);
    doResume();

    // Long press: > 350ms with minimal movement → just resume
    if (dt > 350 && Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    // Swipe down threshold (natural, not resistance-applied)
    if (dy > 70 && Math.abs(dx) < 80) { close(); return; }

    const w = window.innerWidth;
    if (t.clientX < w * 0.35) advance(-1);
    else advance(1);
  }

  if (!group || !story) return null;

  const overlayText = story.text_overlay || story.caption;
  const vh = (typeof window !== "undefined" && window.innerHeight > 0) ? window.innerHeight : 812;

  // Drag opacity: 1 → 0.4 as dragY goes 0 → 130
  const dragOpacity = dragging ? Math.max(0.4, 1 - dragY / 200) : 1;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={doPause}
      onMouseUp={doResume}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%",
        height: vh + "px", zIndex: 13000,
        background: "#060610",
        display: "flex", flexDirection: "column",
        touchAction: "pan-x",
        userSelect: "none", WebkitUserSelect: "none",
        // Closing + drag transform — GPU
        opacity: closing ? 0 : dragOpacity,
        transform: closing
          ? "scale(0.96) translateY(20px)"
          : `translateY(${dragY}px)`,
        transition: (closing || !dragging)
          ? "opacity 0.2s ease, transform 0.2s ease"
          : "none",
        willChange: "transform, opacity",
        borderRadius: dragging ? 18 : 0,
        overflow: "hidden",
      }}
    >
      {/* Progress */}
      <ProgressBar
        count={stories.length}
        done={sIdx}
        active={!paused && !closing}
        pct={pct}
      />

      {/* Header */}
      <StoryHeader
        group={group}
        story={story}
        onClose={close}
        onProfile={onProfilePress}
      />

      {/* Media — fade between stories */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: fade,
        transition: "opacity 0.22s ease",
        willChange: "opacity",
      }}>
        {isVideo && story.media_url ? (
          <video
            ref={videoRef}
            key={story.id}
            src={story.media_url}
            autoPlay muted={false} playsInline loop
            onError={() => {}}
            style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}
          />
        ) : story.media_url ? (
          <img
            key={story.id}
            src={story.media_url}
            alt=""
            loading="eager"
            style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}
          />
        ) : (
          <div style={{
            width:"100%",height:"100%",
            background: `linear-gradient(135deg, ${TEAL}55, ${CORAL}55)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 72,
          }}>
            {story.mood || "✦"}
          </div>
        )}
      </div>

      {/* Bottom gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "45%",
        background: "linear-gradient(to top, rgba(6,6,16,0.82) 0%, rgba(6,6,16,0.18) 60%, transparent 100%)",
        pointerEvents: "none", zIndex: 8,
      }} />

      {/* Text overlay */}
      {overlayText && (
        <div style={{
          position: "absolute",
          bottom: `calc(env(safe-area-inset-bottom,20px) + 52px)`,
          left: 18, right: 18, zIndex: 10,
          padding: "13px 18px",
          background: "rgba(6,6,16,0.60)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderRadius: 20,
          color: "#fff", fontSize: 16.5, fontWeight: 400,
          lineHeight: 1.58, textAlign: "center",
          textShadow: "0 1px 10px rgba(0,0,0,0.55)",
          letterSpacing: 0.1,
        }}>
          {overlayText}
        </div>
      )}

      {/* Tap zones (above media, below header) */}
      <div style={{
        position: "absolute",
        top: "calc(env(safe-area-inset-top,10px) + 70px)",
        bottom: "calc(env(safe-area-inset-bottom,20px) + 100px)",
        left: 0, right: 0,
        zIndex: 15,
        display: "grid",
        gridTemplateColumns: "35% 30% 35%",
      }}>
        <div onClick={e => { e.stopPropagation(); advance(-1); }} style={{ cursor:"pointer" }} />
        <div onClick={e => { e.stopPropagation(); paused ? doResume() : doPause(); }} style={{ cursor:"pointer" }} />
        <div onClick={e => { e.stopPropagation(); advance(1); }}  style={{ cursor:"pointer" }} />
      </div>

      {/* Pause indicator */}
      {paused && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 18, pointerEvents: "none",
          fontSize: 52, opacity: 0.7,
          filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.5))",
          animation: "none",
        }}>⏸</div>
      )}

      {/* Story Reaction Tray */}
      <StoryReactionTray
        storyId={story?.id}
        userId={user?.id}
        onReact={(emoji) => {
          // Could dispatch to owner via realtime — no-op for now
        }}
      />

      {/* Group dots */}
      {groups.length > 1 && (
        <div style={{
          position: "absolute",
          bottom: `calc(env(safe-area-inset-bottom,12px) + 14px)`,
          left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: 6, zIndex: 10,
        }}>
          {groups.map((_, i) => (
            <div key={i} style={{
              width: i === gIdx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === gIdx ? TEAL : "rgba(255,255,255,0.28)",
              transition: "all 0.24s ease",
              willChange: "width",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
