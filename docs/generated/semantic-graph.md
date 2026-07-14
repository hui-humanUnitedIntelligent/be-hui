# HUI Semantic Architecture Graphs — ARCH-002.1

> Autogeneriert. `~` = inferred confidence.

## Capability Graph

```mermaid
graph TD
  %% Capability Graph

  capability_identity["Identity"]
  capability_discovery["Discovery"]
  capability_feed["Feed"]
  capability_stories["Stories"]
  capability_works["Works"]
  capability_experiences["Experiences"]
  capability_messaging["Messaging"]
  capability_booking["Booking"]
  capability_payments["Payments"]
  capability_commerce["Commerce"]
  capability_impact["Impact"]
  capability_trust["Trust"]
  capability_orb["Orb"]
  capability_presence["Presence"]
  capability_community["Community"]
  capability_moderation["Moderation"]
  capability_notifications["Notifications"]
  capability_search["Search"]
  capability_profile["Profile"]
  capability_creator_economy["Creator Economy"]
  capability_creator_studio["Creator Studio"]
  capability_guardian["Guardian ~"]
  capability_administration["Administration"]
  capability_analytics["Analytics"]
  capability_settings["Settings"]
  capability_authentication["Authentication"]
  capability_media["Media"]
  capability_storage["Storage ~"]
  capability_matching["Matching"]
  capability_recommendations["Recommendations"]
  capability_navigation["Navigation"]
  capability_localization["Localization ~"]

```

## Journey Graph

```mermaid
graph TD
  %% Journey Graph

  journey_creator_onboarding["Creator Onboarding → Wirkung ~"]
  journey_discovery_to_resonance["Feed → Resonanz ~"]
  journey_creator_stages["Creator Journey Stages (Code)"]
  step_onboarding["Onboarding ~"]
  step_profile_create["Profil erstellen ~"]
  step_become_wirker["Wirker werden ~"]
  step_publish_work["Werk veröffentlichen ~"]
  step_receive_booking["Buchung erhalten ~"]
  step_chat["Chat ~"]
  step_payment["Bezahlung ~"]
  step_rating["Bewertung ~"]
  step_impact["Impact ~"]
  step_feed["Feed ~"]
  step_story["Story ~"]
  step_visit_profile["Profil ~"]
  step_view_work["Werk ~"]
  step_purchase["Kauf ~"]
  step_community["Community ~"]
  step_resonance["Resonanz ~"]
  journey_stage_discovery["Entdeckt"]
  journey_stage_profile["Profil besucht"]
  journey_stage_inquiry["Anfrage gesendet"]
  journey_stage_chat["Im Gespräch"]
  journey_stage_collaboration["Zusammenarbeit"]
  journey_stage_recommendation["Empfohlen"]
  journey_stage_repeat["Wiederkehrend"]

  journey_creator_onboarding -->|ENABLES| step_onboarding
  step_onboarding -->|ENABLES| step_profile_create
  step_profile_create -->|ENABLES| step_become_wirker
  step_become_wirker -->|ENABLES| step_publish_work
  step_publish_work -->|ENABLES| step_receive_booking
  step_receive_booking -->|ENABLES| step_chat
  step_chat -->|ENABLES| step_payment
  step_payment -->|ENABLES| step_rating
  step_rating -->|ENABLES| step_impact
  journey_discovery_to_resonance -->|ENABLES| step_feed
  step_feed -->|ENABLES| step_story
  step_story -->|ENABLES| step_visit_profile
  step_visit_profile -->|ENABLES| step_view_work
  step_view_work -->|ENABLES| step_purchase
  step_purchase -->|ENABLES| step_community
  step_community -->|ENABLES| step_resonance
  journey_creator_stages -->|ENABLES| journey_stage_discovery
  journey_stage_discovery -->|ENABLES| journey_stage_profile
  journey_stage_profile -->|ENABLES| journey_stage_inquiry
  journey_stage_inquiry -->|ENABLES| journey_stage_chat
  journey_stage_chat -->|ENABLES| journey_stage_collaboration
  journey_stage_collaboration -->|ENABLES| journey_stage_recommendation
  journey_stage_recommendation -->|ENABLES| journey_stage_repeat
```

