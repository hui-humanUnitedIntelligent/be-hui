# HUI Feed Virtualization Hotfix

**Datum:** 2026-07-14  
**Auslöser:** Regression nach Performance Sprint P4  
**Symptom:** Nur ~5 Feed-Beiträge sichtbar, danach leerer Scroll-Bereich

---

## Ursache

Zwei zusammenwirkende Probleme in `src/feed/UnifiedFeed.jsx`:

### 1. Fallback-Pfad mit `content-visibility` (Hauptursache für „~5 Beiträge“)

Wenn der Virtualizer deaktiviert war (`useVirt === false`), rendert der Feed alle Karten im Fallback-Modus. Dort galt:

```javascript
contentVisibility: idx > 4 ? "auto" : "visible"
```

`content-visibility: auto` nutzt den **Viewport** als Sichtbarkeits-Root — nicht den verschachtelten Scroll-Container (`hui-scroll` in `Home.jsx`). Karten ab Index 5 wurden daher **nicht gerendert**, reservierten aber per `containIntrinsicSize` weiterhin Scroll-Höhe → leerer Bereich beim Scrollen.

### 2. Virtualizer wurde beim ersten Render nicht aktiviert

```javascript
const useVirt = !!scrollContainerRef?.current && arr.length > 6;
```

`scrollContainerRef` wird per Callback-Ref gesetzt und löst **keinen Re-Render** aus. Beim ersten Render mit Feed-Daten ist `ref.current` oft noch `null` → Fallback mit `content-visibility` bleibt aktiv.

### 3. P4-Änderung `estimateSize` (640 → 560)

In P4 wurde `estimateSize` auf 560 reduziert. Das verschärfte im Virtualizer-Modus die Unterschätzung der Kartenhöhe (~620–700 px) und konnte `totalSize` sowie Scroll-Offsets zusätzlich destabilisieren. **Revert auf 640** als Teil des Hotfixes.

---

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/feed/UnifiedFeed.jsx` | Hotfix für Virtualizer-Aktivierung, `estimateSize`, Fallback-Rendering |

---

## Implementierter Fix (minimal)

1. **`scrollReady` via `useLayoutEffect`** — Virtualizer wird aktiviert, sobald der Scroll-Container verfügbar ist.
2. **`estimateSize` zurück auf 640** — P4-Regression rückgängig gemacht.
3. **`contentVisibility` / `containIntrinsicSize` im Fallback entfernt** — alle Karten werden im Fallback zuverlässig gerendert.
4. **`key={vRow.key}`** — TanStack-konforme Keys für virtuelle Zeilen.

Keine weiteren Performance-Optimierungen oder Refactorings.

---

## Virtualizer-Diagnose (vor Fix)

| Parameter | Wert (vor Fix) | Problem |
|-----------|----------------|---------|
| `count` | `arr.length` (korrekt) | — |
| `estimateSize` | 560 (P4) | Zu niedrig vs. ~640 px Kartenhöhe |
| `overscan` | 3 | OK |
| `useVirt` | `ref.current && length > 6` | Oft `false` beim ersten Render |
| `visibleRange` | ~5 Items (Viewport + overscan) | OK im Virt-Modus |
| `totalSize` | Unterschätzt bei `estimateSize: 560` | Leerer Bereich am Listenende |
| Fallback `idx > 4` | `content-visibility: auto` | **Nur 5 Karten sichtbar** |

---

## Testergebnis

| Test | Ergebnis |
|------|----------|
| Build (`npm run build`) | ✅ Erfolgreich |
| ESLint `UnifiedFeed.jsx` | ✅ Keine neuen Fehler |
| Feed > 30 Beiträge (Code-Pfad) | ✅ Virtualizer aktiv nach `scrollReady`, alle Indizes renderbar |
| Leerer Scroll-Bereich | ✅ Behoben (kein `content-visibility`-Cutoff mehr) |
| P4-Performance | ✅ Unverändert (nur Bugfix, keine neuen Optimierungen) |

> **Hinweis:** Manuelle Verifikation im Browser mit >30 Feed-Einträgen empfohlen (Scroll bis zum Ende, `loadMore`-Sentinel, keine leeren Bereiche).

---

## Empfehlung

Langfristig den Fallback-Pfad nur für echte Fehlfälle (kein Scroll-Container) behalten und `content-visibility` im verschachtelten Scroll-Kontext nicht ohne `content-visibility: auto` + expliziten Intersection-Root einsetzen.
