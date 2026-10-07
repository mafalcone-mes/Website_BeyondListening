-- Beyond Listening — FICTIONAL sample data for the local prototype.
-- Loaded automatically the first time the local database starts (and after a reset).
-- Song metadata is real (from Deezer). Every story, name and place is invented.
-- The local admin account is created by the launcher, not here.

set search_path = public, extensions;

insert into tags (slug, label, sort_order) values
  ('love', 'Love', 0),
  ('loss', 'Loss', 1),
  ('family', 'Family', 2),
  ('friendship', 'Friendship', 3),
  ('childhood', 'Childhood', 4),
  ('travel', 'Travel', 5),
  ('first-times', 'First times', 6),
  ('heartbreak', 'Heartbreak', 7),
  ('healing', 'Healing', 8),
  ('home', 'Home', 9),
  ('nostalgia', 'Nostalgia', 10),
  ('place', 'A place', 11),
  ('protest', 'Protest', 12),
  ('faith', 'Faith & spirit', 13),
  ('celebration', 'Celebration', 14);

insert into reaction_types (key, emoji, label, sort_order) values
  ('love', '❤️', 'Love', 0),
  ('moved', '🥲', 'Moved', 1),
  ('fire', '🔥', 'Fire', 2),
  ('me-too', '🙋', 'Me too', 3);

