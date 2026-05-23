// src/pages/wirker-profile/index.jsx — Phase 24: Creator Operating System
// "A living creator universe where humans can discover, trust, experience, book, support, and emotionally connect."
// RULES: null-safe everywhere · HUI DNA only · no runtime crashes

import React, { useState, useCallback, useMemo } from "react";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useAuth }     from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Hooks ─────────────────────────────────────────────────────
import { useWirkerProfile }  from "./hooks/useWirkerProfile";
import { usePresenceBridge } from "./hooks/usePresenceBridge";
import { useBookingState }   from "./hooks/useBookingState";

// ── Phase 24: Creator OS Sections ─────────────────────────────
import WirkerHero           from "../../components/wirker-profile/WirkerHero.jsx";
import WirkerIdentity       from "../../components/wirker-profile/WirkerIdentity.jsx";
import WirkerResonanceStats from "../../components/wirker-profile/WirkerResonanceStats.jsx";
import WirkerExperiences    from "../../components/wirker-profile/WirkerExperiences.jsx";
import WirkerEarningsPanel  from "../../components/wirker-profile/WirkerEarningsPanel.jsx";
import WirkerSpaces         from "../../components/wirker-profile/WirkerSpaces.jsx";
import WirkerMoments        from "../../components/wirker-profile/WirkerMoments.jsx";
import WirkerCommunity      from "../../components/wirker-profile/WirkerCommunity.jsx";
import WirkerFloatingBook   from "../../components/wirker-profile/WirkerFloatingBook.jsx";

// ── Guards ────────────────────────────────────────────────────
import { isProfileReady } from "./utils/profileGuards";

const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  .hui-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .hui-scroll::-webkit-scrollbar { display:none; }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.6; transform:scale(0.85); }
  }
`;

/**
 * WirkerProfilePage — Phase 24 Creator Operating System
 *
 * Props:
 *   wirker   — raw Wirker object from navigation
 *   onClose  — back navigation
 *   onBook   — open booking flow
 *   onChat   — open chat
 */
export default function WirkerProfilePage({
  wirker: rawWirker,
  onClose,
  onBook,
  onChat,
}) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  // ── Data ──────────────────────────────────────────────────────
  const safeRawWirker = useMemo(() => createProfileItem(rawWirker), [
    rawWirker?.id, rawWirker?.user_id, rawWirker?.username,
  ]);
  const { profile, works, experiences, loading } = useWirkerProfile(safeRawWirker?._raw || rawWirker);
  const { presenceStatus }                        = usePresenceBridge(profile?.id ?? null);
  const { followed, followLoading, toggleFollow, bookable } =
    useBookingState({ profile, user });

  // ── Handlers ──────────────────────────────────────────────────
  const handleClose = useCallback(() => { onClose?.() || navigate(-1); }, [onClose, navigate]);
  const handleChat  = useCallback(() => { onChat?.(profile); }, [onChat, profile]);
  const handleBook  = useCallback((exp) => { onBook?.(profile, exp); }, [onBook, profile]);
  const handleShare = useCallback(() => {
    if (navigator.share && profile?.display_name) {
      navigator.share({ title: profile.display_name, url: window.location.href }).catch(() => {});
    }
  }, [profile]);

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading && !profile) {
    return (
      <div style={{
        width: "100%", minHeight: "100svh",
        background: "#F9F7F4",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Creator-Universum lädt…</div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!loading && !isProfileReady(profile)) {
    return (
      <div style={{
        width: "100%", minHeight: "100svh",
        background: "#F9F7F4",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontSize: 36 }}>🌱</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#333" }}>Profil nicht gefunden</div>
        <button
          onClick={handleClose}
          style={{
            marginTop: 8, background: "#0DC4B5", color: "white",
            border: "none", borderRadius: 99, padding: "10px 24px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >Zurück</button>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      minHeight: "100svh",
      background: "#F9F7F4",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      overflowX: "hidden",
      paddingBottom: 120,
    }}>
      <style>{CSS}</style>

      {/* ── 1. HERO — The Creator World ── */}
      <WirkerHero
        profile={profile}
        presenceStatus={presenceStatus}
        onClose={handleClose}
        onChat={handleChat}
        onBook={handleBook}
      />

      {/* ── 2. IDENTITY STRIP ── */}
      <WirkerIdentity
        profile={profile}
        followed={followed}
        followLoading={followLoading}
        onFollow={toggleFollow}
        onChat={handleChat}
        onShare={handleShare}
      />

      {/* ── 3. RESONANCE STATS ── */}
      <WirkerResonanceStats profile={profile} />

      {/* ── 4. EXPERIENCES / ANGEBOTE ── */}
      <WirkerExperiences
        experiences={experiences}
        onBook={handleBook}
      />

      {/* ── 5. EARNINGS + IMPACT (nur wenn owner oder trusted) ── */}
      <WirkerEarningsPanel profile={profile} bookings={null} />

      {/* ── 6. RÄUME / WELTEN ── */}
      <WirkerSpaces
        spaces={profile?.spaces ?? null}
        onEnterSpace={(world) => { /* future: navigate to world */ }}
      />

      {/* ── 7. MOMENTS / SOCIAL LAYER ── */}
      <WirkerMoments
        moments={profile?.moments ?? null}
        onSeeAll={() => { /* future */ }}
      />

      {/* ── 8. COMMUNITY LAYER ── */}
      <WirkerCommunity
        community={profile?.supporters ?? null}
        onSeeAll={() => { /* future */ }}
      />

      {/* ── FLOATING BOOK BUTTON ── */}
      {bookable && (
        <WirkerFloatingBook
          profile={profile}
          onBook={handleBook}
        />
      )}
    </div>
  );
}
