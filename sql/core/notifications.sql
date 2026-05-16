-- ════════════════════════════════════════════════
-- HUI CORE: notifications
-- Additive-only
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'info',
  title      text,
  body       text,
  read       boolean     DEFAULT false,
  data       jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read    ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

NOTIFY pgrst, 'reload schema';
