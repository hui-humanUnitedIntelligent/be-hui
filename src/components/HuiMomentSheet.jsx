// src/components/HuiMomentSheet.jsx
// HUI-Moment teilen — Bottom Sheet
// Referenz: Screenshot 29.05.2026
// Orb bleibt im Hintergrund, Sheet fährt von unten hoch.
// KEINE Kategorien, KEINE Tags, KEINE Formulare — nur Moment.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Design ───────────────────────────────────────────────────────
const D = {
  teal:      "#0EC4B8",
  tealDeep:  "#0A9E94",
  coral:     "#E8573A",
  ink:       "#1A3530",
  inkSoft:   "rgba(26,53,48,0.55)",
  inkFaint:  "rgba(26,53,48,0.32)",
  border:    "rgba(26,53,48,0.08)",
  white:     "#FFFFFF",
  sheet:     "rgba(252,253,252,0.97)",
};

// ── Action card definitions ───────────────────────────────────────
// Exactly from screenshot: icon, label, sublabel, accent color
const ACTIONS = [
  {
    id:       "foto",
    icon:     "📷",
    label:    "Foto aufnehmen",
    sub:      "Kamera öffnen",
    bgLight:  "rgba(34,168,68,0.10)",
    iconBg:   "rgba(34,168,68,0.14)",
    iconColor:"#22A844",
    capture:  "environment",
    accept:   "image/*",
  },
  {
    id:       "video",
    icon:     "🎥",
    label:    "Video aufnehmen",
    sub:      "Video starten",
    bgLight:  "rgba(232,87,58,0.09)",
    iconBg:   "rgba(232,87,58,0.13)",
    iconColor:"#E8573A",
    capture:  "environment",
    accept:   "video/*",
  },
  {
    id:       "galerie",
    icon:     "🖼️",
    label:    "Aus Galerie wählen",
    sub:      "Foto oder Video",
    bgLight:  "rgba(142,68,200,0.09)",
    iconBg:   "rgba(142,68,200,0.13)",
    iconColor:"#8E44C8",
    capture:  null,
    accept:   "image/*,video/*",
  },
  {
    id:       "gedanke",
    icon:     "✍️",
    label:    "Gedanken schreiben",
    sub:      "Text teilen",
    bgLight:  "rgba(224,152,40,0.09)",
    iconBg:   "rgba(224,152,40,0.13)",
    iconColor:"#E09828",
    capture:  null,
    accept:   null,
  },
];

// ── CSS ───────────────────────────────────────────────────────────
const CSS = `
  @keyframes hms-overlay-in  { from{opacity:0} to{opacity:1} }
  @keyframes hms-overlay-out { from{opacity:1} to{opacity:0} }
  @keyframes hms-sheet-in    {
    from { transform:translateY(100%) }
    to   { transform:translateY(0) }
  }
  @keyframes hms-sheet-out   {
    from { transform:translateY(0) }
    to   { transform:translateY(100%) }
  }
  @keyframes hms-content-in  {
    from { opacity:0; transform:translateY(12px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes hms-card-in {
    from { opacity:0; transform:translateY(16px) scale(0.96) }
    to   { opacity:1; transform:translateY(0) scale(1) }
  }
  @keyframes hms-success {
    0%   { transform:scale(0.7); opacity:0 }
    60%  { transform:scale(1.06) }
    100% { transform:scale(1); opacity:1 }
  }
  @keyframes hms-spin {
    from { transform:rotate(0deg) }
    to   { transform:rotate(360deg) }
  }
  @keyframes hms-textarea-in {
    from { opacity:0; max-height:0; transform:translateY(-8px) }
    to   { opacity:1; max-height:220px; transform:translateY(0) }
  }

  .hms-card {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform .15s cubic-bezier(.22,1,.36,1),
                box-shadow .15s ease,
                background .15s ease;
  }
  .hms-card:hover  { transform: translateY(-2px); }
  .hms-card:active { transform: scale(0.93) !important; opacity: 0.82; }

  .hms-cancel {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: opacity .14s ease;
  }
  .hms-cancel:active { opacity: 0.45; }

  .hms-share-btn {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform .14s ease, opacity .14s ease, box-shadow .14s ease;
  }
  .hms-share-btn:active { transform: scale(0.95); opacity: 0.88; }
`;

