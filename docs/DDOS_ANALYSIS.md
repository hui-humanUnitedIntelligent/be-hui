# HUI DDoS-Abwehr — Analyse & Bestandsaufnahme
**Erstellt:** 2026-08-22  
**Status:** Analyse nur, keine Implementierung  
**Zweck:** Grundlage für späteren Umsetzungs-Prompt

---

## 1. Bestandsaufnahme: Aktuelle Infrastruktur

### 1.1 Layer-Übersicht

| Layer | Technologie | Rolle | DDoS-Schutz aktiv? |
|-------|------------|-------|-------------------|
| **DNS** | Vercel Managed DNS (vermutlich) | Domain-Auflösung für be-hui.com, app.be-hui.com, www.be-hui.com | Vercel Basic DNS (kein dedizierter DNS-Schutz) |
| **CDN / Edge** | Vercel Edge Network | Statische Assets (HTML, JS, CSS, Bilder) aus `www/` | Ja — Vercel Edge Network hat eingebauten DDoS-Schutz (Layer 3/4, basic Layer 7) |
| **Frontend Hosting** | Vercel (Next.js/SPA) | SPA-Hosting, Serverless Functions (`api/og.js`) | Vercel's eigener Schutz (siehe Detail unten) |
| **Backend / Datenbank** | Supabase (PostgreSQL) | Datenbank, Auth, Storage, Edge Functions | Supabase Platform-Level Schutz (kein anwendbarer Rate Limit von Supabase selbst) |
| **Edge Functions** | Supabase Deno Functions (20 Funktionen) | Zahlungen, Voting, Moderation, Webhooks | **Eigenes Rate Limiting** implementiert (siehe 1.4) |
| **Admin Dashboard** | Vercel (Next.js), separate Domain (hui-admin.com) | Admin-Oberfläche, 82 API-Routen | Cookie-Auth, Middleware-Guard, **kein Rate Limiting** |
| **Base44 Backend** | Base44 Platform | sadb-webhook Funktion, Entities | Base44 Platform-Level (kein einsehbarer Schutz) |
| **Payments** | Stripe | Zahlungsabwicklung | Stripe-eigener Schutz (sehr robust) |

### 1.2 DDoS-Schutz pro Layer (Detail)

#### Vercel Edge Network
- **Layer 3/4 (Volumetrisch):** Vercel nutzt AWS-Infrastruktur mit eingebautem DDoS-Schutz auf Netzwerk-Ebene. Große volumetrische Angriffe werden von AWS Shield Standard abgewehrt (kostenlos, automatisch).
- **Layer 7 (HTTP):** Vercel hat **keine dedizierte WAF**. Es gibt basic Rate Limiting auf Vercel-Ebene (Edge Middleware möglich), aber **nicht aktiviert** für HUI.
- **Bot-Schutz:** Nicht vorhanden.
- **Fazit:** Grundschutz vorhanden (AWS Shield Standard), aber **kein applikationsspezifischer Layer-7-Schutz**.

#### Supabase
- **Datenbank:** Supabase hat Platform-Level DDoS-Schutz (Cloudflare für API-Gateway), aber **kein pro-Endpoint Rate Limiting** von Supabase selbst.
- **Auth:** Supabase Auth hat eingebautes Rate Limiting (undocumented, ca. 30 Requests/10s pro IP für Auth-Endpoints).
- **Storage:** Kein Rate Limiting auf Supabase Storage API.
- **Edge Functions:** Kein Supabase-seitiges Rate Limiting — **HUI hat eigenes implementiert** (siehe 1.4).
- **Fazit:** Supabase schützt sich selbst, aber die App muss eigene Rate Limits setzen.

#### Vercel Serverless (`api/og.js`)
- Nur 1 Serverless Function (`og.js` — OpenGraph für Social-Crawler).
- Wird nur für Bot-User-Agents ausgeliefert (Vercel Rewrite mit `has`-Condition).
- **Kein Rate Limiting** auf dieser Funktion.
- **Kein Auth** erforderlich (öffentlicher Bot-Endpoint).

### 1.3 Öffentlich erreichbare Endpunkte

#### Supabase (über anon key im Frontend-Code)
Die Supabase URL und anon key sind im Frontend-Code sichtbar (`src/lib/supabaseClient.js`). Jeder kann diese extrahieren und direkt API-Calls machen.

