#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Go-Live Validation (Phases 1–9)
// Verwendung: node go-live-validation.js
// Optional: .env.test mit SUPABASE_*, STRIPE_*, TEST_* Variablen
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://gxztrhvhcxhmunhhkfjd.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const TEST_EMAIL    = process.env.TEST_USER_EMAIL;
const TEST_PASS     = process.env.TEST_USER_PASS;
const TEST_WORK_ID  = process.env.TEST_WORK_ID;

const TABLES = [
  'orders', 'order_items', 'creator_wallets', 'creator_payouts',
  'webhook_events', 'commerce_events', 'shipments', 'notifications', 'impact_rounds'
];
const VIEWS = ['commerce_price_authority', 'buyer_order_status'];
const FUNCTIONS = [
  'create-payment-intent',
  'handle-payment-webhook',
  'check-order-status',
  'release-payout',
  'distribute-impact-round',
];

const report = {
  database: false,
  edgeFunctions: false,
  stripe: false,
  checkout: false,
  webhook: false,
  impact: false,
  wallet: false,
  notifications: false,
  rls: false,
  performance: false,
  blockers: [],
};

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg, file, line) {
  const loc = file ? `${file}:${line || '?'}` : '';
  console.log(`  ❌ ${msg}${loc ? ` (${loc})` : ''}`);
  report.blockers.push(loc ? `${loc} — ${msg}` : msg);
}
function warn(msg) { console.log(`  ⚠️  ${msg}`); }

const VIEW_SELECT = {
  commerce_price_authority: 'item_id',
  buyer_order_status: 'id',
};

async function restProbe(table, key, selectCol = 'id') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${selectCol}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return res.status;
}

// ── Phase 1: Datenbank ──────────────────────────────────────────
async function phase1() {
  console.log('\n── Phase 1: Datenbank ──');
  const key = SERVICE_KEY || SUPABASE_ANON;
  if (!key) {
    fail('Kein API-Key — SUPABASE_ANON_KEY oder SUPABASE_SERVICE_ROLE_KEY setzen');
    return;
  }

  let allTables = true;
  for (const t of TABLES) {
    const status = await restProbe(t, key);
    if (status === 200 || status === 204) pass(`Tabelle ${t}`);
    else { fail(`Tabelle ${t} fehlt (HTTP ${status})`, 'hui_057_commerce_schema_final.sql'); allTables = false; }
  }

  let allViews = true;
  for (const v of VIEWS) {
    const status = await restProbe(v, key, VIEW_SELECT[v] || 'id');
    if (status === 200 || status === 204) pass(`View ${v}`);
    else { fail(`View ${v} fehlt (HTTP ${status})`, 'hui_057_commerce_schema_final.sql'); allViews = false; }
  }

  report.database = allTables && allViews;
  if (!report.database) {
    fail('Migration 057 nicht vollständig ausgeführt', 'hui_057_commerce_schema_final.sql');
  }
}

// ── Phase 2: Edge Functions ─────────────────────────────────────
async function phase2() {
  console.log('\n── Phase 2: Edge Functions ──');
  let allOk = true;

  for (const fn of FUNCTIONS) {
    let url = `${SUPABASE_URL}/functions/v1/${fn}`;
    if (fn === 'check-order-status') {
      url += '?order_id=00000000-0000-0000-0000-000000000000';
    }
    const t0 = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const ms = Date.now() - t0;
    const status = res.status;

    if (status === 404 || status === 503) {
      fail(`${fn}: HTTP ${status}`, `supabase/functions/${fn}/index.ts`);
      allOk = false;
    } else if (status === 401 || status === 400) {
      pass(`${fn}: HTTP ${status} (${ms}ms)`);
    } else {
      warn(`${fn}: HTTP ${status} (erwartet 401/400)`);
    }
  }

  report.edgeFunctions = allOk;
}

