-- Migration: 20260716_080 — Profiles für alle authenticated User lesbar machen
-- Notwendig: ProfileService.getById(fremdeId) muss für eingeloggte User funktionieren
-- Ohne diese Policy → RLS blockiert → Spinner beim Profilklick (Endlosschleife)

-- Idempotent: nur erstellen wenn Policy noch nicht existiert
DO $$
BEGIN
  -- Prüfe ob eine generelle SELECT-Policy für authenticated existiert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND cmd = 'SELECT'
      AND (
        policyname ILIKE '%authenticated%'
        OR policyname ILIKE '%public%'
        OR policyname ILIKE '%select%'
        OR policyname ILIKE '%read%'
        OR qual = 'true'
      )
  ) THEN
    -- Erstelle öffentliche Lese-Policy: alle eingeloggten User können alle Profile lesen
    -- (Standard für Social-Apps, Supabase-Default-Pattern)
    EXECUTE $sql$
      CREATE POLICY "profiles_select_all_authenticated"
        ON public.profiles
        FOR SELECT
        TO authenticated
        USING (true)
    $sql$;
    RAISE NOTICE 'Policy profiles_select_all_authenticated erstellt';
  ELSE
    RAISE NOTICE 'SELECT-Policy auf profiles existiert bereits, kein Handlungsbedarf';
  END IF;
END;
$$;
