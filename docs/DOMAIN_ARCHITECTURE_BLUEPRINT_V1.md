# Domain Architecture Blueprint v1

> **ARCH-005 — Endgültige Zielarchitektur der HUI-Plattform**  
> **Status:** Ratifiziert als Governance-Referenz  
> **Datum:** 2026-06-30  
> **Basis:** Constitution · ADR-001 · RFC-000 · SYSTEM_OWNERSHIP · Architecture Scanner (ARCH-001)

---

## I. Zweck dieses Dokuments

Dieses Dokument definiert die **fachlichen Domänen** der HUI-Plattform — abgeleitet aus fachlicher Verantwortung, nicht aus der heutigen Dateistruktur.

Es ist die dauerhafte Referenz für:

| System | Nutzung |
|---|---|
| **Architecture Authority** | Domain-Grenzen, Ownership-Regeln, erlaubte Abhängigkeiten |
| **Knowledge Graph** | Datei→Domain-Zuordnung (`docs/generated/domain-file-map.json`) |
| **Architecture Scanner** | Violation-Detection gegen Ziel-Domains (ARCH-006+) |
| **Architecture Intelligence** | Domain-Health, Migrations-Priorisierung |
| **Zukünftige Refactorings** | Domain-für-Domain-Migration, nicht dateiweise |

**Explizit ausgeschlossen in ARCH-005:** Refactoring, Migration, Runtime-Änderungen, UI, SQL.

---

## II. Ableitungsgrundlage

### Constitution-Grundpfeiler → Domänen-Mapping

| Grundpfeiler | Primäre Domänen |
|---|---|
| 🤝 Verbinden | CONNECTION, COMMUNICATION, PRESENCE |
| 💚 Unterstützen | COMMERCE, TRUST, COMMUNICATION |
| 🎨 Erschaffen | CREATION, STUDIO |
| 🌱 Wertschöpfen | COMMERCE, CREATION |
| 🌍 Impact | IMPACT, WIRKUNG |

### Governance-Quellen

```
HUI_CONSTITUTION.md          → Unveränderliche Architekturregeln
RFC-000 (Layering)           → UI → Features → Services → Core → Registry
ADR-001 (Route Authority)    → src/routes/registry.js
SYSTEM_OWNERSHIP.md          → Single-Owner pro Datensystem
Architecture Scanner         → 297 Dateien, 629 Violations, 75 Tabellen
domain-file-map.json         → 298 Dateien → 14 Domänen
```

### Aktueller Architecture Health (Baseline ARCH-001)

| Metrik | Wert |
|---|---|
| Dateien | 297 |
| Violations gesamt | 629 (42 CRITICAL, 112 HIGH) |
| Ownership Coverage | 0% |
| Action Engine Adoption | 4% |
| Core Engine Adoption | 4% |
| Registry Adoption | 2% |
| Direkte DB-Writes in UI | 69 |
| Duplicate Owners | 17 |

---

## III. Domänen-Übersicht

```
                    ┌─────────────────────────────────┐
                    │           KERNEL                │
                    │  Constitution · Registry · Core │
                    │  Action Engine · Architecture   │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────▼────┐               ┌──────▼──────┐              ┌─────▼─────┐
   │IDENTITY │◄─────────────►│ CONNECTION  │◄────────────►│  TRUST    │
   └────┬────┘               └──────┬──────┘              └───────────┘
        │                             │
   ┌────▼────┐    ┌──────────┐   ┌────▼────┐    ┌──────────┐
   │CREATION │◄──►│ COMMERCE │◄─►│COMMUNIC.│    │ PRESENCE │
   └────┬────┘    └──────────┘   └─────────┘    └──────────┘
        │              │               │
   ┌────▼──────────────▼───────────────▼──────────────────────────┐
   │                      DISCOVERY                                │
   └───────────────────────────┬───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐           ┌─────▼─────┐          ┌─────▼─────┐
   │ IMPACT  │           │  WIRKUNG  │          │INTELLIGENCE│
   └─────────┘           └─────┬─────┘          └───────────┘
                               │
                          ┌────▼────┐         ┌──────────┐
                          │  WORLD  │         │  STUDIO  │
                          └─────────┘         └──────────┘
```

**14 fachliche Domänen** — jede mit genau einem Domain Owner (Team-Rolle).

---

## IV. Domänen-Spezifikationen

### DOMAIN-01: KERNEL — Platform Kernel & Governance

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Unveränderliche Plattformgrundlage: Verfassung, Semantik, Action-System, Infrastruktur |
| **Verantwortung** | Registry, Action Engine, Routing-Registry, Design-Tokens, Supabase-Client, Architektur-Scanner, globale App-Orchestrierung |
| **Daten** | Keine fachlichen Daten — nur Meta/Infrastruktur |
| **Tabellen** | — (indirekt: alle via Services) |
| **Events** | `HUI_ACTIONS.*`, CustomEvents für Overlay-Steuerung |
| **Services** | `services/db.js` (Facade), Infrastruktur-Services |
| **Contexts** | `AppStateContext` (Cross-Domain-Hub — Ziel: entflechten) |
| **Hooks** | — |
| **Komponenten** | `App.jsx`, `ErrorBoundary`, `ProtectedRoute`, `entry/AppEntryController` |
| **Pages** | `Home.jsx` (Orchestrierung — Multi-Domain) |
| **Realtime** | — |
| **Ownership** | Platform Architecture Team |
| **Core-Relevanz** | ★★★★★ — Fundament aller Domänen |

