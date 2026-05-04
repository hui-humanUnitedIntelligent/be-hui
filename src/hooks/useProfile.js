import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [userId])

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles').upsert({ id: userId, ...updates }).select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, loading, updateProfile }
}

export function useMyWirkerProfile(userId) {
  const [wirkerProfile, setWirkerProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('wirker').select('*').eq('user_id', userId).single()
      .then(({ data }) => { setWirkerProfile(data); setLoading(false) })
  }, [userId])

  return { wirkerProfile, loading }
}
