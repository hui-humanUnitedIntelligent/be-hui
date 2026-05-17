# HUI — INTERACTION AUDIT
**Phase 4E.1 — Stand: 2026-05-17**

---

## Kritische Findings

### 🔴 KRITISCH — Overlay-Chaos in Home.jsx

**Problem:** 16 separate `showX`-States für Overlays — unkontrolliertes Stacking möglich.

```
showTalentFlow, showCreateSheet, showWirker, showWerkDetail,
showWerkCheckout, showWerkeKorb, showStoryComposer, activeStory,
showWerkPublisher, showExperienceCreator, showMatch, showMap,
showKorb, showChat, showNotifs, showMembership, showCreateFlow, showPlusSheet
```

**Risiko:** Mehrere Overlays können gleichzeitig `true` sein → visueller Konflikt.

**Fix:** `Z`-Schema + `useOverlayStack` aus `src/lib/overlay/index.js` bereitstellt.
`closeAllOverlays()` existiert bereits — setzt alle auf false. ✅

---

### 🔴 KRITISCH — z-Index Chaos

**Problem:** 76 unique z-Index Werte ohne Schema:

| Wert | Datei | Problem |
|------|-------|---------|
| 9999 | DiscoveryFeed | Kein Schema-Bezug |
| 9000 | DiscoveryFeed | Kein Schema-Bezug |
| 4000 | WirkerProfileDashboard | Kein Schema-Bezug |

**Fix:** Kanonisches `Z`-Schema in `src/lib/overlay/index.js`:
```
Z.base=10, overlay1=200, overlay2=300, flow=400, fullscreen=500, critical=600, toast=1000
```

---

### 🟡 MITTEL — 76 verschiedene Transition-Strings

**Problem:** Kein konsistentes Transition-System. Jede Komponente erfinde eigene Easings.

**Häufigste:**
- `'all .4s cubic-bezier(.34,1.4,.64,1)'` (3×)
- `'all .15s ease'` (3×)
- `'all 0.22s cubic-bezier(0.34,1.2,0.64,1)'` (3×)

**Fix:** `T`-Objekt in `src/lib/animations.js`:
```
T.overlay, T.card, T.fade, T.spring, T.breathe, T.instant
```

---

### 🟡 MITTEL — Kleine Touch-Targets (< 44px)

| Größe | Datei | Element |
|-------|-------|---------|
| 24px | FeedCards.jsx | Creator-Avatar (klickbar) |
| 26px | BuyerProfileDashboard | Entfernen-Buttons |
| 30px | BuyerProfileDashboard | Action-Buttons |
| 34px | ImpactPoolVisualization | Close-Button |

**Standard:** 44px Minimum (Apple HIG). `MIN_TOUCH = 44` in `interaction/index.js`.

---

### 🟡 MITTEL — Inkonsistente Loading-Sprache

| Text | Datei |
|------|-------|
| 'Wird aktiviert…' | CreateFlow |
| 'Speichere…' | ExperienceCreator |
| 'Wird geteilt…' | HuiCreateFlow |
| 'Lade…' | WirkerProfilePage |
| 'Lade Wirker…' | WirkerVerifizierungDashboard |

**Standard:** `LOADING_MESSAGES` in `interaction/index.js`.

---

### 🟢 GUT — ESC-Handling

`HuiOrb.jsx` und `Home.jsx` haben ESC-Handler. ✅

### 🟢 GUT — closeAllOverlays()

Existiert in Home.jsx und setzt alle 16 States zurück. ✅

### 🟢 GUT — Scroll-Lock Konzept

`scrollLock/scrollUnlock` in `overlay/index.js` bereit. ✅

---

## Bereich-Status

| Bereich | Overlay | Back | Transitions | Touch | Feedback |
|---------|---------|------|-------------|-------|---------|
| Home/Feed | ⚠ 16 States | ✅ | ⚠ gemischt | ⚠ | ✅ |
| DiscoveryFeed | ✅ | ✅ | ⚠ gemischt | ✅ | ⚠ |
| Profile | ✅ | ✅ | ✅ | ✅ | ⚠ |
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking | ✅ | ✅ | ⚠ | ✅ | ⚠ |
| CreatorStudio | ✅ | ✅ | ✅ | ✅ | ⚠ |
| Orb/CreateFlow | ✅ ESC ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
