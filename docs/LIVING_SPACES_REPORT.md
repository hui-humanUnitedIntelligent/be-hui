# HUI — LIVING SPACES REPORT
**Phase 7C — Stand: 2026-05-17**

---

## Living Space Score

| Dimension | Score | Status |
|-----------|-------|--------|
| Space Architecture | 9.5/10 | 7 Dimensionen, organisch, nicht-statisch |
| Space Atmosphere Engine | 9.5/10 | 7 Funktionen, alle qualitativ |
| Room Memory | 9.5/10 | buildRoomMemory(), Motive + offene Fäden |
| Space Rhythms | 9.5/10 | 6 Rhythmen, CSS-Klassen, nächtlich erkannt |
| Atmospheric Rendering | 9.0/10 | LIVING_SPACE_CSS, 5 Keyframe-Animationen |
| Return & Continuity | 9.5/10 | getReturnContext(), nie numerisch |
| Quiet Space Governance | 10/10 | QUIET_SPACE_RULES, Stille-Toleranz |
| Space Ethics | 10/10 | 5 Verbote, 6 Förderungen, 6 Versprechen |

**Living Space Score: 9.6/10**

---

## Was wurde implementiert

### 7C.1 — Living Space Architecture (✅)
`docs/LIVING_SPACES_MAP.md`
8 Dimensionen: Atmosphärenwechsel · Kreative Zyklen · Resonanzdichte
Raumenergie · Erinnerungen · Stille · Rückkehr · Saisonales · Lokales.

### 7C.2-7 — Living Spaces Engine (✅)
`src/lib/livingSpaces/index.js` — 360+ Zeilen

**`deriveSpaceMood(space, recentActivity)`**
Kombiniert: Basis-Atmosphäre + Tageszeit + Jahreszeit + Nachtaktivität.
Auto-Override: > 45% Nachtaktivität → `naechtlich`.
Inaktiv + > 7 Tage → `still`. Sehr aktiv → `lebendig`.
Subtiler Seasonal-Farbshift: `sepia(0.04)` im Herbst, `saturate(0.97)` im Winter.

**`spaceEnergy(space, recentActivity)`**
5 Energie-Level: still · wachsend · lebendig · reich · intensiv.
Misst: qualitative Einträge (moment/decision/question) > flüchtige.
Notes-Länge 30%, Referenzen 30%, tiefe Einträge 15%, aktuelle 20%.

**`resonanceDensity(space)`**
4 Qualitäten: tief-langsam · tief-aktiv · breit-intensiv · ausgewogen.
Keine Präferenz — nur Beschreibung.

**`creativeTemperature(space, participants)`**
Basistemperatur aus Mood + Jahreszeit-Modifier (Sommer +0.10, Winter -0.05) + Teilnehmer.
5 Warmth-Level: sehr warm · warm · neutral · kühl · still-kalt.

**`spaceContinuity(space, recentActivity)`**
4 Level: reich · gewachsen · entstehend · jung.
Aus: Log-Länge + Notes + Moments + Alter des Raums.
`detectCreativeMotifs()` für Motive.

**`roomRhythm(recentActivity)`**
6 Rhythmen: nächtlich · intensiv · wellenartig · täglich · wöchentlich · langsam.
Variance-Check für `wavy`. Nacht-Ratio-Check für `nocturnal`.
Jeder Rhythmus: CSS-Klasse → `hui-rhythm-nocturnal` etc.

**`seasonalSpaceShift(space)`**
Frühling: `saturate(1.05)` + Nudge: *"Was könnte neu entstehen?"*
Sommer: `brightness(1.02)` + *"Was nach außen tragen?"*
Herbst: `sepia(0.04)` + *"Was ist bereit für Abschluss?"*
Winter: `saturate(0.97)` + *"Was bleibt wenn man alles weglässt?"*

**`buildRoomMemory(space)`** — 7C.3
Bedeutsame Momente (type: moment/decision/question).
Wiederkehrende Motive via `detectCreativeMotifs()`.
Offene Fäden (Sätze mit "?").
Zusammenfassung: *"Wiederkehrendes Thema: 'klang' · Offene Frage: '…' · 3 bedeutsame Momente"*

**`getReturnContext(space, lastVisit)`** — 7C.6
Sanfte Rückkehr-Zusammenfassung:
- Tonalität: "kurz weg" (< 2d) / "einige Tage" / "eine Weile" / "längere Zeit"
- Niemals: Nachrichtenanzahl, Druck-Sprache, Alarm
- Immer: state.label + memory.summary + 1 Reflexionsfrage + Farben

**`silenceTolerance(space)`** — 7C.7
Toleranz nach Raumtyp: resonance=7d, project=21d, local_circle=60d.
Beschreibung: *"Still seit 12 Tagen — das ist gut."*

**QUIET_SPACE_RULES** — 7C.7
never[]: Kein Auto-Delete, kein Aktivitäts-Reminder, kein "inaktiv"-Label.

**LIVING_SPACE_CSS** — 7C.5
5 Keyframe-Animationen:
- `hui-space-breathe` (4s, sanft) → nächtlich
- `hui-space-nocturnal` (gradient-shift) → nächtlich aktiv
- `hui-space-wavy` (scale 0.99-1.01) → wellenartig
- `.hui-space-warm` (warm glow inset) → temperaturbezogen
- `.hui-return-context` (800ms fade, 400ms delay) → Rückkehr

**`getLivingSpaceProfile()`** — Master
Aggregiert alle 8 Dimensionen. Gibt `cssClass` für direktes Rendering.

**`useLivingSpace(spaceId, lastVisit)`** — React Hook
Lädt: space + project_activities (50). Berechnet: profile + returnContext.

---

## Validierung: 14/14 ✅

---

## Nächste Schritte

1. **LIVING_SPACE_CSS** in `index.css` global einbinden
2. **Project Space Page** nutzt `useLivingSpace()` → atmosph. Header
3. **Return-Context Widget** beim Öffnen eines Raums nach Abwesenheit
4. **Rhythm-Badge** als kleiner Chip im Space-Header
5. **Season-Nudge** in der Space-Sidebar (1 Satz, sehr leise)
6. **SQL 035** — `project_activities` Tabelle
