# CORE-001 — Domain Ownership Enforcement Audit Report

**Release:** CORE-001  
**Datum:** 2026-06-30  
**Status:** Abgeschlossen (Enforcement Phase 1)  
**Bezug:** ADR-0001, HUI Constitution IV, RFC-000A

---

## 1. Executive Summary

CORE-001 ist das erste **Architektur-Enforcement-Release** der HUI-Plattform. Es implementiert keine Produkt-, UI-, Navigations- oder Verhaltensänderungen. Stattdessen wird die bestehende Architektur erstmals **technisch nachvollziehbar** gemacht.

### Ergebnisse

| Metrik | Wert |
|---|---|
| Domänen definiert | 10 (CORE, IDENTITY, CONTENT, SOCIAL, COMMERCE, IMPACT, DISCOVERY, COMMUNITY, PLATFORM, TRUST) |
| Dateien mit Ownership-Metadaten | 20+ Kernmodule |
| Bekannte Verstöße dokumentiert | 42 (siehe `src/architecture/violations.js`) |
| Offene Verstöße (P0) | 5 |
| Offene Verstöße (P1) | 28 |
| Akzeptierte Ausnahmen | 9 |
| React-Komponenten mit direktem DB-Write | 35 |
| Hooks mit Businesslogik | 6 |
| Action-Engine-Adoption | ~9 von ~120 Feature-Dateien (~7%) |

### Lieferumfang

- Governance-Dokumente: ADI, ADR-0001, RFC-000A, RFC-000, CORE Domain Charter
- Architecture Module: `src/architecture/` (domains, ownership, guards, violations)
- Domain-Service-Vorbereitung: `src/architecture/domain-services/`
- Shared Interfaces: `src/architecture/interfaces/`
- Violation-Marker: `TODO(ADR-0001)` in kritischen Dateien
- Ownership-Header: Services, Contexts, Core-Module

---

## 2. Architektur-Audit

### 2.1 Schichtenmodell (Constitution IV)

```
Constitution → Registry → Core Engine → Domain Engines → Domain Services → UI
```

**Befund:** Das Schichtenmodell ist dokumentiert aber nicht durchgesetzt. ~35 UI-Komponenten/Pages schreiben direkt nach Supabase. Die Action Engine (`hui.actions.js`) wird nur in ~7% der Feature-Dateien genutzt.

### 2.2 Domain-Zuordnung

| Domäne | Owner-Modul(e) | Status |
|---|---|---|
| CORE | coreEngine, hui.actions, HuiRegistry, architecture/ | ✅ Definiert |
| IDENTITY | AuthContext, AppStateContext, ProfileService | ⚠️ Duplikat-States |
| CONTENT | content.js, Create-Flows | ⚠️ UI-Bypasses |
| SOCIAL | chatContext, AppStateContext (follows) | ⚠️ Verteilt |
| COMMERCE | bookingContext, commerceEngine | ✅ Relativ sauber |
| IMPACT | ImpactFlow, ImpactPage | ⚠️ Direkte UI-Writes |
| DISCOVERY | feed/, discovery/ | ⚠️ Feed-DB-Bypasses |
| COMMUNITY | community/index.js | ✅ Isoliert |
| PLATFORM | events/, notificationService | ⚠️ Verteilt |
| TRUST | trustContext | ✅ Isoliert |

### 2.3 Service-Landschaft

| Service | Domäne | Eindeutig? |
|---|---|---|
| `services/db.js` | ALLE | ❌ Monolith — 12 Sub-Services |
| `services/content.js` | CONTENT | ✅ |
| `services/commerceEngine.js` | COMMERCE | ✅ |
| `services/creatorEconomy.js` | COMMERCE | ✅ |
| `lib/chatContext.js` | SOCIAL | ✅ (Context = Owner) |
| `lib/bookingContext.js` | COMMERCE | ✅ (Context = Owner) |
| `lib/trustContext.js` | TRUST | ✅ (Context = Owner) |

---

## 3. Alle Domain-Ownership-Verstöße

Vollständige Registry: `src/architecture/violations.js` (42 Einträge)

### P0 — Kritisch (sofort migrieren)

