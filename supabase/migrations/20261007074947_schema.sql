-- Beyond Listening — core schema (Phase 1, M1).
-- Every table has Row Level Security enabled. Default = deny.
-- Anonymous visitors can only READ published content (selected columns).
-- All anonymous WRITES go through server code using the secret key, after
-- captcha, validation and rate limiting.

set search_path = public, extensions;

-- ─── helpers ────────────────────────────────────────────────────────────

-- unaccent() is not IMMUTABLE, which generated columns and indexes require.
create or replace function public.immutable_unaccent(text)
returns text language sql immutable parallel safe strict
set search_path = extensions, public
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Short, URL-friendly public ids (10 chars, no ambiguous letters).
create or replace function public.short_id(len int default 10)
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  bytes bytea := extensions.gen_random_bytes(len);
  out text := '';
begin
  for i in 0 .. len - 1 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return out;
end $$;

-- ─── enums ──────────────────────────────────────────────────────────────

create type public.story_status as enum
  ('pending_verification', 'pending_review', 'published', 'rejected', 'unpublished');
create type public.story_source as enum ('public', 'live_session');
create type public.story_format as enum ('text', 'audio', 'text_audio');
create type public.transcript_source as enum ('contributor', 'admin', 'worker');
create type public.consent_method as enum ('web_form', 'admin_recorded');
create type public.report_reason as enum ('personal_info', 'hateful', 'spam', 'copyright', 'other');
create type public.report_status as enum ('open', 'dismissed', 'actioned');
create type public.admin_role as enum ('admin', 'moderator');
create type public.email_status as enum ('queued', 'sent', 'failed');

-- ─── admins ─────────────────────────────────────────────────────────────

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null default 'admin',
  display_name text,
  notify_new_stories boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid())
$$;

-- ─── songs ──────────────────────────────────────────────────────────────

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (length(title) between 1 and 300),
  artist text not null check (length(artist) between 1 and 300),
  album text check (length(album) <= 300),
  release_year smallint check (release_year between 1900 and 2100),
  decade smallint generated always as ((release_year / 10) * 10) stored,
  genre text check (length(genre) <= 60),
  isrc text,
  musicbrainz_id uuid,
  deezer_id bigint,
  itunes_id bigint,
  norm_key text not null,
  artwork_url text,
  external_links jsonb not null default '{}'::jsonb,
  enrichment_status text not null default 'pending'
    check (enrichment_status in ('pending', 'done', 'failed')),
  published_story_count int not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector('simple', public.immutable_unaccent(
      coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album, '')))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index songs_isrc_key on public.songs (isrc) where isrc is not null;
create unique index songs_musicbrainz_id_key on public.songs (musicbrainz_id) where musicbrainz_id is not null;
create unique index songs_deezer_id_key on public.songs (deezer_id) where deezer_id is not null;
create unique index songs_itunes_id_key on public.songs (itunes_id) where itunes_id is not null;
create index songs_norm_key_idx on public.songs (norm_key);
create index songs_search_idx on public.songs using gin (search_tsv);
create index songs_title_trgm_idx on public.songs using gin (lower(public.immutable_unaccent(title)) gin_trgm_ops);
create index songs_artist_trgm_idx on public.songs using gin (lower(public.immutable_unaccent(artist)) gin_trgm_ops);
create index songs_artist_idx on public.songs (artist);
create index songs_decade_idx on public.songs (decade);
create index songs_genre_idx on public.songs (genre);

create trigger songs_updated_at before update on public.songs
  for each row execute function public.set_updated_at();

-- ─── playlists (live listening sessions) ────────────────────────────────

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (length(title) between 1 and 160),
  session_date date,
  location text check (length(location) <= 160),
  description text check (length(description) <= 2000),
  cover_path text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index playlists_published_idx on public.playlists (published, session_date desc);
create trigger playlists_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();