**Öffentlich lesbare Tabellen (RLS `USING (true)` oder `TO anon`):**
| Tabelle/Function | Zugriff | Risiko |
|-----------------|---------|--------|
| `wirker` | anon SELECT | Niedrig — öffentliche Profile |
| `impact_projects` | anon SELECT | Niedrig — öffentliche Projekte |
| `impact_rounds` | anon SELECT | Niedrig — Voting-Runden |
| `impact_distributions` | anon SELECT | Niedrig — Verteilungen |
| `impact_votes_archive` | anon SELECT | Niedrig — archivierte Votes |
| `post_comments` | SELECT (true) | Niedrig — öffentliche Kommentare |
| `comment_hearts` | SELECT (true) | Niedrig |
| `profiles` (eingeschränkt) | anon SELECT (nur öffentliche Felder) | Mittel — Profil-Daten scrapebar |

**Öffentlich ausführbare RPCs (GRANT EXECUTE TO anon):**
| RPC | Risiko |
|-----|--------|
| `nearby_wirker(lat,lng,radius,limit)` | Mittel — Geo-Scraping möglich |
| `nearby_works(...)` | Mittel |
| `nearby_experiences(...)` | Mittel |
| `nearby_invitations(...)` | Mittel |
| `rpc_discover_people(text,text,int,int)` | Hoch — Such-Endpoint ohne Auth, teure Query |
| `rpc_get_profile_likes(uuid)` | Niedrig |
| `rpc_get_orb_growth_stage(uuid)` | Niedrig |
| `rpc_check_email_exists(text)` | **Hoch** — Email-Enumeration möglich |
| `rpc_check_email_confirmed(text)` | **Hoch** — Email-Status-Enumeration |
| `rpc_log_registration_blocked(text,text)` | Mittel — Log-Injection |
| `rpc_get_votes_summary / rpc_get_vote_counts` | Niedrig |
| `rpc_get_global_vote_stats()` | Niedrig |
| `haversine_km(...)` | Niedrig |

#### Supabase Storage (Uploads)
- Storage Buckets: chat-media (für Chat-Bilder/Videos)
- Upload über anon key möglich, wenn eine Session existiert
- **Kein Rate Limiting auf Uploads**

#### Supabase Edge Functions (20 Funktionen)
Alle haben Rate Limiting (siehe 1.4), sind aber über die Supabase Function URL öffentlich erreichbar.

#### Base44 Backend Function
- `sadb-webhook` — POST-Endpoint, auth über asServiceRole
- Öffentlich erreichbar, aber nur für Supabase-Trigger gedacht

#### Admin Dashboard (hui-admin.com)
- 82 API-Routen, davon haben **29 einen guardAdmin** (Cookie-Check)
- **53 API-Routen haben keinen Guard** — aber Middleware blockiert nicht-API-Pfade
- Middleware lässt `/api/*` immer durch — **alle Admin-APIs sind öffentlich erreichbar**, nur durch Cookie-Guard geschützt (kein Rate Limiting)

### 1.4 Vorhandenes Rate Limiting (Edge Functions)

**Implementierung:** `supabase/functions/_shared/rateLimit.ts`
- IP-basiert (x-forwarded-for Header)
- Backing Store: Supabase `_rate_limits` Tabelle
- Fail-open Strategie (bei Fehlern → Request wird erlaubt)
- Cleanup: 5% Wahrscheinlichkeit pro Request ( probabilistic cleanup)

**Konfiguration pro Function:**

