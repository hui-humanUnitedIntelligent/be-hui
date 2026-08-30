# HUI Incidents

## INC-001: Bestätigungsmails wurden nicht zugestellt (2026-08-30)

**Symptom:** Neue Nutzer (z.B. Karen Hagen, karen.hagen@gmx.de) registrierten
sich erfolgreich (User existiert in SADB + auth.users), erhielten aber NIE
eine E-Mail-Bestätigungsmail. Login blockiert mit "Bitte bestätige zuerst
deine E-Mail." Kein Fehler im Frontend, kein Crash — die Mail verschwand
einfach lautlos.

**Root Cause:** Supabase Auth Projekt hatte KEIN eigenes SMTP konfiguriert
(`smtp_host: null`). Ohne Custom-SMTP nutzt Supabase seinen eingebauten
Default-Mailer, der auf `rate_limit_email_sent: 2` (nur 2 Mails/Stunde für
das GESAMTE Projekt) gedrosselt war. Bei aktivem Testerbetrieb war dieses
Kontingent binnen Minuten aufgebraucht — jede weitere Registrierung bekam
danach schlicht KEINE Mail mehr, ohne dass irgendwo ein Fehler sichtbar war.

Der eigene `send-auth-email` Edge-Function-Hook (mehrsprachige Templates)
war korrekt konfiguriert und lieferte korrektes HTML — aber der Versand
selbst lief weiterhin über Supabase's rate-limitiertes Default-Relay, nicht
über einen eigenen Mail-Provider.

**Fix (2026-08-30):**
1. Supabase Auth SMTP auf Resend umgestellt (Management API `PATCH
   /v1/projects/{ref}/config/auth`):
   - `smtp_host`: smtp.resend.com
   - `smtp_port`: 465
   - `smtp_user`: resend
   - `smtp_pass`: RESEND_API_KEY (bereits vorhanden, genutzt für
     delete-account-Mails)
   - `smtp_sender_name`: HUI
   - `smtp_admin_email`: noreply@be-hui.com (verifizierte Resend-Domain)
   - `smtp_max_frequency`: 5 (Sekunden zwischen Mails, war 60)
   - `rate_limit_email_sent`: 100 (war 2)
2. Karen Hagens Bestätigungsmail nachträglich ausgelöst via
   `POST /auth/v1/resend` (type=signup, email=karen.hagen@gmx.de) — HTTP
   200, `confirmation_sent_at` aktualisiert.

**Verifikation:** `confirmation_sent_at` für Karens User-ID
(b8a69c4e-f11b-4736-9b9e-8a40288a60fa) sprang von 17:43:55 (verloren) auf
18:29:07 (neu, über Resend-SMTP).

**Lehre:** Bei JEDEM neuen Supabase-Projekt/Environment sofort prüfen ob
Custom SMTP konfiguriert ist (`GET /v1/projects/{ref}/config/auth` →
`smtp_host`). Ohne Custom SMTP ist das Projekt bei mehr als 2-4 Signups/Std.
faktisch nicht produktionstauglich — Nutzer verschwinden lautlos ohne
Fehlermeldung. Sollte Teil der Go-Live-Checkliste werden (analog
Scale-Readiness Punkte 1-5).
