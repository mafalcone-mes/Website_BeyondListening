-- Row Level Security tests. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- ── As an anonymous visitor ─────────────────────────────────────────────
set local role anon;

select is((select count(*) from public.stories where status <> 'published')::int, 0,
  'visitors see no unpublished stories');
select ok((select count(*) from public.stories) > 0, 'visitors see published stories');
select throws_ok('select author_display_name, consent_method from public.stories limit 1', '42501', null,
  'visitors cannot read consent details');
select throws_ok('select pending_edit from public.stories limit 1', '42501', null,
  'visitors cannot read pending edits');
select throws_ok('select email from public.story_contacts limit 1', '42501', null,
  'visitors cannot read contributor emails');
select is((select count(*) from public.moderation_log)::int, 0, 'visitors cannot read the moderation log');
select is((select count(*) from public.reports)::int, 0, 'visitors cannot read reports');
select is((select count(*) from public.reaction_events)::int, 0, 'visitors cannot read reaction records');
select is((select count(*) from public.email_outbox)::int, 0, 'visitors cannot read queued emails');
select is((select count(*) from storage.objects)::int, 0, 'visitors cannot list stored files');
select throws_ok($$insert into public.tags (slug, label) values ('x', 'x')$$, '42501', null, 'visitors cannot add themes');
select throws_ok($$update public.stories set title = 'hacked'$$, '42501', null, 'visitors cannot edit stories');
select throws_ok($$select public.hit_rate_limit('x', 60, 1)$$, '42501', null, 'visitors cannot touch rate limits');
select throws_ok($$select public.apply_reaction(gen_random_uuid(), 'love', null, '\x00')$$, '42501', null,
  'visitors cannot write reactions directly');
select lives_ok($$select public.search_archive('queen')$$, 'visitors can search');

-- ── As a logged-in user who is NOT an admin ────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000099", "role": "authenticated"}';

select is((select count(*) from public.story_contacts)::int, 0, 'non-admins cannot read contributor emails');
select is((select count(*) from public.stories where status <> 'published')::int, 0, 'non-admins see no unpublished stories');
select is((select count(*) from public.moderation_log)::int, 0, 'non-admins cannot read the moderation log');

select * from finish();
rollback;
