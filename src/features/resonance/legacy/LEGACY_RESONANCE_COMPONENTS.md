# Legacy Resonance-Komponenten

Dokumentation bewusst nicht integrierter oder veralteter Resonance-bezogener Komponenten.
**Nicht löschen** — nur dokumentieren.

| Komponente | Pfad | Status | Grund |
|------------|------|--------|-------|
| `NotificationCenter` | `src/components/NotificationCenter.jsx` | Legacy | Ersetzt durch `ResonanzzentrumPanel` in `useNotifications.jsx` |
| `FavoritesPage` | `src/pages/FavoritesPage.jsx` | Legacy (teilweise) | Enthält Mock-Daten (`MOCK_PEOPLE`, `MOCK_WORKS`, `MOCK_HERO`); Tab ohne Nav-Eintrag. Dein Raum nutzt stattdessen `MerkenSection` |
| `MyCreatorDashboard` | `src/pages/MyCreatorDashboard.jsx` | Legacy | Superseded by Commerce 2.0 / `CreatorDashboard` |
| `MeinHUI` (Journey/Moments) | `src/pages/MeinHUI.jsx` | Ambient/Mock | Mock-Statistiken (Tage, Menschen); keine echte Timeline-Anbindung |
| `MemberOrbHome` | `src/system/orb/MemberOrbHome.jsx` | Parallel | Orb-Timeline-Layer, nicht in Foundation integriert |
| `CreatorStudio` Sub-Pages | `src/pages/studio/StudioSubPages.jsx` | Stub | `EinnahmenPage`, `BestellungenPage`, etc. — „bald verfügbar" |
| `DiscoverPage.jsx.bak` | `src/pages/DiscoverPage.jsx.bak` | Backup | Nicht produktiv |

## Bewusst getrennt (Studio)

Diese Bereiche bleiben im HUI Studio und wurden **nicht** nach Resonance verschoben:

- Einnahmen → `EinAusgabenModal.jsx` / `CreatorDashboard.jsx`
- Creator-Aufträge → (kein dedizierter Screen)
- Creator-Verwaltung → `HuiStudio.jsx` Account-Bereich
- Werke verwalten → `MyBasisProfile` `MeineWerkeSection`
- Erlebnisse verwalten → `MyBasisProfile` `ErlebnisseSection`

## Bewusst getrennt (Profil)

Profil (`MyBasisProfile.jsx`) bleibt ausschließlich:

- Identität (Avatar, Cover, Name)
- Einstellungen (`SettingsModal`, `HuiStudio`)
- Öffentliche Darstellung (`PublicProfilePreview`, kanonische Sections)

Persönliche Erlebnisdaten (Timeline, Merklisten, Empfehlungen) liegen in `/resonanz`.
