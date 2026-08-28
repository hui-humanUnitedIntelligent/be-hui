// src/components/profile/my-basis/TalentErweiterung.jsx
// TalentErweiterung — extracted from MyBasisProfile.jsx. No logic changes.
import React from "react";
import { T } from "./constants.js";

import { useTranslation } from "../../../hooks/useTranslation.js";

export function TalentErweiterung({ profile, onProfileUpdate }) {
  const { t } = useTranslation();


  return (
    <div style={{ padding: "0 20px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0EC4B8 0%, #00A8A0 100%)",
        borderRadius: T.r16,
        padding: "20px",
        marginBottom: 20,
        color: "#fff",
      }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          <span className="hui-emoji">🌱</span> Du bist Teil der Gemeinschaft
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Gestalte dein Profil und werde sichtbar.
        </div>
      </div>


      {/* Meine Werke */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE WERKE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card, marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Werke hinzugefügt. Teile deine Projekte, Ideen und Leistungen mit der Gemeinschaft.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#fff",
        }}>
          + Werk hinzufügen
        </button>
      </div>

      {/* Meine Erlebnisse */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE ERLEBNISSE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Erlebnisse hinzugefügt. Berichte von echten Begegnungen und Erfahrungen.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#fff",
        }}>
          + Erlebnis hinzufügen
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// AMBASSADOR BANNER — Screenshot-genau unten im Profil
// Kompakter Banner mit Bild + Text + Button
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// TALENT-PROFIL SEKTIONEN (is_talent === true)
// ══════════════════════════════════════════════════════════════

const TALENT_KATEGORIEN = [
  {icon:"🎨", key:"cat.malerei", label:"Malerei"},      {icon:"✏️", key:"cat.illustration", label:"Illustration"},
  {icon:"📸", key:"cat.fotografie", label:"Fotografie"},   {icon:"🎵", key:"cat.musik", label:"Musik"},
  {icon:"🎤", key:"cat.gesang", label:"Gesang"},       {icon:"🪡", key:"cat.handwerk", label:"Handwerk"},
  {icon:"💻", key:"cat.programmierung", label:"Programmierung"},{icon:"📐", key:"cat.design", label:"Design"},
  {icon:"📚", key:"cat.bildung", label:"Bildung"},      {icon:"🎭", key:"cat.theater", label:"Theater"},
  {icon:"🧘", key:"cat.coaching", label:"Coaching"},     {icon:"🌿", key:"cat.naturfuehrung", label:"Naturführung"},
  {icon:"🍳", key:"cat.kochen", label:"Kochen"},       {icon:"🎬", key:"cat.film", label:"Film"},
  {icon:"✍️", key:"cat.schreiben", label:"Schreiben"},   {icon:"🏺", key:"cat.toepfern", label:"Töpfern"},
  {icon:"🎸", key:"cat.workshops", label:"Workshops"},    {icon:"⭐", key:"cat.kunstberatung", label:"Kunstberatung"},
  {icon:"🖼️", key:"cat.auftragskunst", label:"Auftragskunst"},{icon:"🎁", key:"cat.weitere", label:"Weitere Angebote"},
];


// ITEM-ACTION-CHOICE (2026-08-16, Michael-Feedback Screenshot "Meine Werke"):
// Klick auf ein Werk/Talent/Erlebnis in "Mein Bereich" oeffnete bisher IMMER
// direkt den Bearbeiten-Wizard. Michael will zusaetzlich die Moeglichkeit,
// den Beitrag GENAUSO anzusehen wie er im Home-Feed erscheint -- ueber den
// bereits bestehenden, app-weiten Oeffnen-Mechanismus openRef({type,id})
// (ContentPreviewContext.jsx -> PostFullscreenView/ContentPreviewSheet,
// exakt dieselbe Ansicht wie im Feed). Fix: kleine Auswahl-Sheet zwischen
// Karten-Klick und Wizard/Ansicht -- additiv, kein bestehendes Verhalten
// entfernt (Wizard bleibt via "bearbeiten" weiterhin 1 Klick entfernt).
// createPortal(document.body) + zIndex 10500 Pflicht fuer neue Modals
// (siehe footer-navbar-zindex.md).