insert into songs (slug, title, artist, album, release_year, genre, isrc, deezer_id, norm_key, artwork_url, enrichment_status) values
  ('otis-redding-sittin-on-the-dock-of-the-bay-gvdm', '(Sittin'' On) The Dock Of The Bay', 'Otis Redding', 'Remember Me', 1968, 'R&B / Soul', 'USFI89200229', 1109333722, 'otis redding::sittin on the dock of the bay', 'https://cdn-images.dzcdn.net/images/cover/b23c10f515422b9e3e44339777a2a9bb/1000x1000-000000-80-0-0.jpg', 'done'),
  ('the-beatles-here-comes-the-sun-9r1s', 'Here Comes The Sun', 'The Beatles', 'Abbey Road (Remastered)', 1969, 'Rock', 'GBAYE0601696', 116348464, 'the beatles::here comes the sun', 'https://cdn-images.dzcdn.net/images/cover/aa94ab293730bb7845d2aa8c672b2c29/1000x1000-000000-80-0-0.jpg', 'done'),
  ('queen-bohemian-rhapsody-8f3t', 'Bohemian Rhapsody', 'Queen', 'A Night At The Opera', 1975, 'Rock', 'GBUM71029604', 4091937401, 'queen::bohemian rhapsody', 'https://cdn-images.dzcdn.net/images/cover/0b56f4eee05fa1ea753c5654b2cdb70c/1000x1000-000000-80-0-0.jpg', 'done'),
  ('fleetwood-mac-dreams-sm8r', 'Dreams', 'Fleetwood Mac', 'Rumours', 1977, 'Rock', 'USWB10400046', 63480987, 'fleetwood mac::dreams', 'https://cdn-images.dzcdn.net/images/cover/9732751ce91d786dcf30069853697078/1000x1000-000000-80-0-0.jpg', 'done'),
  ('bob-marley-and-the-wailers-redemption-song-ihyp', 'Redemption Song', 'Bob Marley & The Wailers', 'Uprising', 1980, 'Reggae', 'USIR28000018', 2542705, 'bob marley and the wailers::redemption song', 'https://cdn-images.dzcdn.net/images/cover/8d66bb5d623fed6a464415dbc744df21/1000x1000-000000-80-0-0.jpg', 'done'),
  ('toto-africa-n52s', 'Africa', 'Toto', 'Toto IV', 1982, 'Pop', 'USSM19801941', 1079668, 'toto::africa', 'https://cdn-images.dzcdn.net/images/cover/153332e88a14255a8c3d5959a5a21882/1000x1000-000000-80-0-0.jpg', 'done'),
  ('a-ha-take-on-me-e8ff', 'Take on Me', 'a-ha', 'Hunting High and Low', 1985, 'Pop', 'USWB19901214', 664107, 'a ha::take on me', 'https://cdn-images.dzcdn.net/images/cover/e0ce8977ab98d73bcea00fc838ece034/1000x1000-000000-80-0-0.jpg', 'done'),
  ('lucio-dalla-caruso-kudo', 'Caruso', 'Lucio Dalla', 'Caro Amico Ti Scrivo...', 1986, 'Pop', 'ITB008600207', 972492, 'lucio dalla::caruso', 'https://cdn-images.dzcdn.net/images/cover/8f273ec611cd808f879ea84d54c639c5/1000x1000-000000-80-0-0.jpg', 'done'),
  ('whitney-houston-i-wanna-dance-with-somebody-who-loves-me-8jq0', 'I Wanna Dance with Somebody (Who Loves Me)', 'Whitney Houston', 'Whitney', 1987, 'Pop', 'USAR18700121', 75981528, 'whitney houston::i wanna dance with somebody who loves me', 'https://cdn-images.dzcdn.net/images/cover/26b5030b971a5fd363f82cad8cff7453/1000x1000-000000-80-0-0.jpg', 'done'),
  ('tracy-chapman-fast-car-coqz', 'Fast Car', 'Tracy Chapman', 'Tracy Chapman', 1988, 'Folk', 'USEE10180719', 2271563, 'tracy chapman::fast car', 'https://cdn-images.dzcdn.net/images/cover/32069557a9c4a451638263eeb69df2b4/1000x1000-000000-80-0-0.jpg', 'done'),
  ('jeff-buckley-hallelujah-qja0', 'Hallelujah', 'Jeff Buckley', 'Grace', 1994, 'Rock', 'USSM19400915', 108733464, 'jeff buckley::hallelujah', 'https://cdn-images.dzcdn.net/images/cover/57dd4754a69acaaf3a8a82f7fd1b8ad3/1000x1000-000000-80-0-0.jpg', 'done'),
  ('oasis-wonderwall-vy92', 'Wonderwall', 'Oasis', '(What''s The Story) Morning Glory?', 1995, 'Alternative', 'GBAAW9500189', 985745702, 'oasis::wonderwall', 'https://cdn-images.dzcdn.net/images/cover/ddb062c517401ee74d8a4df6f895d75e/1000x1000-000000-80-0-0.jpg', 'done'),
  ('tlc-waterfalls-mdh2', 'Waterfalls', 'TLC', 'Crazysexycool', 1995, 'R&B / Soul', 'USLF29400133', 1043894, 'tlc::waterfalls', 'https://cdn-images.dzcdn.net/images/cover/3134fd3fba883b4e6c8df8dc1487dbef/1000x1000-000000-80-0-0.jpg', 'done'),
  ('radiohead-no-surprises-hdhx', 'No Surprises', 'Radiohead', 'No Surprises', 1997, 'Alternative', 'GBAYE9700386', 138539157, 'radiohead::no surprises', 'https://cdn-images.dzcdn.net/images/cover/7a378976d3ff1b1fd7b21ee0c7f95fa5/1000x1000-000000-80-0-0.jpg', 'done'),
  ('coldplay-the-scientist-uf2w', 'The Scientist', 'Coldplay', 'A Rush of Blood to the Head', 2002, 'Rock', 'GBAYE0200772', 3098840, 'coldplay::the scientist', 'https://cdn-images.dzcdn.net/images/cover/5ba1787e1ec36dbbca38ff01fea8fb21/1000x1000-000000-80-0-0.jpg', 'done'),
  ('amy-winehouse-back-to-black-ano8', 'Back To Black', 'Amy Winehouse', 'Back To Black', 2006, 'R&B / Soul', 'GBUM70604698', 2176856, 'amy winehouse::back to black', 'https://cdn-images.dzcdn.net/images/cover/5772b495f0dcdf660d0fc88c4c38a3fa/1000x1000-000000-80-0-0.jpg', 'done'),
  ('bon-iver-skinny-love-0a26', 'Skinny Love', 'Bon Iver', 'For Emma, Forever Ago', 2007, 'Alternative', 'US38Y0811503', 73916142, 'bon iver::skinny love', 'https://cdn-images.dzcdn.net/images/cover/2af56dee5db12e4af6323afa26257ccf/1000x1000-000000-80-0-0.jpg', 'done'),
  ('adele-someone-like-you-tbaw', 'Someone Like You', 'Adele', '21', 2011, 'Pop', 'GBBKS1000351', 8086136, 'adele::someone like you', 'https://cdn-images.dzcdn.net/images/cover/dc1ce848d830ecc93521be5a78350364/1000x1000-000000-80-0-0.jpg', 'done'),
  ('lorde-royals-wzn1', 'Royals', 'Lorde', 'Pure Heroine', 2013, 'Alternative', 'NZUM71200031', 70403437, 'lorde::royals', 'https://cdn-images.dzcdn.net/images/cover/7bb0b356418fbb275c0c3db7259128d7/1000x1000-000000-80-0-0.jpg', 'done'),
  ('frank-ocean-pink-white-1o1y', 'Pink + White', 'Frank Ocean', 'Blonde', 2016, 'Pop', 'QZ5C81600003', 717273862, 'frank ocean::pink white', 'https://cdn-images.dzcdn.net/images/cover/f798a866107715dd6dc1049e498ce21f/1000x1000-000000-80-0-0.jpg', 'done'),
  ('olivia-rodrigo-drivers-license-mny8', 'drivers license', 'Olivia Rodrigo', 'SOUR', 2021, 'Pop', 'USUG12004749', 1378342592, 'olivia rodrigo::drivers license', 'https://cdn-images.dzcdn.net/images/cover/e68da86fd7976135c2d2d1715afaef7c/1000x1000-000000-80-0-0.jpg', 'done');