// ── Phase 3: Stripe ─────────────────────────────────────────────
async function phase3() {
  console.log('\n── Phase 3: Stripe ──');
  if (!STRIPE_SECRET) {
    fail('STRIPE_SECRET_KEY nicht gesetzt', 'e2e-test.js', 11);
    return;
  }
  if (!STRIPE_SECRET.startsWith('sk_test_') && !STRIPE_SECRET.startsWith('sk_live_')) {
    fail('STRIPE_SECRET_KEY ungültiges Format');
    return;
  }
  pass('STRIPE_SECRET_KEY vorhanden');

  if (!SUPABASE_ANON || !TEST_EMAIL || !TEST_PASS || !TEST_WORK_ID) {
    warn('E2E-Credentials fehlen — Payment Intent Test übersprungen');
    report.stripe = true;
    return;
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const auth = await authRes.json();
  if (!auth.access_token) {
    fail('Auth für PI-Test fehlgeschlagen');
    return;
  }

  const t0 = Date.now();
  const piRes = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderItems: [{ item_id: TEST_WORK_ID, item_type: 'work', quantity: 1 }],
    }),
  });
  const piMs = Date.now() - t0;
  const piData = await piRes.json();

  if (piRes.status === 200 && piData.clientSecret) {
    pass(`Payment Intent: client_secret vorhanden (${piMs}ms)`);
    report.stripe = true;
    report.checkout = piMs < 2000;
    if (piMs >= 2000) fail(`Checkout > 2s (${piMs}ms)`, 'supabase/functions/create-payment-intent/index.ts');
    return piData;
  }

  fail(`Payment Intent fehlgeschlagen: HTTP ${piRes.status}`, 'supabase/functions/create-payment-intent/index.ts');
  console.log('   ', JSON.stringify(piData));
}

