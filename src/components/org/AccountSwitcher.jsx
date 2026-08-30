// src/components/org/AccountSwitcher.jsx
// ══════════════════════════════════════════════════════════════════════
// Account-Switcher — Wechsel zwischen persönlichem Profil und Org-Profilen
// Migration 132 (2026-08-30)
// ══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { HUI } from "../../design/hui.design.js";
import { HUILogo } from "../brand/HUILogo.jsx";
import OrgProfileCreateFlow from "./OrgProfileCreateFlow.jsx";

const T = {
  teal:    HUI.COLOR.teal,
  coral:   HUI.COLOR.coral,
  card:    "#FFFFFF",
  ink:     HUI.COLOR.ink,
  ink2:    HUI.COLOR.ink2,
  muted:   HUI.COLOR.muted,
  border:  "rgba(0,0,0,0.07)",
  cream:   HUI.COLOR.cream,
};

// ── Trigger-Button (kleiner Pfeil ▾ neben Avatar/Name) ────────────
export function AccountSwitcherTrigger({ onClick, hasOrgs }) {
  const { t } = useTranslation();
  if (!hasOrgs) return null;

  return (
    <button
      onClick={onClick}
      aria-label={t("org.switcher.switchAccount")}
      style={{
        background: "rgba(0,0,0,0.04)",
        border: "none",
        borderRadius: 8,
        padding: "4px 8px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "inherit",
        fontSize: 13,
        color: T.ink2,
        fontWeight: 500,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      ▾
    </button>
  );
}

// ── Haupt-Komponente: Dropdown-Sheet ──────────────────────────────
export default function AccountSwitcher({ open, onClose }) {
  const { t } = useTranslation();
  const { profile, orgProfiles, activeProfile, activeProfileId, switchProfile } = useAuth();
  useWizardBodyLock(open);

  const [showCreate, setShowCreate] = useState(false);

  // ── Profil wechseln ──────────────────────────────────────────────
  const handleSwitch = useCallback((profileId) => {
    switchProfile?.(profileId);
    onClose?.();
  }, [switchProfile, onClose]);

  // ── Org-Profil erstellen öffnen ──────────────────────────────────
  const handleCreateOrg = useCallback(() => {
    setShowCreate(true);
  }, []);

  const handleCreateClose = useCallback(() => {
    setShowCreate(false);
    onClose?.();
  }, [onClose]);

  if (!open && !showCreate) return null;

  // ── Persönliches Profil + Org-Profile kombinieren ────────────────
  const personalEntry = profile ? {
    id: profile.id,
    name: profile.display_name || profile.username || t("org.switcher.personal"),
    avatar_url: profile.avatar_url,
    type: "personal",
  } : null;

  const orgEntries = (orgProfiles || []).map(org => ({
    id: org.id,
    name: org.org_name || org.display_name || t("org.switcher.organization"),
    avatar_url: org.avatar_url,
    type: org.org_type || "organization",
  }));

  const allEntries = [personalEntry, ...orgEntries].filter(Boolean);

  // ── Render: Dropdown Sheet ───────────────────────────────────────
  return createPortal(
    <>
      {/* Backdrop */}
      {open && !showCreate && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 10490,
            background: "rgba(0,0,0,0.35)",
            animation: "org-toIn .2s ease",
          }}
        />
      )}

      {/* Dropdown Panel */}
      {open && !showCreate && (
        <div
          style={{
            position: "fixed",
            zIndex: 10500,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "calc(100% - 32px)",
            maxWidth: 380,
            background: T.cream,
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            overflow: "hidden",
            animation: "org-toPop .3s cubic-bezier(.34,1.4,.64,1)",
          }}
        >
          <style>{`
            @keyframes org-toIn{from{opacity:0}to{opacity:1}}
            @keyframes org-toPop{0%{transform:translate(-50%,-50%) scale(0.9);opacity:0}60%{transform:translate(-50%,-50%) scale(1.03)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
            .switcher-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .15s ease}
            .switcher-tap:active{background:rgba(0,0,0,0.04)}
          `}</style>

          {/* Header */}
          <div style={{
            padding: "16px 20px 12px",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>
                {t("org.switcher.title")}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "none", fontSize: 20,
                  color: T.muted, cursor: "pointer", lineHeight: 1,
                  fontFamily: "inherit",
                }}
              >✕</button>
            </div>
          </div>

          {/* Profile-Liste */}
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {allEntries.map((entry, idx) => {
              const isActive = activeProfileId
                ? entry.id === activeProfileId
                : entry.type === "personal";

              return (
                <div
                  key={entry.id}
                  className="switcher-tap"
                  onClick={() => handleSwitch(entry.type === "personal" ? null : entry.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: idx < allEntries.length - 1 ? `1px solid ${T.border}` : "none",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", overflow: "hidden",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: entry.avatar_url ? "transparent" : "rgba(0,0,0,0.04)",
                  }}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <HUILogo size={18} style={{ opacity: 0.4 }} />
                    )}
                  </div>

                  {/* Name + Badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.name}
                    </div>
                    {entry.type !== "personal" && (
                      <span style={{
                        display: "inline-block",
                        fontSize: 11, fontWeight: 500,
                        color: T.teal,
                        background: "rgba(22,215,197,0.08)",
                        borderRadius: 4, padding: "2px 6px", marginTop: 2,
                      }}>
                        {entry.type === "verein" ? t("org.type.verein") : t("org.type.unternehmen")}
                      </span>
                    )}
                    {entry.type === "personal" && (
                      <span style={{
                        display: "inline-block",
                        fontSize: 11, fontWeight: 500,
                        color: T.muted,
                        marginTop: 2,
                      }}>
                        {t("org.switcher.personal")}
                      </span>
                    )}
                  </div>

                  {/* Active Checkmark */}
                  {isActive && (
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: T.teal, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* + Konto hinzufügen */}
            <div
              className="switcher-tap"
              onClick={handleCreateOrg}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(22,215,197,0.08)",
                fontSize: 22, color: T.teal, fontWeight: 300,
              }}>+</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.teal }}>
                {t("org.switcher.addAccount")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* OrgProfileCreateFlow */}
      <OrgProfileCreateFlow
        open={showCreate}
        onClose={handleCreateClose}
      />
    </>,
    document.body
  );
}
