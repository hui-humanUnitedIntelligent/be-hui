// WirkerResonanceStats.jsx — Phase 24: Impact + Resonance Stats
// Emotional, not KPI. Human, not dashboard.
import React, { useState, useEffect, useRef } from "react";
import { useScrollEntry } from "../../design/hui.hooks.js";

const safeNum = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

function AnimCounter({ target, suffix = "", duration = 1200 }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = safeNum(target);
    if (t === 0) return;
    const steps = 40;
    const step = t / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, t);
      setVal(Math.round(cur));
      if (cur >= t) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{val.toLocaleString("de-DE")}{suffix}</>;
}

const STATS = [
  { key: "experiences", icon: "🎭", label: "Erlebnisse geteilt",       suffix: "",    color: "#FF8A6B" },
  { key: "humans",      icon: "👥", label: "Menschen inspiriert",       suffix: "",    color: "#0DC4B5" },
  { key: "impact_eur",  icon: "✨", label: "Gemeinsame Wirkung",        suffix: "",    color: "#F0C46A", prefix: "€" },
  { key: "traces",      icon: "🌿", label: "Spuren hinterlassen",       suffix: "K",  color: "#A78BFA" },
];

export default function WirkerResonanceStats({ profile = {} }) {
  const entry = useScrollEntry();

  const values = {
    experiences: safeNum(profile?.bookings || profile?.experiences_count || 24),
    humans:      safeNum(profile?.followers || profile?.humans_reached   || 189),
    impact_eur:  safeNum(profile?.impact_eur                             || 8950),
    traces:      safeNum(profile?.traces || 1.8),
  };

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "white",
        padding: "20px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        opacity:    entry.visible ? 1 : 0,
        transform:  entry.visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
      }}>
        {STATS.map(s => (
          <div key={s.key} style={{
            background: `${s.color}0A`,
            border: `1px solid ${s.color}20`,
            borderRadius: 16,
            padding: "14px 10px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: "#1A1A1A", letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              {s.prefix || ""}
              <AnimCounter target={values[s.key]} suffix={s.suffix} />
            </div>
            <div style={{
              fontSize: 10, color: "#888",
              marginTop: 4, lineHeight: 1.3,
              fontWeight: 500,
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Energie-Indikator */}
      <div style={{
        marginTop: 12,
        background: "linear-gradient(135deg, #0DC4B5 0%, #FF8A6B 100%)",
        borderRadius: 12,
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.20)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
            Deine Energie wirkt weiter.
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>
            Resonanz aktiv · Community wächst
          </div>
        </div>
      </div>
    </div>
  );
}
