# Planning prompt — Song Stories Archive

> Copy everything below the line into your AI coding assistant (e.g. Claude Code in plan mode) from an empty project folder.

---

## Your role

You are a senior product engineer and software architect with 20+ years of experience building content platforms, media products and design systems. Your job in this task is **to produce a detailed implementation plan — not code yet.** The plan will be used to build a working, good-looking prototype whose visual layer (typography, colors, spacing, imagery, motion) will later be replaced by a professional UI/UX designer without rewriting the logic.

Ask me clarifying questions only where an answer would materially change the architecture; otherwise make a reasonable decision, state it explicitly, and move on.

## The product

**[PROJECT NAME]** (placeholder) is a public archive of personal stories tied to songs.

- Anyone can submit a story about a song that matters to them, either **as text** or **as a voice recording**.
- Every story is linked to **exactly one song**. One song can have **many stories**.
- Visitors can **react** to stories (lightweight, no account), **reply with their own story** about the same song, and every story **recommends related stories and songs**.
- All approved stories form a browsable, searchable **archive**.
- The site owner runs **live listening sessions** and publishes curated **playlists** from them. Every track in a playlist is linked to a story — either a story collected during the session (entered by the admin, possibly on behalf of someone else) or an existing story from the archive. Session stories also appear in the general archive.
- The **home page** tells the story of the project, but its **hero section's main job is to make visitors submit a song and their story**.
- The **top navigation** contains a **song search**.
- Site language: **English only**.

## Hard constraints

1. **Open source and free, as much as possible.** Prefer open-source libraries and self-hostable services. Every service must have a free tier sufficient for launch (hundreds to low thousands of stories in year one). For every non-open-source dependency, state why and name an open-source fallback. Include a cost table (launch vs. growth) and say exactly where each free tier would run out first.
2. **Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Storage, Row Level Security). The app must stay deployable on any Node host. Compare free hosting options (Vercel Hobby and its non-commercial terms, Netlify, Cloudflare via OpenNext, self-hosting on a small VPS with Coolify) and recommend one. Note that Supabase's free tier pauses inactive projects and propose a fix.
3. **No copyrighted audio is hosted on our servers.** Song playback uses only legal previews and outbound links (see Music integration).
4. **Design-replaceable by construction** (see Design system readiness). The prototype must look finished and pleasant, yet every visual decision must be easy to change in one place.
5. **Privacy-first and GDPR compliant.** The owner is based in Italy and stories may contain personal data and recognizable voices.

## Users and roles

| Role | Description |
|---|---|
| Visitor | Browses, searches, listens and reads. No account. |
| Contributor | Submits a story **anonymously, without an account**: display name or pseudonym + email (used only for verification, notifications and edit/removal requests, never shown publicly). |
| Admin | **A single, non-technical person.** Authenticated (Supabase Auth, magic link). Moderates submissions, edits tags, manages playlists and live-session stories. Every admin task must be doable from the custom admin UI, with no terminal, code or Supabase dashboard. The admin must also work well on a phone, because live sessions happen away from a desk. Keep a simple role column so more moderators can be added later, but don't build multi-role features now. |

## Pages and information architecture

Define routes, purpose, data needs, and empty, loading and error states for each:

1. **Home**: hero with the song search input as the main call to action ("What song holds a story for you?"), which leads straight into the submission flow with the song pre-selected. Below it: the project's story, featured or recent stories, latest playlist, "listen to a random story".
2. **Archive**: browse all approved stories. Filters: artist, decade, genre (from song metadata), and emotional/theme tags (love, loss, travel, childhood…). Sorting: newest, random. A **shuffle / random story** mode. Paginated or infinite scroll (justify the choice).
3. **Song page**: song metadata, artwork, player, "listen on…" links, all stories about this song, CTA "Tell your story about this song".
4. **Story page**: the story (text and/or audio player with transcript), linked song with player, author pseudonym, tags, date, source (public submission or live session + link to the playlist), **reactions**, **"Do you have a story about this song too?"** CTA (opens the submission flow with the song pre-selected), "report this story", and a **related stories & songs** section (see Recommendations).
5. **Playlists index** and **Playlist page**: session title, date, place, description, cover, ordered tracks; each track shows the song plus its linked story (expandable or linked).
6. **Submit flow** (multi-step, see below), plus a confirmation page and an email verification landing page.
7. **Manage my story** page reached via a private tokenized link from email: edit, or request removal.
8. **About / Privacy / Terms / Content license** pages.
9. **Admin area**: moderation queue, story editor, tag manager, playlist and session builder, reports inbox, basic stats.
10. **/styleguide**: internal page that renders every design token and every component in all states (for the designer).