| ID | Datei | Domäne | Verletzte Regel | Risiko |
|---|---|---|---|---|
| V-001 | `components/WorkDetailPage.jsx` | CONTENT | ADR-0001 §3, Constitution IV | Doppelter State mit AppStateContext |
| V-002 | `components/StoryBar.jsx` | CONTENT | ADR-0001 §3, Cross-Domain | CONTENT schreibt SOCIAL (messages) |
| V-003 | `pages/TalentProfilePage.jsx` | IDENTITY | Single Owner | 19 duplizierte Profile-States |
| V-004 | `pages/MyBasisProfile.jsx` | CONTENT | ADR-0001 §3 | 11 duplizierte Works-States |
| V-060 | `core/HuiConnectionEngine.jsx` | CORE | CORE Charter | CORE schreibt SOCIAL (follows) |

### P1 — Hoch (nächste Migrationssprints)

| ID | Datei | Typ | Tabelle(n) |
|---|---|---|---|
| V-010 | `components/NotificationCenter.jsx` | direct_db_write | notifications, payments |
| V-012 | `components/studio/ProfilBearbeitenModal.jsx` | direct_db_write | profiles, wirker_profiles |
| V-013 | `components/settings/SettingsModal.jsx` | direct_db_write | profiles |
| V-015 | `components/experiences/ExperienceWizard.jsx` | direct_db_write | experiences |
| V-016 | `components/HuiMomentSheet.jsx` | direct_db_write | beitraege |
| V-017 | `components/teilen/TeilenFlow.jsx` | direct_db_write | beitraege |
| V-018 | `components/SupportSheet.jsx` | cross_domain | project_support, impact_projects |
| V-019 | `components/connection-create/ConnectionCreatePage.jsx` | direct_db_write | connections |
| V-020 | `pages/wirker-profile/index.jsx` | direct_db_write | profile_watchers |
| V-021 | `pages/BasisProfilePage.jsx` | direct_db_write | profiles |
| V-022 | `components/profile/sections/WorksSection.jsx` | direct_db_write | works |
| V-023 | `components/studio/ImpactStimmenModal.jsx` | direct_db_write | impact_votes |
| V-024 | `components/notifications/NotificationPanel.jsx` | direct_db_write | notifications |
| V-030 | `feed/StoryViewer.jsx` | direct_db_write | story_views |
| V-031 | `feed/StoryReactionTray.jsx` | direct_db_write | story_reactions |
| V-040 | `components/commerce/WerkKaufFlow.jsx` | cross_domain | notifications |
| V-041 | `components/commerce/ExperienceBookingFlow.jsx` | cross_domain | notifications |
| V-050 | `lib/useReactions.jsx` | hook_business_logic | post_reactions, saved_posts |
| V-051 | `lib/usePresence.jsx` | hook_business_logic | user_presence |
| V-052 | `lib/usePresence.js` | duplicate_owner | user_presence |
| V-053 | `lib/useNotifications.jsx` | hook_business_logic | notifications |
| V-054 | `hooks/useAmbassador.js` | hook_business_logic | ambassador, profiles |
| V-061 | `core/coreEngine.js` | direct_db_write | hui_core_profiles |
| V-080 | `lib/AppStateContext.jsx` | duplicate_owner | bookings, works, profile |
| V-081 | `services/db.js` | service_violation | alle Tabellen |

### P2 — Mittel (Action Engine)

| ID | Datei | Beschreibung |
|---|---|---|
| V-055 | `hooks/useProfileData.js` | Umgeht ProfileService |
| V-070 | `components/HuiMatchOverlay.jsx` | Action Engine bypass |
| V-071 | `pages/DiscoverPage.jsx` | Action Engine bypass |
| V-072 | `components/WorkDetailPage.jsx` | Action Engine bypass |

### P3 — Akzeptiert (Create-Flows, Auth, Admin)

| ID | Datei | Status |
|---|---|---|
| V-005 | `pages/ImpactPage.jsx` | accepted (standalone) |
| V-011 | `components/auth/ProfileCompletionFlow.jsx` | accepted (onboarding) |
| V-014 | `components/works/WerkWizard.jsx` | accepted (create-flow) |
| V-025 | `pages/Admin.jsx` | accepted (admin) |
| V-032 | `feed/StoryCreator.jsx` | accepted (create-flow) |
| V-090 | `components/HuiCreateFlow.jsx` | accepted (create-flow) |
| V-091 | `components/WerkPublisher.jsx` | accepted (create-flow) |
| V-092 | `pages/LoginPage.jsx` | accepted (auth) |

