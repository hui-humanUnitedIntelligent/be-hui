// src/lib/stripe.js
// HUI Stripe Client — App-seitige Stripe-Integration
// Publishable Key kommt aus ENV, niemals hardcoded
import { loadStripe } from '@stripe/stripe-js';

let stripePromise = null;

export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY nicht gesetzt');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// Checkout Session über Backend erstellen und weiterleiten
export async function redirectToCheckout({ priceId, userId, paymentType, metadata = {} }) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'create_checkout_session',
      price_id:    priceId,
      metadata:    { user_id: userId, payment_type: paymentType, ...metadata },
      success_url: `${window.location.origin}/zahlung-erfolg`,
      cancel_url:  `${window.location.origin}/zahlung-abgebrochen`,
    }),
  });
  const data = await res.json();
  if (!data.ok || !data.url) throw new Error(data.error || 'Checkout fehlgeschlagen');
  window.location.href = data.url;
}

// Payment Intent erstellen (für direkte Zahlung)
export async function createPaymentIntent({ amount, currency = 'eur', userId, paymentType }) {
  const res = await fetch('/api/stripe/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'create_payment_intent',
      amount,         // in EUR (z.B. 9.99)
      currency,
      metadata: { user_id: userId, payment_type: paymentType },
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Payment Intent fehlgeschlagen');
  return data.client_secret;
}
