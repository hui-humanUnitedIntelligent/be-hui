-- 20260808_083_fix_recommendations_booking_fkey.sql
-- BUGFIX: recommendations.booking_id FK zeigte fälschlich auf die
-- deprecated Legacy-Tabelle `bookings` (0 Zeilen, siehe Memory #470).
-- Alle echten Talent-Buchungen leben seit TALENT-KALENDER-037 in
-- `talent_bookings`. RecommendationService.canRecommend() liefert
-- bookingId aus talent_bookings.id — der Insert in recommendations.create()
-- schlug daher IMMER mit einem FK-Constraint-Fehler fehl:
--   "insert or update on table recommendations violates foreign key
--    constraint recommendations_booking_id_fkey"
--
-- Verifiziert vor Migration (2026-08-08):
--   - recommendations.booking_id: 0 Zeilen mit Wert != NULL (kein Datenverlust)
--   - bookings: 0 Zeilen (Legacy-Tabelle, korrekt deprecated)
--   - talent_bookings: 6 Zeilen (aktive Buchungsdaten)

ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_booking_id_fkey;

ALTER TABLE recommendations
  ADD CONSTRAINT recommendations_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES talent_bookings(id) ON DELETE SET NULL;
