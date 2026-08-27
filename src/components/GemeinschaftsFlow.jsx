// ══════════════════════════════════════════════════════════════
// GemeinschaftsFlow.jsx — HUI Gemeinschaftsmitgliedschaft v1
// Aktiviert das Talent-/Wirkerprofil eines bestehenden Basis-Nutzers.
// KEIN neues Profil. KEIN neues Konto. Nur Aktivierung.
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation.js";
import { useAuth } from "../lib/AuthContext.jsx";

// ── Design Tokens ──────────────────────────────────────────────
const T = {
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  tealGlow: "rgba(14,196,184,0.28)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  cream:    "#F7F5F0",
  white:    "#FFFFFF",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.14)",
  green:    "#22C55E",
  greenSoft:"rgba(34,197,94,0.12)",
  card:     "0 2px 16px rgba(26,26,24,0.08), 0 1px 4px rgba(26,26,24,0.04)",
  r16: 16, r20: 20, r24: 24, r99: 99,
  px: 20,
};

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
  @keyframes gf-fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes gf-scale-in {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes gf-pulse {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.04); }
  }
  .gf-root {
    position:fixed; inset:0; z-index:19999;
    background:rgba(26,26,24,0.55);
    display:flex; align-items:flex-end; justify-content:center;
    -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
  }
  .gf-sheet {
    width:100%; max-width:480px;
    background:${T.cream};
    border-radius:28px 28px 0 0;
    overflow:hidden;
    animation: gf-scale-in .32s cubic-bezier(.22,1,.36,1) both;
    max-height:calc(92dvh - max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px));
    display:flex; flex-direction:column;
    margin-bottom:max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px);
    padding-bottom: 72px;
  }
  .gf-scroll {
    flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .gf-scroll::-webkit-scrollbar { display:none; }
  .gf-btn-primary {
    width:100%; padding:18px 24px;
    background:linear-gradient(135deg,${T.teal},#0AADA3);
    color:#fff; border:none; border-radius:${T.r99}px;
    font-size:17px; font-weight:600; letter-spacing:0.01em;
    cursor:pointer; font-family:inherit;
    box-shadow:0 4px 18px ${T.tealGlow};
    touch-action:manipulation;
    transition:transform .15s, box-shadow .15s;
  }
  .gf-btn-primary:active { transform:scale(.97); box-shadow:none; }
  .gf-btn-primary:disabled {
    background:rgba(26,26,24,0.12); color:rgba(26,26,24,0.32);
    box-shadow:none; cursor:not-allowed;
  }
  .gf-btn-secondary {
    padding:14px 24px;
    background:transparent; color:${T.inkSoft};
    border:none; border-radius:${T.r99}px;
    font-size:15px; font-weight:600;
    cursor:pointer; font-family:inherit;
    touch-action:manipulation;
    transition:color .15s;
  }
  .gf-btn-secondary:active { color:${T.ink}; }
  .gf-check-row {
    display:flex; align-items:flex-start; gap:14px;
    padding:14px 0; border-bottom:1px solid ${T.border};
  }
  .gf-check-row:last-child { border-bottom:none; }
  .gf-checkbox {
    width:22px; height:22px; border-radius:6px; flex-shrink:0;
    border:2px solid ${T.borderMid}; background:${T.white};
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; margin-top:1px;
    transition:border-color .15s, background .15s;
  }
  .gf-checkbox.checked {
    background:${T.teal}; border-color:${T.teal};
  }
  .gf-feature-row {
    display:flex; align-items:center; gap:12px;
    padding:10px 0;
  }
`;

// ── Illustrationen (SVG-basiert, warm & human) ─────────────────

function IlluWelcome() {
  return (
    <div style={{ textAlign:"center", margin:"8px 0 4px", userSelect:"none" }}>
      <span style={{ fontSize:88, lineHeight:1, display:"block" }}>🌍</span>
      <div style={{
        width:72, height:4, borderRadius:99,
        background:`linear-gradient(90deg,${T.teal},rgba(14,196,184,0))`,
        margin:"12px auto 0",
      }}/>
    </div>
  );
}

function IlluBeitrag() {
  return (
    <div style={{ textAlign:"center", margin:"8px 0 4px", userSelect:"none" }}>
      <span style={{ fontSize:88, lineHeight:1, display:"block" }}>✨</span>
      <div style={{
        width:72, height:4, borderRadius:99,
        background:`linear-gradient(90deg,rgba(245,166,35,0),rgba(245,166,35,1),rgba(245,166,35,0))`,
        margin:"12px auto 0",
      }}/>
    </div>
  );
}

function IlluWirkung() {
  return (
    <div style={{ textAlign:"center", margin:"8px 0 4px", userSelect:"none" }}>
      <span style={{ fontSize:88, lineHeight:1, display:"block" }}>🤝</span>
      <div style={{
        width:72, height:4, borderRadius:99,
        background:`linear-gradient(90deg,${T.teal},rgba(14,196,184,0))`,
        margin:"12px auto 0",
      }}/>
    </div>
  );
}

// ── Dot-Stepper ────────────────────────────────────────────────
function Stepper({ step, total }) {
  return (
    <div style={{ display:"flex", gap:7, justifyContent:"center", paddingTop:20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 24 : 7,
          height: 7, borderRadius: 99,
          background: i <= step
            ? `linear-gradient(90deg,${T.teal},#0AADA3)`
            : "rgba(26,26,24,0.12)",
          transition:"all .35s cubic-bezier(.34,1.4,.64,1)",
        }}/>
      ))}
    </div>
  );
}

