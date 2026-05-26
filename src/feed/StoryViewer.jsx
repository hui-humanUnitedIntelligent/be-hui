// src/feed/StoryViewer.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — FULLSCREEN STORY VIEWER (Phase 3)
//
// Instagram × Airbnb × calm HUI aesthetic
// NOT TikTok chaos — calm, immersive, human.
//
// Features:
//   - Progress bars (auto-advance per story)
//   - Tap left/right to navigate
//   - Swipe down to close
//   - Image + video support
//   - Profile tap → creator profile
//   - Records view via story_views table
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

/* ── Tokens ─────────────────────────────────────────────────── */
const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const WHITE = "#FFFFFF";

/* ── Duration per story (ms) ─────────────────────────────────── */
const STORY_DURATION_IMAGE = 5000;
const STORY_DURATION_VIDEO = 15000;

/* ── Keyframes ───────────────────────────────────────────────── */
const CSS = `
@keyframes hui-story-in {
  from { opacity:0; transform:scale(1.04); }
  to   { opacity:1; transform:scale(1);    }
}
@keyframes hui-story-out {
  from { opacity:1; transform:scale(1);    }
  to   { opacity:0; transform:scale(0.96); }
}
@keyframes hui-progress {
  from { width: 0%; }
  to   { width: 100%; }
}
`;
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function StoryViewer({
  groups,          // [{ userId, name, avatar, stories: [...] }]
  startGroupIdx,   // which group to open
  onClose,
  onProfilePress,
  onMarkSeen,
}) {
  injectCSS();

  const { user } = useAuth();

  const [groupIdx, setGroupIdx]   = useState(startGroupIdx ?? 0);
  const [storyIdx, setStoryIdx]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [paused,   setPaused]     = useState(false);
  const [closing,  setClosing]    = useState(false);
  const [mediaKey, setMediaKey]   = useState(0); // force re-render on story change

  const timerRef    = useRef(null);
  const startRef    = useRef(null);
  const elapsedRef  = useRef(0);
  const touchRef    = useRef({ x: 0, y: 0, t: 0 });

  const group   = groups?.[groupIdx];
  const stories = group?.stories || [];
  const story   = stories[storyIdx];
  const isVideo = story?.media_type === "video";

  /* ── Record view ─────────────────────────────────────────── */
  useEffect(() => {
    if (!story?.id || !user?.id) return;
    supabase
      .from("story_views")
      .upsert({ story_id: story.id, viewer_id: user.id }, { ignoreDuplicates: true })
      .then(() => {
        onMarkSeen?.(group.userId);
      });
  }, [story?.id, user?.id]); // eslint-disable-line

  /* ── Progress timer ──────────────────────────────────────── */
  const duration = isVideo ? STORY_DURATION_VIDEO : STORY_DURATION_IMAGE;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    startRef.current  = Date.now() - elapsedRef.current;
    timerRef.current  = setInterval(() => {
      const spent = Date.now() - startRef.current;
      const pct   = Math.min((spent / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 50);
  }, [duration, groupIdx, storyIdx]); // eslint-disable-line

  const pauseTimer = useCallback(() => {
    clearInterval(timerRef.current);
    elapsedRef.current = Date.now() - (startRef.current || Date.now());
    setPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setPaused(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setMediaKey(k => k + 1);
    if (!paused) startTimer();
    return () => clearInterval(timerRef.current);
  }, [groupIdx, storyIdx]); // eslint-disable-line

  /* ── Navigation ──────────────────────────────────────────── */
  function goNext() {
    if (storyIdx < stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      handleClose();
    }
  }

  function goPrev() {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx(g => g - 1);
      setStoryIdx((prevGroup?.stories?.length || 1) - 1);
    }
  }

  function handleClose() {
    setClosing(true);
    clearInterval(timerRef.current);
    setTimeout(() => onClose?.(), 200);
  }

  /* ── Touch / tap ─────────────────────────────────────────── */
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

    // Swipe down → close
    if (dy > 60 && Math.abs(dx) < 60) {
      handleClose();
      return;
    }
    // Long press → stay paused (already paused)
    if (dt > 300 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      resumeTimer();
      return;
    }
    // Tap left/right
    resumeTimer();
    const W = window.innerWidth;
    if (t.clientX < W * 0.35) goPrev();
    else goNext();
  }

  function onMouseDown() { pauseTimer(); }
  function onMouseUp()   { resumeTimer(); }

  if (!group || !story) return null;

  return (
    <div
      style={{
        position:   "fixed",
        inset:      0,
        zIndex:     12000,
        background: "#0A0A12",
        display:    "flex",
        flexDirection: "column",
        overflow:   "hidden",
        animation:  closing
          ? "hui-story-out 0.2s ease both"
          : "hui-story-in 0.22s ease both",
        touchAction: "none",
        userSelect:  "none",
        WebkitUserSelect: "none",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >

      {/* ── Progress Bars ─────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        "env(safe-area-inset-top, 12px)",
        left:       0,
        right:      0,
        padding:    "12px 8px 0",
        display:    "flex",
        gap:        4,
        zIndex:     10,
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{
            flex:          1,
            height:        2.5,
            borderRadius:  2,
            background:    "rgba(255,255,255,0.28)",
            overflow:      "hidden",
          }}>
            <div style={{
              height:     "100%",
              borderRadius: 2,
              background: WHITE,
              width: i < storyIdx
                ? "100%"
                : i === storyIdx
                  ? `${progress}%`
                  : "0%",
              transition: i === storyIdx && !paused
                ? `width ${duration}ms linear`
                : "none",
            }} />
          </div>
        ))}
      </div>

      {/* ── Header (avatar + name + close) ───────────────── */}
      <div style={{
        position:   "absolute",
        top:        "calc(env(safe-area-inset-top, 12px) + 20px)",
        left:       0,
        right:      0,
        padding:    "0 16px",
        display:    "flex",
        alignItems: "center",
        gap:        10,
        zIndex:     10,
      }}>
        {/* Avatar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            setTimeout(() => onProfilePress?.(group.userId), 220);
          }}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: "pointer",
          }}
        >
          <div style={{
            width:        36,
            height:       36,
            borderRadius: "50%",
            border:       `2px solid ${TEAL}`,
            overflow:     "hidden",
            flexShrink:   0,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            background:   "rgba(255,255,255,0.12)",
            fontSize:     15,
            color:        WHITE,
            fontWeight:   700,
          }}>
            {group.avatar
              ? <img src={group.avatar} alt={group.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : group.name?.[0]?.toUpperCase()
            }
          </div>
        </button>

        {/* Name + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color:      WHITE,
            fontWeight: 700,
            fontSize:   14,
            lineHeight: 1.2,
            letterSpacing: 0.2,
          }}>{group.name}</div>
          <div style={{
            color:    "rgba(255,255,255,0.55)",
            fontSize: 11,
            marginTop: 1,
          }}>{story.mood ? story.mood + " · " : ""}{formatTimeAgo(story.created_at)}{story.location ? " · " + story.location : ""}</div>
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          style={{
            background: "rgba(255,255,255,0.15)",
            border:     "none",
            borderRadius: "50%",
            width:      32,
            height:     32,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:     "pointer",
            color:      WHITE,
            fontSize:   18,
            lineHeight: 1,
            touchAction: "manipulation",
          }}
        >×</button>
      </div>

      {/* ── Media ──────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        inset:      0,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {isVideo ? (
          <video
            key={mediaKey}
            src={story.media_url}
            autoPlay
            muted={false}
            playsInline
            loop={false}
            style={{
              width:     "100%",
              height:    "100%",
              objectFit: "cover",
            }}
          />
        ) : story.media_url ? (
          <img
            key={mediaKey}
            src={story.media_url}
            alt=""
            style={{
              width:     "100%",
              height:    "100%",
              objectFit: "cover",
            }}
            draggable={false}
          />
        ) : (
          /* No media — text-only story */
          <div style={{
            width:    "100%",
            height:   "100%",
            background: `linear-gradient(135deg, #16D7C5 0%, ${CORAL} 100%)`,
          }} />
        )}
      </div>

      {/* ── Text overlay ────────────────────────────────────── */}
      {(story.caption || story.text_overlay) && (
        <div style={{
          position:   "absolute",
          bottom:     "calc(env(safe-area-inset-bottom, 32px) + 60px)",
          left:       20,
          right:      20,
          zIndex:     10,
          padding:    "12px 16px",
          background: "rgba(10,10,18,0.64)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 16,
          color:      WHITE,
          fontSize:   16,
          fontWeight: 400,
          lineHeight: 1.5,
          textAlign:  "center",
        }}>
          {story.text_overlay || story.caption}
        </div>
      )}

      {/* ── Tap zones (left / right) — invisible but wide ──── */}
      <div style={{
        position:   "absolute",
        inset:      0,
        zIndex:     5,
        display:    "grid",
        gridTemplateColumns: "35% 65%",
      }}>
        <div onClick={goPrev} style={{ cursor: "pointer" }} />
        <div onClick={goNext} style={{ cursor: "pointer" }} />
      </div>

      {/* ── Group dots (bottom) ─────────────────────────────── */}
      {groups.length > 1 && (
        <div style={{
          position:   "absolute",
          bottom:     "calc(env(safe-area-inset-bottom, 16px) + 16px)",
          left:       0,
          right:      0,
          display:    "flex",
          justifyContent: "center",
          gap:        6,
          zIndex:     10,
        }}>
          {groups.map((_, i) => (
            <div key={i} style={{
              width:        i === groupIdx ? 16 : 6,
              height:       6,
              borderRadius: 3,
              background:   i === groupIdx
                ? TEAL
                : "rgba(255,255,255,0.30)",
              transition:   "all 0.25s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */
function formatTimeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} T`;
}
