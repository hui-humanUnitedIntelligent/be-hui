# HUI Release Engineering — Phase 1.3
## Informationsarchitektur & Resonance

**Release:** Phase 1.3  
**Datum:** 2026-07-01  
**Status:** Abgeschlossen (Dokumentation)  
**Scope:** Konsolidierung, Zuordnung, Vereinfachung — **keine neuen Features**

---

## 1. Ziel & Ergebnis

Bevor weitere Funktionen implementiert werden, definiert dieses Dokument die **eindeutige Informationsarchitektur** für HUI. Jede Funktion besitzt genau **einen offiziellen Platz**. Dubletten, widersprüchliche Navigation und Legacy-Einstiege sind dokumentiert und für nachfolgende Releases priorisiert.

### Definition of Done

| Kriterium | Status |
|-----------|--------|
| Jede Funktion besitzt genau einen offiziellen Platz | ✔ dokumentiert |
| Keine widersprüchliche Navigation mehr (Soll-Zustand definiert) | ✔ |
| Alle Dubletten dokumentiert | ✔ |
| Legacy eindeutig gekennzeichnet | ✔ |
| Build erfolgreich | ✔ (siehe Abschnitt 8) |
| Keine funktionalen Änderungen außerhalb notwendiger Navigation | ✔ (nur Dokumentation) |

---

## 2. Navigationsmodell (Ist-Zustand)

HUI nutzt ein **zweischichtiges Navigationsmodell**:

```
URL-Layer (React Router — src/App.jsx)
├── Auth:        /login, /auth/callback
├── Shell:       /Home  ← 95 % des täglichen Gebrauchs
├── Standalone:  /impact, /studio, /profile/:user, /work/:id
├── Intern:      /Admin, /dashboard, /diagnose
└── Referral:    /ref/:user, /:username

/Home Shell-Layer (HomeShell.jsx + Home.jsx)
├── Tabs:        feed | discover | impact | favorites (versteckt)
├── Bottom-Nav:  4 Tabs + Center-Orb
├── Header:      Suche | Mood | Resonanzzentrum | Chat
└── Overlays:    Profile, MeinHUI, Chat, Commerce-Flows, Karte, Match …
```

**Wichtig:** In-Shell-Zustand (Tabs, Overlays, Chat) ist **nicht URL-backed**. Tab-Wiederherstellung erfolgt über `sessionStorage` (`useSessionRestore`).

### Bottom-Navigation (`navConfig.js`)

| UI-Label | Interner Tab-Key | Rendert | Anmerkung |
|----------|------------------|---------|-----------|
| **Entdecken** | `feed` | `UnifiedFeed` | Community-Feed — **nicht** DiscoverPage |
| **Home** | `discover` | `DiscoverPage` | Strukturiertes Browse — **nicht** Feed |
| **Mein HUI** (Orb) | `orb` | `MeinHUI` Overlay | Kein echter Tab-Switch |
| **Impact** | `impact` | `ImpactPage` (in-tab) | Schließt Chat-Overlay nicht |
| **Profil** | `creator` | `MyBasisProfile` via `ProfileLauncher` | Overlay, kein URL-Wechsel |

**Namens-Inversion:** Produkt-Sprache „Entdecken" = technisch `feed`. Produkt-Sprache „Home" = technisch `discover`. Diese Inversion ist in `navConfig.js` dokumentiert, widerspricht aber der Ziel-Architektur (siehe Abschnitt 4).

### Header-Leiste (`HomeHeader.jsx`)

| Control | Öffnet | Offizieller Bereich (Soll) |
|---------|--------|---------------------------|
| `SearchCommandCenter` | Suche, Quick Actions, Create-Flows | **HOME** |
| `MoodOrbButton` | `MoodSheet` | **MEIN HUI** (Orientierung) |
| `NotificationButton` | `ResonanzzentrumPanel` | **MEINE RESONANCE** (Benachrichtigungen) |
| `MessageButton` | `ChatCenterOverlay` | **CHAT** |

---

## 3. Vollständige Funktionslandkarte

### 3.1 HOME — Inspiration, Feed, Stories, Entdecken

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Community-Feed | `src/feed/UnifiedFeed.jsx` | Bottom-Nav „Entdecken"; Default-Tab nach Login; `A.GO_HOME` | **HOME → Feed** |
| Feed-Begrüßung / „Heute auf HUI" | `FeedWelcomeHeader` in UnifiedFeed | Automatisch im Feed | **HOME → Inspiration** |
| Stories (Anzeige) | `StoryBar` / `StoryViewer` in Feed | Feed-Story-Leiste | **HOME → Stories** |
| Story erstellen | `StoryComposer` | `A.OPEN_STORY_COMPOSER`, `A.SHARE_MOMENT` Fallback | **HOME → Stories** (Create via MEIN HUI) |
| Feed-Events | `FeedEventsSection` | Im Feed | **HOME → Feed** |
| Feed-Karten (Werke, Momente, Profile) | `FeedRouter` + Card-Typen | Feed-Interaktion | **HOME → Feed** |
| Strukturiertes Entdecken | `src/pages/DiscoverPage.jsx` | Bottom-Nav „Home"; `A.GO_DISCOVER`; Feed-CTA | **HOME → Entdecken** |
| Live-Karte | `LiveMapPage` | Discover „Karte"; `A.OPEN_MAP`; Search | **HOME → Entdecken** |
| Match-Overlay | `HuiMatchOverlay` | Karte → Match; `A.OPEN_MATCH` | **HOME → Entdecken** |
| Globale Suche | `SearchCommandCenter` | Header-Suchfeld | **HOME** |
| Quick Actions (Erstellen) | `SearchCommandCenter` QUICK_ACTIONS | Suche-Overlay | **HOME** (Create-Auslöser → MEIN HUI) |
| Themen-Entdeckung | `SearchCommandCenter` THEMES | Suche-Overlay | **HOME → Entdecken** |
| Mood-Auswahl | `MoodSheet` | Header Mood-Orb | **MEIN HUI → Orientierung** |
| Versteckter Tab „Dein Raum" | `FavoritesPage` | Tab `favorites` (kein Nav-Link); `A.GO_FAVORITES` (ungenutzt) | **MEINE RESONANCE → Favoriten** |

