# WARNUNG: Vercel "Sensitive" Env-Vars + lokaler `vercel build`

**Entstanden aus:** White-Screen-Incident (2026-08-15, 12:28) — "Uncaught Error:
Invalid supabaseUrl" auf be-hui.com direkt nach einem manuellen Vercel-Deploy.

## Root Cause

Wenn ein Vercel-Environment-Variable im Projekt als **"Sensitive"** markiert ist,
gibt `vercel env pull` / `vercel build` (welches intern pullt) den Wert NICHT im
Klartext zurück, wenn der verwendete Token/Kontext keine Decrypt-Berechtigung hat.
Statt eines Fehlers liefert Vercel den literalen String `"[SENSITIVE]"` als Wert
zurück — OHNE Warnung oder Fehler im Build-Log.

Da `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` und `VITE_SENTRY_DSN` im be-hui
Vercel-Projekt als "Sensitive" markiert sind, wurde beim lokalen `vercel build --prod`
buchstäblich der String `[SENSITIVE]` als Supabase-URL in den JS-Bundle gebacken.
`new URL("[SENSITIVE]")` (im Supabase-Client-Konstruktor) wirft dann zur Laufzeit
"Invalid supabaseUrl. Must be a valid HTTP or HTTPS URL." — kompletter White Screen
für ALLE Nutzer.

## Pflicht-Checkliste vor JEDEM manuellen `vercel build` + `vercel deploy --prebuilt`

1. Nach `vercel build`: **IMMER** `.vercel/output/static/assets/*.js` auf das
   literale Wort `SENSITIVE` grep-en, BEVOR deployed wird:
   ```bash
   grep -rl "SENSITIVE" .vercel/output/static/assets/*.js
   ```
   Kommt hier IRGENDEINE Datei zurück → NICHT deployen. Stattdessen:
2. `.vercel/.env.production.local` öffnen, die betroffenen Keys mit den echten
   Werten aus `.env.production` (repo-versioniert, korrekt) überschreiben.
3. `.vercel/output` löschen und `vercel build --prod` NEU ausführen (ohne
   erneuten `vercel pull` — sonst werden die manuellen Korrekturen wieder
   überschrieben).
4. Erst NACH bestätigtem "kein SENSITIVE mehr im Bundle" → deployen.
5. Nach dem Deploy: Live-Bundle-Check wiederholen (curl auf den ausgelieferten
   Chunk, nicht nur lokal).

## Langfristige Lösung (TODO)
Im Vercel-Dashboard prüfen, ob die "Sensitive"-Markierung auf
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` wirklich nötig ist — es sind
ohnehin öffentliche Client-Keys (Anon-Key ist bewusst öffentlich lesbar, RLS
schützt die Daten). Alternative: Token mit Decrypt-Scope für Sensitive-Vars
verwenden, falls verfügbar.
