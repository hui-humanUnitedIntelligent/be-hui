# HUI Performance Sprint P5 — Perceived Performance

**Ziel:** Die App soll sich sofort fertig anfühlen — nicht durch schnelleres Laden, sondern durch ruhige, hochwertige Bilddarstellung.

**Stand:** 2026-07-14  
**Basis:** P1 (Home Bundle) · P2 (Keep-Alive) · P3 (Home Context) · P4 (Layout Shifts)

---

## 1. HuiImage-Architektur

### Zentrale Komponente

`src/components/ui/HuiImage.jsx` ist die einzige Bild-Komponente für neue und migrierte Darstellungen.

```
HuiImage
├── Container (feste Dimensionen / aspect-ratio → CLS-Schutz)
├── Placeholder-Schicht
│   ├── Blur-Up (thumbnail / blurhash)
│   └── Shimmer (warm/neutral, einheitlich)
├── <img> mit Fade-In (0.32s ease)
└── Fehler-Fallback (Initialen bei Avataren)
```

### Hilfs-API

| Export | Pfad | Zweck |
|--------|------|-------|
| `HuiImage` | `src/components/ui/HuiImage.jsx` | Hauptkomponente |
| `HuiImageSkeleton` | gleich | Shimmer ohne Bildquelle |
| `optimizeImageUrl` | `src/lib/huiImageUtils.js` | URL-Optimierung (Unsplash) |
| `buildSrcSet` | `src/lib/huiImageUtils.js` | Responsive srcset |
| `IMAGE_SIZES` | `src/lib/huiImageUtils.js` | Standard-`sizes`-Werte |
| `blurhashToDataUrl` | `src/lib/huiImageUtils.js` | Blurhash → Canvas (lazy) |

### Props (Auswahl)

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `src` | string | — | Bild-URL |
| `priority` | boolean | `false` | `loading="eager"` + `fetchPriority="high"` |
| `placeholder` | `'auto' \| 'shimmer' \| 'blur' \| 'none'` | `'auto'` | Placeholder-Strategie |
| `thumbnail` | string | — | LQIP-URL (`thumbnail_path`) |
| `blurhash` | string | — | Blurhash aus `media`-Tabelle |
| `aspectRatio` | string/number | — | Feste Proportion (CLS-Schutz) |
| `variant` | `'cover' \| 'contain' \| 'avatar'` | `'cover'` | Darstellungsmodus |
| `fill` | boolean | `false` | Absolut positioniert im Container |

---

## 2. Medienstrategie

### Progressive Darstellung

1. **Sofort:** Shimmer oder Blur-Up füllt den reservierten Platz
2. **Nachladen:** Hauptbild lädt lazy (außer `priority`)
3. **Einblendung:** Opacity-Fade 0 → 1 (kein harter Pop-in)
4. **Fehler:** Initialen-Fallback (Avatare) oder Icon-Platzhalter (Feature-spezifisch)

### Blur-Up / LQIP

| Quelle | Unterstützung | Strategie |
|--------|---------------|-----------|
| `thumbnail_path` (DB) | Schema vorhanden (`007_media_stories_pipeline.sql`) | CSS-Blur auf Thumbnail |
| `blurhash` (DB) | Schema vorhanden, Frontend-dekodiert | Canvas → Data-URL |
| Unsplash | `w=`, `q=`, `auto=format` | srcset mit 320–1280px |
| Supabase Storage | Keine Transform-API | Shimmer-Placeholder |
| Keine LQIP-Daten | — | Warm-Shimmer (Feed) / Neutral-Shimmer (Profil) |

**Keine künstlichen Bilder** — nur vorhandene Thumbnails/Blurhash oder Shimmer.

### Responsive Images

```html
<!-- Beispiel: Feed-Medien (Unsplash) -->
<img
  src="…?w=800&q=80&auto=format"
  srcset="…320w, …640w, …960w, …1280w"
  sizes="(max-width: 640px) 100vw, 640px"
  loading="lazy"
  decoding="async"
  fetchpriority="auto"
/>
```

Priorisierte Bilder (`priority={true}`):

```html
loading="eager" decoding="sync" fetchpriority="high"
```

