// src/components/onboarding/OnboardingTutorial.jsx
// HUI Onboarding-Tutorial — Basis (7 Schritte) + Erweitert (6 Schritte, echte Profil-Kacheln)
// Systemweite Design-Regeln: Fuchs fest unverzerrt, kompakter Weiter-Button,
// Spotlight nie verdeckt. Keine bestehenden UI-Elemente werden veraendert.
// 2026-08-11: Button halbiert + in Fuchs-Container integriert (nie abgedeckt).
//             Basis-User: Advanced-Steps vorgefiltert (kein Auto-Skip-Flicker).
import React, { useState, useLayoutEffect, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

// ══════════════════════════════════════════════════════════════
// DESIGN-KONSTANTEN — systemweit für ALLE Tutorials identisch
// ══════════════════════════════════════════════════════════════
const FOX_SIZE        = 52;     // Feste Fuchs-Größe — unverzerrt auf allen Geräten
const FOX_MARGIN      = 20;     // Mindestabstand Fuchs zu Bildschirmrand
const FOX_BUBBLE_GAP  = 10;     // Abstand Sprechblase ↔ Fuchs
const BTN_WIDTH       = 66;     // Halbierte Weiter-Button-Breite (war 132)
const BTN_HEIGHT      = 30;     // Halbierte Button-Höhe (war 44)
const BUBBLE_MAX_W    = 260;    // Max Breite der Sprechblase
const SPOT_PAD        = 10;     // Spotlight Innenabstand
const OVERLAY_ALPHA   = 0.6;    // Overlay-Transparenz (leicht grau)

const STORAGE_KEY = "hui_onboarding_completed_v1";
const ADVANCED_STORAGE_KEY = "hui_onboarding_advanced_v1";

const STEPS = [
  { selector: 'button[aria-label="Home"]',           text: "Hier siehst du alle Beitr\u00e4ge chronologisch \u2013 dein pers\u00f6nlicher Home-Feed.", placement: "top" },
  { selector: 'button[aria-label="Entdecken"]',      text: "Hier findest du alles \u00fcber HUI: Menschen, Werke, Erlebnisse und neue Ideen.",    placement: "top" },
  { selector: 'button[aria-label="Mein HUI"]',       text: "Hier entsteht Neues. Der Orb ist dein Zugang, um selbst etwas zu erschaffen.",    placement: "top" },
  { selector: 'button[aria-label="Impact"]',         text: "Hier findest du alle Projekte, die wir gemeinsam unterst\u00fctzen. Erstelle doch selbst eins!", placement: "top" },
  { selector: 'button[aria-label="Profil"]',          text: "Hier kannst du dein eigenes Profil gestalten und personalisieren.",                 placement: "top" },
  { selector: 'button[aria-label="Nachrichten"]',    text: "Hier entstehen Verbindungen. Schreibe Menschen direkt und bleibe in Kontakt.",     placement: "bottom" },
  { selector: 'button[aria-label="Resonanzzentrum"]', text: "Hier bekommst du alle wichtigen Neuigkeiten \u2013 Kommentare, Buchungen, K\u00e4ufe und mehr.", placement: "bottom" },
];

// ── Erweitertes Tutorial (2026-08-11, TUTORIAL-PROFIL-SWITCH) ──────────
// Zielt auf die ECHTEN Kacheln im "Mein Bereich"-Menü des eigenen Profils.
// Werke/Talente/Erlebnisse existieren nur für Talent-User — diese Schritte
// werden beim Start des erweiterten Tutorials vorgefiltert (siehe
// startAdvancedTutorial), so dass Basis-User nur die verfügbaren Kacheln
// sehen, ohne Auto-Skip-Flicker.
const ADVANCED_STEPS = [
  { selector: 'button[aria-label="Meine Werke"]',        text: "Hier findest du alles, was du erschaffen hast. Werke zeigen deine F\u00e4higkeiten, deine Kreativit\u00e4t und deine Wirkung.", placement: "bottom", label: "Meine Werke" },
  { selector: 'button[aria-label="Talent-Angebote"]',    text: "Hier kannst du deine Talente anbieten. Menschen k\u00f6nnen dich buchen, unterst\u00fctzen oder mit dir zusammenarbeiten.", placement: "bottom", label: "Talent-Angebote" },
  { selector: 'button[aria-label="Erlebnisse & Projekte"]', text: "Hier entstehen besondere Momente und echte Herzensprojekte. Du kannst eigene Projekte starten oder an bestehenden teilnehmen.", placement: "bottom", label: "Erlebnisse & Projekte" },
  { selector: 'button[aria-label="Meine Momente"]',      text: "Momente zeigen Augenblicke aus deinem Alltag. Sie verbinden Menschen und machen HUI lebendig.", placement: "bottom", label: "Meine Momente" },
  { selector: 'button[aria-label="Impact & Stimmen"]',   text: "Hier siehst du deine Impact-Stimmen und alle Projekte, die du unterst\u00fctzt. Jede Stimme st\u00e4rkt den Impact-Pool.", placement: "bottom", label: "Impact & Stimmen" },
  { selector: 'button[aria-label="K\u00e4ufe/Verk\u00e4ufe"]', text: "Hier findest du deine K\u00e4ufe und Verk\u00e4ufe. Alles ist sicher \u00fcber Stripe abgewickelt und transparent dokumentiert.", placement: "bottom", label: "K\u00e4ufe/Verk\u00e4ufe" },
];

// Selektoren, deren Vorhandensein signalisiert "Profil ist bereits gemountet"
const ADVANCED_READY_SELECTORS = [
  'button[aria-label="Meine Momente"]',
  'button[aria-label="Meine Werke"]',
];

// ══════════════════════════════════════════════════════════════
// Fuchs-Bot SVG — feste unverzerrte Gr\u00f6ße, freundlich rund
// ══════════════════════════════════════════════════════════════
function FoxBot({ size = FOX_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true"
         style={{ display: "block", flexShrink: 0 }}>
      <path d="M56 52 Q72 44 68 32 Q62 38 58 44" fill="#F4714F" stroke="#E55A38" strokeWidth="0.5"/>
      <path d="M64 36 Q70 33 67 28" stroke="#FFF5E6" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="40" cy="56" rx="18" ry="16" fill="#F4714F"/>
      <ellipse cx="40" cy="60" rx="12" ry="8" fill="#FFF5E6" opacity="0.9"/>
      <circle cx="40" cy="34" r="21" fill="#F4714F"/>
      <path d="M22 22 L17 7 L31 17 Z" fill="#F4714F"/>
      <path d="M58 22 L63 7 L49 17 Z" fill="#F4714F"/>
      <path d="M23 20 L19 12 L28 18 Z" fill="#FFD4B8"/>
      <path d="M57 20 L61 12 L52 18 Z" fill="#FFD4B8"/>
      <ellipse cx="40" cy="41" rx="13" ry="9" fill="#FFF5E6"/>
      <circle cx="32" cy="34" r="3.2" fill="#1A1A18"/>
      <circle cx="48" cy="34" r="3.2" fill="#1A1A18"/>
      <circle cx="33.2" cy="33" r="1.1" fill="white"/>
      <circle cx="49.2" cy="33" r="1.1" fill="white"/>
      <ellipse cx="40" cy="40" rx="2.5" ry="2" fill="#1A1A18"/>
      <path d="M40 42 Q36.5 45 34.5 44" stroke="#1A1A18" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M40 42 Q43.5 45 45.5 44" stroke="#1A1A18" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="26" cy="40" r="3" fill="#FF8A6B" opacity="0.35"/>
      <circle cx="54" cy="40" r="3" fill="#FF8A6B" opacity="0.35"/>
    </svg>
  );
}

function getTargetRect(selector) {
  try {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom, centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
  } catch (e) { return null; }
}

// ══════════════════════════════════════════════════════════════
// Hauptkomponente
// ══════════════════════════════════════════════════════════════
export default function OnboardingTutorial() {
  const [phase, setPhase] = useState("init");
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const [foxPos, setFoxPos] = useState({ left: 0, top: 0 });
  // Gefilterte Advanced-Steps — nur verfügbare Kacheln (Basis-User bekommt weniger)
  const [advancedSteps, setAdvancedSteps] = useState(ADVANCED_STEPS);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setPhase("done");
      else setPhase("ask");
    } catch (e) { setPhase("ask"); }
  }, []);

  // ── Event-Listener: Tutorial-Restart aus SettingsModal ───────
  useEffect(() => {
    function restartTutorial() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ADVANCED_STORAGE_KEY);
      } catch (e) {}
      setStep(0);
      setAdvancedSteps(ADVANCED_STEPS);
      setPhase("ask");
    }
    window.addEventListener("hui:restart-tutorial", restartTutorial);
    return () => window.removeEventListener("hui:restart-tutorial", restartTutorial);
  }, []);

  const handleClose = useCallback(() => {
    setPhase("done");
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
    try { localStorage.setItem(ADVANCED_STORAGE_KEY, "1"); } catch (e) {}
  }, []);
  useModalRegistration(phase !== "done" && phase !== "init", handleClose, "OnboardingTutorial");

  // ── Advanced: scrollIntoView pro Schritt (kein Auto-Skip mehr) ──
  // Die Schritte werden bereits in startAdvancedTutorial vorgefiltert,
  // so dass dieser Effect nur noch scrollt — nicht mehr überspringt.
  useEffect(() => {
    if (phase !== "advanced") return;
    const stepData = advancedSteps[step];
    if (!stepData || !stepData.selector) return;
    const t = setTimeout(() => {
      const el = document.querySelector(stepData.selector);
      if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
    }, 220);
    return () => clearTimeout(t);
  }, [phase, step, advancedSteps]);

  // ── "Ja" beim erweiterten Tutorial: automatisch ins eigene Profil
  // wechseln, dort auf das Mounten der Kacheln warten, Schritte filtern
  // (nur verfügbare Kacheln für Basis-User), dann Tutorial starten.
  const startAdvancedTutorial = useCallback(() => {
    window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "profile" } }));
    const start = Date.now();
    const MAX_WAIT = 3000;
    function poll() {
      const ready = ADVANCED_READY_SELECTORS.some(sel => document.querySelector(sel));
      if (ready || Date.now() - start > MAX_WAIT) {
        // Filter: nur Schritte deren Selector im DOM existiert
        const available = ADVANCED_STEPS.filter(s => !s.selector || document.querySelector(s.selector));
        setAdvancedSteps(available.length > 0 ? available : ADVANCED_STEPS);
        setStep(0);
        setPhase("advanced");
      } else {
        setTimeout(poll, 100);
      }
    }
    poll();
  }, []);

  useLayoutEffect(() => {
    if (phase !== "tutorial" && phase !== "advanced") return;
    const steps = phase === "tutorial" ? STEPS : advancedSteps;
    const stepData = steps[step];
    if (!stepData) return;

    function measure() {
      const r = getTargetRect(stepData.selector);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (!r) {
        // Kein Spotlight → Fuchs zentriert
        setSpotRect(null);
        setFoxPos({
          left: Math.max(FOX_MARGIN, (vw - BUBBLE_MAX_W) / 2),
          top: Math.max(FOX_MARGIN, (vh - 220) / 2),
        });
        return;
      }

      setSpotRect(r);

      if (stepData.placement === "top") {
        // Fuchs über dem Spotlight — Sprechblase zeigt nach unten
        // Container: Label + Blase + Button + Fox ≈ 220px
        let top = r.top - 220;
        if (top < FOX_MARGIN) top = FOX_MARGIN;
        let left = Math.max(FOX_MARGIN, Math.min(r.centerX - BUBBLE_MAX_W / 2, vw - BUBBLE_MAX_W - FOX_MARGIN));
        setFoxPos({ left, top });
      } else {
        // Fuchs unter dem Spotlight — Sprechblase zeigt nach oben
        let top = r.bottom + FOX_BUBBLE_GAP + 8;
        // Containerhöhe ≈ 220px → nicht über unteren Rand schieben
        let maxTop = vh - 220 - FOX_MARGIN;
        if (top > maxTop) top = maxTop;
        if (top < FOX_MARGIN) top = FOX_MARGIN;
        let left = Math.max(FOX_MARGIN, Math.min(r.centerX - BUBBLE_MAX_W / 2, vw - BUBBLE_MAX_W - FOX_MARGIN));
        setFoxPos({ left, top });
      }
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const t = setTimeout(measure, 100);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); clearTimeout(t); };
  }, [phase, step, advancedSteps]);

  // ════════════════════════════════════════════════════════════
  // Shared Renderer für Tutorial-Schritte (Basis + Erweitert)
  // ════════════════════════════════════════════════════════════
  function renderSteps(stepsArr, isAdvanced) {
    const stepData = stepsArr[step];
    const isLast = step === stepsArr.length - 1;
    const onComplete = isAdvanced
      ? () => setStep(advancedSteps.length)
      : () => setStep(STEPS.length);
    const placement = stepData.placement;
    const pointerDown = placement === "top";    // Blase zeigt nach unten (Fuchs oben, Spotlight unten)
    const pointerUp   = placement === "bottom"; // Blase zeigt nach oben (Fuchs unten, Spotlight oben)

    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 10600 }}>
        {/* ── Spotlight oder dunkler Overlay ─────────────────── */}
        {spotRect ? (
          <div style={{
            position: "fixed",
            left: spotRect.left - SPOT_PAD, top: spotRect.top - SPOT_PAD,
            width: spotRect.width + SPOT_PAD * 2, height: spotRect.height + SPOT_PAD * 2,
            borderRadius: 16, background: "transparent",
            boxShadow: `0 0 0 9999px rgba(0,0,0,${OVERLAY_ALPHA})`,
            transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
            zIndex: 10600, pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", inset: -2, borderRadius: 18,
              border: "2px solid rgba(255,255,255,0.55)",
              animation: "huiSpotlightPulse 1.4s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          </div>
        ) : (
          <div style={{ position: "fixed", inset: 0, background: `rgba(0,0,0,${OVERLAY_ALPHA})`, zIndex: 10600 }} />
        )}

        {/* ── Fuchs + Sprechblase + Weiter-Button (ein Container) ── */}
        {/* Button ist zwischen Sprechblase und Fuchs → nie abgedeckt    */}
        <div style={{
          position: "fixed", left: foxPos.left, top: foxPos.top,
          zIndex: 10601, transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
          maxWidth: BUBBLE_MAX_W, display: "flex", flexDirection: "column",
          alignItems: "flex-start",
        }}>
          {/* Label (nur erweitertes Tutorial) */}
          {isAdvanced && stepData.label && (
            <div style={labelStyle}>{stepData.label}</div>
          )}

          {/* Sprechblase */}
          <div style={{
            ...bubbleBaseStyle,
            ...(pointerDown ? { marginBottom: 0 } : { marginTop: 0 }),
          }}>
            {/* Sprechblasen-Zeiger */}
            {pointerDown && (
              <div style={{
                position: "absolute", bottom: -8, left: FOX_SIZE + 4,
                width: 0, height: 0,
                borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                borderTop: "8px solid white",
              }} />
            )}
            {pointerUp && (
              <div style={{
                position: "absolute", top: -8, left: FOX_SIZE + 4,
                width: 0, height: 0,
                borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                borderBottom: "8px solid white",
              }} />
            )}
            <p style={bubbleTextStyle}>{stepData.text}</p>
          </div>

          {/* ── Weiter-Button — leicht rechts, unterhalb Sprechblase ── */}
          {/* Halbiert (66×30px), rechtsbündig im Container, über dem Fuchs */}
          <div style={{
            display: "flex", justifyContent: "flex-end",
            width: "100%", marginTop: 4, marginBottom: 6,
          }}>
            <button
              onClick={() => { if (isLast) onComplete(); else setStep(s => s + 1); }}
              style={compactBtnStyle}
            >{isLast ? "Fertig" : "Weiter"}</button>
          </div>

          {/* Fuchs + Counter */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginTop: 2,
          }}>
            <FoxBot size={FOX_SIZE} />
            <span style={counterStyle}>{step + 1} / {stepsArr.length}</span>
          </div>
        </div>

        <style>{`@keyframes huiSpotlightPulse { 0%,100% { opacity:0.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.04); } }`}</style>
      </div>,
      document.body
    );
  }

  // ── Init ──────────────────────────────────────────────────────
  if (phase === "init") return null;

  // ── Basis: Start-Dialog ───────────────────────────────────────
  if (phase === "ask") {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Willkommen bei HUI!</h2>
          <p style={dialogTextStyle}>M\u00f6chtest du das HUI-Tutorial sehen?</p>
          <p style={dialogSubTextStyle}>In wenigen Schritten zeigen wir dir die wichtigsten Bereiche der App.</p>
          <div style={dialogButtonsStyle}>
            <button onClick={() => { setPhase("hint"); }} style={btnNoStyle}>Nein</button>
            <button onClick={() => { setPhase("tutorial"); }} style={btnYesStyle}>Ja</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Hinweis nach "Nein": Tutorial jederzeit wiederholbar ───
  if (phase === "hint") {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Kein Problem!</h2>
          <p style={dialogTextStyle}>Du kannst das Tutorial jederzeit wiederholen.</p>
          <p style={dialogSubTextStyle}>Finde es unter den Einstellungen in deinem Nutzerprofil \u2014 einfach "Tutorial erneut ansehen" antippen.</p>
          <button
            onClick={() => {
              setPhase("done");
              try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
            }}
            style={{ ...btnYesStyle, width: "100%", flex: "none" }}
          >Verstanden</button>
        </div>
      </div>,
      document.body
    );
  }

  // ── Basis-Tutorial-Schritte ───────────────────────────────────
  if (phase === "tutorial" && step < STEPS.length) {
    return renderSteps(STEPS, false);
  }

  // ── Basis-Abschluss → Frage nach erweitertem Tutorial ───────
  if (phase === "tutorial" && step >= STEPS.length) {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Geschafft!</h2>
          <p style={dialogTextStyle}>Super! Du kennst jetzt die wichtigsten Bereiche von HUI.</p>
          <p style={dialogSubTextStyle}>M\u00f6chtest du das erweiterte HUI-Tutorial sehen?</p>
          <div style={dialogButtonsStyle}>
            <button onClick={() => { setPhase("hint"); }} style={btnNoStyle}>Nein</button>
            <button onClick={startAdvancedTutorial} style={btnYesStyle}>Ja</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Erweiterte Tutorial-Schritte ───────────────────────────────
  if (phase === "advanced" && step < advancedSteps.length) {
    return renderSteps(advancedSteps, true);
  }

  // ── Erweitertes Tutorial: Abschluss ───────────────────────────
  if (phase === "advanced" && step >= advancedSteps.length) {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Fantastisch!</h2>
          <p style={dialogTextStyle}>Du kennst jetzt alle Bereiche von HUI.</p>
          <p style={dialogSubTextStyle}>Viel Freude beim Erschaffen, Entdecken und Wirken!</p>
          <button
            onClick={() => {
              setPhase("done");
              try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
              try { localStorage.setItem(ADVANCED_STORAGE_KEY, "1"); } catch (e) {}
              // Zurück zum Home-Feed, damit der Nutzer nicht im Profil "stecken bleibt"
              window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "feed" } }));
            }}
            style={{ ...btnYesStyle, width: "100%", marginTop: 8, flex: "none" }}
          >Los geht's</button>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// STYLE-KONSTANTEN
