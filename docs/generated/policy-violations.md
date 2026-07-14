# Policy Violations — ARCH-006

**Generiert:** 2026-06-30T16:18:31.265Z
**Gesamt:** 1090

## CRITICAL (811)

- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:324` — Core Write: 'stories' außerhalb Owner-Pfade in CREATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- **[CREATION]** `components/HuiCreateFlow.jsx:1570` — Core Write: 'stories' außerhalb Owner-Pfade in CREATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Core Write: 'works' außerhalb Owner-Pfade in CREATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- **[CREATION]** `components/HuiCreateFlow.jsx:1641` — Core Write: 'stories' außerhalb Owner-Pfade in CREATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[CREATION]** `components/HuiCreateFlow.jsx:1578` — Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[COMMUNICATION]** `components/NotificationCenter.jsx:853` — Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[COMMUNICATION]** `components/NotificationCenter.jsx:893` — Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[COMMUNICATION]** `components/NotificationCenter.jsx:919` — Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
  - Migration: Cross-Domain Write über Owner-Service delegieren
- **[COMMUNICATION]** `components/NotificationCenter.jsx:853` — Core Write: 'notifications' außerhalb Owner-Pfade in COMMUNICATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- **[COMMUNICATION]** `components/NotificationCenter.jsx:893` — Core Write: 'notifications' außerhalb Owner-Pfade in COMMUNICATION
  - Migration: Write in Domain-Service oder Core Engine verschieben
- ... und 791 weitere

## HIGH (159)

- **[KERNEL]** `App.jsx:346` — Direktes Routing via window.location ohne Action Engine
  - Migration: Action Engine statt direktem Routing
- **[KERNEL]** `App.jsx:7` — Domain Import Violation: KERNEL → WORLD (DOMAIN_IMPORT: KERNEL → WORLD nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:8` — Domain Import Violation: KERNEL → WORLD (DOMAIN_IMPORT: KERNEL → WORLD nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:9` — Domain Import Violation: KERNEL → INTELLIGENCE (DOMAIN_IMPORT: KERNEL → INTELLIGENCE nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:12` — Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:13` — Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:15` — Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:16` — Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:21` — Domain Import Violation: KERNEL → CONNECTION (DOMAIN_IMPORT: KERNEL → CONNECTION nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `App.jsx:28` — Domain Import Violation: KERNEL → IMPACT (DOMAIN_IMPORT: KERNEL → IMPACT nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[PRESENCE]** `components/CreatorPresence.jsx:6` — Domain Import Violation: PRESENCE → INTELLIGENCE (DOMAIN_IMPORT: PRESENCE → INTELLIGENCE nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `components/EmptyState.jsx:6` — Domain Import Violation: KERNEL → INTELLIGENCE (DOMAIN_IMPORT: KERNEL → INTELLIGENCE nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[KERNEL]** `components/ErrorBoundary.jsx:42` — Direktes Routing via window.location ohne Action Engine
  - Migration: Action Engine statt direktem Routing
- **[IDENTITY]** `components/HuiMembershipFlow.jsx:16` — Domain Import Violation: IDENTITY → WORLD (DOMAIN_IMPORT: IDENTITY → WORLD nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[CREATION]** `components/HuiMomentSheet.jsx:232` — DB Write 'beitraege' ohne Service-Ownership in CREATION
  - Migration: Service-Layer in Owner-Domain einführen
- **[WIRKUNG]** `components/HuiPlusSheet.jsx:9` — Domain Import Violation: WIRKUNG → WORLD (DOMAIN_IMPORT: WIRKUNG → WORLD nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[WIRKUNG]** `components/HuiPlusSheet.jsx:10` — Domain Import Violation: WIRKUNG → IDENTITY (import-forbidden: WIRKUNG → IDENTITY)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[WIRKUNG]** `components/OrbCompass.jsx:8` — Domain Import Violation: WIRKUNG → CREATION (import-forbidden: WIRKUNG → CREATION)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[WIRKUNG]** `components/OrbCompass.jsx:9` — Domain Import Violation: WIRKUNG → CONNECTION (DOMAIN_IMPORT: WIRKUNG → CONNECTION nicht in Contract)
  - Migration: Import-Richtung gemäß Contract korrigieren
- **[CREATION]** `components/StoryBar.jsx:258` — DB Write 'messages' ohne Service-Ownership in CREATION
  - Migration: Service-Layer in Owner-Domain einführen
- ... und 139 weitere

## MEDIUM (67)

- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:242` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:250` — Direkter DB-Read auf 'follows' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:254` — Direkter DB-Read auf 'follows' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:633` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:640` — Direkter DB-Read auf 'works' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:647` — Direkter DB-Read auf 'experiences' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:654` — Direkter DB-Read auf 'follows' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:989` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:990` — Direkter DB-Read auf 'works' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:991` — Direkter DB-Read auf 'experiences' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1081` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1084` — Direkter DB-Read auf 'works' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1087` — Direkter DB-Read auf 'experiences' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1090` — Direkter DB-Read auf 'beitraege' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1260` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1405` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1407` — Direkter DB-Read auf 'works' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1409` — Direkter DB-Read auf 'experiences' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1411` — Direkter DB-Read auf 'beitraege' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- **[DISCOVERY]** `components/home/header/SearchCommandCenter.jsx:1490` — Direkter DB-Read auf 'profiles' — erwäge Service-Layer
  - Migration: Siehe Domain Contract
- ... und 47 weitere

## LOW (3)

- **[KERNEL]** `App.jsx:null` — Registry Bypass: 22 hardcodierte Farbwerte
  - Migration: Logik in Service/Hook extrahieren
- **[KERNEL]** `design/hui.design.js:null` — Registry Bypass: 40 hardcodierte Farbwerte
  - Migration: Logik in Service/Hook extrahieren
- **[KERNEL]** `lib/ds.js:null` — Registry Bypass: 13 hardcodierte Farbwerte
  - Migration: Logik in Service/Hook extrahieren

## INFO (50)

- **[KERNEL]** `App.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `architecture/scanner/cli.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `architecture/scanner/domains.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `architecture/scanner/graphBuilder.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `architecture/scanner/metricsCalculator.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `architecture/scanner/reportGenerator.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/EmptyState.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/ErrorBoundary.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/LazyImage.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/ProtectedRoute.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/entry/AppEntryController.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/home/HomeShell.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/home/header/HomeHeader.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/home/navigation/BottomNav.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/home/navigation/NavItem.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/ui/EmptyState.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `components/ui/TalentBadge.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `config/SafeRender.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `config/safeMode.js:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- **[KERNEL]** `core/HuiConnectionEngine.jsx:1` — Fehlende Contract-Header: @domain=false @owner=false
  - Migration: Contract-Header und Ownership dokumentieren
- ... und 30 weitere