### 3.2 MEIN HUI — Persönlicher Wirkungsraum

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Wirkungsraum-Overlay | `src/pages/MeinHUI.jsx` | Center-Orb; `A.OPEN_ORB`; `A.OPEN_WORLD` | **MEIN HUI** |
| Orb-Hero | `MeinHUI.OrbHero` | Innerhalb MeinHUI | **MEIN HUI → Orb** |
| Grundpfeiler (Orientierung) | `MeinHUI.Pillars` | Innerhalb MeinHUI | **MEIN HUI → Orientierung** |
| Reise / Journey | `MeinHUI` Journey-Block | Innerhalb MeinHUI | **MEIN HUI → Orientierung** |
| Begegnungs-Kompass | `src/components/OrbCompass.jsx` | **Kein Einstieg** (importiert, nicht gerendert) | **MEIN HUI → Kompass** |
| Plus-Sheet (Legacy) | `src/components/HuiPlusSheet.jsx` | Ersetzt durch MeinHUI | **LEGACY** |
| Membership-Flow (Basis-User) | `HuiMembershipFlow` | `A.OPEN_ORB` wenn nicht Talent | **MEIN HUI** (Gate) |
| Erstellen — Content-Auswahl | `ContentTypeSelector` | **Kein Einstieg** (`showContentSelector` nie true) | **MEIN HUI → Erstellen** |
| Erstellen — Unified Flow | `HuiCreateFlow` | **Kein Einstieg** (`showCreateFlow` nie true) | **MEIN HUI → Erstellen** |
| Erstellen — Teilen | `TeilenFlow` | Feed Share, ContentSelector | **MEIN HUI → Erstellen** |
| Erstellen — Werk | `WerkPublisher` / `WorkFlow` | Search, Profil-Wizard | **MEIN HUI → Erstellen** / **HUI STUDIO** |
| Erstellen — Erlebnis | `ExperienceCreator` / `ExperienceWizard` | Search, Profil-Wizard | **MEIN HUI → Erstellen** / **HUI STUDIO** |
| Erstellen — Impact-Projekt | `ImpactFlow` | Search „Projekt starten"; `A.OPEN_IMPACT_FLOW` | **IMPACT** (Create) |
| Erstellen — Einladung | `InvitationFlow` | ContentSelector | **MEIN HUI → Erstellen** |
| Erstellen — Verbindung | `ConnectionCreatePage` | `A.OPEN_CONNECT`, `A.OPEN_BOOKING` | **CHAT** / **MEIN HUI** |
| Talent-Onboarding | `TalentOnboarding` | `HuiMembershipFlow` | **MEIN HUI** |
| MeinHUI Notif/Settings-Buttons | `MeinHUI.ProfileHeader` | **Schließen nur** (kein Ziel) | **TOT** → MEINE RESONANCE / PROFIL |

### 3.3 MEINE RESONANCE — Persönliche Aktivitäten

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Meine Resonanz (Timeline) | `src/pages/studio/MeineResonanz.jsx` | Button in `MyBasisProfile` | **MEINE RESONANCE** |
| Resonanzzentrum (Benachrichtigungen) | `ResonanzzentrumPanel` in `useNotifications.jsx` | Header-Glocke | **MEINE RESONANCE → Verlauf** |
| Favoriten / Dein Raum | `FavoritesPage` | Versteckter Tab; kein UI-Link | **MEINE RESONANCE → Favoriten** |
| Merken-Liste | `MerkenSection` in Profil | Profil → 📌 | **MEINE RESONANCE → Favoriten** |
| Empfehlungen (als Empfehler) | `MyRecommendationsModal` in HuiStudio | HuiStudio → „Meine Empfehlungen" | **MEINE RESONANCE → Empfehlungen** |
| Commerce-Verlauf (Studio) | `EinAusgabenModal` in HuiStudio | HuiStudio → Ein-/Ausgaben | **MEINE RESONANCE → Bestellungen** |
| NotificationPanel (Profil) | `NotificationPanel` in MyBasisProfile | Profil-intern (dupliziert) | **LEGACY** → MEINE RESONANCE |
| NotificationCenter | `NotificationCenter.jsx` | Deaktiviert | **LEGACY** |