**Dateien:** 64 (siehe `domain-file-map.json`)

---

### DOMAIN-02: IDENTITY — Identity & Membership

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Wer ist dieser Mensch auf HUI? Identität, Talent-Profil, Mitgliedschaft |
| **Verantwortung** | Auth/Session, Profil (Basis + Talent/Wirker), Onboarding, Ambassador, Settings, Username |
| **Daten** | `profiles`, `wirker_profiles`, `memberships`, `profile_modules`, `ambassador_*` |
| **Tabellen** | `profiles`, `wirker_profiles`, `memberships`, `profile_views` |
| **Events** | `profile.updated`, `membership.changed`, `talent.activated` |
| **Services** | `ProfileService`, `MembershipService`, `TalentService` (in `db.js`) |
| **Contexts** | `AuthContext` (Owner), `AppStateContext.profile` (Consumer → Ziel: IdentityContext) |
| **Hooks** | `useProfileData`, `useProfileId`, `useTalentActivation`, `useAmbassador`, `useUsernameCheck` |
| **Komponenten** | `auth/*`, `profile/*`, `ambassador/*`, `TalentOnboarding`, `settings/SettingsModal`, `HuiMembershipFlow` |
| **Pages** | `LoginPage`, `AuthCallback`, `TalentProfilePage`, `BasisProfilePage`, `MyBasisProfile`, `wirker-profile/` |
| **Realtime** | — |
| **Ownership** | `lib/AuthContext.jsx` (Auth), `AppStateContext` + `db.js` (Profile — laut SYSTEM_OWNERSHIP) |
| **Core-Relevanz** | ★★★★★ — Core-Tabelle `profiles` (Constitution: Core Bypass = CRITICAL) |

**Kernproblem:** 42 CRITICAL Violations — direkte `profiles`-Writes außerhalb Core Engine.

**Dateien:** 44

---

### DOMAIN-03: CONNECTION — Connection & Community

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Menschen verbinden — Beziehungen, Empfehlungen, Einladungen, Match |
| **Verantwortung** | Follows, Connections, Referrals, Recommendations, Gemeinschafts-Flows |
| **Daten** | `follows`, `connections`, `recommendations`, `user_match_scores`, `referrals` |
| **Tabellen** | `follows`, `connections`, `recommendations`, `user_match_scores` |
| **Events** | `connection.created`, `follow.toggled`, `recommendation.received` |
| **Services** | `RecommendationService`, `MatchService` (in `db.js`) |
| **Contexts** | `AppStateContext.follows` (Owner — Ziel: ConnectionContext) |
| **Hooks** | — |
| **Komponenten** | `connection-create/*`, `GemeinschaftsFlow`, `HuiMatchOverlay`, `ConnectionFlowCard`, `MatchBar` |
| **Pages** | — (embedded in Profile/Discover) |
| **Realtime** | — |
| **Ownership** | `AppStateContext` (follows), `referralTracking.js` |
| **Core-Relevanz** | ★★★★ — Grundpfeiler „Verbinden" |

**Dateien:** 20

---

### DOMAIN-04: CREATION — Creation & Publishing

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Neues entstehen lassen — Werke, Erlebnisse, Stories, Momente |
| **Verantwortung** | Create-Flows, Publishing, Media-Upload, Content-Lifecycle |
| **Daten** | `works`, `experiences`, `stories`, `story_views`, `feed_posts`, `moments` |
| **Tabellen** | `works`, `experiences`, `stories`, `story_views`, `feed_posts` |
| **Events** | `work.published`, `experience.created`, `story.posted`, `moment.shared` |
| **Services** | `WorkService`, `ExperienceService`, `StoryService`, `worksService`, `storageService` (content.js) |
| **Contexts** | `AppStateContext.works` (Owner — Ziel: CreationContext) |
| **Hooks** | — |
| **Komponenten** | `HuiCreateFlow`, `WerkPublisher`, `ExperienceCreator`, `publishing/*`, `works/*`, `WorkDetailPage`, `StoryComposer` |
| **Pages** | — (Flows als Overlays) |
| **Realtime** | `works-feed` (DiscoveryFeed — Ziel: Creation-Domain) |
| **Ownership** | `AppStateContext` (works), `services/db.js` (experiences) |
| **Core-Relevanz** | ★★★★ — Grundpfeiler „Erschaffen" |

**Dateien:** 30

---

