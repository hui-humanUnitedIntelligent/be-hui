// WirkerMoments.jsx — Phase 24: Moments / Social Layer
// Calm editorial feed — no TikTok energy
import React from "react";
import { useTap, useScrollEntry } from "../../design/hui.hooks.js";

const safeArr = (v) => (Array.isArray(v) ? v : []);

const SEED_MOMENTS = [
  {
    id: "m1", type: "work_in_progress",
    time: "2 Std. zuvor",
    caption: "Neues Werk in Arbeit - Fragments of Light",
    reactions: 48,
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=75",
  },
  {
    id: "m2", type: "thought",
    time: "Gestern",
    caption: "Ein stiller Morgen im Atelier. So entstehen die besten Ideen.",
    reactions: 38,
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=75",
  },
  {
    id: "m3", type: "inspiration",
    time: "2 Tage zuvor",
    caption: "Inspiration pur: Dankbar für diese Momente in der Natur.",
    reactions: 52,
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=75",
  },
  {
    id: "m4", type: "community",
    time: "3 Tage zuvor",
    caption: "Wundervoller Musikabend mit so talen Menschen.",
    reactions: 41,
    img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=75",
  },
];

function MomentCard({ moment }) {
  const tap = useTap();
  return (
    <div
      {...tap}
      style={{
        flexShrink: 0,
        width: 160,
        borderRadius: 18,
        overflow: "hidden",
        background: "white",
        boxShadow: "0 3px 16px rgba(0,0,0,0.07)",
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      {/* Image */}
      <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
        <img
          src={moment.img}
          alt={moment.caption}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.background = "#f5f5f5"; e.target.style.display = "none"; }}
        />
        {/* Time overlay */}
        <div style={{
          position: "absolute", bottom: 6, left: 8,
          fontSize: 9, color: "rgba(255,255,255,0.85)",
          fontWeight: 600,
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}>{moment.time}</div>
      </div>

      {/* Caption */}
      <div style={{ padding: "10px 11px 12px" }}>
        <div style={{
          fontSize: 11, color: "#333",
          lineHeight: 1.4, fontWeight: 500,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{moment.caption}</div>

        {/* Reactions */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          marginTop: 8, fontSize: 10, color: "#999",
        }}>
          <span>💛</span>
          <span style={{ fontWeight: 600 }}>{moment.reactions}</span>
          <span>Resonanzen</span>
        </div>
      </div>
    </div>
  );
}

export default function WirkerMoments({ moments, onSeeAll }) {
  const entry = useScrollEntry();
  const items = safeArr(moments).length > 0 ? safeArr(moments) : SEED_MOMENTS;

  return (
    <div
      ref={entry.ref}
      style={{
        width: "100%",
        background: "white",
        padding: "24px 0 20px",
        opacity: entry.visible ? 1 : 0,
        transform: entry.visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "0 20px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.025em" }}>
            Aktuelle Momente
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Neues aus meinem Universum.
          </div>
        </div>
        <span
          onClick={onSeeAll}
          style={{ fontSize: 12, color: "#0DC4B5", fontWeight: 700, cursor: "pointer" }}
        >Alle Momente →</span>
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display: "flex", gap: 12,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "4px 20px 8px",
        WebkitOverflowScrolling: "touch",
      }}>
        {items.map(m => <MomentCard key={m.id} moment={m} />)}
        <div style={{ flexShrink: 0, width: 4 }} />
      </div>
    </div>
  );
}
