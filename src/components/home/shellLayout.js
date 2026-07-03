/**
 * AppShell layout tokens — single source of truth for main-tab page rhythm.
 * Used by Feed, Discover, Impact, and Profil inside Home.jsx scroll container.
 *
 * HomeHeader owns safe-area-top; HUIBottomNavigation owns bottom clearance.
 * Tab pages must NOT add their own scroll containers, safe-area insets, or nav padding.
 */

export const SHELL_LAYOUT = Object.freeze({
  /** Page background — matches Home shell */
  BG: "#F9F7F4",

  /** Horizontal content inset — identical across all four main tabs */
  CONTENT_PX: 16,

  /** Space between HomeHeader bottom edge and first page title row */
  PAGE_TITLE_TOP_PX: 12,

  /** Space below page title block before first content section */
  PAGE_TITLE_BOTTOM_PX: 8,
});

/** CSS padding for the standard page-title block (Discover SearchBar rhythm). */
export const SHELL_PAGE_TITLE_PAD = `${SHELL_LAYOUT.PAGE_TITLE_TOP_PX}px ${SHELL_LAYOUT.CONTENT_PX}px ${SHELL_LAYOUT.PAGE_TITLE_BOTTOM_PX}px`;

/** Horizontal padding shorthand for section content */
export const SHELL_CONTENT_PAD_X = `${SHELL_LAYOUT.CONTENT_PX}px`;
