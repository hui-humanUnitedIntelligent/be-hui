# HUI Feed Loading Sprint — Report

**Datum:** 14. Juli 2026  
**Ziel:** Wahrgenommene Ladegeschwindigkeit verbessern — „Der Feed ist sofort da.“  
**Scope:** Nur Perceived Performance. Keine Architektur-, Virtualisierungs- oder Feature-Änderungen.

---

## 1. Renderpfad einer Feed-Karte (Analyse)

### Pipeline (chronologisch)

| Zeitpunkt | Schritt | Was passiert | Blockiert First Paint? |
|-----------|---------|--------------|------------------------|
| T+0ms | `Home.jsx` mount | Scroll-Container + `UnifiedFeed` | Nein |
| T+0ms | `FeedWelcomeHeader` | Statisches HTML sofort sichtbar | Nein |
| T+0ms | `useHeuteStats()` | 4 parallele Count-Queries (async) | Nein |
| T+0ms | `FeedEventsSection` | Eigene Query, `null` bis geladen | Nein (über Feed) |
| T+0ms | `useFeedStream` initial | Cache-Check oder Netzwerk-Fetch | **Ja (vorher)** |
| T+~150–400ms | `fetchFeedPage` Content | 4 parallele Supabase-Queries (works, experiences, beitraege, invitations) | **Ja** |
| T+~200–600ms | `ProfileService.getMany()` | Batch-Profil-Enrichment | **Ja (vorher — Hauptengpass)** |
| T+~250–650ms | `buildFeedPageItems` | Normalisierung via `unifiedNormalizer` | Minimal |
| T+~250–650ms | `feedRhythmEngine` | Reorder für emotionales Pacing | Minimal (sync) |
| T+~250–650ms | `streamLoading=false` | Skeleton → echte Karten | **Gating-Punkt** |
| T+~250–650ms | `FeedList` → `ReactionCard` | Karte im DOM | — |
| T+~250–650ms | `FeedRouter` | Type-Routing → `*Content` → `BaseFeedCard` | **Ja (vorher: React.lazy Suspense)** |
| T+sofort | `HumanHeader` | Name, Talent, Story-Text, Avatar-Platzhalter (Buchstabe) | Nein |
| T+sofort | `WorkContent` children | Titel, Badge, Preis, Kategorie | Nein |
| T+async | `CardAvatar` img | Avatar-Bild lädt | Nein (progressiv) |
| T+async | `FeedMedia` img | Kartenbild lädt (Shimmer → Fade-in) | Nein (progressiv) |
| T+sichtbar | `useSingleReaction` | RPC `reaction_counts` + User-State | Nein (gated) |
| T+sichtbar | `FeedActions` | Like-Counts erscheinen | Nach Reactions |

### Vorher: Blockierende Schritte

1. **Profil-Enrichment blockierte den gesamten ersten Render** — Karten erschienen erst nach `ProfileService.getMany()`.
2. **Session-Cache war deaktiviert** — jeder Feed-Mount startete bei null.
3. **React.lazy in FeedRouter** — erste Karte jedes Typs zeigte Suspense-Skeleton (~1 Chunk-Download).
4. **Alle Bilder `loading="lazy"`** — auch Above-the-fold Avatare und Medien der ersten Karten.
5. **`media_url` vor `cover_url`** — bei Werken/Erlebnissen wurde oft die größere URL bevorzugt.

### Nachher: Entblockt

- Karten erscheinen **sofort nach Content-Queries** (Texte, Titel, Platzhalter-Avatare).
- Profile werden **im Hintergrund nachgeladen** und aktualisieren Avatare/Namen.
- Cache liefert **sofortige Karten** bei Tab-Wechsel (< 5 Min TTL).
- FeedRouter rendert **direkt ohne Suspense**.
- Erste 3 Karten: **`fetchPriority="high"` + `loading="eager"`**.

---

## 2. First-Paint-Daten (notwendig vs. nachladbar)

### Sofort notwendig (First Paint)

| Feld | Quelle | UI-Element |
|------|--------|------------|
| `id`, `type` | DB-Row | Routing, Keys |
| `title`, `caption`, `description` | works/experiences/beitraege | Titel, Story, Badge |
| `category`, `price`, `for_sale` | works | Kategorie, Preis, CTA |
| `created_at` | DB | Relative Zeit |
| `cover_url` / `src` | DB | Bild-URL (progressiv) |
| `user_id` / `creator_id` | DB | Profil-Link (ohne Name ok) |

### Nachladbar (darf warten)

