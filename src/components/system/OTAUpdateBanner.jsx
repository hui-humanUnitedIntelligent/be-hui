// src/components/system/OTAUpdateBanner.jsx
// ══════════════════════════════════════════════════════════
// OTA-Update-Banner (2026-08-09)
// ══════════════════════════════════════════════════════════
// WARUM: otaUpdate.js dispatched seit v2 (2026-08-08) das Event
// 'ota:update-ready' wenn im Hintergrund ein neues Bundle heruntergeladen
// wurde — aber NICHTS hat bisher darauf gehört. Der Nutzer hatte also
// KEINE visuelle Rückmeldung ob/wann ein Update wirklich ankommt, und
// musste blind raten ob ein Fix schon aktiv ist.
//
// Fix: Kleiner, dezenter Banner am unteren Bildschirmrand (oberhalb der
// Navbar, zIndex 10500, Portal auf document.body). Tippen auf "Jetzt
// aktivieren" ruft CapacitorUpdater.reload() — wendet das neue Bundle
// SOFORT an (kein manuelles Schließen+Neustarten mehr nötig).
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";

export default function OTAUpdateBanner() {
  const [update, setUpdate] = useState(null); // { version, current }
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    function onReady(e) {
      setUpdate(e.detail || {});
    }
    window.addEventListener("ota:update-ready", onReady);
    return () => window.removeEventListener("ota:update-ready", onReady);
  }, []);

  if (!update || !Capacitor.isNativePlatform()) return null;

  async function applyNow() {
    setReloading(true);
    try {
      await CapacitorUpdater.reload();
      // reload() startet die WebView neu — dieser Code läuft danach i.d.R. nicht mehr weiter.
    } catch (err) {
      console.error("[OTA] Reload fehlgeschlagen:", err);
      setReloading(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: 12, right: 12,
        bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
        zIndex: 10500,
        background: "#1A1D23",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        fontFamily: "Inter,sans-serif",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>⬆️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>
          Update v{update.version} bereit
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.7, lineHeight: 1.3 }}>
          Aktuell: v{update.current}
        </div>
      </div>
      <button
        onClick={applyNow}
        disabled={reloading}
        style={{
          flexShrink: 0,
          background: "#0EC4B8",
          color: "#0A2E2B",
          border: "none",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12.5, fontWeight: 600,
          cursor: reloading ? "default" : "pointer",
          opacity: reloading ? 0.6 : 1,
        }}
      >
        {reloading ? "…" : "Jetzt aktivieren"}
      </button>
    </div>,
    document.body
  );
}
