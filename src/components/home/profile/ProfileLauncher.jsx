// src/components/home/profile/ProfileLauncher.jsx v2
// Einziger Render-Punkt für WirkerProfilePage

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";

const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

/* openProfile / openOwnProfile / openCreatorProfile hooks */
export function useProfileLauncher() {
  const { setShowWirker, authProfile, user } = useHome();

  const openProfile = useCallback((data) => {
    if (!data) return;
    console.log("[HUI-PL] openProfile:", data?.id);
    setShowWirker(data);
  }, [setShowWirker]);

  const openOwnProfile = useCallback(() => {
    const id = authProfile?.id || user?.id || null;
    console.log("[HUI-PL] openOwnProfile via hook:", id);
    setShowWirker({
      id,
      user_id:      id,
      display_name: authProfile?.display_name || "Mein Profil",
      avatar_url:   authProfile?.avatar_url   || null,
      _isOwnerView: true,
    });
  }, [authProfile, user, setShowWirker]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    setShowWirker({ id, user_id: id, ...extra });
  }, [setShowWirker]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* Rendert WirkerProfilePage als Overlay */
export default function ProfileLauncher() {
  const { showWirker, setShowWirker } = useHome();

  console.log("[HUI-PL] render, showWirker:", !!showWirker, showWirker?.id);

  if (!showWirker) return null;

  return (
    <React.Suspense fallback={null}>
      <WirkerProfilePage
        wirker={showWirker}
        onClose={() => setShowWirker(null)}
        onBook={() => {}}
        onChat={() => {}}
      />
    </React.Suspense>
  );
}
