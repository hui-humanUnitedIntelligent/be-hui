// src/lib/referralTracking.js
// ── HUI Referral-Tracking ─────────────────────────────────────
// Erkennt Ref-Links beim Besuch und speichert den Ambassador-Username
// für die spätere Zuordnung nach der Registrierung.

const STORAGE_KEY = 'hui_referral_code';
const STORAGE_AMB_KEY = 'hui_referral_ambassador';

/**
 * Beim Seitenaufruf: URL-Pfad auf Ambassador-Username prüfen.
 * Format: https://be-hui.com/[username]
 * Speichert den Username 7 Tage in localStorage.
 */
export function detectReferral() {
  try {
    const path = window.location.pathname;
    // Nur einfache Pfade ohne Unterseiten (z.B. /max-mustermann)
    const match = path.match(/^\/([a-zA-Z0-9._-]{3,50})$/);
    if (!match) return null;
    const username = match[1].toLowerCase();
    // Bekannte App-Routen ausschließen
    const EXCLUDED = ['home', 'login', 'studio', 'impact', 'admin', 'diagnose', 'dashboard', 'profile', 'work', 'auth', 'ref'];
    if (EXCLUDED.includes(username)) return null;
    // In localStorage speichern (7 Tage)
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify({ username, expiry }));
    console.log('[HUI Referral] Ambassador erkannt:', username);
    return username;
  } catch { return null; }
}

/**
 * Gespeicherten Referral-Ambassador-Username abrufen.
 */
export function getStoredReferral() {
  try {
    const raw = localStorage.getItem(STORAGE_AMB_KEY);
    if (!raw) return null;
    const { username, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(STORAGE_AMB_KEY); return null; }
    return username;
  } catch { return null; }
}

/**
 * Referral-Zuordnung nach Registrierung verarbeiten.
 * Findet den Ambassador anhand des Username und aktualisiert
 * das Profil des neuen Nutzers sowie den Ambassador-Zähler.
 */
export async function processReferralAfterSignup(supabase, newUserId) {
  const username = getStoredReferral();
  if (!username) return;
  try {
    // Ambassador anhand username finden
    const { data: ambProfile } = await supabase
      .from('profiles')
      .select('id, profile_modules')
      .eq('username', username)
      .single();

    if (!ambProfile) return;
    const pm  = ambProfile.profile_modules || {};
    const amb = pm.ambassador || {};
    if (amb.is_ambassador !== true || amb.status !== 'active') return;
    if (amb.link_active === false) return;

    const ambassadorId = ambProfile.id;

    // Eigenes Profil mit referred_by_ambassador_id aktualisieren
    await supabase.from('profiles').update({
      referred_by_ambassador_id: ambassadorId,
      profile_modules: {
        ...(await supabase.from('profiles').select('profile_modules').eq('id', newUserId).single()).data?.profile_modules,
        referred_by: amb.referral_code || username,
      }
    }).eq('id', newUserId);

    // Ambassador: referral_count +1
    const newCount = (Number(amb.referral_count) || 0) + 1;
    await supabase.from('profiles').update({
      profile_modules: {
        ...pm,
        ambassador: { ...amb, referral_count: newCount }
      }
    }).eq('id', ambassadorId);

    // localStorage leeren
    localStorage.removeItem(STORAGE_AMB_KEY);
    console.log('[HUI Referral] Zuordnung erfolgreich — Ambassador:', username, '| Neue Referrals:', newCount);
  } catch (e) {
    console.warn('[HUI Referral] Fehler bei der Zuordnung:', e);
  }
}
