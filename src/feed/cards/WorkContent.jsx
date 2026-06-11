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

export default function WorkContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const title    = item.title || item.text || "";
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
      {/* ── "Neues Werk" Label ──────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        marginBottom:8,
      }}>
        <span style={{ fontSize:14 }}>🎨</span>
        <span style={{
          fontSize:11, fontWeight:700,
          color:CORAL, letterSpacing:".04em",
          textTransform:"uppercase",
        }}>
          Neues Werk veröffentlicht
        </span>
      </div>

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

      {/* ── Preis + Kategorie in einer Reihe ─────────────────── */}
      <div style={{
        display:"flex", alignItems:"center",
        gap:10, flexWrap:"wrap", marginBottom: tags.length > 0 ? 8 : 0,
      }}>
        {priceStr && (
          <div style={{
            fontSize:18, fontWeight:900,
            color:TEAL, letterSpacing:"-0.03em",
          }}>
            {priceStr}
          </div>
        )}
        {category && (
          <div style={{
            fontSize:11, fontWeight:600,
            color:INK3,
            background:"rgba(26,26,46,0.06)",
            borderRadius:99, padding:"3px 10px",
          }}>
            {category}
          </div>
        )}
      </div>

      {/* ── Tags ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
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
    </BaseFeedCard>
  );
}