## Meaning Graph

```mermaid
graph TD
  %% Meaning Graph

  intent_connect["connect"]
  intent_message["message"]
  intent_book["book"]
  intent_follow["follow"]
  intent_discover["discover"]
  intent_explore["explore"]
  intent_inspire["inspire"]
  intent_resonate["resonate"]
  intent_share["share"]
  intent_impact["impact"]
  intent_create["create"]
  intent_publish["publish"]
  intent_return["return"]
  intent_orient["orient"]
  meaning_lib_bookingContext_js["Warum bookingContext.js?"]
  meaning_registry_HuiRegistry_js["Warum HuiRegistry.js?"]
  meaning_core_hui_semantics_js["Warum hui.semantics.js?"]
  meaning_core_hui_actions_js["Warum hui.actions.js?"]
  meaning_routes_registry_js["Warum registry.js?"]
  meaning_lib_journeyContext_js["Warum journeyContext.js?"]

```

## Constitution Graph

```mermaid
graph TD
  %% Constitution Graph

  constitution_rule_1["Regel 1: Menschen sind keine Produkte."]
  constitution_rule_2["Regel 2: Wirkung ist wichtiger als Aufmerksamkeit."]
  constitution_rule_3["Regel 3: Verbinden ist wertvoller als Reichweite."]
  constitution_rule_4["Regel 4: Wertschöpfung und Gemeinwohl gehören zusammen."]
  constitution_rule_5["Regel 5: Der Orb zeigt keine Leistung. Er zeigt gelebte Wirkung."]
  constitution_rule_6["Regel 6: Der Feed dient Orientierung. Nicht Sucht."]
  constitution_rule_7["Regel 7: Die KI ergänzt Menschen. Sie ersetzt sie nicht."]
  constitution_rule_8["Regel 8: Keine Gamification. Keine Belohnungssysteme."]
  constitution_rule_9["Regel 9: Jede neue Funktion muss mindestens einen Grundpfeiler stärken."]
  constitution_rule_10["Regel 10: Kurzfristiges Wachstum darf die Gemeinschaft nicht schädigen."]
  invariant_unidirectional_dataflow["Unidirektionaler Datenfluss"]
  invariant_no_ui_impact_logic["Keine UI-Wirkungslogik"]
  invariant_registry_single_meaning["Registry ist Single Source of Meaning"]
  mission_hui["HUI Mission"]

  constitution_rule_1 -->|DERIVED_FROM| mission_hui
  constitution_rule_2 -->|DERIVED_FROM| mission_hui
  constitution_rule_3 -->|DERIVED_FROM| mission_hui
  constitution_rule_4 -->|DERIVED_FROM| mission_hui
  constitution_rule_5 -->|DERIVED_FROM| mission_hui
  constitution_rule_6 -->|DERIVED_FROM| mission_hui
  constitution_rule_7 -->|DERIVED_FROM| mission_hui
  constitution_rule_8 -->|DERIVED_FROM| mission_hui
  constitution_rule_9 -->|DERIVED_FROM| mission_hui
  constitution_rule_10 -->|DERIVED_FROM| mission_hui
```

## Human Principle Graph

```mermaid
graph TD
  %% Human Principle Graph

  human_principle_ruhig["Ruhig"]
  human_principle_warm["Warm"]
  human_principle_organisch["Organisch"]
  human_principle_ehrlich["Ehrlich"]
  human_principle_zeitlos["Zeitlos"]
  human_principle_menschlich["Menschlich"]
  human_principle_hochwertig["Hochwertig"]
  human_principle_minimalistisch["Minimalistisch"]

```

## Platform Goal Graph

```mermaid
graph TD
  %% Platform Goal Graph

  platform_goal_verbinden["Verbinden"]
  platform_goal_unterst_tzen["Unterstützen"]
  platform_goal_erschaffen["Erschaffen"]
  platform_goal_wertsch_pfen["Wertschöpfen"]
  platform_goal_impact["Impact"]

```

