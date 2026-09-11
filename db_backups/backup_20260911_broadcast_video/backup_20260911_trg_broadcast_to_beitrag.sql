CREATE OR REPLACE FUNCTION public.trg_broadcast_to_beitrag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO beitraege (user_id, type, caption, content, moment_source, visibility_scope)
  SELECT '152619c1-9adc-40bf-9078-eb67f5024ed2', 'gedanke',
         COALESCE(nr.title, 'Systemnachricht'), COALESCE(nr.body, ''),
         'system_broadcast', 'public'
  FROM (
    SELECT DISTINCT title, body
    FROM new_rows
    WHERE type IN ('broadcast', 'admin_broadcast')
  ) nr
  WHERE NOT EXISTS (
    SELECT 1 FROM beitraege b
    WHERE b.moment_source = 'system_broadcast'
      AND b.caption = COALESCE(nr.title, 'Systemnachricht')
      AND b.content = COALESCE(nr.body, '')
      AND b.created_at > now() - interval '5 minutes'
  );
  RETURN NULL;
END;
$function$
