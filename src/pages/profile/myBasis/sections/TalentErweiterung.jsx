import React from "react";
import { T } from "../tokens.js";
export function TalentErweiterung({ profile, onProfileUpdate }) {


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
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          🌱 Du bist Teil der Gemeinschaft
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Gestalte dein Profil und werde sichtbar.
        </div>
      </div>


      {/* Meine Werke */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
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
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Werk hinzufügen
        </button>
      </div>

      {/* Meine Erlebnisse */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
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
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Erlebnis hinzufügen
        </button>
      </div>
    </div>
  );
}
