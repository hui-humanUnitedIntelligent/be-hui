// src/feed/cards/MomentContent.jsx — HUI Feed Card v2
// Badge-Logik: Foto-Moment / Video-Moment / Bild-Moment (Galerie) / Gedanke
// Identisches Layout zu WorkContent / ExperienceContent / TalentContent
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

// ── Farben (identisch zu WorkContent / ExperienceContent) ────
const TEAL       = "#0DC4B5";
const TEAL_SOFT  = "rgba(13,196,181,0.10)";
const TEAL_BORD  = "rgba(13,196,181,0.22)";
const INK        = "#1A1A2E";
const INK3       = "rgba(26,26,46,0.42)";

// ── Badge-Mapping: type × moment_source → Label + Farbe ──────
function getMomentBadge(raw) {
  const type   = (raw?.type         || "").toLowerCase();
  const source = (raw?.moment_source || "").toLowerCase();

  // Galerie-Quelle → "Bild-Moment" (unabhängig von type)
  if (source === "galerie") {
    return {
      label:  "Bild-Moment",
      color:  "#8E44C8",
      bg:     "rgba(142,68,200,0.10)",
      border: "rgba(142,68,200,0.22)",
    };
  }

  if (type === "video" || source === "video") {
    return {
      label:  "Video-Moment",
      color:  "#E6A817",
      bg:     "rgba(230,168,23,0.10)",
      border: "rgba(230,168,23,0.22)",
    };
  }

  if (type === "foto" || source === "foto") {
    return {
      label:  "Foto-Moment",
      color:  TEAL,
      bg:     TEAL_SOFT,
      border: TEAL_BORD,
    };
  }

  // "gedanke" oder kein Typ → Gedanke
  return {
    label:  "Gedanke",
    color:  "#5B7EC9",
    bg:     "rgba(91,126,201,0.10)",
    border: "rgba(91,126,201,0.22)",
  };
}

export default function MomentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const { open }  = useContentPreview();
  const raw       = item._raw || {};
  const caption   = item.text || item.title || raw.caption || "";
  const badge     = getMomentBadge(raw);

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={() => open(item)}
    >
      {/* ── Badge · Caption ── identisch zu WorkContent/ExperienceContent */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "nowrap",
        marginBottom: caption ? 6 : 0,
        minWidth: 0,
      }}>
        {/* MOMENT-Typ-Badge */}
        <span style={{
          flexShrink: 0,
          fontSize: 10.5,
          fontWeight: 700,
          color: badge.color,
          background: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: 99,
          padding: "3px 9px",
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}>
          {badge.label}
        </span>

        {/* Caption / Titel */}
        {caption ? (
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {caption}
          </span>
        ) : null}
      </div>

      {/* Langer Text (Gedanken) — unterhalb des Badge-Blocks */}
      {caption && caption.length > 50 && (
        <p style={{
          margin: "0 0 4px",
          fontSize: 14,
          lineHeight: 1.6,
          color: INK3,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {caption}
        </p>
      )}
    </BaseFeedCard>
  );
}
