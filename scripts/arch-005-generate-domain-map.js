#!/usr/bin/env node
/**
 * ARCH-005 — Domain File Map Generator
 * Assigns every src/ file to exactly one primary business domain.
 * Multi-domain files are flagged, not split.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(process.cwd(), 'src');

const DOMAINS = {
  KERNEL: 'Platform Kernel & Governance',
  IDENTITY: 'Identity & Membership',
  CONNECTION: 'Connection & Community',
  CREATION: 'Creation & Publishing',
  COMMERCE: 'Commerce & Transactions',
  COMMUNICATION: 'Communication & Notifications',
  DISCOVERY: 'Discovery & Feed',
  IMPACT: 'Impact & Stewardship',
  WIRKUNG: 'Wirkung, Resonance & Orb',
  TRUST: 'Trust & Reputation',
  PRESENCE: 'Presence & Session',
  INTELLIGENCE: 'Assistive Intelligence',
  WORLD: 'World & Atmosphere',
  STUDIO: 'Creator Studio & Operations',
};

/** @type {{ pattern: RegExp, domain: string, also?: string[] }[]} */
const RULES = [
  // KERNEL — governance foundation
  { pattern: /^architecture\//, domain: 'KERNEL' },
  { pattern: /^registry\//, domain: 'KERNEL' },
  { pattern: /^routes\//, domain: 'KERNEL' },
  { pattern: /^design\//, domain: 'KERNEL' },
  { pattern: /^config\//, domain: 'KERNEL' },
  { pattern: /^core\/hui\.(actions|contracts|flow|navigator|safePayload|semantics|sources)/, domain: 'KERNEL' },
  { pattern: /^core\/Hui(ActionProvider|ContextBridge|ConnectionEngine)/, domain: 'KERNEL' },
  { pattern: /^lib\/(supabaseClient|safeQuery|perfUtils|sentry|observability|validation|errors|events|ds|debugCollector|BUILD_VERSION|ErrorBoundaries|factories\/(createNavItem|createTabPage))/, domain: 'KERNEL' },
  { pattern: /^(App|main)\.jsx$/, domain: 'KERNEL' },
  { pattern: /^components\/(ErrorBoundary|ProtectedRoute|UserNotRegisteredError|LazyImage|entry\/)/, domain: 'KERNEL' },
  { pattern: /^utils\//, domain: 'KERNEL' },

  // WIRKUNG — constitution core engines
  { pattern: /^core\/(coreEngine|resonanceEngine|orbEngine|hui\.pillars)/, domain: 'WIRKUNG' },
  { pattern: /^hooks\/useCoreEngine/, domain: 'WIRKUNG' },
  { pattern: /^lib\/resonance\//, domain: 'WIRKUNG' },
  { pattern: /^lib\/points\//, domain: 'WIRKUNG' },
  { pattern: /^lib\/creativeJourney\//, domain: 'WIRKUNG' },
  { pattern: /^lib\/journeyContext/, domain: 'WIRKUNG' },
  { pattern: /^(orb|system\/orb)\//, domain: 'WIRKUNG' },
  { pattern: /^components\/(orb\/|OrbCompass|HuiPlusSheet)/, domain: 'WIRKUNG' },
  { pattern: /^components\/profile\/OrbSignatur/, domain: 'WIRKUNG' },

  // IDENTITY
  { pattern: /^lib\/AuthContext/, domain: 'IDENTITY' },
  { pattern: /^lib\/(profileUtils|profileMedia|useUsernameCheck|roles|ambassadorUtils|welcomePersistence)/, domain: 'IDENTITY' },
  { pattern: /^lib\/factories\/(createProfileItem|experienceContract)/, domain: 'IDENTITY' },
  { pattern: /^hooks\/(useProfileData|useProfileId|useTalentActivation|useAmbassador)/, domain: 'IDENTITY' },
  { pattern: /^components\/(auth\/|ambassador\/|TalentOnboarding|settings\/|profile\/|HuiMembershipFlow|welcome\/)/, domain: 'IDENTITY' },
  { pattern: /^pages\/(LoginPage|AuthCallback|TalentProfilePage|BasisProfilePage|MyBasisProfile|wirker-profile|ProfileDebugPage|RefRedirect)/, domain: 'IDENTITY' },
  { pattern: /^components\/home\/profile\//, domain: 'IDENTITY' },

  // CONNECTION
  { pattern: /^components\/connection-create\//, domain: 'CONNECTION' },
  { pattern: /^components\/(GemeinschaftsFlow|HuiMatchOverlay|shared\/ConnectionFlowCard)/, domain: 'CONNECTION' },
  { pattern: /^lib\/referralTracking/, domain: 'CONNECTION' },
  { pattern: /^lib\/community\//, domain: 'CONNECTION' },
  { pattern: /^content\/invitation\//, domain: 'CONNECTION' },
  { pattern: /^components\/home\/header\/MatchBar/, domain: 'CONNECTION' },

  // CREATION
  { pattern: /^components\/(works\/|experiences\/|publishing\/|WerkPublisher|ExperienceCreator|HuiCreateFlow|StoryComposer|StoryBar|teilen\/|WorkDetailPage|HuiMomentSheet)/, domain: 'CREATION' },
  { pattern: /^system\/flows\/(work|experience)\//, domain: 'CREATION' },
  { pattern: /^feed\/(StoryCreator|StoryViewer|StoryReactionTray|FeedStoriesBar)/, domain: 'CREATION' },
  { pattern: /^content\/ContentTypeSelector/, domain: 'CREATION' },
  { pattern: /^lib\/factories\/createFeedItem/, domain: 'CREATION' },

  // COMMERCE
  { pattern: /^services\/(commerceEngine|creatorEconomy)/, domain: 'COMMERCE' },
  { pattern: /^lib\/bookingContext/, domain: 'COMMERCE' },
  { pattern: /^hooks\/useCartPersistence/, domain: 'COMMERCE' },
  { pattern: /^components\/commerce\//, domain: 'COMMERCE' },
  { pattern: /^components\/economy\//, domain: 'COMMERCE' },

  // COMMUNICATION
  { pattern: /^lib\/(chatContext|notificationService|useNotifications|useReactions)/, domain: 'COMMUNICATION' },
  { pattern: /^components\/chat-center\//, domain: 'COMMUNICATION' },
  { pattern: /^components\/(NotificationCenter|notifications\/)/, domain: 'COMMUNICATION' },
  { pattern: /^components\/home\/header\/(MessageButton|NotificationButton)/, domain: 'COMMUNICATION' },

  // DISCOVERY
  { pattern: /^feed\//, domain: 'DISCOVERY' },
  { pattern: /^lib\/discovery\//, domain: 'DISCOVERY' },
  { pattern: /^features\/discovery\//, domain: 'DISCOVERY' },
  { pattern: /^system\/feed\//, domain: 'DISCOVERY' },
  { pattern: /^components\/discovery\//, domain: 'DISCOVERY' },
  { pattern: /^pages\/(DiscoverPage|FavoritesPage|LiveMapPage)/, domain: 'DISCOVERY' },
  { pattern: /^components\/home\/header\/SearchCommandCenter/, domain: 'DISCOVERY', also: ['IDENTITY', 'CONNECTION'] },

  // IMPACT
  { pattern: /^system\/flows\/impact\//, domain: 'IMPACT' },
  { pattern: /^pages\/ImpactPage/, domain: 'IMPACT' },
  { pattern: /^components\/studio\/ImpactStimmenModal/, domain: 'IMPACT' },

  // TRUST
  { pattern: /^lib\/(trustContext|trust\/)/, domain: 'TRUST' },

  // PRESENCE
  { pattern: /^lib\/(sessionHooks|usePresence)/, domain: 'PRESENCE' },
  { pattern: /^lib\/presence\//, domain: 'PRESENCE' },
  { pattern: /^components\/CreatorPresence/, domain: 'PRESENCE' },

  // INTELLIGENCE
  { pattern: /^lib\/intelligence\//, domain: 'INTELLIGENCE' },
  { pattern: /^lib\/guidance\//, domain: 'INTELLIGENCE' },
  { pattern: /^components\/guidance\//, domain: 'INTELLIGENCE' },

  // WORLD
  { pattern: /^lib\/world\//, domain: 'WORLD' },
  { pattern: /^lib\/(moodUtils|cleanup\/cleanupOrbEnvironment)/, domain: 'WORLD' },
  { pattern: /^context\//, domain: 'WORLD' },
  { pattern: /^components\/home\/(AmbientWorldBar|mood\/|header\/MoodOrbButton)/, domain: 'WORLD', also: ['WIRKUNG'] },

  // STUDIO
  { pattern: /^pages\/(CreatorStudio|CreatorDashboard|MyCreatorDashboard|MeinHUI|PlatformDashboard|Admin|DiagnosePage|studio\/)/, domain: 'STUDIO' },
  { pattern: /^components\/studio\//, domain: 'STUDIO' },
  { pattern: /^components\/SupportSheet/, domain: 'STUDIO' },
  { pattern: /^pages\/studio\//, domain: 'STUDIO' },

  // SERVICES — assign by primary responsibility
  { pattern: /^services\/db\.js$/, domain: 'KERNEL', also: ['IDENTITY', 'CREATION', 'COMMERCE', 'COMMUNICATION', 'DISCOVERY', 'IMPACT', 'CONNECTION'] },
  { pattern: /^services\/content\.js$/, domain: 'DISCOVERY', also: ['CREATION'] },

  // AppState — cross-cutting state hub
  { pattern: /^lib\/AppStateContext/, domain: 'KERNEL', also: ['IDENTITY', 'COMMERCE', 'COMMUNICATION', 'CONNECTION', 'CREATION'] },

  // Home shell — multi-domain orchestration
  { pattern: /^pages\/Home\.jsx$/, domain: 'KERNEL', also: ['DISCOVERY', 'WORLD', 'WIRKUNG', 'COMMUNICATION'] },
  { pattern: /^components\/home\/(HomeShell|navigation\/|header\/HomeHeader)/, domain: 'KERNEL', also: ['DISCOVERY', 'WORLD'] },

  // Misc UI
  { pattern: /^components\/ui\//, domain: 'KERNEL' },
  { pattern: /^components\/EmptyState/, domain: 'KERNEL' },
  { pattern: /^lib\/(useToast|utils|feedback|reliability|security)/, domain: 'KERNEL' },
];

const MULTI_DOMAIN_OVERRIDES = {
  'components/studio/ProfilBearbeitenModal.jsx': ['IDENTITY', 'STUDIO'],
  'components/studio/EinAusgabenModal.jsx': ['COMMERCE', 'STUDIO'],
  'components/studio/MeineProjekteModal.jsx': ['CREATION', 'STUDIO'],
  'components/studio/StatistikenModal.jsx': ['COMMERCE', 'STUDIO'],
  'components/profile/PublicProfilePreview.jsx': ['IDENTITY', 'WIRKUNG'],
  'components/profile/ProfileHeader.jsx': ['IDENTITY', 'PRESENCE'],
  'core/HuiConnectionEngine.jsx': ['KERNEL', 'CONNECTION'],
  'feed/cards/FeedRouter.jsx': ['DISCOVERY', 'CREATION'],
  'feed/useFeedStream.js': ['DISCOVERY', 'WIRKUNG'],
  'feed/feedRhythmEngine.js': ['DISCOVERY', 'WIRKUNG'],
  'lib/intelligence/discoverWorld.js': ['INTELLIGENCE', 'DISCOVERY'],
  'lib/intelligence/resonanceSpaces.js': ['INTELLIGENCE', 'WIRKUNG'],
  'lib/intelligence/relationshipMemory.js': ['INTELLIGENCE', 'CONNECTION'],
  'lib/world/orbLayer.js': ['WORLD', 'WIRKUNG'],
  'system/orb/MemberOrbHome.jsx': ['WIRKUNG', 'WORLD'],
  'pages/MeinHUI.jsx': ['STUDIO', 'IDENTITY'],
  'pages/MyCreatorDashboard.jsx': ['STUDIO', 'COMMERCE'],
  'pages/studio/MeineResonanz.jsx': ['STUDIO', 'WIRKUNG'],
  'pages/studio/StudioSubPages.jsx': ['STUDIO', 'COMMUNICATION', 'COMMERCE', 'CREATION'],
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry)) {
      files.push(relative(SRC, full).replace(/\\/g, '/'));
    }
  }
  return files;
}

function assignDomain(filePath) {
  if (MULTI_DOMAIN_OVERRIDES[filePath]) {
    const also = MULTI_DOMAIN_OVERRIDES[filePath];
    return { domain: also[0], multiDomain: true, alsoDomains: also.slice(1) };
  }
  for (const rule of RULES) {
    if (rule.pattern.test(filePath)) {
      return {
        domain: rule.domain,
        multiDomain: !!rule.also?.length,
        alsoDomains: rule.also || [],
      };
    }
  }
  return { domain: 'UNASSIGNED', multiDomain: false, alsoDomains: [] };
}

const files = walk(SRC).sort();
const map = {};
const stats = {};

for (const f of files) {
  const { domain, multiDomain, alsoDomains } = assignDomain(f);
  map[f] = {
    primaryDomain: domain,
    label: DOMAINS[domain] || domain,
    multiDomain,
    alsoDomains: alsoDomains.map(d => ({ id: d, label: DOMAINS[d] })),
  };
  stats[domain] = (stats[domain] || 0) + 1;
}

const output = {
  version: 'ARCH-005-v1',
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  domainDefinitions: DOMAINS,
  stats,
  unassigned: files.filter(f => map[f].primaryDomain === 'UNASSIGNED'),
  multiDomainFiles: files.filter(f => map[f].multiDomain),
  files: map,
};

const outPath = join(process.cwd(), 'docs/generated/domain-file-map.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Written ${outPath}`);
console.log('Stats:', stats);
console.log('Unassigned:', output.unassigned.length, output.unassigned);
console.log('Multi-domain:', output.multiDomainFiles.length);
