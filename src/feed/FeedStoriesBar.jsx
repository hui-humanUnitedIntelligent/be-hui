// src/feed/FeedStoriesBar.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — STORIES BAR (Phase 3: Real Story System)
//
// ✅ Loads ONLY from: stories table (real Supabase data)
// ✅ Groups by user
// ✅ Own story slot always visible
// ✅ Opens StoryCreator (not TeilenFlow)
// ✅ Opens StoryViewer (fullscreen)
// ✅ Listens to "stories-refresh" event
// ✅ ISOLATED — never touches FeedRouter or feed state
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase }     from "../lib/supabaseClient.js";
import { useAuth }      from "../lib/AuthContext.jsx";
import StoryViewer      from "./StoryViewer.jsx";
import StoryCreator     from "./StoryCreator.jsx";

/* ── Design tokens ───────────────────────────────────────────── */
const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const GOLD  = "#F59E0B";
const CREAM = "#FAFAF8";
const INK   = "#1A1A2E";
const INK3  = "rgba(26,26,46,0.38)";
const RING_UNSEEN = `linear-gradient(135deg, ${TEAL} 0%, ${CORAL} 50%, ${GOLD} 100%)`;
const RING_SEEN   = "conic-gradient(rgba(26,26,46,0.14) 0%, rgba(26,26,46,0.10) 100%)";
const RING_LIVE   = `conic-gradient(${CORAL} 0%, #FF6B6B 100%)`;
const RING_SELF   = `linear-gradient(135deg, ${TEAL} 0%, ${TEAL} 100%)`;

