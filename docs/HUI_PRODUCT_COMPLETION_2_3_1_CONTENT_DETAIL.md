# HUI Product Completion 2.3.1 — Unified Content Detail Experience

**Phase:** 2.3.1  
**Status:** Implementiert  
**Datum:** 2026-07-01

---

## Vision

> Ein Konzept. Eine Oberfläche. Eine HUI-Erfahrung.

Alle buchbaren und kaufbaren Inhalte (Werke, Erlebnisse) öffnen dieselbe Detailerfahrung. Der Nutzer lernt: **„Ich öffne Inhalte.“** — nicht „Werkseiten“ oder „Erlebnisseiten“.

---

## Aufgabe 1 — Referenz: Werk-Informationsansicht (vorher)

Die kanonische Referenz war `WorkDetailPage.jsx` (`/work/:id`).

| Bereich | Beschreibung |
|---------|--------------|
| **Layout** | Vollbild-Scrollseite, max. 680px, cream-Hintergrund, kein Home-Shell-Header |
| **Navigation** | Floating Back-Button (`navigate(-1)`), fest positioniert |
| **Header** | Kategorie-Pill + Preis, darunter Titel (h1) |
| **Galerie** | Hero `ImageGallery` mit Swipe, Dots, Pfeilen, Zähler |
| **Veranstalter** | Creator-Card → Profil, Follow-Button |
| **Sozial** | Resonanz, Kommentar, Teilen, Merken |
| **Beschreibung** | Karte mit „BESCHREIBUNG“-Label |
| **Informationen** | 2-Spalten-Grid (Kategorie, Erstellt) |
| **Ähnliche Inhalte** | Horizontaler Related-Carousel |
| **Commerce** | Sticky Bottom-Bar: „In den Korb“ + „Jetzt kaufen ✦“ |
| **Übergänge** | `cdFadeUp`-Animation, Skeleton-Loading |

---

## Aufgabe 2 — Vergleich: Erlebnis vs. Werk (vorher)

| Aspekt | Werk (`WorkDetailPage`) | Erlebnis (vorher) |
|--------|-------------------------|-------------------|
| Dedizierte Seite | ✅ `/work/:id` | ❌ Keine Route |
| Feed-Kartentap | → Detailseite | Keine Navigation |
| Discover-Tap | → `/work/:id` | → Booking-Overlay |
| `OPEN_EXPERIENCE` | — | → Profil (Highlight ungenutzt) |
| Studio-Empfehlungen | → `/work/:id` | Alert „nicht verfügbar“ |
| Commerce | WerkKaufFlow via Router-State | ExperienceBookingFlow-Overlay |
| Sozial auf Detail | Likes, Saves, Comments | Nur Feed-Reaktionen |

**Gemeinsame Elemente (Feed):** `BaseFeedCard`, Badge+Titel+CTA-Muster in `WorkContent` / `ExperienceContent`.

**Unnötige Unterschiede:** Paralleles Detailkonzept fehlte für Erlebnisse; unterschiedliche Einstiegspfade (Navigate vs. Overlay vs. Profil).

---

## Aufgabe 3–7 — Implementierung

### Finale Detailarchitektur

```
/work/:id        ─┐
                  ├──► ContentDetailPage (contentType)
/experience/:id  ─┘
         │
         ├── content-detail/ImageGallery
         ├── content-detail/Avatar, IconBtn, RelatedCard
         ├── content-detail/ContentTypeSections (typ-spezifisch)
         └── Commerce-Bar → bestehende Flows (unverändert)
```

**Kernkomponente:** `src/components/content-detail/ContentDetailPage.jsx`

**Konfiguration:** `src/components/content-detail/contentDetailConfig.js`

### Einheitliche Struktur (identische Reihenfolge)

1. Back-Button (floating)
2. Galerie
3. Kategorie-Pill + Preis
4. Titel
5. Veranstalter / Anbieter (Creator-Card)
6. Soziale Aktionen
7. Kommentare (optional, aufklappbar)
8. Beschreibung
9. **Typ-spezifischer Bereich** (`ContentTypeSection`)
10. Informationen (Kategorie/Typ, Erstellt, Standort bei Werken)
11. Ähnliche Inhalte
12. Sticky Commerce-Aktionen

### Content-spezifische Bereiche

| Werk | Erlebnis |
|------|----------|
| Versand (`shipping_available`) | Datum |
| Abholung (`pickup_available`) | Uhrzeit (`avail_times` / `duration`) |
| Lagerbestand / Verkauft | Teilnehmer (`max_participants`) |
| Varianten (`medium` / `variant_label`) | Treffpunkt (`location_text` / Online) |

Felder werden nur angezeigt, wenn Daten vorhanden sind.

