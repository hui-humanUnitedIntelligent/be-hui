// WirkerExperiences.jsx — Phase 24: Experiences / Angebote
// Horizontal scrollable experience marketplace — cinematic, bookable
import React, { useRef } from "react";
import { useTap, useScrollEntry } from "../../design/hui.hooks.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v, fb = "") => (typeof v === "string" && v.length > 0 ? v : fb);

const SEED_EXPERIENCES = [
  {
    id: "e1", title: "Atelier Workshop",
    subtitle: "Creative Nature",
    duration: "4 Std.", spots: "6 Plätze",
    price: 129, tag: "HUI",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    color: "#0DC4B5",
  },
  {
    id: "e2", title: "1:1 Mentoring",
    subtitle: "Kreativer Flow",
    duration: "60 Min.", spots: "11 Sessions",
    price: 149, tag: "Nur 2 frei",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
    color: "#FF8A6B",
  },
  {
    id: "e3", title: "Retreat",
    subtitle: "Wald & Kunst",
    duration: "3 Tage", spots: "8 Plätze",
    price: 499, tag: "Beliebt",
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
    color: "#6366F1",
  },
  {
    id: "e4", title: "Musikabend",
    subtitle: "Klang & Verbindung",
    duration: "2,5 Std.", spots: "30 Plätze",
    price: 39, tag: "Community",
    img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
    color: "#F59E0B",
  },
  {
    id: "e5", title: "Digitales Produkt",
    subtitle: "Art Print Collection",
    duration: "Sofort Download", spots: "∞",
    price: 29, tag: "Digital",
    img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80",
    color: "#EC4899",
  },
];

function ExperienceCard({ exp, onBook }) {
  const tap = useTap();
  return (
    <div
      {...tap}
      onClick={() => onBook?.(exp)}
      style={{
        flexShrink: 0,
        width: 175,
        borderRadius: 20,
        overflow: "hidden",
        background: "white",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {/* Cover Image */}
      <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
        <img
          src={exp.img}
          alt={exp.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.background = "#f0f0f0"; e.target.style.display = "none"; }}
        />
        {/* Tag */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: exp.color,
          color: "white", fontSize: 9, fontWeight: 800,
          borderRadius: 99, padding: "3px 8px",
          letterSpacing: "0.03em",
        }}>{exp.tag}</div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 12px 14px" }}>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: "#1A1A1A", letterSpacing: "-0.02em",
          marginBottom: 2,
        }}>{exp.title}</div>
        <div style={{
          fontSize: 11, color: "#888",
          marginBottom: 8, fontWeight: 500,
        }}>{exp.subtitle}</div>

        {/* Meta */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 10,
          fontSize: 10, color: "#999",
        }}>
          <span>⏱ {exp.duration}</span>
          <span>👤 {exp.spots}</span>
        </div>

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: "#1A1A1A", letterSpacing: "-0.03em",
          }}>€{exp.price}</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: exp.color, cursor: "pointer",
          }}>Mehr erfahren →</span>
        </div>
      </div>
    </div>
  );
}

export default function WirkerExperiences({ experiences, onBook }) {
  const entry = useScrollEntry();
  const scrollRef = useRef(null);
  const items = safeArr(experiences).length > 0 ? safeArr(experiences) : SEED_EXPERIENCES;

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "#F9F7F4",
        padding: "24px 0 20px",
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "0 20px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
            Angebote & Erlebnisse
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Das kannst du mit mir erleben oder buchen.
          </div>
        </div>
        <span style={{ fontSize: 12, color: "#0DC4B5", fontWeight: 700, cursor: "pointer" }}>
          Alle anzeigen →
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "4px 20px 8px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map(exp => (
          <ExperienceCard key={exp.id || exp.title} exp={exp} onBook={onBook} />
        ))}
        {/* Fader right */}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </div>
  );
}
