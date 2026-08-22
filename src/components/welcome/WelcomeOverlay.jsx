// src/components/welcome/WelcomeOverlay.jsx — Kapitel 1: Ankommen
// Erscheint einmalig nach erster Anmeldung.
// Persistenz via localStorage "hui_welcome_seen".
// Kein Eingriff in Auth, Routing oder bestehende Komponenten.
//
// ERWEITERUNG (2026-08-23, Michael): Empfangsbereich um Regeln/Sicherheit/
// Altersfreigabe/Beta-Hinweise + "Die fünf Grundbereiche von HUI" ergänzt.
// NICHTS Bestehendes wurde entfernt oder verändert — nur ergänzt.
// Neuer `mode`-Prop ("full" | "rulesOnly") erlaubt Wiederverwendung derselben
// Komponente für bestehende Nutzer (einmal pro App-Update, siehe
// AppEntryController.jsx + welcomePersistence.js), ohne die komplette
// Willkommens-Erfahrung zu duplizieren (Architektur-Charta: Erweitern statt
// duplizieren).
import React, { useState, useEffect, useRef } from "react";
import { HUILogo } from '../brand/HUILogo.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { emit } from '../../lib/events/index.js';

const TEAL   = "#0DC4B5";
const TEAL2  = "#09A89A";
const INK    = "#141422";
const INK2   = "#3A3A55";
const CORAL  = "#F47355";

// Welcome-Persistenz: ausschließlich über src/lib/welcomePersistence.js

// ── Feature-Zeilen ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🤝",
    bg: "rgba(13,196,181,0.10)",
    title: "Menschen kennenlernen",
    sub:   "Verbinde dich mit inspirierenden Menschen.",
  },
  {
    icon: "🎨",
    bg: "rgba(212,149,42,0.10)",
    title: "Talente entdecken",
    sub:   "Lass dich von einzigartigen Talenten begeistern.",
  },
  {
    icon: "🛍",
    bg: "rgba(149,113,244,0.10)",
    title: "Werke kaufen",
    sub:   "Unterstütze Kreative und kaufe ihre Werke.",
  },
  {
    icon: "🎟",
    bg: "rgba(13,196,181,0.10)",
    title: "Erlebnisse buchen",
    sub:   "Buche besondere Erlebnisse und Aktivitäten.",
  },
  {
    icon: "🌍",
    bg: "rgba(99,184,99,0.10)",
    title: "Projekte mit Wirkung unterstützen",
    sub:   "Sei Teil von Projekten, die unsere Welt verbessern.",
  },
];

// ── NEU (2026-08-23): Wichtige Hinweise ──────────────────────────
const RULES_ITEMS = [
  { icon: "🔞", text: "HUI ist ein sicherer Ort für Menschen ab 16 Jahren." },
  { icon: "🚫", text: "Rassismus, Sexismus, Gewalt oder diskriminierende Inhalte sind streng verboten." },
  { icon: "⚠️", text: "Wiederholte Verstöße führen zur Blockierung bis hin zur vollständigen Löschung des Accounts." },
  { icon: "🧪", text: "Die App befindet sich aktuell in der Betaphase: Fehler, Bugs und Darstellungsprobleme können auftreten." },
  { icon: "🌱", text: "Wir entwickeln HUI kontinuierlich weiter, um dir die beste Erfahrung zu bieten." },
];

// ── NEU (2026-08-23): Die fünf Grundbereiche von HUI ─────────────
const CORE_AREAS = [
  { icon: "🛍", bg: "rgba(149,113,244,0.10)", title: "Werke",      sub: "Kreative Arbeiten entdecken und kaufen." },
  { icon: "🎨", bg: "rgba(212,149,42,0.10)",  title: "Talente",    sub: "Menschen mit besonderen Fähigkeiten finden und buchen." },
  { icon: "🎟", bg: "rgba(13,196,181,0.10)",  title: "Erlebnisse", sub: "Aktivitäten und besondere Momente erleben." },
  { icon: "📸", bg: "rgba(244,115,85,0.10)",  title: "Momente",    sub: "Persönliche Eindrücke teilen." },
  { icon: "🌍", bg: "rgba(99,184,99,0.10)",   title: "Impact",     sub: "Projekte unterstützen, die echte Wirkung erzeugen." },
];

