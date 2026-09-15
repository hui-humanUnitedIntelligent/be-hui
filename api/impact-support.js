// api/impact-support.js — Öffentliche Projekt-Unterstützung (Stripe Checkout)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function: POST /api/impact-support
// Erstellt eine Stripe-Checkout-Session für die direkte Unterstützung
// eines konkreten öffentlichen Impact-Projekts.
//
// Nutzt die BESTEHENDE HUI-Zahlungsinfrastruktur:
//   - Derselbe Stripe-Account wie die HUI-App (STRIPE_SECRET_KEY)
//   - Metadaten-Schema kompatibel zum App-Webhook
//     (payment_type, project_id, ...) — keine parallele Architektur
//   - Die Projekt-Zuordnung erfolgt ausschließlich serverseitig:
//     Der Client sendet nur slug + amount; Existenz und Status des
//     Projekts werden serverseitig gegen die zentrale Datenquelle
//     geprüft (status='active'), der Betrag serverseitig validiert.
//
// Ehrlichkeit:
//   - KEINE Erfolgsmeldung an dieser Stelle — Erfolg wird ausschließlich
//     serverseitig nach Rückkehr von Stripe verifiziert
//     (siehe api/impact-project.js, payment_status === 'paid')
//
// Sicherheit:
//   - Service-Role-Keys nur serverseitig
//   - Same-Origin-Check für POST-Anfragen
//   - Rate Limiting (max. 5 Requests/Minute pro IP, in-memory pro Instanz)
//   - Betragsvalidierung: 0,50 € – 5.000 € (wie die bestehende
//     Support-Zahlung der App), Ganzzent-Rundung
// ══════════════════════════════════════════════════════════════════

const { getProjectBySlug } = require('./lib/impact-data.js');

const SITE_URL = 'https://be-hui.com';
const MIN_AMOUNT_EUR = 0.5;    // wie create-support-payment (MIN_AMOUNT_CENTS = 50)
const MAX_AMOUNT_EUR = 5000;  // wie create-support-payment (MAX_AMOUNT_CENTS = 500000)

// ── Rate Limiting (in-memory, pro Vercel-Instanz — wie startphase-submit) ──
const rateMap = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 5;

function checkRate(ip) {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_MAX) return false;
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  if (rateMap.size > 5000) rateMap.clear(); // Speicher-Schutz
  return true;
}

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

module.exports = async (req, res) => {
  // ── Nur POST ──
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Nur POST erlaubt', code: 'METHOD_NOT_ALLOWED' });
  }

  // ── Same-Origin-Schutz ──
  const origin = (req.headers && (req.headers.origin || req.headers.referer)) || '';
  if (origin && !origin.includes('be-hui.com')) {
    return json(res, 403, { error: 'Unerlaubte Quelle', code: 'BAD_ORIGIN' });
  }

  // ── Rate Limiting ──
  const ip = (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || 'unknown';
  if (!checkRate(String(ip).split(',')[0].trim())) {
    return json(res, 429, { error: 'Zu viele Anfragen. Bitte kurz warten.', code: 'RATE_LIMITED' });
  }

  // ── Eingaben lesen ──
  let payload = {};
  try { payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch (_) { payload = {}; }
  const slug = String(payload.slug || '');
  const amountEur = Number(payload.amount_eur);

  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return json(res, 400, { error: 'Ungültiges Projekt.', code: 'INVALID_SLUG' });
  }
  if (!amountEur || Number.isNaN(amountEur) || amountEur < MIN_AMOUNT_EUR || amountEur > MAX_AMOUNT_EUR) {
    return json(res, 400, { error: `Betrag zwischen ${String(MIN_AMOUNT_EUR).replace('.', ',')} € und ${String(MAX_AMOUNT_EUR)} € wählen.`, code: 'INVALID_AMOUNT' });
  }

  // ── Projekt serverseitig verifizieren (alleinige Wahrheit) ──
  let project = null;
  try {
    project = await getProjectBySlug(slug);
  } catch (err) {
    console.error('[IMPACT-SUPPORT]', err.message);
    return json(res, 500, { error: 'Datenquelle nicht erreichbar. Bitte später erneut versuchen.', code: 'DATA_SOURCE_ERROR' });
  }
  if (!project) {
    return json(res, 404, { error: 'Dieses Projekt ist nicht öffentlich verfügbar.', code: 'PROJECT_NOT_FOUND' });
  }

  // ── Stripe konfiguriert? (erst nach günstigeren Validierungen) ──
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return json(res, 503, { error: 'Stripe ist für die Website noch nicht konfiguriert.', code: 'STRIPE_NOT_CONFIGURED' });
  }

  const amountCents = Math.round(amountEur * 100);

  // ── Stripe-Checkout-Session über die bestehende Stripe-Infrastruktur ──
  const successUrl = `${SITE_URL}/impact/${project.slug}?danke=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${SITE_URL}/impact/${project.slug}`;

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('submit_type', 'donate');
  params.set('locale', 'auto');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][price_data][product_data][name]', `HUI Impact — ${project.name}`.slice(0, 120));
  // Eindeutige Projekt-Zuordnung (Session- UND PaymentIntent-Metadaten,
  // Schema kompatibel zum bestehenden App-Webhook):
  params.set('metadata[payment_type]', 'impact_project_support');
  params.set('metadata[source]', 'website-impact');
  params.set('metadata[project_id]', project.id);
  params.set('metadata[project_slug]', project.slug);
  params.set('payment_intent_data[metadata][payment_type]', 'impact_project_support');
  params.set('payment_intent_data[metadata][source]', 'website-impact');
  params.set('payment_intent_data[metadata][project_id]', project.id);
  params.set('payment_intent_data[metadata][project_slug]', project.slug);
  params.set('payment_intent_data[description]', `HUI Impact — Unterstützung: ${project.name}`.slice(0, 300));

  let session;
  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    session = await stripeRes.json();
    if (!stripeRes.ok || !session || !session.url) {
      console.error('[IMPACT-SUPPORT] Stripe-Fehler:', session && session.error ? session.error.message : stripeRes.status);
      return json(res, 502, { error: 'Zahlung konnte nicht gestartet werden. Bitte später erneut versuchen.', code: 'STRIPE_ERROR' });
    }
  } catch (err) {
    console.error('[IMPACT-SUPPORT]', err.message);
    return json(res, 502, { error: 'Zahlungsdienst nicht erreichbar. Bitte später erneut versuchen.', code: 'STRIPE_UNREACHABLE' });
  }

  // ── Antwort: Nur die Redirect-URL — KEIN Zahlungserfolg ──
  return json(res, 200, {
    url: session.url,
    session_id: session.id,
    project: project.slug,
  });
};