insert into playlists (slug, title, session_date, location, description, published, published_at) values
  ('session-1-first-light', 'Session #1 — First light', current_date - 8, 'A living room in Turin',
   'Our first listening session: twelve people, one record player, and stories nobody had told out loud before.',
   true, now() - interval '7 days');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'The car that sang', 'My father had exactly one cassette in the car, and it was Queen. Every Sunday we drove to my grandmother''s, forty minutes of motorway, and every Sunday we reached the operatic part just as we passed the big gas station.

He did all the voices. The high ones, the low ones, the ones that weren''t voices at all but just him banging the steering wheel. My mother pretended to be embarrassed.

He''s been gone four years now. Last month my son asked me to play "the song with the funny singing" and I realised I''d never told him where it came from. So I did the voices.', 'text', 'Marta', 'Turin, 1998', 'published', 'public', true,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '2 days',
    now() - interval '2 days', now() - interval '2 days', now() - interval '2 days'
  from songs where deezer_id = 4091937401
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'marta@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'childhood');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Leaving at nineteen', 'I had a bin bag of clothes, a borrowed suitcase with a broken wheel, and £60. My friend drove me to the coach station in a car that smelled of dog.

This came on the radio as we pulled in and neither of us said anything for the whole song. We just sat in the car park. When it ended she said "go on then" and I went.

I''ve moved six times since. I still play it in the car park every time.', 'text', 'Dee', 'Leeds to London', 'published', 'public', true,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '3 days',
    now() - interval '3 days', now() - interval '3 days', now() - interval '3 days'
  from songs where deezer_id = 2271563
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'dee@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('travel', 'first-times', 'home');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Sorrento, the summer my nonna spoke', 'My grandmother almost never talked about her youth. One evening on the balcony this was playing from a neighbour''s window and she started to tell me about a man she had loved before my grandfather. A singer, she said. Not famous. Just very good.

