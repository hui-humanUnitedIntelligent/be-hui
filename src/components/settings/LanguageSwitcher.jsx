// ── LanguageSwitcher — Sprachumschalter für SettingsModal ──
// Zeigt alle verfügbaren Sprachen, speichert in localStorage + Supabase

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LANGUAGE_FLAGS, changeLanguage } from "../../i18n/index.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  border:   "rgba(26,26,24,0.09)",
  radius:   14,
};

export default function LanguageSwitcher({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selected, setSelected] = useState(i18n.language || "en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(i18n.language || "en");
  }, [open, i18n.language]);

  if (!open) return null;

  async function handleSelect(lang) {
    setSelected(lang);
    changeLanguage(lang);
    // Save to profile
    if (user?.id) {
      setSaving(true);
      try {
        await supabase
          .from("profiles")
          .update({ locale: lang })
          .eq("id", user.id);
      } catch (e) {
        // Silent — localStorage already saved
      }
      setSaving(false);
    }
    // Auto-close after short delay so user sees the checkmark
    setTimeout(() => onClose?.(), 400);
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflowY: "auto",
          background: T.bg,
          borderRadius: "20px 20px 0 0",
          padding: "20px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
          animation: "ds-slide-up 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>
            {t("settings.chooseLanguage")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              color: T.inkSoft,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Language list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = selected === lang;
            return (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: isActive ? T.tealSoft : T.bgCard,
                  border: isActive ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
                  borderRadius: T.radius,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{LANGUAGE_FLAGS[lang]}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: T.ink }}>
                    {LANGUAGE_LABELS[lang]}
                  </span>
                </div>
                {isActive && (
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: T.teal,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {saving && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.inkSoft }}>
            …
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
