import "server-only";
import { cookies } from "next/headers";
import { bytea, hashToken } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const MANAGE_COOKIE = "bl_manage";

/** The story the visitor may manage, identified by the private link's token (kept in an httpOnly cookie). */
export async function managedStoryId(): Promise<string | null> {
  const token = (await cookies()).get(MANAGE_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 100) return null;
  return storyIdForToken(token);
}

export async function storyIdForToken(token: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("story_contacts")
    .select("story_id")
    .eq("manage_token_hash", bytea(hashToken(token)))
    .maybeSingle();
  return data?.story_id ?? null;
}
