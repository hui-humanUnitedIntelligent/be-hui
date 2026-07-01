# HUI Release Engineering — Phase 1.1 (Release Blocker)

**Branch:** `cursor/hui-release-phase-1-1-fb1f`  
**Datum:** 2026-07-01  
**Scope:** P0-Probleme ausschließlich — keine Designänderungen, keine Refactorings außerhalb des beschriebenen Umfangs.

---

## Zusammenfassung

Alle vier P0-Bereiche wurden adressiert:

| Bereich | Status |
|---------|--------|
| Commerce (Edge Functions, Routes) | ✅ Edge Functions erreichbar; Checkout-Routen registriert |
| Sicherheit (Admin/Dev Guards) | ✅ Implementiert |
| Kritische Bugs (EmailBlock, Checkout-Routen) | ✅ Behoben |
| Commerce-Vereinheitlichung | ✅ Legacy-UI-Einstiegspunkte entfernt |

**Build:** `npm run build` erfolgreich  
**Geänderte Dateien:** Keine neuen ESLint-Fehler in den bearbeiteten Dateien (bestehende Projekt-weite Lint-Warnungen unverändert).

---

## 1. Commerce

### Edge Functions (Supabase)

Alle vier Commerce-Functions antworten mit erwarteten Statuscodes (Handler erreichbar):

| Function | HTTP | Bedeutung |
|----------|------|-----------|
| `create-payment-intent` | 401 | Auth erforderlich — healthy |
| `handle-payment-webhook` | 400 | Signatur/Body erforderlich — healthy |
| `check-order-status` | 401 | Auth erforderlich — healthy |
| `release-payout` | 401 | Auth erforderlich — healthy |

### Stripe-Konfiguration

- `src/config/stripeConfig.js`: `CHECKOUT_URLS.success` und `.cancel` zeigen auf `/checkout/success` bzw. `/checkout/cancel` — Routen sind jetzt registriert.
- Edge Functions lesen `STRIPE_SECRET_KEY` aus Supabase Secrets (Deploy via `.github/workflows/deploy-supabase-functions.yml`).

### go-live-validation.js

Lokaler Lauf (ohne CI-Secrets):

- ✅ Phase 2: Edge Functions
- ✅ Phase 8: Frontend Build
- ❌ Phase 1/3–7: Erfordert `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (in GitHub Actions Secrets konfiguriert)

Vollständiger E2E-Lauf erfolgt in CI (`.github/workflows/go-live-validation.yml`) mit den hinterlegten Secrets.

---

## 2. Sicherheit

### Admin-Role-Guard

Neue Route-Wrapper in `src/App.jsx`:

- **`AdminRoute`**: Prüft `isProfileAdmin(profile)` — Zugriff nur für Administratoren.
- **`DevRoute`**: Nur in `import.meta.env.DEV` — Produktion leitet auf `/Home` um.

Admin-Erkennung (`src/lib/profileUtils.js` → `isProfileAdmin`):

- `profile.membership_type === 'admin'` (aligniert mit `release-payout` Edge Function)
- `profile.role IN ('superadmin', 'admin', 'employee')` (aligniert mit RLS-Migrationen)

| Route | Guard |
|-------|-------|
| `/Admin` | `AdminRoute` |
| `/dashboard` | `AdminRoute` |
| `/diagnose` | `DevRoute` (nur Entwicklung) |

`AuthContext` exponiert jetzt `isAdmin` und liest `membershipType` aus dem Profil.

---

## 3. Kritische Bugs

### EmailBlock ReferenceError (SettingsModal)

**Problem:** `authCtxProfile` wurde in `EmailBlock` referenziert, war aber nur im Parent-Scope definiert → `ReferenceError` beim Öffnen von „Persönliche Daten & Kontakt".

**Fix:** `EmailBlock` nutzt `useAuth()` direkt und liest `user?.email`.

### Checkout-Routen

Neu registriert in `src/App.jsx`:

- `/checkout/success` → `CheckoutSuccess.jsx`
- `/checkout/cancel` → `CheckoutCancel.jsx`

Öffentlich erreichbar (Stripe Redirect Return URLs).

---

## 4. Commerce-Vereinheitlichung

Legacy-Einstiegspunkte **WerkKaufFlow** und **ExperienceBookingFlow** aus der UI entfernt. Commerce 2.0 (WerkeKorb → UnterstutzenFlow → StripePaymentStep) ist der einzige Kauf-/Buchungsweg.

### Umgeleitete Einstiegspunkte

| Vorher | Nachher |
|--------|---------|
| WorkDetailPage → `pendingWerkKauf` → WerkKaufFlow | → Werkekorb (`addToCommerceCart`) |
| DiscoverPage `onBook` → ExperienceBookingFlow | → Werkekorb |
| `BOOK_EXPERIENCE` Action → ExperienceBookingFlow | → Werkekorb |
| UnifiedFeed `onBook` | → Werkekorb (via `addToCommerceCart`) |

Neue Hilfsfunktionen in `commerceUtils.js`:

- `normalizeToCartItem()` — normalisiert Werk/Erlebnis-Payloads
- `addToCommerceCart()` — idempotentes Hinzufügen zum Cart

Legacy-Dateien `WerkKaufFlow.jsx` und `ExperienceBookingFlow.jsx` bleiben im Repo (Phase-5-Cleanup), sind aber nicht mehr aus der UI erreichbar.

---

## Geänderte Dateien

```
src/App.jsx
src/components/commerce/commerceUtils.js
src/components/home/HomeShell.jsx
src/components/settings/SettingsModal.jsx
src/core/hui.actions.js
src/lib/AuthContext.jsx
src/lib/profileUtils.js
src/pages/DiscoverPage.jsx
src/pages/Home.jsx
RELEASE_PHASE_1_1.md
```

---

## Verifikation

```bash
npm run build          # ✅ erfolgreich
node go-live-validation.js  # ✅ Edge Functions + Build (Secrets für vollständigen Lauf in CI)
```
