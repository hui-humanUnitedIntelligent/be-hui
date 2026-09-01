import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Capacitor } from '@capacitor/core'
import { platformPath } from '../lib/platform.js'

// ══════════════════════════════════════════════════════════════════════════════
// AuthCallback.jsx — Bestätigungslink-Verarbeitung (Web + Mobile)
// ══════════════════════════════════════════════════════════════════════════════
//
// WIRD AUFGERUFEN bei:
//   - /auth/callback?token_hash=...&type=signup (Mobile App Link / Desktop-Browser)
//   - /app/auth/callback?token_hash=...&type=signup (Web SPA direkt)
//
// SICHERHEITSFIX (2026-09-01, INC-003): Confirm-Links zeigen auf unsere eigene
// Domain (be-hui.vercel.app/auth/callback) statt auf Supabase /auth/v1/verify,
// damit Android App Links greifen (nur eigene Domain → Auto-Verify).
// Diese Seite verifiziert den Token client-seitig via supabase.auth.verifyOtp().
//
// WEB-FIX (2026-09-01): Desktop-Browser ohne installierte App landen hier
// statt auf 404. Nach Verifizierung wird zur Web-App auf www.be-hui.app
// weitergeleitet. Da localStorage per-Origin ist (Session auf be-hui.vercel.app
// ist nicht auf www.be-hui.app verfügbar), werden die Tokens im URL-Hash
// übergeben (#access_token=...&refresh_token=...). Der Supabase-Client auf
// www.be-hui.app hat detectSessionInUrl:true und stellt die Session automatisch
// wieder her — gleicher Mechanismus wie bei OAuth-Redirects.
//
// Fallback: Falls der Hash nicht erkannt wird (z.B. PKCE-Modus), landet der
// Nutzer auf www.be-hui.app/app/Home ohne Session → AuthContext leitet zum
// Login weiter. Kein White-Screen.
//
// Mobile (Android App Link): Unverändert. Capacitor.isNativePlatform() → /Home.
// ══════════════════════════════════════════════════════════════════════════════

const BG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85'

// Kanonische Web-App-Domain — Custom Domain in Vercel verifiziert
const WEB_APP_ORIGIN = 'https://www.be-hui.app'

export default function AuthCallback() {
  const [status, setStatus] = useState('checking') // 'checking' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const tokenHash = params.get('token_hash')
        const otpType = params.get('type')

        let session = null

        if (tokenHash && otpType) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          })
          if (verifyError) throw verifyError
          session = data?.session || null
        }

        // Fallback: alte Hash-basierte Flows (z.B. OAuth-Redirects)
        if (!session) {
          const { data: { session: hashSession } } = await supabase.auth.getSession()
          session = hashSession
        }

        if (session) {
          setStatus('success')
          setTimeout(() => {
            const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform?.()
            if (isNative) {
              // Mobile App: /Home (kein /app Prefix, gleiche Domain)
              try {
                const v = Date.now()
                window.location.replace(platformPath('/Home') + '?v=' + v)
              } catch (_) {
                window.location.href = platformPath('/Home')
              }
            } else {
              // Web-Browser: Redirect zu www.be-hui.app/app/Home
              // Session im URL-Hash übergeben (localStorage ist per-Origin)
              const accessToken = session.access_token || ''
              const refreshToken = session.refresh_token || ''
              const expiresIn = session.expires_in || 3600
              const tokenType = session.token_type || 'bearer'
              const otpTypeVal = otpType || 'signup'

              const hash = `#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&expires_in=${expiresIn}&token_type=${tokenType}&type=${otpTypeVal}`
              const v = Date.now()
              // FIX (2026-09-01, INC-004 Nebenfix): Query-Param MUSS vor dem Hash stehen —
              // vorher landete "&v=..." fälschlich IM Hash-Fragment (harmlos für Supabase's
              // URLSearchParams-Parsing, aber semantisch falsch für einen Cache-Buster).
              window.location.replace(`${WEB_APP_ORIGIN}/app/Home?v=${v}${hash}`)
            }
          }, 800)
        } else {
          setErrorMsg('Keine aktive Session gefunden.')
          setStatus('error')
        }
      } catch (err) {
        let msg = 'Der Bestätigungslink ist ungültig oder abgelaufen.'
        if (err?.message?.includes('expired')) {
          msg = 'Der Bestätigungslink ist abgelaufen.'
        } else if (err?.message?.includes('invalid') || err?.message?.includes('Token not found')) {
          msg = 'Der Bestätigungslink ist ungültig.'
        } else if (err?.message?.includes('already been used')) {
          msg = 'Dieser Link wurde bereits verwendet.'
        }
        setErrorMsg(msg)
        setStatus('error')
      }
    })()
  }, [])

  const handleRequestNewLink = () => {
    const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform?.()
    if (isNative) {
      window.location.href = platformPath('/login')
    } else {
      window.location.href = `${WEB_APP_ORIGIN}/app/login`
    }
  }

  const messages = {
    checking: { icon: '', text: 'Einen Moment…' },
    success:  { icon: '✓',  text: 'Willkommen zurück.' },
    error:    { icon: '✕',  text: 'Verifizierung fehlgeschlagen' },
  }

  const msg = messages[status]

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Background */}
      <img loading="lazy" decoding="async" src={BG} alt="" aria-hidden style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: 'brightness(0.38) saturate(1.1)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(22,215,197,0.15) 0%, transparent 50%, rgba(0,0,0,0.6) 100%)',
      }}/>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'hui-cb-fade 600ms ease forwards',
        maxWidth: 380, padding: '0 24px',
      }}>
        <style>{`
          @keyframes hui-cb-fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          @keyframes hui-cb-spin { to { transform:rotate(360deg); } }
        `}</style>

        {/* Animated icon */}
        <div style={{
          width: 56, height: 56,
          border: '2px solid rgba(22,215,197,0.25)',
          borderTop: '2px solid #16D7C5',
          borderRadius: '50%',
          animation: status === 'checking' ? 'hui-cb-spin 1s linear infinite' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: status === 'checking' ? 0 : 22,
          color: status === 'success' ? '#16D7C5' : status === 'error' ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
          transition: 'all 400ms ease',
        }}>
          {status !== 'checking' && msg.icon}
        </div>

        <div style={{
          fontSize: 16, color: 'rgba(255,255,255,0.75)',
          letterSpacing: '-0.02em', fontWeight: 400,
          textAlign: 'center',
        }}>
          {msg.text}
        </div>

        {/* Error message + retry button */}
        {status === 'error' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            marginTop: 8,
          }}>
            <div style={{
              fontSize: 14, color: 'rgba(255,255,255,0.55)',
              textAlign: 'center', lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
            <button
              onClick={handleRequestNewLink}
              style={{
                padding: '12px 28px',
                background: 'rgba(22,215,197,0.15)',
                border: '1px solid rgba(22,215,197,0.4)',
                borderRadius: 10,
                color: '#16D7C5',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,215,197,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(22,215,197,0.15)'}
            >
              Neuen Bestätigungslink anfordern
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
