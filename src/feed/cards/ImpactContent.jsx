/**
 * ImpactContent.jsx — Feed-Karte für Herzensprojekte
 * IMPACT-CLICK-002 (2026-07-16) — BaseFeedCard-konformes Layout
 *
 * Identischer Aufbau wie WorkContent/ExperienceContent/TalentContent:
 * Header + Bild (via BaseFeedCard.FeedMedia) + Badge + Titel + Progress
 * Karte anklicken → ContentPreviewSheet → "Zum Herzensprojekt" → Impact-Tab
 */
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const GREEN      = "rgba(34,197,94,1)";
const GREEN_SOFT = "rgba(34,197,94,0.10)";
const INK        = "#1A1A2E";
const INK_SUB    = "rgba(26,26,46,0.45)";

const RANK_MEDAL = { 1:"🥇", 2:"🥈", 3:"🥉" };
const RANK_LABEL = { 1:"Top 1", 2:"Top 2", 3:"Top 3" };

function ProgressBar({ current, goal }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:INK_SUB }}>Gesammelt</span>
        <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>
          {pct.toFixed(0)}% · €{(current || 0).toLocaleString("de-DE")}
        </span>
      </div>
      <div style={{ height:5, borderRadius:3, background:"rgba(26,26,46,0.07)", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${GREEN}, rgba(34,197,94,0.6))`,
          transition:"width 0.4s ease",
        }}/>
      </div>
    </div>
  );
}

export default function ImpactContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const raw   = item._raw || {};
  const title = item.title || raw.project_name || raw.name || "";
  const desc  = item.text  || raw.short_desc   || raw.problem || raw.description || "";
  const rank  = raw.rank   || null;
  const goal  = raw.funding_goal       || 0;
  const curr  = raw.current_amount_eur || 0;

  const badgeText = rank && RANK_MEDAL[rank]
    ? `${RANK_MEDAL[rank]} ${RANK_LABEL[rank]}`
    : "Herzensprojekt";

  const { open } = useContentPreview();
  const handleCardClick = () => open({
    ...item,
    canOpenFull: true,
    fullPath: null,
    _onOpenFull: () => {
      window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "impact" } }));
    },
  });

  // Fallback-Banner wenn kein Bild vorhanden (identisch zu ContentPreviewSheet's project-Fallback)
  const hasMedia = Array.isArray(item.media) ? item.media.length > 0 : !!item.media;
  const projectEmoji = raw.icon || "💚";

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Fallback-Banner wenn kein Bild vorhanden */}
      {!hasMedia && (
        <div style={{
          margin: "0 0 12px",
          height: 140, borderRadius: 14,
          background: rank
            ? (rank===1 ? "linear-gradient(135deg,rgba(251,191,36,0.18),rgba(251,191,36,0.06))"
              : rank===2 ? "linear-gradient(135deg,rgba(156,163,175,0.18),rgba(156,163,175,0.06))"
              : "linear-gradient(135deg,rgba(180,113,67,0.18),rgba(180,113,67,0.06))")
            : "linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.04))",
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative", overflow:"hidden",
        }}>
          {/* Dekorative Kreise im Hintergrund */}
          <div style={{
            position:"absolute", top:-20, right:-20,
            width:100, height:100, borderRadius:"50%",
            background:"rgba(34,197,94,0.08)",
          }}/>
          <div style={{
            position:"absolute", bottom:-30, left:-10,
            width:80, height:80, borderRadius:"50%",
            background:"rgba(34,197,94,0.06)",
          }}/>
          {/* Rang-Badge */}
          {rank && RANK_MEDAL[rank] && (
            <div style={{
              position:"absolute", top:10, left:10,
              background: rank===1?"rgba(251,191,36,1)":rank===2?"rgba(156,163,175,1)":"rgba(180,113,67,1)",
              color:"#fff", fontSize:10, fontWeight:700,
              padding:"3px 10px", borderRadius:20,
            }}>{RANK_MEDAL[rank]} {RANK_LABEL[rank]}</div>
          )}
          <span style={{ fontSize:48, filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}>
            {projectEmoji}
          </span>
        </div>
      )}

      {/* Beschreibung (optional, über Badge/Titel) */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400,
          color:"rgba(26,26,46,0.65)", lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* Badge + Titel — gleiche Struktur wie WorkContent/ExperienceContent */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        marginBottom: goal > 0 ? 4 : 0, flexWrap:"nowrap",
      }}>
        <span style={{
          flexShrink:0,
          fontSize:10.5, fontWeight:700, color:GREEN,
          background:GREEN_SOFT,
          border:`1px solid rgba(34,197,94,0.22)`,
          borderRadius:99, padding:"3px 9px",
          letterSpacing:0.2, whiteSpace:"nowrap",
        }}>💚 {badgeText}</span>
        {title && (
          <span style={{
            fontSize:15, fontWeight:700, color:INK,
            lineHeight:1.3, letterSpacing:"-0.02em",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            flex:1, minWidth:0,
          }}>{title}</span>
        )}
      </div>

      {/* Fortschrittsbalken */}
      {goal > 0 && <ProgressBar current={curr} goal={goal} />}
    </BaseFeedCard>
  );
}
