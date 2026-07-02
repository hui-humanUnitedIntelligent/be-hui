# Rule Report

**Binding Rules:** 29

| ID | Title | Status | Authority | Priority |
|----|-------|--------|-----------|----------|
| GR-01 | Menschen sind keine Produkte. | Ratified | CONSTITUTION | 10 |
| GR-02 | Wirkung ist wichtiger als Aufmerksamkeit. | Ratified | CONSTITUTION | 10 |
| GR-03 | Verbinden ist wertvoller als Reichweite. | Ratified | CONSTITUTION | 10 |
| GR-04 | Wertschöpfung und Gemeinwohl gehören zusammen. | Ratified | CONSTITUTION | 10 |
| GR-05 | Der Orb zeigt keine Leistung. Er zeigt gelebte Wirkung. | Ratified | CONSTITUTION | 10 |
| GR-06 | Der Feed dient Orientierung. Nicht Sucht. | Ratified | CONSTITUTION | 10 |
| GR-07 | Die KI ergänzt Menschen. Sie ersetzt sie nicht. | Ratified | CONSTITUTION | 10 |
| GR-08 | Keine Gamification. Keine Belohnungssysteme. | Ratified | CONSTITUTION | 10 |
| GR-09 | Jede neue Funktion muss mindestens einen Grundpfeiler stärken. | Ratified | CONSTITUTION | 10 |
| GR-10 | Kurzfristiges Wachstum darf die Gemeinschaft nicht schädigen. | Ratified | CONSTITUTION | 10 |
| ARCH-PRINCIPLE-1 | Keine UI-Komponente besitzt eigene Wirkungslogik. | Ratified | CONSTITUTION | 10 |
| ARCH-PRINCIPLE-2 | Keine Engine besitzt eigene Sprache. | Ratified | CONSTITUTION | 10 |
| ARCH-PRINCIPLE-3 | Die Registry ist die Single Source of Meaning. | Ratified | CONSTITUTION | 10 |
| ARCH-PRINCIPLE-4 | Die Core Engine ist die Single Source of Truth. | Ratified | CONSTITUTION | 10 |
| ARCH-PRINCIPLE-5 | Der Datenfluss ist unidirektional. | Ratified | CONSTITUTION | 10 |
| CORE_BYPASS | Core tables via Core Engine only | Accepted | ADR-002 | 50 |
| DB_DIRECT_WRITE | No DB writes in UI layers | Accepted | ADR-002 | 50 |
| DB_DIRECT_READ | No direct DB reads in UI layers | Accepted | ADR-002 | 50 |
| LAYER_VIOLATION | RFC-000 import direction | Accepted | ADR-002 | 50 |
| DUPLICATE_OWNER | Single writer per table | Accepted | ADR-002 | 50 |
| DIRECT_ROUTING | Action Engine required for navigation | Accepted | ADR-002 | 50 |
| ACTION_ENGINE_GAP | navigate() via Action Engine | Accepted | ADR-002 | 50 |
| REGISTRY_BYPASS | HuiRegistry for colors/labels | Accepted | ADR-002 | 50 |
| MISSING_HEADER | @domain + @owner tags required | Accepted | ADR-002 | 50 |
| POLICY-REALTIME-RT-1 | .on() IMMER vor .subscribe() | Accepted | POLICY-REALTIME | 40 |
| POLICY-REALTIME-RT-2 | Jeder Channel hat exakt einen Owner | Accepted | POLICY-REALTIME | 40 |
| POLICY-REALTIME-RT-3 | Cleanup verpflichtend | Accepted | POLICY-REALTIME | 40 |
| POLICY-REALTIME-RT-4 | StrictMode-safe | Accepted | POLICY-REALTIME | 40 |
| POLICY-REALTIME-RT-5 | Reconnect-safe | Accepted | POLICY-REALTIME | 40 |