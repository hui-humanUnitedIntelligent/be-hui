// src/components/profile/MeinHuiNav.jsx
// Persönliche Navigation innerhalb von „Mein HUI"
// Studio bleibt Commerce — hier lebt der Mensch.

import React from "react";

const T = {
  bgCard:   "#FFFFFF",
  ink:      "#1A1A18",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.08)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  r16:      16,
  card:     "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  px:       20,
};

const ITEMS = [
  { key: "profil",       icon: "🌿", label: "Mein Profil"        },
  { key: "orb",          icon: "◎",  label: "Mein Orb"           },
  { key: "resonanz",     icon: "❤️", label: "Meine Resonanz"     },
  { key: "verbindungen", icon: "🤝", label: "Meine Verbindungen" },
  { key: "impact",       icon: "🌍", label: "Mein Impact"        },
  { key: "favoriten",    icon: "📌", label: "Favoriten"          },
  { key: "punkte",       icon: "✦",  label: "HUI Punkte"         },
  { key: "einstellungen",icon: "⚙️", label: "Einstellungen"      },
];

function NavRow({ icon, label, onPress, active, last }) {
  return (
    <button
      className="mbp-press-light"
      onClick={onPress}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", background: active ? T.tealSoft : "none",
        border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        touchAction: "manipulation",
      }}
    >
      <span style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: active ? "rgba(14,196,184,0.16)" : "rgba(26,26,24,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>{icon}</span>
      <span style={{
        flex: 1, fontSize: 14, fontWeight: active ? 700 : 500,
        color: active ? T.teal : T.ink,
      }}>{label}</span>
      <span style={{ fontSize: 15, color: T.inkFaint, flexShrink: 0 }}>›</span>
    </button>
  );
}

export default function MeinHuiNav({ activeKey = "profil", onNavigate }) {
  return (
    <div style={{ padding: `0 ${T.px}px`, marginBottom: 20 }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: T.ink,
        marginBottom: 10, letterSpacing: "-0.01em",
      }}>
        Persönlicher Bereich
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.card,
      }}>
        {ITEMS.map((item, i) => (
          <NavRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeKey === item.key}
            last={i === ITEMS.length - 1}
            onPress={() => onNavigate?.(item.key)}
          />
        ))}
      </div>
    </div>
  );
}
