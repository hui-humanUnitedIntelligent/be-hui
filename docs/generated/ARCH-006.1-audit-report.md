# ARCH-006.1 — Vollständiger Auditbericht

**Datum:** 2026-06-30T16:22:17.265Z  
**Version:** ARCH-006.1  
**Zweck:** Validierung der Behauptung „Domain Contracts sind die einzige fachliche Wahrheit"

---

## 1. Policy Engine Validierung

Status: **PASS** — 25/25 Checks bestanden.

Alle 7 Komponenten (Contract Loader, Domain Resolver, Policy Compiler, Rule Compiler, Evaluator, Health Engine, Explanation Engine) sind implementiert und funktionsfähig. Regeln werden ausschließlich aus `domain-contracts.json` kompiliert.

## 2. Contract Coverage

370 Dateien gescannt, 297 mit Domain (80%), 73 UNKNOWN, 34 Multi-Domain.

## 3. Rule Coverage

283 Regeln kompiliert, 127 ausgelöst, 172 nie ausgelöst (enforceable).

## 4. Violation Analyse

1090 Violations: CRITICAL=811, HIGH=159, MEDIUM=67, LOW=3, INFO=50.

## 5. CRITICAL Ursachenanalyse

811 CRITICAL (74%). Hauptursache: **neverWrite → CROSS_DOMAIN_WRITE** (719). ARCH-005 hatte 42 CRITICAL — Inflationsfaktor 19.3x.

## 6. Severity Bewertung

CRITICAL ist überkalibriert (74% aller Violations). ADR-002 und SEVERITY_BY_TYPE weichen bei 1 Regeltypen ab.

## 7. False Positives

~11% wahrscheinliche False Positives (DOMAIN_TABLE_OWNER Reads, INFO-Header, UNKNOWN).

## 8. False Negatives

73 Dateien ohne Domain-Zuordnung — unvollständige Evaluierung.

## 9. Scanner Analyse

Policy Engine Adoption: 2/6. Legacy-Konstanten: 1.

## 10. Authority Analyse

Authority hat 11 Layer-Domains parallel zu 14 Business-Domains. Registry-Mismatch: Ja (erwartet).

## 11. Intelligence Analyse

Exklusiv Policies: Nein. Fallback-Regeln: Ja (ARCHITECTURE_RULES, RECOMMENDATIONS).

## 12. Performance

Gesamt: 321ms für 370 Dateien, 283 Regeln. Akzeptabel: Ja.

## 13. Konsistenzprüfung

2 Brüche dokumentiert (1 erwartet, 1 kritisch).

## 14. Risiken

1. **Severity Inflation** — 811 CRITICAL blockieren CI, verlieren Signalwert
2. **Doppelte Evaluierung** — checkNeverWrite + evaluateCrossDomainWrites überlappen
3. **70 UNKNOWN Dateien** — 19% des Repos ohne Domain-Evaluierung
4. **Parallele Regelquellen** — Authority CANONICAL_DOMAINS, Intelligence ARCHITECTURE_RULES
5. **Registry-Mismatch** — Layer-Domains (RFC-000) vs Business-Domains (Contracts)

## 15. Empfehlungen (vor ARCH-007)

1. neverWrite-Severity von CRITICAL auf HIGH kalibrieren
2. Doppelte CROSS_DOMAIN_WRITE-Evaluierung deduplizieren
3. 70 UNKNOWN-Dateien in Contracts aufnehmen
4. Authority CANONICAL_DOMAINS durch Contract-Lookup ersetzen
5. Intelligence validate.js auf Policy Engine umstellen
6. RECOMMENDATIONS-Konstante durch explanationEngine ersetzen
7. ADR-002 mit SEVERITY_BY_TYPE harmonisieren

## 16. Was muss vor ARCH-007 korrigiert werden?

| Priorität | Maßnahme | Typ |
|-----------|----------|-----|
| P0 | Severity-Kalibrierung CRITICAL | Empfehlung |
| P0 | UNKNOWN-Dateien mappen | Empfehlung |
| P1 | Duplikat-Evaluierung entfernen | Empfehlung |
| P1 | Authority Legacy-Registries entfernen | Empfehlung |
| P2 | Intelligence Fallback-Regeln entfernen | Empfehlung |

## 17. Belastbare Zahlen

| Zahl | Belastbarkeit | Begründung |
|------|---------------|------------|
| 14 Contracts | ✅ Hoch | Direkt aus JSON |
| 182 Policies | ✅ Hoch | Deterministisch kompiliert |
| 283 Regeln | ✅ Hoch | Deterministisch kompiliert, keine Duplikate |
| 367 Dateien | ✅ Hoch | fileScanner Zählung |
| 1090 Violations | ⚠️ Mittel | Enthält Duplikate und Inflation |
| 811 CRITICAL | ❌ Niedrig | 19x Inflation vs ARCH-005, neverWrite-Überzählung |
| 70 UNKNOWN | ✅ Hoch | domainResolver Ergebnis |
| 172 tote Regeln | ✅ Hoch | Regel-Violation-Matching |

## Fazit

**Die Behauptung ist größtenteils bewiesen:** Domain Contracts sind die einzige Quelle für Policies und Regeln. Der Scanner, Evaluator und Health Engine leiten alles aus Contracts ab. **Einschränkungen:** Authority und Intelligence haben noch parallele Legacy-Quellen. Violation-Zahlen sind durch Severity-Inflation und Doppelzählung nicht direkt vergleichbar mit ARCH-005.