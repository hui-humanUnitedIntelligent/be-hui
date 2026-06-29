// src/components/orb/OrbNavLogo.jsx
// TabBar-Logo: HuiOrbLogo wenn Orb-Daten vorhanden, sonst Standard-HUI-Logo
import React from "react";
import { useCoreProfile } from "../../hooks/useCoreEngine.js";
import { HuiOrbLogo } from "./OrbLeaf.jsx";

const FALLBACK_IMG_STYLE = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

function StaticHuiLogo() {
  return (
    <img
      src="/hui-logo-real.jpg"
      alt="HUI"
      style={FALLBACK_IMG_STYLE}
      onError={e => { e.target.src = "/hui-logo.jpg"; }}
    />
  );
}

export default function OrbNavLogo({ userId }) {
  const { coreProfile, isLoading } = useCoreProfile(userId);

  if (!userId || isLoading) return <StaticHuiLogo />;
  if (!coreProfile) return <StaticHuiLogo />;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <HuiOrbLogo userId={userId} size={34} animate={false} />
    </div>
  );
}
