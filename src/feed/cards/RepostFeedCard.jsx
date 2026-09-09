// src/feed/cards/RepostFeedCard.jsx — REPOST-SYSTEM-001 (2026-09-09)
// ════════════════════════════════════════════════════════════════════
// Feed-Karte fuer Reposts (Michaels Prompt 2026-09-09, Anforderung 5):
// Reposts erscheinen im Home-Feed neben normalen Posts, sortiert nach
// created_at (SORT.STRICT-001 — _sortKey wird im useFeedStream gesetzt).
//
// ── REPOST-V2-REDESIGN (2026-09-09, Michael-Feedback 15:20 + 16:17/16:19) ──
// V1 (gleicher Tag) zeigte nur "X hat das geteilt" als EINZELNE Kopfzeile
// mit winzigem 48px-Thumbnail — Michael: "Repost sehen scheisse aus",
// er will den REPOSTER-NAMEN prominent oben und das Original KLEINER
// EINGELASSEN im eigenen Post (Referenz: freigegebene Visualisierung,
// Variante Michael). V2-Aufbau:
//   1. Kopfzeile: Reposter-Avatar + NAME (fett) + Subline
//      "hat das geteilt · <Zeit>" (own: "Du hast das geteilt") + Teal-
//      Repost-Icon als Kontext-Marker.
//   2. Caption des Reposters (optional).
//   3. Original-Kachel EINGELASSEN (border-radius 12, umrandet, Cover-
//      bild + Titel + Original-Autor mit Avatar): Klick oeffnet den
//      echten Original-Post ueber den ContentPreview-SSOT.
//   4. ENTFERNEN NUR FUER DEN REPOSTER (Michaels Vorgabe 16:19 "nur der
//      der postet kann entfernen"): Das ⋮ erscheint ausschließlich wenn
//      reposter.id === user.id (isOwn). DB-seitig erzwingt RLS dasselbe
//      (delete nur auf eigene Zeilen), der Client-Filter ist UI-Logik.
//      Bestaetigungs-Dialog via createPortal + zIndex 10500
//      (Footer-Navbar-Regel), nach Delete: Custom-Event
//      "hui:repost:deleted" → useFeedStream entfernt die Karte sofort
//      aus items+pendingItems (unabhaengig vom Realtime-Lag).
//
// Nach wie vor KEINE eigene Action-Leiste (Anforderung 6: kein Repost von
// Reposts) und KEINE Reaktions-Queries: Die Karte wird in UnifiedFeed VOR
// ReactionCard dispatcht und geht damit am gesamten Reaktions-Mechanismus
// vorbei (kein useSingleReaction auf repost-Zeilen-IDs — Reposts sind
// KEINE reaktionsfaehigen Entitaeten).
// ════════════════════════════════════════════════════════════════════
import React, { memo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";
import { CardAvatar } from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";
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

const ellipsis = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const RepostFeedCard = memo(function RepostFeedCard({ item }) {
  const { t } = useTranslation();
  const { openRef } = useContentPreview();
  const { user } = useAuth();
  // REPOST-V2: Entfernen-Dialog-States (nur fuer den Reposter selbst sichtbar)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  if (!item?._repost) return null; // defekt normalisierte Zeile nie rendern

  const reposter    = item.author || {};
  const isOwn       = !!user?.id && reposter.id === user.id;
  const subText     = isOwn ? t("repost.youShared") : t("repost.sharedAction");
  const caption     = item.text || null;
  const pd          = item._repost.postData || {};
  const origTitle   = pd.title || pd.text || "—";
  const origAuthor  = pd.authorName || "";
  const origAvatar  = pd.authorAvatar || null;
  const origCover   = pd.cover || null;
  const origType    = item._repost.originalType;
  const origId      = item._repost.originalId;

  function openOriginal() {
    if (!origType || !origId) return;
    openRef({ type: origType, id: origId }); // SSOT — Preview-Sheet inkl. Geloescht-Handling
  }

  // REPOST-V2 (Michaels Vorgabe 16:19): Entfernen — nur der Reposter selbst.
  // RLS erzwingt ownership DB-seitig (delete auf eigene Zeilen), der
  // isOwn-Gate ist die UI-Kehrseite desselben Schutzes.
  async function handleRemove() {
    if (!user?.id || removing) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      const { error } = await supabase
        .from("reposts")
        .delete()
        .eq("id", item.id)
        .eq("user_id", user.id);
      if (error) throw error;
      // Karte sofort aus dem Feed nehmen (Event-SSOT, useFeedStream hoert mit)
      window.dispatchEvent(new CustomEvent("hui:repost:deleted", { detail: { id: String(item.id) } }));
      setConfirmOpen(false);
    } catch (e) {
      console.error("[RepostFeedCard] remove failed:", e);
      setRemoveError(t("repost.error"));
    } finally {
      setRemoving(false);
    }
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
      {/* Kopfzeile: Reposter-NAME prominent + "hat das geteilt · Zeit" */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 0" }}>
        <CardAvatar src={reposter.avatar} name={reposter.name} size={38} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, ...ellipsis }}>
            {reposter.name || "Mitglied"}
          </div>
          <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2, ...ellipsis }}>
            {subText} · {relTime(item.createdAt || item._raw?.created_at)}
          </div>
        </div>
        {/* dezentes Repost-Symbol als Kontext-Marker (kein Button) */}
        <div style={{ color: T.teal, opacity: 0.55, display: "flex", flexShrink: 0 }}>
          <HUIRepostIcon size={20} />
        </div>
        {/* ENTFERNEN — nur fuer den Reposter selbst (isOwn-Gate) */}
        {isOwn && (
          <button
            onClick={() => { setRemoveError(null); setConfirmOpen(true); }}
            aria-label={t("repost.more")}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: "none", background: "rgba(26,26,46,0.05)",
              color: T.ink2, fontSize: 15, fontWeight: 700, lineHeight: 1,
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit",
            }}
          >⋮</button>
        )}
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

      {/* Original-Kachel EINGELASSEN (Michaels Vorgabe: "etwas kleiner drin")
          — Cover-Bild + Titel + Original-Autor, Klick oeffnet den echten
          Original-Post ueber den ContentPreview-SSOT */}
      <div
        onClick={openOriginal}
        style={{
          margin: "12px 14px 14px",
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          cursor: "pointer",
          background: T.tealSoft,
        }}
      >
        {origCover ? (
          <img
            src={origCover}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
          />
        ) : (
          // HUI-Logo-Platzhalter-Regel (SSOT): Cover fehlt -> Markenkomponente,
          // nie Emoji, nie Stockfoto, nie leere Flaeche
          <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,26,46,0.03)" }}>
            <HUILogo size={32} style={{ opacity: 0.5 }} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, ...ellipsis }}>
              {origTitle}
            </div>
            {origAuthor && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {origAvatar ? (
                  <img src={origAvatar} alt="" loading="lazy"
                    style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  // Avatar-Regel: Initialen-Fallback, NIE HUI-Logo (keine Person)
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    background: T.tealSoft, color: T.teal,
                    fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{String(origAuthor).trim().charAt(0).toUpperCase() || "?"}</div>
                )}
                <span style={{ fontSize: 12, color: T.ink2, ...ellipsis }}>{origAuthor}</span>
              </div>
            )}
          </div>
          <span style={{ color: T.teal, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
        </div>
      </div>

      {/* Entfernen-Bestaetigung (nur Reposter) — Portal + zIndex 10500
          (Footer-Navbar-Regel: Jedes Modal/Overlay per createPortal an
          document.body, z-index >= 10500) */}
      {confirmOpen && createPortal(
        <div
          onClick={() => { if (!removing) setConfirmOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 10500,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.bgCard, borderRadius: 16,
              padding: 20, maxWidth: 320, width: "100%",
              boxShadow: "0 8px 32px rgba(26,26,46,0.18)",
            }}
          >
            <p style={{ fontSize: 14.5, fontWeight: 600, color: T.ink, margin: "0 0 16px" }}>
              {t("repost.removeConfirm")}
            </p>
            {removeError && (
              <p style={{ fontSize: 12.5, color: "#EF4444", margin: "0 0 12px" }}>{removeError}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={removing}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 22,
                  border: "1px solid rgba(26,26,46,0.12)", background: "transparent",
                  color: T.ink2, fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >{t("repost.modal.cancel")}</button>
              <button
                onClick={handleRemove}
                disabled={removing}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 22,
                  border: "none", background: removing ? "rgba(239,68,68,0.6)" : "#EF4444",
                  color: "#fff", fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >{removing ? "…" : t("repost.modal.removeBtn")}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
});

export default RepostFeedCard;
