// src/architecture/graph/graphStore.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — In-Memory Store (ARCH-002)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {string} [description]
 * @property {'confirmed'|'inferred'|'derived'} [confidence]
 * @property {string} [source]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} id
 * @property {string} type
 * @property {string} source
 * @property {string} target
 * @property {'confirmed'|'inferred'|'derived'} [confidence]
 * @property {string} [sourceRef]
 * @property {Record<string, unknown>} [meta]
 */

export class GraphStore {
  constructor() {
    /** @type {Map<string, GraphNode>} */
    this.nodes = new Map();
    /** @type {GraphEdge[]} */
    this.edges = [];
    /** @type {Map<string, GraphEdge[]>} */
    this.outgoing = new Map();
    /** @type {Map<string, GraphEdge[]>} */
    this.incoming = new Map();
    /** @type {Map<string, Set<string>>} */
    this.byType = new Map();
  }

  /**
   * @param {Partial<GraphNode> & Pick<GraphNode, 'id'|'type'|'label'>} node
   * @returns {GraphNode}
   */
  upsertNode(node) {
    const existing = this.nodes.get(node.id);
    const merged = {
      confidence: 'confirmed',
      ...existing,
      ...node,
      meta: { ...(existing?.meta || {}), ...(node.meta || {}) },
    };
    this.nodes.set(node.id, merged);
    if (!this.byType.has(merged.type)) this.byType.set(merged.type, new Set());
    this.byType.get(merged.type).add(merged.id);
    return merged;
  }

  /**
   * @param {Partial<GraphEdge> & Pick<GraphEdge, 'type'|'source'|'target'>} edge
   * @returns {GraphEdge|null}
   */
  addEdge(edge) {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) return null;
    const id = edge.id || `${edge.type}:${edge.source}->${edge.target}`;
    const dup = this.edges.find(e => e.id === id);
    if (dup) return dup;
    const full = {
      id,
      confidence: 'confirmed',
      ...edge,
    };
    this.edges.push(full);
    if (!this.outgoing.has(full.source)) this.outgoing.set(full.source, []);
    if (!this.incoming.has(full.target)) this.incoming.set(full.target, []);
    this.outgoing.get(full.source).push(full);
    this.incoming.get(full.target).push(full);
    return full;
  }

  /** @param {string} id @returns {GraphNode|undefined} */
  getNode(id) { return this.nodes.get(id); }

  /** @param {string} type @returns {GraphNode[]} */
  getNodesByType(type) {
    const ids = this.byType.get(type);
    if (!ids) return [];
    return [...ids].map(id => this.nodes.get(id)).filter(Boolean);
  }

  /**
   * @param {string} nodeId
   * @param {string|string[]} [edgeTypes]
   * @param {'out'|'in'|'both'} [direction]
   */
  getNeighbors(nodeId, edgeTypes, direction = 'both') {
    const types = edgeTypes ? (Array.isArray(edgeTypes) ? edgeTypes : [edgeTypes]) : null;
    const result = [];
    const collect = (edges) => {
      for (const e of edges || []) {
        if (types && !types.includes(e.type)) continue;
        const otherId = e.source === nodeId ? e.target : e.source;
        const other = this.nodes.get(otherId);
        if (other) result.push({ edge: e, node: other });
      }
    };
    if (direction === 'out' || direction === 'both') collect(this.outgoing.get(nodeId));
    if (direction === 'in' || direction === 'both') collect(this.incoming.get(nodeId));
    return result;
  }

  /** BFS traversal from start nodes */
  traverse(startIds, options = {}) {
    const { edgeTypes, maxDepth = 20, direction = 'out' } = options;
    const visited = new Set();
    const queue = startIds.map(id => ({ id, depth: 0 }));
    const path = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);
      const node = this.nodes.get(id);
      if (node) path.push({ node, depth });

      const neighbors = this.getNeighbors(id, edgeTypes, direction);
      for (const { node: n, edge } of neighbors) {
        if (!visited.has(n.id)) queue.push({ id: n.id, depth: depth + 1, via: edge });
      }
    }
    return path;
  }

  toJSON() {
    return {
      version: 'ARCH-002.1',
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      nodes: [...this.nodes.values()],
      edges: this.edges,
    };
  }

  static fromJSON(data) {
    const store = new GraphStore();
    for (const node of data.nodes || []) store.upsertNode(node);
    for (const edge of data.edges || []) store.addEdge(edge);
    return store;
  }
}
