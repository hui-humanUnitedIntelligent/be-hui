-- Migration 125: REVOKE EXECUTE FROM PUBLIC für alle SECURITY DEFINER Funktionen
-- Red-Team-Audit 2026-08-26: Postgres-Default gibt EXECUTE an PUBLIC (incl. anon).
-- Alle SECURITY DEFINER-Funktionen müssen explizit eingeschränkt werden.
-- 
-- Strategie:
-- 1. REVOKE EXECUTE FROM PUBLIC (entfernt anon-Zugriff)
-- 2. GRANT EXECUTE TO authenticated für Frontend-RPCs
-- 3. GRANT EXECUTE TO service_role für Edge-Function-only RPCs
-- 4. Trigger-Funktionen: nur service_role (werden vom Trigger-Mechanismus aufgerufen)
-- 5. rpc_get_all_transactions: NUR service_role (admin-only, enthält Zahlungsdaten)

-- ── REVOKE für ALLE SECURITY DEFINER Funktionen ──────────────────────────
REVOKE EXECUTE ON FUNCTION public.rpc_get_all_transactions(text,integer,integer,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_process_order_fees(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_process_talent_booking_fees(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_buyer_confirm_receipt(uuid,uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_cancel_talent_booking(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_create_talent_booking(uuid,date,jsonb,integer,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_admin_release_escrow(uuid,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_seller_request_payout(uuid,uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_delete_own_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_my_sensitive_profile_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_push_settings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_set_push_enabled(boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_register_device_token(text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_invalidate_device_tokens() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_check_email_confirmed(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_check_email_exists(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_check_own_blocked_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_discover_people(text,text,int,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_discover_people(text,text,integer,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_talent_availability(uuid,date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_talent_month_availability(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_recommendation_score(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_vote_counts(uuid[],text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_global_vote_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_impact_ranking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_unique_voters_for_projects(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_user_impact_totals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_orb_growth_stage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_log_registration_blocked(text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_log_bug_report_event(text,text,jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_report_moment(uuid,uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_distribute_impact_to_projects(numeric,uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_monthly_vote_reset(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_evaluate_phase_transition() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_votes_archive_summary(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_momente_admin(text,int,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_get_profile_likes(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_user_is_order_seller(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_enforce_impact_vote_quota() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_enforce_min_age() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_check_project_completion() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_recompute_impact_ranking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_trigger_push_edge_function() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.creator_save_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(uuid,numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_creator_wallet() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_wirker(double precision,double precision,double precision,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_works(double precision,double precision,double precision,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_experiences(double precision,double precision,double precision,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_invitations(double precision,double precision,double precision,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_digest_batch(timestamptz) FROM PUBLIC;

-- Trigger functions (internal, not called via RPC)
REVOKE EXECUTE ON FUNCTION public.enforce_creator_fulfillment_only() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_sale_payment_immutable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_wallet_immutable_balance() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_broadcast_to_beitrag() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_create_notification_settings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_fn_update_impact_ranking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_queue_push_notification() FROM PUBLIC;

-- ── GRANT: Frontend-RPCs → authenticated ─────────────────────────────────
-- Diese werden direkt aus dem be-hui Frontend per supabase.rpc() aufgerufen
GRANT EXECUTE ON FUNCTION public.rpc_buyer_confirm_receipt(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_talent_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_check_email_confirmed(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_check_own_blocked_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_discover_people(text,text,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_discover_people(text,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_talent_availability(uuid,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_talent_month_availability(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_recommendation_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_vote_counts(uuid[],text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_global_vote_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_impact_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_unique_voters_for_projects(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_impact_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_orb_growth_stage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_sensitive_profile_fields() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_push_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_push_enabled(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_register_device_token(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_invalidate_device_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_registration_blocked(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_bug_report_event(text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_report_moment(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_seller_request_payout(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_push_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_save_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_user_is_order_seller(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_wirker(double precision,double precision,double precision,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_works(double precision,double precision,double precision,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_experiences(double precision,double precision,double precision,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_invitations(double precision,double precision,double precision,int) TO anon, authenticated;

-- ── GRANT: Edge-Function-only RPCs → service_role ────────────────────────
-- Diese werden nur aus Edge Functions mit Service-Role-Key aufgerufen
GRANT EXECUTE ON FUNCTION public.rpc_get_all_transactions(text,integer,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_process_order_fees(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_process_talent_booking_fees(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_create_talent_booking(uuid,date,jsonb,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_admin_release_escrow(uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_delete_own_account() TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_distribute_impact_to_projects(numeric,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_monthly_vote_reset(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_evaluate_phase_transition() TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_get_momente_admin(text,int,int) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(uuid,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_create_creator_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION public.save_digest_batch(timestamptz) TO service_role;

-- ── GRANT: Trigger functions → service_role (nur intern) ─────────────────
GRANT EXECUTE ON FUNCTION public.enforce_creator_fulfillment_only() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_sale_payment_immutable() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_wallet_immutable_balance() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_broadcast_to_beitrag() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_create_notification_settings() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_fn_update_impact_ranking() TO service_role;
GRANT EXECUTE ON FUNCTION public.trg_queue_push_notification() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_enforce_impact_vote_quota() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_enforce_min_age() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_check_project_completion() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_recompute_impact_ranking() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_trigger_push_edge_function() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ── Dokumentation ─────────────────────────────────────────────────────────
-- Alle Funktionen die hier nicht aufgeführt sind aber SECURITY DEFINER haben,
-- sollten in einer Folgemigration nachgezogen werden.
-- Die Liste basiert auf grep -rn "SECURITY DEFINER" supabase/migrations/*.sql
-- und Cross-Reference mit Frontend-RPC-Calls (src/) und Edge-Function-Calls (supabase/functions/).