She laughed at herself, cried a little, then went inside to make coffee as if nothing had happened.

I never heard the story again. Whenever I hear Dalla''s voice break on that high note, I''m back on that balcony with the lemons and the neighbour''s radio.', 'text', 'Giulio', 'Sorrento, 1987', 'published', 'public', true,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '4 days',
    now() - interval '4 days', now() - interval '4 days', now() - interval '4 days'
  from songs where deezer_id = 972492
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'giulio@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'place', 'nostalgia');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Hospital corridor', 'The night my brother died I walked up and down a hospital corridor for two hours with one earphone in. I had this on repeat because it was the only song long enough to feel like it wasn''t ending.

For years I couldn''t listen to it. Then at his memorial, five years later, someone played it on an out-of-tune piano and it was suddenly fine. Not happy. Just fine. Like it had been waiting for me.', 'text', 'Sam', 'St Thomas'', London', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '5 days',
    now() - interval '5 days', now() - interval '5 days', now() - interval '5 days'
  from songs where deezer_id = 108733464
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'sam@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('loss', 'healing');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Roller skates in the kitchen', 'Lockdown. Four of us in a flat built for two. Someone found a pair of roller skates in the cupboard and for one whole afternoon we took turns skating from the fridge to the window while this played on a loop.

We were so bored and so scared, and for three and a half minutes at a time we were neither. We still send each other the song every year on that date.', 'text', 'Priya', 'Bristol, 2020', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '6 days',
    now() - interval '6 days', now() - interval '6 days', now() - interval '6 days'
  from songs where deezer_id = 63480987
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'priya@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('celebration', 'friendship');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, null, 'I listened to this in the bath with the lights off the day I found out he was getting married. I''m not proud of it. I''m a bit proud of it, actually. I got out of the bath. I went to work the next day. Eventually I went to the wedding and danced.', 'text', 'Anonymous listener', null, 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '7 days',
    now() - interval '7 days', now() - interval '7 days', now() - interval '7 days'
  from songs where deezer_id = 8086136
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'anonymous-listener@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('heartbreak');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'First morning in our flat', 'No furniture yet. A mattress on the floor and a speaker balanced on a paint tin. She put this on when the sun came through the window with no curtains, and said "it''s our house now".

We''ve had three flats since. Curtains in all of them. But we still play it on the first morning.', 'text', 'Tomás', 'Lisbon', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '9 days',
    now() - interval '9 days', now() - interval '9 days', now() - interval '9 days'
  from songs where deezer_id = 116348464
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'tomas@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('love', 'home', 'first-times');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'A winter alone', 'I took a job looking after a guesthouse out of season. No guests. Wind every day. I didn''t speak to anyone for days at a time and this album was the only one I''d downloaded.

I arrived broken in a way I couldn''t name. I left in March knowing how to make bread, how to be on my own, and every word of this song.', 'text', 'Wren', 'Shetland', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '10 days',
    now() - interval '10 days', now() - interval '10 days', now() - interval '10 days'
  from songs where deezer_id = 73916142
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'wren@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('healing', 'place');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Every school disco ever', 'It was always the last song. Always. The lights came up a bit, the teachers stopped pretending not to watch, and two hundred twelve-year-olds sang every word with their arms round each other.

I''m forty now. Same thing happens at weddings. Same arms, older shoulders.', 'text', 'Callum', 'Glasgow, 1996', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '12 days',
    now() - interval '12 days', now() - interval '12 days', now() - interval '12 days'
  from songs where deezer_id = 985745702
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'callum@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('friendship', 'nostalgia', 'childhood');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Dad''s air drums', 'My father is the most serious man I know. Accountant. Ironed handkerchiefs. But when this song comes on he plays the drums in the air with his eyes closed, every fill, every crash.

