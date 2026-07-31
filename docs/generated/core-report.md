# HUI Core Engine Report

> **Automatisch generiert** — HUI Architecture Scanner (ARCH-001)
> **Datum:** 2026-06-30
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten `npm run architecture:audit` überschrieben.


## Adoption: 4%

9 Dateien nutzen Core Engines.

## Core Engine Verwendung

| Datei | Uses |
|---|---|
| `hooks/useCoreEngine.js` | 6 |
| `core/resonanceEngine.js` | 4 |
| `architecture/scanner/violationDetector.js` | 3 |
| `core/orbEngine.js` | 3 |
| `components/orb/OrbLeaf.jsx` | 2 |
| `core/coreEngine.js` | 2 |
| `registry/HuiRegistry.js` | 2 |
| `components/profile/OrbSignatur.jsx` | 1 |
| `system/feed/unifiedNormalizer.js` | 1 |

## DB-Zugriffe auf Core-Tabellen

| Datei | Tabelle | Operation | Zeile |
|---|---|---|---|
| `App.jsx` | profiles | SELECT | 462 |
| `components/HuiMatchOverlay.jsx` | profiles | SELECT | 355 |
| `components/HuiMatchOverlay.jsx` | profiles | SELECT | 413 |
| `components/ProtectedRoute.jsx` | profiles | SELECT | 64 |
| `components/TalentOnboarding.jsx` | profiles | UPDATE | 386 |
| `components/auth/ProfileCompletionFlow.jsx` | profiles | UPDATE | 89 |
| `components/auth/ProfileCompletionFlow.jsx` | profiles | UPDATE | 148 |
| `components/auth/ProfileCompletionFlow.jsx` | profiles | UPDATE | 175 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 242 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 633 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 989 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 1081 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 1260 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 1405 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 1490 |
| `components/home/header/SearchCommandCenter.jsx` | profiles | SELECT | 1701 |
| `components/settings/SettingsModal.jsx` | profiles | UPDATE | 115 |
| `components/settings/SettingsModal.jsx` | profiles | UPDATE | 154 |
| `components/settings/SettingsModal.jsx` | profiles | UPDATE | 187 |
| `components/settings/SettingsModal.jsx` | profiles | UPDATE | 261 |
| `components/studio/HuiStudio.jsx` | profiles | SELECT | 295 |
| `components/studio/HuiStudio.jsx` | profiles | SELECT | 307 |
| `components/studio/HuiStudio.jsx` | profiles | SELECT | 351 |
| `components/studio/HuiStudio.jsx` | profiles | SELECT | 626 |
| `components/studio/ImpactStimmenModal.jsx` | impact_votes | SELECT | 117 |
| `components/studio/ImpactStimmenModal.jsx` | impact_votes | INSERT | 172 |
| `components/studio/MeineProjekteModal.jsx` | impact_votes | SELECT | 88 |
| `components/studio/ProfilBearbeitenModal.jsx` | wirker_profiles | SELECT | 104 |
| `components/studio/ProfilBearbeitenModal.jsx` | profiles | SELECT | 134 |
| `components/studio/ProfilBearbeitenModal.jsx` | profiles | UPDATE | 178 |
| `components/studio/ProfilBearbeitenModal.jsx` | wirker_profiles | INSERT | 198 |
| `components/studio/ProfilBearbeitenModal.jsx` | wirker_profiles | INSERT | 200 |
| `components/studio/StatistikenModal.jsx` | impact_votes | SELECT | 107 |
| `components/studio/StatistikenModal.jsx` | profiles | SELECT | 118 |
| `features/discovery/userSearch.js` | profiles | SELECT | 65 |
| `features/discovery/userSearch.js` | profiles | SELECT | 120 |
| `features/discovery/userSearch.js` | profiles | SELECT | 130 |
| `feed/UnifiedFeed.jsx` | profiles | SELECT | 59 |
| `feed/UnifiedFeed.jsx` | profiles | SELECT | 61 |
| `hooks/useAmbassador.js` | profiles | SELECT | 146 |
| `hooks/useAmbassador.js` | profiles | UPDATE | 154 |
| `hooks/useAmbassador.js` | profiles | SELECT | 191 |
| `hooks/useAmbassador.js` | profiles | SELECT | 201 |
| `hooks/useProfileData.js` | wirker_profiles | SELECT | 135 |
| `lib/AppStateContext.jsx` | profiles | SELECT | 113 |
| `lib/AppStateContext.jsx` | profiles | SELECT | 173 |
| `lib/AuthContext.jsx` | profiles | UPSERT | 57 |
| `lib/AuthContext.jsx` | profiles | UPSERT | 256 |
| `lib/AuthContext.jsx` | profiles | UNKNOWN | 266 |
| `lib/AuthContext.jsx` | wirker_profiles | UPSERT | 273 |
| `lib/AuthContext.jsx` | profiles | UPDATE | 380 |
| `lib/chatContext.js` | profiles | SELECT | 434 |
| `lib/community/local.js` | profiles | SELECT | 48 |
| `lib/discovery/index.js` | profiles | SELECT | 60 |
| `lib/discovery/index.js` | profiles | SELECT | 187 |
| `lib/presence/index.js` | profiles | SELECT | 511 |
| `lib/profileMedia.js` | profiles | UPDATE | 82 |
| `lib/profileMedia.js` | profiles | UPDATE | 115 |
| `lib/referralTracking.js` | profiles | SELECT | 118 |
| `lib/referralTracking.js` | profiles | SELECT | 128 |
| `lib/referralTracking.js` | profiles | UPDATE | 143 |
| `lib/roles/index.js` | profiles | UPDATE | 148 |
| `lib/roles/index.js` | profiles | UPDATE | 164 |
| `lib/safeQuery.js` | profiles | SELECT | 13 |
| `lib/sessionHooks.js` | profiles | SELECT | 149 |
| `lib/sessionHooks.js` | profiles | UPDATE | 188 |
| `lib/trust/index.js` | profiles | SELECT | 164 |
| `lib/usePresence.js` | profiles | UPDATE | 33 |
| `pages/BasisProfilePage.jsx` | profiles | UPDATE | 401 |
| `pages/BasisProfilePage.jsx` | profiles | UPDATE | 410 |
| `pages/BasisProfilePage.jsx` | profiles | UPDATE | 419 |
| `pages/BasisProfilePage.jsx` | profiles | UPDATE | 429 |
| `pages/CreatorStudio.jsx` | profiles | SELECT | 107 |
| `pages/DiscoverPage.jsx` | profiles | SELECT | 1434 |
| `pages/DiscoverPage.jsx` | impact_pool | SELECT | 1565 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 185 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 290 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 423 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 497 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 506 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 517 |
| `pages/ImpactPage.jsx` | impact_votes | INSERT | 537 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 942 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 988 |
| `pages/ImpactPage.jsx` | impact_votes | SELECT | 1030 |
| `pages/LoginPage.jsx` | profiles | SELECT | 398 |
| `pages/LoginPage.jsx` | profiles | SELECT | 454 |
| `pages/LoginPage.jsx` | profiles | SELECT | 486 |
| `pages/LoginPage.jsx` | profiles | UPSERT | 552 |
| `pages/MyBasisProfile.jsx` | profiles | UPDATE | 546 |
| `pages/MyCreatorDashboard.jsx` | profiles | SELECT | 698 |
| `pages/MyCreatorDashboard.jsx` | profiles | UPDATE | 787 |
| `pages/TalentProfilePage.jsx` | profiles | UPDATE | 1161 |
| `pages/TalentProfilePage.jsx` | profiles | UPDATE | 1172 |
| `pages/TalentProfilePage.jsx` | profiles | UPDATE | 1187 |
| `pages/TalentProfilePage.jsx` | profiles | UPDATE | 1199 |
| `pages/studio/MeineResonanz.jsx` | impact_votes | SELECT | 179 |
| `services/content.js` | profiles | SELECT | 455 |
| `services/db.js` | profiles | SELECT | 57 |
| `services/db.js` | profiles | SELECT | 64 |
| `services/db.js` | profiles | UPDATE | 71 |
| `services/db.js` | profiles | UPSERT | 84 |
| `services/db.js` | profiles | SELECT | 95 |
| `services/db.js` | profiles | SELECT | 104 |
| `services/db.js` | wirker_profiles | SELECT | 147 |
| `services/db.js` | wirker_profiles | SELECT | 155 |
| `services/db.js` | wirker_profiles | SELECT | 161 |
| `services/db.js` | wirker_profiles | UPDATE | 170 |
| `services/db.js` | wirker_profiles | INSERT | 185 |
| `services/db.js` | impact_votes | SELECT | 495 |
| `services/db.js` | impact_votes | SELECT | 514 |
| `services/db.js` | impact_votes | INSERT | 531 |
| `services/db.js` | profiles | SELECT | 656 |
