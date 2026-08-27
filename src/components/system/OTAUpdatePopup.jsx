// src/components/system/OTAUpdatePopup.jsx
// ═══════════════════════════════════════════════════════════════════
// OTA-Update-Popup v2 (2026-08-20)
// ═══════════════════════════════════════════════════════════════════
// OTA-UPDATE-LOOP-001 FIX: Das Popup war vorher der DRITTE konkurrierende
// Update-Pfad — es rief bei Klick CapacitorUpdater.download()+set()+reload()
// auf, ZUSÄTZLICH zum nativen autoUpdate:true UND zum JS-autoCheckOTA().
// Das hat den Bundle-Storage konkurrierend beschrieben → Race Condition.
//
// NEU: Das Popup ist jetzt REIN INFORMATIV. Es zeigt dem Nutzer beim Resume
// ("App kommt in den Vordergrund"), dass ein Update verfügbar ist und dass
// es automatisch im Hintergrund installiert wird. Es löst KEINE Bundle-
// Mutation mehr aus. Die Installation liegt exklusiv beim nativen Plugin
// (autoUpdate:true in capacitor.config.json).
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { APP_VERSION } from "../../version.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const UPDATE_URL = "https://be-hui.vercel.app/app-version.json";
const POPUP_DURATION_MS = 6000;
const ANIM_MS = 300;

const CSS = `
@keyframes huiOtaSlideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
@keyframes huiOtaSlideUp {
  from { transform: translateY(0);     opacity: 1; }
  to   { transform: translateY(-100%); opacity: 0; }
}
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
}

// Plugin Proxy (gleiches Muster wie AndroidBackButtonHandler — No-Op auf Web)
const AppPlugin = registerPlugin("App", {});

// ── Versionsvergleich (identisch zu otaUpdate.js) ──
function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export default function OTAUpdatePopup() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [version, setVersion] = useState(null);
  const hideTimerRef = useRef(null);
  const resumeCheckRef = useRef(false); // debounce

  injectCSS();

  // ── Popup anzeigen + Auto-Hide nach 6s ──
  const showPopup = useCallback(function(ver) {
    setVersion(ver);
    setClosing(false);
    setShow(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(function() {
      setClosing(true);
      setTimeout(function() { setShow(false); setClosing(false); }, ANIM_MS);
    }, POPUP_DURATION_MS);
  }, []);

  // ── Popup manuell schließen ──
  const dismiss = useCallback(function() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setClosing(true);
    setTimeout(function() { setShow(false); setClosing(false); }, ANIM_MS);
  }, []);

  // ── Update-Info lesen (beim Resume) — REIN INFORMATIV ──
  const checkForUpdate = useCallback(async function() {
    try {
      const resp = await fetch(UPDATE_URL, { cache: "no-store" });
      if (!resp.ok) return;
      const data = await resp.json();
      const serverVersion = data.version;
      if (!serverVersion) return;
      const isNewer = compareVersions(serverVersion, APP_VERSION) > 0;
      if (isNewer) {
        showPopup(serverVersion);
      }
    } catch (err) {
      // Still — kein Crash, nur kein Popup
    }
  }, [showPopup]);

  // ── Resume-Erkennung: visibilitychange (Web + Capacitor) ──
  useEffect(function() {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (resumeCheckRef.current) return;
      resumeCheckRef.current = true;
      setTimeout(function() { resumeCheckRef.current = false; }, 2000);
      checkForUpdate();
    }

    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    let cleanup = null;
    if (Capacitor.isNativePlatform()) {
      AppPlugin.addListener("resume", function() {
        if (resumeCheckRef.current) return;
        resumeCheckRef.current = true;
        setTimeout(function() { resumeCheckRef.current = false; }, 2000);
        checkForUpdate();
      }).then(function(listener) {
        cleanup = function() { listener && listener.remove && listener.remove(); };
      }).catch(function() {});
    }

    return function() {
      document.removeEventListener("visibilitychange", onVisibility);
      if (cleanup) cleanup();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [checkForUpdate]);

  if (!show) return null;

  return createPortal(
    React.createElement("div", {
      onClick: dismiss,
      style: {
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 20000,
        padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 0",
        display: "flex",
        justifyContent: "center",
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        animation: closing
          ? `huiOtaSlideUp ${ANIM_MS}ms ease both`
          : `huiOtaSlideDown ${ANIM_MS}ms cubic-bezier(0.22,1,0.36,1) both`,
      },
    },
      React.createElement("div", {
        style: {
          background: "#FFFFFF",
          color: "#1A1D23",
          borderRadius: "0 0 20px 20px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
          border: "1px solid rgba(14,196,184,0.16)",
          maxWidth: 420,
          width: "100%",
          pointerEvents: "none",
        },
      },
        React.createElement("div", {
          style: {
            width: 36, height: 36,
            borderRadius: "50%",
            background: "rgba(14,196,184,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          },
        },
          "⬆️"
        ),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", {
            style: { fontSize: 14, fontWeight: 600, lineHeight: 1.25, color: "#1A1D23" },
          },
            t("ota.updateAvailable")
          ),
          React.createElement("div", {
            style: { fontSize: 12, opacity: 0.62, lineHeight: 1.3, marginTop: 2, color: "#1A1D23" },
          },
            "v" + APP_VERSION + " → v" + (version || "?") + " · Wird automatisch installiert"
          )
        )
      )
    ),
    document.body
  );
}
