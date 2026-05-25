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
//   ✓ Kein doppelter Orb-Surface-State
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

import React, { useCallback, useState } from "react";

// Statische Imports — kein Lazy, kein Suspense, kein Race
import TeilenFlow          from "../../components/teilen/TeilenFlow.jsx";
import ConnectionCreatePage from "../../components/connection-create/ConnectionCreatePage.jsx";
import ExperienceFlow      from "./experience/ExperienceFlow.jsx";
import ImpactFlow          from "./impact/ImpactFlow.jsx";
import WorkFlow            from "./work/WorkFlow.jsx";
import InvitationFlow      from "../../content/invitation/InvitationFlow.jsx";
import HuiCreateFlow       from "../../components/HuiCreateFlow.jsx";
import TalentOnboarding    from "../../components/TalentOnboarding.jsx";

/* ── Flow-Key → Komponente Mapping ─────────────────────────── */
// Erweitern: einfach neuen case + Import hinzufügen.
// Kein State im Orb anfassen.

const FLOW_ALIASES = Object.freeze({
  // Teilen
  story: "teilen",
  moment: "teilen",
  teilen: "teilen",
  foto: "teilen",
  gedanke: "teilen",
  thought: "teilen",
  inspiration: "teilen",
  musik: "teilen",
  geschichte: "teilen",

  // Werk
  work: "werk",
  werk: "werk",
  kunstwerk: "werk",
  handwerk: "werk",
  design: "werk",
  digital: "werk",
  sammler: "werk",

  // Erlebnis
  experience: "experience",
  erlebnis: "experience",
  workshop: "experience",
  retreat: "experience",
  event: "experience",
  session: "experience",
  erlebnis_s: "experience",
  veranstaltung: "experience",

  // Verbindung
  connect: "connect",
  connection: "connect",
  kollab: "connect",
  mentor: "connect",
  partner: "connect",
  community: "connect",

  // Wirkung
  impact: "impact",
  idee: "impact",
  projekt: "impact",
  wirkraum: "impact",
  einreich: "impact",
  wirkung: "impact",

  // Weitere bestehende Orb-Flows
  create: "create",
  invitation: "invitation",
  einladung: "invitation",
  wirker: "wirker",
  membership: "wirker",
  talent: "wirker",
});

export function normalizeOrbFlowKey(rawFlow) {
  const rawKey = typeof rawFlow === "string"
    ? rawFlow
    : rawFlow?.action ?? rawFlow?.key ?? rawFlow?.type;
  if (!rawKey || typeof rawKey !== "string") return null;
  return FLOW_ALIASES[rawKey.trim().toLowerCase()] ?? null;
}

export function FlowManager({
  activeFlow,
  onFlowStart,
  onFlowEnd,
  isTalent    = false,
  authProfile = null,
}) {
  const close = useCallback(() => onFlowEnd?.(), [onFlowEnd]);
  const flowKey = normalizeOrbFlowKey(activeFlow);

  if (!activeFlow) return null;
  if (!flowKey) {
    console.warn("[FlowManager] Unbekannter Flow-Key:", activeFlow);
    return null;
  }

  switch (flowKey) {

    // ── Werk erschaffen ────────────────────────────────────
    case "werk":
      return (
        <WorkFlow
          key="flow-werk"
          onClose={close}
          onPublished={close}
        />
      );

    // ── Teilen ─────────────────────────────────────────────
    case "teilen":
      return (
        <TeilenFlow
          key="flow-teilen"
          onClose={close}
          onPublished={close}
        />
      );

    // ── Verbindung ─────────────────────────────────────────
    case "connect":
      return (
        <ConnectionCreatePage
          key="flow-connect"
          onClose={close}
          onPublish={close}
        />
      );

    // ── Erlebnis ───────────────────────────────────────────
    case "experience":
      return (
        <ExperienceFlow
          key="flow-experience"
          onClose={close}
        />
      );

    // ── Wirkung starten (ImpactPool Bewerbung) ────────────
    case "impact":
      return (
        <ImpactFlow
          key="flow-impact"
          onClose={close}
        />
      );

    // ── Einladung ──────────────────────────────────────────
    case "invitation":
      return (
        <InvitationFlow
          key="flow-invitation"
          visible={true}
          onClose={close}
        />
      );

    // ── Create ─────────────────────────────────────────────
    case "create":
      return (
        <HuiCreateFlow
          key="flow-create"
          onClose={close}
          onSuccess={close}
        />
      );

    // ── Wirker werden ──────────────────────────────────────
    case "wirker":
      return (
        <TalentOnboarding
          key="flow-wirker"
          onClose={close}
          onActivate={close}
        />
      );

    // ── Unbekannt ──────────────────────────────────────────
    default:
      console.warn("[FlowManager] Unbekannter Flow-Key:", flowKey);
      return null;
  }
}

/* ── useFlowManager Hook ──────────────────────────────────────
   Verwaltet den activeFlow State zentral.
   Wird im HomeShell verwendet, nicht im Orb selbst.
────────────────────────────────────────────────────────────── */

export function useFlowManager() {
  const [activeFlow, setActiveFlow] = useState(null);

  const startFlow = useCallback((key) => {
    if (!key) return;
    // Kurzer Delay falls Orb-Animation noch läuft
    // (requestAnimationFrame kommt bereits aus OrbState.triggerAction)
    setActiveFlow(key);
  }, []);

  const endFlow = useCallback(() => {
    setActiveFlow(null);
  }, []);

  return { activeFlow, startFlow, endFlow };
}