### DOMAIN-05: COMMERCE — Commerce & Transactions

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Wertschöpfung ermöglichen — Buchungen, Käufe, Escrow, Creator-Economy |
| **Verantwortung** | Orders, Payments, Bookings, Cart, Payouts, Supports |
| **Daten** | `bookings`, `experience_bookings`, `orders`, `order_items`, `creator_wallets`, `creator_supports`, `commerce_events` |
| **Tabellen** | `bookings`, `experience_bookings`, `orders`, `order_items`, `creator_wallets`, `creator_supports` |
| **Events** | `booking.created`, `order.completed`, `payment.received`, `escrow.released` |
| **Services** | `BookingService`, `commerceEngine` (orderService, fulfillmentService), `creatorEconomy` (wallet, support, booking, sales, analytics) |
| **Contexts** | `bookingContext` (Creator-Bookings), `AppStateContext.bookings` (Client) |
| **Hooks** | `useCartPersistence`, `useCreatorBookings` |
| **Komponenten** | `commerce/*`, `economy/SupportFlow`, `ExperienceBookingFlow` |
| **Pages** | — |
| **Realtime** | `bookings-client:{userId}`, `creator-bookings:{userId}` |
| **Ownership** | `bookingContext.js` (Creator), `AppStateContext` (Client), Edge Functions (Payments) |
| **Core-Relevanz** | ★★★★ — Grundpfeiler „Wertschöpfen" + Gentle Economy |

**Dateien:** 13

---

### DOMAIN-06: COMMUNICATION — Communication & Notifications

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Menschlicher Dialog — Chats, Nachrichten, Benachrichtigungen |
| **Verantwortung** | Conversations, Messages, Notifications, Chat-UI |
| **Daten** | `conversations`, `messages`, `chats`, `notifications` |
| **Tabellen** | `conversations`, `messages`, `chats`, `notifications` |
| **Events** | `message.sent`, `message.read`, `notification.received` |
| **Services** | `ChatService`, `notificationService` |
| **Contexts** | `chatContext` (Owner), `AppStateContext.notifications` (Owner) |
| **Hooks** | `useChatList`, `useChatThread`, `useNotifCount`, `useNotifications` |
| **Komponenten** | `chat-center/*`, `NotificationCenter`, `notifications/NotificationPanel` |
| **Pages** | — (ChatCenterOverlay) |
| **Realtime** | `chat-list:{userId}`, `thread:{chatId}`, `asc-notifs:{userId}`, `chats:{userId}` |
| **Ownership** | `chatContext.js`, `AppStateContext.jsx` |
| **Core-Relevanz** | ★★★ — Grundpfeiler „Verbinden" + „Unterstützen" |

**Dateien:** 17

---

### DOMAIN-07: DISCOVERY — Discovery & Feed

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Orientierung — Feed, Suche, Entdeckung (keine Sucht-Maschine) |
| **Verantwortung** | Home-Feed, Discover, Search, Favorites, Feed-Rhythmus |
| **Daten** | `feed_items`, `feed_posts`, kuratierte Mischungen |
| **Tabellen** | `feed_items`, `feed_posts` |
| **Events** | `feed.refreshed`, `discovery.search` |
| **Services** | `FeedService`, `feedService`, `discoverService`, `SearchService` (in db.js / content.js) |
| **Contexts** | — (Ziel: DiscoveryContext) |
| **Hooks** | `useFeedStream` |
| **Komponenten** | `feed/*`, `discovery/PeopleSearch`, `SearchCommandCenter` |
| **Pages** | `DiscoverPage`, `FavoritesPage`, `LiveMapPage` |
| **Realtime** | `works-feed` |
| **Ownership** | `DiscoveryFeed.jsx` (lokal — akzeptiert, Ziel: DiscoveryContext) |
| **Core-Relevanz** | ★★★★ — Constitution: „Feed dient Orientierung" |

**Dateien:** 21

---

### DOMAIN-08: IMPACT — Impact & Stewardship

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Gemeinwohl — Impact Pool, Abstimmungen, Projekte |
| **Verantwortung** | Impact-Voting, Projekte, Runden, Verteilung |
| **Daten** | `impact_projects`, `impact_rounds`, `impact_votes`, `impact_pool` |
| **Tabellen** | `impact_projects`, `impact_rounds`, `impact_votes` |
| **Events** | `impact.vote.cast`, `impact.round.distributed` |
| **Services** | `ImpactService` (in db.js) |
| **Contexts** | — |
| **Hooks** | — |
| **Komponenten** | `studio/ImpactStimmenModal`, `system/flows/impact/*` |
| **Pages** | `ImpactPage` |
| **Realtime** | — |
| **Ownership** | `ImpactPage.jsx` (direkt — akzeptiert standalone) |
| **Core-Relevanz** | ★★★★★ — Grundpfeiler „Impact" + Core-Tabelle `impact_votes` |

**Dateien:** 9

---

### DOMAIN-09: WIRKUNG — Wirkung, Resonance & Orb

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Gelebte Wirkung sichtbar machen — Orb, Resonanz, Grundpfeiler |
| **Verantwortung** | Core Engine, Resonance Engine, Orb Engine, Pillar-Signale |
| **Daten** | `resonance_signals`, `orb_states`, `core_metrics`, Pillar-Profile |
| **Tabellen** | `resonance_signals`, `orb_states`, `core_metrics` |
| **Events** | `resonance.sent`, `orb.evolved` (langsam, nicht Echtzeit-Gamification) |
| **Services** | `resonanceService` (content.js), Core Engines |
| **Contexts** | — |
| **Hooks** | `useCoreEngine`, `useOrbParams`, `useCoreProfile` |
| **Komponenten** | `orb/*`, `system/orb/*`, `OrbCompass`, `HuiPlusSheet`, `OrbLeaf`, `OrbSignatur` |
| **Pages** | — |
| **Realtime** | — (Orb ändert sich über Monate, nicht Minuten) |
| **Ownership** | `core/coreEngine.js`, `core/resonanceEngine.js`, `core/orbEngine.js` |
| **Core-Relevanz** | ★★★★★ — Constitution-Kern: Single Source of Truth für Wirkung |

