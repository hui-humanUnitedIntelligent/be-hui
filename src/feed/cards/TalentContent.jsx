/**
 * TalentContent.jsx — Feed-Karte für Talent-Angebote
 * FEED-GLOBAL-001 (2026-07-16) | TALENT-CLICK-001 (2026-07-16)
 *
 * Zeigt: Avatar, Name, Kategorie, Preis, Ort-Typ, Beschreibung, Bild
 * Karte anklicken → ContentPreviewSheet (identisch zu Work/Experience)
 */
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const PURPLE      = "rgba(139,92,246,1)";
const PURPLE_SOFT = "rgba(139,92,246,0.10)";
const INK         = "rgba(26,26,46,0.85)";
const INK_SUB     = "rgba(26,26,46,0.45)";

function fmtPrice(ph, ps, currency = "EUR") {
  const sym = currency === "EUR" ? "€" : currency;
  if (ps != null && ps > 0) return `${sym}${Number(ps).toFixed(0)}/Session`;
  if (ph != null && ph > 0) return `${sym}${Number(ph).toFixed(0)}/Std`;
  return null;
}

function locLabel(t) {
  if (t === "online")  return "Online";
  if (t === "local")   return "Vor Ort";
  if (t === "flexible" || t === "flexibel") return "Flexibel";
  return t || "Flexibel";
}

export default function TalentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const raw      = item._raw || {};
  const title    = item.title  || raw.title       || "";
  const desc     = item.text   || raw.description || "";
  const category = raw.category || "";
  const locType  = raw.location_type || null;
  const price    = fmtPrice(raw.price_per_hour, raw.price_per_session, raw.currency);
  const img      = raw.images?.[0] || null;

  const { open } = useContentPreview();
  const handleCardClick = () => open({
    ...item,
    // Talente haben keine eigene Detail-Route — Sheet zeigt alle Infos
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
      {/* Titelbild */}
      {img && (
        <div style={{ margin:"0 0 10px", borderRadius:14, overflow:"hidden",
          width:"100%", paddingTop:"52%", position:"relative",
          background:"rgba(26,26,46,0.04)" }}>
          <img src={img} alt={title} loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.currentTarget.parentElement.style.display="none"; }}
          />
        </div>
      )}

      {/* Badge + Titel + CTA-Zeile */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:10, flexWrap:"nowrap", marginBottom: locType || price ? 6 : 0 }}>
        {/* Links: Badge + Titel */}
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
      </div>

      {/* Beschreibung */}
      {desc && (
        <p style={{ margin:"6px 0 8px", fontSize:13.5, color:INK_SUB, lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* Footer: Ort + Kategorie + Preis */}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginTop:4 }}>
        {locType && (
          <span style={{
            fontSize:11, color:INK_SUB,
            background:"rgba(26,26,46,0.05)", padding:"3px 9px", borderRadius:12,
          }}>📍 {locLabel(locType)}</span>
        )}
        {category && (
          <span style={{
            fontSize:11, color:INK_SUB,
            background:"rgba(26,26,46,0.05)", padding:"3px 9px", borderRadius:12,
          }}>{category}</span>
        )}
        {price && (
          <span style={{
            fontSize:12, fontWeight:700, color:PURPLE,
            marginLeft:"auto",
          }}>{price}</span>
        )}
      </div>
    </BaseFeedCard>
  );
}
