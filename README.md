# HUI — Human United Intelligence

**HUI** ist eine mobile-first Web-Applikation für Kreative, Talente und Wirkende.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
- **Payments:** Stripe (Commerce 2.0, Balanced Growth Model)
- **Mobile:** Capacitor 6 (Android APK)
- **Deployment:** Vercel (Web) + GitHub Actions

## Lokale Entwicklung

```bash
npm install
npm run dev          # Vite Dev-Server → http://localhost:5173
npm run build        # Produktions-Build → dist/
npm run preview      # Build lokal testen
```

## Android Build

```bash
npm run build        # 1. Vite-Build erstellen
npm run sync         # 2. dist/ → Android Assets syncen
npm run android      # 3. Android Studio öffnen
```

## Umgebungsvariablen

Erstelle `.env.local` basierend auf `.env.example`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_STRIPE_PUBLIC_KEY=pk_...
```

> ⚠️ Niemals echte Keys in `.env.local` committen oder in öffentlichen Dateien ablegen.

## Architektur

```
hui.actions.js (Dispatcher)
    ↓
HomeShell.jsx (State-Management, 22+ Overlays)
    ↓
Home.jsx (Render-Gate via SafeRender + ErrorBoundary)
```

Dokumentation: `docs/` | SQL-Migrationen: `sql/` | Audit-Fixes: `sql/audit_fix_*.sql`

## Branches

- `main` — produktiver Stand, direkt deployed
- `cursor/*` — Feature-Branches (Cursor AI)

## Team

Superadmins: Sascha, Lars, Michael  
Support: support@hui.community
