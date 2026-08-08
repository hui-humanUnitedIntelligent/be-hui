-- 20260808_063_order_items_work_id_nullable.sql
-- ROOT CAUSE FIX: order_items.work_id war noch NOT NULL aus der Zeit vor
-- Commerce 2.0 (siehe 20260627_057_commerce_schema_final.sql, die item_id/
-- item_type als kanonische, polymorphe Referenz eingefuehrt hat, work_id
-- aber als Legacy-Spalte stehen liess OHNE die NOT-NULL-Constraint zu loesen).
--
-- Symptom (Live, 2026-08-08): Kauf eines Erlebnisses ("Hunde streicheln")
-- ueber den Werkekorb schlug mit HTTP 500 fehl:
--   "null value in column "work_id" of relation "order_items" violates
--    not-null constraint [23502]"
-- weil create-payment-intent/index.ts work_id bewusst nur fuer
-- item_type='work' setzt (Zeile 263: work_id: item.item_type === 'work'
-- ? item.item_id : null) — fuer 'experience'/'talent' Items ist work_id
-- absichtlich null, da die Referenz ueber item_id/item_type laeuft.
--
-- Verifiziert vor dem Fix (production, via Supabase Management API):
--   - order_items.work_id: is_nullable = 'NO'  (Bug-Ursache)
--   - order_items.seller_id: is_nullable = 'NO', aber korrekt befuellt
--     (commerce_price_authority.creator_id = e.user_id fuer Experiences)
--   - order_items_work_id_fkey: FOREIGN KEY (work_id) REFERENCES works(id)
--     → FK-Constraints greifen nicht bei NULL-Werten, also unkritisch.
--   - Bestehende 58 order_items sind ALLE item_type='work' → Erlebnis-/
--     Talent-Kaeufe ueber den Warenkorb sind bisher NIE erfolgreich
--     durchgelaufen (Produktionsbug seit Commerce-2.0-Einfuehrung).
--
-- Fix: work_id wird nullable, analog zu allen anderen Commerce-2.0-Feldern.
-- item_id/item_type bleiben die SSOT-Referenz (siehe Memory #486, #791).

ALTER TABLE public.order_items ALTER COLUMN work_id DROP NOT NULL;

COMMENT ON COLUMN public.order_items.work_id IS
  'LEGACY (Pre-Commerce-2.0). Nur fuer item_type=''work'' befuellt. '
  'Kanonische Referenz ist item_id + item_type (siehe commerce_price_authority).';