---

## 3. Placeholder-Strategie

### Einheitliche Tokens

```css
/* Warm (Feed-Medien) */
linear-gradient(135deg, rgba(22,215,197,0.07), rgba(255,138,107,0.07))

/* Neutral (Profil, Listen, Commerce) */
linear-gradient(90deg, #F5EEE4 0%, #EDE5D8 50%, #F5EEE4 100%)

/* Hintergrund-Reserve */
#F0EFED
```

Animation: `huiImgShimmer` — 2.8s linear, synchron mit `IX.SKELETON` aus `hui.interaction.js`.

### Bereichs-Mapping

| Bereich | Komponente | Placeholder | Priorität |
|---------|------------|-------------|-----------|
| **Feed** | `BaseFeedCard` → `FeedMedia`, `CardAvatar` | Warm-Shimmer / Blur-Up | Erste 3 Karten |
| **Profil** | `ProfileHeader`, Sections | Neutral-Shimmer | Cover + Avatar: `priority` |
| **Mein HUI** | `ProfileHeader` (lokal) | Shimmer | Avatar: `priority` |
| **Resonance** | `MeineResonanz` | Shimmer | Erste 4 Einträge |
| **Discover** | `DiscoverPage` + `DpThumb` | Shimmer | Hero + erste Menschen |
| **Impact** | `ImpactPage` | Shimmer | Hero: `priority` |
| **Commerce** | `WerkeKorb` | Shimmer | Lazy |
| **Stories** | `StoryBar` (unmounted) | — | Sprint P6 |
| **Preview** | `ContentPreviewSheet` | Shimmer | Hero: `priority` |

---

## 4. Bild-Priorisierung

### Feed

```
FeedList (Virtualizer)
  └── ReactionCard (itemIndex)
        └── FeedRouter (imagePriority = itemIndex < 3)
              └── BaseFeedCard
                    ├── HumanHeader → CardAvatar (priority)
                    └── FeedMedia (priority)
```

- **Index 0–2:** `priority={true}` — eager, fetchpriority high
- **Index 3+:** lazy, async decoding
- **Virtualizer:** Nur sichtbare Karten im DOM → keine unnötigen Requests

### Profil

- **Cover:** LCP-Kandidat → `priority`
- **Avatar:** `priority` (sichtbar ohne Scroll)
- **Galerien (Werke, Momente):** lazy, feste Aspect Ratios

### Discover

- **Hero-Projekt:** `priority={delay < 300}`
- **Menschen-Karussell:** `priority={delay < 200}` für erste Karten

---

## 5. Web Vitals

### Messung (nur messen, kein Tracking)

`src/lib/webVitals.js` — initialisiert in `src/main.jsx`.

| Metrik | Beschreibung | Zugriff |
|--------|--------------|---------|
| **LCP** | Largest Contentful Paint | `window.__HUI_WEB_VITALS__.lcp` |
| **CLS** | Cumulative Layout Shift | `window.__HUI_WEB_VITALS__.cls` |
| **INP** | Interaction to Next Paint | `window.__HUI_WEB_VITALS__.inp` |
| FCP | First Contentful Paint (Bonus) | `window.__HUI_WEB_VITALS__.fcp` |
| TTFB | Time to First Byte (Bonus) | `window.__HUI_WEB_VITALS__.ttfb` |

### DevTools

```javascript
// In Browser-Konsole:
window.__HUI_WEB_VITALS__

// Formatiert:
import { formatWebVitalsReport } from './src/lib/webVitals.js';
formatWebVitalsReport();
```

### Erwartete Verbesserungen (qualitativ)

| Metrik | Hebel durch P5 |
|--------|----------------|
| **CLS** | Feste Aspect Ratios, Skeleton mit reserviertem Platz |
| **LCP** | `fetchpriority="high"` auf Cover/Hero/erste Feed-Bilder |
| **INP** | Keine Blockade — lazy loading für Offscreen-Bilder |

**Hinweis:** Messwerte variieren je nach Netzwerk/Gerät. Keine Analytics-Pipeline — Werte nur lokal in `window.__HUI_WEB_VITALS__` und Dev-Console.

