// ══════════════════════════════════════════════════════════════════════════════
// DesktopDataContext.jsx — Shared Data für Mission Control + Wirkungsraum
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Lädt ALLE Daten, die Mission Control und RightPanel gemeinsam brauchen,
//   EINMAL — nicht pro Komponente. Verhindert doppelte Supabase Queries.
//
// DATENQUELLEN (alle aus bestehenden Hooks/Services — keine neuen Queries):
//   useStripeImpactPool()  — Impact-Pool Daten
//   useLiveTickerContext()  — Live Aktivitäts-Items (bereits appweit via Provider)
//   useNotifCount()         — Unread Notifications (bereits via AppStateContext)
//   useDiscoverData()       — Neue Werke + Talente
//   useTalentBookings()     — Buchungen (als Kunde + als Wirker)
//
// PERFORMANCE:
//   - useDiscoverData und useTalentBookings sind lazy — sie laden erst,
//     wenn DesktopDataProvider mountet (nur auf Home-Route).
//   - useStripeImpactPool cached 30s via cachedQuery.
//   - useLiveTickerContext pollt 90s (bereits appweit aktiv).
//   - useNotifCount läuft bereits via AppStateContext.
//   - Keine zusätzlichen Queries: jede Datenquelle wird genau EINMAL geladen.
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useNotifCount, useDiscoverData } from '../../lib/AppStateContext.jsx';
import { useLiveTickerContext } from '../../context/LiveTickerContext.jsx';
import { useStripeImpactPool } from '../../hooks/useStripeImpactPool.js';
import { useTalentBookings } from '../../hooks/useTalentBookings.js';

const DesktopDataContext = createContext(null);

export function DesktopDataProvider({ children }) {
  const { user, profile } = useAuth();
  const notifCount = useNotifCount();
  const liveTicker = useLiveTickerContext();
  const impactPool = useStripeImpactPool();
  const discover = useDiscoverData({ enabled: true, limit: 6 });
  const bookings = useTalentBookings(user?.id);

  const value = useMemo(() => ({
    // ── User ───────────────────────────────────────────────────
    user,
    profile,
    notifCount,

    // ── Impact ──────────────────────────────────────────────────
    impact: {
      totalEur:    impactPool.totalEur,
      projectEur:  impactPool.projectEur,
      fmtTotal:    impactPool.fmtTotal,
      fmtProject:  impactPool.fmtProject,
      history:     impactPool.history,
      loading:      impactPool.loading,
    },

    // ── Live Activity (Resonanz) ────────────────────────────────
    activity: {
      items:    liveTicker.items || [],
      loading:  liveTicker.loading,
    },

    // ── Discover (Heute möglich) ────────────────────────────────
    discover: {
      works:    discover.works || [],
      talents:  discover.talents || [],
      loading:  discover.loading,
    },

    // ── Bookings (Mein nächster Schritt + Termine) ──────────────
    bookings: {
      asCustomer: bookings.asCustomer || [],
      asSeller:   bookings.asSeller || [],
      loading:     bookings.loading,
    },
  }), [
    user, profile, notifCount,
    impactPool.totalEur, impactPool.projectEur, impactPool.fmtTotal,
    impactPool.fmtProject, impactPool.history, impactPool.loading,
    liveTicker.items, liveTicker.loading,
    discover.works, discover.talents, discover.loading,
    bookings.asCustomer, bookings.asSeller, bookings.loading,
  ]);

  return (
    <DesktopDataContext.Provider value={value}>
      {children}
    </DesktopDataContext.Provider>
  );
}

export function useDesktopData() {
  const ctx = useContext(DesktopDataContext);
  if (!ctx) {
    // Fallback — verhindert Crash wenn außerhalb des Providers
    return {
      user: null, profile: null, notifCount: 0,
      impact: { totalEur: 0, projectEur: 0, fmtTotal: '€0.00', fmtProject: '€0.00', history: [], loading: true },
      activity: { items: [], loading: true },
      discover: { works: [], talents: [], loading: true },
      bookings: { asCustomer: [], asSeller: [], loading: true },
    };
  }
  return ctx;
}

export default DesktopDataContext;
