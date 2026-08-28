// src/lib/authFetch.js
// ═══════════════════════════════════════════════════════════════════
// AUTH-401-RECOVERY-001 (2026-08-28)
//
// Root Cause: Supabase hat die JWT-Signing-Keys des Projekts rotiert
// (Legacy HS256-Secret -> asymmetrische ES256 JWT Signing Keys, sichtbar
// an .well-known/jwks.json). Dadurch wurden bereits ausgestellte
// Access-Tokens (Sessions, die VOR der Rotation eingeloggt wurden)
// ungueltig -- jeder Edge-Function-Call mit einem solchen Token bekommt
// vom `supabase.auth.getUser(jwt)`-Check serverseitig ein rohes,
// unuebersetztes "Unauthorized" (HTTP 401) zurueck. Das wurde 1:1 an den
// Nutzer durchgereicht (siehe TalentBookingFlow/ExperienceBookingFlow/
// WerkKaufFlow: `result.error` direkt in setErrMsg).
//
// Fix: Zentraler Fetch-Wrapper fuer ALLE POST-Calls an Edge Functions.
// Bei HTTP 401 wird EINMAL versucht die Session zu refreshen
// (supabase.auth.refreshSession() -- nutzt den Refresh-Token, der auch
// nach einer Key-Rotation i.d.R. noch gueltig ist) und der Call zu
// wiederholen. Schlaegt auch der Retry fehl, wird sessionExpired=true
// zurueckgegeben statt der rohen Server-Antwort -- die aufrufende
// Komponente zeigt dann eine klare, uebersetzte "Sitzung abgelaufen"-
// Meldung (common.sessionExpiredReauth) und meldet den Nutzer ab, damit
// der naechste Login-Versuch garantiert einen frischen, gueltigen Token
// erzeugt.
// ═══════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient.js";

/**
 * POST an eine Supabase Edge Function inkl. automatischem 401-Recovery.
 * @param {string} path - Function-Name, z.B. "create-payment-intent"
 * @param {object} body - JSON-Body
 * @returns {Promise<{res: Response|null, result: any, sessionExpired: boolean}>}
 */
export async function postToEdgeFunction(path, body) {
  const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/${path}`;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return { res: null, result: { error: "no_session" }, sessionExpired: true };
  }

  const doFetch = (token) => fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": supabaseAnonKey ?? "",
    },
    body: JSON.stringify(body),
  });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    // Access-Token evtl. ungueltig geworden (Key-Rotation / Ablauf) --
    // einmal ueber den Refresh-Token eine neue Session holen und retry.
    let newToken = null;
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr) newToken = refreshData?.session?.access_token || null;
    } catch { /* refreshErr bereits abgefangen */ }

    if (newToken && newToken !== accessToken) {
      res = await doFetch(newToken);
    }

    if (res.status === 401) {
      const result = await res.json().catch(() => ({}));
      return { res, result, sessionExpired: true };
    }
  }

  const result = await res.json().catch(() => ({}));
  return { res, result, sessionExpired: false };
}
