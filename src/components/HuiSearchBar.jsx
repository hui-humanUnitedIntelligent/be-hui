import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";

export default function HuiSearchBar({ onClick, onKarteClick, onMatchClick }) {
  return (
    <div style={{ background: "white", padding: "6px 12px 8px", position: "sticky", top: 54, zIndex: 99, borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6 }}>
      <div onClick={onClick} style={{ flex: 1, background: "#f3f3f3", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <Search size={15} color="#aaa" />
        <span style={{ color: "#bbb", fontSize: 13, flex: 1 }}>Suche nach Talent, Werk, Name…</span>
        <div style={{ background: `${TEAL}18`, borderRadius: 7, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3 }}>
          <SlidersHorizontal size={12} color={TEAL} />
          <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>Filter</span>
        </div>
      </div>
      <button onClick={onMatchClick} style={{ background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, border: "none", borderRadius: 10, padding: "0 11px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", fontWeight: 800, fontSize: 13, color: "white", minHeight: 36, boxShadow: `0 4px 14px ${CORAL}55` }}>
        ✨
      </button>
      <button onClick={onKarteClick} style={{ background: `${TEAL}15`, border: "none", borderRadius: 10, padding: "0 11px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", fontWeight: 700, fontSize: 12, color: TEAL, minHeight: 36 }}>
        🗺
      </button>
    </div>
  );
}