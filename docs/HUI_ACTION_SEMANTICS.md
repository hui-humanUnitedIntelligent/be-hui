# HUI Action Semantics
**Version:** Phase 2C | **Datum:** 2026-05-24

---

## Warum Semantik?

Ein Button kann technisch funktionieren und sich trotzdem **falsch anfühlen**.

Das passiert wenn:
- ein Modal öffnet ohne Kontext
- der User nicht weiß ob etwas passiert ist
- der Rückweg fehlt
- die Aktion nicht das tut was man erwartet

HUI löst das durch eine **Semantik-Schicht**: Jede Action hat eine definierte Bedeutung, einen erwarteten Ablauf und einen emotionalen Abschluss.

---

## Die Semantik-Tools

```js
import {
  normalizeRecipient,    // Rohe Profile → sicheres Chat-Recipient
  normalizeCreator,      // Rohe Profile → vollständiges Creator-Objekt
  normalizeExperience,   // Rohe Erlebnisse → vollständiges Buchungs-Objekt
  buildChatPayload,      // Kompletten OPEN_CHAT Payload bauen
  buildBookPayload,      // Kompletten BOOK_EXPERIENCE Payload bauen
  buildProfilePayload,   // Kompletten OPEN_PROFILE Payload bauen
  checkSemantics,        // DEV: Semantische Lücken finden
  INTENT,                // Was will der User wirklich?
} from "../core/hui.semantics.js";
```

---

## Action Semantics Map

### A.OPEN_PROFILE

**User Intent:** Einen Menschen kennenlernen — nicht "ein Profil aufrufen"

**Erwartung:**
- Der Creator erscheint mit echtem Namen, Bild und Kontext
- Der Übergang ist weich und einladend (nicht abrupt)
- Der Tab der vorherigen Surface bleibt erhalten
- Ein Rückweg ist jederzeit klar

**Richtiger Payload:**
```js
actions[A.OPEN_PROFILE]({
  creator:   normalizeCreator(rawProfile),  // vollständiges Objekt
  creatorId: id,                            // eindeutige ID
  source:    S.DISCOVER,                    // woher — für Return
});
```

**Oder kurz:**
```js
actions[A.OPEN_PROFILE](buildProfilePayload(rawProfile, S.DISCOVER));
```

**Fehlerfall:** `creator` und `creatorId` fehlen → abgebrochen (Contract)
**Fallback:** Kein Crash — Action wird still ignoriert
**Emotionaler Abschluss:** Profil gleitet sanft herein (220ms cubic-bezier)
**Return:** `S.DISCOVER` → zurück zur vorherigen Tab-Position

**Semantische Lücken die zu vermeiden sind:**
- `source` fehlt → LOOP 1 Return unmöglich
- `creator.id` fehlt → Profil kann nicht eindeutig geladen werden
- Rohes Supabase-Objekt ohne Normalisierung → `display_name` könnte undefined sein

---

### A.OPEN_CHAT

**User Intent:** Mit einem Menschen sprechen — nicht "Chat öffnen"

**Erwartung:**
- Chat öffnet sich **mit dem richtigen Menschen** (Name + Bild sichtbar)
- Wenn vom Profil aus geöffnet: Profil bleibt im Hintergrund (LOOP 1)
- Nach Chat-Close: Rückkehr zum Profil — nicht zu einem leeren Screen
- Der User weiß sofort mit wem er spricht

**Richtiger Payload:**
```js
actions[A.OPEN_CHAT]({
  recipient: normalizeRecipient(rawProfile),
  source:    S.VISITOR_PROFILE,   // LOOP 1 — Return zum Profil
});
```

**Oder kurz:**
```js
actions[A.OPEN_CHAT](buildChatPayload(rawProfile, S.VISITOR_PROFILE));
```

**LOOP 1 Ablauf:**
```
Discover → OPEN_PROFILE(source: S.DISCOVER)
  → WirkerProfilePage
    → OPEN_CHAT(source: S.VISITOR_PROFILE)  ← source setzt Return-Context
      → ChatCenterOverlay
        → onClose → flow.getReturnProfile() → Profil wieder sichtbar
```

