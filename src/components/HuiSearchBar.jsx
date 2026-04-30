import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Scale } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

export default function HuiSearchBar({ onClick, onKarteClick, onMatchClick, onVergleichClick }) {
  return (
    <div style={{ background: "white", padding: "8px 16px 10px", position: "sticky", top: 54, zIndex: 99, borderBottom: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
      <div onClick={onClick} style={{ flex: 1, background: "#f3f3f3", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <Search size={16} color="#aaa" />
        <span style={{ color: "#bbb", fontSize: 14, flex: 1 }}>Suche nach Talent, Werk, Name…</span>
        <div style={{ background: `${TEAL}18`, borderRadius: 8, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
          <SlidersHorizontal size={13} color={TEAL} />
          <span style={{ fontSize: 11, color: TEAL, fontWeight: 700 }}>Filter</span>
        </div>
      </div>
      <button onClick={onMatchClick} style={{ background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 12, padding: "0 13px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontWeight: 800, fontSize: 13, color: "white", minHeight: 40, boxShadow: `0 4px 14px ${CORAL}55` }}>
        ✨
      </button>
      <button onClick={onVergleichClick} style={{ background: `${TEAL}15`, border: "none", borderRadius: 12, padding: "0 13px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 12, color: TEAL, minHeight: 40 }} title="Wirker vergleichen">
        <Scale size={16} color={TEAL} />
      </button>
      <button onClick={onKarteClick} style={{ background: `${TEAL}15`, border: "none", borderRadius: 12, padding: "0 13px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 12, color: TEAL, minHeight: 40 }}>
        🗺
      </button>
    </div>
  );
}