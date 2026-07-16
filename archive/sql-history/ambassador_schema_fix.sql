
-- Prüfe und setze Schema explizit
SET search_path = public;

DROP FUNCTION IF EXISTS public.rpc_get_ambassador_referrals(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.rpc_get_ambassador_referrals(p_ambassador_id uuid)
RETURNS TABLE (
  id                   uuid,
  display_name         text,
  username             text,
  avatar_url           text,
  email                text,
  phone                text,
  role                 text,
  created_at           timestamptz,
  first_transaction_at timestamptz,
  is_active            boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.display_name, p.username, p.email, '-')::text,
    p.username,
    p.avatar_url,
    p.email,
    p.phone,
    p.role,
    p.created_at,
    p.first_transaction_at,
    (p.first_transaction_at IS NOT NULL)
  FROM public.profiles p
  WHERE p.referred_by = p_ambassador_id
  ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_ambassador_referrals(uuid) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.rpc_get_all_ambassadors() CASCADE;
CREATE OR REPLACE FUNCTION public.rpc_get_all_ambassadors()
RETURNS TABLE (
  id                uuid,
  username          text,
  display_name      text,
  email             text,
  phone             text,
  avatar_url        text,
  ambassador_status text,
  referral_count    bigint,
  ref_link          text,
  created_at        timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    COALESCE(p.display_name, p.username, p.email, '-')::text,
    p.email,
    p.phone,
    p.avatar_url,
    p.ambassador_status,
    (SELECT COUNT(*) FROM public.profiles r WHERE r.referred_by = p.id),
    ('https://be-hui.com/' || COALESCE(p.username,''))::text,
    p.created_at
  FROM public.profiles p
  WHERE p.role = 'ambassador' OR p.is_ambassador = true
  ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_get_all_ambassadors() TO anon, authenticated, service_role;

-- PostgREST reload
NOTIFY pgrst, 'reload schema';
