# Beyond Listening — going online

> **Status: not available yet.** This step is planned for after the local prototype has been tried and approved ("Phase 4" in the plan). Until then, the site runs only on your computer (see `START_HERE.md`).

## What it will look like

The goal is a **€0 setup with no domain required**, done by following a guide, with no programming:

| Piece | Free service | Notes |
|---|---|---|
| Database, recordings, admin login | **Supabase** free plan (EU / Frankfurt region) | 500 MB database and 1 GB of recordings, plenty for the first year. A free project pauses after 7 days without visits; the site will include an automatic daily "keep-alive". |
| Website | **Vercel** Hobby plan | Free, but **only for personal, non-commercial projects**: no ads, sponsors or paid tickets sold through the site. If that changes, a small server costs about €5/month. |
| Web address | `beyond-listening.vercel.app` (free) | A custom domain (e.g. `beyondlistening.org`, about €10–15/year) is optional and can be added any time. |
| Sending real emails | **Brevo** free plan (300 emails/day) | Works with a normal email address as sender. A custom domain improves delivery but isn't required. |

## Planned steps (the detailed, illustrated guide comes in Phase 4)
1. Create free accounts on GitHub, Supabase, Vercel and Brevo.
2. Run **`Go Online`** from this folder. It asks for a few keys you copy from Supabase, then:
   - creates the database structure online;
   - asks whether to **copy your local stories and recordings** or **start clean**;
   - prints the exact settings to paste into Vercel.
3. In Vercel, click **"Import project"**, paste the settings, and press **Deploy**.
4. Log in to the admin area with your real email. Done.

Before going online, the privacy policy, terms and consent texts must be finalised. See §10 of the plan.
