-- ════════════════════════════════════════════════════════════════
-- Migration 139: hui_slugify() zerstört Umlaute statt sie zu transliterieren
-- Datum: 2026-08-31
-- ════════════════════════════════════════════════════════════════
--
-- ROOT CAUSE (Michael-Report, Screenshot 2026-08-31, Verein "Einer für
-- alle, alle Fair(ein)t"):
-- hui_slugify() (Migration 074) nutzt regexp_replace(lower(input),
-- '[^a-z0-9]+','-','g') -- das ersetzt JEDEN Nicht-a-z0-9-Zeichen-Lauf
-- durch EINEN Bindestrich. Deutsche Umlaute (ä,ö,ü,ß) sind KEIN a-z0-9
-- und werden daher wie Satzzeichen behandelt und komplett durch "-"
-- ersetzt statt transliteriert zu werden.
--
-- Beweis (Nachvollzug für "Einer für alle, alle Fair(ein)t"):
--   "für" = f + ü + r → ü ist ein Nicht-alnum-Zeichen zwischen zwei
--   alnum-Zeichen → wird zu EINEM Bindestrich → "f-r"
--   "(ein)" → "(" und ")" jeweils eigene Nicht-alnum-Läufe → "-ein-"
--   Ergebnis: "einer-f-r-alle-alle-fair-ein-t" -- exakt der beobachtete
--   kaputte Username in der DB (verifiziert per REST-Query vor dem Fix).
--
-- FIX: Deutsche Umlaute werden VOR der Slug-Bereinigung transliteriert
-- (ä→ae, ö→oe, ü→ue, ß→ss) -- Standard-DIN-5007-Umschrift für URLs/
-- Slugs. Betrifft hui_slugify() zentral -- wirkt automatisch auf BEIDE
-- Verwender: hui_profiles_set_username() (profiles.username) UND
-- hui_works_set_slug() (works.slug). Kein Duplicate-Code (SSOT).
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION hui_slugify(input text)
RETURNS text AS $$
  SELECT trim(both '-' from regexp_replace(
    replace(replace(replace(replace(
      lower(coalesce(input,'')),
    'ä','ae'), 'ö','oe'), 'ü','ue'), 'ß','ss'),
    '[^a-z0-9]+', '-', 'g'
  ));
$$ LANGUAGE sql IMMUTABLE;

-- ── Backfill: bereits betroffene Zeilen mit auto-generiertem Username
-- neu berechnen. Sicherheits-Kriterium: NUR Zeilen anfassen, deren
-- AKTUELLER username exakt dem Ergebnis der ALTEN (kaputten) Funktion
-- entspricht (nachgebaut inline) -- garantiert, dass wir NIE einen
-- vom Nutzer manuell gesetzten/individuellen Username überschreiben,
-- sondern ausschließlich zweifelsfrei automatisch generierte,
-- nachweislich fehlerhafte Werte.
DO $$
DECLARE
  r RECORD;
  old_buggy_slug text;
  base_u text;
  candidate text;
  suffix int;
  affected_count int := 0;
BEGIN
  FOR r IN
    SELECT id, display_name, full_name, username
    FROM profiles
    WHERE username IS NOT NULL
      AND (
        coalesce(display_name,'') ~ '[äöüÄÖÜß]'
        OR coalesce(full_name,'') ~ '[äöüÄÖÜß]'
      )
  LOOP
    -- Alte (kaputte) Slug-Berechnung nachbauen zum Abgleich
    old_buggy_slug := trim(both '-' from regexp_replace(
      lower(coalesce(r.display_name, r.full_name, 'mitglied')),
      '[^a-z0-9]+', '-', 'g'
    ));
    IF old_buggy_slug = '' THEN old_buggy_slug := 'mitglied'; END IF;

    IF r.username = old_buggy_slug THEN
      -- Bestätigt: aktueller Username = exakt der alte Bug-Output.
      -- Neu berechnen mit der jetzt gefixten Funktion.
      base_u := hui_slugify(coalesce(r.display_name, r.full_name, 'mitglied'));
      IF base_u = '' THEN base_u := 'mitglied'; END IF;
      candidate := base_u;
      suffix := 0;
      WHILE EXISTS (SELECT 1 FROM profiles WHERE username = candidate AND id <> r.id) LOOP
        suffix := suffix + 1;
        candidate := base_u || suffix;
      END LOOP;
      UPDATE profiles SET username = candidate WHERE id = r.id;
      affected_count := affected_count + 1;
      RAISE NOTICE 'Fixed username for %: % -> %', r.id, r.username, candidate;
    END IF;
  END LOOP;
  RAISE NOTICE 'Total profiles fixed: %', affected_count;
END $$;
