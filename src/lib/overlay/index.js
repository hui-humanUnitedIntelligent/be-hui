// src/lib/overlay/index.js
// HUI — Overlay Governance — Phase 4E.2
// ═══════════════════════════════════════════════════════════════
//
// PRINZIP: Eine einzige Wahrheit für alle Overlays.
// Kein unkontrolliertes Stacking. Keine z-Index-Kriege.
// Jedes Overlay kennt seinen Platz.
//
// ── Z-INDEX SCHEMA (kanonisch) ────────────────────────────────
//
//   10  — BottomNav, AppHeader (immer sichtbar)
//   50  — Sticky Cards, Tooltips
//  100  — Floating UI (HUI-Orb-Backdrop)
//  200  — Erste Overlay-Ebene (Profil, Werk, Wirker)
//  300  — Zweite Ebene (Chat, Notifs)
//  400  — Booking Flow, Create Flow
//  500  — Story Viewer, Full-Screen
//  600  — Critical Overlays (Membership, Onboarding)
//  900  — Debug/Admin (nie in Production)
// 1000  — Toast/Feedback (immer oberhalb allem)
//
// VERBOTEN: z-index > 1000 (außer Toast)
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
export const Z = {
  base:        10,   // BottomNav, AppHeader
  sticky:      50,   // Floating hints, Tooltips
  orbBackdrop: 100,  // Orb-Backdrop
  overlay1:    200,  // Profil, Werk, Wirker Detail
  overlay2:    300,  // Chat, Notifications
  flow:        400,  // Booking, Create Flow
  fullscreen:  500,  // Story Viewer, Maps
  critical:    600,  // Membership, Onboarding, Auth
  toast:       1000, // Feedback — IMMER ganz oben
};

// ── Standard Overlay Timings ──────────────────────────────────
export const OVERLAY_TIMING = {
  openDuration:  240,  // ms
  closeDuration: 200,  // ms
  backdropFade:  160,  // ms
};

// ── Standard Overlay CSS (position:fixed, inset:0) ────────────
export function overlayBaseStyle(zIndex = Z.overlay1) {
  return {
    position:  'fixed',
    inset:     0,
    zIndex,
    // Safari-safe
    WebkitOverflowScrolling: 'touch',
  };
}

// ── Animated Overlay Styles ───────────────────────────────────
// Slide-up (Bottom Sheet)
export function slideUpStyle(visible, zIndex = Z.overlay1) {
  return {
    ...overlayBaseStyle(zIndex),
    transform:  visible ? 'translateY(0)'    : 'translateY(100%)',
    opacity:    visible ? 1                  : 0,
    transition: `transform ${OVERLAY_TIMING.openDuration}ms cubic-bezier(0.32,0.72,0,1), `
              + `opacity ${OVERLAY_TIMING.backdropFade}ms ease`,
    willChange: 'transform, opacity',
    pointerEvents: visible ? 'auto' : 'none',
  };
}

// Fade (Modal/Dialog)
export function fadeStyle(visible, zIndex = Z.overlay1) {
  return {
    ...overlayBaseStyle(zIndex),
    opacity:    visible ? 1 : 0,
    transition: `opacity ${OVERLAY_TIMING.openDuration}ms ease`,
    willChange: 'opacity',
    pointerEvents: visible ? 'auto' : 'none',
  };
}

// ── Backdrop Style ────────────────────────────────────────────
export function backdropStyle(visible, zIndex) {
  return {
    position:   'fixed',
    inset:      0,
    zIndex:     (zIndex ?? Z.overlay1) - 1,
    background: 'rgba(0,0,0,0.32)',
    backdropFilter: 'blur(6px) saturate(0.9)',
    WebkitBackdropFilter: 'blur(6px) saturate(0.9)',
    opacity:    visible ? 1 : 0,
    transition: `opacity ${OVERLAY_TIMING.backdropFade}ms ease`,
    pointerEvents: visible ? 'auto' : 'none',
  };
}

// ── useOverlay Hook ───────────────────────────────────────────
// Standardisierter Overlay-State mit ESC + Scroll-Lock.
//
// Usage:
//   const overlay = useOverlay()
//   overlay.open()
//   overlay.close()
//   <div style={slideUpStyle(overlay.visible, Z.overlay1)}>

export function useOverlay({
  defaultOpen   = false,
  onOpen        = null,
  onClose       = null,
  lockScroll    = true,
  closeOnEscape = true,
} = {}) {
  const [visible, setVisible] = useState(defaultOpen);
  const prevFocusRef = useRef(null);

  const open = useCallback(() => {
    prevFocusRef.current = document.activeElement;
    setVisible(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setVisible(false);
    onClose?.();
    // Fokus zurück zum auslösenden Element
    setTimeout(() => prevFocusRef.current?.focus?.(), 100);
  }, [onClose]);

  const toggle = useCallback(() => {
    setVisible(v => {
      if (!v) { onOpen?.(); return true; }
      else    { onClose?.(); return false; }
    });
  }, [onOpen, onClose]);

  // ESC-Handler
  useEffect(() => {
    if (!visible || !closeOnEscape) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, closeOnEscape, close]);

  // Scroll-Lock — verhindert background scroll
  useEffect(() => {
    if (!lockScroll) return;
    const prev = document.body.style.overflow;
    if (visible) {
      document.body.style.overflow = 'hidden';
      // iOS Safari fix: auch position relative verhindern
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, [visible, lockScroll]);

  return { visible, open, close, toggle, isOpen: visible };
}

// ── useOverlayStack ───────────────────────────────────────────
// Verwaltet einen Stack von Overlays — nur eines aktiv.
// Schließt automatisch wenn ein anderes geöffnet wird.
//
// Usage:
//   const stack = useOverlayStack()
//   stack.open('chat')
//   stack.open('booking')  // → chat wird geschlossen
//   stack.close()
//   stack.active           // → 'booking'
export function useOverlayStack() {
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);

  const open = useCallback((name, data = null) => {
    setActive({ name, data });
    setHistory(h => [...h, { name, data }]);
  }, []);

  const close = useCallback(() => {
    setActive(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    setHistory(h => {
      const prev = h.slice(0, -1);
      setActive(prev.length > 0 ? prev[prev.length - 1] : null);
      return prev;
    });
  }, []);

  const isOpen = useCallback((name) => active?.name === name, [active]);

  return {
    active:    active?.name ?? null,
    activeData: active?.data ?? null,
    history,
    open,
    close,
    goBack,
    isOpen,
    hasHistory: history.length > 1,
  };
}

// ── scrollLock / scrollUnlock (standalone) ───────────────────
let lockCount = 0;
export function scrollLock() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}
export function scrollUnlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}