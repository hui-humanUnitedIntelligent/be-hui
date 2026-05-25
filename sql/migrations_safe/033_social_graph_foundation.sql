-- HUI Phase 5: Canonical social graph, interaction, notification and presence foundation.
-- This migration is additive. Legacy tables remain readable while writers move to
-- the canonical contracts in src/interactions, src/social, src/notifications and src/presence.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hui_interaction_type') then
    create type public.hui_interaction_type as enum (
      'follow',
      'react',
      'reply',
      'save',
      'participate',
      'invite_response',
      'booking',
      'support',
      'message',
      'collaboration_interest'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hui_relationship_type') then
    create type public.hui_relationship_type as enum (
      'following',
      'mutual',
      'collaborator',
      'participant',
      'supporter',
      'trusted',
      'blocked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hui_presence_status') then
    create type public.hui_presence_status as enum (
      'online',
      'active',
      'idle',
      'offline'
    );
  end if;
end $$;

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  interaction_type public.hui_interaction_type not null,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_entity_type text not null,
  target_entity_id text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  visibility text not null default 'private'
    check (visibility in ('public', 'followers', 'private', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interactions_actor_created_idx
  on public.interactions(actor_id, created_at desc);
create index if not exists interactions_target_entity_idx
  on public.interactions(target_entity_type, target_entity_id, created_at desc);
create index if not exists interactions_target_user_idx
  on public.interactions(target_user_id, created_at desc);

create table if not exists public.social_relationships (
  id uuid primary key default gen_random_uuid(),
  source_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type public.hui_relationship_type not null,
  strength numeric not null default 1 check (strength >= 0 and strength <= 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_relationships_not_self check (source_user_id <> target_user_id),
  constraint social_relationships_unique unique (source_user_id, target_user_id, relationship_type)
);

create index if not exists social_relationships_source_idx
  on public.social_relationships(source_user_id, relationship_type);
create index if not exists social_relationships_target_idx
  on public.social_relationships(target_user_id, relationship_type);

create table if not exists public.presence_states (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status public.hui_presence_status not null default 'offline',
  current_route text,
  current_world text,
  last_active_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists presence_states_status_idx
  on public.presence_states(status, last_active_at desc);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid references public.interactions(id) on delete set null,
  type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_target_idx
  on public.notification_events(target_user_id, created_at desc);
create index if not exists notification_events_interaction_idx
  on public.notification_events(interaction_id);

alter table if exists public.notifications
  add column if not exists target_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists sender_id uuid references public.profiles(id) on delete set null,
  add column if not exists entity_id text,
  add column if not exists entity_type text,
  add column if not exists action_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists read boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

update public.notifications
set target_user_id = user_id
where target_user_id is null and user_id is not null;

create index if not exists notifications_user_read_idx
  on public.notifications(user_id, read, created_at desc);
create index if not exists notifications_entity_idx
  on public.notifications(entity_type, entity_id);

alter table public.interactions enable row level security;
alter table public.social_relationships enable row level security;
alter table public.presence_states enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists "interactions_insert_own" on public.interactions;
create policy "interactions_insert_own"
  on public.interactions for insert to authenticated
  with check (auth.uid() = actor_id);

drop policy if exists "interactions_read_visible" on public.interactions;
create policy "interactions_read_visible"
  on public.interactions for select to authenticated
  using (
    visibility = 'public'
    or auth.uid() = actor_id
    or auth.uid() = target_user_id
  );

drop policy if exists "social_relationships_insert_own" on public.social_relationships;
create policy "social_relationships_insert_own"
  on public.social_relationships for insert to authenticated
  with check (auth.uid() = source_user_id);

drop policy if exists "social_relationships_update_own" on public.social_relationships;
create policy "social_relationships_update_own"
  on public.social_relationships for update to authenticated
  using (auth.uid() = source_user_id)
  with check (auth.uid() = source_user_id);

drop policy if exists "social_relationships_read_participant" on public.social_relationships;
create policy "social_relationships_read_participant"
  on public.social_relationships for select to authenticated
  using (auth.uid() = source_user_id or auth.uid() = target_user_id);

drop policy if exists "presence_states_upsert_own" on public.presence_states;
create policy "presence_states_upsert_own"
  on public.presence_states for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "presence_states_update_own" on public.presence_states;
create policy "presence_states_update_own"
  on public.presence_states for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "presence_states_read_authenticated" on public.presence_states;
create policy "presence_states_read_authenticated"
  on public.presence_states for select to authenticated
  using (true);

drop policy if exists "notification_events_insert_actor" on public.notification_events;
create policy "notification_events_insert_actor"
  on public.notification_events for insert to authenticated
  with check (auth.uid() = actor_id);

drop policy if exists "notification_events_read_target" on public.notification_events;
create policy "notification_events_read_target"
  on public.notification_events for select to authenticated
  using (auth.uid() = target_user_id or auth.uid() = actor_id);
