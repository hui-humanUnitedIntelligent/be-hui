// api/startphase-submit.js — HUI Startphase Bewerbung (2026-09-02)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function: Nimmt Bewerbungsdaten vom Startphase-
// Formular entgegen, speichert sie in Supabase und sendet eine
// automatische Bestätigungsmail an den Bewerber via Resend.
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
//   - Bestätigungsmail ist fehlertolerant: DB-Save hat Priorität
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

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

// ── Bestätigungsmail via Resend ──
async function sendConfirmationEmail(recipientEmail, firstName) {
  if (!RESEND_API_KEY) {
    console.warn('[startphase-submit] RESEND_API_KEY not set — skipping confirmation email');
    return { ok: false, reason: 'no_key' };
  }

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#141422;line-height:1.7">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:24px">
    <img src="https://be-hui.com/hui_logo.webp" alt="HUI" width="36" height="36" style="border-radius:8px"/>
  </div>
  <h1 style="font-size:20px;font-weight:700;letter-spacing:-.01em;margin:0 0 20px;color:#141422">Danke für deine Bewerbung, ${firstName}!</h1>
  <p style="font-size:15px;color:#3A3A55;margin:0 0 16px">Wir haben deine Bewerbung für die HUI Startphase erhalten und freuen uns sehr über dein Interesse.</p>
  <p style="font-size:15px;color:#3A3A55;margin:0 0 16px">HUI entsteht durch Menschen, Ideen, Fähigkeiten und Verbindungen. Wir lesen dir deine Antworten in Ruhe durch und melden uns in Kürze persönlich bei dir.</p>
  <p style="font-size:15px;color:#3A3A55;margin:0 0 16px">Bis dahin: Willkommen in der HUI-Community. Wir freuen uns auf das, was gemeinsam entsteht.</p>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(20,20,34,.05);font-size:13px;color:#8A8A9E">
    <p>HUI Team — Human United Intelligence</p>
    <p>Diese E-Mail wurde automatisch nach deiner Bewerbung gesendet.</p>
  </div>
</div>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HUI Team <noreply@be-hui.com>',
        to: recipientEmail,
        subject: 'Danke für deine Bewerbung — HUI Startphase',
        html: htmlBody,
        reply_to: 'noreply@be-hui.com',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[startphase-submit] Resend error:', res.status, errText);
      return { ok: false, reason: 'api_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[startphase-submit] Email send error:', err.message);
    return { ok: false, reason: 'network' };
  }
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

    // ── Bestätigungsmail senden (fehlerschonend, nach erfolgreichem DB-Insert) ──
    // DB-Save hat Priorität — Email-Fehler machen die Bewerbung nicht ungültig
    const emailResult = await sendConfirmationEmail(record.email, record.first_name);
    if (emailResult.ok) {
      console.log('[startphase-submit] Confirmation email sent to', record.email);
    } else if (emailResult.reason === 'no_key') {
      console.warn('[startphase-submit] Confirmation email skipped — RESEND_API_KEY not set in Vercel');
    } else {
      console.warn('[startphase-submit] Confirmation email failed — DB save succeeded, email did not');
    }

    return res.status(201).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ success: true });
  } catch (err) {
    console.error('[startphase-submit] Network error:', err.message);
    return res.status(502).setHeader('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']).json({ error: 'network_error' });
  }
};
