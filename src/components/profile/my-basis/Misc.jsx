// src/components/profile/my-basis/Misc.jsx
// GemeinschaftsKarte, TalentWerdenBanner, TalentOnboardingModal
// Extracted from MyBasisProfile.jsx — no logic changes.
import React from "react";
import { createPortal } from "react-dom";
import TalentOnboarding from "../../TalentOnboarding.jsx";
import { useTranslation } from "../../../hooks/useTranslation.js";

export function GemeinschaftsKarte({ onJoin }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding:`0 20px` }}>
      <div style={{
        background:"linear-gradient(140deg,#F0FDFB 0%,#E8FAF8 60%,#F5FCF5 100%)",
        border:"1.5px solid rgba(14,196,184,0.20)",
        borderRadius:20,
        padding:"24px 20px 20px",
        boxShadow:"0 2px 16px rgba(14,196,184,0.10)",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Deko-Glow hinten */}
        <div style={{
          position:"absolute", right:-20, top:-20,
          width:120, height:120, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(14,196,184,0.12),transparent 70%)",
          pointerEvents:"none",
        }}/>

        <h3 style={{
          fontSize:22, fontWeight: 600, color:"#1A1A18",
          letterSpacing:"-0.03em", lineHeight:1.25,
          margin:"0 0 10px",
        }}>
          {t("community.title")}
        </h3>

        <p style={{
          fontSize:14, lineHeight:1.72, color:"#55556B",
          margin:"0 0 20px",
        }}>
          {t("community.body")}
        </p>

        <button
          onClick={onJoin}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"14px 22px",
            background:"linear-gradient(135deg,#0EC4B8,#0AADA3)",
            color:"#fff", border:"none", borderRadius:99,
            fontSize:15, fontWeight: 600,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px rgba(14,196,184,0.30)",
            touchAction:"manipulation",
            transition:"transform .15s, box-shadow .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
          onTouchStart={e => { e.currentTarget.style.transform="scale(0.97)"; }}
          onTouchEnd={e => { e.currentTarget.style.transform="scale(1)"; }}
        >
          <span className="hui-emoji">🤝</span> {t("community.joinButton")}
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// TALENT WERDEN BANNER
// Einladungskarte für Basis-User — direkt unter "Über mich"
// Öffnet den TalentOnboarding-Flow (3 Schritte, setzt is_talent=true)
// ══════════════════════════════════════════════════════════════
export function TalentWerdenBanner({ onStart = () => {} }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFF3EE 50%, #F0FDFB 100%)',
        border: '1.5px solid rgba(255,138,107,0.22)',
        borderRadius: 20,
        padding: '22px 20px 20px',
        boxShadow: '0 2px 20px rgba(255,138,107,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Deko-Blur */}
        <div style={{
          position: 'absolute', right: -16, top: -16,
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,138,107,0.12),transparent 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', left: -10, bottom: -10,
          width: 70, height: 70, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(22,215,197,0.10),transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ width: '100%' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#FF8A6B',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
            }}>
              {t("talentBanner.nextStep")}
            </div>
            <div style={{
              fontSize: 17, fontWeight: 600, color: '#1A1A18',
              lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              {t("talentBanner.title")}
            </div>
            <div style={{
              fontSize: 13, color: '#55556B',
              lineHeight: 1.65, marginBottom: 16,
            }}>
              {t("talentBanner.body")}
            </div>

            {/* Feature-Punkte */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              {[
                { icon: '🎯', text: t("talentBanner.feature1") },
                { icon: '💼', text: t("talentBanner.feature2") },
                { icon: '💰', text: t("talentBanner.feature3") },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'rgba(26,26,24,0.72)' }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 24px',
                background: 'linear-gradient(135deg, #FF8A6B, #FF6B47)',
                color: '#fff', border: 'none', borderRadius: 99,
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,138,107,0.35)',
                touchAction: 'manipulation',
                width: '100%', justifyContent: 'center',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {t("talentBanner.cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT ONBOARDING MODAL WRAPPER
// Lädt TalentOnboarding (aus Home.jsx bekannt) lazy,
// wrapped in createPortal + zIndex:10500 (Pflicht-Regel)
// ══════════════════════════════════════════════════════════════
// TalentOnboarding wird jetzt eager importiert (siehe Import-Block oben) — kein React.lazy mehr, um den Suspense-fallback={null}-Hang-Bug zu vermeiden (analog zu MyRecommendationsModal/ImpactStimmenModal).


export function TalentOnboardingModal({ onClose = () => {}, onSuccess = () => {} }) {
  return createPortal(
      <TalentOnboarding
        onClose={onClose}
        onActivate={onSuccess}
      />,
    document.body
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT INTRO MODAL (ORB-REWIRE, 2026-09-15)
// Basis-User tippt den Nav-Orb → dieses Modal zeigt das IDENTISCHE
// TalentWerdenBanner-Modul wie im Nutzerbereich „Basisnutzer"
// (MyBasisProfile) — kein Neubau, kein abweichender Text. Der
// Banner-CTA („Jetzt Talent werden") startet onStart → TalentOnboarding.
// createPortal + zIndex 10500 (Pflicht-Regel footer-navbar-zindex).
// ══════════════════════════════════════════════════════════════
export function TalentIntroModal({ onStart = () => {}, onClose = () => {} }) {
  const { t } = useTranslation();
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(15,15,25,0.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        paddingTop: "max(24px, var(--hui-safe-top, 0px), env(safe-area-inset-top, 0px))",
        paddingBottom: "max(20px, var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          position: "relative",
          animation: "cts-intro-up 0.32s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <style>{`@keyframes cts-intro-up { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:none} }`}</style>
        {/* Close — absolute oben rechts, 10px Sicherheitsabstand zum Rand */}
        <button
          onClick={onClose}
          aria-label={t("cts.close")}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.06)",
            border: "none",
            borderRadius: 50,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            color: "#55556B",
            zIndex: 2,
          }}
        >×</button>
        {/* Identisches TalentWerdenBanner-Modul wie im Nutzerbereich */}
        <div style={{ paddingTop: 6 }}>
          <TalentWerdenBanner onStart={onStart} />
        </div>
      </div>
    </div>,
    document.body
  );
}
