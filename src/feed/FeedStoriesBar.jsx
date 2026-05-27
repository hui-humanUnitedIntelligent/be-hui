// src/feed/FeedStoriesBar.jsx — Phase 3B Polish
// ═══════════════════════════════════════════════════════════════
// Bulletproof Stories Bar. Accepts all prop variants from UnifiedFeed.
// onProfilePress / onStoryClick / onAddStory all handled.
// Crash → SectionBoundary catches it → feed still renders.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { supabase }  from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import StoryViewer   from "./StoryViewer.jsx";
import StoryCreator  from "./StoryCreator.jsx";
import { usePresenceMap, PresenceDot } from "../lib/usePresence.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const GOLD  = "#F59E0B";
const CREAM = "#FAFAF8";
const INK   = "#1A1A2E";
const INK3  = "rgba(26,26,46,0.38)";

const CSS = `
@keyframes huiSBIn { from{opacity:0;transform:scale(0.82) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes huiRingPulse { 0%,100%{box-shadow:0 0 0 2.5px rgba(22,215,197,0.65)} 50%{box-shadow:0 0 0 5px rgba(22,215,197,0.15)} }
@keyframes huiLivePulse  { 0%,100%{box-shadow:0 0 0 2.5px rgba(255,80,80,0.75)}  50%{box-shadow:0 0 0 5.5px rgba(255,80,80,0.15)} }
`;
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
}

export default function FeedStoriesBar(props) {
  // Accept all prop name variants
  const onProfilePress = props.onProfilePress || props.onStoryClick || null;
  const onAddStory     = props.onAddStory     || null;

  injectCSS();
  const { user } = useAuth();

  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [seen,        setSeen]        = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem("hui_seen_v4") || "[]")); } catch { return new Set(); }
  });
  const [viewerOpen,  setViewerOpen]  = useState(false);
  const [viewerIdx,   setViewerIdx]   = useState(0);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select("id,user_id,username,avatar_url,media_url,media_type,caption,text_overlay,mood,location,status,created_at,expires_at,updated_at")
        .eq("status", "active")
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) {
        console.warn("[HUI_STORIES] load error:", error.message);
        setGroups(ownSlot(user));
        return;
      }

      const rows = data || [];
      const byUser = new Map();
      for (const row of rows) {
        const uid = row.user_id;
        if (!byUser.has(uid)) byUser.set(uid, {
          userId: uid,
          name:   row.username || "Human",
          avatar: row.avatar_url || null,
          isLive: false,
          isYou:  uid === user?.id,
          stories:[],
        });
        byUser.get(uid).stories.push(row);
      }

      let arr = Array.from(byUser.values());
      arr.sort((a,b) => {
        if (a.isYou) return -1; if (b.isYou) return 1;
        return (seen.has(a.userId) ? 1:0) - (seen.has(b.userId) ? 1:0);
      });

      if (user?.id && !arr.some(g => g.isYou)) arr.unshift(ownSlot(user)[0]);
      setGroups(arr);
    } catch (e) {
      console.warn("[HUI_STORIES] crash:", e?.message);
      setGroups(ownSlot(user));
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // eslint-disable-line

  useEffect(() => { loadStories(); }, [user?.id]); // eslint-disable-line
  useEffect(() => {
    const h = () => loadStories();
    window.addEventListener("stories-refresh", h);
    return () => window.removeEventListener("stories-refresh", h);
  }, [loadStories]);

  function markSeen(uid) {
    setSeen(prev => {
      const n = new Set(prev); n.add(uid);
      try { sessionStorage.setItem("hui_seen_v4", JSON.stringify([...n])); } catch {}
      return n;
    });
  }

  function tapGroup(idx) {
    const g = groups[idx];
    if (!g) return;
    if (g.isYou && g.stories.length === 0) { setCreatorOpen(true); return; }
    setViewerIdx(idx); setViewerOpen(true);
  }

  const viewable = groups.filter(g => g.stories.length > 0);
  // Presence map for all group users
  const groupUserIds = groups.map(g => g.userId).filter(Boolean);
  const presenceMap  = usePresenceMap(groupUserIds);

  return (
    <>
      <div style={{
        width:"100%", overflowX:"auto", overflowY:"hidden",
        WebkitOverflowScrolling:"touch", scrollbarWidth:"none", msOverflowStyle:"none",
        padding:"16px 0 12px",
        borderBottom:"1px solid rgba(26,26,46,0.07)",
      }}>
        <style>{"::-webkit-scrollbar{display:none}"}</style>
        <div style={{ display:"flex", gap:14, padding:"0 16px", minWidth:"max-content" }}>

          {loading && Array.from({length:5}).map((_,i) => <Skel key={i} delay={i*0.07} />)}

          {!loading && groups.map((g, idx) => (
            <Bubble
              key={g.userId}
              group={g}
              isSeen={seen.has(g.userId) && !g.isYou}
              delay={idx * 0.055}
              onTap={() => tapGroup(idx)}
              presenceStatus={presenceMap[g.userId]?.status}
            />
          ))}
        </div>
      </div>

      {viewerOpen && viewable.length > 0 && (
        <StoryViewer
          groups={viewable}
          startGroupIdx={Math.max(0, viewable.findIndex(g => g.userId === groups[viewerIdx]?.userId))}
          onClose={() => setViewerOpen(false)}
          onProfilePress={uid => { setViewerOpen(false); onProfilePress?.(uid); }}
          onMarkSeen={markSeen}
        />
      )}

      {creatorOpen && (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onPublished={() => { setCreatorOpen(false); loadStories(); }}
        />
      )}


    </>
  );
}

