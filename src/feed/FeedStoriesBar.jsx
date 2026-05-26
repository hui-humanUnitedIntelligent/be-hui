// src/feed/FeedStoriesBar.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — STORIES BAR (Phase 2A: Safe Reintegration)
//
// ISOLIERT — kein Coupling an FeedRouter oder liveItems.
// Eigene Supabase-Query, eigener Loading-State.
// Crash → leerer Container, kein Feed-Crash.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { supabase }  from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";

/* ── Tokens ───────────────────────────────────────────────────── */
const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const GOLD  = "#F59E0B";
const INK3  = "rgba(26,26,46,0.38)";

/* ── CSS keyframes (injected once) ───────────────────────────── */
const KEYFRAMES = `
@keyframes huiStoryPulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(22,215,197,0.6); }
  50%      { box-shadow: 0 0 0 5px rgba(22,215,197,0.2); }
}
@keyframes huiStoryFadeIn {
  from { opacity:0; transform:scale(0.88) translateY(6px); }
  to   { opacity:1; transform:scale(1)   translateY(0);    }
}
`;

let _keyframesInjected = false;
function injectKeyframes() {
  if (_keyframesInjected) return;
  _keyframesInjected = true;
  const s = document.createElement("style");
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

/* ── Avatar ring gradient ─────────────────────────────────────── */
function ringGradient(seen, isLive) {
  if (isLive) return `conic-gradient(${CORAL} 0%, #FF6B6B 100%)`;
  if (seen)   return `conic-gradient(rgba(26,26,46,0.14) 0%, rgba(26,26,46,0.10) 100%)`;
  return `conic-gradient(${TEAL} 0%, ${CORAL} 50%, ${GOLD} 100%)`;
}

/* ── Single Story Card ────────────────────────────────────────── */
function StoryCard({ group, isSeen, onPress, delay }) {
  const [pressed, setPressed] = useState(false);
  const name   = group.name   || "Human";
  const avatar = group.avatar || null;
  const isLive = group.isLive || false;
  const hasNew = !isSeen && (group.stories || []).length > 0;

  return (
    <button
      onClick={() => onPress(group)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "none", border: "none", padding: 0,
        cursor: "pointer", flexShrink: 0, width: 72,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 6, touchAction: "manipulation",
        animation: `huiStoryFadeIn 0.35s ease both`,
        animationDelay: delay + "ms",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.15s ease",
      }}
    >
      {/* Avatar + ring */}
      <div style={{
        position: "relative",
        width: 58, height: 58,
        padding: 2.5,
        borderRadius: "50%",
        background: ringGradient(isSeen, isLive),
        animation: isLive ? "huiStoryPulse 2s ease infinite" : "none",
      }}>
        {/* Inner white gap */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: "50%", padding: 2,
          background: "#fff",
          overflow: "hidden",
        }}>
          <div style={{
            width: "100%", height: "100%",
            borderRadius: "50%", overflow: "hidden",
            background: "rgba(22,215,197,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: TEAL, fontWeight: 700,
          }}>
            {avatar
              ? <img src={avatar} alt={name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { e.target.style.display = "none"; }} />
              : name[0].toUpperCase()
            }
          </div>
        </div>

        {/* LIVE badge */}
        {isLive && (
          <div style={{
            position: "absolute", bottom: -2, left: "50%",
            transform: "translateX(-50%)",
            background: CORAL, color: "#fff",
            fontSize: 8, fontWeight: 800, letterSpacing: 0.5,
            padding: "1px 5px", borderRadius: 4,
            border: "1.5px solid #fff",
          }}>LIVE</div>
        )}

        {/* Unseen dot */}
        {hasNew && !isLive && (
          <div style={{
            position: "absolute", top: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: TEAL, border: "1.5px solid #fff",
          }} />
        )}
      </div>

      {/* Name */}
      <span style={{
        fontSize: 10.5, fontWeight: hasNew ? 700 : 500,
        color: hasNew ? "rgba(26,26,46,0.82)" : INK3,
        maxWidth: 68, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
        textAlign: "center",
      }}>
        {name.split(" ")[0]}
      </span>
    </button>
  );
}