**Dateien:** 26

---

### DOMAIN-10: TRUST — Trust & Reputation

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Vertrauen aufbauen — Reputation, Zuverlässigkeit |
| **Verantwortung** | Trust-Signale, Reputation-Scores, Verifizierung |
| **Daten** | Trust-Metriken, Reputation-Scores |
| **Tabellen** | `trust_scores`, `reputation_events` (falls vorhanden) |
| **Events** | `trust.updated` |
| **Services** | — (Ziel: TrustService) |
| **Contexts** | `trustContext` (Owner) |
| **Hooks** | `useReputation` |
| **Komponenten** | — (embedded) |
| **Pages** | — |
| **Realtime** | — |
| **Ownership** | `trustContext.js` |
| **Core-Relevanz** | ★★★ — Grundpfeiler „Unterstützen" |

**Dateien:** 2

---

### DOMAIN-11: PRESENCE — Presence & Session

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Menschliche Präsenz — wer ist da, Session-State |
| **Verantwortung** | Online-Status, Session-Hooks, Creator-Presence |
| **Daten** | Presence-State (ephemeral + persisted) |
| **Tabellen** | `presence` (falls persistiert) |
| **Events** | `presence.updated`, `session.started` |
| **Services** | `presence/index.js` |
| **Contexts** | `sessionHooks` (Owner) |
| **Hooks** | `usePresence`, `useSession` |
| **Komponenten** | `CreatorPresence` |
| **Pages** | — |
| **Realtime** | Presence-Channels (verteilt) |
| **Ownership** | `sessionHooks.js` |
| **Core-Relevanz** | ★★★ — Presence Philosophy: keine Performance Identity |

**Dateien:** 5

---

### DOMAIN-12: INTELLIGENCE — Assistive Intelligence

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Menschen ergänzen, nicht ersetzen — kontextuelle Assistenz |
| **Verantwortung** | Relationship Memory, Resonance Spaces, Guidance, Living Memory |
| **Daten** | Interaction Memory (client-side + optional persist) |
| **Tabellen** | — (primär client-seitig) |
| **Events** | `memory.updated`, `guidance.shown` |
| **Services** | Intelligence-Module (kein separates Service-File) |
| **Contexts** | — |
| **Hooks** | `useLivingMemory` |
| **Komponenten** | `guidance/*` |
| **Pages** | — |
| **Realtime** | — |
| **Ownership** | `lib/intelligence/index.js` |
| **Core-Relevanz** | ★★★ — Constitution KI-Prinzipien |

**Dateien:** 20

---

### DOMAIN-13: WORLD — World & Atmosphere

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Atmosphärische Hülle — Stimmung, Oberfläche, Orb-Layer |
| **Verantwortung** | World Surface, Mood, Ambient UI, Tab Visibility |
| **Daten** | Mood-State, Surface-Config (client) |
| **Tabellen** | — |
| **Events** | `mood.changed`, `surface.transitioned` |
| **Services** | `worldSurfaceController`, `orbLayer` |
| **Contexts** | `WorldSurfaceContext`, `OrbWorldContext` |
| **Hooks** | — |
| **Komponenten** | `home/AmbientWorldBar`, `home/mood/*`, `MoodOrbButton` |
| **Pages** | — |
| **Realtime** | — |
| **Ownership** | `world/worldSurfaceController.js` |
| **Core-Relevanz** | ★★ — Darstellung, kein Wirkungsmodell |

**Dateien:** 13

---

### DOMAIN-14: STUDIO — Creator Studio & Operations

| Attribut | Beschreibung |
|---|---|
| **Zweck** | Creator-Betrieb — Dashboard, Analytics, Tickets, Admin |
| **Verantwortung** | Studio-UI, Creator-Dashboard, Statistiken, Support-Tickets, Diagnose |
| **Daten** | Aggregierte Creator-Metriken |
| **Tabellen** | — (liest aus anderen Domänen) |
| **Events** | — |
| **Services** | `analyticsService` (creatorEconomy.js) |
| **Contexts** | — |
| **Hooks** | — |
| **Komponenten** | `studio/*`, `SupportSheet` |
| **Pages** | `CreatorStudio`, `MeinHUI`, `MyCreatorDashboard`, `PlatformDashboard`, `Admin`, `DiagnosePage`, `studio/*` |
| **Realtime** | — |
| **Ownership** | Studio-Pages (aggregierend) |
| **Core-Relevanz** | ★★ — Operations, keine Wirkungslogik |

**Dateien:** 14

---

## V. Domain-Abhängigkeitsregeln