At my wedding the DJ played it without warning and the whole family turned around to watch him. He didn''t disappoint.', 'text', 'Ama', 'Accra', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '14 days',
    now() - interval '14 days', now() - interval '14 days', now() - interval '14 days'
  from songs where deezer_id = 1079668
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'ama@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'celebration');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Camden, before', 'I worked behind the bar of a tiny pub in Camden the year this album came out. The landlord let us choose the closing song and for twelve months it was always this one. Mopping floors at 1am, chairs on the tables, singing into the broom.

The pub is a phone shop now. Whenever I walk past, the song starts in my head on its own.', 'text', 'Lou', 'Camden Town, 2007', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '15 days',
    now() - interval '15 days', now() - interval '15 days', now() - interval '15 days'
  from songs where deezer_id = 2176856
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'lou@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('place', 'nostalgia', 'loss');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Sung at the gate', 'When they announced the closure, we stood at the gate for three days. On the second night somebody started singing this, just one voice and a guitar, and then everyone joined in. Men who had never sung in public in their lives.

We didn''t save the factory. But I''ll never forget how it sounded.', 'text', 'Jordan', 'Outside the factory, 2019', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '17 days',
    now() - interval '17 days', now() - interval '17 days', now() - interval '17 days'
  from songs where deezer_id = 2542705
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'jordan@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('protest', 'friendship');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'The sketchbook boy', 'I was eleven and in love with a boy who drew comic strips in the back of his maths book. He drew me as a character once — a girl with a sword. I kept the page for twenty years.

The video made me believe that you really could be pulled into a drawing. I still half believe it.', 'text', 'Ingrid', 'Bergen, 1986', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '19 days',
    now() - interval '19 days', now() - interval '19 days', now() - interval '19 days'
  from songs where deezer_id = 664107
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'ingrid@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('love', 'first-times', 'childhood');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Waiting for the ferry', 'My first job after the army was loading lorries at the docks. Long nights, lots of waiting. A man from Memphis who drove for a haulage company played this on a little transistor radio every single night. He said it was the only song that understood waiting.

I''m eighty-one. I still think he was right.', 'text', 'Harold', 'Dover, 1971', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '21 days',
    now() - interval '21 days', now() - interval '21 days', now() - interval '21 days'
  from songs where deezer_id = 1109333722
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'harold@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('travel', 'nostalgia');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Big sister rules', 'My big sister taught me every dance move I know in our shared bedroom, mostly to this. She was very strict. Wrong arm? Start again. Too slow? Start again.

She''s a lawyer now and still very strict. We did the full routine at her 40th. I got the arms right.', 'text', 'Kezia', 'Birmingham', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '23 days',
    now() - interval '23 days', now() - interval '23 days', now() - interval '23 days'
  from songs where deezer_id = 1043894
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'kezia@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'childhood');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'The quiet year', 'There was a year where I needed everything to be quiet. Quiet house, quiet job, quiet music. This was the loudest thing I could stand. A lullaby for adults who are very tired.

I''m louder now. I still keep it for the tired days.', 'text', 'Pip', null, 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '26 days',
    now() - interval '26 days', now() - interval '26 days', now() - interval '26 days'
  from songs where deezer_id = 138539157
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'pip@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('healing', 'home');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Saying sorry, badly', 'I tried to apologise to her by playing this outside her window on a portable speaker, like an idiot in a film. The speaker died halfway through the first chorus.

She opened the window anyway, laughing. We talked until 3am. We didn''t get back together, but we became the kind of friends who can talk about it.', 'text', 'Rafa', 'Valencia', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '28 days',
    now() - interval '28 days', now() - interval '28 days', now() - interval '28 days'
  from songs where deezer_id = 3098840
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'rafa@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('love', 'heartbreak', 'healing');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Driving at night with my cousin', 'My cousin and I drove to our grandfather''s funeral overnight because we couldn''t afford the train. We barely talked. This album played the whole way.