| Function | Action-Name | Max Requests | Window (s) | Bewertung |
|----------|------------|-------------|------------|-----------|
| create-payment-intent | create-payment | 5 | 60 | ✅ Gut |
| create-support-payment | support-payment | 5 | 60 | ✅ Gut |
| create-talent-booking-payment | talent-booking-payment | 5 | 60 | ✅ Gut |
| delete-account | delete-account | 3 | 60 | ✅ Gut |
| cast-impact-vote | cast-vote | 10 | 60 | ✅ Gut |
| moderate-content | moderate-content | 10 | 60 | ✅ Gut |
| report-moment | report-moment | 10 | 60 | ✅ Gut |
| cancel-talent-booking | cancel-booking | 10 | 60 | ✅ Gut |
| check-order-status | check-order | 30 | 60 | ⚠️ Hoch |
| handle-payment-webhook | payment-webhook | 100 | 60 | ⚠️ Sehr hoch (Stripe-Webhook) |
| send-push-notifications | push-notifications | 20 | 60 | ✅ Gut |
| distribute-impact-round | distribute-impact | 3 | 60 | ✅ Gut |
| confirm-and-transfer | confirm-transfer | 10 | 60 | ✅ Gut |
| release-escrow | release-escrow | 10 | 60 | ✅ Gut |
| release-payout | release-payout | 5 | 60 | ✅ Gut |
| sync-payout-bank-account | sync-bank | 5 | 60 | ✅ Gut |
| ambassador-payout-execute | payout-execute | 5 | 60 | ✅ Gut |
| ambassador-stripe-connect | stripe-connect | 5 | 60 | ✅ Gut |
| apply-migration-118 | apply-migration | 3 | 60 | ✅ Gut |
| ticket-reply | ticket-reply | 10 | 60 | ✅ Gut |

**Fazit:** Alle 20 Edge Functions haben Rate Limiting. **ABER:** Das Rate Limiting ist **nur auf Supabase Edge Functions**, nicht auf:
- Direct Supabase REST API calls (via anon key)
- Supabase Auth endpoints
- Supabase Storage uploads
- Vercel Serverless Functions
- Admin Dashboard API

### 1.5 Vorhandene Schutzmechanismen — Zusammenfassung

| Mechanismus | Vorhanden? | Wo? | Lücken |
|-----------|-----------|-----|--------|
| **Rate Limiting** | ✅ Ja | Supabase Edge Functions (20/20) | ❌ Fehlt auf: Direct REST API, Auth, Storage, Vercel, Admin API |
| **WAF** | ❌ Nein | Nirgends | Keine Web Application Firewall auf keinem Layer |
| **Bot-Erkennung / Captcha** | ❌ Nein | Nirgends | Login, Registrierung, Suche — alle ohne Bot-Schutz |
| **IP-Reputation-Filter** | ❌ Nein | Nirgends | Keine IP-Blocklisten, keine Geo-Blocking |
| **Auth-Throttling** | ⚠️ Teilweise | Supabase Auth hat eigenes (undokumentiertes) Rate Limiting | Kein app-level Lockout nach N Fehlversuchen |
| **RLS (Row Level Security)** | ✅ Ja | Auf meisten Tabellen | Aber: anon hat SELECT auf viele Tabellen (public data) |
| **2FA/MFA** | ✅ Ja | Admin Dashboard (Pflicht-2FA für Superadmins) | Nicht für App-Nutzer |
| **HTTPS/TLS** | ✅ Ja | Vercel + Supabase automatisch | — |

---

## 2. Bedrohungsmodell

### 2.1 Layer 7 (HTTP Flood auf API/Auth/Login)

**Angriffsvektor:** HTTP-Flood — tausende Requests/s auf spezifische Endpoints.

| Ziel | Risiko | Aktuelle Abwehr | Bewertung |
|------|--------|----------------|-----------|
| **Supabase Auth (Login/Signup)** | 🔴 Hoch | Supabase's eigenes Rate Limiting (undokumentiert, ca. 30/10s pro IP) | **Unzureichend** — Angreifer mit Botnet (rotierende IPs) kann jede IP-Adresse unter dem Limit bleiben und trotzdem massiv Last erzeugen |
| **Direct Supabase REST API** (via anon key) | 🔴 Hoch | **Keines** — anon key ist öffentlich | Angreifer kann direkt DB-Queries schicken (SELECT auf alle öffentlichen Tabellen, RPCs ausführen) — keine Drosselung |
| **`rpc_discover_people`** (Suche) | 🔴 Sehr hoch | Keines (nur GRANT EXECUTE TO anon) | **Teuerster Endpoint** — komplexe Such-Query, pro Anfrage serverseitig teuer. Unbegrenzt aufrufbar. |
| **`rpc_check_email_exists`** | 🟡 Mittel | Keines | Email-Enumeration: Angreifer kann tausende Emails testen → Account-Existenz-Leak |
| **Vercel `api/og.js`** | 🟡 Mittel | Keines | Serverless Function mit DB-Query — jeder Request kostet Vercel Function-Ausführung + DB-Query |
| **Supabase Edge Functions** | 🟢 Niedrig | Rate Limiting aktiv | Gut geschützt, aber: nur pro-IP, Botnet umgeht |
| **Admin Dashboard API** | 🟡 Mittel | Cookie-Guard | Kein Rate Limiting — Brute-Force auf Login möglich (Supabase Auth übernimmt teilweise) |