Erlaubte Abhängigkeitsrichtung (RFC-000 erweitert):

```
KERNEL ← alle Domänen dürfen KERNEL importieren
WIRKUNG ← DISCOVERY, IDENTITY, CREATION, IMPACT, CONNECTION
IDENTITY ← CONNECTION, COMMERCE, COMMUNICATION, STUDIO
CREATION ← COMMERCE, DISCOVERY
COMMERCE ← CREATION, IDENTITY
DISCOVERY ← CREATION, CONNECTION, WIRKUNG, IDENTITY
INTELLIGENCE ← alle (read-only Kontext)
WORLD ← WIRKUNG (read-only)
```

**Verboten:**
- Domäne A schreibt in Domäne B's Tabellen ohne B's Service
- UI-Komponente besitzt eigene Wirkungslogik (Constitution)
- Direkter Core-Table-Write ohne Core Engine

---

## VI. Datei-Zuordnung

### Übersicht

| Domain | Dateien | Multi-Domain |
|---|---|---|
| KERNEL | 64 | 8 |
| IDENTITY | 44 | 4 |
| CREATION | 30 | 3 |
| CONNECTION | 20 | 2 |
| COMMERCE | 13 | 3 |
| COMMUNICATION | 17 | 0 |
| DISCOVERY | 21 | 5 |
| IMPACT | 9 | 0 |
| WIRKUNG | 26 | 4 |
| TRUST | 2 | 0 |
| PRESENCE | 5 | 1 |
| INTELLIGENCE | 20 | 3 |
| WORLD | 13 | 6 |
| STUDIO | 14 | 5 |
| **Gesamt** | **298** | **34** |

### Vollständige Zuordnung

Die maschinenlesbare Zuordnung aller 298 Dateien liegt in:

**[`docs/generated/domain-file-map.json`](generated/domain-file-map.json)**

Generator: `scripts/arch-005-generate-domain-map.js`

### Multi-Domain-Dateien (34 — nicht aufteilen, nur kennzeichnen)

| Datei | Primär | Auch |
|---|---|---|
| `lib/AppStateContext.jsx` | KERNEL | IDENTITY, COMMERCE, COMMUNICATION, CONNECTION, CREATION |
| `services/db.js` | KERNEL | IDENTITY, CREATION, COMMERCE, COMMUNICATION, DISCOVERY, IMPACT, CONNECTION |
| `services/content.js` | DISCOVERY | CREATION |
| `pages/Home.jsx` | KERNEL | DISCOVERY, WORLD, WIRKUNG, COMMUNICATION |
| `components/home/HomeShell.jsx` | KERNEL | DISCOVERY, WORLD |
| `components/home/header/SearchCommandCenter.jsx` | DISCOVERY | IDENTITY, CONNECTION |
| `components/home/header/HomeHeader.jsx` | KERNEL | DISCOVERY, WORLD |
| `components/home/navigation/BottomNav.jsx` | KERNEL | DISCOVERY |
| `components/home/navigation/NavItem.jsx` | KERNEL | DISCOVERY |
| `components/home/navigation/navConfig.js` | KERNEL | DISCOVERY |
| `components/home/AmbientWorldBar.jsx` | WORLD | WIRKUNG |
| `components/home/header/MoodOrbButton.jsx` | WORLD | WIRKUNG |
| `components/home/mood/*` (3) | WORLD | WIRKUNG |
| `components/profile/ProfileHeader.jsx` | IDENTITY | PRESENCE |
| `components/profile/PublicProfilePreview.jsx` | IDENTITY | WIRKUNG |
| `components/studio/ProfilBearbeitenModal.jsx` | IDENTITY | STUDIO |
| `components/studio/EinAusgabenModal.jsx` | COMMERCE | STUDIO |
| `components/studio/MeineProjekteModal.jsx` | CREATION | STUDIO |
| `components/studio/StatistikenModal.jsx` | COMMERCE | STUDIO |
| `core/HuiConnectionEngine.jsx` | KERNEL | CONNECTION |
| `feed/cards/FeedRouter.jsx` | DISCOVERY | CREATION |
| `feed/useFeedStream.js` | DISCOVERY | WIRKUNG |
| `feed/feedRhythmEngine.js` | DISCOVERY | WIRKUNG |
| `lib/intelligence/discoverWorld.js` | INTELLIGENCE | DISCOVERY |
| `lib/intelligence/resonanceSpaces.js` | INTELLIGENCE | WIRKUNG |
| `lib/intelligence/relationshipMemory.js` | INTELLIGENCE | CONNECTION |
| `lib/world/orbLayer.js` | WORLD | WIRKUNG |
| `system/orb/MemberOrbHome.jsx` | WIRKUNG | WORLD |
| `pages/MeinHUI.jsx` | STUDIO | IDENTITY |
| `pages/MyCreatorDashboard.jsx` | STUDIO | COMMERCE |
| `pages/studio/MeineResonanz.jsx` | STUDIO | WIRKUNG |
| `pages/studio/StudioSubPages.jsx` | STUDIO | COMMUNICATION, COMMERCE, CREATION |

---

## VII. Service-Analyse

### Übersicht aller Services