Near dawn this song came on and she reached over and held my hand on the gearstick. We''ve never mentioned it. We don''t need to.', 'text', 'Noor', 'Somewhere on the M6', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '31 days',
    now() - interval '31 days', now() - interval '31 days', now() - interval '31 days'
  from songs where deezer_id = 717273862
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'noor@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('friendship', 'family', 'travel');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Learner plates', 'I passed my driving test the same week this came out, and the same week my first girlfriend broke up with me. So I drove around the suburbs crying and screaming every word, with my L plates still on because I forgot to take them off.

A man at a petrol station asked if I was okay. I said "I just passed my test!" and burst into tears again.', 'text', 'Bea', 'Dublin, 2021', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '34 days',
    now() - interval '34 days', now() - interval '34 days', now() - interval '34 days'
  from songs where deezer_id = 1378342592
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'bea@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('first-times', 'heartbreak');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Small town, big sky', 'Every kid from a small town thinks this song is about them. In my case it really was: same cul-de-sac, same bored afternoons, same dream of somewhere else.

I live in a big city now. When I''m homesick, which is often, I put this on and I''m back on the fence by the paddock, watching the clouds.', 'text', 'Matiu', 'Taranaki', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '38 days',
    now() - interval '38 days', now() - interval '38 days', now() - interval '38 days'
  from songs where deezer_id = 70403437
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'matiu@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('home', 'place');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'My mother''s kitchen disco', 'Saturday morning cleaning in our house always ended in a disco. My mother would turn the mop into a microphone for this song and the whole family had to dance before we were allowed to go out.

She''s eighty now and uses a walking stick. Last Saturday she pointed it at me like a microphone. I knew exactly what to do.', 'text', 'Rosa', 'Naples', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '41 days',
    now() - interval '41 days', now() - interval '41 days', now() - interval '41 days'
  from songs where deezer_id = 75981528
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'rosa@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'celebration', 'childhood');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Translated for my husband', 'My husband is from Manchester. On our first anniversary I translated Caruso for him line by line, badly, at the kitchen table. Halfway through he stopped me and said it didn''t matter, he could hear what it meant.

He was right. But I finished the translation anyway, and it''s framed in our hallway.', 'text', 'Elena', 'Milan', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '44 days',
    now() - interval '44 days', now() - interval '44 days', now() - interval '44 days'
  from songs where deezer_id = 972492
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'elena@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('love', 'place');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Wayne''s World in the back seat', 'Five of us in a hatchback, heads banging exactly as in the film, at a red light. A police officer pulled up next to us. He did the head bang too. Best day of high school.', 'text', 'Chris', 'Ohio, 1992', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '47 days',
    now() - interval '47 days', now() - interval '47 days', now() - interval '47 days'
  from songs where deezer_id = 4091937401
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'chris@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('friendship', 'nostalgia');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'The cabin', 'We rented a cabin with no signal for our honeymoon because it was all we could afford. Snow, a wood stove, one CD left behind by the previous guests. It was this one.

