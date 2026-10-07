"use server";
import { updateTag } from "next/cache";
import { z } from "zod";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { slugify } from "@/lib/music/normalize";
import { enrichSong, normalizeGenre } from "@/lib/music";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./auth";
import type { AdminResult } from "./story-actions";

const done = (message: string): AdminResult => {
  updateTag(CONTENT_TAG);
  return { ok: true, message };
};

// ─── themes (tags) ──────────────────────────────────────────────────────

export async function saveTag(raw: { id?: string; label: string; description?: string }): Promise<AdminResult> {
  await requireAdmin();
  const p = z
    .object({ id: z.uuid().optional(), label: z.string().trim().min(1).max(40), description: z.string().trim().max(200).optional() })
    .safeParse(raw);
  if (!p.success) return { ok: false, message: "A theme needs a name (up to 40 characters)." };
  const db = supabaseAdmin();
  if (p.data.id) {
    await db.from("tags").update({ label: p.data.label, description: p.data.description || null }).eq("id", p.data.id);
    return done("Saved.");
  }
  const { count } = await db.from("tags").select("id", { count: "exact", head: true });
  const slug = slugify(p.data.label, 40) || `theme-${Date.now()}`;
  const { error } = await db.from("tags").insert({ slug, label: p.data.label, description: p.data.description || null, sort_order: count ?? 0 });
  if (error) return { ok: false, message: error.code === "23505" ? "A theme with this name already exists." : "Couldn't save." };
  return done("Theme added.");
}

export async function setTagActive(id: string, active: boolean): Promise<AdminResult> {
  await requireAdmin();
  await supabaseAdmin().from("tags").update({ active }).eq("id", id);
  return done(active ? "Theme shown again." : "Theme hidden (stories keep it).");
}

/** Saves a new order (ids from top to bottom). Works for themes and reactions. */
export async function reorder(table: "tags" | "reaction_types", ids: string[]): Promise<AdminResult> {
  await requireAdmin();
  if (!z.array(z.uuid()).max(100).safeParse(ids).success) return { ok: false, message: "Invalid order." };
  const db = supabaseAdmin();
  await Promise.all(ids.map((id, i) => db.from(table).update({ sort_order: i }).eq("id", id)));
  return done("Order saved.");
}

// ─── reactions ──────────────────────────────────────────────────────────

export async function saveReaction(raw: { id?: string; emoji: string; label: string }): Promise<AdminResult> {
  await requireAdmin();
  const p = z
    .object({ id: z.uuid().optional(), emoji: z.string().trim().min(1).max(16), label: z.string().trim().min(1).max(30) })
    .safeParse(raw);
  if (!p.success) return { ok: false, message: "A reaction needs an emoji and a short word." };
  const db = supabaseAdmin();
  if (p.data.id) {
    await db.from("reaction_types").update({ emoji: p.data.emoji, label: p.data.label }).eq("id", p.data.id);
    return done("Saved.");
  }
  const { count } = await db.from("reaction_types").select("id", { count: "exact", head: true }).eq("active", true);
  if ((count ?? 0) >= 6) return { ok: false, message: "Up to 6 reactions can be active. Hide one first." };
  const key = slugify(p.data.label, 30) || `reaction-${Date.now()}`;
  const { error } = await db.from("reaction_types").insert({ key, emoji: p.data.emoji, label: p.data.label, sort_order: count ?? 0 });
  if (error) return { ok: false, message: error.code === "23505" ? "This reaction already exists." : "Couldn't save." };
  return done("Reaction added.");
}

export async function setReactionActive(id: string, active: boolean): Promise<AdminResult> {
  await requireAdmin();
  const db = supabaseAdmin();
  if (active) {
    const { count } = await db.from("reaction_types").select("id", { count: "exact", head: true }).eq("active", true);
    if ((count ?? 0) >= 6) return { ok: false, message: "Up to 6 reactions can be active." };
  }
  await db.from("reaction_types").update({ active }).eq("id", id);
  return done(active ? "Reaction shown." : "Reaction hidden (counts are kept).");
}

// ─── songs ──────────────────────────────────────────────────────────────

const songInput = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(300),
  artist: z.string().trim().min(1).max(300),
  album: z.string().trim().max(300),
  releaseYear: z.number().int().min(1900).max(2100).nullable(),
  genre: z.string().trim().max(60),
  artworkUrl: z.union([z.url(), z.literal("")]),
});

export async function updateSong(raw: z.input<typeof songInput>): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const p = songInput.safeParse(raw);
  if (!p.success) return { ok: false, message: "Please check the fields (title and artist are required, year 1900–2100)." };
  const s = p.data;
  await supabaseAdmin()
    .from("songs")
    .update({
      title: s.title,
      artist: s.artist,
      album: s.album || null,
      release_year: s.releaseYear,
      genre: normalizeGenre(s.genre) ?? null,
      artwork_url: s.artworkUrl || null,
    })
    .eq("id", s.id);
  await supabaseAdmin().from("moderation_log").insert({ actor: user.id, action: "edit_song", entity_type: "song", entity_id: s.id });
  return done("Song saved.");
}

/** Moves every story and playlist track from one song to another, then removes the duplicate. */
export async function mergeSongs(duplicateId: string, keepId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (duplicateId === keepId || !z.array(z.uuid()).length(2).safeParse([duplicateId, keepId]).success) {
    return { ok: false, message: "Pick two different songs." };
  }
  const db = supabaseAdmin();
  await db.from("stories").update({ song_id: keepId }).eq("song_id", duplicateId);
  await db.from("playlist_items").update({ song_id: keepId }).eq("song_id", duplicateId);
  const { error } = await db.from("songs").delete().eq("id", duplicateId);
  if (error) return { ok: false, message: "Couldn't remove the duplicate." };
  await db.from("moderation_log").insert({ actor: user.id, action: "merge_songs", entity_type: "song", entity_id: keepId, details: { merged: duplicateId } });
  return done("Songs merged.");
}

export async function refreshSongLinks(songId: string): Promise<AdminResult> {
  await requireAdmin();
  await enrichSong(songId);
  return done("Song details refreshed.");
}

// ─── settings ───────────────────────────────────────────────────────────

const settingsInput = z.object({
  projectStory: z.string().trim().max(3000),
  contactEmail: z.union([z.email(), z.literal("")]),
  adminNotifications: z.enum(["instant", "digest", "off"]),
});

export async function saveSettings(raw: z.input<typeof settingsInput>): Promise<AdminResult> {
  await requireAdmin();
  const p = settingsInput.safeParse(raw);
  if (!p.success) return { ok: false, message: "Please check the contact email." };
  await supabaseAdmin()
    .from("site_settings")
    .update({
      project_story: p.data.projectStory || null,
      contact_email: p.data.contactEmail || null,
      admin_notifications: p.data.adminNotifications,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  return done("Settings saved.");
}

// ─── maintenance ────────────────────────────────────────────────────────

export async function runMaintenanceNow(): Promise<AdminResult & { report?: Record<string, number> }> {
  await requireAdmin();
  const { runMaintenance } = await import("@/lib/maintenance");
  const report = await runMaintenance();
  updateTag(CONTENT_TAG);
  return { ok: true, message: "Maintenance done.", report };
}
