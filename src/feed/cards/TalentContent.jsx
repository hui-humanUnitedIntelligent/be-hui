/**
 * TalentContent.jsx — Feed-Karte für Talent-Angebote
 * TALENT-CLICK-002 (2026-07-16) — BaseFeedCard-konformes Layout
 *
 * Identischer Aufbau wie WorkContent/ExperienceContent/ImpactContent.
 * Bild wird von BaseFeedCard.FeedMedia via item.media gerendert (kein eigenes).
 * Karte anklicken → ContentPreviewSheet
 */
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const PURPLE      = "rgba(139,92,246,1)";
const PURPLE_SOFT = "rgba(139,92,246,0.10)";
const INK         = "#1A1A2E";
const INK_SUB     = "rgba(26,26,46,0.45)";

function fmtPrice(ph, ps, currency = "EUR") {
  const sym = currency === "EUR" ? "€" : currency;
  if (ps != null && ps > 0) return `${sym}${Number(ps).toFixed(0)}/Session`;
  if (ph != null && ph > 0) return `${sym}${Number(ph).toFixed(0)}/Std`;
  return null;
}

function locLabel(t) {
  if (t === "online")   return "Online";
  if (t === "local")    return "Vor Ort";
  return "Flexibel";
}

export default function TalentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const raw      = item._raw || {};
  const title    = item.title  || raw.title       || "";
  const desc     = item.text   || raw.description || "";
  const category = raw.category || "";
  const locType  = raw.location_type || null;
  const price    = fmtPrice(raw.price_per_hour, raw.price_per_session, raw.currency);

  const { open } = useContentPreview();
  const handleCardClick = () => open({
    ...item,
    canOpenFull: false,
  });

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Beschreibung */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400,
          color:"rgba(26,26,46,0.65)", lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* Badge + Titel + Preis — identische Struktur wie Work/Experience */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:10, flexWrap:"nowrap",
        marginBottom: (locType || category) ? 6 : 0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
          <span style={{
            flexShrink:0,
            fontSize:10.5, fontWeight:700, color:PURPLE,
            background:PURPLE_SOFT,
            border:`1px solid rgba(139,92,246,0.22)`,
            borderRadius:99, padding:"3px 9px",
            letterSpacing:0.2, whiteSpace:"nowrap",
          }}>TALENT</span>
          {title && (
            <span style={{
              fontSize:15, fontWeight:700, color:INK,
              lineHeight:1.3, letterSpacing:"-0.02em",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{title}</span>
          )}
        </div>
        {price && (
          <span style={{
            flexShrink:0,
            fontSize:12, fontWeight:700, color:PURPLE,
          }}>{price}</span>
        )}
      </div>

      {/* Meta: Ort + Kategorie */}
      {(locType || category) && (
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {locType && (
            <span style={{ fontSize:12.5, fontWeight:600, color:"rgba(139,92,246,0.8)" }}>
              📍 {locLabel(locType)}
            </span>
          )}
          {locType && category && (
            <span style={{ fontSize:12, color:"rgba(26,26,46,0.28)" }}>·</span>
          )}
          {category && (
            <span style={{ fontSize:12.5, color:INK_SUB }}>{category}</span>
          )}
        </div>
      )}
    </BaseFeedCard>
  );
}
