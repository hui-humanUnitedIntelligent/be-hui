// src/components/notifications/InAppNotificationBanner.jsx
// Vordergrund-Push-Notification Banner — erscheint oben, verschwindet nach 4s.
// Global: wird in App.jsx einmal gerendert, hört auf 'hui:push:foreground' event.

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

let _bannerState = null; // module-level singleton

export default function InAppNotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [notif, setNotif] = useState(null);

  const show = useCallback((detail) => {
    setNotif(detail);
    setVisible(true);
    // Auto-hide nach 4 Sekunden
    setTimeout(() => setVisible(false), 4000);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && _bannerState === null) {
        show(e.detail);
      }
    };
    window.addEventListener("hui:push:foreground", handler);
    return () => window.removeEventListener("hui:push:foreground", handler);
  }, [show]);

  if (!visible || !notif) return null;

  const handleTap = () => {
    setVisible(false);
    // Navigation event triggern
    window.dispatchEvent(new CustomEvent("hui:push:navigate", {
      detail: {
        entity_type: notif.data?.entity_type,
        entity_id: notif.data?.entity_id,
        action_url: notif.data?.action_url,
        data: notif.data || {},
      }
    }));
  };

  return createPortal(
    <div
      onClick={handleTap}
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 8px)",
        left: "50%",
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-100px)",
        width: "calc(100% - 24px)",
        maxWidth: 420,
        zIndex: 30000,
        background: "rgba(26,26,24,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "auto",
      }}
    >
      {/* Avatar / Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "rgba(14,196,184,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0,
      }}>
        {notif.data?.sender_avatar || "🔔"}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#FFFFFF",
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {notif.title}
        </div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.7)",
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", marginTop: 2,
        }}>
          {notif.body}
        </div>
      </div>

      {/* Close */}
      <div
        onClick={(e) => { e.stopPropagation(); setVisible(false); }}
        style={{
          fontSize: 16, color: "rgba(255,255,255,0.4)",
          cursor: "pointer", flexShrink: 0, padding: 4,
        }}
      >
        ✕
      </div>
    </div>,
    document.body
  );
}
