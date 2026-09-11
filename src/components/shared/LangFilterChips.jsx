// src/components/shared/LangFilterChips.jsx
// ══════════════════════════════════════════════════════════════════════
// MULTILANG-CONTENT-001 (2026-09-09, Feature: Multi-Language Content
// Versioning — Annes Feedback): Geteilte Sprach-Chip-Leiste fuer die
// Profil-Sections (WorksSection / ExperiencesSection / PublicTalentOffers-
// Section). EINE Komponente statt drei Duplikate (Architektur-Charta P1).
//
// Verhalten:
// - Rendert NUR wenn die Items in 2+ Sprachen vorliegen (ein einziges
//   setzung "Alle | 🇩🇪 Deutsch | 🇪🇸 Spanisch" — bei nur einer Sprache
//   oder gar keiner Angabe (NULL-Bestandscontent) bleibt die Section
//   visuell unveraendert (PRINZIP 8: keine unnötigen Features).
// - "value": null = Alle, "de"/"es"/... = nur diese Sprache.
// - Chip-Styling folgt dem bestehenden Chip-Muster der Wizards
//   (teal-aktiv, transparent-inaktiv, borderRadius 99).
// ══════════════════════════════════════════════════════════════════════
import React from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { LANG_LABELS, LANG_FLAGS } from "../../i18n/index.js";

const DEFAULT_THEME = {
  teal: "#0EC4B8", ink: "#1A1A18", inkMid: "#55556B",
  border: "rgba(26,26,42,0.10)", px: 16,
};

/**
 * @param {object}   props
 * @param {Array}    props.items    — zu filternde Items (bereits sichtbare, z.B. approved)
 * @param {Function} props.getLang  — (item) => "de" | "es" | null | ...
 * @param {string|null} props.value — aktiver Filter (null = Alle)
 * @param {(v: string|null) => void} props.onChange
 * @param {object}   [props.theme]  — { teal, ink, inkMid, border, px } (Design-System)
 */
export default function LangFilterChips({ items, getLang, value, onChange, theme }) {
  const { t } = useTranslation();
  const C = { ...DEFAULT_THEME, ...(theme || {}) };

  // Distincte Sprachen (NULL/"" wird nicht gechippt — das ist der Bestand)
  const langs = [...new Set((items || []).map(getLang).filter(Boolean))];
  if (langs.length < 2) return null;

  const chipStyle = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 99, cursor: "pointer",
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    background: active ? "rgba(14,196,184,0.12)" : "transparent",
    border: `1.5px solid ${active ? "rgba(14,196,184,0.45)" : C.border}`,
    color: active ? C.teal : C.inkMid,
    touchAction: "manipulation",
  });

  return (
    <div style={{ display: "flex", gap: 6, padding: `0 ${C.px}px`, marginBottom: 10 }}>
      <button style={chipStyle(!value)} onClick={() => onChange?.(null)}>
        {t("contentLang.all")}
      </button>
      {langs.map(l => (
        <button key={l} style={chipStyle(value === l)} onClick={() => onChange?.(l)}>
          <span>{LANG_FLAGS[l] || ""}</span> {LANG_LABELS[l] || l}
        </button>
      ))}
    </div>
  );
}
