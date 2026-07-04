// src/hooks/useAmbassadorPayout.js
// HUI — Ambassador Auszahlungs-Status (ARCH-006.1 / AMB-PAYOUT-009)
// Keine lokale Berechnung. Single Source of Truth: Supabase via RPC.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAmbassadorPayout(ambassadorId) {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [bankStatus, setBankStatus] = useState(null); // AMB-BANK-PAYOUT-001
  const [savingBank, setSavingBank] = useState(false);

  const refresh = useCallback(async () => {
    if (!ambassadorId) return;
    setLoading(true);
    try {
      // AMB-PAYOUT-009: erweiterte RPC (Lifetime-Verdienst, Referrals, Stripe-Connect-Status).
      // Ersetzt rpc_get_ambassador_payout_summary additiv -- gleiche Basisfelder, mehr Daten.
      const { data, error: e } = await supabase
        .rpc('rpc_get_ambassador_full_stats', { p_ambassador_id: ambassadorId });
      if (e) throw e;
      setSummary(data);
    } catch (err) {
      console.error('[useAmbassadorPayout]', err?.message ?? err);
      setError(err?.message ?? 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [ambassadorId]);

  // Auszahlungsanfrage stellen (AMB-PAYOUT-016: amountEur optional -- weggelassen = kompletter verfuegbarer Betrag)
  const requestPayout = useCallback(async (amountEur = null) => {
    if (!ambassadorId) return { ok: false, error: 'no_ambassador_id' };
    setRequesting(true);
    try {
      const { data, error: e } = await supabase
        .rpc('rpc_request_payout', { p_ambassador_id: ambassadorId, p_amount_eur: amountEur });
      if (e) throw e;
      await refresh();
      return data;
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Fehler' };
    } finally {
      setRequesting(false);
    }
  }, [ambassadorId, refresh]);

  // AMB-BANK-PAYOUT-001: Bankdaten-Status laden (nur last4, kein Klartext an den Client)
  const loadBankStatus = useCallback(async () => {
    if (!ambassadorId) return;
    try {
      const { data, error: e } = await supabase
        .rpc('rpc_get_ambassador_bank_status', { p_ambassador_id: ambassadorId });
      if (e) throw e;
      setBankStatus(data);
    } catch (err) {
      console.error('[useAmbassadorPayout:bankStatus]', err?.message ?? err);
    }
  }, [ambassadorId]);

  // AMB-BANK-PAYOUT-001: Bankdaten speichern (verschlüsselt serverseitig via pgcrypto+Vault)
  const saveBankDetails = useCallback(async (iban, holder, bic = null, bankName = null) => {
    if (!ambassadorId) return { ok: false, error: 'no_ambassador_id' };
    setSavingBank(true);
    try {
      const { data, error: e } = await supabase
        .rpc('rpc_save_ambassador_bank_details', { p_ambassador_id: ambassadorId, p_iban: iban, p_holder: holder, p_bic: bic, p_bank_name: bankName });
      if (e) throw e;
      if (data?.ok) await loadBankStatus();
      return data;
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Fehler' };
    } finally {
      setSavingBank(false);
    }
  }, [ambassadorId, loadBankStatus]);

  // Stripe-Connect-Onboarding starten (Express-Account + Hosted Onboarding Link)
  // DEPRECATED (2026-07-04, AMB-BANK-PAYOUT-001): nicht mehr in der UI verwendet -- ersetzt durch
  // Bankdaten-Formular oben. Funktion bleibt bestehen (nicht löschen), falls je wieder gebraucht.
  const startStripeConnect = useCallback(async () => {
    if (!ambassadorId) return { ok: false, error: 'no_ambassador_id' };
    setConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ambassador-stripe-connect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ambassador_id: ambassadorId }),
        }
      );
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      return data;
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Fehler' };
    } finally {
      setConnecting(false);
    }
  }, [ambassadorId]);

  useEffect(() => {
    refresh();
    loadBankStatus();
    // Realtime: Auszahlungsstatus-Updates (Publication + RLS seit AMB-PAYOUT-009 aktiv)
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
  }, [ambassadorId, refresh, loadBankStatus]);

  const fmt = (val) => `€${((val ?? 0)).toFixed(2)}`;

  return {
    summary,
    loading,
    error,
    requesting,
    connecting,
    refresh,
    requestPayout,
    startStripeConnect,
    loadBankStatus,
    // Bequeme Getter (kompatibel zur bisherigen Panel-Komponente)
    availableEur:  summary?.available_eur  ?? 0,
    requestedEur:  summary?.requested_eur  ?? 0,
    paidEur:       summary?.paid_eur ?? summary?.paid_out_eur ?? 0,
    minimumEur:    summary?.minimum_eur    ?? 20,
    canRequest:    summary?.can_request    ?? false,
    payouts:       summary?.payout_history ?? summary?.payouts ?? [],
    fmtAvailable:  fmt(summary?.available_eur),
    fmtPaid:       fmt(summary?.paid_eur ?? summary?.paid_out_eur),
    // Neue Felder (AMB-PAYOUT-009)
    lifetimeEarningsEur: summary?.lifetime_earnings_eur ?? 0,
    referralCount:       summary?.referral_count ?? 0,
    activeReferrals:     summary?.active_referrals ?? 0,
    isDormant:           summary?.is_dormant ?? false,
    referralRevenueEur:  summary?.referral_revenue_eur ?? 0,
    tier:                summary?.tier ?? 'bronze',
    ambassadorStatus:    summary?.ambassador_status ?? null,
    stripeConnectStatus: summary?.stripe_connect_status ?? 'not_connected',
    isStripeConnected:   summary?.stripe_connect_status === 'connected',
    // AMB-BANK-PAYOUT-001
    bankStatus,
    savingBank,
    hasBankDetails: bankStatus?.has_bank_details ?? false,
    bankIbanLast4:  bankStatus?.bank_iban_last4 ?? null,
    saveBankDetails,
  };
}
