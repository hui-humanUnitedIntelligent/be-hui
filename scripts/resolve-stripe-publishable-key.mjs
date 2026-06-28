#!/usr/bin/env node
/**
 * Resolves Stripe publishable key for frontend builds (fetch-only, no deps).
 */
import process from 'node:process';

const sk = process.env.STRIPE_SECRET_KEY?.trim();
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

if (!sk) {
  console.error('STRIPE_SECRET_KEY oder VITE_STRIPE_PUBLIC_KEY erforderlich');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${sk}` };

async function getJson(path, init = {}) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`);
  return JSON.parse(text);
}

function findPkDeep(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const match = text.match(/pk_(test|live)_[A-Za-z0-9]+/);
  return match ? match[0] : null;
}

async function tryKeysList() {
  const data = await getJson('/v1/keys?limit=20');
  const pk = findPkDeep(data);
  if (pk) return pk;
  throw new Error('Kein pk in /v1/keys');
}

async function tryAccount() {
  const data = await getJson('/v1/account');
  const pk = findPkDeep(data);
  if (pk) return pk;
  throw new Error('Kein pk in /v1/account');
}

async function tryDeveloperKeys() {
  for (const path of ['/v1/developers/api_keys', '/v1/developer/api_keys']) {
    try {
      const data = await getJson(path);
      const pk = findPkDeep(data);
      if (pk) return pk;
    } catch (err) {
      console.error(`[resolve] ${path}: ${err.message || err}`);
    }
  }
  throw new Error('developer api_keys ohne pk');
}

async function tryManagedKeyApi() {
  const account = await getJson('/v1/account');
  const acctId = account?.id;
  if (!acctId) throw new Error('account.id fehlt');

  for (const version of ['2026-05-27.preview', '2025-11-17.preview']) {
    try {
      const res = await fetch('https://api.stripe.com/v2/iam/api_keys', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Stripe-Version': version,
          'Stripe-Context': acctId,
        },
        body: JSON.stringify({ type: 'publishable_key' }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`[resolve] v2 ${version}: HTTP ${res.status}: ${text.slice(0, 120)}`);
        continue;
      }
      const pk = findPkDeep(JSON.parse(text));
      if (pk) return pk;
    } catch (err) {
      console.error(`[resolve] v2 ${version}: ${err.message || err}`);
    }
  }
  throw new Error('Managed-key API nicht verfügbar');
}

const attempts = [
  ['keys list', tryKeysList],
  ['account', tryAccount],
  ['developer keys', tryDeveloperKeys],
  ['managed key api', tryManagedKeyApi],
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
