# Produktmigration „Mein HUI“ → „Profil“ — Abschlussbericht

**Datum:** 2026-07-04  
**Status:** Abgeschlossen (technische Migration + Verifikation)

---

## Zielarchitektur (verbindlich)

| Bereich | Verantwortung |
|---|---|
| **Profil** | Identität & öffentliche Präsenz |
| **Mein HUI (Orb)** | Persönlicher Wirkungsraum |
| **Studio** | Verwaltung & Creator-Tools |
| **Impact** | Community-Wirkung (global) |

---

## 1. Nach Profil verschoben / verblieben

| Verantwortlichkeit | Entscheidung |
|---|---|
| Avatar, Cover, Bio | ✅ bleibt in `MyBasisProfile` |
| Interessen, Momente, Begegnungen | ✅ bleibt |
| Werke, Erlebnisse, Empfehlungen | ✅ bleibt |
| Sichtbarkeit, Standort | ✅ bleibt |
| Öffentliche Vorschau (👁️) | ✅ bleibt |
| Gemeinschaftsbeitritt | ✅ bleibt |
| Profil als AppShell-Tab | ✅ migriert (`ProfilePage`, Tab-Key `creator`) |
| Fremdprofile-Overlay | ✅ bleibt (`ProfileLauncher` nur für fremde Profile) |

**Aus Profil entfernt (keine Zugehörigkeit mehr):**

| Entfernt aus Profil | Neues Zuhause |
|---|---|
| Meine Resonanz | Orb |
| OrbSignatur (eigenes Profil) | Orb |
| HUI Studio Modal (⚙️) | Studio (`/studio`) |
| Gemerkte Inhalte (📌) | Studio |
| Einstellungen / Konto | Studio |
| Ambassador-Banner | Studio (bereits vorhanden) |
| Verfügbarkeit bearbeiten | Studio (`/studio/availability`) |
| NotificationPanel | Global (Home-Header / Orb-Button) |
| Commerce-Dashboard-Overlay | entfällt → Studio |

---

## 2. In den Orb verschoben

| Verantwortlichkeit | Implementierung |
|---|---|
| Meine Wirkung (Kennzahlen) | `WirkungsraumSections.MeinWirkenBlock` |
| Meine Motivation | `MotivationBlock` + DB-Feld `motivation` |
| Mein Vertrauen | `VertrauenBlock` |
| Meine Chronik | `ChronikBlock` + `useWirkungsraumData` |
| Meine Resonanz | `MeineResonanz` Overlay im Orb |
| OrbSignatur (eigen) | `MeinHUI.jsx` |
| Grundpfeiler | ✅ bereits in `MeinHUI` |
| Reise / Wirkungsmomente | ✅ mit echten Chronik-Daten verdrahtet |
| Orb-Info-Karten (Reise, Impact, Verbindungen) | ✅ mit `useWirkungsraumData` |

**Neue Dateien:**
- `src/hooks/useWirkungsraumData.js`
- `src/components/orb/WirkungsraumSections.jsx`

---

## 3. Ins Studio verschoben

| Verantwortlichkeit | Implementierung |
|---|---|
| Gemerkte Inhalte | `HuiStudio` → `MerkenSection` |
| Ambassador | bereits in `HuiStudio` |
| Commerce / Einnahmen / Analytics | `/studio` Route + `HuiStudio` Modals |
| Verfügbarkeit verwalten | `/studio/availability` |
| Konto, Support, Tickets | `HuiStudio` |
| Creator-Dashboard-Overlay | entfernt → `window.__HUI_OPEN_CREATOR_DASH` → `/studio` |

---

## 4. Entfernte Mein-HUI-Relikte

| Relikt | Maßnahme |
|---|---|
| `MyCreatorDashboard.jsx` | ❌ gelöscht (Logik → Orb-Hook) |
| `CreatorDashboard.jsx` Overlay | ❌ gelöscht |
| `showCreatorDashboard` Overlay-Flow | ❌ entfernt (Profil = Tab) |
| `hui_mein_hui_open` sessionStorage | ❌ entfernt |
| `OVERLAY_TABS: ["creator"]` | ❌ entfernt |
| BasisProfilePage „Mein HUI“-Karte | ✅ umbenannt → „Dein Profil verwalten“ |
| Profil-Header ⚙️ → Studio | ❌ entfernt |
| Ambassador-Sektionen in `MyBasisProfile` | ❌ entfernt |

---

## 5. Entfallene Komponenten

- `src/pages/MyCreatorDashboard.jsx` — vollständig ersetzt durch Orb + Studio
- `src/pages/CreatorDashboard.jsx` — Commerce-Overlay ersetzt durch `/studio`

---

## 6. Bewusst verbleibende Legacy-Strukturen

| Struktur | Grund |
|---|---|
| Tab-Key `creator` | NAV-001: Analytics/Deep-Links unveränderlich; Label ist „Profil“ |
| `openOwnProfile` / `OPEN_OWN_PROFILE` | Stabile API; verweist auf Profil-Tab |
| `showPlusSheet` State-Name | Technischer Gate für `MeinHUI`; kein Produkt-Label |
| `OrbSignatur` auf **öffentlichen** Profilen | Teil der öffentlichen Präsenz-Darstellung für Besucher |
| `MemberOrbHome.jsx`, `HuiPlusSheet.jsx` | Unverdrahtete Orb-Stack-Altlasten; separate Cleanup-Phase (nicht Produktmigration) |
| `AvailabilitySection` auf öffentlichen Profilseiten | Nur Anzeige für Besucher, Bearbeitung nur im Studio |

---

## 7. Definition of Done — Checkliste

- ✅ Profil enthält ausschließlich Identität und öffentliche Präsenz
- ✅ Mein HUI (Orb) enthält persönlichen Wirkungsraum mit echten Daten
- ✅ Studio enthält Verwaltungs- und Creator-Funktionen
- ✅ Impact-Tab unverändert (Community-only)
- ✅ Jede migrierte Funktion hat genau ein Zuhause
- ✅ Doppelte Verantwortlichkeiten im Profil/Orb/Studio-Kern entfernt
- ✅ Historische „Mein HUI“-Semantik im Profil-Bereich bereinigt
- ✅ Legacy-State `showCreatorDashboard` / `hui_mein_hui_open` entfernt

---

## 8. Migrationsmatrix (Kurzform)

Siehe vorherige Analyse — alle Einträge mit ❌ oder ⚠️ wurden adressiert:

- Profil-Tab-Architektur: ✅
- Wirkungs-/Chronik-/Motivation-Themen: ✅ → Orb
- Commerce/Verwaltung: ✅ → Studio
- Naming-Relikte im Profil-UI: ✅ bereinigt
- Radial-Orb-Stack: dokumentiert als separate Cleanup-Phase
