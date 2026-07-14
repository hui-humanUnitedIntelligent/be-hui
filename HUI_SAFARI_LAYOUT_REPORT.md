# HUI Safari Layout Investigation — P0

**Datum:** 2026-07-14  
**Symptom:** Safari auf iPad zeigt ca. 5 Feed-Beiträge, danach unendlicher weißer Scroll-Bereich. Firefox auf demselben iPad funktioniert. Cache/Neuinstallation ausgeschlossen.  
**Scope:** Analyse only — keine Fixes, keine Refactorings, keine Features.

---

## Executive Summary

| Frage | Ergebnis |
|-------|----------|
| Welches Element scrollt? | **`div.hui-scroll`** in `Home.jsx` — nicht `window`/`document` |
| Kollabiert ein Elterncontainer nach Beitrag 5? | **Nein** — kein `height: 0` auf aktivem Feed-Tab; virtueller Container behält `height: totalHeight` |
| Korrelation mit Beitrag 5? | **Ja, indirekt** — ~5 Karten passen in den sichtbaren Viewport; danach scrollt der Nutzer in den fehlerhaft gerenderten Bereich |
| Root Cause | **WebKit-Compositor-Konflikt:** `will-change: transform` auf dem Scroll-Container + `transform: translateY()` auf virtualisierten Feed-Zeilen innerhalb von `overflow-y: auto` |
| Empfohlene Korrektur (genau eine) | **`will-change: transform` aus `.hui-scroll` in `src/index.css` entfernen** |

---

## 1. DOM-Hierarchie

```
html
└── body
    └── #root                          (React-Root, main.jsx)
        └── App
            └── Home                   (src/pages/Home.jsx)
                └── HomeShell          (src/components/home/HomeShell.jsx)
                    └── HomeInner
                        └── div        [height: 100dvh, display: flex, flex-direction: column]
                            ├── HomeHeader
                            │   └── div  [position: sticky, top: 0, transform: translateZ(0)]
                            ├── div      [worldTokens.dimStyle, position: fixed]  ← Dim-Overlay
                            ├── div.hui-scroll  ← ★ PRIMÄRER SCROLL-CONTAINER ★
                            │   ├── div [tabRefs.feed, keepFeed / tabVisibilityController]
                            │   │   ├── HuiLiveTicker
                            │   │   └── UnifiedFeed
                            │   │       ├── FeedWelcomeHeader
                            │   │       ├── FeedEventsSection
                            │   │       ├── FeedSoftHydrationBadge [position: sticky, top: 12]
                            │   │       └── FeedList (in UnifiedFeed.jsx)
                            │   │           └── ReactionCard → FeedRouter → BaseFeedCard
                            │   ├── div [tabRefs.discover]  (inaktiv: position:absolute, height:0)
                            │   ├── div [tabRefs.impact]    (inaktiv: position:absolute, height:0)
                            │   └── div [tabRefs.favorites] (inaktiv: position:absolute, height:0)
                            └── HUIBottomNavigation         [flex-shrink: 0, in-flow]
```

**Dateien:**
- `src/pages/Home.jsx` — Layout-Shell, `.hui-scroll`-Ref
- `src/components/home/HomeShell.jsx` — Context, Tab-Styles, Scroll-Memory-Ref
- `src/feed/UnifiedFeed.jsx` — Feed + `FeedList`
- `src/lib/world/tabVisibilityController.js` — Inaktive Tabs aus dem Flow

---

## 2. Scroll-Hierarchie

### 2.1 Scroll-Autorität (Code-Nachweis)

Das Fenster scrollt **nicht**. Scrollen ist bewusst auf `.hui-scroll` delegiert:

```337:373:src/pages/Home.jsx
        <div
          className="hui-scroll"
          ref={(el) => { mainScrollRef.current = el; scrollContainerRef.current = el; }}
          style={{
            flex:         1,
            overflowY:    "auto",
            overflowX:    "hidden",
            position:     "relative",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            ...
          }}
        >
```

