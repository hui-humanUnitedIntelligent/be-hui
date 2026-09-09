// src/feed/cards/RepostButton.jsx — REPOST-SYSTEM-001 (2026-09-09)
// ════════════════════════════════════════════════════════════════════
// Repost-Action-Button fuer Feed-Karten (Michaels Prompt 2026-09-09).
// NUR fuer Werke, Talente, Erlebnisse und Projekte — Momente sind
// AUSGESCHLOSSEN (Anforderung 1; zusaetzlich DB-CHECK-Constraint).
// Wird von FeedActions (BaseFeedCard.jsx) ZWISCHEN Weitergeben und
// Merken gerendert — nur wenn repostItem gesetzt ist (der Aufrufer
// entscheidet anhand des Typs).
//
// Verhalten (Anforderung 6):
//   - nicht gerepostet: Klick oeffnet RepostModal (Caption + Preview)
//     -> createRepost -> Toast repost.success
//   - bereits gerepostet: Button zeigt Check + "aktiv"-Stil; Klick
//     oeffnet einen Bestaetigungs-Dialog -> deleteRepost -> Toast
//     repost.removeSuccess. (Ein Post ist pro Nutzer nur EINMAL
//     repostbar — unique_repost-Index in DB.)
//
// Architektur: eigener useRepostStatus-Hook analog dem etablierten
// useSingleReaction-Muster (optimistisch + Rollback) — KEINE Reaktion,
// deshalb bewusst kein "repost"-Type in post_reactions (keine
// Zaehler-Semantik, sondern eigene Zeile mit Snapshot).
// ════════════════════════════════════════════════════════════════════
import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ActionBtn } from "./BaseFeedCard.jsx";
import { HUIRepostIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { useRepostStatus } from "../../lib/useRepost.js";
import RepostModal from "../../components/shared/RepostModal.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { toast } from "../../lib/useToast.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

// Feed-Typ -> original_type in DB (Projekte heissen im Feed "impact",
// ContentPreview/openRef nutzen durchgaengig "project" — siehe
// contentPreviewLoaders.js project-Loader auf impact_applications)
const ORIGINAL_TYPE_MAP = {
  work: "work",
  talent: "talent",
  experience: "experience",
  project: "project",
  impact: "project",
};

// Snapshot fuer post_data (jsonb) — RepostFeedCard rendert daraus die
// Original-Vorschau, OHNE die Original-Tabellen live joinen zu muessen
// (analog saved_posts.post_data-Muster).
function buildSnapshot(item, originalType) {
  return {
    type: originalType,
    id: item?.id || null,
    title: item?.title || item?.text || null,
    text: item?.text || null,
    cover: item?.media?.[0]?.url || item?.cover || null,
    authorName: item?.author?.name || null,
    authorAvatar: item?.author?.avatar || null,
    authorId: item?.author?.id || null,
    createdAt: item?.createdAt || item?._raw?.created_at || null,
  };
}

export default function RepostButton({ item, count = null }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [modalOpen, setModalOpen]       = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [busy, setBusy]                 = useState(false);

  const displayType    = item?.type || "";
  const originalType   = ORIGINAL_TYPE_MAP[displayType] || displayType;
  const originalId     = item?.id || null;
  const authorId       = item?.author?.id || null;

  const { isReposted, createRepost, deleteRepost } = useRepostStatus(
    originalId, originalType, authorId
  );

  useModalRegistration(modalOpen,   () => setModalOpen(false),   "RepostModal");
  useModalRegistration(confirmOpen, () => setConfirmOpen(false), "RepostRemoveConfirm");

  const handleClick = useCallback(() => {
    if (!user?.id) return; // Feed ist eingeloggt — defensiver Guard
    if (isReposted) { setConfirmOpen(true); return; }
    setModalOpen(true);
  }, [user?.id, isReposted]);

  const handleShare = useCallback(async (caption) => {
    setModalOpen(false);
    if (busy) return;
    setBusy(true);
    const res = await createRepost(caption, buildSnapshot(item, originalType));
    setBusy(false);
    if (res?.ok) {
      toast.info(t("repost.success"));
    } else if (!res?.already) {
      toast.error(t("repost.error"));
    }
  }, [busy, createRepost, item, originalType, t]);

  const handleRemove = useCallback(async () => {
    setConfirmOpen(false);
    if (busy) return;
    setBusy(true);
    const res = await deleteRepost();
    setBusy(false);
    if (res?.ok) toast.info(t("repost.removeSuccess"));
    else if (!res?.ok) toast.error(t("repost.error"));
  }, [busy, deleteRepost, t]);

  if (!user?.id || !originalId || !ORIGINAL_TYPE_MAP[displayType]) return null;

  return (
    <>
      <ActionBtn
        Icon={HUIRepostIcon}
        count={count}
        active={isReposted}
        activeColor="#0EC4B8"
        inactiveColor="#0EC4B8"
        variant="repost"
        onClick={handleClick}
      />
      {/* Modal + Confirm strikt conditional gemountet (NAVBAR-REGRESSION-LEHRE) */}
      {modalOpen && (
        <RepostModal item={item} onShare={handleShare} onClose={() => setModalOpen(false)} />
      )}
      {confirmOpen && (
        createPortal(
          <div
            onClick={() => setConfirmOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 10550,
              background: "rgba(26,53,48,0.45)", display: "flex",
              alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16,
                padding: "24px 20px 20px", maxWidth: 320, width: "100%",
                boxShadow: "0 8px 40px rgba(26,53,48,0.18)" }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: "center", marginBottom: 20, color: "#1A3530" }}>
                {t("repost.removeConfirm")}
              </div>
              <button
                onClick={handleRemove}
                style={{ width: "100%", padding: "12px", borderRadius: 99,
                  background: "#ff3b3b", border: "none", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", marginBottom: 8 }}
              >
                {t("repost.modal.removeBtn")}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{ width: "100%", padding: "12px", borderRadius: 99,
                  background: "#f0f0ee", border: "none", color: "#444",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                {t("repost.modal.cancel")}
              </button>
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
}
