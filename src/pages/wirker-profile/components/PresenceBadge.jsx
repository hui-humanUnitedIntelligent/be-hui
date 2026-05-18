// components/PresenceBadge.jsx
// Online-Status-Badge (Legacy Presence)
// REGEL: Darf nie crashen — alle Props optional

import React from "react";

const STATUS_COLORS = {
  online:   "#10B981",
  recently: "#F5A623",
  away:     "#888",
  offline:  "transparent",
};

/**
 * @param {{ presenceInfo: object|null, presenceStatus: string }} props
 */
export function PresenceBadge({ presenceInfo, presenceStatus }) {
  if (!presenceStatus || presenceStatus === "offline") return null;

  const color = STATUS_COLORS[presenceStatus] || STATUS_COLORS.offline;
  const label = presenceInfo?.label || presenceStatus;

  if (presenceStatus === "offline") return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(16,185,129,0.10)",
      borderRadius: 999,
      padding: "4px 10px",
      marginTop: 6,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: color,
        boxShadow: presenceStatus === "online"
          ? `0 0 0 2px rgba(16,185,129,0.25)`
          : "none",
      }}/>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: color,
        letterSpacing: 0.2,
      }}>
        {label}
      </span>
    </div>
  );
}
