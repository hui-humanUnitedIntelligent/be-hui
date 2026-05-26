// ════════════════════════════════════════════════════════════════
// TalentBadge.jsx — Phase 4C
// Zeigt Talent / Creator Status in Feed, Profil, Stories, Chat
// Importieren: import TalentBadge from "../ui/TalentBadge";
// ════════════════════════════════════════════════════════════════
import React from "react";

const SIZES = {
  xs: { badge: { fontSize:9,  padding:"1px 5px",  borderRadius:6  }, ring:16, gap:3  },
  sm: { badge: { fontSize:10, padding:"2px 7px",  borderRadius:8  }, ring:20, gap:4  },
  md: { badge: { fontSize:11, padding:"3px 9px",  borderRadius:10 }, ring:24, gap:5  },
  lg: { badge: { fontSize:13, padding:"4px 12px", borderRadius:12 }, ring:32, gap:6  },
};

/**
 * TalentBadge — zeigt "Talent" Label wenn isTalent===true
 * Props:
 *   isTalent   boolean   — ob Nutzer Talent ist
 *   size       "xs"|"sm"|"md"|"lg"  — default "sm"
 *   style      object    — extra styles auf Wrapper
 *   showLabel  boolean   — Label-Text zeigen (default true)
 *   showRing   boolean   — Creator Ring um Avatar (default false, separat)
 */
export default function TalentBadge({ isTalent, size = "sm", style = {}, showLabel = true }) {
  if (!isTalent) return null;
  const s = SIZES[size] || SIZES.sm;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      ...s.badge,
      background:"linear-gradient(135deg, rgba(22,215,197,0.15) 0%, rgba(22,215,197,0.08) 100%)",
      border:"1px solid rgba(22,215,197,0.35)",
      color:"#16D7C5",
      fontWeight:700,
      letterSpacing:"0.02em",
      whiteSpace:"nowrap",
      userSelect:"none",
      ...style,
    }}>
      <span style={{ fontSize: s.badge.fontSize * 1.1 }}>✦</span>
      {showLabel && <span>Talent</span>}
    </span>
  );
}

/**
 * CreatorRing — teal Ring um Avatar-Container für Talent-User
 * Wrap Avatar mit: <CreatorRing isTalent={isTalent}><img .../></CreatorRing>
 */
export function CreatorRing({ isTalent, children, size = 40, style = {} }) {
  if (!isTalent) return <>{children}</>;
  return (
    <div style={{
      position:"relative",
      width:size, height:size,
      borderRadius:"50%",
      padding:2,
      background:"linear-gradient(135deg, #16D7C5, #0FB8AA)",
      boxShadow:"0 0 10px rgba(22,215,197,0.40)",
      flexShrink:0,
      ...style,
    }}>
      <div style={{
        width:"100%", height:"100%",
        borderRadius:"50%",
        overflow:"hidden",
        border:"1.5px solid rgba(255,255,255,0.90)",
      }}>
        {children}
      </div>
    </div>
  );
}

/**
 * MembershipLabel — für Feed-Cards: "Talent" oder "Mitglied"
 */
export function MembershipLabel({ membershipType, size = "xs", style = {} }) {
  if (!membershipType || membershipType === "base") return null;
  const s = SIZES[size] || SIZES.xs;
  const config = {
    talent:            { label:"Talent",          color:"#16D7C5", bg:"rgba(22,215,197,0.12)",  border:"rgba(22,215,197,0.30)", icon:"✦" },
    verified_talent:   { label:"Verifiziert",     color:"#16D7C5", bg:"rgba(22,215,197,0.18)",  border:"rgba(22,215,197,0.40)", icon:"✦✦" },
    community_creator: { label:"Creator",         color:"#FF8A6B", bg:"rgba(255,138,107,0.12)", border:"rgba(255,138,107,0.30)", icon:"◎" },
    raumhalter:        { label:"Raumhalter",      color:"#C084FC", bg:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.30)", icon:"◈" },
    guardian:          { label:"Guardian",        color:"#C084FC", bg:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.30)", icon:"◈" },
    team:              { label:"Team",            color:"#F5A623", bg:"rgba(245,166,35,0.12)",  border:"rgba(245,166,35,0.30)",  icon:"⬡" },
  }[membershipType] || { label:"Mitglied", color:"#16D7C5", bg:"rgba(22,215,197,0.10)", border:"rgba(22,215,197,0.25)", icon:"·" };

  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:2,
      ...s.badge,
      background:config.bg,
      border:`1px solid ${config.border}`,
      color:config.color,
      fontWeight:700,
      letterSpacing:"0.02em",
      userSelect:"none",
      ...style,
    }}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
