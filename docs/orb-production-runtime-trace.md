# Orb Production Runtime Trace — Ursachenanalyse (PR #42)

Stand: 2026-06-29  
Production-URL: https://be-hui.vercel.app  
Repo-HEAD (main): `7e20e414` (Merge PR #42)

---

## 1. Läuft auf Production der aktuelle Commit?

### Ergebnis: PR-#42-Code ist deployed, Build-Stamp ist veraltet

| Beleg | Production | Erwartet (main @ PR #42) |
|-------|-----------|--------------------------|
| `index.html` Build-Kommentar | `<!-- build: 1780508663 -->` (= 2026-06-03) | Nicht aktualisiert seit Juni |
| Home-Chunk enthält `OrbTabIcon`-Logik | ✅ Ja (`Home-2QuT3P2J.js`, 587 KB) | `BottomNav.jsx` → `OrbTabIcon` |
| Bedingung `dominantPillars + HuiOrbLogo` | ✅ Minified: `r=!i&&t&&rl(n).length>0` | Identisch zu Source |
| Lazy-Import `HuiOrbLogo` | ✅ `./OrbLeaf-BVBuB9f1.js` | `React.lazy(() => import OrbLeaf)` |
| `useCoreProfile` im Bundle | ✅ Funktion `Io` in Home-Chunk | `useCoreEngine.js` |

**Nachweis (Production Home-Chunk, extrahiert 2026-06-29):**

```
function al({userId:t}) {
  const {dominantPillars:n, isLoading:i} = Io(t),
        r = !i && t && rl(n).length > 0;
  return r
    ? <Suspense><HuiOrbLogo userId={t} size={34} animate={false}/></Suspense>
    : <img src="/hui-logo-real.jpg" .../>
}
```

→ Der JS-Code von PR #42 **ist live**. Der HTML-Build-Kommentar (`1780508663`) ist **irreführend veraltet** und wurde beim letzten Deploy nicht erhöht.

**Commit-Nachweis fehlte bisher** — behoben durch `src/lib/buildInfo.js` + sichtbares Badge in BottomNav.

---

## 2. Wird BottomNav.jsx zur Laufzeit gerendert?

### Ergebnis: Ja — aber nur auf `/Home`, und oft visuell versteckt

| Pfad | Datei | Beleg |
|------|-------|-------|
| Entry | `index.html` → `src/main.jsx` → `src/App.jsx` | Standard Vite-SPA |
| Route | `App.jsx` Route `/Home` → lazy `Home` | `createTabPage({ route:'/Home', component:Home })` |
| Render | `src/pages/Home.jsx` Zeile 497 | `<BottomNav ... authProfile={authProfile} />` |
| Position | Außerhalb `overflow:hidden` Container | Safari pointer-events Fix |

**Keine alternative Tab-Navigation auf `/Home`.** Andere Routen (`/impact`, `/profile/:username`, `/studio`) haben eigene Layouts ohne BottomNav.

**Sichtbarkeit wird reduziert wenn:**

- `orbActive={true}` UND kein `navDrift` → `opacity:0, translateY(130%)` (`Home.jsx` ~502)
- `showMembership || showTalentFlow` → Nav driftet nach unten (`navDrift` mit `translateY(120%)`)
- `body.hui-wizard-open` (WerkWizard) → CSS versteckt `[data-bnroot]`
- Nutzer ist auf Landing/Login, nicht auf `/Home`

**DOM-Marker:** `data-bnroot=""` auf dem äußeren BottomNav-Wrapper (`BottomNav.jsx` Zeile 141).

---

## 3. Wird OrbTabIcon instanziiert?

### Ergebnis: Ja — genau einmal pro BottomNav-Render im Orb-Button

| Datei | Zeile | Code |
|-------|-------|------|
| `BottomNav.jsx` | 251 | `<OrbTabIcon userId={authProfile?.id} />` |
| Kontext | Orb-Button (`item.isOrb === true`) | NAV_ITEMS aus `navConfig.js` |

`OrbTabIcon` ist **nicht exportiert** — private Hilfskomponente nur in `BottomNav.jsx`.

Production-Bundle: minified als `al`, aufgerufen im Orb-Button-Render-Pfad.

---

## 4. Wird HuiOrbLogo instanziiert?

### Ergebnis: Nur bedingt — wenn `hasOrbData === true`

```js
// BottomNav.jsx OrbTabIcon
const hasOrbData = !isLoading
  && userId
  && dominantPillarLabels(dominantPillars).length > 0;
```

Wenn `hasOrbData` false → **kein** `HuiOrbLogo`, stattdessen `<img src="/hui-logo-real.jpg">`.

Wenn true → lazy `<HuiOrbLogo userId={userId} size={34} animate={false} />` in `<Suspense>`.

Production lazy chunk: `OrbLeaf-BVBuB9f1.js` (6 KB, enthält `HuiOrbLogo` + `OrbLeaf`).

---

## 5. useCoreProfile() — Daten oder null?

### Implementierung: `src/hooks/useCoreEngine.js` Zeilen 45–89

```js
CoreEngine.profiles.get(userId)  // → supabase.from('core_profiles').select('*')
```

**Rückgabe:**

| Feld | Wert wenn kein Profil |
|------|----------------------|
| `coreProfile` | `null` |
| `dominantPillars` | `[]` (aus `coreProfile?.dominant_pillars ?? []`) |
| `isLoading` | `true` während Fetch, dann `false` |
| `orbParams` | `OrbEngine.defaultParams()` (Default-Seed-Blatt) |

**OrbTabIcon prüft nur `dominantPillars`**, nicht `orbParams`.  
→ Selbst wenn `OrbEngine.computeParams()` Default-Werte liefern würde, greift der Fallback solange `dominant_pillars` leer ist.

---

## 6. Warum greift der Fallback auf das Standardlogo?

### Ergebnis: Gate ist `dominantPillarLabels(dominantPillars).length > 0`

Fallback-Pfad (`/hui-logo-real.jpg`) wenn **eine** Bedingung zutrifft:

1. `userId` fehlt (`authProfile?.id` ist null/undefined — nicht eingeloggt)
2. `isLoading === true` (kurz während Fetch)
3. `core_profiles`-Zeile fehlt → `coreProfile === null` → `dominantPillars = []`
4. `dominant_pillars` ist leeres Array `[]` in DB
5. `dominant_pillars` enthält ungültige Keys → `dominantPillarLabels()` filtert sie raus → length 0

**Das ist der wahrscheinlichste Grund für „keine sichtbare Änderung":**  
PR #42 ändert das Orb-Icon nur visuell, wenn der Nutzer **bereits berechnete Grundpfeiler** in `core_profiles.dominant_pillars` hat. Ohne Core-Engine-Daten sieht die Tabbar identisch aus wie vorher (statisches JPG).

---

## 7. Exakter Laufzeitpfad

```
index.html
  └─ main.jsx
       └─ App.jsx → BrowserRouter → Route /Home
            └─ Home.jsx (lazy: Home-*.js)
                 └─ HomeInner
                      └─ BottomNav.jsx                    [data-bnroot]
                           └─ NAV_ITEMS.map → isOrb button
                                └─ OrbTabIcon({ userId: authProfile?.id })
                                     ├─ useCoreProfile(userId)
                                     │    ├─ CoreEngine.profiles.get(userId)
                                     │    │    └─ supabase: core_profiles
                                     │    └─ OrbEngine.computeParams(userId)
                                     │
                                     ├─ [hasOrbData=false] → <img /hui-logo-real.jpg>
                                     │
                                     └─ [hasOrbData=true]
                                          └─ Suspense
                                               └─ HuiOrbLogo (lazy OrbLeaf.jsx)
                                                    ├─ HuiSun (statisches SVG)
                                                    └─ OrbLeaf variant="tab"
                                                         └─ useOrbParams(userId)
                                                              └─ OrbEngine.computeParams(userId)
                                                                   └─ SVG Blatt (individuell)
```

---

## 8. Debug-Instrumentierung (dieser Branch)

| Was | Wo |
|-----|-----|
| `console.log('[HUI BUILD] …')` | `src/lib/buildInfo.js` via `main.jsx` |
| `window.__HUI_BUILD__` | Build-Commit + Timestamp |
| Sichtbares Badge `7e20e41 · b…` | `BottomNav` → `BuildTraceBadge` |
| `console.log('[ORB TRACE] BottomNav render')` | `BottomNav.jsx` |
| `console.log('[ORB TRACE] OrbTabIcon')` | `OrbTabIcon` + `window.__HUI_ORB_TRACE__.orbTabIcon` |
| `console.log('[ORB TRACE] HuiOrbLogo render')` | `OrbLeaf.jsx` |
| `console.log('[ORB TRACE] OrbLeaf render')` | `OrbLeaf.jsx` (variant=tab) |

### Verifikation nach Deploy

1. `/Home` öffnen (eingeloggt)
2. DevTools Console: `[HUI BUILD]` und `[ORB TRACE]` prüfen
3. `window.__HUI_ORB_TRACE__.orbTabIcon.renderPath` lesen:
   - `"fallback:hui-logo-real.jpg"` → kein Pillar-Profil
   - `"HuiOrbLogo"` → personalisiertes Blatt aktiv
4. Badge links über der Tabbar zeigt Commit-Short + Build-Timestamp

---

## Zusammenfassung

| Frage | Antwort |
|-------|---------|
| PR #42 deployed? | **Ja** (JS-Code in Production-Bundle nachgewiesen) |
| Build-Stamp aktuell? | **Nein** (`index.html` zeigt Juni-Build) |
| BottomNav aktiv? | **Ja auf /Home**, oft versteckt |
| OrbTabIcon aktiv? | **Ja** |
| HuiOrbLogo sichtbar? | **Nur bei `dominant_pillars.length > 0`** |
| Warum keine Änderung? | **Fallback-Logo** weil `core_profiles` für die meisten Nutzer noch keine `dominant_pillars` hat |
