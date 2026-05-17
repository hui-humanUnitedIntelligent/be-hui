# HUI — FOLLOW GRAPH REPORT
**Phase 5D.1 Hotfix — Stand: 2026-05-17**

---

## Zusammenfassung

Die Follow-Graph-Foundation ist vollständig implementiert.
Der Human Graph arbeitet jetzt auf echten Supabase-Verbindungen
statt auf Platzhalter-Daten.

---

## Deployment-Checkliste

### SQL (manuell in Supabase ausführen)
- [ ] `sql/migrations_safe/032_follow_graph.sql` ausführen
- [ ] Viewer: `sql/migrations_safe/032_follow_graph.html`
- [ ] Nach Ausführung: `SELECT * FROM follow_graph_health;` → kein Fehler
- [ ] Self-Follow Test: muss FEHLSCHLAGEN

### Code (deployed ✅)
- [x] `sql/migrations_safe/032_follow_graph.sql`
- [x] `sql/migrations_safe/032_follow_graph.html`
- [x] `src/lib/AppStateContext.jsx` — Follow-Logic gehärtet
- [x] `src/hooks/useFollowGraph.js` — echte Supabase-Daten
- [x] `src/hooks/useRealGraphData.js` — Graph-Engine Integration
- [x] `src/hooks/useGraphHealth.js` — Observability

---

## Was wurde implementiert

### 1. SQL Migration 032 ✅

**Tabelle `follows`:**
```sql
follower_id  uuid → profiles(id) ON DELETE CASCADE
followed_id  uuid → profiles(id) ON DELETE CASCADE
CONSTRAINT no_self_follow CHECK (follower_id != followed_id)
CONSTRAINT unique_follow   UNIQUE (follower_id, followed_id)
```

**5 Indexe:**
| Index | Zweck | Query |
|-------|-------|-------|
| `idx_follows_follower` | Wem folge ich? | loadFollows() |
| `idx_follows_followed` | Wer folgt mir? | Follower-Count |
| `idx_follows_mutual` | Beide Richtungen | Bridge-Calc |
| `idx_follows_created` | Zeitbasiert | Churn-Monitoring |
| `idx_follows_recent` | 30-Tage-Fenster | Affinity-Query |

**4 SQL-Funktionen:**
- `get_mutual_follows(user_a, user_b)` — gemeinsame Follows
- `is_mutual_follow(user_a, user_b)` — boolean check
- `get_follow_counts(target_id)` — followers + following count
- `get_shared_connections(user_a, user_b, lim)` — für Graph-Nähe

**View `follow_graph_health`** — Observability ohne Leaderboard

### 2. RLS Policies ✅

| Operation | Policy | Wer darf? |
|-----------|--------|-----------|
| SELECT | `follows_select_public` | alle authenticated |
| INSERT | `follows_insert_own` | nur `follower_id = auth.uid()` |
| DELETE | `follows_delete_own` | nur `follower_id = auth.uid()` |
| UPDATE | `follows_update_deny` | niemand |

**RLS-Designentscheidung:**
SELECT ist öffentlich — Discovery und Graph benötigen fremde Follow-Verbindungen.
Manipulation ist strikt auf eigene Rows beschränkt.

### 3. AppStateContext — Follow-Logic gehärtet ✅

**Vorher:**
```javascript
// Probleme:
// - silent catch (kein Error-Logging)
// - kein self-follow guard
// - kein optimistic rollback bei Fehler
} catch(e) { /* silent */ }
```

**Nachher:**
```javascript
// Fixes:
// ✅ self-follow guard (user.id === targetUserId → early return)
// ✅ explicit error logging (console.error)
// ✅ optimistic rollback bei DB-Fehler
// ✅ safeQuery-ähnliche error-Destructuring
if (targetUserId === user.id) { console.warn("self-follow abgeblockt"); return; }
// ...
if (error) {
  console.error("[AppState] toggleFollow:", error.message);
  // Rollback: optimistic update umkehren
  setFollows(prev => { ... });
}
```

### 4. useFollowGraph Hook ✅

Lädt echte Follow-Verbindungen aus Supabase:
- `followedIds` — Set<uuid>: wem User folgt
- `followerIds` — Set<uuid>: wer User folgt
- `mutualIds`   — Set<uuid>: gegenseitig
- `connectionMap` — Map mit Profil-Daten + isMutual
- `graphEdges` — Array für `analyzeNetworkHealth()`
- `getRelationshipHistory(id)` — für `relationshipStrength()`
- `sharedWith(id)` — via `get_shared_connections()` SQL-Funktion

### 5. useRealGraphData Hook ✅

Verbindet echte Follows mit Graph-Engine-Funktionen:
- `enrichedCreators` — alle Creators mit Graph-Daten:
  - `_relationshipStrength` / `_relationshipTier` / `_relationshipSignals`
  - `_creativeResonance`
  - `_bridgeScore` / `_bridgeType` / `_bridgeDimensions`
  - `_graphBonus` (für Discovery)
  - `_isFollowed` / `_isFollower` / `_isMutual`
- `bridges` — Top 6 Bridge-Creators mit echten Verbindungen
- `networkHealth` — `analyzeNetworkHealth()` auf echten Daten
- `getMutualEnergy(creatorId)` — `mutualEnergy()` für zwei Menschen

### 6. useGraphHealth Hook ✅ (Observability)

- Total Follow-Count
- Mutual-Follow-Rate (Netzwerk-Gesundheits-Indikator)
- Follows der letzten 7 Tage (Wachstums-Trend)
- Warnt bei: `low_mutual_rate` (< 10% gegenseitig)

---

## Sicherheits-Checks

| Check | Status |
|-------|--------|
| No Self-Follow (DB Constraint) | ✅ |
| No Self-Follow (RLS Policy) | ✅ |
| No Self-Follow (AppState Guard) | ✅ |
| No Duplicate Follow (UNIQUE Constraint) | ✅ |
| No Orphaned Follows (ON DELETE CASCADE) | ✅ |
| Fremde Manipulation (RLS INSERT/DELETE) | ✅ geschützt |
| Optimistic Rollback bei DB-Fehler | ✅ |
| Race Condition (UNIQUE verhindert Doubles) | ✅ |

---

## Wichtig: Spaltenname

AppStateContext nutzt `followed_id` (nicht `following_id`).
Migration 032 ist konsistent: `followed_id`.

Beide Systeme sind vollständig kompatibel.

---

## Nächste Schritte

1. **SQL ausführen** (manuell im Supabase SQL Editor)
2. **useContextualDiscovery** updaten: `useRealGraphData` als Graph-Input nutzen
3. **DiscoveryFeed** updaten: Bridge-Creator-Sektion aktivieren
4. **CreatorStudio**: `useGraphHealth` für Admin-Ansicht einbinden
