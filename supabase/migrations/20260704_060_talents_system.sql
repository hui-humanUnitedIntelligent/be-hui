-- Migration: Talente-System (neues Modul, additiv, keine bestehenden Tabellen veraendert)
-- Analog zu "works" Approval-Workflow, aber eigenstaendige Tabelle fuer individuelle Talent-Angebote
-- (nicht zu verwechseln mit profiles.has_talent_profile / wirker_profiles / TalentSection-Tags — die bleiben unangetastet)

CREATE TABLE IF NOT EXISTS public.talents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             text NOT NULL,
  description       text,
  category          text NOT NULL,
  images            jsonb NOT NULL DEFAULT '[]'::jsonb,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason  text,
  reviewed_by       uuid REFERENCES public.profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talents_user_id  ON public.talents(user_id);
CREATE INDEX IF NOT EXISTS idx_talents_status   ON public.talents(status);
CREATE INDEX IF NOT EXISTS idx_talents_category ON public.talents(category);

-- Kanonische updated_at-Trigger-Funktion wiederverwenden (Memory #502, keine neue Funktion erstellen)
DROP TRIGGER IF EXISTS trg_talents_updated_at ON public.talents;
CREATE TRIGGER trg_talents_updated_at
  BEFORE UPDATE ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "talents_visible_approved_or_own" ON public.talents;
CREATE POLICY "talents_visible_approved_or_own"
  ON public.talents FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "talents_insert_own" ON public.talents;
CREATE POLICY "talents_insert_own"
  ON public.talents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User darf bearbeiten solange nicht approved (kann pending erneut einreichen / rejected korrigieren)
DROP POLICY IF EXISTS "talents_update_own_not_approved" ON public.talents;
CREATE POLICY "talents_update_own_not_approved"
  ON public.talents FOR UPDATE
  USING (auth.uid() = user_id AND status <> 'approved')
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "talents_delete_own" ON public.talents;
CREATE POLICY "talents_delete_own"
  ON public.talents FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime (fuer App-seitige Live-Updates, gleiches Muster wie stripe_payouts etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'talents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.talents;
  END IF;
END $$;
