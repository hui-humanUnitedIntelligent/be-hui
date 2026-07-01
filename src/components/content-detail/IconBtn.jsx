import React, { useState } from "react";
import { C } from "./tokens.js";

export default function IconBtn({ icon, label, active, color, onPress, disabled }) {
  const [pressed, setPressed] = useState(false);
  const handleTap = () => {
    if (disabled) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 300);
    onPress?.();
  };
  return (
    <button
      onClick={handleTap}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: "8px 12px",
        borderRadius: 12,
        transform: pressed ? "scale(1.25)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{ fontSize: 22, filter: active ? "none" : "grayscale(0.3)" }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? (color || C.coral) : C.muted }}>
        {label}
      </span>
    </button>
  );
}