-- ─── stories ────────────────────────────────────────────────────────────

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.short_id(10),
  song_id uuid not null references public.songs (id) on delete restrict,
  title text check (length(title) <= 120),
  body_text text check (length(body_text) <= 5000),
  format public.story_format not null,
  audio_path text,
  audio_duration_s smallint check (audio_duration_s between 1 and 310),
  audio_peaks jsonb,
  transcript text check (length(transcript) <= 15000),
  transcript_reviewed boolean not null default false,
  transcript_source public.transcript_source,
  author_display_name text not null check (length(author_display_name) between 1 and 60),
  place_time_note text check (length(place_time_note) <= 200),
  status public.story_status not null default 'pending_verification',
  source public.story_source not null default 'public',
  playlist_id uuid references public.playlists (id) on delete set null,
  featured boolean not null default false,
  pending_edit jsonb,
  rejection_reason text check (length(rejection_reason) <= 1000),
  consent_publication boolean not null,
  consent_license boolean not null,
  consent_privacy boolean not null,
  consent_age boolean not null,
  consent_voice boolean not null default false,
  consent_promotion boolean not null default false,
  consent_version text not null,
  consent_method public.consent_method not null,
  consent_recorded_by uuid references auth.users (id) on delete set null,
  consented_at timestamptz not null default now(),
  verified_at timestamptz,
  published_at timestamptz,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('english', public.immutable_unaccent(coalesce(body_text, ''))), 'B') ||
    setweight(to_tsvector('english', public.immutable_unaccent(coalesce(transcript, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(author_display_name, ''))), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stories_required_consents check (
    consent_publication and consent_license and consent_privacy and consent_age),
  constraint stories_voice_consent check (format = 'text' or consent_voice),
  constraint stories_text_present check (format = 'audio' or body_text is not null),
  constraint stories_audio_present check (
    format = 'text' or audio_path is not null or status in ('pending_verification', 'rejected')),
  constraint stories_published_transcript check (
    status <> 'published' or format = 'text' or transcript is not null)
);

create index stories_status_published_idx on public.stories (status, published_at desc);
create index stories_song_idx on public.stories (song_id) where status = 'published';
create index stories_playlist_idx on public.stories (playlist_id);
create index stories_search_idx on public.stories using gin (search_tsv);
create index stories_featured_idx on public.stories (featured) where featured;

create trigger stories_updated_at before update on public.stories
  for each row execute function public.set_updated_at();

-- Keeps songs.published_story_count in sync (used for search and listings).
create or replace function public.refresh_song_story_count()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.songs s set published_story_count =
      (select count(*) from public.stories where song_id = s.id and status = 'published')
    where s.id = old.song_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.songs s set published_story_count =
      (select count(*) from public.stories where song_id = s.id and status = 'published')
    where s.id = new.song_id;
  end if;
  return null;
end $$;

create trigger stories_song_count
  after insert or delete or update of status, song_id on public.stories
  for each row execute function public.refresh_song_story_count();

-- Private contact data: never readable with the public key.
create table public.story_contacts (
  story_id uuid primary key references public.stories (id) on delete cascade,
  email extensions.citext check (length(email) <= 254),
  verification_token_hash bytea,
  verification_expires_at timestamptz,
  manage_token_hash bytea unique,
  upload_token_hash bytea,
  submitter_ip_hash bytea,
  created_at timestamptz not null default now()
);
create index story_contacts_email_idx on public.story_contacts (email);
create index story_contacts_verification_idx on public.story_contacts (verification_token_hash);

-- ─── tags ───────────────────────────────────────────────────────────────

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  label text not null check (length(label) between 1 and 40),
  description text check (length(description) <= 200),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.story_tags (
  story_id uuid not null references public.stories (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete restrict,
  primary key (story_id, tag_id)
);
create index story_tags_tag_idx on public.story_tags (tag_id);

-- ─── reactions ──────────────────────────────────────────────────────────

create table public.reaction_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9-]{1,30}$'),
  emoji text not null check (length(emoji) between 1 and 16),
  label text not null check (length(label) between 1 and 30),
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.story_reaction_counts (
  story_id uuid not null references public.stories (id) on delete cascade,
  reaction_type_id uuid not null references public.reaction_types (id) on delete cascade,
  count int not null default 0 check (count >= 0),
  primary key (story_id, reaction_type_id)
);

create table public.reaction_events (
  id bigint generated always as identity primary key,
  story_id uuid not null references public.stories (id) on delete cascade,
  reaction_type_id uuid not null references public.reaction_types (id) on delete cascade,
  ip_hash bytea not null,
  action text not null check (action in ('add', 'remove')),
  created_at timestamptz not null default now()
);
create index reaction_events_ip_idx on public.reaction_events (ip_hash, created_at);
create index reaction_events_story_ip_idx on public.reaction_events (story_id, ip_hash);

-- ─── playlist items ─────────────────────────────────────────────────────

create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  position int not null check (position >= 0),
  song_id uuid not null references public.songs (id) on delete restrict,
  story_id uuid references public.stories (id) on delete set null,
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint playlist_items_position_key unique (playlist_id, position) deferrable initially deferred
);
create index playlist_items_story_idx on public.playlist_items (story_id);