### Wiederverwendete Komponenten

| Komponente | Pfad |
|------------|------|
| `ContentDetailPage` | `src/components/content-detail/ContentDetailPage.jsx` |
| `ImageGallery` | `src/components/content-detail/ImageGallery.jsx` |
| `Avatar` | `src/components/content-detail/Avatar.jsx` |
| `IconBtn` | `src/components/content-detail/IconBtn.jsx` |
| `RelatedCard` | `src/components/content-detail/RelatedCard.jsx` |
| `ContentDetailSkeleton` | `src/components/content-detail/ContentDetailSkeleton.jsx` |
| `ContentTypeSections` | `src/components/content-detail/ContentTypeSections.jsx` |
| `tokens` / `utils` / `contentDetailConfig` | `src/components/content-detail/` |

`WorkDetailPage.jsx` ist ein dünner Wrapper (`contentType="work"`) für Abwärtskompatibilität.

### Entfernte / konsolidierte Duplikate

- Keine separate `ExperienceDetailPage`-Implementierung
- Inline-Subkomponenten aus dem alten monolithischen `WorkDetailPage` extrahiert (nicht kopiert)
- Erlebnis-Einstieg über Booking-Overlay als **primärer Detail-Einstieg** entfernt (Discover, Feed, Suche, Studio, `OPEN_EXPERIENCE`)

### Geänderte Navigation

| Einstieg | Neu |
|----------|-----|
| Feed `onDetail` | `/work/:id` oder `/experience/:id` je nach `type` |
| `ExperienceContent` Karten-Tap | `onDetail` → `/experience/:id` |
| `DiscoverPage.handleErlebnisPress` | `navigate(/experience/:id)` |
| `OPEN_EXPERIENCE` | `navigate` → `/experience/:id` (Fallback: Profil) |
| `HuiStudio` Empfehlungen | `/experience/:id` |
| `SearchCommandCenter` | Work/Erlebnis → Detailroute |
| Route Registry | `experience-detail` + `EXCLUDED_REF_PATHS` |

### Commerce (unverändert)

| Typ | Primary CTA | Flow |
|-----|-------------|------|
| Werk | „Jetzt kaufen ✦“ | `pendingWerkKauf` → `WerkKaufFlow` |
| Erlebnis | „Erlebnis buchen ✦“ | `pendingExperienceBooking` → `ExperienceBookingFlow` |

Secondary „In den Korb“ nutzt weiterhin `onAddToKorb` (wenn vom Route-Wrapper verdrahtet).

---

## Verbleibende Unterschiede zwischen Content-Typen

| Bereich | Werk | Erlebnis |
|---------|------|----------|
| Route | `/work/:id` | `/experience/:id` |
| Datenquelle | `works` | `experiences` |
| Sozial (DB) | Likes, Saves, Comments aktiv | UI sichtbar, DB-Aktionen deaktiviert (keine Tabellen) |
| Typ-Sektion | Versand, Lager, Varianten | Datum, Zeit, Teilnehmer, Treffpunkt |
| Primary Commerce | Kaufen | Buchen |
| Related-Titel | „Ähnliche Werke“ | „Ähnliche Erlebnisse“ |

**Projekt-Detail** (`/impact`) ist bewusst nicht Teil dieser Phase — Discover leitet Projekte weiterhin zu `/impact`.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Eine offizielle Detailerfahrung | ✅ `ContentDetailPage` |
| Werke + Erlebnisse gleiche Oberfläche | ✅ |
| Unterschiede nur inhaltsspezifisch | ✅ `ContentTypeSections` |
| Commerce unverändert | ✅ Bestehende Flows |
| Keine doppelten Detailseiten | ✅ |
| Build erfolgreich | ⏳ CI |
| Keine neuen ESLint-Fehler | ⏳ CI |
| Dokumentation vollständig | ✅ |

---

## Dateien (Änderungsübersicht)

**Neu:**
- `src/components/content-detail/*`
- `docs/HUI_PRODUCT_COMPLETION_2_3_1_CONTENT_DETAIL.md`

**Geändert:**
- `src/components/WorkDetailPage.jsx` (Wrapper)
- `src/App.jsx` (Route `/experience/:id`)
- `src/pages/Home.jsx` (Feed-Navigation, `pendingExperienceBooking`)
- `src/feed/cards/FeedRouter.jsx`, `ExperienceContent.jsx`
- `src/pages/DiscoverPage.jsx`
- `src/core/hui.actions.js`
- `src/components/studio/HuiStudio.jsx`
- `src/components/home/header/SearchCommandCenter.jsx`
- `src/pages/RefRedirect.jsx`
- `src/routes/registry.js`
