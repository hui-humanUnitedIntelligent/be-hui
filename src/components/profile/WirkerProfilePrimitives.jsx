// src/components/profile/WirkerProfilePrimitives.jsx
// HUI — WirkerProfile Primitive Components — Phase 5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Pure presentational components aus WirkerProfilePage.jsx extrahiert.
// Kein State. Kein Supabase. Kein Seiteneffekt.
// Einfach: Props rein → JSX raus.
//
// INHALTE:
//   Skel            — universeller Skeleton-Placeholder
//   ProfileSkeleton — vollständiger Profil-Ladezustand
//   RecCard         — Empfehlungs-Karte mit Mood-Analyse
// ═══════════════════════════════════════════════════════════════

import React from 'react';

// ── Design Tokens (lokal — kein import von WirkerProfilePage) ──
const C = {
  cream:    '#F9F7F4',
  card:     '#FFFFFF',
  border:   '#EEEBE6',
  ink:      '#1A1A1A',
  ink2:     '#2C2C2C',
  muted:    '#888888',
  teal:     '#16D7C5',
  coral:    '#FF8A6B',
  gold:     '#F59E0B',
  green:    '#22C55E',
  tealPale: '#F0FAF9',
  coralPale:'#FFF2EE',
  goldPale: '#FFFBEB',
};

// ── Skel ──────────────────────────────────────────────────────
// Universeller Skeleton-Block. h/w/r in px oder '%'.
function Skel({ w="100%", h=16, r=10, style={} }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"rgba(0,0,0,0.08)",
    animation:"pulse 1.5s ease-in-out infinite", ...style }}/>;
}

// ── ProfileSkeleton ───────────────────────────────────────────
// Zeigt während Profil-Daten geladen werden.
function ProfileSkeleton() {
  return (
    <div style={{ background:C.cream, minHeight:"100vh" }}>
      {/* Hero skeleton */}
      <div style={{ height:280, background:"rgba(0,0,0,0.09)",
        animation:"pulse 1.5s ease-in-out infinite" }}/>
      <div style={{ padding:"0 20px", marginTop:-40 }}>
        <Skel w={80} h={80} r={40} style={{ marginBottom:14, border:"3px solid white" }}/>
        <Skel w="55%" h={24} r={8} style={{ marginBottom:8 }}/>
        <Skel w="38%" h={14} r={6} style={{ marginBottom:16 }}/>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <Skel h={42} r={999} style={{ flex:1 }}/>
          <Skel h={42} r={999} style={{ flex:1 }}/>
          <Skel h={42} r={999} style={{ flex:1 }}/>
        </div>
      </div>
    </div>
  );
}

// ── RecCard ───────────────────────────────────────────────────
// Empfehlungs-Karte mit Text-basierter Mood-Erkennung.
function RecCard({ rec }) {
  // Mood aus Text ableiten
  const txt  = (rec.text||"").toLowerCase();
  const mood = txt.includes("kreativ") ? { label:"kreativ", color:"#8B5CF6", bg:"rgba(139,92,246,0.08)" }
    : txt.includes("ruhig")||txt.includes("angenehm") ? { label:"ruhig", color:C.teal, bg:"rgba(22,215,197,0.08)" }
    : txt.includes("warm")||txt.includes("herzlich")  ? { label:"warm",  color:C.coral,bg:"rgba(255,138,107,0.08)" }
    : txt.includes("professionell")||txt.includes("präzise") ? { label:"profi", color:C.gold, bg:"rgba(245,166,35,0.08)" }
    : txt.includes("authentisch")||txt.includes("echt") ? { label:"echt", color:C.green, bg:"rgba(16,185,129,0.08)" }
    : { label:"inspirierend", color:C.teal, bg:"rgba(22,215,197,0.08)" };
  const date = rec.created_at
    ? new Date(rec.created_at).toLocaleDateString("de-DE",{month:"long",year:"numeric"}) : "";
  return (
    <div style={{ background:C.card, borderRadius:20, marginBottom:12,
      border:`1px solid ${C.border}`,
      boxShadow:"0 1px 12px rgba(0,0,0,0.05)", overflow:"hidden",
      animation:"slideUp .32s ease both" }}>
      <div style={{ height:3, background:mood.color }} />
      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:900, color:"white" }}>
            {(rec.reviewer_name||"?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:13.5, color:C.ink }}>
              {rec.reviewer_name || "HUI-Mitglied"}
            </div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>
              {rec.work_title ? `Zu: ${rec.work_title}` : "Persönliche Erfahrung"}
              {date && ` · ${date}`}
            </div>
          </div>
          <div style={{ padding:"4px 10px", borderRadius:50, flexShrink:0,
            background:mood.bg, border:`1px solid ${mood.color}33`,
            fontSize:11, fontWeight:700, color:mood.color }}>
            {mood.label}
          </div>
        </div>
        {rec.text && (
          <p style={{ margin:"0 0 10px", fontSize:14, color:C.ink2,
            lineHeight:1.7, fontStyle:"italic" }}>
            „{rec.text}"
          </p>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.green }} />
          <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>
            Verifizierte Empfehlung nach Buchungsabschluss
          </span>
        </div>
      </div>
    </div>
  );
}
