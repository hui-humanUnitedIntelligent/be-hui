# HUI SQL Structure

## Ordner-Übersicht

```
sql/
├── core/               ← Kanonische Tabellen-Definitionen (Referenz)
│   ├── profiles.sql
│   ├── works.sql
│   ├── stories.sql
│   ├── bookings.sql
│   ├── messages.sql
│   ├── notifications.sql
│   └── payments.sql
│
├── migrations_safe/    ← Kleine, additive, idempotente Migrationen ✓
│   ├── 008_talent_profile_system.sql
│   ├── 011_stories_rls_fix.sql
│   ├── 012_stories_storage_bucket.sql
│   ├── 014_story_views_highlights.sql
│   ├── 016_creator_tools.sql
│   ├── 023_content_recovery.sql
│   └── 025_safe_incremental.sql    ← ZULETZT AUSGEFÜHRT (location_text)
│
└── archive_old/        ← NICHT AUSFÜHREN — nur zur Referenz archiviert
    ├── 009_story_system_fix.sql     (DROP TABLE)
    ├── 010_clean_separation.sql     (DROP TABLE)
    ├── 017..022_*.sql               (massive RLS-Rewrites)
    ├── 024_master_schema.sql        (61k, globaler Overwrite)
    ├── 026_production_schema.sql    (61k, 140 DROPs)
    ├── 027_precision_repair.sql     (37k, 38 DROPs)
    ├── HUI_024_FINAL_MIGRATION.sql  (Root-Duplikat)
    ├── hui_schema_v7.sql            (Legacy v7)
    └── hui_schema_v8_production.sql (Legacy v8)
```

## Regeln für neue Migrationen

✅ **Erlaubt:**
- `ALTER TABLE x ADD COLUMN IF NOT EXISTS y type`
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `NOTIFY pgrst, 'reload schema'`
- `UPDATE ... SET ... WHERE ... IS NULL` (Daten-Normalisierung)

❌ **Verboten:**
- `DROP TABLE`
- Globale `DROP POLICY`-Blöcke (mehr als 3 auf einmal)
- `CREATE TABLE x` ohne `IF NOT EXISTS`
- Komplette RLS-Rewrites (mehr als 5 DROP POLICY in einer Datei)

## Aktueller DB-Stand (2026-05-16)

Die Produktion-Datenbank ist **stabil**. Zuletzt ausgeführt:
- `025_safe_incremental.sql` — works.location_text + experiences.location_text ✓

Nächste Migrationen nur noch in `migrations_safe/` mit nummeriertem Präfix.
Format: `028_beschreibung.sql`, `029_beschreibung.sql` usw.
