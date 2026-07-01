# HUI Release Engineering — Phase 1.2: Creator Studio Konsolidierung

## Ziel

Alle Creator-Bereiche wurden auf **einen offiziellen Einstiegspunkt** konsolidiert: die Route `/studio`.

Keine parallelen Dashboards, keine doppelten Studio-Modals, keine Legacy-Overlays.

---

## Finale Creator-Architektur

```
Einstiegspunkte (Profil ⚙️, BasisProfilePage, Deep-Links, Admin, Checkout)
        │
        ▼
  /studio  (Route — ProtectedRoute, lazy)
        │
        ▼
  CreatorStudio.jsx  (dünner Route-Wrapper: lädt Profil)
        │
        ▼
  HuiStudio.jsx  (einzige Studio-UI — Menü + Modals/Sub-Pages)
        │
        ├── Werke & Inhalte → MeineInhaltePage
        ├── Community & Empfehlungen → Ambassador-Modals
        ├── Impact & Stimmen → ImpactStimmenModal, MeineProjekteModal
        ├── Einnahmen & Statistiken → EinAusgabenModal, StatistikenModal
        └── Account → ProfilBearbeiten, Sicherheit, Support, Tickets, Abmelden
```

### Offizielles Creator Studio

| Aspekt | Wert |
|--------|------|
| **Route** | `/studio`, `/studio/:section` |
| **Komponente** | `src/pages/CreatorStudio.jsx` → `src/components/studio/HuiStudio.jsx` |
| **Registry-ID** | `studio` / `studio-section` in `src/routes/registry.js` |

### Was **nicht** Creator Studio ist

| System | Status | Hinweis |
|--------|--------|---------|
| **Profil-Tab** (`openCreatorDashboard`) | Aktiv, unverändert | Öffnet `MyBasisProfile` — soziales Profil, kein Studio |
| **Mein HUI** (Orb) | Aktiv, unverändert | Persönlicher Wirkungsraum — kein Creator Studio |
| **SettingsModal** | Aktiv | Profil-Einstellungen — Studio über ⚙️ → `/studio` |

---

## Entfernte Legacy-Komponenten

| Datei | Grund |
|-------|-------|
| `src/pages/MyCreatorDashboard.jsx` | Legacy, null Referenzen, durch Commerce 2.0 ersetzt |
| `src/pages/CreatorDashboard.jsx` | Orphaned Overlay — nie per UI erreichbar, Commerce-Logik bleibt in `creatorEconomy.js` |

### Deaktivierte parallele Einstiege

| Vorher | Nachher |
|--------|---------|
| `HuiStudio` Modal aus `MyBasisProfile` ⚙️ | `navigate("/studio")` |
| `HuiStudio` Modal aus `BasisProfilePage` | `navigate("/studio")` |
| `HuiStudio` Dead-Wiring in `TalentProfilePage` | Entfernt |
| `CreatorDashboard` Overlay in `Home.jsx` | Entfernt |
| `window.__HUI_OPEN_CREATOR_DASH` → Overlay | `navigate("/studio")` |
| `showCreatorDash` State in `HomeShell` | Entfernt |

---

## Neue Navigationsstruktur

| Einstieg | Ziel |
|----------|------|
| Profil → ⚙️ (`MyBasisProfile`) | `/studio` (schließt Profil-Overlay) |
| BasisProfilePage → „HUI Studio“ | `/studio` |
| Direkte URL | `/studio` |
| Deep-Link Section | `/studio/content`, `/studio/support`, `/studio/tickets` |
| Query-Param (Legacy) | `/studio?section=tickets` |
| Admin-Benachrichtigungen | `/studio` |
| CheckoutSuccess | `/studio` |
| `window.__HUI_OPEN_CREATOR_DASH` | `/studio` |

---

## Platzhalter-Reduktion

Im Studio-Menü **ausgeblendet** (waren reine Coming-Soon-Modals):

- Verifizierung
- Mitgliedschaft

**Entfernt** aus dem alten `CreatorStudio`-Eigenmenü (war parallel zu HuiStudio mit vielen Stubs):

- Reichweite / Analytics (Stub)
- Einnahmen (Stub)
- Verfügbarkeit (Stub)
- Zusammenarbeit / Bestellungen (Stub)
- Impact (Stub)
- Vertrauen / Reputation (Stub)
- Konto-Einstellungen (Stub)

Die **live** Funktionen dieser Bereiche sind weiterhin in HuiStudio erreichbar (Statistiken, Ein-/Ausgaben, etc.).

`StudioSubPages.jsx` bleibt als Modul erhalten — `MeineInhaltePage` wird von HuiStudio genutzt; Stub-Exports sind derzeit unreferenziert.

---

## Geänderte Dateien

### Kern

- `src/pages/CreatorStudio.jsx` — Route-Wrapper um HuiStudio
- `src/components/studio/HuiStudio.jsx` — Werke & Inhalte, Deep-Links, Coming-Soon entfernt, `useHomeOptional`
- `src/components/home/HomeShell.jsx` — `useHomeOptional`, `showCreatorDash` entfernt

### Navigation

- `src/pages/MyBasisProfile.jsx` — Studio → `/studio`
- `src/pages/BasisProfilePage.jsx` — Studio → `/studio`
- `src/pages/TalentProfilePage.jsx` — Dead HuiStudio-Wiring entfernt
- `src/pages/Home.jsx` — CreatorDashboard-Overlay entfernt, `__HUI_OPEN_CREATOR_DASH` → `/studio`
- `src/components/home/navigation/navConfig.js` — Kommentar aktualisiert
- `src/routes/registry.js` — Architektur-Notizen Phase 1.2

### Gelöscht

- `src/pages/MyCreatorDashboard.jsx`
- `src/pages/CreatorDashboard.jsx`

---

## Bekannte Restarbeiten

1. **Navigator (`hui.navigator.jsx`)**: `goCreatorDashboard()` öffnet weiterhin den Profil-Tab — nicht das Studio. Eigene `goCreatorStudio()`-Funktion mit Router-Navigation wäre sinnvoll (NAV-003).
2. **Stub-Exports in `StudioSubPages.jsx`**: Unreferenzierte Stub-Pages können in einer späteren Phase entfernt oder in HuiStudio-Modals migriert werden.
3. **Commerce-Dashboard-Funktionen** aus dem entfernten `CreatorDashboard.jsx` (Wallet, Buchungen, Sales-Tabs) sind nicht in HuiStudio integriert — bewusst außerhalb des Scopes (keine Commerce-Änderungen). Service-Layer `creatorEconomy.js` bleibt für Commerce-Flows aktiv.
4. **Bottom-Nav**: Kein direkter Studio-Tab — bewusst; Studio nur über Profil/Deep-Link.
5. **Generierte Docs** (`docs/generated/*`) referenzieren noch gelöschte Dateien — bei nächstem Architecture-Scan aktualisieren.

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Ein offizielles Creator Studio | ✅ `/studio` → HuiStudio |
| Alle Creator-Einstiege führen dorthin | ✅ |
| Keine parallelen Dashboards | ✅ MyCreatorDashboard + CreatorDashboard entfernt |
| Keine toten Studio-Navigationen | ✅ Modal-Einstiege entfernt |
| Build erfolgreich | ✅ `npm run build` |
| Keine neuen ESLint-Fehler in geänderten Dateien | ✅ |
| Dokumentation | ✅ Dieses Dokument |
