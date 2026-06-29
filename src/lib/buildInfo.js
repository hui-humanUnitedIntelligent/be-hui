// src/lib/buildInfo.js — Build-Identität für Production-Debug
// Wird zur Build-Zeit via vite define injiziert.

/* global __BUILD__, __GIT_COMMIT__ */

const BUILD_TS = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 0;
const GIT_COMMIT = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown';

export const BUILD_INFO = Object.freeze({
  buildTs: BUILD_TS,
  buildIso: BUILD_TS ? new Date(BUILD_TS * 1000).toISOString() : 'unknown',
  gitCommit: GIT_COMMIT,
  gitShort: GIT_COMMIT.slice(0, 7),
});

export function logBuildInfo() {
  const label = `[HUI BUILD] ${BUILD_INFO.gitShort} @ ${BUILD_INFO.buildIso}`;
  console.log(label, BUILD_INFO);
  if (typeof window !== 'undefined') {
    window.__HUI_BUILD__ = BUILD_INFO;
  }
}
