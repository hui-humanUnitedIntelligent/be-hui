import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

const CORAL  = "#F47355";
const ORANGE = "#F05A28";
const TEAL   = "#0DC4B5";
const INK    = "#1A1A2E";
const INK3   = "rgba(26,26,46,0.42)";

function formatPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return n.toLocaleString("de-DE", { minimumFractionDigits:0 }) + " \u20ac";
}

export default function WorkContent({ item, onProfile, onReaction, onShare, onBuyWerk, onDetail }) {
  if (!item) return null;

  const title    = item.title || item.text || "";
  const desc     = item._raw?.description || item._raw?.caption || null;
  const price    = item._raw?.price ?? item.price ?? null;
  const category = item._raw?.category || null;
  const tags     = Array.isArray(item.tags) ? item.tags.slice(0,3) : [];
  const priceStr = formatPrice(price);

  // Karte antippen → WorkDetailPage (/work/:id)
  // Avatar/Name haben eigenen onClick (onProfile) → stopPropagation dort
  // Kaufen-Button hat eigenen onClick → stopPropagation dort
  // Action-Buttons (Like/Save/Share) haben eigenen onClick → stopPropagation dort
  const handleCardClick = onDetail
    ? () => { console.log("🟢 STEP 2 — WorkContent handleCardClick, onDetail:", !!onDetail); onDetail(); }
    : undefined;

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
    >

      {/* Beschreibung (falls vorhanden, über dem Bild) */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400, color:"rgba(26,26,46,0.65)", lineHeight:1.55 }}>
          {desc}
        </p>
      )}

      {/* \u2500\u2500 Badge \u00b7 Titel \u00b7 CTA \u2014 nach Mockup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:10, flexWrap:"nowrap", marginBottom: category || priceStr ? 6 : 0,
      }}>
        {/* Links: Badge + Titel */}
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
          {/* WERK-Badge */}
          <span style={{
            flexShrink:0,
            fontSize:10.5, fontWeight:700, color:CORAL,
            background:"rgba(244,115,85,0.10)",
            border:"1px solid rgba(244,115,85,0.22)",
            borderRadius:99, padding:"3px 9px",
            letterSpacing:0.2, whiteSpace:"nowrap",
          }}>WERK</span>
          {/* Titel */}
          {title ? (
            <span style={{
              fontSize:15, fontWeight:700, color:INK,
              lineHeight:1.3, letterSpacing:"-0.02em",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{title}</span>
          ) : null}
        </div>
        {/* Rechts: CTA-Button */}
        {onBuyWerk && (
          <button
            onClick={(e) => { e.stopPropagation(); onBuyWerk(item); }}
            style={{
              flexShrink:0,
              display:"flex", alignItems:"center", gap:7,
              background:"linear-gradient(135deg,#F47355,#F05A28)",
              color:"#fff", border:"none", borderRadius:99,
              padding:"9px 18px", fontSize:13, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation",
              boxShadow:"0 3px 10px rgba(240,90,40,0.35)",
              whiteSpace:"nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C4 1 1.5 3.5 1.5 7C1.5 10.5 4 13 7 13C10 13 12.5 10.5 12.5 7C12.5 3.5 10 1 7 1ZM6 10L3.5 7.5L4.5 6.5L6 8L9.5 4.5L10.5 5.5L6 10Z" fill="white"/>
            </svg>
            {priceStr ? `${priceStr} \u00b7 Kaufen` : "Kaufen"}
          </button>
        )}
      </div>

      {/* Kategorie + Preis (Metazeile) */}
      {(category || priceStr) && !onBuyWerk && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          {category && <span style={{ fontSize:12.5, fontWeight:600, color:CORAL }}>{category}</span>}
          {category && priceStr && <span style={{ fontSize:12, color:INK3 }}>\u00b7</span>}
          {priceStr && <span style={{ fontSize:12.5, fontWeight:600, color:INK3 }}>{priceStr}</span>}
        </div>
      )}
      {/* Metazeile wenn Button vorhanden */}
      {(category || priceStr) && onBuyWerk && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          {category && <span style={{ fontSize:12.5, fontWeight:600, color:CORAL }}>{category}</span>}
          {category && priceStr && <span style={{ fontSize:12, color:INK3 }}>\u00b7</span>}
          {priceStr && <span style={{ fontSize:12.5, color:INK3 }}>{priceStr}</span>}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
          {tags.map((t, i) => (
            <span key={i} style={{
              padding:"2px 9px", borderRadius:20,
              background:"rgba(244,115,85,0.07)",
              border:"1px solid rgba(244,115,85,0.15)",
              fontSize:11, color:CORAL, fontWeight:600,
            }}>{t}</span>
          ))}
        </div>
      )}
    </BaseFeedCard>
  );
}