| Service | Datei | Domain | Empfehlung | Begründung |
|---|---|---|---|---|
| `ProfileService` | db.js | IDENTITY | **behalten** | Kanonischer Identity-Owner, IDENTITY_CONTRACT |
| `MembershipService` | db.js | IDENTITY | **behalten** | Klare Verantwortung |
| `TalentService` | db.js | IDENTITY | **behalten** | Talent/Wirker-Profil |
| `WorkService` | db.js | CREATION | **zusammenführen** | Mit `worksService` (content.js) → `creationService` |
| `ExperienceService` | db.js | CREATION | **zusammenführen** | Mit Creation-Flows in content.js |
| `StoryService` | db.js | CREATION | **zusammenführen** | Mit feed/Story-Komponenten-Logik |
| `BookingService` | db.js | COMMERCE | **zusammenführen** | Mit `bookingService` (creatorEconomy.js) — Namenskollision |
| `ChatService` | db.js | COMMUNICATION | **behalten** | Kanonisch, chatContext nutzt |
| `ImpactService` | db.js | IMPACT | **behalten** | Single Owner Impact-Daten |
| `FeedService` | db.js | DISCOVERY | **zusammenführen** | Mit `feedService` (content.js) |
| `MatchService` | db.js | CONNECTION | **behalten** | Klare Domain |
| `RecommendationService` | db.js | CONNECTION | **behalten** | Klare Domain |
| `SearchService` | db.js | DISCOVERY | **zusammenführen** | Mit `discoverService` (content.js) |
| `feedService` | content.js | DISCOVERY | **zusammenführen** | Duplikat zu FeedService — unterschiedliche Queries |
| `worksService` | content.js | CREATION | **zusammenführen** | Duplikat zu WorkService |
| `resonanceService` | content.js | WIRKUNG | **umbenennen** | → `wirkungService` — Resonanz ist WIRKUNG-Domain |
| `storageService` | content.js | CREATION | **behalten** | Media-Upload isoliert |
| `discoverService` | content.js | DISCOVERY | **zusammenführen** | Mit SearchService |
| `orderService` | commerceEngine.js | COMMERCE | **behalten** | Kanonisch Commerce 2.0 |
| `fulfillmentService` | commerceEngine.js | COMMERCE | **behalten** | Fulfillment-Logik getrennt |
| `walletService` | creatorEconomy.js | COMMERCE | **behalten** | Wallet isoliert |
| `supportService` | creatorEconomy.js | COMMERCE | **behalten** | Supports ≠ Bookings |
| `bookingService` | creatorEconomy.js | COMMERCE | **zusammenführen** | Kollision mit BookingService — `experienceBookingService` |
| `salesService` | creatorEconomy.js | COMMERCE | **behalten** | Sales-Analytics |
| `analyticsService` | creatorEconomy.js | STUDIO | **aufteilen** | Analytics → STUDIO, Sales-Metriken → COMMERCE |
| `notificationService` | lib/ | COMMUNICATION | **behalten** | Notification-Logik |
| `presence/index` | lib/ | PRESENCE | **behalten** | Presence-Owner |

### Deprecated / Legacy

| Service/Modul | Empfehlung | Begründung |
|---|---|---|
| `hooks/useBookings.v2.js` | **deprecated** | UNUSED (SYSTEM_OWNERSHIP) |
| `hooks/useProfile.js` | **deprecated** | UNUSED |
| `hooks/useProfile.v2.js` | **deprecated** | UNUSED |
| `hooks/useFeed.js` | **deprecated** | UNUSED — ersetzt durch useFeedStream |
| `hooks/useMatch.js` | **deprecated** | UNUSED |
| `hooks/useImpactProjects.js` | **deprecated** | UNUSED |
| `hooks/useFavorites.js` | **deprecated** | UNUSED |
| `hooks/useTalentProfile.js` | **deprecated** | UNUSED |
| `hooks/useWirker.js` | **deprecated** | UNUSED |
| `hooks/useWorks.js` | **deprecated** | UNUSED |
| `hooks/useChat.js` | **deprecated** | Noch von MeinHUI_SubPages genutzt — migrieren dann löschen |
| `lib/mockData.js` | **deprecated** | LEGACY — echte Supabase-Daten |
| `services/db.js` (monolith) | **aufteilen** | 651 Zeilen, 13 Services — in Domain-Services splitten |

### Ziel-Service-Struktur (Referenz, nicht implementiert)

```
src/domains/
  identity/services/identityService.js
  creation/services/creationService.js
  commerce/services/commerceService.js
  communication/services/communicationService.js
  discovery/services/discoveryService.js
  impact/services/impactService.js
  connection/services/connectionService.js
  wirkung/services/wirkungService.js
```

---

## VIII. ARCH-005 Migrationsplan (Domain für Domain)

> **Hinweis:** Dies ist ein Planungsdokument. Keine Änderungen in ARCH-005.

### Migrations-Reihenfolge (Abhängigkeitskritisch)

