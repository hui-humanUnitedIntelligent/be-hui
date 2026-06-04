// src/system/flows/FlowManager.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Zentraler Flow Manager
//
// Verantwortlichkeit: Verwaltet ALLE Flows die der Orb auslösen kann.
//
// Der Orb kennt keine Flows. Er ruft nur onAction(type) auf.
// FlowManager entscheidet was passiert.
//
// Vorteile:
//   ✓ Kein State im Orb
//   ✓ Kein Suspense-Race
//   ✓ Kein doppeltes setShowPlusSheet
//   ✓ Flows isoliert und testbar
//   ✓ Neue Flows einfach erweiterbar (1 case hinzufügen)
//
// Props:
//   activeFlow  — aktuell offener Flow-Key oder null
//   onFlowStart(key) — Flow öffnen
//   onFlowEnd()      — Flow schliessen
//   isTalent         — Wirker-Status
//   authProfile      — Auth-Profil
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";

// Statische Imports — kein Lazy, kein Suspense, kein Race
import TeilenFlow          from "../../components/teilen/TeilenFlow.jsx";
import ConnectionCreatePage from "../../components/connection-create/ConnectionCreatePage.jsx";
import ExperienceFlow      from "./experience/ExperienceFlow.jsx";
import ImpactFlow          from "./impact/ImpactFlow.jsx";
import WorkFlow            from "./work/WorkFlow.jsx";

/* ── Flow-Key → Komponente Mapping ─────────────────────────── */
// Erweitern: einfach neuen case + Import hinzufügen.
// Kein State im Orb anfassen.

export function FlowManager({
  activeFlow,
  onFlowStart,
  onFlowEnd,
  isTalent    = false,
  authProfile = null,
}) {
  const close = useCallback(() => {
    console.log("FLOW_CLOSE_TRIGGER", "FlowManager.close", { activeFlow });
    if (window.__PUBLISHING__) {
      console.warn("BLOCKED_CLOSE_DURING_PUBLISH", "FlowManager.close");
      return;
    }
    onFlowEnd?.();
  }, [onFlowEnd, activeFlow]);

  if (!activeFlow) return null;

  switch (activeFlow) {

    // ── Werk erschaffen ────────────────────────────────────
    case "werk":
    case "kunstwerk":
    case "handwerk":
    case "design":
    case "digital":
    case "sammler":
      return (
        <WorkFlow
          key="flow-werk"
          onClose={close}
          onPublished={close}
        />
      );

    // ── Teilen ─────────────────────────────────────────────
    case "story":
    case "moment":
    case "teilen":
    case "foto":
    case "gedanke":
    case "inspiration":
    case "musik":
    case "geschichte":
      return (
        <TeilenFlow
          key="flow-teilen"
          onClose={close}
          onPublished={(result) => {
            console.log("FLOWMANAGER_ONPUBLISHED", result);
            // KEIN close() hier — TeilenFlow regelt das selbst nach Insert
          }}
        />
      );

    // ── Verbindung ─────────────────────────────────────────
    case "connect":
    case "kollab":
    case "mentor":
    case "partner":
    case "community":
      return (
        <ConnectionCreatePage
          key="flow-connect"
          onClose={close}
          onPublish={close}
        />
      );

    // ── Erlebnis ───────────────────────────────────────────
    case "experience":
    case "erlebnis":
    case "workshop":
    case "retreat":
    case "event":
    case "session":
    case "erlebnis_s":
      return (
        <ExperienceFlow
          key="flow-experience"
          onClose={close}
        />
      );

    // ── Wirkung starten (ImpactPool Bewerbung) ────────────
    case "impact":
    case "idee":
    case "wirkraum":
    case "einreich":
    case "wirkung":
      return (
        <ImpactFlow
          key="flow-impact"
          onClose={close}
        />
      );

    // ── Unbekannt ──────────────────────────────────────────
    default:
      console.warn("[FlowManager] Unbekannter Flow-Key:", activeFlow);
      return null;
  }
}

/* ── useFlowManager Hook ──────────────────────────────────────
   Verwaltet den activeFlow State zentral.
   Wird im HomeShell verwendet, nicht im Orb selbst.
────────────────────────────────────────────────────────────── */

export function useFlowManager() {
  const [activeFlow, setActiveFlow] = useState(null);

  const startFlow = useC((key) => {
    if (!key) return;
    // Kurzer Delay falls Orb-Animation noch läuft
    // (requestAnimationFrame kommt bereits aus OrbState.triggerAction)
    setActiveFlow(key);
  }, []);

  const endFlow = useC(() => {
    setActiveFlow(null);
  }, []);

  return { activeFlow, startFlow, endFlow };
}
