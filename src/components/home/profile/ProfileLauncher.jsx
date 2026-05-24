import { createProfileItem } from "../../../lib/factories/createProfileItem.js";
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
  const { setShowWirker, openOwnProfile: shellOpenOwn } = useHome();
  const actions = useHuiActions();

  const openProfile = useCallback((data) => {
    if (!data) return;
    actions[A.OPEN_PROFILE]?.({ creator: data });
  }, [actions]);

  const openOwnProfile = useCallback(() => {
    actions[A.OPEN_OWN_PROFILE]?.();
  }, [actions]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    actions[A.OPEN_PROFILE]?.({ creatorId: id, ...extra });
  }, [actions]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* ════════════════════════════════════════════════════════════
   ProfileLauncher — einziger Render-Punkt für alle Profile
   ════════════════════════════════════════════════════════════ */
export default function ProfileLauncher() {
  const {
    showWirker, setShowWirker,
    setShowChat, setChatRecipient,
    setShowConnect,             // für "Buchen" → ConnectionCreate als Alternative
  } = useHome();

  // Nichts anzeigen wenn kein Profil offen
  if (!showWirker) return null;

  // showWirker normalisieren — kann rohe nav-Daten enthalten
  const safeProfile = createProfileItem(showWirker);

  const isOwnerView = showWirker._isOwnerView === true;

  const handleClose = () => setShowWirker(null);

  // Phase 23: Echte Verbindung — Chat direkt mit diesem Creator öffnen
  const handleChat = (profile) => {
    // Normalisiere Empfänger für ChatCenter
    const recipient = {
      id:           profile?.id || profile?.user_id,
      display_name: profile?.display_name || profile?.full_name || profile?.name || "Creator",
      avatar_url:   profile?.avatar_url   || profile?.img       || null,
      talent:       profile?.talent       || null,
    };
    setChatRecipient(recipient);
    setShowChat(true);
    setShowWirker(null);  // Profil schließen, Chat öffnet sich
  };

  // Phase 23: Buchen → ConnectionCreate (Booking-Request) oder direkter Chat
  const handleBook = (profile) => {
    // Buchen = Verbindungs-Request mit Booking-Intent
    handleChat(profile);  // Vorerst: Chat öffnen (Booking ist Conversation-basiert)
  };

  const handleAction = (key) => { /* Studio, Edit, etc. — erweiterbar */ };

  // ── OWNER VIEW → CreatorProfilePage (statisch, sofort) ──────
  if (isOwnerView) {
    return (
      <CreatorProfilePage
        wirker={showWirker}
        onClose={handleClose}
        onAction={handleAction}
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
      />
    </React.Suspense>
  );
}
