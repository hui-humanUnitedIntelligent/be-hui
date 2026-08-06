# Domain Contract — IDENTITY

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Identity & Membership  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Wer ist dieser Mensch auf HUI? Identität, Talent-Profil, Mitgliedschaft, Onboarding und Ambassador-Programm.

**Grundpfeiler-Bezug:** 🤝 Verbinden · Querschnitt für alle Domains

---

## Verantwortung

### Besitzt (fachlich)

- Auth/Session (Supabase Auth)
- Basis-Profil und Talent/Wirker-Profil
- Onboarding, Profile Completion, Settings
- Mitgliedschaft, Ambassador, Username-Validierung
- IDENTITY_CONTRACT in db.js

### Besitzt ausdrücklich NICHT

- Wirkungsberechnung / Orb-Parameter (→ WIRKUNG)
- Follows/Connections (→ CONNECTION)
- Chat/Notifications (→ COMMUNICATION)
- Commerce-Transaktionen (→ COMMERCE)
- Feed-Ranking (→ DISCOVERY)

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `profiles`
- `wirker_profiles`
- `memberships`
- `profile_modules`
- `profile_views`

### Tabellen — nur lesen

- `trust_scores`
- `resonance_signals`
- `orb_states`

### Tabellen — niemals schreiben

- `works`
- `bookings`
- `messages`
- `impact_votes`
- `follows`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | ProfileService, MembershipService, TalentService (db.js), lib/profileMedia.js, lib/ambassadorUtils.js |
| **Contexts** | lib/AuthContext.jsx (Auth Owner), AppStateContext.profile (Consumer → Ziel: IdentityContext) |
| **Hooks** | useProfileData, useProfileId, useTalentActivation, useAmbassador, useUsernameCheck |
| **Komponenten** | components/auth/*, components/profile/*, components/ambassador/*, components/settings/SettingsModal, components/TalentOnboarding, … |
| **Pages** | pages/LoginPage, pages/AuthCallback, pages/TalentProfilePage, pages/BasisProfilePage, pages/MyBasisProfile, pages/wirker-profile/* |

**Dateien in Domain:** 44 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| ProfileService | public | getProfile, updateProfile, getWirkerProfile |
| MembershipService | public | getMembership, updateMembership |
| TalentService | public | activateTalent, getTalentStatus |
| useAuth (`lib/AuthContext.jsx`) | public | — |
| IDENTITY_CONTRACT (`services/db.js`) | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `PROFILE_COMPLETED`
- `TALENT_ACTIVATED`
- `MEMBER_JOINED`
- `profile.updated`
- `membership.changed`
- `talent.activated`

### Konsumiert

- `BOOKING_COMPLETED (optional metadata)`

### Darf niemals erzeugen

- `resonance.sent`
- `impact.vote.cast`
- `work.published`

---

## Realtime

### Kanäle

_Keine dedizierten Kanäle_

### Erlaubte Presence-Informationen

- profile_view (read-only)

---

## Layer

### Erlaubte Layer

- Presentation
- Application
- Domain
- Infrastructure
- Core

### Verbotene Layer

_Keine zusätzlichen Verbote_

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `WIRKUNG`

### Darf abhängig sein von

- `CONNECTION`
- `COMMERCE`
- `COMMUNICATION`
- `STUDIO`
- `DISCOVERY`

### Verbotene zyklische Abhängigkeiten

- IDENTITY → DISCOVERY → IDENTITY (State-Loop ohne Service)

---

## Constitution

### Besonders geltende Regeln

- Regel 1 — Menschen sind keine Produkte
- Regel 7 — KI ersetzt Menschen nicht
- VIII — Sprache (kein Follower/Score)

### Invarianten

- profiles-Writes nur über Core Engine / ProfileService
- Auth nur via AuthContext

### ADRs

- ADR-001 (Login/Callback Routes)

### RFCs

- RFC-000 Rule 4 — Core tables via Core Engine

---

## Scanner Rules

- CORE_BYPASS: profiles/wirker_profiles Write ohne coreEngine
- DUPLICATE_OWNER: profiles (19 Duplikat-States laut SYSTEM_OWNERSHIP)
- DB_DIRECT_WRITE: UI-Komponenten schreiben profiles
- CROSS_DOMAIN_WRITE: fremde Tabellen aus IDENTITY-Dateien

---

## Intelligence

### Empfehlungen

- IdentityContext aus AppState extrahieren
- Core Engine für alle profile-Writes
- ProfilBearbeitenModal → ProfileService

### Typische Risiken

- 42 CRITICAL Core Bypass (profiles)
- 19 duplicate profile states
- AuthContext + 8 Dateien schreiben profiles

### Erlaubte Refactorings

- ProfileService isolieren
- IdentityContext
- Core Engine Gateway

### Niemals

- Profil-Wirkungslogik in UI
- Gamification/Score im Profil

---

## Migration

### Vollständig migriert wenn

- Ein Profile-Owner
- 0 CRITICAL profiles-Writes außerhalb Core
- IdentityContext extrahiert

### Metriken „fertig"

- **healthScore:** 30% → 85%
- **criticalViolations:** 0
- **duplicateOwners:** 0

**Aktueller Health Score (Baseline):** 30%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/HuiMembershipFlow.jsx, components/TalentOnboarding.jsx, components/ambassador/AmbassadorModal.jsx, components/ambassador/AmbassadorSection.jsx, components/auth/AuthGate.jsx, components/auth/ProfileCompletionFlow.jsx, components/home/profile/ProfileLauncher.jsx, components/profile/MerkenSection.jsx (+36)

---

*Domain Contract IDENTITY — ARCH-005.1. Keine Runtime-Änderung.*
