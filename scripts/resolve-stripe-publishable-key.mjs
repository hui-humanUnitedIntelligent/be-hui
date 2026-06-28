#!/usr/bin/env node
/**
 * Resolves Stripe publishable key from STRIPE_SECRET_KEY (V2 API) or env override.
 * Usage: node scripts/resolve-stripe-publishable-key.mjs
 * Prints pk_test_/pk_live_ to stdout.
 */
import process from 'node:process';

const override = process.env.VITE_STRIPE_PUBLIC_KEY?.trim();
if (override) {
  if (!/^pk_(test|live)_/.test(override)) {
    console.error('VITE_STRIPE_PUBLIC_KEY hat ungültiges Format');
    process.exit(1);
  }
  process.stdout.write(override);
  process.exit(0);
}

const sk = process.env.STRIPE_SECRET_KEY?.trim();
if (!sk) {
  console.error('STRIPE_SECRET_KEY oder VITE_STRIPE_PUBLIC_KEY erforderlich');
  process.exit(1);
}

async function stripeV2CreatePublishableKey() {
  const res = await fetch('https://api.stripe.com/v2/iam/api_keys', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sk}`,
      'Content-Type': 'application/json',
      'Stripe-Version': '2025-11-17.preview',
    },
    body: JSON.stringify({ type: 'publishable_key' }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Stripe V2 HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = JSON.parse(text);
  const key =
    data.key ||
    data.publishable_key ||
    data.value ||
    data?.key_object?.key ||
    data?.key_object?.value;
  if (!key || !/^pk_(test|live)_/.test(key)) {
    throw new Error(`Unerwartete Stripe-Antwort: ${text.slice(0, 300)}`);
  }
  return key;
}

try {
  const pk = await stripeV2CreatePublishableKey();
  process.stdout.write(pk);
} catch (err) {
  console.error(String(err));
  process.exit(1);
}
