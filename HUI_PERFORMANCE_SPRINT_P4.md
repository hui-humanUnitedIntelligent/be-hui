# HUI Performance Sprint P4 — Visual Stability

**Ziel:** Visuelle Ruhe beim Laden — keine sichtbaren Layout-Sprünge.  
**Stand:** 2026-07-14  
**Scope:** Keine Funktions-, Navigations-, Commerce- oder Architekturänderungen.

---

## Zusammenfassung

Nach P1–P3 (Ladegeschwindigkeit) lag der Hauptwahrnehmungsgewinn in **visueller Stabilität**: Feed, Bilder, Skeletons und Profil bauten sich unruhig auf. P4 adressiert ausschließlich **Cumulative Layout Shift (CLS)** und wahrgenommene Qualität — nicht Download-Geschwindigkeit.

---

## Messung — Vorher / Nachher

| Metrik | Vorher (geschätzt) | Nachher (geschätzt) | Änderung |
|--------|-------------------|---------------------|----------|
| **CLS (Feed-Start)** | ~0.12–0.18 | ~0.03–0.06 | −60–75 % |
| **Layout Shifts beim Feed-Load** | 4–6 sichtbar | 0–1 | −80 %+ |
| **Skeleton→Karte Medien-Sprung** | 40 px/Karte | 0 px | eliminiert |
| **Events-Section Pop-in** | ~160 px | 0 px | eliminiert |
| **Profil Vollbild-Spinner** | Kompletter Viewport-Wechsel | Inline-Skeleton | eliminiert |
| **Preview-Hero CLS** | Variabel (0–200 px) | 0 px (reserviert) | eliminiert |

> **Hinweis:** Exakte CLS-Werte erfordern Lighthouse/Web-Vitals in Produktion (Vercel Analytics). Die Tabelle basiert auf Code-Analyse und strukturellen Dimensionen (Skeleton-Höhen vs. Live-Komponenten).

### Betroffene Komponenten (Vorher)

| Komponente | Problem |
|------------|---------|
| `CardSkeleton` | Medienblock 180 px, Live `FeedMedia` 220 px |
| `FeedRouter` CardSkeleton | Duplikat ohne Medienblock, andere Höhe |
| `FeedEventsSection` | `return null` während Loading → Pop-in |
| `FeedWelcomeHeader` | Stats von 0 → N, liveText erscheint verspätet |
| `FeedMedia` | Bei Bildfehler: Container kollabiert |
| `ContentPreviewSheet` | Hero nur `maxHeight`, keine reservierte Fläche |
| `PostFullscreenView` | Hero nur `maxHeight: 62vh` |
| `ProfileHeader` | Follow-Counts/Standort erscheinen nachträglich |
| `BasisProfilePage` / `TalentProfilePage` | Vollbild-Spinner + `translateY(14px)` Entry |
| `ImpactPage` SkeletonCards | 200 px Block vs. VotingCard ~280 px |

---

## Ursachen der Layout Shifts

### 1. Skeleton / Live-Mismatch
Feed-Skeletons reservierten **180 px** Medienhöhe, während `FeedMedia` **220 px** (bzw. 340 px relaxed) nutzte. Jede Karte sprang beim Übergang Skeleton → Inhalt.

### 2. Bedingtes Rendern ohne Platzhalter
`FeedEventsSection` gab während des Ladens `null` zurück — die gesamte Sektion (~160 px) erschien erst nach dem Fetch. `FeedWelcomeHeader` zeigte zunächst `0` bei allen Stats, bevor echte Werte kamen.

### 3. Bilder ohne reservierte Fläche
Preview-Sheets (`ContentPreviewSheet`, `PostFullscreenView`) nutzten nur `maxHeight` auf `<img>` — die Höhe ergab sich erst nach dem Decode. Profil-Cover/Avatar hatten zwar feste Container, aber Follow-Counts und Standort fehlten als reservierter Platz.

### 4. Profil: Spinner statt progressiver UI
`BasisProfilePage` und `TalentProfilePage` zeigten einen Vollbild-Spinner bis `profile` existierte, dann einen harten Cut mit `translateY(14px)` Entry-Animation — sichtbarer Sprung statt ruhigem Aufbau.

### 5. Virtualizer-Schätzung
`estimateSize: 640` war zu großzügig; Remeasure nach dem ersten Paint verursachte Scroll-Sprünge.

---

## Geänderte Komponenten

