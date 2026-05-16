-- ════════════════════════════════════════════════════════════════
-- HUI Phase 3A: Booking Intelligence System
-- Migration: 028_booking_intelligence
-- Safe additive — no table drops, no destructive changes
-- ════════════════════════════════════════════════════════════════

-- 1. Bookings Tabelle erweitern
-- Neue Spalten: vollständiges Status-System + Chat-Verknüpfung
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS requester_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creator_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status         text DEFAULT 'requested'
    CHECK (status IN (
      'draft','requested','pending_response','accepted',
      'declined','scheduled','in_progress','completed','cancelled'
    )),
  ADD COLUMN IF NOT EXISTS req_type       text,          -- workshop/shooting/collab/event/coaching/other
  ADD COLUMN IF NOT EXISTS req_mood       text,          -- entspannt/kreativ/professionell/...
  ADD COLUMN IF NOT EXISTS req_date       date,          -- gewünschter Termin
  ADD COLUMN IF NOT EXISTS req_time_slot  text,          -- z.B. "10:00"
  ADD COLUMN IF NOT EXISTS req_location   text,          -- Ort
  ADD COLUMN IF NOT EXISTS req_budget     text,          -- Budget-Range als Text
  ADD COLUMN IF NOT EXISTS req_guests     int DEFAULT 1, -- Teilnehmerzahl
  ADD COLUMN IF NOT EXISTS req_direction  text,          -- kreative Richtung
  ADD COLUMN IF NOT EXISTS message        text,          -- Persönliche Nachricht
  ADD COLUMN IF NOT EXISTS amount_eur     numeric(10,2),
  ADD COLUMN IF NOT EXISTS impact_eur     numeric(10,2),
  ADD COLUMN IF NOT EXISTS chat_id        uuid,          -- Verknüpfter Chat
  ADD COLUMN IF NOT EXISTS creator_note   text,          -- Creator-Antwort
  ADD COLUMN IF NOT EXISTS declined_reason text,
  ADD COLUMN IF NOT EXISTS confirmed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_at  timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at  timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- Index für Creator-Dashboard Queries
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id  ON bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requester_id ON bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_chat_id      ON bookings(chat_id);

-- 2. Creator Trust-Metrics in profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avg_response_time_h  numeric(5,1),  -- Ø Antwortzeit in Stunden
  ADD COLUMN IF NOT EXISTS response_rate        numeric(5,2),  -- 0-100%
  ADD COLUMN IF NOT EXISTS completed_bookings   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_rate    numeric(5,2),
  ADD COLUMN IF NOT EXISTS last_active_at       timestamptz,
  ADD COLUMN IF NOT EXISTS availability         text DEFAULT 'available'
    CHECK (availability IN ('available','partial','busy','unavailable')),
  ADD COLUMN IF NOT EXISTS availability_note    text;

-- 3. Booking-Events Log (für Audit + Realtime)
CREATE TABLE IF NOT EXISTS booking_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id) ON DELETE CASCADE,
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL, -- status_change/message/reschedule/note
  from_status   text,
  to_status     text,
  note          text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);

-- 4. Creator Availability Slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date     date NOT NULL,
  slot_time     text NOT NULL,   -- "10:00"
  duration_min  int DEFAULT 60,
  is_booked     boolean DEFAULT false,
  booking_id    uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slots_creator_date ON availability_slots(creator_id, slot_date);

-- 5. Trigger: updated_at auf bookings automatisch setzen
CREATE OR REPLACE FUNCTION update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_updated_at ON bookings;
CREATE TRIGGER booking_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_timestamp();

-- 6. Trigger: Trust-Metrics bei Booking-Completion auto-updaten
CREATE OR REPLACE FUNCTION update_creator_trust_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Wenn Buchung abgeschlossen → completed_bookings +1
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET completed_bookings = COALESCE(completed_bookings, 0) + 1,
        impact_eur = COALESCE(impact_eur, 0) + COALESCE(NEW.impact_eur, 0)
    WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_trust_update ON bookings;
CREATE TRIGGER booking_trust_update
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_creator_trust_metrics();

-- 7. RLS — Bookings (requester + creator sehen ihre eigenen)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_read ON bookings;
CREATE POLICY booking_read ON bookings FOR SELECT
  USING (
    auth.uid() = requester_id OR
    auth.uid() = creator_id   OR
    -- Legacy: user_id field
    auth.uid()::text = user_id::text
  );

DROP POLICY IF EXISTS booking_insert ON bookings;
CREATE POLICY booking_insert ON bookings FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS booking_update ON bookings;
CREATE POLICY booking_update ON bookings FOR UPDATE
  USING (
    auth.uid() = requester_id OR
    auth.uid() = creator_id
  );

-- 8. RLS — booking_events
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS booking_events_read ON booking_events;
CREATE POLICY booking_events_read ON booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_events.booking_id
      AND (b.requester_id = auth.uid() OR b.creator_id = auth.uid())
    )
  );

-- 9. RLS — availability_slots (public read, creator write)
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slots_read ON availability_slots;
CREATE POLICY slots_read ON availability_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS slots_write ON availability_slots;
CREATE POLICY slots_write ON availability_slots FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Notify PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
