# HUI Living Product — Phase 2.1 (Authentizität vor Perfektion)

**Datum:** 2026-07-01  
**Status:** Abgeschlossen  
**Grundsatz:** *Echtheit schafft Vertrauen.* (HUI Constitution)

---

## Ziel dieser Phase

Phase 2.1 entfernt künstliche Demo-Inhalte und ersetzt sie durch echte Daten oder ehrliche Empty States. Keine neuen Features, kein Design-Redesign, keine Architekturänderungen.

---

## Entfernte Demo-Inhalte

### Mein HUI (`src/pages/MeinHUI.jsx`)

| Entfernt | Details |
|----------|---------|
| Fake Wirkungszahlen | „seit 134 Tagen“, „23 Impulse“, „47 Menschen“ |
| Fake Reise-Timeline | „Du hast 3 neue Verbindungen gestärkt“ u. a. |
| Fake Impact-Momente | Jana, Max, „8 Menschen erreicht“ |
| Immer sichtbarer Notification-Dot | Unread-Indikator nur bei echten ungelesenen Notifications |
| Behauptende Grundpfeiler-Texte | „Du baust Brücken…“ → einladende, nicht-personalisierende Texte |

### Home / Discover (`src/pages/DiscoverPage.jsx`)

| Entfernt | Details |
|----------|---------|
| `LIVE_ACTIVITIES` | Sarah, Jonas, Anna, Max — komplette Fake-Live-Bar |
| `SEED_PEOPLE` | 6 Fake-Personas (Mia Waldmann, Jonas Kreuz, …) |
| `SEED_MOMENTE` | 6 Fake-Momente mit Unsplash-Bildern |
| `SEED_WERKE` | 6 Fake-Werke |
| `SEED_ERLEBNISSE` | 6 Fake-Erlebnisse |
| `SEED_PROJEKTE` | Fake-Impact-Projekte |
| `SEED_ORTE` | Fake-Orte mit Distanzangaben |
| Hardcoded Stats | `begegnungen: 8`, `projekte: 3`, Fallback `24/5/12` |
| Fake Engagement-Zahlen | Generierte Likes/Comments/Views aus ID-Hash |
| „Deine Aktivität diese Woche“ | Karte ohne echte Datenbasis |

### Dein Raum / Favorites (`src/pages/FavoritesPage.jsx`)

| Entfernt | Details |
|----------|---------|
| `MOCK_HERO` | Keramik Workshop Hero |
| `MOCK_PEOPLE` | Leon, Mia, Jonas, Hanna |
| `MOCK_WORKS` | 5 Fake-Werke |
| `MOCK_EXPERIENCES` | 4 Fake-Erlebnisse |
| Default Impact-Werte | `impactEur: 2.25`, `projectCount: 3` |

### Profil (`src/pages/wirker-profile/index.jsx`)

| Entfernt | Details |
|----------|---------|
| `SEED_COMMUNITY` | Mara, Jonas, Lea, Timo, Anna — Fake-Resonanz-Community |

### Notifications (`src/components/NotificationCenter.jsx`)

| Entfernt | Details |
|----------|---------|
| `MOCK_NOTIFS` | 7 Fake-Benachrichtigungen |
| `MOCK_CHAT` / `MOCK_MESSAGES` | Mia-Kern-Chat mit 5 Fake-Nachrichten |
| Default `weeklyEur: 8950` | Hero-Impact-Karte nur bei echten Zahlungen |

---

## Ersetzte Empty States

| Bereich | Empty-State-Text (Kern) |
|---------|-------------------------|
| **Mein HUI — Reise** | „Deine Reise beginnt“ — einladend, ohne Traurigkeit |
| **Mein HUI — Impact-Momente** | „Noch keine Momente“ — ehrlich, motivierend |
| **Discover — Menschen** | „Noch keine Menschen sichtbar“ |
| **Discover — Momente** | „Noch keine Momente“ |
| **Discover — Werke** | „Noch keine Werke“ |
| **Discover — Erlebnisse** | „Noch keine Erlebnisse“ |
| **Discover — Projekte** | „Noch keine Projekte“ |
| **Discover — Orte** | „Orte kommen bald“ |
| **Discover — Heute-Stats** | Section ausgeblendet wenn alle Werte 0 |
| **Discover — Live-Bar** | Ausgeblendet ohne echte Aktivitätsdaten |
| **Dein Raum** | „Dein Raum wartet.“ mit Entdecken-CTA |
| **Profil — Resonanz** | „Noch keine Resonanz sichtbar“ |
| **Notifications — Chat** | „Noch keine Nachrichten“ |
| **Resonanz (Studio)** | Bereits vorhanden — unverändert (Journal-Ton) |

Alle Empty States folgen dem HUI-Prinzip: ehrlich, ruhig, hoffnungsvoll, einladend — nicht technisch, nicht fehlerhaft.

---

