#!/usr/bin/env node
/**
 * Resolves Stripe publishable key for frontend builds.
 * Order: env override → Stripe Dashboard API (via secret key) → fail.
 */
import process from 'node:process';
import Stripe from 'stripe';

const override = process.env.VITE_STRIPE_PUBLIC_KEY?.trim()
  || process.env.STRIPE_PUBLISHABLE_KEY?.trim();
if (override) {
  if (!/^pk_(test|live)_/.test(override)) {
    console.error('Publishable key override hat ungültiges Format');
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

const stripe = new Stripe(sk, { apiVersion: '2024-06-20' });

async function tryDashboardApi() {
  // Stripe Dashboard internal endpoint used by stripe-cli (standard accounts)
  const res = await fetch('https://api.stripe.com/v1/keys?limit=10', {
    headers: { Authorization: `Bearer ${sk}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`keys list HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = JSON.parse(text);
  const pk = (data.data || []).find((k) => k?.type === 'publishable' || k?.publishable_key)?.publishable_key
    || (data.data || []).find((k) => typeof k?.key === 'string' && k.key.startsWith('pk_'))?.key;
  if (pk) return pk;
  throw new Error('Kein publishable key in /v1/keys Antwort');
}

async function tryAccountEndpoint() {
  const res = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${sk}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`account HTTP ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  const pk = data?.settings?.dashboard?.display_name; // not pk
  void pk;
  // Some accounts expose keys under settings
  const candidates = JSON.stringify(data).match(/pk_(test|live)_[A-Za-z0-9]+/g);
  if (candidates?.length) return candidates[0];
  throw new Error('account ohne publishable key');
}

async function tryStripeCliCompat() {
  // stripe-cli: GET /v1/developers/api_keys
  for (const path of ['/v1/developers/api_keys', '/v1/developer/api_keys', '/edge/v1/publishable_key']) {
    try {
      const res = await fetch(`https://api.stripe.com${path}`, {
        headers: { Authorization: `Bearer ${sk}` },
      });
      if (!res.ok) continue;
      const text = await res.text();
      const match = text.match(/pk_(test|live)_[A-Za-z0-9]+/);
      if (match) return match[0];
    } catch {
      /* next */
    }
  }
  throw new Error('CLI-compat endpoints lieferten keinen key');
}

async function tryPaymentIntentProbe() {
  // Confirm sk works; extract account id prefix for diagnostics only
  await stripe.balance.retrieve();
  const account = await stripe.accounts.retrieve();
  const acctId = account?.id;
  if (!acctId) throw new Error('Keine account id');

  // Managed-key API (Connect / platforms only) — ignore 404
  for (const version of ['2026-05-27.preview', '2025-11-17.preview']) {
    try {
      const res = await fetch('https://api.stripe.com/v2/iam/api_keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sk}`,
          'Content-Type': 'application/json',
          'Stripe-Version': version,
          'Stripe-Context': acctId,
        },
        body: JSON.stringify({ type: 'publishable_key' }),
      });
      const text = await res.text();
      if (!res.ok) continue;
      const data = JSON.parse(text);
      const token = data?.publishable_key?.token || data?.key || data?.token;
      if (token && /^pk_/.test(token)) return token;
    } catch {
      /* next */
    }
  }
  throw new Error('Managed-key API nicht verfügbar');
}

const attempts = [
  ['dashboard keys', tryDashboardApi],
  ['account scan', tryAccountEndpoint],
  ['cli compat', tryStripeCliCompat],
  ['managed key api', tryPaymentIntentProbe],
];

for (const [name, fn] of attempts) {
  try {
    const pk = await fn();
    if (pk && /^pk_(test|live)_/.test(pk)) {
      process.stdout.write(pk);
      process.exit(0);
    }
  } catch (err) {
    console.error(`[resolve] ${name}: ${err.message || err}`);
  }
}

console.error('Konnte keinen publishable key von Stripe ableiten');
process.exit(1);
