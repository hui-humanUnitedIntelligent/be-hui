-- ═══════════════════════════════════════════════════════════════════════════
-- 135_commerce_events_analytics_insert
-- ═══════════════════════════════════════════════════════════════════════════
-- BUG (2026-09-07, Michael-Report, Screenshot Öffentliches Profil):
--   POST .../commerce_events → 403 Forbidden in der Browser-Konsole.
--
-- ROOT CAUSE (bewiesen, nicht vermutet):
--   commerce_events hat RLS aktiv (20260627_057_commerce_schema_final.sql)
--   mit GENAU EINER Policy: "commerce_events_service_all" FOR ALL TO
--   service_role. Seit Commit fea107ce (2026-08-25) fügen 3 Frontend-Seiten
--   (PublicProfilePage.jsx, BasisProfilePage.jsx, TalentProfilePage.jsx)
--   sowie RecommendationScoreBadge.jsx client-seitig (Browser, anon/authenticated
--   Key) analytics-only Events ein: "recommendation_profile_viewed" und
--   "recommendation_ranking_opened". Diese Inserts liefen seit dem 25.08. IMMER
--   gegen die RLS-Wand — kein neu eingeführter Bug, sondern seit dem
--   Feature-Launch nie mit einer passenden Policy versehen (fire-and-forget,
--   Fehler landete nur in der Konsole, siehe commerceEventLog.record catch).
--   Live reproduziert: PostgREST liefert 42501 "new row violates row-level
--   security policy" für den anon-Key exakt auf diesen Insert.
--
-- KRITIKALITÄT: Rein Analytics/Tracking (Profil-Ansichten-Zähler für das
--   Empfehlungs-Score-System). Betrifft NICHT die Profilanzeige selbst
--   (fire-and-forget, .then() ohne Blockierung) — Nutzer sehen nichts davon,
--   aber die Tracking-Daten fehlten bisher komplett in der DB.
--
-- FIX: Eng zugeschnittene zusätzliche INSERT-Policy NUR für diese 2
--   Analytics-Event-Typen, mit CHECK dass KEINE Finanz-Referenzen
--   (order_id/order_item_id/payout_id) gesetzt werden und actor_id entweder
--   NULL ist oder mit dem aufrufenden Nutzer übereinstimmt. Die bestehende
--   service_role-Policy (Orders/Payouts/echte Commerce-Events) bleibt
--   unverändert und exklusiv für den Server-Pfad.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "commerce_events_analytics_insert" ON public.commerce_events;
CREATE POLICY "commerce_events_analytics_insert" ON public.commerce_events
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    event_type IN ('recommendation_profile_viewed', 'recommendation_ranking_opened')
    AND order_id IS NULL
    AND order_item_id IS NULL
    AND payout_id IS NULL
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );

GRANT INSERT ON public.commerce_events TO authenticated, anon;
