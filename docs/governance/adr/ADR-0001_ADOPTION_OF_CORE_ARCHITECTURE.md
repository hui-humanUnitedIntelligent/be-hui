# ADR-0001 — Adoption of the Core Architecture

> **HUI Architecture Council — Architecture Decision Record**  
> **Status:** Draft → Council Review  
> **Datum:** 2026-06-30  
> **Typ:** Architekturentscheidung (keine Release Specification, keine Code-Änderung, keine Produktentscheidung)

---

## Meta

| Feld | Wert |
|---|---|
| ADR-ID | ADR-0001 |
| Titel | Adoption of the Core Architecture |
| Autor | HUI Architecture Council |
| RFC | RFC-000 (Domain Model, strukturell), RFC-000A (Governance-Rahmen) |
| Domain | Core (übergreifend — Plattformfundament) |
| Constitution-Check | `passed` |
| Supersedes | — (erste offizielle Architekturentscheidung des Councils) |
| Related ADRs | ADR-001 (Route Authority — Shadow Registry, NAV-001B) |

**Abgrenzung:** Dieser ADR ratifiziert die technische Grundarchitektur der HUI-Plattform. Er trifft keine Produktentscheidungen, spezifiziert keine Releases und verändert keinen Code. Er ist die verbindliche Referenz für alle nachfolgenden Architekturentscheidungen.

---

## 1. Executive Summary

### Warum wird dieser ADR benötigt?

Die HUI-Plattform verfügt über eine starke philosophische Grundlage ([`HUI_CONSTITUTION.md`](../../../HUI_CONSTITUTION.md)), eine operative Semantik-Schicht ([`src/registry/HuiRegistry.js`](../../../src/registry/HuiRegistry.js)), eine Wirkungs-Engine ([`src/core/coreEngine.js`](../../../src/core/coreEngine.js)) und umfangreiche Architektur-Dokumentation ([`docs/ARCHITECTURE_INDEX.md`](../../ARCHITECTURE_INDEX.md)). Diese Bestandteile existieren jedoch **ohne formale, ratifizierte Architekturentscheidung**, die sie als verbindliches Gesamtmodell zusammenführt.

Ohne ADR-0001 entstehen folgende Risiken:

- **Interpretationsspielraum** — Teams implementieren gegen unterschiedliche mentale Modelle derselben Architektur.
- **Architekturdrift** — Legacy-Muster (direkte DB-Writes in UI, doppelte State-Owner) werden als akzeptabel missverstanden.
- **Governance-Lücke** — [`RFC-000A`](../RFC-000A_ARCHITECTURE_GOVERNANCE.md) definiert *wie* entschieden wird; es fehlt die erste Entscheidung *was* gilt.
- **Generationsverlust** — In zehn Jahren ist nicht nachvollziehbar, welche Schichten unveränderlich sind und welche bewusst offen bleiben.

### Welches Problem löst er?

ADR-0001 löst das Problem der **fehlenden architektonischen Ratifizierung**. Er transformiert implizite Konventionen in explizite, überprüfbare Verpflichtungen:

1. Das **Schichtenmodell** Constitution → Registry → Core → Engines → UI wird verbindlich.
2. Die **Domänengrenzen** und Ownership-Regeln werden architektonisch festgeschrieben.
3. **Architektur-Invarianten** werden definiert und durchsetzbar gemacht.
4. Der **Scope** zukünftiger Entscheidungen wird klar abgegrenzt.
5. **Bewusst offene Punkte** werden dokumentiert, statt stillschweigend ignoriert.

Dieser ADR ist die erste Referenz jeder zukünftigen Architekturentscheidung innerhalb der HUI-Plattform.

---

## 2. Context

### 2.1 Bisheriger Zustand

HUI wurde iterativ aufgebaut — von Phase-3-Contexts (Booking, Chat, Trust) über Action Contracts (Phase 2) bis zur Core Engine (Phase 1) und Constitution-Ratifizierung (2026-06-29). Der aktuelle Zustand:

| Schicht | Existiert | Formal ratifiziert | Vollständig umgesetzt |
|---|---|---|---|
| Constitution | ✅ v1.1 | ✅ | ✅ (philosophisch) |
| Registry (Meaning) | ✅ v1.0 | ⚠️ implizit | ✅ (Sprache, PILLARS) |
| Core Engine (Truth) | ✅ Phase 1 | ❌ | ⚠️ teilweise |
| Resonance / Orb / Feed Engines | ✅ | ❌ | ⚠️ teilweise |
| Action Contracts | ✅ v1 | ❌ | ⚠️ teilweise |
| Domain Model (RFC-000) | ⚠️ verteilt | ❌ | — |
| Domain Charters | ❌ | ❌ | — |
| System Ownership | ✅ Audit 4A.1 | ❌ | ❌ (Drift vorhanden) |
| Architecture Governance | ✅ RFC-000A Draft | ❌ | — |

### 2.2 Architekturprobleme

**P1 — Verteilte Wahrheit:**  
[`docs/SYSTEM_OWNERSHIP.md`](../../SYSTEM_OWNERSHIP.md) dokumentiert kritische Abweichungen: direkte DB-Writes in UI-Komponenten (`WorkDetailPage.jsx`, `MeinHUI_SubPages.jsx`), doppelte State-Owner (z. B. 19 Profil-States), Legacy-Hooks ohne Nutzung.

**P2 — Umgekehrter Datenfluss:**  
Die Constitution definiert unidirektionalen Fluss (Constitution → Registry → Core → UI). In der Praxis schreiben UI-Komponenten direkt in Supabase-Tabellen und halten parallele lokale States.

**P3 — Semantische Duplikation:**  
`PILLARS` existieren in `coreEngine.js` und `HuiRegistry.js` (mit Re-Export über `hui.pillars.js`). Texte und Labels werden teilweise noch hardcodiert statt aus `LANG` gelesen.

**P4 — Fehlende Domänenverträge:**  
Domänen (Feed, Commerce, Chat, Trust, Presence) sind de facto vorhanden, aber ohne Domain Charter, ohne explizite Schnittstellen-Verträge und ohne formale Abhängigkeitsregeln.

