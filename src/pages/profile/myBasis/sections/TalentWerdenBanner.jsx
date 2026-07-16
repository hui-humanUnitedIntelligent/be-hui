import React from "react";
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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
          {/* Icon */}
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #FF8A6B, #FF6B47)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 14px rgba(255,138,107,0.30)',
          }}>✦</div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#FF8A6B',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
            }}>
              Dein nächster Schritt
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: '#1A1A18',
              lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Werde HUI-Talent ✨
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(26,26,24,0.58)',
              lineHeight: 1.65, marginBottom: 16,
            }}>
              Teile dein Talent, biete Dienstleistungen an und verdiene
              mit dem was du liebst — in 3 einfachen Schritten.
            </div>

            {/* Feature-Punkte */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {[
                { icon: '🎯', text: 'Eigenes Talent-Profil erstellen' },
                { icon: '💼', text: 'Dienstleistungen & Angebote anbieten' },
                { icon: '💰', text: '80% der Einnahmen direkt erhalten' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(26,26,24,0.72)' }}>
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
                fontSize: 15, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,138,107,0.35)',
                touchAction: 'manipulation',
                width: '100%', justifyContent: 'center',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✦ Jetzt Talent werden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