---

## 4. Alle direkten DB-Zugriffe

### 4.1 React-Komponenten mit WRITE-Zugriff

| Datei | Tabellen | Operation |
|---|---|---|
| `components/WorkDetailPage.jsx` | comments, works | INSERT, UPDATE |
| `components/StoryBar.jsx` | story_views, messages | UPSERT, INSERT |
| `components/StoryComposer.jsx` | stories | INSERT |
| `components/NotificationCenter.jsx` | notifications | UPDATE |
| `components/HuiMomentSheet.jsx` | beitraege | INSERT |
| `components/HuiCreateFlow.jsx` | stories, works | INSERT |
| `components/SupportSheet.jsx` | project_support, impact_projects | INSERT, UPDATE |
| `components/connection-create/ConnectionCreatePage.jsx` | connections | INSERT |
| `components/works/WerkWizard.jsx` | works | INSERT, UPDATE |
| `components/experiences/ExperienceWizard.jsx` | experiences | INSERT, UPDATE |
| `components/teilen/TeilenFlow.jsx` | beitraege | INSERT |
| `components/studio/ProfilBearbeitenModal.jsx` | profiles, wirker_profiles | UPDATE, INSERT |
| `components/studio/ImpactStimmenModal.jsx` | impact_votes | INSERT |
| `components/settings/SettingsModal.jsx` | profiles | UPDATE |
| `components/profile/sections/WorksSection.jsx` | works | UPDATE |
| `components/publishing/PublishWorkFlow.jsx` | works | INSERT |
| `components/notifications/NotificationPanel.jsx` | notifications | UPDATE |
| `components/commerce/WerkKaufFlow.jsx` | notifications | INSERT |
| `components/commerce/ExperienceBookingFlow.jsx` | notifications | INSERT |
| `components/auth/ProfileCompletionFlow.jsx` | profiles | UPDATE |
| `components/WerkPublisher.jsx` | works | INSERT |
| `components/TalentOnboarding.jsx` | profiles | UPDATE |

### 4.2 Pages mit WRITE-Zugriff

| Datei | Tabellen | Operation |
|---|---|---|
| `pages/TalentProfilePage.jsx` | profiles, profile_watchers | UPDATE, INSERT, DELETE |
| `pages/MyBasisProfile.jsx` | works, experiences | UPDATE, DELETE |
| `pages/BasisProfilePage.jsx` | profiles | UPDATE |
| `pages/ImpactPage.jsx` | impact_votes, impact_monthly_results | INSERT, UPSERT |
| `pages/wirker-profile/index.jsx` | profile_watchers | INSERT, DELETE |
| `pages/MyCreatorDashboard.jsx` | profiles | UPDATE |
| `pages/LoginPage.jsx` | profiles | UPSERT |
| `pages/Admin.jsx` | notifications | INSERT |
| `pages/studio/SupportPage.jsx` | notifications | INSERT |
| `pages/studio/MeineTicketsPage.jsx` | notifications | INSERT |
| `pages/studio/StudioSubPages.jsx` | diverse | UPDATE |

### 4.3 Feed-Module mit WRITE-Zugriff

| Datei | Tabellen | Operation |
|---|---|---|
| `feed/StoryViewer.jsx` | story_views | UPSERT |
| `feed/StoryReactionTray.jsx` | story_reactions | UPSERT |
| `feed/StoryCreator.jsx` | stories | INSERT |

### 4.4 Hooks/Lib mit WRITE-Zugriff

| Datei | Tabellen | Operation |
|---|---|---|
| `lib/useReactions.jsx` | post_reactions, saved_posts | UPSERT, DELETE |
| `lib/usePresence.jsx` | user_presence | UPSERT |
| `lib/usePresence.js` | user_presence | UPDATE |
| `lib/useNotifications.jsx` | notifications, profile_relations | UPDATE |
| `hooks/useAmbassador.js` | ambassador, profiles | INSERT, UPDATE |
| `hooks/useProfileData.js` | diverse | SELECT (bypass) |

