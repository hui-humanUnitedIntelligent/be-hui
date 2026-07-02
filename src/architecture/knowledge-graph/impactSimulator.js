// src/architecture/knowledge-graph/impactSimulator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Refactoring-Simulation — echte Abhängigkeitsanalyse, keine Vermutungen.
// ══════════════════════════════════════════════════════════════════════════════

import { nodeId } from './utils.js';
import { NODE_TYPES, EDGE_TYPES } from './types.js';

/**
 * Simuliert die Auswirkungen einer Architektur-Änderung.
 */
export function createImpactSimulator(graph, queryEngine) {
  return {
    /**
     * Simuliert Änderung oder Entfernung eines Knotens.
     * @param {string} target — Datei, Service, Context oder Tabelle
     * @param {'modify'|'remove'|'move'} action
     * @param {object} options
     */
    simulate(target, action = 'modify', options = {}) {
      const node = queryEngine.getNode(target) ||
        queryEngine.getNode(nodeId(NODE_TYPES.SERVICE, target)) ||
        queryEngine.getNode(nodeId(NODE_TYPES.CONTEXT, target)) ||
        queryEngine.getNode(nodeId(NODE_TYPES.SUPABASE_TABLE, target)) ||
        queryEngine.getNode(nodeId(NODE_TYPES.FILE, target));

      if (!node) {
        return { success: false, error: `Knoten '${target}' nicht im Graphen gefunden.` };
      }

      const impact = queryEngine.getImpact(node.path || node.name || node.id, options.depth || 10);
      const dependents = queryEngine.getDependents(node.path || node.name);
      const violations = [];

      if (action === 'remove') {
        const brokenImports = dependents.filter(d => d.type === NODE_TYPES.FILE);
        const brokenContexts = queryEngine.getConsumers(node.name);
        const tableImpact = node.type === NODE_TYPES.SUPABASE_TABLE
          ? this._simulateTableMove(target)
          : null;

        return {
          success: true,
          action,
          target: node,
          brokenFiles: brokenImports.map(f => f.path || f.name),
          brokenComponents: impact.indirect.filter(n => n.type === NODE_TYPES.COMPONENT),
          brokenContexts: brokenContexts.map(c => c.path || c.name),
          affectedServices: impact.indirect.filter(n => n.type === NODE_TYPES.SERVICE),
          affectedPages: impact.indirect.filter(n => n.type === NODE_TYPES.PAGE),
          totalAffected: impact.total,
          tableImpact,
          risk: this._assessRisk(impact.total, brokenImports.length),
          recommendation: this._recommend(action, impact.total),
        };
      }

      if (action === 'modify') {
        return {
          success: true,
          action,
          target: node,
          directlyAffected: impact.direct.map(n => n.path || n.name),
          indirectlyAffected: impact.indirect.map(n => n.path || n.name),
          totalAffected: impact.total,
          consumers: dependents.map(d => d.path || d.name),
          risk: this._assessRisk(impact.total, impact.direct.length),
        };
      }

      if (action === 'move') {
        const newDomain = options.toDomain;
        const layerViolations = newDomain ? this._checkLayerMove(node, newDomain, graph) : [];
        return {
          success: true,
          action,
          target: node,
          fromDomain: node.domain,
          toDomain: newDomain,
          affectedFiles: impact.indirect.map(n => n.path || n.name),
          newViolations: layerViolations,
          totalAffected: impact.total,
        };
      }

      return { success: false, error: 'Unbekannte Aktion' };
    },

    simulateServiceChange(serviceName) {
      return this.simulate(serviceName, 'modify');
    },

    simulateContextRemoval(contextName) {
      return this.simulate(contextName, 'remove');
    },

    simulateTableMove(tableName, options = {}) {
      return this._simulateTableMove(tableName, options);
    },

    simulateRegistryChange() {
      const registryNode = queryEngine.getNode(nodeId(NODE_TYPES.REGISTRY, 'HuiRegistry'));
      if (!registryNode) return { success: false, error: 'HuiRegistry nicht gefunden' };

      const consumers = [...graph.edges]
        .filter(e => e.type === EDGE_TYPES.USES_REGISTRY && e.target === registryNode.id)
        .map(e => graph.nodes.get(e.source))
        .filter(Boolean);

      return {
        success: true,
        target: registryNode,
        directConsumers: consumers.map(c => c.path || c.name),
        totalConsumers: consumers.length,
        affectedDomains: [...new Set(consumers.map(c => c.domain))],
        risk: consumers.length > 50 ? 'HIGH' : consumers.length > 10 ? 'MEDIUM' : 'LOW',
      };
    },

    _simulateTableMove(tableName, options = {}) {
      const writers = graph.tableWriters?.get(tableName);
      const readers = graph.tableReaders?.get(tableName);
      const plan = queryEngine.getMigrationPlan(tableName);

      return {
        table: tableName,
        currentWriters: writers ? [...writers] : [],
        currentReaders: readers ? [...readers] : [],
        migrations: plan?.migrations || [],
        servicesToUpdate: writers ? [...writers] : [],
        componentsAffected: readers ? [...readers].filter(p => p.includes('components/')) : [],
        edgeFunctions: queryEngine.getNodesByType(NODE_TYPES.EDGE_FUNCTION)
          .filter(fn => fn.tables?.includes(tableName)),
      };
    },

    _checkLayerMove(node, newDomain, graph) {
      const violations = [];
      const dependents = queryEngine.getDependents(node.path || node.name);
      for (const dep of dependents) {
        if (dep.domain && dep.domain !== newDomain) {
          violations.push({
            file: dep.path,
            message: `Import von ${node.path} würde Layer-Violation erzeugen nach Verschiebung nach ${newDomain}`,
          });
        }
      }
      return violations;
    },

    _assessRisk(totalAffected, directCount) {
      if (totalAffected > 30 || directCount > 15) return 'CRITICAL';
      if (totalAffected > 10 || directCount > 5) return 'HIGH';
      if (totalAffected > 3) return 'MEDIUM';
      return 'LOW';
    },

    _recommend(action, total) {
      if (action === 'remove' && total > 10) {
        return 'Schrittweise Migration empfohlen. Zuerst Abhängigkeiten reduzieren.';
      }
      if (total > 20) return 'Umfangreiche Testabdeckung erforderlich vor Änderung.';
      if (total > 5) return 'Code-Review aller betroffenen Dateien empfohlen.';
      return 'Geringes Risiko — direkte Änderung möglich.';
    },
  };
}
