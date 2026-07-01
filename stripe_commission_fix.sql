
SET search_path = public;

-- Fix: ON CONFLICT DO NOTHING für commissions
DROP FUNCTION IF EXISTS public.rpc_record_ambassador_commission(uuid, integer, text, text) CASCADE;
CREATE FUNCTION public.rpc_record_ambassador_commission(
  p_ambassador_id     uuid,
  p_amount            integer,
  p_stripe_payment_id text    DEFAULT NULL,
  p_currency          text    DEFAULT 'eur'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_ambassador_commissions(
    ambassador_id, stripe_payment_id, amount, currency, status
  )
  VALUES (p_ambassador_id, p_stripe_payment_id, p_amount, p_currency, 'pending')
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'amount', p_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_record_ambassador_commission(uuid, integer, text, text) TO service_role, authenticated;

NOTIFY pgrst, 'reload schema';