**Global search (top nav):** type-ahead search across songs, artists and story text already in the archive (Postgres full-text + `pg_trgm`). If the song has no stories yet, show "No stories for this song yet — be the first" which runs the external song lookup and starts the submission flow.

## Core flows (describe each as a sequence: client → server → DB → external service)

### 1. Story submission (anonymous + moderation)
1. Pick the song: search an external catalog (see Music integration), select the result, and the server upserts a normalized `song` record (deduplicated).
2. Choose the format: **write** (rich-ish plain text, define max length, ~5,000 chars suggested) or **record/upload voice** (browser `MediaRecorder`, max duration ~5 min, compressed to Opus/WebM; define upload formats and size limits).
3. For voice: **automatic transcription**, then the contributor reviews and corrects the transcript. Preferred zero-cost, privacy-friendly approach: **in-browser Whisper via `transformers.js` (WASM/WebGPU)**. Plan for the fallback when the device is too slow (e.g. a self-hosted `faster-whisper` / `whisper.cpp` job, or "transcript added later by admin").
4. Details: title (optional), pseudonym, email, theme tags (from a curated list), optional "where/when" note.
5. Consent: explicit checkboxes (publication, content license, voice publication if audio, age ≥ 16 or per Italian law, privacy policy).
6. Anti-spam: open-source, cookie-free captcha (e.g. **ALTCHA** proof-of-work) + rate limiting + honeypot.
7. Submit → status `pending_verification` → verification email → `pending_review` → admin approves or rejects (with an optional reason) → `published` → contributor receives an email with a private manage/remove link.

### 2. Live-session story (admin)
The admin creates a session/playlist, adds tracks, and for each track either links an existing story or creates a new one on behalf of a participant (text and/or recorded audio, consent recorded by the admin). New stories go to the archive with `source = live_session`.

### 3. Listening
Song preview playback, story audio playback, transcript display. Decide whether there should be one **persistent global player** (keeps playing across navigation) and justify it.

### 4. Moderation & takedown
Reports from visitors, admin review, unpublish, permanent deletion (including audio files in storage), and an audit log. Since the admin is non-technical, moderation must be one-tap: approve / reject / edit tags. Each pending story shows its audio, editable transcript and the song together. Add an email notification to the admin when new stories are waiting.

### 5. Reactions
Anonymous reactions on published stories, from a small fixed set the admin can configure (e.g. ❤️, 🥲, 🔥 or words like "Me too"). No account. Limit to one reaction type per story per browser (local storage) plus server-side rate limiting. If IP addresses are used for abuse prevention, store only a salted, rotating hash (GDPR). Counts are public. No reaction leaderboard in the MVP.

### 6. Recommendations (related stories & songs)
Every story and song page recommends related content. Use a transparent, zero-cost rule-based ranking in Postgres: same song → same artist → shared theme tags → same decade/genre → random fill. Exclude the current item and avoid repeats. Optionally describe a later upgrade to semantic similarity with `pgvector` and a small open-source embedding model run at write time (no paid APIs). It is not required for the MVP.

## Music integration (hybrid playback)

- **Search and metadata:** MusicBrainz (open data, CC0) + Cover Art Archive, and/or the iTunes Search API / Deezer API (free, no auth). Evaluate quality, rate limits and terms, and recommend a primary source with a fallback. Do **not** depend on the Spotify Web API (restricted for new apps, no previews).
- **In-site playback:** 30-second previews from iTunes or Deezer, played in **our own custom player** (fully designable). Preview URLs may expire, so resolve them server-side at play time and cache them briefly.
- **"Listen on…" links:** cross-platform links (Spotify, Apple Music, YouTube, Tidal…) via the Odesli / song.link API (free, rate-limited). Cache the results in the DB.
- Deduplication strategy for songs (ISRC, MusicBrainz recording ID, normalized title+artist).
- Graceful degradation when no preview exists.

## Data model

Propose the full Postgres schema with types, constraints, indexes, and **Row Level Security policies** for every table. Starting point:

- `songs`: title, artist, album, release_year, genre, isrc, musicbrainz_id, itunes_id, deezer_id, artwork_url, external_links (jsonb), timestamps
- `stories`: song_id, title, body_text, audio_path, audio_duration, transcript, transcript_reviewed, author_display_name, author_email (private), status enum, source enum (`public`, `live_session`), session_id, consent fields + timestamp, manage_token (hashed), published_at, timestamps
- `tags` / `story_tags`
- `reaction_types` (admin-configurable) / `story_reactions` (aggregated counts + abuse-prevention records)
- `playlists` (sessions): title, slug, date, location, description, cover, published
- `playlist_items`: playlist_id, position, song_id, story_id
- `reports`, `moderation_log`, `admin_profiles` (roles)

