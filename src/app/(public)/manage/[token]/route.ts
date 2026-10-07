import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { MANAGE_COOKIE, storyIdForToken } from "@/features/manage/session";
import { serverEnv } from "@/lib/env";

/**
 * Private link from email → short-lived httpOnly cookie → /manage/story.
 * The token leaves the address bar immediately, so it can't leak via history or referrers.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/manage/[token]">) {
  await connection();
  const { token } = await ctx.params;
  const valid = token.length >= 20 && token.length <= 100 && (await storyIdForToken(token));
  const target = new URL(valid ? "/manage/story" : "/manage?invalid=1", request.nextUrl);
  const response = Response.redirect(target, 303);
  const headers = new Headers(response.headers);
  headers.set("Referrer-Policy", "no-referrer");
  if (valid) {
    const secure = serverEnv().SITE_URL.startsWith("https") ? "; Secure" : "";
    headers.append("Set-Cookie", `${MANAGE_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200${secure}`);
  }
  return new Response(null, { status: 303, headers });
}
