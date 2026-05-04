import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useWirker() {
  const [wirker, setWirker] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('wirker')
        .select('*')
        .order('bookings', { ascending: false })
      if (error) setError(error.message)
      else setWirker(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return { wirker, loading, error }
}

export function useWirkerById(id) {
  const [wirker, setWirker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('wirker').select('*').eq('id', id).single()
      .then(({ data }) => { setWirker(data); setLoading(false) })
  }, [id])

  return { wirker, loading }
}

export function useWirkerByName(name) {
  const [wirker, setWirker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    supabase.from('wirker').select('*').eq('name', name).single()
      .then(({ data }) => { setWirker(data); setLoading(false) })
  }, [name])

  return { wirker, loading }
}
