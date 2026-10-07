import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseSession } from "@/lib/supabase/server";

/** Every admin page and action starts here. Not logged in, or not an admin → login page. */
export async function requireAdmin() {
  await connection(); // admin pages are always rendered per request
  const supabase = await supabaseSession();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("user_id, role, display_name, notify_new_stories")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile) redirect("/admin/login?denied=1");
  return { supabase, user: data.user, profile };
}
