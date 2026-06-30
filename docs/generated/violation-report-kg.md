# HUI Violation Report (Knowledge Graph)

> Automatisch generiert — HUI Architecture Knowledge Graph (ARCH-002)
> ⚠️ Nicht manuell bearbeiten. Wird bei `npm run architecture:graph` überschrieben.

## Nach Severity

- **CRITICAL**: 42
- **HIGH**: 112
- **MEDIUM**: 185
- **LOW**: 23
- **INFO**: 267

## Nach Typ

- **MISSING_HEADER**: 267
- **DB_DIRECT_READ**: 185
- **DB_DIRECT_WRITE**: 71
- **CORE_BYPASS**: 42
- **REGISTRY_BYPASS**: 23
- **DUPLICATE_OWNER**: 17
- **LAYER_VIOLATION**: 16
- **DIRECT_ROUTING**: 8

## Top Violations

- [CRITICAL] `components/TalentOnboarding.jsx:386` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/auth/ProfileCompletionFlow.jsx:89` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/auth/ProfileCompletionFlow.jsx:148` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/auth/ProfileCompletionFlow.jsx:175` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/settings/SettingsModal.jsx:115` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/settings/SettingsModal.jsx:154` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/settings/SettingsModal.jsx:187` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/settings/SettingsModal.jsx:261` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/studio/ImpactStimmenModal.jsx:172` — Core Bypass: Direkter Write auf Core-Tabelle 'impact_votes'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/studio/ProfilBearbeitenModal.jsx:178` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/studio/ProfilBearbeitenModal.jsx:198` — Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `components/studio/ProfilBearbeitenModal.jsx:200` — Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `hooks/useAmbassador.js:154` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/AuthContext.jsx:57` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/AuthContext.jsx:256` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/AuthContext.jsx:266` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/AuthContext.jsx:273` — Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/AuthContext.jsx:380` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/profileMedia.js:82` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).
- [CRITICAL] `lib/profileMedia.js:115` — Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js).