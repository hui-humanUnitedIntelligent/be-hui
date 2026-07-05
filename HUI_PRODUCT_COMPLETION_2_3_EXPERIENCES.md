# HUI Product Completion 2.3 — Experiences (Erlebnisse)

Phase 2.3 macht den bestehenden Erlebnisbereich produktionsreif: eine kanonische Detailseite, einheitliche Navigation und ein durchgängiger Commerce-2.0-Buchungsfluss — ohne neue Geschäftsmodelle und ohne Mock-Daten.

---

## Erlebnisfluss (End-to-End)

```
Entdecken / Feed / Favoriten / Profil / Studio
        ↓
   /experience/:id   (ExperienceDetailPage)
        ↓
   „Jetzt buchen“ → WerkeKorb (Commerce 2.0)
        ↓
   UnterstützenFlow → Stripe Checkout
        ↓
   Bestätigung („Danke.“)
        ↓
   Meine Resonanz (/studio/resonanz)
```

**Creator-Pfad (Bearbeitung):**

```
HUI Studio → Werke & Inhalte  OR  Mein Profil → Erlebnis-Karte
        ↓
   /experience/:id  (Owner sieht „Bearbeiten“)
        ↓
   ExperienceWizard (ein Editor, keine Parallel-Verwaltung)
```

---

## Navigation — Einstiegspunkte

| Bereich | Komponente / Datei | Ziel |
|---------|-------------------|------|
| **Feed** | `ExperienceContent.jsx` → Karte / „Teilnehmen“ | `/experience/:id` |
| **Feed** | `FeedRouter.jsx` `onDetail` | `/experience/:id` |
| **Entdecken** | `DiscoverPage.jsx` Karten + Listenansicht | `/experience/:id` |
| **Favoriten** | `FavoritesPage.jsx` `OPEN_EXPERIENCE` | `/experience/:id` |
| **Profil (Visitor)** | `ExperiencesSection.jsx` | `/experience/:id` |
| **Profil (Talent)** | `TalentProfilePage.jsx` | `/experience/:id` |
| **Profil (Owner)** | `MyBasisProfile.jsx` Erlebnis-Karten | `/experience/:id` |
| **Wirker-Profil** | `wirker-profile/index.jsx` | `/experience/:id` |
| **Studio** | `StudioSubPages.jsx` MeineInhalte | `/experience/:id` |
| **Studio** | `HuiStudio.jsx` gespeicherte Erlebnisse | `/experience/:id` |
| **Resonanz** | `MeineResonanz.jsx` Tap auf Erlebnis | `/experience/:id` |
| **Action Engine** | `OPEN_EXPERIENCE`, `BOOK_EXPERIENCE` | `/experience/:id` |

**Legacy entfernt / ersetzt:**
- `ExperienceBookingFlow` wird nicht mehr aus Home/Discover geöffnet
- `SEED_ERLEBNISSE` Mock-Fallback in Discover entfernt → Empty State
- Keine Profil-Only-Navigation mehr als Ersatz für Detailseiten

---

## Offizielle Detailseite

**Route:** `/experience/:id`  
**Komponente:** `src/components/ExperienceDetailPage.jsx`  
**Utilities:** `src/lib/experienceDetailUtils.js`

### Angezeigte Daten (nur DB, keine Mocks)

| Feld | Quelle |
|------|--------|
| Titel | `experiences.title` |
| Beschreibung | `description` / `caption` |
| Bilder | `cover_url`, `media_url`, `images` (JSONB) |
| Veranstalter | `profiles` via `user_id` |
| Ort | `location_text`, `format` |
| Datum | `date`, `time_start`, `time_end`, `duration` |
| Preis | `price`, `pricing_type`, `price_per`, `currency` |
| Teilnehmer | `participant_limit` |
| Buchung | Commerce 2.0 CTA |

### Empty States (keine Platzhalter)

- Keine Bilder → „Noch keine Bilder“
- Kein Datum → „Termin folgt“
- Keine Beschreibung → „Noch keine Beschreibung“
- Keine Plätze → „Offen für alle“
- Discover ohne DB-Einträge → Sektions-Empty-State

---

## Commerce-Anbindung

