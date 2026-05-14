# HUI Edge Functions — Deployment Guide

## Prerequisites
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Deploy all Edge Functions
```bash
supabase functions deploy distribute-impact-round
supabase functions deploy cast-impact-vote  
supabase functions deploy release-escrow
```

## Required SQL helper functions (run in Supabase SQL Editor AFTER hui_schema_v8_production.sql)

```sql
-- Increment project vote count (atomic)
CREATE OR REPLACE FUNCTION increment_project_votes(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE impact_projects
  SET votes = votes + 1,
      updated_at = NOW()
  WHERE id = p_project_id;
END;
$$;

-- Increment wirker impact_eur (atomic)
CREATE OR REPLACE FUNCTION increment_impact_pool(p_wirker_id uuid, p_amount_eur numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Update wirker profile
  UPDATE wirker_profiles
  SET impact_eur = COALESCE(impact_eur, 0) + p_amount_eur,
      updated_at = NOW()
  WHERE user_id = p_wirker_id;

  -- Update user profile
  UPDATE profiles
  SET impact_eur = COALESCE(impact_eur, 0) + p_amount_eur,
      updated_at = NOW()
  WHERE id = p_wirker_id;
END;
$$;
```

## Test Edge Functions locally
```bash
supabase functions serve
curl -X POST http://localhost:54321/functions/v1/cast-impact-vote \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"uuid","round_id":"uuid"}'
```

## Environment Variables (set in Supabase Dashboard)
- SUPABASE_URL: auto-injected
- SUPABASE_SERVICE_ROLE_KEY: auto-injected
- STRIPE_SECRET_KEY: set manually for payment functions

## Security
- distribute-impact-round: admin-only
- cast-impact-vote: any authenticated user
- release-escrow: booking owner only
- All use SUPABASE_SERVICE_ROLE_KEY — never expose client-side
