// src/architecture/graph/schema.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — Schema (ARCH-002 / ARCH-002.1)
// Formal node and edge type definitions for the knowledge graph.
// ══════════════════════════════════════════════════════════════════════════════

/** @typedef {'confirmed'|'inferred'|'derived'} ConfidenceLevel */

/** ARCH-002 technical node types (dependency graph) */
export const TECHNICAL_NODE_TYPES = Object.freeze({
  FILE: 'File',
  COMPONENT: 'Component',
  HOOK: 'Hook',
  DOMAIN: 'Domain',
  LAYER: 'Layer',
  SERVICE: 'Service',
  TABLE: 'Table',
  VIOLATION: 'Violation',
  ACTION: 'Action',
  CONTRACT: 'Contract',
  ROUTE: 'Route',
  PILLAR: 'Pillar',
});

/** ARCH-002.1 semantic node types */
export const SEMANTIC_NODE_TYPES = Object.freeze({
  CAPABILITY: 'Capability',
  BUSINESS_PROCESS: 'BusinessProcess',
  USER_JOURNEY: 'UserJourney',
  EXPERIENCE: 'Experience',
  INTERACTION: 'Interaction',
  HUMAN_PRINCIPLE: 'HumanPrinciple',
  CONSTITUTION_PRINCIPLE: 'ConstitutionPrinciple',
  ARCHITECTURE_PRINCIPLE: 'ArchitecturePrinciple',
  PLATFORM_GOAL: 'PlatformGoal',
  FEATURE_GOAL: 'FeatureGoal',
  MISSION: 'Mission',
  VALUE: 'Value',
  TRUST_SIGNAL: 'TrustSignal',
  RESONANCE_SIGNAL: 'ResonanceSignal',
  ORB_BEHAVIOUR: 'OrbBehaviour',
  COMMUNITY_BEHAVIOUR: 'CommunityBehaviour',
  DISCOVERY_BEHAVIOUR: 'DiscoveryBehaviour',
  IMPACT_BEHAVIOUR: 'ImpactBehaviour',
  IDENTITY_BEHAVIOUR: 'IdentityBehaviour',
  COMMERCE_BEHAVIOUR: 'CommerceBehaviour',
  SOCIAL_BEHAVIOUR: 'SocialBehaviour',
  LEARNING_BEHAVIOUR: 'LearningBehaviour',
  GUARDIAN_BEHAVIOUR: 'GuardianBehaviour',
  PRIVACY_CONCERN: 'PrivacyConcern',
  SECURITY_CONCERN: 'SecurityConcern',
  ACCESSIBILITY_CONCERN: 'AccessibilityConcern',
  PERFORMANCE_CONCERN: 'PerformanceConcern',
  QUALITY_ATTRIBUTE: 'QualityAttribute',
  ARCHITECTURE_PATTERN: 'ArchitecturePattern',
  ANTI_PATTERN: 'AntiPattern',
  DECISION: 'Decision',
  CONSTRAINT: 'Constraint',
  TRADEOFF: 'Tradeoff',
  INVARIANT: 'Invariant',
  POLICY: 'Policy',
  RULE: 'Rule',
  INTENT: 'Intent',
  FEATURE: 'Feature',
});

export const ALL_NODE_TYPES = Object.freeze({
  ...TECHNICAL_NODE_TYPES,
  ...SEMANTIC_NODE_TYPES,
});

/** ARCH-002 technical relationships */
export const TECHNICAL_EDGE_TYPES = Object.freeze({
  IMPORTS: 'IMPORTS',
  BELONGS_TO: 'BELONGS_TO',
  READS: 'READS',
  WRITES: 'WRITES',
  VIOLATES: 'VIOLATES',
  DISPATCHES: 'DISPATCHES',
  HAS_CONTRACT: 'HAS_CONTRACT',
  EXPRESSES_INTENT: 'EXPRESSES_INTENT',
  ROUTES_TO: 'ROUTES_TO',
  GOVERNED_BY: 'GOVERNED_BY',
  STRENGTHENS: 'STRENGTHENS',
  OWNS: 'OWNS',
  CONTAINS: 'CONTAINS',
});

/** ARCH-002.1 semantic relationships */
export const SEMANTIC_EDGE_TYPES = Object.freeze({
  SUPPORTS: 'SUPPORTS',
  ENABLES: 'ENABLES',
  FULFILLS: 'FULFILLS',
  IMPLEMENTS: 'IMPLEMENTS',
  EXPRESSES: 'EXPRESSES',
  PROTECTS: 'PROTECTS',
  REQUIRES: 'REQUIRES',
  CONSTRAINS: 'CONSTRAINS',
  GOVERNS: 'GOVERNS',
  REALIZES: 'REALIZES',
  DRIVES: 'DRIVES',
  DEPENDS_ON_MEANING: 'DEPENDS_ON_MEANING',
  RELATES_TO: 'RELATES_TO',
  CONTRIBUTES_TO: 'CONTRIBUTES_TO',
  AFFECTS: 'AFFECTS',
  INFLUENCES: 'INFLUENCES',
  REPLACES: 'REPLACES',
  SUPERSEDES: 'SUPERSEDES',
  DERIVED_FROM: 'DERIVED_FROM',
  JUSTIFIED_BY: 'JUSTIFIED_BY',
  VALIDATED_BY: 'VALIDATED_BY',
});

export const ALL_EDGE_TYPES = Object.freeze({
  ...TECHNICAL_EDGE_TYPES,
  ...SEMANTIC_EDGE_TYPES,
});

export const SCAN_VERSION = 'ARCH-002.1';