// ── Schritt 1: Willkommen ──────────────────────────────────────
function Step1({ onNext, onClose }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding:`24px ${T.px}px 32px`, animation:"gf-fade-up .38s both" }}>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
        <button onClick={onClose} className="gf-btn-secondary" style={{ padding:"6px 12px", fontSize:13 }}>
          {t("gf.close")}
        </button>
      </div>
      <Stepper step={0} total={4}/>
      <div style={{ textAlign:"center", marginTop:28 }}>
        <IlluWelcome/>
        <h2 style={{
          fontSize:26, fontWeight: 600, color:T.ink,
          letterSpacing:"-0.03em", lineHeight:1.2,
          margin:"20px 0 16px",
        }}>
          {t("gf.s1.title")}
        </h2>
        <p style={{
          fontSize:16, lineHeight:1.75, color:T.inkSoft,
          margin:0, maxWidth:300, marginLeft:"auto", marginRight:"auto",
        }}>
          {t("gf.s1.body")}
        </p>
      </div>
      <div style={{ marginTop:36 }}>
        <button className="gf-btn-primary" onClick={onNext}>
          {t("gf.next")}
        </button>
      </div>
    </div>
  );
}

// ── Schritt 2: Dein Beitrag ────────────────────────────────────
function Step2({ onNext, onBack }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding:`24px ${T.px}px 32px`, animation:"gf-fade-up .38s both" }}>
      <Stepper step={1} total={4}/>
      <div style={{ textAlign:"center", marginTop:28 }}>
        <IlluBeitrag/>
        <h2 style={{
          fontSize:26, fontWeight: 600, color:T.ink,
          letterSpacing:"-0.03em", lineHeight:1.2,
          margin:"20px 0 16px",
        }}>
          {t("gf.s2.title")}
        </h2>
        <p style={{
          fontSize:16, lineHeight:1.75, color:T.inkSoft,
          margin:0, maxWidth:300, marginLeft:"auto", marginRight:"auto",
        }}>
          {t("gf.s2.body")}
        </p>
        <p style={{
          fontSize:16, lineHeight:1.75,
          color:T.teal, fontWeight: 600,
          margin:"16px auto 0", maxWidth:280,
        }}>
          {t("gf.s2.highlight")}
        </p>
      </div>
      <div style={{ marginTop:36, display:"flex", flexDirection:"column", gap:10 }}>
        <button className="gf-btn-primary" onClick={onNext}>
          {t("gf.next")}
        </button>
        <button className="gf-btn-secondary" onClick={onBack} style={{ textAlign:"center" }}>
          {t("gf.back")}
        </button>
      </div>
    </div>
  );
}

