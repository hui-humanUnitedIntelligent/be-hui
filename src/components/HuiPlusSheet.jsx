// HuiPlusSheet.jsx — WRAPPER v8 (Phase 15.3 Ghost-State-Fix)
// Phase 15.3: Blur/Overlay NEVER active without mounted OrbContent.
// Failsafe close on all failure paths — never leaves world frozen.

import React, { useEffect, useRef, useState } from "react";
import OrbSystem from "../system/orb/OrbSystem.jsx";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";

const MOUNT_TIMEOUT = 3000;

function OrbFailsafe({ onClose }) {
  useEffect(() => {
    const t = setTimeout(() => {
      console.warn("[HUI ORB] failsafe auto-close");
      onClose?.();
    }, 150);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div aria-hidden="true"
      style={{ position:"fixed", inset:0, zIndex:9001, background:"transparent", pointerEvents:"none" }}
    />
  );
}

export default function HuiPlusSheet({ onSelect, onClose, isTalent = false, isTrusted = false, onMounted = null }) {
  const [hasFailed, setHasFailed] = useState(false);
  const [orbMounted, setOrbMounted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!orbMounted) {
        console.warn("[HUI ORB] mount-timeout — ghost-state-guard triggered");
        cleanupOrbEnvironment({ reason: "orb-mount-timeout" });
        onClose?.();
      }
    }, MOUNT_TIMEOUT);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hasFailed) return <OrbFailsafe onClose={onClose} />;

  return (
    <OrbSystemWrapper
      onSelect={onSelect}
      onClose={onClose}
      isTalent={isTalent ?? false}
      isTrusted={isTrusted ?? false}
      onMounted={() => {
        setOrbMounted(true);
        clearTimeout(timerRef.current);
        console.log("[HUI ORB] contentMounted=true overlayActive=true");
        // Phase 16.2: bubble to parent Home.jsx → confirmSurface("orb")
        onMounted?.();
      }}
      onFail={() => {
        setHasFailed(true);
        cleanupOrbEnvironment({ reason: "orb-render-failure" });
      }}
    />
  );
}

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
