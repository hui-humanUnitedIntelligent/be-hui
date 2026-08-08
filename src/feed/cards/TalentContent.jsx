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
  // FIX (2026-08-08): DB-Wert ist "vor_ort" (siehe useTalents.js
  // TALENT_LOCATION_TYPES), nicht "local" — Vor-Ort-Angebote fielen bisher
  // fälschlich auf "Flexibel" zurück.
  if (t === "online")   return "Online";
  if (t === "vor_ort")  return "Vor Ort";
  if (t === "hybrid")   return "Hybrid";
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

  const { open, openTalentBooking } = useContentPreview();
  const handleCardClick = () => open({
    ...item,
    canOpenFull: false,
  });

  // TALENT-FEED-BUCHEN-001 (2026-08-08): "Buchen"-Button direkt in der
  // Feed-Karte, analog zu "Kaufen" (Werk) und "Teilnehmen" (Erlebnis).
  // Öffnet TalentBookingFlow direkt mit den rohen Talent-Daten — kein
  // Umweg über die Vorschau nötig, exakt dasselbe Muster wie onBuyWerk.
  const handleBookClick = (e) => {
    e.stopPropagation();
    openTalentBooking(raw);
  };

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >
      {/* Badge + Titel — eigene volle Zeile (FIX 2026-08-08: Titel wurde durch
          den Buchen-Button rechts abgeschnitten — nowrap+ellipsis+flex:1 ließ
          lange Titel wie "Massage bieten" oder "lerne Armbänder zu knüpfen"
          hinter dem Button verschwinden. Jetzt umbrechend, immer komplett
          sichtbar; Button auf eigener Zeile darunter.
          REIHENFOLGE-FIX (2026-08-08, Michael-Vorgabe): Titel steht jetzt
          ÜBER der Beschreibung, nicht mehr darunter. ── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
        <span style={{
          flexShrink:0, marginTop:2,
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
            whiteSpace:"normal", wordBreak:"break-word",
          }}>{title}</span>
        )}
      </div>

      {/* Beschreibung */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400,
          color:"rgba(26,26,46,0.65)", lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* Buchen-Button — eigene Zeile, rechtsbündig (analog "Kaufen"/"Teilnehmen") */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom: (locType || category) ? 6 : 0 }}>
        <button
          onClick={handleBookClick}
          onTouchEnd={(e) => { e.stopPropagation(); }}
          style={{
            flexShrink:0,
            display:"flex", alignItems:"center", gap:7,
            background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",
            color:"#fff", border:"none", borderRadius:99,
            padding:"9px 18px", fontSize:13, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation",
            boxShadow:"0 3px 10px rgba(139,92,246,0.35)",
            whiteSpace:"nowrap",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C4 1 1.5 3.5 1.5 7C1.5 10.5 4 13 7 13C10 13 12.5 10.5 12.5 7C12.5 3.5 10 1 7 1ZM6 10L3.5 7.5L4.5 6.5L6 8L9.5 4.5L10.5 5.5L6 10Z" fill="white"/>
          </svg>
          {price ? `${price}  Buchen` : "Buchen"}
        </button>
      </div>

      {/* Meta: Ort + Kategorie */}
      {(locType || category) && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, flexWrap:"wrap" }}>
          {locType && (
            <span style={{ fontSize:12.5, fontWeight:600, color:"rgba(139,92,246,0.8)" }}>
              📍 {locLabel(locType)}
            </span>
          )}
          {locType && category && (
            <span style={{ color:INK_SUB, fontSize:12 }}>·</span>
          )}
          {category && (
            <span style={{ fontSize:12.5, color:INK_SUB, fontWeight:500 }}>
              {category}
            </span>
          )}
        </div>
      )}
    </BaseFeedCard>
  );
}
