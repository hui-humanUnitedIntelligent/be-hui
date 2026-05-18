// src/components/home/profile/ProfileLauncher.jsx
// ZENTRALER PROFIL-LAUNCHER — einziger Einstiegspunkt für alle Profile
// Alle Navigationen laufen über diesen Launcher.
// Kein direkter WirkerProfilePage-Import außerhalb dieser Datei.

import React from "react";
import { useHome } from "../HomeShell.jsx";

// ── EINZIGER lazy-Import der neuen WirkerProfilePage ─────────────
const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

/**
 * openProfile(wirkerData) — öffnet Fremdprofil
 * openOwnProfile()       — öffnet eigenes Profil
 * Beide via HomeCtx.setShowWirker()
 *
 * Verwendung in jeder Komponente:
 *   const { openProfile, openOwnProfile } = useProfileLauncher();
 */
export function useProfileLauncher() {
  const {
    setShowWirker,
    authProfile,
    user,
  } = useHome();

  const openProfile = React.useCallback((wirkerData) => {
    if (!wirkerData) return;
    setShowWirker(wirkerData);
  }, [setShowWirker]);

  const openOwnProfile = React.useCallback(() => {
    const id = authProfile?.id || user?.id;
    if (!id) return;
    setShowWirker({
      id,
      user_id:      id,
      username:     authProfile?.username     || null,
      display_name: authProfile?.display_name || null,
      avatar_url:   authProfile?.avatar_url   || null,
      header_img:   authProfile?.header_img   || null,
      talent:       authProfile?.talent       || null,
      focus_type:   authProfile?.focus_type   || "hybrid",
      bio:          authProfile?.bio          || null,
      dna_tags:     authProfile?.dna_tags     || [],
      _isOwnerView: true,
    });
  }, [authProfile, user, setShowWirker]);

  const openCreatorProfile = React.useCallback((creatorId, extraData = {}) => {
    setShowWirker({ id: creatorId, user_id: creatorId, ...extraData });
  }, [setShowWirker]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/**
 * ProfileLauncher — rendert WirkerProfilePage als Overlay
 * Wird einmal in HomeInner gemountet — kein doppeltes Rendering.
 */
export default function ProfileLauncher() {
  const { showWirker, setShowWirker } = useHome();

  if (!showWirker) return null;

  return (
    <React.Suspense fallback={null}>
      <WirkerProfilePage
        wirker={showWirker}
        onClose={() => setShowWirker(null)}
        onBook={() => {/* RequestSheet öffnet sich intern */}}
        onChat={() => {/* Chat intern als Sheet */}}
      />
    </React.Suspense>
  );
}
