/**
 * HUI React Hooks — Phase 22
 * Interaction Hooks für Tap-Feedback, Hover, Scroll-Entry.
 *
 * Usage: import { useTap, useHover, useScrollEntry } from "../design/hui.hooks.js";
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { TAP, CARD, DUR, EASE } from "./hui.interaction.js";

// ─────────────────────────────────────────────────────────────────
//  useTap — Tap-Feedback für beliebige Elemente
// ─────────────────────────────────────────────────────────────────
// variant: "light" | "standard" | "card" | "cta"
// Returns: { tapProps, style } — tapProps auf das Element, style als style-Prop
//
// Usage:
//   const { tapProps, tapStyle } = useTap("card");
//   <div {...tapProps} style={{ ...myStyle, ...tapStyle }}>

export function useTap(variant = "standard") {
  const [pressed, setPressed] = useState(false);
  const tokens = TAP[variant] || TAP.standard;

  const tapProps = {
    className:      "hui-tap",
    onPointerDown:  () => setPressed(true),
    onPointerUp:    () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    onPointerCancel:() => setPressed(false),
  };

  const tapStyle = pressed ? tokens.pressed : tokens.idle;

  return { tapProps, tapStyle, pressed };
}

// ─────────────────────────────────────────────────────────────────
//  useCardInteraction — Hover + Tap für Cards
// ─────────────────────────────────────────────────────────────────
// variant: "base" | "hero"
// Returns: { cardProps, cardStyle }

export function useCardInteraction(variant = "base") {
  const [pressed,  setPressed]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const tokens = CARD[variant] || CARD.base;

  const state  = pressed ? "pressed" : hovered ? "hover" : "idle";
  const style  = tokens[state] || tokens.idle;

  const cardProps = {
    className:      "hui-tap",
    onPointerDown:  () => setPressed(true),
    onPointerUp:    () => { setPressed(false); },
    onPointerLeave: () => { setPressed(false); setHovered(false); },
    onPointerCancel:() => { setPressed(false); setHovered(false); },
    onPointerEnter: () => setHovered(true),
  };

  return { cardProps, cardStyle: style, pressed, hovered, state };
}

// ─────────────────────────────────────────────────────────────────
//  useScrollEntry — Fade-Slide beim Erscheinen im Viewport
// ─────────────────────────────────────────────────────────────────
// delay: ms Verzögerung (für staggering)
// Returns: { ref, entryStyle } — ref auf das Element, entryStyle als style

export function useScrollEntry(delay = 0, threshold = 0.12) {
  const ref      = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const entryStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translateY(0)" : "translateY(10px)",
    transition: visible
      ? `opacity 420ms cubic-bezier(0.16,1,0.30,1) ${delay}ms, transform 420ms cubic-bezier(0.16,1,0.30,1) ${delay}ms`
      : "none",
  };

  return { ref, entryStyle, visible };
}

// ─────────────────────────────────────────────────────────────────
//  useOrb — Orb Node Tap-State
// ─────────────────────────────────────────────────────────────────

export function useOrbNode() {
  const [activeKey, setActiveKey] = useState(null);

  const getNodeStyle = useCallback((key) => {
    if (activeKey === key) {
      return {
        transform:  "scale(0.91) translateY(2px)",
        filter:     "brightness(0.90)",
        transition: `transform ${DUR.tap}ms ${EASE.outSoft}, filter ${DUR.tap}ms ${EASE.outSoft}`,
      };
    }
    return {
      transform:  "scale(1) translateY(0)",
      filter:     "brightness(1)",
      transition: `transform ${DUR.tapRelease}ms ${EASE.out}, filter ${DUR.tapRelease}ms ${EASE.out}`,
    };
  }, [activeKey]);

  const handlePress   = useCallback((key) => setActiveKey(key), []);
  const handleRelease = useCallback(() => setActiveKey(null),  []);

  return { getNodeStyle, handlePress, handleRelease, activeKey };
}