-- ─── reports, moderation log ────────────────────────────────────────────

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories (id) on delete set null,
  reason public.report_reason not null,
  details text check (length(details) <= 1000),
  reporter_ip_hash bytea,
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_story_idx on public.reports (story_id);

-- Append-only. Contains no personal data, so it survives deletions.
create table public.moderation_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index moderation_log_entity_idx on public.moderation_log (entity_id, created_at desc);

-- ─── private support tables (server only) ──────────────────────────────

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create table public.hash_salts (
  day date primary key,
  salt bytea not null default extensions.gen_random_bytes(32)
);

create table public.music_cache (
  key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email extensions.citext not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.email_status not null default 'queued',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_status_idx on public.email_outbox (status, created_at);

create table public.site_settings (
  id boolean primary key default true check (id),
  project_story text,
  contact_email text,
  admin_notifications text not null default 'instant'
    check (admin_notifications in ('instant', 'digest', 'off')),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true);

-- ─── Row Level Security ─────────────────────────────────────────────────

alter table public.admin_profiles enable row level security;
alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.stories enable row level security;
alter table public.story_contacts enable row level security;
alter table public.tags enable row level security;
alter table public.story_tags enable row level security;
alter table public.reaction_types enable row level security;
alter table public.story_reaction_counts enable row level security;
alter table public.reaction_events enable row level security;
alter table public.playlist_items enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_log enable row level security;
alter table public.rate_limits enable row level security;
alter table public.hash_salts enable row level security;
alter table public.music_cache enable row level security;
alter table public.email_outbox enable row level security;
alter table public.site_settings enable row level security;

-- Visitors (anon) may never write anything directly.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- admin_profiles: admins see/update their own row only. Roles change only via migrations.
create policy admin_profiles_self_read on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());
create policy admin_profiles_self_update on public.admin_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- songs: public when they have a published story or are in a published playlist.
create policy songs_public_read on public.songs
  for select to anon, authenticated using (
    published_story_count > 0
    or exists (
      select 1 from public.playlist_items pi
      join public.playlists p on p.id = pi.playlist_id
      where pi.song_id = songs.id and p.published));
create policy songs_admin_all on public.songs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- playlists
create policy playlists_public_read on public.playlists
  for select to anon, authenticated using (published);
create policy playlists_admin_all on public.playlists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- playlist items
create policy playlist_items_public_read on public.playlist_items
  for select to anon, authenticated using (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.published));
create policy playlist_items_admin_all on public.playlist_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- stories: published only, and only non-sensitive columns (column grants below).
create policy stories_public_read on public.stories
  for select to anon, authenticated using (status = 'published');
