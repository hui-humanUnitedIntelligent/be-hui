// src/system/orb/OrbSystem.jsx
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Haupt-Orchestrator v7 (MODULAR)
//
// Verantwortlichkeit: NUR Navigation + UI-Koordination.
//
// Was dieser Komponente NICHT macht:
//   ✗ Flows öffnen (das macht FlowManager)
//   ✗ Modals verwalten
//   ✗ Globale States kontrollieren
//   ✗ Lazy Imports koordinieren
//
// Was dieser Komponente macht:
//   ✓ Orb-UI rendern (Atmosphere, Nodes, Center, Cards)
//   ✓ User-Interaktionen an useOrbState delegieren
//   ✓ onAction(type) nach oben propagieren
//   ✓ eigene States sauber verwalten (useOrbState)
//
// Props:
//   onAction(type) — wird aufgerufen wenn User eine Node auslöst
//   onClose()      — Orb schliessen
//   isTalent       — Wirker-Status für locked Nodes
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import { ORB_CSS }                    from "./OrbAnimations.js";
import { OrbAtmosphere, OrbParticles } from "./OrbAtmosphere.jsx";
import { OrbCenter }                  from "./OrbCenter.jsx";
import { OrbNode }                    from "./OrbNode.jsx";
import { OrbHintBar, OrbDetailCard, OrbImpactDetail } from "./OrbHintCard.jsx";
import { useOrbState }                from "./OrbState.js";
import { useUserRole } from '../../lib/roles/index.js';
import {
  Z, T, NODES, NODE_SIZE, ORBIT_RATIO, ORB_MIN, ORB_MAX, MOUNT_DELAY_MS,
} from "./OrbConfig.js";
import { SAFE_MODE } from "../../config/safeMode.js";

/* ── polar(): Winkel + Radius → px-Offset vom Zentrum ───────── */
function polar(angleDeg, r) {
  const rad = angleDeg * Math.PI / 180;
  return { x: Math.round(Math.cos(rad) * r), y: Math.round(Math.sin(rad) * r) };
}

/* ── Main Component ─────────────────────────────────────────── */
// ── Debug Log ─────────────────────────────────────────────────
function useOrbDebugLog(label) {
  // Phase 14: debug logs now handled by OrbWorldContext
  void label;
}

