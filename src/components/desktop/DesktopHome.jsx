// ══════════════════════════════════════════════════════════════════════════════
// DesktopHome.jsx — HUI Desktop Home (Mission Control + Feed)
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Ersetzt das direkte Rendern von UnifiedFeed in der /Home Route.
//   Zeigt zuerst Mission Control (Briefing), dann den Feed (lebendiger Strom).
//   Der Feed beginnt NACH Mission Control — nicht davor.
//
// ARCHITEKTUR:
//   DesktopDataProvider umschließt alles — Mission Control und RightPanel
//   teilen sich dieselbe Dateninstanz (keine doppelten Queries).
//
// PERFORMANCE:
//   - Mission Control und RightPanel rendern parallel zum Feed.
//   - Keine Blockierung: der Feed startet sofort, Mission Control fade-in
//     mit 0ms/70ms/140ms/210ms Verzögerung (staggered).
//   - DesktopDataProvider nutzt bestehende Hooks — kein zusätzlicher Request.
//
// FEED:
//   Der Feed bleibt unverändert — UnifiedFeed wird 1:1 gerendert.
//   Nur der Container bekommt Desktop-CSS (mehr Whitespace, Hover).
// ══════════════════════════════════════════════════════════════════════════════

import React, { Suspense, lazy } from 'react';
import { DesktopDataProvider } from './DesktopDataContext.jsx';
import DesktopMissionControl from './DesktopMissionControl.jsx';
import DesktopFeedWrapper from './DesktopFeedWrapper.jsx';

// Lazy load UnifiedFeed — nicht blockierend für Mission Control
const UnifiedFeed = lazy(() => import('../../feed/UnifiedFeed.jsx'));

// ── Feed Loading Placeholder ──────────────────────────────────────────────────
function FeedLoading() {
  return (
    <div className="desktop-feed-loading">
      <div className="feed-loading-shimmer" />
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopHome() {
  return (
    <DesktopDataProvider>
      <div className="desktop-home">
        {/* ── Mission Control (Briefing) ──────────────────────────── */}
        <DesktopMissionControl />

        {/* ── Divider zwischen Mission Control und Feed ────────────── */}
        <div className="desktop-home-divider" />

        {/* ── Feed Header (sticky) ─────────────────────────────────── */}
        <div className="desktop-feed-header">
          <h3 className="desktop-feed-header-title">Der Strom</h3>
          <div className="desktop-feed-header-meta">
            <span className="desktop-feed-header-badge">Neueste</span>
          </div>
        </div>

        {/* ── Feed (lebendiger Strom) ──────────────────────────────── */}
        <DesktopFeedWrapper columns={1}>
          <Suspense fallback={<FeedLoading />}>
            <UnifiedFeed />
          </Suspense>
        </DesktopFeedWrapper>
      </div>
    </DesktopDataProvider>
  );
}
