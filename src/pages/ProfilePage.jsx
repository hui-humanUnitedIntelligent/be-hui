// ProfilePage.jsx — AppShell-Tab für das eigene Profil
// Nutzt dieselbe Scroll-/Layout-Architektur wie Entdecken, Home und Impact.
// Inhalte stammen aus MyBasisProfile (nur Content, kein Overlay-Shell).

import React from "react";
import MyBasisProfile from "./MyBasisProfile.jsx";

export default function ProfilePage() {
  return <MyBasisProfile asAppShellTab />;
}
