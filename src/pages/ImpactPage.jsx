// ImpactPage.jsx — PHASE 16.8.3 BINARY SEARCH — STEP 1: MINIMAL ROOT
import React from "react";

export default function ImpactPage({ currentUser }) {
  console.log("[IMPACT BINARY] ROOT ALIVE", {
    currentUser_id: currentUser?.id ?? null,
    ts: new Date().toISOString(),
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#16D7C5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>
        ✅ IMPACT ROOT ALIVE
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
        currentUser: {currentUser?.id ?? "null"}
      </div>
    </div>
  );
}
