// src/pages/Home.jsx — BOOT ISOLATION STUB
// ALLE Imports deaktiviert — nur reines React
// Zweck: isolieren ob der Crash vor oder nach Home-Render passiert
import React from "react";

console.log('[BOOT] Home.jsx module evaluated');

export default function Home() {
  console.log('[BOOT] Home() render called');
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      background: "#F9F7F4",
      fontFamily: "-apple-system, sans-serif",
    }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E" }}>BOOT OK</div>
      <div style={{ fontSize: 13, color: "#888" }}>
        Home loaded — alle Module deaktiviert
      </div>
    </div>
  );
}