create policy stories_admin_all on public.stories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke select on public.stories from anon;
grant select (
  id, public_id, song_id, title, body_text, format, audio_duration_s, audio_peaks,
  transcript, transcript_reviewed, author_display_name, place_time_note, status, source,
  playlist_id, featured, published_at, created_at
) on public.stories to anon;

-- story_contacts: admins only. No anon policy at all.
create policy story_contacts_admin_all on public.story_contacts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.story_contacts from anon;

-- tags
create policy tags_public_read on public.tags
  for select to anon, authenticated using (active);
create policy tags_admin_all on public.tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- story_tags
create policy story_tags_public_read on public.story_tags
  for select to anon, authenticated using (
    exists (select 1 from public.stories s where s.id = story_id and s.status = 'published'));
create policy story_tags_admin_all on public.story_tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- reaction types & counts
create policy reaction_types_public_read on public.reaction_types
  for select to anon, authenticated using (active);
create policy reaction_types_admin_all on public.reaction_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy reaction_counts_public_read on public.story_reaction_counts
  for select to anon, authenticated using (
    exists (select 1 from public.stories s where s.id = story_id and s.status = 'published'));
create policy reaction_counts_admin_read on public.story_reaction_counts
  for select to authenticated using (public.is_admin());

-- reports: admins read/update. Inserts come from the server.
create policy reports_admin_read on public.reports
  for select to authenticated using (public.is_admin());
create policy reports_admin_update on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- moderation log: admins read and append. Nobody can update or delete.
create policy moderation_log_admin_read on public.moderation_log
  for select to authenticated using (public.is_admin());
create policy moderation_log_admin_insert on public.moderation_log
  for insert to authenticated with check (public.is_admin());
revoke update, delete, truncate on public.moderation_log from authenticated;

-- site settings: anyone can read the public text; admins update.
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_admin_update on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke select on public.site_settings from anon;
grant select (id, project_story) on public.site_settings to anon;

-- reaction_events, rate_limits, hash_salts, music_cache, email_outbox:
-- RLS enabled, no policies → server (secret key) only.
create policy email_outbox_admin_read on public.email_outbox
  for select to authenticated using (public.is_admin());

-- ─── server-only functions ──────────────────────────────────────────────

-- Fixed-window rate limiter. Returns true when the call is allowed.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean language plpgsql security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into n;
  return n <= p_max;
end $$;

-- Today's salt for hashing IP addresses (old salts are deleted daily).
create or replace function public.current_hash_salt()
returns bytea language plpgsql security definer
set search_path = public, extensions
as $$
declare s bytea;
begin
  insert into public.hash_salts (day) values (current_date) on conflict (day) do nothing;
  select salt into s from public.hash_salts where day = current_date;
  return s;
end $$;

-- One reaction type per story per browser: optionally removes the previous one.
create or replace function public.apply_reaction(
  p_story uuid, p_new_key text, p_prev_key text, p_ip_hash bytea)
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  new_id uuid;
  prev_id uuid;
begin
  if not exists (select 1 from stories where id = p_story and status = 'published') then
    raise exception 'story_not_available';
  end if;

  if p_prev_key is not null then
    select id into prev_id from reaction_types where key = p_prev_key;
    if prev_id is not null then
      update story_reaction_counts set count = greatest(count - 1, 0)
      where story_id = p_story and reaction_type_id = prev_id;
      insert into reaction_events (story_id, reaction_type_id, ip_hash, action)
      values (p_story, prev_id, p_ip_hash, 'remove');
    end if;
  end if;

  if p_new_key is not null then
    select id into new_id from reaction_types where key = p_new_key and active;
    if new_id is null then
      raise exception 'unknown_reaction';
    end if;
    insert into story_reaction_counts as c (story_id, reaction_type_id, count)
    values (p_story, new_id, 1)
    on conflict (story_id, reaction_type_id) do update set count = c.count + 1;
    insert into reaction_events (story_id, reaction_type_id, ip_hash, action)
    values (p_story, new_id, p_ip_hash, 'add');
  end if;

  return public.story_reactions(p_story);
