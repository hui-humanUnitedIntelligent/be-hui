// src/routes/registry.js — HUI Route Registry v1.0
// ══════════════════════════════════════════════════════════════════════════════
//
// ADR-001: Route Authority
// Release: NAV-001B
//
// ── ZWECK ────────────────────────────────────────────────────────────────────
// Zentrale, vollständige Beschreibung aller URL-Routen der HUI-Plattform.
//
// Diese Registry läuft im SHADOW MODE:
//   - Sie beeinflusst das Routing NICHT.
//   - Sie generiert KEINE Routes automatisch.
//   - React Router in App.jsx bleibt die einzige autoritative Routing-Instanz.
//   - Die Registry dient der Dokumentation, Analyse und zukünftigen Migration.
//
// ── VERANTWORTLICHKEIT ────────────────────────────────────────────────────────
// Owner: HUI Release Engineering
// Mutationen: ausschließlich via freigegebener Release Specification
// Jede Route hat genau einen Owner (authLevel + owner-Feld)
//
// ── LEBENSZYKLUS ─────────────────────────────────────────────────────────────
// Phase 1 (NAV-001B): Shadow Registry — reine Dokumentation, kein Einfluss
// Phase 2 (NAV-002):  Parity-Validation — Registry wird gegen Router geprüft
// Phase 3 (NAV-003):  Migration — Router generiert Routen aus Registry
// Phase 4 (NAV-004):  Registry ist einzige Quelle, App.jsx Route-Block entfällt
//
// ── ZUSAMMENHANG MIT APP_ROUTES ───────────────────────────────────────────────
// APP_ROUTES (App.jsx) = Tab-Registry für die Home-Shell (createTabPage-basiert).
//   → Nur 8 Tab-orientierte Routen, kein Auth-Routing, keine Redirects.
//   → Ist KEIN vollständiges Route-Register.
//   → Markiert als Übergangsstruktur (siehe APP_ROUTES-Kommentar in App.jsx).
// Diese Registry ist das vollständige, zukunftsfähige Register.
//
// ── ZUKÜNFTIGE MIGRATION ─────────────────────────────────────────────────────
// Wenn Phase 3 freigegeben wird:
//   1. createRouteFromRegistry(entry) Factory in App.jsx einbinden
//   2. ROUTE_REGISTRY.forEach → <Route> generieren
//   3. Manuelle <Route>-Blöcke in App.jsx entfernen
//   4. APP_ROUTES mit ROUTE_REGISTRY konsolidieren oder ersetzen
//   5. RefRedirect-APP_ROUTES-Set durch EXCLUDED_REF_PATHS ersetzen
//   6. detectReferral EXCLUDED durch EXCLUDED_REF_PATHS ersetzen
//
// ══════════════════════════════════════════════════════════════════════════════

// ── Auth Levels ───────────────────────────────────────────────────────────────
export const AUTH = Object.freeze({
  PUBLIC:    "public",      // Kein Login erforderlich
  PROTECTED: "protected",   // Login erforderlich (ProtectedRoute)
  ADMIN:     "admin",       // Admin-Role erforderlich
  DEV:       "dev",         // Nur Entwickler-Umgebung
});

// ── Route Owner ───────────────────────────────────────────────────────────────
export const OWNER = Object.freeze({
  AUTH:       "auth",        // Auth-System
  FEED:       "feed",        // Home/Feed-System
  COMMERCE:   "commerce",    // Commerce-System
  PROFILE:    "profile",     // Profil-System
  IMPACT:     "impact",      // Impact-System
  ADMIN:      "admin",       // Admin-System
  STUDIO:     "studio",      // Creator Studio
  REFERRAL:   "referral",    // Referral-System
  SYSTEM:     "system",      // Systemrouten (Redirect, 404, etc.)
});