**P5 — Governance ohne Fundament-Entscheidung:**  
RFC-000A definiert Prozesse (RFC → ADR → Release), aber keine ADR beschreibt bisher, welche Architektur verbindlich gilt. ADR-001 (Route Authority) existiert als Code-Kommentar in [`src/routes/registry.js`](../../../src/routes/registry.js), ist aber domänenspezifisch und nicht als Council-ADR ratifiziert.

### 2.3 Warum reicht die bisherige Dokumentation nicht aus?

| Dokument | Stärke | Lücke |
|---|---|---|
| Constitution | Philosophie, Goldene Regeln, Schichtendiagramm | Keine technische Durchsetzbarkeit; keine Domänengrenzen |
| Architecture Index | Modulverzeichnis, Querverweise | Kein Entscheidungsstatus; keine Invarianten |
| System Ownership | Konkrete Owner-Tabelle | Audit-Snapshot, nicht verbindlich; listet Probleme, löst sie nicht |
| CODEBASE.md | Aktive Systeme, Legacy-Markierung | Operative Landkarte, keine Architekturverpflichtung |
| RFC-000A | Governance-Prozess | Definiert *wie*, nicht *was* |
| HUI_ACTION_CONTRACTS | Interaktionsverträge | Nur UI-Flow-Ebene, nicht Plattformfundament |

**Fazit:** Die Dokumentation beschreibt *was existiert*. ADR-0001 entscheidet *was verbindlich gilt*.

---

## 3. Decision

### 3.1 Kerntext der Entscheidung

> **Der HUI Architecture Council ratifiziert das Core Architecture Model als verbindliche technische Grundlage der gesamten HUI-Plattform.**

Das Modell besteht aus fünf Schichten, zwölf Domänen, einem unidirektionalen Datenfluss und einem Contract-First-Interaktionsmodell — abgeleitet aus der Constitution und operationalisiert durch Registry und Core Engine.

### 3.2 Was wird angenommen?

| # | Annahme | Begründung |
|---|---|---|
| A1 | Die **HUI Constitution v1.1** ist Level-0-Fundament aller Architektur | Bereits ratifiziert; philosophisch korrekt positioniert |
| A2 | Die **HUI Registry** ist Single Source of Meaning (Sprache, Semantik, Terminologie) | [`HuiRegistry.js`](../../../src/registry/HuiRegistry.js) implementiert dies operativ |
| A3 | Die **Core Engine** ist Single Source of Truth für Wirkungsdaten | [`coreEngine.js`](../../../src/core/coreEngine.js) — Signale, Profile, Klassifizierung |
| A4 | **Engines lesen, UI rendert** — keine Wirkungslogik in UI | Constitution Abschnitt IV |
| A5 | **Fünf Grundpfeiler** sind das einzige Wirkungs-Taxonomie-Modell | DB-Enum `hui_pillar`, Registry, Core Engine |
| A6 | **Action Contracts** sind der einzige zulässige UI-Interaktionskanal für Navigation und Flow | [`hui.contracts.js`](../../../src/core/hui.contracts.js) |
| A7 | **Single Ownership** pro Datensystem — ein Owner schreibt, viele lesen | [`SYSTEM_OWNERSHIP.md`](../../SYSTEM_OWNERSHIP.md) als Ausgangspunkt |
| A8 | **Domain Model** mit 12 initialen Domänen (siehe §3.2.1) | De-facto-Struktur aus Architecture Index |
| A9 | **Governance-Flow** gemäß RFC-000A für alle signifikanten Architekturänderungen | RFC vor ADR, ADR vor Release |
| A10 | **Keine Gamification, keine Rankings, keine Aufmerksamkeitsoptimierung** als Architekturziel | Constitution Regeln 2, 3, 8 |

#### 3.2.1 Ratifiziertes Domain Model (Auszug — RFC-000 strukturell)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HUI DOMAIN MODEL v1.0                            │
│                    (strukturell ratifiziert durch ADR-0001)              │
└─────────────────────────────────────────────────────────────────────────┘

  Level 0 — Philosophie
  ┌──────────────┐
  │ Constitution │
  └──────┬───────┘
         │
  Level 1 — Semantik & Wirkung (Kern)
  ┌──────────────┐     ┌──────────────┐
  │   Registry   │────►│     Core     │
  │  (Meaning)   │     │   (Truth)    │
  └──────┬───────┘     └──────┬───────┘
         │                    │
  Level 2 — Wirkungs-Engines   │
  ┌──────────┬──────────┬─────┴────┬──────────┬──────────┐
  │ Resonance│   Orb    │   Feed   │Intelligence│ Commerce │
  └──────────┴──────────┴──────────┴──────────┴──────────┘
         │
  Level 3 — Soziale & operative Domänen
  ┌──────────┬──────────┬──────────┬──────────┬──────────┐
  │   Auth   │   Chat   │  Trust   │ Presence │ Discovery│
  └──────────┴──────────┴──────────┴──────────┴──────────┘
         │
  Level 4 — Darstellung
  ┌──────────────────────────────────────────────────────────┐
  │  UI (React) — Darstellung, keine Wirkungsautorität        │
  └──────────────────────────────────────────────────────────┘