### 3.4 HUI STUDIO — Creator-Arbeitsplatz

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| HuiStudio (Modal) | `src/components/studio/HuiStudio.jsx` | Profil ⚙️; Talent/Basis-Profil Owner | **HUI STUDIO** (primär) |
| Ambassador-Bereich | `AmbassadorModal` | HuiStudio | **HUI STUDIO → Creator-Verwaltung** |
| Impact-Stimmen | `ImpactStimmenModal` | HuiStudio | **HUI STUDIO** (Creator-Impact) |
| Unterstützte Projekte | `MeineProjekteModal` | HuiStudio | **HUI STUDIO** |
| Ein-/Ausgaben | `EinAusgabenModal` | HuiStudio | **HUI STUDIO → Einnahmen** |
| Statistiken | `StatistikenModal` | HuiStudio | **HUI STUDIO → Einnahmen** |
| Profil bearbeiten (Studio) | `ProfilBearbeitenModal` | HuiStudio | **PROFIL** (Inhalt) / **HUI STUDIO** (Zugang) |
| Verifizierung | HuiStudio Row | HuiStudio | **PROFIL → Sichtbarkeit** |
| Sicherheit & Passwort | `SicherheitPasswortModal` | HuiStudio | **PROFIL → Einstellungen** |
| Mitgliedschaft | HuiStudio Row | HuiStudio | **PROFIL → Einstellungen** |
| Support | `SupportPage` | HuiStudio, CreatorStudio | **HUI STUDIO** |
| Meine Tickets | `MeineTicketsPage` | HuiStudio | **HUI STUDIO** |
| CreatorStudio (Route) | `src/pages/CreatorStudio.jsx` | URL `/studio`, `/studio/:section` | **HUI STUDIO** (sekundär) |
| Werke & Inhalte (Route) | `MeineInhaltePage` | `/studio/content` | **HUI STUDIO → Werke/Inhalte** |
| Verfügbarkeit (Route) | `VerfuegbarkeitPage` | `/studio/availability` | **HUI STUDIO** |
| Zusammenarbeit/Bestellungen (Route) | `BestellungenPage` | `/studio/orders` | **HUI STUDIO → Aufträge** |
| Reichweite (Route) | `AnalyticsPage` | `/studio/analytics` | **HUI STUDIO → Einnahmen** |
| Einnahmen (Route) | `EinnahmenPage` | `/studio/earnings` | **HUI STUDIO → Einnahmen** |
| Vertrauen (Route) | `ReputationInsightsPage` | `/studio/reputation` | **HUI STUDIO** |
| Impact (Route) | `ImpactSubPage` | `/studio/impact` | **IMPACT** (Creator-Perspektive) |
| Einstellungen (Route) | `KontoPage` | `/studio/settings` | **PROFIL → Einstellungen** (Stub) |
| CreatorDashboard (Overlay) | `CreatorDashboard.jsx` | `window.__HUI_OPEN_CREATOR_DASH` | **LEGACY** |
| MyCreatorDashboard | `MyCreatorDashboard.jsx` | Nicht eingebunden | **LEGACY** |
| Werke im Profil verwalten | `WorksSection` + Wizard in `MyBasisProfile` | Profil-Sektionen | **HUI STUDIO → Werke** (Duplikat) |
| Erlebnisse im Profil verwalten | `ExperiencesSection` + Wizard | Profil-Sektionen | **HUI STUDIO → Erlebnisse** (Duplikat) |

### 3.5 PROFIL — Öffentliche Identität

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Eigenes Profil (Overlay) | `MyBasisProfile.jsx` | Bottom-Nav „Profil"; `A.OPEN_OWN_PROFILE` | **PROFIL** |
| Eigenes Profil (Route) | `/profile/me` → `WirkerProfilePage` | Deep Link | **PROFIL** (andere UI-Variante) |
| Fremdes Profil (Overlay) | `TalentProfilePage` / `BasisProfilePage` | Feed/Discover Avatar; `A.OPEN_PROFILE` | **PROFIL** |
| Fremdes Profil (Route) | `WirkerProfilePage` | `/profile/:username` | **PROFIL** |
| Öffentliche Vorschau | `PublicProfilePreview` | Profil → 👁️ | **PROFIL → Sichtbarkeit** |
| Profil-Sektionen | `src/components/profile/sections/*` | Profil-Scroll | **PROFIL** |
| SettingsModal | `SettingsModal.jsx` | Talent/Basis-Profil Owner; HuiStudio | **PROFIL → Einstellungen** |
| SettingsModal in MyBasisProfile | `showSettings` State | **Nie geöffnet** (⚙️ öffnet HuiStudio) | **TOT** |
| Profil-Completion | `ProfileCompletionFlow` | App-Start (einmalig) | **PROFIL** (Onboarding) |
| Gemeinschafts-Flow | `GemeinschaftsFlow` | Profil-Aktion | **PROFIL** |

### 3.6 IMPACT — Projekte, Wirkung, Community

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Impact-Hub | `ImpactPage.jsx` | Bottom-Nav Tab; `/impact` URL; `A.GO_IMPACT` | **IMPACT** |
| Impact-Projekt erstellen | `ImpactFlow` | Search „Projekt starten" | **IMPACT** |
| Impact aus Discover | Discover Projekt-Karten | `navigate("/impact")` — verlässt Shell | **IMPACT** (inkonsistente Shell) |
| Impact-Stimmen abstimmen | `ImpactStimmenModal` | HuiStudio | **IMPACT** (Creator) / **HUI STUDIO** |
| Community Impact | ImpactPage Community-Bereich | Impact-Tab | **IMPACT** |