---

## 6. Performancegewinn (wahrgenommen)

| Vor P5 | Nach P5 |
|--------|---------|
| Bilder poppen hart ein | Sanftes Fade-In über Shimmer/Blur |
| 10+ verschiedene Shimmer-Implementierungen | Eine `HuiImage`-Strategie |
| Keine Priorisierung | Erste sichtbare Bilder laden zuerst |
| Layout springt bei Bildload | Feste Container-Dimensionen |
| Keine LQIP-Nutzung | Blur-Up wenn `thumbnail`/`blurhash` vorhanden |
| Keine Web-Vitals | CLS/LCP/INP messbar (lokal) |

**Fokus:** Wahrgenommene Qualität > theoretische Millisekunden.

---

## 7. Migrierte Dateien (P5)

### Kern

- `src/components/ui/HuiImage.jsx` *(neu)*
- `src/lib/huiImageUtils.js` *(neu)*
- `src/lib/webVitals.js` *(neu)*
- `src/main.jsx`

### Feed

- `src/feed/cards/BaseFeedCard.jsx`
- `src/feed/cards/{Moment,Work,Experience,Event}Content.jsx`
- `src/feed/cards/FeedRouter.jsx`
- `src/feed/UnifiedFeed.jsx`

### Profil & Seiten

- `src/components/profile/ProfileHeader.jsx`
- `src/components/profile/sections/{Works,Moments}Section.jsx`
- `src/pages/{MeinHUI,DiscoverPage,ImpactPage}.jsx`
- `src/pages/studio/MeineResonanz.jsx`

### Commerce & Preview

- `src/components/commerce/WerkeKorb.jsx`
- `src/components/shared/ContentPreviewSheet.jsx`

### Noch offen (P6-Kandidaten)

- `WorkDetailPage.jsx`, `PostFullscreenView.jsx`
- `BasisProfilePage.jsx`, `TalentProfilePage.jsx`, `MyBasisProfile.jsx`
- Weitere Profil-Sections (`Experiences`, `Recommendations`)
- `StoryBar.jsx`, `StoryViewer`
- Restliche Impact/Commerce-Thumbnails

---

## 8. Empfehlung für Sprint P6

### P6a — Medien-Pipeline aktivieren

1. `blurhash` + `thumbnail_path` beim Upload generieren (`StoryComposer`, `WorkMediaStep`)
2. API/Normalizer: Felder an Feed-Items anhängen
3. HuiImage erhält echte Blur-Up-Daten statt nur Shimmer

### P6b — Supabase Image Transforms

- Prüfen ob Imgproxy/Supabase Pro Image Transforms verfügbar
- `buildSrcSet` für Supabase-URLs erweitern
- `optimizeImageUrl` für alle Storage-URLs

### P6c — Rest-Migration

- Verbleibende ~60 `<img>`-Tags auf HuiImage migrieren
- `StoryBar` in Feed mounten mit Priorisierung
- Profil-Seiten (Basis/Talent/Wirker) vereinheitlichen

### P6d — Feintuning

- `content-visibility` für Offscreen-Galerien
- IntersectionObserver-basierte `priority` (nicht nur Index)
- Web-Vitals-Baseline dokumentieren (Vorher/Nachher auf Referenzgerät)

---

## Definition of Done ✅

- [x] Einheitliche `HuiImage`-Komponente
- [x] Einheitliche Placeholder (Warm/Neutral-Shimmer + Blur-Up ready)
- [x] Erste Bilder priorisiert (Feed Index < 3, Profil Cover/Avatar, Impact Hero)
- [x] Progressive Bilddarstellung (Shimmer → Fade-In)
- [x] Keine sichtbaren Pop-ins (reservierter Platz + Opacity-Transition)
- [x] Web-Vitals dokumentiert und messbar (`window.__HUI_WEB_VITALS__`)
- [x] Build erfolgreich
- [x] Keine neuen ESLint-Fehler in P5-Kerndateien

---

*„Optimiert nicht für Benchmarks. Optimiert für den Moment, in dem ein Mensch HUI öffnet und denkt: Das fühlt sich richtig gut an."*
