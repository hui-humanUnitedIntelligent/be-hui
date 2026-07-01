// src/hooks/useStripeImpactPool.js
// HUI — Impact Pool Daten aus Supabase (via RPC)
// ARCH-006.1: Single Source of Truth = Supabase
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useStripeImpactPool() {
  const [pool,    setPool]    = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Aktueller Monat via RPC
      const { data: current, error: e1 } = await supabase
        .rpc('rpc_get_impact_pool_current');
      if (e1) throw e1;
      setPool(current);

      // Monats-Verlauf
      const { data: hist, error: e2 } = await supabase
        .rpc('rpc_get_impact_pool_history', { p_limit: 12 });
      if (e2) throw e2;
      setHistory(hist ?? []);
    } catch (err) {
      console.error('[useStripeImpactPool]', err?.message ?? err);
      setError(err?.message ?? 'Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Realtime: Pool-Updates live
    const sub = supabase
      .channel('stripe_impact_pool_realtime')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'stripe_impact_pool',
      }, () => refresh())
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'stripe_impact_pool_events',
      }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [refresh]);

  const fmt = (val) => `€${((val ?? 0)).toFixed(2)}`;

  return {
    pool,
    history,
    loading,
    error,
    refresh,
    totalEur:      pool?.total_inflow_eur   ?? 0,
    projectEur:    pool?.project_share_eur  ?? 0,
    companyEur:    pool?.company_share_eur  ?? 0,
    ambPendingEur: pool?.amb_pending_eur    ?? 0,
    ambPaidEur:    pool?.amb_paid_eur       ?? 0,
    currentMonth:  pool?.month              ?? '',
    distributed:   pool?.distributed       ?? false,
    fmtTotal:      fmt(pool?.total_inflow_eur),
    fmtProject:    fmt(pool?.project_share_eur),
    fmtCompany:    fmt(pool?.company_share_eur),
  };
}
