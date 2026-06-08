// src/lib/referralTracking.js
// -- HUI Referral-Tracking -------------------------------------
import { supabase } from "./supabaseClient.js";

const STORAGE_AMB_KEY = 'hui_referral_ambassador';

/**
 * Beim Seitenaufruf: URL-Pfad auf Ambassador-Username pruefen.
 * Format: https://be-hui.com/[username]
 */
export function detectReferral() {
  try {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-zA-Z0-9._-]{3,50})$/);
    if (!match) return null;
    const username = match[1].toLowerCase();
    const EXCLUDED = ['home', 'login', 'studio', 'impact', 'admin', 'diagnose',
      'dashboard', 'profile', 'work', 'auth', 'ref', 'entdecken', 'buchung',
      'mein-hui', 'community', 'impressum', 'datenschutz'];
    if (EXCLUDED.includes(username)) return null;
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify({ username, expiry }));
    console.log('[HUI Referral] Ambassador erkannt:', username);
    return username;
  } catch { return null; }
}

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
 * Referral-Link validieren (fuer manuelle Eingabe im Formular).
 * Gibt { valid, username, ambassadorId } zurueck.
 */
export async function validateRefLink(linkOrUsername) {
  if (!linkOrUsername?.trim()) return { valid: false };
  try {
    // aus Link den Username extrahieren
    let username = linkOrUsername.trim().toLowerCase();
    const match = username.match(/be-hui\.com\/([a-zA-Z0-9._-]+)/);
    if (match) username = match[1].toLowerCase();

    // In ambassador_ref_links nachschlagen
    const { data } = await supabase
      .from('ambassador_ref_links')
      .select('user_id, username, ref_link')
      .eq('username', username)
      .single();

    if (!data) return { valid: false, error: 'Einladungslink nicht gefunden' };
    return { valid: true, username: data.username, ambassadorId: data.user_id };
  } catch {
    return { valid: false, error: 'Einladungslink ungueltig' };
  }
}

/**
 * Referral-Zuordnung nach Registrierung verarbeiten.
 * Wird nach erfolgreicher Registrierung aufgerufen.
 */
export async function processReferralAfterSignup(newUserId, manualUsername = null) {
  const username = manualUsername || getStoredReferral();
  if (!username) return;
  try {
    // Ambassador via ambassador_ref_links finden
    const { data: refLink } = await supabase
      .from('ambassador_ref_links')
      .select('user_id, username, referral_code')
      .eq('username', username)
      .single();

    if (!refLink) {
      // Fallback: profile_modules
      const { data: ambProfile } = await supabase
        .from('profiles')
        .select('id, profile_modules')
        .eq('username', username)
        .eq('is_ambassador', true)
        .single();
      if (!ambProfile) return;
      const pm  = ambProfile.profile_modules || {};
      const amb = pm.ambassador || {};
      if (amb.is_ambassador !== true || amb.link_active === false) return;
      await _assignReferral(newUserId, ambProfile.id, amb.referral_code || username, pm, amb);
      return;
    }

    // Ambassador-Profil laden
    const { data: ambProf } = await supabase
      .from('profiles')
      .select('profile_modules, is_ambassador')
      .eq('id', refLink.user_id)
      .single();

    if (!ambProf?.is_ambassador) return;
    const pm  = ambProf.profile_modules || {};
    const amb = pm.ambassador || {};
    if (amb.link_active === false) return;

    await _assignReferral(newUserId, refLink.user_id, refLink.referral_code || username, pm, amb);
    localStorage.removeItem(STORAGE_AMB_KEY);
  } catch (e) {
    console.warn('[HUI Referral] Fehler:', e);
  }
}

async function _assignReferral(newUserId, ambassadorId, refCode, ambPm, amb) {
  // 1. Neues Profil: referred_by_ambassador_id + referred_by setzen
  const { data: newProf } = await supabase
    .from('profiles')
    .select('profile_modules')
    .eq('id', newUserId)
    .single();
  await supabase.from('profiles').update({
    referred_by_ambassador_id: ambassadorId,
    profile_modules: {
      ...(newProf?.profile_modules || {}),
      referred_by: refCode,
    }
  }).eq('id', newUserId);

  // 2. Ambassador: referral_count +1
  const newCount = (Number(amb.referral_count) || 0) + 1;
  await supabase.from('profiles').update({
    profile_modules: {
      ...ambPm,
      ambassador: { ...amb, referral_count: newCount }
    }
  }).eq('id', ambassadorId);

  console.log('[HUI Referral] ? Zuordnung:', refCode, '-> neuer Nutzer:', newUserId);
}

/**
 * Ref-Link-Eintrag fuer neuen Ambassador anlegen (bei Annahme der Bewerbung).
 */
export async function createRefLinkForAmbassador(userId, username, referralCode) {
  const refLink = `https://be-hui.com/${username}`;
  const { error } = await supabase
    .from('ambassador_ref_links')
    .upsert({ user_id: userId, username, ref_link: refLink, referral_code: referralCode },
             { onConflict: 'user_id' });
  if (error) console.warn('[HUI Referral] createRefLink Fehler:', error);
  return refLink;
}

/**
 * Ref-Link-Eintrag loeschen (bei Entzug oder Account-Loeschung).
 */
export async function deleteRefLink(userId) {
  await supabase.from('ambassador_ref_links').delete().eq('user_id', userId);
}
