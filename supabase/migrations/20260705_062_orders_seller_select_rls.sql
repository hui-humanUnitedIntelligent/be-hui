-- 20260705_062_orders_seller_select_rls.sql
-- Additive RLS-Ergänzung: Verkäufer dürfen die Orders lesen, zu denen eigene
-- order_items (seller_id = auth.uid()) gehören. Vorher konnte NUR der Käufer
-- (customer_id) eine Order lesen -- ein Seller kam an orders.state/created_at
-- für seine eigenen Verkäufe nicht heran (nötig für "Meine Verkäufe"-Feature,
-- Master-Prompt 2026-07-05). Bestehende Policies bleiben unverändert.
--
-- WICHTIG -- Rekursions-Falle (live entdeckt+gefixt, 2026-07-05):
-- Ein naiver Policy-Ansatz mit direktem Subquery auf order_items
-- ("EXISTS (SELECT 1 FROM order_items WHERE ...)") erzeugt eine RLS-Rekursion:
-- order_items_buyer_select fragt bereits orders ab -> orders_select_seller
-- würde wieder order_items abfragen -> "infinite recursion detected in policy".
-- Das hätte ALLE authentifizierten orders-Reads gebrochen (auch Buyer-Reads),
-- nicht nur Seller-Reads. Deshalb: SECURITY DEFINER-Funktion, die die
-- order_items-Prüfung OHNE erneute RLS-Auswertung durchführt (durchbricht den
-- Zirkel). Per Rollback-Transaktion UND echtem simuliertem auth.uid() (Seller
-- + fremder Nutzer + Buyer-Sanity-Check) verifiziert, keine Regression.

CREATE OR REPLACE FUNCTION fn_user_is_order_seller(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $BODY$
  SELECT EXISTS (
    SELECT 1 FROM order_items
    WHERE order_id = p_order_id AND seller_id = auth.uid()
  )
$BODY$;

CREATE POLICY orders_select_seller ON orders
  FOR SELECT
  USING (fn_user_is_order_seller(id));
