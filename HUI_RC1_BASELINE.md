# HUI RC1 Baseline

**Status:** AKTIV — Single Source of Truth für RC1  
**Festgelegt:** 2026-07-15  
**Repository:** `hui-humanUnitedIntelligent/be-hui`

---

## RC1-Ausgangsbasis

| Feld | Wert |
|------|------|
| **Feed-Basis-Commit** | `30c98d287d79c7c9978b6a1b9cefc7384f84e14c` |
| **Branch-HEAD (Recovery)** | `80a5ed58d58397ce7dfe50352e36f1787c075cbb` |
| **Branch** | `cursor/feed-recovery-base` |
| **Pull Request** | [#147](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/147) |

> Der Feed-Stand entspricht exakt Commit `30c98d28`. Der Branch-HEAD `dbd5f922` enthält zusätzlich selektive RC2-Stabilisierung (keine Feed-UI-Änderungen) und Recovery-Dokumentation.

---

## Build-Verifikation

Ausgeführt am **2026-07-15** (Cloud-Agent-Umgebung):

| Prüfung | Ergebnis | Details |
|---------|----------|---------|
| `npm install` | ✅ PASS | Clean install nach `rm -rf node_modules` |
| `npm run build` | ✅ PASS | 799 Module, Vite build in 5.40s |
| Merge-Konflikte | ✅ Keine | Working tree clean; Feed-UI 0 Diff-Zeilen gegenüber `30c98d28` |

### Build-Warnungen (pre-existing, nicht blockierend)

- Duplicate `textAlign` in `TalentProfilePage.jsx` (ESBuild-Warnung)
- Chunk-Size-Warnung `Home-*.js` > 500 kB

---

## Vercel Deployment

| Feld | Wert |
|------|------|
| **Deploy-URL (Preview)** | https://be-hui-git-cursor-f-2ce7ba-hui-humanunitedintelligents-projects.vercel.app |
| **Build-ID** | `C9Xh8L2QBJQHQJx2mpd7UC6UqKsa` |
| **Vercel Dashboard** | https://vercel.com/hui-humanunitedintelligents-projects/be-hui/C9Xh8L2QBJQHQJx2mpd7UC6UqKsa |
| **Zeitpunkt** | 2026-07-15 14:34:12 UTC |
| **Status** | ✅ Ready (Vercel GitHub Integration, PR #147) |
| **Deployed Branch** | `cursor/feed-recovery-base` (nicht `main`) |

### Deployment-Bestätigung

- Vercel Status Check: **SUCCESS**
- Preview-URL erreichbar (HTTP 200, Login-Seite geladen)

---

## Warum dieser Branch als RC1-Basis gewählt wurde

1. **Letzter stabiler Feed vor Optimierungen** — `30c98d28` ist der letzte Commit vor `8855ae6c` (Perf Batch 1) und der widersprüchlichen Feed-Sprint-Kette (V2, V3, Reality Check) auf `main`.

2. **Keine Feed-Experimente** — Feed-UI-Dateien (`useFeedStream.js`, `UnifiedFeed.jsx`, `FeedScrollSentinel.jsx`, `FeedEventsSection.jsx`, `FeedRouter.jsx`) sind unverändert.

3. **Buildbar und deploybar** — `npm install` + `npm run build` erfolgreich; Vercel Preview live.

4. **Selektive Stabilisierung** — RC2-Fixes (Hooks, Overlays, Debug-Guards) ohne Feed-Architekturänderungen.

5. **Entscheidung** — Der bisherige `main`-Feed wird nicht weiter repariert. Alle RC1-Bugfixes beginnen auf dieser Basis.

---

## Regeln ab diesem Stand

| Erlaubt | Nicht erlaubt |
|---------|---------------|
| Reproduzierbare Bugfixes (1 PR pro Bug) | Neue Features |
| Build-Fixes | Performance-Sprints |
| Crash-Fixes | Architekturänderungen |
| Sicherheits-Fixes | Feed-Experimente |
| Datenfehler-Korrekturen | Refactorings |

**Geräte-QA** (Safari, Firefox, Android) erfolgt ausschließlich gegen diese Recovery-Version.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Recovery-Branch baut erfolgreich | ✅ |
| Recovery-Deploy verfügbar | ✅ |
| RC1-Basis dokumentiert | ✅ |
| Keine Feed-Änderungen vorgenommen | ✅ |
| Recovery-Branch ist Referenz für Bugfixes | ✅ |

---

## Referenzen

- [HUI_FEED_RECOVERY_PLAN.md](./HUI_FEED_RECOVERY_PLAN.md) — vollständige Recovery-Analyse
- [PR #147](https://github.com/hui-humanUnitedIntelligent/be-hui/pull/147) — Recovery-Branch PR
- [Vercel Deployment](https://vercel.com/hui-humanunitedintelligents-projects/be-hui/C9Xh8L2QBJQHQJx2mpd7UC6UqKsa) — Build-Details
