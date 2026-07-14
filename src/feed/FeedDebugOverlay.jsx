/**
 * FeedDebugOverlay — kleines Live-Overlay im DEV-Modus.
 * Aktivierung: localStorage.setItem('hui_feed_debug', '1')
 */

import React, { useEffect, useState } from "react";
import { isFeedDebugOverlayEnabled } from "./huiFeedRuntimeDiagnostics.js";

export default function FeedDebugOverlay() {
  const [snapshot, setSnapshot] = useState(null);
  const enabled = isFeedDebugOverlayEnabled();

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      const s = typeof window !== "undefined" ? window.__HUI_FEED_DEBUG__?.snapshot : null;
      if (s) setSnapshot(s);
    };
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled || !snapshot) return null;

  const rows = [
    ["Items", snapshot.itemsLength ?? "—"],
    ["Rendered", snapshot.renderedCards ?? "—"],
    ["Scroll", snapshot.scrollTop != null ? `${Math.round(snapshot.scrollTop)}px` : "—"],
    ["NextPage", snapshot.hasNextPage ? "yes" : "no"],
    ["Fetching", snapshot.isFetchingNextPage ? "next" : snapshot.isFetching ? "yes" : "no"],
    ["Observer", snapshot.observerConnected ? "on" : "off"],
    ["DOM", snapshot.domNodeCount ?? "—"],
    ["Virt", snapshot.useVirtualizer ? `yes (${snapshot.virtualItemCount ?? 0})` : "no"],
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 72,
        left: 8,
        zIndex: 99999,
        background: "rgba(20,20,34,0.88)",
        color: "#E8FFF9",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 10,
        lineHeight: 1.45,
        padding: "8px 10px",
        borderRadius: 10,
        pointerEvents: "none",
        maxWidth: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        border: "1px solid rgba(13,196,181,0.35)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#0DC4B5" }}>HUI Feed Debug</div>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ opacity: 0.65 }}>{label}</span>
          <span style={{ fontWeight: 600, textAlign: "right" }}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
}
