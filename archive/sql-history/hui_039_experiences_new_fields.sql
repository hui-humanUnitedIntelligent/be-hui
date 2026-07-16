-- ═══════════════════════════════════════════════════════════════════════
-- HUI Migration 039 — experiences: Neue Felder aus Phase 4E Contract
-- Datum: 2026-05-24
-- IDEMPOTENT
-- ═══════════════════════════════════════════════════════════════════════

-- pricing_type (ersetzt/ergänzt sale_mode + price_type)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS pricing_type    TEXT DEFAULT 'fixed';

-- experience_type (workshop | coaching | performance | tour | retreat | online | event | other)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS experience_type TEXT;

-- participant_limit (ersetzt max_participants — beide bleiben für Kompatibilität)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS participant_limit INTEGER;

-- mood_tags (text array)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS mood_tags       TEXT[];

-- social_energy (intimate | small_group | open | large)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS social_energy   TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exp_pricing_type    ON public.experiences(pricing_type);
CREATE INDEX IF NOT EXISTS idx_exp_experience_type ON public.experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_exp_social_energy   ON public.experiences(social_energy);

COMMENT ON COLUMN public.experiences.pricing_type    IS 'free|fixed|hourly|inquiry|donation';
COMMENT ON COLUMN public.experiences.experience_type IS 'workshop|coaching|performance|tour|retreat|online|event|other';
COMMENT ON COLUMN public.experiences.social_energy   IS 'intimate|small_group|open|large';
COMMENT ON COLUMN public.experiences.participant_limit IS 'Alias für max_participants — via Contract Layer';
COMMENT ON COLUMN public.experiences.mood_tags       IS 'Array von Mood-Keywords';