/* ── CSS ─────────────────────────────────────────────────────── */
const CSS = `
@keyframes huiStoryPulse {
  0%,100% { box-shadow: 0 0 0 2.5px rgba(22,215,197,0.65); }
  50%      { box-shadow: 0 0 0 5px rgba(22,215,197,0.18); }
}
@keyframes huiStoryFadeIn {
  from { opacity:0; transform:scale(0.86) translateY(8px); }
  to   { opacity:1; transform:scale(1)   translateY(0);    }
}
@keyframes huiStoryLivePulse {
  0%,100% { box-shadow: 0 0 0 2.5px rgba(255,138,107,0.75); }
  50%      { box-shadow: 0 0 0 5.5px rgba(255,138,107,0.2); }
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
   STORY BAR
══════════════════════════════════════════════════════════════ */
export default function FeedStoriesBar({ onProfilePress }) {
  injectCSS();

  const { user } = useAuth();

  const [groups,      setGroups]     = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [seenIds,     setSeenIds]    = useState(new Set());
  const [viewerOpen,  setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart]= useState(0);
  const [creatorOpen, setCreatorOpen]= useState(false);

  /* ── Active trace ─────────────────────────────────────────── */
  useEffect(() => {
    console.log("[ACTIVE_FEED_SYSTEM] FeedStoriesBar mounted");
  }, []);

  /* ── Restore seen state from sessionStorage ──────────────── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hui_seen_stories_v3");
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch (_) {}
  }, []);

  /* ── Load stories ─────────────────────────────────────────── */
  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("stories")
        .select(`
          id, user_id, media_url, media_type, text,
          created_at, expires_at, is_active, viewers_count,
          profile:user_id(display_name, avatar_url, username)
        `)
        .eq("is_active", true)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) {
        console.warn("[HUI_STORIES] load error:", error.message);
        // Fail gracefully — still show own story slot
        setGroups(buildOwnSlot(user, []));
        return;
      }

      const rows = data || [];
      console.log("[HUI_STORIES] loaded:", rows.length, "stories");

      // ── Group by user_id ───────────────────────────────────
      const byUser = new Map();

      for (const row of rows) {
        const uid  = row.user_id;
        const prof = row.profile || {};
        if (!byUser.has(uid)) {
          byUser.set(uid, {
            userId:  uid,
            name:    prof.display_name || prof.username || "Human",
            avatar:  prof.avatar_url   || null,
            isLive:  false,
            isYou:   uid === user?.id,
            stories: [],
          });
        }
        byUser.get(uid).stories.push(row);
      }

      let arr = Array.from(byUser.values());

      // ── Sort: own first, then unseen, then seen ────────────
      arr.sort((a, b) => {
        if (a.isYou) return -1;
        if (b.isYou) return 1;
        const aSeen = seenIds.has(a.userId);
        const bSeen = seenIds.has(b.userId);
        if (aSeen !== bSeen) return aSeen ? 1 : -1;
        return 0;
      });

      // ── Ensure own slot always present ────────────────────
      if (user?.id && !arr.some(g => g.isYou)) {
        arr.unshift({
          userId:  user.id,
          name:    "Deine Story",
          avatar:  user.user_metadata?.avatar_url || null,
          isLive:  false,
          isYou:   true,
          stories: [],
        });
      }

      setGroups(arr);
    } finally {
      setLoading(false);
    }
  }, [user?.id, seenIds]); // eslint-disable-line

  useEffect(() => { loadStories(); }, [user?.id]); // eslint-disable-line

  /* ── Listen to refresh event ──────────────────────────────── */
  useEffect(() => {
    const handler = () => loadStories();
    window.addEventListener("stories-refresh", handler);
    return () => window.removeEventListener("stories-refresh", handler);
  }, [loadStories]);

  /* ── Handle story circle tap ──────────────────────────────── */
  function handleGroupTap(groupIndex) {
    const group = groups[groupIndex];
    if (!group) return;

    // Own story + no stories yet → open creator
    if (group.isYou && group.stories.length === 0) {
      setCreatorOpen(true);
      return;
    }

    // Open viewer
    setViewerStart(groupIndex);
    setViewerOpen(true);
  }

  /* ── Mark user as seen ────────────────────────────────────── */
  function handleMarkSeen(userId) {
    setSeenIds(prev => {
      const next = new Set(prev).add(userId);
      try { sessionStorage.setItem("hui_seen_stories_v3", JSON.stringify([...next])); } catch (_) {}
      return next;
    });
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      <div style={{
        width:      "100%",
        overflowX:  "auto",
        overflowY:  "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        padding:    "16px 0 12px",
        borderBottom: "1px solid rgba(26,26,46,0.07)",
      }}>
        <style>{`::-webkit-scrollbar { display:none; }`}</style>

        {/* Inner scroll row */}
        <div style={{
          display:    "flex",
          gap:        14,
          padding:    "0 16px",
          minWidth:   "max-content",
        }}>

          {/* Loading skeletons */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBubble key={i} delay={i * 0.07} />
          ))}

          {/* Story groups */}
          {!loading && groups.map((group, idx) => (
            <StoryBubble
              key={group.userId}
              group={group}
              isSeen={seenIds.has(group.userId) && !group.isYou}
              onTap={() => handleGroupTap(idx)}
              delay={idx * 0.06}
            />
          ))}

          {/* Empty state — not logged in */}
          {!loading && !user?.id && groups.length === 0 && (
            <div style={{
              color: INK3, fontSize: 13, padding: "0 8px",
              display: "flex", alignItems: "center",
            }}>
              Melde dich an um Stories zu sehen
            </div>
          )}
        </div>
      </div>

      {/* ── Story Viewer ─────────────────────────────────────── */}
      {viewerOpen && groups.some(g => g.stories.length > 0) && (
        <StoryViewer
          groups={groups.filter(g => g.stories.length > 0)}
          startGroupIdx={Math.max(0,
            groups.filter(g => g.stories.length > 0)
              .findIndex(g => g.userId === groups[viewerStart]?.userId)
          )}
          onClose={() => setViewerOpen(false)}
          onProfilePress={(uid) => {
            setViewerOpen(false);
            onProfilePress?.(uid);
          }}
          onMarkSeen={handleMarkSeen}
        />
      )}

      {/* ── Story Creator ─────────────────────────────────────── */}
      {creatorOpen && (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onPublished={() => {
            setCreatorOpen(false);
            loadStories();
          }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   STORY BUBBLE
══════════════════════════════════════════════════════════════ */
function StoryBubble({ group, isSeen, onTap, delay }) {
  const [pressed, setPressed] = useState(false);
  const name     = group.name     || "Human";
  const avatar   = group.avatar   || null;
  const isLive   = group.isLive   || false;
  const isYou    = group.isYou    || false;
  const isEmpty  = group.stories.length === 0;
  const hasNew   = !isSeen && !isEmpty;

  const ring = isLive ? RING_LIVE
    : isYou    ? RING_SELF
    : hasNew   ? RING_UNSEEN
    : RING_SEEN;

  const pulse = isLive
    ? "huiStoryLivePulse 2s ease-in-out infinite"
    : isYou && isEmpty
      ? "huiStoryPulse 2.5s ease-in-out infinite"
      : "none";

  return (
    <button
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background:    "none",
        border:        "none",
        padding:       0,
        cursor:        "pointer",
        touchAction:   "manipulation",
        WebkitTapHighlightColor: "transparent",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           6,
        flexShrink:    0,
        animation:     `huiStoryFadeIn 0.35s ${delay}s cubic-bezier(.22,1,.36,1) both`,
        transform:     pressed ? "scale(0.93)" : "scale(1)",
        transition:    "transform 0.14s ease",
      }}
    >
      {/* Ring + Avatar */}
      <div style={{
        width:         58,
        height:        58,
        borderRadius:  "50%",
        padding:       2.5,
        background:    ring,
        animation:     pulse,
        position:      "relative",
      }}>
        {/* Inner white gap */}
        <div style={{
          width:         "100%",
          height:        "100%",
          borderRadius:  "50%",
          background:    CREAM,
          padding:       2,
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          overflow:      "hidden",
        }}>
          {/* Avatar */}
          <div style={{
            width:         "100%",
            height:        "100%",
            borderRadius:  "50%",
            background:    isSeen
              ? "rgba(26,26,46,0.06)"
              : `linear-gradient(135deg, rgba(22,215,197,0.12), rgba(255,138,107,0.12))`,
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            overflow:      "hidden",
            fontSize:      20,
            color:         TEAL,
            fontWeight:    700,
            position:      "relative",
          }}>
            {avatar
              ? <img
                  src={avatar}
                  alt={name}
                  style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              : name[0]?.toUpperCase()
            }

            {/* + badge for own empty slot */}
            {isYou && isEmpty && (
              <div style={{
                position:      "absolute",
                bottom:        -1,
                right:         -1,
                width:         20,
                height:        20,
                borderRadius:  "50%",
                background:    TEAL,
                border:        `2px solid ${CREAM}`,
                display:       "flex",
                alignItems:    "center",
                justifyContent:"center",
                fontSize:      14,
                color:         "#fff",
                fontWeight:    900,
                lineHeight:    1,
              }}>+</div>
            )}
          </div>
        </div>
      </div>

      {/* Name label */}
      <div style={{
        fontSize:   11,
        fontWeight: isSeen && !isYou ? 400 : 600,
        color:      isSeen && !isYou ? INK3 : INK,
        maxWidth:   62,
        overflow:   "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign:  "center",
        lineHeight: 1.2,
      }}>
        {isYou && isEmpty ? "Dein Moment" : name}
      </div>

      {/* LIVE badge */}
      {isLive && (
        <div style={{
          fontSize:   9,
          fontWeight: 800,
          color:      "#fff",
          background: CORAL,
          borderRadius: 4,
          padding:    "1px 5px",
          letterSpacing: 0.5,
          marginTop:  -4,
        }}>LIVE</div>
      )}
    </button>
  );
}

/* ── Skeleton bubble ─────────────────────────────────────────── */
function SkeletonBubble({ delay }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           6,
      animation:     `huiStoryFadeIn 0.35s ${delay}s both`,
      opacity:       0.5,
    }}>
      <div style={{
        width:        58, height:     58,
        borderRadius: "50%",
        background:   "rgba(26,26,46,0.07)",
      }} />
      <div style={{
        width:        42, height:     8,
        borderRadius: 4,
        background:   "rgba(26,26,46,0.07)",
      }} />
    </div>
  );
}

/* ── Own slot builder helper ─────────────────────────────────── */
function buildOwnSlot(user, extra) {
  const own = {
    userId:  user?.id || "anon",
    name:    "Deine Story",
    avatar:  user?.user_metadata?.avatar_url || null,
    isLive:  false,
    isYou:   true,
    stories: [],
  };
  return user?.id ? [own, ...extra] : extra;
}
