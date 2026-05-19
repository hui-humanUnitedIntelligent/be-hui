// src/components/home/profile/ProfileLauncher.jsx v3
// Einziger Render-Punkt für WirkerProfilePage
// Clean — no debug logs, showWirker scoped in ProfileLauncher() via useHome()

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";

const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

/* ── Hook-Variante für imperativen Zugriff ── */
export function useProfileLauncher() {
  const { setShowWirker, authProfile, user } = useHome();

  const openProfile = useCallback((data) => {
    if (!data) return;
    setShowWirker(data);
  }, [setShowWirker]);

  const openOwnProfile = useCallback(() => {
    const id = authProfile?.id || user?.id || null;
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

/* ── Rendert WirkerProfilePage als Overlay ── */
export default function ProfileLauncher() {
  const { showWirker, setShowWirker } = useHome();

  // Trace-Log: immer sichtbar beim Re-render

  if (!showWirker) {
    return null;
  }

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