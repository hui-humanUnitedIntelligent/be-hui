# HUI Flow Language
**Version:** Phase 2B | **Datum:** 2026-05-24

---

## Kernprinzip

HUI soll sich wie ein zusammenhängender Raum anfühlen — nicht wie isolierte Screens.

Jeder Flow weiß:
- **woher er kommt** (source)
- **wohin er zurückkehrt** (return strategy)
- **wie er klingt** (emotional completion)
- **wie er sich anfühlt** (flow state)

---

## Source Standard

### Importieren

```js
import { S } from "../core/hui.sources.js";
```

### Alle Surface-Konstanten

| Konstante | Wert | Beschreibung |
|---|---|---|
| `S.HOME` | `"home"` | Home-Feed (aktiver Tab) |
| `S.DISCOVER` | `"discover"` | Entdecken-Seite |
| `S.FAVORITES` | `"favorites"` | Dein Raum |
| `S.IMPACT` | `"impact"` | Impact-Seite |
| `S.VISITOR_PROFILE` | `"visitor-profile"` | Fremdes Creator-Profil |
| `S.OWNER_PROFILE` | `"owner-profile"` | Eigenes Profil |
| `S.CHAT` | `"chat"` | Resonanz-Center |
| `S.BOOKING` | `"booking"` | Booking-Flow |
| `S.EXPERIENCE` | `"experience"` | Erlebnis-Detail |
| `S.NOTIFICATIONS` | `"notifications"` | Notification-Center |
| `S.MAP` | `"map"` | Live-Map |
| `S.MATCH` | `"match"` | Match-Overlay |
| `S.ORB` | `"orb"` | HUI Orb |
| `S.SYSTEM` | `"system"` | Interne Action |
| `S.UNKNOWN` | `"unknown"` | Fallback |

### Regel

**NICHT:**
```js
actions[A.OPEN_PROFILE]({ creatorId: id, source: "discover" })
```

**SONDERN:**
```js
actions[A.OPEN_PROFILE]({ creatorId: id, source: S.DISCOVER })
```

---

## Flow Return System

### Semantische Returns — nicht history.back()

Jede Surface hat eine definierte Rückkehr-Surface:

| Surface | Kehrt zurück zu |
|---|---|
| Chat | Creator-Profil (LOOP 1) |
| Experience | Discover |
| Booking | Creator-Profil |
| Creator-Profil | Home (oder source-Tab) |
| Notifications | Home |
| Map | Discover |
| Match | Home |
| Orb | Home |

### LOOP 1: Das wichtigste Return-Muster

```
Discover → Creator-Profil → Chat → zurück zum Profil
```

Implementierung:
1. `ProfileLauncher.handleChat()` → `flow.setReturnProfile(showWirker)` 
2. Chat schließt → `flow.getReturnProfile()` → `setShowWirker(profile)`
3. Profil erscheint wieder — der User ist nie verloren

### resolveReturn() — programmatischer Return

```js
import { resolveReturn } from "../core/hui.flow.return.js";

// In einem Close-Handler:
const ret = resolveReturn(flow, shell, S.CHAT);
ret.execute();  // findet beste Strategie, führt sie aus
```

---

## Flow States

```js
import { FLOW } from "../core/hui.flow.states.js";

FLOW.IDLE       // Kein aktiver Flow
FLOW.ENTERING   // Flow öffnet sich
FLOW.ACTIVE     // Flow ist aktiv
FLOW.RETURNING  // Rückkehr zum vorherigen Context
FLOW.CLOSING    // Neutrales Schließen
```

### Timing

| State | Dauer |
|---|---|
| ENTERING | 420ms |
| RETURNING | 600ms (weicher als Exit) |
| CLOSING | 280ms |
| ECHO | 800ms |

---

## Emotional Completion

### Prinzip

Kein Toast-Spam. Kein lautes Feedback. Nur ruhige Resonanz.

### Echo-Typen

