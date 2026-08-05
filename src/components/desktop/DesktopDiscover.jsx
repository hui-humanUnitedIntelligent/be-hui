// ══════════════════════════════════════════════════════════════════════════════
// DesktopDiscover.jsx — HUI Desktop V3 — Galerie
// ══════════════════════════════════════════════════════════════════════════════
//
// Keine horizontalen Slider. Grid mit variablen Kartengrößen, mehr Luft.
// Wrappt die bestehende DiscoverPage — Business-Logik unverändert,
// nur Desktop-CSS überschreibt horizontale Container zu einem Grid.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

const DiscoverPage = React.lazy(() => import('../../pages/DiscoverPage.jsx'));

export default function DesktopDiscover() {
  return (
    <div className="disc-page">
      <React.Suspense fallback={<div className="disc-loading">Entdecken wird geladen…</div>}>
        <DiscoverPage />
      </React.Suspense>
    </div>
  );
}