end $$;

revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
revoke execute on function public.current_hash_salt() from public, anon, authenticated;
revoke execute on function public.apply_reaction(uuid, text, text, bytea) from public, anon, authenticated;

-- ─── public read functions ──────────────────────────────────────────────

-- Reaction counts for a story, as {key: count} including zero counts.
create or replace function public.story_reactions(p_story uuid)
returns jsonb language sql stable security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(rt.key, coalesce(c.count, 0) order by rt.sort_order), '{}'::jsonb)
  from reaction_types rt
  left join story_reaction_counts c on c.reaction_type_id = rt.id and c.story_id = p_story
  where rt.active
    and exists (select 1 from stories where id = p_story and status = 'published')
$$;

-- Builds a prefix tsquery from free text ("bohem rhap" → 'bohem':* & 'rhap':*).
create or replace function public.prefix_tsquery(p_config regconfig, p_q text)
returns tsquery language sql immutable
set search_path = public
as $$
  select case when words = '' then null
         else to_tsquery(p_config, words) end
  from (
    select coalesce(string_agg(quote_literal(w) || ':*', ' & '), '') as words
    from regexp_split_to_table(
      lower(public.immutable_unaccent(regexp_replace(coalesce(p_q, ''), '[^[:alnum:][:space:]]', ' ', 'g'))),
      '\s+') as w
    where w <> ''
  ) t
$$;

-- Story card JSON shared by listings.
create or replace function public.story_card(p_id uuid)
returns jsonb language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', s.id,
    'publicId', s.public_id,
    'title', s.title,
    'excerpt', left(coalesce(s.body_text, s.transcript, ''), 280),
    'format', s.format,
    'durationS', s.audio_duration_s,
    'author', s.author_display_name,
    'source', s.source,
    'publishedAt', s.published_at,
    'song', jsonb_build_object(
      'id', so.id, 'slug', so.slug, 'title', so.title, 'artist', so.artist,
      'artworkUrl', so.artwork_url, 'releaseYear', so.release_year),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('slug', t.slug, 'label', t.label) order by t.sort_order)
      from story_tags st join tags t on t.id = st.tag_id
      where st.story_id = s.id and t.active), '[]'::jsonb)
  )
  from stories s join songs so on so.id = s.song_id
  where s.id = p_id
$$;

-- Type-ahead search across songs (with stories), artists and story text.
create or replace function public.search_archive(p_q text, p_limit int default 6)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions
as $$
declare
  q_simple tsquery := public.prefix_tsquery('simple', p_q);
  q_english tsquery := public.prefix_tsquery('english', p_q);
  norm text := lower(public.immutable_unaccent(coalesce(p_q, '')));
  result jsonb;
begin
  if length(trim(coalesce(p_q, ''))) < 2 then
    return jsonb_build_object('songs', '[]'::jsonb, 'artists', '[]'::jsonb, 'stories', '[]'::jsonb);
  end if;

  select jsonb_build_object(
    'songs', coalesce((
      select jsonb_agg(x order by rank desc) from (
        select jsonb_build_object('id', id, 'slug', slug, 'title', title, 'artist', artist,
               'artworkUrl', artwork_url, 'storyCount', published_story_count) as x,
               greatest(
                 coalesce(ts_rank(search_tsv, q_simple), 0),
                 similarity(lower(public.immutable_unaccent(title || ' ' || artist)), norm)) as rank
        from songs
        where published_story_count > 0
          and ((q_simple is not null and search_tsv @@ q_simple)
               or lower(public.immutable_unaccent(title)) % norm
               or lower(public.immutable_unaccent(artist)) % norm)
        order by rank desc
        limit p_limit) a), '[]'::jsonb),
    'artists', coalesce((
      select jsonb_agg(jsonb_build_object('name', artist, 'storyCount', n) order by n desc) from (
        select artist, sum(published_story_count)::int as n
        from songs
        where published_story_count > 0
          and (lower(public.immutable_unaccent(artist)) like '%' || norm || '%'
               or lower(public.immutable_unaccent(artist)) % norm)
        group by artist
        order by n desc
        limit 3) b), '[]'::jsonb),
    'stories', coalesce((
      select jsonb_agg(x order by rank desc) from (
        select public.story_card(s.id) || jsonb_build_object(
                 'snippet', ts_headline('english',
                   coalesce(s.body_text, s.transcript, s.title, ''), q_english,
                   'MaxWords=18, MinWords=8, StartSel=<<, StopSel=>>')) as x,
               ts_rank(s.search_tsv, q_english) as rank
        from stories s
        where s.status = 'published' and q_english is not null and s.search_tsv @@ q_english
        order by rank desc
        limit p_limit) c), '[]'::jsonb)
  ) into result;
  return result;
