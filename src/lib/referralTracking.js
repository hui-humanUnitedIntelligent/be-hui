// src/lib/referralTracking.js — HUI Referral-Tracking
// Single Source of Truth: profiles.referred_by = ambassador user_id (UUID)
// first_transaction_at = NULL solange kein Umsatz

import { supabase } from "./supabaseClient.js";

const STORAGE_AMB_KEY = 'hui_referral_ambassador';

// ── detectReferral (URL-Pfad prüfen, z.B. be-hui.com/milileo) ──
export function detectReferral() {
  try {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-zA-Z0-9._-]{3,50})$/);
    if (!match) return null;
    const username = match[1].toLowerCase();
    // NAV-001B: Diese Exclusion-Liste ist eine von zwei parallelen Listen.
    // Die konsolidierte Union-Liste liegt in src/routes/registry.js (EXCLUDED_REF_PATHS).
    // MIGRATION (NAV-002): Durch import { EXCLUDED_REF_PATHS } from '../routes/registry.js'
    //   und EXCLUDED_REF_PATHS.has(username) ersetzen.
    const EXCLUDED = ['home','login','studio','impact','admin','diagnose',
      'dashboard','profile','work','auth','ref','entdecken','buchung',
      'mein-hui','community','impressum','datenschutz','agb','cookies','copyright'];
    if (EXCLUDED.includes(username)) return null;
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('hui_referral_ambassador', JSON.stringify({ username, expiry }));
    return username;
  } catch { return null; }
}

// ── localStorage Helpers ───────────────────────────────────────
export function getStoredReferral() {
  try {
    const raw = localStorage.getItem(STORAGE_AMB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiry) { localStorage.removeItem(STORAGE_AMB_KEY); return null; }
    return parsed;
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

// ── KERN: Referral einem Nutzer zuweisen ──────────────────────
// Setzt profiles.referred_by = ambassadorId (UUID)
// Der DB-Trigger trg_ambassador_referral_count zählt dann automatisch +1
// Wird aufgerufen: nach Signup, nach Login, nach E-Mail-Bestätigung
export async function processReferralForUser(userId) {
  if (!userId) return false;

  const stored = getStoredReferral();
  if (!stored?.username && !stored?.ambassadorId) return false;

  try {
    // Ambassador-ID aus localStorage oder per DB-Lookup
    let ambassadorId = stored.ambassadorId || null;

    if (!ambassadorId && stored.username) {
      const { data: refLink } = await supabase
        .from('ambassador_ref_links')
        .select('user_id')
        .eq('username', stored.username.toLowerCase())
        .maybeSingle();
      if (!refLink?.user_id) return false;
      ambassadorId = refLink.user_id;
    }

    if (!ambassadorId) return false;

    // Prüfe ob Ambassador aktiv + Link aktiv
    const { data: ambProf } = await supabase
      .from('profiles')
      .select('is_ambassador, profile_modules')
      .eq('id', ambassadorId)
      .maybeSingle();

    if (!ambProf?.is_ambassador) return false;
    if (ambProf.profile_modules?.ambassador?.link_active === false) return false;

    // Bereits zugewiesen? → nicht überschreiben (einmaliges Referral pro User)
    const { data: existing } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .maybeSingle();

    if (existing?.referred_by) {
      clearStoredReferral();
      return true; // bereits gesetzt → Trigger hat schon gezählt
    }

    // Setzen — Retry bis Profil via Trigger existiert (neu registrierte User)
    let ok = false;
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 500));
      const { data: upd, error: upErr } = await supabase
        .from('profiles')
        .update({ referred_by: ambassadorId })
        .eq('id', userId)
        .select('id,referred_by')
        .maybeSingle();
      if (upd?.referred_by === ambassadorId) { ok = true; break; }
      if (upErr) console.warn('[HUI Referral] Update-Fehler:', upErr.message);
    }

    if (ok) {
      clearStoredReferral();
      // DB-Trigger trg_ambassador_referral_count erhöht referral_count automatisch
      console.log('[HUI Referral] ✅ referred_by gesetzt → Trigger zählt +1 für', ambassadorId);
    } else {
      console.warn('[HUI Referral] ❌ referred_by nach 8 Versuchen nicht gesetzt');
    }
    return ok;
  } catch (e) {
    console.warn('[HUI Referral] Fehler:', e);
    return false;
  }
}

// Alias für AuthCallback (Rückwärtskompatibilität)
export async function processStoredReferralForUser(userId) {
  return processReferralForUser(userId);
}

// Legacy-Alias
export async function processReferralAfterSignup(userId) {
  return processReferralForUser(userId);
}
