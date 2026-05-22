// src/pages/creator-profile/index.jsx v2
// HUI Creator Profile — OWNER VIEW ONLY
// Cinematic creator dashboard
// DEBUG: zeigt "CREATOR PROFILE ACTIVE" Banner temporär

import React, { useState } from "react";
import CreatorHero            from "../../components/creator-profile/CreatorHero.jsx";
import CreatorIdentityCard    from "../../components/creator-profile/CreatorIdentityCard.jsx";
import CreatorStatsBar        from "../../components/creator-profile/CreatorStatsBar.jsx";
import CreatorImpactCard      from "../../components/creator-profile/CreatorImpactCard.jsx";
import CreatorSpacesSection   from "../../components/creator-profile/CreatorSpacesSection.jsx";
import CreatorWorksSection    from "../../components/creator-profile/CreatorWorksSection.jsx";
import CreatorFloatingActions from "../../components/creator-profile/CreatorFloatingActions.jsx";

const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  ink:    "#1A1A1A",
  muted:  "rgba(80,80,80,0.55)",
  cream:  "#F9F7F4",
};

const TABS = [
  { key:"bewegung",   label:"Bewegung"    },
  { key:"werke",      label:"Werke"       },
  { key:"erlebnisse", label:"Erlebnisse"  },
  { key:"wirkung",    label:"Wirkung"     },
  { key:"verbindung", label:"Verbindung"  },
  { key:"raum",       label:"Raum"        },
];

function DebugBanner() {
  return (
    <div style={{
      position:"fixed",
      top:0, left:0, right:0,
      zIndex:99999,
      background:"rgba(22,215,197,0.92)",
      color:"white",
      fontSize:11,
      fontWeight:700,
      textAlign:"center",
      padding:"4px 8px",
      letterSpacing:1,
      pointerEvents:"none",
    }}>
      CREATOR PROFILE ACTIVE
    </div>
  );
}

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
      {(TABS||[]).filter(t=>t&&t.key).map(t => {
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
              borderBottom: isActive
                ? ("2.5px solid " + C.teal)
                : "2.5px solid transparent",
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
  const profile = externalProfile || rawWirker || {};

  function handleClose()    { onClose?.(); }
  function handleEdit()     { onAction?.("edit"); }
  function handleAction(k)  { onAction?.(k); }

  return (
    <>
      {/* ── Debug Banner ── TEMPORÄR ── */}
      <DebugBanner />

      <div style={{
        position:      "fixed",
        inset:         0,
        zIndex:        9500,
        background:    C.cream,
        display:       "flex",
        flexDirection: "column",
        overflowY:     "hidden",
        fontFamily:    "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>
        {/* Scrollable content */}
        <div
          className="hui-scroll"
          style={{
            flex:1,
            overflowY:"auto",
            overflowX:"hidden",
            WebkitOverflowScrolling:"touch",
            paddingTop: 18, /* Platz für Debug-Banner */
          }}
        >
          <CreatorHero
            profile={profile}
            onClose={handleClose}
            onEdit={handleEdit}
          />
          <CreatorIdentityCard
            profile={profile}
            onEdit={handleEdit}
          />
          <CreatorStatsBar profile={profile}/>
          <CreatorBio profile={profile}/>
          <CreatorImpactCard profile={profile}/>
          <CreatorSpacesSection profile={profile}/>
          <div style={{ marginTop:20 }}>
            <TabBar active={activeTab} onChange={setActiveTab}/>
          </div>
          <div style={{ paddingTop:16, paddingBottom:20 }}>
            <CreatorWorksSection
              activeTab={activeTab}
              works={works}
              experiences={experiences}
            />
          </div>
          <div style={{ height:24 }}/>
        </div>

        <CreatorFloatingActions onAction={handleAction}/>
      </div>
    </>
  );
}
