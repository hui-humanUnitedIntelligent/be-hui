// src/pages/wirker-profile/index.jsx v3
// HUI Public Wirker Profile — Screenshot-exact nach Mia Kern Design
// PUBLIC VIEW ONLY — _isOwnerView === false
//
// REGEL: Keine Owner-Actions. Kein Edit. Kein Dashboard.
// REGEL: Alle neuen Komponenten aus components/wirker-profile/

import React, { useState, useCallback } from "react";
import { useAuth }     from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Vorhandene Hooks (unverändert) ───────────────────────────
import { useWirkerProfile }  from "./hooks/useWirkerProfile";
import { usePresenceBridge } from "./hooks/usePresenceBridge";
import { useBookingState }   from "./hooks/useBookingState";

// ── NEUE Komponenten ─────────────────────────────────────────
import WirkerHero           from "../../components/wirker-profile/WirkerHero.jsx";
import WirkerIdentity       from "../../components/wirker-profile/WirkerIdentity.jsx";
import WirkerConnectionCard from "../../components/wirker-profile/WirkerConnectionCard.jsx";
import WirkerBio            from "../../components/wirker-profile/WirkerBio.jsx";
import WirkerSpaces         from "../../components/wirker-profile/WirkerSpaces.jsx";
import WirkerTabContent     from "../../components/wirker-profile/WirkerTabContent.jsx";
import WirkerFloatingBook   from "../../components/wirker-profile/WirkerFloatingBook.jsx";

/* ── Guards (bewahrt) ────────────────────────────────────────── */
import { isProfileReady } from "./utils/profileGuards";

/* ── CSS ─────────────────────────────────────────────────────── */
const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
`;

/**
 * WirkerProfilePage — PUBLIC VIEW.
 *
 * Props:
 *   wirker   — rohes Wirker-Objekt aus Navigation / App.jsx route
 *   onClose  — zurück
 *   onBook   — Booking öffnen
 *   onChat   — Chat öffnen
 */
export default function WirkerProfilePage({
  wirker: rawWirker,
  onClose,
  onBook,
  onChat,
}) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  /* ── Daten ── */
  const { profile, works, experiences, loading } = useWirkerProfile(rawWirker);
  const { presenceStatus, presenceInfo }         = usePresenceBridge(profile?.id ?? null);
  const { followed, followLoading, toggleFollow, bookable } =
    useBookingState({ profile, user });

  /* ── UI State ── */
  const [activeTab, setActiveTab] = useState("bewegung");
  const [showMore,  setShowMore]  = useState(false);

  /* ── Handlers ── */
  const handleClose = useCallback(() => { onClose?.() || navigate(-1); }, [onClose, navigate]);
  const handleChat  = useCallback(() => { if (onChat) onChat(profile); }, [onChat, profile]);
  const handleBook  = useCallback(() => { if (onBook) onBook(profile); }, [onBook, profile]);

  /* ── Loading ── */
  if (loading && !profile) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:9500,
        background:"#F9F7F4",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ fontSize:13, color:"rgba(80,80,80,0.35)" }}>Laden\u2026</div>
      </div>
    );
  }

  if (!isProfileReady(profile)) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:9500,
        background:"#F9F7F4",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:12,
      }}>
        <div style={{ fontSize:36, opacity:0.25 }}>\u2726</div>
        <div style={{ fontSize:13, color:"rgba(80,80,80,0.4)" }}>Profil nicht gefunden</div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     9500,
      background: "#F9F7F4",
      display:    "flex",
      flexDirection: "column",
      overflow:   "hidden",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>

      {/* Scrollable main area */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
      }}>

        {/* 1. Cinematic Hero */}
        <WirkerHero
          profile={profile}
          onClose={handleClose}
          onMore={() => setShowMore(true)}
        />

        {/* 2. Identity: Name, Stats, Mood */}
        <WirkerIdentity profile={profile}/>

        {/* 3. Connection Actions */}
        <WirkerConnectionCard
          profile={profile}
          followed={followed}
          followLoading={followLoading}
          onChat={handleChat}
          onFollow={toggleFollow}
          onBook={handleBook}
        />

        {/* 4. Bio */}
        <WirkerBio profile={profile} onBook={handleBook} bookable={bookable}/>

        {/* 5. Creative Spaces */}
        <WirkerSpaces/>

        {/* 6. Tabs + Content */}
        <WirkerTabContent
          activeTab={activeTab}
          onTabChange={setActiveTab}
          works={works}
          experiences={experiences}
        />

        {/* Bottom padding for sticky bar */}
        <div style={{ height:20 }}/>
      </div>

      {/* 7. Sticky Floating CTA */}
      <WirkerFloatingBook
        profile={profile}
        onBook={handleBook}
        onFollow={toggleFollow}
        followed={followed}
      />
    </div>
  );
}
