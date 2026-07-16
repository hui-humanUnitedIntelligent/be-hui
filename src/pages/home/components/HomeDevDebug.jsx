import React from "react";

export function HomeDevDebug({
  activeSurface,
  worldState,
  showPlusSheet,
  tab,
  keepFeed,
  keepImpact,
  keepDiscover,
}) {
  if (!import.meta.env.DEV) return null;

  return (
    <div style={{
      position: "fixed", top: 8, right: 8, zIndex: 99999,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)",
      borderRadius: 11, padding: "9px 13px", fontSize: 10.5,
      fontFamily: "monospace", color: "#fff", lineHeight: 1.75,
      pointerEvents: "none", userSelect: "none",
      border: "1px solid rgba(255,255,255,0.15)",
      minWidth: 200,
    }}>
      <div style={{ color: "#16D7C5", fontWeight: 700, marginBottom: 3, fontSize: 11 }}>
        🌍 World Surface
      </div>
      <div>surface: <b style={{ color: activeSurface ? "#FF8A6B" : "#aaa" }}>
        {activeSurface ?? "null"}
      </b></div>
      <div>confirmed: <b style={{ color: worldState?.overlayConfirmed ? "#16D7C5" : "#aaa" }}>
        {String(worldState?.overlayConfirmed ?? false)}
      </b></div>
      <div>navLocked: <b style={{ color: worldState?.navLocked ? "#FF8A6B" : "#aaa" }}>
        {String(worldState?.navLocked ?? false)}
      </b></div>
      <div>sheet: <b style={{ color: showPlusSheet ? "#FF8A6B" : "#aaa" }}>
        {String(showPlusSheet)}
      </b></div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "5px 0 3px" }} />
      <div style={{ color: "#a8d8cf", fontWeight: 700, marginBottom: 2 }}>Tabs</div>
      <div>activeTab: <b style={{ color: "#16D7C5" }}>{tab}</b></div>
      <div>feed op: <b style={{ color: keepFeed?.opacity === 1 ? "#16D7C5" : "#FF8A6B" }}>
        {keepFeed?.opacity ?? "?"}
      </b></div>
      <div>impact op: <b style={{ color: keepImpact?.opacity === 1 ? "#16D7C5" : "#FF8A6B" }}>
        {keepImpact?.opacity ?? "?"}
      </b></div>
      <div>discover op: <b style={{ color: keepDiscover?.opacity === 1 ? "#16D7C5" : "#FF8A6B" }}>
        {keepDiscover?.opacity ?? "?"}
      </b></div>
      <div>tab→ptr: <b style={{ color: "#aaa" }}>
        {keepFeed?.pointerEvents}/{keepImpact?.pointerEvents}
      </b></div>
    </div>
  );
}
