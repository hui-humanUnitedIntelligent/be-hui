// ImpactDeepLinkRedirect — NAV-1.4
// /impact bleibt als Deep-Link erhalten, rendert Impact aber nur in HomeShell.
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildShellTabNavigateState } from "../../lib/navigation/shellDeepLink.js";

function ImpactRedirectLoader() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F9F7F4",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid #EEEBE6", borderTopColor: "#16D7C5",
        animation: "hui-impact-redirect-spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes hui-impact-redirect-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ImpactDeepLinkRedirect() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    navigate("/Home", {
      replace: true,
      state: buildShellTabNavigateState("impact", hash),
    });
  }, [navigate, hash]);

  return <ImpactRedirectLoader />;
}