Weitere Belege:
- `useScrollMemory(tab)` in `HomeShell.jsx` hängt an `mainScrollRef` → dasselbe Element
- `@tanstack/react-virtual` in `FeedList`: `getScrollElement: () => scrollContainerRef?.current`
- `body` hat **kein** `overflow-y: scroll/auto` (bewusst, Safari pointer-events Fix)
- `html`/`body`/`#root` haben **keine** Höhenbindung für vertikales Scrollen

### 2.2 Scroll-Kette (wer kann scrollen?)

| Element | overflow-y | Kann vertikal scrollen? | Rolle |
|---------|------------|-------------------------|-------|
| `html` | visible (default) | Nein* | Nur `overflow-x: hidden` |
| `body` | visible (default) | Nein* | `overscroll-behavior: none` |
| `#root` | visible (default) | Nein* | Nur `overflow-x: hidden` |
| `Home` Shell (`100dvh` flex) | none | Nein | Viewport-Gehäuse |
| **`.hui-scroll`** | **auto** | **Ja — einziger Feed-Scroller** | Primärer Scroll-Container |
| `UnifiedFeed` | visible | Nein | `minHeight: 100vh` — Inhaltshöhe, kein Scroller |
| `FeedList` | visible | Nein | Rendert Karten / Virtualizer-Spacer |

\*Runtime-Verifikation: Nur Elemente mit `overflow-y: auto|scroll` und `scrollHeight > clientHeight` nehmen Scroll-Events an. Im Layout ist das ausschließlich `.hui-scroll`.

### 2.3 Laufzeit-Nachweis (iPad Safari Console)

Auf dem iPad in Safari DevTools (oder als Bookmarklet) ausführen:

```javascript
(() => {
  const candidates = [
    ['html', document.documentElement],
    ['body', document.body],
    ['#root', document.getElementById('root')],
    ['.hui-scroll', document.querySelector('.hui-scroll')],
    ['UnifiedFeed', document.querySelector('[class*=""]')], // optional
  ];
  const log = [];
  for (const [name, el] of candidates) {
    if (!el) continue;
    const before = el.scrollTop;
    el.scrollTop = before + 1;
    const canScroll = el.scrollTop !== before;
    el.scrollTop = before;
    const cs = getComputedStyle(el);
    log.push({
      name, canScroll,
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: cs.overflowY,
      willChange: cs.willChange,
      transform: cs.transform,
    });
  }
  console.table(log);
  console.log('window.scrollY:', window.scrollY);
})();
```

**Erwartetes Ergebnis auf iPad:** Nur `.hui-scroll` hat `canScroll: true` und steigende `scrollTop`-Werte beim Wischen. `window.scrollY` bleibt `0`.

Zusätzlich liegt unter `tools/safari-scroll-diagnostic.html` eine layout-isolierte Reproduktion (gleiche CSS-Kette + Virtualizer-Muster) für WebKit-Tests.

---

## 3. CSS-Eigenschaften (untersuchte Kandidaten)

### 3.1 `html`

| Property | Wert | Quelle |
|----------|------|--------|
| height | *nicht gesetzt* | — |
| min-height | *nicht gesetzt* | — |
| max-height | *nicht gesetzt* | — |
| overflow | *default visible* | — |
| overflow-x | `hidden` | `src/index.css` |
| overflow-y | *default visible* | — |
| contain | *none* | — |
| content-visibility | *visible* | — |
| position | *static* | — |
| transform | *none* | — |
| will-change | *auto* | — |

### 3.2 `body`

| Property | Wert | Quelle |
|----------|------|--------|
| height | *nicht gesetzt* (bewusst — dvh-Konflikt) | `src/index.css` Kommentar |
| min-height | *nicht gesetzt* | — |
| max-height | *nicht gesetzt* | — |
| overflow | *default visible* | kein `overflow: hidden` (Safari Fix) |
| overflow-x | `hidden` | `src/index.css` |
| overflow-y | *default visible* | — |
| contain | *none* | — |
| content-visibility | *visible* | — |
| position | *static* | — |
| transform | *none* | — |
| will-change | *auto* | — |
| overscroll-behavior | `none` | `src/index.css` |

