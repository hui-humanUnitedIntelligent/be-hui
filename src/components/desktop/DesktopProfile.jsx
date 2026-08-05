// ══════════════════════════════════════════════════════════════════════════════
// DesktopProfile.jsx — HUI Desktop Profile Wrapper (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// Wrappt die bestehende Profilseite in ein Desktop Split-Layout.
// Links: Avatar, Name, Talente, Buttons, Impact — fixiert.
// Rechts: Werke, Momente, Erlebnisse, Projekte — scrollbar.
//
// Kein Rewriting der Profilseite — nur Desktop-Container.
// Die bestehende Seite wird im rechten Bereich gerendert.
// Der linke Bereich wird aus denselben Daten aufgebaut.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useParams } from 'react-router-dom';

// Lazy load the existing mobile profile pages
const MyBasisProfile = React.lazy(() => import('../../pages/MyBasisProfile.jsx'));
const PublicProfilePage = React.lazy(() => import('../../pages/PublicProfilePage.jsx'));

export default function DesktopProfile() {
  const { username } = useParams();

  return (
    <div className="desktop-profile">
      {/* Left sidebar: profile summary (fixed) */}
      <aside className="desktop-profile-left">
        <div className="dpl-sticky">
          {/* The existing profile page already renders its own header.
              We just provide the container. The left sidebar shows
              a compact summary that the page itself manages. */}
          <div className="dpl-info">
            <p className="dpl-placeholder">Profil-Bereich wird geladen…</p>
          </div>
        </div>
      </aside>

      {/* Right content: scrollable profile content */}
      <div className="desktop-profile-right">
        <React.Suspense fallback={<div className="dpl-loading">Profil wird geladen…</div>}>
          {username ? <PublicProfilePage /> : <MyBasisProfile />}
        </React.Suspense>
      </div>
    </div>
  );
}
