-- ═══════════════════════════════════════════════════════════════
-- HUI Migration 047 — Beziehungsmodell für Talentprofile
-- Stufe 2: Im Blick behalten (profile_watchlist)
-- Stufe 3: Verbinden      (profile_relations)
-- ═══════════════════════════════════════════════════════════════

-- ── STUFE 2: Profile Watchlist ──────────────────────────────────
-- Stiller Ausdruck von Interesse. Kein sozialer Druck.
-- Das Talent erhält keine Benachrichtigung.
CREATE TABLE IF NOT EXISTS public.profile_watchlist (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  watcher_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (watcher_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_watcher  ON public.profile_watchlist(watcher_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_profile  ON public.profile_watchlist(profile_id);

ALTER TABLE public.profile_watchlist ENABLE ROW LEVEL SECURITY;

-- Jeder kann eigene Watchlist-Einträge lesen
DROP POLICY IF EXISTS "watchlist_select_own" ON public.profile_watchlist;
CREATE POLICY "watchlist_select_own" ON public.profile_watchlist
  FOR SELECT USING (auth.uid() = watcher_id);

-- Öffentliche Zahl: Wie viele beobachten dieses Profil?
DROP POLICY IF EXISTS "watchlist_count_public" ON public.profile_watchlist;
CREATE POLICY "watchlist_count_public" ON public.profile_watchlist
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "watchlist_insert" ON public.profile_watchlist;
CREATE POLICY "watchlist_insert" ON public.profile_watchlist
  FOR INSERT WITH CHECK (auth.uid() = watcher_id);

DROP POLICY IF EXISTS "watchlist_delete" ON public.profile_watchlist;
CREATE POLICY "watchlist_delete" ON public.profile_watchlist
  FOR DELETE USING (auth.uid() = watcher_id);


-- ── STUFE 3: Profile Relations (Verbindungsanfragen) ───────────
-- Bewusster, wertschätzender Verbindungsprozess.
-- Enthält Intention (warum) und optionale persönliche Nachricht.
CREATE TABLE IF NOT EXISTS public.profile_relations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','declined','withdrawn')),
  intention       TEXT,       -- 'interests' | 'inspiration' | 'meet' | 'create' | 'other'
  message         TEXT,       -- optionale persönliche Nachricht
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_requester ON public.profile_relations(requester_id);
CREATE INDEX IF NOT EXISTS idx_relations_target    ON public.profile_relations(target_id);
CREATE INDEX IF NOT EXISTS idx_relations_status    ON public.profile_relations(status);

-- updated_at Trigger (Funktion existiert bereits aus Migration 042)
DROP TRIGGER IF EXISTS trg_relations_updated ON public.profile_relations;
CREATE TRIGGER trg_relations_updated
  BEFORE UPDATE ON public.profile_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.profile_relations ENABLE ROW LEVEL SECURITY;

-- Eigene Anfragen lesen (als Sender oder Empfänger)
DROP POLICY IF EXISTS "relations_select_own" ON public.profile_relations;
CREATE POLICY "relations_select_own" ON public.profile_relations
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = target_id
  );

DROP POLICY IF EXISTS "relations_insert" ON public.profile_relations;
CREATE POLICY "relations_insert" ON public.profile_relations
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Nur der Empfänger darf Status ändern (accept/decline)
-- Sender darf nur withdraw (eigener Eintrag)
DROP POLICY IF EXISTS "relations_update" ON public.profile_relations;
CREATE POLICY "relations_update" ON public.profile_relations
  FOR UPDATE USING (
    auth.uid() = target_id OR auth.uid() = requester_id
  );

DROP POLICY IF EXISTS "relations_delete" ON public.profile_relations;
CREATE POLICY "relations_delete" ON public.profile_relations
  FOR DELETE USING (auth.uid() = requester_id);
