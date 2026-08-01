-- Migration: impact_rounds August 2026 sicherstellen
-- Verhindert 406-Fehler wenn getCurrentRound() keine Zeile findet

-- August 2026 Runde anlegen falls nicht vorhanden
INSERT INTO public.impact_rounds (month, status, pool_eur, created_at, updated_at)
VALUES (
  '2026-08',
  'active',
  0,
  now(),
  now()
)
ON CONFLICT (month) DO NOTHING;

-- Generischer Upsert für zukünftige Monate (aktueller Monat immer vorhanden)
INSERT INTO public.impact_rounds (month, status, pool_eur, created_at, updated_at)
VALUES (
  to_char(now(), 'YYYY-MM'),
  'active',
  0,
  now(),
  now()
)
ON CONFLICT (month) DO NOTHING;
