// SICHERHEITSFIX (2026-08-26): CORS restriktiert statt Wildcard
// Erlaubte Origins: HUI App Domains + Capacitor + Dev
const ALLOWED_ORIGINS = [
  'https://be-hui.vercel.app',
  'https://be-hui.com',
  'https://www.be-hui.com',
  'https://app.be-hui.com',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  'https://localhost:5173',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };
}

// For functions that don't need CORS (server-to-server like Stripe webhooks)
export function getNoCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': 'null',
  };
}