**Fehlerfall:** `recipient` fehlt → Chat öffnet sich ohne Kontext (technisch ok, semantisch schlecht)
**Semantic Guard (DEV):** `[HUI_SEMANTIC] OPEN_CHAT: recipient.id fehlt`
**Emotionaler Abschluss:** `ECHO.SLIDE_BACK` — Chat gleitet sanft zurück

**Semantische Lücken die zu vermeiden sind:**
- `source` fehlt → LOOP 1 Return nicht möglich
- `recipient.display_name` ist "Creator" → echter Name fehlt
- `recipient` ist null → Chat ohne Empfänger

---

### A.BOOK_EXPERIENCE

**User Intent:** Einen Raum/Zeit beim Creator reservieren — ein echtes Commitment eingehen

**Erwartung:**
- Das Connect-Sheet öffnet sich mit klarem Kontext: **wer** und **was** gebucht wird
- Der Creator-Name und das Erlebnis sind im Sheet sichtbar
- Der Übergang fühlt sich zeremoniell an — nicht wie ein Popup
- Nach Abschluss: ruhige Bestätigung ("Raum reserviert")
- Rückweg zum Profil ist klar

**Richtiger Payload:**
```js
actions[A.BOOK_EXPERIENCE]({
  experience: normalizeExperience(rawExp),
  creator:    normalizeCreator(rawCreator),
  source:     S.VISITOR_PROFILE,
});
```

**Oder kurz:**
```js
actions[A.BOOK_EXPERIENCE](buildBookPayload(rawExp, rawCreator, S.VISITOR_PROFILE));
```

**Was intern passiert:**
1. `normalizeExperience()` → sicheres Erlebnis-Objekt
2. `normalizeCreator()` → sicheres Creator-Objekt als Chat-Recipient
3. `setChatRecipient(safeCr)` → Connect-Sheet kennt den Empfänger
4. `setShowConnect(true)` → Sheet öffnet sich
5. `flowSignal.emit(ECHO.CONFIRM)` → *(TODO: ruhige Bestätigung nach Buchung)*

**Fehlerfall:** `experience` fehlt → Contract-Fehler, Action abgebrochen
**Semantic Guard (DEV):** `[HUI_SEMANTIC] BOOK_EXPERIENCE: creator.id fehlt`
**Emotionaler Abschluss:** `ECHO.CONFIRM` — "Raum reserviert" (TODO: UI-Komponente)
**Return:** Zurück zum Profil des Creators

**Semantische Lücken die zu vermeiden sind:**
- `creator` fehlt → Connect-Sheet hat keinen Empfänger
- `experience.name` fehlt → Sheet zeigt leeren Titel
- Rohe Supabase-Objekte → undefined-Felder in der UI

---

### A.FOLLOW_CREATOR

**User Intent:** Eine Verbindung bewusst aufrechterhalten — nicht "folgen" im Social-Media-Sinne

**Erwartung:**
- Kurze, ruhige Bestätigung dass die Verbindung gespeichert ist
- Kein Toast. Kein lauter Erfolg-Banner.
- Der Creator-Avatar "reagiert" kurz (ECHO.WARMTH)
- Der Follow-Button zeigt sofort den neuen Zustand

**Richtiger Payload:**
```js
actions[A.FOLLOW_CREATOR]({
  creatorId: creator.id,
  following:  true,         // oder false — für Toggle
  source:     S.VISITOR_PROFILE,
});
```

**Was intern passiert:**
1. `validate()` → `creatorId` Pflichtfeld geprüft
2. `checkSemantics()` → DEV-Warnung wenn etwas fehlt
3. `flowSignal.emit(ECHO.WARMTH)` → UI kann sanft reagieren
4. Echter Supabase-Write: von der aufrufenden Komponente (nicht hier)

