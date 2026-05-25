import { createProfileItem } from "../../../lib/factories/createProfileItem.js";
import { S } from "../../../core/hui.sources.js";
// src/components/home/profile/ProfileLauncher.jsx v5
// ROUTING: showWirker._isOwnerView === true → CreatorProfilePage
//          sonst                           → WirkerProfilePage
// WICHTIG: CreatorProfilePage ist STATISCH importiert (kein lazy) → kein Suspense-Blackout

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";

// ── STATISCH: sofort verfügbar, kein lazy-Blackout ──────────────
// CreatorProfilePage wird immer mitgeladen (Teil des Home-Chunks)
import CreatorProfilePage from "../../../pages/creator-profile/index.jsx";

// ── LAZY: WirkerProfilePage nur bei Bedarf (~140KB) ─────────────
const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

/* ── Loading Fallback ── */
function ProfileLoadingFallback() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      background:"#F9F7F4",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{ opacity:0.25, fontSize:13, color:"#888" }}>Lade Profil…</div>
    </div>
  );
}

/* ── Hook: imperativer Zugriff ── */
export function useProfileLauncher() {
  useHome();
  const actions = useHuiActions();

  const openProfile = useCallback((data) => {
    if (!data) return;
    // Push source surface so Return weiß woher wir kamen
    actions[A.OPEN_PROFILE]?.({ creator: data, source: S.SYSTEM });
  }, [actions]);

  const openOwnProfile = useCallback(() => {
    actions[A.OPEN_OWN_PROFILE]?.();
  }, [actions]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    actions[A.OPEN_PROFILE]?.({ creatorId: id, source: S.SYSTEM, ...extra });
  }, [actions]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* ════════════════════════════════════════════════════════════
   ProfileLauncher — einziger Render-Punkt für alle Profile
   ════════════════════════════════════════════════════════════ */
export default function ProfileLauncher() {
  const {
    showWirker,
    showChat,
  } = useHome();
  const actions = useHuiActions();

  // Nichts anzeigen wenn kein Profil offen
  if (!showWirker) return null;

  // showWirker normalisieren — kann rohe nav-Daten enthalten
  const safeProfile = createProfileItem(showWirker);

  const isOwnerView = showWirker._isOwnerView === true;

  const handleClose = () => actions[A.CLOSE_PROFILE]?.({ source: S.VISITOR_PROFILE });

  // Phase 2 LOOP 1: Chat vom Profil aus — Flow Memory
  const handleChat = (profile) => {
    const recipient = {
      id:           profile?.id || profile?.user_id,
      display_name: profile?.display_name || profile?.full_name || profile?.name || "Creator",
      avatar_url:   profile?.avatar_url   || profile?.img       || null,
      talent:       profile?.talent       || null,
    };
    actions[A.OPEN_CHAT]?.({
      source: S.VISITOR_PROFILE,
      recipient,
      returnProfile: showWirker,
    });
    // Phase 2 LOOP 1: Profil NICHT schließen.
    // _zIndex wird auf 9200 gesetzt wenn showChat=true (Chat liegt drüber bei 9400).
    // setShowWirker(null) hier entfernt — Chat-Close restored das Profil.
  };

  // Phase 23: Buchen → ConnectionCreate (Booking-Request) oder direkter Chat
  const handleBook = (profile) => {
    // Buchen = Verbindungs-Request mit Booking-Intent
    actions[A.OPEN_BOOKING]?.({
      source: S.VISITOR_PROFILE,
      recipient: {
        id:           profile?.id || profile?.user_id,
        display_name: profile?.display_name || profile?.full_name || profile?.name || "Creator",
        avatar_url:   profile?.avatar_url   || profile?.img       || null,
      },
    });
  };

  // ── OWNER VIEW → CreatorProfilePage (statisch, sofort) ──────
  if (isOwnerView) {
    return (
      <CreatorProfilePage
        wirker={showWirker}
        onClose={handleClose}
      />
    );
  }

  // ── PUBLIC VIEW → WirkerProfilePage (lazy) ──────────────────
  return (
    <React.Suspense fallback={<ProfileLoadingFallback />}>
      <WirkerProfilePage
        wirker={showWirker}
        onClose={handleClose}
        onBook={handleBook}
        onChat={handleChat}
        _zIndex={showChat ? 9200 : 9500}
      />
    </React.Suspense>
  );
}