### 2.2 Layer 3/4 (Volumetrisch)

| Angriff | Abwehr | Bewertung |
|---------|--------|-----------|
| UDP Flood, SYN Flood, amplification | AWS Shield Standard (Vercel) + Cloudflare (Supabase API Gateway) | **Ausreichend** — wird von Provider-Ebene abgewehrt. App-Ebene nicht betroffen. |
| ICMP Flood | Provider-Ebene | Abgewehrt |

**Fazit Layer 3/4:** Volumetrische Angriffe werden von AWS/Vercel/Cloudflare abgewehrt. **Keine App-Aktion nötig.**

### 2.3 Slow-Loris / langsame Verbindungen

| Ziel | Risiko | Aktuelle Abwehr | Bewertung |
|------|--------|----------------|-----------|
| Vercel (Frontend) | 🟡 Mittel | Vercel hat Server-Timeouts (Serverless: 10s für og.js, static: schnell) | Vercel terminiert langsame Verbindungen automatisch |
| Supabase REST API | 🟡 Mittel | Supabase hat Connection-Timeouts | Teilweise geschützt |
| Supabase Edge Functions | 🟡 Mittel | Deno hat keine dedizierte Slow-Loris-Abwehr | Jede offene Connection verbraucht Ressourcen |
| Admin Dashboard | 🟡 Mittel | Vercel Next.js Serverless — hat Timeout | Geschützt durch Vercel |

**Fazit:** Vercel/Supabase terminieren langsame Verbindungen nach Timeout, aber ein Angreifer kann viele gleichzeitige langsame Verbindungen öffnen (Resource Exhaustion).

### 2.4 Credential-Stuffing / Login-Brute-Force

| Aspekt | Status | Bewertung |
|--------|--------|-----------|
| Supabase Auth Rate Limit | Vorhanden (Supabase-intern, undokumentiert) | ⚠️ Reicht für kleine Angriffe, nicht für Botnets |
| Account-Lockout nach N Fehlversuchen | **Nicht vorhanden** | 🔴 Kritisch — kein app-level Lockout |
| Captcha bei Login | **Nicht vorhanden** | 🔴 Bot kann Login automatisieren |
| Password-Reset Rate Limit | **Nicht vorhanden** (nur Supabase intern) | 🟡 Email-Bombardement möglich |
| MFA/2FA | Nur für Admins (Pflicht) | ⚠️ App-Nutzer ohne 2FA-Schutz |

**Fazit:** Credential-Stuffing ist ein **kritischer Vektor**. Supabase's internes Rate Limiting schützt vor einzelnen IP-Brute-Force, aber nicht vor verteilten Angriffen.

### 2.5 Bot-Traffic auf teure Endpunkte

| Endpunkt | Kosten pro Request | Aktuelle Abwehr | Risiko |
|----------|-------------------|----------------|-------|
| `rpc_discover_people` | 🔴 Hoch (komplexe Such-Query, potentiell Full-Table-Scan) | Keines | **Sehr hoch** — Botnet kann DB lahmlegen |
| `nearby_wirker/works/experiences` | 🟡 Mittel (Geo-Query mit Index) | Keines | Hoch — Scraping + Last |
| Direct `SELECT * FROM wirker` | 🟡 Mittel | RLS erlaubt anon SELECT | Hoch — Full-Table-Scan möglich |
| Supabase Storage Upload | 🟡 Mittel (Bandbreite, Storage-Kosten) | Kein Rate Limit | Mittel — Upload-Flooding |
| `rpc_check_email_exists` | 🟢 Niedrig (Index-Lookup) | Keines | Mittel — Email-Enumeration |

### 2.6 Missbrauch offener Webhooks/Callbacks

