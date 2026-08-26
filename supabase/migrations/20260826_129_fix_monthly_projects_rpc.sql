-- Migration 129: Fix rpc_get_monthly_projects return type mismatch
--
-- Problem: media_urls in impact_applications is text[] but the RPC
-- declared it as jsonb → 400 error on every call.
-- This was the 400 error visible in the F12 console screenshot.
--
-- Fix: DROP + recreate with correct return type text[]
-- Also: REVOKE anon execute on stock decrement RPCs (security hardening)

DROP FUNCTION IF EXISTS public.rpc_get_monthly_projects(text);

CREATE OR REPLACE FUNCTION public.rpc_get_monthly_projects(p_pool_month text DEFAULT NULL::text)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  short_desc text,
  cover_url text,
  media_urls text[],
  funding_goal numeric,
  current_amount_eur numeric,
  is_completed boolean,
  status text,
  votes bigint,
  "position" integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_month TEXT;
BEGIN
  v_month := COALESCE(p_pool_month, to_char(now(), 'YYYY-MM'));
  RETURN QUERY
  SELECT app.id, app.project_name, app.short_desc, app.cover_url, app.media_urls,
    COALESCE(app.funding_goal, 0), COALESCE(app.current_amount_eur, 0),
    COALESCE(app.is_completed, false), app.status,
    COALESCE(v.vote_count, 0)::BIGINT, mp."position", app.created_at
  FROM impact_monthly_projects mp
  INNER JOIN impact_applications app ON app.id = mp.project_id
  LEFT JOIN LATERAL (SELECT count(*) AS vote_count FROM impact_votes iv
    WHERE iv.project_id = mp.project_id AND iv.pool_month = v_month) v ON true
  WHERE mp.pool_month = v_month AND mp.is_active = true
  ORDER BY v.vote_count DESC, app.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_monthly_projects(text) TO authenticated, anon;

-- Security hardening: REVOKE anon execute on stock decrement RPCs
-- These are only called from edge functions with service_role key,
-- so anon access is unnecessary and a potential attack vector.
REVOKE EXECUTE ON FUNCTION public.rpc_decrement_stock(text, uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rpc_decrement_variant_stock(text, uuid, text, integer) FROM anon, public;
