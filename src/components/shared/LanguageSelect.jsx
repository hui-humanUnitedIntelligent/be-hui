// src/components/shared/LanguageSelect.jsx
// ══════════════════════════════════════════════════════════════════════
// MULTILANG-CONTENT-001 (2026-09-09, Feature: Multi-Language Content
// Versioning — Annes Feedback): Geteilte SSOT-Komponente fuer die
// "Auslieferungssprache"-Auswahl in WerkWizard, TalentAngebotWizard und
// ExperienceWizard. EINE Komponente statt drei Duplikate (Architektur-
// Charta P1: "Erweitern statt duplizieren", PRINZIP 2: Design System
// First — Farben kommen aus dem vom Wizard uebergebenen Theme-Objekt).
//
// Semantik (SSOT-Entscheidung, dokumentiert im Feature-Request):
// - "" (leer) = KEINE Angabe → Inhalt bleibt fuer ALLE Sprachen sichtbar
//   (Backwards-Kompatibilitaet: der gesamte Bestands-Content hat NULL).
// - "de"/"es"/... = Inhalt wird NUR fuer Nutzer mit dieser App-Sprache
//   angezeigt (Discover-Filter: language.eq.<appLang> OR language.is.null).
//
// KEINE Live-Uebersetzung — der Nutzer verwaltet Sprachversionen selbst
// als separate Eintraege (Michaels explizite Vorgabe).
// ══════════════════════════════════════════════════════════════════════
import React from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { SUPPORTED_LANGS, LANG_LABELS, LANG_FLAGS } from "../../i18n/index.js";

/**
 * @param {object} props
 * @param {string} props.value          — "", "de", "es", ...
 * @param {(v: string) => void} props.onChange
 * @param {object} [props.theme]        — Wizard-Theme { teal, ink, inkMid, inkFade, border } (Design-System-Konsistenz)
 */
export default function LanguageSelect({ value, onChange, theme }) {
  const { t } = useTranslation();
  // Wizard-Theme-Fallbacks (Konsistenz mit C-Palette der Wizards)
  const C = theme || { teal:"#0EC4B8", ink:"#1a1a2e", inkMid:"rgba(26,26,42,0.62)", inkFade:"rgba(26,26,42,0.40)", border:"rgba(26,26,42,0.10)" };

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:14, fontWeight:600, color:C.ink, marginBottom:6 }}>
        {t("contentLang.label")}
      </div>
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        style={{
          width:"100%", padding:"11px 12px", borderRadius:12,
          border:`1.5px solid ${value ? C.teal : C.border}`,
          fontSize:14, fontFamily:"inherit", color:C.ink,
          background:"transparent", outline:"none",
          appearance:"none", WebkitAppearance:"none",
          cursor:"pointer",
        }}
      >
        <option value="">{t("contentLang.none")}</option>
        {SUPPORTED_LANGS.map(code => (
          <option key={code} value={code}>{LANG_FLAGS[code]} {LANG_LABELS[code]}</option>
        ))}
      </select>
      <div style={{ fontSize:11.5, color:C.inkFade, marginTop:6, lineHeight:1.5 }}>
        {value
          ? t("contentLang.hintSet", { lang: LANG_LABELS[value] || value })
          : t("contentLang.hintNone")}
      </div>
    </div>
  );
}
