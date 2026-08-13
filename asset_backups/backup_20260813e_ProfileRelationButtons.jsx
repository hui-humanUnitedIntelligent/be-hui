// src/components/shared/ProfileRelationButtons.jsx
// Kompakte "Verbinden" + "Folgen"-Buttons für ALLE öffentlichen Profile.
// Nebeneinander, klein, wiederverwendbar.
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useHome } from "../home/HomeShell.jsx";

const T = {
  teal:     "#0DC4B5",
  tealDeep: "#0AA89B",
  glow:     "0 4px 18px rgba(13,196,181,0.28)",
  card:     "0 1px 6px rgba(26,26,46,0.07)",
  border:   "rgba(26,26,46,0.08)",
  bgCard:   "#fff",
  inkSoft:  "rgba(26,26,46,0.50)",
  r99:      99,
  px:       20,
};

export default function ProfileRelationButtons({
  profileId    = "",
  currentUserId = "",
  profile       = {},
  onFollowChange,
  onClose,
}) {
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isConnected,   setIsConnected]   = useState(false);
  const { setShowChat, setChatRecipient } = useHome?.() || {};

  const displayName = profile?.display_name || profile?.full_name || profile?.username || "diese Person";
  const shortName   = displayName.split(" ")[0] || displayName;

  // Prüfe ob bereits gefolgt
  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase.from("follows").select("follower_id")
      .eq("follower_id", currentUserId).eq("followed_id", profileId)
      .maybeSingle().then(({ data, error }) => {
        if (error) { console.warn("[Follow] check error:", error.message); return; }
        setIsFollowing(!!data);
      }).catch(() => {});
  }, [profileId, currentUserId]);

  // Prüfe ob bereits verbunden (gegenseitig)
  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase.from("follows").select("follower_id")
      .eq("follower_id", profileId).eq("followed_id", currentUserId)
      .maybeSingle().then(({ data, error }) => {
        if (error) { console.warn("[Follow] connected check error:", error.message); return; }
        if (data) setIsConnected(true);
      }).catch(() => {});
  }, [profileId, currentUserId, isFollowing]);

  if (!currentUserId || profileId === currentUserId) return null;

  const handleFollow = async (e) => {
    e?.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    try {
      if (isFollowing) {
        // Optimistic update
        setIsFollowing(false);
        onFollowChange?.(-1);
        const { error } = await supabase.from("follows").delete()
          .eq("follower_id", currentUserId).eq("followed_id", profileId);
        if (error) {
          // Rollback
          console.warn("[Follow] delete error:", error.message);
          setIsFollowing(true);
          onFollowChange?.(+1);
        }
      } else {
        // Optimistic update
        setIsFollowing(true);
        onFollowChange?.(+1);
        const { error } = await supabase.from("follows")
          .upsert({ follower_id: currentUserId, followed_id: profileId }, { onConflict: "follower_id,followed_id", ignoreDuplicates: true });
        if (error) {
          // Rollback
          console.warn("[Follow] upsert error:", error.message);
          setIsFollowing(false);
          onFollowChange?.(-1);
        }
      }
    } catch(e) {
      console.warn("[Follow] exception:", e);
      setIsFollowing(prevFollowing);
    }
    finally { setFollowLoading(false); }
  };

  const handleChat = (e) => {
    e?.stopPropagation();
    if (!profile?.id || !setShowChat) return;
    setChatRecipient?.({
      id: profile.id,
      display_name: profile.display_name || profile.username || "Mitglied",
      avatar_url: profile.avatar_url || null,
    });
    if (onClose) onClose();   // Profil schließen
    setShowChat?.(true);      // Chat öffnen
  };

  const connected = isFollowing && isConnected;

  const btnBase = {
    flex:1, height:36, borderRadius:T.r99,
    fontWeight:600, fontSize:12, cursor:"pointer",
    touchAction:"manipulation", fontFamily:"inherit",
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    transition:"all .18s ease", whiteSpace:"nowrap", overflow:"hidden",
    paddingLeft:10, paddingRight:12, border:"none",
  };

  return (
    <div style={{ display:"flex", flexDirection:"row", gap:8, padding:`0 ${T.px}px`, marginBottom:4 }}>
      {/* Verbinden */}
      <button onClick={handleChat} className="ppp-press" style={{
        ...btnBase,
        background: connected ? T.bgCard : T.teal,
        border: connected ? `1.5px solid ${T.border}` : "none",
        color: connected ? T.inkSoft : "#fff",
        boxShadow: connected ? T.card : T.glow,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{connected ? "Verbunden" : "Verbinden"}</span>
      </button>

      {/* Folgen */}
      <button onClick={handleFollow} disabled={followLoading} className="ppp-press" style={{
        ...btnBase,
        background: isFollowing ? T.bgCard : "transparent",
        border: `1.5px solid ${isFollowing ? T.border : T.tealDeep}`,
        color: isFollowing ? T.inkSoft : T.tealDeep,
        opacity: followLoading ? 0.6 : 1,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          {isFollowing
            ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
            : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
          }
        </svg>
        <span>{isFollowing ? "Gefolgt" : `${shortName} folgen`}</span>
      </button>
    </div>
  );
}
