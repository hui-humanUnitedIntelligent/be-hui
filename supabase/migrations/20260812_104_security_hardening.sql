-- Migration 104: Security Hardening — RLS Policy Cleanup + Column-Level Grants
-- Date: 2026-08-12
-- Purpose: Fix critical security vulnerabilities in RLS policies
--
-- FINDINGS:
-- 1. payments table: 2 policies with qual=TRUE → anyone could read ALL payment records
-- 2. impact_votes: iv_read policy with qual=TRUE → anyone could see who voted for what
-- 3. stripe_impact_pool: authenticated_read with qual=TRUE → exposed stripe_payment_id, user_id
-- 4. profiles: profiles_public_read with qual=TRUE → exposed email, phone, stripe, bank to EVERYONE
-- 5. 17 backup_* tables in production DB — dead weight, dropped
--
-- FIXES APPLIED (all verified live):
-- 1. payments: Dropped "Enable read access for all users" + "Public read" policies.
--    Only payments_own remains (payer_id OR recipient_id = auth.uid())
-- 2. impact_votes: Dropped iv_read + impact_votes_select_authenticated (both qual=TRUE).
--    Only "User kann eigene Stimmen lesen" remains (voter_id = auth.uid())
-- 3. stripe_impact_pool: Column-level GRANT — hidden: stripe_payment_id, user_id, ambassador_id, order_id, stripe_transfer_ids, metadata
-- 4. profiles: Column-level GRANT/REVOKE.
--    anon: public display fields only (NO email, phone, stripe, bank, role, trust_score, last_seen)
--    authenticated: public fields + email, role, trust_score, ambassador_status, referred_by
--    Blocked for ALL: phone, stripe_account_id, stripe_connect_status, bank_*, blocked, is_system_account
-- 5. Dropped 17 backup_* tables (all from July/August, ~0 rows, data in real tables)
-- 6. chat_participants: FK to chats.id (ON DELETE CASCADE) — see migration 103

-- 1. payments: Drop dangerous TRUE policies
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
DROP POLICY IF EXISTS "Public read" ON payments;

-- 2. impact_votes: Drop dangerous TRUE policies  
DROP POLICY IF EXISTS "iv_read" ON impact_votes;
DROP POLICY IF EXISTS "impact_votes_select_authenticated" ON impact_votes;

-- 3. stripe_impact_pool: Column-level restrictions
REVOKE SELECT ON stripe_impact_pool FROM authenticated;
GRANT SELECT (id, month, impact_pool_eur, total_inflow, project_share, company_share, distributed, distributed_at, projekte_foerdern_eur, hui_weiterentwickeln_eur, neue_ideen_eur, qualitaet_sichern_eur, hui_company_eur, innovation_fund_eur, impact_projects_eur, impact_flex_pool_eur, finance_model, company_phase, created_at, updated_at) ON stripe_impact_pool TO authenticated;

-- 4. profiles: Column-level restrictions
REVOKE SELECT ON profiles FROM anon;
REVOKE SELECT ON profiles FROM authenticated;

GRANT SELECT (id, created_at, updated_at, full_name, username, display_name, avatar_url, bio, tagline, skills, mood_dna, availability, hourly_rate, header_img, impact_eur, availability_slots, has_talent_profile, focus_type, location, location_label, website, cover_url, membership_type, membership_active, dna_tags, profile_modules, profile_views, follower_count, followers_count, is_available, is_member, member_since, is_ambassador, is_talent, is_wirker, talent, talent_since, talent_title, talent_description, talent_bio, talent_offer_types, location_lat, location_lng, is_guardian) ON profiles TO anon;

GRANT SELECT (id, created_at, updated_at, full_name, username, display_name, avatar_url, bio, tagline, skills, mood_dna, availability, hourly_rate, header_img, impact_eur, availability_slots, has_talent_profile, focus_type, location, location_label, website, cover_url, membership_type, membership_active, dna_tags, profile_modules, profile_views, follower_count, followers_count, is_available, is_member, member_since, is_ambassador, is_talent, is_wirker, talent, talent_since, talent_title, talent_description, talent_bio, talent_offer_types, location_lat, location_lng, is_guardian, email, role, trust_score, ambassador_status, referred_by, first_transaction_at, last_booking_at) ON profiles TO authenticated;

-- 5. Drop dead backup tables
DROP TABLE IF EXISTS backup_20260703_bookings, backup_20260703_cleanup_ambassador_revenue, backup_20260703_cleanup_presence_states, backup_20260703_cleanup_social_relationships, backup_20260703_impact_votes, backup_20260703_order_items, backup_20260703_orders, backup_20260703_stripe_ambassador_commissions, backup_20260703_stripe_ambassador_commissions_b2, backup_20260703_stripe_ambassador_commissions_schema, backup_20260703_stripe_impact_pool, backup_20260703_stripe_impact_pool_schema, backup_20260703_stripe_payments, backup_20260703_stripe_payouts, backup_20260804_impact_votes, backup_20260807_profiles_focus_type, backup_20260807_stripe_payments CASCADE;
