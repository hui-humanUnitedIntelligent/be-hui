// HuiPlusSheet.jsx — WRAPPER v7
// ═══════════════════════════════════════════════════════════════
// Thin compatibility wrapper um OrbSystem.
//
// Warum: HuiPlusSheet wird in Home.jsx mit onSelect/onClose aufgerufen.
//        Die API bleibt identisch — kein Refactor in Home nötig.
//        Die gesamte Logik liegt jetzt in src/system/orb/OrbSystem.jsx.
//
// Props: { onSelect, onClose, isTalent, isTrusted }
// onSelect(type) → wird direkt an OrbSystem.onAction weitergeleitet
// ═══════════════════════════════════════════════════════════════

import React from "react";
import OrbSystem from "../system/orb/OrbSystem.jsx";

export default function HuiPlusSheet({
  onSelect,
  onClose,
  isTalent  = false,
  isTrusted = false,
}) {
  return (
    <OrbSystem
      onAction={onSelect}
      onClose={onClose}
      isTalent={isTalent}
      isTrusted={isTrusted}
    />
  );
}
