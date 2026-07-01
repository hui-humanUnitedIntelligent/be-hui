// src/hooks/useAmbassadorPayout.js
// HUI — Ambassador Auszahlungs-Status (ARCH-006.1)
// Keine lokale Berechnung. Single Source of Truth: Supabase via RPC.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAmbassadorPayout(ambassadorId) {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(async () => {
    if (!ambassadorId) return;
    setLoading(true);
    try {
      const { data, error: e } = await supabase
        .rpc('rpc_get_ambassador_payout_summary', { p_ambassador_id: ambassadorId });
      if (e) throw e;
      setSummary(data);
    } catch (err) {
      console.error('[useAmbassadorPayout]', err?.message ?? err);
      setError(err?.message ?? 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [ambassadorId]);

  // Auszahlungsanfrage stellen
  const requestPayout = useCallback(async () => {
    if (!ambassadorId) return { ok: false, error: 'no_ambassador_id' };
    setRequesting(true);
    try {
      const { data, error: e } = await supabase
        .rpc('rpc_request_payout', { p_ambassador_id: ambassadorId });
      if (e) throw e;
      await refresh();
      return data;
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Fehler' };
    } finally {
      setRequesting(false);
    }
  }, [ambassadorId, refresh]);

  useEffect(() => {
    refresh();
    // Realtime: Auszahlungsstatus-Updates
    if (!ambassadorId) return;
    const sub = supabase
      .channel(`payout_${ambassadorId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'stripe_payouts',
        filter: `ambassador_id=eq.${ambassadorId}`,
      }, () => refresh())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'stripe_ambassador_commissions',
        filter: `ambassador_id=eq.${ambassadorId}`,
      }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [ambassadorId, refresh]);

  const fmt = (val) => `€${((val ?? 0)).toFixed(2)}`;

  return {
    summary,
    loading,
    error,
    requesting,
    refresh,
    requestPayout,
    // Bequeme Getter
    availableEur:  summary?.available_eur  ?? 0,
    requestedEur:  summary?.requested_eur  ?? 0,
    paidEur:       summary?.paid_eur       ?? 0,
    minimumEur:    summary?.minimum_eur    ?? 20,
    canRequest:    summary?.can_request    ?? false,
    payouts:       summary?.payouts        ?? [],
    fmtAvailable:  fmt(summary?.available_eur),
    fmtPaid:       fmt(summary?.paid_eur),
  };
}
