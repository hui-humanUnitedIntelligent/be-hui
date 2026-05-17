// ═══════════════════════════════════════════════════════════════
// STATUS: LEGACY — Phase 4A.5
// Diese Datei wird von keinem aktiven Modul importiert.
// NICHT LÖSCHEN — nur dokumentiert für spätere Bereinigung.
// Ersatz: siehe docs/LEGACY_MAP.md
// ═══════════════════════════════════════════════════════════════
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}