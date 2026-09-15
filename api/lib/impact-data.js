// api/lib/impact-data.js — Öffentlicher Zugriff auf die zentrale HUI-Datenquelle
// ══════════════════════════════════════════════════════════════════
// Single Source of Truth: Die Impact-Projekte werden AUSSCHLIESSLICH
// aus der vorhandenen Supabase-Tabelle `impact_projects` gelesen —
// derselben Datenquelle, die auch die HUI-App nutzt. Die Website legt
// KEINE eigene Projekt-Datenbank an.
//
// Sichtbarkeit: Die App zeigt Projekte mit status='active'
// (ImpactService.getActiveProjects). Die Website verwendet exakt
// dieselbe bestehende Logik — keine zweite Veröffentlichungslogik.
//
// Sicherheit:
//   - Service-Role-Key nur serverseitig (nie im Client)
//   - Feld-Whitelist: kontaktbezogene Felder (contact_name,
//     contact_email) werden bewusst NICHT angefragt
//   - Keine privaten, internen oder Test-Projekte (status-Filter)
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Öffentliche Felder (Whitelist) — bewusst KEINE Kontaktdaten
const PUBLIC_FIELDS = 'id,name,description,category,status,votes,awarded_eur,impact_report,tags,icon,color,website,month,created_at';

async function fetchPublicProjects() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  const url = `${SUPABASE_URL}/rest/v1/impact_projects?select=${encodeURIComponent(PUBLIC_FIELDS)}&status=eq.active&order=created_at.desc&limit=100`;
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

// Deterministische Slug-Auflösung aus dem Projektnamen.
// Die Tabelle besitzt kein eigenes Slug-Feld — der Slug wird daher
// aus dem (eindeutigen) Namen abgeleitet, mit ID-Kürzel bei Kollisionen.
function withSlugs(projects) {
  const seen = new Set();
  const result = [];
  for (const p of projects) {
    let base = slugifyProject(p.name);
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

// Projekt nach Slug suchen (nur öffentliche/aktive — Filter läuft in fetch)
async function getProjectBySlug(slug) {
  const projects = withSlugs(await fetchPublicProjects());
  return projects.find((p) => p.slug === slug) || null;
}

module.exports = { fetchPublicProjects, withSlugs, getProjectBySlug };
