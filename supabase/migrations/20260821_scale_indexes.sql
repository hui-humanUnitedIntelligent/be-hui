-- ═══════════════════════════════════════════════════════════════
-- HUI SCALE-READINESS INDEXES (2026-08-21)
-- Für 100k+ Users — fehlende Indexes auf kritischen Tabellen
-- Alle IF NOT EXISTS — sicher additiv, keine Regression
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PROFILES — meist-queried Tabelle ──
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ── 2. WORKS — Discovery + Profile ──
CREATE INDEX IF NOT EXISTS idx_works_user_id ON public.works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_slug ON public.works(slug);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON public.works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_user_status ON public.works(user_id, status);

-- ── 3. BEITRAEGE (Feed/Momente) ──
CREATE INDEX IF NOT EXISTS idx_beitraege_user_id ON public.beitraege(user_id);
CREATE INDEX IF NOT EXISTS idx_beitraege_created_at ON public.beitraege(created_at DESC);

-- ── 4. RECOMMENDATIONS ──
CREATE INDEX IF NOT EXISTS idx_rec_to_user ON public.recommendations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_rec_to_user_public ON public.recommendations(to_user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_rec_created_at ON public.recommendations(created_at DESC);

-- ── 5. IMPACT VOTES ──
CREATE INDEX IF NOT EXISTS idx_impact_votes_voter_month ON public.impact_votes(voter_id, pool_month);
CREATE INDEX IF NOT EXISTS idx_impact_votes_project_month ON public.impact_votes(project_id, pool_month);

-- ── 6. POST_REACTIONS (Likes, Inspires, etc.) ──
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON public.post_reactions(post_id, post_type, type);

-- ── 7. CHATS — participant_ids als GIN Array Index ──
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids ON public.chats USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON public.chats(last_message_at DESC);

-- ── 8. MESSAGES — Composite Index für Chat-Pagination ──
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);

-- ── 9. TALENTS ──
CREATE INDEX IF NOT EXISTS idx_talents_user_id ON public.talents(user_id);
CREATE INDEX IF NOT EXISTS idx_talents_status ON public.talents(status);

-- ── 10. TALENT_BOOKINGS ──
CREATE INDEX IF NOT EXISTS idx_talent_bookings_talent ON public.talent_bookings(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_bookings_customer ON public.talent_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_talent_bookings_status ON public.talent_bookings(status);

-- ── 11. POST_COMMENTS ──
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON public.post_comments(created_at DESC);

-- ── 12. ESCROW_DISPUTES ──
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_status ON public.escrow_disputes(status);

-- ═══════════════════════════════════════════════════════════════
-- Ausführungshinweis:
-- Diese Migration ist 100% additiv (IF NOT EXISTS auf alles).
-- Kann gefahrlos auf Produktion ausgeführt werden.
-- Michael: via hui_admin_role-Cookie im SQL-Editor ausführen.
-- ═══════════════════════════════════════════════════════════════