### 4.5 Core-Module mit WRITE-Zugriff

| Datei | Tabellen | Operation |
|---|---|---|
| `core/HuiConnectionEngine.jsx` | follows | UPSERT, DELETE |
| `core/coreEngine.js` | hui_core_profiles | UPSERT |

---

## 5. Alle Core-Bypasses

### 5.1 Core Engine Bypass

Komponenten die Wirkungsdaten selbst berechnen statt `useCoreEngine`/`coreEngine` zu nutzen:

| Datei | Bypass |
|---|---|
| `components/HuiMatchOverlay.jsx` | Eigene Profile/Works/Experiences-Fetches |
| `hooks/useProfileData.js` | Aggregiert Profildaten ohne Core Engine |
| `pages/TalentProfilePage.jsx` | Eigene Stats-Berechnung |

### 5.2 Domain Service Bypass

Komponenten die `services/db.js` oder Domain Services umgehen:

| Datei | Umgeht |
|---|---|
| `pages/TalentProfilePage.jsx` | ProfileService, WorkService |
| `pages/MyBasisProfile.jsx` | WorkService, ContentService |
| `components/WorkDetailPage.jsx` | ContentService (teilweise) |
| `hooks/useProfileData.js` | Alle Services |
| `components/HuiMatchOverlay.jsx` | DiscoveryService |

### 5.3 Action Engine Bypass

Nur ~9 Dateien nutzen `useHuiActions()`. Alle anderen Feature-Komponenten verwenden direkte `setState`/`navigate`.

**Action-Engine-Adopters:** NotificationCenter, wirker-profile, MyCreatorDashboard, FavoritesPage, ProfileLauncher, BottomNav, HomeHeader

**Nicht-Adopters (Beispiele):** WorkDetailPage, DiscoverPage, HuiMatchOverlay, TalentProfilePage, StoryBar, ImpactPage, ChatCenterOverlay, MeinHUI, alle Studio-Modals

---

## 6. Alle Service-Verstöße

| Verstoß | Datei | Beschreibung | Migration |
|---|---|---|---|
| Monolith ohne Domäne | `services/db.js` | 12 Sub-Services in einer Datei | Split in domain-services/ |
| Kein eindeutiger Owner | `services/db.js` | ProfileService + WorkService + BookingService + ... | Je Domäne extrahieren |
| Cross-Domain in einem Service | `services/db.js` | IMPACT + SOCIAL + CONTENT in einem Import | Domain-Grenzen enforced |
| Umgehung | `hooks/useProfileData.js` | Direkte Queries statt Services | Service-Delegation |
| Umgehung | `lib/discovery/index.js` | Direkte DB-Reads (akzeptiert als Service) | ✅ Owner |
| Umgehung | `lib/community/index.js` | Direkte DB-Writes (akzeptiert als Service) | ✅ Owner |
| Duplikat | `lib/notificationService.js` + `useNotifications.jsx` + `NotificationCenter.jsx` | 3 Notification-Write-Pfade | Konsolidierung |

---

## 7. Alle Hook-Verstöße

| Hook | Verstoß | Businesslogik | Migration |
|---|---|---|---|
| `lib/useReactions.jsx` | DB Writes | Optimistic reactions + notifications | → SocialService |
| `lib/usePresence.jsx` | DB Writes | Presence UPSERT | → sessionHooks (Owner) |
| `lib/usePresence.js` | Duplicate + DB Writes | Presence UPDATE | → Deprecated, sessionHooks |
| `lib/useNotifications.jsx` | DB Writes | Mark read + profile_relations | → AppStateContext |
| `hooks/useAmbassador.js` | DB Writes | Ambassador apply + profile update | → IdentityService |
| `hooks/useProfileData.js` | Service Bypass | Multi-table aggregation | → ProfileService delegation |
| `hooks/useCoreEngine.js` | ✅ Clean | Nur Core Engine Consumer | — |
| `hooks/useProfileId.js` | ⚠️ DB Read | Direkter profiles SELECT | → ProfileService.getById() |
| `hooks/useCartPersistence.js` | ✅ Clean | Local storage only | — |
| `hooks/useTalentActivation.js` | ✅ Clean | Delegiert an Context | — |

