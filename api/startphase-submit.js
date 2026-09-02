// api/startphase-submit.js — HUI Startphase Bewerbung (2026-09-02)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function: Nimmt Bewerbungsdaten vom Startphase-
// Formular entgegen und speichert sie serverseitig in Supabase.
//
// SICHERHEIT:
//   - SUPABASE_SERVICE_KEY wird NUR über process.env gelesen
//   - Key wird NIEMALS ausgegeben, geloggt oder an den Client gesendet
//   - Eingabevalidierung für alle Pflichtfelder
//   - Whitelist der erlaubten Formularfelder (keine beliebigen DB-Felder)
//   - Nur 6 erlaubte interest-Werte: idea, talent, experience, time, support, curiosity
//   - Honeypot-Spamschutz (hidden field)
//   - Rate Limiting: max 3 Bewerbungen pro IP in 10 Minuten
//   - Keine Bewerbungsdaten werden an den Client zurückgegeben
//   - Nur HTTP-Status + generischer Erfolgs-/Fehlercode
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

// ── Erlaubte Formularfelder (Whitelist) ──
const ALLOWED_FIELDS = {
  first_name:        { type: 'string', max: 200, required: true },
  last_name:         { type: 'string', max: 200, required: true },
  email:             { type: 'string', max: 320, required: true },
  interest:          { type: 'enum', values: ['idea','talent','experience','time','support','curiosity'], required: false },
  country_region:    { type: 'string', max: 200, required: false },
  current_role_text: { type: 'string', max: 200, required: false },
  about_you:         { type: 'string', max: 5000, required: false },
  contributions:     { type: 'array', max: 20, itemMax: 50, required: false },
  skills:            { type: 'string', max: 2000, required: false },
  project_name:      { type: 'string', max: 300, required: false },
  project_offering:  { type: 'string', max: 5000, required: false },
  project_audience:  { type: 'string', max: 500, required: false },
  project_impact:    { type: 'string', max: 5000, required: false },
  project_needs:     { type: 'string', max: 500, required: false },
  project_missing:   { type: 'string', max: 5000, required: false },
  pioneer_reason:    { type: 'string', max: 5000, required: false },
  pioneer_wishes:    { type: 'array', max: 20, itemMax: 100, required: false },
  pioneer_first_action: { type: 'string', max: 5000, required: false },
  why_hui:           { type: 'string', max: 5000, required: false },
  what_contribute:   { type: 'string', max: 5000, required: false },
  consent_accepted:  { type: 'boolean', required: true },
};

const ALLOWED_INTERESTS = ['idea','talent','experience','time','support','curiosity'];

// ── Rate Limiting (in-memory, per Vercel instance) ──
const rateMap = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

function checkRate(ip) {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_MAX) return false;
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function corsHeaders(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed = ['https://be-hui.com', 'https://www.be-hui.com', 'http://localhost:5173', 'http://localhost:3000'];
  const match = allowed.find(a => origin.startsWith(a));
  return {
    'Access-Control-Allow-Origin': match || 'https://be-hui.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function sanitizeString(val, max) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, max);
}

function sanitizeArray(val, maxItems, itemMax) {
  if (!Array.isArray(val)) return [];
  return val
    .filter(item => typeof item === 'string' && item.length > 0 && item.length <= itemMax)
    .slice(0, maxItems);
}

module.exports = async (req, res) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'method_not_allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    console.error('[startphase-submit] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return res.status(500).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'server_config_error' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'invalid_json' });
  }

  // Honeypot: hidden field "_company" must be empty
  if (body._company && body._company.length > 0) {
    return res.status(201).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ success: true });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.headers['x-real-ip'] || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'rate_limited' });
  }

  // Validate required fields
  if (!body.first_name || !body.last_name || !body.email) {
    return res.status(400).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'required_fields_missing' });
  }
  if (!isValidEmail(body.email)) {
    return res.status(400).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'invalid_email' });
  }
  if (!body.consent_accepted) {
    return res.status(400).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'consent_required' });
  }

  // Validate interest field
  if (body.interest && !ALLOWED_INTERESTS.includes(body.interest)) {
    return res.status(400).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'invalid_interest' });
  }

  // Build record from whitelist (ignore all other client fields)
  const record = {};

  for (const [field, config] of Object.entries(ALLOWED_FIELDS)) {
    const val = body[field];
    if (val === undefined || val === null) continue;

    if (config.type === 'string') {
      const sanitized = sanitizeString(val, config.max);
      if (sanitized) record[field] = sanitized;
    } else if (config.type === 'boolean') {
      record[field] = val === true || val === 'true' || val === 1;
    } else if (config.type === 'enum') {
      if (config.values.includes(val)) record[field] = val;
    } else if (config.type === 'array') {
      record[field] = sanitizeArray(val, config.max, config.itemMax);
    }
  }

  // Ensure required fields
  record.first_name = sanitizeString(body.first_name, 200) || '';
  record.last_name = sanitizeString(body.last_name, 200) || '';
  record.email = sanitizeString(body.email, 320) || '';
  record.consent_accepted = true;
  record.status = 'new';

  // Insert into Supabase (service role, bypasses RLS)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/startphase_applications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE,
        'Authorization': `Bearer ${SUPABASE_SERVICE}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      console.error('[startphase-submit] Supabase error status:', response.status);
      return res.status(502).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'database_error' });
    }

    return res.status(201).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ success: true });
  } catch (err) {
    console.error('[startphase-submit] Network error:', err.message);
    return res.status(502).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'network_error' });
  }
};
