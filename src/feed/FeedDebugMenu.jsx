/**
 * FeedDebugMenu — iPad-freundliches Export-Menü im DEV-Modus.
 * Aktivierung: localStorage.setItem('hui_feed_debug', '1')
 */

import React, { useState } from "react";
import { isFeedDebugOverlayEnabled } from "./huiFeedRuntimeDiagnostics.js";

const btnStyle = {
  display: "block",
  width: "100%",
  border: "1px solid rgba(13,196,181,0.35)",
  background: "rgba(13,196,181,0.10)",
  color: "#E8FFF9",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "left",
  cursor: "pointer",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

export default function FeedDebugMenu() {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState(null);
  const enabled = isFeedDebugOverlayEnabled();

  if (!enabled) return null;

  const debug = typeof window !== "undefined" ? window.__HUI_FEED_DEBUG__ : null;

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2200);
  };

  const handleExport = () => {
    try {
      debug?.export?.();
      showStatus("Download gestartet");
    } catch {
      showStatus("Export fehlgeschlagen");
    }
  };

  const handleCopy = async () => {
    const payload = debug?.getPayload?.() ?? debug?.copy?.();
    const text = JSON.stringify(payload, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showStatus("In Zwischenablage kopiert");
    } catch {
      showStatus("Kopieren fehlgeschlagen");
    }
  };

  const handleReset = () => {
    debug?.reset?.();
    showStatus("Messungen zurückgesetzt");
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "max(12px, env(safe-area-inset-right, 12px))",
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        zIndex: 99999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: open ? "min(260px, calc(100vw - 24px))" : "auto",
          background: "rgba(20,20,34,0.94)",
          color: "#E8FFF9",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.38)",
          border: "1px solid rgba(13,196,181,0.35)",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            color: "#0DC4B5",
            padding: open ? "10px 12px 6px" : "10px 14px",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "left",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          {open ? "Feed Debug ▾" : "Feed Debug"}
        </button>

        {open && (
          <div style={{ padding: "4px 10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button type="button" onClick={handleExport} style={btnStyle}>
              Export Debug Report
            </button>
            <button type="button" onClick={handleCopy} style={btnStyle}>
              Copy Debug Report
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{ ...btnStyle, borderColor: "rgba(255,122,92,0.4)", background: "rgba(255,122,92,0.12)", color: "#FFD4C8" }}
            >
              Reset Debug
            </button>
            {status && (
              <div style={{ fontSize: 11, color: "rgba(232,255,249,0.72)", textAlign: "center", paddingTop: 2 }}>
                {status}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
