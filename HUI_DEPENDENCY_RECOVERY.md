# HUI Dependency Recovery

**Datum:** 2026-07-14  
**Repository:** be-hui  
**Ziel:** `package.json` vollständig mit dem aktuellen Codebestand synchronisieren — ohne Produkt-, Feed-, CSS- oder Refactoring-Änderungen.

---

## Ausgangslage

Der Build war blockiert, weil `package.json` stark reduziert wurde und nicht mehr zu den tatsächlichen Imports im Quellcode passte. Der fehlerhafte Paketname `stripe-js` (existiert nicht auf npm) verhinderte bereits `npm install`.

---

## Analyse-Methode

1. Vollständiger Scan aller Import-/Require-/Dynamic-Import-Statements in `src/`, `scripts/` und Build-/Lint-Konfigurationsdateien (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `go-live-validation.js`).
2. Ausschluss von relativen Imports (`./`, `../`), Path-Aliases (`@/`), Node-Builtins (`node:*`, `fs`, `path`, …) und Deno/URL-Imports (`https://…`).
3. Abgleich mit der bestehenden `package.json`.

---

## Geänderte Dependencies

### Entfernt (nicht im Code verwendet)

| Paket | Grund |
|---|---|
| `stripe-js` | **Tippfehler** — korrektes Paket ist `@stripe/stripe-js` |
| `moment` | Kein Import im gesamten `src/`-Baum |
| `@capacitor/android` | Kein Import im Quellcode |
| `@capacitor/core` | Kein Import im Quellcode |
| `@capacitor/cli` | Kein Import im Quellcode (nur frühere `sync`/`android`-Scripts) |

### Hinzugefügt (im Code importiert, fehlten in package.json)

| Paket | Version | Grund |
|---|---|---|
| `@stripe/stripe-js` | `^5.2.0` | `loadStripe` in `src/lib/stripe.js`, `src/components/commerce/StripePaymentStep.jsx` |
| `@stripe/react-stripe-js` | `^3.0.0` | `Elements`, `PaymentElement` in Stripe-Komponenten |
| `@sentry/react` | `^8.28.0` | Runtime-Monitoring in `src/lib/sentry.js` |
| `@tanstack/react-virtual` | `^3.10.9` | Virtualisiertes Feed-Rendering in `src/feed/UnifiedFeed.jsx` |
| `react-router-dom` | `^6.26.0` | Routing in `src/App.jsx` und mehreren Pages/Components |
| `jspdf` | `^4.0.0` | Dynamischer Import für PDF-Export in `src/components/studio/StatistikenModal.jsx` |
| `tailwindcss-animate` | `^1.0.7` | Plugin in `tailwind.config.js` |
| `eslint` | `^9.19.0` | Erforderlich für `eslint.config.js` |
| `@eslint/js` | `^9.19.0` | Flat-Config-Basis in `eslint.config.js` |
| `eslint-plugin-react` | `^7.37.4` | React-Linting in `eslint.config.js` |
| `eslint-plugin-react-hooks` | `^5.0.0` | Hooks-Regeln in `eslint.config.js` |
| `eslint-plugin-unused-imports` | `^4.3.0` | Unused-Import-Regeln in `eslint.config.js` |
| `globals` | `^15.14.0` | Browser-Globals in `eslint.config.js` |
| `stripe` | `^14.25.0` (dev) | Dynamischer Import in `go-live-validation.js` (Webhook-Test-Fallback) |

### Beibehalten / korrigiert

| Paket | Version | Grund |
|---|---|---|
| `react` | `^18.2.0` | Kern-Framework — 180+ Dateien |
| `react-dom` | `^18.2.0` | `createRoot`, `createPortal` |
| `@supabase/supabase-js` | `^2.105.3` | `createClient` in `src/lib/supabaseClient.js` (Version an Lockfile angeglichen) |
| `vite` | `^6.4.1` | Build-Tool |
| `@vitejs/plugin-react` | `^4.3.4` | React-Plugin für Vite |
| `tailwindcss` | `^3.4.17` | `@tailwind`-Direktiven in `src/index.css` |
| `autoprefixer` | `^10.4.20` | PostCSS-Plugin in `postcss.config.js` |
| `postcss` | `^8.5.3` | PostCSS-Pipeline für Tailwind |

### Bewusst nicht aufgenommen

Pakete aus dem früheren, überdimensionierten Lockfile (z. B. `@radix-ui/*`, `framer-motion`, `lucide-react`, `recharts`, `@base44/sdk`, …) wurden **nicht** hinzugefügt, da sie im aktuellen `src/`-Code nicht importiert werden.

---

## Scripts-Anpassung

| Script | Änderung | Grund |
|---|---|---|
| `sync` | Entfernt | `@capacitor/cli` nicht mehr als Dependency |
| `android` | Entfernt | `@capacitor/cli` nicht mehr als Dependency |

`dev`, `build` und `preview` unverändert.

---

## Build-Ergebnis

```
npm install   → exit 0 (376 packages, 0 vulnerabilities)
npm run build → exit 0 (vite v6.4.3, 805 modules, built in ~5s)
```

**Output-Verzeichnis:** `dist/`  
**Hinweise beim Build:** Es gibt bestehende JSX-Warnungen (doppelte `style`-Attribute) und Chunk-Size-Warnungen — diese sind vorbestehend und wurden nicht angefasst (keine Codeänderungen).

---

## Definition of Done

| Kriterium | Status |
|---|---|
| `npm install` erfolgreich | ✅ |
| `npm run build` erfolgreich | ✅ |
| `package.json` konsistent mit Imports | ✅ |
| Keine Produktänderungen | ✅ |
| Keine Codeänderungen außerhalb package.json / package-lock.json | ✅ |
