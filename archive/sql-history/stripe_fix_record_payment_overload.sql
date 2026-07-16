-- Fix: PostgREST-Overload-Konflikt bei rpc_record_payment beheben.
-- Alte 7-Arg-Signatur explizit droppen, nur die neue 8-Arg-Version (mit p_metadata) behalten.
SET search_path = public;

DROP FUNCTION IF EXISTS public.rpc_record_payment(text, text, integer, text, text, uuid, text);

NOTIFY pgrst, 'reload schema';