### 3.3 `#root`

| Property | Wert | Quelle |
|----------|------|--------|
| height | *nicht gesetzt* | — |
| min-height | *nicht gesetzt* | — |
| max-height | *nicht gesetzt* | — |
| overflow-x | `hidden` | `Home.jsx` GLOBAL_CSS + `index.css` |
| overflow-y | *default visible* | — |
| contain | *none* | — |
| content-visibility | *visible* | — |
| position | *static* | — |
| transform | *none* | — |
| will-change | *auto* | — |

### 3.4 `Home` (Shell-`div`, `HomeInner`)

| Property | Wert | Quelle |
|----------|------|--------|
| height | `100dvh` | `Home.jsx` inline |
| min-height | *nicht gesetzt* (`-webkit-fill-available` entfernt) | `Home.jsx` Kommentar |
| max-height | *nicht gesetzt* | — |
| overflow-x | `hidden` | inline |
| overflow-y | *nicht gesetzt / visible* | `overflow:hidden` bewusst weggelassen |
| contain | *none* | — |
| content-visibility | *visible* | — |
| position | `relative` | inline |
| transform | *none* | — |
| will-change | *auto* | — |
| display | `flex`, `flex-direction: column` | inline |

**Auffälligkeit:** `.hui-scroll` hat `flex: 1` aber **kein `minHeight: 0`**. Das ist ein bekannter Safari-Flex-Bug-Kandidat, erklärt aber allein nicht das exakte „5 Beiträge"-Muster (Firefox wäre dann ggf. auch betroffen).

### 3.5 `HomeShell`

`HomeShell` rendert nur Provider/Context — **kein eigenes Layout-Element**. Layout lebt in `HomeInner`.

### 3.6 `.hui-scroll` ★

| Property | Wert | Quelle |
|----------|------|--------|
| height | *implizit via `flex: 1`* | `Home.jsx` inline |
| min-height | **nicht gesetzt** | — |
| max-height | *nicht gesetzt* | — |
| overflow-y | `auto` | `index.css` + inline |
| overflow-x | `hidden` | `index.css` + inline |
| contain | *none* (wird nur bei Surface-Close per JS geleert) | `safariPaintRecovery.js` |
| content-visibility | *visible* | — |
| position | `relative` | inline |
| transform | `none` (Ruhe) / `scale(...)` bei aktiver Surface | `worldSurfaceController.js` |
| will-change | **`transform`** | **`src/index.css` Zeile 183** |
| -webkit-overflow-scrolling | `touch` | `index.css`, `index.html` |
| overscroll-behavior | `contain` | `index.css` + inline |
| filter | `none` (Ruhe) | `Home.jsx` — Stacking-Context-Fix |

```177:187:src/index.css
.hui-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  will-change: transform;             /* GPU-Layer → smoothes Scrollen */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

### 3.7 `UnifiedFeed` (Root-`div`)

| Property | Wert | Quelle |
|----------|------|--------|
| height | *auto* | — |
| min-height | **`100vh`** | `UnifiedFeed.jsx` Zeile 1168 |
| max-height | *nicht gesetzt* | — |
| overflow-x | `hidden` | inline |
| overflow-y | *visible* | — |
| contain | *none* | — |
| content-visibility | *visible* | — |
| position | *static* | — |
| transform | *none* | — |
| will-change | *auto* | — |

`minHeight: 100vh` innerhalb eines Nested-Scrollers kann `scrollHeight` auf Safari aufblähen, ist aber nicht die primäre Ursache für fehlendes Painting.

### 3.8 `FeedList`

**Modus A — Virtualisiert (`arr.length > 6`, Standard bei ~20 Initial-Items):**

| Property | Container (`height: totalHeight`) | Zeilen (`virt-row`) |
|----------|-----------------------------------|---------------------|
| height | `totalHeight` (= `count × ~640px`) | *absolut positioniert* |
| position | `relative` | `absolute` |
| transform | *none* | **`translateY(${vRow.start}px)`** |
| content-visibility | *visible* | *visible* |
| will-change | *auto* | *auto* |

```585:619:src/feed/UnifiedFeed.jsx
  const rowVirtualizer = useVirtualizer({
    count: arr.length,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    estimateSize: () => 640,
    overscan: 3,
  });
  ...
  const useVirt = !!scrollContainerRef?.current && arr.length > 6;
  ...
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vRow.start}px)`,
```