**ECHO.WARMTH lauschen:**
```js
flowSignal.on("echo", ({ type, data }) => {
  if (type === ECHO.WARMTH) {
    // Avatar kurz aufleuchten — nicht springen, nicht feiern
    setWarmth(true);
    setTimeout(() => setWarmth(false), 800);
  }
});
```

**Fehlerfall:** `creatorId` fehlt → Contract-Fehler, Action abgebrochen
**Emotionaler Abschluss:** `ECHO.WARMTH` — sanfte Wärme, 800ms

---

### A.SEND_RESONANCE

**User Intent:** Etwas bestätigen, unterstützen, wertschätzen — nicht "liken"

**Erwartung:**
- Ein kurzes, sanftes visuelles Signal
- Kein Zähler-Sprung. Kein Herz-Animation-Spam.
- Der User fühlt dass er etwas **gegeben** hat — nicht geklickt

**Richtiger Payload:**
```js
actions[A.SEND_RESONANCE]({
  targetId: moment.id,
  type:     "moment",   // "profile" | "moment" | "experience"
  source:   S.HOME,
});
```

**Was intern passiert:**
1. `validate()` → `targetId` und `type` Pflichtfelder
2. `checkSemantics()` → DEV-Warnung
3. `flowSignal.emit(ECHO.SOFT_GLOW)` → UI reagiert ruhig
4. Echter Supabase-Write: von der aufrufenden Komponente

**Fehlerfall:** `targetId` oder `type` fehlt → abgebrochen
**Emotionaler Abschluss:** `ECHO.SOFT_GLOW` — sanfter Glow, 800ms

---

### A.OPEN_EXPERIENCE

**User Intent:** Ein Erlebnis erkunden — nicht "eine Seite öffnen"

**Erwartung:**
- Das Erlebnis erscheint im Kontext seines Creators
- Der Tab-Scrollzustand von Discover bleibt erhalten
- Der Rückweg ist klar

**Richtiger Payload:**
```js
actions[A.OPEN_EXPERIENCE]({
  experience: normalizeExperience(rawExp),
  source:     S.DISCOVER,
});
```

**Was intern passiert:**
1. Wenn `creator_id` bekannt → `OPEN_PROFILE` mit `_highlightExp`
2. Wenn kein Creator-Context → `OPEN_CONNECT` mit `intent: "experience"`
3. `source` wird an `OPEN_PROFILE` durchgereicht → Return-Context erhalten

**Fehlerfall:** Weder `experience` noch `creatorId` → abgebrochen
**Return:** Zurück zu Discover (Scroll-Position erhalten)

---

### A.OPEN_ROOM

**User Intent:** Den Kreativ-Raum eines Creators betreten

**Erwartung:**
- Profil öffnet sich direkt im "Raum"-Tab
- Gefühl von "Eintreten" — nicht von Tab-Wechsel
- Rückweg zurück zum Profil

**Aktuell:** Öffnet Profil mit `_tab: "raum"` — funktioniert, aber kein eigener Raum-Layer
**TODO (Phase 3):** Dedizierter Room-Overlay mit eigenem Z-Index und Atmosphäre

**Richtiger Payload:**
```js
actions[A.OPEN_ROOM]({
  creatorId: creator.id,
  source:    S.VISITOR_PROFILE,
});
```

---

### A.SHARE_MOMENT

**User Intent:** Etwas weitergeben — nicht "teilen" wie auf Social Media

**Erwartung:**
- Native Share-Sheet auf Mobilgeräten
- Fallback: Story-Composer (kein generischer Link)
- Kurze Bestätigung dass geteilt wurde

**Richtiger Payload:**
```js
actions[A.SHARE_MOMENT]({
  url:    "https://hui.earth/creator/mia",
  title:  "Mia Kern — Klangkünstlerin",
  text:   "Ich habe eine beeindruckende Klangkünstlerin auf HUI entdeckt.",
  source: S.VISITOR_PROFILE,
});
```