// ── Wrapper ────────────────────────────────────────────────────────────────────
export const WRAPPER = Object.freeze({
  NONE:                "none",
  PROTECTED_ROUTE:     "ProtectedRoute",
  SUSPENSE:            "Suspense",
  ROUTE_BOUNDARY:      "RouteBoundary",
});

// ── Loading ────────────────────────────────────────────────────────────────────
export const LOADING = Object.freeze({
  EAGER: "eager",    // Sofortiger Import (kein lazy)
  LAZY:  "lazy",     // React.lazy() → separater Chunk
});

// ── Route Type ────────────────────────────────────────────────────────────────
export const ROUTE_TYPE = Object.freeze({
  PAGE:     "page",      // Echte Seite
  REDIRECT: "redirect",  // Nur Weiterleitung
  CATCH:    "catch",     // Catch-All / Fallback
  WRAPPER:  "wrapper",   // Route-Wrapper (kein eigener Screen)
});

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE REGISTRY
// Vollständige Beschreibung aller URL-Routen der HUI-Plattform.
// Entspricht 1:1 den Route-Definitionen in App.jsx (Stand: NAV-001B).
// ══════════════════════════════════════════════════════════════════════════════
export const ROUTE_REGISTRY = Object.freeze([

  // ── 01: Auth Callback ──────────────────────────────────────────────────────
  // Supabase OAuth Callback — muss EAGER und ungeschützt sein.
  // Wird von Supabase nach Email-Bestätigung / OAuth aufgerufen.
  {
    id:            "auth-callback",
    path:          "/auth/callback",
    name:          "Auth Callback",
    owner:         OWNER.AUTH,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.NONE,
    redirect:      null,
    errorBoundary: false,
    layout:        "none",
    meta: {
      title:       "HUI – Authentifizierung",
      description: "OAuth Callback Verarbeitung",
      noIndex:     true,
    },
    analytics: {
      trackPageView: false,
      eventName:     null,
    },
    featureFlags:  [],
    notes: "EAGER: Muss sofort verfügbar sein. Supabase wartet nicht auf Lazy-Load.",
  },

  // ── 02: Login ─────────────────────────────────────────────────────────────
  // Login-Seite — public, eager.
  {
    id:            "login",
    path:          "/login",
    name:          "Login",
    owner:         OWNER.AUTH,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.NONE,
    redirect:      null,
    errorBoundary: false,
    layout:        "auth",
    meta: {
      title:       "HUI – Anmelden",
      description: "Login und Registrierung",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_login",
    },
    featureFlags:  [],
    notes: "EAGER: Erster Screen nach Redirect. Kein Flash erlaubt.",
  },

  // ── 03: Root Redirect ─────────────────────────────────────────────────────
  // / → /Home (immer, replace)
  {
    id:            "root-redirect",
    path:          "/",
    name:          "Root Redirect",
    owner:         OWNER.SYSTEM,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.REDIRECT,
    wrapper:       WRAPPER.NONE,
    redirect:      { to: "/Home", replace: true },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: null, description: null, noIndex: true },
    analytics:     { trackPageView: false, eventName: null },
    featureFlags:  [],
    notes: "Permanenter Redirect. Kein Screen.",
  },

  // ── 04: Home (Feed) ───────────────────────────────────────────────────────
  // Hauptseite — enthält die gesamte Home-Shell mit Tab-Navigation.
  {
    id:            "home",
    path:          "/Home",
    name:          "Home",
    owner:         OWNER.FEED,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "shell",
    meta: {
      title:       "HUI",
      description: "Dein persönlicher Wirkungsraum",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_home",
    },
    featureFlags:  [],
    notes: "LAZY. Enthält HomeShell + UnifiedFeed + alle Tab-Inhalte. Größter Chunk.",
  },

  // ── 05: Work Detail ───────────────────────────────────────────────────────
  // Werkdetailseite mit Commerce-Integration.
  // Wrapped in WorkDetailRouteWrapper (onBuyWerk → Router-State → Home.jsx).
  {
    id:            "work-detail",
    path:          "/work/:id",
    name:          "Werk Detail",
    owner:         OWNER.COMMERCE,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "detail",
    meta: {
      title:       "HUI – Werk",
      description: "Werkdetail und Unterstützung",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_work_detail",
    },
    featureFlags:  ["commerce"],
    notes: [
      "LAZY. Wrapped in WorkDetailRouteWrapper.",
      "onBuyWerk: navigate('/Home', { state: { pendingWerkKauf: werk } }).",
      "COMMERCE-01: Router-State-basierte Übergabe an Home.jsx WerkKaufFlow.",
    ].join(" "),
  },

  // ── 06: Profil (öffentlich) ───────────────────────────────────────────────
  // Öffentliche Profilseite per Username.
  // Wrapped in WirkerProfileRouteWrapper.
  {
    id:            "profile-username",
    path:          "/profile/:username",
    name:          "Profil",
    owner:         OWNER.PROFILE,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "detail",
    meta: {
      title:       "HUI – Profil",
      description: "Talentprofil und Werke",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_profile",
    },
    featureFlags:  [],
    notes: [
      "LAZY. Wrapped in WirkerProfileRouteWrapper.",
      "Rendert WirkerProfilePage mit { wirker: { username }, onClose, onBook, onChat }.",
      "onClose: navigate(-1). onBook/onChat: intern in WirkerProfilePage.",
    ].join(" "),
  },

  // ── 07: Eigenes Profil Shortcut ───────────────────────────────────────────
  // /profile/me → lädt Username aus DB → redirect auf /profile/:username
  // ABWEICHUNG: Nicht in APP_ROUTES. Nicht im Tab-System.
  {
    id:            "profile-me",
    path:          "/profile/me",
    name:          "Eigenes Profil",
    owner:         OWNER.PROFILE,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.WRAPPER,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      { dynamic: true, logic: "OwnProfileRedirect: supabase profiles.username → /profile/:username" },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: null, description: null, noIndex: true },
    analytics:     { trackPageView: false, eventName: null },
    featureFlags:  [],
    notes: [
      "EAGER-Wrapper. Kein eigener Screen — nur Redirect.",
      "Lädt username aus Supabase. Fallback: navigate(/profile/:userId).",
      "ABWEICHUNG: /profile/me wird vor /profile/:username gematcht (React Router Priorität).",
    ].join(" "),
  },

  // ── 08: Impact (Deep-Link → HomeShell) ───────────────────────────────────
  // NAV-1.4: /impact leitet auf /Home + shellTab=impact um.
  // ImpactPage rendert ausschließlich innerhalb der HomeShell.
  {
    id:            "impact",
    path:          "/impact",
    name:          "Impact",
    owner:         OWNER.IMPACT,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.REDIRECT,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      { dynamic: true, logic: "ImpactDeepLinkRedirect → /Home state.shellTab=impact" },
    errorBoundary: false,
    layout:        "shell",
    meta: {
      title:       "HUI – Impact",
      description: "Wirkung und Impact-Projekte",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_impact",
    },
    featureFlags:  [],
    notes: [
      "NAV-1.4: Kein paralleles Impact-Mount mehr.",
      "ImpactDeepLinkRedirect.jsx leitet /impact → /Home (shellTab=impact) um.",
      "Hash-Fragmente (#project-*) werden als shellHash durchgereicht.",
    ].join(" "),
  },

  // ── 09: BookingFlow (Legacy Redirect) ────────────────────────────────────
  // /BookingFlow → /Home (replace). Historischer Legacy-Pfad.
  // ABWEICHUNG: Nicht in APP_ROUTES.
  {
    id:            "booking-flow-legacy",
    path:          "/BookingFlow",
    name:          "Buchungsflow (Legacy)",
    owner:         OWNER.SYSTEM,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.REDIRECT,
    wrapper:       WRAPPER.NONE,
    redirect:      { to: "/Home", replace: true },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: null, description: null, noIndex: true },
    analytics:     { trackPageView: false, eventName: null },
    featureFlags:  [],
    notes: [
      "LEGACY REDIRECT. BookingFlow existiert nicht mehr als eigenständige Route.",
      "Wurde durch Overlay-basiertes Booking in HomeShell ersetzt.",
      "Nicht entfernen — externe Links (z.B. E-Mails, Social) könnten diesen Pfad verwenden.",
    ].join(" "),
  },

  // ── 10: Admin ─────────────────────────────────────────────────────────────
  // Admin-Dashboard — intern, kein öffentlicher Zugang.
  {
    id:            "admin",
    path:          "/Admin",
    name:          "Admin",
    owner:         OWNER.ADMIN,
    authLevel:     AUTH.ADMIN,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "admin",
    meta: {
      title:       "HUI – Admin",
      description: "Admin-Dashboard (intern)",
      noIndex:     true,
    },
    analytics: {
      trackPageView: false,
      eventName:     null,
    },
    featureFlags:  ["admin"],
    notes: [
      "LAZY. Großer Chunk — soll nur für Admins laden.",
      "authLevel=ADMIN: ProtectedRoute prüft aktuell nur Auth, nicht Admin-Role.",
      "TODO (NAV-002): Admin-spezifischen RoleRoute-Wrapper hinzufügen.",
    ].join(" "),
  },

  // ── 11: Diagnose ──────────────────────────────────────────────────────────
  // Developer-Diagnoseseite — nur Entwicklungsumgebung.
  // ABWEICHUNG: Kein Dev-Guard auf Route-Ebene (ist aber durch Auth geschützt).
  {
    id:            "diagnose",
    path:          "/diagnose",
    name:          "Diagnose",
    owner:         OWNER.SYSTEM,
    authLevel:     AUTH.DEV,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: false,
    layout:        "debug",
    meta: {
      title:       "HUI – Diagnose",
      description: "Developer-Diagnose (intern)",
      noIndex:     true,
    },
    analytics: {
      trackPageView: false,
      eventName:     null,
    },
    featureFlags:  ["dev"],
    notes: [
      "LAZY. Nur für Entwickler gedacht.",
      "Kein expliziter DEV-Guard auf Route-Ebene.",
      "TODO (NAV-002): import.meta.env.DEV-Guard auf Komponenten-Ebene prüfen.",
    ].join(" "),
  },

  // ── 12: Platform Dashboard ────────────────────────────────────────────────
  // Internes Plattform-Dashboard — kein öffentlicher Zugang.
  {
    id:            "platform-dashboard",
    path:          "/dashboard",
    name:          "Platform Dashboard",
    owner:         OWNER.ADMIN,
    authLevel:     AUTH.ADMIN,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "admin",
    meta: {
      title:       "HUI – Platform Dashboard",
      description: "Internes Plattform-Dashboard",
      noIndex:     true,
    },
    analytics: {
      trackPageView: false,
      eventName:     null,
    },
    featureFlags:  ["admin"],
    notes: "LAZY. Interne Plattformüberwachung. Kein öffentlicher Zugang.",
  },

  // ── 13: Creator Studio ────────────────────────────────────────────────────
  // Creator Studio — erweiterte Verwaltung für Talente.
  {
    id:            "studio",
    path:          "/studio",
    name:          "Creator Studio",
    owner:         OWNER.STUDIO,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "studio",
    meta: {
      title:       "HUI – Studio",
      description: "Creator Studio",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_studio",
    },
    featureFlags:  ["creator-studio"],
    notes: [
      "LAZY. Derzeit nicht im primären Nutzerfluss (kein Nav-Link).",
      "Erreichbar über direkte URL /studio oder /studio/:section.",
      "ARCHITEKTUR-HINWEIS: CreatorStudio und HuiStudio haben inhaltliche Überschneidungen.",
      "Entscheidung zu Freigeschaltet/Archiviert erfordert eigene Release-Spec.",
    ].join(" "),
  },

  // ── 14: Creator Studio (mit Section-Parameter) ────────────────────────────
  // /studio/:section → gleiche Komponente wie /studio
  // ABWEICHUNG: Zwei Routen für dieselbe Komponente, nur /studio in APP_ROUTES.
  {
    id:            "studio-section",
    path:          "/studio/:section",
    name:          "Creator Studio (Section)",
    owner:         OWNER.STUDIO,
    authLevel:     AUTH.PROTECTED,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.PAGE,
    wrapper:       WRAPPER.PROTECTED_ROUTE,
    redirect:      null,
    errorBoundary: true,
    layout:        "studio",
    meta: {
      title:       "HUI – Studio",
      description: "Creator Studio",
      noIndex:     false,
    },
    analytics: {
      trackPageView: true,
      eventName:     "page_studio_section",
    },
    featureFlags:  ["creator-studio"],
    notes: [
      "ABWEICHUNG: Nicht in APP_ROUTES (nur /studio ist dort registriert).",
      "Gleiche Komponente wie studio (id='studio').",
      "TODO (NAV-002): Zusammenführen oder :section-Routing in CreatorStudio implementieren.",
    ].join(" "),
  },

  // ── 15: Ref-Link (explizit) ───────────────────────────────────────────────
  // /ref/:username → RefRedirect (Ambassador-Tracking)
  // Kein ProtectedRoute — Refs funktionieren auch ohne Login.
  {
    id:            "ref-explicit",
    path:          "/ref/:username",
    name:          "Ref-Link (explizit)",
    owner:         OWNER.REFERRAL,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.WRAPPER,
    wrapper:       WRAPPER.SUSPENSE,
    redirect:      { dynamic: true, logic: "RefRedirect: DB-Lookup → speichert Ambassador → /login" },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: "HUI – Weiterleitung", description: null, noIndex: true },
    analytics: {
      trackPageView: true,
      eventName:     "ref_link_explicit",
    },
    featureFlags:  ["referral"],
    notes: [
      "LAZY + Suspense (kein ProtectedRoute).",
      "RefRedirect prüft DB (ambassador_ref_links), speichert im localStorage (7 Tage).",
      "ABWEICHUNG: Nicht in APP_ROUTES.",
    ].join(" "),
  },

  // ── 16: Username Catch (impliziter Ref-Link) ─────────────────────────────
  // /:username → RefRedirect (z.B. be-hui.com/milileo)
  // Gleiche Logik wie /ref/:username — für "saubere" Referral-Links.
  // ABWEICHUNG: Breiter Catch — fängt alle nicht gematchten einstelligen Pfade.
  {
    id:            "username-catch",
    path:          "/:username",
    name:          "Username / Impliziter Ref-Link",
    owner:         OWNER.REFERRAL,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.LAZY,
    routeType:     ROUTE_TYPE.CATCH,
    wrapper:       WRAPPER.SUSPENSE,
    redirect:      { dynamic: true, logic: "RefRedirect: APP_ROUTES-Exclusion → DB-Lookup → /login" },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: "HUI – Weiterleitung", description: null, noIndex: true },
    analytics: {
      trackPageView: true,
      eventName:     "ref_link_implicit",
    },
    featureFlags:  ["referral"],
    notes: [
      "LAZY + Suspense. Sehr breiter Catch — matcht ALLES nach dem Root-Pfad.",
      "RefRedirect.APP_ROUTES (Set) filtert bekannte Pfade heraus.",
      "RISIKO: Neue App-Routen müssen in RefRedirect.APP_ROUTES (und EXCLUDED_REF_PATHS) ergänzt werden.",
      "ABWEICHUNG: Nicht in APP_ROUTES. Doppelte Exclusion-Liste (siehe EXCLUDED_REF_PATHS).",
    ].join(" "),
  },

  // ── 17: Catch-All (404) ───────────────────────────────────────────────────
  // * → SmartNotFound: wartet auf Auth, dann /Home oder /login
  {
    id:            "not-found",
    path:          "*",
    name:          "404 / Not Found",
    owner:         OWNER.SYSTEM,
    authLevel:     AUTH.PUBLIC,
    loading:       LOADING.EAGER,
    routeType:     ROUTE_TYPE.CATCH,
    wrapper:       WRAPPER.NONE,
    redirect:      { dynamic: true, logic: "SmartNotFound: isAuthenticated → /Home, sonst → /login" },
    errorBoundary: false,
    layout:        "none",
    meta:          { title: null, description: null, noIndex: true },
    analytics:     { trackPageView: false, eventName: null },
    featureFlags:  [],
    notes: [
      "SmartNotFound wartet auf authChecked bevor Redirect.",
      "Verhindert Flash-Redirect bei Refresh auf gültiger Route.",
      "NICHT in APP_ROUTES.",
    ].join(" "),
  },

]);

