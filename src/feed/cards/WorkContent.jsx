import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

const CORAL   = "#FF8A6B";
const TEAL    = "#0EC4B8";
const INK     = "#1A1A2E";
const INK3    = "rgba(26,26,46,0.40)";

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
    label:  "Werk",
    bg:     "rgba(255,138,107,0.10)",
    border: "rgba(255,138,107,0.25)",
    color:  CORAL,
  };

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      badge={badge}
    >
      {/* ── Titel ────────────────────────────────────────────── */}
      {title ? (
        <div style={{
          fontSize:17, fontWeight:800,
          color:INK, lineHeight:1.3,
          letterSpacing:"-0.02em",
          marginBottom:8,
        }}>
          {title}
        </div>
      ) : null}

      {/* ── Beschreibung — Persönlichkeit zuerst ────────────── */}
      {desc && (
        <p style={{
          margin:"0 0 10px", fontSize:13.5, color:"rgba(26,26,46,0.68)",
          lineHeight:1.55, fontWeight:400,
        }}>{desc}</p>
      )}

      {/* ── Tags ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          {tags.map((t, i) => (
            <span key={i} style={{
              padding:"3px 10px", borderRadius:20,
              background:"rgba(255,138,107,0.08)",
              border:"1px solid rgba(255,138,107,0.18)",
              fontSize:11, color:CORAL, fontWeight:600,
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* ── Preis + Kaufen — dezent, am Ende ─────────────────── */}
      {(priceStr || category) && (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:10, flexWrap:"wrap",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {category && (
              <span style={{
                fontSize:11, fontWeight:600, color:INK3,
                background:"rgba(26,26,46,0.06)",
                borderRadius:99, padding:"3px 10px",
              }}>
                {category}
              </span>
            )}
          </div>
          {priceStr && (
            <div style={{
              fontSize:16, fontWeight:900,
              color:TEAL, letterSpacing:"-0.03em",
            }}>
              {priceStr}
            </div>
          )}
        </div>
      )}

      {/* ── Kaufen-Button ─────────────────────────────────────── */}
      {priceStr && onBuyWerk && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onBuyWerk(item); }}
            style={{
              background: "linear-gradient(135deg,#FF8A6B,#E8613A)",
              color: "#fff", border: "none", borderRadius: 14,
              padding: "7px 18px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", touchAction: "manipulation",
            }}
          >
            {priceStr} · Kaufen
          </button>
        </div>
      )}
    </BaseFeedCard>
  );
}
