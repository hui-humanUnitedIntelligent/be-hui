// src/lib/useFollowSystem.js — Phase 3D
// ══════════════════════════════════════════════════════════════
// Follow/Unfollow with optimistic UI.
// Uses follows table (follower_id, followed_id) from migration 032.
// NEVER throws — always has silent fallback.
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

export function useFollowSystem(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setChecked(true); return;
    }

    async function check() {
      try {
        const [{ data: followRow }, { count }] = await Promise.all([
          supabase.from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("followed_id", targetUserId)
            .maybeSingle(),
          supabase.from("follows")
            .select("*", { count: "exact", head: true })
            .eq("followed_id", targetUserId),
        ]);
        setIsFollowing(!!followRow);
        setFollowerCount(count ?? null);
      } catch { /* silent */ } finally {
        setChecked(true);
      }
    }
    check();
  }, [currentUserId, targetUserId]);

  const toggle = useCallback(async () => {
    if (!currentUserId || !targetUserId || loading) return;
    setLoading(true);

    // Optimistic
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount(n => n == null ? null : n + (wasFollowing ? -1 : 1));

    try {
      if (wasFollowing) {
        await supabase.from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", targetUserId);
      } else {
        await supabase.from("follows")
          .upsert({ follower_id: currentUserId, followed_id: targetUserId },
                  { onConflict: "follower_id,followed_id" });
      }
    } catch {
      // Roll back optimistic
      setIsFollowing(wasFollowing);
      setFollowerCount(n => n == null ? null : n + (wasFollowing ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing, loading]);

  return { isFollowing, followerCount, toggle, loading, checked };
}

// ── FollowButton component ────────────────────────────────────
export function FollowButton({ currentUserId, targetUserId, size = "md", onToggle }) {
  const { isFollowing, toggle, loading, checked } =
    useFollowSystem(currentUserId, targetUserId);
  const [pressed, setPressed] = useState(false);

  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return null;
  if (!checked) return (
    <div style={{
      width: size === "sm" ? 64 : 88, height: size === "sm" ? 28 : 34,
      borderRadius: 20, background: "rgba(22,215,197,0.12)",
    }} />
  );

  async function handleClick(e) {
    e.stopPropagation();
    setPressed(true);
    await toggle();
    onToggle?.(!isFollowing);
    setTimeout(() => setPressed(false), 400);
  }

  const pad = size === "sm" ? "5px 14px" : "7px 20px";
  const fs  = size === "sm" ? 12 : 13.5;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: pad, borderRadius: 22, border: "none",
        background: isFollowing
          ? "rgba(26,26,46,0.09)"
          : "linear-gradient(135deg,#16D7C5,#FF8A6B)",
        color: isFollowing ? "rgba(26,26,46,0.6)" : "#fff",
        fontSize: fs, fontWeight: 700,
        cursor: loading ? "default" : "pointer",
        touchAction: "manipulation",
        transform: pressed ? "scale(0.91)" : "scale(1)",
        transition: "transform 0.12s cubic-bezier(.22,1,.36,1), background 0.22s ease",
        willChange: "transform",
        whiteSpace: "nowrap",
        opacity: loading ? 0.75 : 1,
        outline: "none",
      }}
    >
      {loading ? "…" : isFollowing ? "Begleitet" : "+ Begleiten"}
    </button>
  );
}
