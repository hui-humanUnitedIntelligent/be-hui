// src/lib/safeQuery.js
// HUI — Safe Supabase Query Wrapper — Phase 5A/5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Alle 76 Supabase-Calls ohne try/catch werden durch diesen
// Wrapper geschützt. Gibt immer { data, error } zurück.
// Wirft nie. Verhindert unhandled rejections.
//
// USAGE:
//   import { safeQuery } from '@/lib/safeQuery';
//   const { data, error } = await safeQuery(
//     supabase.from('profiles').select('*').eq('id', userId)
//   );
//   if (error) { /* handle */ }
// ═══════════════════════════════════════════════════════════════

/**
 * Wickelt jeden Supabase-Query in try/catch.
 * Gibt normalisiertes { data, error } zurück.
 * @param {Promise} queryBuilder — Supabase-Query-Chain
 * @returns {{ data: any, error: Error|null }}
 */
export async function safeQuery(queryBuilder) {
  try {
    const result = await queryBuilder;
    return result;
  } catch (e) {
    const msg = e?.message || String(e);
    if (import.meta.env.DEV) {
      console.warn('[safeQuery] caught:', msg);
    }
    return { data: null, error: e };
  }
}

/**
 * Führt mehrere Queries parallel aus.
 * Jede gibt { data, error } zurück — kein Promise.all Abort.
 */
export async function safeQueryAll(...queryBuilders) {
  return Promise.all(queryBuilders.map(safeQuery));
}