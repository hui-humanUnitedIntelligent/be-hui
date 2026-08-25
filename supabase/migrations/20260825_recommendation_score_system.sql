-- 20260825_recommendation_score_system.sql
-- Empfehlungs-Prozent- und Ranking-System
-- 1. is_positive Spalte zur recommendations-Tabelle
-- 2. RPC rpc_get_recommendation_score
-- 3. rpc_buyer_confirm_with_review: is_positive=true + SADB event
-- 4. rpc_buyer_dispute_with_reason: negative Empfehlung in recommendations + SADB event

-- 1. is_positive Spalte
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS is_positive BOOLEAN DEFAULT true;

-- Bestehende Empfehlungen auf true setzen
UPDATE public.recommendations SET is_positive = true WHERE is_positive IS NULL;

-- 2. RPC für Score-Berechnung
CREATE OR REPLACE FUNCTION public.rpc_get_recommendation_score(p_user_id uuid)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN
        jsonb_build_object('positive_count', 0, 'negative_count', 0, 'total_count', 0, 'score_percentage', 100)
      ELSE
        jsonb_build_object(
          'positive_count', COUNT(*) FILTER (WHERE is_positive = true),
          'negative_count', COUNT(*) FILTER (WHERE is_positive = false),
          'total_count', COUNT(*),
          'score_percentage',
            ROUND(
              (COUNT(*) FILTER (WHERE is_positive = true))::numeric / COUNT(*)::numeric * 100
            )
        )
    END
  FROM public.recommendations
  WHERE to_user_id = p_user_id
    AND deleted_at IS NULL;
$function$;

-- 3. & 4. RPCs werden direkt via Management API deployed (siehe Session-Log)