### 3.7 CHAT — Kommunikation

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Chat-Center | `ChatCenterOverlay.jsx` | Header Nachrichten; `A.OPEN_CHAT` | **CHAT** |
| Chat aus Profil | Profil-Chat-Button | `A.OPEN_CHAT` / `setShowChat` | **CHAT** |
| Verbindung erstellen | `ConnectionCreatePage` | `A.OPEN_CONNECT`, `A.OPEN_BOOKING` | **CHAT** |
| ChatPage (Stub) | `src/pages/ChatPage.jsx` | Kein Einstieg | **LEGACY** |

### 3.8 COMMERCE — Transaktionale Flows (kein Top-Level-Bereich)

Commerce ist **kein eigener Navigationsbereich**. Alle Commerce-Funktionen werden über Inhalts-Kontexte ausgelöst.

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Werk-Detail (URL) | `WorkDetailPage` | `/work/:id`, Feed-Detail | **HOME** (Anzeige) → Commerce-Flow |
| Werk kaufen | `WerkKaufFlow` | Kauf auf Detail → `/Home` State | Commerce-Flow (kein eigener Tab) |
| Werkekorb | `WerkeKorb` + `WerkeKorbButton` | Feed/Discover „buchen"; Floating Button | Commerce-Flow |
| Checkout / Unterstützen | `UnterstutzenFlow` | Korb → Checkout | Commerce-Flow |
| Erlebnis buchen | `ExperienceBookingFlow` | Discover `onBook`; `A.BOOK_EXPERIENCE` | Commerce-Flow |
| Stripe Checkout Success | `CheckoutSuccess.jsx` | **Keine Route** | **ORPHAN** |
| Stripe Checkout Cancel | `CheckoutCancel.jsx` | **Keine Route** | **ORPHAN** |
| SupportFlow (Legacy) | `SupportFlow.jsx` | Ersetzt durch Commerce 2.0 | **LEGACY** |
| WerkKaufFlow (Legacy-Markierung) | `WerkKaufFlow.jsx` | Aktiv, als Legacy markiert | Commerce-Flow |

### 3.9 EINSTELLUNGEN

Einstellungen sind **kein eigener Top-Level-Bereich** in der Ziel-Architektur. Sie gehören zu **PROFIL**.

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| SettingsModal | `SettingsModal.jsx` | Talent/Basis Owner; HuiStudio intern | **PROFIL → Einstellungen** |
| KontoPage (Stub) | `StudioSubPages.KontoPage` | `/studio/settings` | **PROFIL → Einstellungen** (unvollständig) |
| Sicherheit | `SicherheitPasswortModal` | HuiStudio | **PROFIL → Einstellungen** |
| Sichtbarkeit | `VisibilitySection` | Profil-Sektion | **PROFIL → Sichtbarkeit** |
| Mitgliedschaft | HuiStudio / `HuiMembershipFlow` | Studio, Orb-Gate | **PROFIL → Einstellungen** |

### 3.10 ADMIN — Administration

| Funktion | Komponente | Aktuelle Einstiege | Offizieller Platz |
|----------|------------|-------------------|-------------------|
| Content-Moderation | `Admin.jsx` | URL `/Admin` | **ADMIN** |
| Platform Dashboard | `PlatformDashboard.jsx` | URL `/dashboard` | **ADMIN** |
| Diagnose (Dev) | `DiagnosePage.jsx` | URL `/diagnose` | **ADMIN** (Dev) |
| ProfileDebugPage | `ProfileDebugPage.jsx` | Keine Route | **ORPHAN** |

**Hinweis:** Kein Admin-Role-Guard auf Route-Ebene (TODO in `registry.js`).

---

## 4. Offizielle Informationsarchitektur (Soll-Zustand)

Ab Phase 1.4 gilt folgende **verbindliche Rollenverteilung**:

