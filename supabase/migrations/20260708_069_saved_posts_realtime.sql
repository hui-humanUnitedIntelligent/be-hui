-- 069_saved_posts_realtime.sql
-- MERKLISTE.1 (2026-07-08): saved_posts fuer Realtime freischalten.
--
-- BESTAND (siehe hui_060_activate_reactions_system.sql):
--   saved_posts existiert bereits vollstaendig und entspricht 1:1 der im
--   Auftrag skizzierten "saved_items"-Tabelle:
--     id, user_id, post_id(=content_id), post_type(=content_type),
--     post_data, saved_at(=created_at), UNIQUE(user_id, post_id).
--   post_reactions war bereits in der Realtime-Publication (Migration 060),
--   saved_posts hingegen NICHT -- das ist die einzige echte Luecke fuer
--   die geforderte Live-Synchronisation (Feed/Detailseite/Profil/
--   Gemerkte Inhalte zeigen automatisch denselben Zustand).
--
-- Keine neue Tabelle, keine neue Spalte -- nur Realtime-Publication-Fix.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'saved_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_posts;
  END IF;
END $$;
