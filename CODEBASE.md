# HUI Codebase Structure — Phase 3D.1
# Single Source of Truth Manifest
# Updated: 2026-05-16

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
- src/lib/trustContext.js        → Trust & Reputation (Phase 3C)
- src/lib/journeyContext.js      → Journey Cohesion (Phase 3D)
- src/lib/sessionHooks.js        → Session & Presence

### Active UI Components
- src/components/ChatPage.jsx         → Chat (AKTIV, v2)
- src/components/BookingFlow.jsx      → Buchungs-Flow (AKTIV)
- src/components/WirkerProfilePage.jsx → Creator-Profil (AKTIV)
- src/components/ProfilePage.jsx      → Props-basiertes Profil
- src/components/DiscoveryFeed.jsx    → Haupt-Feed
- src/components/MeinHUI_SubPages.jsx → Creator Studio Sub-Pages
- src/components/HuiCreateFlow.jsx    → Create-Flow

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
- src/pages/Index.jsx            → Landing Page (separater Einstieg)

## LEGACY / DEPRECATED

### Stubs (bewusste Platzhalter)
- src/pages/BookingFlow.jsx      → STUB (echte: components/BookingFlow.jsx)
- src/pages/ChatPage.jsx         → STUB (echte: components/ChatPage.jsx)

### Legacy (nicht mehr aktiv)
- src/components/ChatDetailPage.jsx  → LEGACY (→ components/ChatPage.jsx)
- src/pages/Diagnose.jsx             → LEGACY DUPLICATE (→ DiagnosePage.jsx)
- src/pages/ImpactPool.jsx           → LEGACY (→ MeinHUI_SubPages ImpactSubPage)
- src/lib/mockData.js                → LEGACY (→ echte Supabase-Daten)

## RULES
1. Eine Funktion = eine Datei = eine Wahrheit
2. Imports immer vom exakten Typ (static > dynamic)
3. Alle supabaseClient-Imports: korrekte relative Tiefe
4. @ Alias verfügbar für neue Dateien
5. Legacy-Dateien nicht löschen — markieren und dokumentieren
