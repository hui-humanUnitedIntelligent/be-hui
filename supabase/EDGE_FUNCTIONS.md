# HUI Edge Functions — Deployment Guide

## Commerce 2.0 — Kanonische Functions

```bash
supabase functions deploy create-payment-intent
supabase functions deploy handle-payment-webhook
supabase functions deploy check-order-status
supabase functions deploy release-payout
supabase functions deploy distribute-impact-round
```

**Voraussetzung:** Migration `hui_057_commerce_schema_final.sql` ausgeführt.

Siehe `DEPLOY.md` und `supabase/COMMERCE_RUNTIME_STATUS.md`.

---

## Legacy Functions (nicht Commerce-Checkout)

```bash
# LEGACY — REMOVE AFTER PHASE 5
supabase functions deploy release-escrow
supabase functions deploy cast-impact-vote
```

---

## Prerequisites

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Environment Variables (Supabase Dashboard)

- `SUPABASE_URL`: auto-injected
- `SUPABASE_SERVICE_ROLE_KEY`: auto-injected
- `STRIPE_SECRET_KEY`: manuell für Payment-Functions
- `STRIPE_WEBHOOK_SECRET`: manuell für `handle-payment-webhook`

## Security

- `distribute-impact-round`: admin-only
- `release-payout`: admin-only
- `create-payment-intent`, `check-order-status`: authenticated user
- `handle-payment-webhook`: Stripe signature verification
- Alle nutzen `SUPABASE_SERVICE_ROLE_KEY` serverseitig — nie clientseitig exponieren
