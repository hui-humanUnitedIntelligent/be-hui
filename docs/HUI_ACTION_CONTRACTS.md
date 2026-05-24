# HUI Action Contract Map
**Version:** Phase 2 | **Datum:** 2026-05-24 | **System:** Action Engine v1

---

## Architektur-Prinzip

Jede Benutzer-Interaktion läuft über einen definierten **Action-Vertrag**.

```
UI-Event (onClick)
  → actions[A.OPEN_PROFILE]({ creatorId: "...", source: "discover" })
    → validate("OPEN_PROFILE", payload)          ← Contract-Check
      → logAction()                              ← DEV-Log
        → flowStore.push({ surface, source })   ← Flow-Memory
          → setShowWirker(data)                 ← UI-Update
```

Kein Button öffnet direkt einen State. Kein Modal öffnet sich ohne Flow-Context.

---

## Source-Standard

Jeder Action-Aufruf sollte `source` enthalten — für Flow-Memory und Return-Logic.

| source | Bedeutung |
|---|---|
| `"feed"` | Aus dem Home-Feed |
| `"discover"` | Aus der Entdecken-Seite |
| `"favorites"` | Aus Dein Raum / Favoriten |
| `"impact"` | Aus der Impact-Seite |
| `"orb"` | Aus dem HUI Orb |
| `"notifications"` | Aus dem Notification-Center |
| `"visitor-profile"` | Aus einem fremden Profil |
| `"own-profile"` | Aus dem eigenen Profil |
| `"chat"` | Aus dem Chat-Context |
| `"booking"` | Aus dem Booking-Flow |
| `"experience"` | Aus einem Erlebnis-Context |
| `"map"` | Aus der Live-Map |
| `"system"` | Interne Action (kein UI-Trigger) |

---

## Action Contracts

### A.OPEN_PROFILE
**Beschreibung:** Öffnet ein Creator-Profil als Overlay.

| Feld | Typ | Status |
|---|---|---|
| `creator` | object | **required** (oder `creatorId`) |
| `creatorId` | string | **required** (oder `creator`) |
| `source` | SOURCE | empfohlen |
| `_tab` | string | optional (Profil-Tab vorauswählen) |
| `_highlightExp` | string | optional (Erlebnis hervorheben) |

**Beispiel:**
```js
actions[A.OPEN_PROFILE]({
  creatorId: "abc-123",
  source: SOURCE.DISCOVER,
});
```

**Fehlerfall:** Wenn weder `creator` noch `creatorId` vorhanden → Action wird abgebrochen, kein Crash.

---

### A.OPEN_CHAT
**Beschreibung:** Öffnet den Chat-Overlay. Nutzt `chatRecipient`-State wenn kein `recipient` übergeben.

| Feld | Typ | Status |
|---|---|---|
| `recipient` | object | optional (oder `recipientId`) |
| `recipientId` | string | optional (oder `recipient`) |
| `source` | SOURCE | empfohlen |

**Beispiel:**
```js
actions[A.OPEN_CHAT]({
  recipient: { id: "abc", display_name: "Mia", avatar_url: "..." },
  source: SOURCE.VISITOR_PROFILE,
});
```

**Sonderfall:** `actions[A.OPEN_CHAT]()` — öffnet Chat mit dem zuletzt gesetzten `chatRecipient`.

---

### A.SEND_MESSAGE
**Beschreibung:** Delegiert an OPEN_CHAT. `recipient` oder `recipientId` muss vorhanden sein.

| Feld | Typ | Status |
|---|---|---|
| `recipient` | object | **required** (oder `recipientId`) |
| `recipientId` | string | **required** (oder `recipient`) |
| `source` | SOURCE | empfohlen |

---

### A.OPEN_EXPERIENCE
**Beschreibung:** Öffnet ein Erlebnis-Detail. Öffnet Profil wenn `creatorId` bekannt.

| Feld | Typ | Status |
|---|---|---|
| `experience` | object | **required** (oder `creatorId`) |
| `creatorId` | string | **required** (oder `experience`) |
| `source` | SOURCE | empfohlen |
| `view` | string | optional (`"alle"`, `"favoriten"`) |

---

### A.BOOK_EXPERIENCE
**Beschreibung:** Initiiert eine Buchung — öffnet Connect-Sheet.

