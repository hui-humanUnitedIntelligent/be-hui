import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
  useEffect(() => {
    // Supabase verarbeitet den Token aus der URL automatisch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/Home'
      } else {
        window.location.href = '/login'
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🌱</div>
      <div style={{ fontSize: 16, color: '#888' }}>Einen Moment...</div>
    </div>
  )
}
