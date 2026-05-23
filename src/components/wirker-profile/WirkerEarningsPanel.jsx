// WirkerEarningsPanel.jsx — Phase 24: Earnings + Impact Overview
// Calm operational section. Energy flow, not accounting.
import React from "react";
import { useScrollEntry } from "../../design/hui.hooks.js";

const safeNum = (v, fb = 0) => (typeof v === "number" && isFinite(v) ? v : fb);
const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0 ? v : fb);
const safeArr = (v) => (Array.isArray(v) ? v : []);

// Mini sparkline — pure CSS/SVG, no deps
function Sparkline({ values = [], color = "#0DC4B5" }) {
  const safe = safeArr(values).filter(n => typeof n === "number");
  if (safe.length < 2) return null;
  const max = Math.max(...safe, 1);
  const pts = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * 120;
    const y = 28 - (v / max) * 24;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="120" height="30" viewBox="0 0 120 30" style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

const SEED_BOOKINGS = [
  {
    title: "Atelier Workshop",
    subtitle: "Creative Nature",
    date: "24. Mai 2025",
    spots_used: 6, spots_total: 6,
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&q=70",
    avatar: "https://i.pravatar.cc/32?img=5",
  },
  {
    title: "1:1 Mentoring",
    subtitle: "Kreativer Flow",
    date: "30. Mai 2025",
    spots_used: 1, spots_total: 1,
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&q=70",
    avatar: "https://i.pravatar.cc/32?img=12",
  },
];

export default function WirkerEarningsPanel({ profile = {}, bookings }) {
  const entry = useScrollEntry();

  const earnings     = safeNum(profile?.earnings_month, 2840);
  const bookingCount = safeNum(profile?.bookings_month, 31);
  const projects     = safeNum(profile?.projects_supported, 18);
  const resonance    = safeNum(profile?.resonance_rating, 4.8);
  const sparkData    = [420, 680, 540, 890, 760, 1100, 840, 1340, 1020, 1480, 1240, earnings];

  const upcomingBookings = safeArr(bookings).length > 0 ? safeArr(bookings).slice(0, 2) : SEED_BOOKINGS;

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "white",
        padding: "24px 20px",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        {/* LEFT: Einnahmen */}
        <div>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
              Deine Einnahmen & Wirkung
            </div>
            <div style={{
              fontSize: 10, color: "#888",
              background: "rgba(0,0,0,0.05)",
              borderRadius: 99, padding: "4px 9px",
              fontWeight: 600,
            }}>Diesen Monat ▾</div>
          </div>

          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { val: `€${earnings.toLocaleString("de-DE")}`, label: "Einnahmen", color: "#0DC4B5" },
              { val: bookingCount,                            label: "Buchungen",  color: "#6366F1" },
              { val: projects,                                label: "Projekte unterstützt", color: "#FF8A6B" },
              { val: `${resonance} ★`,                       label: "Resonanz­bewertung",   color: "#F59E0B" },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: 20, fontWeight: 800,
                  color: item.color, letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}>{item.val}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 3, fontWeight: 500 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <Sparkline values={sparkData} color="#0DC4B5" />
          <div style={{
            fontSize: 11, color: "#0DC4B5", fontWeight: 700,
            marginTop: 8, cursor: "pointer",
          }}>Gesamte Statistik ansehen →</div>
        </div>

        {/* RIGHT: Nächste Buchungen */}
        <div>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
              Nächste Erlebnisse
            </div>
            <span style={{ fontSize: 11, color: "#0DC4B5", fontWeight: 700, cursor: "pointer" }}>
              Alle →
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingBookings.map((b, i) => {
              const pct = Math.round((safeNum(b.spots_used) / Math.max(safeNum(b.spots_total), 1)) * 100);
              return (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "center",
                  padding: "10px 12px",
                  background: "#F9F7F4",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.05)",
                }}>
                  <img
                    src={b.img}
                    alt={b.title}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                    onError={e => { e.target.style.background = "#ddd"; e.target.style.display = "none"; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: "#1A1A1A",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{b.title}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{b.date}</div>
                    {/* Progress bar */}
                    <div style={{
                      marginTop: 5, height: 3, borderRadius: 3,
                      background: "rgba(0,0,0,0.08)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #0DC4B5, #22DDD0)",
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
                      {b.spots_used}/{b.spots_total} Plätze
                    </div>
                  </div>
                  <img
                    src={b.avatar}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
