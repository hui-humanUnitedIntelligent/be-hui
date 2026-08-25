// src/components/profile/my-basis/Misc.jsx
// GemeinschaftsKarte, TalentWerdenBanner, TalentOnboardingModal
// Extracted from MyBasisProfile.jsx — no logic changes.
import React from "react";
import { createPortal } from "react-dom";
import TalentOnboarding from "../../TalentOnboarding.jsx";

export function GemeinschaftsKarte({ onJoin }) {
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
          Werde Teil der<br/>HUI-Gemeinschaft ✨
        </h3>

        <p style={{
          fontSize:14, lineHeight:1.72, color:"rgba(26,26,24,0.58)",
          margin:"0 0 20px",
        }}>
          Jeder Mensch trägt etwas Wertvolles in sich.
          Teile deine Talente, Ideen, Werke und Erfahrungen mit anderen
          und gestalte gemeinsam eine bessere Welt.
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
          <span className="hui-emoji">🤝</span> Der Gemeinschaft beitreten
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
              Dein nächster Schritt
            </div>
            <div style={{
              fontSize: 17, fontWeight: 600, color: '#1A1A18',
              lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Werde HUI-Talent
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(26,26,24,0.58)',
              lineHeight: 1.65, marginBottom: 16,
            }}>
              Teile dein Talent, biete Dienstleistungen an und verdiene
              mit dem was du liebst — in 3 einfachen Schritten.
            </div>

            {/* Feature-Punkte */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              {[
                { icon: '🎯', text: 'Eigenes Talent-Profil erstellen' },
                { icon: '💼', text: 'Dienstleistungen & Angebote anbieten' },
                { icon: '💰', text: '80% der Einnahmen direkt erhalten' },
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
              Jetzt Talent werden
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
