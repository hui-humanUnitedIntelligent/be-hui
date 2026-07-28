# SQL Archive

Diese Dateien sind historische Migrations- und Fix-Skripte aus der Entwicklungsphase.

**Sie sind NICHT mehr aktiv und NICHT mehr relevant für das Produktivsystem.**

## Warum hier?

Alle hier enthaltenen Dateien wurden im Zeitraum 2026-06 bis 2026-07 als
iterative Fixes deployed und ersetzt. Das finale, saubere Schema ist
ausschließlich in `sql/` (eine Ebene höher) dokumentiert.

## SSOT für aktives Ambassador-System

- `sql/audit_fix_003_ambassador_system.sql` — aktive RPCs + Daten-Fixes
- Deployed: 2026-07-28

## Inhalt

- `ambassador_*.sql` — 18 iterative Ambassador-RPC-Rewrites (Befund 3 des Audits)
- `hui_028_*.sql` bis `hui_060_*.sql` — historische Schema-Migrationen
- `stripe_*.sql` — historische Stripe-Integration-Skripte

**Nicht deployen. Nur zur historischen Referenz.**