```
┌─────────────────────────────────────────────────────────────────┐
│  HOME                                                           │
│  Inspiration · Feed · Stories · Entdecken                       │
│  Einstieg: Bottom-Nav „Home" (umbenennen) + Header-Suche        │
├─────────────────────────────────────────────────────────────────┤
│  MEIN HUI                                                       │
│  Wirkungsraum · Orb · Kompass · Erstellen · Orientierung        │
│  Einstieg: Center-Orb (exklusiv)                                │
├─────────────────────────────────────────────────────────────────┤
│  MEINE RESONANCE                                                │
│  Aktivitäten · Buchungen · Bestellungen · Favoriten ·           │
│  Empfehlungen · Verlauf · persönliche Resonanzen                │
│  Einstieg: Header-Glocke + dedizierter Nav-Zugang (neu, 1.4+)  │
├─────────────────────────────────────────────────────────────────┤
│  HUI STUDIO                                                     │
│  Creator-Arbeitsplatz · Werke · Erlebnisse · Inhalte ·          │
│  Aufträge · Einnahmen · Creator-Verwaltung                      │
│  Einstieg: Profil ⚙️ → HuiStudio (konsolidiert)                 │
├─────────────────────────────────────────────────────────────────┤
│  PROFIL                                                         │
│  Öffentliche Identität · Profilinformationen ·                 │
│  Einstellungen · Sichtbarkeit                                   │
│  Einstieg: Bottom-Nav „Profil"                                  │
├─────────────────────────────────────────────────────────────────┤
│  IMPACT                                                         │
│  Projekte · Wirkung · Community Impact                          │
│  Einstieg: Bottom-Nav „Impact" (nur In-Shell)                   │
├─────────────────────────────────────────────────────────────────┤
│  CHAT                                                           │
│  Unterhaltung · Kommunikation                                   │
│  Einstieg: Header-Nachrichten                                   │
├─────────────────────────────────────────────────────────────────┤
│  ADMIN                                                          │
│  Ausschließlich Administration                                  │
│  Einstieg: URL-only + Role-Guard (1.4+)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Tab-Umbenennung (empfohlen Phase 1.4)

| Aktuell (UI) | Aktuell (Key) | Ziel (UI) | Ziel (Key) |
|--------------|---------------|-----------|------------|
| Entdecken | `feed` | Feed | `feed` |
| Home | `discover` | Entdecken | `discover` |
| — | — | Home (aggregiert) | Konzept, kein separater Key nötig |

**Regel:** Tab-Keys (`feed`, `discover`) bleiben aus Analytics-/sessionStorage-Gründen unverändert. Nur UI-Labels werden angepasst.

---

## 5. Verantwortlichkeiten der Bereiche

### HOME
- **Zweck:** Öffentliche Inspiration und Entdeckung der Plattform
- **Enthält:** Feed, Stories, strukturiertes Browse, Suche, Live-Karte, Match
- **Enthält NICHT:** Persönliche Aktivitäten, Creator-Verwaltung, Einstellungen
- **Owner (Code):** `OWNER.FEED` in `registry.js`

### MEIN HUI
- **Zweck:** Persönlicher Wirkungsraum des Nutzers
- **Enthält:** Orb-Erfahrung, Orientierung (Pillars, Journey, Mood), Erstellen-Auslöser, Kompass
- **Enthält NICHT:** Commerce-Verlauf, Creator-Statistiken, Account-Einstellungen
- **Owner:** HomeShell / OrbWorldContext

### MEINE RESONANCE
- **Zweck:** Alles, was der Nutzer persönlich getan, gespeichert oder erhalten hat
- **Enthält:** Aktivitäts-Timeline, Benachrichtigungen/Verlauf, Favoriten, Buchungen, Bestellungen, Empfehlungen
- **Enthält NICHT:** Öffentliches Profil, Creator-Tools
- **Owner:** `useNotifications.jsx`, `MeineResonanz.jsx`

### HUI STUDIO
- **Zweck:** Creator-Arbeitsplatz für Talente
- **Enthält:** Content-Management, Aufträge, Einnahmen, Ambassador, Support/Tickets
- **Enthält NICHT:** Öffentliche Profilansicht, Feed
- **Owner:** `OWNER.STUDIO`

### PROFIL
- **Zweck:** Öffentliche und private Identität
- **Enthält:** Profilinformationen, Sichtbarkeit, Account-Einstellungen
- **Enthält NICHT:** Creator-Werkzeuge (→ Studio), Aktivitätsverlauf (→ Resonance)
- **Owner:** `OWNER.PROFILE`

### IMPACT
- **Zweck:** Community-Wirkung und Impact-Projekte
- **Enthält:** Projekt-Übersicht, Abstimmungen, Community Impact
- **Enthält NICHT:** Persönliche Commerce-Timeline
- **Owner:** `OWNER.IMPACT`

### CHAT
- **Zweck:** Direkte Kommunikation zwischen Nutzern
- **Enthält:** Konversationen, Nachrichten, Verbindungsanfragen
- **Owner:** `chatContext.js`

### ADMIN
- **Zweck:** Plattform-Administration (intern)
- **Enthält:** Moderation, Dashboard, Diagnose
- **Enthält NICHT:** Nutzer-Funktionen
- **Owner:** `OWNER.ADMIN`

---

## 6. Konsolidierungsmatrix

Für jede Funktion: offizieller Bereich, alte Bereiche, Handlungsbedarf.

| Funktion | Offizieller Bereich | Alte / parallele Bereiche | Verschieben? | Entfernen? | Legacy? |
|----------|--------------------|-----------------------------|--------------|------------|---------|
| Community-Feed | HOME → Feed | — | Nein | Nein | Nein |
| Discover-Browse | HOME → Entdecken | Tab-Label „Home" | Label ja (1.4) | Nein | Nein |
| Stories | HOME → Stories | — | Nein | Nein | Nein |
| MeinHUI Wirkungsraum | MEIN HUI | HuiPlusSheet | Nein | HuiPlusSheet ja | HuiPlusSheet |
| OrbCompass | MEIN HUI → Kompass | Import ohne Render | Einbinden (1.4) | Nein | Teilweise |
| HuiCreateFlow | MEIN HUI → Erstellen | Ungenutzt | Aktivieren oder entfernen | Wenn ungenutzt | Ja |
| ContentTypeSelector | MEIN HUI → Erstellen | Ungenutzt | Aktivieren oder entfernen | Wenn ungenutzt | Ja |
| FavoritesPage | MEINE RESONANCE | Versteckter Tab | Nav-Zugang (1.4) | Nein | Nein |
| MeineResonanz | MEINE RESONANCE | Nur via Profil-Button | Eigener Einstieg (1.4) | Nein | Nein |
| Resonanzzentrum | MEINE RESONANCE | Header | Nein | Nein | Nein |
| NotificationCenter | — | Deaktiviert | — | Ja (1.5) | **Ja** |
| NotificationPanel (Profil) | — | Profil-Duplikat | — | Ja (1.5) | **Ja** |
| HuiStudio | HUI STUDIO | Primär | Nein | Nein | Nein |
| CreatorStudio | HUI STUDIO | URL-only | In HuiStudio integrieren (1.5) | Route deprecaten | Teilweise |
| CreatorDashboard | — | window-API only | — | Ja (1.5) | **Ja** |
| MyCreatorDashboard | — | Nicht eingebunden | — | Ja (1.5) | **Ja** |
| Eigenes Profil Overlay | PROFIL | Bottom-Nav | Nein | Nein | Nein |
| Eigenes Profil Route | PROFIL | `/profile/me` | UI vereinheitlichen (1.5) | Nein | Nein |
| Fremdes Profil Overlay vs Route | PROFIL | Zwei UI-Varianten | Vereinheitlichen (1.5) | Nein | Nein |
| SettingsModal | PROFIL → Einstellungen | HuiStudio, TalentProfil | Konsolidieren (1.4) | Nein | Nein |
| showSettings in MyBasisProfile | — | Nie geöffnet | ⚙️ → Settings | Toten Code entfernen | Ja |
| Impact In-Shell | IMPACT | Bottom-Nav Tab | Nein | Nein | Nein |
| Impact Standalone `/impact` | IMPACT | Discover navigate | Shell vereinheitlichen (1.4) | Nein | Nein |
| ChatCenter | CHAT | — | Nein | Nein | Nein |
| Admin/Dashboard/Diagnose | ADMIN | URL-only | Role-Guard (1.4) | Nein | Nein |
| CheckoutSuccess/Cancel | Commerce | Keine Route | Routes hinzufügen (Commerce-Release) | Nein | Orphan |
| SupportFlow | — | Commerce 2.0 ersetzt | — | Ja (Phase 5) | **Ja** |
| WerkKaufFlow | Commerce | Markiert Legacy | — | Phase 5 | **Ja** |
| ExperienceBookingFlow | Commerce | Markiert Legacy | — | Phase 5 | **Ja** |
| BookingFlow Route | — | Redirect /Home | — | Redirect behalten | **Ja** |
| FeedStoriesBar | — | Deprecated | — | Ja | **Ja** |
| ChatPage Stub | — | — | — | Ja | **Ja** |
| Diagnose.jsx Duplicate | — | DiagnosePage | — | Ja | **Ja** |
| ImpactPool.jsx | — | ImpactSubPage | — | Ja | **Ja** |
| Index.jsx | — | Existiert nicht | — | CODEBASE.md bereinigen | **Ja** |

---

## 7. Erkannte Dubletten

### 7.1 Kritische Dubletten (mehrere aktive Einstiege)

| # | Funktionalität | Einstieg A | Einstieg B | Einstieg C | Einstieg D |
|---|----------------|------------|------------|------------|------------|
| D1 | **Eigenes Profil** | Bottom-Nav Overlay (`MyBasisProfile`) | `/profile/me` Route (`WirkerProfilePage`) | — | — |
| D2 | **Fremdes Profil** | Overlay (`TalentProfilePage`/`BasisProfilePage`) | Route (`WirkerProfilePage`) | — | — |
| D3 | **Impact** | Bottom-Nav Tab (In-Shell) | `/impact` URL (Standalone, kein Nav) | Discover → `navigate("/impact")` | — |
| D4 | **Creator-Tools** | `HuiStudio` Modal | `CreatorStudio` `/studio` | `CreatorDashboard` Overlay | `MyCreatorDashboard` |
| D5 | **Einstellungen** | `SettingsModal` | `HuiStudio` Account-Sektion | `/studio/settings` Stub | `MyBasisProfile.showSettings` (tot) |
| D6 | **Benachrichtigungen** | `ResonanzzentrumPanel` (Header) | `NotificationPanel` (Profil) | `NotificationCenter` (deaktiviert) | MeinHUI Notif-Button (schließt nur) |
| D7 | **Persönliche Aktivitäten** | `MeineResonanz` (Profil-Button) | `FavoritesPage` (versteckter Tab) | `EinAusgabenModal` (Studio) | Resonanzzentrum |
| D8 | **Empfehlungen** | `MyRecommendationsModal` (HuiStudio) | `RecommendationsSection` (Profil) | — | — |
| D9 | **Werke verwalten** | Profil `WorksSection` + Wizard | HuiStudio | `/studio/content` | — |
| D10 | **Erlebnisse verwalten** | Profil `ExperiencesSection` | `/studio/availability` | Search Quick Action | — |
| D11 | **Erstellen** | Search Quick Actions | `HuiCreateFlow` (ungenutzt) | `ContentTypeSelector` (ungenutzt) | Profil-Wizards |
| D12 | **Support** | HuiStudio | CreatorStudio `/studio/support` | — | — |

### 7.2 Benennungs-Dubletten (kein Funktions-Duplikat, aber verwirrend)

| Ist | Soll (Phase 1.4) |
|-----|------------------|
| Nav „Entdecken" = Feed | Nav „Feed" = Feed |
| Nav „Home" = DiscoverPage | Nav „Entdecken" = DiscoverPage |
| `GO_HOME` → `feed` Tab | `GO_HOME` → HOME-Konzept (Feed als Default) |
| `GO_DISCOVER` → `discover` Tab | `GO_DISCOVER` → Entdecken |

---

## 8. Navigation-Audit

### 8.1 Tote Navigation (führt ins Leere oder ohne Wirkung)

| Element | Ort | Problem |
|---------|-----|---------|
| `A.GO_FAVORITES` | `hui.actions.js` | Action existiert, wird nirgends aufgerufen |
| `A.OPEN_COMMUNITY` | `hui.actions.js` | Tab `community` existiert nicht in Home.jsx |
| `A.OPEN_CALENDAR` | `hui.actions.js` | Loggt nur „coming soon" |
| `A.OPEN_NOTIFICATIONS` | `hui.actions.js` | Noop (absichtlich deaktiviert) |
| `A.OPEN_CREATE_FLOW` | `hui.actions.js` | `setShowCreateFlow(true)` wird nie aufgerufen |
| MeinHUI Notif-Button | `Home.jsx` → `MeinHUI` | Ruft `closeMeinHuiCinematic` auf |
| MeinHUI Settings-Button | `Home.jsx` → `MeinHUI` | Ruft `closeMeinHuiCinematic` auf |
| `MyBasisProfile` ⚙️ → SettingsModal | `MyBasisProfile.jsx` | `showSettings` wird nie `true`; ⚙️ öffnet HuiStudio |
| `OrbCompass` | `Home.jsx` | Importiert, nicht gerendert |
| `ContentTypeSelector` | `Home.jsx` | `showContentSelector` nie `true` |
| `HuiCreateFlow` | `Home.jsx` | `showCreateFlow` nie `true` |
| Resonanzzentrum `action_url` | `useNotifications.jsx` | DB-URLs werden geladen, Navigation in `handleClick` nicht implementiert |
| Legacy `NotificationCenter` mock `/chat` | `NotificationCenter.jsx` | Komponente nicht gerendert |
| `/studio?section=tickets` | Legacy NotificationCenter | Falsches URL-Format; Tickets in HuiStudio |
| `CheckoutSuccess` / `CheckoutCancel` | — | Keine Routes → SmartNotFound |
| `ProfileDebugPage` | — | Keine Route |
| `CreatorStudio` Verfügbarkeit/Settings | `StudioSubPages.jsx` | „folgen bald" Platzhalter |
| `/:username` Catch-All | `App.jsx` | Unbekannte Pfade → RefRedirect statt 404 |

### 8.2 Doppelte Seiten (gleiche Funktion, unterschiedliche UI)

| Funktion | Variante A | Variante B |
|----------|------------|------------|
| Eigenes Profil | `MyBasisProfile` (Overlay, reich) | `WirkerProfilePage` (Route, schlank) |
| Fremdes Profil | `TalentProfilePage`/`BasisProfilePage` | `WirkerProfilePage` |
| Impact | In-Shell mit Bottom-Nav | Standalone ohne Nav |
| Creator-Verwaltung | `HuiStudio` Modal | `CreatorStudio` Full-Page |

### 8.3 Funktionen ohne sichtbaren Einstieg

| Funktion | Datei | Grund |
|----------|-------|-------|
| FavoritesPage / Dein Raum | `FavoritesPage.jsx` | Tab nicht in Bottom-Nav |
| HuiCreateFlow | `HuiCreateFlow.jsx` | State nie gesetzt |
| ContentTypeSelector | `content/ContentTypeSelector.jsx` | State nie gesetzt |
| OrbCompass | `OrbCompass.jsx` | Nicht gemountet |
| CreatorDashboard | `CreatorDashboard.jsx` | Nur `window.__HUI_OPEN_CREATOR_DASH` |
| MyCreatorDashboard | `MyCreatorDashboard.jsx` | Nicht importiert |
| CreatorStudio | `CreatorStudio.jsx` | Nur direkte URL |
| Admin / Dashboard / Diagnose | diverse | Nur direkte URL |
| CheckoutSuccess / Cancel | `CheckoutSuccess.jsx` etc. | Keine Route |
| ProfileDebugPage | `ProfileDebugPage.jsx` | Keine Route |

---

## 9. Legacy-Komponenten (vollständige Liste)

### 9.1 Explizit als LEGACY / DEPRECATED markiert

| Komponente | Pfad | Ersatz / Status |
|------------|------|-----------------|
| NotificationCenter | `src/components/NotificationCenter.jsx` | ResonanzzentrumPanel |
| HuiPlusSheet | `src/components/HuiPlusSheet.jsx` | MeinHUI |
| FeedStoriesBar | `src/feed/FeedStoriesBar.jsx` | StoryBar in UnifiedFeed |
| SupportFlow | `src/components/economy/SupportFlow.jsx` | Commerce 2.0 |
| WerkKaufFlow | `src/components/commerce/WerkKaufFlow.jsx` | Commerce 2.0 (noch aktiv) |
| ExperienceBookingFlow | `src/components/commerce/ExperienceBookingFlow.jsx` | Commerce 2.0 (noch aktiv) |
| MyCreatorDashboard | `src/pages/MyCreatorDashboard.jsx` | HuiStudio / CreatorStudio |
| CreatorDashboard | `src/pages/CreatorDashboard.jsx` | HuiStudio |
| ChatPage (Stub) | `src/pages/ChatPage.jsx` | ChatCenterOverlay |
| BookingFlow (Stub) | `src/pages/BookingFlow.jsx` | Overlay-Flows in HomeShell |
| Diagnose (Duplicate) | `src/pages/Diagnose.jsx` | DiagnosePage |
| ImpactPool | `src/pages/ImpactPool.jsx` | ImpactSubPage |
| ImpactTokens.js | `src/system/flows/impact/ImpactTokens.js` | ImpactTokens.jsx |
| TalentProfilePage Sections | Inline in `TalentProfilePage.jsx` | `profile/sections/*` |
| mockData.js | `src/lib/mockData.js` | Supabase |

### 9.2 Orphan Pages (existieren, keine Route)

| Datei | Empfehlung |
|-------|------------|
| `CheckoutSuccess.jsx` | Route in Commerce-Release |
| `CheckoutCancel.jsx` | Route in Commerce-Release |
| `ProfileDebugPage.jsx` | Dev-Route unter `/diagnose` oder entfernen |
| `MyCreatorDashboard.jsx` | Entfernen (Phase 5) |

### 9.3 Toter Code (importiert/State vorhanden, nicht erreichbar)

| Element | Pfad |
|---------|------|
| OrbCompass Import | `src/pages/Home.jsx` |
| showSettings State | `src/pages/MyBasisProfile.jsx` |
| showCreateFlow / HuiCreateFlow | `src/pages/Home.jsx` |
| showContentSelector | `src/pages/Home.jsx` |
| GO_FAVORITES Action | `src/core/hui.actions.js` |
| OPEN_COMMUNITY Action | `src/core/hui.actions.js` |
| SCREENS.COMMUNITY | `src/core/hui.navigator.jsx` |
| Index.jsx Referenz | `CODEBASE.md` (Datei existiert nicht) |

### 9.4 Legacy Redirects (behalten)

| Pfad | Ziel | Grund |
|------|------|-------|
| `/BookingFlow` | `/Home` | Externe Links |
| `/` | `/Home` | Root |
| `*` | SmartNotFound → `/Home` oder `/login` | 404-Fallback |

---

## 10. Empfohlene Bereinigung (Roadmap)

### Phase 1.4 — Navigation & Labels (kein Feature-Umfang)

1. Bottom-Nav Labels korrigieren: `Entdecken`↔`Home` Umbenennung gemäß Soll-Architektur
2. Impact: Discover-Projekte auf `A.GO_IMPACT` / In-Shell umstellen (kein `navigate("/impact")`)
3. MeinHUI Notif/Settings-Buttons an Resonanzzentrum / SettingsModal anbinden
4. `GO_FAVORITES` oder Nav-Einstieg für MEINE RESONANCE → Favoriten
5. Admin-Role-Guard auf `/Admin`, `/dashboard`

### Phase 1.5 — Konsolidierung

1. `CreatorStudio` Inhalte in `HuiStudio` migrieren; `/studio` deprecaten
2. Profil-Overlay und Profil-Route UI vereinheitlichen
3. `NotificationPanel` (Profil) und `NotificationCenter` entfernen
4. `OrbCompass` in MeinHUI einbinden oder Import entfernen
5. `HuiCreateFlow` / `ContentTypeSelector`: aktivieren oder entfernen
6. Toten `showSettings`-Pfad in MyBasisProfile bereinigen

### Phase 5 — Commerce & Legacy-Entfernung

1. `SupportFlow`, `WerkKaufFlow`, `ExperienceBookingFlow` entfernen (nach Commerce 2.0)
2. `MyCreatorDashboard`, `CreatorDashboard` entfernen
3. `CheckoutSuccess`/`CheckoutCancel` Routes hinzufügen
4. `CODEBASE.md` mit Ist-Stand synchronisieren

---

## 11. URL-Register (Referenz)

Vollständiges Route-Register: `src/routes/registry.js` (`ROUTE_REGISTRY`)

| Pfad | Komponente | Bereich |
|------|------------|---------|
| `/Home` | Home (Shell) | Alle In-Shell-Bereiche |
| `/login` | LoginPage | Auth |
| `/auth/callback` | AuthCallback | Auth |
| `/work/:id` | WorkDetailPage | Commerce (Kontext) |
| `/profile/:username` | WirkerProfilePage | PROFIL |
| `/profile/me` | OwnProfileRedirect | PROFIL |
| `/impact` | ImpactPage | IMPACT |
| `/studio`, `/studio/:section` | CreatorStudio | HUI STUDIO (sekundär) |
| `/Admin` | Admin | ADMIN |
| `/dashboard` | PlatformDashboard | ADMIN |
| `/diagnose` | DiagnosePage | ADMIN (Dev) |
| `/ref/:username`, `/:username` | RefRedirect | Referral |
| `/BookingFlow` | Redirect → `/Home` | Legacy |
| `*` | SmartNotFound | System |

---

## 12. Build-Verifikation

```bash
npm run build
```

Build-Status für Phase 1.3: **erfolgreich** (keine Code-Änderungen, nur Dokumentation).

---

## 13. Referenzen

| Dokument | Rolle |
|----------|-------|
| `src/routes/registry.js` | Route-Register (Shadow Mode) |
| `src/components/home/navigation/navConfig.js` | Tab-Navigation |
| `src/core/hui.actions.js` | Action Engine |
| `CODEBASE.md` | Codebase-Übersicht (teilweise veraltet) |
| `HUI_CONSTITUTION.md` | Produkt-Verfassung |

---

*Erstellt von HUI Release Engineering — Phase 1.3. Keine funktionalen Änderungen in diesem Release.*
