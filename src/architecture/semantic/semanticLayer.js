// src/architecture/semantic/semanticLayer.js
// ══════════════════════════════════════════════════════════════════════════════
// Semantic Layer — ARCH-002.1 / ARCH-003
// Ergänzt Knowledge Graph Nodes mit semantischer Bedeutung.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, DOMAINS } from '../scanner/domains.js';
import { PILLARS } from '../governance/constitution.js';
import { getDependents, getDependencies, getTablesForFile } from '../graph/knowledgeGraph.js';
import { createStatement, SOURCE, CONFIDENCE } from '../intelligence/confidence.js';

/** Capabilities — abgeleitet aus Domain + Pfadmuster + Komponenten */
const CAPABILITY_PATTERNS = Object.freeze([
  { id: 'CAP-AUTH', name: 'Authentifizierung', patterns: ['auth/', 'login', 'AuthContext', 'ProtectedRoute'], domain: 'SERVICES', pillar: 'PILLAR-01' },
  { id: 'CAP-PROFILE', name: 'Profilverwaltung', patterns: ['profile/', 'Profile', 'profiles'], domain: 'COMPONENTS', pillar: 'PILLAR-01' },
  { id: 'CAP-FEED', name: 'Feed & Orientierung', patterns: ['feed/', 'Feed', 'useFeedStream'], domain: 'SYSTEM', pillar: 'PILLAR-02' },
  { id: 'CAP-ORB', name: 'Orb & Wirkung', patterns: ['orb/', 'Orb', 'orbEngine', 'useOrbParams'], domain: 'CORE', pillar: 'PILLAR-05' },
  { id: 'CAP-COMMERCE', name: 'Commerce & Werk', patterns: ['commerce/', 'Werk', 'PublishWork', 'commerceEngine'], domain: 'SERVICES', pillar: 'PILLAR-04' },
  { id: 'CAP-IMPACT', name: 'Impact Pool', patterns: ['impact/', 'Impact', 'impact_pool'], domain: 'SERVICES', pillar: 'PILLAR-05' },
  { id: 'CAP-DISCOVERY', name: 'Entdeckung & Suche', patterns: ['discovery/', 'Search', 'PeopleSearch'], domain: 'FEATURES', pillar: 'PILLAR-01' },
  { id: 'CAP-CHAT', name: 'Kommunikation', patterns: ['chat/', 'Chat', 'chatContext'], domain: 'SERVICES', pillar: 'PILLAR-01' },
  { id: 'CAP-PUBLISHING', name: 'Werk veröffentlichen', patterns: ['publishing/', 'Publish'], domain: 'COMPONENTS', pillar: 'PILLAR-03' },
  { id: 'CAP-SETTINGS', name: 'Einstellungen', patterns: ['settings/', 'Settings'], domain: 'COMPONENTS', pillar: 'PILLAR-02' },
]);

/** User Journeys — abgeleitet aus Pages + Route-Mustern */
const JOURNEY_PATTERNS = Object.freeze([
  { id: 'JOURNEY-ONBOARD', name: 'Onboarding', patterns: ['Onboarding', 'ProfileCompletion', 'TalentOnboarding', 'login'], pages: ['pages/'] },
  { id: 'JOURNEY-HOME', name: 'Home & Feed', patterns: ['Home', 'Feed', 'UnifiedFeed'], pages: ['pages/'] },
  { id: 'JOURNEY-WORK', name: 'Werk entdecken & kaufen', patterns: ['WorkDetail', 'WerkKauf', 'PublishWork'], pages: ['pages/', 'components/commerce/', 'components/publishing/'] },
  { id: 'JOURNEY-PROFILE', name: 'Profil ansehen & bearbeiten', patterns: ['Profile', 'TalentProfile', 'PublicProfile'], pages: ['pages/', 'components/profile/'] },
  { id: 'JOURNEY-IMPACT', name: 'Impact geben', patterns: ['Impact', 'impact_pool'], pages: ['pages/', 'components/impact/'] },
  { id: 'JOURNEY-STUDIO', name: 'Creator Studio', patterns: ['Studio', 'Creator'], pages: ['pages/'] },
  { id: 'JOURNEY-SETTINGS', name: 'Einstellungen', patterns: ['Settings'], pages: ['pages/', 'components/settings/'] },
]);

