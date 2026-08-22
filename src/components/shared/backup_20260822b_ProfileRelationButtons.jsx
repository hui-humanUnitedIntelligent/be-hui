// src/components/shared/ProfileRelationButtons.jsx
// CHAT-LOGIK-v2 (2026-08-22, Michael-Vorgabe): Der "Verbinden"-Button
// (öffnete bisher ungated einen Chat mit JEDEM Profil) wurde entfernt.
// Grund: Chat ist ab sofort AUSSCHLIESSLICH nach Buchung/Kauf (Werk, Talent,
// Erlebnis) verfügbar und öffnet automatisch nach erfolgter Bezahlung —
// nicht mehr per Klick von einem beliebigen öffentlichen Profil aus.
// "Inspirierende Menschen" (kein Buchungsverhältnis) sehen daher nur noch
// den "Folgen"-Button, keine Möglichkeit sich zu "verbinden"/zu chatten.
//
// WICHTIG: Dieser Chat-Entry-Point ist damit entfernt, ABER die tiefere
// Absicherung (chats.insert nur mit gültiger booking_id / RLS-Check) ist
// NICHT Teil dieser Änderung — findOrCreateChat() in chatContext.js erlaubt
// weiterhin bookingId=null und wird u.a. auch von ChatCenterOverlay.jsx
// ("neuer Chat" Flow) u. StoryBar.jsx aufgerufen. Das ist ein separater,
// größerer Härtungs-Task (DB/RLS-Änderung) — hier bewusst nicht angefasst,
// um keine bestehende Chat-Funktionalität ungeprüft zu brechen.
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";

const T = {
  tealDeep: "#0AA89B",
  bgCard:   "#fff",
  inkSoft:  "rgba(26,26,46,0.50)",
  border:   "rgba(26,26,46,0.08)",
  r99:      99,
  px:       20,
};

export default function ProfileRelationButtons({
  profileId    = "",
  currentUserId = "",
  profile       = {},
  onFollowChange,
  onClose, // eslint-disable-line no-unused-vars -- Signatur bewusst beibehalten (Aufrufer übergeben ihn weiterhin)
}) {
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
        } else {
          // FIX (2026-08-13): Follow zaehlt in rpc_get_orb_growth_stage als
          // Aktivitaet des Followers (currentUserId) -> Cache invalidieren,
          // sonst haengt der Orb bis zu 5 Min. auf altem Wert.
          invalidateOrbStageCache(currentUserId);
        }
      }
    } catch(e) {
      console.warn("[Follow] exception:", e);
      setIsFollowing(prevFollowing);
    }
    finally { setFollowLoading(false); }
  };

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
      {/* Folgen — einziger Aktions-Button (Verbinden entfernt, siehe CHAT-LOGIK-v2) */}
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
