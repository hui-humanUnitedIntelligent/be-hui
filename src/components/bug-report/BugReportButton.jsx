// BugReportButton.jsx — Floating Bug-Käfer Button (2026-08-19)
// Position: unten rechts, direkt über der Navigation (oberhalb "Profil")
// Größe: ~25px (gleich groß wie der WerkeKorb)
// Sichtbar auf allen Hauptseiten: Home, Entdecken, Impact, Profil
// Additiv — keine bestehenden Elemente werden berührt.
import React from "react";
import { createPortal } from "react-dom";
import BugIcon from "./BugIcon.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export default function BugReportButton({ onPress = () => {} }) {
  const { t } = useTranslation();
  const [pressed, setPressed] = React.useState(false);

  function handleTouchEnd(e) {
    e.preventDefault();
    setPressed(false);
    onPress?.();
  }

  return createPortal(
    <button
      onClick={() => onPress?.()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={handleTouchEnd}
      aria-label={t('bug.report')}
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        right: "16px",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1.5px solid rgba(91,107,125,0.18)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(91,107,125,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 9998,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        transform: pressed ? "scale(0.93)" : "scale(1)",
        transition: "transform 0.22s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <BugIcon size={22} color="#5B6B7D" />
    </button>,
    document.body
  );
}