/* ── Add Story Button ─────────────────────────────────────────── */
function AddStoryButton({ onPress, currentUser }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onPress}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: "none", border: "none", padding: 0,
        cursor: "pointer", flexShrink: 0, width: 72,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 6, touchAction: "manipulation",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.15s ease",
      }}
    >
      <div style={{
        width: 58, height: 58, borderRadius: "50%",
        background: "rgba(22,215,197,0.08)",
        border: "2px dashed rgba(22,215,197,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* User avatar in background */}
        {currentUser?.avatar && (
          <img src={currentUser.avatar} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.35 }} />
        )}
        <span style={{ fontSize: 22, color: TEAL, fontWeight: 300, lineHeight: 1, position: "relative" }}>+</span>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 500, color: INK3 }}>Teilen</span>
    </button>
  );
}

/* ── Main Stories Bar ─────────────────────────────────────────── */
export default function FeedStoriesBar({ onStoryClick, onAddStory, currentUser }) {
  const { user } = useAuth();
  const [groups,    setGroups]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const s = sessionStorage.getItem("hui_seen_stories");
      return new Set(s ? JSON.parse(s) : []);
    } catch { return new Set(); }
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    injectKeyframes();
    loadStories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadStories() {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select(`
          id, user_id, media_url, media_type, caption,
          is_highlight, created_at, expires_at,
          profile:user_id(display_name, avatar_url, username)
        `)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      const rows = data || [];

      // Group by user_id
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
            stories: [],
          });
        }
        byUser.get(uid).stories.push(row);
      }

      // Sort: current user first, then unseen, then seen
      let arr = Array.from(byUser.values());
      arr.sort((a, b) => {
        if (a.userId === user?.id) return -1;
        if (b.userId === user?.id) return 1;
        const aSeen = viewedIds.has(a.userId);
        const bSeen = viewedIds.has(b.userId);
        if (aSeen !== bSeen) return aSeen ? 1 : -1;
        return 0;
      });

      setGroups(arr);
    } catch (err) {
      console.warn("[HUI_STORIES_LOAD_ERR]", err?.message);
      // Fail silently — feed still renders
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  function handleStoryPress(group) {
    // Mark as seen
    setViewedIds(prev => {
      const next = new Set(prev);
      next.add(group.userId);
      try { sessionStorage.setItem("hui_seen_stories", JSON.stringify([...next])); } catch {}
      return next;
    });
    onStoryClick?.(group);
  }

  // Don't render empty bar (no placeholder height)
  if (!loading && groups.length === 0) return null;

  return (
    <div style={{
      paddingTop: 12,
      paddingBottom: 4,
      marginBottom: 4,
    }}>
      {/* Section label */}
      <div style={{
        paddingLeft: 16, marginBottom: 10,
        fontSize: 11, fontWeight: 700,
        color: INK3, letterSpacing: 0.5,
        textTransform: "uppercase",
      }}>
        Momente
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          flexDirection: "row",
          overflowX: "auto",
          overflowY: "hidden",
          gap: 10,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 6,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Add story button */}
        <AddStoryButton onPress={onAddStory} currentUser={currentUser} />

        {/* Loading skeletons */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={"sk" + i} style={{
            flexShrink: 0, width: 72,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              background: "rgba(26,26,46,0.06)",
            }} />
            <div style={{ width: 40, height: 8, borderRadius: 4, background: "rgba(26,26,46,0.05)" }} />
          </div>
        ))}

        {/* Story groups */}
        {!loading && groups.map((g, i) => (
          <StoryCard
            key={g.userId}
            group={g}
            isSeen={viewedIds.has(g.userId)}
            onPress={handleStoryPress}
            delay={i * 40}
          />
        ))}
      </div>

      {/* Subtle divider */}
      <div style={{
        height: 1, marginLeft: 16, marginRight: 16,
        marginTop: 10,
        background: "rgba(26,26,46,0.05)",
      }} />
    </div>
  );
}