// ── Schritt 3: Gemeinsam Wirkung ───────────────────────────────
function getFeatures(t) {
  return [
  { icon:"🌟", label:t("gf.feat.talents") },
  { icon:"🎨", label:t("gf.feat.werke") },
  { icon:"✨", label:t("gf.feat.erlebnisse") },
  { icon:"🤝", label:t("gf.feat.verbinden") },
  { icon:"💚", label:t("gf.feat.projekte") },
  { icon:"🌱", label:t("gf.feat.gemeinschaft") },
  ];
}

function Step3({ onNext, onBack }) {
  const { t } = useTranslation();
  const FEATURES = getFeatures(t);
  return (
    <div style={{ padding:`24px ${T.px}px 32px`, animation:"gf-fade-up .38s both" }}>
      <Stepper step={2} total={4}/>
      <div style={{ textAlign:"center", marginTop:28 }}>
        <IlluWirkung/>
        <h2 style={{
          fontSize:26, fontWeight: 600, color:T.ink,
          letterSpacing:"-0.03em", lineHeight:1.2,
          margin:"20px 0 20px",
        }}>
          {t("gf.s3.title")}
        </h2>
      </div>
      <div style={{ margin:"0 0 20px" }}>
        {FEATURES.map((f, i) => (
          <div key={i} className="gf-feature-row">
            <span style={{
              width:36, height:36, borderRadius:12,
              background:T.tealSoft, display:"flex",
              alignItems:"center", justifyContent:"center",
              fontSize:18, flexShrink:0,
            }}>{f.icon}</span>
            <span style={{ fontSize:15.5, color:T.ink, fontWeight:600, lineHeight:1.4 }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      <p style={{
        fontSize:14.5, lineHeight:1.72, color:T.inkSoft,
        margin:"0 0 28px", textAlign:"center",
        fontStyle:"italic",
      }}>
        Du wirst Teil einer Gemeinschaft,<br/>
        die auf Vertrauen, Respekt,<br/>
        Verantwortung und gemeinsames Wachstum setzt.
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button className="gf-btn-primary" onClick={onNext}>
          {t("gf.next")}
        </button>
        <button className="gf-btn-secondary" onClick={onBack} style={{ textAlign:"center" }}>
          {t("gf.back")}
        </button>
      </div>
    </div>
  );
}

// ── Schritt 4: Bestätigung ────────────────────────────────────
function getChecks(t) {
  return [
  { id:"rules",    label:t("gf.s4.check.rules.pre"), link:t("gf.s4.check.rules.link"), suffix:t("gf.s4.check.rules.suffix") },
  { id:"privacy",  label:t("gf.s4.check.privacy.pre"), link:t("gf.s4.check.privacy.link"), suffix:t("gf.s4.check.privacy.suffix") },
  { id:"terms",    label:t("gf.s4.check.terms.pre"), link:t("gf.s4.check.terms.link"), suffix:t("gf.s4.check.terms.suffix") },
  { id:"intent",   label:t("gf.s4.check.intent"), link:null, suffix:null },
  ];
}

function Step4({ onBack, onConfirm, loading }) {
  const { t } = useTranslation();
  const CHECKS = getChecks(t);
  const [checked, setChecked] = useState({ rules:false, privacy:false, terms:false, intent:false });
  const allChecked = Object.values(checked).every(Boolean);

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ padding:`24px ${T.px}px 32px`, animation:"gf-fade-up .38s both" }}>
      <Stepper step={3} total={4}/>
      <div style={{ textAlign:"center", marginTop:24, marginBottom:24 }}>
        <h2 style={{
          fontSize:24, fontWeight: 600, color:T.ink,
          letterSpacing:"-0.03em", lineHeight:1.2,
          margin:"0 0 8px",
        }}>
          {t("gf.s4.title")}
        </h2>
        <p style={{ fontSize:13.5, color:T.inkFaint, margin:0 }}>
          {t("gf.s4.sub")}
        </p>
      </div>

      <div style={{
        background:T.white, borderRadius:T.r20,
        padding:"4px 16px 4px",
        boxShadow:T.card,
        marginBottom:24,
      }}>
        {CHECKS.map(ck => (
          <div key={ck.id} className="gf-check-row" onClick={() => toggle(ck.id)} role="button" tabIndex={0}>
            <div className={`gf-checkbox ${checked[ck.id] ? "checked" : ""}`}>
              {checked[ck.id] && (
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                  <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <p style={{
              margin:0, fontSize:14.5, lineHeight:1.6, color:T.ink,
              cursor:"pointer", userSelect:"none",
            }}>
              {ck.label}
              {ck.link && (
                <span style={{ color:T.teal, fontWeight:600 }}>{ck.link}</span>
              )}
              {ck.suffix}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontSize:12, color:T.inkFaint, textAlign:"center", margin:"0 0 20px" }}>
        {t("gf.s4.docs")}
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button
          className="gf-btn-primary"
          onClick={onConfirm}
          disabled={!allChecked || loading}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
        >
          {loading ? (
            <span style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {t("gf.s4.activating")}
            </span>
          ) : t("gf.s4.confirm")}
        </button>
        {!loading && (
          <button className="gf-btn-secondary" onClick={onBack} style={{ textAlign:"center" }}>
            {t("gf.back")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Erfolgsseite ───────────────────────────────────────────────
function StepSuccess({ onOpenProfile }) {
  const { t } = useTranslation();
  return (
    <div style={{
      padding:`40px ${T.px}px 40px`,
      textAlign:"center",
      animation:"gf-fade-up .42s both",
    }}>
      <div style={{
        width:80, height:80, borderRadius:"50%",
        background:T.greenSoft,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 20px",
        animation:"gf-pulse 2s ease-in-out infinite",
      }}>
        <span style={{ fontSize:42, lineHeight:1 }}>🎉</span>
      </div>
      <h2 style={{
        fontSize:24, fontWeight: 600, color:T.ink,
        letterSpacing:"-0.03em", lineHeight:1.25,
        margin:"0 0 16px",
      }}>
        {t("gf.success.title")}
      </h2>
      <p style={{
        fontSize:15.5, lineHeight:1.75, color:T.inkSoft,
        margin:"0 0 32px", maxWidth:300,
        marginLeft:"auto", marginRight:"auto",
      }}>
        {t("gf.success.body")}
      </p>
      <button className="gf-btn-primary" onClick={onOpenProfile}>
        {t("gf.success.openProfile")}
      </button>
    </div>
  );
}

// ── Haupt-Flow (gesteuert über step 0–4) ──────────────────────
export default function GemeinschaftsFlow({ onClose, onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { activateMembership, refreshProfile } = useAuth();

  const next = useCallback(() => setStep(s => s + 1), []);
  const back = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  const handleConfirm = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await activateMembership?.();
      if (result?.error) {
        setError(t("gf.error.activation"));
        setLoading(false);
        return;
      }
      await refreshProfile?.().catch(() => {});
      setStep(4); // Erfolgsseite
    } catch (e) {
      setError(t("gf.error.connection"));
    } finally {
      setLoading(false);
    }
  }, [loading, activateMembership, refreshProfile]);

  const handleOpenProfile = useCallback(() => {
    onComplete?.();
    onClose?.();
  }, [onComplete, onClose]);

  return (
    <div className="gf-root" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }} role="button" tabIndex={0}>
      <style>{CSS}</style>
      <div className="gf-sheet">
        <div className="gf-scroll">
          {step === 0 && <Step1 onNext={next} onClose={onClose}/>}
          {step === 1 && <Step2 onNext={next} onBack={back}/>}
          {step === 2 && <Step3 onNext={next} onBack={back}/>}
          {step === 3 && <Step4 onBack={back} onConfirm={handleConfirm} loading={loading}/>}
          {step === 4 && <StepSuccess onOpenProfile={handleOpenProfile}/>}

          {error && (
            <div style={{
              margin:`0 ${T.px}px 16px`,
              padding:"12px 16px",
              background:"rgba(239,68,68,0.08)",
              border:"1px solid rgba(239,68,68,0.2)",
              borderRadius:12,
              fontSize:14, color:"#DC2626",
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
