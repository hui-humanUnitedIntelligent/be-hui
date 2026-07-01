// src/hooks/useCheckout.js
// HUI — Checkout Hook (ARCH-006.1)
// Single Source of Truth: alle Zahlungen via Supabase RPC → Stripe
// Keine lokale Berechnung. Kein Shadow State.
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CHECKOUT_URLS, CHECKOUT_TYPES, MIN_AMOUNTS } from '../config/stripeConfig';

/**
 * useCheckout
 * Startet einen Stripe-Checkout-Flow für alle HUI Use Cases:
 * work | talent | donation | subscription | impact_subscription
 *
 * @returns {{ startCheckout, loading, error, reset }}
 */
export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const reset = useCallback(() => setError(null), []);

  /**
   * startCheckout(options)
   * @param {object} options
   * @param {string} options.type          - CHECKOUT_TYPES.*
   * @param {number} options.amount        - Betrag in Cent
   * @param {string} [options.currency]    - 'eur' (default)
   * @param {string} [options.ambassadorId]- Ambassador ID (für Provision)
   * @param {string} [options.description] - Beschreibung (Werkname etc.)
   * @param {object} [options.metadata]    - Zusätzliche Metadaten
   * @param {string} [options.mode]        - 'redirect' (default) | 'intent'
   */
  const startCheckout = useCallback(async ({
    type,
    amount,
    currency      = 'eur',
    ambassadorId  = null,
    description   = null,
    metadata      = {},
    mode          = 'redirect',   // 'redirect' → Checkout Session URL | 'intent' → clientSecret
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Validierung
      if (!type || !CHECKOUT_TYPES[type.toUpperCase().replace(/-/g,'_')] && !Object.values(CHECKOUT_TYPES).includes(type)) {
        throw new Error(`Unbekannter Checkout-Typ: ${type}`);
      }
      const minAmount = MIN_AMOUNTS[type] ?? 100;
      if (!amount || amount < minAmount) {
        throw new Error(`Mindestbetrag: ${(minAmount/100).toFixed(2)} EUR`);
      }

      // Aktuellen User holen
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Nicht eingeloggt');

      if (mode === 'redirect') {
        // ── Checkout Session (Weiterleitung zu Stripe) ─────────────
        const { data, error: rpcErr } = await supabase.rpc('rpc_create_checkout_session', {
          p_user_id:      user.id,
          p_amount:       amount,
          p_currency:     currency,
          p_payment_type: type,
          p_success_url:  CHECKOUT_URLS.success,
          p_cancel_url:   CHECKOUT_URLS.cancel,
          p_ambassador_id:ambassadorId,
          p_description:  description,
          p_metadata:     { ...metadata, source: 'hui_app' },
        });
        if (rpcErr) throw rpcErr;
        if (!data?.url) throw new Error('Kein Checkout-URL erhalten');
        // Weiterleitung zu Stripe
        window.location.href = data.url;
        return { ok: true, url: data.url };

      } else {
        // ── Payment Intent (Stripe Elements / eigene UI) ───────────
        const { data, error: rpcErr } = await supabase.rpc('rpc_create_payment_intent', {
          p_user_id:       user.id,
          p_amount:        amount,
          p_currency:      currency,
          p_payment_type:  type,
          p_ambassador_id: ambassadorId,
          p_description:   description,
          p_metadata:      { ...metadata, source: 'hui_app' },
        });
        if (rpcErr) throw rpcErr;
        if (!data?.client_secret) throw new Error('Kein Client Secret erhalten');
        return { ok: true, clientSecret: data.client_secret, paymentIntentId: data.payment_intent_id };
      }

    } catch (err) {
      const msg = err?.message ?? 'Checkout-Fehler';
      setError(msg);
      console.error('[useCheckout]', msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { startCheckout, loading, error, reset };
}
