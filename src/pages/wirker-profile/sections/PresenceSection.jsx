// sections/PresenceSection.jsx
// Phase 6G: Kreative Präsenz — Signatur, Rhythmus, Bridge-Kontinuität
// REGEL: Nur rendern wenn hasCreative === true. Kein Crash bei fehlenden Daten.

import React from "react";
import { RhythmCard }     from "../components/RhythmCard";
import { ContinuityCard } from "../components/ContinuityCard";

/**
 * @param {{
 *   signature:  string|null,
 *   rhythm:     object|null,
 *   continuity: object|null,
 *   showRhythm: boolean,
 *   showBridge: boolean,
 *   hasCreative: boolean,
 * }} props
 */
export function PresenceSection({
  signature, rhythm, continuity,
  showRhythm, showBridge, hasCreative,
}) {
  if (!hasCreative) return null;
  if (!signature && !showRhythm && !showBridge) return null;

  return (
    <div style={{ padding:"0 20px 8px" }}>
      {/* Resonanz-Signatur — atmosphärischer Satz */}
      {signature && (
        <div style={{
          fontSize: 12, color: "rgba(0,0,0,0.38)",
          fontStyle: "italic", letterSpacing: "0.01em",
          marginBottom: (showRhythm || showBridge) ? 8 : 0,
          lineHeight: 1.5, paddingLeft: 2,
        }}>
          {signature}
        </div>
      )}

      {/* Rhythm + Bridge Tags */}
      {(showRhythm || showBridge) && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {showRhythm  && <RhythmCard     rhythm={rhythm}         />}
          {showBridge  && <ContinuityCard continuity={continuity} />}
        </div>
      )}
    </div>
  );
}
