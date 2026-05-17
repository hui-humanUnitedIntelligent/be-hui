# HUI — STATE INTEGRITY REPORT
**Phase 4C.3 — Stand: 2026-05-17**

---

## Doppelte Optimistic Updates

### setLiked (3 Orte) — RISIKO: MITTEL
- `HomeFeed.jsx` — lokaler State
- `WorkDetailPage.jsx` — lokaler State (jetzt via AppStateContext.toggleLikeWork)
- `pages/Home.jsx` — unklar

**Befund:** Verschiedene Komponenten haben eigene `liked`-States.
**Risiko:** Keine Konflikte solange sie unabhängig gerendert werden (verschiedene Routes).
**Mitigation:** `useWorkInteraction(workId)` aus AppStateContext ist Single-Source.

### setSaved (4 Orte) — RISIKO: MITTEL
Gleiche Analyse wie setLiked.

### setBookings (4 Orte) — RISIKO: HOCH
- `WirkerProfilePage` — eigener State
- `WirkerProfileDashboard` — LEGACY, nicht importiert
- `BuyerProfileDashboard` — eigener State
- `bookingContext` — SINGLE OWNER

**Mitigation:** bookingContext ist Single-Owner.
Andere States sind lokale Copies für Anzeige — kein Write-Konflikt.

### setMessages (3 Orte) — RISIKO: MITTEL
- `hooks/useChat.js` — DEPRECATED
- `lib/chatContext.js` — SINGLE OWNER
- `MeinHUI_SubPages.jsx` — lokal für Chat-Overlay

**Mitigation:** chatContext ist Single-Owner für DB-Writes.

---

## Race Condition Risks

### bookingContext — sendBookingRequest
**Status:** Double-Submit-Guard implementiert via `globalMutationGuard.lockWithTimeout(8s)`.

### chatContext — sendMessage
**Status:** Import bereitgestellt, Integration in Phase 4C abgeschlossen.

### AppStateContext — toggleFollow
**Status:** Optimistic update + DB-sync. Kein Double-Submit-Guard.
**Risiko:** Niedrig — Supabase upsert/delete sind idempotent.

---

## Stale Cache Risks

### AppStateContext — invalidate()
Cache hat Timestamp-basierte Invalidierung.
**Risiko:** Bei sehr schnellen Updates (< 500ms) könnten Stale-Daten überschrieben werden.
**Mitigation:** Phase 4C.7 — timestamp guards für Realtime-Payloads.

---

## Event Safety (4C.5)

| Event | Guard |
|-------|-------|
| sendBookingRequest | ✅ globalMutationGuard + 8s timeout |
| sendMessage | ✅ sending-State verhindert doppelte Submits |
| toggleLike | ✅ Supabase upsert ist idempotent |
| toggleFollow | ✅ Supabase upsert ist idempotent |
| toggleSave | ✅ Supabase upsert ist idempotent |
| storyUpload | ⚠ Kein expliziter Guard |
| profileUpdate | ⚠ Kein expliziter Guard |
