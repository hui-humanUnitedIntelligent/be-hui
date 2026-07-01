
SET search_path = public;

-- stripe_payments: alle NOT NULL Constraints außer id entfernen
-- id muss NOT NULL bleiben (PK)
ALTER TABLE public.stripe_payments
  ALTER COLUMN stripe_customer_id DROP NOT NULL,
  ALTER COLUMN stripe_payment_id  DROP NOT NULL;

-- Sicherstellen dass es einen sauberen UNIQUE gibt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_payments_pkey'
      AND conrelid = 'public.stripe_payments'::regclass
  ) THEN
    ALTER TABLE public.stripe_payments ADD PRIMARY KEY (id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
