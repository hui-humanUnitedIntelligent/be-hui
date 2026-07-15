# HUI RC1-006 — `invs` ReferenceError Fix

**Ticket:** RC1-006  
**Priorität:** P0  
**Datum:** 2026-07-15  
**Vorgänger:** RC1-005 (Runtime-Beweis)

---

## Änderung

Ausschließlich `...invs` aus `fetchFeedPage()` entfernt — keine weiteren Code-Änderungen.

### Diff

```diff
--- a/src/feed/useFeedStream.js
+++ b/src/feed/useFeedStream.js
@@ -161,7 +161,7 @@ async function fetchFeedPage(userId = null, cursors = null) {
     }
   }
 
-  const allRows = [...works, ...exps, ...beitr, ...invs];
+  const allRows = [...works, ...exps, ...beitr];
   const userIds = [...new Set(allRows.map(r => r.user_id || r.creator_id).filter(Boolean))];
```

**Datei:** `src/feed/useFeedStream.js`  
**Zeile:** 164 (nach Patch)

`fetchSearchResults()` bei Zeile ~518 unverändert — dort ist `invs` korrekt definiert.

---

## Build

```bash
npm run build
```

| Ergebnis | Status |
|----------|--------|
| `vite build` | ✅ Erfolg (6.34s, 804 Module) |
| Output | `dist/` |

---

## Feed-Test

### Dev (`http://127.0.0.1:5173/Home`, authentifizierter Browser)

| Prüfpunkt | Ergebnis |
|-----------|----------|
| `ReferenceError: invs is not defined` | ✅ **Nein** |
| `window.__HUI_STREAM_DEBUG__` | works=10, beitraege=10, exps=0 |
| `window.__HUI_FEED_REALITY__.feedListLength` | **20** |
| `window.__HUI_FEED_REALITY__.domCards` | **5** (Virtualizer) |
| EmptyState („Noch keine Beiträge") | ✅ **Nein** |

### Production Preview (`npm run preview` → `http://127.0.0.1:4173/Home`)

| Prüfpunkt | Ergebnis |
|-----------|----------|
| `ReferenceError: invs is not defined` | ✅ **Nein** |
| `feedListLength` | **20** |
| `domCards` | **5** |
| Feed zeigt Beiträge | ✅ **Ja** |

---

## Optional dokumentiert (NICHT behoben)

Die `experiences`-Query in `fetchFeedPage()` liefert weiterhin HTTP 400:

```
expsErr: "column experiences.is_live does not exist"
```

→ `exps = 0` in der Runtime, aber **works + beitraege = 20 Items** reichen für einen gefüllten Feed.  
Behebung von `is_live` ist **bewusst aus diesem PR ausgeschlossen**.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Kein ReferenceError mehr | ✅ |
| Feed zeigt wieder Beiträge | ✅ (20 Items, 5 DOM-Karten sichtbar) |
| Keine weiteren Änderungen | ✅ (1 Zeile) |

---

## Deploy

Branch `cursor/hui-rc1-006-invs-fix-e9e9` → Merge → Vercel/Production Deploy wie üblich nach PR-Freigabe.