| Webhook | Auth | Risiko | Bewertung |
|---------|------|--------|-----------|
| `handle-payment-webhook` (Supabase Edge) | Stripe-Signatur-Verifikation | Niedrig | ✅ Stripe verifiziert Signatur |
| `sadb-webhook` (Base44 Function) | asServiceRole | ⚠️ Mittel | Endpoint ist öffentlich, auth nur über Service-Role-Key im Code |
| Supabase DB Webhooks (pg_net) | Intern (Trigger) | Niedrig | Nur DB-intern, nicht extern erreichbar |

---

## 3. Empfehlungsliste

### 3.1 Vercel-eigene Schutzfunktionen

| Maßnahme | Beschreibung | Vor- | Nach- | Intern/Extern? |
|----------|-------------|------|-------|----------------|
| Vercel Edge Middleware (Rate Limiting) | Custom Middleware auf Edge-Ebene, die IP-basiertes Rate Limiting für alle Vercel-Routen setzt | + Keine externe Abhängigkeit  
+ Schnell (Edge-Ebene)  
+ Kostenlos | - Nur Vercel-Routen, nicht Supabase  
- Kein WAF  
- Limit: 50 Middleware-Instanzen | **Intern** (Vercel Konfig) |
| Vercel `vercel.json` Rate Limiting | Static Rate Limiting via `vercel.json` Headers | + Einfach zu konfigurieren  
+ Kostenlos | - Sehr rudimentär  
- Keine pro-IP-Steuerung  
- Nur für Vercel-Routen | **Intern** |

### 3.2 Cloudflare vor Vercel (Reverse Proxy)

| Maßnahme | Beschreibung | Vor- | Nach- | Intern/Extern? |
|----------|-------------|------|-------|----------------|
| Cloudflare Proxy (DNS → CF → Vercel) | Cloudflare als Reverse Proxy vor Vercel. Alle Traffic geht durch CF zuerst. | + WAF (Managed Rules + Custom)  
+ Rate Limiting (pro IP, pro Path)  
+ Bot Management  
+ L7 DDoS Protection  
+ Free Plan ausreichend für Basics | - DNS muss zu Cloudflare umgezogen werden  
- Latenz +10-20ms  
- Vercel-Integration: `X-Forwarded-For` Header beachten  
- SSL muss korrekt konfiguriert werden | **Extern** (Cloudflare) |
| Cloudflare WAF Rules | Custom Rules: Block SQL-Injection, XSS, Path-Traversal | + Einer der besten WAF-Regelsätze  
+ Echtzeit-Updates | - false positives möglich  
- Tuning nötig | **Extern** |
| Cloudflare Bot Management | JS-Challenge für verdächtige User-Agents | + Sehr effektiv gegen Credential-Stuffing  
+ Nahtlos (kein Captcha für echte Nutzer) | - Pro Plan ~$200/Monat  
- Free Plan: nur Basic Bot Fight Mode | **Extern** |

### 3.3 Supabase-seitige Maßnahmen

| Maßnahme | Beschreibung | Vor- | Nach- | Intern/Extern? |
|----------|-------------|------|-------|----------------|
| Supabase Rate Limiting (API Gateway) | Supabase hat (undokumentierte) Rate Limits auf API-Gateway-Ebene | + Schützt Datenbank direkt  
+ Kostenlos | - Nicht konfigurierbar  
- Undokumentiert  
- Reicht nicht für gezielte Angriffe | **Intern** (Supabase) |
| RLS als zusätzliche Bremse | RLS verhindert Datendiebstahl, aber nicht Last | + Sicherheitsebene | - RLS ist kein DDoS-Schutz — Queries werden trotzdem ausgeführt | **Intern** (bereits aktiv) |
| Supabase Custom Claims / JWT-Short-TTL | Kurzlebige JWTs reduzieren Missbrauch fenster | + Reduziert Token-Diebstahl-Impact | - Erzeugt mehr Auth-Refresh-Traffic | **Intern** |
| RPC-Parameter-Validierung | Alle anon RPCs müssen Parameter validieren (Limit, Offset, Max-Radius) | + Verhindert teure Queries (z.B. `limit=999999`) | - Muss pro RPC implementiert werden | **Intern** |

