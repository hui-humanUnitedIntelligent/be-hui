# HUI Codebase Structure — Phase 4 (Architecture v3.0)
# Single Source of Truth Manifest
# Updated: 2026-06-29

## ⚑  Fundament

> Alle Architektur- und Produktentscheidungen basieren auf der HUI Constitution.

| Dokument | Rolle |
|---|---|
| [`HUI_CONSTITUTION.md`](HUI_CONSTITUTION.md) | **Die Verfassung** — Goldene Regeln, Grundpfeiler, Designprinzipien |
| [`src/registry/HuiRegistry.js`](src/registry/HuiRegistry.js) | **Single Source of Meaning** — Sprache, Texte, Semantik |
| [`src/core/coreEngine.js`](src/core/coreEngine.js) | **Single Source of Truth** — Wirkungsdaten |
| [`docs/ARCHITECTURE_INDEX.md`](docs/ARCHITECTURE_INDEX.md) | **Architecture Index** — alle Module verlinkt |

---

## Archiv (Sprint 1 Cleanup — 2026-07-16)

Historische Dateien wurden archiviert, nicht gelöscht. Git-Historie bleibt erhalten.

| Pfad | Inhalt |
|---|---|
| [`archive/backups/`](archive/backups/) | `.bak`, `.v1_backup` und andere Backup-Dateien |
| [`archive/sql-history/`](archive/sql-history/) | Historische SQL-Deploy-Skripte aus dem Projekt-Root |
| [`archive/debug-html/`](archive/debug-html/) | HTML-Test- und Debug-Panels (`hui_*.html`) |

Kanonische Datenbank-Migrationen: [`supabase/migrations/`](supabase/migrations/) (unverändert).

---

## ACTIVE SYSTEMS

### Navigation & Routing
- src/App.jsx                    → Root Router, alle aktiven Routes
- src/pages/Home.jsx             → Haupt-App-Shell, Tab-Navigation, Overlays
- src/lib/AuthContext.jsx        → Auth-State, Single Source

### Core Infrastructure
- src/lib/supabaseClient.js      → Supabase-Client (EINZIGE Instanz)
- src/lib/AppStateContext.jsx    → Globaler App-State
- src/lib/AuthContext.jsx        → Auth-Kontext

### Phase-3 Systems (alle aktiv)
- src/lib/bookingContext.js      → Booking Intelligence (Phase 3A)
- src/lib/chatContext.js         → Chat Intelligence (Phase 3B)
- src/lib/journeyContext.js      → Journey Cohesion (Phase 3D)
- src/lib/sessionHooks.js        → Session & Presence

### Active UI Components
- src/components/chat-center/ChatCenterOverlay.jsx → Chat (AKTIV)
- src/components/commerce/ExperienceBookingFlow.jsx  → Buchungs-Flow (AKTIV)
- src/pages/wirker-profile/index.jsx                 → Fremdes Profil (URL-Route)
- src/feed/UnifiedFeed.jsx                           → Haupt-Feed
- src/pages/studio/StudioSubPages.jsx                → Creator Studio Sub-Pages
- src/components/HuiCreateFlow.jsx                   → Create-Flow

### Active Pages (Routes)
- src/pages/Home.jsx             → /Home (App-Shell)
- src/pages/LoginPage.jsx        → /login
- src/pages/AuthCallback.jsx     → /auth/callback
- src/pages/DiagnosePage.jsx     → /diagnose (AKTIV)
- src/pages/CreatorStudio.jsx    → /studio (AKTIV)
- src/pages/ImpactPage.jsx       → /impact
- src/pages/Admin.jsx            → /Admin

### Internal Pages (über Home.jsx Navigation)
- src/pages/DiscoverPage.jsx     → Intern via Tab
- src/pages/LiveMapPage.jsx      → Intern via Map-Button
- src/pages/FavoritesPage.jsx    → Intern via Favorites

### Internal Profile Pages (über ProfileLauncher, keine URL-Route)
- src/pages/MyBasisProfile.jsx       → Eigenes Profil
- src/pages/BasisProfilePage.jsx     → Basis-User öffentliches Profil
- src/pages/TalentProfilePage.jsx    → Talent öffentliches Profil

## LEGACY / DEPRECATED

### Entfernt (Sprint 1 — nachweislich ungenutzt)
- src/components/commerce/BuyerConfirmSheet.jsx  → 0 Importeure (siehe HUI_REPOSITORY_AUDIT.md)
- src/architecture/scanner/cli.js                → Dev-Tool, nicht eingebunden
- src/architecture/scanner/index.js              → Dev-Tool, nicht eingebunden
- src/version.ts                                 → 0 Importeure

### Archiviert (siehe `archive/`)
- Root-SQL-Deploy-Skripte → `archive/sql-history/`
- HTML-Debug-Panels → `archive/debug-html/`
- Backup-Dateien → `archive/backups/`

## RULES
1. Eine Funktion = eine Datei = eine Wahrheit
2. Imports immer vom exakten Typ (static > dynamic)
3. Alle supabaseClient-Imports: korrekte relative Tiefe
4. @ Alias verfügbar für neue Dateien
5. Legacy-Dateien nicht löschen — markieren und dokumentieren
