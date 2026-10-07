import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/features/catalog/queries";
import { runMaintenance } from "@/lib/maintenance";

/** Daily maintenance. Call with "Authorization: Bearer <CRON_SECRET>". */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await runMaintenance();
  revalidateTag(CONTENT_TAG, "max");
  return Response.json({ ok: true, report });
}
