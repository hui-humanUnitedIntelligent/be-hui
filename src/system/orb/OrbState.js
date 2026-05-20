// src/system/orb/OrbState.js
// ═══════════════════════════════════════════════════════════════
// HUI ORB — State Machine Hook
//
// Der Orb hält NUR seinen eigenen UI-State:
//   activeNode     — welcher Node visuell aktiv ist
//   detailNode     — welcher Node die DetailCard zeigt
//   isTransitioning — Click-Lock während Flow-Übergang
//   impactOpen     — Impact-Detail Overlay offen
//
// KEIN Flow-State. KEIN Modal-State. KEIN globaler State.
// Flows werden vom FlowManager (außerhalb des Orb) verwaltet.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { TRANSITION_LOCK_MS } from "./OrbConfig.js";

export function useOrbState({ onAction, onClose }) {
  const [activeNode,      setActiveNode]      = useState(null);
  const [detailNode,      setDetailNode]      = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [impactOpen,      setImpactOpen]      = useState(false);

  // ── clearAll: alle internen States resetten ──────────────────
  const clearAll = useCallback(() => {
    setActiveNode(null);
    setDetailNode(null);
    setImpactOpen(false);
  }, []);

  // ── triggerAction: einziger Weg um einen Flow zu starten ────
  // 1. Click-Lock setzen
  // 2. Orb schliessen (synchron)
  // 3. Flow starten im nächsten Frame (Race-free)
  const triggerAction = useCallback((actionKey) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    clearAll();
    onClose?.();   // Orb unmounts — synchron
    window.requestAnimationFrame(() => {
      onAction?.(actionKey);   // Flow startet — PlusSheet ist weg
      setTimeout(() => setIsTransitioning(false), TRANSITION_LOCK_MS);
    });
  }, [isTransitioning, clearAll, onAction, onClose]);

  // ── handleNodeTap: Node-Interaktions-Logik ──────────────────
  // directAction-Nodes: Single-Tap → sofort Flow
  // isImpact-Nodes: Single-Tap → ImpactDetail
  // Werk/Erlebnis: 1. Tap aktiviert, 2. Tap öffnet DetailCard
  const handleNodeTap = useCallback((node) => {
    if (isTransitioning) return;
    if (node.directAction && !node.isImpact) {
      triggerAction(node.action);
    } else if (node.isImpact) {
      setActiveNode(null);
      setImpactOpen(true);
    } else if (activeNode?.key === node.key) {
      // 2. Tap → DetailCard
      setDetailNode(node);
      setActiveNode(null);
    } else {
      // 1. Tap → aktivieren
      setActiveNode(node);
    }
  }, [isTransitioning, activeNode, triggerAction]);

  // ── handleHintOpen: "Öffnen"-Button im HintBar ──────────────
  const handleHintOpen = useCallback(() => {
    if (!activeNode || isTransitioning) return;
    if (activeNode.isImpact)      { setImpactOpen(true); setActiveNode(null); }
    else if (activeNode.directAction) { triggerAction(activeNode.action); }
    else                          { setDetailNode(activeNode); setActiveNode(null); }
  }, [activeNode, isTransitioning, triggerAction]);

  // ── handleOrbTap: Tap auf den Center-Orb ────────────────────
  const handleOrbTap = useCallback(() => {
    if (!activeNode || isTransitioning) return;
    if (activeNode.isImpact)          { setImpactOpen(true); setActiveNode(null); }
    else if (activeNode.directAction) { triggerAction(activeNode.action); }
    else                              { setDetailNode(activeNode); setActiveNode(null); }
  }, [activeNode, isTransitioning, triggerAction]);

  // ── handleEscape ────────────────────────────────────────────
  const handleEscape = useCallback(() => {
    if (impactOpen)  { setImpactOpen(false); return; }
    if (detailNode)  { setDetailNode(null);  return; }
    onClose?.();
  }, [impactOpen, detailNode, onClose]);

  // ── handleBackdropTap: Klick auf den Overlay-Hintergrund ────
  const handleBackdropTap = useCallback(() => {
    if (activeNode) { setActiveNode(null); return; }
    onClose?.();
  }, [activeNode, onClose]);

  return {
    // State
    activeNode, detailNode, impactOpen, isTransitioning,
    // Setters (für ImpactDetail onClose etc.)
    setImpactOpen, setDetailNode, setActiveNode,
    // Handlers
    handleNodeTap, handleHintOpen, handleOrbTap,
    handleEscape, handleBackdropTap,
    triggerAction,
  };
}
