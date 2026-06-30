// src/architecture/domains.js
// ══════════════════════════════════════════════════════════════
// HUI Domain Definitions — CORE-001
// Kanonische Domänen gemäß RFC-000_DOMAIN_MODEL.md
// ══════════════════════════════════════════════════════════════

/** @typedef {'CORE'|'IDENTITY'|'CONTENT'|'SOCIAL'|'COMMERCE'|'IMPACT'|'DISCOVERY'|'COMMUNITY'|'PLATFORM'|'TRUST'} HuiDomain */

/** @type {Record<HuiDomain, { label: string, ownerPath: string, description: string }>} */
export const DOMAINS = {
  CORE: {
    label: 'Core',
    ownerPath: 'src/core/',
    description: 'Registry, Core Engine, Action Engine, Architecture Guards',
  },
  IDENTITY: {
    label: 'Identity',
    ownerPath: 'src/lib/AuthContext.jsx',
    description: 'Auth, Session, Profile, Wirker-Profile, Membership',
  },
  CONTENT: {
    label: 'Content',
    ownerPath: 'src/services/content.js',
    description: 'Works, Stories, Beiträge, Feed-Posts, Media',
  },
  SOCIAL: {
    label: 'Social',
    ownerPath: 'src/lib/chatContext.js',
    description: 'Chats, Messages, Follows, Connections, Presence',
  },
  COMMERCE: {
    label: 'Commerce',
    ownerPath: 'src/services/commerceEngine.js',
    description: 'Bookings, Payments, Escrow, Creator Economy',
  },
  IMPACT: {
    label: 'Impact',
    ownerPath: 'src/system/flows/impact/',
    description: 'Impact Projects, Votes, Rounds, Applications',
  },
  DISCOVERY: {
    label: 'Discovery',
    ownerPath: 'src/feed/',
    description: 'Feed Stream, Search, Recommendations, Match',
  },
  COMMUNITY: {
    label: 'Community',
    ownerPath: 'src/lib/community/',
    description: 'Communities, Members, Guardian Actions',
  },
  PLATFORM: {
    label: 'Platform',
    ownerPath: 'src/lib/events/',
    description: 'Platform Events, Notifications Infrastructure, Admin',
  },
  TRUST: {
    label: 'Trust',
    ownerPath: 'src/lib/trustContext.js',
    description: 'Trust Signals, Reputation',
  },
};

/** Domains that may write to Supabase directly (state owners + services). */
export const WRITE_OWNER_DOMAINS = new Set([
  'CORE',
  'IDENTITY',
  'CONTENT',
  'SOCIAL',
  'COMMERCE',
  'IMPACT',
  'DISCOVERY',
  'COMMUNITY',
  'PLATFORM',
  'TRUST',
]);

/**
 * Tables owned by each domain (single-writer principle).
 * @type {Record<string, HuiDomain>}
 */
export const TABLE_OWNERSHIP = {
  profiles: 'IDENTITY',
  wirker_profiles: 'IDENTITY',
  memberships: 'IDENTITY',
  works: 'CONTENT',
  stories: 'CONTENT',
  beitraege: 'CONTENT',
  feed_posts: 'CONTENT',
  story_views: 'CONTENT',
  story_reactions: 'CONTENT',
  comments: 'CONTENT',
  work_likes: 'CONTENT',
  work_saves: 'CONTENT',
  chats: 'SOCIAL',
  messages: 'SOCIAL',
  chat_participants: 'SOCIAL',
  follows: 'SOCIAL',
  connections: 'SOCIAL',
  user_presence: 'SOCIAL',
  profile_relations: 'SOCIAL',
  saved_posts: 'SOCIAL',
  post_reactions: 'SOCIAL',
  bookings: 'COMMERCE',
  booking_events: 'COMMERCE',
  availability_slots: 'COMMERCE',
  payments: 'COMMERCE',
  creator_wallets: 'COMMERCE',
  creator_supports: 'COMMERCE',
  experience_bookings: 'COMMERCE',
  work_sales: 'COMMERCE',
  commerce_events: 'COMMERCE',
  impact_projects: 'IMPACT',
  impact_votes: 'IMPACT',
  impact_rounds: 'IMPACT',
  impact_applications: 'IMPACT',
  impact_monthly_results: 'IMPACT',
  impact_score_failures: 'IMPACT',
  project_support: 'IMPACT',
  feed_items: 'DISCOVERY',
  user_match_scores: 'DISCOVERY',
  recommendations: 'DISCOVERY',
  communities: 'COMMUNITY',
  community_members: 'COMMUNITY',
  guardian_actions: 'COMMUNITY',
  platform_events: 'PLATFORM',
  notifications: 'PLATFORM',
  trust_signals: 'TRUST',
  experiences: 'CONTENT',
  projects: 'CONTENT',
  resonances: 'CONTENT',
  hui_points_ledger: 'PLATFORM',
  ambassador_ref_links: 'IDENTITY',
  creator_analytics: 'COMMERCE',
  conversations: 'SOCIAL',
};

/**
 * @param {string} table
 * @returns {HuiDomain|undefined}
 */
export function getTableOwner(table) {
  return TABLE_OWNERSHIP[table];
}

/**
 * @param {HuiDomain} domain
 * @returns {boolean}
 */
export function isValidDomain(domain) {
  return domain in DOMAINS;
}
