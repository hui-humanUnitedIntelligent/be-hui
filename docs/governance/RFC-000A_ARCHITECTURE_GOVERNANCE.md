# RFC-000A — Architecture Governance

**Status:** Ratifiziert  
**Version:** 1.0  
**Datum:** 2026-06-30

---

## 1. Geltungsbereich

Dieses RFC regelt, wie Architekturentscheidungen getroffen, dokumentiert und durchgesetzt werden.

---

## 2. Governance-Prinzipien

### 2.1 Constitution First
Keine Architekturänderung darf die Goldenen Regeln oder Grundpfeiler der Constitution verletzen.

### 2.2 Domain Sovereignty
Jede Domäne besitzt ihre Daten, Services und State-Owner. Fremdzugriff nur read-only über definierte Interfaces.

### 2.3 Progressive Enforcement
Verstöße werden zuerst dokumentiert, dann migriert. Kein Big-Bang-Refactoring.

### 2.4 No Behavior Change in Enforcement Releases
Releases wie CORE-001 ändern kein Laufzeitverhalten — nur Sichtbarkeit und Guards.

---

## 3. Domänen-Grenzen

| Grenze | Regel |
|---|---|
| UI → DB | Verboten (Ausnahme: Create-Flows, Admin, Auth) |
| UI → fremde Domäne (write) | Verboten |
| Hook → DB (write) | Verboten (Ausnahme: dedizierte State-Owner-Hooks) |
| Service → fremde Domäne (write) | Verboten ohne expliziten Contract |
| Core Engine → UI | Verboten (nur Daten nach oben) |

---

## 4. Ownership-Modell

```
Owner = Datei/Modul das Supabase schreibt UND lokalen State hält
Consumer = Liest nur via Props, Context, Hook-Return
```

Single Owner pro Datensystem. Duplikat-States sind Verstöße (siehe SYSTEM_OWNERSHIP.md).

---

## 5. Review-Pflichten

### Pull Request Checklist
```
□ Domäne deklariert (@domain oder ownership.js Eintrag)?
□ Kein neuer direkter supabase.from() in UI?
□ Action Engine für Navigation/State-Übergänge?
□ Texte aus HuiRegistry.LANG?
□ Constitution-Check bestanden?
```

### Architektur-Review erforderlich bei
- Neuer Domäne oder Service
- Änderung an Core Engine / Registry
- Neue direkte DB-Zugriffe
- Cross-Domain-Abhängigkeiten

---

## 6. Violation Lifecycle

```
ENTDECKT → DOKUMENTIERT (violations.js) → MARKIERT (TODO(ADR-0001)) → MIGRIERT → ENTFERNT
```

Prioritäten: P0 (Sicherheit/Datenintegrität) → P1 (Ownership) → P2 (Action Engine) → P3 (Kosmetik)

---

## 7. Akzeptierte Ausnahmen

| Ausnahme | Begründung |
|---|---|
| Create-Flows (HuiCreateFlow, WerkPublisher, etc.) | Isolierte Transaktionen |
| DiagnosePage | Admin-Tool |
| EditProfile / ProfileCompletionFlow | Legitimer Profil-Schreibpfad |
| LoginPage | Auth-Flow |
| Backend Edge Functions | Server-seitige Ownership |

---

## Referenzen

- [ADI.md](ADI.md)
- [ADR-0001](adr/ADR-0001_ADOPTION_OF_CORE_ARCHITECTURE.md)
- [SYSTEM_OWNERSHIP.md](../SYSTEM_OWNERSHIP.md)
