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

  // Wenn keine userId → im localStorage merken, AuthCallback holt es nach
  if (!newUserId) {
    try {
      const raw = localStorage.getItem(STORAGE_AMB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.pendingProcessing = true;
        localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify(parsed));
      }
    } catch {}
    console.log('[HUI Referral] userId fehlt noch — wird nach E-Mail-Bestätigung verarbeitet');
    return;
  }

  try {
    const { data: refLink } = await supabase
      .from('ambassador_ref_links')
      .select('user_id, referral_code')
      .eq('username', username)
      .single();

    if (!refLink) {
      console.warn('[HUI Referral] Ref-Link nicht gefunden für username:', username);
      return;
    }

    // Ambassador-Status prüfen
    const { data: ambProf } = await supabase
      .from('profiles')
      .select('is_ambassador, profile_modules')
      .eq('id', refLink.user_id)
      .single();

    if (!ambProf?.is_ambassador) return;

    const amb = ambProf.profile_modules?.ambassador || {};
    if (amb.link_active === false) return;

    // Nur setzen wenn noch nicht referriert
    const { data: existing } = await supabase
      .from('profiles')
      .select('referred_by_ambassador_id')
      .eq('id', newUserId)
      .single();

    if (existing?.referred_by_ambassador_id) {
      clearStoredReferral();
      return; // bereits verknüpft
    }

    // Neues Profil: referred_by + referred_by_ambassador_id setzen
    await supabase.from('profiles').update({
      referred_by:               refLink.referral_code || username,
      referred_by_ambassador_id: refLink.user_id,
    }).eq('id', newUserId);

    clearStoredReferral();
    console.log('[HUI Referral] ✅ Referral gesetzt:', username, '→', newUserId);
  } catch (e) {
    console.warn('[HUI Referral] Fehler:', e);
  }
}

// ── Referral nach E-Mail-Bestätigung verarbeiten (AuthCallback) ──
export async function processStoredReferralForUser(userId) {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(STORAGE_AMB_KEY);
    if (!raw) return;
    const { username } = JSON.parse(raw);
    if (!username) return;
    await processReferralAfterSignup(userId, username);
  } catch {}
}
