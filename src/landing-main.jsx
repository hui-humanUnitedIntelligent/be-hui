// ══════════════════════════════════════════════════════════════════════════════
// landing-main.jsx — HUI Public Landing Entry
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Minimaler Entry für die öffentliche Landingpage bei /.
//   KEIN React Router, KEIN AuthProvider, KEIN Supabase.
//   Nur LandingPage + Design CSS.
//
// ROUTING:
//   Vercel Rewrite: / → /landing.html → dieser Entry
//
// PERFORMANCE:
//   Keine App-Provider, keine Auth, keine Realtime, keine Supabase.
//   Nur React + LandingPage Komponente.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './components/landing/LandingPage.jsx';

// ── Styles ────────────────────────────────────────────────────────────────────
import './index.css';     // Shared Design System (CSS Variables, Fonts, Tailwind)
import './landing.css';   // Landing Page Styles

// ── Render ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('landing-root')).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
);