Include an ER diagram (Mermaid) and the storage bucket layout (private bucket for pending audio, public or signed access for published audio).

## Design system readiness (very important)

The prototype must look polished, but the designer will change fonts, colors, spacing, radius, shadows, motion and layout details. Plan for:

- **Design tokens** as CSS custom properties (color, typography scale, font families, spacing, radius, shadow, motion, breakpoints) in a single source file. Tailwind (or the chosen CSS approach) reads from these tokens, and **no hard-coded values appear in components**.
- Fonts loaded from one place (open-licensed fonts only, e.g. via `next/font`), swappable by changing one line.
- **Headless, accessible primitives** (e.g. Radix UI / shadcn-style components owned in the repo). Logic and data fetching are separated from presentational components.
- A clear component inventory (atoms → patterns → page sections), each with its states: default, hover, focus, loading, empty, error, disabled.
- The `/styleguide` route, and optionally Storybook or Ladle (justify).
- Light/dark readiness, responsive mobile-first layout, WCAG 2.1 AA.
- A short **designer handoff guide**: where tokens live, how to swap them, which components exist.

## Non-functional requirements

- Performance: static/ISR for public pages, server components where sensible, image optimization, lazy-loaded audio.
- SEO and sharing: metadata and Open Graph images per story, song and playlist (dynamic OG image generation).
- Accessibility: keyboard-operable player, transcripts for all audio, captions/labels.
- Security: RLS everywhere, input sanitization, signed upload URLs, file type/size validation, secrets handling.
- Privacy/GDPR: data minimization, email never public, consent records, retention policy, right to erasure via the manage link, cookie-free analytics (e.g. self-hosted Umami or none). Privacy policy, terms and consent texts are **adapted from free, open-source templates** (no lawyer at launch). The plan must point to suitable templates, list what must be customized, and flag the riskiest points where a legal review would be worth it later.
- **Story content license: all rights reserved.** Contributors keep their rights and grant the site a non-exclusive, revocable license to publish, display and play their story on the site (and in related promotion, if we decide so — ask me). The consent texts must reflect this. Removal requests must be honored.
- **Code: private repository, no open-source release for now.** The owner may open-source it later, so prefer permissively licensed dependencies (MIT/Apache/BSD) and avoid anything that would block a future release. Keep secrets out of the repo from day one.
- Transactional email: abstract behind an interface; recommend a free SMTP provider and an open-source/self-hosted alternative.
- Backups and an admin-only export (JSON/CSV + audio files) so the owner is never locked in.

## Out of scope for the prototype
User accounts for contributors, public comments, dedicated social-share buttons (Open Graph previews still required), photo uploads, multilingual UI, native apps, monetization, multi-moderator workflows.

## Decisions already made (do not re-open)
- One song per story; many stories per song.
- Text stories up to ~5,000 characters; audio up to ~5 minutes; no photos.
- Anonymous submission + email verification + admin moderation.
- Hybrid playback: 30" previews in a custom player + "Listen on…" links.
- Voice stories get automatic transcription that the contributor can edit.
- Archive browsing: song metadata filters, theme tags, random/shuffle.
- Playlists: admin can create new session stories or link existing ones; all appear in the archive.
- One non-technical admin.
- Expected volume: **hundreds of stories in year one.** Size everything for that, without over-engineering.
- English-only UI.
- Stories are all rights reserved; code stays private for now; legal texts come from open-source templates.

## Assumptions to validate with me
List any remaining assumptions clearly at the top of the plan (e.g. hosting choice, minimum age for contributors, whether stories may be used in promotion, which reaction set to use).

## Expected output of this planning task

Produce a single structured plan document containing:

1. Summary, key decisions and assumptions
2. System architecture diagram (Mermaid) and rationale
3. Tech stack table: every library/service, license, cost, open-source fallback
4. Route map / sitemap
5. Data model: schema, ER diagram, RLS policies, storage layout
6. Data-flow sequence diagrams (Mermaid) for: submission, verification, moderation, transcription, song lookup/playback, playlist creation, takedown
7. Server API: server actions / route handlers, inputs, outputs, auth, rate limits
8. Component inventory and design-token architecture
9. Admin area specification
10. Privacy, security and legal checklist
11. Phased roadmap (Phase 0 setup → MVP → polish → designer handoff) with milestones, task breakdown and acceptance criteria per phase
12. Risks (API terms or rate limits, free-tier limits, spam, transcription performance on low-end devices) and mitigations
13. Open questions for me

Do not write application code until I approve the plan.
