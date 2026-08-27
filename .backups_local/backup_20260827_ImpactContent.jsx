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
import { formatNumberDE } from "../../lib/formatters.js";

const GREEN      = "rgba(34,197,94,1)";
const GREEN_SOFT = "rgba(34,197,94,0.10)";
const INK        = "#1A1A2E";
const INK_SUB    = "rgba(26,26,46,0.45)";

// IMPACT-IMG-001: Stabiler Unsplash-Fallback für Projekte ohne eigenes Bild.
// Als Modul-Konstante → wird einmal evaluiert, nie neu erzeugt.
// IMPACT_FALLBACK removed — FeedMedia in BaseFeedCard handles image rendering now

const RANK_MEDAL = { 1:"🥇", 2:"🥈", 3:"🥉" };
const RANK_LABEL = { 1:"Top 1", 2:"Top 2", 3:"Top 3" };

function ProgressBar({ current, goal }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:INK_SUB }}>Gesammelt</span>
        <span style={{ fontSize:11, color:GREEN, fontWeight: 600 }}>
          {pct.toFixed(0)}% · €{formatNumberDE((current || 0))}
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
  const descRaw  = item.text  || raw.short_desc   || raw.problem || raw.description || "";
  // FIX: Normalizer setzt title=text.slice(0,60) → desc könnte identisch sein
  const desc  = (descRaw && title && (descRaw.trim() === title.trim() || descRaw.trim().startsWith(title.trim()))) ? null : descRaw;
  const rank  = raw.rank   || null;
  const goal  = raw.funding_goal       || 0;
  const curr  = raw.current_amount_eur || 0;
  const isCompleted = raw.is_completed === true || (goal > 0 && curr >= goal);

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

return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Badge — alleine auf einer Zeile */}
      <div style={{ marginBottom:6 }}>
        <span style={{
          fontSize:10.5, fontWeight: 600, color:GREEN,
          background:GREEN_SOFT,
          border:`1px solid rgba(34,197,94,0.22)`,
          borderRadius:99, padding:"3px 9px",
          letterSpacing:0.2, whiteSpace:"nowrap",
        }}>💚 {badgeText}</span>
      </div>

      {/* Titel — 2-3 Zeilen, nicht abgeschnitten */}
      {title && (
        <h3 style={{
          margin:"0 0 6px", fontSize:15, fontWeight: 600, color:INK,
          lineHeight:1.3, letterSpacing:"-0.02em",
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical",
        }}>{title}</h3>
      )}

      {/* Wunsch-Betrag erreicht (nur bei abgeschlossenen Projekten) */}
      {isCompleted && goal > 0 && (
        <p style={{
          margin:"0 0 8px", fontSize:12, fontWeight:400,
          color:INK_SUB, lineHeight:1.4,
        }}>
          Der Wunsch-Betrag von €{formatNumberDE(goal)} wurde erreicht.
        </p>
      )}

      {/* Fortschrittsbalken (nur bei nicht-abgeschlossenen Projekten) */}
      {!isCompleted && goal > 0 && <ProgressBar current={curr} goal={goal} />}
    </BaseFeedCard>
  );
}
