// src/components/onboarding/OnboardingTutorial.jsx
// HUI Onboarding-Tutorial — Basis (6 Schritte) + Erweitert (6 Schritte, echte Profil-Kacheln)
// 2026-08-15: Orb-Schritt ("Mein HUI") entfernt — Orb ist aktuell funktionslos (statisches Logo,
//             siehe Stabilisierungs-Phase-Entscheidung), Tutorial-Hinweis wäre irreführend gewesen.
// Systemweite Design-Regeln: Fuchs fest unverzerrt, kompakter Weiter-Button,
// Spotlight nie verdeckt. Keine bestehenden UI-Elemente werden veraendert.
// 2026-08-11: Button halbiert + in Fuchs-Container integriert (nie abgedeckt).
//             Basis-User: Advanced-Steps vorgefiltert (kein Auto-Skip-Flicker).
import React, { useState, useLayoutEffect, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useTranslation } from "../../hooks/useTranslation.js";

// ══════════════════════════════════════════════════════════════
// DESIGN-KONSTANTEN — systemweit für ALLE Tutorials identisch
// ══════════════════════════════════════════════════════════════
const FOX_SIZE        = 52;     // Feste Fuchs-Größe — unverzerrt auf allen Geräten
const FOX_MARGIN      = 20;     // Mindestabstand Fuchs zu Bildschirmrand
const FOX_PEEK        = Math.round(FOX_SIZE / 2); // 2026-08-11: Fuchs überlappt Bubble-Ecke zur Hälfte — näher/kompakter statt separater Reihe
const FOX_BUBBLE_GAP  = 10;     // Abstand Sprechblase ↔ Fuchs (nur Fallback ohne Spotlight)
const BTN_WIDTH       = 60;     // Kompakter Weiter-Button (war 66)
const BTN_HEIGHT      = 28;     // Kompakter Button (war 30)
const BUBBLE_MAX_W    = 260;    // Max Breite der Sprechblase
const SPOT_PAD        = 10;     // Spotlight Innenabstand
const OVERLAY_ALPHA   = 0.6;    // Overlay-Transparenz (leicht grau)
const CONTAINER_H     = 165;    // Geschätzte Gesamthöhe Label+Blase+Button (kompakter als vorher 220)

const STORAGE_KEY = "hui_onboarding_completed_v1";
const ADVANCED_STORAGE_KEY = "hui_onboarding_advanced_v1";
const DISABLED_KEY = "hui_onboarding_disabled_v1"; // "Nicht mehr anzeigen" — permanent deaktiviert

const STEPS = [
  { selector: 'button[aria-label="Home"]',           textKey: 'tut.step1', placement: "top" },
  { selector: 'button[aria-label="Entdecken"]',      textKey: 'tut.step2',    placement: "top" },
  { selector: 'button[aria-label="Impact"]',         textKey: 'tut.step3', placement: "top" },
  { selector: 'button[aria-label="Profil"]',          textKey: 'tut.step4',                 placement: "top" },
  { selector: 'button[aria-label="Nachrichten"]',    textKey: 'tut.step5',     placement: "bottom" },
  { selector: 'button[aria-label="Resonanzzentrum"]', textKey: 'tut.step6', placement: "bottom" },
  // WERKEKORB-TUTORIAL-STEP (2026-08-18, Michael-Request): letzter Schritt des
  // Basis-Tutorials, direkt vor der "Erweitertes Tutorial?"-Frage. Selector
  // nutzt ^= (startsWith) statt exaktem Match, weil WerkeKorbHeaderButton.jsx
  // das aria-label je nach Korb-Status dynamisch wechselt ("Werkekorb öffnen"
  // vs. "Werkekorb öffnen — neues Item") — beide Varianten werden erfasst.
  // Text bewusst NICHT als "Warenkorb" formuliert (siehe WerkeKorb.jsx Header-
  // Kommentar: "Persönlicher Sammelraum. Kein Warenkorb. Ruhiger menschlicher
  // Raum.") — Ton bleibt konsistent mit dem Rest von HUI.
  { selector: 'button[aria-label^="Werkekorb"]',      textKey: 'tut.step7', placement: "bottom" },
];

