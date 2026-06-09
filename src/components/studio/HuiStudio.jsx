// src/components/studio/HuiStudio.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Studio — zentrale Verwaltungsoberfläche
// Design: exakt nach Screenshot — STUDIO-BEREICH mit 4 Sections
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase }    from "../../lib/supabaseClient.js";
import { useAuth }     from "../../lib/AuthContext.jsx";
import AmbassadorSection, { AmbassadorCTA } from "../ambassador/AmbassadorSection.jsx";
import AmbassadorModal  from "../ambassador/AmbassadorModal.jsx";
import SettingsModal    from "../settings/SettingsModal.jsx";
import { useAmbassador } from "../../hooks/useAmbassador.js";

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  px:        20,
  r16: 16, r12: 12, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

const CSS = `
  .studio-root {
    background:${T.bg};
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .studio-scroll {
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .studio-scroll::-webkit-scrollbar { display:none; }
  .studio-row-btn {
    -webkit-tap-highlight-color:transparent;
    transition:background .12s ease;
  }
  .studio-row-btn:active { background:rgba(14,196,184,0.06) !important; }
`;

// ── Primitives ────────────────────────────────────────────────────
function Gap({ h }) { return <div style={{ height: h }} />; }

// ── Section mit Label + Card ──────────────────────────────────────
function StudioSection({ label, children }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        fontSize:13, fontWeight:700, color:T.ink,
        marginBottom:10, letterSpacing:"-0.01em",
      }}>
        {label}
      </div>
      <div style={{
        background:T.bgCard,
        borderRadius:T.r16,
        border:`1px solid ${T.border}`,
        overflow:"hidden",
        boxShadow:T.card,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Einzelne Zeile mit Pfeil ──────────────────────────────────────
function StudioRow({ icon, label, badge, onPress, last = false }) {
  return (
    <button
      className="studio-row-btn"
      onClick={onPress}
      style={{
        width:"100%", display:"flex", alignItems:"center", gap:14,
        padding:"15px 18px",
        background:"none", border:"none", cursor:"pointer",
        fontFamily:"inherit", textAlign:"left",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
      }}
    >
      {/* Icon */}
      <span style={{
        width:34, height:34, borderRadius:10, flexShrink:0,
        background:"rgba(26,26,24,0.05)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:17,
      }}>
        {icon}
      </span>

      {/* Label */}
      <span style={{
        flex:1, fontSize:14, fontWeight:500, color:T.ink,
      }}>
        {label}
      </span>

      {/* Badge (optional) */}
      {badge && (
        <span style={{
          padding:"2px 9px", borderRadius:99,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          fontSize:11, fontWeight:700, color:T.teal,
          flexShrink:0,
        }}>
          {badge}
        </span>
      )}

      {/* Pfeil */}
      <span style={{ fontSize:15, color:T.inkFaint, flexShrink:0 }}>›</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// HUI STUDIO — HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════════
export default function HuiStudio({ profile, onClose, onProfileUpdate }) {
  const [mounted,     setMounted]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAmbModal, setShowAmbModal] = useState(false);

  const ambState = useAmbassador(profile?.id ?? null);
  const isTalent   = profile?.is_talent === true;
  const isAmb      = profile?.is_ambassador === true;
  const isVerified = profile?.verified === true;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleEditProfile = useCallback(() => {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("hui:open-profile-editor"));
  }, []);

  if (!profile) return null;

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:9600,
      display:"flex", flexDirection:"column",
      background:T.bg,
      opacity:   mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(24px)",
      transition:"opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{
        padding:`max(52px,calc(48px + env(safe-area-inset-top,0px))) ${T.px}px 16px`,
        background:T.bgCard,
        borderBottom:`1px solid ${T.border}`,
        flexShrink:0,
      }}>
        {/* Zurück-Button */}
        <button
          onClick={onClose}
          style={{
            position:"absolute", top:"max(14px,calc(10px + env(safe-area-inset-top,0px)))",
            left:T.px,
            background:"none", border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, color:T.teal,
            fontFamily:"inherit", touchAction:"manipulation",
            display:"flex", alignItems:"center", gap:4,
          }}
        >
          ‹ Zurück
        </button>

        {/* Titel */}
        <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>
          STUDIO-BEREICH.
        </div>
        <div style={{ fontSize:13, color:T.inkFaint, marginTop:2 }}>
          HUI-Account.
        </div>
      </div>

      {/* ── SCROLLBARER INHALT ──────────────────────────────────── */}
      <div
        className="studio-scroll"
        style={{
          flex:1, overflowY:"auto",
          paddingBottom:"max(88px,calc(80px + env(safe-area-inset-bottom,0px)))",
        }}
      >
        <Gap h={20}/>

        {/* STUDIO — Intro-Card */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:T.bgCard,
            borderRadius:T.r16,
            border:`1px solid ${T.border}`,
            padding:"18px 20px",
            boxShadow:T.card,
            marginBottom:20,
          }}>
            <div style={{
              fontSize:12, fontWeight:700, color:T.teal,
              letterSpacing:"0.06em", marginBottom:10,
            }}>
              STUDIO – Nur für dich
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, lineHeight:1.25, marginBottom:6 }}>
              Willkommen in deinem<br/>HUI Studio
            </div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.6 }}>
              Verwalte deinen Account, Einladungen und deinen Impact.
            </div>
          </div>
        </div>

        {/* ── 1. Community & Empfehlungen ─────────────────────── */}
        <StudioSection label="Community & Empfehlungen">
          <StudioRow
            icon="👥"
            label="Ambassador-Bereich"
            onPress={() => setShowAmbModal(!isAmb)}
          />
          <StudioRow
            icon="⭐"
            label="Meine Empfehlungen"
            onPress={() => {}}
          />
          <StudioRow
            icon="✉️"
            label="Einladungen verwalten"
            onPress={() => {}}
            last
          />
        </StudioSection>

        <Gap h={20}/>

        {/* ── 2. Impact & Stimmen ─────────────────────────────── */}
        <StudioSection label="Impact & Stimmen">
          <StudioRow
            icon="🗳️"
            label="Impact-Stimmen"
            badge={isTalent ? "2 / Monat" : undefined}
            onPress={() => {}}
          />
          <StudioRow
            icon="❤️"
            label="Meine unterstützten Projekte"
            onPress={() => {}}
            last
          />
        </StudioSection>

        <Gap h={20}/>

        {/* ── 3. Einnahmen & Statistiken ──────────────────────── */}
        <StudioSection label="Einnahmen & Statistiken">
          <StudioRow
            icon="💶"
            label="Einnahmen Übersicht"
            onPress={() => {}}
          />
          <StudioRow
            icon="📊"
            label="Statistiken"
            onPress={() => {}}
            last
          />
        </StudioSection>

        <Gap h={20}/>

        {/* ── 4. Account & Einstellungen ──────────────────────── */}
        <StudioSection label="Account & Einstellungen">
          <StudioRow
            icon="👤"
            label="Profil bearbeiten"
            onPress={handleEditProfile}
          />
          <StudioRow
            icon="🛡️"
            label="Verifizierung"
            badge={isVerified ? "✓ Aktiv" : undefined}
            onPress={() => {}}
          />
          <StudioRow
            icon="👑"
            label="Mitgliedschaft"
            badge={isTalent ? "HUI-Talent" : "HUI-Mitglied"}
            onPress={() => setShowSettings(true)}
          />
          <StudioRow
            icon="⚙️"
            label="Einstellungen"
            onPress={() => setShowSettings(true)}
            last
          />
        </StudioSection>

        <Gap h={20}/>

        {/* ── Privacy Footer ──────────────────────────────────── */}
        <div style={{ padding:`0 ${T.px}px` }}>
          <div style={{
            background:"rgba(14,196,184,0.07)",
            borderRadius:T.r16,
            border:`1px solid rgba(14,196,184,0.18)`,
            padding:"14px 18px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <span style={{ fontSize:22, flexShrink:0 }}>🔒</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>
                Dein Studio ist privat.
              </div>
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>
                Nur du hast hier Zugriff.
              </div>
            </div>
          </div>
        </div>

        <Gap h={20}/>
      </div>

      {/* ── Settings Modal ────────────────────────────────────── */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={onProfileUpdate}
          onEditProfile={() => {
            setShowSettings(false);
            handleEditProfile();
          }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined")
              window.dispatchEvent(new CustomEvent("hui:open-bookings"));
          }}
        />
      )}

      {/* ── Ambassador Bewerbungs-Modal ───────────────────────── */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={() => {
            setShowAmbModal(false);
            onProfileUpdate?.({});
          }}
        />
      )}
    </div>,
    document.body
  );
}
