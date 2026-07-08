-- ═══════════════════════════════════════════════════════════════════
-- Migration 072 — Merken als Wirkungssignal (MERKEN.6, 2026-07-08)
-- ═══════════════════════════════════════════════════════════════════
-- Auftrag (Lars): Merken ist nicht nur persoenliche Sammlung, sondern
-- ein Wirkungssignal fuer das Talent. Jeder Merkvorgang erhoeht beim
-- Creator eine Kennzahl "🔖 Gemerkt" (Gesamt ueber alle eigenen
-- Inhalte). Keine Einzel-Notification pro Speichervorgang, sondern
-- taeglich/woechentlich zusammengefasste Digests.
--
-- BESTANDSANALYSE (vor Neuerstellung):
-- - post_reactions (type='save') ist bereits die kanonische Quelle fuer
--   Merken-Zaehlungen (synchron mit saved_posts geschrieben, siehe
--   useReactions.jsx). reaction_counts(post_id) liefert daraus bereits
--   den PRO-WERK-Merken-Count -- kein neuer Zaehler pro Post noetig,
--   das "optional zusaetzlich pro Werk" aus dem Auftrag ist damit schon
--   erfuellt (siehe counts.save in useSingleReaction).
-- - works.saves_count / Tabelle work_saves sind TOTER Legacy-Code (kein
--   Trigger, kein aktiver Schreibpfad seit Umstellung auf post_reactions/
--   saved_posts) -- bewusst NICHT wiederverwendet, da nicht synchron mit
--   dem aktuellen Merken-System. Stattdessen: neue Aggregat-RPCs direkt
--   auf Basis von post_reactions (gleiche Quelle wie reaction_counts).
-- - Es gibt noch KEIN Aggregat "wie oft wurden ALLE eigenen Inhalte
--   gemerkt" (kreuzt works/experiences/beitraege/invitations) -- das ist
--   der einzige wirklich neue Baustein hier.
--
-- Physische Content-Tabellen pro post_type (bestaetigt aus useFeedStream.js):
--   work -> works, experience -> experiences, post/beitrag -> beitraege,
--   event -> invitations. Alle mit Spalte user_id (Creator).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. creator_save_stats(uid) — Gesamt-Merken-Kennzahl fuer's eigene
--    Profil/Statistiken-Modal ("🔖 Gemerkt"), Aufschluesselung nach Typ. ──
CREATE OR REPLACE FUNCTION public.creator_save_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH my_posts AS (
    SELECT id, 'work'::text       AS src FROM public.works       WHERE user_id = p_user_id
    UNION ALL
    SELECT id, 'experience'::text AS src FROM public.experiences WHERE user_id = p_user_id
    UNION ALL
    SELECT id, 'post'::text       AS src FROM public.beitraege   WHERE user_id = p_user_id
    UNION ALL
    SELECT id, 'event'::text      AS src FROM public.invitations WHERE user_id = p_user_id
  )
  SELECT jsonb_build_object(
    'total',      COUNT(*),
    'work',       COUNT(*) FILTER (WHERE mp.src = 'work'),
    'experience', COUNT(*) FILTER (WHERE mp.src = 'experience'),
    'post',       COUNT(*) FILTER (WHERE mp.src = 'post'),
    'event',      COUNT(*) FILTER (WHERE mp.src = 'event')
  )
  FROM public.post_reactions pr
  JOIN my_posts mp ON mp.id = pr.post_id
  WHERE pr.type = 'save' AND pr.user_id <> p_user_id;
$$;
GRANT EXECUTE ON FUNCTION public.creator_save_stats(uuid) TO authenticated;

-- ── 2. save_digest_batch(since) — fuer die taeglichen/woechentlichen
--    Zusammenfassungs-Notifications. Liefert pro betroffenem Creator die
--    Anzahl neuer Merkvorgaenge + Anzahl unterschiedlicher Personen seit
--    einem Zeitpunkt. NUR service_role (Cross-User-Aggregat, kein Nutzer
--    darf fremde Zahlen fuer beliebige Zeitfenster abfragen). ──
CREATE OR REPLACE FUNCTION public.save_digest_batch(p_since timestamptz)
RETURNS TABLE(creator_id uuid, save_count bigint, unique_savers bigint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH my_posts AS (
    SELECT id, user_id AS creator_id FROM public.works
    UNION ALL
    SELECT id, user_id FROM public.experiences
    UNION ALL
    SELECT id, user_id FROM public.beitraege
    UNION ALL
    SELECT id, user_id FROM public.invitations
  )
  SELECT mp.creator_id,
         COUNT(*)::bigint                   AS save_count,
         COUNT(DISTINCT pr.user_id)::bigint AS unique_savers
  FROM public.post_reactions pr
  JOIN my_posts mp ON mp.id = pr.post_id
  WHERE pr.type = 'save'
    AND pr.created_at >= p_since
    AND mp.creator_id IS NOT NULL
    AND mp.creator_id <> pr.user_id
  GROUP BY mp.creator_id;
$$;
-- Bewusst KEIN GRANT an authenticated/anon -- nur service_role (Digest-Job
-- via Superagent-Automation, ruft mit dem Service-Key auf).

-- ── 3. notifications.type='save_digest' braucht keine Schema-Aenderung
--    (type ist bereits text, notifications-Tabelle bereits vollstaendig
--    aus Migration 060) -- nur dokumentiert, keine neue Spalte noetig.
