// src/lib/appPerformance.js
// HUI App-Performance-System — FPS-Monitor + Request-Tracker
// Einmalig initialisiert von main.jsx

const SLOW_REQUEST_MS = 300;

// ── FPS-Monitor (via requestAnimationFrame) ──────────────────────────
let _fps = 60;
let _fpsFrameCount = 0;
let _fpsLastTs = 0;
let _fpsRafId = null;
let _fpsLowCount = 0;

function startFpsMonitor() {
  if (_fpsRafId) return;
  
  function frame(ts) {
    _fpsFrameCount++;
    if (_fpsLastTs) {
      const delta = ts - _fpsLastTs;
      // Alle 1 Sekunde FPS berechnen
      if (delta >= 1000) {
        _fps = Math.round((_fpsFrameCount / delta) * 1000);
        _fpsFrameCount = 0;
        _fpsLastTs = ts;

        // Bei dauerhaft niedrigen FPS warnen + globales Flag setzen
        if (_fps < 30) {
          _fpsLowCount++;
          if (_fpsLowCount >= 3) {
            window.__HUI_LOW_PERF = true;
            document.body.classList.add("hui-low-perf");
            if (import.meta.env.DEV) {
              console.warn(`[HUI PERF] ⚠️ Niedrige FPS: ${_fps} FPS — Animationen reduziert`);
            }
          }
        } else {
          _fpsLowCount = Math.max(0, _fpsLowCount - 1);
          if (_fpsLowCount === 0) {
            window.__HUI_LOW_PERF = false;
            document.body.classList.remove("hui-low-perf");
          }
        }
      }
    } else {
      _fpsLastTs = ts;
    }
    
    // FPS-Monitor nur laufen wenn Tab sichtbar
    if (document.visibilityState === "visible") {
      _fpsRafId = requestAnimationFrame(frame);
    } else {
      _fpsRafId = null;
    }
  }

  _fpsRafId = requestAnimationFrame(frame);
}

function stopFpsMonitor() {
  if (_fpsRafId) {
    cancelAnimationFrame(_fpsRafId);
    _fpsRafId = null;
  }
}

// ── Visibility-Change: FPS-Monitor steuern ───────────────────────────
function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    _fpsLastTs = 0;
    _fpsFrameCount = 0;
    startFpsMonitor();
  } else {
    stopFpsMonitor();
  }
}

// ── Öffentliche API ───────────────────────────────────────────────────
export function getCurrentFps() { return _fps; }
export function isLowPerf() { return !!window.__HUI_LOW_PERF; }

// ── Initialisierung (einmalig beim App-Start) ─────────────────────────
export function initAppPerformance() {
  // FPS-Monitor starten
  startFpsMonitor();
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Navigation Timing loggen (Kaltstart-Performance):
  if (window.performance && window.performance.timing) {
    window.addEventListener("load", () => {
      const t = window.performance.timing;
      const loadTime = t.loadEventEnd - t.navigationStart;
      const domReady = t.domContentLoadedEventEnd - t.navigationStart;
      if (import.meta.env.DEV || localStorage.getItem("hui_perf_debug") === "1") {
        console.info(`[HUI PERF] 🚀 Kaltstart: ${loadTime}ms (DOM: ${domReady}ms)`);
      }
    }, { once: true });
  }

  // LCP (Largest Contentful Paint) beobachten:
  if (typeof PerformanceObserver !== "undefined") {
    try {
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last && (import.meta.env.DEV || localStorage.getItem("hui_perf_debug") === "1")) {
          console.info(`[HUI PERF] 📸 LCP: ${Math.round(last.startTime)}ms`);
        }
      });
      obs.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (_) {}
  }

  // Globale Hilfsfunktionen für Entwickler:
  window.huiPerf = {
    ...window.huiPerf,
    fps: () => _fps,
    isLowPerf: () => window.__HUI_LOW_PERF,
    slowQueries: () => console.table(window.__HUI_SLOW_QUERIES || []),
  };
}
