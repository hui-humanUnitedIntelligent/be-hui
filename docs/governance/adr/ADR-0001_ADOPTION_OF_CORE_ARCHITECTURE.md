# ADR-0001 — Adoption of Core Architecture

**Status:** Angenommen  
**Datum:** 2026-06-30  
**Autor:** HUI Architecture Team  
**Bezug:** CORE-001

---

## Kontext

Die HUI-Plattform wuchs organisch. Direkte Supabase-Zugriffe, verteilter State und fehlende Domain-Grenzen erschweren Wartbarkeit und Vertrauen in die Architektur. Die HUI Constitution definiert ein Schichtenmodell, das bisher nur dokumentiert, nicht technisch durchgesetzt wurde.

---

## Entscheidung

Wir adoptieren das **Core Architecture Model** mit folgenden verbindlichen Regeln:

### 1. Schichtenmodell

```
Constitution → Registry → Core Engine → Domain Engines → Domain Services → UI
```

### 2. Domain Ownership

Jede Datei gehört genau einer Domäne. Jeder Datensystem-Besitz hat genau einen Owner.

### 3. Zugriffsregeln

| Schicht | Darf schreiben | Darf lesen |
|---|---|---|
| UI (Components/Pages) | ❌ Kein direktes DB | ✅ via Hooks/Context |
| Hooks | ⚠️ Nur Presentation-State | ✅ via Services |
| Domain Services | ✅ Eigene Domäne | ✅ Eigene + fremde (read-only) |
| Contexts (State Owners) | ✅ Delegiert an Services | ✅ Eigener Scope |
| Core Engine | ✅ Wirkungsdaten | ✅ Alle (aggregiert) |

### 4. Action Engine Pflicht

Navigation und State-Übergänge laufen über `useHuiActions()` / `A.*`. Direkte `setState`/`navigate`-Aufrufe in Feature-Komponenten sind Verstöße.

### 5. Enforcement-Strategie (CORE-001)

- **Phase 1 (dieses Release):** Dokumentation, Guards, Violation-Marker — keine Verhaltensänderung
- **Phase 2:** Migration kritischer Verstöße zu Domain Services
- **Phase 3:** ESLint-Regeln für Architekturgrenzen

---

## Konsequenzen

### Positiv
- Architektur wird technisch nachvollziehbar
- Verstöße sind sichtbar und priorisierbar
- Neue Entwickler haben klare Grenzen

### Negativ
- Bestehende Verstöße bleiben temporär aktiv (mit Markern)
- Migration erfordert sequenzielle PRs pro Domäne

### Neutral
- Keine UI-, Routing- oder Businesslogik-Änderung in CORE-001

---

## Verletzte Regeln (bekannt, CORE-001 Audit)

Siehe `docs/CORE-001_AUDIT_REPORT.md` und `src/architecture/violations.js`.

---

## Referenzen

- [HUI_CONSTITUTION.md](../../../HUI_CONSTITUTION.md) — Abschnitt IV
- [RFC-000A](../RFC-000A_ARCHITECTURE_GOVERNANCE.md)
- [RFC-000](../RFC-000_DOMAIN_MODEL.md)
- [CORE Domain Charter](../CORE_DOMAIN_CHARTER.md)
