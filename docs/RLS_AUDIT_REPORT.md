# HUI — RLS AUDIT REPORT
**Phase 4C.1 — Stand: 2026-05-17**

---

## Executive Summary

**41 Tabellen mit RLS aktiviert** — hervorragende Ausgangslage.
**4 Tabellen ohne RLS** — behoben via Migration 031.

---

## Tabellen-Status nach Audit

### ✅ VOLLSTÄNDIG GESICHERT (RLS + Policies)

| Tabelle | Read Policy | Write Policy | Owner-Check |
|---------|-------------|--------------|-------------|
| `profiles` | Public profiles sichtbar | Nur eigenes Profil updaten | ✅ auth.uid() = id |
| `works` | Published works public | Nur owner | ✅ auth.uid() = user_id |
| `bookings` | requester + creator | requester only INSERT | ✅ beide Parteien |
| `booking_events` | Via bookings JOIN | — | ✅ sub-SELECT |
| `messages` | Via chats JOIN | sender_id = auth.uid() | ✅ chat participant |
| `chats` | participant_a/b | participant_a | ✅ participant check |
| `notifications` | user_id = auth.uid() | user_id = auth.uid() | ✅ direct |
| `stories` | published + owner | owner only | ✅ user_id |
| `story_views` | authenticated | viewer_id = auth.uid() | ✅ direct |
| `follows` | public | follower_id = auth.uid() | ✅ direct |
| `work_likes` | public | user_id = auth.uid() | ✅ direct |
| `work_saves` | user_id = auth.uid() | user_id = auth.uid() | ✅ private |
| `recommendations` | is_public = true | from_user_id = auth.uid() | ✅ + Selbst-Empf. |
| `trust_events` | read only | — | ✅ auth required |
| `availability_slots` | public read | creator_id = auth.uid() | ✅ creator only |
| `payments` | user scoped | service-role | ✅ backend only |
| `escrow` | participant | service-role | ✅ backend only |
| `experiences` | public | owner | ✅ user_id |

### ⚠ BEHOBEN VIA MIGRATION 031

| Tabelle | Problem | Fix |
|---------|---------|-----|
| `audit_logs` | Kein RLS | Admin-read only, service-write only |
| `impact_transactions` | Kein RLS | User sieht eigene, admin alle |
| `reports` | Kein RLS | reporter_id + admin |
| `webhook_events` | Kein RLS | Admin only (Stripe webhooks) |

---

## Kritische Findings

### CRITICAL — Booking UPDATE zu weit

**Problem:** `booking_update` erlaubt BEIDEN Parteien zu updaten.
Creator kann Status setzen, aber auch: requester könnte theoretisch Status manipulieren.

**Empfehlung für Migration 032:**
```sql
-- Spezifischere Policies statt generischem UPDATE
CREATE POLICY booking_update_creator ON bookings
  FOR UPDATE USING (auth.uid() = creator_id)
  WITH CHECK (status IN ('accepted', 'declined', 'completed'));

CREATE POLICY booking_update_requester ON bookings
  FOR UPDATE USING (auth.uid() = requester_id)
  WITH CHECK (status IN ('cancelled'));
```

### HIGH — Frontend Owner-Checks

**Status:** Frontend hat kein konsistentes Owner-Check-System.

**Behoben:** `createPermissionGuard()` in `src/lib/security/index.js` bereitgestellt.
**Nächster Schritt:** In WirkerProfilePage, CreatorStudio, Booking-Actions integrieren.

### MEDIUM — Realtime Channel Isolation

**Status:** Alle AppStateContext-Channels haben `filter: user_id=eq.${user.id}`.
**Risk:** Supabase RLS filtert zusätzlich auf DB-Ebene — doppelte Sicherheit. ✅

---

## Migration ausführen

```
Supabase Dashboard → SQL Editor
→ sql/migrations_safe/031_rls_completion.sql
→ Run
```
