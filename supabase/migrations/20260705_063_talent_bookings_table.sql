-- 20260705_063_talent_bookings_table.sql
-- Neue Tabelle fuer Talent-Angebote-Buchungen (Phase 3, Master-Prompt 2026-07-05).
-- Kapazitaet wird NICHT ueber ein Zaehler-Feld verwaltet, sondern live per
-- SUM(participants) WHERE status IN (pending_payment,confirmed) pro (talent_id,selected_date)
-- berechnet -- kein Drift-Risiko, einzige Quelle sind die Buchungszeilen selbst.
-- RLS bewusst minimal (nur SELECT fuer customer/seller) -- alle Schreibzugriffe
-- laufen ausschliesslich ueber SECURITY-DEFINER-RPCs (siehe 20260705_064).

CREATE TABLE talent_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_date date NOT NULL,
  selected_time_slot jsonb,
  participants integer NOT NULL DEFAULT 1 CHECK (participants >= 1),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','confirmed','cancelled','completed')),
  amount_eur numeric NOT NULL CHECK (amount_eur >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  stripe_payment_intent text UNIQUE,
  company_share_eur numeric,
  ambassador_id uuid REFERENCES profiles(id),
  ambassador_commission_eur numeric,
  ambassador_commission_applicable boolean NOT NULL DEFAULT false,
  customer_note text,
  cancelled_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_talent_bookings_updated_at
  BEFORE UPDATE ON talent_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE talent_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY talent_bookings_customer_select ON talent_bookings
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY talent_bookings_seller_select ON talent_bookings
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY talent_bookings_service_all ON talent_bookings
  FOR ALL USING (auth.role() = 'service_role');