// ── Bubble ───────────────────────────────────────────────────────
function Bubble({ group, isSeen, delay, onTap, presenceStatus }) {
  const [pressed, setPressed] = useState(false);
  const { name, avatar, isLive, isYou, stories } = group;
  const isEmpty  = stories.length === 0;
  const hasNew   = !isSeen && !isEmpty;

  const ring = isLive
    ? "conic-gradient(#FF5050 0%,#FF5050 100%)"
    : isYou
      ? `linear-gradient(135deg,${TEAL},${TEAL})`
      : hasNew
        ? `linear-gradient(135deg,${TEAL} 0%,${CORAL} 55%,${GOLD} 100%)`
        : "conic-gradient(rgba(26,26,46,0.13) 0%,rgba(26,26,46,0.09) 100%)";

  const pulse = isLive ? "huiLivePulse 2s ease-in-out infinite"
    : (isYou && isEmpty) ? "huiRingPulse 2.5s ease-in-out infinite"
    : (presenceStatus === "online" && !isSeen) ? "huiRingPulse 3s ease-in-out infinite"
    : "none";

  return (
    <button
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background:"none", border:"none", padding:0,
        cursor:"pointer", touchAction:"manipulation",
        WebkitTapHighlightColor:"transparent",
        display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0,
        animation:`huiSBIn 0.32s ${delay}s cubic-bezier(.22,1,.36,1) both`,
        transform: pressed ? "scale(0.91)" : "scale(1)",
        transition:"transform 0.12s ease",
      }}
    >
      {/* Ring */}
      <div style={{ width:58, height:58, borderRadius:"50%", padding:2.5, background:ring, animation:pulse, position:"relative" }}>
        <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:CREAM, padding:2,
          display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          <div style={{
            width:"100%", height:"100%", borderRadius:"50%",
            background: isSeen ? "rgba(26,26,46,0.06)" : `linear-gradient(135deg,rgba(22,215,197,0.10),rgba(255,138,107,0.10))`,
            display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden", fontSize:20, color:TEAL, fontWeight:700, position:"relative",
          }}>
            {avatar
              ? <img src={avatar} alt={name} loading="lazy"
                  style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}
                  onError={e => { e.target.style.display="none"; }} />
              : (name?.[0] || "?").toUpperCase()
            }
            {isYou && isEmpty && (
              <div style={{
                position:"absolute", bottom:-1, right:-1, width:20, height:20,
                borderRadius:"50%", background:TEAL, border:`2px solid ${CREAM}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:"#fff", fontWeight:900, lineHeight:1,
              }}>+</div>
            )}
            {!isYou && !isEmpty && presenceStatus && presenceStatus !== "offline" && (
              <div style={{ position:"absolute", bottom:-1, right:-1 }}>
                <PresenceDot status={presenceStatus} size={11} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Label */}
      <div style={{
        fontSize:11, fontWeight: (isSeen && !isYou) ? 400 : 600,
        color: (isSeen && !isYou) ? INK3 : INK,
        maxWidth:62, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center",
      }}>
        {isYou && isEmpty ? "Dein Moment" : name}
      </div>
      {isLive && (
        <div style={{ fontSize:9, fontWeight:800, color:"#fff", background:CORAL,
          borderRadius:4, padding:"1px 5px", letterSpacing:0.5, marginTop:-4 }}>LIVE</div>
      )}
    </button>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
function Skel({ delay }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,
      animation:`huiSBIn 0.32s ${delay}s both`, opacity:0.45 }}>
      <div style={{ width:58,height:58,borderRadius:"50%",background:"rgba(26,26,46,0.07)" }} />
      <div style={{ width:40,height:7,borderRadius:4,background:"rgba(26,26,46,0.07)" }} />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function ownSlot(user) {
  if (!user?.id) return [];
  return [{
    userId: user.id,
    name:   user.user_metadata?.username || user.user_metadata?.display_name || "Dein Moment",
    avatar: user.user_metadata?.avatar_url || null,
    isLive: false, isYou: true, stories: [],
  }];
}
