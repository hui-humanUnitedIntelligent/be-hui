// src/lib/referralTracking.js — HUI Referral-Tracking
// VERIFIZIERT: ambassador_ref_links Tabelle existiert (Stand 2026-06-08)
// Spalten: id, user_id, username, ref_link, referral_code, created_at
// profiles.referred_by (string) + profiles.referred_by_ambassador_id (uuid) existieren

import { supabase } from "./supabaseClient.js";

const STORAGE_AMB_KEY = 'hui_referral_ambassador';

// ── Referral aus URL erkennen ──────────────────────────────────
export function detectReferral() {
  try {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-zA-Z0-9._-]{3,50})$/);
    if (!match) return null;
    const username = match[1].toLowerCase();
    const EXCLUDED = ['home','login','studio','impact','admin','diagnose',
      'dashboard','profile','work','auth','ref','entdecken','buchung',
      'mein-hui','community','impressum','datenschutz'];
    if (EXCLUDED.includes(username)) return null;
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify({ username, expiry }));
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

export function clearStoredReferral() {
  try { localStorage.removeItem(STORAGE_AMB_KEY); } catch {}
}

// ── Ref-Link validieren ────────────────────────────────────────
export async function validateRefLink(linkOrUsername) {
  if (!linkOrUsername?.trim()) return { valid: false };
  try {
    let username = linkOrUsername.trim().toLowerCase();
    const match = username.match(/be-hui\.com\/([a-zA-Z0-9._-]+)/);
    if (match) username = match[1].toLowerCase();

    const { data, error } = await supabase
      .from('ambassador_ref_links')
      .select('user_id, username, ref_link')
      .eq('username', username)
      .single();

    if (error || !data) return { valid: false, error: 'Einladungslink nicht gefunden' };
    return { valid: true, username: data.username, ambassadorId: data.user_id };
  } catch {
    return { valid: false, error: 'Einladungslink ungültig' };
  }
}

// ── Ref-Link anlegen (bei Ambassador-Annahme) ──────────────────
export async function createRefLinkForAmbassador(userId, username, referralCode) {
  try {
    const refLink = `https://be-hui.com/${username}`;
    const { error } = await supabase
      .from('ambassador_ref_links')
      .upsert(
        { user_id: userId, username, ref_link: refLink, referral_code: referralCode },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    return refLink;
  } catch (e) {
    console.warn('[HUI Referral] createRefLink Fehler:', e);
    return null;
  }
}

// ── Ref-Link löschen ──────────────────────────────────────────
export async function deleteRefLink(userId) {
  try {
    await supabase.from('ambassador_ref_links').delete().eq('user_id', userId);
  } catch {}
}

// ── Referral nach Registrierung verarbeiten ───────────────────
// profiles.referred_by = referral_code (string)
// profiles.referred_by_ambassador_id = ambassador user_id (uuid)
export async function processReferralAfterSignup(newUserId, manualUsername = null) {
  const username = manualUsername || getStoredReferral();
  if (!username) return;
  try {
    const { data: refLink } = await supabase
      .from('ambassador_ref_links')
      .select('user_id, referral_code')
      .eq('username', username)
      .single();

    if (!refLink) return;

    // Ambassador-Status prüfen
    const { data: ambProf } = await supabase
      .from('profiles')
      .select('is_ambassador, profile_modules')
      .eq('id', refLink.user_id)
      .single();

    if (!ambProf?.is_ambassador) return;

    const amb = ambProf.profile_modules?.ambassador || {};
    if (amb.link_active === false) return;

    // Neues Profil: referred_by + referred_by_ambassador_id setzen
    await supabase.from('profiles').update({
      referred_by:              refLink.referral_code || username,
      referred_by_ambassador_id: refLink.user_id,
    }).eq('id', newUserId);

    // Ambassador: referral_count +1
    const newCount = (Number(amb.referral_count) || 0) + 1;
    await supabase.from('profiles').update({
      profile_modules: {
        ...(ambProf.profile_modules || {}),
        ambassador: { ...amb, referral_count: newCount }
      }
    }).eq('id', refLink.user_id);

    clearStoredReferral();
  } catch (e) {
    console.warn('[HUI Referral] Fehler:', e);
  }
}
