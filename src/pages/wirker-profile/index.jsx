// src/pages/wirker-profile/index.jsx
// WirkerProfile — Root-Orchestrator v2.0
// Modular: Hooks → Sections → Components
// REGEL: Kein direkter Supabase-Write. Kein Business-Logic im JSX.
// REGEL: Alle Hooks top-level, stabile Reihenfolge.

import React, { useState, useCallback } from "react";
import { useAuth }     from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReputation, useRecommendationActions } from "../../lib/trustContext";
import { getTrustSignals }  from "../../lib/bookingContext";
import { getSoftStatus }    from "../../lib/journeyContext";

// ── Eigene Hooks ────────────────────────────────────────────────────
import { useWirkerProfile }  from "./hooks/useWirkerProfile";
import { usePresenceBridge } from "./hooks/usePresenceBridge";
import { useBookingState }   from "./hooks/useBookingState";

// ── Sections ────────────────────────────────────────────────────────
import { HeroSection }     from "./sections/HeroSection";
import { PresenceSection } from "./sections/PresenceSection";
import { GallerySection }  from "./sections/GallerySection";
import { BookingSection }  from "./sections/BookingSection";

// ── Components ──────────────────────────────────────────────────────
import { ProfileHeader } from "./components/ProfileHeader";

// ── Guards ──────────────────────────────────────────────────────────
import { isOwnerProfile, isProfileReady } from "./utils/profileGuards";

/* ── CSS (einmalig, minimal) ─────────────────────────────────────── */
const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
`;

/**
 * WirkerProfilePage — Haupteinstiegspunkt.
 *
 * Props (unverändert — rückwärtskompatibel):
 *  wirker:    object  — rohes Wirker-Objekt aus Navigation
 *  onClose:   fn      — zurück navigieren
 *  onBook:    fn      — Booking-Flow öffnen
 *  onChat:    fn      — Chat öffnen
 *  onImpact:  fn      — Impact-Seite
 *  onMap:     fn      — Karte
 */
export default function WirkerProfilePage({
  wirker: rawWirker,
  onClose,
  onBook,
  onChat,
  onImpact,
  onMap,
}) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  // ── 1. Profildaten ────────────────────────────────────────────────
  const {
    profile, works, experiences, recommendations, loading,
  } = useWirkerProfile(rawWirker);

  // ── 2. Presence ───────────────────────────────────────────────────
  const {
    presenceStatus, presenceInfo,
    hasCreative, showRhythm, showBridge,
    rhythm, continuity, signature,
  } = usePresenceBridge(profile?.id ?? null);

  // ── 3. Booking + Follow State ─────────────────────────────────────
  const {
    showChat,    setShowChat,
    showRequest, setShowRequest,
    showMore,    setShowMore,
    followed,    followLoading,
    toggleFollow, bookable,
  } = useBookingState({ profile, user });

  // ── 4. UI State ───────────────────────────────────────────────────
  const [activeTab,  setActiveTab]  = useState("werke");
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // ── 5. Derived ────────────────────────────────────────────────────
  const isOwner = isOwnerProfile(user, profile);

  // ── 6. Handlers ───────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    onClose?.() || navigate(-1);
  }, [onClose, navigate]);

  const handleBook = useCallback(() => {
    if (onBook) onBook(profile);
    else setShowRequest(true);
  }, [onBook, profile, setShowRequest]);

  const handleChat = useCallback(() => {
    if (onChat) onChat(profile);
    else setShowChat(true);
  }, [onChat, profile, setShowChat]);

  const handleEdit = useCallback(() => {
    setActiveTool("edit");
  }, []);

  const handleWorkPress = useCallback((work) => {
    // Navigation zur Werk-Detail-Seite oder onView
  }, []);

  const handleExpPress = useCallback((exp) => {
    // Navigation zur Erlebnis-Detail
  }, []);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading && !profile) {
    return (
      <div style={{
        minHeight:"100vh", background:"#F9F7F4",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}>
        <div style={{ opacity:0.3, fontSize:13, color:"#888" }}>Laden…</div>
      </div>
    );
  }

  if (!isProfileReady(profile)) {
  if (!isProfileReady(profile)) { }
    return (
      <div style={{
        minHeight:"100vh", background:"#F9F7F4",
        display:"flex", alignItems:"center", justifyContent:"center", padding:40,
        fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ textAlign:"center", opacity:0.4 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>✦</div>
          <div style={{ fontSize:13, color:"#888" }}>Profil nicht gefunden</div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",
      background:"#F9F7F4",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      paddingBottom: isOwner ? 0 : 90,
    }}>
      <style>{CSS}</style>

      {/* ── Sticky Back-Bar ────────────────────────────────────────── */}
      <ProfileHeader
        onClose={handleClose}
        onMore={() => setShowMore(true)}
        isOwner={isOwner}
        heroLoaded={heroLoaded}
      />

      {/* ── Hero: Bild + Avatar + Name + Actions ───────────────────── */}
      <HeroSection
        profile={profile}
        presenceInfo={presenceInfo}
        presenceStatus={presenceStatus}
        isOwner={isOwner}
        followed={followed}
        followLoading={followLoading}
        bookable={bookable}
        onHeroLoad={() => setHeroLoaded(true)}
        onFollow={toggleFollow}
        onChat={handleChat}
        onBook={handleBook}
        onEdit={handleEdit}
      />

      {/* ── Presence: Signatur + Rhythmus + Bridge ─────────────────── */}
      <PresenceSection
        signature={signature}
        rhythm={rhythm}
        continuity={continuity}
        showRhythm={showRhythm}
        showBridge={showBridge}
        hasCreative={hasCreative}
      />

      {/* ── Gallery: Werke / Erlebnisse / Empfehlungen ─────────────── */}
      <GallerySection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        works={works}
        experiences={experiences}
        recommendations={recommendations}
        onWorkPress={handleWorkPress}
        onExpPress={handleExpPress}
      />

      {/* ── Floating Booking CTA ───────────────────────────────────── */}
      <BookingSection
        isOwner={isOwner}
        bookable={bookable}
        profile={profile}
        onBook={handleBook}
      />
    </div>
  );
}