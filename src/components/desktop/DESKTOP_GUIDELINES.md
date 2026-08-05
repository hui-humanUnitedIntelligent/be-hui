# HUI Desktop Platform — Verbindliche Architektur- und Design-Guidelines

## Geltungsbereich

Diese Guidelines gelten **ausschließlich** für Desktop-Komponenten (`src/components/desktop/`).
Die Mobile-App (`src/App.jsx`, `src/components/home/`, etc.) ist nicht betroffen.

---

## 1. Architektur-Regeln

### Shared Code ist heilig
- Alle Services, Hooks, Contexts, Feed-Cards, Design-Tokens, Lib-Funktionen bleiben **gemeinsam**.
- Desktop-Komponenten **importieren** shared Code — sie kopieren ihn **niemals**.
- Neue Logik wird in der **shared Schicht** entwickelt, dann erhält jede Shell eine Darstellung.

### Trennung
- Desktop-Komponenten leben in `src/components/desktop/`.
- Desktop-CSS lebt in `desktopFoundation.css` (Tokens + Layout) und `web.css` (Komponenten-Styles).
- Desktop-Routing in `WebApp.jsx`. Mobile-Routing in `App.jsx`. Beide nutzen denselben Routing-Baum.

### Keine Duplikate
- Keine doppelten Services. Keine doppelten Hooks. Keine doppelten Contexts.
- Keine doppelten Supabase-Aufrufe. Keine doppelten Datenmodelle.
- Desktop ist **nur eine andere Darstellung** derselben Daten.

---

## 2. Design Token Regeln

### Pflicht
- Jede Desktop-Komponente nutzt **ausschließlich** Werte aus `desktopTokens.js` (JS) oder CSS Custom Properties (CSS).
- **Keine Magic Numbers.** Nie `width: 260` inline schreiben — immer `var(--desktop-sidebar-width)`.
- Neue Tokens werden in `desktopTokens.js` **und** `desktopFoundation.css` synchron definiert.

### Verfügbare Tokens
- `LAYOUT` — Sidebar, Content, RightPanel, Header, Gap (alle Breiten/Höhen)
- `BREAKPOINTS` — Mobile, Tablet, Laptop, Desktop, LargeDesktop, Ultrawide
- `MODAL` — Width, MaxWidth, Radius, Padding, BackdropOpacity
- `SPACING` — xs (4) bis xxxl (64)
- `RADIUS` — sm (8) bis xxl (28)
- `SHADOW` — sm, md, lg, xl, hover, focus
- `ANIMATION` — fast (150ms), normal (250ms), slow (350ms), page (400ms) + easings
- `Z_INDEX` — content (10) bis contextMenu (1300)

---

## 3. Breakpoint-Regeln

| Breakpoint | Width | Sidebar | RightPanel | Content |
|---|---|---|---|---|
| Mobile | <768px | — (Mobile App) | — | — |
| Tablet | 768–1023 | 56px (mini) | Hidden | 20px padding |
| Laptop | 1024–1279 | 72px (compact) | Hidden | 32px padding |
| Desktop | 1280–1535 | 260px | 340px | 32px padding |
| LargeDesktop | 1536–1919 | 260px | 360px | 40px padding |
| Ultrawide | ≥1920 | 280px | 380px | 48px padding |

- Breakpoint-Erkennung via `useDesktopBreakpoint()` Hook.
- CSS-Regeln via `@media (min-width: ...)` in `desktopFoundation.css`.

---

## 4. Interaction-Regeln

### Hover
- Jede klickbare Card nutzt `.desktop-hover-card` (Card-Lift + Shadow).
- Hover-Transition: `var(--desktop-anim-fast)` (150ms).
- Hover-Shadow: `var(--desktop-shadow-hover)`.
- Hover-Transform: `translateY(-2px)` — nie mehr.

### Focus
- `:focus-visible` zeigt `var(--desktop-shadow-focus)` (3px Ring, HUI-Teal).
- Tab-Navigation muss sichtbar funktionieren.
- Focus-Trap in Modals via `DesktopModal`.

### Keyboard
- `Esc` schließt Modals, Panels, Dropdowns (via `useEscapeKey`).
- Globale Shortcuts via `useKeyboardShortcuts`.
- Tab bleibt in geöffneten Modals (Focus-Trap).
- Shortcuts funktionieren **nicht** in Input/Textarea (außer Esc).

