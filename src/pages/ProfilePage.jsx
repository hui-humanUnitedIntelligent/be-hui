// ProfilePage.jsx — AppShell-Tab für das eigene Profil
// Nutzt dieselbe Scroll-/Layout-Architektur wie Entdecken, Home und Impact.
// Inhalte stammen aus MyBasisProfile (nur Content, kein Overlay-Shell).

import React from "react";
import { createPortal } from "react-dom";
import MyBasisProfile from "./MyBasisProfile.jsx";
import { useHome } from "../components/home/HomeShell.jsx";
import { HUI } from "../design/hui.design.js";
import { NAV_CLEARANCE_CSS } from "../components/home/navigation/navigationGeometry.js";

/**
 * ProfileTabBottomSurface — creamSoft strip behind the tab bar (Profil only).
 * Mirrors the AppShell BottomSurface geometry without touching Home.jsx or navigation.
 */
function ProfileTabBottomSurface({ visible }) {
  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-hui-profile-bottom-surface=""
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: NAV_CLEARANCE_CSS,
        background: HUI.COLOR.creamSoft,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />,
    document.body,
  );
}

export default function ProfilePage() {
  const { tab } = useHome();

  return (
    <>
      <ProfileTabBottomSurface visible={tab === "creator"} />
      <MyBasisProfile asAppShellTab />
    </>
  );
}
