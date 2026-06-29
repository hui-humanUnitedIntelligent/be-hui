// src/components/orb/OrbSignatur.jsx
// Orb + "Wirkt besonders durch" — wiederverwendbar für eigenes & öffentliches Profil
import React, { Suspense } from "react";
import { dominantPillarLabels } from "../../core/hui.pillars.js";
import { useCoreProfile } from "../../hooks/useCoreEngine.js";

const OrbLeaf = React.lazy(() =>
  import("./OrbLeaf.jsx").catch(() => ({ default: () => null }))
);

/**
 * Dezente Orb-Signatur oberhalb des Profils.
 * Zeigt immer das individuelle Blatt; Grundpfeiler nur wenn vorhanden.
 */
export default function OrbSignatur({ profileId, variant = "public", size = 48 }) {
  const { dominantPillars, isLoading } = useCoreProfile(profileId);
  const pillarLabels = dominantPillarLabels(dominantPillars);

  if (!profileId || isLoading) return null;

  return (
    <div style={{
      padding: "16px 16px 14px",
      borderBottom: "1px solid rgba(26,26,46,0.06)",
      background: "rgba(255,252,248,0.80)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}>
      <Suspense fallback={null}>
        <OrbLeaf
          userId={profileId}
          size={size}
          variant={variant}
          animate={variant !== "tab"}
        />
      </Suspense>

      {pillarLabels.length > 0 && (
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 10.5,
            color: "rgba(26,26,46,0.40)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}>
            Wirkt besonders durch
          </p>
          <div style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {pillarLabels.map(({ pillar, label, icon, colorSoft, colorBorder }) => (
              <span
                key={pillar}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: colorSoft,
                  border: `1px solid ${colorBorder}`,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "rgba(26,26,46,0.72)",
                  letterSpacing: "0.01em",
                }}
              >
                <span style={{ fontSize: 12 }}>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
