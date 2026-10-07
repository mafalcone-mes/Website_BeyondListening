"use server";
import { z } from "zod";
import { rateLimit, visitorHash, bytea } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";

const input = z.object({
  storyId: z.uuid(),
  key: z.string().regex(/^[a-z0-9-]{1,30}$/).nullable(),
  previousKey: z.string().regex(/^[a-z0-9-]{1,30}$/).nullable(),
});

export type ReactionResult = { ok: true; counts: Record<string, number> } | { ok: false; message: string };

/**
 * Anonymous reaction. One reaction type per story per browser (remembered in
 * the browser), plus server-side limits per visitor hash.
 */
export async function reactToStory(raw: z.input<typeof input>): Promise<ReactionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "That didn't work." };
  const { storyId, key, previousKey } = parsed.data;
  if (key === previousKey) return { ok: false, message: "Nothing changed." };

  const visitor = await visitorHash();
  const allowed =
    (await rateLimit(`react:${visitor}`, 3600, 30)) &&
    (await rateLimit(`react-story:${storyId}:${visitor}`, 600, 4));
  if (!allowed) return { ok: false, message: "You're reacting a lot! Please wait a few minutes." };

  const { data, error } = await supabaseAdmin().rpc("apply_reaction", {
    p_story: storyId,
    p_new_key: key,
    p_prev_key: previousKey,
    p_ip_hash: bytea(visitor),
  });
  if (error) return { ok: false, message: "That didn't work. Please try again." };
  return { ok: true, counts: data as Record<string, number> };
}