## Feature Intent Graph

```mermaid
graph TD
  %% Feature Intent Graph


```

## Architecture Principle Graph

```mermaid
graph TD
  %% Architecture Principle Graph

  architecture_principle_1["Keine UI-Komponente besitzt eigene Wirkungslogik."]
  architecture_principle_2["Keine Engine besitzt eigene Sprache."]
  architecture_principle_3["Die Registry ist die Single Source of Meaning."]
  architecture_principle_4["Die Core Engine ist die Single Source of Truth."]
  architecture_principle_5["Der Datenfluss ist unidirektional."]

```

## Quality Attribute Graph

```mermaid
graph TD
  %% Quality Attribute Graph

  quality_vertrauen["Vertrauen ~"]
  quality_resonanz["Resonanz ~"]
  quality_wirkung["Wirkung ~"]
  quality_bestand["Bestand ~"]
  quality_menschlichkeit["Menschlichkeit ~"]

```

## Semantic Dependency Graph

```mermaid
graph TD
  %% Semantic Dependency Graph

  capability_identity["Identity"]
  capability_discovery["Discovery"]
  capability_feed["Feed"]
  capability_stories["Stories"]
  capability_works["Works"]
  capability_experiences["Experiences"]
  capability_messaging["Messaging"]
  capability_booking["Booking"]
  capability_payments["Payments"]
  capability_commerce["Commerce"]
  capability_impact["Impact"]
  capability_trust["Trust"]
  capability_orb["Orb"]
  capability_presence["Presence"]
  capability_community["Community"]
  file_lib_ErrorBoundaries_jsx["ErrorBoundaries.jsx"]
  file_lib_AuthContext_jsx["AuthContext.jsx"]
  file_context_WorldSurfaceContext_jsx["WorldSurfaceContext.jsx"]
  file_context_OrbWorldContext_jsx["OrbWorldContext.jsx"]
  file_pages_LoginPage_jsx["LoginPage.jsx"]
  file_components_auth_AuthGate_jsx["AuthGate.jsx"]
  file_components_auth_ProfileCompletionFlow_jsx["ProfileCompletionFlow.jsx"]
  file_pages_AuthCallback_jsx["AuthCallback.jsx"]
  file_lib_referralTracking_js["referralTracking.js"]
  file_pages_ImpactPage_jsx["ImpactPage.jsx"]
  file_architecture_scanner_metricsCalculator_js["metricsCalculator.js"]
  file_architecture_semantic_reportGenerator_js["reportGenerator.js"]
  file_architecture_scanner_reportGenerator_js["reportGenerator.js"]
  file_components_CreatorPresence_jsx["CreatorPresence.jsx"]
  file_lib_intelligence_emotionalIdentity_js["emotionalIdentity.js"]

  file_components_CreatorPresence_jsx -->|REALIZES| capability_presence
  file_components_auth_AuthGate_jsx -->|REALIZES| capability_identity
  file_components_auth_ProfileCompletionFlow_jsx -->|REALIZES| capability_identity
  file_context_OrbWorldContext_jsx -->|REALIZES| capability_orb
  file_context_OrbWorldContext_jsx -->|REALIZES| capability_presence
  file_context_WorldSurfaceContext_jsx -->|REALIZES| capability_presence
  file_lib_AuthContext_jsx -->|REALIZES| capability_identity
  file_lib_ErrorBoundaries_jsx -->|REALIZES| capability_orb
  file_lib_intelligence_emotionalIdentity_js -->|REALIZES| capability_identity
  file_pages_AuthCallback_jsx -->|REALIZES| capability_identity
  file_pages_ImpactPage_jsx -->|REALIZES| capability_impact
  file_pages_LoginPage_jsx -->|REALIZES| capability_identity
  file_lib_AuthContext_jsx -->|IMPLEMENTS| capability_identity
  file_lib_ErrorBoundaries_jsx -->|IMPLEMENTS| capability_orb
  file_lib_intelligence_emotionalIdentity_js -->|IMPLEMENTS| capability_identity
```