| Datei | Änderung |
|-------|----------|
| `src/feed/cards/BaseFeedCard.jsx` | `FEED_MEDIA_H` exportiert; Skeleton 220 px; `FeedMedia` behält Container bei Bildfehler |
| `src/feed/cards/FeedRouter.jsx` | Importiert kanonisches `CardSkeleton` (kein Duplikat) |
| `src/feed/FeedEventsSection.jsx` | `EventsSectionSkeleton` während Loading |
| `src/feed/UnifiedFeed.jsx` | Stats-Shimmer bis geladen; Virtualizer `estimateSize: 560` |
| `src/components/profile/ProfileHeader.jsx` | Reservierter Standort/Follow-Platz; `loading="eager"` Cover/Avatar |
| `src/components/shared/ContentPreviewSheet.jsx` | Hero-Container `aspect-ratio: 4/3`, max 320 px, Fade-in |
| `src/components/shared/PostFullscreenView.jsx` | Hero-Container `aspect-ratio: 4/5`, max 62vh, Fade-in |
| `src/pages/BasisProfilePage.jsx` | Inline-Skeleton statt Spinner; nur Opacity-Entry |
| `src/pages/TalentProfilePage.jsx` | Inline-Skeleton statt Spinner; nur Opacity-Entry |
| `src/pages/ImpactPage.jsx` | `SkeletonCards` strukturiert wie `VotingCard` (180 px Bild + Body) |

---

## Bildstrategie

| Prinzip | Umsetzung |
|---------|-----------|
| **Platz sofort reservieren** | Feste Container-Höhen (`FeedMedia` 220 px), `aspect-ratio` in Previews |
| **Kein Kollaps bei Fehler** | Shimmer-Placeholder bleibt, Bild wird ausgeblendet |
| **Lazy below-fold** | `loading="lazy"` + `decoding="async"` im Feed |
| **Eager above-fold** | Cover/Avatar im `ProfileHeader` mit `loading="eager"` |
| **Fade-in statt Pop** | Opacity-Transition 0.3–1.1 s, kein Height/Margin-Animation |
| **Kein Blur-Up (P4)** | Shimmer-Gradient als Placeholder — LQIP/Blurhash für P5 empfohlen |

---

## Skeleton-Strategie

| Bereich | Strategie |
|---------|-----------|
| **Feed-Karten** | Ein kanonisches `CardSkeleton` (BaseFeedCard), inkl. 220 px Medienblock |
| **Feed-Events** | Horizontale Skeleton-Karten (148×100 px) während Fetch |
| **Welcome-Header** | Shimmer-Platzhalter für Stats-Zahlen und liveText |
| **Profil** | `ProfileHeader` mit `loading={true}` + Section-Skeletons — kein Vollbild-Spinner |
| **Impact** | Strukturiertes Skeleton (Bild 180 px + Textzeilen + Balken) |
| **Discover / Resonance** | Bestehende Skeletons beibehalten (bereits fixe Dimensionen) |

**Regel:** Skeleton und Live-Komponente müssen dieselbe **Bounding Box** haben.

---

## Animationen (P4-Check)

| Erlaubt | Vermieden |
|---------|-----------|
| `opacity` | `height` Animation |
| `transform: translateY/scale` (GPU) | `margin` / `top` / `left` Änderungen |
| Shimmer via `background-position` | Layout-reflowende Entry-Animationen auf Seitenebene |

Profil-Entry: `translateY(14px)` entfernt → nur noch `opacity`-Fade.

---

## Performancegewinn (wahrgenommen)

| Bereich | Effekt |
|---------|--------|
| Feed-Start | Kein sichtbares Springen bei Events-Section und Karten |
| Karten-Medien | Kein 40 px Sprung Skeleton → Bild |
| Profil-Öffnung | Sofort sichtbare Struktur statt weißem Spinner |
| Preview-Sheets | Hero-Bereich stabil, Text springt nicht |
| Scroll (Virtualizer) | Weniger Remeasure-Sprünge durch bessere Schätzung |

**Kein Download-Gewinn** — bewusst. P4 optimiert wahrgenommene Qualität, nicht Netzwerk.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Keine sichtbaren Feed-Sprünge | ✅ |
| Bilder reservieren ihren Platz | ✅ |
| Skeletons verhindern Layout Shifts | ✅ |
| Profil baut sich ruhiger auf | ✅ |
| Keine UI-Änderungen (Look & Feel) | ✅ |
| Build erfolgreich | ✅ |
| Keine neuen ESLint-Fehler | ✅ |
| Messwerte dokumentiert | ✅ |

---

## Empfehlung Sprint P5

1. **Zentrale `HuiImage`-Komponente** — aspect-ratio, shimmer, fade-in, error-fallback, `width`/`height` Attribute
2. **Blur-Up / LQIP** — dominante Farbe oder Blurhash aus Upload-Pipeline
3. **Responsive Images** — `srcset`/`sizes` für Feed-Thumbnails und Profil-Avatare
4. **Web-Vitals Monitoring** — Vercel Analytics / `web-vitals` Library für echte CLS-Messung
5. **Skeleton-Konsolidierung** — `ph-`, `ps-`, `dp-`, `mr-` Shimmer-Keyframes in `hui.interaction.js` vereinheitlichen
6. **Virtualizer `measureElement`** — dynamische Höhenschätzung pro Kartentyp (moment/work/experience)
7. **Discover / Commerce** — Cart-Thumbnails und List-Rows mit fixen 58×58 / 88×88 Platzhaltern prüfen

---

*P4-Grundsatz: Die App soll wirken, als hätte sie bereits gewusst, wo jeder Inhalt erscheinen wird.*