## Bereiche mit echten Daten

| Bereich | Datenquelle |
|---------|-------------|
| **Mein HUI — Stats-Karten** | `profile.member_since`, `profile.impact_eur`, `profile.followers_count` (nur wenn > 0) |
| **Mein HUI — Impact-Momente** | `notifications`, `works`, `beitraege` des Users |
| **Mein HUI — Notification-Dot** | `notifications` where `read = false` |
| **Discover — Menschen** | `profiles` (Talente/Mitglieder) |
| **Discover — Momente** | `beitraege` |
| **Discover — Werke** | `works` (published/approved) |
| **Discover — Erlebnisse** | `experiences` (published/approved) |
| **Discover — Projekte** | `impact_applications` (status=approved) |
| **Discover — Stats** | Live-Counts aus `beitraege`, `works`, `experiences`, `connections`, `impact_applications` |
| **Dein Raum — Erlebnisse** | `experiences` (partial hydrate) |
| **Dein Raum — Impact** | `payments.impact_eur` |
| **Resonanz (Studio)** | `orders`, `payments`, `bookings`, `impact_votes`, `impact_applications` |
| **Feed (Entdecken-Tab)** | `useFeedStream` — bereits real, unverändert |
| **Impact-Seite** | `impact_applications` — bereits real, unverändert |

---

## Verbleibende technische Schulden

| Priorität | Thema | Details |
|-----------|-------|---------|
| **Hoch** | Live-Aktivitäts-Feed | `liveActivities` State vorbereitet, aber noch keine DB-Query — Bar bleibt leer |
| **Hoch** | Orte-Feature | Keine `places`-Tabelle angebunden — Empty State bis Backend existiert |
| **Mittel** | Favorites-Persistenz | People/Works/Hero noch nicht aus Favorites-DB geladen |
| **Mittel** | Resonanz-Community | `community={null}` — echte Community-Query fehlt |
| **Mittel** | Mein HUI — Reise-Aggregation | Journey-Section leer bis Zeitraum-Aggregation (Woche/Monat) implementiert |
| **Mittel** | Chat in Notifications | `activeNotif.chat/messages` — echte Chat-Integration ausstehend |
| **Niedrig** | Momente-Autoren | DB-Mapping zeigt noch „HUI Mitglied“ statt Profilname |
| **Niedrig** | Werk-Autoren | DB-Mapping zeigt noch „HUI Talent“ statt Creator-Name |
| **Niedrig** | Intelligence Mock-Factories | `src/lib/intelligence/*.js` — exportiert, aber nicht in UI verdrahtet |
| **Niedrig** | `ProfileHeaderDemo` | Demo-Komponente existiert noch, wird nicht gerendert |
| **Niedrig** | Impact-Wizard Placeholders | Ocean CleanUp Beispieltexte in Create-Flows (Formular-Hilfen) |

---

## Empfehlungen für Phase 2.2

1. **Live-Aktivitäts-Engine** — Echte `beitraege`/`works`/`experiences` der letzten Stunden als Live-Bar füttern (kein Polling-Theater).

2. **Favorites-Backend** — Gespeicherte Menschen, Werke und Erlebnisse persistent machen; Dein Raum wird dann organisch gefüllt.

3. **Resonanz-Community-Query** — Verbindungen/Buchungen/Followers eines Profils als echte „Menschen in Resonanz“.

4. **Mein HUI Journey-Aggregation** — Zeitraum-basierte Wirkungszusammenfassung aus `core_connections` und `core_impact_signals`.

5. **Autoren-Auflösung** — Profile-Joins für Momente und Werke, damit keine generischen Labels mehr erscheinen.

6. **Orte-Modul** — Wenn `places`/`spaces` Schema existiert, Discover-Orte-Section anbinden.

7. **Chat-Notification-Brücke** — Notification-Tap öffnet echten Chat-Thread statt leerem Panel.

---

## Definition of Done — Status

| Kriterium | Status |
|-----------|--------|
| Keine künstlichen Geschichten | ✅ |
| Keine Fake-Zahlen | ✅ |
| Keine Fake-Personen | ✅ |
| Keine unechten Aktivitäten | ✅ |
| Empty States hochwertig | ✅ |
| Keine Architekturänderungen | ✅ |
| Keine Designänderungen | ✅ |
| Build erfolgreich | ✅ |
| Keine neuen ESLint-Fehler | ✅ (geänderte Dateien lint-frei) |

---

## Bezug zur HUI Constitution

> **Regel 5:** Der Orb zeigt keine Leistung. Er zeigt gelebte Wirkung.  
> **Regel 7:** HUI behauptet nichts über den Nutzer, was nicht existiert.  
> **Regel 9:** Leere Zustände sind Einladungen, keine Fehler.

Phase 2.2 kann auf dieser ehrlichen Basis aufbauen — mit Vertrauen statt Vollständigkeit.