// ══════════════════════════════════════════════════════════════
const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 10600,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: `rgba(0,0,0,${OVERLAY_ALPHA})`, backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
};
const dialogCardStyle = {
  background: "#FDFBF8", borderRadius: 24, padding: "28px 24px 24px",
  maxWidth: 340, width: "calc(100% - 48px)", boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
  textAlign: "center", fontFamily: "Inter, sans-serif",
};
const dialogTitleStyle = { fontSize: 20, fontWeight: 700, color: "#1A1A18", margin: "0 0 8px", fontFamily: "Inter, sans-serif" };
const dialogTextStyle = { fontSize: 15, fontWeight: 600, color: "#1A1A18", margin: "0 0 4px", lineHeight: 1.45, fontFamily: "Inter, sans-serif" };
const dialogSubTextStyle = { fontSize: 13, fontWeight: 400, color: "rgba(26,26,24,0.6)", margin: "0 0 20px", lineHeight: 1.45, fontFamily: "Inter, sans-serif" };
const dialogButtonsStyle = { display: "flex", gap: 10 };
const btnNoStyle = {
  flex: 1, padding: "13px 20px", borderRadius: 14, border: "1.5px solid rgba(26,26,24,0.12)",
  background: "transparent", color: "rgba(26,26,24,0.65)", fontSize: 15, fontWeight: 600,
  fontFamily: "Inter, sans-serif", cursor: "pointer", touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
};
const btnYesStyle = {
  flex: 1, padding: "13px 20px", borderRadius: 14, border: "none",
  background: "linear-gradient(135deg, #16D7C5, #0DC4B5)", color: "white",
  fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer",
  boxShadow: "0 2px 12px rgba(22,215,197,0.35)", touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
};