// ══════════════════════════════════════════════════════════════════════════════
// EXCLUDED_REF_PATHS — Konsolidierte Exclusion-Liste (NAV-001B)
//
// PROBLEM VOR NAV-001B:
//   Zwei parallele, leicht divergierende Exclusion-Listen existierten:
//     1. RefRedirect.jsx: APP_ROUTES (Set<string>)
//     2. referralTracking.js: EXCLUDED (Array<string>)
//
// LÖSUNG (Shadow Mode):
//   EXCLUDED_REF_PATHS ist die zukünftige Single Source of Truth.
//   In NAV-002 werden RefRedirect und referralTracking auf diesen Export umgestellt.
//
// ABWEICHUNGEN (dokumentiert):
//   RefRedirect.jsx hat:   'auth-callback', 'callback', 'entdecken', 'buchung',
//                          'mein-hui', 'community', 'impressum', 'datenschutz',
//                          'agb', 'copyright', 'cookies'
//   referralTracking.js hat: 'impressum', 'datenschutz', 'agb', 'cookies', 'copyright'
//                            (fehlt: 'callback', 'auth-callback', 'mein-hui', 'community')
//
// UNION beider Listen (vollständig):
// ══════════════════════════════════════════════════════════════════════════════
export const EXCLUDED_REF_PATHS = Object.freeze(new Set([
  // ── Kern-App-Routen ──────────────────────────────────────────
  "home",
  "login",
  "studio",
  "impact",
  "admin",
  "diagnose",
  "dashboard",
  "profile",
  "work",
  "auth",
  "ref",
  // ── Auth-Varianten ───────────────────────────────────────────
  "auth-callback",
  "callback",
  // ── Inhaltliche Bereiche ─────────────────────────────────────
  "entdecken",
  "buchung",
  "mein-hui",
  "community",
  // ── Rechtliche / statische Seiten ────────────────────────────
  "impressum",
  "datenschutz",
  "agb",
  "copyright",
  "cookies",
]));

