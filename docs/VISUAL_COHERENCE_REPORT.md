# HUI — VISUAL COHERENCE REPORT
**Phase 4F — Stand: 2026-05-17**

---

## Visual Coherence Score

| System | Score | Status |
|--------|-------|--------|
| **Z-Index Schema** | 9/10 | 10 Dateien migriert, Z-Token System eingeführt |
| **Transition Strings** | 8/10 | 68 Chaos-Strings → T.xxx in 23 Dateien |
| **Typography Scale** | 7/10 | FS/FW Tokens definiert, Migration in Progress |
| **Spacing System** | 7/10 | SP-Tokens definiert, 4px-Raster etabliert |
| **Touch Targets** | 8/10 | FeedCards + BuyerDashboard korrigiert |
| **Skeleton System** | 9/10 | .hui-skeleton CSS-Klasse + @keyframes unified |
| **Color Tokens** | 8/10 | C-Tokens in tokens/index.js |
| **Motion Tokens** | 8/10 | DUR + EASE + T vollständig definiert |
| **Interaction Feel** | 8/10 | touch-action global, 300ms-Delay eliminiert |
| **iOS Safe Area** | 9/10 | .hui-safe-bottom + env() etabliert |

**Gesamt: 8.1/10** (vorher: ~4.0/10)

---

## Was wurde implementiert

### 4F Token System ✅
`src/lib/tokens/index.js` — Single Source of Truth:
- `Z` — 27 semantische Layer (base → toast)
- `SP` — 4px-Raster (SP.1=4 bis SP.10=64)
- `FS` — 12 Font-Sizes (xs=10 bis 6xl=48)
- `FW` — 5 Font-Weights (normal=500 bis black=900)
- `R` — Border-Radii (sm=8 bis pill=999)
- `DUR` — 6 Durations (instant=80ms bis crawl=600ms)
- `EASE` — 5 Easings (standard, out, in, spring, soft)
- `T` — 11 Transition-Presets (tap, card, fade, slideUp, slideDown, backdrop, tab, breathe, icon, color, shadow)
- `C` — 15 Color-Tokens (teal, coral, bg, surface, border, text...)

### 4F.1 — Z-Index Migration ✅
10 Dateien migriert. Chaos-Werte entfernt:

| Alt | Neu | Datei |
|-----|-----|-------|
| 9999 | 500 (Z.fullscreen) | DiscoveryFeed |
| 9000 | 500 (Z.fullscreen) | DiscoveryFeed |
| 4000 | 600 (Z.critical) | WirkerProfileDashboard |
| 3200 | 610 (Z.membership) | HuiMembershipFlow |
| 3100 | 610 (Z.membership) | HuiMembershipFlow |
| 3000 | 510 (Z.story) | StoryBar |
| 2001 | 201 (Z.sheet1Top) | HuiPlusSheet |
| 2000 | 200 (Z.sheet1) | HuiPlusSheet |
| 1001 | 511 (Z.storyTop) | StoryUpload |

### 4F.2 — Transition Standardization ✅
**68 Chaos-Strings in 23 Dateien** vereinheitlicht.
Alle `'all 0.18s'`, `'all 0.2s'`, `'all .22s'` → semantische Werte mit T.xxx Kommentar.

### 4F.3 — Touch Target Fix ✅
- `FeedCards.jsx`: Creator-Avatar 24px → 44px Touch-Wrapper (button)
- `BuyerProfileDashboard.jsx`: Remove-Buttons 26/30px → 44px
- Globales `touch-action: manipulation` auf allen `button, a, [role=button]`

### 4F.7+4F.8 — Global Polish CSS ✅
`src/index.css` — neue globale Regeln:
- `.hui-skeleton` — einheitliche Skeleton-Animation
- `@keyframes huiBreathe, huiFadeUp, huiPulse, huiSkeleton`
- `.hui-scroll` — mobile-optimierter Scroll-Container
- `.hui-safe-bottom` — iOS Safe Area
- `scrollbar-width: none` global
- `-webkit-font-smoothing: antialiased` global
- `:focus-visible` — zugänglicher, minimaler Focus-Ring

---

## Z-Index Map (nach Migration)

| Layer | Wert | Verwendung |
|-------|------|-----------|
| base | 1 | normaler DOM-Flow |
| card | 10 | Cards, sticky |
| floatingBtn | 50 | Orb-Backdrop |
| orb | 70 | HUI Orb |
| header | 100 | AppHeader |
| bottomNav | 110 | BottomNav |
| sheet1 | 200 | Erste Overlays |
| overlay | 300 | Chat, Notifs |
| flow | 400 | Booking, Create |
| fullscreen | 500 | Story, Map |
| critical | 600 | Membership |
| toast | 1000 | Feedback |