1. **Detailseite** → `buildExperienceCartItem()` → `navigate('/Home', { state: { pendingExperienceCart } })`
2. **Home.jsx** → Cart befüllen → `WerkeKorb` öffnen
3. **WerkeKorb** → `UnterstutzenFlow` → Stripe
4. **Danke-Screen** → „Zum Resonanz Center“ → `/studio/resonanz` (`MeineResonanz`)

---

## Geänderte Dateien

### Neu
- `src/components/ExperienceDetailPage.jsx`
- `src/lib/experienceDetailUtils.js`
- `HUI_PRODUCT_COMPLETION_2_3_EXPERIENCES.md`

### Routing & Kern
- `src/App.jsx` — Route `/experience/:id`, `ExperienceDetailRouteWrapper`
- `src/routes/registry.js` — Registry-Eintrag `experience-detail`
- `src/core/hui.actions.js` — `OPEN_EXPERIENCE` / `BOOK_EXPERIENCE` → Detailseite
- `src/components/home/HomeShell.jsx` — `navigate` im Context
- `src/pages/Home.jsx` — `pendingExperienceCart`, Legacy-Booking entfernt

### Karten & Listen
- `src/feed/cards/ExperienceContent.jsx`
- `src/feed/cards/FeedRouter.jsx`
- `src/pages/DiscoverPage.jsx`
- `src/pages/FavoritesPage.jsx`
- `src/components/profile/sections/ExperiencesSection.jsx`
- `src/pages/wirker-profile/index.jsx`
- `src/pages/TalentProfilePage.jsx`
- `src/pages/MyBasisProfile.jsx`

### Studio
- `src/pages/studio/StudioSubPages.jsx`
- `src/components/studio/HuiStudio.jsx`
- `src/pages/CreatorStudio.jsx` — `MeineResonanz` unter `/studio/resonanz`

---

## Bekannte Restarbeiten (Phase 2.4 Empfehlung)

1. **ExperienceFlow vs. ExperienceWizard** — Zwei Erstellungs-UIs existieren noch; Detailseite nutzt `ExperienceWizard` für Owner-Edit. Phase 2.4: einen kanonischen Editor festlegen.
2. **`ExperienceBookingFlow.jsx`** — Datei noch im Repo (Legacy), aber nicht mehr angebunden. Kann nach Verifikation gelöscht werden.
3. **Buchungsbestätigung in DB** — Commerce 2.0 legt Orders an; dedizierte `experience_bookings`-Synchronisation nach Stripe-Success noch prüfen.
4. **FeedEventsSection** — Event-Pins öffnen noch Creator-Profil statt Erlebnis-Detail (wenn Event = Experience verknüpft).
5. **LiveMapPage** — Hardcoded Pins; nicht Teil dieser Phase.
6. **Teilnehmer-Auslastung** — Live „X von Y Plätzen belegt“ benötigt Booking-Count-Query (nicht in Scope 2.3).

---

## Definition of Done — Status

| Kriterium | Status |
|-----------|--------|
| Offizielle Erlebnis-Detailseite | ✅ `/experience/:id` |
| Alle Karten führen dorthin | ✅ |
| Keine Sackgassen (Listen, Profil, Studio) | ✅ |
| Commerce vollständig verbunden | ✅ WerkeKorb → UnterstützenFlow |
| Creator kann eigene Erlebnisse verwalten | ✅ Detail + Bearbeiten |
| Keine Mock-Daten (Erlebnisse) | ✅ SEED entfernt |
| Build erfolgreich | ✅ `npm run build` |
| Keine neuen ESLint-Fehler (geänderte Dateien) | ✅ |
| Dokumentation vollständig | ✅ |

---

## Phase 2.4 — Empfehlung

**Fokus: Buchungsrealität & Creator-Operations**

- Live-Teilnehmerzähler auf Detailseite (`experience_bookings` / Orders)
- Einheitlicher Create-Flow (`ExperienceFlow` **oder** `ExperienceWizard`)
- Post-Purchase: automatischer Eintrag in Meine Resonanz mit Deep-Link
- Push/In-App-Benachrichtigung für Creator bei neuer Buchung
- Event-Feed-Pins → `/experience/:id` wenn `experience_id` vorhanden
