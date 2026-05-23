// src/pages/wirker-profile/index.jsx — Phase 24 FINAL
// Creator Operating System — complete rebuild
// Hierarchy: Hero → Identity → Stats → Experiences → Earnings → Spaces → Moments+Community

import React, { useState, useCallback, useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useAuth }     from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";

import { useWirkerProfile }  from "./hooks/useWirkerProfile";
import { usePresenceBridge } from "./hooks/usePresenceBridge";
import { useBookingState }   from "./hooks/useBookingState";

import WirkerHero           from "../../components/wirker-profile/WirkerHero.jsx";
import WirkerIdentity       from "../../components/wirker-profile/WirkerIdentity.jsx";
import WirkerResonanceStats from "../../components/wirker-profile/WirkerResonanceStats.jsx";
import WirkerExperiences    from "../../components/wirker-profile/WirkerExperiences.jsx";
import WirkerEarningsPanel  from "../../components/wirker-profile/WirkerEarningsPanel.jsx";
import WirkerSpaces         from "../../components/wirker-profile/WirkerSpaces.jsx";
import WirkerMoments        from "../../components/wirker-profile/WirkerMoments.jsx";
import WirkerFloatingBook   from "../../components/wirker-profile/WirkerFloatingBook.jsx";

import { isProfileReady } from "./utils/profileGuards";

const GLOBAL_CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar { display:none; }
  @keyframes pulse {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:.55;transform:scale(.8)}
  }
`;

export default function WirkerProfilePage({ wirker: rawWirker, onClose, onBook, onChat }) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const safeRaw = useMemo(() => createProfileItem(rawWirker), [
    rawWirker?.id, rawWirker?.user_id, rawWirker?.username,
  ]);
  const { profile, experiences, loading } = useWirkerProfile(safeRaw?._raw || rawWirker);
  const { presenceStatus }                = usePresenceBridge(profile?.id ?? null);
  const { followed, followLoading, toggleFollow, bookable } =
    useBookingState({ profile, user });

  const handleClose = useCallback(() => { onClose?.() || navigate(-1); }, [onClose, navigate]);
  const handleChat  = useCallback(() => { onChat?.(profile); }, [onChat, profile]);
  const handleBook  = useCallback((exp) => { onBook?.(profile, exp); }, [onBook, profile]);
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: profile?.display_name || "HUI Creator", url: window.location.href }).catch(()=>{});
    }
  }, [profile]);

  /* Loading */
  if (loading && !profile) {
    return (
      <div style={{
        width:"100%",minHeight:"100svh",background:"#F9F7F4",
        display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,
      }}>
        <div style={{fontSize:32}}>✨</div>
        <div style={{fontSize:14,fontWeight:600,color:"#888"}}>Creator-Universum ladt...</div>
      </div>
    );
  }

  /* Not found */
  if (!loading && !isProfileReady(profile)) {
    return (
      <div style={{
        width:"100%",minHeight:"100svh",background:"#F9F7F4",
        display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,
      }}>
        <div style={{fontSize:36}}>🌱</div>
        <div style={{fontSize:15,fontWeight:700,color:"#333"}}>Profil nicht gefunden</div>
        <button onClick={handleClose} style={{
          background:"#0DC4B5",color:"white",border:"none",
          borderRadius:99,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer",
        }}>Zuruck</button>
      </div>
    );
  }

  return (
    <div style={{
      width:"100%",
      minHeight:"100svh",
      background:"#F9F7F4",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      overflowX:"hidden",
      paddingBottom:100,
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* 1. HERO — compact, alive, immersive */}
      <WirkerHero
        profile={profile}
        presenceStatus={presenceStatus}
        onClose={handleClose}
        onChat={handleChat}
        onBook={handleBook}
      />

      {/* 2. IDENTITY STRIP */}
      <WirkerIdentity
        profile={profile}
        followed={followed}
        followLoading={followLoading}
        onFollow={toggleFollow}
        onChat={handleChat}
        onShare={handleShare}
      />

      {/* 3. RESONANCE STATS — emotional, not KPI */}
      <WirkerResonanceStats profile={profile} />

      {/* 4. EXPERIENCES — most important section */}
      <WirkerExperiences experiences={experiences} onBook={handleBook} />

      {/* 5. EARNINGS + IMPACT */}
      <WirkerEarningsPanel profile={profile} bookings={null} />

      {/* 6. WORLD PORTALS */}
      <WirkerSpaces spaces={profile?.spaces ?? null} onEnterSpace={() => {}} />

      {/* 7. MOMENTS + COMMUNITY */}
      <WirkerMoments
        moments={profile?.moments ?? null}
        community={profile?.supporters ?? null}
        onSeeAll={() => {}}
        onSeeAllCommunity={() => {}}
      />

      {/* FLOATING CTA */}
      {bookable && <WirkerFloatingBook profile={profile} onBook={handleBook} />}
    </div>
  );
}
