// WirkerCommunity.jsx — Phase 24: Community Layer
// Warm, human — supporters, guests, collaborators
import React from "react";
import { useScrollEntry } from "../../design/hui.hooks.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0 ? v : fb);

const SEED_COMMUNITY = [
  { id: "c1", name: "Mara",   role: "Unterstützt dich",  status: "Aktiv",          avatar: "https://i.pravatar.cc/40?img=1",  color: "#22C55E" },
  { id: "c2", name: "Jonas",  role: "War im Workshop",   status: "Aktiv",          avatar: "https://i.pravatar.cc/40?img=3",  color: "#22C55E" },
  { id: "c3", name: "Lina",   role: "Resoniert mit dir", status: "Aktiv",          avatar: "https://i.pravatar.cc/40?img=5",  color: "#22C55E" },
  { id: "c4", name: "Tobias", role: "Plant Buchung",     status: "Aktiv",          avatar: "https://i.pravatar.cc/40?img=8",  color: "#22C55E" },
];

function CommunityRow({ member }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 0",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
    }}>
      <img
        src={member.avatar}
        alt={member.name}
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={e => { e.target.style.background = "#e0e0e0"; e.target.style.display = "none"; }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#1A1A1A",
          letterSpacing: "-0.015em",
        }}>{member.name}</div>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>
          {member.role}
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, color: member.color, fontWeight: 700,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: member.color,
        }} />
        {member.status}
      </div>
    </div>
  );
}

export default function WirkerCommunity({ community, onSeeAll }) {
  const entry = useScrollEntry();
  const members = safeArr(community).length > 0 ? safeArr(community) : SEED_COMMUNITY;

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "#F9F7F4",
        padding: "24px 20px",
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
          Deine Community
        </div>
        <span
          onClick={onSeeAll}
          style={{ fontSize: 12, color: "#0DC4B5", fontWeight: 700, cursor: "pointer" }}
        >Alle anzeigen →</span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
        Menschen, die mit dir resonieren.
      </div>

      {/* Members list */}
      <div style={{
        background: "white",
        borderRadius: 18,
        padding: "4px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        {members.map(m => <CommunityRow key={m.id} member={m} />)}
      </div>
    </div>
  );
}
