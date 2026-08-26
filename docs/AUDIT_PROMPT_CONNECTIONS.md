# HUI Connection Audit — Prompt für Claude / Andere KI-Systeme

## Zweck

Dieser Audit prüft systemweit alle Verbindungen in der HUI-Plattform:
Frontend → Backend, Backend → Datenbank, Edge Functions → Stripe/Supabase,
und alle RPC-Calls auf Konsistenz, Fehlerquellen und falsche Verkabelung.

## Kontext

HUI (be-hui) ist eine Vite/React App mit:
- **Frontend:** ~1000+ JSX/JS Dateien in `src/`
- **Backend:** Supabase (107 Tabellen, 96 RPC-Calls, 99 .from() Referenzen)
- **Edge Functions:** 20 aktive Deno Functions in `supabase/functions/`
- **Payments:** Stripe (PaymentIntent, Connect, Escrow, Webhooks)
- **Admin Dashboard:** Separate Next.js App (SADB)
- **Mobile:** Android (Capacitor), iOS (GitHub Actions)

## Audit-Checkliste

### 1. Frontend → Datenbank: Tabelle-Referenzen prüfen

Für JEDEN `.from('table_name')` Aufruf im Frontend:
- [ ] Existiert die Tabelle in der Datenbank?
- [ ] Sind die abgefragten Spalten in der Tabelle vorhanden?
- [ ] Ist die RLS-Policy korrekt für den Zugriffstyp? (SELECT/INSERT/UPDATE/DELETE)
- [ ] Gibt es Spalten, die der Frontend-Code erwartet, aber in der DB nicht existieren?
- [ ] Gibt es Spalten in der DB, die der Frontend-Code abfragt, aber für die keine GRANT exists?

```bash
# Alle Tabellen-Referenzen im Frontend finden
grep -rn "\.from(['\"]" src/ --include="*.js" --include="*.jsx" | grep -v backup_ | grep -v node_modules

# Gegen Live-DB abgleichen: alle Tabellen
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;

# Spalten einer bestimmten Tabelle
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='TABLE_NAME' AND table_schema='public' ORDER BY ordinal_position;
```

### 2. Frontend → Backend: RPC-Calls prüfen

Für JEDEN `.rpc('function_name')` Aufruf:
- [ ] Existiert die Funktion in der Datenbank?
- [ ] Stimmen die Parameter zwischen Frontend-Call und DB-Definition überein?
- [ ] Stimmt der Rückgabetyp mit dem überein, was der Frontend erwartet?
- [ ] Hat die Funktion SECURITY DEFINER? Wenn ja, sind die Grants korrekt?
- [ ] Kann anon Funktionen ausführen, die nur authenticated oder service_role sollten?

```bash
# Alle RPC-Calls im Frontend
grep -rn "\.rpc(" src/ --include="*.js" --include="*.jsx" | grep -v backup_ | grep -v node_modules

# Gegen Live-DB: alle RPC-Funktionen mit Parametern + Rückgabetyp
SELECT p.proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as result, p.prosecdef as security_definer FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace ORDER BY p.proname;

# Grants pro Funktion
SELECT p.proname, r.rolname, has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_exec FROM pg_proc p CROSS JOIN pg_roles r WHERE p.pronamespace='public'::regnamespace AND r.rolname IN ('anon','authenticated','service_role','public');
```

### 3. Edge Functions → Supabase/Stripe: Verkabelung prüfen

Für JEDDE Edge Function in supabase/functions/:
- [ ] Verwendet sie die korrekte Supabase URL? (nicht hardcoded, aus env)
- [ ] Verwendet sie den korrekten Key? (service_role für Admin-Op, anon nur lesend)
- [ ] CORS-Headers korrekt? (nicht * für sensible Endpoints)
- [ ] Stripe-Webhook-Signature korrekt validiert? (req.text() nicht req.json())
- [ ] Rate-Limiting vorhanden? (innerhalb von serve(), nicht als toter Modul-Code)
- [ ] Error-Handling für fehlgeschlagene DB-Operationen?
- [ ] Transaktionen korrekt? (keine partial writes)

```bash
# Alle Edge Functions
ls supabase/functions/ | grep -v _shared | grep -v backup_ | grep -v "\.ts$"

# Live-Test jeder Funktion
for fn in $(ls supabase/functions/ | grep -v _shared | grep -v backup_ | grep -v "\.ts$"); do
  echo "=== $fn ==="
  curl -s -w "\nHTTP: %{http_code}\n" -X POST \
    "https://PROJECT_REF.supabase.co/functions/v1/$fn" \
    -H "Authorization: Bearer ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' | head -5
done
```

### 4. Stripe-Integration: Zahlungsflüsse prüfen

