// profile/ProfileLauncher.jsx — Öffnet Profil-Overlay
// Liest aus HomeCtx, kein Props-Drilling

import React from "react";
import { useHome } from "../HomeShell.jsx";

// Lazy load für Performance
const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

export default function ProfileLauncher() {
  const { showWirker, setShowWirker, showProfile, setShowProfile } = useHome();

  return (
    <>
      {showWirker && (
        <React.Suspense fallback={null}>
          <WirkerProfilePage
            wirker={showWirker}
            onClose={() => setShowWirker(null)}
            onBook={() => {}}
          />
        </React.Suspense>
      )}

      {showProfile && (
        <React.Suspense fallback={null}>
          {/* ProfilePage als Fallback wenn kein authProfile */}
          <div style={{
            position:"fixed", inset:0, zIndex:200,
            background:"rgba(255,251,248,1)",
          }}>
            {/* ProfilePage wird hier gemountet — import via Home.jsx legacy */}
          </div>
        </React.Suspense>
      )}
    </>
  );
}