```
Phase 1: KERNEL + WIRKUNG     (Fundament)
Phase 2: IDENTITY             (Core Bypass beheben)
Phase 3: TRUST + PRESENCE     (klein, isoliert)
Phase 4: CONNECTION           (Social Graph)
Phase 5: CREATION             (Content-Lifecycle)
Phase 6: COMMUNICATION        (Chat/Notifs)
Phase 7: COMMERCE             (Transaktionen)
Phase 8: DISCOVERY            (Feed-Konsolidierung)
Phase 9: IMPACT               (Impact Pool)
Phase 10: INTELLIGENCE + WORLD (Atmosphäre)
Phase 11: STUDIO              (Aggregation)
```

---

### Phase 1: KERNEL

| Attribut | Wert |
|---|---|
| **Nutzen** | Scanner, Registry, Action Engine als durchgängige Governance |
| **Risiko** | Niedrig — keine fachlichen Daten |
| **Aufwand** | Mittel — @domain/@owner Header in 298 Dateien |
| **Erwartete Violations** | −267 INFO (MISSING_HEADER), −23 LOW |
| **Health-Verbesserung** | Ownership Coverage 0% → 100%, Architecture Coverage 10% → 100% |
| **Abhängigkeiten** | Keine — Startpunkt |

**Maßnahmen:** `domains.js` auf Business-Domains erweitern, `domain-file-map.json` in Scanner einbinden, `AppStateContext` Entflechtungsplan.

---

### Phase 2: WIRKUNG

| Attribut | Wert |
|---|---|
| **Nutzen** | Constitution-konforme Single Source of Truth für Wirkung |
| **Risiko** | Hoch — 42 CRITICAL Core Bypasses betreffen profiles/impact_votes |
| **Aufwand** | Hoch — alle direkten Core-Writes über Engines leiten |
| **Erwartete Violations** | −42 CRITICAL, −17 CORE-Domain |
| **Health-Verbesserung** | Core Engine Adoption 4% → 80%+, CRITICAL → 0 |
| **Abhängigkeiten** | KERNEL (Header, Scanner-Regeln) |

**Maßnahmen:** `coreEngine.js` als einziger Write-Gateway für `profiles`, `impact_votes`, `resonance_signals`.

---

### Phase 3: IDENTITY

| Attribut | Wert |
|---|---|
| **Nutzen** | Ein Identity-Owner, kein Profile-Shadow-State (19 Duplikate) |
| **Risiko** | Hoch — Auth + Profile in 8+ Dateien |
| **Aufwand** | Hoch |
| **Erwartete Violations** | −35 HIGH (DB_DIRECT_WRITE profiles), −19 DUPLICATE_OWNER |
| **Health-Verbesserung** | Profile-Domain Health 30% → 85% |
| **Abhängigkeiten** | WIRKUNG (Core Engine für profiles) |

**Maßnahmen:** `IdentityContext` extrahieren aus AppState, `ProfileService` aus db.js isolieren.

---

### Phase 4: TRUST + PRESENCE

| Attribut | Wert |
|---|---|
| **Nutzen** | Isolierte, kleine Domänen — schnelle Wins |
| **Risiko** | Niedrig |
| **Aufwand** | Niedrig |
| **Erwartete Violations** | −5 MEDIUM |
| **Health-Verbesserung** | +5% Domain-Compliance |
| **Abhängigkeiten** | IDENTITY |

---

### Phase 5: CONNECTION

| Attribut | Wert |
|---|---|
| **Nutzen** | Follows/Recommendations aus AppState, kein WorkDetailPage-Direct-Write |
| **Risiko** | Mittel — 8 booking-shadow-states analog bei follows |
| **Aufwand** | Mittel |
| **Erwartete Violations** | −15 HIGH, −8 DUPLICATE_OWNER |
| **Health-Verbesserung** | Connection Health 40% → 80% |
| **Abhängigkeiten** | IDENTITY |

**Maßnahmen:** `ConnectionContext`, `toggleFollow()` zentralisieren.

---

### Phase 6: CREATION

| Attribut | Wert |
|---|---|
| **Nutzen** | Einheitlicher Creation-Lifecycle, Service-Konsolidierung |
| **Risiko** | Mittel — Create-Flows haben akzeptierte Direct-Writes |
| **Aufwand** | Hoch — HuiCreateFlow (1782 Zeilen), 11 work-shadow-states |
| **Erwartete Violations** | −25 HIGH, −11 DUPLICATE_OWNER |
| **Health-Verbesserung** | Creation Health 35% → 75% |
| **Abhängigkeiten** | IDENTITY, KERNEL |

**Maßnahmen:** `creationService` aus WorkService + worksService + StoryService.

---

### Phase 7: COMMUNICATION

| Attribut | Wert |
|---|---|
| **Nutzen** | Chat/Notif Single-Owner, Legacy useChat entfernen |
| **Risiko** | Mittel — 3 chat-shadow-states, MeinHUI_SubPages direct writes |
| **Aufwand** | Mittel |
| **Erwartete Violations** | −12 HIGH, −6 DUPLICATE_OWNER |
| **Health-Verbesserung** | Communication Health 70% → 95% (bereits gut strukturiert) |
| **Abhängigkeiten** | IDENTITY |

**Maßnahmen:** `useChat.js` → `chatContext`, WirkerProfilePage chat.insert → chatContext.

