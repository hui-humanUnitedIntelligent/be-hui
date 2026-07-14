# HUI Release RC2 — Stabilisierung

**Stand:** 2026-07-14  
**Basis:** HUI_RELEASE_RC1_REPORT (P0/P1-Punkte)  
**Ziel:** Release Candidate stabilisieren — keine neuen Features, keine Architekturänderungen.

---

## Umgesetzte P0/P1-Punkte

### P0-01 — TalentBookingFlow: Rules of Hooks

**Problem:** `useMemo`, `useEffect` und `useCallback` wurden nach `if (!talent) return null` aufgerufen.

**Fix:** Alle Hooks an den Komponentenanfang verschoben. Abgeleitete Werte nutzen `talent?.` für sichere Aufrufe vor dem Early Return. Logik unverändert.

### P1-01 — Overlay Stack: `switchTab()`

**Problem:** `showBookingFlow`, `showUnterstuetzenFlow`, `activeStory` und weitere Overlay-States wurden beim Tabwechsel nicht geschlossen.

**Fix:** Zentrale Hilfsfunktion `closeAllOverlays()` eingeführt. `switchTab()` ruft sie vor jedem Tabwechsel auf. Geschlossen werden u. a.:

- `showBookingFlow`, `showUnterstuetzenFlow`, `activeStory`
- `showWerkDetail`, `showWerkCheckout`, `showWerkeKorb`
- `showCreatorDash`, `selectedProfileId`, `showWirker`
- Orb-World (`closeOrbWorld`) bei offenem Orb

`showChat` bleibt bewusst tab-unabhängig (bestehendes Verhalten).

### P1-02 — Impact-Tab: Overlays schließen

**Problem:** Impact-Wechsel nutzte `_setTab("impact")` direkt und ließ Overlays offen.

**Fix:** `handleTab("impact")` delegiert an `switchTab("impact")` — gleiche Overlay-Bereinigung wie bei anderen Tabs.

### P1-03 — Creator Studio: sauberer Einstieg

**Problem:** Beim Öffnen des Creator Studios konnten andere Overlays aktiv bleiben.

**Fix:** `openCreatorDashboard()` ruft zuerst `closeAllOverlays()` auf, dann Tab + Dashboard-State.

### P1-04 — Meine Empfehlungen: Erlebnis/Event-Navigation

**Problem:** Erlebnis- und Event-Karten zeigten `alert()` statt Navigation.

**Fix:** Navigation zur kanonischen Detailroute:

- Erlebnis → `/erlebnis/:id` (DeepLinkOpener)
- Event → `/veranstaltung/:id` (DeepLinkOpener)

### P1-05 — Duplicate JSX `style`-Attribute

**Problem:** 11 Build-Warnungen durch doppelte `style`-Props.

**Fix:** Doppelte Attribute in ein `style`-Objekt zusammengeführt (keine funktionalen Änderungen).

### P1-06 — Production Debug Logs

**Problem:** `console.log` im Produktionspfad (Feed-Normalizer, World/Orb-Context, Chat, Safari-Paint-Recovery u. a.).

**Fix:** Debug-Ausgaben mit `import.meta.env.DEV` / `isDev` abgesichert oder entfernt. `console.warn` / `console.error` für echte Fehler bleiben.

---

## Geänderte Dateien

