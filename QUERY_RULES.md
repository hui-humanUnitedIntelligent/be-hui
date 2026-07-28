# HUI Query Rules

**Status:** Richtlinie (nicht maschinell durchgesetzt)  
**Letzte Aktualisierung:** 2026-07-28

---

## Aktueller Stand (verifiziert)

Diese Regeln beschreiben den **Zielzustand**, nicht den aktuellen Implementierungsstand.

| Regel | Ziel | Aktueller Stand |
|-------|------|-----------------|
| Rule 1: Kein direkter `fetch()` zu Supabase REST | Alle Queries über SDK | ⚠️ Einige Legacy-Stellen nutzen direkten fetch |
| Rule 2: RLS immer aktiv | Keine `service_role` ohne Grund | ✅ Aktiv |
| Rule 3: Kein `select('*')` in Produktion | Explizite Spalten-Selektion | ⚠️ Einige Stellen nutzen select('*') |
| Rule 4: Queries über `/services/db.js` | Zentraler Query-Layer | ❌ Nicht implementiert — direkter Supabase-Aufruf |
| Rule 5: Sensible Felder via RPC (SECURITY DEFINER) | trust_score etc. nie direkt | ✅ Seit Audit-Fix 007 via rpc_get_public_profile() |

---

## Durchsetzung

Aktuell: **keine automatische Durchsetzung** (kein Linter-Plugin, kein Pre-Commit-Hook).

Vor Public Beta implementieren:
- ESLint-Regel für `select('*')`
- Import-Restriction für direkte Supabase-Aufrufe außerhalb von Hooks
- Pre-commit-Hook der `services/db.js`-Nutzung prüft

---

## Kanonische Query-Muster

```js
// ✅ RICHTIG — explizite Felder
const { data } = await supabase
  .from('works')
  .select('id, title, status, user_id, created_at')
  .eq('status', 'published');

// ❌ FALSCH — nie in Produktion
const { data } = await supabase.from('works').select('*');

// ✅ RICHTIG — sensitive Daten via RPC
const { data } = await supabase.rpc('rpc_get_public_profile', { p_username: username });
```
