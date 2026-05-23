import { createTabItem, filterValidPages } from '../../../lib/factories/createTabPage.js';
// sections/GallerySection.jsx
// Tab-Navigation + Content: Werke / Erlebnisse / Empfehlungen
// REGEL: Kein Supabase. Daten kommen per Props.

import React from "react";
import { filterValidFeedItems, createWorkItem, createExperienceItem } from '../../../lib/factories/createFeedItem.js';
import { HUI } from "../../../design/hui.design.js";

const C = {
  teal:    HUI.COLOR.teal,
  teal2:   HUI.COLOR.tealDeep,
  ink:     HUI.COLOR.ink,
  muted:   "#888",
  border:  "rgba(0,0,0,0.07)",
  cream:   HUI.COLOR.cream,
};

const TABS = filterValidPages([
  createTabItem({ key:"werke",        label:"Werke"        }),
  createTabItem({ key:"erlebnisse",   label:"Erlebnisse"   }),
  createTabItem({ key:"empfehlungen", label:"Empfehlungen" }),
]);

/**
 * @param {{
 *   activeTab:       string,
 *   onTabChange:     fn,
 *   works:           array,
 *   experiences:     array,
 *   recommendations: array,
 *   onWorkPress:     fn,
 *   onExpPress:      fn,
 * }} props
 */
export function GallerySection({
  activeTab, onTabChange,
  works, experiences, recommendations,
  onWorkPress, onExpPress,
}) {
  const safeWorks       = React.useMemo(() => filterValidFeedItems((works      ||[]).map(createWorkItem)),       [works]);
  const safeExperiences = React.useMemo(() => filterValidFeedItems(safeExperiences.map(createExperienceItem)), [experiences]);
  const safeRecs        = React.useMemo(() => filterValidFeedItems(recommendations||[]),                         [recommendations]);

  return (
    <div>
      {/* Sticky Tab Bar */}
      <div style={{
        position: "sticky", top: 52, zIndex: 30,
        background: C.cream,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        padding: "0 20px",
        gap: 0,
      }}>
        {(TABS||[]).filter(tab=>tab&&tab.key).map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none", background: "none",
                fontSize: 13.5, fontWeight: active ? 700 : 500,
                color: active ? C.teal : C.muted,
                cursor: "pointer",
                borderBottom: active
                  ? `2px solid ${C.teal}`
                  : "2px solid transparent",
                transition: "all 0.18s ease",
              }}
            >
              {tab.label}
              {tab.key === "empfehlungen" && recommendations.length > 0 && (
                <span style={{
                  marginLeft:4, fontSize:10, fontWeight:700,
                  color: C.teal,
                }}>
                  {recommendations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "16px 20px 80px", minHeight: 280 }}>
        {activeTab === "werke" && (
          <WorksGrid works={works} onPress={onWorkPress} />
        )}
        {activeTab === "erlebnisse" && (
          <ExpsGrid experiences={experiences} onPress={onExpPress} />
        )}
        {activeTab === "empfehlungen" && (
          <RecsGrid recommendations={recommendations} />
        )}
      </div>
    </div>
  );
}

/* ── Sub-Grids ───────────────────────────────────────────────────── */

function WorksGrid({ works, onPress }) {
  if (!works?.length) {
    return (
      <EmptyState icon="🎨" text="Noch keine Werke veröffentlicht" />
    );
  }
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"1fr 1fr",
      gap:10,
    }}>
      {works.map((w, i) => (
        <div
          key={w.id || i}
          onClick={() => onPress?.(w)}
          style={{
            borderRadius:16, overflow:"hidden",
            background:"#fff",
            boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
            cursor:"pointer",
            animation:`fadeUp 0.35s ${i*0.04}s both`,
          }}
        >
          <div style={{ height:140, overflow:"hidden" }}>
            <img
              src={w.cover_url || w.images?.[0] || `https://picsum.photos/seed/${w.id}/300/200`}
              alt={w.title}
              loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          </div>
          <div style={{ padding:"8px 10px 10px" }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:C.ink,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.title}
            </div>
            {w.price && (
              <div style={{ fontSize:12, color:C.teal, fontWeight:700, marginTop:2 }}>
                € {w.price}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpsGrid({ experiences, onPress }) {
  if (!experiences?.length) {
    return <EmptyState icon="✨" text="Noch keine Erlebnisse" />;
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {experiences.map((e, i) => (
        <div
          key={e.id || i}
          onClick={() => onPress?.(e)}
          style={{
            borderRadius:16,
            background:"#fff",
            boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
            overflow:"hidden", cursor:"pointer",
            display:"flex", alignItems:"stretch",
            animation:`fadeUp 0.35s ${i*0.05}s both`,
          }}
        >
          <div style={{ width:90, flexShrink:0 }}>
            <img
              src={e.cover_url || `https://picsum.photos/seed/${e.id}/200/200`}
              alt={e.title}
              loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          </div>
          <div style={{ flex:1, padding:"12px 14px" }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:C.ink, marginBottom:4 }}>
              {e.title}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              {e.location} · {e.date_text || e.date}
            </div>
            {e.spots_left != null && (
              <div style={{ fontSize:11, color:C.teal, fontWeight:700, marginTop:4 }}>
                Noch {e.spots_left} Plätze
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecsGrid({ recommendations }) {
  if (!recommendations?.length) {
    return <EmptyState icon="💬" text="Noch keine Empfehlungen" />;
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {recommendations.map((rec, i) => (
        <div
          key={rec.id || i}
          style={{
            background:"#fff",
            borderRadius:16,
            padding:"14px 16px",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
            animation:`fadeUp 0.35s ${i*0.05}s both`,
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <img
              src={rec.recommender_avatar || `https://i.pravatar.cc/32?img=${i+1}`}
              alt={rec.recommender_name}
              style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }}
            />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>
                {rec.recommender_name || "Anonym"}
              </div>
              {rec.quality && (
                <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
                  {rec.quality}
                </div>
              )}
            </div>
          </div>
          {rec.text && (
            <div style={{ fontSize:13, color:"#555", lineHeight:1.5, fontStyle:"italic" }}>
              "{rec.text}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      padding:"48px 20px",
      display:"flex", flexDirection:"column",
      alignItems:"center", gap:12,
      color:C.muted,
    }}>
      <span style={{ fontSize:36, opacity:0.4 }}>{icon}</span>
      <span style={{ fontSize:13, textAlign:"center", maxWidth:200 }}>{text}</span>
    </div>
  );
}
