# Architecture Intent Report — ARCH-002.1

## Architecture Principles

- **Keine UI-Komponente besitzt eigene Wirkungslogik.**: Alle Wirkungsdaten kommen aus der Core Engine.
- **Keine Engine besitzt eigene Sprache.**: Alle Texte, Labels und Bezeichnungen kommen aus der Registry.
- **Die Registry ist die Single Source of Meaning.**: Kein Text wird doppelt definiert.
- **Die Core Engine ist die Single Source of Truth.**: Kein Modul pflegt eigene Wirkungsdaten.
- **Der Datenfluss ist unidirektional.**: Constitution → Registry → Engines → UI. Nie umgekehrt.

## Patterns

- **Core Engine Pattern**: Single Source of Truth für Wirkungsdaten
- **Action Engine Pattern**: Zentralisierte User-Intent-Ausführung via useHuiActions
- **Registry Pattern**: Single Source of Meaning für Texte und Semantik

## Decisions

- **ADR-001: Route Authority**: Zentrale Route Registry im Shadow Mode — dokumentiert in src/routes/registry.js