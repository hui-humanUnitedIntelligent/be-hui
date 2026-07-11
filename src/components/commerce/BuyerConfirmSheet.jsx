// BuyerConfirmSheet.jsx — K\u00e4ufer best\u00e4tigt Erhalt, l\u00f6st confirm-and-transfer aus
// PFLICHT: createPortal + zIndex:10500 + useWizardBodyLock + sticky button
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useWizardBodyLock } from '../../lib/wizardBodyLock.js'
import { supabase } from '../../lib/supabaseClient.js'

const TEAL = '#16D7C5'

export default function BuyerConfirmSheet({ item, onClose = () => {}, onSuccess = () => {} }) {
  useWizardBodyLock()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!item) return null

  const isOrder = item.type === 'order'
  const title = isOrder ? (item.work_title || item.title || 'Bestellung') : (item.talent_title || item.title || 'Buchung')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Nicht eingeloggt')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/confirm-and-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          order_id: isOrder ? item.id : null,
          booking_id: !isOrder ? item.id : null,
        })
      })
      const result = await res.json()
      if (!res.ok || !result.ok) throw new Error(result.error || 'Fehler bei Best\u00e4tigung')
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose?.() }, 2000)
    } catch (e) {
      setError(e?.message || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose?.() }}
      style={{ position: 'fixed', inset: 0, zIndex: 10500, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FDFCFA', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480,
        maxHeight: '70dvh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(26,26,46,0.18)', overflow: 'hidden',
        animation: 'escrowSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both' }}>
        <style>{`@keyframes escrowSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(26,26,46,0.12)',
          margin: '12px auto 0', flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 16px', WebkitOverflowScrolling: 'touch' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginTop: 12 }}>Best\u00e4tigt!</div>
              <div style={{ fontSize: 14, color: 'rgba(26,26,46,0.55)', marginTop: 8, lineHeight: 1.6 }}>
                Die Auszahlung an den Anbieter wird jetzt freigegeben.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEAL, textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 6 }}>Erhalt best\u00e4tigen</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
                Bitte best\u00e4tige, dass du {isOrder ? 'deine Bestellung erhalten hast' : 'die Dienstleistung erhalten hast'}.
                Erst dann wird die Zahlung an den Anbieter freigegeben.
              </div>
              <div style={{ background: 'rgba(22,215,197,0.07)', border: '1px solid rgba(22,215,197,0.2)',
                borderRadius: 14, padding: '12px 16px', fontSize: 13, color: 'rgba(26,26,46,0.65)', lineHeight: 1.5 }}>
                💡 Deine Zahlung ist sicher bei HUI hinterlegt und wird erst nach deiner Best\u00e4tigung an den Anbieter \u00fcbertragen.
              </div>
              {error && (
                <div style={{ fontSize: 13, color: '#E83A3A', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(232,58,58,0.07)', marginTop: 12 }}>{error}</div>
              )}
            </>
          )}
        </div>

        {/* Sticky Buttons */}
        {!done && (
          <div style={{ flexShrink: 0, padding: `12px 24px calc(env(safe-area-inset-bottom, 16px) + 12px)`,
            background: '#FDFCFA', borderTop: '1px solid rgba(26,26,46,0.07)', display: 'flex', gap: 10 }}>
            <button onClick={() => onClose?.()} disabled={loading}
              style={{ flex: 1, background: 'transparent', border: '1.5px solid rgba(26,26,46,0.15)',
                borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 600,
                color: 'rgba(26,26,46,0.55)', cursor: 'pointer', touchAction: 'manipulation' }}>
              Abbrechen
            </button>
            <button onClick={handleConfirm} disabled={loading}
              style={{ flex: 2, background: loading ? 'rgba(22,215,197,0.4)' : `linear-gradient(135deg,${TEAL},#0AB8B2)`,
                color: '#fff', border: 'none', borderRadius: 14, padding: '13px 0',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation' }}>
              {loading ? 'Wird verarbeitet…' : '✓ Erhalt bestätigen & Zahlung freigeben'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
