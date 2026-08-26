-- Migration 130: GRANT SELECT on profiles(role) to anon
--
-- Problem: ProfileService.getById (IDENTITY_CONTRACT) includes 'role' column.
-- anon had INSERT/UPDATE/REFERENCES on 'role' but NO SELECT.
-- PostgREST is all-or-nothing per column → entire profiles query 401 for guests.
-- Result: Public profile page broke for non-logged-in visitors.
--
-- Fix: GRANT SELECT on profiles(role) to anon.
-- Safe: 'role' is already exposed via the public_profiles view (same data).
-- 'role' contains values like 'user', 'talent', 'admin' — not sensitive.
-- Sensitive columns (email, phone, bank data, stripe IDs) remain restricted.

GRANT SELECT (role) ON public.profiles TO anon;