**Modus B — Fallback (`arr.length ≤ 6`):**

| Index | content-visibility | contain-intrinsic-size |
|-------|-------------------|------------------------|
| 0–4 (Beiträge 1–5) | `visible` | — |
| ≥5 (ab Beitrag 6) | **`auto`** | **`0 620px`** |

```647:648:src/feed/UnifiedFeed.jsx
                contentVisibility: idx > 4 ? "auto" : "visible",
                containIntrinsicSize: idx > 4 ? "0 620px" : undefined,
```

### 3.9 Sticky-Elemente im Scroll-Pfad

| Element | position | Auswirkung |
|---------|----------|------------|
| `HomeHeader` | `sticky; top: 0` | **Außerhalb** `.hui-scroll` — kein Nested-Sticky-Konflikt |
| `FeedSoftHydrationBadge` | `sticky; top: 12` | **Innerhalb** `.hui-scroll` — sekundärer Safari-Risikofaktor |

---

## 4. Scroll-Metriken-Protokollierung

### 4.1 Beim Scrollen loggen (iPad Safari Console)

```javascript
(function watchHuiScroll() {
  const el = document.querySelector('.hui-scroll');
  if (!el) return console.warn('no .hui-scroll');
  const names = [
    ['html', document.documentElement],
    ['body', document.body],
    ['#root', document.getElementById('root')],
    ['.hui-scroll', el],
  ];
  function snap(label) {
    const row = { label, t: Date.now() };
    for (const [n, node] of names) {
      if (!node) continue;
      row[`${n}_scrollTop`] = node.scrollTop;
      row[`${n}_scrollHeight`] = node.scrollHeight;
      row[`${n}_clientHeight`] = node.clientHeight;
    }
    row.window_scrollY = window.scrollY;
    console.log(row);
  }
  el.addEventListener('scroll', () => requestAnimationFrame(() => snap('scroll')), { passive: true });
  snap('init');
  console.log('HUI scroll watcher active');
})();
```

### 4.2 Erwartetes Muster bei dem Bug

| Phase | `.hui-scroll` | Symptom |
|-------|---------------|---------|
| Oben (Beiträge 1–5 sichtbar) | `scrollTop` ≈ 0–3200, `scrollHeight` >> `clientHeight` | Karten sichtbar |
| Weiter scrollen | `scrollTop` steigt weiter | **Weißer Bereich**, keine Karten |
| `scrollHeight` | bleibt groß (~`n × 640` + Header/Events) | Scrollbar/Geste funktioniert — **Leerraum ist scrollbar** |
| `window.scrollY` | **0** | Bestätigt Nested Scroll |

Das ist das klassische „scrollHeight stimmt, Painting fehlt"-Muster eines Compositor-/Layer-Bugs — nicht ein Kollaps auf `height: 0`.

### 4.3 Kartenhöhen nach Beitrag 5 prüfen

```javascript
document.querySelectorAll('[data-index], .hui-feed-card').forEach((el, i) => {
  console.log(i, 'offsetHeight=', el.offsetHeight, 'rect=', el.getBoundingClientRect().height);
});
```

**Erwartung bei Virtualizer:** Nur sichtbare Indizes im DOM; `offsetHeight` ≈ 620–660, **nicht 0**.  
**Bei Kollaps-Bug:** `offsetHeight === 0` ab Index ≥ 5 — wurde im Code **nicht** gefunden (kein `height: 0` auf aktivem Feed-Tab).