---

## 8. Priorisierte Migrationsliste

### Sprint 1 — P0 (Datenintegrität)

1. **V-060** `HuiConnectionEngine.jsx` → SocialService.toggleFollow()
2. **V-001** `WorkDetailPage.jsx` → AppStateContext für likes/saves/follows
3. **V-002** `StoryBar.jsx` → StoryService + ChatContext
4. **V-003** `TalentProfilePage.jsx` → ProfileService delegation
5. **V-004** `MyBasisProfile.jsx` → WorkService.archive()

### Sprint 2 — P1 (Ownership-Konsolidierung)

6. **V-081** `db.js` → Split identityService.js
7. **V-080** AppStateContext → Strikte Owner-Trennung
8. **V-050–054** Hooks → Domain Services
9. **V-010, V-024** Notifications → Single Path via AppStateContext
10. **V-030, V-031** Feed Stories → StoryService

### Sprint 3 — P1 (Cross-Domain)

11. **V-040, V-041** Commerce → notificationService.notify()
12. **V-018** SupportSheet → ImpactService.supportProject()
13. **V-019** ConnectionCreate → SocialService.createConnection()
14. **V-061** coreEngine → CorePersistenceService

### Sprint 4 — P2 (Action Engine)

15. **V-070–072** Action Engine Adoption in Discovery/Content
16. ESLint-Regel: `no-direct-supabase-in-components`
17. ESLint-Regel: `require-hui-actions-for-navigation`

### Sprint 5 — P3 (Optional Cleanup)

18. Create-Flows → Service-Wrapper (kein Dringlichkeit)
19. Legacy-Hooks entfernen (usePresence.js Duplikat)
20. db.js Monolith vollständig aufgelöst

---

## 9. Risiken

| Risiko | Schwere | Mitigation |
|---|---|---|
| State-Divergenz bei parallelen DB-Writes | Hoch | P0-Migrationen priorisieren |
| CORE/SOCIAL-Grenzverletzung (HuiConnectionEngine) | Hoch | Sprint 1 |
| db.js Monolith blockiert Domain-Isolation | Mittel | Schrittweise Extraktion |
| Action Engine nicht adoptiert → Flow-Memory fehlt | Mittel | Sprint 4, kein Datenrisiko |
| 19 duplizierte Profile-States | Hoch | AppStateContext als Single Owner |
| Notification 3-Wege-Write | Mittel | Konsolidierung Sprint 2 |
| Kein ESLint-Enforcement | Niedrig | Phase 3 nach Migration |
| CORE-001 selbst ändert kein Verhalten | — | ✅ Bestätigt |

---

## 10. Scope-Bestätigung

### ✅ Im Scope (durchgeführt)

- [x] Vollständiger Architektur-Audit
- [x] Governance-Dokumente erstellt (ADI, ADR-0001, RFC-000A, RFC-000, CORE Charter)
- [x] Domain-Definitionen (`src/architecture/domains.js`)
- [x] Ownership-Metadaten (`src/architecture/ownership.js`)
- [x] Architecture Guards (`src/architecture/guards.js`)
- [x] Violations Registry (`src/architecture/violations.js`)
- [x] Domain-Service-Ordner vorbereitet
- [x] Shared Interfaces vorbereitet
- [x] Ownership-Header in Kernmodulen
- [x] TODO(ADR-0001)-Marker in kritischen Dateien
- [x] ARCHITECTURE_INDEX aktualisiert
- [x] Vollständige Verstoßliste und Migrationsliste

### ❌ Nicht im Scope (nicht durchgeführt)

- [ ] UI-Umbau
- [ ] Komponenten verschieben
- [ ] Features ändern
- [ ] Routing ändern
- [ ] Businesslogik ändern
- [ ] SQL ändern
- [ ] Daten migrieren
- [ ] Verhalten verändern

**CORE-001 ist ausschließlich ein Architektur-Enforcement-Release gemäß ADR-0001 und der HUI Constitution.**

---

*Generiert: CORE-001 — 2026-06-30*  
*Registry: `src/architecture/violations.js`*  
*Governance: `docs/governance/ADI.md`*
