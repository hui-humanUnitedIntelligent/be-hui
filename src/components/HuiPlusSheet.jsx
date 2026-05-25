// HuiPlusSheet.jsx — Phase 4G (OrbPortal Integration)
// Phase 4G: OrbPortal ersetzt das visuelle System.
//           OrbSystem (radial nodes) bleibt als Fallback für Member+.
//           Ghost-State-Fix und Failsafe-Logik bleiben vollständig erhalten.

import React, { useEffect, useRef, useState } from "react";
import { OrbPortal }              from "../orb/OrbPortal.jsx";
import OrbSystem                  from "../system/orb/OrbSystem.jsx";
import { cleanupOrbEnvironment }  from "../lib/cleanup/cleanupOrbEnvironment.js";
import { useUserRole }            from "../lib/roles/index.js";

const MOUNT_TIMEOUT = 3000;

// ─── Failsafe: wenn alles crasht ─────────────────────────────────────────────
function OrbFailsafe({ onClose }) {
  useEffect(() => {
    const t = setTimeout(() => {
      console.warn("[HUI ORB] failsafe auto-close");
      onClose?.();
    }, 150);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        9001,
        background:    "transparent",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Error Boundary für OrbSystem (radial, Member+) ──────────────────────────
class OrbSystemWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }
  componentDidMount() {
    this.props.onMounted?.();
  }
  componentDidCatch(error, info) {
    console.error("[HUI ORB] crash:", error?.message, info?.componentStack?.split("\n")?.[1]);
    this.setState({ crashed: true });
    this.props.onFail?.();
  }
  render() {
    if (this.state.crashed) return <OrbFailsafe onClose={this.props.onClose} />;
    return (
      <OrbSystem
        onAction={this.props.onSelect}
        onClose={this.props.onClose}
        isTalent={this.props.isTalent}
        isTrusted={this.props.isTrusted}
      />
    );
  }
}

// ─── Haupt-Export ─────────────────────────────────────────────────────────────
export default function HuiPlusSheet({
  onSelect,
  onClose,
  isTalent  = false,
  isTrusted = false,
  onMounted = null,
  visible   = false,
}) {
  const [hasFailed,   setHasFailed]   = useState(false);
  const [orbMounted,  setOrbMounted]  = useState(false);
  const timerRef = useRef(null);
  const { role } = useUserRole?.() ?? {};

  // Ghost-State-Guard: wenn nach MOUNT_TIMEOUT noch nicht gemountet → close
  useEffect(() => {
    if (!visible) return undefined;
    timerRef.current = setTimeout(() => {
      if (!orbMounted) {
        console.warn("[HUI ORB] mount-timeout — ghost-state-guard triggered");
        cleanupOrbEnvironment({ reason: "orb-mount-timeout" });
        onClose?.();
      }
    }, MOUNT_TIMEOUT);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible && orbMounted) setOrbMounted(false);
  }, [visible, orbMounted]);

  // Melden dass wir bereit sind (Home.jsx: confirmSurface)
  useEffect(() => {
    if (visible && !orbMounted) {
      setOrbMounted(true);
      clearTimeout(timerRef.current);
      console.log("[HUI ORB] Phase 4G — OrbPortal mounted, visible=true");
      onMounted?.();
    }
  }, [visible]); // eslint-disable-line

  if (hasFailed) return <OrbFailsafe onClose={onClose} />;

  // Phase 4G: OrbPortal als primäres visuelles System
  // OrbSystem (radial nodes) bleibt für den Fall dass OrbPortal deaktiviert wird
  return (
    <OrbPortal
      visible={visible}
      onSelect={(action) => {
        // action → vorhandene onSelect-Signatur bleibt kompatibel
        onSelect?.(action);
      }}
      onClose={() => {
        cleanupOrbEnvironment({ reason: "orb-portal-close" });
        onClose?.();
      }}
      isTalent={isTalent}
    />
  );
}
