// components/creator-profile/CreatorStatsBar.jsx
// HUI-style metrics — Wirkung statt Vanity

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", muted:"rgba(80,80,80,0.55)" };

function StatItem({ value, label }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"14px 6px",
      borderRight:"1px solid rgba(0,0,0,0.06)",
    }}>
      <span style={{
        fontSize:20, fontWeight:800, color:C.ink,
        letterSpacing:-0.3,
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>{value}</span>
      <span style={{ fontSize:11, color:C.muted, fontWeight:500, marginTop:2 }}>{label}</span>
    </div>
  );
}

export default function CreatorStatsBar({ profile }) {
  const erlebnisse  = profile?.experiences_count || profile?.bookings || 24;
  const gefolgt     = profile?.followers_count   || profile?.followers || "1,8K";
  const wirkung     = profile?.impact_eur        || profile?.impactEur || "€8.950";
  const verbindungen= profile?.connections_count || profile?.recommendations_count || 189;

  const fmt = (v) => {
    if (typeof v === "number") {
      if (v >= 1000) return (v/1000).toFixed(1).replace(".0","") + "K";
      return String(v);
    }
    return String(v);
  };

  const wirkungDisplay = typeof wirkung === "number"
    ? `€${wirkung.toLocaleString("de-DE")}`
    : String(wirkung);

  return (
    <div style={{
      margin:"20px 20px 0",
      background:"white",
      borderRadius:20,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      overflow:"hidden",
      display:"flex",
    }}>
      <StatItem value={fmt(erlebnisse)} label="Erlebnisse"/>
      <StatItem value={fmt(gefolgt)}   label="Gefolgt"/>
      <StatItem value={wirkungDisplay} label="Wirkung"/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"14px 6px" }}>
        <span style={{ fontSize:20, fontWeight:800, color:C.ink, letterSpacing:-0.3,
          fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
          {fmt(verbindungen)}
        </span>
        <span style={{ fontSize:11, color:C.muted, fontWeight:500, marginTop:2 }}>Verbindungen</span>
      </div>
    </div>
  );
}