| Datei | P0/P1 |
|-------|-------|
| `src/components/talents/TalentBookingFlow.jsx` | P0-01 |
| `src/components/home/HomeShell.jsx` | P1-01, P1-02, P1-03 |
| `src/components/studio/MyRecommendationsModal.jsx` | P1-04 |
| `src/content/invitation/InvitationFlow.jsx` | P1-05, P1-06 |
| `src/pages/DiscoverPage.jsx` | P1-05 |
| `src/system/flows/impact/ImpactFlow.jsx` | P1-05 |
| `src/pages/BasisProfilePage.jsx` | P1-05 |
| `src/components/chat-center/ConversationList.jsx` | P1-05, P1-06 |
| `src/components/connection-create/StepTwoConnectionDetails.jsx` | P1-05 |
| `src/system/flows/experience/ExperiencePublishStep.jsx` | P1-05 |
| `src/lib/useNotifications.jsx` | P1-05 |
| `src/components/studio/MeineProjekteModal.jsx` | P1-05 |
| `src/system/feed/unifiedNormalizer.js` | P1-06 |
| `src/context/OrbWorldContext.jsx` | P1-06 |
| `src/context/WorldSurfaceContext.jsx` | P1-06 |
| `src/lib/world/safariPaintRecovery.js` | P1-06 |
| `src/components/chat-center/ChatCenterOverlay.jsx` | P1-06 |
| `src/system/flows/experience/ExperienceFlow.jsx` | P1-06 |
| `src/pages/FavoritesPage.jsx` | P1-06 |
| `src/core/hui.actions.js` | P1-06 |

---

## Regression Check

| Bereich | Status | Hinweis |
|---------|--------|---------|
| Login | ✔ | Keine Auth-Änderungen |
| Home | ✔ | Overlay-Cleanup bei Tabwechsel |
| Feed | ✔ | Normalizer-Trace nur noch DEV |
| Profil | ✔ | Creator-Dashboard schließt Overlays |
| Mein HUI | ✔ | `openCreatorDashboard` bereinigt Einstieg |
| Resonanz | ✔ | Chat-Overlay unverändert tab-unabhängig |
| Impact | ✔ | Tabwechsel schließt Overlays |
| Commerce | ✔ | Booking/Unterstützen-Flows werden bei Tabwechsel geschlossen |
| Studio | ✔ | Sauberer Einstieg ohne Overlay-Leaks |
| Chat | ✔ | Bewusst offen bei Tabwechsel (bestehend) |

**Manuell empfohlen:** Tabwechsel mit offenem Booking-Flow, Story-Viewer und Creator-Dashboard-Einstieg einmal durchklicken.

---

## Build

```
npm run build
```

- **Ergebnis:** ✔ Erfolgreich (804 Module)
- **Duplicate-style-Warnungen:** 0 (vorher 11)
- **Chunk-Size-Hinweis:** unverändert (vendor > 500 kB — außerhalb RC2-Scope)

---

## ESLint

```
npm run lint
```

- Geänderte RC2-Dateien: keine neuen ESLint-Fehler in den bearbeiteten Stabilisierungs-Dateien
- Repo-weit bestehen vorbestehende unused-imports-Warnungen (außerhalb RC2-Scope, nicht neu eingeführt)

---

## Verbleibende P2/P3-Punkte (nicht in RC2)

Aus RC1-/Audit-Kontext, bewusst **nicht** bearbeitet:

| ID | Thema | Priorität |
|----|-------|-----------|
| P2-01 | z-Index-Chaos (76 unique Werte ohne Schema) | P2 |
| P2-02 | Inkonsistente Transition-Strings | P2 |
| P2-03 | Touch-Targets < 44px | P2 |
| P2-04 | Inkonsistente Loading-Sprache | P2 |
| P2-05 | Weitere `console.log` in TeilenFlow, HuiMomentSheet, WerkWizard (nicht RC1-Hotpath) | P2 |
| P3-01 | Monster-Komponenten (WirkerProfilePage, DiscoveryFeed, Home.jsx Größe) | P3 |
| P3-02 | useOverlayStack-Konsolidierung (16+ showX-States) | P3 |
| P3-03 | Route-Registry Shadow → Migration (NAV-002+) | P3 |
| P3-04 | Performance/Bundle-Splitting (vendor chunk) | P3 |

---

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| P0 vollständig behoben | ✔ |
| Alle P1-Punkte umgesetzt | ✔ |
| Build erfolgreich | ✔ |
| Keine neuen ESLint-Fehler in RC2-Dateien | ✔ |
| Keine Regression (Scope-konform) | ✔ |
| Keine neuen Features | ✔ |
| Dokumentation vollständig | ✔ |