// ══════════════════════════════════════════════════════════════════════════════
// PARITY REPORT — NAV-001B
// Dokumentiert alle Abweichungen zwischen APP_ROUTES und tatsächlichem Router.
// ══════════════════════════════════════════════════════════════════════════════
export const PARITY_REPORT = Object.freeze({

  // Routen in Router, aber NICHT in APP_ROUTES
  routerOnlyRoutes: [
    "/auth/callback",   // Auth-System — kein Tab
    "/login",           // Auth-System — kein Tab
    "/",                // Root-Redirect — kein Tab
    "/profile/me",      // Profil-Shortcut — kein Tab
    "/BookingFlow",     // Legacy-Redirect — deprecated
    "/ref/:username",   // Referral — kein Tab
    "/:username",       // Referral-Catch — kein Tab
    "*",                // 404-Fallback — kein Tab
    "/studio/:section", // Studio-Sektion — in APP_ROUTES nur /studio
  ],

  // Routen in APP_ROUTES, aber mit Abweichungen im Router
  appRoutesDeviations: [
    {
      key:     "impact",
      issue:   "NAV-1.4: /impact ist Deep-Link-Redirect, kein eigenständiges ImpactPage-Mount",
      risk:    "niedrig",
      action:  "Erledigt in Phase 1.4",
    },
    {
      key:     "profile",
      issue:   "APP_ROUTES path='/profile/:username' — Router hat zusätzlich /profile/me",
      risk:    "niedrig",
      action:  "NAV-002: /profile/me als separate Registry-Entry einplanen",
    },
    {
      key:     "studio",
      issue:   "APP_ROUTES hat nur /studio — Router hat /studio + /studio/:section",
      risk:    "niedrig",
      action:  "NAV-002: studio-section in APP_ROUTES ergänzen oder konsolidieren",
    },
  ],

  // Benennung: APP_ROUTES vs Router-Pfad
  namingInconsistencies: [
    {
      appRoutesKey:  "home",
      routerPath:    "/Home",
      issue:         "APP_ROUTES key 'home' (lowercase) vs Router path '/Home' (uppercase H)",
      risk:          "niedrig",
      action:        "Dokumentiert. Kein Handlungsbedarf (React Router ist case-sensitive).",
    },
    {
      appRoutesKey:  "admin",
      routerPath:    "/Admin",
      issue:         "APP_ROUTES key 'admin' vs Router path '/Admin' (uppercase A)",
      risk:          "niedrig",
      action:        "Dokumentiert. Kein Handlungsbedarf.",
    },
  ],

  // Exclusion-Listen Divergenz
  refExclusionDivergence: {
    source1: "RefRedirect.jsx → local APP_ROUTES (Set)",
    source2: "referralTracking.js → EXCLUDED (Array)",
    onlyInSource1: ["auth-callback", "callback", "entdecken", "buchung", "mein-hui", "community", "impressum", "datenschutz", "agb", "copyright", "cookies"],
    onlyInSource2: [],
    merged:  "EXCLUDED_REF_PATHS (export aus registry.js — Shadow Mode bis NAV-002)",
    action:  "NAV-002: RefRedirect und referralTracking auf EXCLUDED_REF_PATHS umstellen",
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS (Shadow Mode — nicht im Routing-Pfad)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Gibt alle Routen eines bestimmten Owners zurück.
 * @param {string} owner — OWNER.*-Konstante
 * @returns {Array}
 */
export function getRoutesByOwner(owner) {
  return ROUTE_REGISTRY.filter(r => r.owner === owner);
}

/**
 * Gibt eine Route per ID zurück.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getRouteById(id) {
  return ROUTE_REGISTRY.find(r => r.id === id);
}

/**
 * Gibt alle protected Routen zurück.
 * @returns {Array}
 */
export function getProtectedRoutes() {
  return ROUTE_REGISTRY.filter(r => r.authLevel !== AUTH.PUBLIC);
}

/**
 * Gibt alle Routen mit einem bestimmten Feature-Flag zurück.
 * @param {string} flag
 * @returns {Array}
 */
export function getRoutesByFeatureFlag(flag) {
  return ROUTE_REGISTRY.filter(r => r.featureFlags.includes(flag));
}

/**
 * Validiert die Vollständigkeit der Registry gegen eine Liste bekannter Pfade.
 * Im Shadow Mode: gibt nur einen Report zurück, wirft keine Fehler.
 * @param {string[]} knownPaths — Liste aller tatsächlichen Router-Pfade
 * @returns {{ missing: string[], extra: string[] }}
 */
export function validateParity(knownPaths) {
  const registryPaths = ROUTE_REGISTRY.map(r => r.path);
  const missing = knownPaths.filter(p => !registryPaths.includes(p));
  const extra   = registryPaths.filter(p => !knownPaths.includes(p));
  return { missing, extra };
}