**Fehlerfall:** Kein Native Share → Story-Composer als Fallback
**Emotionaler Abschluss:** `ECHO.PULSE` — kurzer Puls, 800ms

---

### A.OPEN_COMMUNITY / A.GO_HOME / A.GO_DISCOVER

**User Intent:** Zurückkehren oder sich orientieren

Diese Navigations-Actions haben keine Payload-Anforderungen.
Sie sollen **ruhig und ohne Überraschung** funktionieren.

**Erwartung:**
- Kein Reset der Scroll-Position
- Kein Neuladung des Feeds
- Der Tab wechselt weich

---

## Semantic Payload Best Practices

### NICHT (technisch, aber semantisch leer):
```js
actions[A.OPEN_CHAT]({ id: "abc", full_name: "Mia" });
```

### SONDERN (semantisch vollständig):
```js
actions[A.OPEN_CHAT]({
  recipient: normalizeRecipient(mia),
  source:    S.VISITOR_PROFILE,
});
```

---

### NICHT (rohe Supabase-Daten):
```js
actions[A.BOOK_EXPERIENCE]({ experience: supabaseRow, creator: supabaseProfile });
```

### SONDERN (normalisiert):
```js
actions[A.BOOK_EXPERIENCE](buildBookPayload(supabaseRow, supabaseProfile, S.VISITOR_PROFILE));
```

---

## Semantic Guard im DEV-Modus

```
[HUI_SEMANTIC] OPEN_CHAT: 2 semantische Lücke(n):
  recipient.id fehlt — Chat kann Empfänger nicht identifizieren |
  source fehlt — LOOP 1 Return nicht möglich
```

DEV-Logs erscheinen automatisch wenn `checkSemantics()` in den Actions aufgerufen wird.
Kein Code nötig — nur vollständige Payloads übergeben.

---

## INTENT — Was der User wirklich will

```js
import { INTENT } from "../core/hui.semantics.js";

INTENT.CONNECT    // Mit jemandem in Kontakt kommen
INTENT.MESSAGE    // Eine Nachricht senden
INTENT.BOOK       // Einen Raum/Zeit reservieren
INTENT.FOLLOW     // Verbindung aufrechterhalten
INTENT.DISCOVER   // Jemanden kennenlernen
INTENT.EXPLORE    // Ein Erlebnis erkunden
INTENT.RESONATE   // Etwas unterstützen
INTENT.SHARE      // Weitergeben, empfehlen
INTENT.IMPACT     // Wirkung erzeugen
INTENT.RETURN     // Zurückkehren
```

Intent ist kein technisches Feld — es ist die Beschreibung des Nutzer-Willens.
Actions können damit ihre internen Strategien ausrichten.

---

## Architektur-Übersicht

```
hui.semantics.js  ← normalizeRecipient, normalizeCreator, normalizeExperience
                     buildChatPayload, buildBookPayload, buildProfilePayload
                     checkSemantics, INTENT
  ↑
hui.actions.js    ← nutzt Normalisierung intern + checkSemantics(DEV)
  ↑
Komponenten       ← können buildXPayload() für vollständige Payloads nutzen
```

---

## Phase 2C Status

| Action | Validate | Semantic | Normalize | Echo |
|---|---|---|---|---|
| OPEN_PROFILE | ✅ | ✅ | ✅ | — |
| OPEN_CHAT | ✅ | ✅ | ✅ normalizeRecipient | SLIDE_BACK |
| BOOK_EXPERIENCE | ✅ | ✅ | ✅ normalize{Creator,Experience} | CONFIRM |
| FOLLOW_CREATOR | ✅ | ✅ | — | WARMTH |
| SEND_RESONANCE | ✅ | ✅ | — | SOFT_GLOW |
| OPEN_EXPERIENCE | ✅ | ✅ | normalizeExperience | — |
| SHARE_MOMENT | ✅ | — | — | PULSE |
| SEND_MESSAGE | ✅ | — | normalizeRecipient | — |
| OPEN_ROOM | — | — | — | — (Phase 3) |
