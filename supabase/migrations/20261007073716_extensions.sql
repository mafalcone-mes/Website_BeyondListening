-- Beyond Listening — Phase 0: database extensions used by the archive.
-- The full schema (songs, stories, playlists, RLS policies…) arrives in Phase 1.

create extension if not exists pg_trgm with schema extensions;   -- fuzzy song/artist search
create extension if not exists unaccent with schema extensions;  -- accent-insensitive matching
create extension if not exists citext with schema extensions;    -- case-insensitive emails
create extension if not exists pgcrypto with schema extensions;  -- token hashing, random ids
