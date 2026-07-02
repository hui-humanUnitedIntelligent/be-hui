# HUI Migration Report

> Automatisch generiert — HUI Architecture Knowledge Graph (ARCH-002)
> ⚠️ Nicht manuell bearbeiten. Wird bei `npm run architecture:graph` überschrieben.

**Migrationen:** 52

### 007_media_stories_pipeline.sql

- Pfad: `supabase/migrations/007_media_stories_pipeline.sql`
- Tabellen: media, stories, story_views, feed_items

### 20260608_block_delete.sql

- Pfad: `supabase/migrations/20260608_block_delete.sql`
- Tabellen: profiles

### 20260609_works_approval_system.sql

- Pfad: `supabase/migrations/20260609_works_approval_system.sql`
- Tabellen: works, pg_policies

### 20260611_experiences_approval_system.sql

- Pfad: `supabase/migrations/20260611_experiences_approval_system.sql`
- Tabellen: experiences, projects, information_schema

### 20260611_previous_data_snapshot.sql

- Pfad: `supabase/migrations/20260611_previous_data_snapshot.sql`
- Tabellen: works, experiences, projects

### 20260627_052_commerce_p0_security.sql

- Pfad: `supabase/migrations/20260627_052_commerce_p0_security.sql`
- Tabellen: orders, creator_wallets, webhook_events, old, works, experiences

### 20260627_053_cart_hash_aborted_status.sql

- Pfad: `supabase/migrations/20260627_053_cart_hash_aborted_status.sql`
- Tabellen: orders, order_items

### 20260627_054_commerce_infrastructure_sync.sql

- Pfad: `supabase/migrations/20260627_054_commerce_infrastructure_sync.sql`
- Tabellen: orders, order_items, commerce_events, webhook_events, creator_wallets, creator_payouts, shipments, works, experiences, pg_tables, impact_rounds

### 20260627_057_commerce_schema_final.sql

- Pfad: `supabase/migrations/20260627_057_commerce_schema_final.sql`
- Tabellen: orders, information_schema, pg_trigger, pg_class, pg_namespace, pg_proc, order_items, old, pg_tables, shipments, creator_wallets, creator_payouts, commerce_events, webhook_events, impact_rounds, notifications, pg_policies, profiles, works, experiences, pg_views

### phase1.sql

- Pfad: `supabase/migrations/phase1.sql`
- Tabellen: favorites, bookings, profiles

### phase4c_membership.sql

- Pfad: `supabase/phase4c_membership.sql`
- Tabellen: profiles, updated_profile

### phase4d_creator_economy.sql

- Pfad: `supabase/phase4d_creator_economy.sql`
- Tabellen: creator_wallets, creator_supports, experience_bookings, works, work_sales, profiles, creator_analytics, v_wallet, v_supports, v_bookings, v_sales, v_analytics, v_support

### 034_membership_type_fix.sql

- Pfad: `sql/034_membership_type_fix.sql`
- Tabellen: profiles

### 035_phase3_real_systems.sql

- Pfad: `sql/035_phase3_real_systems.sql`
- Tabellen: information_schema, follows, profiles, experiences, chats

### 036_presence_reactions.sql

- Pfad: `sql/036_presence_reactions.sql`
- Tabellen: user_presence, story_reactions

### 037_auth_hardening.sql

- Pfad: `sql/037_auth_hardening.sql`
- Tabellen: profiles, reserved_usernames, _p

### 038_feature_activation.sql

- Pfad: `sql/038_feature_activation.sql`
- Tabellen: post_reactions, saved_posts, notifications

### 009_story_system_fix.sql

- Pfad: `sql/archive_old/009_story_system_fix.sql`
- Tabellen: stories, story_views, now, profiles, p

### 010_clean_separation.sql

- Pfad: `sql/archive_old/010_clean_separation.sql`
- Tabellen: information_schema, works, stories, story_views, profiles, p

### 017_experiences_ui_sync.sql

- Pfad: `sql/archive_old/017_experiences_ui_sync.sql`
- Tabellen: add, experiences, information_schema
