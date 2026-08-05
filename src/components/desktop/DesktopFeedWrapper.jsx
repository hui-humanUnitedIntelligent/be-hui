// ══════════════════════════════════════════════════════════════════════════════
// DesktopFeedWrapper.jsx — Flexible Feed-Architektur
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Flexibler Container für den UnifiedFeed auf dem Desktop.
//   Passt sich an den verfügbaren Platz an.
//   Kein fester 2-Spalten-Feed — stattdessen eine Architektur,
//   die später verschiedene Darstellungen unterstützt.
//
// ARCHITEKTUR:
//   Der Wrapper rendert KEINE eigenen Feed-Cards.
//   Er umschließt den bestehenden UnifiedFeed (unverändert).
//   Die CSS-Klasse .desktop-feed-wrapper steuert das Layout.
//
// SUPPORTED LAYOUTS (via data-feed-columns Attribut):
//   data-feed-columns="1" — Single-Column (Default, maximale Lesbarkeit)
//   data-feed-columns="2" — Two-Column (ab Desktop-Breite)
//   data-feed-columns="3" — Three-Column (ab Ultrawide)
//
// PHASE 0:
//   Single-Column. Keine Logik-Änderung am Feed.
//   Die CSS-Infrastruktur für Multi-Column ist vorhanden
//   (in desktopFoundation.css), aber nicht aktiviert.
//
// REGEL:
//   Der Feed entscheidet später selbst, wie viele Spalten er nutzt.
//   Das geschieht über data-feed-columns, gesteuert durch den
//   Breakpoint-Hook oder Content-Typ — NICHT durch hardcodierte Werte.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';

export default function DesktopFeedWrapper({ children, columns = 1 }) {
  return (
    <div data-feed-columns={columns}>
      <div className="desktop-feed-wrapper">
        {children}
      </div>
    </div>
  );
}
