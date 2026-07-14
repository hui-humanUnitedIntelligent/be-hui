# RFC-000A — Architecture Governance v1.0

> **HUI Architecture Council — Engineering Architecture Review**  
> **Status:** Draft → Review (Ratifizierung ausstehend)  
> **Datum:** 2026-06-30  
> **Typ:** Governance-Definition (keine Release Specification, keine Code-Änderung)

---

## Meta

| Feld | Wert |
|---|---|
| RFC-ID | RFC-000A |
| Titel | Architecture Governance v1.0 |
| Autor | HUI Architecture Council |
| Bezug | [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md), [`docs/ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) |
| Geltungsbereich | Gesamte HUI-Plattform — alle Domänen, alle Teams, alle Releases |
| Änderungsart | Organisatorisch / dokumentarisch |

**Abgrenzung:** Dieses Dokument definiert *wie* Architekturentscheidungen getroffen, dokumentiert, freigegeben und verwaltet werden. Es trifft keine Produktentscheidungen und spezifiziert keine Implementierung.

---

# Abschlussbericht

---

## 1. Executive Summary

HUI besitzt mit der [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md) bereits ein starkes **Level-0-Fundament**: Mission, Grundpfeiler, Goldene Regeln und ein unveränderliches Schichtenmodell. Mit [`docs/ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) und [`docs/SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md) existieren erste operative Strukturen.

Was fehlt, ist ein **vollständiger, skalierbarer Governance-Rahmen**, der:

1. **Dokumente** (was existiert),
2. **Prozesse** (wie Entscheidungen entstehen) und
3. **Status** (in welchem Zustand sich etwas befindet)

systematisch trennt — statt sie in einer linearen 11-Stufen-Hierarchie zu vermischen.

### Kernergebnis

| Empfehlung | Begründung |
|---|---|
| **Drei-Ebenen-Modell** statt Level 0–10 | Vermeidet Kategoriefehler (Dokument ≠ Prozess ≠ Status) |
| **RFC vor ADR** | RFC = Vorschlag & Diskussion; ADR = bindende Entscheidung |
| **Architecture Decision Index (ADI)** | Zentrales Register aller Entscheidungen mit Beziehungsgraph |
| **Domain Charter als verbindlicher Vertrag** | Jede Domäne hat Mission, Owner, Datenbesitz, Schnittstellen |
| **Gestufte Governance-Schwere** | Solo-Entwickler: leichtgewichtig; Enterprise: vollständig |
| **LOCKED als terminaler Status** | Nicht als Hierarchie-Level, sondern als irreversibler Schutzzustand |

### Zielbild

Eine Governance, die heute einem Einzelentwickler dient, morgen drei Teams koordiniert und in zehn Jahren externe Contributors sowie internationale Organisationen tragfähig begleitet — ohne die philosophische Integrität der HUI Constitution zu verwässern.

---

## 2. Governance Model

### 2.1 Definition

**Architecture Governance** ist das Gesamtsystem aus Prinzipien, Rollen, Dokumenten, Prozessen und Freigaben, das sicherstellt, dass jede technische Entscheidung:

- der Constitution entspricht,
- nachvollziehbar dokumentiert ist,
- einer klaren Verantwortlichkeit zugeordnet ist,
- vor Implementierung geprüft wurde,
- und langfristig auffindbar bleibt.

### 2.2 Governance-Prozess (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE GOVERNANCE FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

  CONSTITUTION ──► DOMAIN MODEL ──► DOMAIN CHARTER
        │                                    │
        │         (strukturelle Grundlage)   │
        ▼                                    ▼
      RFC ──────────► Review ──────────► Discussion
        │                                    │
        │         (Vorschlag & Debatte)      │
        ▼                                    ▼
      ADR ◄──────── Architecture Approval
        │
        │         (bindende Entscheidung)
        ▼
  RELEASE SPECIFICATION
        │
        │         (lieferbarer Scope)
        ▼
  ENGINEERING REVIEW ──► Implementation ──► QA
        │                      │              │
        │         (Umsetzung)    │              │
        ▼                      ▼              ▼
  Architecture Approved ◄─────────────────────┘
        │
        │         (Freigabe für Produktion)
        ▼
      LOCKED (optional, terminal)
```

### 2.3 Artefakte im Detail

#### Constitution (Level 0)

| Aspekt | Definition |
|---|---|
| **Zweck** | Unveränderliche Grundlage aller Entscheidungen |
| **Inhalt** | Mission, Grundpfeiler, Goldene Regeln, Architekturprinzipien |
| **Owner** | Product Architecture + Engineering Architecture (gemeinsam) |
| **Änderung** | Explizite Ratifizierung; Versions-Bump; kein stiller PR |
| **HUI-Referenz** | [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md) — bereits ratifiziert |

#### Domain Model (Level 1)

| Aspekt | Definition |
|---|---|
| **Zweck** | Strukturelle Landkarte aller Plattform-Domänen und ihrer Beziehungen |
| **Inhalt** | Domänenliste, Abhängigkeitsgraph, Bounded Contexts, Schnittstellen-Matrix |
| **Owner** | Engineering Architecture |
| **Änderung** | RFC → ADR bei strukturellen Verschiebungen |
| **HUI-Referenz** | Teilweise in [`CODEBASE.md`](../../CODEBASE.md), [`docs/ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) |

#### Domain Charter (Level 2)

| Aspekt | Definition |
|---|---|
| **Zweck** | Verbindlicher Vertrag pro Domäne |
| **Inhalt** | Mission, Owner, Datenbesitz, APIs, Events, Abhängigkeiten, RFCs, ADRs |
| **Owner** | Domänen-Owner (siehe Abschnitt 7) |
| **Änderung** | RFC innerhalb der Domäne; ADR bei Ownership- oder Schnittstellenänderung |

#### RFC — Request for Comments (Level 3)

| Aspekt | Definition |
|---|---|
| **Zweck** | Strukturierter Vorschlag *vor* der Entscheidung |
| **Inhalt** | Problem, Kontext, Optionen, Vor-/Nachteile, Auswirkungen, offene Fragen |
| **Owner** | Autor (beliebige Rolle); Review durch Engineering Architecture |
| **Lebensdauer** | Temporär — wird durch ADR ersetzt oder archiviert |
| **Nummerierung** | `RFC-NNN` (z. B. RFC-000A = diese Governance-Definition) |

#### ADR — Architecture Decision Record (Level 4)

| Aspekt | Definition |
|---|---|
| **Zweck** | Bindende, dauerhafte Architekturentscheidung |
| **Inhalt** | Kontext, Entscheidung, Begründung, Konsequenzen, Alternativen |
| **Owner** | Architecture Council / Engineering Architecture |
| **Lebensdauer** | Permanent (Status: Approved → Implemented → ggf. Deprecated/Superseded) |
| **Nummerierung** | `ADR-NNN`; Verknüpfung zu RFC und ADI-Eintrag |

#### Release Specification (Level 5)

| Aspekt | Definition |
|---|---|
| **Zweck** | Konkreter, lieferbarer Scope für ein Release |
| **Inhalt** | Features, ADR-Referenzen, Akzeptanzkriterien, Migrationspfad, Rollback |
| **Owner** | Product Owner + Engineering Architecture |
| **Abgrenzung** | Kein Architekturvorschlag — Umsetzung genehmigter ADRs |

#### Engineering Review (Prozess, kein Level)

| Aspekt | Definition |
|---|---|
| **Zweck** | Technische Prüfung vor und während der Implementierung |
| **Inhalt** | Design-Review, Constitution-Check, Ownership-Check, Schnittstellen-Check |
| **Owner** | Engineering Architecture |
| **Trigger** | Vor Merge signifikanter PRs; vor Release Specification Freigabe |
| **Output** | Review-Protokoll (kein eigenständiges Hierarchie-Level) |

#### QA (Prozess, kein Level)

| Aspekt | Definition |
|---|---|
| **Zweck** | Verifikation gegen Release Specification und ADR-Konsequenzen |
| **Inhalt** | Testplan, Constitution-Compliance, Regression, Red-Team-Findings |
| **Owner** | QA + Red Team (adversarial) |
| **Output** | QA-Bericht; Freigabeempfehlung |

#### Architecture Approval (Status-Gate)

| Aspekt | Definition |
|---|---|
| **Zweck** | Formale Bestätigung: Entscheidung ist korrekt umgesetzt |
| **Voraussetzung** | ADR Approved + Engineering Review bestanden + QA bestanden |
| **Verantwortlich** | Engineering Architecture (technisch) + Product Architecture (produktphilosophisch bei Constitution-nahen Themen) |
| **Ergebnis** | Statuswechsel im ADI: `Implemented` → `Architecture Approved` |

#### LOCKED (terminaler Status)

| Aspekt | Definition |
|---|---|
| **Zweck** | Irreversibler Schutz vor unbeabsichtigter Änderung |
| **Anwendung** | Constitution, kritische ADRs, stabile Domain Charters, Kern-Engines |
| **Änderung** | Nur durch neuen RFC + explizite Ratifizierung mit Begründung |
| **HUI-Kandidaten** | Constitution, HuiRegistry-Semantik, Core Engine Datenmodell |

### 2.4 Reihenfolge — Bewertung

| Schritt | Korrekt? | Anmerkung |
|---|---|---|
| Constitution → Domain Model → Domain Charter | ✅ | Strukturelle Grundlage zuerst |
| RFC → ADR | ✅ | Vorschlag vor Entscheidung |
| ADR → Release Specification | ✅ | Entscheidung vor Lieferung |
| Release Spec → Engineering Review → Implementation | ✅ | Prüfung vor Umsetzung |
| Implementation → QA | ✅ | Verifikation nach Umsetzung |
| QA → Architecture Approval | ✅ | Formale Freigabe am Ende |
| Architecture Approval → LOCKED | ✅ | Schutz nach Stabilisierung |

**Korrektur zur vorgeschlagenen Hierarchie:** Implementation (Level 7) und QA (Level 8) sind **Aktivitäten**, keine Dokumentebenen. Architecture Approved (Level 9) und LOCKED (Level 10) sind **Status**, keine Hierarchie-Level.

### 2.5 Verantwortlichkeiten (RACI-Kurzform)

| Phase | R | A | C | I |
|---|---|---|---|---|
| Constitution-Änderung | Product Arch | Architecture Council | Engineering Arch, PO | Alle Teams |
| Domain Model | Engineering Arch | Architecture Council | Domain Owners | Alle Teams |
| RFC erstellen | Autor | Autor | Engineering Arch | Betroffene Domänen |
| ADR ratifizieren | Engineering Arch | Architecture Council | Domain Owners, QA | Alle Teams |
| Release Spec | PO + Eng. Arch | PO | Implementation, QA | Stakeholder |
| Engineering Review | Engineering Arch | Engineering Arch | Implementation | PO |
| QA | QA + Red Team | QA Lead | Implementation | Engineering Arch |
| Architecture Approval | Engineering Arch | Architecture Council | QA, Red Team | Alle Teams |
| LOCKED | Engineering Arch | Architecture Council | — | Alle Teams |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

### 2.6 Übergänge und Freigaben

```
RFC:        Draft ──► Review ──► Discussion ──► Accepted/Rejected/Withdrawn
                                              │
                                              ▼ (bei Accepted)
ADR:        Draft ──► Review ──► Approved ──► Implemented ──► Architecture Approved
                              │                    │                    │
                              ▼                    ▼                    ▼
                         Rejected            Deprecated          LOCKED
                         Superseded          Superseded
                         Archived            Archived
```

**Freigabe-Gates (Hard Stops):**

| Gate | Blockiert | Freigeber |
|---|---|---|
| G1: RFC → ADR | ADR ohne akzeptierten RFC (Ausnahme: Emergency ADR) | Engineering Architecture |
| G2: ADR → Release Spec | Release ohne Approved ADR | Product Owner + Engineering Architecture |
| G3: Release → Implementation | Merge ohne Engineering Review (bei signifikanten Änderungen) | Engineering Architecture |
| G4: Implementation → Deploy | Deploy ohne QA-Freigabe | QA Lead |
| G5: Deploy → LOCKED | LOCKED ohne Architecture Approval + Stabilisierungszeit | Architecture Council |

---

## 3. Rollenmodell

### 3.1 Übersicht

```
                    ┌─────────────────────────┐
                    │   Architecture Council   │
                    │  (Product + Engineering  │
                    │      Architecture)       │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   Product Owner          Domain Owners          QA + Red Team
          │                     │                     │
          ▼                     ▼                     ▼
   Release Spec           Domain Charter         Verification
          │                     │
          └──────────┬──────────┘
                     ▼
              Implementation
```

### 3.2 Product Architecture

| Dimension | Definition |
|---|---|
| **Verantwortung** | Langfristige Produktvision; Constitution-Pflege; Grundpfeiler-Integrität; philosophische Kohärenz |
| **Entscheidungsbefugnis** | Constitution-Änderungen; Produktprinzipien; Ablehnung von Features die der Mission widersprechen |
| **Grenzen** | Keine Implementierungsdetails; keine Release-Planung; kein Override von technischen Sicherheits-ADRs |
| **Zusammenarbeit** | Co-Lead mit Engineering Architecture im Council; konsultiert PO bei Release Specs; informiert Community bei Constitution-nahen Entscheidungen |

### 3.3 Engineering Architecture

| Dimension | Definition |
|---|---|
| **Verantwortung** | Technische Architektur; Domain Model; ADR-Ratifizierung; Engineering Review; ADI-Pflege; Schnittstellen-Governance |
| **Entscheidungsbefugnis** | ADRs; Domain Model; technische Standards; LOCKED-Empfehlungen; Ablehnung architekturwidriger PRs |
| **Grenzen** | Keine Produkt-Priorisierung; keine Constitution-Änderung allein; keine direkte Implementierung bei Review-Rolle |
| **Zusammenarbeit** | Führt Engineering Reviews; berät Implementation; eskaliert an Council bei Constitution-Konflikten |

### 3.4 Product Owner

| Dimension | Definition |
|---|---|
| **Verantwortung** | Release-Planung; Priorisierung; Release Specifications; Akzeptanzkriterien; Stakeholder-Kommunikation |
| **Entscheidungsbefugnis** | Release-Scope; Feature-Priorisierung innerhalb genehmigter ADRs; Verschiebung von Releases |
| **Grenzen** | Keine Architekturentscheidungen; kein Override von ADRs; keine Constitution-Änderung |
| **Zusammenarbeit** | Erstellt Release Specs mit Engineering Architecture; informiert QA über Akzeptanzkriterien |

### 3.5 Implementation

| Dimension | Definition |
|---|---|
| **Verantwortung** | Code-Umsetzung genehmigter ADRs; Einhaltung Domain Charter; Ownership-Regeln; technische Dokumentation im Code |
| **Entscheidungsbefugnis** | Implementierungsdetails innerhalb ADR-Rahmen; Refactoring ohne Architekturänderung |
| **Grenzen** | Keine neuen Schnittstellen ohne ADR; kein Datenbesitz-Transfer; keine Constitution-Ausnahmen |
| **Zusammenarbeit** | Fordert RFCs bei Unsicherheit an; nimmt an Engineering Review teil; meldet Abweichungen sofort |

### 3.6 QA

| Dimension | Definition |
|---|---|
| **Verantwortung** | Testplanung; Verifikation gegen Release Spec; Constitution-Compliance-Tests; Regression |
| **Entscheidungsbefugnis** | QA-Freigabe oder -Blockierung; Testabdeckungs-Anforderungen |
| **Grenzen** | Keine Architekturentscheidungen; keine Produkt-Priorisierung; kein Deploy ohne Freigabe-Prozess |
| **Zusammenarbeit** | Arbeitet mit Red Team bei adversarial Testing; dokumentiert Findings im QA-Bericht |

### 3.7 Red Team

| Dimension | Definition |
|---|---|
| **Verantwortung** | Adversariale Prüfung; Constitution-Stresstest; Missbrauchsszenarien; Gamification-Drift-Erkennung; Dark-Pattern-Audit |
| **Entscheidungsbefugnis** | Veto-Empfehlung (nicht bindend allein); Eskalation an Council bei ethischen/philosophischen Verstößen |
| **Grenzen** | Keine Implementierung; keine Produktentscheidungen; fokussiert auf Risiko, nicht auf Feature-Wünsche |
| **Zusammenarbeit** | Unabhängig von Implementation; berichtet an QA und Architecture Council; besonders relevant für KI-, Feed- und Commerce-Domänen |

### 3.8 Ergänzende Rollen (empfohlen)

| Rolle | Wann einführen | Verantwortung |
|---|---|---|
| **Domain Owner** | Ab 2. Domäne mit aktiver Entwicklung | Pflege Domain Charter; erste Anlaufstelle für domänenspezifische RFCs |
| **Architecture Council** | Ab 3+ Teams oder externen Contributors | Ratifizierung Constitution, ADRs, LOCKED; Konfliktlösung |
| **Steward** | Bereits in HUI-Philosophie verankert | Community-Governance; kulturelle Transparenz (siehe [`GOVERNANCE_FOUNDATION_MAP.md`](../GOVERNANCE_FOUNDATION_MAP.md)) |
| **Release Manager** | Ab regelmäßigem Release-Zyklus | Koordination Release Spec → QA → Deploy |

---

## 4. Dokumentenhierarchie

### 4.1 Bewertung der vorgeschlagenen Hierarchie

| Level | Vorschlag | Bewertung | Empfehlung |
|---|---|---|---|
| 0 | Constitution | ✅ Korrekt | Beibehalten |
| 1 | Domain Model | ✅ Korrekt | Beibehalten |
| 2 | Domain Charter | ✅ Korrekt | Beibehalten |
| 3 | RFC | ✅ Korrekt | Beibehalten |
| 4 | ADR | ✅ Korrekt | Beibehalten |
| 5 | Release Specification | ✅ Korrekt | Beibehalten |
| 6 | Engineering Review | ⚠️ Kategoriefehler | → **Prozess-Artefakt**, nicht Hierarchie-Level |
| 7 | Implementation | ❌ Kategoriefehler | → **Aktivität**, dokumentiert via PR/Code + ADR-Referenz |
| 8 | QA | ❌ Kategoriefehler | → **Prozess-Artefakt** (QA-Bericht) |
| 9 | Architecture Approved | ❌ Kategoriefehler | → **Status** im Decision Lifecycle |
| 10 | LOCKED | ❌ Kategoriefehler | → **Terminaler Status**, nicht Level |

### 4.2 Empfohlene Drei-Ebenen-Struktur

#### Ebene A — Dokumenthierarchie (Was)

```
Level 0  Constitution          ← unveränderliche Grundlage
Level 1  Domain Model           ← strukturelle Landkarte
Level 2  Domain Charter         ← Vertrag pro Domäne
Level 3  RFC                    ← Vorschlag (temporär)
Level 4  ADR                    ← Entscheidung (dauerhaft)
Level 5  Release Specification  ← Lieferumfang (temporär)
```

#### Ebene B — Prozesskette (Wie)

```
Engineering Review → Implementation → QA → Architecture Approval
```

Jeder Prozessschritt erzeugt ein **Artefakt** (Review-Protokoll, PR/Merge, QA-Bericht, Approval-Eintrag), aber kein neues Hierarchie-Level.

#### Ebene C — Statusmodell (Zustand)

```
Draft → Review → Discussion → Approved → Implemented → Architecture Approved → LOCKED
                                                                    ↓
                                                          Deprecated / Superseded / Archived
```

### 4.3 Verbesserungen

1. **Trennung von Was/Wie/Zustand** — verhindert Verwirrung in 10 Jahren
2. **Prozess-Artefakte in `docs/governance/artifacts/`** — Review-Protokolle, QA-Berichte, Approval-Records
3. **Code als Implementation-Nachweis** — PR verweist auf ADR-NNN; kein separates Level-7-Dokument
4. **Verknüpfungsgraph** — jedes Dokument referenziert Parent (z. B. ADR-003 → RFC-007 → Domain Charter: Feed)

### 4.4 Verzeichnisstruktur (empfohlen)

```
docs/
  governance/
    RFC-000A_ARCHITECTURE_GOVERNANCE.md    ← dieses Dokument
    ADI.md                                  ← Architecture Decision Index
    domain-model/
      HUI_DOMAIN_MODEL.md
    charters/
      CHARTER_FEED.md
      CHARTER_ORB.md
      CHARTER_CORE.md
      ...
    rfc/
      RFC-NNN-slug.md
    adr/
      ADR-NNN-slug.md
    releases/
      RELEASE-vX.Y.Z.md
    artifacts/
      reviews/
      qa/
      approvals/
```

---

## 5. Decision Lifecycle

### 5.1 Standardisierter Entscheidungsprozess

```
┌────────┐    ┌────────┐    ┌────────────┐    ┌──────────┐    ┌─────────────┐
│ Draft  │───►│ Review │───►│ Discussion │───►│ Approved │───►│ Implemented │
└────────┘    └────────┘    └────────────┘    └──────────┘    └──────┬──────┘
     │              │               │               │                 │
     ▼              ▼               ▼               ▼                 ▼
 Withdrawn      Returned        Rejected      Superseded      Architecture
 to Draft       to Draft                        (durch neu)      Approved
                                                                    │
                                                                    ▼
                                              ┌─────────────────────────────┐
                                              │ Deprecated / Superseded /   │
                                              │ Archived / LOCKED           │
                                              └─────────────────────────────┘
```

### 5.2 Status-Definitionen

| Status | Dauerhaft? | Bedeutung | Gilt für |
|---|---|---|---|
| **Draft** | ✅ | In Bearbeitung, nicht bindend | RFC, ADR, Release Spec |
| **Review** | ✅ | Formale Prüfung läuft | RFC, ADR, Release Spec |
| **Discussion** | ✅ | Offene Debatte, Feedback eingeladen | RFC |
| **Approved** | ✅ | Bindende Entscheidung getroffen | ADR |
| **Implemented** | ✅ | In Code/Infra umgesetzt | ADR |
| **Architecture Approved** | ✅ | Umsetzung verifiziert und freigegeben | ADR, Domain Charter |
| **LOCKED** | ✅ | Terminaler Schutz; Änderung nur via neuem RFC | Constitution, kritische ADRs |
| **Deprecated** | ✅ | Noch vorhanden, aber nicht mehr empfohlen | ADR, Domain Charter |
| **Superseded** | ✅ | Ersetzt durch neueren Eintrag (mit Referenz) | RFC, ADR |
| **Archived** | ✅ | Historisch, nicht mehr aktiv | RFC, Release Spec |
| **Rejected** | ✅ | Abgelehnt mit Begründung | RFC |
| **Withdrawn** | ✅ | Vom Autor zurückgezogen | RFC |

### 5.3 Nicht dauerhaft sinnvolle Status

| Status | Empfehlung |
|---|---|
| In Progress | → Ersetzen durch `Draft` oder `Implemented` (je nach Phase) |
| Pending | → Zu unspezifisch; durch `Review` oder `Discussion` ersetzen |
| Done | → Ersetzen durch `Architecture Approved` oder `LOCKED` |
| WIP | → Nur in PR-Titeln, nicht im ADI |

### 5.4 Übergangsregeln

| Von | Nach | Bedingung | Wer |
|---|---|---|---|
| Draft | Review | Dokument vollständig | Autor |
| Review | Discussion | Keine Blocker | Reviewer (Eng. Arch.) |
| Discussion | Approved (ADR) | Konsens oder Council-Entscheid | Architecture Council |
| Approved | Implemented | Code merged, Release deployed | Implementation + Eng. Arch. |
| Implemented | Architecture Approved | QA bestanden, Review bestanden | Architecture Council |
| Architecture Approved | LOCKED | Stabilisierung (empfohlen: 2 Releases) | Architecture Council |
| Approved | Deprecated | Bessere Alternative existiert | Eng. Arch. + Council |
| * | Superseded | Neuer ADR ersetzt alten | Automatisch bei ADI-Update |
| * | Archived | Keine aktive Referenz mehr | Eng. Arch. (jährliche Bereinigung) |

---

## 6. Architecture Decision Index (ADI)

### 6.1 Zweck

Das **Architecture Decision Index** ist das zentrale Register aller Architekturentscheidungen — die „Single Source of Truth für Entscheidungen", analog zur Core Engine als Single Source of Truth für Wirkungsdaten.

### 6.2 Struktur

```yaml
# ADI-Eintrag (konzeptionell)
id: ADR-0042
title: "Feed Engine — Rhythmus statt Infinite Scroll"
status: Architecture Approved
domain: feed
constitution_check: passed
rfc: RFC-0015
supersedes: ADR-0012
superseded_by: null
release: v2.4.0
locked: false
owner: engineering-architecture
domain_owner: feed-team
created: 2026-03-15
approved: 2026-04-01
implemented: 2026-05-10
architecture_approved: 2026-05-20
tags: [feed, ux, constitution-rule-6]
related_adrs: [ADR-0008, ADR-0031]
related_rfcs: [RFC-0015]
related_releases: [RELEASE-v2.4.0]
artifacts:
  - docs/governance/adr/ADR-0042-feed-rhythm.md
  - docs/governance/artifacts/reviews/ER-0042.md
  - docs/governance/artifacts/qa/QA-v2.4.0-feed.md
```

### 6.3 Pflichtfelder

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ✅ | Eindeutige Kennung (ADR-NNN, RFC-NNN) |
| `title` | ✅ | Menschenlesbarer Titel |
| `status` | ✅ | Aktueller Lifecycle-Status |
| `domain` | ✅ | Zugehörige Domäne |
| `owner` | ✅ | Verantwortliche Rolle/Person |
| `created` | ✅ | Erstellungsdatum |
| `constitution_check` | ✅ (ADR) | passed / failed / waived (mit Begründung) |
| `rfc` | ✅ (ADR) | Ursprungs-RFC |
| `artifacts` | ✅ | Pfade zu allen zugehörigen Dokumenten |

### 6.4 Beziehungen

```
                    ┌──────────────┐
                    │     ADI      │
                    │  (Register)  │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        RFC-NNN        ADR-NNN      RELEASE-vX.Y
           │               │               │
           └───────► ADR-NNN ◄──────────────┘
                       │
                       ▼
              Domain Charter: DOMAIN
                       │
                       ▼
                 Constitution
```

| Beziehung | Kardinalität | Regel |
|---|---|---|
| RFC → ADR | 1 : 0..1 | Jeder ADR hat genau einen RFC (Ausnahme: Emergency ADR) |
| ADR → ADR | 1 : 0..n | `supersedes` / `superseded_by` für Evolution |
| ADR → Release | n : m | Ein Release kann mehrere ADRs umsetzen |
| ADR → Domain | n : 1 | Jeder ADR gehört zu einer Domäne |
| Domain → Charter | 1 : 1 | Jede Domäne hat genau einen Charter |
| Charter → Constitution | n : 1 | Alle Charters leiten von Constitution ab |

### 6.5 Pflege

| Aktivität | Frequenz | Verantwortlich |
|---|---|---|
| Neuer Eintrag bei RFC/ADR-Erstellung | Bei Bedarf | Autor |
| Status-Update bei Übergängen | Bei jedem Gate | Owner |
| Quartals-Review auf veraltete Einträge | Vierteljährlich | Engineering Architecture |
| Jährliche Archivierung | Jährlich | Architecture Council |
| Integritätscheck (verwaiste Referenzen) | Monatlich (automatisierbar) | CI/CD oder Steward |

---

## 7. Domain Governance

### 7.1 Bewertung des Domain-Ansatzes

Der Domain-Ansatz ist **fundamental richtig** für HUI. Die Plattform hat bereits de facto Domänen (Core, Feed, Orb, Commerce, Presence, Chat, Trust, Discovery), dokumentiert in [`ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) und [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md).

Was fehlt, ist die **explizite Charter-Formalierung** pro Domäne.

### 7.2 Domain Charter — Pflichtbestandteile

| Bestandteil | Beschreibung | HUI-Beispiel |
|---|---|---|
| **Mission** | Warum existiert diese Domäne? Welchen Grundpfeiler stärkt sie? | Feed: „Orientierung, nicht Sucht" (Constitution Regel 6) |
| **Owner** | Eindeutige Verantwortung (Person/Rolle) | `useFeedStream.js` → Feed Domain Owner |
| **Verantwortlichkeit** | Was fällt in diese Domäne, was nicht? | Feed: Rhythmus, Karten, Normalisierung — nicht: Wirkungsberechnung |
| **Datenbesitz** | Single Source of Truth (Schreib-Recht) | Siehe [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md) |
| **Schnittstellen** | APIs, Hooks, Events nach außen | `useFeedStream()`, `feedRhythmEngine` |
| **Events** | Domäneninterne und -übergreifende Events | `feed.item.resonated`, `feed.rhythm.pause` |
| **Abhängigkeiten** | Upstream/Downstream-Domänen | Feed ← Core Engine, Registry; Feed → UI |
| **RFCs** | Offene und abgeschlossene Vorschläge | RFC-0015 (Feed Rhythm) |
| **ADRs** | Bindende Entscheidungen | ADR-0042 (kein Infinite Scroll) |
| **Releases** | Umgesetzte Release Specs | RELEASE-v2.4.0 |

### 7.3 Empfohlene HUI-Domänen (Initial)

| Domäne | Mission (Kurz) | Datenbesitz | Constitution-Bezug |
|---|---|---|---|
| **Core** | Single Source of Truth für Wirkung | `coreEngine.js` | Regel 5, Schichtenmodell |
| **Registry** | Single Source of Meaning | `HuiRegistry.js` | Regel 4 (Sprache), Schichtenmodell |
| **Orb** | Symbol gelebter Wirkung | `orbEngine.js`, `orbLayer.js` | Regel 5, Abschnitt VI |
| **Feed** | Orientierung, nicht Sucht | `useFeedStream.js` | Regel 6 |
| **Resonance** | Tiefe Begegnung | `resonanceEngine.js` | Regel 3, 5 |
| **Intelligence** | Assistive, nicht manipulative KI | `lib/intelligence/*` | Abschnitt VII |
| **Commerce** | Sanfte Ökonomie | `commerceEngine.js` | Regel 4, Impact Pool |
| **Presence** | Menschliche Anwesenheit | `sessionHooks.js` | Regel 1, 3 |
| **Trust** | Reputation ohne Ranking | `trustContext.js` | Regel 8, keine Gamification |
| **Auth** | Identität und Session | `AuthContext.jsx` | Regel 1 |
| **Chat** | Verbindung ermöglichen | `chatContext.js` | Grundpfeiler 1 |
| **Discovery** | Sinnvolle Begegnungen | `DiscoveryFeed.jsx` | Regel 3, 7 |

### 7.4 Zusätzliche verpflichtende Bestandteile

| Bestandteil | Begründung |
|---|---|
| **Constitution Mapping** | Jede Domäne muss explizit benennen, welche Goldenen Regeln sie berührt |
| **Anti-Patterns** | Was diese Domäne *niemals* tun darf (z. B. Feed: kein Infinite Scroll) |
| **Observability** | Metriken, Logs, Health Checks — ohne Engagement-Optimierung |
| **Migration Policy** | Wie Schema-/API-Änderungen abwärtskompatibel bleiben |
| **Red-Team Surface** | Bekannte Missbrauchsvektoren und Gegenmaßnahmen |
| **LOCKED Scope** | Welche Teile der Domäne geschützt sind |

### 7.5 Domain-Governance-Prozess

```
Neues Feature-Idee
       │
       ▼
  Betroffene Domäne identifizieren
       │
       ▼
  Domain Charter konsultieren ──► Verletzung? ──► RFC erstellen
       │                                              │
       ▼                                              ▼
  Innerhalb Charter-Grenzen? ──► Ja ──► Implementation (mit ADR-Referenz)
       │
       ▼ Nein
  RFC → ADR → Charter-Update → Implementation
```

---

## 8. Risiken

### 8.1 Organisatorische Risiken und Gegenmaßnahmen

| Risiko | Beschreibung | Wahrscheinlichkeit | Impact | Gegenmaßnahme |
|---|---|---|---|---|
| **Entscheidungsstau** | Zu viele Gates verlangsamen Entwicklung | Hoch (kleine Teams) | Hoch | Gestufte Governance (siehe §9); Emergency-ADR-Pfad |
| **Überdokumentation** | Mehr Dokumentation als Code | Mittel | Mittel | RFC/ADR nur bei signifikanten Entscheidungen; Templates mit Pflichtfeldern-Minimum |
| **Fehlende Verantwortlichkeiten** | „Everyone's responsibility is no one's" | Hoch (Wachstum) | Sehr hoch | Domain Owner Pflicht; RACI in Charter; ADI-Owner-Feld |
| **Architekturdrift** | Code weicht von ADRs ab | Hoch (langfristig) | Sehr hoch | Quartals-Review; PR-Template mit ADR-Referenz; automatisierter Drift-Check |
| **Wissensverlust** | Gründer/Architekten verlassen Team | Mittel | Sehr hoch | ADI als institutionalisiertes Gedächtnis; LOCKED-Dokumente; Pair-Ownership |
| **Unklare Ownership** | Doppelte Schreib-Rechte (bereits in HUI) | Hoch (aktuell) | Hoch | Domain Charter + [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md) verbindlich machen |
| **Inkonsistente Freigaben** | Manche PRs mit Review, manche ohne | Hoch | Hoch | Klare Signifikanz-Schwelle; Engineering Review Checkliste |
| **Governance-Theater** | Dokumente existieren, werden aber ignoriert | Mittel | Sehr hoch | Council-Review; CI-Checks auf ADR-Referenz; Red Team |
| **Constitution Erosion** | Schleichende Abweichung von Goldenen Regeln | Mittel | Katastrophal | Red Team; Constitution-Check in jedem ADI-Eintrag; LOCKED |
| **Governance-Eliten** | Wenige entscheiden für alle | Mittel (Jahr 2–4) | Hoch | Rotierende Reviewer; öffentliche RFCs (HUI-Philosophie: Transparenz) |
| **Externe Contributor Reibung** | Zu schwerer Einstieg | Hoch (Open Source) | Mittel | CONTRIBUTING.md mit Governance-Kurzform; Good-First-Issue ohne RFC |

### 8.2 Frühwarnsignale

| Signal | Bedeutung | Aktion |
|---|---|---|
| ADR ohne RFC | Governance-Umgehung | ADI-Audit; RFC nachträglich |
| PR ohne Domain-Zuordnung | Ownership-Drift | PR blockieren bis Charter-Referenz |
| Release ohne QA-Bericht | Qualitätslücke | Deploy-Gate verschärfen |
| > 3 Monate keine ADI-Aktualisierung | Governance-Verfall | Council-Review einberufen |
| Red Team nicht eingebunden bei KI/Feed | Philosophisches Risiko | Pflicht-Review aktivieren |

---

## 8. Risiken (Fortsetzung) — Notfallpfad

### 8.3 Emergency ADR

Für kritische Sicherheits- oder Stabilitätsprobleme:

1. Emergency ADR mit Status `Approved` erstellen (RFC nachträglich innerhalb 5 Werktagen)
2. Implementation sofort
3. Retrospektive Engineering Review + QA innerhalb 10 Werktagen
4. Council-Entscheidung: regulärer Pfad oder Governance-Anpassung

---

## 9. Skalierbarkeit

### 9.1 Governance-Stufenmodell

| Stufe | Teamgröße | Anwendbare Governance | Pflicht-Artefakte |
|---|---|---|---|
| **S0: Solo** | 1 Entwickler | Constitution + Entscheidungsregel | Constitution, Code-Kommentare bei Architekturwahl |
| **S1: Klein** | 2–5 | + Domain Model + ADR bei Signifikanz | + ADI (minimal), Domain Charters (Kern-Domänen) |
| **S2: Multi-Team** | 6–20 | + RFC-Prozess + Engineering Review | + RFC, Release Specs, QA-Berichte |
| **S3: Organisation** | 21–100 | + Architecture Council + Red Team | + Vollständiges ADI, alle Charters, LOCKED |
| **S4: Federation** | 100+ / international | + Domain Governance Boards + Stewardship | + Mehrsprachige Charters, rotierende Council-Mitglieder |

### 9.2 Bewertung nach Szenario

#### Einzelentwickler (S0)

- **Geeignet:** Constitution als Kompass, Entscheidungsregel (5 Fragen), Architecture Index
- **Nicht erforderlich:** RFC-Prozess, Council, formale QA
- **Risiko ohne Governance:** Architekturdrift, Wissensverlust bei Skalierung
- **Empfehlung:** ADR-Light (ein Absatz pro signifikanter Entscheidung in `docs/governance/adr/`)

#### Kleine Teams (S1)

- **Geeignet:** Domain Model, Kern-Domain Charters, ADI, Engineering Review (async)
- **Risiko:** Informelle Absprachen ersetzen Dokumentation
- **Empfehlung:** PR-Template mit Constitution-Checkliste (existiert in Constitution Anhang)

#### Mehrere Teams (S2)

- **Geeignet:** Vollständiger RFC → ADR → Release Spec Flow
- **Risiko:** Schnittstellen-Konflikte zwischen Domänen
- **Empfehlung:** Domain Owner als Pflichtrolle; monatlicher Architektur-Sync

#### Externe Entwickler (S2+)

- **Geeignet:** Öffentliche RFCs, klare CONTRIBUTING-Governance, Good-First-Issues ohne RFC
- **Risiko:** Constitution-Verstöße durch Unkenntnis
- **Empfehlung:** CONTRIBUTING.md mit 1-Seiten-Governance; automatischer Constitution-Check in CI

#### Open-Source-Beiträge (S2+)

- **Geeignet:** ADR-Referenz in PR; Domain Charter als CONTRIBUTING-Anhang
- **Risiko:** Governance-Theater oder Governance-Ignoranz
- **Empfehlung:** Bot-Kommentar bei fehlender ADR-Referenz; Maintainer als Domain Owner

#### Internationale Organisation (S4)

- **Geeignet:** Mehrsprachige Domain Charters; rotierende Council-Mitglieder; asynchrone RFC-Review (min. 7 Tage)
- **Risiko:** Zeitzone-/Sprachbarrieren verzögern Entscheidungen
- **Empfehlung:** RFC-Diskussionsfenster; Domain Governance Boards mit regionaler Vertretung

#### Langfristige Wartung (alle Stufen)

- **Geeignet:** ADI als institutionalisiertes Gedächtnis; LOCKED für stabile Kernentscheidungen
- **Risiko:** Veraltete ADRs werden befolgt; neue Entwickler lesen nicht
- **Empfehlung:** Jährlicher Governance-Health-Check; `Superseded`-Pflicht bei Änderungen; Onboarding-Modul „Architecture 101"

---

## 10. Engineering-Empfehlung

### 10.1 Sofortmaßnahmen (keine Code-Änderung)

| # | Maßnahme | Aufwand | Impact |
|---|---|---|---|
| 1 | Ratifizierung RFC-000A durch Architecture Council | Gering | Governance-Grundlage |
| 2 | ADI anlegen (`docs/governance/ADI.md`) mit Initial-Einträgen für Constitution + bestehende Architektur | Gering | Entscheidungssichtbarkeit |
| 3 | Domain Model dokumentieren (`docs/governance/domain-model/HUI_DOMAIN_MODEL.md`) | Mittel | Strukturelle Klarheit |
| 4 | Domain Charters für Kern-Domänen (Core, Registry, Orb, Feed) | Mittel | Ownership-Klarheit |
| 5 | PR-Template um ADR-Referenz und Constitution-Check erweitern | Gering | Drift-Prävention |
| 6 | `SYSTEM_OWNERSHIP.md` in Domain Charters überführen | Mittel | Konsolidierung |

### 10.2 Mittelfristig

| # | Maßnahme |
|---|---|
| 7 | Architecture Council formalisieren (auch bei 2–3 Personen) |
| 8 | Red-Team-Review für Intelligence- und Feed-Domäne |
| 9 | Quartals-ADI-Review als wiederkehrendes Ritual |
| 10 | CI-Check: PR mit `architecture-significant` Label erfordert ADR-Referenz |

### 10.3 Langfristig

| # | Maßnahme |
|---|---|
| 11 | LOCKED-Status für Constitution, Registry-Semantik, Core Engine Datenmodell |
| 12 | Domain Governance Boards bei Team-Wachstum > 20 |
| 13 | Governance-Health-Metrik (nicht Engagement-Metrik!) — z. B. ADR-Abdeckung, Drift-Rate, Charter-Aktualität |
| 14 | Stewardship-Integration (Community-Governance aus [`GOVERNANCE_FOUNDATION_MAP.md`](../GOVERNANCE_FOUNDATION_MAP.md)) |

### 10.4 Was bewusst nicht empfohlen wird

| Nicht tun | Begründung |
|---|---|
| 11-Level-Hierarchie beibehalten | Kategoriefehler; verwirrt langfristig |
| RFC für jede Code-Änderung | Überdokumentation; Entscheidungsstau |
| Governance vor Constitution | Constitution ist bereits ratifiziert und korrekt positioniert |
| Produktentscheidungen in ADRs | ADR = Architektur; Produkt = PO + Product Architecture |
| Engagement-Metriken für Governance-Health | Widerspricht Constitution Regel 2 |

### 10.5 Erfolgskriterien

Die Governance ist erfolgreich, wenn:

1. **Jede signifikante Architekturentscheidung** im ADI auffindbar ist
2. **Jede Domäne** einen aktuellen Charter mit klarem Owner hat
3. **Kein PR** die Constitution verletzt, ohne dokumentierte Ausnahme
4. **Neue Teammitglieder** in < 1 Tag die Governance verstehen (Onboarding)
5. **In 10 Jahren** noch nachvollziehbar ist, *warum* eine Entscheidung getroffen wurde
6. **Architekturdrift** quartalsweise erkannt und adressiert wird
7. **Kleine Teams** die Governance nicht als Last, sondern als Kompass erleben

---

## Anhang A — Template-Referenzen

### RFC-Template (Kurz)

```markdown
# RFC-NNN — Titel
**Status:** Draft | **Domain:** | **Autor:** | **Datum:**

## Problem
## Kontext (Constitution-Bezug)
## Vorgeschlagene Lösung
## Alternativen
## Auswirkungen (Domänen, Daten, Schnittstellen)
## Offene Fragen
```

### ADR-Template (Kurz)

```markdown
# ADR-NNN — Titel
**Status:** Draft | **RFC:** RFC-NNN | **Domain:** | **Datum:**

## Kontext
## Entscheidung
## Begründung
## Konsequenzen (positiv / negativ)
## Constitution-Check
## Alternativen (verworfen)
```

### Domain Charter-Template (Kurz)

```markdown
# Domain Charter — [Name]
**Owner:** | **Status:** | **Constitution-Bezug:**

## Mission
## Verantwortlichkeit (In/Out of Scope)
## Datenbesitz
## Schnittstellen & Events
## Abhängigkeiten
## Anti-Patterns
## ADRs | RFCs | Releases
## LOCKED Scope
```

---

## Anhang B — Bezug zu bestehenden HUI-Dokumenten

| Bestehendes Dokument | Rolle in neuer Governance |
|---|---|
| [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md) | Level 0 — ratifiziert, LOCKED-Kandidat |
| [`docs/ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) | Vorstufe Domain Model — zu überführen |
| [`docs/SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md) | Vorstufe Datenbesitz in Domain Charters |
| [`docs/GOVERNANCE_FOUNDATION_MAP.md`](../GOVERNANCE_FOUNDATION_MAP.md) | Stewardship-Ergänzung zur technischen Governance |
| [`CODEBASE.md`](../../CODEBASE.md) | Operative Code-Landkarte — referenziert Domain Model |
| Constitution Anhang (PR-Checkliste) | Vorstufe Engineering Review |

---

## Anhang C — Glossar

| Begriff | Definition |
|---|---|
| **ADI** | Architecture Decision Index — zentrales Entscheidungsregister |
| **ADR** | Architecture Decision Record — bindende Architekturentscheidung |
| **Architecture Council** | Gremium aus Product + Engineering Architecture |
| **Domain Charter** | Verbindlicher Vertrag einer Domäne |
| **Domain Model** | Strukturelle Landkarte aller Domänen |
| **Engineering Review** | Technische Prüfung vor/während Implementierung |
| **LOCKED** | Terminaler Schutzstatus — Änderung nur via neuem RFC |
| **RFC** | Request for Comments — strukturierter Vorschlag |
| **Release Specification** | Konkreter Lieferumfang eines Releases |
| **Stewardship** | Pflege-Orientierung statt Kontrolle (HUI-Philosophie) |

---

*RFC-000A definiert die Governance. Sie implementiert nichts.*  
*Sie ist der Rahmen, in dem alle zukünftigen Architekturentscheidungen getroffen werden.*  
*Grundlage aller Entscheidungen bleibt: [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)*

---

**Nächster Schritt:** Architecture Council Review → Discussion → Ratifizierung → ADR-0001 (Architecture Governance Adoption)
