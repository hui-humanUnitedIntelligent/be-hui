/**
 * ImpactContent.jsx — Feed-Karte für Herzensprojekte
 * FEED-GLOBAL-001 (2026-07-16) | IMPACT-CLICK-001 (2026-07-16)
 *
 * Klick → ContentPreviewSheet öffnet sich mit allen Projekt-Infos
 * + "Zum Projekt" Button navigiert zum Impact-Tab
 */
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const GREEN      = "rgba(34,197,94,1)";
const GREEN_SOFT = "rgba(34,197,94,0.10)";
const INK        = "rgba(26,26,46,0.85)";
const INK_SUB    = "rgba(26,26,46,0.45)";

const RANK_MEDAL  = { 1:"🥇", 2:"🥈", 3:"🥉" };
const RANK_LABEL  = { 1:"Top 1", 2:"Top 2", 3:"Top 3" };

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

  const raw    = item._raw  || {};
  const title  = item.title || raw.project_name || raw.name || "";
  const desc   = item.text  || raw.short_desc   || raw.problem || raw.description || "";
  const cover  = raw.cover_url || raw.media_urls?.[0] || null;
  const rank   = raw.rank  || null;
  const goal   = raw.funding_goal || 0;
  const curr   = raw.current_amount_eur || 0;
  const medal  = rank && RANK_MEDAL[rank] ? RANK_MEDAL[rank] : null;
  const badge  = medal ? `${medal} ${RANK_LABEL[rank]}` : "Herzensprojekt";

  const { open } = useContentPreview();

  // Beim Klick: ContentPreviewSheet öffnen mit "Zum Projekt"-Button
  // der per CustomEvent den Impact-Tab navigiert
  const handleCardClick = () => {
    open({
      ...item,
      // Impact navigiert zum Impact-Tab via CustomEvent
      canOpenFull: true,
      fullPath: null, // kein URL-Pfad — wird via onOpenFull gehandhabt
      _onOpenFull: () => {
        window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "impact" } }));
      },
    });
  };

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Cover-Bild */}
      {cover && (
        <div style={{ margin:"0 0 10px", borderRadius:14, overflow:"hidden",
          width:"100%", paddingTop:"50%", position:"relative",
          background:"rgba(26,26,46,0.04)" }}>
          <img src={cover} alt={title} loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.currentTarget.parentElement.style.display="none"; }}
          />
          {/* Rang-Badge über dem Bild */}
          <div style={{
            position:"absolute", top:10, left:10,
            background:rank ? (rank===1?"rgba(251,191,36,1)":rank===2?"rgba(156,163,175,1)":"rgba(180,113,67,1)") : GREEN,
            color:"#fff", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20,
          }}>{badge}</div>
        </div>
      )}

      {/* Badge + Titel */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: desc ? 6 : 4 }}>
        {!cover && (
          <span style={{
            flexShrink:0, fontSize:10.5, fontWeight:700, color:GREEN,
            background:GREEN_SOFT, border:`1px solid rgba(34,197,94,0.22)`,
            borderRadius:99, padding:"3px 9px", letterSpacing:0.2, whiteSpace:"nowrap",
          }}>💚 {badge}</span>
        )}
        {title && (
          <span style={{
            fontSize:15, fontWeight:700, color:INK,
            lineHeight:1.3, letterSpacing:"-0.02em",
            overflow:"hidden", textOverflow:"ellipsis",
            flex:1, minWidth:0,
          }}>{title}</span>
        )}
      </div>

      {/* Beschreibung */}
      {desc && (
        <p style={{ margin:"0 0 6px", fontSize:13.5, color:INK_SUB, lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* Fortschrittsbalken */}
      {goal > 0 && <ProgressBar current={curr} goal={goal} />}
    </BaseFeedCard>
  );
}