// ── Action Card ───────────────────────────────────────────────────
function ActionCard({ action, onSelect, delay }) {
  return (
    <div
      className="hms-card"
      onClick={() => onSelect(action)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        background: action.bgLight,
        borderRadius: 20,
        padding: "22px 10px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        border: `1.5px solid rgba(26,53,48,0.07)`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        animation: `hms-card-in .40s cubic-bezier(.34,1.56,.64,1) ${delay}ms both`,
        userSelect: "none",
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 58, height: 58,
        borderRadius: "50%",
        background: action.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
        boxShadow: `0 3px 14px ${action.iconBg}`,
      }}>
        {action.icon}
      </div>

      {/* Labels */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 13.5, fontWeight: 800, color: D.ink,
          letterSpacing: "-0.02em", lineHeight: 1.25,
          marginBottom: 4,
        }}>
          {action.label}
        </div>
        <div style={{
          fontSize: 12, color: D.inkSoft, fontWeight: 400, lineHeight: 1.3,
        }}>
          {action.sub}
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      border: `2.5px solid rgba(255,255,255,0.35)`,
      borderTopColor: "white",
      animation: "hms-spin .7s linear infinite",
      display: "inline-block",
    }}/>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function HuiMomentSheet({ visible, onClose }) {
  const [phase,    setPhase]    = useState("hidden"); // hidden | open | gedanke | sharing | done | closing
  const [text,     setText]     = useState("");
  const fotoRef                 = useRef(null);   // camera → image
  const videoRef                = useRef(null);   // camera → video
  const galerieRef              = useRef(null);   // gallery → any
  const textareaRef             = useRef(null);

  // ── Open / close lifecycle ──────────────────────────────────────
  useEffect(() => {
    if (visible  && phase === "hidden") { setPhase("open"); setText(""); }
    if (!visible && phase !== "hidden") setPhase("hidden");
  }, [visible]);

  const doClose = useCallback(() => {
    setPhase("closing");
    setTimeout(() => { setPhase("hidden"); onClose?.(); }, 300);
  }, [onClose]);

  // ── Focus textarea when gedanke opens ──────────────────────────
  useEffect(() => {
    if (phase === "gedanke") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [phase]);

  // ── Action selection ────────────────────────────────────────────
  const handleAction = useCallback((action) => {
    if (action.id === "gedanke")      { setPhase("gedanke"); return; }
    if (action.id === "foto")         { fotoRef.current?.click();    return; }
    if (action.id === "video")        { videoRef.current?.click();   return; }
    if (action.id === "galerie")      { galerieRef.current?.click(); return; }
  }, []);

  // ── File chosen → share ─────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await shareToSupabase({ type: file.type.startsWith("video") ? "video" : "foto", file });
    // Reset input
    e.target.value = "";
  }, []);

  // ── Share text moment ───────────────────────────────────────────
  const handleShareText = useCallback(async () => {
    if (!text.trim()) return;
    await shareToSupabase({ type: "gedanke", text: text.trim() });
  }, [text]);

  // ── Core: insert into Supabase stories ─────────────────────────
  async function shareToSupabase({ type, text: caption, file }) {
    setPhase("sharing");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("stories").insert({
          user_id:    user.id,
          type,
          caption:    caption || null,
          status:     "active",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (err) {
      console.warn("[HuiMoment]", err);
    }
    setPhase("done");
    setTimeout(() => doClose(), 1800);
  }

  if (phase === "hidden") return null;

  const isClosing = phase === "closing";
  const isDone    = phase === "done";
  const isSharing = phase === "sharing";
  const isGedanke = phase === "gedanke";
  const isOpen    = phase === "open";

  return (
    <>
      <style>{CSS}</style>

      {/* Three dedicated file inputs — each with fixed attributes on the DOM */}
      {/* Foto: camera opens directly (capture=environment + image/*) */}
      <input
        ref={fotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {/* Video: video camera opens directly (capture=environment + video/*) */}
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {/* Galerie: no capture attr → opens gallery/files picker directly */}
      <input
        ref={galerieRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* ── Overlay — sits above orb blur, below sheet ── */}
      <div
        onClick={doClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9300,
          background: "rgba(15,30,26,0.28)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: isClosing ? "hms-overlay-out .28s ease both" : "hms-overlay-in .22s ease both",
        }}
      />

      {/* ── Bottom Sheet ────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 9301,
          background: D.sheet,
          borderRadius: "28px 28px 0 0",
          padding: `0 0 max(32px,calc(24px + env(safe-area-inset-bottom,0px)))`,
          boxShadow: "0 -8px 48px rgba(15,30,26,0.18), 0 -2px 12px rgba(15,30,26,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          animation: isClosing
            ? "hms-sheet-out .28s cubic-bezier(.4,0,1,1) both"
            : "hms-sheet-in  .34s cubic-bezier(.22,1,.36,1) both",
          // Prevent going off screen on small phones
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Handle bar */}
        <div style={{
          display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 6,
        }}>
          <div style={{
            width: 38, height: 4, borderRadius: 99,
            background: "rgba(26,53,48,0.15)",
          }}/>
        </div>

        <div style={{ padding: "8px 20px 0" }}>

          {/* ── Header ────────────────────────────────────── */}
          <div style={{
            textAlign: "center", marginBottom: 24,
            animation: "hms-content-in .36s ease .08s both",
          }}>
            {/* ✦ sparkle + title — exactly from screenshot */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 7,
            }}>
              <span style={{
                fontSize: 18, color: D.teal,
                filter: "drop-shadow(0 0 4px rgba(14,196,184,0.55))",
              }}>✦</span>
              <h2 style={{
                fontSize: 21, fontWeight: 900, color: D.ink,
                letterSpacing: "-0.035em", margin: 0, lineHeight: 1.2,
              }}>
                HUI-Moment teilen
              </h2>
            </div>
            <p style={{
              fontSize: 14, color: D.inkSoft, margin: 0,
              fontWeight: 400, lineHeight: 1.5,
            }}>
              Teile einen echten Moment.
            </p>
          </div>

          {/* ════ SUCCESS STATE ══════════════════════════ */}
          {isDone && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 14, padding: "28px 0 40px",
              animation: "hms-success .45s cubic-bezier(.34,1.56,.64,1) both",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `linear-gradient(135deg, ${D.teal} 0%, ${D.tealDeep} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32,
                boxShadow: `0 8px 28px rgba(14,196,184,0.40)`,
              }}>✓</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: D.ink, marginBottom: 4 }}>
                  Moment geteilt!
                </div>
                <div style={{ fontSize: 13.5, color: D.inkSoft }}>
                  Verschwindet nach 24 Stunden.
                </div>
              </div>
            </div>
          )}

          {/* ════ SHARING SPINNER ═══════════════════════ */}
          {isSharing && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 16, padding: "32px 0 48px",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `linear-gradient(135deg, ${D.teal}, ${D.coral})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Spinner/>
              </div>
              <span style={{ fontSize: 14, color: D.inkSoft }}>Einen Moment…</span>
            </div>
          )}

          {/* ════ GEDANKE TEXT INPUT ════════════════════ */}
          {isGedanke && (
            <div style={{ animation: "hms-textarea-in .30s ease both", overflow: "hidden" }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value.slice(0, 300))}
                placeholder="Was bewegt dich gerade?&#10;&#10;Schreibe einen echten Gedanken…"
                style={{
                  width: "100%", minHeight: 130,
                  border: `1.5px solid rgba(14,196,184,0.30)`,
                  borderRadius: 18,
                  background: "rgba(14,196,184,0.05)",
                  padding: "16px 18px",
                  fontSize: 15.5, color: D.ink, lineHeight: 1.68,
                  resize: "none", outline: "none",
                  fontFamily: "-apple-system,'Georgia',serif",
                  fontStyle: "italic",
                  boxSizing: "border-box",
                  marginBottom: 12,
                }}
              />
              {text.length > 0 && (
                <div style={{
                  textAlign: "right", fontSize: 11.5, color: D.inkFaint, marginBottom: 14,
                }}>
                  {text.length} / 300
                </div>
              )}

              {/* Share button */}
              <button
                className="hms-share-btn"
                onClick={handleShareText}
                disabled={!text.trim()}
                style={{
                  width: "100%", padding: "16px",
                  borderRadius: 18, border: "none",
                  background: text.trim()
                    ? `linear-gradient(135deg, ${D.teal} 0%, ${D.tealDeep} 100%)`
                    : "rgba(26,53,48,0.08)",
                  color: text.trim() ? "white" : D.inkFaint,
                  fontSize: 15.5, fontWeight: 800,
                  letterSpacing: "-0.02em",
                  fontFamily: "inherit",
                  boxShadow: text.trim() ? `0 6px 24px rgba(14,196,184,0.38)` : "none",
                  transition: "all .20s ease",
                  marginBottom: 4,
                }}
              >
                Moment teilen
              </button>

              <button
                className="hms-cancel"
                onClick={() => setPhase("open")}
                style={{
                  width: "100%", padding: "13px",
                  background: "none", border: "none",
                  fontSize: 14, color: D.inkSoft, fontWeight: 500,
                  fontFamily: "inherit",
                  marginTop: 4,
                }}
              >
                ← Zurück
              </button>
            </div>
          )}

          {/* ════ ACTION CARDS GRID ═════════════════════ */}
          {isOpen && (
            <>
              {/* 4 cards — row on tablet (>=520px), 2x2 on phone */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 24,
                animation: "hms-content-in .32s ease .14s both",
              }}>
                {ACTIONS.map((action, i) => (
                  <div
                    key={action.id}
                    style={{
                      // 2x2 on small, 4-in-a-row on wide
                      flex: window.innerWidth >= 520 ? "1 1 0" : "1 1 calc(50% - 5px)",
                      minWidth: 0,
                    }}
                  >
                    <ActionCard
                      action={action}
                      onSelect={handleAction}
                      delay={i * 55 + 120}
                    />
                  </div>
                ))}
              </div>

              {/* Cancel */}
              <div style={{
                display: "flex", justifyContent: "center",
                paddingBottom: 4,
                animation: "hms-content-in .32s ease .36s both",
              }}>
                <button
                  className="hms-cancel"
                  onClick={doClose}
                  style={{
                    background: "none", border: "none",
                    display: "flex", alignItems: "center", gap: 7,
                    fontSize: 14.5, color: D.inkSoft, fontWeight: 500,
                    padding: "8px 20px",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 16 }}>×</span>
                  Abbrechen
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