```

**Domänen-Matrix (Initial):**

| Domäne | Mission (Kurz) | Datenbesitz (Owner) | Liest von |
|---|---|---|---|
| **Registry** | Single Source of Meaning | `HuiRegistry.js` | Constitution |
| **Core** | Single Source of Truth (Wirkung) | `coreEngine.js` | Registry |
| **Resonance** | Tiefe Begegnung, keine Like-Logik | `resonanceEngine.js` | Core |
| **Orb** | Symbol gelebter Wirkung | `orbEngine.js`, `orbLayer.js` | Core, Registry |
| **Feed** | Orientierung, nicht Sucht | `useFeedStream.js` | Core, Registry |
| **Intelligence** | Assistive KI, nicht manipulativ | `lib/intelligence/*` | Core, Registry |
| **Commerce** | Sanfte Ökonomie | `commerceEngine.js`, Edge Functions | Core |
| **Auth** | Identität und Session | `AuthContext.jsx` | — |
| **Chat** | Verbindung ermöglichen | `chatContext.js` | Auth |
| **Trust** | Reputation ohne Ranking | `trustContext.js` | Core, Commerce |
| **Presence** | Menschliche Anwesenheit | `sessionHooks.js` | Auth |
| **Discovery** | Sinnvolle Begegnungen | `DiscoveryFeed.jsx` | Core, Trust, Feed |

### 3.3 Was wird verbindlich?

Ab Ratifizierung dieses ADR gelten folgende Verpflichtungen für **alle** zukünftigen Implementierungen, Reviews und Architekturentscheidungen:

| ID | Verbindliche Regel |
|---|---|
| **V1** | Datenfluss ist **unidirektional**: Constitution → Registry → Core/Engines → UI. Kein Rückkanal. |
| **V2** | **Keine UI-Komponente** besitzt eigene Wirkungslogik oder schreibt Wirkungsdaten. |
| **V3** | **Keine Engine** definiert eigene Sprache — alle Texte aus Registry (`LANG`, `REGISTRY`). |
| **V4** | **Jedes Datensystem** hat genau einen Owner mit Schreibrecht (Single Ownership). |
| **V5** | **Domänenübergreifende Kommunikation** erfolgt ausschließlich über definierte Contracts (Actions, Hooks, Events). |
| **V6** | **Neue Features** müssen die Constitution-Entscheidungsregel (5 Fragen) bestehen. |
| **V7** | **Signifikante Architekturänderungen** erfordern RFC → ADR gemäß RFC-000A. |
| **V8** | **Wirkungssignale** werden ausschließlich über `CoreEngine.signals.record()` erfasst — nicht über UI-Metriken. |
| **V9** | **Grundpfeiler-Enum** (`hui_pillar`) ist die einzige Wirkungs-Taxonomie — keine parallelen Klassifizierungssysteme. |
| **V10** | **PR-Reviews** prüfen Constitution-Anhang-Checkliste bei Feature-PRs. |

### 3.4 Was wird eingefroren?

Nach **Architecture Approved** und anschließendem **LOCKED**-Status (empfohlen: nach 2 stabilen Releases) werden folgende Elemente terminal geschützt:

| Element | LOCKED-Inhalt | Änderung nur via |
|---|---|---|
| **Constitution** | Mission, Grundpfeiler, Goldene Regeln | Explizite Ratifizierung + Versions-Bump |
| **Grundpfeiler-Enum** | 5 Werte: `verbinden`, `unterstuetzen`, `erschaffen`, `wertschoepfen`, `impact` | RFC + ADR + DB-Migration |
| **Schichtenmodell** | 5-Schichten-Hierarchie (Constitution → UI) | RFC + Council-Ratifizierung |
| **Registry-Semantik** | `PILLARS`, `PILLAR_LIST`, `LANG`-Verbote | RFC + ADR |
| **Core Signal-Taxonomie** | `SIGNAL_TYPES`, `SIGNAL_CATEGORIES`, `SIGNAL_MAP` | RFC + ADR + Migration |
| **Architektur-Invarianten** (§6) | Alle INV-* Regeln | RFC + ADR |
| **ADR-0001 selbst** | Diese Entscheidung | RFC + explizite Deprecation |

**Hinweis:** LOCKED ist ein **Status**, kein sofortiger Zustand. Bis LOCKED gilt: Änderungen nur via RFC → ADR.

### 3.5 Was bleibt bewusst offen?

| Thema | Status | Begründung |
|---|---|---|
| **Vollständige Domain Charters** | Offen — sukzessive Erstellung | ADR-0001 definiert Domänen, Charters folgen als separate Artefakte |
| **RFC-000 als eigenständiges Dokument** | Offen — strukturell in ADR-0001 enthalten | Separate Publikation in `docs/governance/domain-model/` geplant |
| **CORE Domain Charter v1.0** | Offen — Inhalt in §3.2.1 und §6 definiert | Formale Charter-Datei folgt |
| **Migration bestehender Legacy-Writes** | Offen — priorisiert, nicht blockierend für Ratifizierung | Erfordert Release Specifications pro Domäne |
| **Route Registry Autorität** | Offen — ADR-001 Shadow Mode | NAV-002/003 Migration noch nicht entschieden |
| **Ranking-Gewichte in Discovery** | Offen — philosophisch definiert, technisch nicht final | [`RANKING_PHILOSOPHY.md`](../../RANKING_PHILOSOPHY.md) ist Orientierung, kein Architekturvertrag |
| **Realtime Channel Konsolidierung** | Offen | [`REALTIME_REGISTRY.md`](../../REALTIME_REGISTRY.md) — Legacy-Channels noch aktiv |
| **Federation / Multi-Instance** | Offen | Zukünftige Skalierung — nicht Teil des Kernmodells v1 |
| **Governance-Stufe (S0–S4)** | Offen — aktuell S0/S1 | Team skaliert; RFC-000A Stufenmodell gilt |

---

## 4. Scope

### 4.1 Was gilt innerhalb dieses ADR?

| Gilt | Beschreibung |
|---|---|
| ✅ Schichtenmodell | Constitution → Registry → Core → Engines → UI |
| ✅ Domain Model v1.0 | 12 Domänen mit Mission, Owner, Abhängigkeiten |
| ✅ Architekturprinzipien | §5 — abgeleitete Verpflichtungen |
| ✅ Architektur-Invarianten | §6 — unveränderliche Regeln |
| ✅ Ownership-Grundsätze | Single Ownership, Consumer-Pattern |
| ✅ Contract-First-Interaktion | Action Contracts für UI-Flows |
| ✅ Event-First-Wirkung | Core Signals als Wirkungsereignisse |
| ✅ Constitution-Compliance | Verbindliche Prüfpflicht |
| ✅ Governance-Einbindung | RFC-000A als Prozessrahmen |
| ✅ Migrations-Richtung | §9 — was sich anpassen muss |
| ✅ Bestehende ADR-001 | Route Authority als domänenspezifische Erweiterung anerkannt |

### 4.2 Was gilt ausdrücklich nicht?

| Gilt nicht | Begründung |
|---|---|
| ❌ Produktentscheidungen | Feature-Priorisierung = Product Owner |
| ❌ Release Specifications | Separate Artefakte nach ADR |
| ❌ UI-Design-Details | Design System ist Implementation, nicht Fundament |
| ❌ Konkrete API-Endpunkte | Domänenspezifische ADRs |
| ❌ Datenbank-Schema v5 vollständig | [`hui_schema_v5_core.sql`](../../hui_schema_v5_core.sql) ist Referenz, nicht Vertrag |
| ❌ Commerce-Preismodelle | Produkt-/Wirtschaftsentscheidung |
| ❌ KI-Modellwahl | Implementation — Philosophie in Constitution §VII |
| ❌ Sofortige Legacy-Bereinigung | Migration ist sukzessiv, nicht Big-Bang |
| ❌ Sofortiger LOCKED-Status | Erfordert Stabilisierungsphase |
| ❌ Vollständige Testabdeckung | QA folgt Release Specs |

---

## 5. Architecture Principles

Die folgenden Prinzipien sind **verbindlich** und leiten sich direkt aus der Ratifizierung ab. Sie gelten für alle Domänen, alle Teams und alle Generationen der Plattform.

### 5.1 Fundament-Prinzipien

| Prinzip | Definition | Quelle |
|---|---|---|
| **Constitution First** | Jede Entscheidung beginnt mit der Frage: Passt es zur Constitution? | Constitution §IX |
| **Registry First** | Bevor Text, Label oder Semantik definiert wird: Registry prüfen oder erweitern. | Constitution §IV |
| **Core before Features** | Wirkungsinfrastruktur hat Vorrang vor Feature-Oberflächen. | Core Engine Philosophie |
| **Meaning before Truth** | Semantik (Registry) wird vor Wirkungsdaten (Core) definiert — nicht umgekehrt. | Schichtenmodell |

### 5.2 Struktur-Prinzipien

| Prinzip | Definition |
|---|---|
| **Single Ownership** | Jedes Datensystem hat genau einen Owner mit Schreibrecht. Consumer lesen nur. |
| **Separation of Concerns** | Jede Domäne hat eine klar abgegrenzte Verantwortung. Überschneidungen werden explizit dokumentiert. |
| **Domain Isolation** | Domänen kommunizieren nur über definierte Schnittstellen — nie über direkten State-Zugriff. |
| **Contract First** | Jede Benutzer-Interaktion und domänenübergreifende Kommunikation folgt einem definierten Vertrag. |
| **Event First** | Wirkung entsteht durch dokumentierte Ereignisse (Signals), nicht durch implizite Zustandsänderungen. |
| **Read before Write** | Leseschnittstellen werden vor Schreibpfaden definiert und stabilisiert. |

### 5.3 Evolution-Prinzipien

| Prinzip | Definition |
|---|---|
| **Evolution over Revolution** | Architektur wächst inkrementell. Keine Big-Bang-Rewrites ohne ADR. |
| **Shadow before Authority** | Neue Registries und Contracts starten im Shadow Mode (lesen, nicht erzwingen) — siehe ADR-001. |
| **Deprecation over Deletion** | Legacy wird markiert und dokumentiert, nicht sofort gelöscht. |
| **Supersede over Silent Change** | Architekturänderungen ersetzen explizit ihre Vorgänger (ADI `supersedes`-Feld). |

### 5.4 Philosophie-Prinzipien

| Prinzip | Definition |
|---|---|
| **Impact over Attention** | Architektur optimiert auf Wirkung, nie auf Aufmerksamkeit oder Engagement. |
| **Connection over Reach** | Tiefe Verbindungen haben höheren architektonischen Wert als Reichweite. |
| **Human over Platform** | Der Mensch ist Subjekt; die Plattform ist Infrastruktur. |
| **Calm over Urgent** | Architektur bevorzugt Ruhe, Nachhaltigkeit und Langzeitstabilität. |
| **Transparency over Opacity** | Architekturentscheidungen sind dokumentiert und auffindbar (ADI). |

### 5.5 Ergänzende Prinzipien

| Prinzip | Definition |
|---|---|
| **No Gamification by Architecture** | Kein Architekturartefakt darf XP, Levels, Badges, Streaks oder Leaderboards ermöglichen. |
| **Assistive Intelligence** | KI-Module empfehlen und orientieren — sie manipulieren nicht. |
| **Stewardship over Control** | Governance pflegt und orientiert — sie kontrolliert nicht. |
| **Generational Durability** | Entscheidungen müssen in 10 Jahren noch nachvollziehbar und gültig sein. |

---

## 6. Architecture Invariants

Architektur-Invarianten sind **unveränderliche Regeln**. Verletzungen sind Architektur-Bugs — keine Feature-Requests. Änderungen erfordern RFC + ADR + explizite Begründung.

### 6.1 Wahrheits-Invarianten

| ID | Invariante |
|---|---|
| **INV-001** | Die Registry ist die **einzige semantische Wahrheit** — kein Text, kein Label, keine Terminologie existiert außerhalb der Registry. |
| **INV-002** | Die Core Engine ist die **einzige Wirkungsautorität** — kein Modul berechnet, aggregiert oder speichert Wirkungsprofile eigenständig. |
| **INV-003** | Die fünf Grundpfeiler sind die **einzige Wirkungs-Taxonomie** — kein paralleles Klassifizierungssystem. |
| **INV-004** | `PILLARS` in Core Engine und Registry sind **semantisch identisch** und DB-Enum-kompatibel. |

### 6.2 Datenfluss-Invarianten

| ID | Invariante |
|---|---|
| **INV-010** | Der Datenfluss ist **strikt unidirektional**: Constitution → Registry → Core/Engines → UI. |
| **INV-011** | UI **schreibt niemals direkt** in Core-Wirkungsdaten oder Wirkungstabellen. |
| **INV-012** | UI **schreibt niemals direkt** in fremde Domänen-Daten ohne Owner-Delegation. |
| **INV-013** | Engines **lesen niemals** aus UI-State als Wirkungsquelle. |
| **INV-014** | Registry **importiert niemals** aus Core, Engines oder UI. |

### 6.3 Ownership-Invarianten

| ID | Invariante |
|---|---|
| **INV-020** | Jedes Datensystem hat **genau einen Owner** mit Schreibrecht. |
| **INV-021** | Consumer **lesen ausschließlich** über definierte Hooks, Props oder Context-Returns. |
| **INV-022** | Realtime-Channels haben **genau einen Subscriber-Owner** pro Channel-Name. |
| **INV-023** | Domänen **besitzen ihre Daten selbst** — kein Datensystem ohne Domänen-Zuordnung. |

### 6.4 Kommunikations-Invarianten

| ID | Invariante |
|---|---|
| **INV-030** | Kommunikation zwischen Domänen erfolgt **ausschließlich über definierte Contracts** (Actions, Events, Hooks). |
| **INV-031** | Kein Button öffnet direkt einen State — jede Interaktion läuft über Action Contracts. |
| **INV-032** | Wirkungsereignisse werden als **Core Signals** erfasst — nicht als UI-Analytics-Events. |
| **INV-033** | Kein Modul ruft interne Funktionen einer fremden Domäne auf — nur öffentliche Schnittstellen. |

### 6.5 Philosophie-Invarianten

| ID | Invariante |
|---|---|
| **INV-040** | **Keine Gamification** — kein XP, Level, Badge, Streak, Achievement, Leaderboard in Architektur oder UI. |
| **INV-041** | **Keine Rankings** — kein öffentliches Vergleichssystem, kein „Top User", kein Score in der UI. |
| **INV-042** | **Keine Aufmerksamkeit als Optimierungsziel** — Architektur optimiert nicht auf Sitzungsdauer, Klicks oder Viralität. |
| **INV-043** | **Keine Like-Logik** — Resonanz ersetzt Likes; keine Like-Äquivalente. |
| **INV-044** | Der Orb **verändert sich nicht durch Einzelaktionen** — nur über langfristige Wirkungsaggregation. |
| **INV-045** | KI-Systeme **maximieren nicht Verweildauer** — sie maximieren sinnvolle Begegnungen. |
| **INV-046** | Verbotene Begriffe aus `LANG` **dürfen nicht im UI erscheinen** (Follower, Score, Level, etc.). |

### 6.6 Governance-Invarianten

| ID | Invariante |
|---|---|
| **INV-050** | Signifikante Architekturänderungen erfordern **RFC vor ADR** (Ausnahme: Emergency ADR). |
| **INV-051** | Jeder ADR hat einen **Constitution-Check** (`passed` / `failed` / `waived` mit Begründung). |
| **INV-052** | LOCKED-Artefakte ändern sich **nur via neuem RFC** mit expliziter Ratifizierung. |
| **INV-053** | Kein Release ohne **Referenz auf mindestens einen Approved ADR** (bei architektursignifikanten Releases). |

---

## 7. Consequences

### 7.1 Positive Konsequenzen

| Bereich | Auswirkung |
|---|---|
| **Klarheit** | Jedes Teammitglied kennt die verbindliche Architektur — kein Rätselraten. |
| **Konsistenz** | Einheitliches Schichtenmodell über alle Domänen hinweg. |
| **Wartbarkeit** | Single Ownership eliminiert State-Duplikation langfristig. |
| **Philosophische Integrität** | Invarianten schützen vor Gamification-Drift und Engagement-Optimierung. |
| **Skalierbarkeit** | Domain Model ermöglicht parallele Teamarbeit an Domänengrenzen. |
| **Institutionelles Gedächtnis** | ADR-0001 + ADI sichern Entscheidungswissen über Generationen. |
| **Review-Effizienz** | PR-Checkliste und Invarianten ermöglichen schnelle, objektive Reviews. |
| **Onboarding** | Neue Entwickler haben eine einzige Referenz für das Gesamtmodell. |

### 7.2 Negative Konsequenzen

| Bereich | Auswirkung | Mitigation |
|---|---|---|
| **Initiale Reibung** | Bestehender Code verletzt Invarianten | Sukzessive Migration (§9), keine Big-Bang |
| **Entwicklungsgeschwindigkeit** | RFC/ADR-Pflicht verlangsamt signifikante Änderungen | Gestufte Governance (S0–S4), Emergency-ADR |
| **Lernkurve** | 12 Domänen + Invarianten zu lernen | Architecture Index, Onboarding-Modul |
| **Striktheit** | Weniger Freiheit bei Implementierungsentscheidungen | Contract First gibt Freiheit *innerhalb* des Rahmens |
| **Dokumentationspflicht** | Mehr Pflegeaufwand für ADI, Charters | Quartals-Review, CI-Automatisierung |

### 7.3 Technische Konsequenzen

- Alle neuen Features müssen Core-Signal-Integration berücksichtigen.
- UI-Komponenten mit direkten DB-Writes werden als **technische Schuld** klassifiziert und migriert.
- `PILLARS`-Duplikation in Core und Registry bleibt vorerst (Re-Export-Pattern), wird aber überwacht.
- Action Contract Layer wird zum Pflicht-Pfad für neue UI-Interaktionen.
- Domain Charters werden sukzessive erstellt und in ADI verknüpft.

### 7.4 Organisatorische Konsequenzen

- Architecture Council wird als formelles Gremium etabliert (auch bei 2–3 Personen).
- Domain Owners werden benannt — zunächst für Kern-Domänen (Core, Registry, Orb, Feed).
- PR-Template erhält Constitution-Checkliste und ADR-Referenz-Feld.
- Quartals-Architektur-Review wird eingeführt (Drift-Erkennung).

### 7.5 Langfristige Konsequenzen

- In 10 Jahren: ADR-0001 bleibt Referenz — auch wenn einzelne Domänen evolviert sind.
- LOCKED-Status schützt Kern-Invarianten vor Erosion durch Wachstumsdruck.
- Federation/Multi-Instance kann auf diesem Fundament aufbauen, ohne es zu ersetzen.
- Externe Contributors haben klare architektonische Leitplanken.

---

## 8. Alternatives Considered

### 8.1 Alternative A — Status quo beibehalten (keine formale Ratifizierung)

| Aspekt | Bewertung |
|---|---|
| Beschreibung | Constitution und Code-Kommentare reichen als Architekturführung |
| Vorteil | Kein Dokumentationsaufwand |
| Nachteil | Architekturdrift, Wissensverlust, unklare Durchsetzung |
| **Verworfen weil** | SYSTEM_OWNERSHIP-Audit zeigt bereits kritische Drift; Skalierung unmöglich |

### 8.2 Alternative B — Monolithische Architektur (kein Domain Model)

| Aspekt | Bewertung |
|---|---|
| Beschreibung | AppStateContext als zentraler State-Container für alles |
| Vorteil | Einfacher für kleine Teams |
| Nachteil | 19 Profil-States, 11 Work-States — bereits gescheitert |
| **Verworfen weil** | Widerspricht Single Ownership; nicht skalierbar; bereits technische Schuld |

### 8.3 Alternative C — Microservices-Architektur

| Aspekt | Bewertung |
|---|---|
| Beschreibung | Jede Domäne als separater Service mit eigener Datenbank |
| Vorteil | Maximale Isolation |
| Nachteil | Overhead für aktuelle Teamgröße; Wirkungskohärenz erschwert |
| **Verworfen weil** | Over-Engineering für S0/S1; Core Engine als Single Source of Truth erfordert Kohärenz |

### 8.4 Alternative D — UI-First-Architektur (Features vor Infrastruktur)

| Aspekt | Bewertung |
|---|---|
| Beschreibung | UI-Komponenten besitzen eigene Datenlogik; schnellere Feature-Lieferung |
| Vorteil | Kurzfristig schneller |
| Nachteil | Direkte DB-Writes, doppelte States, keine Wirkungskohärenz |
| **Verworfen weil** | Widerspricht Constitution §IV; erzeugt die aktuellen Probleme |

### 8.5 Alternative E — Gamification-basiertes Wirkungsmodell

| Aspekt | Bewertung |
|---|---|
| Beschreibung | XP, Levels, Badges als Wirkungsmessung |
| Vorteil | Bekanntes Muster, hohe kurzfristige Aktivierung |
| Nachteil | Widerspricht gesamter HUI-Philosophie |
| **Verworfen weil** | Constitution Regel 8; INV-040 bis INV-042 |

### 8.6 Alternative F — Engagement-optimierter Feed (Infinite Scroll, Algorithmic Outrage)

| Aspekt | Bewertung |
|---|---|
| Beschreibung | Standard Social-Media-Feed-Architektur |
| Vorteil | Maximale Aufmerksamkeit |
| Nachteil | Suchtmechanismen, Filterblasen |
| **Verworfen weil** | Constitution Regel 6; Feed-Prinzip „Orientierung, nicht Sucht" |

---

## 9. Migration Impact

### 9.1 Bereiche, die sich anpassen müssen

| Priorität | Bereich | Aktueller Zustand | Zielzustand | Migration |
|---|---|---|---|---|
| **P0** | UI direkte DB-Writes | `WorkDetailPage`, `MeinHUI_SubPages`, etc. | Schreiben über Domain Owner | Release Specs pro Domäne |
| **P0** | Doppelte State-Owner | 19 Profil-, 11 Work-States | Single Ownership | Context-Konsolidierung |
| **P1** | Hardcodierte Texte | Teilweise außerhalb Registry | 100% Registry `LANG` | Sukzessive PRs |
| **P1** | Core Signal Integration | Viele Aktionen ohne Signal | Alle Wirkungsaktionen → `CoreEngine.signals.record()` | Feature-by-Feature |
| **P2** | Legacy Hooks | 10 ungenutzte Hooks | Markiert + entfernt | Cleanup-Release |
| **P2** | Realtime Channel Duplikate | Legacy `useChat.js` Channels | Konsolidierung auf Owner-Channels | REALTIME_REGISTRY |
| **P2** | Route Registry | Shadow Mode (ADR-001) | Parity → Authority (NAV-002+) | Eigene ADR-Kette |
| **P3** | Domain Charters | Nicht vorhanden | Charter pro Domäne | Dokumentation |

### 9.2 Bereiche, die unverändert bleiben dürfen

| Bereich | Begründung |
|---|---|
| Constitution v1.1 | Bereits ratifiziert und korrekt |
| Registry-Struktur | Operativ korrekt; nur Erweiterungen, keine Umstrukturierung |
| Core Engine API (`signals`, `profiles`, `classify`) | Stabil und Constitution-konform |
| Action Contract Layer | Funktional; Erweiterung, nicht Ersetzung |
| Auth-Flow (`AuthContext`) | Single Owner, sauber |
| Create-Flows (isolierte Transaktionen) | By-design-Ausnahme in System Ownership |
| Design System (`hui.design.js`) | Darstellungsschicht, nicht betroffen |
| Supabase als Backend | Infrastruktur-Entscheidung, nicht Teil dieses ADR |

### 9.3 Migrationsprinzipien

1. **Kein Big-Bang** — Migration erfolgt domänenweise über Release Specifications.
2. **Shadow before Enforce** — Neue Patterns parallel einführen, dann alte deprecaten.
3. **Tests vor Migration** — Bestehende Funktionalität darf nicht brechen.
4. **ADR-Referenz pro Migration** — Jede signifikante Migration hat einen eigenen ADR.
5. **Drift-Monitoring** — Quartals-Review vergleicht Code mit Invarianten.

---

## 10. Risks

| ID | Risiko | Wahrscheinlichkeit | Impact | Kontrollmaßnahme |
|---|---|---|---|---|
| R1 | **Governance-Theater** — ADR existiert, wird ignoriert | Mittel | Sehr hoch | PR-Template, Council-Review, CI-ADR-Check |
| R2 | **Architekturdrift** — Code weicht von Invarianten ab | Hoch | Sehr hoch | Quartals-Review, SYSTEM_OWNERSHIP-Update |
| R3 | **Entscheidungsstau** — zu viele Gates | Hoch (kleines Team) | Hoch | Gestufte Governance S0–S1; Emergency-ADR |
| R4 | **Überdokumentation** | Mittel | Mittel | ADR nur bei Signifikanz; RFC-000A Stufenmodell |
| R5 | **Invarianten zu strikt** — blockiert legitime Innovation | Niedrig | Mittel | „Bewusst offen"-Klausel (§3.5); RFC-Prozess |
| R6 | **PILLARS-Duplikation** — Core vs. Registry divergieren | Mittel | Hoch | INV-004; automatisierter Konsistenzcheck |
| R7 | **Migration nie abgeschlossen** — Legacy bleibt ewig | Hoch | Hoch | P0-Priorisierung; Drift-Metrik in ADI |
| R8 | **Constitution Erosion** — schleichende Abweichung | Mittel | Katastrophal | Red Team; INV-040–046; LOCKED |
| R9 | **Verwechslung ADR-0001 / ADR-001** | Mittel | Niedrig | ADI-Klarstellung; ADR-0001 = Fundament, ADR-001 = Route |
| R10 | **Fehlende Domain Charters** — Domänengrenzen unklar | Hoch | Hoch | Sofortmaßnahme: Core, Registry, Orb, Feed Charters |

---

## 11. Decision Status

### 11.1 Lebenszyklus

```
┌────────┐   ┌────────────────┐   ┌────────────┐   ┌──────────────────────┐
│ Draft  │──►│ Council Review │──►│ Discussion │──►│ Approved             │
└────────┘   └────────────────┘   └────────────┘   └──────────┬───────────┘
                                                               │
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ Implemented          │
                                                    │ (Dokumentation live, │
                                                    │  ADI aktualisiert)   │
                                                    └──────────┬───────────┘
                                                               │
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ Architecture Approved │
                                                    │ (Council verifiziert  │
                                                    │  Vollständigkeit)     │
                                                    └──────────┬───────────┘
                                                               │
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ LOCKED               │
                                                    │ (nach 2 stabilen     │
                                                    │  Releases empfohlen) │
                                                    └──────────────────────┘
```

### 11.2 Aktueller Status

| Phase | Status | Datum | Verantwortlich |
|---|---|---|---|
| Draft | ✅ Abgeschlossen | 2026-06-30 | Architecture Council |
| Council Review | 🔄 Ausstehend | — | Architecture Council |
| Discussion | ⏳ Ausstehend | — | Alle Stakeholder |
| Approved | ⏳ Ausstehend | — | Architecture Council |
| Implemented | ⏳ Ausstehend | — | Engineering Architecture |
| Architecture Approved | ⏳ Ausstehend | — | Architecture Council |
| LOCKED | ⏳ Ausstehend | — | Architecture Council |

### 11.3 Freigabe-Kriterien

| Gate | Kriterium |
|---|---|
| G1: Draft → Council Review | Alle 12 Abschnitte vollständig; Red-Team-Review durchgeführt |
| G2: Council Review → Discussion | Keine Blocker; Constitution-Check bestanden |
| G3: Discussion → Approved | Konsens oder Council-Entscheid; keine offenen Kernfragen |
| G4: Approved → Implemented | ADI-Eintrag; Architecture Index aktualisiert |
| G5: Implemented → Architecture Approved | Keine Widersprüche zu bestehenden ADRs; Team informiert |
| G6: Architecture Approved → LOCKED | 2 Releases ohne Invarianten-Verletzung |

---

## 12. References

### 12.1 Constitution & Fundament

| Referenz | Pfad | Rolle |
|---|---|---|
| HUI Constitution v1.1 | [`HUI_CONSTITUTION.md`](../../../HUI_CONSTITUTION.md) | Level 0 — philosophisches Fundament |
| HUI Registry v1.0 | [`src/registry/HuiRegistry.js`](../../../src/registry/HuiRegistry.js) | Single Source of Meaning |
| Core Engine Phase 1 | [`src/core/coreEngine.js`](../../../src/core/coreEngine.js) | Single Source of Truth |

### 12.2 RFCs & Governance

| Referenz | Pfad | Rolle |
|---|---|---|
| RFC-000A Architecture Governance | [`docs/governance/RFC-000A_ARCHITECTURE_GOVERNANCE.md`](../RFC-000A_ARCHITECTURE_GOVERNANCE.md) | Governance-Prozessrahmen |
| RFC-000 Domain Model | *strukturell in ADR-0001 §3.2.1* | Domänen-Landkarte (formale Publikation ausstehend) |
| Architecture Decision Index | [`docs/governance/ADI.md`](../ADI.md) | Entscheidungsregister |

### 12.3 Domain Charters

| Referenz | Pfad | Rolle |
|---|---|---|
| CORE Domain Charter v1.0 | *Inhalt in ADR-0001 §3.2.1, §6* | Core-Domänenvertrag (formale Publikation ausstehend) |

### 12.4 Architektur-Dokumentation

| Referenz | Pfad | Rolle |
|---|---|---|
| Architecture Index v2.1 | [`docs/ARCHITECTURE_INDEX.md`](../../ARCHITECTURE_INDEX.md) | Modulverzeichnis |
| System Ownership | [`docs/SYSTEM_OWNERSHIP.md`](../../SYSTEM_OWNERSHIP.md) | Datenbesitz-Audit |
| CODEBASE.md | [`CODEBASE.md`](../../../CODEBASE.md) | Code-Landkarte |
| HUI Orb Philosophie | [`docs/HUI_ORB.md`](../../HUI_ORB.md) | Orb-Domänen-Philosophie |
| Action Contracts | [`docs/HUI_ACTION_CONTRACTS.md`](../../HUI_ACTION_CONTRACTS.md) | UI-Interaktionsverträge |
| Realtime Registry | [`docs/REALTIME_REGISTRY.md`](../../REALTIME_REGISTRY.md) | Channel-Ownership |
| Ranking Philosophy | [`docs/RANKING_PHILOSOPHY.md`](../../RANKING_PHILOSOPHY.md) | Anti-Ranking-Orientierung |

### 12.5 Bestehende Architekturentscheidungen

| Referenz | Pfad | Rolle |
|---|---|---|
| ADR-001 Route Authority | [`src/routes/registry.js`](../../../src/routes/registry.js) | Shadow Route Registry (NAV-001B) |
| NAV-001 Navigation Foundation | Git: `d5c2daed` | Navigation-Konsolidierung |

### 12.6 Ownership

| Domäne | Owner (initial) | Quelle |
|---|---|---|
| Core | Engineering Architecture | ADR-0001 |
| Registry | Engineering Architecture | ADR-0001 |
| Alle anderen | *Zu benennen via Domain Charter* | RFC-000A §7 |

---

## 13. Red Team Review

> *Adversariale Selbstprüfung — durchgeführt vor Council Review.*

### 13.1 Identifizierte Schwächen und Verbesserungen

| # | Befund | Schwere | Verbesserung in diesem ADR |
|---|---|---|---|
| RT1 | **„Core ist einzige Wirkungsautorität"** — Commerce/Payments schreiben Transaktionsdaten | Mittel | Präzisiert: Core ist Autorität für *Wirkungsdaten*, nicht für alle Domänendaten (§3.3 V8) |
| RT2 | **Create-Flows mit direkten DB-Writes** widersprechen INV-012 | Mittel | Explizite Ausnahme in §9.2 (by-design, isolierte Transaktionen) |
| RT3 | **ADR-001 Nummerierung** kollidiert mit ADR-0001 als „erste" Entscheidung | Niedrig | §12.5 klärt: ADR-0001 = Fundament; ADR-001 = domänenspezifisch, vor Council |
| RT4 | **RFC-000 und CORE Charter fehlen** als eigenständige Dokumente | Mittel | Strukturell in §3.2.1 enthalten; formale Publikation als offener Punkt (§3.5) |
| RT5 | **12 Domänen** — ist Discovery eine eigene Domäne oder Teil von Feed? | Mittel | Discovery als eigene Domäne mit klarer Abgrenzung: Feed = Rhythmus/Darstellung, Discovery = Begegnungslogik |
| RT6 | **Ranking Philosophy** widerspricht INV-041, definiert aber Gewichte | Hoch | §3.5: Ranking Philosophy ist Orientierung, kein Architekturvertrag; öffentliche Rankings bleiben verboten |
| RT7 | **LOCKED-Zeitpunkt unklar** | Niedrig | §11.3 G6: 2 stabile Releases |
| RT8 | **Governance-Bürokratie** für Solo-Entwickler | Mittel | RFC-000A Stufenmodell S0/S1; Emergency-ADR; §3.5 |
| RT9 | **PILLARS-Duplikation** zwischen Core und Registry | Mittel | INV-004 + Re-Export-Pattern akzeptiert; Konsistenzcheck empfohlen |
| RT10 | **„Keine UI-Wirkungslogik"** — Orb-Rendering berechnet visuelle Parameter | Niedrig | Präzisiert: Orb *rendert* aus Core-Daten; Berechnung in `orbEngine.js` (Engine-Schicht), nicht UI |
| RT11 | **Fehlende Erfolgsmetriken** für die Adoption selbst | Niedrig | §7.1 + §10 R7: Drift-Metrik, Charter-Abdeckung |
| RT12 | **Supabase als implizite Abhängigkeit** nicht als Invariante | Niedrig | Bewusst offen (§3.5); Infrastruktur-ADR folgt bei Bedarf |

### 13.2 Verbleibende Risiken nach Red-Team

| Risiko | Akzeptiert? | Begründung |
|---|---|---|
| Legacy-Code verletzt Invarianten | ✅ Ja (temporär) | Migration ist explizit geplant (§9) |
| RFC-000 nicht als separates Dokument | ✅ Ja (temporär) | Inhalt in ADR-0001 enthalten; Publikation folgt |
| 53 Invarianten möglicherweise zu viele | ⚠️ Teilweise | Invarianten sind Kategorien — Review kann konsolidieren |
| Council mit 1–2 Personen | ✅ Ja | RFC-000A empfiehlt Council ab 2–3 Personen; formell auch bei 2 |

### 13.3 Red-Team-Urteil

**ADR-0001 ist ratifizierungsreif** mit den dokumentierten Einschränkungen. Die verbleibenden offenen Punkte (§3.5) sind bewusst und blockieren die Ratifizierung des Kernmodells nicht. Sie müssen jedoch innerhalb von 90 Tagen nach Approval adressiert werden:

1. Formale Publikation RFC-000 (Domain Model)
2. CORE Domain Charter v1.0
3. Domain Charters für Registry, Orb, Feed
4. ADI-Initialisierung mit allen bestehenden Entscheidungen
5. PR-Template mit Constitution-Checkliste

---

## Anhang A — Constitution-Check

| Frage | Ergebnis |
|---|---|
| Stärkt die Entscheidung mindestens einen Grundpfeiler? | ✅ Alle fünf — das Fundament ermöglicht jeden Grundpfeiler |
| Passt sie zur Constitution? | ✅ Schichtenmodell ist identisch mit Constitution §IV |
| Entsteht echte Wirkung oder nur Aktivität? | ✅ Wirkung — durch Core-First-Architektur |
| Spricht sie die HUI-Sprache? | ✅ Registry-First-Prinzip |
| Ist sie in 10 Jahren noch richtig? | ✅ Generational Durability als explizites Prinzip |

**Constitution-Check: `passed`**

---

## Anhang B — CORE Domain Charter v1.0 (Kurzfassung)

> *Vollständiger Charter folgt als separates Dokument. Diese Kurzfassung ist durch ADR-0001 ratifiziert.*

| Feld | Wert |
|---|---|
| **Domäne** | Core |
| **Mission** | Single Source of Truth für alle Wirkungsdaten der Plattform |
| **Owner** | Engineering Architecture |
| **Grundpfeiler** | Alle fünf (Querschnitt) |
| **Datenbesitz** | `coreEngine.js` → `signals`, `profiles`, `connections`, `content`, `classify` |
| **Schreibt** | Core Engine (via `signals.record()`) |
| **Liest** | Orb Engine, Feed Engine, Resonance Engine, Intelligence, UI (via Hooks) |
| **Schreibt nicht** | UI, Registry, andere Domänen (direkt) |
| **Schnittstellen** | `CoreEngine.signals.*`, `CoreEngine.profiles.*`, `CoreEngine.classify.*` |
| **Events** | Wirkungssignale (`SIGNAL_TYPES.*`) |
| **Anti-Patterns** | XP, Scores, Badges, UI-direkte Wirkungsschreibung, Like-Logik |
| **LOCKED Scope** | `SIGNAL_TYPES`, `SIGNAL_MAP`, `PILLARS`, Schichtenmodell |

---

*ADR-0001 ist die erste offizielle Architekturentscheidung des HUI Architecture Council.*  
*Er ratifiziert nicht nur eine Architektur — er schützt eine Philosophie.*  
*Grundlage aller Entscheidungen bleibt: [`HUI_CONSTITUTION.md`](../../../HUI_CONSTITUTION.md)*