Inaktive Tabs haben `height: 0`, aber nur wenn `tab !== 'feed'`:

```46:53:src/lib/world/tabVisibilityController.js
  if (!isActive) {
    return {
      position:      "absolute",
      ...
      height:        0,
      overflow:      "hidden",
```

---

## 5. Analyse: Höhe 0 / Eltern-Kollaps nach Beitrag 5?

| Prüfpunkt | Ergebnis |
|-----------|----------|
| Setzt Safari `height: 0` auf Feed-Tab? | **Nein** — aktiver Tab: `position: relative`, keine Höhenbegrenzung |
| Kollabiert `FeedList`-Container? | **Nein** — virtueller Modus: explizites `height: totalHeight` |
| Kollabieren einzelne Karten? | **Nein im Code** — weder `height: 0` noch `display: none` ab Index 5 |
| `content-visibility: auto` ab Index 5 | **Nur Fallback-Modus (≤6 Items)** — reserviert 620px via `containIntrinsicSize` |
| Korrelation „5 Beiträge" | **Viewport-Füllung:** bei ~640px/Karte + Header/Events passen ~5 Karten auf iPad-Screen; danach scrollt man in den fehlerhaften Bereich |

**Fazit:** Es handelt sich um **fehlendes Compositing/Painting**, nicht um einen Layout-Kollaps. `scrollHeight` bleibt groß → „unendlich weißer Bereich".

---

## 6. Einfluss von `contain`, `transform`, `position: sticky`

| Property | Wo | Safari-Relevanz |
|----------|-----|-----------------|
| **`will-change: transform`** | `.hui-scroll` global | **Hoch** — erzwingt dauerhaften Compositor-Layer auf dem Scroll-Container |
| **`transform: translateY()`** | Virtualisierte `FeedList`-Zeilen | **Hoch** — Kinder-Transforms innerhalb eines Layer-Scrollers |
| `transform: translateZ(0)` | `HomeHeader` | Niedrig — außerhalb des Scrollers |
| `transform: scale()` | Inaktive Tabs, Surface-Animation | Mittel — nur inaktive Tabs / Overlay-Zustand |
| `position: sticky` | `FeedSoftHydrationBadge` | Mittel — Nested Sticky in Transform-Scroller bekannt problematisch |
| `contain` | Nur `HuiMembershipFlow`, nicht im Feed-Pfad | Kein Einfluss |
| `content-visibility: auto` | Fallback FeedList, idx > 4 | Mittel — nur bei ≤6 Items; nicht primär bei 20-Item-Feed |
| `overscroll-behavior: contain` | `.hui-scroll` | Niedrig — betrifft Bounce, nicht Painting |

**Warum Firefox funktioniert:** Gecko behandelt Nested Compositor-Layers in `overflow: auto`-Containern robuster als WebKit. Dieselbe CSS-Kette kann in Firefox korrekt painten und in Safari „leeren" scrollbaren Raum erzeugen.

**Widerspruch im Code:** `worldSurfaceController.js` dokumentiert, dass `willChange` **nicht** persistent gesetzt werden soll (nur imperativ via `stripGpuHints`), aber `index.css` setzt `will-change: transform` **dauerhaft** auf `.hui-scroll`. `stripGpuHints` läuft nur beim Schließen einer Surface (`activeSurface → null`), nicht beim initialen Feed-Load.

---

## 7. Root Cause

**Primäre Ursache (P0):**

> Safari/WebKit failt beim Compositing von Feed-Inhalten, wenn der **Scroll-Container** (`.hui-scroll`) durch `will-change: transform` auf einer eigenen GPU-Ebene liegt und die **Feed-Zeilen** gleichzeitig per `@tanstack/react-virtual` mit `transform: translateY()` absolut positioniert werden.

**Kausalkette:**