// ── Erweitertes Tutorial (2026-08-11, TUTORIAL-PROFIL-SWITCH) ──────────
// Zielt auf die ECHTEN Kacheln im "Mein Bereich"-Menü des eigenen Profils.
// Werke/Talente/Erlebnisse existieren nur für Talent-User — diese Schritte
// werden beim Start des erweiterten Tutorials vorgefiltert (siehe
// startAdvancedTutorial), so dass Basis-User nur die verfügbaren Kacheln
// sehen, ohne Auto-Skip-Flicker.
const ADVANCED_STEPS = [
  { selector: 'button[aria-label="Meine Werke"]',        textKey: 'tut.adv1', placement: "bottom", label: "Meine Werke" },
  { selector: 'button[aria-label="Talent-Angebote"]',    textKey: 'tut.adv2', placement: "bottom", label: "Talent-Angebote" },
  { selector: 'button[aria-label="Erlebnisse & Projekte"]', textKey: 'tut.adv3', placement: "bottom", label: "Erlebnisse & Projekte" },
  { selector: 'button[aria-label="Meine Momente"]',      textKey: 'tut.adv4', placement: "bottom", label: "Meine Momente" },
  { selector: 'button[aria-label="Impact & Stimmen"]',   textKey: 'tut.adv5', placement: "bottom", label: "Impact & Stimmen" },
  { selector: 'button[aria-label="K\u00e4ufe/Verk\u00e4ufe"]', textKey: 'tut.adv6', placement: "bottom", label: "K\u00e4ufe/Verk\u00e4ufe" },
  { selector: 'button[aria-label="Meine Resonanz"]',   textKey: 'tut.adv7', placement: "bottom", label: "Meine Resonanz" },
  { selector: 'button[aria-label="Empfehlungen"]',      textKey: 'tut.adv8', placement: "bottom", label: "Empfehlungen" },
];

// Selektoren, deren Vorhandensein signalisiert "Profil ist bereits gemountet"
const ADVANCED_READY_SELECTORS = [
  'button[aria-label="Meine Momente"]',
  'button[aria-label="Meine Werke"]',
];

