# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

HUI ("Human United Intelligent") is a German-language React SPA (Vite + React 18 + Tailwind CSS) that talks directly to a hosted Supabase backend. There is no custom backend server; the frontend connects to Supabase for auth, database, storage, and realtime features.

### Running the dev server

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default. Without Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`), the app still loads using a built-in no-op fallback — auth flows show "Supabase nicht konfiguriert" but the UI renders. The `/login` and `/diagnose` pages are publicly accessible without authentication.

### Lint / Build / Scripts

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Lint + fix | `npm run lint:fix` |
| Build | `npm run build` |
| Preview (prod build) | `npm run preview` |

ESLint is configured in `eslint.config.js` (flat config). Pre-existing lint warnings (unused imports) exist in the codebase — these are not blockers.

### Key caveats

- **No test framework**: The project has no automated test suite (`package.json` has no `test` script). Validation is done via lint, build, and manual UI testing.
- **German UI**: All text, comments, and error messages are in German.
- **Package manager**: Use `npm` (lockfile is `package-lock.json`). Do not use yarn or pnpm.
- **Path alias**: `@` is mapped to `./src` in `vite.config.js` and `jsconfig.json`.
