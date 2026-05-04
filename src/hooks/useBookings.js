import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useBookings(userId) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('bookings').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBookings(data || []); setLoading(false) })
  }, [userId])

  const createBooking = async (bookingData) => {
    const { data, error } = await supabase.from('bookings').insert({
      user_id: userId,
      ...bookingData
    }).select().single()
    if (data) setBookings(prev => [data, ...prev])
    return { data, error }
  }

  const updateBooking = async (id, updates) => {
    const { data, error } = await supabase.from('bookings')
      .update(updates).eq('id', id).select().single()
    if (data) setBookings(prev => prev.map(b => b.id === id ? data : b))
    return { data, error }
  }

  return { bookings, loading, createBooking, updateBooking }
}
