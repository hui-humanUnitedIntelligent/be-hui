-- ═══════════════════════════════════════════════
-- HUI MEDIA & STORY PIPELINE — Migration
-- ═══════════════════════════════════════════════

-- 1. MEDIA TABLE
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('image','video','audio')),
  mime text,
  width int,
  height int,
  duration_sec float,
  blurhash text,
  thumbnail_path text,
  storage_path text not null,
  storage_bucket text not null,
  compression_state text default 'pending' check (compression_state in ('pending','processing','done','failed')),
  created_at timestamptz default now()
);

-- 2. STORIES TABLE
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  wirker_profile_id uuid references public.wirker_profiles(id) on delete cascade,
  media_id uuid references public.media(id) on delete set null,
  caption text,
  linked_work_id uuid references public.works(id) on delete set null,
  linked_experience_id uuid,
  is_highlight boolean default false,
  highlight_label text,
  view_count int default 0,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- 3. STORY VIEWS (für Analytics)
create table if not exists public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  viewer_id uuid references auth.users(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique(story_id, viewer_id)
);

-- 4. FEED ITEMS UPDATE — neue Typen
alter table public.feed_items
  drop constraint if exists feed_items_type_check;

alter table public.feed_items
  add constraint feed_items_type_check
  check (type in ('story','work','experience','impact','system'));

-- Story verlinken
alter table public.feed_items
  add column if not exists story_id uuid references public.stories(id) on delete cascade;

-- 5. AUTO-CLEANUP: expired stories aus feed entfernen
create or replace function public.cleanup_expired_stories()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.feed_items
  set status = 'archived'
  where story_id in (
    select id from public.stories
    where expires_at < now() and is_highlight = false
  )
  and status != 'archived';
end;
$$;

-- 6. AUTO FEED: story → feed_item trigger
create or replace function public.story_to_feed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.feed_items (
    user_id, type, story_id, status, expires_at, created_at
  ) values (
    NEW.user_id, 'story', NEW.id, 'active', NEW.expires_at, now()
  );
  return NEW;
end;
$$;

drop trigger if exists trg_story_to_feed on public.stories;
create trigger trg_story_to_feed
  after insert on public.stories
  for each row execute function public.story_to_feed();

-- 7. RLS
alter table public.media enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;

-- Media: owner lesen/schreiben
create policy "media_owner" on public.media
  for all using (auth.uid() = user_id);

-- Stories: alle lesen (public), owner schreiben
create policy "stories_read" on public.stories
  for select using (true);

create policy "stories_write" on public.stories
  for all using (auth.uid() = user_id);

-- Story views: authentifiziert
create policy "story_views_insert" on public.story_views
  for insert with check (auth.uid() = viewer_id);

create policy "story_views_read" on public.story_views
  for select using (auth.uid() = viewer_id);

-- 8. INDEXES
create index if not exists idx_stories_user on public.stories(user_id);
create index if not exists idx_stories_expires on public.stories(expires_at);
create index if not exists idx_stories_highlight on public.stories(is_highlight);
create index if not exists idx_media_user on public.media(user_id);
create index if not exists idx_feed_story on public.feed_items(story_id);