// ══════════════════════════════════════════════════════════════
// Fuchs-Avatar — nutzt das kanonische HUI-Fuchs-Bild (fox_avatar_v3)
// statt des alten SVG-Bots, der dämonisch wirkte. Bild ist lokal
// unter /assets/fox-avatar.png abgelegt — kein Network-Dependency.
// Feste Größe, unverzerrt (objectFit: cover), borderRadius = rund.
// ══════════════════════════════════════════════════════════════
function FoxBot({ size = FOX_SIZE }) {
  const [imgErr, setImgErr] = useState(false);
  if (imgErr) {
    // Fallback: kleiner Kreis mit "H" Initial, wie bei CardAvatar
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "rgba(22,215,197,0.15)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 600, color: "#16D7C5",
        fontFamily: "Inter, sans-serif",
      }}>H</div>
    );
  }
  return (
    <img
      src="/assets/fox-avatar.png"
      alt="HUI Fuchs"
      onError={() => setImgErr(true)}
      style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", display: "block", flexShrink: 0,
      }}
    />
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
  const { t } = useTranslation();
  const [phase, setPhase] = useState("init");
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const [foxPos, setFoxPos] = useState({ left: 0, top: 0 });
  // Gefilterte Advanced-Steps — nur verfügbare Kacheln (Basis-User bekommt weniger)
  const [advancedSteps, setAdvancedSteps] = useState(ADVANCED_STEPS);

  useEffect(() => {
    try {
      // Wenn Tutorial abgeschlossen ODER permanent deaktiviert → nie wieder zeigen
      if (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(DISABLED_KEY)) setPhase("done");
      else setPhase("ask");
    } catch (e) { setPhase("ask"); }
  }, []);

  // ── Event-Listener: Tutorial-Restart aus SettingsModal ───────
  useEffect(() => {
    function restartTutorial() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ADVANCED_STORAGE_KEY);
        localStorage.removeItem(DISABLED_KEY); // Re-Aktivierung: auch Disable-Flag löschen
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
    // 2026-08-11 FIX: Bei Abbruch (X/Zurück) blieb der Nutzer auf der
    // Seite stehen, auf der das Tutorial ihn zuletzt hinnavigiert hatte
    // (z.B. Profil, mit gescrollter Kachel-Ansicht) → wirkte wie ein
    // weißer Bildschirm. Fix: immer zurück zum Home-Feed.
    window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "feed" } }));
  }, []);
  useModalRegistration(phase !== "done" && phase !== "init", handleClose, "OnboardingTutorial");

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

  // ── KEIN-SPRUNG-FIX (2026-08-11): Vorher wurde beim Schritt-Wechsel SOFORT
  // gemessen (mit der ALTEN, noch nicht gescrollten Position) UND parallel
  // — zeitlich versetzt — in einem zweiten Effect gescrollt. Das erzeugte
  // einen sichtbaren Sprung: Fuchs+Blase erschienen kurz an der falschen
  // Stelle und "sprangen" dann zur echten Position, sobald der Scroll fertig
  // war. Fix: Scrollen zuerst (synchron, behavior:"auto"), danach ZWEI
  // Animation-Frames abwarten (Layout ist dann garantiert fertig) und erst
  // DANN einmalig messen — kein Zwischen-Zustand mehr sichtbar.
  useLayoutEffect(() => {
    if (phase !== "tutorial" && phase !== "advanced") return;
    const steps = phase === "tutorial" ? STEPS : advancedSteps;
    const stepData = steps[step];
    if (!stepData) return;

    let cancelled = false;

    function measure() {
      if (cancelled) return;
      const r = getTargetRect(stepData.selector);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (!r) {
        // Kein Spotlight → Fuchs zentriert
        setSpotRect(null);
        setFoxPos({
          left: Math.max(FOX_MARGIN, (vw - BUBBLE_MAX_W) / 2),
          top: Math.max(FOX_MARGIN, (vh - CONTAINER_H) / 2),
        });
        return;
      }

      setSpotRect(r);

      if (stepData.placement === "top") {
        // Fuchs+Blase über dem Spotlight — Blase zeigt nach unten.
        // Fuchs überlappt die UNTERE linke Ecke der Blase (siehe renderSteps) —
        // das bleibt innerhalb von CONTAINER_H, kein Extra-Puffer nötig.
        let top = r.top - CONTAINER_H;
        if (top < FOX_MARGIN) top = FOX_MARGIN;
        let left = Math.max(FOX_MARGIN, Math.min(r.centerX - BUBBLE_MAX_W / 2, vw - BUBBLE_MAX_W - FOX_MARGIN));
        setFoxPos({ left, top });
      } else {
        // Fuchs+Blase unter dem Spotlight — Blase zeigt nach oben.
        // Fuchs überlappt die OBERE linke Ecke → pokt über den Flow-Anfang
        // hinaus → zusätzlicher Puffer FOX_PEEK nach oben nötig.
        let top = r.bottom + FOX_BUBBLE_GAP + 8;
        let maxTop = vh - CONTAINER_H - FOX_MARGIN;
        if (top > maxTop) top = maxTop;
        if (top < FOX_MARGIN + FOX_PEEK) top = FOX_MARGIN + FOX_PEEK;
        let left = Math.max(FOX_MARGIN, Math.min(r.centerX - BUBBLE_MAX_W / 2, vw - BUBBLE_MAX_W - FOX_MARGIN));
        setFoxPos({ left, top });
      }
    }

    if (phase === "advanced" && stepData.selector) {
      const el = document.querySelector(stepData.selector);
      if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
      // Erst NACH dem Scroll (zwei Frames warten) messen — verhindert den Sprung
      requestAnimationFrame(() => requestAnimationFrame(measure));
    } else {
      measure();
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
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

        {/* ── Fuchs überlappt jetzt die Bubble-Ecke — näher & kompakter ── */}
        {/* 2026-08-11: Fuchs saß vorher weit unter der Blase (eigene Reihe
            mit Button dazwischen). Jetzt: Fuchs sitzt zur Hälfte AUF der
            Blasen-Ecke (unten-links bei pointerDown / oben-links bei
            pointerUp) — direkt neben dem Sprechblasen-Zeiger. Alle Flow-
            Kinder bekommen marginLeft:FOX_PEEK, damit der nach links
            überlappende Fuchs trotzdem exakt an foxPos.left (=Bildschirm-
            Randabstand) endet — kein zusätzlicher Clamp nötig. */}
        <div style={{
          position: "fixed", left: foxPos.left, top: foxPos.top,
          zIndex: 10601, transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
          maxWidth: BUBBLE_MAX_W + FOX_PEEK,
        }}>
          {/* Label (nur erweitertes Tutorial) */}
          {isAdvanced && stepData.label && (
            <div style={{ ...labelStyle, marginLeft: FOX_PEEK }}>{stepData.label}</div>
          )}

          {/* Sprechblase + überlappender Fuchs (relative Wrapper-Ecke) */}
          <div style={{ position: "relative", marginLeft: FOX_PEEK }}>
            <div style={{
              ...bubbleBaseStyle,
              ...(pointerDown ? { marginBottom: 0 } : { marginTop: 0 }),
            }}>
              {/* Sprechblasen-Zeiger — nah am Fuchs (linke Seite) */}
              {pointerDown && (
                <div style={{
                  position: "absolute", bottom: -8, left: 22,
                  width: 0, height: 0,
                  borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                  borderTop: "8px solid white",
                }} />
              )}
              {pointerUp && (
                <div style={{
                  position: "absolute", top: -8, left: 22,
                  width: 0, height: 0,
                  borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                  borderBottom: "8px solid white",
                }} />
              )}
              <p style={bubbleTextStyle}>{t(stepData.textKey)}</p>
            </div>

            {/* Fuchs — überlappt die Blasen-Ecke zur Hälfte (FOX_PEEK) */}
            <div style={{
              position: "absolute",
              left: -FOX_PEEK,
              ...(pointerDown ? { bottom: -FOX_PEEK } : { top: -FOX_PEEK }),
              borderRadius: "50%", border: "2.5px solid white",
              boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
              lineHeight: 0, zIndex: 2,
            }}>
              <FoxBot size={FOX_SIZE} />
            </div>
          </div>

          {/* Weiter-Button + Counter — kompakte Zeile, rechtsbündig */}
          <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            gap: 6, marginLeft: FOX_PEEK, marginTop: 8,
          }}>
            <span style={counterStyle}>{step + 1} / {stepsArr.length}</span>
            <button
              onClick={() => { if (isLast) onComplete(); else setStep(s => s + 1); }}
              style={compactBtnStyle}
            >{isLast ? t("tut.fertig") : t("tut.weiter")}</button>
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
          <h2 style={dialogTitleStyle}>{t("onboarding.welcomeTitle")}</h2>
          <p style={dialogTextStyle}>{t("onboarding.askTutorial")}</p>
          <p style={dialogSubTextStyle}>{t("onboarding.tutorialHint")}</p>
          <div style={dialogButtonsStyle}>
            <button onClick={() => { setPhase("hint"); }} style={btnNoStyle}>{t("common.no")}</button>
            <button onClick={() => { setPhase("tutorial"); }} style={btnYesStyle}>{t("common.yes")}</button>
            <button
              onClick={() => {
                try {
                  localStorage.setItem(DISABLED_KEY, "1");
                  localStorage.setItem(STORAGE_KEY, "1");
                } catch (e) {}
                setPhase("done");
                window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "feed" } }));
              }}
              style={btnDisableStyle}
            >Nicht mehr anzeigen</button>
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
          <p style={dialogSubTextStyle}>Finde es unter den Einstellungen in deinem Nutzerprofil — einfach "Tutorial erneut ansehen" antippen.</p>
          <button
            onClick={() => {
              // "Nein" = später nochmal fragen → nur diese Session überspringen,
              // KEIN STORAGE_KEY (sonst würde Tutorial nie wieder kommen).
              // sessionStorage reicht für "diesmal nicht anzeigen".
              try { sessionStorage.setItem("hui_onboarding_skipped", "1"); } catch (e) {}
              setPhase("done");
              window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "feed" } }));
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
          <h2 style={dialogTitleStyle}>{t("onboarding.done")}</h2>
          <p style={dialogTextStyle}>{t("onboarding.learnedBasics")}</p>
          <p style={dialogSubTextStyle}>{t("onboarding.askAdvanced")}</p>
          <div style={dialogButtonsStyle}>
            <button onClick={() => { setPhase("hint"); }} style={btnNoStyle}>{t("common.no")}</button>
            <button onClick={startAdvancedTutorial} style={btnYesStyle}>{t("common.yes")}</button>
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
          <p style={dialogTextStyle}>{t("onboarding.learnedAll")}</p>
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
const dialogButtonsStyle = { display: "flex", gap: 8, flexWrap: "wrap" };
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
const btnDisableStyle = {
  flex: 1, padding: "13px 14px", borderRadius: 14, border: "1.5px solid rgba(26,26,24,0.12)",
  background: "transparent", color: "rgba(26,26,24,0.45)", fontSize: 13, fontWeight: 600,
  fontFamily: "Inter, sans-serif", cursor: "pointer", touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap",
};

// ── Tutorial-Schritt Styles ────────────────────────────────────
const labelStyle = {
  textAlign: "center", marginBottom: 6, fontSize: 12, fontWeight: 700,
  color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif",
  textTransform: "uppercase", letterSpacing: 1.5, width: "100%",
};
const bubbleBaseStyle = {
  background: "white", borderRadius: 16,
  // 2026-08-11 FIX: paddingLeft muss den Fuchs-Overlap (FOX_PEEK, die
  // Hälfte des Fuchses ragt in die Blase hinein) + Puffer aufnehmen —
  // sonst überdeckt der Fuchs den Textanfang (Michael-Report: "Fuchs
  // legt über dem Text"). Andere Seiten bleiben kompakt (12px).
  padding: `12px 14px 12px ${FOX_PEEK + 10}px`,
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