1. Initial-Feed lädt ~20 Items (`PAGE_SIZE = 20` in `useFeedStream.js`).
2. `useVirt = arr.length > 6` → Virtualizer aktiv.
3. Virtualizer setzt Container-Höhe auf `totalHeight` (≈ 20 × 640px = 12.800px) → `.hui-scroll.scrollHeight` ist groß.
4. Nur ~5–7 Karten sind im Viewport sichtbar (overscan: 3).
5. Beim Weiterscrollen erhöht sich `scrollTop` korrekt, aber WebKit malt die transformierten Zeilen außerhalb der initialen Compositor-Region nicht zuverlässig neu.
6. Nutzer sieht: **weißer Hintergrund (`#FAFAF8` / `#F9F7F4`), weiterhin scrollbar**.

**Sekundäre Verstärker (nicht allein ursächlich):**
- `UnifiedFeed` `minHeight: 100vh` — bläht `scrollHeight` zusätzlich auf
- Fehlendes `minHeight: 0` auf `.hui-scroll` im Flex-Layout
- `FeedSoftHydrationBadge` mit `position: sticky` innerhalb des Transform-Scrollers
- `FeedBottomSentinel` mit `root: null` (Viewport statt `.hui-scroll`) — betrifft Pagination, nicht das White-Gap-Symptom

---

## 8. Genau eine empfohlene Korrektur

**Entferne `will-change: transform` aus der globalen `.hui-scroll`-Regel in `src/index.css` (Zeile 183).**

```css
/* VORHER */
.hui-scroll {
  ...
  will-change: transform;
}

/* NACHHER */
.hui-scroll {
  ...
  /* will-change entfernt — kollidiert mit Virtualizer translateY() auf Safari */
}
```

**Begründung:**
- Minimal-invasiv (eine Zeile)
- Behebt den direkten WebKit-Compositor-Konflikt zwischen Scroll-Layer und Transform-Kindern
- Konsistent mit bestehender Architektur-Entscheidung in `worldSurfaceController.js` (willChange nur imperativ, nicht persistent)
- Kein Eingriff in Virtualizer, Feed-Logik oder Tab-System
- Firefox-Verhalten bleibt unverändert

**Nicht empfohlen als erste Korrektur:** Virtualizer deaktivieren, `content-visibility` entfernen, oder `minHeight: 100vh` ändern — höherer Eingriff, ohne den dokumentierten Compositor-Konflikt direkt zu adressieren.

---

## 9. Verifikation nach Fix

1. iPad Safari: Feed mit ≥10 Beiträgen öffnen
2. Scroll-Metriken-Snippet (Abschnitt 4) ausführen → nur `.hui-scroll` scrollt
3. Nach Beitrag 5 weiterscrollen → Karten 6+ müssen sichtbar bleiben
4. `scrollTop`/`scrollHeight`/`clientHeight` von `.hui-scroll` loggen — `scrollHeight` sollte mit sichtbarem Inhalt korrelieren, kein weißer Gap

---

## Anhang: Untersuchte Dateien

| Datei | Relevanz |
|-------|----------|
| `src/pages/Home.jsx` | Scroll-Container, Layout |
| `src/components/home/HomeShell.jsx` | Scroll-Memory, Tab-Styles |
| `src/index.css` | `.hui-scroll` global CSS |
| `src/feed/UnifiedFeed.jsx` | FeedList, Virtualizer, content-visibility |
| `src/feed/FeedScrollSentinel.jsx` | Sentinel root-Bug (sekundär) |
| `src/feed/FeedSoftHydrationBadge.jsx` | Sticky im Scroller |
| `src/lib/world/tabVisibilityController.js` | Inaktive Tab height:0 |
| `src/lib/world/safariPaintRecovery.js` | GPU-Hint-Management |
| `src/lib/world/worldSurfaceController.js` | Transform auf Scroll-Container bei Surface |
| `index.html` | iOS Scroll-Touch-Hints |
| `tools/safari-scroll-diagnostic.html` | Layout-Reproduktion für WebKit-Tests |

---

*Ende des Berichts — Analyse only, keine Code-Änderungen am Produkt.*
