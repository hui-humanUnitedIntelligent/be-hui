# HUI — Z-INDEX MAP
**Phase 4F.1 — Kanonisches Schema**

Alle z-index Werte in HUI folgen diesem Schema.
**Kein Wert darf ohne Eintrag hier verwendet werden.**

---

## Schema

| Layer | Wert | Token | Verwendung |
|-------|------|-------|-----------|
| Base | 1 | `Z.base` | normaler DOM-Flow |
| Card | 10 | `Z.card` | Feed-Cards, sticky Elements |
| Card Hover | 11 | `Z.cardHover` | Hover-Zustand |
| Sticky | 20 | `Z.stickyCard` | Klebende Cards |
| Floating Button | 50 | `Z.floatingBtn` | Orb-Backdrop |
| Orb Backdrop | 60 | `Z.orbBackdrop` | Orb-Backdrop Layer |
| Orb | 70 | `Z.orb` | HUI Orb Button |
| Header | 100 | `Z.header` | AppHeader |
| BottomNav | 110 | `Z.bottomNav` | Tab Bar |
| App Bar | 120 | `Z.appBar` | Modaler App Bar |
| Sheet (Backdrop) | 200 | `Z.sheet1` | Erste Overlay-Ebene |
| Sheet (Content) | 201 | `Z.sheet1Top` | Sheet Content |
| Overlay | 300 | `Z.overlay` | Zweite Overlay-Ebene |
| Overlay Top | 301 | `Z.overlayTop` | Overlay Content |
| Chat | 310 | `Z.chat` | Chat Overlay |
| Notifications | 320 | `Z.notifs` | Notif Sheet |
| Flow | 400 | `Z.flow` | Booking/Create Flow |
| Flow Top | 401 | `Z.flowTop` | Flow Content |
| Booking | 410 | `Z.booking` | Booking Flow |
| Create | 420 | `Z.create` | Create Flow |
| Fullscreen | 500 | `Z.fullscreen` | Story/Map Viewer |
| Story | 510 | `Z.story` | Story Overlay |
| Map | 520 | `Z.map` | Map Overlay |
| Story Top | 511 | `Z.storyTop` | Story Controls |
| Critical | 600 | `Z.critical` | Critical Overlays |
| Membership | 610 | `Z.membership` | Membership Flow |
| Onboarding | 620 | `Z.onboarding` | Onboarding |
| Emergency | 700 | `Z.emergency` | Emergency Dialogs |
| Debug | 800 | `Z.debug` | Dev only |
| **Toast** | **1000** | **`Z.toast`** | **Feedback — immer oben** |

---

## VERBOTEN

- Jeder Wert > 1000
- Werte die nicht in dieser Tabelle stehen
- `zIndex: 9999`, `zIndex: 9000`, `zIndex: 4000` etc.

## Import

```js
import { Z } from '@/lib/tokens';
// oder
import { Z } from '../lib/tokens';
```
