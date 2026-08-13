CREATE OR REPLACE FUNCTION public.rpc_get_orb_growth_stage(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_talent      boolean := false;
  v_has_content    boolean := false;
  v_total_activity integer := 0;
  v_stage          integer := 1;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 1;
  END IF;

  SELECT COALESCE(is_talent, false) INTO v_is_talent
  FROM profiles WHERE id = p_user_id;

  IF NOT v_is_talent THEN
    SELECT EXISTS(SELECT 1 FROM talents WHERE user_id = p_user_id) INTO v_is_talent;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM works       WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM moments     WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM experiences WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM talents     WHERE user_id = p_user_id
  ) INTO v_has_content;

  SELECT
    (SELECT COUNT(*) FROM follows WHERE follower_id = p_user_id)
    + (SELECT COUNT(*) FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.customer_id = p_user_id AND o.state = 'paid')
    + (SELECT COUNT(*) FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.seller_id = p_user_id AND o.state = 'paid')
    + (SELECT COUNT(*) FROM talent_bookings
         WHERE customer_id = p_user_id AND status = 'confirmed')
    + (SELECT COUNT(*) FROM talent_bookings
         WHERE seller_id = p_user_id AND status = 'confirmed')
  INTO v_total_activity;

  IF v_total_activity > 10 THEN
    v_stage := 6;
  ELSIF v_total_activity > 5 THEN
    v_stage := 5;
  ELSIF v_total_activity > 0 THEN
    v_stage := 4;
  ELSIF v_has_content THEN
    v_stage := 3;
  ELSIF v_is_talent THEN
    v_stage := 2;
  ELSE
    v_stage := 1;
  END IF;

  RETURN v_stage;
END;
$function$
;
