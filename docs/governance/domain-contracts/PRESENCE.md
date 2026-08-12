# Domain Contract — PRESENCE

> **ARCH-005.1 — Fachliche Verfassung**  
> **Domain:** Presence & Session  
> **Status:** Ratifiziert (Governance)  
> **Datum:** 2026-06-30  
> **Basis:** DOMAIN_ARCHITECTURE_BLUEPRINT_V1 · Constitution · ADR · RFC · SYSTEM_OWNERSHIP

---

## Zweck

Menschliche Präsenz — wer ist da, Session-State, Creator-Presence.

**Grundpfeiler-Bezug:** 🤝 Verbinden

---

## Verantwortung

### Besitzt (fachlich)

- Online-Status
- Session-Hooks
- Creator-Presence
- storyRefreshKey

### Besitzt ausdrücklich NICHT

- Profil-Daten (→ IDENTITY)
- Chat (→ COMMUNICATION)
- Performance-Identity/Gamification

---

## Daten

### Tabellen — exklusiver Besitz (Write-Owner)

- `presence`

### Tabellen — nur lesen

- `profiles`

### Tabellen — niemals schreiben

- `profiles`
- `works`
- `messages`

---

## Ownership

| Kategorie | Owner / Erlaubte Zugriffe |
|---|---|
| **Services** | lib/presence/index.js |
| **Contexts** | lib/sessionHooks.js (Owner) |
| **Hooks** | usePresence, useSession |
| **Komponenten** | components/CreatorPresence.jsx |
| **Pages** | — (embedded / Overlays) |

**Dateien in Domain:** 5 (siehe `docs/generated/domain-file-map.json`)

---

## Public API

| Service / Modul | Sichtbarkeit | Methoden / Export |
| --- | --- | --- |
| presence/index | public | updatePresence, getPresence |
| usePresence (`sessionHooks.js`) | public | — |

### Intern (nicht cross-domain)

- Domain-interne Helper und private Module
- Temporäre Facade-Anteile in `services/db.js` (Ziel: split)

---

## Events

### Veröffentlicht

- `presence.updated`
- `session.started`

### Konsumiert

- `PROFILE_COMPLETED`

### Darf niemals erzeugen

- `gamification.streak`
- `online.leaderboard`

---

## Realtime

### Kanäle

- `TODO: Presence-Channels zentral registrieren (REALTIME_REGISTRY Erweiterung)`

### Erlaubte Presence-Informationen

- online/offline (ephemeral)
- last_seen (optional, privacy-safe)

---

## Layer

### Erlaubte Layer

- Application
- Domain
- Infrastructure

### Verbotene Layer

_Keine zusätzlichen Verbote_

**RFC-000 Mapping:** Presentation = PAGES/COMPONENTS · Application = HOOKS/CONTEXT/FEATURES · Domain = SERVICES/SYSTEM · Infrastructure = lib/* · Core = core/* + registry/*

---

## Dependencies

### Darf abhängen von

- `KERNEL`
- `IDENTITY`

### Darf abhängig sein von

- `COMMUNICATION`
- `DISCOVERY`
- `STUDIO`

### Verbotene zyklische Abhängigkeiten

- PRESENCE → IDENTITY (Profile-Write)

---

## Constitution

### Besonders geltende Regeln

- Presence Philosophy — keine Performance Identity
- Design: Ruhig, nicht aktivierend

### Invarianten

- Presence ≠ Gamification
- Kein Online-Status als Ranking

### ADRs

_Keine domain-spezifischen ADRs_

### RFCs

- RFC-000

---

## Scanner Rules

- REALTIME: Presence-Channel Single-Owner
- PRESENCE_GAMIFICATION: Kein Streak/Online-Bonus
- CROSS_DOMAIN: Presence-State nicht in AppState duplizieren

---

## Intelligence

### Empfehlungen

- Presence-Channels in REALTIME_REGISTRY ergänzen
- sessionHooks als alleiniger Owner

### Typische Risiken

- Presence-Channels verteilt (TODO)
- Tabellen-Existenz presence TODO

### Erlaubte Refactorings

- Presence-Registry
- Channel-Konsolidierung

### Niemals

- Online-Streak-Boni
- Last-Seen-Shaming

---

## Migration

### Vollständig migriert wenn

- Presence-Registry vollständig
- sessionHooks alleiniger Owner

### Metriken „fertig"

- **healthScore:** 65% → 90%

**Aktueller Health Score (Baseline):** 65%

---

## Referenzen

- [`DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md`](../DOMAIN_ARCHITECTURE_BLUEPRINT_V1.md)
- [`SYSTEM_OWNERSHIP.md`](../SYSTEM_OWNERSHIP.md)
- [`HUI_CONSTITUTION.md`](../../HUI_CONSTITUTION.md)
- Domain-Dateien: components/CreatorPresence.jsx, lib/presence/index.js, lib/sessionHooks.js, lib/usePresence.js, lib/usePresence.jsx

---

*Domain Contract PRESENCE — ARCH-005.1. Keine Runtime-Änderung.*