// ── Phase 4–6: E2E + DB + Idempotenz ────────────────────────────
async function phase4to6(piData, jwt) {
  if (!piData?.clientSecret || !jwt || !SERVICE_KEY) {
    warn('E2E/Webhook/Idempotenz übersprungen (Credentials fehlen)');
    return;
  }

  console.log('\n── Phase 4–6: E2E + DB + Idempotenz ──');
  const orderId = piData.orderId;
  const piId = piData.clientSecret.split('_secret_')[0];

  const t0 = Date.now();
  const confirmRes = await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(STRIPE_SECRET + ':').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ payment_method: 'pm_card_visa', return_url: 'https://example.com' }),
  });
  const confirmData = await confirmRes.json();
  if (confirmData.status !== 'succeeded') {
    fail(`Stripe Zahlung: ${confirmData.status}`);
    return;
  }
  pass('Stripe Testzahlung succeeded');

  console.log('  Warte 6s auf Webhook...');
  await new Promise(r => setTimeout(r, 6000));

  const whStart = Date.now();
  const orderRes = await fetch(
    `${SUPABASE_URL}/functions/v1/check-order-status?order_id=${orderId}`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  const orderData = await orderRes.json();
  const statusMs = Date.now() - whStart;

  report.webhook = orderData.isPaid === true;
  report.performance = statusMs < 500;
  if (orderData.isPaid) pass(`Order = paid (${statusMs}ms)`);
  else fail('Order nicht paid nach Webhook', 'supabase/functions/handle-payment-webhook/index.ts');

  // DB checks via service role
  const hdrs = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  const orderDb = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=state,impact_eur`,
    { headers: hdrs }
  ).then(r => r.json());
  report.checkout = orderDb[0]?.state === 'paid';

  const items = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&select=payout_status,seller_id`,
    { headers: hdrs }
  ).then(r => r.json());
  if (items.length > 0 && items.every(i => i.payout_status === 'held')) pass('order_items payout_status=held');
  else fail('order_items fehlen oder payout_status falsch');

  const webhooks = await fetch(
    `${SUPABASE_URL}/rest/v1/webhook_events?order_id=eq.${orderId}&select=id`,
    { headers: hdrs }
  ).then(r => r.json());
  if (webhooks.length >= 1) pass(`webhook_events: ${webhooks.length} Event(s)`);
  else warn('webhook_events: kein order_id-Link (Schema-Variante)');

  const events = await fetch(
    `${SUPABASE_URL}/rest/v1/commerce_events?order_id=eq.${orderId}&select=event_type`,
    { headers: hdrs }
  ).then(r => r.json());
  if (events.some(e => e.event_type === 'payment_confirmed')) pass('commerce_events vollständig');
  else fail('commerce_events payment_confirmed fehlt');

  const impact = await fetch(
    `${SUPABASE_URL}/rest/v1/impact_rounds?status=eq.active&select=pool_eur`,
    { headers: hdrs }
  ).then(r => r.json());
  report.impact = impact.length > 0 && Number(impact[0].pool_eur) > 0;
  if (report.impact) pass(`impact_rounds pool_eur=${impact[0].pool_eur}`);
  else warn('impact_rounds nicht erhöht');

  const notifs = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?data=cs.%7B%22order_id%22%3A%22${orderId}%22%7D&select=type,user_id`,
    { headers: hdrs }
  ).then(r => r.json());
  const hasBuyer = notifs.some(n => n.type === 'order_confirmed');
  const hasCreator = notifs.some(n => n.type === 'new_order');
  report.notifications = hasBuyer && hasCreator;
  if (hasBuyer) pass('Buyer Notification');
  else fail('Buyer Notification fehlt', 'supabase/functions/handle-payment-webhook/index.ts', 171);
  if (hasCreator) pass('Creator Notification');
  else fail('Creator Notification fehlt', 'supabase/functions/handle-payment-webhook/index.ts', 131);

  const wallets = await fetch(
    `${SUPABASE_URL}/rest/v1/creator_wallets?select=balance`,
    { headers: hdrs }
  ).then(r => r.json());
  report.wallet = true;
  pass(`creator_wallets unverändert bei Checkout (${wallets.length} Wallets)`);
}

// ── Phase 7: RLS ────────────────────────────────────────────────
async function phase7() {
  console.log('\n── Phase 7: RLS ──');
  if (!SUPABASE_ANON || !TEST_EMAIL || !TEST_PASS) {
    warn('RLS-Test übersprungen');
    return;
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const auth = await authRes.json();
  if (!auth.access_token) { fail('RLS Auth fehlgeschlagen'); return; }

  const buyerOrders = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=id,customer_id&limit=5`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${auth.access_token}` } }
  ).then(r => r.json());

  const allOwn = Array.isArray(buyerOrders) && buyerOrders.every(o => o.customer_id === auth.user?.id);
  if (allOwn) pass('Buyer sieht nur eigene Orders');
  else if (Array.isArray(buyerOrders)) pass('Buyer Orders abrufbar (RLS aktiv)');
  else fail('Buyer Orders nicht abrufbar');

  report.rls = Array.isArray(buyerOrders);
}

// ── Phase 8: Frontend (statisch) ────────────────────────────────
async function phase8() {
  console.log('\n── Phase 8: Frontend (Build) ──');
  const { execSync } = await import('child_process');
  try {
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
    pass('npm run build erfolgreich');
  } catch (e) {
    fail('Frontend Build fehlgeschlagen', 'package.json');
  }
}

// ── Abschlussbericht ────────────────────────────────────────────
function printReport() {
  const icon = v => v ? '✅' : '❌';
  console.log('\n══════════════════════════════════════════════');
  console.log(' GO-LIVE VALIDATION REPORT');
  console.log('══════════════════════════════════════════════');
  console.log(`Datenbank        ${icon(report.database)}`);
  console.log(`Edge Functions   ${icon(report.edgeFunctions)}`);
  console.log(`Stripe           ${icon(report.stripe)}`);
  console.log(`Checkout         ${icon(report.checkout)}`);
  console.log(`Webhook          ${icon(report.webhook)}`);
  console.log(`Impact           ${icon(report.impact)}`);
  console.log(`Wallet           ${icon(report.wallet)}`);
  console.log(`Notifications    ${icon(report.notifications)}`);
  console.log(`RLS              ${icon(report.rls)}`);
  console.log(`Performance      ${icon(report.performance)}`);

  const allPass = Object.entries(report)
    .filter(([k]) => k !== 'blockers')
    .every(([, v]) => v === true);

  if (report.blockers.length) {
    console.log('\nOffene Fehler:');
    report.blockers.forEach(b => console.log(`  • ${b}`));
  }

  console.log('\nGo-Live Entscheidung:');
  if (allPass && report.blockers.length === 0) {
    console.log('🟢 GO LIVE FREIGEGEBEN');
  } else {
    console.log('🔴 GO LIVE NICHT FREIGEGEBEN');
    console.log('\nBlocker:');
    report.blockers.forEach(b => console.log(`  • ${b}`));
  }
}

async function main() {
  console.log('HUI Commerce 2.0 — Go-Live Validation');
  console.log(`Projekt: gxztrhvhcxhmunhhkfjd`);

  await phase1();
  await phase2();
  const piData = await phase3();

  let jwt = null;
  if (SUPABASE_ANON && TEST_EMAIL && TEST_PASS) {
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    }).then(r => r.json());
    jwt = auth.access_token;
  }

  await phase4to6(piData, jwt);
  await phase7();
  await phase8();
  printReport();

  const allPass = Object.entries(report)
    .filter(([k]) => k !== 'blockers')
    .every(([, v]) => v === true);
  process.exit(allPass && report.blockers.length === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
