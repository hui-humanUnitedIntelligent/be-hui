# HUI Dependency Graph

> **Automatisch generiert** — HUI Architecture Scanner (ARCH-001)
> **Datum:** 2026-06-30
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten `npm run architecture:audit` überschrieben.


## Dependency Graph (Top Dateien)

```mermaid
graph TD
  %% HUI Dependency Graph — ARCH-001
  %% Zeigt Datei-zu-Datei Abhängigkeiten (Top 50 nach Verbindungen)

  lib_supabaseClient["supabaseClient<br/>(41×)"]
  lib_supabaseClient["supabaseClient<br/>(29×)"]
  lib_AuthContext["AuthContext<br/>(23×)"]
  design_hui_design["hui.design<br/>(23×)"]
  lib_AuthContext["AuthContext<br/>(22×)"]
  design_hui_design["hui.design<br/>(16×)"]
  supabaseClient["supabaseClient<br/>(15×)"]
  services_db["db<br/>(10×)"]
  sentry[".sentry<br/>(10×)"]
  supabaseClient[".supabaseClient<br/>(8×)"]
  design_hui_interaction["hui.interaction<br/>(7×)"]
  AuthContext["AuthContext<br/>(7×)"]
  OrbConfig["OrbConfig<br/>(7×)"]
  lib_perfUtils["perfUtils<br/>(6×)"]
  lib_supabaseClient["supabaseClient<br/>(6×)"]
  lib_cleanup_cleanupOrbEnvironment["cleanupOrbEnvironment<br/>(5×)"]
  lib_profileUtils["profileUtils<br/>(5×)"]
  components_home_HomeShell["HomeShell<br/>(5×)"]
  hui_sources["hui.sources<br/>(5×)"]
  domains["domains<br/>(4×)"]
  BaseFeedCard["BaseFeedCard<br/>(4×)"]
  hooks_useProfileData["useProfileData<br/>(4×)"]
  ImpactTokens["ImpactTokens<br/>(4×)"]
  lib_AppStateContext["AppStateContext<br/>(3×)"]
  core_hui_actions["hui.actions<br/>(3×)"]
  services_db["db<br/>(3×)"]
  lib_usePresence["usePresence<br/>(3×)"]
  services_creatorEconomy["creatorEconomy<br/>(3×)"]
  ConnectionTypeSidebar["ConnectionTypeSidebar<br/>(3×)"]
  guidanceTokens["guidanceTokens<br/>(3×)"]

```

## Domain Graph

```mermaid
graph LR
  %% HUI Domain Graph — ARCH-001
  %% Zeigt Domain-zu-Domain Abhängigkeiten

  CORE["**Core**<br/>15 Dateien"]
  REGISTRY["**Registry**<br/>1 Dateien"]
  ROUTES["**Routes**<br/>1 Dateien"]
  SERVICES["**Services**<br/>75 Dateien"]
  SYSTEM["**System**<br/>47 Dateien"]
  HOOKS["**Hooks**<br/>6 Dateien"]
  CONTEXT["**Context**<br/>2 Dateien"]
  FEATURES["**Features**<br/>10 Dateien"]
  PAGES["**Pages**<br/>24 Dateien"]
  COMPONENTS["**Components**<br/>106 Dateien"]
  ARCHITECTURE["**Architecture**<br/>8 Dateien"]

  COMPONENTS --> SERVICES
  COMPONENTS --> FEATURES
  COMPONENTS --> SYSTEM
  COMPONENTS --> CORE
  COMPONENTS --> HOOKS
  COMPONENTS --> CONTEXT
  COMPONENTS --> PAGES
  FEATURES --> SERVICES
  CONTEXT --> SERVICES
  CORE --x COMPONENTS
  CORE --x SERVICES
  SYSTEM --> SERVICES
  SYSTEM --x COMPONENTS
  HOOKS --> SERVICES
  HOOKS --> CORE
  SERVICES --x COMPONENTS
  SERVICES --x FEATURES
  PAGES --> SERVICES
  PAGES --> HOOKS
  PAGES --> COMPONENTS
  PAGES --> FEATURES
  PAGES --> CORE
  PAGES --> CONTEXT
  PAGES --> SYSTEM
  SYSTEM --> CORE
  SYSTEM --x FEATURES
```

## Layer Graph

```mermaid
graph TB
  %% HUI Layer Graph — ARCH-001
  %% Zeigt die erlaubte Schichten-Hierarchie

  subgraph Layer0["Layer 0 — Foundation"]
    REGISTRY["📋 Registry<br/>(HuiRegistry)"]
    CORE["⚙️ Core Engines<br/>(coreEngine, orbEngine, resonanceEngine)"]
  end

  subgraph Layer1["Layer 1 — Routes"]
    ROUTES["🗺️ Route Registry<br/>(Shadow Mode)"]
  end

  subgraph Layer2["Layer 2 — Services"]
    SERVICES["🔧 Services<br/>(db.js, commerceEngine, lib/)"]
    SYSTEM["🌊 System<br/>(feed, orb, flows)"]
  end

  subgraph Layer3["Layer 3 — Logic"]
    HOOKS["🎣 Hooks"]
    CONTEXT["🌐 Context Provider"]
  end

  subgraph Layer4["Layer 4 — Features"]
    FEATURES["✨ Features"]
  end

  subgraph Layer5["Layer 5 — UI"]
    PAGES["📄 Pages"]
    COMPONENTS["🧩 Components"]
  end

  REGISTRY --> CORE
  CORE --> ROUTES
  CORE --> SERVICES
  CORE --> SYSTEM
  SERVICES --> HOOKS
  SERVICES --> CONTEXT
  SYSTEM --> HOOKS
  HOOKS --> FEATURES
  CONTEXT --> FEATURES
  FEATURES --> PAGES
  FEATURES --> COMPONENTS

  style REGISTRY fill:#FFD700,color:#000
  style CORE     fill:#16D7C5,color:#000
  style SERVICES fill:#FF8A6B,color:#fff
  style SYSTEM   fill:#8B5CF6,color:#fff
  style HOOKS    fill:#F59E0B,color:#000
  style CONTEXT  fill:#3B82F6,color:#fff
  style FEATURES fill:#10B981,color:#fff
  style PAGES    fill:#EC4899,color:#fff
  style COMPONENTS fill:#6366F1,color:#fff
```

## Service Graph

```mermaid
graph LR
  %% HUI Service Graph — ARCH-001
  %% Zeigt Tabellen-Zugriffsmuster pro Service


```

## Ownership Distribution

```mermaid
pie title Dateien mit Architektur-Header (@domain + @owner)

  "Mit Header (0)" : 0
  "Ohne Header (267)" : 267
```
