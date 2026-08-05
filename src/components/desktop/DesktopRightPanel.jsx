// ══════════════════════════════════════════════════════════════════════════════
// DesktopRightPanel.jsx — HUI Desktop Wirkungsraum (Shell)
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Rechter Panel der Desktop-Shell — "Wirkungsraum".
//   Phase 0: Leere Shell mit Grundstruktur.
//   Später: Impact, Resonanz, Möglichkeiten, persönlicher Puls.
//
// ARCHITEKTUR:
//   Rendert KEINE eigenen Daten. Empfängt alle Daten via Props
//   oder nutzt bestehende shared Hooks/Contexts.
//   Keine eigenen Services, keine eigenen Supabase-Aufrufe.
//
// RESPONSIVE:
//   ≥1280px: Sichtbar (340px Standard, 380px bei Ultrawide)
//   <1280px: Versteckt (CSS-regel in desktopFoundation.css)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

export default function DesktopRightPanel({ children }) {
  return (
    <aside className="desktop-right-panel" aria-label="Wirkungsraum">
      <div className="desktop-right-panel-inner">
        {children || (
          // ── Placeholder (Phase 0) ──────────────────────────────
          <div style={{
            color: 'var(--desktop-muted)',
            fontSize: 13,
            textAlign: 'center',
            padding: '48px 0',
          }}>
            Wirkungsraum
          </div>
        )}
      </div>
    </aside>
  );
}
