// src/pages/creator-profile/index.jsx — Phase 24 FINAL
// THIS IS THE COMPONENT THAT ACTUALLY RENDERS (owner view via ProfileLauncher)
// Previous version: CreatorHero + tabs with huge empty space → REPLACED
// Now: Phase 24 Creator Operating System — same structure as WirkerProfilePage

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";

// Re-use Phase 24 wirker components (they are profile-agnostic)
import WirkerHero           from "../../components/wirker-profile/WirkerHero.jsx";
import WirkerIdentity       from "../../components/wirker-profile/WirkerIdentity.jsx";
import WirkerResonanceStats from "../../components/wirker-profile/WirkerResonanceStats.jsx";
import WirkerExperiences    from "../../components/wirker-profile/WirkerExperiences.jsx";
import WirkerEarningsPanel  from "../../components/wirker-profile/WirkerEarningsPanel.jsx";
import WirkerSpaces         from "../../components/wirker-profile/WirkerSpaces.jsx";
import WirkerMoments        from "../../components/wirker-profile/WirkerMoments.jsx";

const GLOBAL_CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar { display:none; }
  @keyframes pulse {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:.55;transform:scale(.8)}
  }
`;

// ── OWNER EDIT BUTTON (top-right — only in owner view) ──────────
function EditFAB({ onAction }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={()=>setPressed(true)}
      onPointerUp={()=>{setPressed(false);onAction?.("edit");}}
      onPointerLeave={()=>setPressed(false)}
      style={{
        position:"fixed",
        bottom: "max(88px, calc(80px + env(safe-area-inset-bottom, 0px)))",
        right:18,
        zIndex:9200,
        background:"linear-gradient(135deg,#0DC4B5,#22DDD0)",
        border:"none",borderRadius:99,
        padding:"12px 20px",
        color:"white",fontSize:13,fontWeight:700,
        boxShadow:"0 6px 20px rgba(13,196,181,.40)",
        cursor:"pointer",
        transform:pressed?"scale(.95)":"scale(1)",
        transition:"transform .15s ease",
        touchAction:"manipulation",
        display:"flex",alignItems:"center",gap:8,
      }}
    >
      <span>✏️</span> Profil bearbeiten
    </button>
  );
}

// ── DEBUG BANNER — remove after confirming render ───────────────
function DebugBanner() {
  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,zIndex:99999,
      background:"#FF3333",color:"white",
      fontSize:11,fontWeight:800,textAlign:"center",
      padding:"5px 8px",letterSpacing:1,
      pointerEvents:"none",
    }}>
      PHASE 24 CREATOR PROFILE ACTIVE
    </div>
  );
}

export default function CreatorProfilePage({
  wirker:  rawWirker,
  profile: externalProfile,
  onClose,
  onAction,
}) {
  const raw     = externalProfile || rawWirker || {};
  const safe    = useMemo(() => createProfileItem(raw), [raw?.id, raw?.user_id]);
  const profile = safe?._raw || raw;

  const handleClose  = useCallback(() => { onClose?.(); }, [onClose]);
  const handleAction = useCallback((k) => { onAction?.(k); }, [onAction]);

  // Owner view: no booking/chat
  const handleBook = useCallback(() => { onAction?.("book"); }, [onAction]);
  const handleChat = useCallback(() => { onAction?.("chat"); }, [onAction]);
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: profile?.display_name || "Mein HUI Profil", url: window.location.href }).catch(()=>{});
    }
  }, [profile]);

  return (
    <div style={{
      position:"fixed",
      inset:0,
      zIndex:9500,
      overflowY:"auto",
      overflowX:"hidden",
      background:"#F9F7F4",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      WebkitOverflowScrolling:"touch",
      paddingBottom:120,
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* RED BANNER — confirms Phase 24 is rendering */}
      <DebugBanner />

      {/* 1. HERO */}
      <WirkerHero
        profile={profile}
        presenceStatus={profile?.presence_status || null}
        onClose={handleClose}
        onChat={handleChat}
        onBook={handleBook}
      />

      {/* 2. IDENTITY STRIP */}
      <WirkerIdentity
        profile={profile}
        followed={false}
        followLoading={false}
        onFollow={null}
        onChat={handleChat}
        onShare={handleShare}
      />

      {/* 3. RESONANCE STATS */}
      <WirkerResonanceStats profile={profile} />

      {/* 4. EXPERIENCES */}
      <WirkerExperiences experiences={null} onBook={handleBook} />

      {/* 5. EARNINGS */}
      <WirkerEarningsPanel profile={profile} bookings={null} />

      {/* 6. WORLD PORTALS */}
      <WirkerSpaces spaces={null} onEnterSpace={() => {}} />

      {/* 7. MOMENTS + COMMUNITY */}
      <WirkerMoments
        moments={null}
        community={null}
        onSeeAll={() => {}}
        onSeeAllCommunity={() => {}}
      />

      {/* Owner Edit FAB */}
      <EditFAB onAction={handleAction} />
    </div>
  );
}
