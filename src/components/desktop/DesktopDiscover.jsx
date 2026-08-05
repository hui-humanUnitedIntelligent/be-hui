// ══════════════════════════════════════════════════════════════════════════════
// DesktopDiscover.jsx — HUI Desktop Discover Wrapper (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// Wrappt die bestehende Discover-Seite in ein Desktop-Grid-Layout.
// Keine horizontalen Slider — Desktop nutzt CSS Grid für die Galerie.
//
// Die bestehende DiscoverPage wird 1:1 gerendert, aber mit Desktop-CSS
// überschrieben: horizontale Slider werden zu Grids, mehr Weißraum,
// größere Karten.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

const DiscoverPage = React.lazy(() => import('../../pages/DiscoverPage.jsx'));

export default function DesktopDiscover() {
  return (
    <div className="desktop-discover">
      <React.Suspense fallback={<div className="dd-loading">Entdecken wird geladen…</div>}>
        <DiscoverPage />
      </React.Suspense>
    </div>
  );
}
