-- 20260704_059_user_impact_totals.sql
-- ═══════════════════════════════════════════════════════════════════
-- ADMIN-USER-IMPACT-031 (2026-07-04): "Impact €"-Spalte im User-Management
-- (SADB + EDB) war seit jeher tot -- profiles.impact_eur existiert als
-- Spalte, wird aber von KEINEM Trigger/RPC/Edge-Function jemals
-- beschrieben (0 bei allen 103 Nutzern). Spalte bleibt bestehen
-- (nicht loeschen, additiv-Prinzip), wird aber nicht mehr gelesen.
--
-- Echte Quelle fuer "wie viel Impact-Euro hat dieser Nutzer durch
-- Kauf/Verkauf beigetragen": stripe_impact_pool.project_share (Cent,
-- = die reinen 15%-der-Gebuehr die an die sozialen Projekte gehen,
-- siehe rpc_process_order_fees), verknuepft ueber order_id mit
-- orders.customer_id (Kaeufer) bzw. order_items.seller_id (Verkaeufer,
-- anteilig nach unit_price_eur*quantity / order.total_eur gewichtet
-- fuer den -- aktuell nicht vorkommenden, aber moeglichen --
-- Mehrfach-Verkaeufer-Warenkorb-Fall).
--
-- Neue RPC (additiv, kein Bestandscode geaendert):
--   rpc_get_user_impact_totals() -> TABLE(user_id uuid, impact_eur numeric)
--
-- Verifiziert gegen Live-Daten (15 bezahlte Orders, 2026-07-04):
-- Summe pro Verkaeufer/Kaeufer plausibel (z.B. Haupt-Testverkaeufer
-- mit 13 Orders = 13 * 1,13€ = 14,69€ korrekt aufsummiert).
--
-- Verwendet von: hui-admin-dashboard /api/users (SADB) UND
-- /api/profiles (EDB) -- identische RPC fuer beide, wie von den
-- Standing Instructions gefordert ("SADB und EDB muessen identische
-- RPCs zur Abfrage der Stripe-Tabellen verwenden").
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_user_impact_totals()
RETURNS TABLE(user_id uuid, impact_eur numeric)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $f$
  WITH buyer_impact AS (
    SELECT o.customer_id AS uid, SUM(sip.project_share)::numeric / 100.0 AS eur
    FROM public.stripe_impact_pool sip
    JOIN public.orders o ON o.id = sip.order_id
    WHERE o.customer_id IS NOT NULL
    GROUP BY o.customer_id
  ),
  seller_impact AS (
    SELECT oi.seller_id AS uid,
           SUM(sip.project_share * (oi.unit_price_eur * oi.quantity) / NULLIF(o.total_eur,0)) / 100.0 AS eur
    FROM public.stripe_impact_pool sip
    JOIN public.orders o ON o.id = sip.order_id
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE oi.seller_id IS NOT NULL
    GROUP BY oi.seller_id
  )
  SELECT uid AS user_id, ROUND(SUM(eur),2) AS impact_eur FROM (
    SELECT * FROM buyer_impact
    UNION ALL
    SELECT * FROM seller_impact
  ) combined
  GROUP BY uid;
$f$;

GRANT EXECUTE ON FUNCTION public.rpc_get_user_impact_totals() TO service_role, authenticated;
