import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useFavorites(userId) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('favorites').select('*').eq('user_id', userId)
      .then(({ data }) => { setFavorites(data || []); setLoading(false) })
  }, [userId])

  const toggleFavorite = async (wirkerName, wirkerId = null) => {
    const existing = favorites.find(f => f.wirker_name === wirkerName)
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(prev => prev.filter(f => f.id !== existing.id))
      return false // removed
    } else {
      const { data } = await supabase.from('favorites').insert({
        user_id: userId, wirker_name: wirkerName, wirker_id: wirkerId
      }).select().single()
      if (data) setFavorites(prev => [...prev, data])
      return true // added
    }
  }

  const isFavorite = (wirkerName) => favorites.some(f => f.wirker_name === wirkerName)

  return { favorites, loading, toggleFavorite, isFavorite }
}