### 3.4 Externe Dienste (falls Cloudflare nicht reicht)

| Dienst | Einsatzbereich | Kosten | Bewertung |
|--------|---------------|-------|---------|
| AWS Shield Advanced | Layer 3/4 + 7, für Vercel/AWS | ~$3.000/Monat + Traffic | Übertrieben für HUI's Skalenniveau |
| Fastly | CDN + WAF + Rate Limiting | Ab ~$50/Monat + Traffic | Alternative zu Cloudflare, ähnlich |
| reCAPTCHA / hCaptcha / Turnstile | Bot-Schutz auf Login/Registrierung | Kostenlos (Turnstile) | Ergänzung, kein alleinstehender DDoS-Schutz |

---

## 4. Priorisierte Maßnahmenliste (Entwurf)

### 🔴 KRITISCH (vor 100k+ Nutzern zwingend)

1. **Rate Limiting auf Direct Supabase REST API** — Der anon key erlaubt direkte DB-Calls ohne Limit. Lösung: Entweder Cloudflare Rate Limiting vor Supabase, oder alle öffentlichen RPCs mit internem Rate Limiting versehen (analog Edge Function Pattern).
2. **Rate Limiting auf `rpc_discover_people`** — Der teuerste öffentliche Endpoint. Unbegrenzt aufrufbar. Lösung: Parameter-Limits (max `limit=50`), internes Rate Limiting in der RPC.
3. **Rate Limiting auf `rpc_check_email_exists`** — Email-Enumeration ohne Limit. Lösung: Rate Limit + Captcha/Throttling.
4. **Rate Limiting auf Admin Dashboard API** — 53 von 82 Routen haben kein Rate Limiting. Brute-Force auf Login möglich. Lösung: Next.js Middleware mit IP-basiertem Rate Limiting.
5. **Account-Lockout nach N Fehlversuchen** — Login hat kein app-level Lockout. Lösung: Supabase Auth Settings (max login attempts) oder Custom Lockout-Tabelle.

### 🟡 WICHTIG (sollte vor Launch erfolgen)

6. **Captcha/Turnstile auf Login & Registrierung** — Cloudflare Turnstile (kostenlos, privacy-friendly) auf Login/Signup/Password-Reset.
7. **Supabase Storage Upload Rate Limiting** — Uploads ohne Limit. Lösung: Custom Rate Limiting vor Upload (Edge Function als Proxy).
8. **Parameter-Hardening auf anon RPCs** — Alle öffentlichen RPCs müssen harte Limits setzen: `limit ≤ 50`, `offset ≤ 1000`, `radius ≤ 100km`. Verhindert teure Scans.
9. **Rate Limiting auf Vercel `api/og.js`** — Serverless Function ohne Schutz. Lösung: Vercel Edge Middleware.
10. **Supabase Connection-Pooling / PgBouncer** — Vor 100k+ Nutzern zwingend (bereits in Scale-Readiness Liste). Schützt vor Connection-Exhaustion.

### 🟢 OPTIONAL (nice-to-have)

11. **Cloudflare als Reverse Proxy vor Vercel** — WAF, Bot Management, globale Rate Limiting. Kostenlos im Free Plan für Basics.
12. **Geo-Blocking** — Regionen blockieren wo HUI nicht aktiv ist (optional, DSGVO-kritisch).
13. **IP-Reputation-Listen** — Bekannte Botnet/Proxy-IPs blockieren (Cloudflare übernimmt dies automatisch).
14. **Slow-Loris-Schutz** — Vercel/Supabase terminieren bereits nach Timeout, aber explizite Slow-Read-Detection wäre zusätzliche Ebene.
15. **DDoS-Monitoring / Alerting** — Alerts bei plötzlichem Traffic-Spike (Vercel Analytics oder externes Uptime-Monitoring).

---

## 5. Frage an Base44: Kann Base44 einen DDoS-Grundschutz vollständig selbst bereitstellen?

### Antwort: **Benötigt externen Layer** — konkret: Cloudflare vor Vercel.

### Begründung:

**Was Base44/Vercel/Supabase intern abdecken:**
- Layer 3/4 (volumetrisch): ✅ AWS Shield Standard (Vercel) / Cloudflare (Supabase Gateway)
- Supabase Edge Functions Rate Limiting: ✅ Eigenes System (20/20 Functions)
- RLS: ✅ Datensicherheit (aber kein DDoS-Schutz)

**Was NICHT intern abgedeckt werden kann:**
1. **Direct Supabase REST API Rate Limiting** — Supabase hat keine konfigurierbaren Rate Limits für die REST API. Der anon key ist öffentlich. Ein Angreifer kann direkt DB-Queries schicken. **Keine interne Lösung möglich** — Supabase bietet dies nicht an.
2. **WAF (Web Application Firewall)** — Weder Vercel noch Supabase bieten eine WAF. SQL-Injection, XSS, Path-Traversal müssen auf Applikationsebene abgewehrt werden, was fehleranfällig ist.
3. **Bot-Erkennung** — Keine der aktuellen Layer bietet Bot-Detection. Credential-Stuffing mit rotierenden IPs kann nicht durch IP-Rate-Limiting allein abgewehrt werden.
4. **Globales Rate Limiting (alle Layer)** — Aktuelles Rate Limiting ist nur auf Supabase Edge Functions. Direct REST, Auth, Storage, Vercel, Admin API — alle ungeschützt.
5. **Auth-Throttling (app-level)** — Supabase's internes Rate Limiting ist undokumentiert und nicht konfigurierbar.

**Konkrete Empfehlung: Cloudflare Free/Pro Plan**

Cloudflare als DNS-First-Proxy (DNS zu CF umziehen, CF → Vercel):
- **Free Plan:** Rate Limiting (1 Regel), Bot Fight Mode (basic), L7 DDoS Protection, SSL — kostenlos
- **Pro Plan ($20/Monat):** Erweiterte WAF-Regeln, Image Optimization, Analytics — ausreichend für HUI
- **Business Plan ($200/Monat):** Bot Management (Custom Rules) — nur bei echten Bot-Angriffen nötig

**Zusätzlich intern nötig (kann von uns selbst gemacht werden):**
- Account-Lockout nach N Fehlversuchen (Supabase Settings oder Custom)
- Parameter-Hardening auf anon RPCs (Limit/Offset/Radius)
- Rate Limiting auf Admin Dashboard API (Next.js Middleware)
- Captcha/Turnstile auf kritischen Formularen (Cloudflare Turnstile = kostenlos)

**Fazit:**  
→ **„Benötigt externen Layer"** — Cloudflare vor Vercel (Free/Pro reicht aus).  
→ Plus interne Maßnahmen (Rate Limiting, Parameter-Hardening, Lockout) für Applikationsebene.  
→ Layer 3/4 ist bereits durch AWS/Vercel abgedeckt, kein zusätzlicher Layer nötig.

---

## 6. Anhang: Vollständige Endpoint-Inventur

### Öffentlich erreichbar ohne Auth (anon key):

| Endpoint | Typ | Rate Limited? | Risiko |
|----------|------|---------------|--------|
| Supabase REST API (alle Tabellen mit anon SELECT) | REST | ❌ | Hoch |
| `rpc_discover_people` | RPC | ❌ | Sehr hoch |
| `rpc_check_email_exists` | RPC | ❌ | Hoch (Enumeration) |
| `rpc_check_email_confirmed` | RPC | ❌ | Hoch (Enumeration) |
| `nearby_wirker/works/experiences` | RPC | ❌ | Mittel |
| `rpc_get_orb_growth_stage` | RPC | ❌ | Niedrig |
| `rpc_log_registration_blocked` | RPC | ❌ | Mittel (Injection) |
| Supabase Auth (signUp, signInWithPassword) | Auth | ⚠️ (Supabase intern) | Hoch |
| Supabase Storage (Upload mit Session) | Storage | ❌ | Mittel |
| Vercel `api/og.js` | Serverless | ❌ | Mittel |
| Base44 `sadb-webhook` | Backend | ❌ | Niedrig (Service-Role) |
| Admin Dashboard Login (`/api/auth/admin-login`) | API | ❌ | Hoch (Brute-Force) |
| Admin Dashboard (53 unguarded API routes) | API | ❌ | Mittel |
| Supabase Edge Functions (20 Functions) | Edge | ✅ | Niedrig |