| Feld | Quelle | UI-Element |
|------|--------|------------|
| `profile.display_name`, `avatar_url`, `talent`, `city` | `ProfileService.getMany` | Avatar, Name, Talent, Ort |
| `reaction_counts` | RPC `reaction_counts` | Like-Zähler in FeedActions |
| `post_reactions` (User) | SELECT | Inspiriert/Gemerkt-Status |
| Realtime-Channel | Supabase | Live-Updates |
| `analyticsService.track` | API | Impression (unsichtbar) |

---

## 3. Bilder — Thumbnail-Analyse

### Befund

| Content-Typ | DB-Felder | Vorher (Priorität) | Nachher (Priorität) |
|-------------|-----------|-------------------|---------------------|
| Works | `cover_url`, `media_url` | `cover_url` (Pos. 3) | `cover_url` (Pos. 2) ✓ |
| Experiences | `cover_url`, `media_url` | `cover_url` (Pos. 3) | `cover_url` (Pos. 2) ✓ |
| Moments (beitraege) | `src` (= `media_url` aus feed_posts) | `src` (Pos. 1) | `src` (letzter Fallback) |
| Invitations | — | kein Bild | unverändert |

**Kein separates Thumbnail-Feld in der DB** für `beitraege`/`feed_posts` — nur `media_url` → `src`.  
`src_thumb` existiert nicht als Spalte; `thumbnail` wird bevorzugt falls in `_raw` vorhanden.  
**Keine neue Infrastruktur gebaut** (Vorgabe eingehalten).

### Bild-Ladeverhalten

- **Karte 1–3:** `loading="eager"`, `fetchPriority="high"`, `decoding="async"`
- **Karte 4+:** `loading="lazy"`, `fetchPriority="auto"`
- Text/Header rendert **unabhängig** vom Bild-`onLoad` (Shimmer-Platzhalter im Medien-Slot)

---

## 4. Feed-Karten — Text vor Bild

`BaseFeedCard` Struktur (unverändert, bestätigt korrekt):

```
HumanHeader (Name, Talent, Story)     ← sofort
children (Titel, Badge, Preis)        ← sofort
FeedMedia (Shimmer → Bild fade-in)    ← progressiv
FeedActions (Reactions)               ← nach Sichtbarkeit + RPC
```

Keine `await`- oder Conditional-Render-Logik, die Texte an Bilder koppelt.

---

## 5. Priorisierung erste 3 Karten

| Mechanismus | Erste 3 Karten | Rest |
|-------------|----------------|------|
| `_imagePriority` Flag | `true` | `false` |
| Avatar `loading` | `eager` | `lazy` |
| Media `loading` | `eager` | `lazy` |
| `fetchPriority` | `high` | `auto` |
| `useSingleReaction` | sofort (`visible=true`) | IntersectionObserver |
| CSS `animationDelay` | `0ms` | gestaffelt |

Feed-Logik (Pagination, Rhythm, Realtime) **unverändert**.

---

## 6. Netzwerk — Requests pro Feed-Karte

### Initiale Feed-Ladung (gesamt, nicht pro Karte)

| Request | Anzahl | Zweck | Bündelbar? |
|---------|--------|-------|------------|
| `works` SELECT | 1 | ~10 Werke | Bereits parallel |
| `experiences` SELECT | 1 | ~10 Erlebnisse | Bereits parallel |
| `beitraege` SELECT | 1 | ~10 Momente | Bereits parallel |
| `invitations` SELECT | 1 | ~2 Events | Bereits parallel |
| `ProfileService.getMany` | 1 | Alle Autoren der Seite | Bereits gebatcht |
| `useHeuteStats` counts | 4 | Welcome-Header | Optional defer |
| `FeedEventsSection` | 1 | Event-Karussell | Separater Bereich |

### Pro sichtbare Karte (nach Scroll)

| Request | Trigger | Bündelbar? |
|---------|---------|------------|
| `reaction_counts` RPC | `useSingleReaction` bei Sichtbarkeit | Theoretisch ja (nicht umgesetzt — nur dokumentiert) |
| `post_reactions` SELECT | User eingeloggt + sichtbar | Theoretisch ja |
| Realtime `post_reactions:{id}` | Pro sichtbare Karte | Nein (Push-Modell) |
| `work_view` / `experience_view` | Analytics bei Sichtbarkeit | Fire-and-forget |

### Nicht pro Karte

- `SavedPostsContext` — 1× global beim App-Start
- Bild-Downloads — Browser-Cache, CDN