---

### Phase 8: COMMERCE

| Attribut | Wert |
|---|---|
| **Nutzen** | Ein Booking-Owner, Commerce 2.0 durchgängig |
| **Risiko** | Hoch — Payments, Escrow, Stripe-Integration |
| **Aufwand** | Hoch — 3 parallele Booking-Services |
| **Erwartete Violations** | −20 HIGH, −8 DUPLICATE_OWNER |
| **Health-Verbesserung** | Commerce Health 45% → 85% |
| **Abhängigkeiten** | IDENTITY, CREATION |

**Maßnahmen:** `BookingService` + `bookingService` + `bookingContext` konsolidieren.

---

### Phase 9: DISCOVERY

| Attribut | Wert |
|---|---|
| **Nutzen** | Ein Feed-Owner, kein DiscoveryFeed-Monolith (2562 Zeilen) |
| **Risiko** | Mittel — Feed ist zentral für UX |
| **Aufwand** | Hoch |
| **Erwartete Violations** | −30 HIGH, −15 MEDIUM |
| **Health-Verbesserung** | Discovery Health 40% → 80% |
| **Abhängigkeiten** | CREATION, CONNECTION, WIRKUNG |

**Maßnahmen:** `discoveryService` = FeedService + feedService + SearchService.

---

### Phase 10: IMPACT

| Attribut | Wert |
|---|---|
| **Nutzen** | Impact-Votes nur über Core Engine |
| **Risiko** | Mittel — Core-Tabelle impact_votes |
| **Aufwand** | Niedrig — kleine Domain (9 Dateien) |
| **Erwartete Violations** | −5 CRITICAL (ImpactStimmenModal) |
| **Health-Verbesserung** | Impact Health 60% → 95% |
| **Abhängigkeiten** | WIRKUNG |

---

### Phase 11: INTELLIGENCE + WORLD

| Attribut | Wert |
|---|---|
| **Nutzen** | Klare Grenze: Intelligence liest, schreibt nicht in fremde Domänen |
| **Risiko** | Niedrig — primär client-seitig |
| **Aufwand** | Niedrig |
| **Erwartete Violations** | −10 MEDIUM (Cross-Domain-Reads) |
| **Health-Verbesserung** | +10% Domain-Isolation |
| **Abhängigkeiten** | DISCOVERY, WIRKUNG, CONNECTION |

---

### Phase 12: STUDIO

| Attribut | Wert |
|---|---|
| **Nutzen** | Studio als reiner Aggregator — keine eigenen DB-Writes |
| **Risiko** | Mittel — StudioSubPages (2047 Zeilen) |
| **Aufwand** | Hoch |
| **Erwartete Violations** | −25 HIGH (Studio-Direct-Writes) |
| **Health-Verbesserung** | Studio Health 30% → 70% |
| **Abhängigkeiten** | Alle vorherigen Domänen (Aggregator) |

---

## IX. Erwartete Gesamt-Verbesserung nach vollständiger Migration

| Metrik | Heute (ARCH-001) | Ziel (post-Migration) |
|---|---|---|
| Violations gesamt | 629 | < 50 |
| CRITICAL | 42 | 0 |
| HIGH | 112 | < 20 |
| Ownership Coverage | 0% | 100% |
| Action Engine Adoption | 4% | > 80% |
| Core Engine Adoption | 4% | > 90% |
| Duplicate Owners | 17 | 0 |
| DB Direct Writes in UI | 69 | < 5 (nur akzeptierte Create-Flows) |
| Architecture Health Score | ~15% | > 85% |

---

## X. Governance-Regeln (ab sofort)

1. **Jede neue Datei** erhält `@domain` und `@owner` Header vor Merge
2. **Jede neue Tabelle** wird genau einer Domain zugeordnet (in diesem Dokument ergänzen)
3. **Cross-Domain-Writes** sind verboten — nur über Domain-Service
4. **Multi-Domain-Dateien** müssen in `domain-file-map.json` dokumentiert sein
5. **Scanner** (ARCH-006) validiert gegen dieses Blueprint, nicht gegen Pfad-Convention
6. **Refactorings** folgen dem Migrationsplan Phase für Phase — nie dateiweise

---

## XI. Referenzen

| Dokument | Pfad |
|---|---|
| Constitution | [`HUI_CONSTITUTION.md`](../HUI_CONSTITUTION.md) |
| System Ownership | [`docs/SYSTEM_OWNERSHIP.md`](SYSTEM_OWNERSHIP.md) |
| Route Registry (ADR-001) | [`src/routes/registry.js`](../src/routes/registry.js) |
| Architecture Scanner | [`src/architecture/scanner/`](../src/architecture/scanner/) |
| Domain File Map | [`docs/generated/domain-file-map.json`](generated/domain-file-map.json) |
| Violations Report | [`docs/generated/violations.md`](generated/violations.md) |
| Realtime Registry | [`docs/REALTIME_REGISTRY.md`](REALTIME_REGISTRY.md) |

---

*Domain Architecture Blueprint v1 — ARCH-005 abgeschlossen.*  
*Nächster Schritt: ARCH-006 — Scanner auf Business-Domains erweitern.*