// ── Haupt-Komponente ─────────────────────────────────────────────
// mode="full"      → komplette Willkommens-Erfahrung für neue Nutzer
//                     (bestehender Inhalt + neue Hinweise/Kernbereiche)
// mode="rulesOnly" → kompakte Variante für bestehende Nutzer, die den
//                     Empfangsbereich schon kennen: zeigt nur die NEUEN
//                     Abschnitte (einmal pro App-Update, siehe
//                     AppEntryController.jsx)
export default function WelcomeOverlay({ onDone, mode = "full" }) {
  const [closing, setClosing] = useState(false);
  const { user } = useAuth();
  const actorId = user?.id || null;

  const scrollRef = useRef(null);
  const rulesRef  = useRef(null);
  const areasRef  = useRef(null);
  const fired     = useRef({ welcome: false, rules: false, areas: false });

  // SADB-Event: welcome_screen_viewed — sobald der Empfangsbereich gerendert ist
  useEffect(() => {
    if (!actorId || fired.current.welcome) return;
    fired.current.welcome = true;
    emit('welcome_screen_viewed', {
      actorId,
      targetType: 'welcome_screen',
      metadata: { mode },
    });
  }, [actorId, mode]);

  // SADB-Events: rules_section_viewed + core_areas_viewed — per
  // IntersectionObserver, feuert erst wenn die jeweilige Sektion tatsächlich
  // im sichtbaren Bereich der scrollbaren Karte erscheint (keine Race
  // Conditions, kein doppeltes Feuern dank fired-Guard).
  useEffect(() => {
    if (!actorId) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target === rulesRef.current && !fired.current.rules) {
          fired.current.rules = true;
          emit('rules_section_viewed', { actorId, targetType: 'welcome_screen', metadata: { mode } });
        }
        if (entry.target === areasRef.current && !fired.current.areas) {
          fired.current.areas = true;
          emit('core_areas_viewed', { actorId, targetType: 'welcome_screen', metadata: { mode } });
        }
      });
    }, { root: scrollRef.current, threshold: 0.35 });

    if (rulesRef.current) observer.observe(rulesRef.current);
    if (areasRef.current) observer.observe(areasRef.current);
    return () => observer.disconnect();
  }, [actorId, mode]);

  function handleDiscover() {
    setClosing(true);
    // AppEntryController übernimmt Storage + Navigation
    setTimeout(() => { onDone?.(); }, 420);
  }

  const isRulesOnly = mode === "rulesOnly";

  return (
    <>
      <style>{`
        @keyframes huiWelcomeFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes huiWelcomeSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1);     }
        }
        @keyframes huiWelcomeFadeOut {
          from { opacity: 1; transform: translateY(0)    scale(1);     }
          to   { opacity: 0; transform: translateY(24px) scale(0.985); }
        }
        .hui-welcome-backdrop {
          animation: huiWelcomeFadeIn 0.38s ease both;
        }
        .hui-welcome-backdrop.closing {
          animation: huiWelcomeFadeIn 0.42s ease reverse both;
        }
        .hui-welcome-card {
          animation: huiWelcomeSlideUp 0.46s cubic-bezier(0.22,1,0.36,1) 0.06s both;
        }
        .hui-welcome-card.closing {
          animation: huiWelcomeFadeOut 0.38s cubic-bezier(0.4,0,1,1) both;
        }
        .hui-welcome-btn:active {
          transform: scale(0.97);
          opacity: 0.92;
        }
        .hui-welcome-feature:hover {
          background: rgba(13,196,181,0.06) !important;
        }
        .hui-welcome-scroll::-webkit-scrollbar { display: none; }
        .hui-welcome-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Backdrop ─────────────────────────────────────────────── */}
      <div
        className={`hui-welcome-backdrop${closing ? " closing" : ""}`}
        style={{
          position:       "fixed",
          inset:          0,
          zIndex:         99990,
          background:     "rgba(20,20,34,0.52)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "8px 8px 0",
        }}
      >
        {/* ── Card ───────────────────────────────────────────────── */}
        <div
          className={`hui-welcome-card${closing ? " closing" : ""}`}
          style={{
            position:        "relative",
            width:           "100%",
            maxWidth:        420,
            maxHeight:       "calc(100dvh - 8px)",
            borderRadius:    "28px 28px 0 0",
            overflow:        "hidden",
            display:         "flex",
            flexDirection:   "column",
            // Glassmorphism
            background:      "rgba(253,252,250,0.97)",
            backdropFilter:  "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:       "0 -2px 0 0 rgba(13,196,181,0.18), 0 24px 80px rgba(20,20,34,0.28), 0 4px 24px rgba(13,196,181,0.10)",
          }}
        >
          {/* ── Dekorativer Hintergrund-Gradient ─────────────────── */}
          <div style={{
            position:   "absolute",
            inset:       0,
            pointerEvents: "none",
            zIndex:      0,
            background: `
              radial-gradient(ellipse 70% 40% at 50% 0%, rgba(13,196,181,0.13) 0%, transparent 70%),
              radial-gradient(ellipse 50% 30% at 100% 0%, rgba(244,115,85,0.09) 0%, transparent 60%),
              radial-gradient(ellipse 40% 50% at 0% 100%, rgba(13,196,181,0.07) 0%, transparent 60%)
            `,
          }} />

          {/* ── Scrollbarer Inhalt ───────────────────────────────── */}
          <div
            ref={scrollRef}
            className="hui-welcome-scroll"
            style={{
              flex:       1,
              overflowY:  "auto",
              overflowX:  "hidden",
              position:   "relative",
              zIndex:     1,
              padding:    "16px 18px 6px",
            }}
          >
            {/* ── Logo + Headline ─────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <HUILogo
                size={44}
                style={{ margin: "0 auto 6px" }}
              />
              <h1 style={{
                margin:       0,
                fontSize:     20,
                fontWeight: 600,
                color:        INK,
                letterSpacing: "-0.025em",
                lineHeight:    1.2,
              }}>
                {isRulesOnly ? (
                  <>Neu bei <span style={{ color: TEAL }}>HUI</span></>
                ) : (
                  <>Willkommen bei{" "}<span style={{ color: TEAL }}>HUI</span></>
                )}
              </h1>

              {/* Dezenter Divider mit Blatt */}
              <div style={{
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                gap:        5,
                margin:     "6px 0 0",
              }}>
                <div style={{ height: 1, width: 36, background: "rgba(13,196,181,0.22)", borderRadius: 1 }} />
                <span style={{ fontSize: 12, lineHeight: 1 }}>🌿</span>
                <div style={{ height: 1, width: 36, background: "rgba(13,196,181,0.22)", borderRadius: 1 }} />
              </div>
            </div>

            {/* ── Einleitungstext (nur volle Willkommens-Erfahrung) ── */}
            {!isRulesOnly && (
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <p style={{
                  margin:     "0 0 4px",
                  fontSize:   13,
                  fontWeight: 600,
                  color:      INK,
                  letterSpacing: "-0.01em",
                }}>
                  Schön, dass du da bist.
                </p>
                <p style={{
                  fontSize:     12,
                  color:        INK2,
                  lineHeight:   1.25,
                  letterSpacing: "-0.006em",
                  maxWidth:     270,
                  margin:       "0 auto",
                }}>
                  HUI ist ein Ort für Menschen, die gemeinsam Werte schaffen,
                  Talente entdecken und echte Verbindungen aufbauen möchten.
                </p>
              </div>
            )}

            {isRulesOnly && (
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <p style={{
                  fontSize:     12,
                  color:        INK2,
                  lineHeight:   1.3,
                  letterSpacing: "-0.006em",
                  maxWidth:     280,
                  margin:       "0 auto",
                }}>
                  Wir haben HUI weiterentwickelt — hier die wichtigsten
                  Hinweise für dich, kurz zusammengefasst.
                </p>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                NEU (2026-08-23): Wichtige Hinweise für die Nutzung
                von HUI — Regeln, Sicherheit, Altersfreigabe, Beta.
                Ergänzung unterhalb des bestehenden Willkommenstextes,
                bestehender Inhalt bleibt unverändert.
               ══════════════════════════════════════════════════════ */}
            <div
              ref={rulesRef}
              style={{
                background:   "rgba(244,115,85,0.06)",
                border:       "1px solid rgba(244,115,85,0.18)",
                borderRadius: 14,
                padding:      "9px 11px",
                marginBottom: 8,
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600, color: INK,
                letterSpacing: "-0.01em", marginBottom: 6,
              }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                Wichtige Hinweise für die Nutzung von HUI
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {RULES_ITEMS.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1, lineHeight: 1.3 }}>{r.icon}</span>
                    <span style={{ fontSize: 10.5, color: INK2, lineHeight: 1.4, letterSpacing: "-0.004em" }}>
                      {r.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                NEU (2026-08-23): Die fünf Grundbereiche von HUI —
                Ergänzung unterhalb der Regeln, wie von Michael
                gefordert. Bestehende Feature-Liste bleibt unverändert
                erhalten (siehe weiter unten).
               ══════════════════════════════════════════════════════ */}
            <div ref={areasRef} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: INK,
                letterSpacing: "-0.01em", marginBottom: 5,
                textAlign: isRulesOnly ? "center" : "left",
                paddingLeft: isRulesOnly ? 0 : 2,
              }}>
                Die fünf Grundbereiche von HUI
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {CORE_AREAS.map((f, i) => (
                  <div
                    key={i}
                    className="hui-welcome-feature"
                    style={{
                      display:       "flex",
                      alignItems:    "center",
                      gap:           7,
                      padding:       "4px 9px",
                      borderRadius:  11,
                      background:    "rgba(250,247,242,0.9)",
                      border:        "1px solid rgba(13,196,181,0.10)",
                      transition:    "background 0.2s",
                      cursor:        "default",
                    }}
                  >
                    <div style={{
                      width:         23,
                      height:        23,
                      borderRadius:  7,
                      background:    f.bg,
                      display:       "flex",
                      alignItems:    "center",
                      justifyContent:"center",
                      fontSize:      12,
                      flexShrink:    0,
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize:      11,
                        fontWeight: 600,
                        color:         INK,
                        letterSpacing: "-0.01em",
                        lineHeight:    1.15,
                      }}>
                        {f.title}
                      </div>
                      <div style={{ fontSize: 9.5, color: "rgba(58,58,85,0.65)", lineHeight: 1.2 }}>
                        {f.sub}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(13,196,181,0.50)", flexShrink: 0, fontWeight: 600 }}>
                      ›
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Feature-Liste (bestehend, unverändert, nur bei "full") ── */}
            {!isRulesOnly && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 6 }}>
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    className="hui-welcome-feature"
                    style={{
                      display:       "flex",
                      alignItems:    "center",
                      gap:           7,
                      padding:       "4px 9px",
                      borderRadius:  11,
                      background:    "rgba(250,247,242,0.9)",
                      border:        "1px solid rgba(13,196,181,0.10)",
                      transition:    "background 0.2s",
                      cursor:        "default",
                    }}
                  >
                    {/* Icon-Badge */}
                    <div style={{
                      width:         23,
                      height:        23,
                      borderRadius:  7,
                      background:    f.bg,
                      display:       "flex",
                      alignItems:    "center",
                      justifyContent:"center",
                      fontSize:      12,
                      flexShrink:    0,
                    }}>
                      {f.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize:      11,
                        fontWeight: 600,
                        color:         INK,
                        letterSpacing: "-0.01em",
                        marginBottom:  0,
                        lineHeight:    1.15,
                      }}>
                        {f.title}
                      </div>
                      <div style={{
                        fontSize:  9.5,
                        color:     "rgba(58,58,85,0.65)",
                        lineHeight: 1.2,
                      }}>
                        {f.sub}
                      </div>
                    </div>

                    {/* Chevron */}
                    <div style={{
                      fontSize:  12,
                      color:     "rgba(13,196,181,0.50)",
                      flexShrink: 0,
                      fontWeight: 600,
                    }}>
                      ›
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Abschluss-Zitat (bestehend, unverändert, nur bei "full") ── */}
            {!isRulesOnly && (
              <div style={{ textAlign: "center", marginBottom: 0 }}>
                <div style={{ fontSize: 12, marginBottom: 2, opacity: 0.6 }}>♡</div>
                <p style={{
                  margin:       0,
                  fontSize:     11,
                  color:        "rgba(58,58,85,0.55)",
                  lineHeight:   1.4,
                  letterSpacing: "-0.005em",
                }}>
                  Jede Begegnung kann etwas verändern.
                </p>
                <p style={{
                  margin:       "0",
                  fontSize:     11,
                  fontWeight:   600,
                  color:        TEAL2,
                  letterSpacing: "-0.008em",
                }}>
                  Vielleicht beginnt deine genau heute.{" "}
                  <span style={{ fontSize: 11 }}>🌿</span>
                </p>
              </div>
            )}
          </div>

          {/* ── Sticky Button ────────────────────────────────────── */}
          <div style={{
            position:   "relative",
            zIndex:     2,
            padding:    "8px 20px 16px",
            background: "rgba(253,252,250,0.98)",
            borderTop:  "1px solid rgba(13,196,181,0.08)",
          }}>
            <button
              className="hui-welcome-btn"
              onClick={handleDiscover}
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            8,
                width:          "100%",
                padding:        "12px 22px",
                borderRadius:   15,
                border:         "none",
                background:     `linear-gradient(135deg, ${TEAL} 0%, ${TEAL2} 100%)`,
                color:          "#fff",
                fontSize:       14.5,
                fontWeight: 600,
                letterSpacing:  "-0.01em",
                cursor:         "pointer",
                transition:     "transform 0.18s ease, opacity 0.18s ease",
                touchAction:    "manipulation",
                boxShadow:      `0 4px 20px rgba(13,196,181,0.38), 0 1px 4px rgba(13,196,181,0.22)`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isRulesOnly ? (
                <>
                  <span style={{ fontSize: 15 }}>✓</span>
                  Verstanden, weiter zu HUI
                </>
              ) : (
                <>
                  <span style={{ fontSize: 15 }}>✨</span>
                  HUI entdecken
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
