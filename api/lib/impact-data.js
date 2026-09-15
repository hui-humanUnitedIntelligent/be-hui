// api/lib/impact-data.js — Öffentlicher Zugriff auf die zentrale HUI-Datenquelle
// ══════════════════════════════════════════════════════════════════
// Single Source of Truth: Die Impact-Projekte werden AUSSCHLIESSLICH
// aus der Supabase-Tabelle `impact_applications` gelesen — derselben
// Datenquelle, die auch die HUI-App für ihren Impactpool nutzt
// (ImpactStimmenModal / PROJECT-DIRECT-SUPPORT-001, Migration 141).
// Die Website legt KEINE eigene Projekt-Datenbank an.
//
// Sichtbarkeit (identisch zur App, keine zweite Veröffentlichungslogik):
//   status='approved' — die App zeigt exakt diese Projekte im Pool.
//
// Sicherheit:
//   - Service-Role-Key nur serverseitig (nie im Client)
//   - Feld-Whitelist: kontaktbezogene und interne Felder (user_id,
//     contact_name, contact_email, contact_phone, reviewed_by,
//     admin_comment, review_note, rejection_reason, fit_score,
//     score_breakdown) werden bewusst NICHT angefragt
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Öffentliche Felder (Whitelist) — bewusst KEINE Kontakt- oder Review-Daten
const PUBLIC_FIELDS = 'id,project_name,short_desc,problem,vision,funding_use,funding_goal,current_amount_eur,cover_url,media_urls,location,website,created_at,status,is_completed,rank,direct_supports';

async function fetchPublicProjects() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  const url = `${SUPABASE_URL}/rest/v1/impact_applications`
    + `?select=${encodeURIComponent(PUBLIC_FIELDS)}`
    + `&status=eq.approved`
    + `&order=created_at.desc`
    + `&limit=100`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
    },
  });
  if (!res.ok) throw new Error(`SUPABASE_ERROR_${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('SUPABASE_INVALID_RESPONSE');
  return rows;
}

// Deterministische Slug-Auflösung aus dem Projektnamen (wie die öffentliche
// URL-Ebene der App). Die Tabelle besitzt kein eigenes Slug-Feld — der Slug
// wird aus dem (eindeutigen) Namen abgeleitet, mit ID-Kürzel bei Kollisionen.
function withSlugs(projects) {
  const seen = new Set();
  const result = [];
  for (const p of projects) {
    let base = slugifyProject(p.project_name);
    if (!base) base = 'projekt';
    let slug = base;
    if (seen.has(slug)) slug = `${base}-${String(p.id).slice(0, 6)}`;
    seen.add(slug);
    result.push({ ...p, slug });
  }
  return result;
}

function slugifyProject(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

// Projekt nach Slug suchen (nur öffentliche/approved — Filter läuft in fetch)
async function getProjectBySlug(slug) {
  const projects = withSlugs(await fetchPublicProjects());
  return projects.find((p) => p.slug === slug) || null;
}

// ── Buchungslogik: identisch zur App (create-project-support-payment) ──
// Netto nach reiner Stripe-Standardgebühr (2,9% + 0,30 €) fließt an das
// Projekt — exakt die Formel der App-Edge-Function.
const STRIPE_FEE_PCT = 0.029;
const STRIPE_FEE_FIX = 0.30;

function calcStripeFee(grossEur) {
  const fee = +(grossEur * STRIPE_FEE_PCT + STRIPE_FEE_FIX).toFixed(2);
  const net = +(grossEur - fee).toFixed(2);
  return { fee, net };
}

module.exports = { fetchPublicProjects, withSlugs, getProjectBySlug, calcStripeFee };
