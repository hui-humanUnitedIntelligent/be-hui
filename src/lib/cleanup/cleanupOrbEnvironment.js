// src/lib/cleanup/cleanupOrbEnvironment.js — HUI Orb Cleanup System v1
//
// Single function called on: complete, close, back, route change, unmount, error.
// Resets ALL environmental layers the Orb/Membership flow may have touched.
// RULE: idempotent — safe to call multiple times. RULE: sync where possible.

const ORB_BODY_CLASSES = ["hui-orb-open", "hui-flow-open", "hui-scroll-lock"];
const ORB_HTML_CLASSES = ["hui-orb-active"];

const BODY_STYLE_RESETS = {
  overflow:"", overflowY:"", position:"", top:"", left:"",
  right:"", pointerEvents:"", userSelect:"", touchAction:"",
};
const HTML_STYLE_RESETS = { overflow:"", overflowY:"", position:"" };

/**
 * Fully cleans up all Orb/Flow environmental effects.
 * @param {object} [opts]
 * @param {string} [opts.reason]
 * @param {number} [opts.afterMs]
 */
export function cleanupOrbEnvironment({ reason = "cleanup", afterMs = 0 } = {}) {
  const apply = () => {
    try {
      const body = document.body;
      const html = document.documentElement;
      if (!body) return;

      // 1. Remove body/html classes
      ORB_BODY_CLASSES.forEach(cls => body.classList.remove(cls));
      ORB_HTML_CLASSES.forEach(cls => html.classList.remove(cls));

      // 2. Reset body inline styles
      Object.entries(BODY_STYLE_RESETS).forEach(([k, v]) => {
        if (body.style[k] !== undefined) body.style[k] = v;
      });

      // 3. Reset html inline styles
      Object.entries(HTML_STYLE_RESETS).forEach(([k, v]) => {
        if (html.style[k] !== undefined) html.style[k] = v;
      });

      // 4. iOS scroll restore
      const savedScroll = parseInt(body.getAttribute("data-scroll-y") || "0", 10);
      if (savedScroll > 0) {
        body.removeAttribute("data-scroll-y");
        window.scrollTo(0, savedScroll);
      }

      // 5. Remove injected style tags
      document.querySelectorAll("[data-hui-orb-style]").forEach(el => el.remove());

      // 6. Re-enable root pointer events + clear any filter
      const root = document.getElementById("root") || document.getElementById("app");
      if (root) {
        root.style.pointerEvents = "";
        root.style.filter        = "";
        root.style.backdropFilter = "";
        root.style.WebkitBackdropFilter = "";
      }

      // 7. Release focus trap
      try {
        if (document.activeElement && document.activeElement !== body) body.focus();
      } catch (_) {}

      console.log("[HUI CLEANUP] orbEnvironment reset", { reason });
    } catch (err) {
      console.warn("[HUI CLEANUP] non-critical error:", err?.message);
    }
  };

  if (afterMs > 0) setTimeout(apply, afterMs);
  else apply();
}

/**
 * iOS-safe scroll lock. Release via cleanupOrbEnvironment().
 * @param {boolean} lock
 */
export function setScrollLock(lock) {
  try {
    const body = document.body;
    if (lock) {
      const y = window.scrollY || window.pageYOffset || 0;
      body.setAttribute("data-scroll-y", String(y));
      body.classList.add("hui-scroll-lock");
      body.style.overflow  = "hidden";
      body.style.position  = "fixed";
      body.style.top       = `-${y}px`;
      body.style.left      = "0";
      body.style.right     = "0";
    } else {
      cleanupOrbEnvironment({ reason: "scroll-lock-release" });
    }
  } catch (_) {}
}
