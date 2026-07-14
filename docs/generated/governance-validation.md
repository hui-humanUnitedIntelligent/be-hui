# Governance Validation — ARCH-006.1

**Generiert:** 2026-06-30T16:22:17.265Z  
**Status:** PASS (25/25 Checks bestanden)

## Policy Engine Audit

### contractLoader

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| domains array present | ✅ |
| byId index built | ✅ |
| no hardcoded domains in loader | ✅ |
| source is domain-contracts.json | ✅ |

### domainResolver

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| resolves known contract files | ✅ |
| returns UNKNOWN for unmapped | ✅ |
| import matrix from contracts | ✅ |
| no local domain list | ✅ |

### policyCompiler

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| all domains have policies | ✅ |
| policies derive from contracts only | ✅ |
| constitution refs propagated | ✅ |

### ruleCompiler

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| rules from policies only | ✅ |
| RULE_TYPE_MAP defined | ✅ |
| SEVERITY_BY_TYPE defined | ✅ |
| deduplication active | ✅ |

### evaluator

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| evaluateScanResults produces violations | ✅ |
| violations have ruleId | ✅ |
| cross-domain write detection | ✅ |
| import evaluation active | ✅ |

### healthEngine

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| domain health computed | ✅ |
| policy health computed | ✅ |
| 16 dimensions defined | ✅ |

### explanationEngine

Status: **PASS**

| Check | Ergebnis |
|-------|----------|
| enrichViolation adds explanation | ✅ |
| confidence score present | ✅ |
| migration hints defined | ✅ |

## Health Validation

- Domain Health reproducible: ✅
- Policy Health deterministic: ✅
- Overall Score: 70%

