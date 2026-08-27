#!/usr/bin/env node
/**
 * ARCH-005.1 — Domain Contract Generator
 * Generates per-domain markdown contracts, index, and machine-readable JSON.
 * Sources: DOMAIN_ARCHITECTURE_BLUEPRINT_V1, Constitution, ADR, RFC, SYSTEM_OWNERSHIP
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs/governance/domain-contracts');
const MAP_PATH = join(ROOT, 'docs/generated/domain-file-map.json');

const LAYERS = {
  allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'],
  mapping: {
    KERNEL: { allowed: ['Core', 'Infrastructure', 'Application'], forbidden: ['Presentation'] },
    IDENTITY: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    CONNECTION: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    CREATION: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    COMMERCE: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    COMMUNICATION: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    DISCOVERY: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    IMPACT: { allowed: ['Presentation', 'Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    WIRKUNG: { allowed: ['Domain', 'Core', 'Infrastructure', 'Application'], forbidden: ['Presentation'] },
    TRUST: { allowed: ['Application', 'Domain', 'Infrastructure', 'Core'], forbidden: [] },
    PRESENCE: { allowed: ['Application', 'Domain', 'Infrastructure'], forbidden: [] },
    INTELLIGENCE: { allowed: ['Application', 'Domain', 'Infrastructure'], forbidden: ['Presentation'] },
    WORLD: { allowed: ['Presentation', 'Application', 'Infrastructure'], forbidden: ['Domain'] },
    STUDIO: { allowed: ['Presentation', 'Application'], forbidden: ['Domain', 'Infrastructure'] },
  },
};

/** @type {Record<string, object>} */
const CONTRACTS = {
  KERNEL: {
    label: 'Platform Kernel & Governance',
    pillar: 'Querschnitt — Fundament aller Grundpfeiler',
    purpose: 'Unveränderliche Plattformgrundlage: Verfassung, Semantik, Action-System, Routing-Registry, Design-Tokens, Supabase-Client, Architektur-Scanner und globale App-Orchestrierung.',
    responsibilities: [
      'Registry als Single Source of Meaning (HuiRegistry)',
      'Action Engine und Flow-Navigation (hui.actions, hui.flow, hui.navigator)',
      'Route Registry im Shadow Mode (ADR-001)',
      'Infrastruktur: supabaseClient, safeQuery, events/index, ErrorBoundaries',
      'Architecture Scanner & Governance-Artefakte (ARCH-001–004)',
      'Cross-Domain-Hub AppStateContext (Ziel: entflechten)',
      'services/db.js als temporäre Facade (Ziel: Domain-Services)',
    ],
    notResponsible: [
      'Fachliche Wirkungslogik (→ WIRKUNG)',
      'Profil-, Chat-, Commerce- oder Feed-Daten (→ jeweilige Domain)',
      'Eigene UI-Features jenseits Shell/Orchestrierung',
      'Direkte Business-Entscheidungen',
    ],
    tables: { owned: [], readOnly: ['*'], neverWrite: ['profiles', 'wirker_profiles', 'impact_votes', 'resonance_signals', 'orb_states', 'core_metrics', 'bookings', 'works', 'messages', 'notifications'] },
    ownership: {
      services: ['services/db.js (Facade)', 'lib/supabaseClient.js', 'lib/safeQuery.js', 'lib/events/index.js'],
      contexts: ['lib/AppStateContext.jsx (Cross-Domain-Hub — Ziel: reduzieren)'],
      hooks: [],
      components: ['App.jsx', 'components/ErrorBoundary.jsx', 'components/ProtectedRoute.jsx', 'components/entry/*'],
      pages: ['pages/Home.jsx (Orchestrierung)'],
    },
    publicApi: {
      services: [
        { name: 'HuiRegistry', module: 'src/registry/HuiRegistry.js', visibility: 'public' },
        { name: 'HUI_ACTIONS / useHuiActions', module: 'src/core/hui.actions.js', visibility: 'public' },
        { name: 'ROUTE_REGISTRY', module: 'src/routes/registry.js', visibility: 'public' },
        { name: 'emit (Platform Events)', module: 'src/lib/events/index.js', visibility: 'public' },
        { name: 'db.js Facade', module: 'src/services/db.js', visibility: 'internal' },
      ],
    },
    events: {
      publishes: ['HUI_ACTIONS.*', 'overlay.* (CustomEvents)'],
      consumes: [],
      forbidden: ['resonance.sent', 'orb.evolved', 'booking.completed', 'message.sent'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: [],
      mayBeDependedOnBy: ['*'],
      forbiddenCycles: ['KERNEL → fachliche Domain → KERNEL (ohne Service-Gateway)'],
    },
    constitution: {
      rules: ['IV — Schichtenmodell', 'IV — Registry Single Source of Meaning', 'IV — unidirektionaler Datenfluss', 'IX — Entscheidungsregel'],
      invariants: ['Constitution → Registry → Engines → UI', 'Keine Runtime-Imports aus ARCHITECTURE'],
      adrs: ['ADR-001', 'ADR-002'],
      rfcs: ['RFC-000', 'RFC-000A'],
    },
    scannerRules: [
      'MISSING_HEADER: @domain=KERNEL @owner erforderlich',
      'LAYER_VIOLATION: ARCHITECTURE darf nicht importiert werden',
      'CROSS_DOMAIN_WRITE: AppStateContext darf fremde Tabellen nicht schreiben (Ziel)',
      'REGISTRY_BYPASS: Labels/Farben aus HuiRegistry',
      'DIRECT_ROUTING: Action Engine statt window.location',
    ],
    intelligence: {
      recommendations: ['AppStateContext entflechten', 'db.js in Domain-Services splitten', '@domain/@owner Header rollout'],
      risks: ['Monolithischer Cross-Domain-State', 'Facade db.js als Single Point of Failure'],
      allowedRefactors: ['Header-Tags', 'Scanner-Integration', 'Route Registry Parity'],
      forbiddenRefactors: ['Runtime-Routing aus Registry ohne NAV-003 Freigabe'],
    },
    migration: {
      criteria: ['100% @domain/@owner Header', 'domain-file-map.json = Scanner-Quelle', 'AppStateContext Entflechtungsplan dokumentiert'],
      metrics: { headerCoverage: '100%', architectureCoverage: '100%', violationsReduction: '-267 INFO (MISSING_HEADER)' },
    },
    healthScore: 55,
    fileCount: 64,
  },

  IDENTITY: {
    label: 'Identity & Membership',
    pillar: '🤝 Verbinden · Querschnitt für alle Domains',
    purpose: 'Wer ist dieser Mensch auf HUI? Identität, Talent-Profil, Mitgliedschaft, Onboarding und Ambassador-Programm.',
    responsibilities: [
      'Auth/Session (Supabase Auth)',
      'Basis-Profil und Talent/Wirker-Profil',
      'Onboarding, Profile Completion, Settings',
      'Mitgliedschaft, Ambassador, Username-Validierung',
      'IDENTITY_CONTRACT in db.js',
    ],
    notResponsible: [
      'Wirkungsberechnung / Orb-Parameter (→ WIRKUNG)',
      'Follows/Connections (→ CONNECTION)',
      'Chat/Notifications (→ COMMUNICATION)',
      'Commerce-Transaktionen (→ COMMERCE)',
      'Feed-Ranking (→ DISCOVERY)',
    ],
    tables: {
      owned: ['profiles', 'wirker_profiles', 'memberships', 'profile_modules', 'profile_views'],
      readOnly: ['trust_scores', 'resonance_signals', 'orb_states'],
      neverWrite: ['works', 'bookings', 'messages', 'impact_votes', 'follows'],
    },
    ownership: {
      services: ['ProfileService', 'MembershipService', 'TalentService (db.js)', 'lib/profileMedia.js', 'lib/ambassadorUtils.js'],
      contexts: ['lib/AuthContext.jsx (Auth Owner)', 'AppStateContext.profile (Consumer → Ziel: IdentityContext)'],
      hooks: ['useProfileData', 'useProfileId', 'useTalentActivation', 'useAmbassador', 'useUsernameCheck'],
      components: ['components/auth/*', 'components/profile/*', 'components/ambassador/*', 'components/settings/SettingsModal', 'components/TalentOnboarding', 'components/HuiMembershipFlow'],
      pages: ['pages/LoginPage', 'pages/AuthCallback', 'pages/TalentProfilePage', 'pages/BasisProfilePage', 'pages/MyBasisProfile', 'pages/wirker-profile/*'],
    },
    publicApi: {
      services: [
        { name: 'ProfileService', methods: ['getProfile', 'updateProfile', 'getWirkerProfile'], visibility: 'public' },
        { name: 'MembershipService', methods: ['getMembership', 'updateMembership'], visibility: 'public' },
        { name: 'TalentService', methods: ['activateTalent', 'getTalentStatus'], visibility: 'public' },
        { name: 'useAuth', module: 'lib/AuthContext.jsx', visibility: 'public' },
        { name: 'IDENTITY_CONTRACT', module: 'services/db.js', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['PROFILE_COMPLETED', 'TALENT_ACTIVATED', 'MEMBER_JOINED', 'profile.updated', 'membership.changed', 'talent.activated'],
      consumes: ['BOOKING_COMPLETED (optional metadata)'],
      forbidden: ['resonance.sent', 'impact.vote.cast', 'work.published'],
    },
    realtime: { channels: [], presenceAllowed: ['profile_view (read-only)'] },
    dependencies: {
      mayDependOn: ['KERNEL', 'WIRKUNG'],
      mayBeDependedOnBy: ['CONNECTION', 'COMMERCE', 'COMMUNICATION', 'STUDIO', 'DISCOVERY'],
      forbiddenCycles: ['IDENTITY → DISCOVERY → IDENTITY (State-Loop ohne Service)'],
    },
    constitution: {
      rules: ['Regel 1 — Menschen sind keine Produkte', 'Regel 7 — KI ersetzt Menschen nicht', 'VIII — Sprache (kein Follower/Score)'],
      invariants: ['profiles-Writes nur über Core Engine / ProfileService', 'Auth nur via AuthContext'],
      adrs: ['ADR-001 (Login/Callback Routes)'],
      rfcs: ['RFC-000 Rule 4 — Core tables via Core Engine'],
    },
    scannerRules: [
      'CORE_BYPASS: profiles/wirker_profiles Write ohne coreEngine',
      'DUPLICATE_OWNER: profiles (19 Duplikat-States laut SYSTEM_OWNERSHIP)',
      'DB_DIRECT_WRITE: UI-Komponenten schreiben profiles',
      'CROSS_DOMAIN_WRITE: fremde Tabellen aus IDENTITY-Dateien',
    ],
    intelligence: {
      recommendations: ['IdentityContext aus AppState extrahieren', 'Core Engine für alle profile-Writes', 'ProfilBearbeitenModal → ProfileService'],
      risks: ['42 CRITICAL Core Bypass (profiles)', '19 duplicate profile states', 'AuthContext + 8 Dateien schreiben profiles'],
      allowedRefactors: ['ProfileService isolieren', 'IdentityContext', 'Core Engine Gateway'],
      forbiddenRefactors: ['Profil-Wirkungslogik in UI', 'Gamification/Score im Profil'],
    },
    migration: {
      criteria: ['Ein Profile-Owner', '0 CRITICAL profiles-Writes außerhalb Core', 'IdentityContext extrahiert'],
      metrics: { healthScore: '30% → 85%', criticalViolations: 0, duplicateOwners: 0 },
    },
    healthScore: 30,
    fileCount: 44,
  },

  CONNECTION: {
    label: 'Connection & Community',
    pillar: '🤝 Verbinden',
    purpose: 'Menschen verbinden — Beziehungen, Empfehlungen, Einladungen, Match und Referrals.',
    responsibilities: ['Follows', 'Connections', 'Referrals', 'Recommendations', 'Match-Scores', 'Gemeinschafts-Flows'],
    notResponsible: ['Chat/Messaging (→ COMMUNICATION)', 'Profil-Daten (→ IDENTITY)', 'Feed-Ranking (→ DISCOVERY)', 'Trust-Scores (→ TRUST)'],
    tables: {
      owned: ['follows', 'connections', 'recommendations', 'user_match_scores', 'referrals'],
      readOnly: ['profiles', 'trust_scores'],
      neverWrite: ['profiles', 'messages', 'works', 'bookings'],
    },
    ownership: {
      services: ['RecommendationService', 'MatchService (db.js)', 'lib/referralTracking.js', 'lib/community/*'],
      contexts: ['AppStateContext.follows (Owner → Ziel: ConnectionContext)'],
      hooks: [],
      components: ['components/connection-create/*', 'components/GemeinschaftsFlow', 'components/HuiMatchOverlay', 'components/shared/ConnectionFlowCard', 'components/home/header/MatchBar'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'RecommendationService', methods: ['createRecommendation', 'getRecommendations'], visibility: 'public' },
        { name: 'MatchService', methods: ['getMatchScore', 'computeMatch'], visibility: 'public' },
        { name: 'toggleFollow', methods: ['toggleFollow'], visibility: 'public' },
        { name: 'emitAfterConnection', module: 'lib/events/index.js', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['CONNECTION_OPENED', 'CONNECTION_ACCEPTED', 'CONNECTION_DEEPENED', 'connection.created', 'follow.toggled', 'recommendation.received', 'RECOMMENDATION_GIVEN'],
      consumes: ['BOOKING_COMPLETED', 'WORK_PUBLISHED'],
      forbidden: ['resonance.sent', 'impact.vote.cast'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'WIRKUNG', 'TRUST'],
      mayBeDependedOnBy: ['DISCOVERY', 'INTELLIGENCE', 'COMMUNICATION'],
      forbiddenCycles: ['CONNECTION → DISCOVERY → CONNECTION ohne Event'],
    },
    constitution: {
      rules: ['Regel 3 — Verbinden wichtiger als Reichweite', 'Regel 8 — Keine Gamification'],
      invariants: ['Keine Follower-Zählung im UI', 'Reichweite nie als Qualitätsmerkmal'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'DB_DIRECT_WRITE: WorkDetailPage writes follows',
      'DUPLICATE_OWNER: follows (AppState + WorkDetailPage)',
      'CROSS_DOMAIN_WRITE: connections aus fremden Domains',
    ],
    intelligence: {
      recommendations: ['ConnectionContext extrahieren', 'toggleFollow() zentralisieren', 'WorkDetailPage → ConnectionService'],
      risks: ['WorkDetailPage direct writes', '8 shadow states analog bookings'],
      allowedRefactors: ['ConnectionContext', 'Follow-Service-Konsolidierung'],
      forbiddenRefactors: ['Follower-Counts', 'Leaderboards'],
    },
    migration: {
      criteria: ['Ein Follow-Owner', '0 Direct-Writes in UI', 'ConnectionContext aktiv'],
      metrics: { healthScore: '40% → 80%', duplicateOwners: 0 },
    },
    healthScore: 40,
    fileCount: 20,
  },

  CREATION: {
    label: 'Creation & Publishing',
    pillar: '🎨 Erschaffen · 🌱 Wertschöpfen',
    purpose: 'Neues entstehen lassen — Werke, Erlebnisse, Stories, Momente und Publishing-Flows.',
    responsibilities: ['Create-Flows', 'Publishing', 'Media-Upload', 'Content-Lifecycle', 'Work/Experience/Story-Interaktionen'],
    notResponsible: ['Commerce/Payments (→ COMMERCE)', 'Feed-Aggregation (→ DISCOVERY)', 'Profil (→ IDENTITY)', 'Resonanz-Berechnung (→ WIRKUNG)'],
    tables: {
      owned: ['works', 'experiences', 'stories', 'story_views', 'feed_posts', 'moments', 'work_likes', 'work_saves', 'comments'],
      readOnly: ['profiles', 'wirker_profiles'],
      neverWrite: ['profiles', 'bookings', 'impact_votes'],
    },
    ownership: {
      services: ['WorkService', 'ExperienceService', 'StoryService (db.js)', 'worksService', 'storageService (content.js)'],
      contexts: ['AppStateContext.works (Owner → Ziel: CreationContext)'],
      hooks: [],
      components: ['components/HuiCreateFlow', 'components/WerkPublisher', 'components/ExperienceCreator', 'components/publishing/*', 'components/works/*', 'components/WorkDetailPage', 'components/StoryComposer', 'components/StoryBar'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'WorkService', methods: ['createWork', 'updateWork', 'getWork'], visibility: 'public' },
        { name: 'ExperienceService', methods: ['createExperience', 'getExperiences'], visibility: 'public' },
        { name: 'StoryService', methods: ['createStory', 'recordView'], visibility: 'public' },
        { name: 'storageService', methods: ['uploadMedia'], visibility: 'public' },
      ],
    },
    events: {
      publishes: ['WORK_PUBLISHED', 'EXPERIENCE_CREATED', 'work.published', 'experience.created', 'story.posted', 'moment.shared', 'WORK_RESONATED'],
      consumes: ['PROFILE_COMPLETED', 'TALENT_ACTIVATED'],
      forbidden: ['resonance.sent (→ WIRKUNG)', 'impact.vote.cast'],
    },
    realtime: { channels: ['works-feed'], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'WIRKUNG'],
      mayBeDependedOnBy: ['COMMERCE', 'DISCOVERY', 'STUDIO'],
      forbiddenCycles: ['CREATION → DISCOVERY → CREATION (Feed-Write-Loop)'],
    },
    constitution: {
      rules: ['Regel 2 — Wirkung wichtiger als Aufmerksamkeit', 'Regel 6 — Feed dient Orientierung'],
      invariants: ['Create-Flows: akzeptierte Direct-Writes nur isoliert', 'Keine Like-Gamification'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'DB_DIRECT_WRITE: WorkDetailPage writes work_likes/work_saves',
      'DUPLICATE_OWNER: works (11 shadow states)',
      'CROSS_DOMAIN_WRITE: StoryBar writes messages',
    ],
    intelligence: {
      recommendations: ['creationService aus WorkService + worksService', 'WorkDetailPage → CreationService', '11 work-shadow-states eliminieren'],
      risks: ['HuiCreateFlow 1782 Zeilen', 'WorkDetailPage cross-domain writes'],
      allowedRefactors: ['Service-Konsolidierung', 'CreationContext'],
      forbiddenRefactors: ['Like-Counter UI', 'Viral-Loops'],
    },
    migration: {
      criteria: ['creationService kanonisch', 'Ein Work-Owner', 'Create-Flows über Service'],
      metrics: { healthScore: '35% → 75%', duplicateOwners: 0 },
    },
    healthScore: 35,
    fileCount: 30,
  },

  COMMERCE: {
    label: 'Commerce & Transactions',
    pillar: '💚 Unterstützen · 🌱 Wertschöpfen',
    purpose: 'Wertschöpfung ermöglichen — Buchungen, Käufe, Escrow, Creator-Economy und Gentle Economy.',
    responsibilities: ['Orders', 'Payments', 'Bookings', 'Cart', 'Payouts', 'Supports', 'Creator Wallets'],
    notResponsible: ['Content-Erstellung (→ CREATION)', 'Chat (→ COMMUNICATION)', 'Impact Pool (→ IMPACT)', 'Profil (→ IDENTITY)'],
    tables: {
      owned: ['bookings', 'experience_bookings', 'orders', 'order_items', 'creator_wallets', 'creator_supports', 'commerce_events', 'availability_slots'],
      readOnly: ['profiles', 'works', 'experiences'],
      neverWrite: ['profiles', 'impact_votes', 'messages'],
    },
    ownership: {
      services: ['BookingService (db.js)', 'commerceEngine.js', 'creatorEconomy.js', 'lib/bookingContext.js'],
      contexts: ['bookingContext (Creator-Bookings)', 'AppStateContext.bookings (Client)'],
      hooks: ['useCartPersistence', 'useCreatorBookings'],
      components: ['components/commerce/*', 'components/economy/SupportFlow', 'components/ExperienceBookingFlow'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'orderService', module: 'commerceEngine.js', visibility: 'public' },
        { name: 'fulfillmentService', module: 'commerceEngine.js', visibility: 'public' },
        { name: 'BookingService', methods: ['createBooking', 'confirmBooking'], visibility: 'public' },
        { name: 'walletService', module: 'creatorEconomy.js', visibility: 'public' },
        { name: 'COMMERCE_CONFIG', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['BOOKING_REQUESTED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'booking.created', 'order.completed', 'payment.received', 'escrow.released'],
      consumes: ['WORK_PUBLISHED', 'EXPERIENCE_CREATED', 'PROFILE_COMPLETED'],
      forbidden: ['resonance.sent', 'impact.vote.cast'],
    },
    realtime: { channels: ['bookings-client:{userId}', 'creator-bookings:{userId}'], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'CREATION'],
      mayBeDependedOnBy: ['STUDIO', 'TRUST'],
      forbiddenCycles: ['COMMERCE → CREATION → COMMERCE (ohne Order-Event)'],
    },
    constitution: {
      rules: ['Regel 4 — Wertschöpfung und Gemeinwohl', 'Gentle Economy Philosophy'],
      invariants: ['Impact Pool Rate (7%)', 'Keine manipulative Pricing-Dark-Patterns'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'DUPLICATE_OWNER: bookings (8 shadow states)',
      'DB_DIRECT_WRITE: WirkerProfileDashboard writes bookings',
      'CROSS_DOMAIN_WRITE: MeinHUI_SubPages availability_slots',
    ],
    intelligence: {
      recommendations: ['BookingService + bookingService + bookingContext konsolidieren', 'experienceBookingService benennen'],
      risks: ['3 parallele Booking-Services', 'Stripe/Escrow Komplexität'],
      allowedRefactors: ['Booking-Konsolidierung', 'Commerce 2.0 durchgängig'],
      forbiddenRefactors: ['Aggressive Upselling', 'Engagement-optimierte Checkout-Flows'],
    },
    migration: {
      criteria: ['Ein Booking-Owner', 'Edge Functions als Payment-Gateway', '0 Namenskollisionen'],
      metrics: { healthScore: '45% → 85%', duplicateOwners: 0 },
    },
    healthScore: 45,
    fileCount: 13,
  },

  COMMUNICATION: {
    label: 'Communication & Notifications',
    pillar: '🤝 Verbinden · 💚 Unterstützen',
    purpose: 'Menschlicher Dialog — Chats, Nachrichten, Benachrichtigungen und Conversation-UI.',
    responsibilities: ['Conversations', 'Messages', 'Chats', 'Notifications', 'Chat-UI', 'Notification-Delivery'],
    notResponsible: ['Profil (→ IDENTITY)', 'Connections/Follows (→ CONNECTION)', 'Commerce (→ COMMERCE)', 'Push-Engagement-Optimierung'],
    tables: {
      owned: ['conversations', 'messages', 'chats', 'notifications'],
      readOnly: ['profiles'],
      neverWrite: ['profiles', 'works', 'bookings', 'follows'],
    },
    ownership: {
      services: ['ChatService (db.js)', 'lib/notificationService.js'],
      contexts: ['chatContext (Owner)', 'AppStateContext.notifications (Owner)'],
      hooks: ['useChatList', 'useChatThread', 'useNotifCount', 'useNotifications'],
      components: ['components/chat-center/*', 'components/NotificationCenter', 'components/notifications/*'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'ChatService', methods: ['sendMessage', 'getThread', 'createChat'], visibility: 'public' },
        { name: 'notificationService', methods: ['sendNotification', 'markRead'], visibility: 'public' },
        { name: 'useChatList', module: 'chatContext.js', visibility: 'public' },
        { name: 'useChatThread', module: 'chatContext.js', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['message.sent', 'message.read', 'notification.received'],
      consumes: ['CONNECTION_OPENED', 'BOOKING_REQUESTED', 'WORK_PUBLISHED'],
      forbidden: ['resonance.sent', 'spam ohne SPAM_DETECTED'],
    },
    realtime: {
      channels: ['chat-list:{userId}', 'thread:{chatId}', 'asc-notifs:{userId}', 'chats:{userId}'],
      presenceAllowed: ['typing indicator (ephemeral, optional)'],
    },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'CONNECTION'],
      mayBeDependedOnBy: ['STUDIO'],
      forbiddenCycles: ['COMMUNICATION → IDENTITY (Profile-Write)'],
    },
    constitution: {
      rules: ['Regel 7 — KI ersetzt Menschen nicht', 'Design: Keine aggressive Push-Strategie'],
      invariants: ['chatContext als Single Owner', 'Cleanup verpflichtend (REALTIME_REGISTRY)'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'REALTIME: Channel-Owner-Validierung',
      'DUPLICATE_OWNER: chats/messages (3 shadow states)',
      'DB_DIRECT_WRITE: WirkerProfilePage inserts chats',
      'LEGACY: useChat.js deprecated',
    ],
    intelligence: {
      recommendations: ['useChat.js → chatContext migrieren', 'WirkerProfilePage chat.insert → ChatService'],
      risks: ['MeinHUI_SubPages direct message writes', 'Legacy useChat hooks'],
      allowedRefactors: ['ChatContext-Konsolidierung', 'Legacy-Hook-Entfernung'],
      forbiddenRefactors: ['Engagement-Push-Notifications', 'Read-Receipt-Gamification'],
    },
    migration: {
      criteria: ['chatContext alleiniger Owner', 'useChat.js entfernt', '0 duplicate chat owners'],
      metrics: { healthScore: '70% → 95%', duplicateOwners: 0 },
    },
    healthScore: 70,
    fileCount: 17,
  },

  DISCOVERY: {
    label: 'Discovery & Feed',
    pillar: 'Querschnitt — Orientierung für alle Grundpfeiler',
    purpose: 'Orientierung — Feed, Suche, Entdeckung. Keine Aufmerksamkeitsmaschine.',
    responsibilities: ['Home-Feed', 'Discover', 'Search', 'Favorites', 'Feed-Rhythmus', 'People Search'],
    notResponsible: ['Content-Erstellung (→ CREATION)', 'Resonanz-Engine (→ WIRKUNG)', 'Profil-Writes (→ IDENTITY)', 'Connection-Logik (→ CONNECTION)'],
    tables: {
      owned: ['feed_items', 'feed_posts'],
      readOnly: ['works', 'experiences', 'profiles', 'stories', 'resonance_signals'],
      neverWrite: ['profiles', 'works', 'bookings', 'messages', 'impact_votes'],
    },
    ownership: {
      services: ['FeedService', 'SearchService (db.js)', 'feedService', 'discoverService (content.js)'],
      contexts: ['— (Ziel: DiscoveryContext)'],
      hooks: ['useFeedStream'],
      components: ['feed/*', 'components/discovery/*', 'components/home/header/SearchCommandCenter', 'components/DiscoveryFeed.jsx'],
      pages: ['pages/DiscoverPage', 'pages/FavoritesPage', 'pages/LiveMapPage'],
    },
    publicApi: {
      services: [
        { name: 'FeedService', methods: ['getFeed', 'refreshFeed'], visibility: 'public' },
        { name: 'SearchService', methods: ['searchUsers', 'searchWorks'], visibility: 'public' },
        { name: 'useFeedStream', module: 'feed/useFeedStream.js', visibility: 'public' },
        { name: 'feedRhythmEngine', visibility: 'internal' },
      ],
    },
    events: {
      publishes: ['feed.refreshed', 'discovery.search'],
      consumes: ['WORK_PUBLISHED', 'EXPERIENCE_CREATED', 'CONNECTION_OPENED', 'RESONANCE_CREATED'],
      forbidden: ['resonance.sent', 'engagement.maximized'],
    },
    realtime: { channels: ['works-feed'], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'CREATION', 'CONNECTION', 'WIRKUNG', 'IDENTITY'],
      mayBeDependedOnBy: ['INTELLIGENCE', 'WORLD'],
      forbiddenCycles: ['DISCOVERY → CREATION (Write) → DISCOVERY'],
    },
    constitution: {
      rules: ['Regel 6 — Feed dient Orientierung', 'Regel 2 — Wirkung wichtiger als Aufmerksamkeit', 'Kein Infinite Scroll ohne Pause'],
      invariants: ['Keine algorithmische Outrage-Verstärkung', 'Keine Rankings/Leaderboards'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'DB_DIRECT_READ: DiscoveryFeed local DB (akzeptiert — Ziel: Service)',
      'CROSS_DOMAIN_WRITE: Feed schreibt fremde Tabellen',
      'INFINITE_SCROLL: Constitution-Check (TODO: Scanner-Regel)',
    ],
    intelligence: {
      recommendations: ['discoveryService = FeedService + feedService + SearchService', 'DiscoveryFeed entmonolithisieren'],
      risks: ['DiscoveryFeed 2562 Zeilen', '5 multi-domain files'],
      allowedRefactors: ['Feed-Service-Konsolidierung', 'DiscoveryContext'],
      forbiddenRefactors: ['Engagement-optimierter Algorithmus', 'Ranking-UI'],
    },
    migration: {
      criteria: ['Ein Feed-Owner', 'discoveryService kanonisch', 'Kein Feed-Monolith'],
      metrics: { healthScore: '40% → 80%' },
    },
    healthScore: 40,
    fileCount: 21,
  },

  IMPACT: {
    label: 'Impact & Stewardship',
    pillar: '🌍 Impact',
    purpose: 'Gemeinwohl — Impact Pool, Abstimmungen, Projekte und Stewardship.',
    responsibilities: ['Impact-Voting', 'Impact-Projekte', 'Impact-Runden', 'Impact-Pool-Verteilung'],
    notResponsible: ['Commerce/Payments (→ COMMERCE)', 'Profil (→ IDENTITY)', 'Resonanz (→ WIRKUNG)', 'Gamification'],
    tables: {
      owned: ['impact_projects', 'impact_rounds', 'impact_votes'],
      readOnly: ['profiles', 'impact_pool'],
      neverWrite: ['profiles', 'works', 'bookings'],
    },
    ownership: {
      services: ['ImpactService (db.js)'],
      contexts: [],
      hooks: [],
      components: ['components/studio/ImpactStimmenModal', 'system/flows/impact/*'],
      pages: ['pages/ImpactPage'],
    },
    publicApi: {
      services: [
        { name: 'ImpactService', methods: ['getProjects', 'castVote', 'getRounds'], visibility: 'public' },
      ],
    },
    events: {
      publishes: ['IMPACT_SUPPORTED', 'IMPACT_CREATED', 'impact.vote.cast', 'impact.round.distributed'],
      consumes: ['BOOKING_COMPLETED', 'ORDER_COMPLETED'],
      forbidden: ['resonance.sent', 'gamification.*'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'WIRKUNG', 'IDENTITY'],
      mayBeDependedOnBy: ['STUDIO'],
      forbiddenCycles: ['IMPACT → COMMERCE (Pool-Manipulation)'],
    },
    constitution: {
      rules: ['Regel 4 — Wertschöpfung und Gemeinwohl', 'Impact Pool Prinzip', 'Regel 8 — Keine Gamification'],
      invariants: ['impact_votes via Core Engine', 'Kein Ranking der Voter'],
      adrs: [],
      rfcs: ['RFC-000 Rule 4 — impact_votes Core-Tabelle'],
    },
    scannerRules: [
      'CORE_BYPASS: impact_votes Write ohne Core Engine',
      'DB_DIRECT_WRITE: ImpactStimmenModal, MeinHUI_SubPages',
      'CROSS_DOMAIN_WRITE: impact_votes aus STUDIO',
    ],
    intelligence: {
      recommendations: ['ImpactStimmenModal → Core Engine', 'ImpactPage → ImpactService'],
      risks: ['Core-Tabelle impact_votes', 'Studio cross-writes'],
      allowedRefactors: ['Core Engine Gateway für Votes'],
      forbiddenRefactors: ['Vote-Leaderboards', 'XP für Impact'],
    },
    migration: {
      criteria: ['0 CRITICAL impact_votes bypasses', 'ImpactService alleiniger Writer'],
      metrics: { healthScore: '60% → 95%', criticalViolations: 0 },
    },
    healthScore: 60,
    fileCount: 9,
  },

  WIRKUNG: {
    label: 'Wirkung, Resonance & Orb',
    pillar: 'Alle fünf Grundpfeiler — Constitution-Kern',
    purpose: 'Gelebte Wirkung sichtbar machen — Orb, Resonanz, Grundpfeiler-Signale. Single Source of Truth für Wirkung.',
    responsibilities: ['Core Engine', 'Resonance Engine', 'Orb Engine', 'Pillar-Signale', 'Resonanz-Reactions'],
    notResponsible: ['UI-Darstellung ohne Engine (→ Components lesen nur)', 'Profil-Identität (→ IDENTITY)', 'Feed (→ DISCOVERY)', 'Commerce'],
    tables: {
      owned: ['resonance_signals', 'orb_states', 'core_metrics'],
      readOnly: ['profiles', 'impact_pool'],
      neverWrite: ['works', 'bookings', 'messages', 'follows'],
    },
    ownership: {
      services: ['coreEngine.js', 'resonanceEngine.js', 'orbEngine.js', 'resonanceService (content.js)'],
      contexts: [],
      hooks: ['useCoreEngine', 'useOrbParams', 'useCoreProfile'],
      components: ['components/orb/*', 'system/orb/*', 'components/OrbCompass', 'components/HuiPlusSheet', 'components/profile/OrbSignatur'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'coreEngine', methods: ['recordSignal', 'getCoreProfile', 'getPillarStrengths'], visibility: 'public' },
        { name: 'resonanceEngine', methods: ['recordReaction', 'getResonanceDepth'], visibility: 'internal' },
        { name: 'orbEngine', methods: ['computeOrbParams', 'getOrbTraits'], visibility: 'public' },
        { name: 'useCoreEngine', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['resonance.sent', 'orb.evolved', 'RESONANCE_CREATED', 'RESONANCE_REMOVED'],
      consumes: ['BOOKING_COMPLETED', 'CONNECTION_ACCEPTED', 'WORK_PUBLISHED', 'IMPACT_SUPPORTED'],
      forbidden: ['gamification.*', 'realtime.orb.levelup'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL'],
      mayBeDependedOnBy: ['IDENTITY', 'DISCOVERY', 'CREATION', 'IMPACT', 'CONNECTION', 'WORLD', 'INTELLIGENCE'],
      forbiddenCycles: ['WIRKUNG → UI → WIRKUNG (ohne Engine)'],
    },
    constitution: {
      rules: ['IV — Core Engine Single Source of Truth', 'VI — Orb-Philosophie', 'Regel 5 — Orb zeigt keine Leistung', 'Regel 8 — Keine Gamification'],
      invariants: ['Kein Orb-Update nach Einzelaktion', 'Core tables via Core Engine only', 'Datenfluss unidirektional'],
      adrs: ['ADR-0001 (Core Architecture — TODO: Branch-Merge)'],
      rfcs: ['RFC-000 Rule 4'],
    },
    scannerRules: [
      'CORE_BYPASS: Jeder Write auf Core-Tabellen außerhalb src/core/',
      'UI_IMPACT_LOGIC: Wirkungslogik in Components',
      'ORB_REALTIME: Orb darf nicht Echtzeit-Gamification triggern',
    ],
    intelligence: {
      recommendations: ['coreEngine als einziger Write-Gateway', 'resonanceService → wirkungService umbenennen', 'Alle 42 CRITICAL beheben'],
      risks: ['42 CRITICAL Core Bypasses gesamt', 'Orb-Gamification-Drift'],
      allowedRefactors: ['Core Engine Gateway', 'Engine-Konsolidierung'],
      forbiddenRefactors: ['Orb Level-Up Animationen', 'Score/XP System'],
    },
    migration: {
      criteria: ['Core Engine Adoption > 90%', '0 CRITICAL Core Bypass', 'Alle Wirkungs-Writes über Engine'],
      metrics: { coreEngineAdoption: '4% → 90%+', criticalViolations: 0 },
    },
    healthScore: 45,
    fileCount: 26,
  },

  TRUST: {
    label: 'Trust & Reputation',
    pillar: '💚 Unterstützen',
    purpose: 'Vertrauen aufbauen — Reputation, Zuverlässigkeit und Trust-Signale.',
    responsibilities: ['Trust-Signale', 'Reputation-Scores', 'Verifizierungs-Metadaten'],
    notResponsible: ['Profil-Daten (→ IDENTITY)', 'Commerce (→ COMMERCE)', 'Chat (→ COMMUNICATION)', 'Gamification/Badges'],
    tables: {
      owned: ['trust_scores', 'reputation_events'],
      readOnly: ['profiles', 'bookings'],
      neverWrite: ['profiles', 'works', 'messages'],
    },
    ownership: {
      services: ['lib/trust/index.js (Ziel: TrustService)'],
      contexts: ['lib/trustContext.js (Owner)'],
      hooks: ['useReputation'],
      components: [],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'recordTrustSignal', module: 'lib/trust/index.js', visibility: 'public' },
        { name: 'useReputation', module: 'trustContext.js', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['trust.updated'],
      consumes: ['BOOKING_COMPLETED', 'CONNECTION_DEEPENED', 'WORK_PUBLISHED'],
      forbidden: ['gamification.badge', 'leaderboard.update'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'COMMERCE', 'CONNECTION'],
      mayBeDependedOnBy: ['DISCOVERY', 'CONNECTION'],
      forbiddenCycles: ['TRUST → IDENTITY (Profile-Write)'],
    },
    constitution: {
      rules: ['Regel 1 — Menschen sind keine Produkte', 'Regel 8 — Keine Gamification'],
      invariants: ['Keine öffentlichen Scores/Rankings', 'Trust ≠ Belohnungssystem'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'GAMIFICATION: Keine Badge/Level-Logik in TRUST',
      'CROSS_DOMAIN_WRITE: trust_scores aus fremden Domains',
      'PUBLIC_SCORE: Kein Score im UI (Constitution VIII)',
    ],
    intelligence: {
      recommendations: ['TrustService extrahieren', 'Trust-Signale über Events statt Direct-Write'],
      risks: ['Kleine Domain — geringe Violation-Dichte', 'TODO: trust_scores Tabellen-Existenz verifizieren'],
      allowedRefactors: ['TrustService', 'Event-basierte Trust-Signale'],
      forbiddenRefactors: ['Reputation-Leaderboards', 'Public Trust Scores'],
    },
    migration: {
      criteria: ['trustContext alleiniger Owner', 'TrustService dokumentiert'],
      metrics: { healthScore: '75% → 95%' },
    },
    healthScore: 75,
    fileCount: 2,
  },

  PRESENCE: {
    label: 'Presence & Session',
    pillar: '🤝 Verbinden',
    purpose: 'Menschliche Präsenz — wer ist da, Session-State, Creator-Presence.',
    responsibilities: ['Online-Status', 'Session-Hooks', 'Creator-Presence', 'storyRefreshKey'],
    notResponsible: ['Profil-Daten (→ IDENTITY)', 'Chat (→ COMMUNICATION)', 'Performance-Identity/Gamification'],
    tables: {
      owned: ['presence'],
      readOnly: ['profiles'],
      neverWrite: ['profiles', 'works', 'messages'],
    },
    ownership: {
      services: ['lib/presence/index.js'],
      contexts: ['lib/sessionHooks.js (Owner)'],
      hooks: ['usePresence', 'useSession'],
      components: ['components/CreatorPresence.jsx'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'presence/index', methods: ['updatePresence', 'getPresence'], visibility: 'public' },
        { name: 'usePresence', module: 'sessionHooks.js', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['presence.updated', 'session.started'],
      consumes: ['PROFILE_COMPLETED'],
      forbidden: ['gamification.streak', 'online.leaderboard'],
    },
    realtime: {
      channels: ['TODO: Presence-Channels zentral registrieren (REALTIME_REGISTRY Erweiterung)'],
      presenceAllowed: ['online/offline (ephemeral)', 'last_seen (optional, privacy-safe)'],
    },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY'],
      mayBeDependedOnBy: ['COMMUNICATION', 'DISCOVERY', 'STUDIO'],
      forbiddenCycles: ['PRESENCE → IDENTITY (Profile-Write)'],
    },
    constitution: {
      rules: ['Presence Philosophy — keine Performance Identity', 'Design: Ruhig, nicht aktivierend'],
      invariants: ['Presence ≠ Gamification', 'Kein Online-Status als Ranking'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'REALTIME: Presence-Channel Single-Owner',
      'PRESENCE_GAMIFICATION: Kein Streak/Online-Bonus',
      'CROSS_DOMAIN: Presence-State nicht in AppState duplizieren',
    ],
    intelligence: {
      recommendations: ['Presence-Channels in REALTIME_REGISTRY ergänzen', 'sessionHooks als alleiniger Owner'],
      risks: ['Presence-Channels verteilt (TODO)', 'Tabellen-Existenz presence TODO'],
      allowedRefactors: ['Presence-Registry', 'Channel-Konsolidierung'],
      forbiddenRefactors: ['Online-Streak-Boni', 'Last-Seen-Shaming'],
    },
    migration: {
      criteria: ['Presence-Registry vollständig', 'sessionHooks alleiniger Owner'],
      metrics: { healthScore: '65% → 90%' },
    },
    healthScore: 65,
    fileCount: 5,
  },

  INTELLIGENCE: {
    label: 'Assistive Intelligence',
    pillar: 'Querschnitt — KI-Prinzipien (Constitution VII)',
    purpose: 'Menschen ergänzen, nicht ersetzen — kontextuelle Assistenz, Relationship Memory, Guidance.',
    responsibilities: ['Relationship Memory', 'Resonance Spaces', 'Guidance', 'Living Memory', 'Emotional Identity (privat)'],
    notResponsible: ['Wirkungsberechnung (→ WIRKUNG)', 'Feed-Ranking (→ DISCOVERY)', 'Profil-Writes (→ IDENTITY)', 'Aufmerksamkeitsmaximierung'],
    tables: {
      owned: [],
      readOnly: ['profiles', 'works', 'resonance_signals', 'connections'],
      neverWrite: ['profiles', 'works', 'bookings', 'messages', 'impact_votes', 'resonance_signals'],
    },
    ownership: {
      services: ['lib/intelligence/index.js', 'lib/intelligence/*', 'lib/guidance/*'],
      contexts: [],
      hooks: ['useLivingMemory'],
      components: ['components/guidance/*'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'relationshipMemory', visibility: 'internal' },
        { name: 'resonanceSpaces', visibility: 'internal' },
        { name: 'sharedAtmosphere', visibility: 'internal' },
        { name: 'emotionalIdentity', visibility: 'internal' },
      ],
    },
    events: {
      publishes: ['memory.updated', 'guidance.shown'],
      consumes: ['CONNECTION_OPENED', 'WORK_PUBLISHED', 'BOOKING_COMPLETED'],
      forbidden: ['engagement.maximized', 'filterbubble.amplify', 'profit.recommendation'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'DISCOVERY', 'WIRKUNG', 'CONNECTION', 'IDENTITY'],
      mayBeDependedOnBy: ['WORLD'],
      forbiddenCycles: ['INTELLIGENCE → fachliche Domain (Write)'],
    },
    constitution: {
      rules: ['VII — KI-Prinzipien', 'Regel 7 — KI ersetzt Menschen nicht', 'Zentrale Frage: sinnvolle Begegnung'],
      invariants: ['Read-only auf fremde Domains', 'Niemals User-Flow blockieren', 'Emotional Identity nie UI-sichtbar'],
      adrs: ['ADR-002 (Intelligence via Scanner)'],
      rfcs: ['RFC-000A'],
    },
    scannerRules: [
      'CROSS_DOMAIN_WRITE: Intelligence schreibt fremde Tabellen',
      'ATTENTION_MAX: Keine Verweildauer-Optimierung',
      'UI_EXPOSURE: emotionalIdentity darf nicht in UI importiert werden',
    ],
    intelligence: {
      recommendations: ['Klare Read-only Grenze dokumentieren', 'Multi-Domain-Files (discoverWorld, relationshipMemory) trennen'],
      risks: ['Cross-Domain-Reads ohne Contract', '3 multi-domain intelligence files'],
      allowedRefactors: ['Read-only Adapter pro Domain', 'Guidance-Isolation'],
      forbiddenRefactors: ['Engagement-KI', 'Manipulative Empfehlungen'],
    },
    migration: {
      criteria: ['0 Cross-Domain-Writes', 'Read-only Adapter dokumentiert', 'Guidance isoliert'],
      metrics: { healthScore: '55% → 85%', crossDomainWrites: 0 },
    },
    healthScore: 55,
    fileCount: 20,
  },

  WORLD: {
    label: 'World & Atmosphere',
    pillar: 'Darstellung — kein Wirkungsmodell',
    purpose: 'Atmosphärische Hülle — Stimmung, Oberfläche, Orb-Layer, Tab-Transitions.',
    responsibilities: ['World Surface', 'Mood', 'Ambient UI', 'Tab Visibility', 'Orb-Atmosphäre (Darstellung)'],
    notResponsible: ['Wirkungsberechnung (→ WIRKUNG)', 'Feed-Inhalte (→ DISCOVERY)', 'Profil (→ IDENTITY)', 'Eigene DB-Persistenz'],
    tables: {
      owned: [],
      readOnly: [],
      neverWrite: ['*'],
    },
    ownership: {
      services: ['lib/world/worldSurfaceController.js', 'lib/world/orbLayer.js', 'lib/world/safariPaintRecovery.js'],
      contexts: ['context/WorldSurfaceContext', 'context/OrbWorldContext'],
      hooks: [],
      components: ['components/home/AmbientWorldBar', 'components/home/mood/*', 'components/home/header/MoodOrbButton'],
      pages: [],
    },
    publicApi: {
      services: [
        { name: 'worldSurfaceController', methods: ['setSurface', 'getSurface'], visibility: 'public' },
        { name: 'orbLayer', methods: ['orbAtmosphereFromWorld'], visibility: 'public' },
        { name: 'WORLD_CSS', visibility: 'public' },
      ],
    },
    events: {
      publishes: ['mood.changed', 'surface.transitioned'],
      consumes: ['orb.evolved (read-only visual)'],
      forbidden: ['resonance.sent', 'profile.updated'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'WIRKUNG'],
      mayBeDependedOnBy: ['DISCOVERY', 'STUDIO'],
      forbiddenCycles: ['WORLD → WIRKUNG (Write)'],
    },
    constitution: {
      rules: ['V — Designprinzipien (Ruhig, Warm, Organisch)', 'VI — Orb Darstellung only'],
      invariants: ['Kein eigenes Wirkungsmodell', 'World liest WIRKUNG, schreibt nicht'],
      adrs: [],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'DB_WRITE: WORLD darf niemals DB schreiben',
      'WIRKUNG_BYPASS: Keine Orb-Berechnung in WORLD',
      'LAYER: Presentation only — kein Domain-Layer',
    ],
    intelligence: {
      recommendations: ['orbLayer vs orbEngine Grenze schärfen', '6 multi-domain world files dokumentieren'],
      risks: ['WIRKUNG/WORLD Grenzverwischung', 'Mood-State in HomeShell'],
      allowedRefactors: ['Atmosphere-Adapter', 'World/WIRKUNG Trennung'],
      forbiddenRefactors: ['Wirkungslogik in World Layer'],
    },
    migration: {
      criteria: ['0 DB-Writes', 'WIRKUNG-Read-only', 'WorldSurfaceContext isoliert'],
      metrics: { healthScore: '60% → 90%', dbWrites: 0 },
    },
    healthScore: 60,
    fileCount: 13,
  },

  STUDIO: {
    label: 'Creator Studio & Operations',
    pillar: '🎨 Erschaffen · Operations',
    purpose: 'Creator-Betrieb — Dashboard, Analytics, Tickets, Admin, Diagnose.',
    responsibilities: ['Studio-UI', 'Creator-Dashboard', 'Statistiken', 'Support-Tickets', 'Admin/Diagnose'],
    notResponsible: ['Eigene fachliche Daten (aggregiert nur)', 'Profil-Writes (→ IDENTITY)', 'Commerce-Transaktionen (→ COMMERCE)', 'Wirkungslogik (→ WIRKUNG)'],
    tables: {
      owned: [],
      readOnly: ['profiles', 'works', 'bookings', 'orders', 'impact_projects', 'messages'],
      neverWrite: ['profiles', 'wirker_profiles', 'impact_votes', 'works', 'bookings', 'messages', 'availability_slots'],
    },
    ownership: {
      services: ['analyticsService (creatorEconomy.js — Ziel: STUDIO only)'],
      contexts: [],
      hooks: [],
      components: ['components/studio/*', 'components/SupportSheet'],
      pages: ['pages/CreatorStudio', 'pages/MeinHUI', 'pages/MyCreatorDashboard', 'pages/PlatformDashboard', 'pages/Admin', 'pages/DiagnosePage', 'pages/studio/*'],
    },
    publicApi: {
      services: [
        { name: 'analyticsService', methods: ['getCreatorStats', 'getSalesMetrics'], visibility: 'public' },
      ],
    },
    events: {
      publishes: [],
      consumes: ['* (read-only Dashboard)'],
      forbidden: ['resonance.sent', 'profile.updated', 'booking.created', 'impact.vote.cast'],
    },
    realtime: { channels: [], presenceAllowed: [] },
    dependencies: {
      mayDependOn: ['KERNEL', 'IDENTITY', 'CREATION', 'COMMERCE', 'COMMUNICATION', 'IMPACT', 'WIRKUNG', 'DISCOVERY'],
      mayBeDependedOnBy: [],
      forbiddenCycles: ['STUDIO → fachliche Domain (Write) — Aggregator only'],
    },
    constitution: {
      rules: ['Regel 9 — Funktion muss Grundpfeiler stärken', 'DiagnosePage: Admin by design'],
      invariants: ['Studio schreibt nicht in fremde Tabellen', 'Diagnose: direkter Supabase ok (Admin)'],
      adrs: ['ADR-001 (Studio Routes)'],
      rfcs: ['RFC-000'],
    },
    scannerRules: [
      'CROSS_DOMAIN_WRITE: Studio-Modals schreiben profiles/bookings/impact_votes',
      'DB_DIRECT_WRITE: StudioSubPages 2047 Zeilen',
      'AGGREGATOR: Keine eigenen Tabellen',
    ],
    intelligence: {
      recommendations: ['Studio → Domain-Services delegieren', 'ProfilBearbeitenModal → IDENTITY', '25 HIGH violations beheben'],
      risks: ['StudioSubPages cross-writes', '5 multi-domain studio files', 'ProfilBearbeitenModal Core Bypass'],
      allowedRefactors: ['Service-Delegation', 'Modal → Domain-Service'],
      forbiddenRefactors: ['Studio-eigene DB-Tabellen', 'Studio-Wirkungslogik'],
    },
    migration: {
      criteria: ['0 Direct-Writes (außer DiagnosePage)', 'Alle Modals delegieren an Domains', 'analyticsService isoliert'],
      metrics: { healthScore: '30% → 70%', directWrites: '< 5 (Diagnose only)' },
    },
    healthScore: 30,
    fileCount: 14,
  },
};

// Dependency matrix from Blueprint V
const IMPORT_MATRIX = {
  KERNEL: { allowed: [], forbidden: [] },
  WIRKUNG: { allowed: ['KERNEL'], forbidden: ['IDENTITY', 'CREATION'] },
  IDENTITY: { allowed: ['KERNEL', 'WIRKUNG'], forbidden: [] },
  CONNECTION: { allowed: ['KERNEL', 'IDENTITY', 'WIRKUNG', 'TRUST'], forbidden: [] },
  CREATION: { allowed: ['KERNEL', 'IDENTITY', 'WIRKUNG'], forbidden: [] },
  COMMERCE: { allowed: ['KERNEL', 'IDENTITY', 'CREATION'], forbidden: [] },
  COMMUNICATION: { allowed: ['KERNEL', 'IDENTITY', 'CONNECTION'], forbidden: [] },
  DISCOVERY: { allowed: ['KERNEL', 'CREATION', 'CONNECTION', 'WIRKUNG', 'IDENTITY'], forbidden: [] },
  IMPACT: { allowed: ['KERNEL', 'WIRKUNG', 'IDENTITY'], forbidden: [] },
  TRUST: { allowed: ['KERNEL', 'IDENTITY', 'COMMERCE', 'CONNECTION'], forbidden: [] },
  PRESENCE: { allowed: ['KERNEL', 'IDENTITY'], forbidden: [] },
  INTELLIGENCE: { allowed: ['KERNEL', 'DISCOVERY', 'WIRKUNG', 'CONNECTION', 'IDENTITY'], forbidden: [] },
  WORLD: { allowed: ['KERNEL', 'WIRKUNG'], forbidden: ['CREATION', 'COMMERCE'] },
  STUDIO: { allowed: ['KERNEL', 'IDENTITY', 'CREATION', 'COMMERCE', 'COMMUNICATION', 'IMPACT', 'WIRKUNG', 'DISCOVERY'], forbidden: [] },
};

const EVENT_MATRIX = {
  publishes: {
    KERNEL: ['HUI_ACTIONS.*'],
    IDENTITY: ['PROFILE_COMPLETED', 'TALENT_ACTIVATED', 'MEMBER_JOINED'],
    CONNECTION: ['CONNECTION_OPENED', 'CONNECTION_ACCEPTED', 'CONNECTION_DEEPENED', 'RECOMMENDATION_GIVEN'],
    CREATION: ['WORK_PUBLISHED', 'EXPERIENCE_CREATED', 'WORK_RESONATED'],
    COMMERCE: ['BOOKING_REQUESTED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED'],
    COMMUNICATION: ['message.sent', 'notification.received'],
    DISCOVERY: ['feed.refreshed', 'discovery.search'],
    IMPACT: ['IMPACT_SUPPORTED', 'IMPACT_CREATED'],
    WIRKUNG: ['RESONANCE_CREATED', 'RESONANCE_REMOVED', 'resonance.sent', 'orb.evolved'],
    TRUST: ['trust.updated'],
    PRESENCE: ['presence.updated', 'session.started'],
    INTELLIGENCE: ['memory.updated', 'guidance.shown'],
    WORLD: ['mood.changed', 'surface.transitioned'],
    STUDIO: [],
  },
  consumes: {
    KERNEL: [],
    IDENTITY: ['BOOKING_COMPLETED'],
    CONNECTION: ['BOOKING_COMPLETED', 'WORK_PUBLISHED'],
    CREATION: ['PROFILE_COMPLETED'],
    COMMERCE: ['WORK_PUBLISHED', 'EXPERIENCE_CREATED'],
    COMMUNICATION: ['CONNECTION_OPENED', 'BOOKING_REQUESTED'],
    DISCOVERY: ['WORK_PUBLISHED', 'RESONANCE_CREATED', 'CONNECTION_OPENED'],
    IMPACT: ['BOOKING_COMPLETED'],
    WIRKUNG: ['BOOKING_COMPLETED', 'CONNECTION_ACCEPTED', 'WORK_PUBLISHED', 'IMPACT_SUPPORTED'],
    TRUST: ['BOOKING_COMPLETED', 'CONNECTION_DEEPENED'],
    PRESENCE: ['PROFILE_COMPLETED'],
    INTELLIGENCE: ['CONNECTION_OPENED', 'WORK_PUBLISHED', 'BOOKING_COMPLETED'],
    WORLD: ['orb.evolved'],
    STUDIO: ['* (read-only)'],
  },
};

function mdList(items) {
  return items.map(i => `- ${i}`).join('\n');
}

function mdTable(headers, rows) {
  const sep = headers.map(() => '---');
  return `| ${headers.join(' | ')} |\n| ${sep.join(' | ')} |\n${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}`;
}

function generateContractMarkdown(id, contract, fileMap) {
  const domainFiles = Object.entries(fileMap.files || {})
    .filter(([, v]) => v.primaryDomain === id)
    .map(([path]) => path);

  const layer = LAYERS.mapping[id];

  return `# Domain Contract — ${id}

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** ${contract.label}  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

${contract.purpose}

**Grundpfeiler-Bezug:** ${contract.pillar}

---

## Verantwortung

### Besitzt (fachlich)

${mdList(contract.responsibilities)}

### Besitzt ausdrücklich NICHT

${mdList(contract.notResponsible)}

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

${contract.tables.owned.length ? mdList(contract.tables.owned.map(t => `\`${t}\``)) : '_Keine fachlichen Tabellen (Meta/Infrastructure-Domain)_'}

### Tabellen — nur lesen

${mdList(contract.tables.readOnly.map(t => `\`${t}\``))}

### Tabellen — niemals schreiben

${mdList(contract.tables.neverWrite.map(t => `\`${t}\``))}

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | ${contract.ownership.services.join(', ')} |
| **Contexts** | ${contract.ownership.contexts.length ? contract.ownership.contexts.join(', ') : '—'} |
| **Hooks** | ${contract.ownership.hooks.length ? contract.ownership.hooks.join(', ') : '—'} |
| **Komponenten** | ${contract.ownership.components.slice(0, 5).join(', ')}${contract.ownership.components.length > 5 ? ', …' : ''} |
| **Pages** | ${contract.ownership.pages.length ? contract.ownership.pages.join(', ') : '— (embedded / Overlays)'} |

**Dateien in Domain:** ${contract.fileCount} (siehe \`docs/generated/domain-file-map.json\`)

---

## Public API

${mdTable(
  ['Service / Modul', 'Sichtbarkeit', 'Methoden / Export'],
  (contract.publicApi.services || []).map(s => [
    s.name + (s.module ? ` (\`${s.module}\`)` : ''),
    s.visibility,
    s.methods ? s.methods.join(', ') : '—',
  ])
)}

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in \`services/db.js\` (Ziel: split)

---

## Events

### Veröffentlicht

${mdList(contract.events.publishes.map(e => `\`${e}\``))}

### Konsumiert

${contract.events.consumes.length ? mdList(contract.events.consumes.map(e => `\`${e}\``)) : '_Keine_'}

### Darf niemals erzeugen

${mdList(contract.events.forbidden.map(e => `\`${e}\``))}

---

## Realtime

### Kanäle

${contract.realtime.channels.length ? mdList(contract.realtime.channels.map(c => `\`${c}\``)) : '_Keine dedizierten Kanäle_'}

### Erlaubte Presence-Informationen

${contract.realtime.presenceAllowed.length ? mdList(contract.realtime.presenceAllowed) : '_Keine_'}

---

## Layer

### Erlaubte Layer

${mdList(layer.allowed)}

### Verbotene Layer

${layer.forbidden.length ? mdList(layer.forbidden) : '_Keine zusätzlichen Verbote_'}

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

${mdList(contract.dependencies.mayDependOn.map(d => `\`${d}\``))}

### Darf abhängig sein von

${mdList(contract.dependencies.mayBeDependedOnBy.map(d => `\`${d}\``))}

### Verbotene zyklische Abhängigkeiten

${mdList(contract.dependencies.forbiddenCycles)}

---

## Constitution

### Besonders geltende Regeln

${mdList(contract.constitution.rules)}

### Invarianten

${mdList(contract.constitution.invariants)}

### ADRs

${contract.constitution.adrs.length ? mdList(contract.constitution.adrs) : '_Keine domain-spezifischen ADRs_'}

### RFCs

${mdList(contract.constitution.rfcs)}

---

## Scanner Rules

${mdList(contract.scannerRules)}

---

## Intelligence

### Empfehlungen

${mdList(contract.intelligence.recommendations)}

### Typische Risiken

${mdList(contract.intelligence.risks)}

### Erlaubte Refactorings

${mdList(contract.intelligence.allowedRefactors)}

### Niemals

${mdList(contract.intelligence.forbiddenRefactors)}

---

## Migration

### Vollständig migriert wenn

${mdList(contract.migration.criteria)}

### Metriken „fertig"

${Object.entries(contract.migration.metrics).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

**Aktueller Health Score (Baseline):** ${contract.healthScore}%

---

## Referenzen

- [\`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md\`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [\`SYSTEM_OWNERSHIP.md\`](../SYSTEM_OWNERSHIP.md)
- [\`HUI_CONSTITUTION.md\`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: ${domainFiles.slice(0, 8).join(', ')}${domainFiles.length > 8 ? ` (+${domainFiles.length - 8})` : ''}

---

*Domain Contract ${id} — ARCH-005.1. Keine Runtime-Änderung.*
`;
}

function generateIndex() {
  const domainList = Object.keys(CONTRACTS);
  return `# DOMAIN CONTRACT INDEX

> **ARCH-005.1 — Zentraler Index aller Domain Contracts**  
> **Status:** Ratifiziert  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP · Architecture Authority · Knowledge Graph · Scanner · Intelligence

---

## Domains

| ID | Label | Contract | Dateien | Health (Baseline) |
|---|---|---|---|---|
${domainList.map(id => {
  const c = CONTRACTS[id];
  return `| **${id}** | ${c.label} | [${id}.md](domain-contracts/${id}.md) | ${c.fileCount} | ${c.healthScore}% |`;
}).join('\n')}

**Gesamt:** 14 Domains · 298 Dateien · 34 Multi-Domain-Dateien

---

## Beziehungen (Abhängigkeitsgraph)

\`\`\`
                    ┌─────────────────────────────────┐
                    │           KERNEL                │
                    │  Constitution · Registry · Core │
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
\`\`\`

---

## Erlaubte Kommunikationswege

| Von | Nach | Mechanismus | Richtung |
|---|---|---|---|
| Alle | KERNEL | Import (Registry, Actions, Infra) | Read/Use |
| IDENTITY | WIRKUNG | Core Engine (profiles-Wirkung) | Write via Engine |
| CREATION | DISCOVERY | Events (\`WORK_PUBLISHED\`) | Async |
| CONNECTION | DISCOVERY | Events (\`CONNECTION_OPENED\`) | Async |
| COMMERCE | IMPACT | Impact Pool Rate (7%) | Config |
| WIRKUNG | DISCOVERY | Read (Resonanz-Signale) | Read-only |
| INTELLIGENCE | * | Read-only Context | Read-only |
| WORLD | WIRKUNG | Read (Orb-Atmosphäre) | Read-only |
| STUDIO | * | Domain-Services | Read + Delegate Write |
| * | * | Cross-Domain Write | **Verboten** (nur via Owner-Service) |

---

## Import-Matrix

Zeile = Quell-Domain, Spalte = Ziel-Domain darf importiert werden.

|  | KERNEL | WIRKUNG | IDENTITY | CONNECTION | CREATION | COMMERCE | COMMUNICATION | DISCOVERY | IMPACT | TRUST | PRESENCE | INTELLIGENCE | WORLD | STUDIO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${Object.keys(IMPORT_MATRIX).map(from => {
  const row = Object.keys(IMPORT_MATRIX).map(to => {
    if (from === to) return '—';
    if (to === 'KERNEL') return from === 'KERNEL' ? '—' : '✅';
    const allowed = IMPORT_MATRIX[from].allowed.includes(to);
    return allowed ? '✅' : '❌';
  });
  return `| **${from}** | ${row.join(' | ')} |`;
}).join('\n')}

**Legende:** ✅ erlaubt · ❌ verboten · — selbst

---

## Event-Matrix

### Publisher → Subscriber

| Event | Publisher | Subscriber (Konsumenten) |
|---|---|---|
| \`WORK_PUBLISHED\` | CREATION | DISCOVERY, CONNECTION, TRUST, INTELLIGENCE |
| \`CONNECTION_OPENED\` | CONNECTION | COMMUNICATION, INTELLIGENCE, DISCOVERY |
| \`BOOKING_COMPLETED\` | COMMERCE | WIRKUNG, TRUST, IMPACT, IDENTITY |
| \`RESONANCE_CREATED\` | WIRKUNG | DISCOVERY |
| \`IMPACT_SUPPORTED\` | IMPACT | WIRKUNG |
| \`PROFILE_COMPLETED\` | IDENTITY | CREATION, PRESENCE |
| \`trust.updated\` | TRUST | DISCOVERY, CONNECTION |

Vollständige Event-Definitionen: [\`src/lib/events/index.js\`](../../src/lib/events/index.js)

---

## Maschinenlesbare Artefakte

| Datei | Zweck |
|---|---|
| [\`domain-contracts.json\`](domain-contracts.json) | Scanner, Authority, Intelligence |
| [\`docs/generated/domain-file-map.json\`](../generated/domain-file-map.json) | Knowledge Graph Datei→Domain |
| [\`docs/DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md\`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md) | ARCH-005 Zielarchitektur |

---

## Governance-Regeln (ab ARCH-005.1)

1. Jede Domain hat genau einen Contract (dieses Index)
2. Cross-Domain-Writes nur über Public API des Owners
3. Multi-Domain-Dateien sind in \`domain-file-map.json\` dokumentiert
4. Scanner (ARCH-006) validiert gegen Contracts, nicht nur Pfad-Convention
5. Intelligence priorisiert Migration nach Health Score und CRITICAL Count

---

*DOMAIN CONTRACT INDEX — ARCH-005.1 abgeschlossen.*
`;
}

function generateJson(fileMap) {
  const domains = Object.entries(CONTRACTS).map(([id, c]) => ({
    id,
    label: c.label,
    version: 'ARCH-005.1-v1',
    status: 'ratified',
    purpose: c.purpose,
    pillar: c.pillar,
    responsibilities: c.responsibilities,
    notResponsible: c.notResponsible,
    data: c.tables,
    ownership: c.ownership,
    publicApi: c.publicApi,
    events: c.events,
    realtime: c.realtime,
    layers: LAYERS.mapping[id],
    dependencies: {
      ...c.dependencies,
      importMatrix: IMPORT_MATRIX[id],
    },
    constitution: c.constitution,
    scannerRules: c.scannerRules.map((rule, i) => ({
      id: `${id}-SCAN-${String(i + 1).padStart(2, '0')}`,
      rule,
      enforceable: !rule.includes('TODO'),
    })),
    intelligence: c.intelligence,
    migration: { ...c.migration, healthScoreBaseline: c.healthScore },
    fileCount: c.fileCount,
    files: Object.entries(fileMap.files || {})
      .filter(([, v]) => v.primaryDomain === id)
      .map(([path, v]) => ({ path, multiDomain: v.multiDomain, alsoDomains: v.alsoDomains || [] })),
  }));

  return {
    meta: {
      artifact: 'ARCH-005.1',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      source: [
        'docs/DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md',
        'HUI_CONSTITUTION.md',
        'docs/SYSTEM_OWNERSHIP.md',
        'docs/governance/ADR-001-route-authority.md',
        'docs/governance/ADR-002-architecture-scanner.md',
        'docs/governance/RFC-000-layering.md',
        'docs/generated/domain-file-map.json',
      ],
      domainCount: 14,
    },
    domains,
    relationships: {
      importMatrix: IMPORT_MATRIX,
      eventMatrix: EVENT_MATRIX,
      communicationRules: [
        { from: '*', to: 'KERNEL', mechanism: 'import', write: false },
        { from: '*', to: '*', mechanism: 'cross-domain-write', write: true, allowed: false, exception: 'owner-service-only' },
        { from: 'INTELLIGENCE', to: '*', mechanism: 'read', write: false },
        { from: 'WORLD', to: 'WIRKUNG', mechanism: 'read', write: false },
        { from: 'STUDIO', to: '*', mechanism: 'service-delegation', write: true, allowed: true },
      ],
    },
    baseline: {
      totalFiles: 298,
      totalViolations: 629,
      criticalViolations: 42,
      ownershipCoverage: 0,
      highestDebtDomain: 'IDENTITY',
      cleanestDomain: 'COMMUNICATION',
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (!existsSync(MAP_PATH)) {
  console.error('Missing domain-file-map.json — run ARCH-005 first or copy from branch');
  process.exit(1);
}

const fileMap = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
mkdirSync(OUT_DIR, { recursive: true });

for (const [id, contract] of Object.entries(CONTRACTS)) {
  const md = generateContractMarkdown(id, contract, fileMap);
  writeFileSync(join(OUT_DIR, `${id}.md`), md);
  console.log(`✓ ${id}.md`);
}

writeFileSync(join(ROOT, 'docs/governance/DOMAIN_CONTRACT_INDEX.md'), generateIndex());
console.log('✓ DOMAIN_CONTRACT_INDEX.md');

writeFileSync(
  join(ROOT, 'docs/governance/domain-contracts.json'),
  JSON.stringify(generateJson(fileMap), null, 2)
);
console.log('✓ domain-contracts.json');

console.log('\nARCH-005.1: 14 Domain Contracts generated.');