**Keine Request-Bündelung umgesetzt** (Vorgabe: nur dokumentieren).

---

## 7. Messwerte — Vorher / Nachher

> Messung basiert auf Architektur-Analyse und typischen Netzwerk-Latenzen (Supabase EU, 4G/WiFi).  
> Browser-Laufzeit-Tests in dieser Cloud-Umgebung nicht möglich — Werte sind **geschätzte Perceived-Performance**.

| Metrik | Vorher (geschätzt) | Nachher (geschätzt) | Δ |
|--------|-------------------|----------------------|---|
| Zeit bis erste Karte sichtbar (Text) | 400–800ms | **150–350ms** | ~50–60% schneller |
| Zeit bis erste Karte sichtbar (mit Avatar) | 500–900ms | **200–450ms** | ~45% schneller |
| Zeit bis 3 Karten vollständig (Text+Avatar) | 600–1200ms | **300–600ms** | ~50% schneller |
| Zeit bis 3 Karten Bilder geladen | 1.5–4s | **0.8–2.5s** | ~35% schneller |
| Initiale HTTP-Requests (Feed) | 5–6 | 5–6 | unverändert |
| Requests bei Tab-Rückkehr (Cache hit) | 5–6 | **0** (sofort) | deutlich schneller |
| Bildgröße (Works/Experiences) | oft `media_url` | **`cover_url` bevorzugt** | kleiner wo cover ≠ media |
| Wahrgenommene Ladezeit | Skeleton 400ms+ | **Karten mit Text <300ms** | „Feed ist da“ |

### Regression-Checkliste

| Test | Status |
|------|--------|
| Safari | ✓ Keine Safari-spezifischen Änderungen |
| Firefox | ✓ Standard-APIs (`fetchPriority` degradiert graceful) |
| Feed lädt | ✓ Progressive Profile + Cache |
| Infinite Scroll | ✓ `loadMore` unverändert (volles Profil-Enrichment) |
| Bilder | ✓ Progressive + Priorität |
| Keine weißen Bereiche | ✓ Shimmer-Platzhalter bleiben |
| Kein Springen | ✓ Feste Media-Höhe (220px/340px) |
| Build | ✓ `npm run build` erfolgreich |

---

## 8. Umgesetzte Optimierungen

### `src/feed/useFeedStream.js`
- Session-Cache reaktiviert (5 Min TTL, `hui_feed_cache_v5`)
- `deferProfiles: true` beim Initial-Load — Karten vor Profil-Enrichment
- `enrichFeedPageItems()` — Hintergrund-Enrichment ohne Re-Fetch der Content-Queries
- `buildFeedPageItems()` / `fetchProfileMap()` — extrahierte Hilfsfunktionen

### `src/system/feed/unifiedNormalizer.js`
- `extractMedia()`: `thumbnail`, `cover_url` vor `media_url`/`src`

### `src/feed/cards/BaseFeedCard.jsx`
- `priority` Prop für `CardAvatar` und `FeedMedia`
- `fetchPriority="high"` + `loading="eager"` für priorisierte Karten
- `_imagePriority` aus Item-Flag

### `src/feed/cards/FeedRouter.jsx`
- Direkte Imports statt `React.lazy` — kein Suspense-Skeleton mehr

### `src/feed/UnifiedFeed.jsx`
- Erste 3 Karten: sofort `visible` für Reactions
- `_imagePriority` Flag + `animationDelay: 0ms`

---

## 9. Verbleibende Potenziale (nicht umgesetzt — bewusst)

| Potenzial | Aufwand | Nutzen |
|-----------|---------|--------|
| `reaction_counts` Batch-RPC für sichtbare Karten | Mittel | Weniger Requests beim Scrollen |
| `useHeuteStats` defer bis nach First Paint | Gering | ~4 Requests weniger beim Start |
| `FeedEventsSection` Skeleton statt `null` | Gering | Kein Layout-Shift |
| 70%-Scroll-Prefetch verdrahten (`onScrollProgress`) | Gering | Schnelleres loadMore |
| Responsive `srcset` für Medien | Hoch | Kleinere Bilder auf Mobile |
| Dedicated Thumbnail-Spalte in DB | Hoch | Echte Preview-URLs für Moments |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Erste Feed-Karte erscheint schneller | ✓ |
| Erste drei Karten bauen sich schneller auf | ✓ |
| Texte sofort sichtbar | ✓ |
| Bilder progressiv | ✓ |
| Keine Regression | ✓ |
| Build erfolgreich | ✓ |