| Echo | Beschreibung | Wann |
|---|---|---|
| `ECHO.NONE` | Kein Feedback | Navigation, Öffnen |
| `ECHO.SOFT_GLOW` | Sanfter Glow | Resonanz senden |
| `ECHO.WARMTH` | Wärme-Effekt | Follow/Entfolgen |
| `ECHO.PULSE` | Kurzer Puls | Teilen |
| `ECHO.SLIDE_BACK` | Weiches Zurückgleiten | Chat schließt |
| `ECHO.CONFIRM` | Ruhige Bestätigung | Buchung abschließen |

### Action → Echo Mapping

| Action | Echo |
|---|---|
| FOLLOW_CREATOR | WARMTH |
| SEND_RESONANCE | SOFT_GLOW |
| SHARE_MOMENT | PULSE |
| BOOK_EXPERIENCE | CONFIRM |
| CLOSE_CHAT | SLIDE_BACK |

### flowSignal lauschen

```js
import { flowSignal, ECHO } from "../core/hui.flow.states.js";

// In einem useEffect:
useEffect(() => {
  const cleanup = flowSignal.on("echo", ({ type, action, data }) => {
    if (type === ECHO.WARMTH) {
      // Sanfte Wärme-Animation starten
    }
  });
  return cleanup;
}, []);
```

---

## Observability — Logging Standards

Im DEV-Modus (automatisch):

```
[HUI_ACTION] OPEN_PROFILE from Entdecken  { creatorId: "..." }
[HUI_FLOW] Entdecken → Creator-Profil
[HUI_RETURN] ← Chat → Creator-Profil
[HUI_CONTRACT] A.BOOK_EXPERIENCE: Pflichtfeld "experience" fehlt. Abbruch.
```

### Log-Farben

| Präfix | Farbe | Bedeutung |
|---|---|---|
| `[HUI_ACTION]` | Teal | Action ausgeführt |
| `[HUI_FLOW]` | Violett | Surface-Transition |
| `[HUI_RETURN]` | Amber | Return-Navigation |
| `[HUI_CONTRACT]` | Rot | Validation-Fehler |

---

## Flow Memory Stack

Der FlowStore (in HomeShell) hält einen LIFO-Stack der letzten 10 Einträge:

```js
// Eintrag-Schema:
{
  surface:   S.VISITOR_PROFILE,  // wohin navigiert
  source:    S.DISCOVER,         // woher (für Return)
  creatorId: "abc-123",          // optional
  creator:   { ... },            // vollständiges Profil-Objekt
  timestamp: 1716549600000,
}
```

Zugriff über `useHuiFlow()`:
```js
const flow = useHuiFlow();
flow.push({ surface: S.CHAT, source: S.VISITOR_PROFILE });
flow.current()       // letzter Eintrag
flow.pop()           // nimmt letzten Eintrag vom Stack
flow.hasReturn()     // ob Stack nicht leer ist
flow.setReturnProfile(profile)   // LOOP 1
flow.getReturnProfile()          // LOOP 1
flow.clearReturnProfile()        // LOOP 1
```

---

## Architektur-Übersicht

```
hui.sources.js          ← Basis: S-Konstanten, RETURN_TO, SURFACE_DEPTH
  ↑
hui.flow.js             ← FlowCtx, createFlowStore, useHuiFlow
hui.flow.return.js      ← resolveReturn, executeReturn
hui.flow.states.js      ← FLOW, ECHO, ACTION_ECHO, flowSignal
  ↑
hui.contracts.js        ← validate(), Contract-Definitionen
  ↑
hui.actions.js          ← buildActions, useHuiActions, A
  ↑
HomeShell.jsx           ← FlowCtx.Provider, flowStore
  ↑
HomeInner / ProfileLauncher / alle Seiten
```

---

## Wichtigste Regeln

1. **Immer `S.X` statt freier Strings** — `source: S.DISCOVER`, nie `source: "discover"`
2. **Kein history.back()** — `resolveReturn()` nutzen
3. **Keine lokalen return-States** — flowStore ist Single-Source-of-Truth
4. **Emotional Completion via flowSignal** — keine Toast-Spam
5. **Bestehende Fallbacks nie entfernen** — Migration ist optional
