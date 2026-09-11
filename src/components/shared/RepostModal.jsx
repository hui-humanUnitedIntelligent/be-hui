// src/components/shared/RepostModal.jsx — REPOST-SYSTEM-001 (2026-09-09)
// ════════════════════════════════════════════════════════════════════
// Modal fuer den Repost-Flow (Michaels Prompt 2026-09-09): optionaler
// eigener Kommentar (Caption, max 500 Zeichen — analog DB-Check) +
// Preview des Original-Posts (Thumbnail, Titel, Autor) + "Jetzt teilen".
// Der eigentliche DB-Write passiert NICHT hier, sondern im RepostButton
// (SSOT: dort laeuft useRepostStatus mit optimistischem Toggle) — das
// Modal liefert nur die Caption an onShare(caption).
//
// Pflicht-Muster (NAVBAR-REGRESSION-LEHRE): createPortal(document.body)
// + zIndex 10500 + useWizardBodyLock() OHNE Flag ist SICHER, weil diese
// Komponente ausschliesslich conditional gemountet wird
// ({open && <RepostModal/>} im RepostButton) — die Lehre greift nur bei
// permanent gemounteten Komponenten.
// ════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { HUILogo } from "../brand/HUILogo.jsx";

const T = {
  teal:     "#0EC4B8",
  tealDeep: "#0A9E94",
  ink:      "#1A3530",
  inkSoft:  "#55556B",
  inkFaint: "#808098",
  border:   "rgba(26,53,48,0.08)",
};

export default function RepostModal({ item, onShare, onClose }) {
  const { t } = useTranslation();
  const [caption, setCaption] = useState("");
  const taRef = useRef(null);
  useWizardBodyLock(); // sicher: conditional gemountet (siehe Kopf-Kommentar)

  // Textarea auto-fokussieren (Keyboard-Praxis: leicht verzoegert, damit
  // das Sheet-In erste fertig ist — sonst springt der Fokus auf iOS weg)
  useEffect(() => {
    const id = setTimeout(() => { try { taRef.current?.focus?.(); } catch { /* silent — Fokus ist optional */ } }, 260);
    return () => clearTimeout(id);
  }, []);

  function handleSubmit() {
    onShare?.(caption);
  }

  const title  = item?.title || item?.text || "";
  const author = item?.author?.name || null;
  const cover  = item?.media?.[0]?.url || item?.cover || null;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        background: "rgba(26,53,48,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "rpm-fade .18s ease both",
        WebkitTapHighlightColor: "transparent",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes rpm-fade { from{opacity:0;} to{opacity:1;} }
        @keyframes rpm-in   { from{transform:translateY(60px);opacity:0.4;} to{transform:translateY(0);opacity:1;} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          display: "flex", flexDirection: "column",
          animation: "rpm-in .22s cubic-bezier(.22,1,.36,1) both",
          boxShadow: "0 -10px 40px rgba(26,53,48,0.18)",
          paddingTop: "max(10px, env(safe-area-inset-top, 10px) * 0)", // 10px-Regel
          paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))", // Navbar-Abstand-Pflicht
        }}
      >
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(26,53,48,0.12)" }} />
        </div>

        {/* Titel + Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 4px", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>
            {t("repost.modal.title")}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(26,53,48,0.05)", color: T.inkSoft, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}
          >×</button>
        </div>

        {/* Original-Post-Preview (Anforderung 3: Thumbnail, Titel, Author) */}
        <div style={{ margin: "6px 18px 14px", padding: 10, borderRadius: 14, background: "rgba(26,53,48,0.03)", border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0,
              background: "rgba(26,53,48,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {cover ? (
                <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                // HUI-Logo-Platzhalter-Regel: bei fehlendem Cover ausschliesslich
                // die kanonische Markenkomponente, nie Emoji/Stockfoto/leere Flaeche
                <HUILogo size={24} style={{ opacity: 0.5 }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 600, color: T.ink,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {title ? (String(title).length > 60 ? String(title).slice(0, 60) + "…" : title) : "—"}
              </div>
              <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                {author || ""}
              </div>
            </div>
          </div>
        </div>

        {/* Caption-Textarea */}
        <div style={{ padding: "0 18px", flexShrink: 0 }}>
          <textarea
            ref={taRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 500))}
            placeholder={t("repost.modal.placeholder")}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              borderRadius: 14, border: `1.5px solid ${T.border}`,
              padding: "12px 14px", fontSize: 14.5, color: T.ink,
              fontFamily: "inherit", lineHeight: 1.5, resize: "none",
              outline: "none", background: "#fff",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, color: caption.length >= 450 ? T.tealDeep : T.inkFaint, marginTop: 4 }}>
            {caption.length}/500
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: "6px 18px 8px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            className="ppp-press"
            style={{
              height: 50, borderRadius: 99, border: "none", cursor: "pointer",
              background: T.teal, color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}
          >
            {t("repost.modal.btn")}
          </button>
          <button
            onClick={onClose}
            style={{
              height: 44, borderRadius: 99, border: "none", cursor: "pointer",
              background: "rgba(26,53,48,0.05)", color: T.inkSoft,
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {t("repost.modal.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
