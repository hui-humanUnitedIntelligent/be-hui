// ══════════════════════════════════════════════════════════════════════════════
// useDesktopBreakpoint.js — Responsive Breakpoint Hook für Desktop
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Ermittelt den aktuellen Desktop-Breakpoint und stellt ihn als
//   `breakpoint` (String) und `isAtLeast` (Funktion) zur Verfügung.
//
// USAGE:
//   const { breakpoint, isAtLeast } = useDesktopBreakpoint();
//   if (isAtLeast('desktop')) { ... }
//   if (breakpoint === 'laptop') { ... }
//
// BREAKPOINTS:
//   mobile       < 768px    — Mobile App (nicht Desktop)
//   tablet       768–1023   — Tablet
//   laptop       1024–1279  — Laptop
//   desktop      1280–1535  — Standard Desktop
//   largeDesktop 1536–1919  — Large Desktop
//   ultrawide    ≥ 1920     — Ultrawide
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS } from '../tokens/desktopTokens.js';

const BREAKPOINT_ORDER = [
  'mobile', 'tablet', 'laptop', 'desktop', 'largeDesktop', 'ultrawide'
];

function getCurrentBreakpoint(width) {
  if (width >= BREAKPOINTS.ultrawide)    return 'ultrawide';
  if (width >= BREAKPOINTS.largeDesktop) return 'largeDesktop';
  if (width >= BREAKPOINTS.desktop)      return 'desktop';
  if (width >= BREAKPOINTS.laptop)       return 'laptop';
  if (width >= BREAKPOINTS.tablet)       return 'tablet';
  return 'mobile';
}

export function useDesktopBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getCurrentBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    let timer = null;

    function onResize() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setBreakpoint(getCurrentBreakpoint(window.innerWidth));
      }, 100); // Debounce 100ms
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const isAtLeast = useCallback((bp) => {
    const currentIdx = BREAKPOINT_ORDER.indexOf(breakpoint);
    const targetIdx  = BREAKPOINT_ORDER.indexOf(bp);
    return currentIdx >= targetIdx;
  }, [breakpoint]);

  const isBelow = useCallback((bp) => {
    const currentIdx = BREAKPOINT_ORDER.indexOf(breakpoint);
    const targetIdx  = BREAKPOINT_ORDER.indexOf(bp);
    return currentIdx < targetIdx;
  }, [breakpoint]);

  return { breakpoint, isAtLeast, isBelow };
}

export default useDesktopBreakpoint;
