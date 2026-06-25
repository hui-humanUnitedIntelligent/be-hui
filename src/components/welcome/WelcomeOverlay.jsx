// src/components/welcome/WelcomeOverlay.jsx — Kapitel 1: Ankommen
// Erscheint einmalig nach erster Anmeldung.
// Persistenz via localStorage "hui_welcome_seen".
// Kein Eingriff in Auth, Routing oder bestehende Komponenten.
import React, { useEffect, useState } from "react";

const TEAL   = "#0DC4B5";
const TEAL2  = "#09A89A";
const CORAL  = "#F47355";
const CREAM  = "#FAF7F2";
const INK    = "#141422";
const INK2   = "#3A3A55";

const LS_KEY = "hui_welcome_seen";

function hasSeenWelcome() {
  try { return localStorage.getItem(LS_KEY) === "true"; } catch { return false; }
}
function markWelcomeSeen() {
  try { localStorage.setItem(LS_KEY, "true"); } catch {}
}

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

// ── Haupt-Komponente ─────────────────────────────────────────────
export default function WelcomeOverlay({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Einblenden nach kurzem Delay (sanfter Einstieg)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleDiscover() {
    setClosing(true);
    markWelcomeSeen();
    setTimeout(() => { onDone?.(); }, 420);
  }

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
          padding:        "16px 16px 0",
        }}
      >
        {/* ── Card ───────────────────────────────────────────────── */}
        <div
          className={`hui-welcome-card${closing ? " closing" : ""}`}
          style={{
            position:        "relative",
            width:           "100%",
            maxWidth:        420,
            maxHeight:       "calc(100dvh - 16px)",
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
            className="hui-welcome-scroll"
            style={{
              flex:       1,
              overflowY:  "auto",
              overflowX:  "hidden",
              position:   "relative",
              zIndex:     1,
              padding:    "36px 24px 24px",
            }}
          >
            {/* ── Logo + Headline ─────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img
                src="/hui-logo-app.png"
                alt="HUI Logo"
                draggable={false}
                style={{
                  height:       90,
                  width:        "auto",
                  objectFit:    "contain",
                  display:      "block",
                  margin:       "0 auto 16px",
                  userSelect:   "none",
                }}
              />
              <h1 style={{
                margin:       0,
                fontSize:     26,
                fontWeight:   800,
                color:        INK,
                letterSpacing: "-0.025em",
                lineHeight:    1.2,
              }}>
                Willkommen bei{" "}
                <span style={{ color: TEAL }}>HUI</span>
              </h1>

              {/* Dezenter Divider mit Blatt */}
              <div style={{
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                gap:        8,
                margin:     "14px 0 0",
              }}>
                <div style={{ height: 1, width: 48, background: "rgba(13,196,181,0.22)", borderRadius: 1 }} />
                <span style={{ fontSize: 14, lineHeight: 1 }}>🌿</span>
                <div style={{ height: 1, width: 48, background: "rgba(13,196,181,0.22)", borderRadius: 1 }} />
              </div>
            </div>

            {/* ── Einleitungstext ──────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <p style={{
                margin:     "0 0 8px",
                fontSize:   15,
                fontWeight: 700,
                color:      INK,
                letterSpacing: "-0.01em",
              }}>
                Schön, dass du da bist.
              </p>
              <p style={{
                margin:       0,
                fontSize:     14,
                color:        INK2,
                lineHeight:   1.65,
                letterSpacing: "-0.006em",
                maxWidth:     300,
                margin:       "0 auto",
              }}>
                HUI ist ein Ort für Menschen, die gemeinsam Werte schaffen,
                Talente entdecken und echte Verbindungen aufbauen möchten.
              </p>
            </div>

            {/* ── Feature-Liste ─────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="hui-welcome-feature"
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           14,
                    padding:       "12px 14px",
                    borderRadius:  16,
                    background:    "rgba(250,247,242,0.9)",
                    border:        "1px solid rgba(13,196,181,0.10)",
                    transition:    "background 0.2s",
                    cursor:        "default",
                  }}
                >
                  {/* Icon-Badge */}
                  <div style={{
                    width:         44,
                    height:        44,
                    borderRadius:  12,
                    background:    f.bg,
                    display:       "flex",
                    alignItems:    "center",
                    justifyContent:"center",
                    fontSize:      22,
                    flexShrink:    0,
                  }}>
                    {f.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize:      14,
                      fontWeight:    700,
                      color:         INK,
                      letterSpacing: "-0.01em",
                      marginBottom:  2,
                    }}>
                      {f.title}
                    </div>
                    <div style={{
                      fontSize:  12,
                      color:     "rgba(58,58,85,0.65)",
                      lineHeight: 1.4,
                    }}>
                      {f.sub}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{
                    fontSize:  13,
                    color:     "rgba(13,196,181,0.50)",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}>
                    ›
                  </div>
                </div>
              ))}
            </div>

            {/* ── Abschluss-Zitat ──────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 18, marginBottom: 8, opacity: 0.6 }}>♡</div>
              <p style={{
                margin:       0,
                fontSize:     13,
                color:        "rgba(58,58,85,0.55)",
                lineHeight:   1.6,
                letterSpacing: "-0.005em",
              }}>
                Jede Begegnung kann etwas verändern.
              </p>
              <p style={{
                margin:       "2px 0 0",
                fontSize:     14,
                fontWeight:   600,
                color:        TEAL2,
                letterSpacing: "-0.008em",
              }}>
                Vielleicht beginnt deine genau heute.{" "}
                <span style={{ fontSize: 13 }}>🌿</span>
              </p>
            </div>
          </div>

          {/* ── Sticky Button ────────────────────────────────────── */}
          <div style={{
            position:   "relative",
            zIndex:     2,
            padding:    "16px 24px 32px",
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
                padding:        "16px 24px",
                borderRadius:   18,
                border:         "none",
                background:     `linear-gradient(135deg, ${TEAL} 0%, ${TEAL2} 100%)`,
                color:          "#fff",
                fontSize:       16,
                fontWeight:     700,
                letterSpacing:  "-0.01em",
                cursor:         "pointer",
                transition:     "transform 0.18s ease, opacity 0.18s ease",
                touchAction:    "manipulation",
                boxShadow:      `0 4px 20px rgba(13,196,181,0.38), 0 1px 4px rgba(13,196,181,0.22)`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 17 }}>✨</span>
              HUI entdecken
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Hook für Nutzung in App.jsx ─────────────────────────────────
export function useWelcomeOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Kurzes Delay: Auth muss sicher geladen sein
    const t = setTimeout(() => {
      if (!hasSeenWelcome()) setShow(true);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  function dismiss() { setShow(false); }

  return { show, dismiss };
}
