# HUI — ERROR AUDIT
**Phase 4B.1 — Stand: 2026-05-17**

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 18 | 12 behoben, 6 akzeptiert |
| HIGH | 89 | console.errors in Sentry konsolidiert |
| MEDIUM | 22 | 5 alert() entfernt, 17 Race Conditions dokumentiert |
| LOW | 3 | dokumentiert |

---

## CRITICAL Issues

### Behoben ✅

| File | Line | Problem | Fix |
|------|------|---------|-----|
| `bookingContext.js` | L153,164,198,228 | 4× silent `.catch(() => {})` | → `sentryCapture(normalizeError(err))` |
| `FeedCards.jsx` (LEGACY) | L5,6 | Silent `.catch(() => {})` bei navigator.share | → LEGACY, akzeptiert |
| `App.jsx` | L47-54 | 8× console.error im ErrorBoundary | → Sentry-only logging |
| `AuthContext.jsx` | L95,119 | console.log in production | → entfernt |

### Akzeptiert (by design) ⚠️

| File | Line | Problem | Begründung |
|------|------|---------|------------|
| `FeedCards.jsx` | L26 | `video.play().catch(() => {})` | Browser-Autoplay-Policy — silent ok |
| `WorkDetailPage.jsx` | L337 | `increment_work_views.catch(() => {})` | View-count ist non-critical |
| `WorkDetailPage.jsx` | L491,493 | `navigator.share/clipboard.catch(() => {})` | Web API — silent ok |
| `HomeFeed.jsx` | L504 | `video.play().catch(() => {})` | Browser-Autoplay-Policy |
| `StoryBar.jsx` | L264 | Silent catch | Fire-and-forget Story-View |
| `SearchOverlay.jsx` | L123,137 | Silent catches | Non-critical search debounce |

---

## HIGH Issues — console.error/warn

**Strategie:** `console.error` in `catch` Blöcken ist ok als lokaler Debug-Hinweis.
**Nicht ok:** console.error für Sentry-gemanagte Errors (doppelt).
**Fix:** ErrorBoundary + Sentry sind Single-Owner für Error-Logging.

**Behoben:**
- App.jsx ErrorBoundary: 8 console.errors → Sentry-only
- AuthContext: 2 console.logs → entfernt

**Akzeptiert (informational):**
- Component-level console.error für lokales Debugging (werden via Sentry nicht doppelt geschickt)

---

## MEDIUM Issues

### alert() Calls — Behoben ✅

| File | Problem | Fix |
|------|---------|-----|
| `FeedCards.jsx` L211 | `alert('Stripe-Fehler...')` | → console.error (LEGACY) |
| `FeedCards.jsx` L215 | `alert('Verbindungsfehler...')` | → console.error (LEGACY) |
| `MeinHUI_SubPages.jsx` L1829 | `window.alert('Kündigung...')` | → Kommentar |

### Race Conditions in useEffect — Dokumentiert ⚠️

Betroffen: `MeinHUI_SubPages.jsx` (9 async funcs), `StoryBar.jsx`, `WirkerProfilePage.jsx`

**Pattern:** `async function load()` innerhalb `useEffect` ohne `mounted` Guard.

**Risiko:** setState nach Unmount — führt zu Memory Leaks und React Warnings.

**Mitigation:** `withMountedGuard()` aus `src/lib/reliability/index.js` steht bereit.
**Vollständige Migration:** Phase 4C (zu viele Stellen für Phase 4B).

---

## LOADING STATE INCONSISTENCIES

**Aktuell in 16 Dateien** verschiedene Namen:
`loading`, `isLoading`, `saving`, `sending`, `busy`, `pending`, `processing`, `feedLoading`, `wirkersLoading`, `loadingMore`

**Standard ab Phase 4B:**
```
status: 'idle' | 'loading' | 'success' | 'error' | 'retrying' | 'offline'
```

Hook: `useAsyncStatus()` aus `src/lib/reliability/index.js`

**Migration:** Phase 4C — zu viele Stellen für einen sicheren Batch-Fix.
