# HUI Codebase Structure — Aktueller Stand
# Single Source of Truth Manifest
# Zuletzt aktualisiert: 2026-07-28 (Audit Fix 004)

---

> ⚠️ Diese Datei ist die SSOT für alle Architektur-Entscheidungen.
> Bei Widersprüchen hat diese Datei Vorrang vor alten Kommentaren im Code.

---

## Fundament

| Dokument | Rolle |
|---|---|
| `docs/HUI_CONSTITUTION.md` | Verfassung — Goldene Regeln, Grundpfeiler |
| `src/lib/supabaseClient.js` | EINZIGER Supabase-Client im Frontend |
| `eslint.config.js` | EINZIGE ESLint-Konfiguration (v9 Flat Config) |

---

## Routing (src/App.jsx)

| Route | Komponente | Status |
|---|---|---|
| `/` | `SplashScreen` | ✅ Aktiv |
| `/login` | `LoginPage` | ✅ Aktiv |
| `/auth/callback` | `AuthCallback` | ✅ Aktiv |
| `/Home` | `Home` (lazy) | ✅ Aktiv — App-Shell |
| `/work/:id` | `WorkDetailPage` (lazy) | ✅ Aktiv |
| `/profile/:username` | `BasisProfilePage` / `TalentProfilePage` (lazy) | ✅ Aktiv |
| `/profile/me` | `MyBasisProfile` | ✅ Aktiv |
| `/wirker/:username` | Redirect → `/profile/:username` | ✅ Alias |
| `/werke/:slug` | Redirect | ✅ Alias |
| `/beitrag/:id` | Redirect | ✅ Alias |
| `/projekt/:id` | Redirect | ✅ Alias |
| `/erlebnis/:id` | Redirect | ✅ Alias |
| `/impact` | `ImpactPage` (lazy) | ✅ Aktiv |
| `/Admin` | `Admin` (lazy, geschützt) | ✅ Aktiv |
| `/diagnose` | `DiagnosePage` (lazy, geschützt) | ✅ Aktiv |
| `/dashboard` | `PlatformDashboard` (lazy) | ✅ Aktiv |
| `/studio` | `CreatorStudio` (lazy) | ✅ Aktiv |
| `/studio/:section` | `CreatorStudio` (lazy) | ✅ Aktiv |
| `/BookingFlow` | Redirect → `/Home` | ⚠️ Legacy-Redirect |
| `/ref/:code` | `RefRedirect` (lazy) | ✅ Aktiv |

---

## Core Infrastructure

| Datei | Zweck |
|---|---|
| `src/lib/supabaseClient.js` | Supabase-Client (EINZIGE Instanz) |
| `src/lib/AuthContext.jsx` | Auth-State SSOT |
| `src/lib/AppStateContext.jsx` | Globaler App-State |
| `src/lib/ErrorBoundaries.jsx` | Route + Overlay Boundaries |
| `src/lib/sentry.js` | Error-Monitoring |
| `src/lib/referralTracking.js` | Ambassador-Referral-Erkennung |
| `src/lib/wizardBodyLock.js` | Referenz-gezählter Body-Lock für Wizards |

---

## Aktive Contexts

| Context | Datei | Zweck |
|---|---|---|
| `RadiusProvider` | `src/context/RadiusContext.jsx` | Globaler Umkreisfilter |
| `SavedPostsProvider` | `src/context/SavedPostsContext.jsx` | Gespeicherte Beiträge |
| `LiveTickerProvider` | `src/context/LiveTickerContext.jsx` | Live-Feed-Ticker |
| `ContentPreviewProvider` | `src/context/ContentPreviewContext.jsx` | Beitrags-Preview |
| `OrbWorldProvider` | `src/context/OrbWorldContext.jsx` | Orb-Kompasse |
| `WorldSurfaceProvider` | `src/context/WorldSurfaceContext.jsx` | Karten-Oberfläche |

---

## Aktive Seiten

| Datei | Route/Zweck |
|---|---|
| `src/pages/Home.jsx` | App-Shell, Tab-Navigation |
| `src/pages/MyBasisProfile.jsx` | Eigenes Profil |
| `src/pages/BasisProfilePage.jsx` | Öffentliches Basis-Profil |
| `src/pages/TalentProfilePage.jsx` | Öffentliches Talent-Profil |
| `src/pages/DiscoverPage.jsx` | Entdecken-Tab (intern via Home) |
| `src/pages/ImpactPage.jsx` | Impact-Bereich |
| `src/pages/CreatorStudio.jsx` | Studio-Bereich |
| `src/pages/SplashScreen.jsx` | Eingangsbildschirm |
| `src/pages/LoginPage.jsx` | Login |
| `src/pages/AuthCallback.jsx` | OAuth Callback |
| `src/pages/Admin.jsx` | Admin-Bereich |

---

## Legacy / Deprecated (NICHT LÖSCHEN — nur markieren)

| Datei | Grund | Ersatz |
|---|---|---|
| `src/components/ChatPage.jsx` | Nicht in App.jsx importiert | — |
| `src/components/BookingFlow.jsx` | Nicht in App.jsx importiert | — |
| `src/components/DiscoveryFeed.jsx` | Ersetzt durch `src/feed/UnifiedFeed.jsx` | `UnifiedFeed.jsx` |
| `src/components/NotificationCenter.jsx` | Legacy — Resonanzzentrum ist aktiv | Resonanzzentrum |
| `src/lib/journeyContext.js` | Nicht referenziert (Phase-3D — nie deployed) | — |
| `src/lib/bookingContext.js` | Nicht in aktiven Flows genutzt | — |
| `src/lib/chatContext.js` | Nicht in aktiven Flows genutzt | — |
| `src/lib/trustContext.js` | Nicht in aktiven Flows genutzt | — |

---

## Datenbank-Schema-SSOT

Alle aktiven Migrationen: `sql/` (Root-Level)
Historische Migrations: `sql/archive/` (NICHT mehr deployen)

Aktive Audit-Fixes:
- `sql/audit_fix_001_rls_messages_and_profiles.sql`
- `sql/audit_fix_002_notifications_schema.sql`
- `sql/audit_fix_003_ambassador_system.sql`
- `sql/audit_fix_004_security_hardening.sql` (2026-07-28)

---

## Build-Output

| Tool | Output-Dir |
|---|---|
| Vite (`npm run build`) | `dist/` |
| Capacitor Android | `android/app/src/main/assets/public/` |
| Capacitor Sync | `npx cap sync android` |

> **Wichtig:** `capacitor.config.json` → `webDir: "dist"` (nicht "www")

---

## Regeln

1. Eine Funktion = eine Datei = eine Wahrheit
2. Supabase: nur `src/lib/supabaseClient.js` importieren
3. Modals/Sheets: `createPortal(..., document.body)` + `zIndex >= 10500`
4. Alle Props müssen Default-Werte haben (kein `is not defined`)
5. Legacy-Dateien nicht löschen — in dieser Datei dokumentieren
6. ESLint: `eslint.config.js` ist die SSOT (`.eslintrc.json` wurde entfernt)
