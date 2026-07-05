// Resonanzzentrum — Alles, was zu mir zurückkommt
// Produktive Komponente: ResonanzzentrumPanel (embedded)

import React, { useState } from "react";
import { ResonanzzentrumPanel } from "../../../../lib/useNotifications.jsx";
import ResonanceSectionShell from "../ResonanceSectionShell.jsx";
import EmptyState from "../../../../components/ui/EmptyState.jsx";
import { useNotifications } from "../../../../lib/useNotifications.jsx";

export default function ResonanzzentrumSection() {
  const [showPanel, setShowPanel] = useState(false);
  const notif = useNotifications();
  const hasItems = (notif?.items?.length ?? 0) > 0 || (notif?.unread ?? 0) > 0;

  return (
    <ResonanceSectionShell
      title="Resonanzzentrum"
      tagline="Alles, was zu mir zurückkommt"
      icon="🔔"
    >
      <div style={{ padding: "0 20px 24px" }}>
        {!hasItems && !notif?.loading ? (
          <EmptyState
            preset="notifications"
            title="Noch ruhig hier"
            body="Wenn jemand reagiert, bucht oder dir folgt, erfährst du es hier — ruhig und ohne Hektik."
            cta="Resonanzzentrum öffnen"
            onCta={() => setShowPanel(true)}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            {(notif?.unread ?? 0) > 0 && (
              <div style={{
                display: "inline-block", marginBottom: 16,
                background: "rgba(14,196,184,0.10)", borderRadius: 99,
                padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#0EC4B8",
              }}>
                {notif.unread} ungelesen
              </div>
            )}
            <button
              onClick={() => setShowPanel(true)}
              style={{
                display: "block", width: "100%", maxWidth: 320, margin: "0 auto",
                padding: "14px 24px", borderRadius: 16, border: "none",
                background: "#0EC4B8", color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(14,196,184,0.30)",
              }}
            >
              Resonanzzentrum öffnen
            </button>
          </div>
        )}
      </div>

      {showPanel && (
        <ResonanzzentrumPanel onClose={() => setShowPanel(false)} />
      )}
    </ResonanceSectionShell>
  );
}
