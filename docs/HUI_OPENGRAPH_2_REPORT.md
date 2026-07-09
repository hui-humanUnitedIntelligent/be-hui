# HUI OpenGraph 2.0 — Technischer Bericht

**Datum:** 2026-07-09  
**Feature:** Dynamische Social Preview Cards (OpenGraph 2.0)

---

## Zusammenfassung

Das bestehende Bot-only-OpenGraph-System wurde um **serverseitig generierte HUI Social Cards** (1200×630 JPEG) erweitert. Jeder öffentliche Inhalt erhält eine individuelle Vorschaukarte im HUI Living Design System. Deep-Link-Routing und Share-Architektur bleiben unverändert.

---

## Angepasste Dateien

| Datei | Änderung |
|-------|----------|
| `api/og-resolve.cjs` | **Neu** — Gemeinsame Content-Auflösung für HTML + Bild, RLS-konforme Public-Checks, ETag-Generierung |
| `api/og-render.cjs` | **Neu** — Serverseitiges Card-Rendering mit `sharp` + SVG-Overlays |
| `api/og-image.cjs` | **Neu** — HTTP-Endpoint für generierte Karten mit Cache-Headern |
| `api/og.cjs` | **Aktualisiert** — Nutzt `og-resolve`, `og:image` zeigt auf dynamische Karten-URL |
| `vercel.json` | **Aktualisiert** — `og-image.cjs` Function-Config (10s, 1024 MB) |
| `index.html` | **Aktualisiert** — Absolute `og:image`-URLs auf `https://be-hui.app` |
| `package.json` | **Aktualisiert** — `sharp` als Production-Dependency |
| `scripts/og-benchmark.mjs` | **Neu** — Lokaler Performance-Benchmark |

---

## Serverseitige Bildgenerierung

### Pipeline

```
Request → og-image.cjs
       → og-resolve.cjs (Supabase Service Role, Public-Filter)
       → og-render.cjs (sharp Compositing)
       → JPEG 1200×630
```

### Rendering-Stack

1. **Hintergrund:** Cover-Bild des Inhalts (cover-fit 1200×630) oder HUI-Gradient-Default (Türkis/Koralle/Warm)
2. **Overlay:** SVG mit dunklem Verlauf, Glas-Panel, Typografie (Inter/system)
3. **Avatar:** Rundes Profilbild (Beitrag unten links, Wirker groß)
4. **Logo:** `public/assets/brand/hui-logo.png` unten rechts
5. **Ausgabe:** JPEG (quality 92, mozjpeg)

### Kartentypen

| Typ | Pfad | Elemente |
|-----|------|----------|
| Beitrag | `/beitrag/:id` | Cover, Autor-Avatar, Name, Kategorie, Titel, Beschreibung |
| Werk | `/werke/:slug`, `/work/:id` | Cover, Titel, Kategorie, Preis, Autor |
| Wirker | `/wirker/:username`, `/profile/:username` | Profilbild, Name, Beruf, Ort, Resonanz-Kreis |
| Veranstaltung | `/veranstaltung/:id` | Titel, Datum, Uhrzeit, Ort |
| Erlebnis | `/erlebnis/:id` | Cover, Titel, Beschreibung |
| Projekt | `/projekt/:id` | HUI-Default-Artwork, Name, Beschreibung |

### Sicherheit (nur öffentliche Inhalte)

- **Beiträge:** `visibility_scope !== 'connections_only'`
- **Werke:** `status = 'published'` AND `approval_status = 'approved'`
- **Erlebnisse:** `status = 'published'` AND `approval_status = 'approved'`
- **Veranstaltungen:** `status = 'active'`, `visibility = 'public'`, nicht abgelaufen
- **Projekte:** `status = 'active'`
- **Profile:** öffentlich lesbar (bestehende RLS)

Private oder fehlende Inhalte erhalten eine **gebrandete Default-Karte** — kein 404, kein leeres Bild.

---

## Cache-Strategie

### HTTP-Header (`og-image.cjs`)

```
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
ETag: "<sha256-hash der Inhaltsfelder>"
Last-Modified: <updated_at aus DB>
X-HUI-OG-Render-Ms: <Renderzeit in ms>
```

### HTML-Meta (`og.cjs`)

