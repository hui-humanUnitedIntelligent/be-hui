# HUI Sprint 10 — Phase 1: MyBasisProfile Modularisierung

**Datum:** 2026-07-16  
**Branch:** `cursor/sprint10-phase1-mybasisprofile-modular-2c4a`  
**Scope:** Strukturelle Aufteilung — keine Feature-, UI-, UX- oder Architekturänderungen

---

## Aufgabe 1 — Analyse (Original)

| Metrik | Wert |
|--------|------|
| **Datei** | `src/pages/MyBasisProfile.jsx` |
| **Zeilen (vorher)** | 2.734 |
| **Export** | `MyBasisProfile({ onClose, profileId })` |

### Hauptbereiche (Original, eine Datei)

| Bereich | Zeilen (ca.) | Typ |
|---------|--------------|-----|
| Imports & Lazy-Loads | 1–64 | Setup |
| Design Tokens & CSS | 65–147 | Konstanten |
| Atoms (Gap, Divider, SectionRow, Sheet, InterestPill) | 149–222 | UI |
| InteressenSection | 224–274 | Section |
| MomentThumb | 280–312 | UI (inline, ungenutzt im Root) |
| OffenFuerSection | 317–375 | Section |
| **MyBasisProfile (Businesslogik + JSX)** | **390–1.219** | **Root** |
| AmbassadorProfilSection | 1.227–1.366 | Section |
| TalentErweiterung | 1.374–1.439 | Section |
| AmbassadorBanner | 1.446–1.514 | Section |
| DeleteWerkConfirm / DeleteTalentConfirm | 1.534–1.610 | Dialog |
| MeinBereichDrawer / ChooserRow / Tile / Menu | 1.624–1.958 | Studio |
| TalentAngeboteSection | 1.961–2.079 | Section |
| MeineWerkeSection | 2.081–2.190 | Section |
| ErlebnisseSection | 2.192–2.386 | Section |
| ImpactProjekteTab | 2.395–2.547 | Section |
| GemeinschaftsKarte | 2.554–2.614 | Section |
| TalentWerdenBanner | 2.622–2.715 | Section |
| TalentOnboardingModal | 2.722–2.734 | Dialog |

### States (Root — unverändert in MyBasisProfile.jsx)

`bio`, `interests`, `openFor`, `moments`, `visibility`, `saving`, `saveOk`, `saveErrMsg`, `localAvatar`, `localCover`, `showGemeinschaft`, `showAmbModal`, `showPublicPreview`, `showMerken`, `showSettings`, `showStudio`, `showResonanz`, `showNotifications`, `unreadCount`, `localWorks`, `localExperiences`, `showWerkWizard`, `showExpWizard`, `editingWerk`, `editingExp`, `showTalentWizard`, `showTalentOnboarding`, `editingTalent`

### Effects (Root)

- CSS-Injection (`__mbp_styles__`) via `useEffect`
- Realtime-Subscription `mbp:works-exps:{profileId}` (works, experiences, projects)

### Contexts (Root)

- `useAuth`, `useHome`, `useSavedPostsContext`, `useContentPreview`

### Hooks / Services (Root)

- `useProfileData`, `useAmbassador`, `useTalents`
- Supabase `_save`, Avatar/Cover-Handler, Notification-Routing

### Dialoge / Overlays (Root-Orchestrierung)

GemeinschaftsFlow, SettingsModal, Merken-Portal, PublicProfilePreview, HuiStudio, MeineResonanz, AmbassadorModal, NotificationPanel, WerkWizard, TalentOnboardingModal, TalentAngebotWizard, ExperienceWizard

---

## Aufgabe 2 — Modulstruktur

```
src/pages/
├── MyBasisProfile.jsx              # Re-Export (2 Zeilen, backward compat)
└── profile/myBasis/
    ├── MyBasisProfile.jsx          # Businesslogik + Orchestrierung (879 Zeilen)
    ├── tokens.js                   # T, CSS, Konstanten
    ├── utils.js                    # s(), a()
    ├── components/
    │   ├── primitives.jsx          # Gap, Divider, SectionRow, Sheet, InterestPill
    │   └── MomentThumb.jsx
    ├── sections/
    │   ├── InteressenSection.jsx
    │   ├── OffenFuerSection.jsx
    │   ├── AmbassadorProfilSection.jsx
    │   ├── AmbassadorBanner.jsx
    │   ├── TalentErweiterung.jsx
    │   ├── TalentWerdenBanner.jsx
    │   ├── GemeinschaftsKarte.jsx
    │   ├── TalentAngeboteSection.jsx
    │   ├── MeineWerkeSection.jsx
    │   ├── ErlebnisseSection.jsx
    │   └── ImpactProjekteTab.jsx
    ├── dialogs/
    │   ├── DeleteWerkConfirm.jsx
    │   ├── DeleteTalentConfirm.jsx
    │   └── TalentOnboardingModal.jsx
    └── studio/
        ├── MeinBereichDrawer.jsx
        ├── MeinBereichChooserRow.jsx
        ├── MeinBereichTile.jsx
        └── MeinBereichMenu.jsx
```

