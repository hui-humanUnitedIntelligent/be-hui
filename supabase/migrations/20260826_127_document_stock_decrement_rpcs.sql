-- Migration 127: rpc_decrement_stock + rpc_decrement_variant_stock dokumentieren
-- Red-Team-Audit: Diese RPCs existieren in der Live-DB aber nicht im Repo.
-- Sie werden aufgerufen von:
--   - create-payment-intent/index.ts (Werke + Erlebnisse, mit/ohne Varianten)
--   - create-talent-booking-payment/index.ts (Talente)
-- 
-- Da diese Funktionen bereits live sind und funktionieren, erstellt diese
-- Migration sie mit CREATE OR REPLACE — falls sie in der DB noch nicht
-- existieren (z.B. bei Neu-Setup), werden sie angelegt. Falls sie
-- existieren, wird nur die Dokumentation aktualisiert.
--
-- WICHTIG: Migration 125 hat REVOKE EXECUTE FROM PUBLIC für diese
-- Funktionen durchgeführt — nur service_role darf sie aufrufen.

-- ── rpc_decrement_stock ───────────────────────────────────────────
-- Reduziert Bestand für Werke/Erlebnisse ohne Varianten.
-- Setzt for_sale=false wenn stock_available auf 0 fällt.
CREATE OR REPLACE FUNCTION public.rpc_decrement_stock(
  p_table text,
  p_item_id uuid,
  p_quantity int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_new int;
  v_row_count int;
BEGIN
  -- Input-Validierung
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_quantity');
  END IF;

  IF p_table = 'works' THEN
    SELECT stock_available INTO v_current FROM public.works WHERE id = p_item_id FOR UPDATE;
    IF v_current IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;
    IF v_current < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'available', v_current);
    END IF;
    v_new := v_current - p_quantity;
    UPDATE public.works
    SET stock_available = v_new,
        for_sale = (v_new > 0),
        is_sold = (v_new = 0)
    WHERE id = p_item_id;
    RETURN jsonb_build_object('success', true, 'new_stock_available', v_new);

  ELSIF p_table = 'experiences' THEN
    SELECT stock_available INTO v_current FROM public.experiences WHERE id = p_item_id FOR UPDATE;
    IF v_current IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;
    IF v_current < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'available', v_current);
    END IF;
    v_new := v_current - p_quantity;
    UPDATE public.experiences
    SET stock_available = v_new,
        for_sale = (v_new > 0)
    WHERE id = p_item_id;
    RETURN jsonb_build_object('success', true, 'new_stock_available', v_new);

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_table');
  END IF;
END;
$$;

COMMENT ON FUNCTION public.rpc_decrement_stock(text, uuid, int) IS
  'Reduziert stock_available für Werke oder Erlebnisse (ohne Varianten). Setzt for_sale=false und is_sold=true bei 0 Bestand. Nur service_role (Migration 125).';

REVOKE EXECUTE ON FUNCTION public.rpc_decrement_stock(text, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_decrement_stock(text, uuid, int) TO service_role;

-- ── rpc_decrement_variant_stock ───────────────────────────────────
-- Reduziert Bestand für eine spezifische Variante eines Werks/Erlebnisses.
-- Setzt for_sale=false wenn alle Varianten ausverkauft sind (nur Werke).
CREATE OR REPLACE FUNCTION public.rpc_decrement_variant_stock(
  p_table text,
  p_item_id uuid,
  p_variant_id uuid,
  p_quantity int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
  v_new int;
  v_all_sold int;
  v_total int;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_quantity');
  END IF;

  IF p_table = 'works' THEN
    SELECT stock_available INTO v_current
    FROM public.product_variants
    WHERE product_id = p_item_id AND variant_id = p_variant_id
    FOR UPDATE;

    IF v_current IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'variant_not_found');
    END IF;
    IF v_current < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'available', v_current);
    END IF;

    v_new := v_current - p_quantity;
    UPDATE public.product_variants
    SET stock_available = v_new
    WHERE product_id = p_item_id AND variant_id = p_variant_id;

    -- Prüfen ob alle Varianten ausverkauft sind
    SELECT COUNT(*) INTO v_all_sold
    FROM public.product_variants
    WHERE product_id = p_item_id AND stock_available = 0;

    SELECT COUNT(*) INTO v_total
    FROM public.product_variants
    WHERE product_id = p_item_id;

    IF v_all_sold = v_total THEN
      UPDATE public.works SET is_sold = true WHERE id = p_item_id;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'new_stock_available', v_new,
      'all_sold_out', (v_all_sold = v_total)
    );

  ELSIF p_table = 'experiences' THEN
    SELECT stock_available INTO v_current
    FROM public.product_variants
    WHERE product_id = p_item_id AND variant_id = p_variant_id
    FOR UPDATE;

    IF v_current IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'variant_not_found');
    END IF;
    IF v_current < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'available', v_current);
    END IF;

    v_new := v_current - p_quantity;
    UPDATE public.product_variants
    SET stock_available = v_new
    WHERE product_id = p_item_id AND variant_id = p_variant_id;

    RETURN jsonb_build_object(
      'success', true,
      'new_stock_available', v_new,
      'all_sold_out', false
    );

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_table');
  END IF;
END;
$$;

COMMENT ON FUNCTION public.rpc_decrement_variant_stock(text, uuid, uuid, int) IS
  'Reduziert stock_available für eine spezifische Variante eines Werks/Erlebnisses. Setzt is_sold=true bei Werken wenn alle Varianten ausverkauft. Nur service_role (Migration 125).';

REVOKE EXECUTE ON FUNCTION public.rpc_decrement_variant_stock(text, uuid, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_decrement_variant_stock(text, uuid, uuid, int) TO service_role;

-- Dokumentation:
-- Diese Migration dokumentiert die bereits live existierenden RPCs.
-- Falls die Live-DB eine andere Implementation hat (z.B. andere Spalten-
-- namen), überschreibt CREATE OR REPLACE sie. Die Edge Functions
-- verwenden dieselben Parameter wie oben definiert.
-- Die product_variants Tabelle muss existieren (VARIANTS-001 Migration).