end $$;

-- Archive listing with filters and stable (seeded) random order.
create or replace function public.archive_stories(
  p_artist text default null,
  p_decade int default null,
  p_genre text default null,
  p_tag text default null,
  p_sort text default 'newest',
  p_seed text default null,
  p_limit int default 24,
  p_offset int default 0)
returns jsonb language sql stable security definer
set search_path = public, extensions
as $$
  with filtered as (
    select s.*
    from stories s
    join songs so on so.id = s.song_id
    where s.status = 'published'
      and (p_artist is null or so.artist = p_artist)
      and (p_decade is null or so.decade = p_decade)
      and (p_genre is null or so.genre = p_genre)
      and (p_tag is null or exists (
        select 1 from story_tags st join tags t on t.id = st.tag_id
        where st.story_id = s.id and t.slug = p_tag))
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(public.story_card(f.id) order by ord)
      from (
        select f.*,
          row_number() over (order by
            case when p_sort = 'random' then md5(f.id::text || coalesce(p_seed, '')) end,
            f.published_at desc, f.id) as ord
        from filtered f
        order by ord
        limit least(p_limit, 60) offset greatest(p_offset, 0)
      ) f), '[]'::jsonb)
  )
$$;

-- Filter options for the archive (only values that have published stories).
create or replace function public.archive_facets()
returns jsonb language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'artists', coalesce((select jsonb_agg(a order by a) from (
      select distinct artist as a from songs where published_story_count > 0) x), '[]'::jsonb),
    'decades', coalesce((select jsonb_agg(d order by d) from (
      select distinct decade as d from songs where published_story_count > 0 and decade is not null) x), '[]'::jsonb),
    'genres', coalesce((select jsonb_agg(g order by g) from (
      select distinct genre as g from songs where published_story_count > 0 and genre is not null) x), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(jsonb_build_object('slug', slug, 'label', label) order by sort_order)
      from tags where active), '[]'::jsonb)
  )
$$;

-- Related stories: same song → same artist → shared tags → same decade/genre → random.
-- At most 2 per song and 2 per artist, current story excluded.
create or replace function public.related_stories(p_story uuid, p_limit int default 6)
returns jsonb language sql stable security definer
set search_path = public
as $$
  with cur as (
    select s.id, s.song_id, so.artist, so.decade, so.genre
    from stories s join songs so on so.id = s.song_id where s.id = p_story
  ),
  cur_tags as (select tag_id from story_tags where story_id = p_story),
  scored as (
    select s.*, so.artist,
      (case when s.song_id = cur.song_id then 100 else 0 end) +
      (case when so.artist = cur.artist then 50 else 0 end) +
      10 * (select count(*) from story_tags st where st.story_id = s.id and st.tag_id in (select tag_id from cur_tags)) +
      (case when so.decade is not null and so.decade = cur.decade then 5 else 0 end) +
      (case when so.genre is not null and so.genre = cur.genre then 5 else 0 end) +
      random() as score
    from stories s join songs so on so.id = s.song_id, cur
    where s.status = 'published' and s.id <> cur.id
  ),
  diversified as (
    select *,
      row_number() over (partition by song_id order by score desc) as per_song,
      row_number() over (partition by artist order by score desc) as per_artist
    from scored
  )
  select coalesce(jsonb_agg(public.story_card(d.id) order by d.score desc), '[]'::jsonb)
  from (
    select * from diversified where per_song <= 2 and per_artist <= 2
    order by score desc limit p_limit
  ) d
