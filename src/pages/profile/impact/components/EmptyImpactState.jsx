import React from "react";
import { T } from "../tokens.js";

export function EmptyImpactState({ type = "voting" }) {
  const configs = {
    voting: {
      icon: "🗳",
      title: "Noch keine Projekte in der Abstimmung",
      text: "Sobald Herzensprojekte vom HUI-Team geprüft und nominiert wurden, erscheinen sie hier.",
    },
    weitere: {
      icon: "🌱",
      title: "Noch keine weiteren Herzensprojekte",
      text: "Eingereichte Projekte erscheinen hier, sobald sie vom HUI-Team geprüft wurden.",
    },
    bewilligt: {
      icon: "💚",
      title: "Noch keine bewilligten Projekte",
      text: "Sobald ein Herzensprojekt bewilligt wird, erscheint es hier.",
    },
  };
  const cfg = configs[type] || configs.voting;
  return (
    <div style={{
      textAlign:"center", padding:"36px 24px",
      background:"rgba(13,196,181,0.04)",
      border:"1px dashed rgba(13,196,181,0.25)",
      borderRadius:20, margin:"0 16px",
    }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{cfg.icon}</div>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:8 }}>
        {cfg.title}
      </div>
      <div style={{ fontSize:13, color:T.ink2, lineHeight:1.6 }}>
        {cfg.text}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// WeitereHerzensSection — Platz 2-5 approved + Fallback Seed
// ════════════════════════════════════════════════════════════════
