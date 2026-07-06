# HUI Architecture Report

> **Automatisch generiert** — HUI Architecture Scanner (ARCH-001)
> **Datum:** 2026-06-30
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten `npm run architecture:audit` überschrieben.


## Übersicht

| Metrik | Wert |
|---|---|
| Dateien total | 297 |
| Codezeilen total | 104,693 |
| Domains | 12 |
| Komponenten | 676 |
| Hooks | 109 |
| DB Reads | 327 |
| DB Writes | 171 |
| DB Tabellen | 75 |
| Direkte DB-Writes in UI | 68 |
| Duplicate Owners | 17 |
| Verstöße gesamt | **624** |
| CRITICAL | 🔴 42 |
| HIGH | 🟠 111 |
| MEDIUM | 🟡 181 |
| LOW | 🔵 23 |
| INFO | ⚪ 267 |

## Adoption

| System | Dateien | % |
|---|---|---|
| Action Engine | 11 | 4% |
| Core Engine | 9 | 4% |
| Registry | 7 | 2% |
| Ownership Coverage | 0 | 0% |
| Architecture Coverage | — | 10% |

## Domain-Übersicht

| Domain | Dateien | Zeilen | Komponenten | Hooks | DB Reads | DB Writes | Verstöße |
|---|---|---|---|---|---|---|---|
| UNKNOWN | 2 | 738 | 12 | 0 | 1 | 0 | 2 |
| Architecture | 8 | 1832 | 1 | 0 | 0 | 0 | 0 |
| Components | 106 | 38495 | 333 | 10 | 93 | 41 | 261 |
| Features | 10 | 2994 | 11 | 7 | 4 | 3 | 18 |
| Context | 2 | 346 | 1 | 2 | 0 | 0 | 2 |
| Core | 15 | 3778 | 3 | 10 | 12 | 4 | 17 |
| System | 47 | 12844 | 115 | 5 | 10 | 7 | 51 |
| Hooks | 6 | 1311 | 0 | 12 | 11 | 2 | 19 |
| Services | 75 | 20642 | 13 | 47 | 123 | 91 | 88 |
| Pages | 24 | 20149 | 187 | 16 | 73 | 24 | 147 |
| Registry | 1 | 812 | 0 | 0 | 0 | 0 | 1 |
| Routes | 1 | 752 | 0 | 0 | 0 | 0 | 1 |

## Top-Verstöße

| Schwere | Typ | Datei | Zeile | Nachricht |
|---|---|---|---|---|
| 🔴 CRITICAL | CORE_BYPASS | `components/TalentOnboarding.jsx` | 386 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/auth/ProfileCompletionFlow.jsx` | 89 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/auth/ProfileCompletionFlow.jsx` | 148 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/auth/ProfileCompletionFlow.jsx` | 175 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/settings/SettingsModal.jsx` | 115 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/settings/SettingsModal.jsx` | 154 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/settings/SettingsModal.jsx` | 187 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/settings/SettingsModal.jsx` | 261 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/studio/ImpactStimmenModal.jsx` | 172 | Core Bypass: Direkter Write auf Core-Tabelle 'impact_votes'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/studio/ProfilBearbeitenModal.jsx` | 178 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/studio/ProfilBearbeitenModal.jsx` | 198 | Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `components/studio/ProfilBearbeitenModal.jsx` | 200 | Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `hooks/useAmbassador.js` | 154 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/AuthContext.jsx` | 57 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/AuthContext.jsx` | 256 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/AuthContext.jsx` | 266 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/AuthContext.jsx` | 273 | Core Bypass: Direkter Write auf Core-Tabelle 'wirker_profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/AuthContext.jsx` | 380 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/profileMedia.js` | 82 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
| 🔴 CRITICAL | CORE_BYPASS | `lib/profileMedia.js` | 115 | Core Bypass: Direkter Write auf Core-Tabelle 'profiles'. Nutze Core Engine (coreEngine.js / resonanceEngine.js / orbEngine.js). |
