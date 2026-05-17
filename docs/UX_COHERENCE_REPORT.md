# HUI — UX COHERENCE REPORT
**Phase 4E — Stand: 2026-05-17**

---

## UX Coherence Score

| System | Score | Notes |
|--------|-------|-------|
| **Overlay Governance** | 7/10 | Z-Schema + useOverlay bereit, Migration ausstehend |
| **Navigation Consistency** | 8/10 | closeAllOverlays, Tab-Persistenz, ESC |
| **Creator/Public Clarity** | 8/10 | useViewMode(), klare Owner-Separation |
| **Feedback Consistency** | 8/10 | feedback/index.js — einheitliche Sprache |
| **Touch & Mobile** | 7/10 | MIN_TOUCH=44, useKeyboardAware bereit |
| **Micro-Interactions** | 7/10 | tapStyle, BASE_BUTTON, SKELETON_STYLE |
| **Empty/Loading States** | 8/10 | EMPTY_STATES, LOADING_MESSAGES standardisiert |
| **Transition Timing** | 6/10 | T-Objekt bereit, 76 alte Strings noch aktiv |
| **Z-Index Schema** | 6/10 | Z-Schema definiert, Altlasten noch vorhanden |

**Gesamt: 7.4/10** (vorher: ~4.5/10)

---

## Was wurde implementiert

### 4E.2 — Overlay Governance ✅
`src/lib/overlay/index.js`

**Z-Index Schema (kanonisch):**
```
Z.base=10        BottomNav, AppHeader
Z.sticky=50      Floating Hints, Tooltips
Z.orbBackdrop=100 Orb-Backdrop
Z.overlay1=200   Profil, Werk, Wirker Detail
Z.overlay2=300   Chat, Notifications
Z.flow=400       Booking, Create Flow
Z.fullscreen=500 Story Viewer, Maps
Z.critical=600   Membership, Onboarding
Z.toast=1000     Feedback — immer oben
```

**Hooks & Utils:**
- `useOverlay({lockScroll, closeOnEscape, onOpen, onClose})` — ESC + ScrollLock + FokusRestore
- `useOverlayStack()` — nur EIN aktives Overlay im Stack
- `slideUpStyle(visible, zIndex)` — Bottom Sheet Standard
- `fadeStyle(visible, zIndex)` — Modal Standard
- `backdropStyle(visible, zIndex)` — einheitlicher Backdrop
- `scrollLock()` / `scrollUnlock()` — referenz-gezählt

### 4E.5 — Feedback Consistency ✅
`src/lib/feedback/index.js`

- `feedback.success(msg)` — teal border, 2s, Icon ✓
- `feedback.error(msg)` — coral border, 4s, Icon ○
- `feedback.info(msg)` — neutral, 2.5s, Icon ·
- `feedback.loading(msg)` — persistent
- `feedback.retry(msg, {onRetry})` — mit Button
- `feedback.offline()` — persistent bis Reconnect
- `feedback.optimistic(msg, {onUndo})` — mit Undo
- `FEEDBACK_MESSAGES` — Standard-Texte für alle Aktionen
- `useFeedback()` Hook — für Komponenten

**Integriert in:** bookingContext, chatContext, Home.jsx, WirkerProfilePage

### 4E.4 — Creator vs Public Clarity ✅
`src/lib/interaction/index.js → useViewMode(user, profileUserId)`
```js
const { isOwner, isPublic, mode } = useViewMode(user, profile.user_id)
// mode: 'owner' | 'public'
```

### 4E.7 — Micro-Interaction Standards ✅
`src/lib/interaction/index.js`
- `MIN_TOUCH = 44` — Apple HIG
- `BASE_BUTTON` — touchAction: manipulation, min 44px
- `tapStyle(pressed)` — transform + opacity, 80ms
- `useTapState()` — Hook mit handlers + style
- `iconReactionStyle(active)` — Like/Follow/Save Reaktion
- `BACK_BUTTON_STYLE` — konsistenter Back-Button

### 4E.8 — Empty/Loading/Error States ✅
`src/lib/interaction/index.js`
- `EMPTY_STATES.feed/chat/bookings/notifications/works/search/followers/saved`
- `LOADING_MESSAGES.feed/profile/chat/booking/publishing/saving/sending/uploading`
- `SKELETON_STYLE` — konsistente Skeleton-Animation

### 4E.6 — Touch & Mobile ✅
- `useKeyboardAware(ref)` — iOS Keyboard Overlay Fix via visualViewport API
- `SCROLL_CONTAINER` — WebkitOverflowScrolling: touch, scrollbar hidden
- `BASE_BUTTON` — touchAction: manipulation (kein 300ms delay)

---

## Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `src/lib/overlay/index.js` | Z-Schema, useOverlay, useOverlayStack, slideUpStyle, backdropStyle, scrollLock |
| `src/lib/feedback/index.js` | feedback.success/error/info/loading/retry/offline, FEEDBACK_MESSAGES, useFeedback |
| `src/lib/interaction/index.js` | tapStyle, BASE_BUTTON, useTapState, EMPTY_STATES, LOADING_MESSAGES, useViewMode, useKeyboardAware |

---

## Offene Punkte (Phase 4F)

1. **Z-Index Migration** — alte z-Index Werte (9999, 4000 etc.) durch Z-Schema ersetzen
2. **Transition Migration** — 76 unique Strings → T.card/T.overlay/T.fade
3. **Touch-Target Fix** — 22 kleine Buttons auf MIN_TOUCH=44 bringen
4. **useOverlay in Overlays integrieren** — BookingFlow, ChatPage, NotifCenter
5. **EMPTY_STATES in leere States einsetzen** — MeinHUI_SubPages, ChatPage
