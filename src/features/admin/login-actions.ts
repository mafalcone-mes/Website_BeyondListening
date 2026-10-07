"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { rateLimit, visitorHash } from "@/lib/security";
import { supabaseSession } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

/** Sends a one-time login link. Only existing admins can log in (sign-ups are disabled). */
export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", message: "Please enter a valid email address." };
  if (!(await rateLimit(`admin-login:${await visitorHash()}`, 3600, 10))) {
    return { status: "error", message: "Too many attempts. Please wait a while." };
  }
  const supabase = await supabaseSession();
  await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${serverEnv().SITE_URL}/admin/auth/callback` },
  });
  // Same answer whether or not the address is an admin.
  return { status: "sent" };
}

export async function logout() {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
