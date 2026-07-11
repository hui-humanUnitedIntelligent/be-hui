import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useWizardBodyLock } from '../../lib/wizardBodyLock.js'
import { supabase } from '../../lib/supabaseClient.js'

const CORAL = '#FF8A6B'

export default function SellerPayoutRequestSheet({ item, onClose = () => {}, onSuccess = () => {} }) {
  useWizardBodyLock()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!item) return null

  const handleRequest = async () => {
    if (!note.trim()) return setError('Bitte beschreibe kurz was du geliefert hast.')
    setLoading(true)
    setError('')
    try {
      const { error: rpcErr } = await supabase.rpc('rpc_seller_request_payout', {
        p_order_id: item.type === 'order' ? item.id : null,
        p_booking_id: item.type === 'booking' ? item.id : null,
        p_note: note.trim(),
      })
      if (rpcErr) throw rpcErr
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 2500)
    } catch (e) {
      setError(e?.message || 'Fehler beim Antrag')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose?.() }}
      style={{ position:'fixed', inset:0, zIndex:10500, background:'rgba(0,0,0,0.45)',
        display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#FDFCFA', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480,
        maxHeight:'80dvh', display:'flex', flexDirection:'column',
        boxShadow:'0 -8px 40px rgba(26,26,46,0.18)', overflow:'hidden' }}>
        
        <div style={{ width:40, height:4, borderRadius:2, background:'rgba(26,26,46,0.12)',
          margin:'12px auto 0', flexShrink:0 }}/>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 16px' }}>
          {done ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48 }}>📋</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#1A1A2E', marginTop:12 }}>Antrag gestellt</div>
              <div style={{ fontSize:14, color:'rgba(26,26,46,0.55)', marginTop:8, lineHeight:1.6 }}>
                HUI prüft deinen Antrag und meldet sich bei dir.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:11, fontWeight:600, color:CORAL, textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:6 }}>Auszahlung beantragen</div>
              <div style={{ fontSize:14, color:'rgba(26,26,46,0.6)', lineHeight:1.6, marginBottom:16 }}>
                Der Käufer hat die Lieferung noch nicht bestätigt. Du kannst einen Auszahlungsantrag stellen — HUI prüft deinen Fall und gibt die Zahlung frei wenn Belege vorliegen.
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E', marginBottom:8 }}>Was hast du geliefert?</div>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Beschreibe kurz was du geliefert / ausgeführt hast..."
                rows={4}
                style={{ width:'100%', resize:'none', border:'1.5px solid rgba(26,26,46,0.12)',
                  borderRadius:14, padding:'12px 14px', fontSize:14, color:'#1A1A2E',
                  background:'#fff', outline:'none', marginBottom:8,
                  fontFamily:'inherit', lineHeight:1.5, boxSizing:'border-box' }}
              />
              {error && (
                <div style={{ fontSize:13, color:'#E83A3A', padding:'10px 12px', borderRadius:10,
                  background:'rgba(232,58,58,0.07)' }}>{error}</div>
              )}
            </>
          )}
        </div>

        {!done && (
          <div style={{ flexShrink:0, padding:`12px 24px calc(env(safe-area-inset-bottom, 16px) + 12px)`,
            background:'#FDFCFA', borderTop:'1px solid rgba(26,26,46,0.07)', display:'flex', gap:10 }}>
            <button onClick={() => onClose?.()} disabled={loading}
              style={{ flex:1, background:'transparent', border:'1.5px solid rgba(26,26,46,0.15)',
                borderRadius:14, padding:'13px 0', fontSize:14, fontWeight:600,
                color:'rgba(26,26,46,0.55)', cursor:'pointer' }}>Abbrechen</button>
            <button onClick={handleRequest} disabled={loading || !note.trim()}
              style={{ flex:2, background:(loading || !note.trim()) ? 'rgba(255,138,107,0.35)' : CORAL,
                color:'#fff', border:'none', borderRadius:14, padding:'13px 0',
                fontSize:15, fontWeight:700, cursor:(loading || !note.trim()) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Wird gesendet…' : 'Antrag stellen'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
