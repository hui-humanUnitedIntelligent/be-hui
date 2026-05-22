// src/lib/world/safariPaintRecovery.js — Phase 16.6
// Safe Imperative Repaint — ZERO display mutations, ZERO crashes
//
// DESIGN RULES:
//   1. NEVER mutate display — React owns the DOM tree.
//      display:none on React-managed nodes detaches event listeners,
//      corrupts React's fiber tree, and causes the ErrorBoundary crash.
//   2. EVERY DOM access guarded with isConnected + null check.
//   3. ALL rAF handles tracked — cancelled on cleanup.
//   4. NO throw — only console.warn on failure.
//   5. safeRepaint() uses translateZ(0) nudge instead of display toggle.

// ─── Safari detection ─────────────────────────────────────────────────────
const isSafariLike = () =>
  typeof navigator !== "undefined" &&
  /Safari/i.test(navigator.userAgent) &&
  !/Chrome|Chromium|CriOS|FxiOS/i.test(navigator.userAgent);

// ─── Safe DOM guard ───────────────────────────────────────────────────────
function isLiveNode(node) {
  return !!(node && node.isConnected && node.style);
}

// ─── Safe reflow ──────────────────────────────────────────────────────────
// offsetHeight read forces layout flush. Only call on connected nodes.
function safeReflow(node, label) {
  if (!isLiveNode(node)) return;
  try {
    // eslint-disable-next-line no-unused-expressions
    void node.offsetHeight;
  } catch (e) {
    console.warn(`[PAINT] reflow failed — ${label}:`, e.message);
  }
}

// ─── safeRepaint ─────────────────────────────────────────────────────────
// Phase 16.6 canonical implementation.
// Uses translateZ(0) nudge to force compositor refresh — ZERO display toggles.
//
// Returns a cancel() function — call on unmount / tab-switch.
//
// @param {HTMLElement|null} node
// @param {string}           label  — for logging
// @returns {{ cancel: () => void }}
export function safeRepaint(node, label = "node") {
  if (!isLiveNode(node)) {
    console.warn(`[PAINT] safeRepaint skipped — ${label} not connected`);
    return { cancel: () => {} };
  }

  let raf1 = null, raf2 = null;
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    if (raf1) { cancelAnimationFrame(raf1); raf1 = null; }
    if (raf2) { cancelAnimationFrame(raf2); raf2 = null; }
  };

  try {
    // Phase 1: Set willChange to hint compositor — then reflow
    node.style.willChange = "transform";
    safeReflow(node, label);

    raf1 = requestAnimationFrame(() => {
      if (cancelled || !isLiveNode(node)) return;

      try {
        // Phase 2: Add translateZ(0) — forces new compositor layer
        const cur = node.style.transform || "";
        const hasZ = cur.includes("translateZ(0)");
        if (!hasZ) {
          node.style.transform = cur ? `${cur} translateZ(0)` : "translateZ(0)";
        }
        // Force reflow so the layer is actually created
        safeReflow(node, label);
        console.log(`[PAINT] tab restored — ${label}`);

        raf2 = requestAnimationFrame(() => {
          if (cancelled || !isLiveNode(node)) return;

          try {
            // Phase 3: Remove translateZ nudge — layer update committed
            const t = node.style.transform || "";
            node.style.transform = t
              .replace(" translateZ(0)", "")
              .replace("translateZ(0) ", "")
              .replace("translateZ(0)",  "")
              .trim();

            // If transform is now empty / "none", clear it
            if (!node.style.transform || node.style.transform === "none") {
              node.style.transform = "";
            }

            // Release GPU hint
            node.style.willChange = "auto";
            console.log(`[PAINT] reflow forced — ${label} (double-pass complete)`);
          } catch (e) {
            console.warn(`[PAINT] phase3 failed — ${label}:`, e.message);
          }
        });
      } catch (e) {
        console.warn(`[PAINT] phase2 failed — ${label}:`, e.message);
      }
    });
  } catch (e) {
    console.warn(`[PAINT] safeRepaint init failed — ${label}:`, e.message);
    return { cancel };
  }

  return { cancel };
}

// ─── stripGpuHints ────────────────────────────────────────────────────────
// Strips willChange + contain from a container after surface close.
export function stripGpuHints(node, label = "container") {
  if (!isLiveNode(node)) return { cancel: () => {} };

  try {
    node.style.willChange = "auto";
    node.style.contain    = "";
    safeReflow(node, label);
    console.log(`[PAINT] contain removed — ${label}`);
  } catch (e) {
    console.warn(`[PAINT] stripGpuHints failed — ${label}:`, e.message);
  }

  return { cancel: () => {} };
}

// ─── forceTabRepaint ──────────────────────────────────────────────────────
// Alias for safeRepaint — backward compat with Home.jsx
export function forceTabRepaint(node, label) {
  return safeRepaint(node, label);
}

// ─── PaintRecoveryManager ─────────────────────────────────────────────────
// Tracks active rAF handles. Call cleanup() on unmount.
export class PaintRecoveryManager {
  constructor() {
    this._handles = new Set();
  }

  repaint(node, label) {
    const handle = safeRepaint(node, label);
    this._handles.add(handle);
    return handle;
  }

  stripHints(node, label) {
    return stripGpuHints(node, label);
  }

  cleanup() {
    console.log(`[PAINT] recovery manager cleanup — ${this._handles.size} handles`);
    for (const h of this._handles) {
      try { h.cancel(); } catch (_) {}
    }
    this._handles.clear();
  }
}
