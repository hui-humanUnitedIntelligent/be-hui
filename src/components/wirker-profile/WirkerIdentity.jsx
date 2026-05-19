// components/wirker-profile/WirkerIdentity.jsx
// Name, Talent, Location, Mood-Pill, 4-Spalten Stats
// Screenshot-exact nach Mia Kern Design

import React from "react";

const C = {
  teal: "#16D7C5", coral: "#FF8A6B",
  ink: "#1A1A1A", ink2: "#3A3A3A",
  muted: "rgba(80,80,80,0.58)", cream: "#F9F7F4",
};

function StatCol({ value, label, last }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"14px 4px",
      borderRight: last ? "none" : "1px solid rgba(0,0,0,0.07)",
    }}>
      <span style={{
        fontSize:19, fontWeight:800, color:C.ink,
        letterSpacing:-0.3, lineHeight:1.1,
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>{value}</span>
      <span style={{ fontSize:11, color:C.muted, fontWeight:500, marginTop:3 }}>{label}</span>
    </div>
  );
}

export default function WirkerIdentity({ profile }) {
  const name     = profile?.display_name || profile?.name || "Kreative:r";
  const talent   = profile?.talent || profile?.focus_type || "Kreative:r";
  const location = profile?.location_label || profile?.location || profile?.city || null;
  const mood     = profile?.current_mood || "Gerade im Atelier";
  const verified = profile?.is_wirker || profile?.has_talent_profile || false;

  const erlebnisse   = profile?.experiences_count || profile?.bookings || 128;
  const gefolgt      = profile?.followers_count   || "2,4K";
  const wirkung      = profile?.impact_eur        || 8950;
  const verbindungen = profile?.connections_count || 312;

  const wirkungFmt = typeof wirkung === "number"
    ? "\u20AC" + wirkung.toLocaleString("de-DE")
    : String(wirkung);

  const fmt = v => {
    if (typeof v === "number" && v >= 1000)
      return (v/1000).toFixed(1).replace(".0","") + "K";
    return String(v);
  };

  return (
    <div style={{ padding:"54px 20px 0", background:C.cream }}>

      {/* Name + Verified */}
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
        <span style={{
          fontSize:24, fontWeight:800, color:C.ink,
          letterSpacing:-0.5, lineHeight:1.2,
          fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        }}>{name}</span>
        {verified && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}>
            <circle cx="10" cy="10" r="10" fill={C.teal}/>
            <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Talent */}
      <div style={{ fontSize:14.5, color:C.ink2, fontWeight:500, marginBottom:4 }}>{talent}</div>

      {/* Location */}
      {location && (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:10 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill={C.muted}/>
          </svg>
          <span style={{ fontSize:13, color:C.muted }}>{location}</span>
        </div>
      )}

      {/* Mood Pill */}
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"5px 13px", borderRadius:99,
        background:"rgba(22,215,197,0.09)",
        border:"1px solid rgba(22,215,197,0.22)",
        marginBottom:18,
      }}>
        <div style={{
          width:7, height:7, borderRadius:"50%", background:C.teal,
          boxShadow:"0 0 7px rgba(22,215,197,0.7)",
          animation:"wm-pulse 2.2s ease-in-out infinite",
        }}/>
        <span style={{ fontSize:12.5, fontWeight:600, color:C.teal }}>{mood}</span>
      </div>

      {/* Stats Bar */}
      <div style={{
        display:"flex",
        background:"white",
        borderRadius:18,
        boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
        overflow:"hidden",
        marginBottom:16,
      }}>
        <StatCol value={fmt(erlebnisse)} label="Erlebnisse"/>
        <StatCol value={fmt(gefolgt)}   label="Gefolgt"/>
        <StatCol value={wirkungFmt}     label="Wirkung"/>
        <StatCol value={fmt(verbindungen)} label="Verbindungen" last/>
      </div>

      <style>{`
        @keyframes wm-pulse {
          0%,100%{opacity:1;box-shadow:0 0 7px rgba(22,215,197,0.7);}
          50%{opacity:0.55;box-shadow:0 0 14px rgba(22,215,197,0.5);}
        }
      `}</style>
    </div>
  );
}