/**
 * Erkennt Capabilities für eine Datei.
 * @param {FileScanResult} fileResult
 * @returns {Array<{ id: string, name: string, pillar: string, sourceType: string, confidence: string }>}
 */
export function detectCapabilities(fileResult) {
  const path = fileResult.path;
  const content = [path, ...(fileResult.components || []), ...(fileResult.exports?.map(e => e.name) || [])].join(' ');
  const capabilities = [];

  for (const cap of CAPABILITY_PATTERNS) {
    const matched = cap.patterns.some(p => path.includes(p) || content.includes(p));
    if (matched) {
      const domain = getDomainForPath('src/' + path);
      const confidence = cap.domain === domain ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM;
      const sourceType = cap.domain === domain ? SOURCE.EXPLICIT : SOURCE.DERIVED;
      capabilities.push({ id: cap.id, name: cap.name, pillar: cap.pillar, sourceType, confidence });
    }
  }

  return capabilities;
}

/**
 * Erkennt User Journeys für eine Datei.
 * @param {FileScanResult} fileResult
 */
export function detectJourneys(fileResult) {
  const path = fileResult.path;
  const journeys = [];

  for (const journey of JOURNEY_PATTERNS) {
    const inScope = journey.pages.some(p => path.startsWith(p));
    if (!inScope) continue;

    const matched = journey.patterns.some(p => path.includes(p));
    if (matched) {
      journeys.push({
        id: journey.id,
        name: journey.name,
        sourceType: SOURCE.DERIVED,
        confidence: path.startsWith('pages/') ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM,
      });
    }
  }

  return journeys;
}

/**
 * Reichert eine Datei mit semantischen Metadaten an.
 * @param {FileScanResult} fileResult
 * @param {{ edges: GraphEdge[] }} graph
 * @param {Violation[]} violations
 */
export function enrichFileSemantics(fileResult, graph, violations) {
  const domain = getDomainForPath('src/' + fileResult.path);
  const domainInfo = DOMAINS[domain];
  const capabilities = detectCapabilities(fileResult);
  const journeys = detectJourneys(fileResult);
  const dependents = getDependents(fileResult.path, graph);
  const dependencies = getDependencies(fileResult.path, graph);
  const tables = getTablesForFile(fileResult.path, graph);
  const fileViolations = violations.filter(v => v.file === fileResult.path);

  const pillar = capabilities[0]?.pillar
    ? PILLARS.find(p => p.id === capabilities[0].pillar)
    : null;

  return {
    path: fileResult.path,
    domain: {
      id: domain,
      label: domainInfo?.label || domain,
      layer: domainInfo?.layer,
      description: domainInfo?.description,
      sourceType: SOURCE.EXPLICIT,
      confidence: CONFIDENCE.HIGH,
    },
    responsibility: fileResult.header?.responsibility
      ? createStatement(
          fileResult.header.responsibility,
          { type: 'file-header', path: fileResult.path },
          SOURCE.EXPLICIT,
          CONFIDENCE.HIGH
        )
      : createStatement(
          `Datei in Domain ${domain} ohne @responsibility-Tag`,
          { type: 'domain-inference', path: fileResult.path },
          SOURCE.INFERRED,
          CONFIDENCE.LOW
        ),
    owner: fileResult.header?.owner || null,
    capabilities,
    journeys,
    pillar,
    dependents: { count: dependents.length, files: dependents.slice(0, 20) },
    dependencies: { count: dependencies.length, files: dependencies.slice(0, 20) },
    tables,
    violations: fileViolations,
    adoption: {
      actionEngine: fileResult.actionEngine?.adopted || false,
      coreEngine: fileResult.coreEngine?.adopted || false,
      registry: fileResult.registryUsage?.adopted || false,
    },
  };
}

/**
 * Baut den vollständigen Semantic Layer für alle Dateien.
 * @param {Map<string, FileScanResult>} scanResults
 * @param {{ nodes: GraphNode[], edges: GraphEdge[] }} graph
 * @param {Violation[]} violations
 */
export function buildSemanticLayer(scanResults, graph, violations) {
  const semantics = new Map();

  for (const result of scanResults.values()) {
    if (!result) continue;
    semantics.set(result.path, enrichFileSemantics(result, graph, violations));
  }

  return semantics;
}

export { CAPABILITY_PATTERNS, JOURNEY_PATTERNS };
