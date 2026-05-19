// src/components/home/profile/ProfileLauncher.jsx v4
// Router: _isOwnerView → CreatorProfilePage, else → WirkerProfilePage
// Single render-point for all profile overlays

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";

/* ── Lazy loads ── */
const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);
const CreatorProfilePage = React.lazy(
  () => import("../../../pages/creator-profile/index.jsx")
);

/* ── Hook: imperativer Zugriff ── */
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
      header_img:   authProfile?.header_img   || null,
      talent:       authProfile?.talent       || null,
      bio:          authProfile?.bio          || null,
      impact_eur:   authProfile?.impact_eur   || null,
      location_label: authProfile?.location_label || authProfile?.location || null,
      is_wirker:    authProfile?.is_wirker    || authProfile?.has_talent_profile || false,
      _isOwnerView: true,
    });
  }, [authProfile, user, setShowWirker]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    setShowWirker({ id, user_id: id, ...extra });
  }, [setShowWirker]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* ── Rendert Profil-Overlay ── */
export default function ProfileLauncher() {
  const { showWirker, setShowWirker } = useHome();

  if (!showWirker) return null;

  const isOwnerView = showWirker._isOwnerView === true;

  const handleClose  = () => setShowWirker(null);
  const handleAction = (key) => {
    // Creator Studio etc. — später erweiterbar
    if (key === "edit") {
      // TODO: openEditProfile
    }
  };

  return (
    <React.Suspense fallback={null}>
      {isOwnerView ? (
        <CreatorProfilePage
          wirker={showWirker}
          onClose={handleClose}
          onAction={handleAction}
        />
      ) : (
        <WirkerProfilePage
          wirker={showWirker}
          onClose={handleClose}
          onBook={() => {}}
          onChat={() => {}}
        />
      )}
    </React.Suspense>
  );
}