### Scrollbar
- Desktop-Style: 8px breit, `rgba(0,0,0,0.12)`, dezent.
- `scroll-behavior: smooth` auf Content-Area.

---

## 5. Modal-Regeln

### DesktopModal ist verbindlich
- Jeder Desktop-Dialog nutzt `<DesktopModal>`.
- Keine eigenen Modal-Implementierungen.
- Keine Fullscreen-Overlays (`position:fixed; inset:0`).
- Keine Bottom-Sheets.

### DesktopModal Features
- Zentriert (vertikal + horizontal)
- ESC schließt (capture phase, höchste Priorität)
- Outside-Click schließt (konfigurierbar)
- Open/Close-Animation (fade + scale, 250ms)
- Body-Scroll-Lock während offen
- Focus-Trap (Tab bleibt im Modal)
- Accessible (`role="dialog"`, `aria-modal`, `aria-labelledby`)
- Dark Mode kompatibel (via CSS Variablen)
- Responsive (`maxWidth: 90vw`, `maxHeight: 85vh`)

---

## 6. Layout-Regeln

### 3-Zonen-Layout
```
┌─────────┬────────────────────┬─────────┐
│ Sidebar │   Header           │ Right   │
│ (260px)├────────────────────┤ Panel   │
│         │   Content (Outlet) │ (340px) │
│         │   max 1100px       │         │
└─────────┴────────────────────┴─────────┘
```

- Sidebar: Sticky, 100vh, eigene Scroll.
- Content: Scrollbar, `max-width` zentriert.
- RightPanel: Sticky, 100vh, eigene Scroll. Hidden <1280px.

### Content-Breite
- Standard: 1100px (zentriert).
- Ultrawide: 1200px.
- Nie breiter als 1200px — Lesbarkeit vor Dichte.

---

## 7. Feed-Regeln

### Flexible Architektur
- Feed nutzt `DesktopFeedWrapper` mit `data-feed-columns` Attribut.
- Phase 0: Single-Column (`columns={1}`).
- Multi-Column CSS ist vorbereitet (2/3 Spalten), aber nicht aktiviert.
- Feed-Cards bleiben unverändert (shared, aus `src/feed/cards/`).

### Prioritäten
1. Lesbarkeit
2. Wirkung
3. Ruhe
4. Orientierung
Nicht: maximale Informationsdichte.

---

## 8. Komponenten-Regeln

### Was auf Desktop NIEMALS verwendet wird
- `HUIBottomNavigation` — Mobile Bottom-Nav
- `HomeShell` — Mobile Shell
- `HomeHeader` — Mobile Header
- `PullToRefreshIndicator` — Mobile-only
- `AppEntryController` — Mobile Entry
- `IntroVideoScreen` — Mobile Intro
- `position:fixed; inset:0` — Fullscreen-Overlays
- Bottom-Sheets (`borderRadius: 28px 28px 0 0`)

### Was auf Desktop IMMER verwendet wird
- `DesktopShell` — 3-Zonen-Layout
- `DesktopSidebar` — Linke Navigation
- `DesktopHeader` — Top-Bar mit Suche
- `DesktopRightPanel` — Wirkungsraum (≥1280px)
- `DesktopModal` — Zentrale Dialog-Komponente
- `DesktopFeedWrapper` — Flexibler Feed-Container
- `useDesktopBreakpoint` — Breakpoint-Erkennung
- `useEscapeKey` — ESC-Handler
- `useKeyboardShortcuts` — Globale Shortcuts

---

## 9. Dark Mode

- Vorbereitet via `#web-root[data-theme="dark"]` in `desktopFoundation.css`.
- Alle Farben als CSS Custom Properties — kein hardcoded `#FFF` oder `#000`.
- Aktivierung: `document.getElementById('web-root').setAttribute('data-theme', 'dark')`.
- Keine `darkMode: 'class'` in Tailwind-Config nötig — CSS-Variablen reichen.

---

## 10. Accessibility

- `role="dialog"` + `aria-modal="true"` für Modals.
- `aria-label` für Icon-only Buttons.
- `:focus-visible` mit sichtbarem Focus-Ring.
- Tab-Navigation muss in allen Desktop-Komponenten funktionieren.
- Escape muss alle Overlays/Modals/Panels schließen.
