import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { processStoredReferralForUser } from '../lib/referralTracking.js'

const BG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85'

export default function AuthCallback() {
  const [status, setStatus] = useState('checking') // 'checking' | 'success' | 'error'

  useEffect(() => {
    ;(async () => {
      try {
        // Supabase verarbeitet den URL-Hash automatisch
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          // Referral-Zuordnung nach E-Mail-Bestätigung (gespeicherter Ref-Link)
          if (session.user?.id) {
            processStoredReferralForUser(session.user.id).catch(() => {})
          }
          setTimeout(() => {
            // Hard-Reload nach Login — verhindert Stale-Asset-Fehler nach Deployments
            try {
              const v = Date.now();
              window.location.replace('/Home?v=' + v);
            } catch (_) {
              window.location.href = '/Home';
            }
          }, 800)
        } else {
          setStatus('error')
          setTimeout(() => { window.location.href = '/login' }, 1500)
        }
      } catch {
        setStatus('error')
        setTimeout(() => { window.location.href = '/login' }, 1500)
      }
    })()
  }, [])

  const messages = {
    checking: { icon: '✦', text: 'Einen Moment…' },
    success:  { icon: '✓',  text: 'Willkommen zurück.' },
    error:    { icon: '○',  text: 'Weiterleitung…' },
  }

  const msg = messages[status]

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Background */}
      <img src={BG} alt="" aria-hidden style={{
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
          color: status === 'success' ? '#16D7C5' : 'rgba(255,255,255,0.5)',
          transition: 'all 400ms ease',
        }}>
          {status !== 'checking' && msg.icon}
        </div>

        <div style={{
          fontSize: 16, color: 'rgba(255,255,255,0.75)',
          letterSpacing: '-0.02em', fontWeight: 400,
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  )
}
