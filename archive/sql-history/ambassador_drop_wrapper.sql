
-- Wrapper der die alten Funktionen sauber löscht
CREATE OR REPLACE FUNCTION rpc_drop_and_recreate_ambassador_funcs()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  fn_oid oid;
  fn_sig text;
  dropped text[] := '{}';
BEGIN
  -- Drop referrals
  FOR fn_oid IN SELECT oid FROM pg_proc WHERE proname = 'rpc_get_ambassador_referrals' LOOP
    SELECT p.oid::regprocedure::text INTO fn_sig FROM pg_proc p WHERE p.oid = fn_oid;
    EXECUTE 'DROP FUNCTION ' || fn_sig || ' CASCADE';
    dropped := dropped || fn_sig;
  END LOOP;

  -- Drop get_all_ambassadors
  FOR fn_oid IN SELECT oid FROM pg_proc WHERE proname = 'rpc_get_all_ambassadors' LOOP
    SELECT p.oid::regprocedure::text INTO fn_sig FROM pg_proc p WHERE p.oid = fn_oid;
    EXECUTE 'DROP FUNCTION ' || fn_sig || ' CASCADE';
    dropped := dropped || fn_sig;
  END LOOP;

  RETURN jsonb_build_object('dropped', dropped);
END;
$$;
GRANT EXECUTE ON FUNCTION rpc_drop_and_recreate_ambassador_funcs() TO authenticated;
