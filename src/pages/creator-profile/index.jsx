// src/pages/creator-profile/index.jsx
// HUI Creator Profile — Owner View
// Cinematic creator dashboard — NOT a social media profile
//
// REGEL: Nur laden wenn wirker._isOwnerView === true
// REGEL: Kein direkter Supabase-Write. Daten kommen via props/context.

import React, { useState } from "react";
import CreatorHero            from "../../components/creator-profile/CreatorHero.jsx";
import CreatorIdentityCard    from "../../components/creator-profile/CreatorIdentityCard.jsx";
import CreatorStatsBar        from "../../components/creator-profile/CreatorStatsBar.jsx";
import CreatorImpactCard      from "../../components/creator-profile/CreatorImpactCard.jsx";
import CreatorSpacesSection   from "../../components/creator-profile/CreatorSpacesSection.jsx";
import CreatorWorksSection    from "../../components/creator-profile/CreatorWorksSection.jsx";
import CreatorFloatingActions from "../../components/creator-profile/CreatorFloatingActions.jsx";

/* ── Design Tokens ─────────────────────────────────────────── */
const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  ink:    "#1A1A1A",
  muted:  "rgba(80,80,80,0.55)",
  cream:  "#F9F7F4",
};

/* ── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { key:"bewegung",   label:"Bewegung"    },
  { key:"werke",      label:"Werke"       },
  { key:"erlebnisse", label:"Erlebnisse"  },
  { key:"wirkung",    label:"Wirkung"     },
  { key:"verbindung", label:"Verbindung"  },
  { key:"raum",       label:"Raum"        },
];

/* ── Bio / Intro ─────────────────────────────────────────────── */
function CreatorBio({ profile }) {
  const bio = profile?.bio
    || "Ich forme Erde, R\u00e4ume und Begegnungen.\nInspiriert von der Natur, getragen von Gemeinschaft.";
  return (
    <div style={{ padding:"16px 20px 0" }}>
      <p style={{
        margin:0, fontSize:14.5, lineHeight:1.65,
        color:"rgba(30,30,30,0.72)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
        whiteSpace:"pre-line",
      }}>{bio}</p>
    </div>
  );
}

/* ── Tab Bar ─────────────────────────────────────────────────── */
function TabBar({ active, onChange }) {
  return (
    <div className="hui-scroll" style={{
      display:"flex",
      overflowX:"auto", overflowY:"hidden",
      borderBottom:"1px solid rgba(0,0,0,0.08)",
      padding:"0 20px",
      WebkitOverflowScrolling:"touch",
      gap:0,
    }}>
      {TABS.map(t => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              flexShrink:0, padding:"12px 14px",
              border:"none", background:"none",
              cursor:"pointer",
              fontSize:13.5, fontWeight: isActive ? 700 : 500,
              color: isActive ? C.teal : C.muted,
              borderBottom: isActive ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
              transition:"color 0.18s, border-color 0.18s",
              WebkitTapHighlightColor:"transparent",
              touchAction:"manipulation",
            }}
          >{t.label}</button>
        );
      })}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function CreatorProfilePage({
  wirker:  rawWirker,
  profile: externalProfile,
  works       = [],
  experiences = [],
  onClose,
  onEdit,
  onAction,
}) {
  const [activeTab, setActiveTab] = useState("bewegung");

  // Profile: entweder extern übergeben oder aus rawWirker bauen
  const profile = externalProfile || rawWirker || {};

  function handleClose() {
    onClose?.();
  }
  function handleEdit() {
    onAction?.("edit");
  }
  function handleAction(key) {
    onAction?.(key);
  }

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     9500,
      background: C.cream,
      display:    "flex",
      flexDirection: "column",
      overflowY:  "hidden",
    }}>

      {/* Scrollable content */}
      <div
        className="hui-scroll"
        style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}
      >
        {/* ── Hero: cinematic atmosphere ── */}
        <CreatorHero
          profile={profile}
          onClose={handleClose}
          onEdit={handleEdit}
        />

        {/* ── Identity: name, talent, location, mood ── */}
        <CreatorIdentityCard
          profile={profile}
          onEdit={handleEdit}
        />

        {/* ── Stats: HUI metrics ── */}
        <CreatorStatsBar profile={profile}/>

        {/* ── Bio / Intro ── */}
        <CreatorBio profile={profile}/>

        {/* ── Impact Card ── */}
        <CreatorImpactCard profile={profile}/>

        {/* ── Creative Spaces (horizontal scroll) ── */}
        <CreatorSpacesSection profile={profile}/>

        {/* ── Tab Bar ── */}
        <div style={{ marginTop:20 }}>
          <TabBar active={activeTab} onChange={setActiveTab}/>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ paddingTop:16, paddingBottom:20 }}>
          <CreatorWorksSection
            activeTab={activeTab}
            works={works}
            experiences={experiences}
          />
        </div>

        {/* Bottom padding for floating bar */}
        <div style={{ height:24 }}/>
      </div>

      {/* ── Floating Action Bar (sticky bottom) ── */}
      <CreatorFloatingActions onAction={handleAction}/>
    </div>
  );
}