Twelve years later we still call it "our album", even though we didn''t choose it. It chose us.', 'text', 'Ana', 'Wisconsin', 'published', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '52 days',
    now() - interval '52 days', now() - interval '52 days', now() - interval '52 days'
  from songs where deezer_id = 73916142
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'ana@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('love', 'travel');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at, playlist_id)
  select id, 'Told at the first session', 'I''d never said this out loud. When my best friend and I stopped speaking, I listened to Dreams every morning on the bus for a year, because thunder only happens when it''s raining. We''ve since made up. I told her I was coming here tonight to talk about this song, and she said: tell them it''s about me. So: it''s about her.', 'text', 'Giorgia', 'Listening session #1', 'published', 'live_session', false,
    true, true, true, true, '2026-10-01', 'admin_recorded', now() - interval '8 days',
    now() - interval '8 days', now() - interval '8 days', now() - interval '8 days', (select id from playlists where slug = 'session-1-first-light')
  from songs where deezer_id = 63480987
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'giorgia@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('friendship', 'healing');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at, playlist_id)
  select id, 'The scientist and my father', 'My dad was a chemistry teacher and the least musical man alive, but he loved this song because of the title. He thought it was about him. We let him think so. At the session tonight, hearing it with a room full of strangers, I finally cried about him in public. Thank you for that.', 'text', 'Luca', 'Listening session #1', 'published', 'live_session', false,
    true, true, true, true, '2026-10-01', 'admin_recorded', now() - interval '8 days',
    now() - interval '8 days', now() - interval '8 days', now() - interval '8 days', (select id from playlists where slug = 'session-1-first-light')
  from songs where deezer_id = 3098840
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'luca@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('family', 'loss');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Busking in the rain', 'The first song I ever busked. I knew three chords and got four euro and a sandwich. Best gig of my life.', 'text', 'Fin', 'Galway', 'pending_review', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '0 days',
    now() - interval '0 days', null, now() - interval '0 days'
  from songs where deezer_id = 985745702
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'fin@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('first-times');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, null, 'Stuck for nine hours in an airport, a stranger''s phone started playing this and slowly the whole gate was singing. We missed nothing because nothing was leaving. It was the nicest delay of my life.', 'text', 'Lena', 'Nairobi airport', 'pending_review', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '0 days',
    now() - interval '0 days', null, now() - interval '0 days'
  from songs where deezer_id = 1079668
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'lena@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('travel');

with st as (
  insert into stories (song_id, title, body_text, format, author_display_name, place_time_note, status, source, featured,
    consent_publication, consent_license, consent_privacy, consent_age, consent_version, consent_method, consented_at,
    verified_at, published_at, created_at)
  select id, 'Not about a boy', 'Everyone thinks this song is about a boyfriend. For me it''s about a best friend who moved to Australia. I drove past her house every day for a month.', 'text', 'Mo', null, 'pending_review', 'public', false,
    true, true, true, true, '2026-10-01', 'web_form', now() - interval '1 days',
    now() - interval '1 days', null, now() - interval '1 days'
  from songs where deezer_id = 1378342592
  returning id
), c as (
  insert into story_contacts (story_id, email) select id, 'mo@example.com' from st
)
insert into story_tags (story_id, tag_id)
select st.id, t.id from st, tags t where t.slug in ('heartbreak', 'friendship');

insert into playlist_items (playlist_id, position, song_id, story_id)
select (select id from playlists where slug = 'session-1-first-light'), v.position, v.song_id, v.story_id
from (values
  (0, (select id from songs where deezer_id = 63480987), (select s.id from stories s join songs so on so.id = s.song_id where so.deezer_id = 63480987 and s.author_display_name = 'Giorgia')),
  (1, (select id from songs where deezer_id = 972492), (select s.id from stories s join songs so on so.id = s.song_id where so.deezer_id = 972492 and s.author_display_name = 'Giulio')),
  (2, (select id from songs where deezer_id = 3098840), (select s.id from stories s join songs so on so.id = s.song_id where so.deezer_id = 3098840 and s.author_display_name = 'Luca')),
  (3, (select id from songs where deezer_id = 2271563), (select s.id from stories s join songs so on so.id = s.song_id where so.deezer_id = 2271563 and s.author_display_name = 'Dee')),
  (4, (select id from songs where deezer_id = 4091937401), (select s.id from stories s join songs so on so.id = s.song_id where so.deezer_id = 4091937401 and s.author_display_name = 'Marta'))
) as v(position, song_id, story_id);

insert into story_reaction_counts (story_id, reaction_type_id, count)
select s.id, rt.id, (abs(hashtext(s.id::text || rt.key)) % 14)
from stories s cross join reaction_types rt
where s.status = 'published';

insert into site_settings (id, project_story) values (true,
  'Beyond Listening began with a simple question asked around a record player: which song holds a story for you? Every answer was different, and every answer was personal. This archive collects those stories, one song at a time.')
on conflict (id) do update set project_story = excluded.project_story;
