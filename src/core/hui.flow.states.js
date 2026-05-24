// src/core/hui.flow.states.js — HUI FLOW STATE MACHINE v1
// ══════════════════════════════════════════════════════════════════
// PHASE 2B: Flow Consistency Engine
//
// ZWECK:
//   Definierte Zustände für alle Flows.
//   Actions können optionale State-Transitions triggern.
//   UI-Komponenten können auf ENTERING/RETURNING reagieren
//   und sanfte Übergänge (fade, slide) implementieren.
//
// DESIGN-PRINZIP:
//   - States sind OPTIONAL — kein Flow muss sie nutzen
//   - Bestehende Flows werden NICHT refactored
//   - Neue Komponenten KÖNNEN sie nutzen
//   - Kein React-State hier — reines Signal-Objekt
//
// EMOTIONAL COMPLETION:
//   RETURNING = der Moment des Zurückkehrens — sanft, nicht abrupt.
//   Komponenten können RETURNING nutzen für weiche Exit-Animationen.
// ══════════════════════════════════════════════════════════════════

// ─── Flow States ──────────────────────────────────────────────────
export var FLOW = Object.freeze({
  IDLE:      "idle",      // Kein aktiver Flow — ruhig
  ENTERING:  "entering",  // Flow öffnet sich — Eingang
  ACTIVE:    "active",    // Flow ist aktiv — offen
  RETURNING: "returning", // Flow kehrt zurück — sanfter Exit
  CLOSING:   "closing",   // Flow schließt — neutral
});

// ─── Transition-Timings ───────────────────────────────────────────
// Atmosphärische HUI-Timings — nicht zu schnell, nicht zu langsam.
// Kompatibel mit dem 400-1200ms Pacing des Design-Systems.
export var FLOW_TIMING = Object.freeze({
  ENTER_DURATION:   420,  // ms — Eingang (aus IDLE)
  RETURN_DURATION:  600,  // ms — Rückkehr (weicher als Exit)
  CLOSE_DURATION:   280,  // ms — neutrales Schließen
  ECHO_DURATION:    800,  // ms — Emotional Completion Echo
});

// ─── Emotional Completion Types ───────────────────────────────────
// Definiert welche Art von Abschluss-Feedback eine Action erzeugen kann.
// Kein Toast-Spam. Kein lautes Feedback. Nur ruhige Resonanz.

export var ECHO = Object.freeze({
  NONE:       "none",       // Kein Feedback — stille Action
  SOFT_GLOW:  "soft-glow",  // Sanfter Glow auf dem Target-Element
  PULSE:      "pulse",      // Kurzer Puls — bestätigt ohne zu feiern
  SLIDE_BACK: "slide-back", // Element gleitet sanft zurück (Profil nach Chat)
  WARMTH:     "warmth",     // Wärme-Effekt — für Follow/Resonanz
  CONFIRM:    "confirm",    // Ruhige Bestätigung — für Booking-Abschluss
});

// ─── Action → Echo Mapping ────────────────────────────────────────
// Welche Action erzeugt welches Emotional-Completion-Feedback?
// UI-Komponenten lesen dieses Mapping und rendern entsprechend.
//
// NICHT: laute Success-Banner
// SONDERN: subtile atmosphärische Signale

export var ACTION_ECHO = Object.freeze({
  // Soziale Aktionen — ruhig bestätigen
  FOLLOW_CREATOR:   ECHO.WARMTH,      // Folgen: kurze Wärme
  SEND_RESONANCE:   ECHO.SOFT_GLOW,   // Resonanz senden: sanfter Glow
  SHARE_MOMENT:     ECHO.PULSE,       // Teilen: kurzer Puls
  SEND_MESSAGE:     ECHO.NONE,        // Nachricht: Chat öffnet sich — eigenes Feedback

  // Navigation — keine Completion-Echos
  OPEN_PROFILE:     ECHO.NONE,
  OPEN_CHAT:        ECHO.NONE,
  CLOSE_CHAT:       ECHO.SLIDE_BACK,  // Chat schließt → weich zurück
  OPEN_EXPERIENCE:  ECHO.NONE,

  // Buchung — zeremonielle Bestätigung
  BOOK_EXPERIENCE:  ECHO.CONFIRM,     // "Raum reserviert" — ruhig
});

// ─── FlowSignal — leichtgewichtiges Signal-Objekt ─────────────────
// Kein React-State. Kein Re-render.
// Listener-basiert — ähnlich EventEmitter, aber minimal.
//
// USAGE:
//   const signal = createFlowSignal();
//   signal.on("stateChange", (state) => { ... });
//   signal.emit("stateChange", FLOW.RETURNING);
//
// Komponenten können sich registrieren und auf State-Changes reagieren.
// Ohne globalen State, ohne Prop-Drilling.

export function createFlowSignal() {
  var listeners = {};

  return {
    on: function(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
      // Gibt Cleanup-Funktion zurück (für useEffect)
      return function() {
        listeners[event] = (listeners[event] || []).filter(function(l) { return l !== fn; });
      };
    },

    emit: function(event, data) {
      (listeners[event] || []).forEach(function(fn) {
        try { fn(data); } catch(e) { /* silent — Signal-Fehler crashen nie */ }
      });
    },

    off: function(event, fn) {
      if (!fn) {
        listeners[event] = [];
      } else {
        listeners[event] = (listeners[event] || []).filter(function(l) { return l !== fn; });
      }
    },
  };
}

// ─── Singleton-Signal (global) ────────────────────────────────────
// Ein zentrales Signal-Objekt für die gesamte App.
// Kein Context nötig — direkt importieren.
export var flowSignal = createFlowSignal();
