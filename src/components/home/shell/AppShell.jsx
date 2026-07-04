/**
 * AppShell — Zentrale Layout-Architektur für alle fünf Hauptbereiche
 *
 * Bereitgestellt (einmalig implementiert):
 *   • AppShell Root (100dvh, Flex-Säule, Seitenhintergrund)
 *   • Safe Area (Top/Bottom via appShellLayout)
 *   • Scroll-Content-Bereich
 *   • Bottom Navigation Slot (HUIBottomNavigation)
 *   • Overlay-Layer (Mein HUI, Profil — über Header+Content, unter Nav)
 *   • Tab-Panel Wrapper (Keep-Alive)
 *   • Standard-Padding für Overlay-Inhalte
 *
 * Seiten rendern ausschließlich ihren Content — kein eigenes
 * Fullscreen-Layout, keine duplizierte Safe-Area-Logik.
 */
import React from "react";
import { IX } from "../../../design/hui.interaction.js";
import { SAFE_MODE } from "../../../config/safeMode.js";
import {
  APP_SHELL_PAGE_BG,
  APP_SHELL_ROOT_STYLE,
  APP_SHELL_SCROLL_STYLE,
  overlayContentStyle,
} from "./appShellLayout.js";

/* ── Global Styles (ehemals Home.jsx) ─────────────────────────── */
const SAFE_MOTION_CSS = SAFE_MODE.motion ? "" : `
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
`;

const GLOBAL_CSS = IX.CSS + `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  html, body { margin: 0; padding: 0; background: ${APP_SHELL_PAGE_BG}; }
  #root { width: 100%; max-width: 100%; overflow-x: hidden; background: ${APP_SHELL_PAGE_BG}; }
  button, [role="button"] { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
`;

/* ── Cinematic Transition (Mein HUI) ─────────────────────────── */
const CINEMATIC_EASE_DEFAULT = "ease-in-out";
const CLOSE_CONTENT_MS = 180;
const CLOSE_SCREEN_MS = 220;

/* ══════════════════════════════════════════════════════════════
   AppShell — Root
   ══════════════════════════════════════════════════════════════ */
function AppShellRoot({ children, style, ...rest }) {
  return (
    <div
      data-hui-app-shell=""
      style={{ ...APP_SHELL_ROOT_STYLE, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── AppShell.GlobalStyles ────────────────────────────────────── */
function AppShellGlobalStyles() {
  return <style>{GLOBAL_CSS + SAFE_MOTION_CSS}</style>;
}

/* ── AppShell.Header ──────────────────────────────────────────── */
function AppShellHeader({ children }) {
  return <>{children}</>;
}

/* ── AppShell.DimOverlay — World Surface Dim ──────────────────── */
function AppShellDimOverlay({ style = {} }) {
  return (
    <div
      data-hui-app-shell-dim=""
      style={style}
      aria-hidden="true"
    />
  );
}

/* ── AppShell.Content — Scroll-Bereich für Tab-Panels ─────────── */
function AppShellContent({ children, scrollRef, style, className = "hui-scroll" }) {
  return (
    <div
      className={className}
      data-hui-app-shell-content=""
      ref={scrollRef}
      style={{ ...APP_SHELL_SCROLL_STYLE, ...style }}
    >
      {children}
    </div>
  );
}

/* ── AppShell.TabPanel — Keep-Alive Tab Wrapper ───────────────── */
const AppShellTabPanel = React.forwardRef(function AppShellTabPanel(
  { children, style },
  ref,
) {
  return (
    <div ref={ref} data-hui-app-shell-tab="" style={style}>
      {children}
    </div>
  );
});

/* ── AppShell.BottomNav — Bottom Navigation Slot ──────────────── */
function AppShellBottomNav({ children }) {
  return (
    <div data-hui-app-shell-bottom="" style={{ flexShrink: 0 }}>
      {children}
    </div>
  );
}

/* ── AppShell.Overlay — Fullscreen-Overlay (Mein HUI, Profil) ──
   Deckt Header + Content ab, Bottom Navigation bleibt sichtbar
   (Nav z-index > Overlay z-index). */
function AppShellOverlay({
  visible = true,
  zIndex = 9000,
  scrollRef,
  children,
  background = "transparent",
  overlayVariant = "default", // "default" | "profile" | "loading"
  // Cinematic props (Mein HUI Soft Transition)
  cinematic = false,
  closing = false,
  entered = true,
  cinematicEase = CINEMATIC_EASE_DEFAULT,
  contentGroupStyle = null,
  contentStyle,
  contentClassName,
}) {
  if (!visible) return null;

  const screenStyle = cinematic
    ? {
        position: "fixed",
        inset: 0,
        background,
        zIndex,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        opacity: closing ? 0 : (entered ? 1 : 0),
        transform: closing
          ? "translateY(10px)"
          : (entered ? "translateY(0)" : "translateY(10px)"),
        transition: closing
          ? `opacity ${CLOSE_SCREEN_MS}ms ${cinematicEase} ${CLOSE_CONTENT_MS}ms, transform ${CLOSE_SCREEN_MS}ms ${cinematicEase} ${CLOSE_CONTENT_MS}ms`
          : `opacity 300ms ${cinematicEase}, transform 300ms ${cinematicEase}`,
      }
    : {
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        flexDirection: "column",
        background: background === "transparent" ? APP_SHELL_PAGE_BG : background,
        overflow: "hidden",
      };

  const innerPadding = {
    ...overlayContentStyle(overlayVariant === "profile" ? "profile" : "default"),
    ...contentStyle,
    ...(contentGroupStyle || {}),
  };

  if (cinematic) {
    return (
      <div
        ref={scrollRef}
        data-hui-app-shell-overlay=""
        data-hui-app-shell-overlay-variant="cinematic"
        style={screenStyle}
      >
        <div style={innerPadding}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      data-hui-app-shell-overlay=""
      style={screenStyle}
    >
      <div
        ref={scrollRef}
        data-hui-app-shell-overlay-scroll=""
        className={contentClassName}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          ...innerPadding,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Compound Export ──────────────────────────────────────────── */
const AppShell = Object.assign(AppShellRoot, {
  GlobalStyles: AppShellGlobalStyles,
  Header: AppShellHeader,
  DimOverlay: AppShellDimOverlay,
  Content: AppShellContent,
  TabPanel: AppShellTabPanel,
  BottomNav: AppShellBottomNav,
  Overlay: AppShellOverlay,
});

export default AppShell;

/* Re-export layout tokens for consumers that need clearance values */
export {
  APP_SHELL_PAGE_BG,
  CONTENT_NAV_CLEARANCE_CSS,
  OVERLAY_NAV_CLEARANCE_CSS,
  FULL_NAV_CLEARANCE_CSS,
  OVERLAY_SAFE_TOP_CSS,
  PROFILE_SAFE_TOP_CSS,
  CONTENT_PADDING_X,
  overlayContentStyle,
} from "./appShellLayout.js";
