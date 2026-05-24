import { createProfileItem } from "../../../lib/factories/createProfileItem.js";
// src/components/home/profile/ProfileLauncher.jsx v5
// ROUTING: showWirker._isOwnerView === true → CreatorProfilePage
//          sonst                           → WirkerProfilePage
// WICHTIG: CreatorProfilePage ist STATISCH importiert (kein lazy) → kein Suspense-Blackout

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { useHuiFlow } from "../../../core/hui.flow.js";

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
    // Push source surface so Return weiß woher wir kamen
    actions[A.OPEN_PROFILE]?.({ creator: data, source: "system" });
  }, [actions]);

  const openOwnProfile = useCallback(() => {
    actions[A.OPEN_OWN_PROFILE]?.();
  }, [actions]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    actions[A.OPEN_PROFILE]?.({ creatorId: id, source: "system", ...extra });
  }, [actions]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* ════════════════════════════════════════════════════════════
   ProfileLauncher — einziger Render-Punkt für alle Profile
   ════════════════════════════════════════════════════════════ */
export default function ProfileLauncher() {
  const {
    showWirker, setShowWirker,
    showChat,
    setShowChat, setChatRecipient,
    setShowConnect,             // für "Buchen" → ConnectionCreate als Alternative
  } = useHome();

  // Phase 2: Flow Memory — merkt sich den Weg zurück
  const flow = useHuiFlow();

  // Nichts anzeigen wenn kein Profil offen
  if (!showWirker) return null;

  // showWirker normalisieren — kann rohe nav-Daten enthalten
  const safeProfile = createProfileItem(showWirker);

  const isOwnerView = showWirker._isOwnerView === true;

  const handleClose = () => setShowWirker(null);

  // Phase 2 LOOP 1: Chat vom Profil aus — Flow Memory
  const handleChat = (profile) => {
    const recipient = {
      id:           profile?.id || profile?.user_id,
      display_name: profile?.display_name || profile?.full_name || profile?.name || "Creator",
      avatar_url:   profile?.avatar_url   || profile?.img       || null,
      talent:       profile?.talent       || null,
    };
    // Flow Memory: merkt sich dieses Profil für den Return
    // Nach Chat-Close wird das Profil wieder geöffnet (LOOP 1)
    flow.setReturnProfile(showWirker);
    flow.push({ surface: "profile", creatorId: profile?.id, creator: showWirker });

    setChatRecipient(recipient);
    setShowChat(true);
    // Phase 2 LOOP 1: Profil NICHT schließen.
    // _zIndex wird auf 9200 gesetzt wenn showChat=true (Chat liegt drüber bei 9400).
    // setShowWirker(null) hier entfernt — Chat-Close restored das Profil.
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
        _zIndex={showChat ? 9200 : 9500}
      />
    </React.Suspense>
  );
}
