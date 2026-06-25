import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

// Sprint 2.5 — einheitliche Typografie-Tokens
const C = {
  title:  { fontSize:16, fontWeight:700, color:"#141422", lineHeight:1.4, letterSpacing:"-0.01em", margin:"0 0 8px" },
  desc:   { margin:"0 0 10px", fontSize:13.5, fontWeight:400, color:"rgba(20,20,34,0.64)", lineHeight:1.55 },
  meta:   { margin:0, fontSize:12, fontWeight:500, color:"rgba(20,20,34,0.42)" },
  tag:    { padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 },
};
const CORAL = "#F47355";
const TEAL  = "#0DC4B5";
const INK3  = "rgba(20,20,34,0.40)";

function formatPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return n.toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €";
}

export default function WorkContent({ item, onProfile, onReaction, onShare, onBuyWerk }) {
  if (!item) return null;

  const title    = item.title || item.text || "";
  const desc     = item._raw?.description || item._raw?.caption || null;
  const price    = item._raw?.price ?? item.price ?? null;
  const category = item._raw?.category || null;
  const tags     = Array.isArray(item.tags) ? item.tags.slice(0,3) : [];
  const priceStr = formatPrice(price);

  const badge = {
    label:"Werk",
    bg:"rgba(244,115,85,0.10)", border:"rgba(244,115,85,0.22)", color:CORAL,
  };

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare} badge={badge}>

      {/* Titel */}
      {title ? <p style={{ ...C.title }}>{title}</p> : null}

      {/* Beschreibung */}
      {desc ? <p style={{ ...C.desc }}>{desc}</p> : null}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          {tags.map((t, i) => (
            <span key={i} style={{
              ...C.tag,
              background:"rgba(244,115,85,0.08)",
              border:"1px solid rgba(244,115,85,0.18)",
              color:CORAL,
            }}>{t}</span>
          ))}
        </div>
      )}

      {/* Kategorie + Preis */}
      {(category || priceStr) && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          {category
            ? <span style={{ ...C.meta, background:"rgba(20,20,34,0.05)", borderRadius:99, padding:"3px 10px" }}>
                {category}
              </span>
            : <span />
          }
          {priceStr && (
            <span style={{ fontSize:16, fontWeight:800, color:TEAL, letterSpacing:"-0.03em" }}>
              {priceStr}
            </span>
          )}
        </div>
      )}

      {/* Kaufen-Button */}
      {priceStr && onBuyWerk && (
        <div style={{ marginTop:10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onBuyWerk(item); }}
            style={{
              background:"linear-gradient(135deg,#F47355,#E8613A)",
              color:"#fff", border:"none", borderRadius:14,
              padding:"7px 18px", fontSize:12, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation",
              boxShadow:"0 2px 8px rgba(244,115,85,0.28)",
            }}
          >
            {priceStr} · Kaufen
          </button>
        </div>
      )}
    </BaseFeedCard>
  );
}
