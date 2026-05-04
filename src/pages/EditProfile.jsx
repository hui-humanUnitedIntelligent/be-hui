import React, { useState, useEffect } from 'react'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const TEAL = "#2ABFAC"
const CORAL = "#FF6B5B"

export default function EditProfile({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    location: '',
    bio: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setForm(f => ({
          ...f,
          full_name: data.full_name || f.full_name,
          location: data.location || '',
          bio: data.bio || '',
        }))
      })
  }, [user?.id])

  const handleSave = async () => {
    setLoading(true)
    // Auth metadata updaten
    await supabase.auth.updateUser({
      data: { full_name: form.full_name }
    })
    // Profile in DB updaten
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      location: form.location,
      bio: form.bio,
      updated_at: new Date().toISOString()
    })
    // window.__huiUserName aktualisieren
    window.__huiUserName = form.full_name
    setLoading(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSave?.(form); onClose?.() }, 1200)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#f7f7f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <div style={{ flex: 1, fontWeight: 800, fontSize: 17, color: 'white' }}>Profil bearbeiten</div>
        <button onClick={handleSave} disabled={loading} style={{ background: 'white', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 700, fontSize: 13, color: TEAL, cursor: 'pointer' }}>
          {saved ? '✅ Gespeichert!' : loading ? '...' : 'Speichern'}
        </button>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            {form.full_name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: TEAL, borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            <Camera size={12} color="white" />
          </div>
        </div>
      </div>

      {/* Formular */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {[
          { label: 'Name', key: 'full_name', placeholder: 'Dein vollständiger Name' },
          { label: 'Standort', key: 'location', placeholder: 'z.B. München' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <input
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: '-apple-system, sans-serif' }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Über mich</div>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Erzähl der Community etwas über dich..."
            rows={4}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 15, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: '-apple-system, sans-serif' }}
          />
        </div>
      </div>
    </div>
  )
}
