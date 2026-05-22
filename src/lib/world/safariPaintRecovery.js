// src/lib/world/safariPaintRecovery.js — Phase 16.5
// Safari GPU-Layer Paint Recovery
//
// PROBLEM: After GPU-composited transitions (transform/opacity/backdrop-filter),
// Safari on iPad caches the compositing layer and refuses to repaint.
// Symptoms: White tab, invisible content, correct DOM state.
//
// SOLUTION: forceTabRepaint() uses a double-rAF + display-none flicker
// (imperatively, invisible to user) to invalidate Safari's compositor cache.

// ─── isSafari detection ────────────────────────────────────────────────────
const isSafariLike = () =>
  typeof navigator !== "undefined" &&
  /Safari/i.test(navigator.userAgent) &&
  !/Chrome|Chromium|CriOS|FxiOS/i.test(navigator.userAgent);

// ─── forceReflow ───────────────────────────────────────────────────────────
// Reading offsetHeight forces the browser to flush pending layout.
function forceReflow(el) {
  // eslint-disable-next-line no-unused-expressions
  void el.offsetHeight;
}

// ─── forceTabRepaint ───────────────────────────────────────────────────────
// Imperatively forces a Safari paint+composite refresh on a DOM element.
//
// TECHNIQUE (3-phase):
//   Phase 1: strip GPU hints (will-change, transform:scale, contain)
//   Phase 2: display-none / reflow / display-restore (Safari compositor reset)
//   Phase 3: requestAnimationFrame double-pass to let the browser repaint
//
// @param {HTMLElement|null} el    — the tab container element
// @param {string}           tabId — for logging
export function forceTabRepaint(el, tabId = "unknown") {
  if (!el) return;

  const safari = isSafariLike();
  console.log(`[PAINT] tab restored — ${tabId} (safari=${safari})`);

  // Phase 1: strip persistent GPU hints synchronously
  const prev = {
    willChange:  el.style.willChange,
    transform:   el.style.transform,
    contain:     el.style.contain,
  };
  el.style.willChange = "auto";
  el.style.contain    = "";

  // If element still carries a scale transform from surface animation,
  // reset it so Safari doesn't use the scaled compositor snapshot.
  if (el.style.transform && el.style.transform !== "none" && el.style.transform !== "") {
    el.style.transform = "none";
    console.log(`[PAINT] transform reset — ${tabId}`);
  }

  forceReflow(el);
  console.log(`[PAINT] reflow forced — ${tabId}`);

  if (safari) {
    // Phase 2: display-none flicker — Safari compositor cache invalidation.
    // Done inside rAF so it's never painted to screen as a blank frame.
    requestAnimationFrame(() => {
      el.style.display = "none";
      forceReflow(el);                         // flush display:none
      el.style.display = "";                   // restore (inherits from CSS)
      forceReflow(el);                         // flush restore
      console.log(`[PAINT] contain removed — ${tabId}`);

      // Phase 3: second rAF — browser now has a clean repaint ticket.
      requestAnimationFrame(() => {
        // Final will-change cleanup after animation settles.
        el.style.willChange = "auto";
        console.log(`[PAINT] reflow forced — ${tabId} (double-pass complete)`);
      });
    });
  } else {
    // Non-Safari: single rAF + will-change cleanup is sufficient.
    requestAnimationFrame(() => {
      el.style.willChange = "auto";
    });
  }
}

// ─── stripGpuHints ────────────────────────────────────────────────────────
// Strip will-change and contain from a scroll container after surface close.
// Call on the scroll container ref after closeSurface().
export function stripGpuHints(el, label = "container") {
  if (!el) return;
  el.style.willChange = "auto";
  el.style.contain    = "";
  forceReflow(el);
  console.log(`[PAINT] contain removed — ${label}`);
}
