/**
 * ImpactContent.jsx — Feed-Karte für Herzensprojekte
 * IMPACT-CLICK-002 (2026-07-16) — BaseFeedCard-konformes Layout
 *
 * Identischer Aufbau wie WorkContent/ExperienceContent/TalentContent:
 * Header + Bild (via BaseFeedCard.FeedMedia) + Badge + Titel + Progress
 * Karte anklicken → ContentPreviewSheet → "Zum Herzensprojekt" → Impact-Tab
 */
import React, { useState, useMemo } from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const GREEN      = "rgba(34,197,94,1)";
const GREEN_SOFT = "rgba(34,197,94,0.10)";
const INK        = "#1A1A2E";
const INK_SUB    = "rgba(26,26,46,0.45)";

// IMPACT-IMG-001: Stabiler Unsplash-Fallback für Projekte ohne eigenes Bild.
// Als Modul-Konstante → wird einmal evaluiert, nie neu erzeugt.
const IMPACT_FALLBACK = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80";

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

  // IMPACT-IMG-002: Titelbild-Logik (cover_url hat strikte Priorität).
  // Reihenfolge: _raw.cover_url → item.media[0] → Fallback
  // media_urls (Upload-Bilder) werden NIEMALS als Hauptbild verwendet.
  // displayImg via useMemo → kein Re-Render durch Votes/State-Änderungen.
  // imgErr via useState → onError setzt einmalig, kein src-Reassign-Loop.
  const [imgErr, setImgErr] = useState(false);
  const displayImg = useMemo(() => {
    if (imgErr) return IMPACT_FALLBACK;
    const raw = item._raw || {};
    // 1. Titelbild: cover_url aus DB (covers/-Pfad) — immer bevorzugen
    if (raw.cover_url) return raw.cover_url;
    // 2. item.media — nur wenn cover_url fehlt (cover-Pfad, nie extras-Pfad)
    const media = item.media;
    if (Array.isArray(media) && media.length > 0 && media[0]?.url) {
      return media[0].url;
    }
    if (media && typeof media === "string") return media;
    // 3. Kein Titelbild vorhanden → Unsplash-Fallback
    return IMPACT_FALLBACK;
  }, [item._raw?.cover_url, item.media, imgErr]);

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Projektbild — immer sichtbar: entweder echtes Bild oder Unsplash-Fallback.
          Kein Emoji-Platzhalter. Rang-Badge liegt oben links auf dem Bild. */}
      <div style={{
        margin: "0 0 12px",
        height: 140, borderRadius: 14,
        overflow: "hidden", position: "relative",
        background: "rgba(26,26,46,0.05)",
      }}>
        {/* IMPACT-IMG-001: img mit stabilem src (useMemo).
             onError setzt imgErr=true → displayImg wechselt auf IMPACT_FALLBACK.
             Kein direktes e.target.src-Assignment → kein Loop, kein Flackern. */}
        <img
          loading="lazy"
          decoding="async"
          src={displayImg}
          alt={title || "Herzensprojekt"}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={() => { if (!imgErr) setImgErr(true); }}
        />
        {/* Rang-Badge oben links auf dem Bild */}
        {rank && RANK_MEDAL[rank] && (
          <div style={{
            position:"absolute", top:10, left:10,
            background: rank===1?"rgba(251,191,36,1)":rank===2?"rgba(156,163,175,1)":"rgba(180,113,67,1)",
            color:"#fff", fontSize:10, fontWeight:700,
            padding:"3px 10px", borderRadius:20,
          }}>{RANK_MEDAL[rank]} {RANK_LABEL[rank]}</div>
        )}
      </div>

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
