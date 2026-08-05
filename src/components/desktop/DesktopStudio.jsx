// ══════════════════════════════════════════════════════════════════════════════
// DesktopStudio.jsx — HUI Desktop Studio Workspace (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// Wrappt das bestehende CreatorStudio in ein Desktop-Workspace-Layout.
// Links: Subnavigation (fixiert). Mitte: Arbeitsbereich (scrollbar).
// Keine Mobile-Unterseiten. Keine Fullscreen-Modals.
//
// Die bestehende CreatorStudio wird 1:1 gerendert, aber mit Desktop-CSS:
// Die interne Subnavigation wird links als Sidebar dargestellt.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

const CreatorStudio = React.lazy(() => import('../../pages/CreatorStudio.jsx'));

export default function DesktopStudio() {
  return (
    <div className="desktop-studio">
      <React.Suspense fallback={<div className="ds-loading">Studio wird geladen…</div>}>
        <CreatorStudio />
      </React.Suspense>
    </div>
  );
}
