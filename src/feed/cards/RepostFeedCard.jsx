// src/feed/cards/RepostFeedCard.jsx — REPOST-SYSTEM-001 (2026-09-09)
// ════════════════════════════════════════════════════════════════════
// Feed-Karte fuer Reposts (Michaels Prompt 2026-09-09, Anforderung 5):
// Reposts erscheinen im Home-Feed neben normalen Posts, sortiert nach
// created_at (SORT.STRICT-001 — _sortKey wird im useFeedStream gesetzt).
//
// Aufbau: Header "X hat das geteilt" (Reposter, CardAvatar-SSOT inkl.
// Initialen-Fallback) + optionale Caption (item.text) + kompakte
// Original-Vorschau aus dem post_data-Snapshot (Thumbnail, Titel,
// Original-Autor).
//
// KEINE eigene Action-Leiste (Anforderung 6: kein Repost von Reposts —
// es gibt bewusst keinen RepostButton hier) und KEINE Reaktions-Queries:
// Die Karte wird in FeedList VOR ReactionCard dispatcht und geht damit
// am gesamten Reaktions-Mechanismus vorbei (kein useSingleReaction auf
// repost-Zeilen-IDs — Reposts sind KEINE reaktionsfaehigen Entitaeten).
//
// Klick auf die Original-Vorschau: bestehender ContentPreview-SSOT
// (useContentPreview().openRef({type, id})) — kein eigenes Repost-Modal,
// geloeschte Originale zeigen den etablierten "nicht verfuegbar"-Toast
// (B9/B10-SSOT-FIX). Avatar-Fallback: CardAvatar-Initialenkreis (die
// HUI-Logo-Platzhalter-Regel gilt fuer Cover, NICHT fuer Avatare).
// ════════════════════════════════════════════════════════════════════
import React, { memo } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { CardAvatar } from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { HUILogo } from "../../components/brand/HUILogo.jsx";
import { HUIRepostIcon } from "../../design/icons/HuiInteractionIcons.jsx";

const T = {
  bgCard:   "#FFFFFF",
  ink:      "#1A1A2E",
  ink2:     "rgba(26,26,46,0.55)",
  ink3:     "rgba(26,26,46,0.38)",
  teal:     "#0DC4B5",
  tealSoft: "rgba(13,196,181,0.08)",
  shadow:   "0 2px 20px rgba(26,26,46,0.08)",
  border:   "rgba(26,26,46,0.07)",
  r: 16,
};

function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)   return "jetzt";
  if (min < 60)  return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `${d} d`;
  // aeltere Reposts: Datum statt relatives Alter
  try {
    const dt = new Date(ts);
    return `${dt.getDate()}.${dt.getMonth() + 1}.${String(dt.getFullYear()).slice(2)}`;
  } catch { return ""; }
}

const RepostFeedCard = memo(function RepostFeedCard({ item }) {
  const { t } = useTranslation();
  const { openRef } = useContentPreview();
  const { user } = useAuth();

  if (!item?._repost) return null; // defekt normalisierte Zeile nie rendern

  const reposter   = item.author || {};
  const isOwn      = !!user?.id && reposter.id === user.id;
  const headerText = isOwn
    ? t("repost.youShared")
    : t("repost.sharedBy", { name: reposter.name || "—" });
  const caption    = item.text || null;
  const pd         = item._repost.postData || {};
  const origTitle  = pd.title || pd.text || "—";
  const origAuthor = pd.authorName || "";
  const origCover  = pd.cover || null;
  const origType   = item._repost.originalType;
  const origId     = item._repost.originalId;

  function openOriginal() {
    if (!origType || !origId) return;
    openRef({ type: origType, id: origId }); // SSOT — Preview-Sheet inkl. Geloescht-Handling
  }

  return (
    <article
      className="hui-feed-card"
      style={{
        background: T.bgCard,
        borderRadius: T.r,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        overflow: "hidden",
      }}
    >
      {/* Header: Reposter + "hat das geteilt" */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 0" }}>
        <CardAvatar src={reposter.avatar} name={reposter.name} size={38} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: T.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {headerText}
          </div>
          <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2 }}>
            {relTime(item.createdAt || item._raw?.created_at)}
          </div>
        </div>
        {/* dezentes Repost-Symbol als Kontext-Marker (kein Button) */}
        <div style={{ color: T.teal, opacity: 0.55, display: "flex" }}>
          <HUIRepostIcon size={20} />
        </div>
      </div>

      {/* Caption des Reposters (optional) */}
      {caption && (
        <div style={{
          padding: "10px 14px 0",
          fontSize: 14.5, lineHeight: 1.5, color: T.ink,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {caption}
        </div>
      )}

      {/* Original-Vorschau (Snapshot) — Klick oeffnet den echten Original-Post */}
      <button
        onClick={openOriginal}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", boxSizing: "border-box",
          margin: "12px 14px", padding: 10,
          borderRadius: 12,
          background: T.tealSoft,
          border: `1px solid ${T.border}`,
          cursor: "pointer", fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0,
          background: "rgba(26,26,46,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {origCover ? (
            <img src={origCover} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            // HUI-Logo-Platzhalter-Regel (SSOT): Cover fehlt -> Markenkomponente,
            // nie Emoji, nie Stockfoto, nie leere Flaeche
            <HUILogo size={22} style={{ opacity: 0.5 }} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: T.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {origTitle}
          </div>
          {origAuthor && (
            <div style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>
              {origAuthor}
            </div>
          )}
        </div>
        <span style={{ color: T.teal, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
      </button>
    </article>
  );
});

export default RepostFeedCard;
