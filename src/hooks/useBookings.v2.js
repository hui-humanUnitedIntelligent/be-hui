// src/hooks/useBookings.v2.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { BookingService } from '../services/db';

export function useBookings(userId, role = 'user') {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(!!userId);
  const [error,    setError]    = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    const fn = role === 'wirker'
      ? BookingService.getByWirker
      : BookingService.getByUser;
    fn(userId, 0).then(({ data, error: err }) => {
      if (!mounted.current) return;
      setBookings(data || []);
      setError(err?.message || null);
      setLoading(false);
    });
    return () => { mounted.current = false; };
  }, [userId, role]);

  const createBooking = useCallback(async (data) => {
    const { data: created, error: err } = await BookingService.create({ user_id: userId, ...data });
    if (created) setBookings(prev => [created, ...prev]);
    return { data: created, error: err };
  }, [userId]);

  const updateStatus = useCallback(async (id, status) => {
    const { data: updated, error: err } = await BookingService.updateStatus(id, status);
    if (updated) setBookings(prev => prev.map(b => b.id === id ? updated : b));
    return { data: updated, error: err };
  }, []);

  const releaseEscrow = useCallback(async (id) => {
    const { data: updated, error: err } = await BookingService.releaseEscrow(id);
    if (updated) setBookings(prev => prev.map(b => b.id === id ? updated : b));
    return { data: updated, error: err };
  }, []);

  return { bookings, loading, error, createBooking, updateStatus, releaseEscrow };
}