$$;

-- Related songs (that have published stories).
create or replace function public.related_songs(p_song uuid, p_limit int default 6)
returns jsonb language sql stable security definer
set search_path = public
as $$
  with cur as (select id, artist, decade, genre from songs where id = p_song),
  cur_tags as (
    select distinct st.tag_id from story_tags st
    join stories s on s.id = st.story_id
    where s.song_id = p_song and s.status = 'published'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.id, 'slug', x.slug, 'title', x.title, 'artist', x.artist,
      'artworkUrl', x.artwork_url, 'storyCount', x.published_story_count) order by x.score desc), '[]'::jsonb)
  from (
    select so.*,
      (case when so.artist = cur.artist then 50 else 0 end) +
      10 * (select count(distinct st.tag_id) from story_tags st join stories s on s.id = st.story_id
            where s.song_id = so.id and s.status = 'published' and st.tag_id in (select tag_id from cur_tags)) +
      (case when so.decade is not null and so.decade = cur.decade then 5 else 0 end) +
      (case when so.genre is not null and so.genre = cur.genre then 5 else 0 end) +
      random() as score
    from songs so, cur
    where so.id <> cur.id and so.published_story_count > 0
    order by score desc
    limit p_limit
  ) x
$$;

-- Cards for the given published stories, in the given order.
create or replace function public.story_cards(p_ids uuid[])
returns jsonb language sql stable security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.story_card(s.id) order by array_position(p_ids, s.id)), '[]'::jsonb)
  from stories s
  where s.id = any (p_ids) and s.status = 'published'
$$;

-- Featured stories (chosen by the admin), newest first.
create or replace function public.featured_stories(p_limit int default 3)
returns jsonb language sql stable security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.story_card(x.id) order by x.published_at desc), '[]'::jsonb)
  from (
    select id, published_at from stories
    where status = 'published' and featured
    order by published_at desc limit p_limit
  ) x
$$;

-- A random published story id (optionally voice stories only).
create or replace function public.random_story(p_audio_only boolean default false)
returns text language sql volatile security definer
set search_path = public
as $$
  select public_id from stories
  where status = 'published' and (not p_audio_only or format <> 'text')
  order by random() limit 1
$$;

grant execute on function public.story_reactions(uuid) to anon, authenticated;
grant execute on function public.search_archive(text, int) to anon, authenticated;
grant execute on function public.archive_stories(text, int, text, text, text, text, int, int) to anon, authenticated;
grant execute on function public.archive_facets() to anon, authenticated;
grant execute on function public.related_stories(uuid, int) to anon, authenticated;
grant execute on function public.related_songs(uuid, int) to anon, authenticated;
grant execute on function public.random_story(boolean) to anon, authenticated;
grant execute on function public.story_cards(uuid[]) to anon, authenticated;
grant execute on function public.featured_stories(int) to anon, authenticated;
revoke execute on function public.story_card(uuid) from public, anon, authenticated;

-- ─── storage buckets ────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('audio-incoming', 'audio-incoming', false, 20971520,
    array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav']),
  ('audio-published', 'audio-published', false, 20971520,
    array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav']),
  ('covers', 'covers', true, 5242880,
    array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Admins can manage files in every bucket. Visitors never touch storage directly:
-- uploads use one-time signed upload URLs; playback uses short-lived signed URLs.
create policy storage_admin_all on storage.objects
  for all to authenticated
  using (bucket_id in ('audio-incoming', 'audio-published', 'covers') and public.is_admin())
  with check (bucket_id in ('audio-incoming', 'audio-published', 'covers') and public.is_admin());
