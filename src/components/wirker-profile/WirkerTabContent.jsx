// components/wirker-profile/WirkerTabContent.jsx
// Tab Bar + Content Sections
// Screenshot-exact: Bewegung | Werke | Erlebnisse | Wirkung | Verbindung | Raum

import React from "react";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"rgba(80,80,80,0.55)", cream:"#F9F7F4",
};

const TABS = [
  { key:"bewegung",   label:"Bewegung"   },
  { key:"werke",      label:"Werke"      },
  { key:"erlebnisse", label:"Erlebnisse" },
  { key:"wirkung",    label:"Wirkung"    },
  { key:"verbindung", label:"Verbindung" },
  { key:"raum",       label:"Raum"       },
];

/* ── Activity Card — Screenshot-exact ── */
function ActivityCard({ item }) {
  const coverBg = item.cover_url
    ? `url(${item.cover_url}) center/cover no-repeat`
    : "linear-gradient(135deg,#b8e4c9 0%,#7bc8a4 50%,#5aaa85 100%)";
  return (
    <div style={{
      borderRadius:20,
      overflow:"hidden",
      boxShadow:"0 4px 20px rgba(0,0,0,0.10)",
      marginBottom:14,
      background:"white",
    }}>
      {/* Cover Image */}
      <div style={{ height:160, background:coverBg, position:"relative" }}>
        {item.badge && (
          <div style={{
            position:"absolute", top:12, left:12,
            padding:"4px 10px", borderRadius:99,
            background:"rgba(22,215,197,0.90)",
            backdropFilter:"blur(8px)",
            fontSize:11.5, fontWeight:700, color:"white",
            letterSpacing:0.2,
          }}>{item.badge}</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:"14px 16px 16px" }}>
        <div style={{
          fontSize:16, fontWeight:800, color:C.ink,
          marginBottom:5, lineHeight:1.3,
        }}>{item.title}</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>
          {item.when_full} · {item.location_label}
        </div>
        {item.spots_left != null && (
          <div style={{
            fontSize:13, fontWeight:700, color:C.teal,
          }}>Noch {item.spots_left} {item.spots_left === 1 ? "Platz" : "Pl\u00e4tze"} frei</div>
        )}
      </div>
    </div>
  );
}

/* ── Work Card ── */
function WorkCard({ work }) {
  return (
    <div style={{
      width:152, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      boxShadow:"0 4px 14px rgba(0,0,0,0.08)",
      background:"white",
    }}>
      <div style={{
        height:120,
        background: work.cover_url
          ? `url(${work.cover_url}) center/cover no-repeat`
          : `linear-gradient(135deg,${C.teal}22,${C.coral}15)`,
      }}/>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:2 }}>
          {work.title}
        </div>
        {work.price && (
          <div style={{ fontSize:12, color:C.teal, fontWeight:700 }}>
            \u20AC{work.price}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ emoji, text }) {
  return (
    <div style={{
      textAlign:"center", padding:"48px 20px",
      color:"rgba(80,80,80,0.35)",
    }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{emoji}</div>
      <div style={{ fontSize:13 }}>{text}</div>
    </div>
  );
}

/* ── Tab Bar ── */
function TabBar({ active, onChange }) {
  return (
    <div className="hui-scroll" style={{
      display:"flex", overflowX:"auto", overflowY:"hidden",
      borderBottom:"1px solid rgba(0,0,0,0.08)",
      padding:"0 20px", gap:0,
      WebkitOverflowScrolling:"touch",
    }}>
      {TABS.map(t => {
        const on = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            flexShrink:0, padding:"12px 14px",
            border:"none", background:"none", cursor:"pointer",
            fontSize:13.5, fontWeight: on ? 700 : 500,
            color: on ? C.ink : C.muted,
            borderBottom: on
              ? "2.5px solid " + C.ink
              : "2.5px solid transparent",
            transition:"color 0.15s, border-color 0.15s",
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

/* ── Main Export ── */
const MOCK_ACTIVITIES = [
  {
    id:1, title:"Sommer Retreat",
    badge:"Neu",
    when_full:"16. \u2013 18. Juni", location_label:"Schwarzwald",
    spots_left:5, cover_url:null,
  },
  {
    id:2, title:"Keramik Workshop",
    badge:"Bald",
    when_full:"Fr \u00b7 18:00", location_label:"M\u00fcnchen",
    spots_left:3, cover_url:null,
  },
];

const MOCK_WORKS = [
  { id:1, title:"Keramik Schale", price:89 },
  { id:2, title:"Ton Vase", price:120 },
  { id:3, title:"Wandobjekt", price:240 },
];

export default function WirkerTabContent({
  activeTab, onTabChange,
  works, experiences, activities,
}) {
  const renderContent = () => {
    if (activeTab === "bewegung") {
      const items = activities?.length ? activities : MOCK_ACTIVITIES;
      return (
        <div style={{ padding:"16px 20px 0" }}>
          {items.map(i => <ActivityCard key={i.id} item={i}/>)}
        </div>
      );
    }
    if (activeTab === "werke") {
      const items = works?.length ? works : MOCK_WORKS;
      return (
        <div className="hui-scroll" style={{
          display:"flex", gap:14, overflowX:"auto",
          padding:"16px 20px", WebkitOverflowScrolling:"touch",
        }}>
          {items.map(w => <WorkCard key={w.id} work={w}/>)}
        </div>
      );
    }
    if (activeTab === "erlebnisse") {
      const items = experiences?.length ? experiences : MOCK_ACTIVITIES;
      return (
        <div style={{ padding:"16px 20px 0" }}>
          {items.map(i => <ActivityCard key={i.id} item={i}/>)}
        </div>
      );
    }
    return <EmptyState emoji="✦" text="Dieser Bereich entfaltet sich bald"/>;
  };

  return (
    <div style={{ marginTop:4 }}>
      <TabBar active={activeTab} onChange={onTabChange}/>
      {renderContent()}
    </div>
  );
}
