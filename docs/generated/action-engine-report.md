# HUI Action Engine Report

> **Automatisch generiert** — HUI Architecture Scanner (ARCH-001)
> **Datum:** 2026-06-30
> ⚠️ Diese Datei ist autogeneriert. Änderungen werden beim nächsten `npm run architecture:audit` überschrieben.


## Adoption: 4%

11 von 297 Dateien nutzen die Action Engine.

Gesamte Action Engine Aufrufe: **137**

## Dateien MIT Action Engine

| Datei | Uses |
|---|---|
| `core/hui.actions.js` | 72 |
| `pages/FavoritesPage.jsx` | 15 |
| `pages/MyCreatorDashboard.jsx` | 14 |
| `pages/wirker-profile/index.jsx` | 14 |
| `components/NotificationCenter.jsx` | 7 |
| `components/home/navigation/BottomNav.jsx` | 4 |
| `components/home/profile/ProfileLauncher.jsx` | 4 |
| `core/hui.semantics.js` | 3 |
| `components/home/header/HomeHeader.jsx` | 2 |
| `architecture/scanner/violationDetector.js` | 1 |
| `core/hui.contracts.js` | 1 |

## Direkte navigate() ohne Action Engine

| Datei | Aufrufe | Ziel |
|---|---|---|
| `App.jsx` | 6 | /Home, /login, /Home, /profile/${user.id}, /profile/${data.username}, /profile/$ |
| `components/WorkDetailPage.jsx` | 2 | /profile/${username}, /work/${id} |
| `components/auth/AuthGate.jsx` | 1 | /forgot-password |
| `components/entry/AppEntryController.jsx` | 1 | /Home |
| `core/hui.navigator.jsx` | 2 | public-profile, creator-dashboard |
| `pages/CreatorStudio.jsx` | 5 | /studio/${key}, /studio, /login, /profile/${profile.username}, /profile/${profil |
| `pages/DiscoverPage.jsx` | 2 | /work/${werkId}, /impact |
| `pages/Home.jsx` | 1 | /work/${werkId} |
| `pages/LoginPage.jsx` | 2 | /Home, /Home |
| `pages/RefRedirect.jsx` | 3 | /Home, /Home, /login |
| `routes/registry.js` | 1 | /Home |
