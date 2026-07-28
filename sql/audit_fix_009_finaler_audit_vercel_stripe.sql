-- =============================================================================
-- AUDIT FIX 009 — Finale Erkenntnisse: Vercel, Stripe Column, Tailwind
-- Datum: 2026-07-28
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIZIERTE FAKTEN (kein Fix nötig):
-- ═══════════════════════════════════════════════════════════════════════

-- ✅ KRITISCH 1: vite.config.js + capacitor.config.json outDir: 'www'
--    BEWUSSTE DESIGN-ENTSCHEIDUNG: Pre-Built Deploy (Capacitor + Vercel)
--    www/ ist committed → Vercel deployed direkt (buildCommand: ":" = No-Op)
--    Kein Fehler — konsistente Entscheidung für Capacitor-Android-Build

-- ✅ KRITISCH 2: vercel.json buildCommand: ":" = kein Build
--    www/ ist im Git-Repository committed und wird lokal gebaut.
--    Vercel deployed deterministisch den letzten committed Build.
--    Pflicht: npm run build + git add www/ nach jeder Änderung (dokumentiert in DEPLOY.md)

-- ✅ KRITISCH 3: stripe_payments.stripe_payment_id vs id Konflikt
--    BEIDE Spalten existieren in DB:
--      - stripe_payments.id = TEXT = interner PK (kann auch pi_... sein)
--      - stripe_payments.stripe_payment_id = TEXT = Stripe Payment Intent ID (alle 33 befüllt)
--    stripe_refunds referenziert stripe_payment_id → konsistent
--    rpc_handle_refund: NICHT in DB → kein aktiver Column-Konflikt

-- ✅ HOCH: tailwind.config.js — shadcn/ui Tokens ohne @radix-ui
--    accordion-down/up Keyframes: '--radix-accordion-content-height' referenziert
--    ABER: accordion wird NIRGENDS in src/ importiert → kein UI-Impact
--    sidebar-Farbtokens: --sidebar-background etc. nicht in index.css → immer leer
--    FIX: tailwind.config.js bereinigt — tote shadcn-Boilerplate entfernt

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1 (Code-seitig): tailwind.config.js
-- Entfernt: accordion-Keyframes (radix-abhängig, nie genutzt)
--            sidebar-Farbtoken-Block (CSS-Vars nie definiert, nie genutzt)
--            chart-1 bis chart-5 Tokens (nie genutzt)
-- ═══════════════════════════════════════════════════════════════════════
-- (Geändert in tailwind.config.js — nicht SQL-deploybar)
-- Vorher: 2429 Zeichen (shadcn-Boilerplate)
-- Nachher: 1358 Zeichen (nur aktiv genutzte HUI-Tokens)

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2 (Code-seitig): DEPLOY.md
-- Vorher: Enthielt sensible Credentials (Supabase Anon Key)
-- Nachher: Vollständige Deployment-Dokumentation OHNE Secrets
--          buildCommand=":" explizit erklärt (Pre-Built Deploy Modell)
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFIKATION (informell — keine DB-Änderungen)
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  'stripe_payments_beide_spalten_existent' AS check_name,
  COUNT(*)::text AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stripe_payments'
  AND column_name IN ('id', 'stripe_payment_id')
UNION ALL
SELECT
  'stripe_payment_id_100pct_befuellt',
  (COUNT(*) = COUNT(stripe_payment_id))::text
FROM stripe_payments
UNION ALL
SELECT
  'rpc_handle_refund_nicht_in_db',
  (COUNT(*) = 0)::text
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'rpc_handle_refund';
