-- ═══════════════════════════════════════════════════════════════════
-- VERKAUFT-COMPLETED-FIX (2026-08-25, Michael-Bugreport)
-- ═══════════════════════════════════════════════════════════════════
-- BUG: rpc_get_works_sale_status prüfte nur orders.state IN ('paid','pending').
-- Sobald Käufer den Erhalt bestätigt (escrow_status=released), wechselt
-- orders.state von 'paid' auf 'completed' — das Werk fiel aus der
-- "Verkauft"-Prüfung raus und zeigte gar kein Badge mehr.
-- FIX: 'completed' als 'verkauft' werten, analog zu FinanzuebersichtModal
-- (.in("state", ["paid", "completed"])).
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_get_works_sale_status(p_work_ids uuid[])
RETURNS TABLE(work_id uuid, sale_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    wid AS work_id,
    (
      SELECT
        CASE
          WHEN bool_or(o.state IN ('paid','completed')) THEN 'verkauft'
          WHEN bool_or(o.state = 'pending')             THEN 'reserviert'
          ELSE NULL
        END
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.item_type = 'work'
        AND oi.item_id = wid
        AND o.state IN ('paid', 'pending', 'completed')
    ) AS sale_status
  FROM unnest(p_work_ids) AS wid;
$function$;

COMMENT ON FUNCTION public.rpc_get_works_sale_status(uuid[]) IS
  'WORK-SALE-STATUS-001 (BUGFIX 2026-08-25): Liefert pro Werk-ID entweder ''reserviert'' (Checkout gestartet, Zahlung offen), ''verkauft'' (Zahlung bestätigt ODER escrow bereits abgeschlossen/completed) oder NULL. FIX: state=completed fehlte in der ursprünglichen Fassung — sobald der Käufer den Erhalt bestätigt (escrow_status=released), wechselt orders.state von paid auf completed, wodurch das Werk fälschlich wieder als nicht-verkauft galt. Jetzt: paid UND completed zählen als verkauft, analog zur SSOT-Logik in FinanzuebersichtModal.jsx (state IN (paid,completed)).';