// ── Tutorial-Schritt Styles ────────────────────────────────────
const labelStyle = {
  textAlign: "center", marginBottom: 10, fontSize: 12, fontWeight: 700,
  color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif",
  textTransform: "uppercase", letterSpacing: 1.5, width: "100%",
};
const bubbleBaseStyle = {
  background: "white", borderRadius: 18, padding: "14px 16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.18)", position: "relative",
  maxWidth: BUBBLE_MAX_W, width: "100%",
};
const bubbleTextStyle = {
  margin: 0, fontSize: 14, lineHeight: 1.5, color: "#1A1A18",
  fontFamily: "Inter, sans-serif", fontWeight: 500,
};
const counterStyle = {
  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)",
  fontFamily: "Inter, sans-serif", background: "rgba(0,0,0,0.3)",
  borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap",
};
// ── Kompakter Weiter-Button (halbiert: 66×30px, im Fuchs-Container) ──
const compactBtnStyle = {
  width: BTN_WIDTH, height: BTN_HEIGHT, borderRadius: 15,
  border: "none", background: "linear-gradient(135deg, #16D7C5, #0DC4B5)",
  color: "white", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
  cursor: "pointer", boxShadow: "0 2px 10px rgba(22,215,197,0.35)",
  touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
  display: "flex", alignItems: "center", justifyContent: "center",
};