Import-Pfad `ProfileLauncher.jsx` → `pages/MyBasisProfile.jsx` bleibt unverändert.

---

## Aufgabe 3 — Ausgelagerte UI-Blöcke

| Modul | Verantwortlichkeit |
|-------|-------------------|
| `primitives.jsx` | Layout-Atoms (Gap, Divider, SectionRow, Sheet, InterestPill) |
| `InteressenSection` | Interessen & Werte (Basis-Profil) |
| `OffenFuerSection` | Offen für Begegnungen |
| `AmbassadorBanner` | Ambassador-CTA (Basis-Profil Footer) |
| `TalentWerdenBanner` | Talent-Einladungskarte |
| `MeinBereichMenu` | Studio-Kachel-Grid + Drawer-Orchestrierung |
| `TalentAngeboteSection` | Talent-Angebote-Liste |
| `MeineWerkeSection` | Werke-Liste |
| `ErlebnisseSection` | Erlebnisse-Liste |
| `ImpactProjekteTab` | Impact-Projekte-Tab |
| `DeleteWerkConfirm` / `DeleteTalentConfirm` | Lösch-Bestätigungen |
| `TalentOnboardingModal` | Talent-Onboarding-Portal |

Nicht extrahiert (bereits kanonische Sections in `components/profile/`): AboutSection, MomentsSection, RecommendationsSection, AvailabilitySection, LocationSection, VisibilitySection, ProfileHeader.

---

## Aufgabe 4 — Businesslogik

- **Verbleibt vollständig in** `profile/myBasis/MyBasisProfile.jsx`
- Keine Hooks extrahiert
- Keine Services geändert
- Keine Datenfluss-Änderungen
- Keine Props-/State-Änderungen an Root-Komponente

---

## Aufgabe 5 — Regression (Checkliste)

| Bereich | Status |
|---------|--------|
| Profil öffnen | ✓ Import-Pfad unverändert, Build OK |
| Momente | ✓ MomentsSection unverändert eingebunden |
| Werke | ✓ MeineWerkeSection extrahiert, gleiche Props |
| Erlebnisse | ✓ ErlebnisseSection extrahiert, gleiche Props |
| Talent-Angebote | ✓ TalentAngeboteSection extrahiert |
| Impact | ✓ ImpactProjekteTab + MeinBereichMenu-Drawer |
| Studio | ✓ MeinBereichMenu + Lazy-Modals |
| Empfehlungen | ✓ RecommendationsSection + MyRecommendationsModal |
| Einstellungen | ✓ SettingsModal in Root |
| Navigation | ✓ NAV_RESERVED_HEIGHT_CSS, zIndex unverändert |

---

## Aufgabe 6 — Build

```bash
npm install   # ✓ 0 vulnerabilities
npm run build # ✓ 829 modules, built in ~5s
```

---

## Aufgabe 7 — Performance

| Prüfpunkt | Ergebnis |
|-----------|----------|
| Render-Verhalten | Unverändert — gleiche Komponenten-Hierarchie |
| Re-Renders | Keine neuen Wrapper/Provider |
| Contexts | Keine neuen Contexts |
| Subscriptions | Realtime-Channel unverändert in Root |
| Timer | Debounce-Save (1.2s) unverändert in Root |
| Lazy-Loads | Gleiche React.lazy()-Aufteilung |

---

## Aufgabe 8 — Metriken

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Monolith `MyBasisProfile.jsx` | 2.734 Zeilen | 2 Zeilen (Re-Export) |
| Root mit Businesslogik | — | 879 Zeilen (−68 %) |
| Gesamtmodul (myBasis/) | — | 2.696 Zeilen (inkl. Import-Zeilen) |
| Dateien | 1 | 22 |

---

## Risiken

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Import-Pfad-Fehler | Niedrig | Build + korrekte `../../../../`-Pfade in Subdirs |
| Verhalten-Drift | Niedrig | Code 1:1 verschoben, keine Logik-Edits |
| Bundle-Größe | Neutral | Gleiche Chunks, MyBasisProfile-Bundle ~80 kB gzip |

---

## Definition of Done

- [x] MyBasisProfile deutlich kleiner (879 vs. 2.734 Zeilen Root-Logik)
- [x] Businesslogik unverändert
- [x] UI unverändert
- [x] Keine neuen Features
- [x] Keine Architekturänderung
- [x] Build erfolgreich
- [x] Performance unverändert
- [x] Ein Commit
- [x] Eine PR