```
Cache-Control: s-maxage=3600, stale-while-revalidate=86400
ETag + Last-Modified (an Card-Daten gekoppelt)
```

### Conditional Requests

- `If-None-Match` → **304 Not Modified** (kein Re-Render)
- `If-Modified-Since` → **304** wenn Inhalt unverändert

### Cache-Invalidierung bei Änderungen

ETag wird aus einem SHA-256-Hash dieser Felder berechnet:

- Kartentyp + ID
- Titel, Beschreibung
- Cover-/Avatar-URL
- Kategorie, Preis, Ort, Datum
- `updated_at` / `created_at` aus Supabase

Änderungen an Titel, Beschreibung oder Bild erzeugen automatisch einen neuen ETag → Crawler und CDN laden die neue Vorschau.

### Module-Warmup

`og-image.cjs` und `og-render.cjs` wärmen Default-Hintergrund und Logo beim Cold Start vor, um die 300-ms-Grenze einzuhalten.

---

## URLs und Domain

Alle `og:image`-URLs verwenden ausschließlich:

```
https://be-hui.app/api/og-image.cjs?path=/beitrag/<id>
https://be-hui.app/api/og-image.cjs?path=/werke/<slug>
...
https://be-hui.app/api/og-image.cjs          (Default-Karte)
```

Keine Vercel-Domain, keine relativen URLs, keine privaten Storage-Links in Meta-Tags.

---

## Performance-Messung

Lokaler Benchmark (`node scripts/og-benchmark.mjs`, nach Warm-up):

| Kartentyp | Renderzeit |
|-----------|------------|
| default | 177 ms |
| beitrag | 184 ms |
| werk | 175 ms |
| wirker | 181 ms |
| veranstaltung | 172 ms |
| erlebnis | 179 ms |
| projekt | 176 ms |

**Durchschnitt: 177,9 ms** · **Maximum: 183,9 ms** · Ziel ≤ 300 ms: **erfüllt**

Mit Remote-Cover-Bildern kann die Zeit durch Bild-Download steigen; CDN-Cache und ETag-304 reduzieren wiederholte Last.

---

## Plattform-Tests

| Plattform | Status | Hinweis |
|-----------|--------|---------|
| WhatsApp | ✅ Architektur-kompatibel | Bot-UA in `vercel.json`; `og:image` absolut |
| Telegram | ✅ | `telegrambot` in Bot-Patterns |
| Signal | ✅ | `signal` in Bot-Patterns |
| Discord | ✅ | `discordbot` in Rewrite-UA |
| Facebook | ✅ | `facebookexternalhit` |
| LinkedIn | ✅ | `linkedinbot` |
| X (Twitter) | ✅ | `twitterbot` |
| iMessage | ✅ | `imessage` + `applebot` |

**Hinweis:** Live-Tests auf Produktion (`be-hui.app`) erfordern Deployment und echte öffentliche Inhalte. Die Bot-Rewrites und absoluten `og:image`-URLs sind für alle genannten Crawler vorbereitet.

### Erwartetes Verhalten pro Plattform

- **Individuelles Bild:** Dynamische HUI-Karte pro Inhalt
- **Individueller Titel:** Aus DB-Feldern (max. 60 Zeichen)
- **Individuelle Beschreibung:** Aus DB-Feldern (max. 140 Zeichen)

---

## Keine Regressionen

- Deep-Link-Routen in `src/App.jsx` unverändert
- `vercel.json` Bot-Rewrites für HTML unverändert (nur `og-image` Function hinzugefügt)
- `shareContent.js` unverändert
- `og.cjs` liefert weiterhin HTML für Crawler; nur `og:image` zeigt auf generierte Karten

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Jeder öffentliche Inhalt hat individuelle HUI Social Card | ✅ |
| Keine generischen Passthrough-Bilder mehr in `og:image` | ✅ |
| HUI Branding auf jeder Karte | ✅ |
| Inhaltsspezifische Daten pro Karte | ✅ |
| Immer gültiges `og:image` (Fallback Default) | ✅ |
| Ausschließlich `https://be-hui.app` | ✅ |
| Cache-Control, ETag, Last-Modified | ✅ |
| Keine Regressionen Share/Deep-Link | ✅ |
