// src/hooks/useImpactProjects.js — v2  
// Backward-compat wrapper over useImpact
import { useImpact, useImpactVote } from './useImpact';
export { useImpact as useImpactProjects, useImpactVote };

// Legacy compat
export function useImpactProjectsLegacy(status) {
  const { projects, loading } = useImpact();
  const filtered = status ? projects.filter(p => p.status === status) : projects;
  return { projects: filtered, loading };
}
