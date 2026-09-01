// ══════════════════════════════════════════════════════════════════════════════
// platform.js — HUI Platform Detection Utility
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Erkennt, ob der Benutzer die Web-Plattform (/app) oder die Mobile-App
//   nutzt, und liefert platform-spezifische Pfade für Redirects.
//
//   Die Mobile-App läuft ohne Prefix (/Home, /login, /auth/callback).
//   Die Web-Plattform läuft unter /app (/app/Home, /app/login, /app/auth/callback).
//
//   Diese Utility wird von geteilten Komponenten (AuthContext, AuthCallback,
//   SettingsModal) verwendet, die in beiden Entry Points laufen.
//
// WICHTIG:
//   - Wenn der Pfad NICHT mit /app beginnt, gibt die Funktion '' zurück.
//   - Das bedeutet: die Mobile-App ist völlig unbeeinflusst.
//   - Keine Änderung am Verhalten der Mobile-App.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Gibt '/app' zurück wenn der Benutzer auf der Web-Plattform ist, sonst ''.
 * Wird als Prefix für alle Pfad-Angaben verwendet.
 */
export function getPlatformBase() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
    return '/app';
  }
  return '';
}

/**
 * Gibt einen platform-spezifischen Pfad zurück.
 * Auf der Web-Plattform: '/app' + path
 * In der Mobile-App: path (unverändert)
 *
 * @example
 *   platformPath('/Home')        // → '/app/Home' (Web) oder '/Home' (Mobile)
 *   platformPath('/auth/callback') // → '/app/auth/callback' (Web) oder '/auth/callback' (Mobile)
 *   platformPath('/login')       // → '/app/login' (Web) oder '/login' (Mobile)
 */
export function platformPath(path) {
  return getPlatformBase() + path;
}

/**
 * Gibt die vollständige Redirect-URL für Supabase Auth zurück.
 * @example
 *   getAuthRedirectUrl() // → 'https://be-hui.vercel.app/app/auth/callback' (Web)
 *                       // → 'https://be-hui.vercel.app/auth/callback' (Mobile)
 */
export function getAuthRedirectUrl() {
  return window.location.origin + platformPath('/auth/callback');
}
