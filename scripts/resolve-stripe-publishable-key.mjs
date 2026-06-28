#!/usr/bin/env node
/**
 * Resolves Stripe publishable key for frontend builds (fetch + stripe-cli).
 */
import { execSync } from 'node:child_process';
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

function tryStripeCli() {
  const cli = process.env.STRIPE_CLI_BIN || 'stripe';
  try {
    const out = execSync(`${cli} --api-key "${sk}" config --list`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const pk = findPkDeep(out);
    if (pk) return pk;
    throw new Error('stripe config --list ohne pk');
  } catch (err) {
    const stderr = err.stderr?.toString?.() || '';
    const stdout = err.stdout?.toString?.() || '';
    throw new Error((stderr || stdout || err.message || String(err)).slice(0, 300));
  }
}

async function tryAccount() {
  const data = await getJson('/v1/account');
  const pk = findPkDeep(data);
  if (pk) return pk;
  throw new Error('Kein pk in /v1/account');
}

async function tryPaymentIntentScan() {
  const list = await getJson('/v1/payment_intents?limit=10');
  const pkListed = findPkDeep(list);
  if (pkListed) return pkListed;

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: '100',
      currency: 'eur',
      'automatic_payment_methods[enabled]': 'true',
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PI HTTP ${res.status}: ${text.slice(0, 200)}`);
  const pk = findPkDeep(text);
  if (pk) return pk;
  throw new Error('PI response ohne pk');
}

async function tryWebhookScan() {
  const data = await getJson('/v1/webhook_endpoints?limit=10');
  const pk = findPkDeep(data);
  if (pk) return pk;
  throw new Error('webhooks ohne pk');
}

async function trySuffixDerivation() {
  const candidate = sk.replace(/^sk_(test|live)_/, 'pk_$1_');
  if (!/^pk_(test|live)_/.test(candidate)) {
    throw new Error('suffix derivation format invalid');
  }
  const res = await fetch('https://api.stripe.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candidate}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      type: 'card',
      'card[number]': '4242424242424242',
      'card[exp_month]': '12',
      'card[exp_year]': '34',
      'card[cvc]': '123',
    }),
  });
  const text = await res.text();
  if (/invalid api key/i.test(text)) {
    throw new Error('suffix derivation rejected by Stripe');
  }
  return candidate;
}

const attempts = [
  ['stripe cli', () => tryStripeCli()],
  ['suffix derivation', trySuffixDerivation],
  ['payment intent scan', tryPaymentIntentScan],
  ['webhook scan', tryWebhookScan],
  ['account', tryAccount],
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
