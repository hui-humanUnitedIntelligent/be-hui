// src/components/home/profile/ProfileLauncher.jsx v2
      console.log("[PROFILE LAUNCHER OPENING PROFILE]", showWirker?.id);
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

      console.log("[PROFILE LAUNCHER OPENING PROFILE]", showWirker?.id);
/* Rendert WirkerProfilePage als Overlay */
export default function ProfileLauncher() {
  console.log("[PROFILE LAUNCHER RENDER]", showWirker?.id ?? null);
  const { showWirker, setShowWirker } = useHome();

  console.log("[HUI-PL] render, showWirker:", !!showWirker, showWirker?.id);

  console.log("[PROFILE LAUNCHER EMPTY] — showWirker ist null/undefined");
  if (!showWirker) return null;

  return (
    <React.Suspense fallback={null}>
      console.log("[PROFILE LAUNCHER OPENING PROFILE]", showWirker?.id);
      <WirkerProfilePage
        wirker={showWirker}
        onClose={() => setShowWirker(null)}
        onBook={() => {}}
        onChat={() => {}}
      />
    </React.Suspense>
  );
}