| Feld | Typ | Status |
|---|---|---|
| `experience` | object | **REQUIRED** |
| `creator` | object | optional (setzt chatRecipient) |
| `source` | SOURCE | empfohlen |

**Fehlerfall:** Wenn `experience` fehlt → Action wird abgebrochen.

---

### A.OPEN_PROFILE (intern von OPEN_EXPERIENCE)
Wenn OPEN_EXPERIENCE ein Profil öffnet, setzt es automatisch `source: "system"`.

---

### A.FOLLOW_CREATOR
| Feld | Typ | Status |
|---|---|---|
| `creatorId` | string | **REQUIRED** |
| `following` | boolean | optional |
| `source` | SOURCE | empfohlen |

---

### A.SEND_RESONANCE
| Feld | Typ | Status |
|---|---|---|
| `targetId` | string | **REQUIRED** |
| `type` | `"profile"\|"moment"\|"experience"` | **REQUIRED** |
| `source` | SOURCE | empfohlen |

---

### A.SHARE_MOMENT
| Feld | Typ | Status |
|---|---|---|
| `url` | string | optional |
| `title` | string | optional |
| `text` | string | optional |
| `source` | SOURCE | empfohlen |

---

### A.OPEN_ROOM
| Feld | Typ | Status |
|---|---|---|
| `creatorId` | string | optional |
| `roomId` | string | optional |
| `source` | SOURCE | empfohlen |

---

### Navigations-Actions (kein Pflicht-Payload)

| Action | Funktion |
|---|---|
| `A.OPEN_OWN_PROFILE` | Eigenes Profil öffnen |
| `A.CLOSE_PROFILE` | Profil schließen |
| `A.CLOSE_CHAT` | Chat schließen |
| `A.OPEN_ORB` | Orb öffnen (`world` optional) |
| `A.CLOSE_ORB` | Orb schließen |
| `A.OPEN_BOOKING` | Booking-Sheet (`recipient` optional) |
| `A.OPEN_CONNECT` | Connect-Sheet |
| `A.OPEN_NOTIFICATIONS` | Notification-Center |
| `A.OPEN_MAP` | Live-Map |
| `A.OPEN_MATCH` | Match-Overlay |
| `A.OPEN_IMPACT` | Impact-Tab |
| `A.OPEN_COMMUNITY` | Community-Tab |
| `A.OPEN_STORY_COMPOSER` | Story-Composer |
| `A.OPEN_IMPACT_FLOW` | Impact-Flow |
| `A.OPEN_CREATE_FLOW` | Create-Flow |
| `A.GO_HOME` | Feed-Tab |
| `A.GO_DISCOVER` | Discover-Tab |
| `A.GO_IMPACT` | Impact-Tab |
| `A.GO_FAVORITES` | Favoriten-Tab |
| `A.GO_TO_TAB` | Beliebiger Tab (`tab` als String oder Payload) |

---

## Validation Engine

```js
// src/core/hui.contracts.js
validate(actionName, rawPayload)
```

**Was validate tut:**
1. `null`/`undefined` → normalisiert zu `{}`
2. Nicht-Object → abgebrochen, geloggt
3. Required-Felder fehlen → abgebrochen, DEV-Warning
4. RequiredOr-Gruppen leer → abgebrochen, DEV-Warning
5. `source` fehlt → DEV-Hinweis (kein Abort)
6. Gibt immer einen neuen Objekt-Klon zurück (kein Mutation-Risiko)
7. Setzt `source: "system"` als Fallback wenn nicht übergeben

---

## DEV-Tools

Im Browser-DevTools:
```js
window.__HUI_CONTRACTS()   // Alle Contracts anzeigen
```

Sentry-Tags für Action-Failures:
- `[HUI_CONTRACT] A.OPEN_PROFILE: requiredOr [creator, creatorId] fehlt`
- `[HUI_CONTRACT] A.BOOK_EXPERIENCE: Pflichtfeld "experience" fehlt`

---

## Wichtige Regel

**NICHT:**
```js
const { source } = payload || {}    // versteckt null-Payload-Bug
payload?.source                     // überall verstreut
```

**SONDERN:**
```js
const p = validate("OPEN_PROFILE", rawPayload);
if (!p) return;
const { source, creator } = p;
```
