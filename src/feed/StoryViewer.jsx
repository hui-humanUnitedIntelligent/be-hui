// src/feed/StoryViewer.jsx — Phase 3B Polish
// ═══════════════════════════════════════════════════════════════
// Fullscreen story viewer. Instagram-style progress bars.
// Auto-advance 6s. Tap L/R nav. Swipe down close. Long press pause.
// Reads: story.caption || story.text_overlay for text overlay.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

function fmtAgo(ts) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1)  return "Gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} T`;
}

export default function StoryViewer({ groups = [], startGroupIdx = 0, onClose, onProfilePress, onMarkSeen }) {
  const { user } = useAuth();
  const [gIdx,     setGIdx]     = useState(Math.max(0, Math.min(startGroupIdx, groups.length - 1)));
  const [sIdx,     setSIdx]     = useState(0);
  const [pct,      setPct]      = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [closing,  setClosing]  = useState(false);

  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const elapsedRef = useRef(0);
  const touchRef   = useRef({ x: 0, y: 0, t: 0 });
  const videoRef   = useRef(null);
  const DURATION   = 6000;

  const group   = groups[gIdx]   || null;
  const stories = group?.stories || [];
  const story   = stories[sIdx]  || null;
  const isVideo = story?.media_type === "video";

  // Record view
  useEffect(() => {
    if (!story?.id || !user?.id) return;
    supabase.from("story_views")
      .upsert({ story_id: story.id, viewer_id: user.id }, { ignoreDuplicates: true })
      .then(() => onMarkSeen?.(group?.userId))
      .catch(() => {});
  }, [story?.id]); // eslint-disable-line

  // Timer
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    startRef.current = Date.now() - elapsedRef.current;
    timerRef.current = setInterval(() => {
      const spent = Date.now() - startRef.current;
      const p = Math.min((spent / DURATION) * 100, 100);
      setPct(p);
      if (p >= 100) { clearInterval(timerRef.current); advance(1); }
    }, 40);
  }, [gIdx, sIdx]); // eslint-disable-line

  useEffect(() => {
    elapsedRef.current = 0;
    setPct(0);
    if (!paused) startTimer();
    return () => clearInterval(timerRef.current);
  }, [gIdx, sIdx]); // eslint-disable-line

  function advance(dir) {
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
    clearInterval(timerRef.current);
    setTimeout(() => onClose?.(), 180);
  }

  function pauseTimer() {
    clearInterval(timerRef.current);
    elapsedRef.current = Date.now() - (startRef.current || Date.now());
    setPaused(true);
  }

  function resumeTimer() {
    setPaused(false);
    startTimer();
  }

  // Touch handlers
  function onTouchStart(e) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    pauseTimer();
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    if (dy > 70 && Math.abs(dx) < 80) { close(); return; }
    resumeTimer();
    if (dt > 350 && Math.abs(dx) < 15 && Math.abs(dy) < 15) return; // long press — just resume
    if (t.clientX < window.innerWidth * 0.36) advance(-1);
    else advance(1);
  }

  if (!group || !story) return null;

  const overlayText = story.text_overlay || story.caption;
  const vh = typeof window !== "undefined" ? window.innerHeight : 812;

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100%",
        height: vh + "px", zIndex: 13000,
        background: "#080810",
        display: "flex", flexDirection: "column",
        touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
        opacity: closing ? 0 : 1,
        transform: closing ? "scale(0.97)" : "scale(1)",
        transition: closing ? "opacity 0.18s ease, transform 0.18s ease" : "none",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={pauseTimer}
      onMouseUp={resumeTimer}
    >
      {/* Progress bars */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "calc(env(safe-area-inset-top,10px) + 10px) 10px 0",
        display: "flex", gap: 3, zIndex: 10,
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2, background: "#fff",
              width: i < sIdx ? "100%" : i === sIdx ? pct + "%" : "0%",
              transition: i === sIdx && !paused ? `width ${DURATION}ms linear` : "none",
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: "absolute", top: "calc(env(safe-area-inset-top,10px) + 22px)",
        left: 0, right: 0, padding: "0 14px",
        display: "flex", alignItems: "center", gap: 10, zIndex: 10,
      }}>
        <button
          onClick={e => { e.stopPropagation(); close(); setTimeout(() => onProfilePress?.(group.userId), 200); }}
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
              ? <img src={group.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (group.name?.[0] || "?").toUpperCase()}
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{group.name}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 1 }}>
            {story.mood ? story.mood + " · " : ""}{fmtAgo(story.created_at)}{story.location ? " · " + story.location : ""}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); close(); }}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", fontSize: 20, lineHeight: 1,
            touchAction: "manipulation",
          }}
        >×</button>
      </div>

      {/* Media */}
      <div style={{ position: "absolute", inset: 0 }}>
        {isVideo && story.media_url ? (
          <video ref={videoRef} src={story.media_url} autoPlay muted={false} playsInline loop
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : story.media_url ? (
          <img src={story.media_url} alt="" loading="eager"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${TEAL}55, ${CORAL}55)`,
          }} />
        )}
      </div>

      {/* Bottom gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
        background: "linear-gradient(to top, rgba(8,8,16,0.75) 0%, transparent 100%)",
        pointerEvents: "none", zIndex: 5,
      }} />

      {/* Text overlay */}
      {overlayText && (
        <div style={{
          position: "absolute", bottom: "calc(env(safe-area-inset-bottom,20px) + 48px)",
          left: 18, right: 18, zIndex: 10,
          padding: "12px 16px",
          background: "rgba(8,8,16,0.60)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderRadius: 18,
          color: "#fff", fontSize: 16, fontWeight: 400,
          lineHeight: 1.55, textAlign: "center",
          textShadow: "0 1px 8px rgba(0,0,0,0.6)",
        }}>
          {overlayText}
        </div>
      )}

      {/* Tap zones */}
      <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "grid", gridTemplateColumns: "36% 64%" }}>
        <div onClick={e => { e.stopPropagation(); advance(-1); }} style={{ cursor: "pointer" }} />
        <div onClick={e => { e.stopPropagation(); advance(1);  }} style={{ cursor: "pointer" }} />
      </div>

      {/* Group dots */}
      {groups.length > 1 && (
        <div style={{
          position: "absolute", bottom: "calc(env(safe-area-inset-bottom,12px) + 12px)",
          left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 10,
        }}>
          {groups.map((_, i) => (
            <div key={i} style={{
              width: i === gIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === gIdx ? TEAL : "rgba(255,255,255,0.28)",
              transition: "all 0.22s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