- [ ] PaymentIntent Creation — korrekte Preisberechnung? (Warenwert + Versand + Plattformgebühr)
- [ ] Stock-Decrement NACH erfolgreicher Zahlung, nicht davor?
- [ ] Webhook-Idempotency bei Wiederholungen?
- [ ] req.text() für raw body (nicht req.json())
- [ ] constructEventAsync mit korrektem Webhook-Secret
- [ ] Event-Deduplication über webhook_events Tabelle
- [ ] Escrow: Transfer nur nach Käufer-Bestätigung oder Auto-Confirm (14 Tage)
- [ ] Talent-Booking: Stock-Decrement + Buchungs-Status korrekt?

### 5. RLS-Policies: Zugriffskontrolle prüfen

Für ALLE 107 Tabellen:
- [ ] Ist RLS aktiviert?
- [ ] Gibt es Policies für jeden Zugriffstyp (SELECT/INSERT/UPDATE/DELETE)?
- [ ] Sind anon-Policies korrekt restriktiv? (keine sensiblen Spalten für unangemeldete)
- [ ] Gibt es USING(true) Policies die alles freigeben?
- [ ] Gibt es roles='{public}' die eigentlich '{authenticated}' sein sollten?
- [ ] Können Nutzer fremde Datensätze lesen/schreiben?

```bash
# Alle RLS-Policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename, cmd;

# RLS-Status aller Tabellen
SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;

# Column-level grants für sensitive Tabellen
SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges WHERE table_name='profiles' AND grantee='anon' AND privilege_type='SELECT';
```

### 6. Frontend-Import-Konsistenz

- [ ] Alle import-Pfade zeigen auf existierende Dateien
- [ ] Keine zirkulären Imports
- [ ] Keine Imports von backup_-Dateien
- [ ] Alle createPortal-Komponenten haben zIndex >= 10500
- [ ] Keine React.lazy für kritische Initial-Render-Komponenten

```bash
grep -rn "createPortal" src/ --include="*.jsx" --include="*.js" | grep -v backup_
grep -rn "zIndex" src/ --include="*.jsx" | grep -v backup_ | grep -v node_modules
```

### 7. Database-Trigger & Constraints

- [ ] Alle updated_at-Trigger vorhanden und korrekt
- [ ] FK-Constraints korrekt (ON DELETE CASCADE vs SET NULL)
- [ ] UNIQUE-Constraints wo nötig
- [ ] CHECK-Constraints für kritische Felder
- [ ] Keine orphaned Records durch fehlende FKs

### 8. Storage-Buckets & Policies

- [ ] Jeder Bucket hat korrekte Policies
- [ ] Keine Buckets ohne jegliche Policy
- [ ] chat-media Bucket ist nicht public
- [ ] Upload-Policies prüfen auf folder-ownership

### 9. Environment Variables & Secrets

- [ ] Edge Functions: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] Frontend: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLIC_KEY, VITE_SENTRY_DSN
- [ ] Keine Secrets hardcoded im Code
- [ ] Keine .env Dateien committed

### 10. Vercel/Deployment-Konsistenz

- [ ] vercel.json rewrites korrekt
- [ ] CSP-Header gültige Sources
- [ ] Build-Output (www/) korrekt
- [ ] Version in version.ts synchron mit build.gradle
- [ ] OTA-Bundle korrekt deployed

## Ausgabeformat

Für jeden gefundenen Fehler:
```
❌ [SCHWERWIEGEND] Datei/Ort: Beschreibung
   Erwartet: X — Gefunden: Y — Fix: Konkrete Lösung

⚠️ [WARNUNG] Datei/Ort: Beschreibung
   Risiko: Was passieren kann — Empfehlung: Was zu tun ist

✅ [OK] Bereich: Beschreibung — alles korrekt
```

## Priorisierung

1. SCHWERWIEGEND — Abstürze, Datenverlust, Sicherheitslücken, fehlerhafte Zahlungen
2. WARNUNG — Inkonsistenzen, veraltete Referenzen, Performance-Probleme
3. INFO — Tech-Debt, fehlende Doku, Verbesserungspotenzial

## Wichtige Hinweise

- IMMER gegen die Live-DB prüfen, nicht gegen Migration-Dateien
- Backups NIE in src/, res/, oder java/ Verzeichnissen
- Bei jedem Fix: erst Backup, dann ändern, dann live verifizieren
- anon Key für Frontend-Tests, service_role für Admin-Tests
- RPC-Rückgabetypen müssen mit DB-Spaltentypen übereinstimmen (text[] ≠ jsonb!)
- Bekannte Falle: media_urls ist text[] in der DB, oft fälschlich als jsonb in RPCs deklariert
- Bekannte Falle: messages.chat_id ist TEXT, chats.id ist UUID — Typ-Mismatch