export default function OrbSystem({
  onAction,
  onClose,
  isTalent   = false,
  isTrusted  = false,
  worldState = null,   // World Continuity state — for atmosphere sync
}) {
  // canUseOrb(nodeKey) prüft Rollen zentral — ersetzt verteilte isTalent-Checks
  const { canUseOrb, role } = useUserRole();
  // ── Mount Animation ──────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    console.log("[HUI ORB] overlay mounted — overlay state: open");
    const t = setTimeout(() => {
      setMounted(true);
      console.log("[HUI ORB] overlay fully visible — nodes arriving");
    }, MOUNT_DELAY_MS);
    return () => {
      clearTimeout(t);
      console.log("[HUI ORB] overlay unmounted — world resurfacing");
    };
  }, []);

  // ── Responsive Viewport ──────────────────────────────────────
  // Safari Fix: visualViewport.width ist der sichtbare Viewport (ohne Scrollbar),
  // window.innerWidth ist der Layout-Viewport (kann auf iPad groesser sein).
  function getVw() { return (window.visualViewport?.width  ?? window.innerWidth);  }
  function getVh() { return (window.visualViewport?.height ?? window.innerHeight); }
  const [vw, setVw] = useState(getVw);
  const [vh, setVh] = useState(getVh);
  useEffect(() => {
    const fn = () => { setVw(getVw()); setVh(getVh()); };
    // visualViewport resize: praeziser als window resize auf iOS
    const vvp = window.visualViewport;
    if (vvp) {
      vvp.addEventListener("resize", fn);
      return () => vvp.removeEventListener("resize", fn);
    }
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Orb State (komplett isoliert) ───────────────────────────
  useOrbDebugLog('OrbSystem');
  const orb = useOrbState({ onAction, onClose });

  // ── Escape Key ──────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") orb.handleEscape(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [orb.handleEscape]);

  // ── Layout: Orbit-Radius responsiv ─────────────────────────
  const orbR = useMemo(() => {
    const r = Math.min(vw, vh) * ORBIT_RATIO;
    return Math.min(Math.max(r, ORB_MIN), ORB_MAX);
  }, [vw, vh]);

  // ── Ambient-Farbe folgt aktivem Node ────────────────────────
  const ambientColor = orb.activeNode?.color || T.teal;

  // ── Stage-Größe ─────────────────────────────────────────────
  const stageW = Math.min(orbR * 2 + 180, vw - 32); // Safari: nie breiter als Viewport
  const stageH = orbR * 2 + 200;

  return (
    <>
      <style>{ORB_CSS}</style>

      {/* ════════════════════════════════════════════════════════
          FULLSCREEN OVERLAY
          zIndex: 9000 — über BottomNav (100), unter Profil (9500)
          Background: Morning-Light Gradient
      ════════════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="HUI Orb — Dein kreatives Zentrum"
        style={{
          position:"fixed", inset:0,
          zIndex:Z.orbOverlay,
          background:T.bgGrad,
          opacity: mounted ? 1 : 0,
          transition:"opacity 0.28s ease",
          overflow:"hidden",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onClick={e => {
          if (e.target === e.currentTarget) orb.handleBackdropTap();
        }}
      >
        {/* ── Atmosphere: blobs + ambient — alles pointer-events:none */}
        {SAFE_MODE.ambient && <OrbAtmosphere ambientColor={orb.activeNode?.color} />}

        {/* ── Partikel (erst nach mount) */}
        {mounted && SAFE_MODE.particles && (
          <OrbParticles color={`${ambientColor}38`} />
        )}

        {/* ── Header */}
        <div style={{
          position:"absolute",
          top:"max(44px,env(safe-area-inset-top,44px))",
          left:0, right:0,
          textAlign:"center",
          pointerEvents:"none",
          animation:"orbFadeUp 0.45s 0.10s both",
          zIndex:Z.hints,
        }}>
          <div style={{
            fontSize:18, fontWeight:900, color:T.ink, letterSpacing:-0.5,
          }}>
            Der HUI Orb<span style={{ color:T.teal }}>·</span>
          </div>
          <div style={{ fontSize:11.5, color:T.ink3, marginTop:3, letterSpacing:0.15 }}>
            Dein Zugang zu allem, was du erschaffen möchtest.
          </div>
        </div>

        {/* ── Orb Stage: Nodes + Center ── */}
        <div style={{
          position:"relative",
          width:stageW, height:stageH,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginTop: vh > 700 ? -50 : -30,
          flexShrink:0,
          // Stage selbst: kein pointer-events — Nodes haben es selbst
          pointerEvents:"none",
        }}>
          {/* Nodes */}
          {(NODES || []).filter(node => node && node.key).map((node, i) => {
            // Zentrale Rollenprüfung: canUseOrb(node.key) prüft Rolle aus Rollen-System
        // isTalent-Prop bleibt für backward-compat; canUseOrb ist die neue Wahrheit
        const locked = !node.forAll && !isTalent && !canUseOrb(node.key);
            const active = orb.activeNode?.key === node.key;
            const dimmed = orb.activeNode !== null && !active;
            const { x, y } = polar(node.angle, orbR);
            return (
              <OrbNode
                key={node.key}
                node={node}
                idx={i}
                active={active}
                dimmed={dimmed}
                locked={locked}
                isTransitioning={orb.isTransitioning}
                posLeft={x - NODE_SIZE / 2}
                posTop={y - NODE_SIZE / 2}
                onTap={orb.handleNodeTap}
              />
            );
          })}

          {/* Center Orb */}
          <OrbCenter
            size={100}
            activeColor={orb.activeNode?.color || null}
            onClick={orb.handleOrbTap}
          />
        </div>

        {/* ── Hint Bar (erscheint bei aktivem Node) */}
        {orb.activeNode && (
          <OrbHintBar
            node={orb.activeNode}
            onOpen={orb.handleHintOpen}
          />
        )}

        {/* ── Idle Prompt */}
        {!orb.activeNode && mounted && (
          <div style={{
            position:"absolute",
            bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 12px)",
            left:0, right:0, textAlign:"center",
            pointerEvents:"none",
            animation:"orbFadeUp 0.6s 0.9s both",
            zIndex:Z.hints,
          }}>
            <div style={{ fontSize:11, color:T.ink4, letterSpacing:0.4 }}>
              Tippe einen Bereich an
            </div>
          </div>
        )}

        {/* ── Close Button */}
        <button
          className="orb-tap"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position:"absolute",
            bottom:"max(28px,env(safe-area-inset-bottom,28px))",
            left:"50%", transform:"translateX(-50%)",
            width:44, height:44, borderRadius:"50%",
            background:"rgba(255,255,255,0.80)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            border:"1.5px solid rgba(0,0,0,0.07)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.ink3,
            boxShadow:"0 4px 12px rgba(0,0,0,0.06)",
            animation:"orbFadeUp 0.5s 0.5s both",
            zIndex:Z.hints,
            pointerEvents:"auto",
          }}
        >✕</button>

        {/* ── Mantra */}
        <div style={{
          position:"absolute",
          bottom:"max(7px,env(safe-area-inset-bottom,7px))",
          left:0, right:0, textAlign:"center",
          pointerEvents:"none",
          animation:"orbFadeUp 0.7s 0.7s both",
        }}>
          <div style={{ fontSize:10, color:T.ink4, letterSpacing:0.5 }}>
            ✦  Hier beginnt deine Wirkung  ✦
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SHEETS & MODALS — außerhalb des Overlays
          Eigene zIndex-Ebene, eigene Backdrop-Logik
      ════════════════════════════════════════════════════════ */}

      {/* Impact Detail */}
      {orb.impactOpen && (
        <OrbImpactDetail
          onAction={orb.triggerAction}
          onClose={() => orb.setImpactOpen(false)}
        />
      )}

      {/* Standard Detail Card */}
      {orb.detailNode && !orb.detailNode.isImpact && (
        <OrbDetailCard
          node={orb.detailNode}
          isTalent={isTalent}
          onAction={orb.triggerAction}
          onClose={() => orb.setDetailNode(null)}
        />
      )}
    </>
  );
}