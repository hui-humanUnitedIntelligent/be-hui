# Performance Report — ARCH-006.1

## Timings

| Stage | ms | Anteil |
|-------|-----|--------|
| evaluation | 160 | 50% |
| repositoryScan | 154 | 48% |
| contractLoading | 6 | 2% |
| ruleCompilation | 1 | 0% |

| **Gesamt** | **321** | 100% |

## Pro Datei / Regel

- Scan: 0.42 ms/Datei
- Evaluation: 0.43 ms/Datei
- Pro Regel: 0.57 ms

## Memory

- Heap: 23 MB / 53 MB
- RSS: 108 MB

## Caching

- Deterministisch: ✅
- Cached Eval: 108 ms (32% schneller)
