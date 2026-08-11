// src/components/onboarding/OnboardingTutorial.jsx
// HUI Onboarding-Tutorial — erscheint nur beim allerersten App-Oeffnen.
// Keine bestehenden UI-Elemente werden veraendert oder entfernt.
import React, { useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const STORAGE_KEY = "hui_onboarding_completed_v1";
const SPOTLIGHT_PAD = 8;

const STEPS = [
  { selector: 'button[aria-label="Home"]',           text: "Hier siehst du alle Beiträge chronologisch – dein persönlicher Home-Feed.", placement: "top" },
  { selector: 'button[aria-label="Entdecken"]',      text: "Hier findest du alles über HUI: Menschen, Werke, Erlebnisse und neue Ideen.",    placement: "top" },
  { selector: 'button[aria-label="Mein HUI"]',       text: "Hier entsteht Neues. Der Orb ist dein Zugang, um selbst etwas zu erschaffen.",    placement: "top" },
  { selector: 'button[aria-label="Impact"]',         text: "Hier findest du alle Projekte, die wir gemeinsam unterstützen. Erstelle doch selbst eins!", placement: "top" },
  { selector: 'button[aria-label="Profil"]',          text: "Hier kannst du dein eigenes Profil gestalten und personalisieren.",                 placement: "top" },
  { selector: 'button[aria-label="Nachrichten"]',    text: "Hier entstehen Verbindungen. Schreibe Menschen direkt und bleibe in Kontakt.",     placement: "bottom" },
  { selector: 'button[aria-label="Resonanzzentrum"]', text: "Hier bekommst du alle wichtigen Neuigkeiten – Kommentare, Buchungen, Käufe und mehr.", placement: "bottom" },
];

function FoxBot({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
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
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom, centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
  } catch (e) { return null; }
}

export default function OnboardingTutorial() {
  const [phase, setPhase] = useState("ask");
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const [foxPos, setFoxPos] = useState({ left: 0, top: 0 });

  const handleClose = useCallback(() => {
    setPhase("done");
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
  }, []);
  useModalRegistration(phase !== "done", handleClose, "OnboardingTutorial");

  useLayoutEffect(() => {
    if (phase !== "tutorial") return;
    const stepData = STEPS[step];
    if (!stepData) return;
    function measure() {
      const r = getTargetRect(stepData.selector);
      if (!r) return;
      setSpotRect(r);
      if (stepData.placement === "top") {
        setFoxPos({ left: Math.max(16, Math.min(r.centerX - 120, window.innerWidth - 260)), top: Math.max(40, r.top - 180) });
      } else {
        setFoxPos({ left: Math.max(16, Math.min(r.centerX - 120, window.innerWidth - 260)), top: Math.min(r.bottom + 24, window.innerHeight - 200) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const t = setTimeout(measure, 100);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); clearTimeout(t); };
  }, [phase, step]);

  // ── Start-Dialog ──────────────────────────────────────────────
  if (phase === "ask") {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Willkommen bei HUI!</h2>
          <p style={dialogTextStyle}>Möchtest du das HUI-Tutorial sehen?</p>
          <p style={dialogSubTextStyle}>In wenigen Schritten zeigen wir dir die wichtigsten Bereiche der App.</p>
          <div style={dialogButtonsStyle}>
            <button onClick={() => { setPhase("done"); try { localStorage.setItem(STORAGE_KEY, "1"); } catch(e) {} }} style={btnNoStyle}>Nein</button>
            <button onClick={() => setPhase("tutorial")} style={btnYesStyle}>Ja</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Tutorial-Schritte ─────────────────────────────────────────
  if (phase === "tutorial" && step < STEPS.length) {
    const stepData = STEPS[step];
    const isLast = step === STEPS.length - 1;
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 10600 }}>
        {spotRect && (
          <div style={{
            position: "fixed",
            left: spotRect.left - SPOTLIGHT_PAD, top: spotRect.top - SPOTLIGHT_PAD,
            width: spotRect.width + SPOTLIGHT_PAD * 2, height: spotRect.height + SPOTLIGHT_PAD * 2,
            borderRadius: 16, background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
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
        )}
        {!spotRect && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 10600 }} />}
        <div style={{
          position: "fixed", left: foxPos.left, top: foxPos.top,
          zIndex: 10601, transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", maxWidth: 260,
        }}>
          <div style={{
            background: "white", borderRadius: 18, padding: "14px 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)", position: "relative", marginBottom: 8,
          }}>
            <div style={{
              position: "absolute", bottom: -8, left: 24, width: 0, height: 0,
              borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
              borderTop: "8px solid white",
            }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#1A1A18", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              {stepData.text}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FoxBot size={56} />
            <span style={{
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)",
              fontFamily: "Inter, sans-serif", background: "rgba(0,0,0,0.3)",
              borderRadius: 99, padding: "3px 10px",
            }}>{step + 1} / {STEPS.length}</span>
          </div>
          <button
            onClick={() => { if (isLast) { setStep(STEPS.length); } else { setStep(s => s + 1); } }}
            style={{
              marginTop: 12, width: "100%", padding: "12px 20px", borderRadius: 14,
              border: "none", background: "linear-gradient(135deg, #16D7C5, #0DC4B5)",
              color: "white", fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif",
              cursor: "pointer", boxShadow: "0 2px 12px rgba(22,215,197,0.35)",
              touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
            }}
          >Weiter</button>
        </div>
        <style>{`@keyframes huiSpotlightPulse { 0%,100% { opacity:0.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.04); } }`}</style>
      </div>,
      document.body
    );
  }

  // ── Abschluss ─────────────────────────────────────────────────
  if (phase === "tutorial" && step >= STEPS.length) {
    return createPortal(
      <div style={overlayStyle}>
        <div style={dialogCardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <FoxBot size={64} />
          </div>
          <h2 style={dialogTitleStyle}>Geschafft!</h2>
          <p style={dialogTextStyle}>Super! Du kennst jetzt die wichtigsten Bereiche von HUI.</p>
          <p style={dialogSubTextStyle}>Viel Freude beim Entdecken!</p>
          <button
            onClick={() => { setPhase("done"); try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {} }}
            style={{ ...btnYesStyle, width: "100%", marginTop: 8, flex: "none" }}
          >Los geht's</button>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}

// ── Styles ─────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 10600,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
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
