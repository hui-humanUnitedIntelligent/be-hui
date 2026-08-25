// ══════════════════════════════════════════════════════════════════════════════
// HUI Load Test — k6
// Testet die kritischen User-Flows gegen die Live-App
// ══════════════════════════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const rpcTime = new Trend('rpc_response_ms')

const BASE_URL = __ENV.BASE_URL || 'https://be-hui-current.vercel.app';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://gxztrhvhcxhmunhhkfjd.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 100 },
    { duration: '2m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.05'],
    errors:            ['rate<0.05'],
  },
};

function supaHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

export default function () {
  // 1. APP SHELL
  group('App Shell', () => {
    const res = http.get(`${BASE_URL}/`);
    errorRate.add(!check(res, {
      'status 200/302': (r) => r.status === 200 || r.status === 302,
      'has HTML body':  (r) => r.body && r.body.length > 100,
    }));
  });

  sleep(1);

  // 2. SUPABASE HEALTH
  group('Supabase Health', () => {
    const res = http.get(`${SUPABASE_URL}/auth/v1/health`, { headers: supaHeaders() });
    errorRate.add(!check(res, { 'status 200': (r) => r.status === 200 }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 3. RPC: Home Dashboard (1 Call statt 13)
  group('RPC: Home Dashboard', () => {
    const res = http.post(`${SUPABASE_URL}/rest/v1/rpc/rpc_get_home_dashboard`, JSON.stringify({}), { headers: supaHeaders() });
    errorRate.add(!check(res, {
      'status 200': (r) => r.status === 200,
      'has stats':  (r) => r.body && r.body.includes('stats'),
    }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 4. RPC: Live Ticker (1 Call statt 13)
  group('RPC: Live Ticker', () => {
    const res = http.post(`${SUPABASE_URL}/rest/v1/rpc/rpc_get_live_ticker_feed`, JSON.stringify({}), { headers: supaHeaders() });
    errorRate.add(!check(res, { 'status 200': (r) => r.status === 200 }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 5. DB: Werke (status=published, created_at nicht created_date)
  group('DB: Werke', () => {
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/works?select=id,title,cover_url,price_eur&status=eq.published&limit=20&order=created_at.desc`,
      { headers: supaHeaders() }
    );
    errorRate.add(!check(res, {
      'status 200':     (r) => r.status === 200,
      'has JSON array': (r) => r.body && (r.body.startsWith('[') || r.body === '[]'),
    }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 6. DB: Talente (price_per_hour nicht price_eur, created_at)
  group('DB: Talente', () => {
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/talents?select=id,title,price_per_hour&status=eq.approved&limit=20&order=created_at.desc`,
      { headers: supaHeaders() }
    );
    errorRate.add(!check(res, {
      'status 200':     (r) => r.status === 200,
      'has JSON array': (r) => r.body && (r.body.startsWith('[') || r.body === '[]'),
    }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 7. DB: Experiences (nur id,title)
  group('DB: Experiences', () => {
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/experiences?select=id,title&limit=20&order=created_at.desc`,
      { headers: supaHeaders() }
    );
    errorRate.add(!check(res, {
      'status 200':     (r) => r.status === 200,
      'has JSON array': (r) => r.body && (r.body.startsWith('[') || r.body === '[]'),
    }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(0.5);

  // 8. DB: Impact Applications
  group('DB: Impact Applications', () => {
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/impact_applications?select=id&status=eq.approved&limit=10`,
      { headers: supaHeaders() }
    );
    errorRate.add(!check(res, {
      'status 200':     (r) => r.status === 200,
      'has JSON array': (r) => r.body && (r.body.startsWith('[') || r.body === '[]'),
    }));
    rpcTime.add(res.timings.waiting + res.timings.receiving);
  });

  sleep(1);
}
